(function (global) {
  "use strict";

  const FETCH_TIMEOUT_MS = 6000;
  const PIPELINE_TIMEOUT_MS = 12000;
  const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const CACHE_LIMIT_BYTES = 200000;
  const WIKIVOYAGE_API = "https://en.wikivoyage.org/w/api.php";
  const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
  const OPEN_METEO_GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
  const OVERPASS_API = "https://overpass-api.de/api/interpreter";
  const NEUTRAL_BANNER_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="800" viewBox="0 0 1800 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#244f66"/><stop offset="1" stop-color="#79a6ad"/></linearGradient></defs><rect width="1800" height="800" fill="url(#g)"/></svg>')}`;

  function slugify(value = "") {
    return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "destination";
  }

  function escapeRegExp(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function safeStorageGet(key) {
    try { return global.localStorage?.getItem(key) || ""; } catch (_) { return ""; }
  }

  function safeStorageSet(key, value) {
    try { global.localStorage?.setItem(key, value); return true; } catch (_) { return false; }
  }

  function cacheKey(slug) {
    return `ptg:dyncat2:${slug}:${global.PLANTOGUIDE_VERSION || "dev"}`;
  }

  const dynamicCatalogCache = {
    get(slug) {
      try {
        const raw = safeStorageGet(cacheKey(slug));
        if (!raw) return null;
        const payload = JSON.parse(raw);
        if (!payload || Date.now() - Number(payload.cachedAt || 0) > CACHE_TTL_MS) return null;
        return payload.catalog || null;
      } catch (_) {
        return null;
      }
    },
    set(slug, catalog) {
      try {
        const value = JSON.stringify({ cachedAt: Date.now(), catalog });
        if (value.length > CACHE_LIMIT_BYTES) return false;
        return safeStorageSet(cacheKey(slug), value);
      } catch (_) {
        return false;
      }
    }
  };

  function makeUrl(base, params) {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
  }

  async function fetchJson(url, signal) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const abort = () => controller.abort();
    signal?.addEventListener?.("abort", abort, { once: true });
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", abort);
    }
  }

  async function fetchOverpass(query, signal) {
    const url = makeUrl(OVERPASS_API, { data: query });
    return fetchJson(url, signal);
  }

  function scoreGeocodeResult(result, query) {
    const normalizedQuery = slugify(query).replace(/-/g, " ");
    const hint = query.includes(",") ? query.split(",").slice(1).join(" ").toLowerCase() : "";
    const fields = [result.name, result.admin1, result.country, result.country_code].filter(Boolean).join(" ").toLowerCase();
    let score = Math.log10(Number(result.population || 1));
    if (fields.includes(normalizedQuery)) score += 8;
    if (hint && fields.includes(hint.trim())) score += 5;
    if (String(result.name || "").toLowerCase() === query.split(",")[0].trim().toLowerCase()) score += 4;
    return score;
  }

  async function geocodeDestination(query, options = {}) {
    const name = String(query || "").trim();
    if (!name) return null;
    const url = makeUrl(OPEN_METEO_GEOCODE, { name, count: "5", language: "en", format: "json" });
    const data = await fetchJson(url, options.signal);
    const results = Array.isArray(data?.results) ? data.results : [];
    if (!results.length) return null;
    return results.sort((a, b) => scoreGeocodeResult(b, name) - scoreGeocodeResult(a, name))[0];
  }

  function splitTopLevel(text, separator = "|") {
    const parts = [];
    let current = "";
    let templateDepth = 0;
    let linkDepth = 0;
    for (let index = 0; index < text.length; index += 1) {
      const pair = text.slice(index, index + 2);
      if (pair === "{{") { templateDepth += 1; current += pair; index += 1; continue; }
      if (pair === "}}") { templateDepth = Math.max(0, templateDepth - 1); current += pair; index += 1; continue; }
      if (pair === "[[") { linkDepth += 1; current += pair; index += 1; continue; }
      if (pair === "]]") { linkDepth = Math.max(0, linkDepth - 1); current += pair; index += 1; continue; }
      if (text[index] === separator && !templateDepth && !linkDepth) {
        parts.push(current);
        current = "";
      } else current += text[index];
    }
    parts.push(current);
    return parts;
  }

  function extractTemplates(wikitext = "") {
    const templates = [];
    for (let index = 0; index < wikitext.length - 1; index += 1) {
      if (wikitext.slice(index, index + 2) !== "{{") continue;
      const start = index;
      let depth = 1;
      index += 2;
      for (; index < wikitext.length - 1; index += 1) {
        const pair = wikitext.slice(index, index + 2);
        if (pair === "{{") { depth += 1; index += 1; continue; }
        if (pair === "}}") {
          depth -= 1;
          if (!depth) {
            templates.push(wikitext.slice(start + 2, index));
            index += 1;
            break;
          }
          index += 1;
        }
      }
    }
    return templates;
  }

  function stripWikitext(value = "") {
    let text = String(value);
    text = text.replace(/<ref[\s\S]*?<\/ref>/gi, " ").replace(/<ref[^>]*\/>/gi, " ");
    let previous = "";
    while (previous !== text) {
      previous = text;
      text = text.replace(/\{\{([^{}]*)\}\}/g, (_, inner) => {
        const parts = splitTopLevel(inner).map((part) => part.trim()).filter(Boolean);
        if (parts.length <= 1) return " ";
        return parts[parts.length - 1];
      });
    }
    text = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1");
    text = text.replace(/\[https?:\/\/[^\s\]]+\s+([^\]]+)\]/g, "$1").replace(/\[https?:\/\/[^\]]+\]/g, " ");
    text = text.replace(/'''?/g, "").replace(/<[^>]+>/g, " ");
    text = text.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
    return text.replace(/\s+/g, " ").trim();
  }

  function parseListingTemplate(content, pageTitle) {
    const parts = splitTopLevel(content);
    const templateName = parts.shift().trim().toLowerCase();
    const allowed = new Set(["see", "do", "eat", "drink", "buy", "listing", "sleep"]);
    if (!allowed.has(templateName)) return null;
    const fields = {};
    const unnamed = [];
    parts.forEach((part) => {
      const equalIndex = part.indexOf("=");
      if (equalIndex > -1) fields[part.slice(0, equalIndex).trim().toLowerCase()] = part.slice(equalIndex + 1).trim();
      else if (part.trim()) unnamed.push(part.trim());
    });
    const rawName = fields.name || fields.alt || fields.content || unnamed[0] || "";
    const name = stripWikitext(rawName);
    if (!name || /^(none|various)$/i.test(name)) return null;
    const description = stripWikitext(fields.content || fields.description || fields.directions || fields.wiki || unnamed.slice(1).join(" "));
    const category = templateName === "listing" ? String(fields.type || "").toLowerCase() : templateName;
    const type = /eat|drink/.test(category) ? "eat" : /buy/.test(category) ? "buy" : /see|do/.test(category) ? "see" : "";
    if (!type) return null;
    return {
      name,
      type,
      area: stripWikitext(pageTitle || fields.address || fields.district || ""),
      detail: description || "A Wikivoyage-listed place to research and verify before visiting.",
      address: stripWikitext(fields.address || ""),
      lat: Number(fields.lat || fields.latitude) || null,
      lon: Number(fields.long || fields.lon || fields.longitude) || null,
      sourceLabel: "Wikivoyage",
      sourceUrl: `https://en.wikivoyage.org/wiki/${encodeURIComponent(String(pageTitle || "").replace(/\s+/g, "_"))}`
    };
  }

  function parseWikivoyageListings(wikitext = "", pageTitle = "") {
    const seen = new Set();
    return extractTemplates(wikitext).map((template) => parseListingTemplate(template, pageTitle)).filter((item) => {
      if (!item) return false;
      const key = slugify(item.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function findDistrictTitles(wikitext = "", pageTitle = "") {
    const escaped = escapeRegExp(pageTitle.replace(/ /g, "[ _]"));
    const titles = new Set();
    const regex = new RegExp(`\\[\\[(${escaped}/[^|\\]#]+)`, "gi");
    let match;
    while ((match = regex.exec(wikitext))) titles.add(match[1].replace(/_/g, " "));
    return [...titles].slice(0, 3);
  }

  async function wikivoyagePageTitle(destination, signal) {
    const data = await fetchJson(makeUrl(WIKIVOYAGE_API, {
      action: "query", list: "search", srsearch: destination, srlimit: "3", format: "json", origin: "*"
    }), signal);
    return data?.query?.search?.[0]?.title || null;
  }

  async function fetchWikivoyageWikitext(title, signal) {
    const data = await fetchJson(makeUrl(WIKIVOYAGE_API, {
      action: "parse", page: title, prop: "wikitext", redirects: "1", format: "json", origin: "*"
    }), signal);
    return data?.parse?.wikitext?.["*"] || "";
  }

  async function fetchWikivoyageListings(destination, signal) {
    const title = await wikivoyagePageTitle(destination, signal);
    if (!title) return { title: "", items: [] };
    const wikitext = await fetchWikivoyageWikitext(title, signal);
    let items = parseWikivoyageListings(wikitext, title);
    if (items.filter((item) => item.type === "see").length < 5) {
      const districts = findDistrictTitles(wikitext, title);
      const districtLists = await Promise.all(districts.map(async (district) => {
        try { return parseWikivoyageListings(await fetchWikivoyageWikitext(district, signal), district); }
        catch (_) { return []; }
      }));
      items = [...items, ...districtLists.flat()];
    }
    return { title, items: dedupeItems(items) };
  }

  // Tuned to drop Wikipedia geosearch noise that isn't a visitable attraction — transit infrastructure,
  // schools/faculties, and administrative-boundary articles — while still keeping the single nearest
  // station (travelers use the main station) and legitimate "University of X" main-campus articles.
  const NON_ATTRACTION_TITLE_PATTERN = /railway station|train station|metro station|bus station|school|faculty|district of|municipality|province of|county of|\(company\)|corporation/i;
  const STATION_TITLE_PATTERN = /railway station|train station|metro station|bus station/i;

  async function fetchWikipediaGeoPlaces(geocode, signal) {
    if (!geocode?.latitude || !geocode?.longitude) return [];
    const geo = await fetchJson(makeUrl(WIKIPEDIA_API, {
      action: "query", list: "geosearch", gscoord: `${geocode.latitude}|${geocode.longitude}`, gsradius: "10000",
      gslimit: "20", format: "json", origin: "*"
    }), signal);
    const ids = (geo?.query?.geosearch || []).map((item) => item.pageid).filter(Boolean).slice(0, 20);
    if (!ids.length) return [];
    const pages = await fetchJson(makeUrl(WIKIPEDIA_API, {
      action: "query", pageids: ids.join("|"), prop: "pageimages|extracts|info", exintro: "1", explaintext: "1",
      piprop: "thumbnail", pithumbsize: "640", inprop: "url", format: "json", origin: "*"
    }), signal);
    const pageMap = pages?.query?.pages || {};
    const orderedPages = ids.map((id) => pageMap[id]).filter(Boolean);
    const destinationName = geocode.name || "";
    let keptAStation = false;
    return orderedPages.filter((page) => {
      const title = String(page.title || "");
      if (destinationName && (title === destinationName || title.startsWith(`${destinationName},`))) return false;
      if (NON_ATTRACTION_TITLE_PATTERN.test(title)) {
        if (STATION_TITLE_PATTERN.test(title) && !keptAStation) {
          keptAStation = true;
          return true;
        }
        return false;
      }
      return true;
    }).map((page) => ({
      name: page.title,
      type: "see",
      area: geocode.name,
      detail: String(page.extract || "A Wikipedia-listed landmark or neighborhood worth researching.").split(/\n/)[0].slice(0, 220),
      image: page.thumbnail?.source || "",
      sourceLabel: "Wikipedia",
      sourceUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(String(page.title || "").replace(/\s+/g, "_"))}`
    }));
  }

  async function fetchWikipediaCategoryPlaces(destination, geocode, signal) {
    const city = geocode?.name || destination;
    const admin = geocode?.admin1 || "";
    const categoryNames = [
      `Tourist attractions in ${city}`,
      `Landmarks in ${city}`,
      `Museums in ${city}`,
      `Parks in ${city}`,
      `Beaches of ${city}`,
      `Shopping malls in ${city}`,
      admin ? `Tourist attractions in ${city}, ${admin}` : "",
      admin ? `Museums in ${city}, ${admin}` : "",
      admin ? `Parks in ${city}, ${admin}` : ""
    ].filter(Boolean);
    const categoryResults = await Promise.all(categoryNames.map(async (category) => {
      try {
        const data = await fetchJson(makeUrl(WIKIPEDIA_API, {
          action: "query", list: "categorymembers", cmtitle: `Category:${category}`, cmnamespace: "0",
          cmlimit: "18", format: "json", origin: "*"
        }), signal);
        return data?.query?.categorymembers || [];
      } catch (_) {
        // Many destinations do not have every category. Keep going with the categories that exist.
        return [];
      }
    }));
    const pageIds = new Set();
    categoryResults.flat().forEach((item) => {
      if (item.pageid && !/list of|timeline of|history of/i.test(item.title || "")) pageIds.add(item.pageid);
    });
    const ids = [...pageIds].slice(0, 45);
    if (!ids.length) return [];
    const pages = await fetchJson(makeUrl(WIKIPEDIA_API, {
      action: "query", pageids: ids.join("|"), prop: "pageimages|extracts|info", exintro: "1", explaintext: "1",
      piprop: "thumbnail", pithumbsize: "640", inprop: "url", format: "json", origin: "*"
    }), signal);
    return Object.values(pages?.query?.pages || {}).map((page) => ({
      name: page.title,
      type: /market|mall|shopping|rodeo drive|grove/i.test(page.title || "") ? "buy" : "see",
      area: city,
      detail: String(page.extract || "A Wikipedia-listed attraction worth researching and verifying before visiting.").split(/\n/)[0].slice(0, 240),
      image: page.thumbnail?.source || "",
      sourceLabel: "Wikipedia category",
      sourceUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(String(page.title || "").replace(/\s+/g, "_"))}`
    }));
  }

  function osmElementLatLon(element) {
    return {
      lat: Number(element.lat || element.center?.lat) || null,
      lon: Number(element.lon || element.center?.lon) || null
    };
  }

  function cuisineLabel(tags = {}) {
    if (tags.cuisine) return String(tags.cuisine).split(";").slice(0, 3).map((part) => titleCaseWords(part.replace(/_/g, " "))).join(", ");
    if (tags.amenity === "cafe") return "Cafe";
    if (tags.amenity === "bakery" || tags.shop === "bakery") return "Bakery";
    if (tags.amenity === "restaurant") return "Restaurant";
    if (tags.amenity === "food_court") return "Food court";
    return "Local food";
  }

  function shopLabel(tags = {}) {
    const value = tags.shop || tags.amenity || tags.tourism || "";
    const labels = {
      mall: "Shopping mall and major retail",
      department_store: "Department store and shopping",
      marketplace: "Market, food goods, and local browsing",
      clothes: "Fashion and apparel",
      boutique: "Boutiques and local fashion",
      books: "Books, stationery, and gifts",
      gift: "Souvenirs and gifts",
      art: "Art, design, and local makers",
      antiques: "Antiques and vintage browsing",
      jewelry: "Jewelry and accessories",
      supermarket: "Groceries and practical supplies"
    };
    return labels[value] || titleCaseWords(String(value || "Shopping").replace(/_/g, " "));
  }

  function titleCaseWords(value = "") {
    return String(value).replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  }

  function osmPopularityScore(tags = {}) {
    let score = 0;
    if (tags.wikipedia || tags.wikidata) score += 34;
    if (tags.website || tags["contact:website"]) score += 10;
    if (tags.brand || tags.operator) score += 6;
    if (tags.tourism === "attraction") score += 8;
    if (tags.amenity === "restaurant") score += 16;
    if (tags.amenity === "cafe") score += 14;
    if (tags.amenity === "food_court") score += 13;
    if (tags.shop === "bakery") score += 12;
    if (tags.shop === "mall" || tags.shop === "department_store") score += 18;
    if (tags.amenity === "marketplace") score += 16;
    if (/boutique|clothes|gift|books|art|antiques|jewelry/.test(tags.shop || "")) score += 12;
    return score;
  }

  function osmToDynamicItem(element, destination, geocode) {
    const tags = element.tags || {};
    const name = tags.name || tags["name:en"] || tags.brand || "";
    if (!name || /^(restaurant|cafe|shop|market)$/i.test(name)) return null;
    const { lat, lon } = osmElementLatLon(element);
    const isFood = Boolean(tags.amenity && /^(restaurant|cafe|fast_food|food_court|bar|pub)$/i.test(tags.amenity)) || tags.shop === "bakery";
    const isShop = Boolean(tags.shop) || tags.amenity === "marketplace";
    if (!isFood && !isShop) return null;
    const area = [tags["addr:neighbourhood"], tags["addr:suburb"], geocode?.name].filter(Boolean)[0] || geocode?.name || destination;
    const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" ");
    if (isFood) {
      const cuisine = cuisineLabel(tags);
      return {
        name,
        type: "eat",
        area,
        address,
        lat,
        lon,
        cuisine,
        order: cuisine === "Cafe" ? "Check coffee, pastries, and breakfast options." : "Check current menu favorites and signature dishes.",
        detail: `${name} is an OpenStreetMap-listed ${cuisine.toLowerCase()} option in ${area}. Verify current hours, popularity, reservations, and menu before locking it into the plan.`,
        sourceLabel: "OpenStreetMap",
        sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        osmScore: osmPopularityScore(tags)
      };
    }
    const bestFor = shopLabel(tags);
    return {
      name,
      type: "buy",
      area,
      address,
      lat,
      lon,
      bestFor,
      detail: `${name} is an OpenStreetMap-listed shopping option in ${area}, useful for ${bestFor.toLowerCase()}. Verify current stores, hours, and fit before travel.`,
      sourceLabel: "OpenStreetMap",
      sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      osmScore: osmPopularityScore(tags)
    };
  }

  async function fetchOpenStreetMapRecommendations(destination, geocode, signal) {
    if (!geocode?.latitude || !geocode?.longitude) return [];
    const lat = Number(geocode.latitude);
    const lon = Number(geocode.longitude);
    const radius = Number(geocode.population || 0) > 2000000 ? 26000 : Number(geocode.population || 0) > 500000 ? 18000 : 12000;
    const query = `[out:json][timeout:8];
(
  nwr(around:${radius},${lat},${lon})["amenity"~"^(restaurant|cafe|fast_food|food_court|bar|pub|marketplace)$"]["name"];
  nwr(around:${radius},${lat},${lon})["shop"~"^(bakery|mall|department_store|boutique|clothes|gift|books|art|antiques|jewelry|supermarket)$"]["name"];
);
out center tags 80;`;
    const data = await fetchOverpass(query, signal);
    return dedupeItems((data?.elements || []).map((element) => osmToDynamicItem(element, destination, geocode)).filter(Boolean))
      .sort((a, b) => (Number(b.osmScore || 0) + tourismScore(b, destination)) - (Number(a.osmScore || 0) + tourismScore(a, destination)))
      .slice(0, 40);
  }

  const TOURISM_KEYWORD_WEIGHTS = new Map([
    ["zoo", 34], ["beach", 32], ["park", 30], ["balboa", 30], ["griffith", 30],
    ["observatory", 30], ["getty", 30], ["universal studios", 30], ["hollywood", 28],
    ["seaworld", 30], ["sea world", 30], ["museum", 26], ["aquarium", 25], ["monument", 24],
    ["historic", 22], ["old town", 22], ["waterfront", 20], ["pier", 20], ["cove", 20],
    ["view", 18], ["garden", 18], ["market", 16], ["village", 14],
    ["mall", 12], ["shopping", 12], ["district", 10], ["studio", 10]
  ]);

  const SEEDED_DESTINATION_CATALOGS = [
    {
      match: /\b(san\s*diego|san-diego)\b/i,
      label: "San Diego, California, United States",
      items: [
        { name: "San Diego Zoo", type: "see", area: "Balboa Park", detail: "World-famous zoo in Balboa Park, known for expansive habitats, pandas, koalas, and a full-day family-friendly layout.", seedRank: 100 },
        { name: "Balboa Park", type: "see", area: "Central San Diego", detail: "San Diego’s signature cultural park, with Spanish Colonial Revival architecture, gardens, museums, walking paths, and the San Diego Zoo.", seedRank: 98 },
        { name: "La Jolla Cove", type: "see", area: "La Jolla", detail: "Scenic coastal cove famous for sea caves, seals and sea lions, sunset views, snorkeling, and walkable village restaurants.", seedRank: 96 },
        { name: "SeaWorld San Diego", type: "see", area: "Mission Bay", detail: "Large marine theme park with shows, rides, aquariums, and family attractions near Mission Bay.", seedRank: 94 },
        { name: "USS Midway Museum", type: "see", area: "Embarcadero", detail: "Historic aircraft carrier museum on the waterfront, with flight deck views, restored aircraft, and immersive naval history exhibits.", seedRank: 92 },
        { name: "Coronado Beach", type: "see", area: "Coronado", detail: "Wide, classic Southern California beach known for golden sand, views near Hotel del Coronado, and an easy island-town day trip.", seedRank: 90 },
        { name: "Torrey Pines State Natural Reserve", type: "see", area: "La Jolla / Del Mar", detail: "Clifftop hiking reserve with ocean views, rare Torrey pine trees, and trails that work especially well for a scenic morning.", seedRank: 88 },
        { name: "Old Town San Diego State Historic Park", type: "see", area: "Old Town", detail: "Historic district with preserved buildings, museums, plazas, Mexican restaurants, and an easy introduction to early California history.", seedRank: 86 },
        { name: "Cabrillo National Monument", type: "see", area: "Point Loma", detail: "National monument with bay and ocean views, tide pools, lighthouse history, and one of the best panoramas of San Diego.", seedRank: 84 },
        { name: "Mission Beach and Belmont Park", type: "see", area: "Mission Beach", detail: "Beach boardwalk, oceanfront food stops, bike paths, and the vintage Giant Dipper coaster at Belmont Park.", seedRank: 82 },
        { name: "Little Italy Mercato Farmers' Market", type: "buy", area: "Little Italy", detail: "Popular open-air market for local produce, flowers, snacks, artisan foods, and casual browsing.", bestFor: "Food gifts, flowers, local makers, and snacks", seedRank: 76 },
        { name: "Seaport Village", type: "buy", area: "Embarcadero", detail: "Waterfront shopping and dining village with souvenir shops, bay views, and an easy stroll near downtown attractions.", bestFor: "Souvenirs, casual dining, and waterfront browsing", seedRank: 74 },
        { name: "Liberty Public Market", type: "buy", area: "Liberty Station", detail: "Indoor public market with food vendors, local goods, and a relaxed stop that pairs well with Point Loma or airport-area plans.", bestFor: "Local food vendors, gifts, and casual meals", seedRank: 72 },
        { name: "Fashion Valley", type: "buy", area: "Mission Valley", detail: "Major open-air shopping center with designer, department, and mainstream retail options.", bestFor: "Large-format retail, fashion, and department stores", seedRank: 70 },
        { name: "Morning Glory", type: "eat", area: "Little Italy", detail: "Popular brunch spot known for playful design, pancakes, soufflé dishes, and a lively Little Italy location.", cuisine: "Brunch / American", order: "Pancakes, breakfast carbonara, or a seasonal brunch special.", seedRank: 80 },
        { name: "The Taco Stand", type: "eat", area: "La Jolla / Downtown", detail: "Casual taco favorite with Baja-style tacos, carne asada, al pastor, and quick-service energy.", cuisine: "Mexican / Baja tacos", order: "Al pastor tacos, carne asada tacos, or fresh guacamole.", seedRank: 78 },
        { name: "Las Cuatro Milpas", type: "eat", area: "Barrio Logan", detail: "Long-running cash-style Mexican institution known for handmade tortillas, simple plates, and local character.", cuisine: "Mexican", order: "Rolled tacos, rice and beans, or chorizo con huevo.", seedRank: 76 },
        { name: "Ironside Fish & Oyster", type: "eat", area: "Little Italy", detail: "Seafood-focused restaurant in Little Italy with oysters, lobster rolls, and a strong coastal San Diego feel.", cuisine: "Seafood", order: "Oysters, lobster roll, or catch-of-the-day specials.", seedRank: 74 },
        { name: "Hodad's", type: "eat", area: "Ocean Beach", detail: "Iconic San Diego burger stop with surf-town personality and oversized burgers.", cuisine: "Burgers / casual American", order: "Classic bacon cheeseburger and onion rings.", seedRank: 72 }
      ]
    },
    {
      match: /\b(los\s*angeles|la,\s*california|l\.a\.|hollywood)\b/i,
      label: "Los Angeles, California, United States",
      items: [
        { name: "Griffith Observatory", type: "see", area: "Griffith Park / Los Feliz", detail: "Classic Los Angeles viewpoint with skyline views, astronomy exhibits, hiking nearby, and one of the city’s best sunset angles.", seedRank: 100 },
        { name: "Santa Monica Pier", type: "see", area: "Santa Monica", detail: "Iconic oceanfront pier with Pacific Park, beach views, casual food, and an easy connection to the beach path.", seedRank: 98 },
        { name: "The Getty Center", type: "see", area: "Brentwood", detail: "Major art museum campus known for architecture, gardens, city views, and a high-impact half-day cultural visit.", seedRank: 96 },
        { name: "Universal Studios Hollywood", type: "see", area: "Universal City", detail: "Film-studio theme park with rides, shows, and the Studio Tour; best planned as a dedicated half or full day.", seedRank: 94 },
        { name: "Hollywood Walk of Fame", type: "see", area: "Hollywood", detail: "Famous Hollywood Boulevard walk near TCL Chinese Theatre and Dolby Theatre; best as a short stop paired with nearby viewpoints or museums.", seedRank: 92 },
        { name: "Venice Beach Boardwalk", type: "see", area: "Venice", detail: "Lively beach walk known for murals, skate culture, street performers, Muscle Beach, and access to Venice canals.", seedRank: 90 },
        { name: "The Broad", type: "see", area: "Downtown LA", detail: "Contemporary art museum in Downtown LA, popular for its architecture, collection, and timed-entry planning.", seedRank: 88 },
        { name: "Los Angeles County Museum of Art", type: "see", area: "Museum Row / Miracle Mile", detail: "Large art museum known for Urban Light, broad collections, and easy pairing with the Academy Museum or La Brea Tar Pits.", seedRank: 86 },
        { name: "Grand Central Market", type: "eat", area: "Downtown LA", detail: "Historic food hall with a dense mix of casual vendors, ideal for flexible lunches and group trips with different tastes.", cuisine: "Food hall / multi-cuisine", order: "Choose tacos, egg sandwiches, pupusas, ramen, or a vendor crawl.", seedRank: 84 },
        { name: "Original Farmers Market", type: "eat", area: "Fairfax", detail: "Long-running market with casual food stalls and easy pairing with The Grove, CBS Television City, or Museum Row.", cuisine: "Market / casual dining", order: "Try a classic market counter meal, pastries, or a snack crawl.", seedRank: 82 },
        { name: "République", type: "eat", area: "Mid-Wilshire", detail: "Popular bakery, brunch, and dinner spot in a dramatic historic building, useful near Museum Row or Hollywood-adjacent plans.", cuisine: "French-Californian / bakery", order: "Pastries, shakshuka, kimchi fried rice, or a dinner entrée.", seedRank: 81 },
        { name: "Porto's Bakery and Cafe", type: "eat", area: "Glendale / Burbank / West Covina", detail: "Beloved Cuban bakery and café known for pastries, savory snacks, cakes, and easy group-friendly ordering.", cuisine: "Cuban bakery / cafe", order: "Cheese rolls, potato balls, guava pastries, or medianoche sandwich.", seedRank: 80 },
        { name: "Philippe The Original", type: "eat", area: "Chinatown / Downtown LA", detail: "Historic Los Angeles institution associated with French dip sandwiches and old-school counter service.", cuisine: "Classic LA / sandwiches", order: "French dip sandwich with mustard and a side.", seedRank: 78 },
        { name: "Guisados", type: "eat", area: "Boyle Heights / Downtown LA", detail: "Casual taco favorite known for braised fillings and sampler-style taco plates.", cuisine: "Mexican / tacos", order: "Taco sampler or cochinita pibil taco.", seedRank: 76 },
        { name: "Langer's Delicatessen", type: "eat", area: "Westlake / MacArthur Park", detail: "Classic Jewish deli especially known for pastrami sandwiches and an old-school Los Angeles lunch stop.", cuisine: "Deli / classic LA", order: "Pastrami sandwich, especially the #19.", seedRank: 75 },
        { name: "Kogi BBQ", type: "eat", area: "Los Angeles food trucks", detail: "Influential Korean-Mexican food truck concept; check current truck location before planning around it.", cuisine: "Korean-Mexican", order: "Short rib tacos, kimchi quesadilla, or sliders.", seedRank: 74 },
        { name: "Din Tai Fung", type: "eat", area: "Glendale / Century City / Arcadia", detail: "Reliable group-friendly dumpling restaurant with locations that pair well with shopping or museum days.", cuisine: "Taiwanese / dumplings", order: "Xiao long bao, spicy wontons, and fried rice.", seedRank: 73 },
        { name: "The Grove", type: "buy", area: "Fairfax", detail: "Outdoor shopping and dining district next to the Original Farmers Market, useful for mainstream retail and easy browsing.", bestFor: "Fashion, gifts, casual dining, and market pairing", seedRank: 80 },
        { name: "Rodeo Drive", type: "buy", area: "Beverly Hills", detail: "Luxury shopping street known for designer storefronts, polished streetscapes, and Beverly Hills sightseeing.", bestFor: "Luxury window shopping, designer brands, and photos", seedRank: 78 },
        { name: "Abbot Kinney Boulevard", type: "buy", area: "Venice", detail: "Walkable boutique street with design shops, coffee, restaurants, and independent fashion near Venice Beach.", bestFor: "Boutiques, design, coffee, and independent finds", seedRank: 76 },
        { name: "Melrose Avenue", type: "buy", area: "West Hollywood / Fairfax", detail: "Shopping corridor known for streetwear, vintage, murals, fashion boutiques, and casual browsing.", bestFor: "Streetwear, vintage, murals, and trend shopping", seedRank: 74 }
      ]
    }
  ];

  function seededDestinationItems(destination, geocode) {
    const haystack = [destination, geocode?.name, geocode?.admin1, geocode?.country].filter(Boolean).join(" ");
    const seed = SEEDED_DESTINATION_CATALOGS.find((entry) => entry.match.test(haystack));
    if (!seed) return { items: [], label: "", banner: "" };
    return {
      label: seed.label,
      banner: seed.banner,
      items: seed.items.map((item) => ({
        ...item,
        sourceLabel: "PlanToGuide starter catalog",
        sourceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${seed.label}`)}`,
        seeded: true
      }))
    };
  }

  function hasSeededDestinationCatalog(destination, geocode) {
    const haystack = [destination, geocode?.name, geocode?.admin1, geocode?.country].filter(Boolean).join(" ");
    return SEEDED_DESTINATION_CATALOGS.some((entry) => entry.match.test(haystack));
  }

  function catalogHasSeededAnchors(catalog, destination, geocode) {
    const seed = seededDestinationItems(destination, geocode);
    if (!seed.items.length) return true;
    const anchors = seed.items.filter((item) => item.type === "see").slice(0, 4).map((item) => slugify(item.name));
    const existing = new Set((catalog?.attractions || []).map((item) => slugify(item.name)));
    return anchors.every((anchor) => existing.has(anchor));
  }

  function tourismScore(item, destination = "") {
    const text = [item.name, item.area, item.detail, item.bestFor, item.cuisine, destination].filter(Boolean).join(" ").toLowerCase();
    let score = Number(item.seedRank || 0);
    TOURISM_KEYWORD_WEIGHTS.forEach((weight, keyword) => {
      if (text.includes(keyword)) score += weight;
    });
    if (item.seeded) score += 60;
    if (item.image) score += 8;
    if (/wikipedia|wikivoyage/i.test(item.sourceLabel || "")) score += 4;
    return score;
  }

  function rankDynamicItems(items = [], destination = "") {
    return [...items].sort((a, b) => tourismScore(b, destination) - tourismScore(a, destination));
  }

  function distributeFoodItems(eatItems = [], destination, fallbackArea) {
    const food = { breakfast: [], lunch: [], dinner: [] };
    const assigned = new Set();
    const pushUnique = (bucket, item) => {
      const key = slugify(item?.name || "");
      if (!item || !key || assigned.has(key)) return false;
      food[bucket].push(item);
      assigned.add(key);
      return true;
    };
    eatItems.forEach((item) => {
      const text = `${item.name} ${item.cuisine || ""} ${item.detail || ""}`.toLowerCase();
      if (/cafe|coffee|bakery|brunch|breakfast|pastry|donut|bagel/.test(text)) pushUnique("breakfast", item);
      else if (/market|food hall|food court|fast food|taco|sandwich|burger|noodle|ramen|pizza/.test(text)) pushUnique("lunch", item);
      else pushUnique("dinner", item);
    });
    eatItems.forEach((item, index) => pushUnique(["breakfast", "lunch", "dinner"][index % 3], item));
    const filler = {
      breakfast: [
        { name: `${destination} neighborhood café`, area: fallbackArea, detail: "Use live Maps research to choose a highly rated breakfast spot near the day’s route.", cuisine: "Café and local breakfast", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} bakery breakfast stop`, area: fallbackArea, detail: "Look for a popular bakery or coffee shop near the morning neighborhood and verify current hours.", cuisine: "Bakery and coffee", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} brunch option`, area: fallbackArea, detail: "Research a well-reviewed brunch spot that fits your group size and morning timing.", cuisine: "Brunch", sourceLabel: "PlanToGuide", sourceUrl: "" }
      ],
      lunch: [
        { name: `${destination} local lunch favorite`, area: fallbackArea, detail: "Choose a well-reviewed lunch stop near the day’s sights and verify current hours.", cuisine: "Regional cuisine", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} market lunch stop`, area: fallbackArea, detail: "Find a food hall, public market, or casual counter-service option that works for flexible groups.", cuisine: "Market and casual dining", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} casual neighborhood meal`, area: fallbackArea, detail: "Pick a practical lunch with short travel time and a current menu that fits dietary needs.", cuisine: "Casual local food", sourceLabel: "PlanToGuide", sourceUrl: "" }
      ],
      dinner: [
        { name: `${destination} dinner reservation option`, area: fallbackArea, detail: "Research a dinner spot that matches your budget, dietary needs, and route.", cuisine: "Local dinner", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} special dinner pick`, area: fallbackArea, detail: "Look for a memorable dinner option near the evening plan and confirm reservations.", cuisine: "Dinner", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} relaxed evening restaurant`, area: fallbackArea, detail: "Choose a lower-stress dinner close to the final stop or home base.", cuisine: "Relaxed dinner", sourceLabel: "PlanToGuide", sourceUrl: "" }
      ]
    };
    Object.keys(food).forEach((bucket) => {
      let index = 0;
      while (food[bucket].length < 3) pushUnique(bucket, filler[bucket][index++ % filler[bucket].length]);
      food[bucket] = food[bucket].slice(0, 6);
    });
    return food;
  }

  function dedupeItems(items = []) {
    const seen = new Set();
    return items.filter((item) => {
      const key = slugify(item.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function toPlace(item, fallbackArea) {
    return {
      name: item.name,
      area: item.area || fallbackArea,
      detail: item.detail || "Research this local recommendation before adding it to a final route.",
      address: item.address || "",
      image: item.image || "",
      sourceLabel: item.sourceLabel || "",
      sourceUrl: item.sourceUrl || ""
    };
  }

  function assembleDynamicCatalog(destination, geocode, sourceData = {}) {
    const seeded = seededDestinationItems(destination, geocode);
    const fallbackArea = seeded.label || [geocode?.name, geocode?.admin1, geocode?.country].filter(Boolean).join(", ") || destination;
    const items = rankDynamicItems(dedupeItems([...(seeded.items || []), ...(sourceData.wikivoyageItems || []), ...(sourceData.wikipediaItems || []), ...(sourceData.osmItems || [])]), destination);
    const see = items.filter((item) => item.type === "see").slice(0, 24).map((item) => toPlace(item, fallbackArea));
    const eatItems = items.filter((item) => item.type === "eat").slice(0, 18).map((item) => ({ ...toPlace(item, fallbackArea), cuisine: item.cuisine || "Local cuisine", order: item.order || "Check the current menu and signature dishes." }));
    const buy = items.filter((item) => item.type === "buy").slice(0, 18).map((item) => ({ ...toPlace(item, fallbackArea), bestFor: item.bestFor || "Local shopping, gifts, and browsing" }));
    const enoughSignal = see.length >= 4 || eatItems.length >= 3 || buy.length >= 2;
    if (!enoughSignal) return null;
    const fillerImage = seeded.banner || [...see, ...eatItems, ...buy].find((item) => item.image)?.image || NEUTRAL_BANNER_PLACEHOLDER;
    const food = distributeFoodItems(eatItems, destination, fallbackArea);
    const zones = see.slice(0, 8).map((item, index) => ({
      name: item.area || item.name,
      icon: ["🏛️", "🌿", "🌆", "🎨", "🧭", "📸", "🛍️", "🌉"][index % 8],
      keywords: [item.name, item.area].filter(Boolean)
    }));
    const slug = slugify([geocode?.name, geocode?.admin1, geocode?.country].filter(Boolean).join(" "));
    const matchPattern = `\\b(?:${[destination, geocode?.name].filter(Boolean).map(escapeRegExp).join("|")})\\b`;
    return {
      dynamic: true,
      researchMode: true,
      slug,
      matchPattern,
      matchFlags: "i",
      match: new RegExp(matchPattern, "i"),
      label: fallbackArea,
      banner: fillerImage,
      zones: zones.length ? zones : [{ name: fallbackArea, icon: "🧭", keywords: [destination] }],
      attractions: see,
      food,
      shopping: buy.length ? buy : [
        { name: `${destination} central shopping street`, area: fallbackArea, detail: "Research the main retail street or market district and verify current stores.", bestFor: "Local gifts and browsing", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} artisan market`, area: fallbackArea, detail: "Look for a local maker market, food market, or craft area near the route.", bestFor: "Crafts, food gifts, and souvenirs", sourceLabel: "PlanToGuide", sourceUrl: "" },
        { name: `${destination} design and vintage district`, area: fallbackArea, detail: "Find a walkable independent shopping area with boutiques, books, or vintage shops.", bestFor: "Independent finds", sourceLabel: "PlanToGuide", sourceUrl: "" }
      ],
      practical: {},
      sources: [
        ...(seeded.items?.length ? [{ label: "PlanToGuide starter catalog", url: "https://www.google.com/maps" }] : []),
        { label: "Wikivoyage", url: sourceData.wikivoyageTitle ? `https://en.wikivoyage.org/wiki/${encodeURIComponent(sourceData.wikivoyageTitle.replace(/\s+/g, "_"))}` : "https://en.wikivoyage.org" },
        { label: "Wikipedia", url: "https://en.wikipedia.org" },
        ...(sourceData.osmItems?.length ? [{ label: "OpenStreetMap", url: "https://www.openstreetmap.org" }] : [])
      ]
    };
  }

  async function buildDynamicCatalog(destination, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PIPELINE_TIMEOUT_MS);
    options.signal?.addEventListener?.("abort", () => controller.abort(), { once: true });
    try {
      const geocode = options.geocode || await geocodeDestination(destination, { signal: controller.signal });
      if (!geocode) return null;
      const slug = slugify([geocode.name, geocode.admin1, geocode.country].filter(Boolean).join(" "));
      const cached = dynamicCatalogCache.get(slug);
      if (cached && catalogHasSeededAnchors(cached, destination, geocode)) return { ...cached, match: new RegExp(cached.matchPattern || `\\b(?:${escapeRegExp(destination)})\\b`, cached.matchFlags || "i") };
      const [voyage, wikiGeo, wikiCategory, osm] = await Promise.all([
        fetchWikivoyageListings([geocode.name, geocode.country].filter(Boolean).join(" "), controller.signal).catch(() => ({ title: "", items: [] })),
        fetchWikipediaGeoPlaces(geocode, controller.signal).catch(() => []),
        fetchWikipediaCategoryPlaces(destination, geocode, controller.signal).catch(() => []),
        fetchOpenStreetMapRecommendations(destination, geocode, controller.signal).catch(() => [])
      ]);
      const catalog = assembleDynamicCatalog(destination, geocode, { wikivoyageTitle: voyage.title, wikivoyageItems: voyage.items, wikipediaItems: [...wikiGeo, ...wikiCategory], osmItems: osm });
      if (!catalog) return null;
      const cacheable = { ...catalog, match: undefined };
      dynamicCatalogCache.set(slug, cacheable);
      return catalog;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const api = { geocodeDestination, parseWikivoyageListings, stripWikitext, buildDynamicCatalog, dynamicCatalogCache, assembleDynamicCatalog, hasSeededDestinationCatalog, catalogHasSeededAnchors, fetchWikipediaCategoryPlaces, fetchOpenStreetMapRecommendations, slugify };
  Object.assign(global, api);
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
