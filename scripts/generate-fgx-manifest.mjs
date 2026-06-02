/**
 * Build catalog/FGX/manifest.json from PNGs under public/catalog/FGX/.
 * Column values (ESCOLAR): A=0, B=0.1, …, E=0.4.
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

/** Folder under public/catalog/FGX/ → filter category label */
const TEAM_CATALOGS = [
  { folder: "pairs", category: "Parejas" },
  { folder: "trios", category: "Tríos" },
  { folder: "cuartetos", category: "Cuartetos" },
];

const ESCOLAR_TEAM_CATEGORIES = TEAM_CATALOGS.map((t) => t.category);

const INDIVIDUALS_DIR = "individuals";

function escolarFilters(category) {
  return {
    levelSystems: ["Escolar"],
    categories: [category],
    exercises: ["Combined"],
  };
}

/** Individual figures are shared across Parejas, Tríos and Cuartetos. */
function escolarIndividualFilters() {
  return {
    levelSystems: ["Escolar"],
    categories: [...ESCOLAR_TEAM_CATEGORIES],
    exercises: ["Combined"],
  };
}

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

function entryId(teamFolder, elementFamily, code) {
  const slug = slugify(code);
  if (teamFolder === "pairs") {
    return `fgx-${elementFamily}-${slug}`;
  }
  return `fgx-${teamFolder}-${elementFamily}-${slug}`;
}

function makeRowEntry({ elementFamily, relImage, basename, category, teamFolder }) {
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
    id: entryId(teamFolder, elementFamily, parsed.code),
    code: "FGX",
    elementFamily,
    coordinates: codeToCoordinates(parsed.code),
    image: relImage.replace(/\\/g, "/"),
    value,
    filters: escolarFilters(category),
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
    filters: escolarIndividualFilters(),
  };
  if (type === "EQ") {
    entry.holdDuration = '2"';
  }
  return entry;
}

const entries = [];

for (const team of TEAM_CATALOGS) {
  const teamRoot = path.join(publicFgx, team.folder);
  if (!fs.existsSync(teamRoot)) continue;

  for (const file of listPngs(path.join(teamRoot, "balance"))) {
    const e = makeRowEntry({
      elementFamily: "balance",
      relImage: `${team.folder}/balance/${file}`,
      basename: file,
      category: team.category,
      teamFolder: team.folder,
    });
    if (e) entries.push(e);
  }

  for (const file of listPngs(path.join(teamRoot, "dynamic"))) {
    const e = makeRowEntry({
      elementFamily: "dynamic",
      relImage: `${team.folder}/dynamic/${file}`,
      basename: file,
      category: team.category,
      teamFolder: team.folder,
    });
    if (e) entries.push(e);
  }
}

const individualRoot = path.join(publicFgx, INDIVIDUALS_DIR);
if (fs.existsSync(individualRoot)) {
  for (const folder of fs.readdirSync(individualRoot, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const dir = path.join(individualRoot, folder.name);
    for (const file of listPngs(dir)) {
      const m = file.match(/^(\d+)\.png$/i);
      if (!m) continue;
      const e = makeIndividualEntry({
        relImage: `${INDIVIDUALS_DIR}/${folder.name}/${file}`,
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
    "Catálogo FGX ESCOLAR — Parejas, Tríos, Cuartetos. elementFamily: balance|dynamic|individual.",
  entries,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const byCategory = {};
for (const e of entries) {
  const cat = e.filters.categories[0];
  byCategory[cat] = (byCategory[cat] ?? 0) + 1;
}
console.log(`Wrote ${entries.length} entries to ${manifestPath}`);
for (const [cat, n] of Object.entries(byCategory)) {
  console.log(`  ${cat}: ${n}`);
}
