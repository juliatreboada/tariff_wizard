/**
 * Build catalog/RFEG/manifest.json from PNGs under public/catalog/RFEG/.
 *
 * Two sections, both "Código 2026", cut with scripts/cut-table-cells.mjs into
 * <section>/<age>/<team>/<balance|dynamic>/ROW-<row>-<col>.png:
 * - base: "Tablas de dificultad Cto. Nacional Base Acro 2026" (level Base;
 *   Alevín, Infantil, Cadete; Parejas, Tríos, Cuartetos).
 * - espana: "Tablas de dificultad Cto. España Acro" (level RFEG; Alevín,
 *   Infantil; Parejas Femeninas / Masculinas / Mixtas, Tríos, Cuartetos).
 * Column values: A=0, B=0.1, C=0.2, D=0.3. Every balance element holds 3".
 *
 * Cells that are the same element across tables come from
 * catalog/same-elements.json and become `sameAs` (scripts/same-elements.mjs).
 *
 * Usage: node scripts/generate-rfeg-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applySameElements } from "./same-elements.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRfeg = path.join(root, "public/catalog/RFEG");
const manifestPath = path.join(root, "catalog/RFEG/manifest.json");

const COLUMN_VALUE = { A: 0, B: 0.1, C: 0.2, D: 0.3 };

/**
 * Rotation printed in each dynamic cell, by age → team → "ROW-col".
 * Transcribed from the Base 2026 tables; the pictures carry the same text.
 */
const BASE_ROTATIONS = {
  alevin: {
    pairs: {
      "I-B": "0/4", "I-C": "0/4", "I-D": "0/4",
      "II-B": "0/4", "II-C": "0/4 - 180º", "II-D": "0/4 - 360º",
      "III-B": "0/4", "III-C": "0/4", "III-D": "0/4",
      "IV-B": "0/4", "IV-C": "0/4", "IV-D": "0/4",
    },
    trios: {
      "I-B": "1/4 BACK", "I-C": "0/4", "I-D": "0/4 - 180º",
      "II-A": "0/4 FRONT", "II-B": "0/4 FRONT", "II-C": "0/4 FRONT", "II-D": "1/4 FRONT",
      "III-B": "0/4 FRONT - 180º", "III-C": "0/4 BACK", "III-D": "0/4 BACK",
      "IV-C": "1/4 BACK", "IV-D": "2/4 BACK",
    },
    cuartetos: {
      "I-C": "0/4 BACK", "I-D": "0/4 BACK",
      "II-B": "0/4 BACK", "II-C": "0/4 BACK", "II-D": "0/4 BACK",
      "III-B": "1/4 FRONT", "III-C": "1/4 FRONT", "III-D": "1/4 FRONT",
      "IV-B": "0/4", "IV-C": "0/4", "IV-D": "0/4 - 180º",
    },
  },
  infantil: {
    pairs: {
      "I-B": "0/4", "I-C": "0/4", "I-D": "0/4 - 180º",
      "II-A": "0/4", "II-B": "0/4 - 180º", "II-C": "0/4 - 360º", "II-D": "1/4 BACK",
      "III-A": "0/4", "III-B": "0/4", "III-C": "0/4", "III-D": "0/4 - 180º",
      "IV-A": "0/4", "IV-B": "0/4", "IV-C": "1/4 FRONT", "IV-D": "0/4 - 180º",
    },
    trios: {
      "I-A": "1/4 BACK", "I-B": "0/4", "I-C": "0/4 - 180º", "I-D": "0/4 - 360º",
      "II-A": "0/4", "II-B": "0/4 FRONT", "II-C": "1/4 FRONT", "II-D": "3/4 FRONT",
      "III-A": "0/4 BACK", "III-B": "0/4 BACK", "III-C": "0/4 BACK", "III-D": "1/4 BACK",
      "IV-B": "1/4 BACK", "IV-C": "2/4 BACK", "IV-D": "0/4",
    },
    cuartetos: {
      "I-B": "0/4 BACK", "I-C": "0/4 BACK", "I-D": "0/4 BACK",
      "II-B": "0/4 BACK", "II-C": "0/4 BACK", "II-D": "0/4 BACK",
      "III-B": "1/4 FRONT", "III-C": "1/4 FRONT", "III-D": "1/4 BACK",
      "IV-B": "0/4", "IV-C": "0/4 - 180º", "IV-D": "0/4 - 360º",
    },
  },
  cadete: {
    pairs: {
      "I-A": "0/4", "I-B": "0/4 - 180º", "I-C": "0/4 - 360º", "I-D": "0/4",
      "II-A": "0/4 - 180º", "II-B": "0/4 - 360º", "II-C": "1/4 BACK", "II-D": "1/4 BACK",
      "III-A": "0/4", "III-B": "0/4", "III-C": "0/4 - 180º", "III-D": "4/4 BACK",
      "IV-A": "0/4", "IV-B": "1/4 FRONT", "IV-C": "0/4 - 180º", "IV-D": "4/4 FRONT",
    },
    trios: {
      "I-A": "0/4", "I-B": "0/4 - 180º", "I-C": "0/4 - 360º", "I-D": "0/4 - 540º/720º",
      "II-A": "0/4 FRONT", "II-B": "1/4 FRONT", "II-C": "3/4 FRONT", "II-D": "4/4 FRONT",
      "III-A": "0/4 BACK", "III-B": "0/4 BACK", "III-C": "1/4 BACK", "III-D": "4/4 BACK",
      "IV-B": "2/4 BACK", "IV-C": "0/4", "IV-D": "3/4 BACK",
    },
    cuartetos: {
      "I-A": "0/4 BACK", "I-B": "0/4 BACK", "I-C": "0/4 BACK", "I-D": "4/4 BACK",
      "II-A": "0/4 BACK", "II-B": "0/4 BACK", "II-C": "0/4 BACK", "II-D": "0/4",
      "III-B": "1/4 FRONT", "III-C": "1/4 BACK", "III-D": "1/4 FRONT - 180º",
      "IV-A": "0/4", "IV-B": "0/4 - 180º", "IV-C": "0/4 - 360º", "IV-D": "3/4 BACK",
    },
  },
};

