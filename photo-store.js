(function () {
  const DB_NAME = "plantoguide";
  const DB_VERSION = 1;
  const STORE_NAME = "photos";

  window.photoStoreAvailable = typeof indexedDB !== "undefined";
  let openPromise = null;

  function markUnavailable() {
    window.photoStoreAvailable = false;
    return null;
  }

  function photoStoreOpen() {
    if (!window.photoStoreAvailable) return Promise.resolve(null);
    if (openPromise) return openPromise;
    openPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
            store.createIndex("tripKey", "tripKey", { unique: false });
          }
        };
        request.onsuccess = () => {
          window.photoStoreAvailable = true;
          resolve(request.result);
        };
        request.onerror = () => resolve(markUnavailable());
        request.onblocked = () => resolve(markUnavailable());
      } catch (_) {
        resolve(markUnavailable());
      }
    });
    return openPromise;
  }

  /**
   * Run one request and settle only when its transaction settles.
   *
   * IndexedDB fires request.onsuccess before transaction.oncomplete. Resolving a
   * write from request.onsuccess can therefore report success even when the
   * transaction subsequently aborts (for example, because storage is full).
   * This helper records the request result, but does not expose it until commit.
   * All request/transaction failures use the existing explicit `null` fallback.
   */
  async function withStore(mode, action, fallback, mapCommittedResult) {
    try {
      const db = await photoStoreOpen();
      if (!db) return fallback;
      return await new Promise((resolve) => {
        let settled = false;
        let requestSucceeded = false;
        let requestResult;

        const finish = (value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        try {
          const transaction = db.transaction(STORE_NAME, mode);
          const store = transaction.objectStore(STORE_NAME);
          const request = action(store);

          if (!request) {
            finish(fallback);
            return;
          }

          request.onsuccess = () => {
            requestSucceeded = true;
            requestResult = request.result;
          };
          request.onerror = () => {
            requestSucceeded = false;
          };
          transaction.oncomplete = () => {
            if (!requestSucceeded) {
              finish(fallback);
              return;
            }
            finish(typeof mapCommittedResult === "function"
              ? mapCommittedResult(requestResult)
              : requestResult);
          };
          transaction.onerror = () => finish(fallback);
          transaction.onabort = () => finish(fallback);
        } catch (_) {
          finish(fallback);
        }
      });
    } catch (_) {
      markUnavailable();
      return fallback;
    }
  }

  // Resolves to the stored key after commit, or null when validation/storage fails.
  async function photoStorePut(record) {
    if (!record || !record.id || !record.tripKey || !record.src) return null;
    return withStore("readwrite", (store) => store.put(record), null);
  }

  async function photoStoreGetAll(tripKey) {
    if (!tripKey) return [];
    try {
      const db = await photoStoreOpen();
      if (!db) return [];
      return await new Promise((resolve) => {
        let settled = false;
        let requestSucceeded = false;
        let rows = [];
        const finish = (value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        try {
          const transaction = db.transaction(STORE_NAME, "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const index = store.index("tripKey");
          const request = index.getAll(tripKey);
          request.onsuccess = () => {
            requestSucceeded = true;
            rows = Array.isArray(request.result) ? request.result : [];
          };
          request.onerror = () => {
            requestSucceeded = false;
          };
          transaction.oncomplete = () => finish(requestSucceeded ? rows : []);
          transaction.onerror = () => finish([]);
          transaction.onabort = () => finish([]);
        } catch (_) {
          finish([]);
        }
      });
    } catch (_) {
      markUnavailable();
      return [];
    }
  }

  // Resolves true after commit, or null when validation/storage fails.
  async function photoStoreDelete(id) {
    if (!id) return null;
    return withStore("readwrite", (store) => store.delete(id), null, () => true);
  }

  // Resolves true after every matching deletion commits, or null on failure.
  async function photoStoreDeleteTrip(tripKey) {
    if (!tripKey) return null;
    try {
      const db = await photoStoreOpen();
      if (!db) return null;
      return await new Promise((resolve) => {
        let settled = false;
        let cursorFailed = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        try {
          const transaction = db.transaction(STORE_NAME, "readwrite");
          const store = transaction.objectStore(STORE_NAME);
          const index = store.index("tripKey");
          const request = index.openCursor(IDBKeyRange.only(tripKey));
          request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) return;
            try {
              const deleteRequest = cursor.delete();
              if (deleteRequest) {
                deleteRequest.onerror = () => {
                  cursorFailed = true;
                };
              }
              cursor.continue();
            } catch (_) {
              cursorFailed = true;
              try {
                transaction.abort();
              } catch (_) {
                finish(null);
              }
            }
          };
          request.onerror = () => {
            cursorFailed = true;
          };
          transaction.oncomplete = () => finish(cursorFailed ? null : true);
          transaction.onerror = () => finish(null);
          transaction.onabort = () => finish(null);
        } catch (_) {
          finish(null);
        }
      });
    } catch (_) {
      markUnavailable();
      return null;
    }
  }

  window.photoStoreOpen = photoStoreOpen;
  window.photoStorePut = photoStorePut;
  window.photoStoreGetAll = photoStoreGetAll;
  window.photoStoreDelete = photoStoreDelete;
  window.photoStoreDeleteTrip = photoStoreDeleteTrip;
})();
