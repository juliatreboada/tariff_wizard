/**
 * Cells that are the same element in different tables (reviewed by the coach)
 * live in catalog/same-elements.json as id pairs, possibly across catalogs
 * (e.g. Base Cadete ↔ FIG 11-16). Each catalog's generator calls this to put
 * `sameAs` on its own entries.
 */
import fs from "node:fs";
import path from "node:path";
import { expandId } from "./cell-options.mjs";

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
  const entriesOf = (other) => {
    if (other === code) return entries;
    if (!others.has(other)) {
      const file = path.join(root, "catalog", other, "manifest.json");
      others.set(other, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")).entries : []);
    }
    return others.get(other);
  };
  // A reviewed cell later split into options stands for every option.
  const expand = (id) => expandId(entriesOf(codeOf(id)), id);

  const known = (id) => fs.existsSync(path.join(root, "catalog", codeOf(id), "manifest.json")) || codeOf(id) === code;
  for (const [a, b] of pairs) {
    for (const id of [a, b]) if (!known(id)) problems.push(`same-elements: ${id} isn't in any catalog`);
    if (codeOf(a) !== code && codeOf(b) !== code) continue;
    const [as, bs] = [expand(a), expand(b)];
    if (!as.length || !bs.length) {
      problems.push(`same-elements: unknown entry in ${a} / ${b}`);
      continue;
    }
    for (const x of as)
      for (const y of bs)
        for (const [from, to] of [[x, y], [y, x]]) {
          const entry = own.get(from);
          if (entry) entry.sameAs = [...new Set([...(entry.sameAs ?? []), to])].sort();
        }
  }
}
