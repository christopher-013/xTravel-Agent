import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const stylesheet = readFileSync("styles.css");
const compressed = gzipSync(stylesheet, { level: 9, mtime: 0 }).toString("base64");

writeFileSync(
  "export-styles.js",
  `window.XTRAVEL_STYLES_GZIP_BASE64=${JSON.stringify(compressed)};\n`,
  "utf8"
);

console.log(`Bundled ${stylesheet.length} stylesheet bytes into export-styles.js.`);
