// Temporary helper: deep-merge staged i18n snippet files into the _stage-*.json bundles.
// Usage: node i18n-stage-merge.tmp.js <enSnippetPath> <zhSnippetPath>
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "src", "i18n", "locales");

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function mergeInto(locale, snippetPath) {
  const bundlePath = path.join(ROOT, locale, "_stage-a1a.json");
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const snippet = JSON.parse(fs.readFileSync(snippetPath, "utf8"));
  deepMerge(bundle, snippet);
  fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + "\n", "utf8");
}

mergeInto("en", process.argv[2]);
mergeInto("zh-CN", process.argv[3]);
console.log("merged");
