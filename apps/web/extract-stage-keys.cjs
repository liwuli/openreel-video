const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "src/motion/components/PropertiesPanel.tsx");
const src = fs.readFileSync(file, "utf8");

const re = /(?:\bi18n\s*\.\s*)?\bt\(\s*(["'`])motion:(propertiesPanel\.[A-Za-z0-9_.-]+)\1\s*,\s*(["'`])((?:[^\\]|\\.)*?)\3/g;

const seen = new Map();
let m;
while ((m = re.exec(src))) {
  const key = m[2];
  const def = m[4];
  if (!seen.has(key)) {
    seen.set(key, def);
  } else if (seen.get(key) !== def) {
    console.log("DUP-DIFF", key, JSON.stringify(seen.get(key)), JSON.stringify(def));
  }
}
console.log("static keys:", seen.size);

const dre = /`motion:(propertiesPanel\.[^`]*)`/g;
const dyn = new Set();
while ((m = dre.exec(src))) dyn.add(m[1]);
console.log("dynamic:", [...dyn]);

const out = [...seen].sort((a, b) => (a[0] < b[0] ? -1 : 1));
fs.writeFileSync(path.join(__dirname, "stage-keys.json"), JSON.stringify(out, null, 1), "utf8");

// find any t( ... ) with motion: prefix that did not match (no literal default)
const loose = /\bt\(\s*(["'`])motion:propertiesPanel\.([A-Za-z0-9_.-]+)\1\s*\)/g;
const looseKeys = [];
while ((m = loose.exec(src))) looseKeys.push(m[2]);
console.log("loose (no default):", looseKeys);
