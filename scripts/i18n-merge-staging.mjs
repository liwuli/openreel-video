#!/usr/bin/env node
/**
 * Merge `_stage-*.json` fragments into their target namespace files.
 *
 * The i18n backfill ran several agents in parallel. Agents that owned a slice of
 * a namespace they did not own outright staged their new keys in `_stage-*.json`
 * so concurrent writes could not clobber each other. This script folds those
 * fragments in, reports key collisions, and removes the staging files.
 *
 * Usage:
 *   node scripts/i18n-merge-staging.mjs          # merge + delete staging files
 *   node scripts/i18n-merge-staging.mjs --dry    # report only, write nothing
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = join(ROOT, "apps", "web", "src", "i18n", "locales");
const LANGUAGES = ["en", "zh-CN"];

/**
 * Staged fragment basename pattern -> namespace file it belongs to.
 *
 * Patterns are matched in order, first hit wins. The `_stage-a2a.g<N>` form
 * exists because one workstream fanned out into six file-scoped sub-writers;
 * each needed its own fragment to avoid clobbering its siblings.
 */
const TARGETS = [
  { pattern: /^_stage-a1[ab]$/, namespace: "inspector" },
  { pattern: /^_stage-a2a(\.g\d+)?$/, namespace: "motion" },
  { pattern: /^_stage-a2b$/, namespace: "motion" },
];

const DRY_RUN = process.argv.includes("--dry");

/**
 * Recursively merge `source` into `target`, returning a new object.
 *
 * Leaf collisions are recorded rather than silently overwritten: two agents
 * inventing the same key for different copy is a copy bug, not a merge order
 * question.
 *
 * @param {Record<string, unknown>} target
 * @param {Record<string, unknown>} source
 * @param {string} path
 * @param {string[]} collisions
 * @returns {Record<string, unknown>}
 */
function deepMerge(target, source, path, collisions) {
  const out = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const keyPath = path ? `${path}.${key}` : key;
    const existing = out[key];

    if (existing === undefined) {
      out[key] = value;
      continue;
    }

    const bothObjects =
      existing !== null &&
      value !== null &&
      typeof existing === "object" &&
      typeof value === "object" &&
      !Array.isArray(existing) &&
      !Array.isArray(value);

    if (bothObjects) {
      out[key] = deepMerge(existing, value, keyPath, collisions);
      continue;
    }

    if (JSON.stringify(existing) !== JSON.stringify(value)) {
      collisions.push(`${keyPath}\n    existing: ${JSON.stringify(existing)}\n    incoming: ${JSON.stringify(value)}`);
    }
  }

  return out;
}

/** Read a locale JSON file, or return null when it is absent. */
function readLocale(language, name) {
  const file = join(LOCALES, language, `${name}.json`);
  if (!existsSync(file)) return null;

  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${language}/${name}.json: ${error.message}`);
  }
}

/** Write a locale JSON file with the repository's 2-space formatting. */
function writeLocale(language, name, data) {
  const file = join(LOCALES, language, `${name}.json`);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function main() {
  const collisions = [];
  const summary = [];
  const consumed = new Set();

  for (const language of LANGUAGES) {
    const dir = join(LOCALES, language);
    const stages = readdirSync(dir)
      .filter((entry) => /^_stage-.*\.json$/.test(entry))
      .map((entry) => entry.replace(/\.json$/, ""))
      .sort();

    for (const stageName of stages) {
      const namespace = TARGETS.find(({ pattern }) => pattern.test(stageName))?.namespace;
      if (!namespace) {
        summary.push(`⚠️  ${language}/${stageName}: 未匹配到目标命名空间,已跳过`);
        continue;
      }

      const fragment = readLocale(language, stageName);
      if (!fragment) continue;

      consumed.add(language);
      const staged = Object.keys(fragment).length;
      if (staged === 0) {
        summary.push(`${language}/${namespace}  <- ${stageName}: 空片段,跳过`);
        continue;
      }

      const target = readLocale(language, namespace) ?? {};
      const merged = deepMerge(target, fragment, "", collisions);
      const added = countLeaves(merged) - countLeaves(target);

      if (!DRY_RUN) writeLocale(language, namespace, merged);
      summary.push(`${language}/${namespace}  <- ${stageName}: +${added} key (片段 ${staged} 组)`);
    }
  }

  console.log(summary.join("\n") || "没有找到任何暂存文件。");

  if (collisions.length > 0) {
    console.log(`\n⚠️  ${collisions.length} 处 key 冲突(保留先合并的值,请人工复核):`);
    for (const collision of collisions) console.log(`  - ${collision}`);
  }

  if (!DRY_RUN && consumed.size > 0) {
    let removed = 0;
    for (const language of LANGUAGES) {
      const dir = join(LOCALES, language);
      for (const entry of readdirSync(dir)) {
        if (/^_stage-.*\.json$/.test(entry)) {
          unlinkSync(join(dir, entry));
          removed += 1;
        }
      }
    }
    console.log(`\n已删除 ${removed} 个暂存文件。`);
  } else if (DRY_RUN) {
    console.log("\n(--dry 模式,未写入任何文件)");
  }
}

/** Count leaf (non-object) entries so the summary reports real key growth. */
function countLeaves(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return 1;
  return Object.values(value).reduce((total, child) => total + countLeaves(child), 0);
}

main();
