/* eslint-disable */
// Temporary helper: merge a key map into the _stage-a2b.json locale staging files.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "src", "i18n", "locales");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const payloadPath = process.argv[2];
const payload = readJson(payloadPath);

for (const locale of ["en", "zh-CN"]) {
  const file = path.join(ROOT, locale, "_stage-a2b.json");
  const existing = fs.existsSync(file) ? readJson(file) : {};
  const incoming = payload[locale] || {};
  const merged = { ...existing };
  for (const [prefix, keys] of Object.entries(incoming)) {
    merged[prefix] = { ...(merged[prefix] || {}), ...keys };
  }
  writeJson(file, merged);
}

const en = readJson(path.join(ROOT, "en", "_stage-a2b.json"));
const zh = readJson(path.join(ROOT, "zh-CN", "_stage-a2b.json"));

function flatten(obj, prefix = "") {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out.push(...flatten(value, next));
    } else {
      out.push(next);
    }
  }
  return out.sort();
}

const enKeys = flatten(en);
const zhKeys = flatten(zh);
const onlyEn = enKeys.filter((k) => !zhKeys.includes(k));
const onlyZh = zhKeys.filter((k) => !enKeys.includes(k));
console.log(
  JSON.stringify(
    { en: enKeys.length, zh: zhKeys.length, onlyEn, onlyZh },
    null,
    2,
  ),
);
