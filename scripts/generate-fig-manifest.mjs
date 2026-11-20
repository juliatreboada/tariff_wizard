/**
 * Build catalog/FIG/manifest.json from catalog/FIG/pre-youth-11-16.json and
 * the PNGs under public/catalog/FIG/pre-youth/<team>/<balance|dynamic|tops>/.
 *
 * FIG Pre-Youth (11-16) Compulsory Elements Table 2025-2028 (ACRO Youth &
 * Junior Rules, Appendix 3): numbered boxes per row, cut with
 * scripts/cut-box-table.mjs. Level FIG, age Pre-Youth; Women's Group = Tríos,
 * Men's Group = Cuartetos. Men's Group tops (T1–T18) attach to the ROW I / II
 * structures the coach marked for each and add their value, like the Base
 * Cuartetos add-ons.
 *
 * Also the FIG ToD individual elements (catalog/FIG/tod-individuals.json,
 * pictures in public/catalog/FIG/tod/), cut with scripts/cut-tod-individuals.mjs.
 *
 * Usage: node scripts/generate-fig-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyCellOptions } from "./cell-options.mjs";
import { applySameElements } from "./same-elements.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicFig = path.join(root, "public/catalog/FIG");
const source = JSON.parse(
  fs.readFileSync(path.join(root, "catalog/FIG/pre-youth-11-16.json"), "utf8"),
);
const manifestPath = path.join(root, "catalog/FIG/manifest.json");

const entries = [];
const problems = [];
// A table element goes in a combined routine (Base / Cto. España Cadete) and in
// the Pre-Youth routine of its family (balance or dynamic).
const filters = (category, elementFamily) => ({
  levelSystems: ["FIG"],
  categories: [category],
  exercises: [elementFamily === "balance" ? "Balance" : "Dynamic", "Combined"],
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
        filters: filters(table.category, elementFamily),
      };
      if (variant && !cell.label) problems.push(`${key}: a variant needs a label`);
      // Two values of one box (360º / 540º-720º) are one element: a routine does one of them.
      if (variant) entry.number = `fig-pre-youth-${team}-${elementFamily}-ROW-${row}-${box}`.toLowerCase();
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
    const tops = Object.entries(table.tops.boxes).sort(
      ([a], [b]) => Number(a.slice(2)) - Number(b.slice(2)),
    );
    for (const [key, cell] of tops) {
      const n = key.slice(2);
      const image = `pre-youth/${team}/tops/${key}.png`;
      if (!fs.existsSync(path.join(publicFig, image))) problems.push(`missing picture ${image}`);
      // The structures the coach marked for this top.
      if (!cell.attachTo?.length) {
        problems.push(`${key}: no structures to attach to`);
        continue;
      }
      const structures = cell.attachTo.map((box) => `fig-pre-youth-${team}-balance-${box}`.toLowerCase());
      for (const id of structures) {
        if (!entries.some((e) => e.id === id)) problems.push(`${key}: no structure ${id}`);
      }
      entries.push({
        id: `fig-pre-youth-${team}-balance-top-${n}`,
        code: "FIG",
        elementFamily: "balance",
        type: "EQ",
        coordinates: `T${n}`,
        image,
        value: cell.value,
        filters: filters(table.category, "balance"),
        attachesTo: structures,
      });
    }
  }
}

// FIG Table of Difficulty individual elements (catalog/FIG/tod-individuals.json):
// written on the sheet by ID (agilities with a landing: ID + letter) and, for
// tumbling, by the page. Offered to every category.
const tod = JSON.parse(fs.readFileSync(path.join(root, "catalog/FIG/tod-individuals.json"), "utf8"));
const individualFilters = {
  levelSystems: ["FIG"],
  categories: ["Parejas", "Tríos", "Cuartetos", "Pareja Femenina", "Pareja Masculina", "Pareja Mixta"],
  // Every routine; the ruleset says which types it allows (`typesByExercise`).
  exercises: ["Balance", "Dynamic", "Combined"],
};
/**
 * One individual element. `number` is its ID number for "once per gymnast":
 * the options and landings of one box share it.
 */
const individual = (id, type, coordinates, image, value, extra = {}) => {
  if (!fs.existsSync(path.join(publicFig, image))) problems.push(`missing picture ${image}`);
  entries.push({ id, code: "FIG", elementFamily: "individual", type, coordinates, image, value, ...extra, filters: individualFilters });
};
const letter = (i) => String.fromCharCode(97 + i);
/** A box with several pictures: one entry per option (picture and value), picked in two steps. */
const options = (prefix, type, code, folder, cell) =>
  cell.options.forEach((option, i) =>
    individual(`${prefix}-${letter(i)}`, type, code, `tod/${folder}/${option.image}.png`, option.value, {
      number: code,
      variant: { group: code, label: `Opción ${letter(i).toUpperCase()}`, groupImage: `tod/${folder}/${code}.png` },
    }),
  );
