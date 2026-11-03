/**
 * Build catalog/FIG/manifest.json from catalog/FIG/pre-youth-11-16.json and
 * the PNGs under public/catalog/FIG/pre-youth/<team>/<balance|dynamic|tops>/.
 *
 * FIG Pre-Youth (11-16) Compulsory Elements Table 2025-2028 (ACRO Youth &
 * Junior Rules, Appendix 3): numbered boxes per row, cut with
 * scripts/cut-box-table.mjs. Level FIG, age Pre-Youth; Women's Group = Tríos,
 * Men's Group = Cuartetos. Men's Group tops (T1–T18) attach to a ROW I or II
 * structure and add their value, like the Base Cuartetos add-ons.
 *
 * Usage: node scripts/generate-fig-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicFig = path.join(root, "public/catalog/FIG");
const source = JSON.parse(
  fs.readFileSync(path.join(root, "catalog/FIG/pre-youth-11-16.json"), "utf8"),
);
const manifestPath = path.join(root, "catalog/FIG/manifest.json");

const entries = [];
const problems = [];
const filters = (category) => ({
  levelSystems: ["FIG"],
  categories: [category],
  exercises: ["Combined"],
  levelAges: ["Pre-Youth"],
});

/** "ROW-II-3b" → { row: "II", box: "3b", variant? } */
function parseBox(key) {
  const m = key.match(/^ROW-([IVX]+)-(\d+[a-z]?)(?:-(\d+))?$/);
  if (!m) throw new Error(`bad box key ${key}`);
  return { row: m[1], box: m[2], variant: m[3] };
}

const ROW_ORDER = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
const byTableOrder = ([a], [b]) => {
  const pa = parseBox(a);
  const pb = parseBox(b);
  return ROW_ORDER[pa.row] - ROW_ORDER[pb.row] || pa.box.localeCompare(pb.box, undefined, { numeric: true });
};

for (const [team, table] of Object.entries(source.tables)) {
  for (const elementFamily of ["balance", "dynamic"]) {
    for (const [key, cell] of Object.entries(table[elementFamily]).sort(byTableOrder)) {
      const { row, box, variant } = parseBox(key);
      const image = `pre-youth/${team}/${elementFamily}/${cell.image ?? key}.png`;
      if (!fs.existsSync(path.join(publicFig, image))) problems.push(`missing picture ${image}`);
      const entry = {
        id: `fig-pre-youth-${team}-${elementFamily}-${key}`.toLowerCase(),
        code: "FIG",
        elementFamily,
        coordinates: `ROW-${row} ${box}${cell.label ? ` ${cell.label}` : ""}`,
        image,
        value: cell.value,
        filters: filters(table.category),
      };
      if (variant && !cell.label) problems.push(`${key}: a variant needs a label`);
      if (elementFamily === "balance") {
        entry.type = "EQ";
        if (cell.hold !== null) entry.holdDuration = '3"';
      } else {
        if (!cell.rotation) problems.push(`${team} ${key}: no rotation`);
        entry.rotation = cell.rotation;
      }
      entries.push(entry);
    }
  }

  if (table.tops) {
    const structures = entries
      .filter(
        (e) =>
          e.id.startsWith(`fig-pre-youth-${team}-balance-`) &&
          table.tops.attachTo.some((row) => e.coordinates.startsWith(`${row} `)),
      )
      .map((e) => e.id);
    const tops = Object.entries(table.tops.boxes).sort(
      ([a], [b]) => Number(a.slice(2)) - Number(b.slice(2)),
    );
    for (const [key, cell] of tops) {
      const n = key.slice(2);
      const image = `pre-youth/${team}/tops/${key}.png`;
      if (!fs.existsSync(path.join(publicFig, image))) problems.push(`missing picture ${image}`);
      entries.push({
        id: `fig-pre-youth-${team}-balance-top-${n}`,
        code: "FIG",
        elementFamily: "balance",
        type: "EQ",
        coordinates: `T${n}`,
        image,
        value: cell.value,
        filters: filters(table.category),
        attachesTo: structures,
      });
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const manifest = {
  version: 1,
  code: "FIG",
  description:
    "Catálogo FIG — Pre-Youth (11-16) Compulsory Elements Table 2025-2028: Pareja Femenina, Masculina, Mixta, Tríos (Women's Group), Cuartetos (Men's Group). elementFamily: balance|dynamic.",
  entries,
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${path.relative(root, manifestPath)}`);