/** Same, for the Cto. España tables. null = no rotation printed (rondada elements). */
const ESPANA_ROTATIONS = {
  alevin: {
    pf: {
      "I-B": "0/4", "I-C": "0/4", "I-D": "0/4 - 180º",
      "II-B": "0/4", "II-C": "0/4 - 180º", "II-D": "1/4 FRONT",
      "III-B": null, "III-C": null, "III-D": "1/4 BACK",
      "IV-B": "0/4", "IV-C": "0/4", "IV-D": "0/4",
    },
    pm: {
      "I-A": "0/4", "I-B": "0/4", "I-C": "0/4", "I-D": "0/4",
      "II-B": "0/4", "II-C": "0/4", "II-D": "0/4",
      "III-B": "0/4", "III-C": "0/4", "III-D": "0/4",
      "IV-A": "0/4", "IV-B": "0/4", "IV-C": "0/4 - 180º", "IV-D": "0/4 - 360º",
    },
    pmx: {
      "I-A": "0/4", "I-B": "0/4", "I-C": "0/4 - 180º", "I-D": "0/4",
      "II-C": "1/4 BACK", "II-D": "0/4",
      "III-B": "0/4", "III-C": "0/4", "III-D": "0/4",
      "IV-B": "0/4", "IV-C": "1/4 BACK", "IV-D": "0/4",
    },
    trios: {
      "I-B": "0/4", "I-C": "0/4 - 180º", "I-D": "0/4 - 360º",
      "II-A": "0/4", "II-B": "0/4 FRONT", "II-C": "1/4 FRONT", "II-D": "3/4 FRONT",
      "III-A": "0/4", "III-B": "0/4", "III-C": "1/4 BACK", "III-D": "4/4 BACK",
      "IV-C": "2/4 BACK", "IV-D": "0/4",
    },
    cuartetos: {
      "I-B": "0/4", "I-C": "0/4", "I-D": "0/4",
      "II-B": "0/4", "II-C": "0/4", "II-D": "0/4",
      "III-C": "1/4 FRONT", "III-D": "1/4 BACK",
      "IV-B": "0/4", "IV-C": "0/4 - 180º", "IV-D": "0/4 - 360º",
    },
  },
  infantil: {
    pf: {
      "I-A": "0/4", "I-B": "0/4", "I-C": "0/4 - 180º", "I-D": "0/4",
      "II-A": "0/4", "II-B": "0/4 - 180º", "II-C": "1/4 FRONT", "II-D": "1/4 BACK - 180º",
      "III-A": "0/4", "III-B": "1/4 BACK", "III-C": "1/4 BACK", "III-D": "1/4 FRONT",
      "IV-A": "0/4", "IV-B": "0/4", "IV-C": "0/4", "IV-D": "4/4 BACK",
    },
    pm: {
      "I-A": "0/4", "I-B": "0/4", "I-C": "0/4", "I-D": "4/4 BACK",
      "II-A": "0/4", "II-B": "0/4", "II-C": "0/4 - 180º", "II-D": "0/4",
      "III-B": "0/4", "III-C": "0/4 - 180º", "III-D": "4/4 BACK",
      "IV-A": "0/4", "IV-B": "0/4", "IV-C": "0/4", "IV-D": "4/4 BACK",
    },
    pmx: {
      "I-B": "0/4", "I-C": "0/4 - 180º", "I-D": "0/4",
      "II-B": "1/4 BACK", "II-C": "0/4", "II-D": "1/4 FRONT",
      "III-A": "0/4", "III-B": "0/4", "III-C": "4/4 BACK", "III-D": "4/4 BACK",
      "IV-B": "0/4", "IV-C": "0/4", "IV-D": "4/4 FRONT",
    },
    trios: {
      "I-A": "0/4", "I-B": "0/4 - 180º", "I-C": "0/4 - 360º", "I-D": "0/4 - 540º",
      "II-A": "0/4 FRONT", "II-B": "1/4 FRONT", "II-C": "3/4 FRONT", "II-D": "4/4 FRONT",
      "III-A": "0/4", "III-B": "1/4 BACK", "III-C": "4/4 BACK", "III-D": "4/4 BACK",
      "IV-B": "2/4 BACK", "IV-C": "0/4", "IV-D": "3/4 BACK",
    },
    cuartetos: {
      "I-A": "0/4", "I-B": "0/4", "I-C": "0/4 - 180º", "I-D": "4/4 BACK",
      "II-B": "0/4", "II-C": "0/4", "II-D": "0/4",
      "III-B": "1/4 FRONT", "III-C": "1/4 BACK", "III-D": "1/4 FRONT - 180º",
      "IV-A": "0/4", "IV-B": "0/4 - 180º", "IV-C": "0/4 - 360º", "IV-D": "3/4 BACK",
    },
  },
};

