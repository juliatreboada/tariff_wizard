/**
 * Table cells with alternative pictures ("OR"), reviewed by the coach, live
 * in catalog/<CODE>/cell-options.json (cell picture → option pictures). Each
 * generator calls `applyCellOptions` to replace such a cell's entry by one
 * entry per option: same value, coordinates and rules, its own picture,
 * `number` = the cell's id (a routine uses one option of a cell), and a
 * `variant` so the picker shows the cell first and then its options.
 */
import fs from "node:fs";
import path from "node:path";

const letter = (i) => String.fromCharCode(97 + i);

/** Entries with their option cells split; references (attachesTo) point at every option. */
export function applyCellOptions(root, code, entries, problems = []) {
  const file = path.join(root, "catalog", code, "cell-options.json");
  if (!fs.existsSync(file)) return entries;
  const { cells } = JSON.parse(fs.readFileSync(file, "utf8"));
  const pictures = new Set(entries.map((e) => e.image));
  for (const cell of Object.keys(cells)) {
    if (!pictures.has(cell)) problems.push(`cell-options: ${cell} is no entry's picture`);
  }
  const renamed = new Map();
  const out = [];
  for (const entry of entries) {
    const options = cells[entry.image];
    if (!options) {
      out.push(entry);
      continue;
    }
    const ids = options.map((image, i) => {
      const id = `${entry.id}-${letter(i)}`;
      out.push({
        ...entry,
        id,
        image,
        number: entry.id,
        variant: { group: entry.coordinates, label: `Opción ${letter(i).toUpperCase()}`, groupImage: entry.image },
      });
      return id;
    });
    renamed.set(entry.id, ids);
  }
  for (const entry of out) {
    if (entry.attachesTo) entry.attachesTo = entry.attachesTo.flatMap((id) => renamed.get(id) ?? [id]);
  }
  return out;
}

/** The entry ids a reviewed id now stands for: itself, or its options (entries numbered with it). */
export function expandId(entries, id) {
  const options = entries.filter((e) => e.number === id).map((e) => e.id);
  if (options.length) return options;
  return entries.some((e) => e.id === id) ? [id] : [];
}
