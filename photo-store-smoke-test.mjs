import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("./photo-store.js", import.meta.url), "utf8");

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createFakeIndexedDB() {
  const records = new Map();
  const transactions = [];

  class FakeTransaction {
    constructor(mode) {
      this.mode = mode;
      this.pending = [];
      this.finished = false;
      this.cursorFinished = false;
      transactions.push(this);
    }

    objectStore() {
      return {
        put: (record) => {
          const request = {};
          this.pending.push(() => records.set(record.id, structuredClone(record)));
          queueMicrotask(() => {
            request.result = record.id;
            request.onsuccess?.();
          });
          return request;
        },
        delete: (id) => {
          const request = {};
          this.pending.push(() => records.delete(id));
          queueMicrotask(() => {
            request.result = undefined;
            request.onsuccess?.();
          });
          return request;
        },
        index: () => ({
          getAll: (tripKey) => {
            const request = {};
            queueMicrotask(() => {
              request.result = [...records.values()]
                .filter((record) => record.tripKey === tripKey)
                .map((record) => structuredClone(record));
              request.onsuccess?.();
            });
            return request;
          },
          openCursor: (range) => {
            const request = {};
            const ids = [...records.values()]
              .filter((record) => record.tripKey === range.value)
              .map((record) => record.id);
            let offset = 0;
            const advance = () => {
              if (offset >= ids.length) {
                request.result = null;
                this.cursorFinished = true;
                request.onsuccess?.();
                return;
              }
              const id = ids[offset++];
              request.result = {
                delete: () => {
                  const deleteRequest = {};
                  this.pending.push(() => records.delete(id));
                  queueMicrotask(() => deleteRequest.onsuccess?.());
                  return deleteRequest;
                },
                continue: () => queueMicrotask(advance)
              };
              request.onsuccess?.();
            };
            queueMicrotask(advance);
            return request;
          }
        })
      };
    }

    commit() {
      if (this.finished) return;
      this.pending.forEach((operation) => operation());
      this.finished = true;
      this.oncomplete?.();
    }

    fail(error = new Error("simulated transaction failure")) {
      if (this.finished) return;
      this.finished = true;
      this.error = error;
      this.onerror?.({ target: this });
      this.onabort?.({ target: this });
    }

    abort() {
      this.fail(new Error("simulated abort"));
    }
  }

  const database = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => ({ createIndex() {} }),
    transaction: (_storeName, mode) => new FakeTransaction(mode)
  };

  return {
    records,
    transactions,
    get lastTransaction() {
      return transactions.at(-1);
    },
    open() {
      const request = {};
      queueMicrotask(() => {
        request.result = database;
        request.onsuccess?.();
      });
      return request;
    }
  };
}

const indexedDB = createFakeIndexedDB();
const window = {};
const context = vm.createContext({
  window,
  indexedDB,
  IDBKeyRange: { only: (value) => ({ value }) },
  queueMicrotask,
  setTimeout,
  clearTimeout
});
vm.runInContext(source, context, { filename: "photo-store.js" });

await window.photoStoreOpen();

// A successful request must remain pending until the transaction commits.
let putSettled = false;
const firstPut = window.photoStorePut({
  id: "photo-1",
  tripKey: "tokyo",
  src: "data:image/jpeg;base64,one"
}).then((value) => {
  putSettled = true;
  return value;
});
await flush();
assert.equal(putSettled, false, "put must not resolve on request.onsuccess");
indexedDB.lastTransaction.commit();
assert.equal(await firstPut, "photo-1");
assert.equal(indexedDB.records.has("photo-1"), true);

// A quota-like transaction failure after request success must be reported as
// failure and must not apply the pending write.
const failedPut = window.photoStorePut({
  id: "photo-quota",
  tripKey: "tokyo",
  src: "data:image/jpeg;base64,quota"
});
await flush();
indexedDB.lastTransaction.fail();
assert.equal(await failedPut, null);
assert.equal(indexedDB.records.has("photo-quota"), false);

// Reads also settle cleanly at transaction completion.
const read = window.photoStoreGetAll("tokyo");
await flush();
indexedDB.lastTransaction.commit();
assert.deepEqual(
  JSON.parse(JSON.stringify(await read)),
  [{ id: "photo-1", tripKey: "tokyo", src: "data:image/jpeg;base64,one" }]
);

// Single-item delete reports true only after the delete transaction commits.
const failedDelete = window.photoStoreDelete("photo-1");
await flush();
indexedDB.lastTransaction.fail();
assert.equal(await failedDelete, null);
assert.equal(indexedDB.records.has("photo-1"), true, "an aborted delete must retain the photo");

let deleteSettled = false;
const deletion = window.photoStoreDelete("photo-1").then((value) => {
  deleteSettled = true;
  return value;
});
await flush();
assert.equal(deleteSettled, false, "delete must not resolve before commit");
indexedDB.lastTransaction.commit();
assert.equal(await deletion, true);
assert.equal(indexedDB.records.has("photo-1"), false);

async function committedPut(record) {
  const operation = window.photoStorePut(record);
  await flush();
  indexedDB.lastTransaction.commit();
  return operation;
}

await committedPut({ id: "tokyo-1", tripKey: "tokyo", src: "data:image/jpeg;base64,a" });
await committedPut({ id: "tokyo-2", tripKey: "tokyo", src: "data:image/jpeg;base64,b" });
await committedPut({ id: "paris-1", tripKey: "paris", src: "data:image/jpeg;base64,c" });

// Trip deletion waits for every cursor delete and the containing commit.
let tripDeleteSettled = false;
const tripDeletion = window.photoStoreDeleteTrip("tokyo").then((value) => {
  tripDeleteSettled = true;
  return value;
});
for (let attempt = 0; attempt < 10 && !indexedDB.lastTransaction.cursorFinished; attempt += 1) {
  await flush();
}
assert.equal(indexedDB.lastTransaction.cursorFinished, true);
assert.equal(tripDeleteSettled, false, "trip delete must wait for commit");
indexedDB.lastTransaction.commit();
assert.equal(await tripDeletion, true);
assert.equal(indexedDB.records.has("tokyo-1"), false);
assert.equal(indexedDB.records.has("tokyo-2"), false);
assert.equal(indexedDB.records.has("paris-1"), true);

console.log("photo-store smoke test passed");