/**
 * Cuartetos balance ROW III is a plus value, not an element of its own: it
 * attaches to one of these pyramids (marked with a black arrow in the tables).
 */
const SECTIONS = [
  {
    folder: "base",
    levelSystem: "Base",
    ages: [
      { folder: "alevin", levelAge: "Alevín" },
      { folder: "infantil", levelAge: "Infantil" },
      { folder: "cadete", levelAge: "Cadete" },
    ],
    teams: [
      { folder: "pairs", category: "Parejas" },
      { folder: "trios", category: "Tríos" },
      { folder: "cuartetos", category: "Cuartetos" },
    ],
    rotations: BASE_ROTATIONS,
    addOns: {
      alevin: { B: ["I-A", "I-B"], C: ["I-A", "I-B"], D: ["I-A", "I-B"] },
      infantil: { A: ["I-A"], B: ["I-A"], C: ["I-A"], D: ["I-D"] },
      cadete: { A: ["I-C"], B: ["I-C"], C: ["I-D", "II-D"], D: ["I-D", "II-D"] },
    },
  },
  {
    folder: "espana",
    levelSystem: "RFEG",
    ages: [
      { folder: "alevin", levelAge: "Alevín" },
      { folder: "infantil", levelAge: "Infantil" },
    ],
    teams: [
      { folder: "pf", category: "Pareja Femenina" },
      { folder: "pm", category: "Pareja Masculina" },
      { folder: "pmx", category: "Pareja Mixta" },
      { folder: "trios", category: "Tríos" },
      { folder: "cuartetos", category: "Cuartetos" },
    ],
    rotations: ESPANA_ROTATIONS,
    addOns: {
      alevin: { A: ["I-A"], B: ["I-A"], C: ["I-B", "I-D"], D: ["I-B", "I-D"] },
      infantil: { A: ["I-A", "I-D"], B: ["I-A", "I-D"], C: ["I-D", "II-D"], D: ["I-D", "II-D"] },
    },
  },
];