for (const [family, type, folder] of [["balance", "EQ", "balance"], ["flexibility", "FLEX", "flex"]]) {
  for (const [code, cell] of Object.entries(tod[family])) {
    if (cell.options) options(`fig-tod-${folder}-${code}`, type, code, folder, cell);
    else individual(`fig-tod-${folder}-${code}`, type, code, `tod/${folder}/${code}.png`, cell.value);
  }
}
for (const [code, cell] of Object.entries(tod.agility)) {
  if (cell.options) {
    options(`fig-tod-ag-${code}`, "AG", code, "agility", cell);
    continue;
  }
  if (!cell.landings) {
    individual(`fig-tod-ag-${code}`, "AG", code, `tod/agility/${code}.png`, cell.value);
    continue;
  }
  for (const [landing, value] of Object.entries(cell.landings)) {
    individual(`fig-tod-ag-${code}-${landing}`.toLowerCase(), "AG", `${code} ${landing}`, `tod/agility/${cell.image}-${landing}.png`, value, {
      number: code,
      variant: { group: code, label: `Recepción ${landing}`, groupImage: `tod/agility/${cell.image}.png` },
    });
  }
}
for (const [column, twists] of Object.entries(tod.tumbling.columns)) {
  const pictures = tod.tumbling.options?.[column] ?? [{ image: `col-${column}` }];
  for (const [twist, value] of Object.entries(twists)) {
    pictures.forEach((picture, i) => {
      const suffix = pictures.length > 1 ? `-${letter(i)}` : "";
      individual(
        `fig-tod-tum-${column}-${twist.replace("°", "")}${suffix}`,
        "TUM",
        String(tod.tumbling.page),
        `tod/tumbling/${picture.image}.png`,
        value,
        {
          number: `${tod.tumbling.page}:${column}:${twist}`,
          variant: { group: `Col. ${column}`, label: twist, groupImage: `tod/tumbling/col-${column}.png` },
        },
      );
    });
  }
}

// TOD WG Women's Group bases (catalog/FIG/tod-wg-bases.json, printed pages
// 58-64): the pyramid's base, for the free-composition levels (source "TOD WG").
// The top, motion and transition are chosen on top of it (lib/tariff/tod-wg).
const todWg = JSON.parse(fs.readFileSync(path.join(root, "catalog/FIG/tod-wg-bases.json"), "utf8"));
const todWgFilters = {
  levelSystems: ["FIG", "RFEG"],
  categories: ["Tríos"],
  exercises: ["Balance", "Combined"],
  levelAges: ["TOD WG"],
};
const todWgSlug = (s) => s.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
for (const base of todWg.bases) {
  if (!fs.existsSync(path.join(publicFig, base.image))) problems.push(`missing picture ${base.image}`);
  const group = todWg.bases.filter((b) => b.category === base.category && b.number === base.number);
  const label = base.variationOf ? "+2" : base.option ? `Opción ${base.option.toUpperCase()}` : "Sin variación";
  entries.push({
    id: `fig-todwg-c${base.category}-${todWgSlug(base.id)}`,
    code: "FIG",
    elementFamily: "balance",
    coordinates: base.id,
    image: base.image,
    value: base.value,
    holdDuration: '3"',
    number: `C${base.category} ${base.number}`,
    ...(group.length > 1 ? { variant: { group: base.number, label, groupImage: group[0].image } } : {}),
    tags: ["pyramid", "static-hold"],
    pyramidCategory: String(base.category),
    filters: todWgFilters,
  });
}

// Cells with alternative pictures ("OR"): one entry per option.
const withOptions = applyCellOptions(root, "FIG", entries, problems);
entries.splice(0, entries.length, ...withOptions);

// Same element in another table (e.g. Base Cadete), reviewed by the coach.
applySameElements(root, "FIG", entries, problems);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const manifest = {
  version: 1,
  code: "FIG",
  description:
    "Catálogo FIG — Pre-Youth (11-16) Compulsory Elements Table 2025-2028 (Pareja Femenina, Masculina, Mixta, Tríos = Women's Group, Cuartetos = Men's Group; elementFamily balance|dynamic) and the ACRO Table of Difficulty 2025-2028 individual elements (elementFamily individual: EQ, FLEX, AG, TUM).",
  entries,
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${path.relative(root, manifestPath)}`);
