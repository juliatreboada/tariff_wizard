/**
 * Build catalog/FGX/manifest.json from PNGs under public/catalog/FGX/.
 * Column values (ESCOLAR pairs): A=0, B=0.1, …, E=0.4.
 *
 * Usage: node scripts/generate-fgx-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicFgx = path.join(root, "public/catalog/FGX");
const manifestPath = path.join(root, "catalog/FGX/manifest.json");

const COLUMN_VALUE = { A: 0, B: 0.1, C: 0.2, D: 0.3, E: 0.4 };

const PAIRS_FILTERS = {
  levelSystems: ["Escolar"],
  categories: ["Parejas"],
  exercises: ["Combined"],
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Matches lib/tariff/catalog/coordinates.ts */
function codeToCoordinates(code) {
  const rowMatch = code.match(/^ROW-([IVX]+)-([A-E])(?:-(\d+))?$/i);
  if (rowMatch) {
    const [, row, col, variant] = rowMatch;
    return variant ? `ROW-${row} ${col}-${variant}` : `ROW-${row} ${col}`;
  }
  const lastDash = code.lastIndexOf("-");
  if (lastDash > 0 && /^\d+$/.test(code.slice(lastDash + 1))) {
    return `${code.slice(0, lastDash)} ${code.slice(lastDash + 1)}`;
  }
  return code;
}

function parseRowElement(basename) {
  const m = basename.match(/^ROW-([IVX]+)-([A-E])(?:-(\d+))?$/i);
  if (!m) return null;
  const row = m[1].toUpperCase();
  const col = m[2].toUpperCase();
  const variant = m[3];
  const code = variant ? `ROW-${row}-${col}-${variant}` : `ROW-${row}-${col}`;
  return { row, col, code };
}

function listPngs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function makeRowEntry({ elementFamily, relImage, basename }) {
  const parsed = parseRowElement(basename.replace(/\.png$/i, ""));
  if (!parsed) {
    console.warn(`skip (bad name): ${relImage}`);
    return null;
  }
  const value = COLUMN_VALUE[parsed.col];
  if (value === undefined) {
    console.warn(`skip (bad column): ${relImage}`);
    return null;
  }
  const entry = {
    id: `fgx-${elementFamily}-${slugify(parsed.code)}`,
    code: "FGX",
    elementFamily,
    coordinates: codeToCoordinates(parsed.code),
    image: relImage.replace(/\\/g, "/"),
    value,
    filters: PAIRS_FILTERS,
  };
  if (elementFamily === "balance") {
    entry.type = "EQ";
    entry.holdDuration = '3"';
  }
  if (elementFamily === "dynamic") {
    entry.rotation = "0/4";
  }
  return entry;
}

function folderToType(folder) {
  if (folder === "EQ") return "EQ";
  if (folder === "FLEX") return "FLEX";
  if (folder === "AG" || folder === "AG-TUM") return "AG";
  if (folder === "TUM") return "TUM";
  return null;
}

function makeIndividualEntry({ relImage, index, folder }) {
  const type = folderToType(folder);
  if (!type) {
    console.warn(`skip individual folder: ${folder}`);
    return null;
  }
  /** ESCOLAR individuals do not carry DV — keep catalog value at 0. */
  const value = 0;
  const code = `${folder}-${index}`;
  const entry = {
    id: `fgx-individual-${slugify(`${type}-${index}`)}`,
    code: "FGX",
    elementFamily: "individual",
    type,
    coordinates: codeToCoordinates(code),
    image: relImage.replace(/\\/g, "/"),
    value,
    filters: PAIRS_FILTERS,
  };
  /** Individual EQ statics — 2" hold (ESCOLAR). */
  if (type === "EQ") {
    entry.holdDuration = '2"';
  }
  return entry;
}

const entries = [];

const pairsRoot = path.join(publicFgx, "pairs");

for (const file of listPngs(path.join(pairsRoot, "balance"))) {
  const e = makeRowEntry({
    elementFamily: "balance",
    relImage: `pairs/balance/${file}`,
    basename: file,
  });
  if (e) entries.push(e);
}

for (const file of listPngs(path.join(pairsRoot, "dynamic"))) {
  const e = makeRowEntry({
    elementFamily: "dynamic",
    relImage: `pairs/dynamic/${file}`,
    basename: file,
  });
  if (e) entries.push(e);
}

const individualRoot = path.join(publicFgx, "individuals");
if (fs.existsSync(individualRoot)) {
  for (const folder of fs.readdirSync(individualRoot, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const dir = path.join(individualRoot, folder.name);
    for (const file of listPngs(dir)) {
      const m = file.match(/^(\d+)\.png$/i);
      if (!m) continue;
      const e = makeIndividualEntry({
        relImage: `individuals/${folder.name}/${file}`,
        index: Number(m[1]),
        folder: folder.name,
      });
      if (e) entries.push(e);
    }
  }
}

const manifest = {
  version: 1,
  code: "FGX",
  description:
    "Catálogo FGX ESCOLAR — Parejas. elementFamily: balance|dynamic|individual; type: EQ|FLEX|AG|TUM.",
  entries,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${manifestPath}`);