const entryId = (section, ageFolder, teamFolder, elementFamily, row, col) =>
  `rfeg-${section}-${ageFolder}-${teamFolder}-${elementFamily}-row-${row}-${col}`.toLowerCase();

function listPngs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^ROW-[IVX]+-[A-D]\.png$/.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const entries = [];
const problems = [];

for (const section of SECTIONS) {
  for (const age of section.ages) {
    for (const team of section.teams) {
      for (const elementFamily of ["balance", "dynamic"]) {
        const rel = `${section.folder}/${age.folder}/${team.folder}/${elementFamily}`;
        for (const file of listPngs(path.join(publicRfeg, rel))) {
          const [, row, col] = file.match(/^ROW-([IVX]+)-([A-D])\.png$/);
          const id = (r, c) => entryId(section.folder, age.folder, team.folder, elementFamily, r, c);
          const entry = {
            id: id(row, col),
            code: "RFEG",
            elementFamily,
            coordinates: `ROW-${row} ${col}`,
            image: `${rel}/${file}`,
            value: COLUMN_VALUE[col],
            filters: {
              levelSystems: [section.levelSystem],
              categories: [team.category],
              exercises: ["Combined"],
              levelAges: [age.levelAge],
            },
          };
          if (team.folder === "cuartetos" && elementFamily === "balance" && row === "III") {
            const pyramids = section.addOns[age.folder]?.[col];
            if (!pyramids) problems.push(`no pyramid for add-on ${rel}/${file}`);
            else {
              entry.attachesTo = pyramids.map((cell) => id(...cell.split("-")));
              for (const target of entry.attachesTo) {
                if (!fs.existsSync(path.join(publicRfeg, rel, `ROW-${target.split("-row-")[1].toUpperCase()}.png`))) {
                  problems.push(`${entry.id}: pyramid ${target} has no picture`);
                }
              }
            }
          }
          if (elementFamily === "balance") {
            entry.type = "EQ";
            entry.holdDuration = '3"';
          } else {
            const rotation = section.rotations[age.folder]?.[team.folder]?.[`${row}-${col}`];
            if (rotation === undefined) problems.push(`no rotation for ${rel}/${file}`);
            else if (rotation !== null) entry.rotation = rotation;
          }
          entries.push(entry);
        }
      }
    }
  }

  // Every transcribed rotation should match a picture.
  for (const [ageFolder, teams] of Object.entries(section.rotations)) {
    for (const [teamFolder, cells] of Object.entries(teams)) {
      for (const cell of Object.keys(cells)) {
        const rel = `${section.folder}/${ageFolder}/${teamFolder}/dynamic/ROW-${cell}.png`;
        if (!fs.existsSync(path.join(publicRfeg, rel))) problems.push(`rotation without picture: ${rel}`);
      }
    }
  }
}

// Same element in another table (reviewed by the coach): links both ways.
applySameElements(root, "RFEG", entries, problems);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const manifest = {
  version: 1,
  code: "RFEG",
  description:
    "Catálogo RFEG (Código 2026) — Base: Alevín, Infantil, Cadete; Cto. España: Alevín, Infantil. elementFamily: balance|dynamic.",
  entries,
};

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${path.relative(root, manifestPath)}`);
