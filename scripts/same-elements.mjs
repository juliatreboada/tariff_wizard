/**
 * Cells that are the same element in different tables (reviewed by the coach)
 * live in catalog/same-elements.json as id pairs, possibly across catalogs
 * (e.g. Base Cadete ↔ FIG 11-16). Each catalog's generator calls this to put
 * `sameAs` on its own entries.
 */
import fs from "node:fs";
import path from "node:path";

/** Catalog code of an entry id from its prefix ("fig-…" → FIG). */
const codeOf = (id) => id.split("-")[0].toUpperCase();

/**
 * Add `sameAs` to `entries` (all of catalog `code`) from the reviewed pairs.
 * The other side of a pair must exist in its own catalog's manifest.
 */
export function applySameElements(root, code, entries, problems) {
  const { pairs } = JSON.parse(fs.readFileSync(path.join(root, "catalog/same-elements.json"), "utf8"));
  const own = new Map(entries.map((e) => [e.id, e]));
  const others = new Map();
  const existsElsewhere = (id) => {
    const other = codeOf(id);
    if (!others.has(other)) {
      const file = path.join(root, "catalog", other, "manifest.json");
      const ids = fs.existsSync(file)
        ? new Set(JSON.parse(fs.readFileSync(file, "utf8")).entries.map((e) => e.id))
        : new Set();
      others.set(other, ids);
    }
    return others.get(other).has(id);
  };
  const exists = (id) => (codeOf(id) === code ? own.has(id) : existsElsewhere(id));

  const known = (id) => fs.existsSync(path.join(root, "catalog", codeOf(id), "manifest.json")) || codeOf(id) === code;
  for (const [a, b] of pairs) {
    for (const id of [a, b]) if (!known(id)) problems.push(`same-elements: ${id} isn't in any catalog`);
    if (codeOf(a) !== code && codeOf(b) !== code) continue;
    if (!exists(a) || !exists(b)) {
      problems.push(`same-elements: unknown entry in ${a} / ${b}`);
      continue;
    }
    for (const [from, to] of [[a, b], [b, a]]) {
      const entry = own.get(from);
      if (entry) entry.sameAs = [...new Set([...(entry.sameAs ?? []), to])].sort();
    }
  }
}
