# Element catalogs (FGX, RFEG, FIG)

| Catalog | Level | Built by |
|---------|-------|----------|
| `FGX` | ESCOLAR | `scripts/generate-fgx-manifest.mjs` |
| `RFEG` | BASE (Alevín, Infantil, Cadete) and Cto. España (Alevín, Infantil — optionals for Base) | `scripts/cut-table-cells.mjs` + `scripts/generate-rfeg-manifest.mjs` |
| `FIG` | Pre-Youth (11-16) compulsory tables (optionals for Base Cadete) | `scripts/cut-box-table.mjs` + `scripts/generate-fig-manifest.mjs` |

**RFEG Base** comes from the RFEG PDF "Tablas de dificultad Cto. Nacional Base Acro 2026". Each page is one table picture: render the pages (`pdftoppm -r 220 -png tables.pdf page`), cut each with `node scripts/cut-table-cells.mjs <page.png> public/catalog/RFEG/base/<age>/<pairs|trios|cuartetos>/<balance|dynamic>`, then run `node scripts/generate-rfeg-manifest.mjs`. Dynamic rotations and the Cuartetos ROW III add-on links are typed into the generator; same-element links across age groups come from `catalog/same-elements.json` (become `sameAs`). **Cto. España** tables ("Tablas de dificultad Cto. España Acro", Código 2026) live under `public/catalog/RFEG/espana/<age>/<pf|pm|pmx|trios|cuartetos>/…`, with level system `RFEG` and the federation categories (Pareja Femenina / Masculina / Mixta). They're only offered as Base optionals today. Entries carry `filters.levelAges` because each age group has its own tables; `attachesTo` marks add-ons (see [RULESETS.md](RULESETS.md)).

**FIG Pre-Youth (11-16)** comes from *ACRO Youth & Junior Rules 2025-2028*, Appendix 3, pages 29-33 (Women's, Men's, Mixed Pair, Women's Group = Tríos, Men's Group = Cuartetos; balance and dynamic on each page). These tables have numbered boxes per row instead of A–D columns, so `scripts/cut-box-table.mjs` cuts them using the PDF's word positions (`pdftotext -bbox`) for box labels and values. The reviewed values, holds and rotations are in [`catalog/FIG/pre-youth-11-16.json`](../catalog/FIG/pre-youth-11-16.json); `node scripts/generate-fig-manifest.mjs` builds `catalog/FIG/manifest.json` from it and the pictures in `public/catalog/FIG/pre-youth/<team>/<balance|dynamic|tops>/`. Coordinates are `ROW-I 4` (box), `ROW-I 4 360º` (a box with two values), `ROW-II 3b` and `T15` (Men's Group top, an add-on on the ROW I / II structures the coach marked for it in `tops.boxes[…].attachTo`). Level `FIG`, age `Pre-Youth`.

**Cells with alternative pictures ("OR").** In the Base, Cto. España and 11-16 tables, a cell whose drawing offers alternatives (marked "OR") is split into options, reviewed by the coach on a page where each option is a box on the cell's drawing: `catalog/<CODE>/cell-options.json` maps the cell's picture to its option pictures (the cell with the other options and the "OR" blanked out). The generators (`scripts/cell-options.mjs`) turn such a cell into one entry per option — id `<cell id>-a`, `-b`…, same value, coordinates and rules, `number` = the cell's id, and a `variant` so the picker shows the cell first and then its options. A routine uses one option of a cell (`addProblem` compares `number`). Reviewed same-element pairs and `attachesTo` that name a cell stand for all its options. Saved sheets that hold a cell later split get its first option. RFEG and FIG link to each other, so build them with `npm run generate-catalogs` (it runs both generators until neither manifest changes).

**FIG Table of Difficulty individuals** come from *ACRO Table of Difficulty 2025-2028*, printed pages 111-119 (PDF pages 114-122): Balance (111-112), Flexibility (113), Agilities (114-118), Tumbling (119). `scripts/cut-tod-individuals.mjs` cuts them (`grid` for the boxed pages, `landing` for agilities with a landing table A–I, `tumbling` for the salto table); the reviewed values are in [`catalog/FIG/tod-individuals.json`](../catalog/FIG/tod-individuals.json) and the pictures in `public/catalog/FIG/tod/`. On the sheet they're written by ID (`018`), agilities with a landing by ID and letter (`118 C`, picture = element + landing; a landing with a value but no picture in the ToD, like 147 G, is left out) and tumbling by the page (`119`). Boxes with several pictures (001, 003, 014, 016, 019, 020, 021, 028, 042, 062, 063, 074, 075, 076, 102, tumbling column 1; reviewed by the coach) list them as `options` in the data file: one entry per picture with its own value (+1 / −1 applied), written on the sheet with the box's ID. Landings, twists and options are `variant`s: the picker shows the element (or tumbling column) first, then a step with only its choices. Entries of one box share `number`, so a gymnast can do only one of them. Entries carry `elementFamily: "individual"`, type EQ / FLEX / AG / TUM, level `FIG` for every category.

The FGX notes below are the original guide.

How pictures and codes are stored **without a database**. The picker (Phase D) reads this data.

## Folder layout

```text
catalog/FGX/manifest.json              ← edit here (metadata)
public/catalog/FGX/pairs/balance/    ← PNG files (parejas — equilibrio)
public/catalog/FGX/pairs/dynamic/    ← PNG files (parejas — dinámico)
public/catalog/FGX/individuals/      ← PNG files (individuales)
```

| File | Role |
|------|------|
| `manifest.json` | List of elements: codes, values, filters, image path |
| `public/catalog/FGX/…` | Images the coach selects |

**Rule:** `image` in the manifest is relative to `public/catalog/FGX/`.

**Rule:** every `id` starts with the catalog code in lower case (`fgx-…`), so ids are unique across catalogs. A placed element stores both the entry id (`catalogId`) and its catalog (`catalog`); sheets saved before `catalog` existed load as FGX. Opening a sheet (current or saved) refreshes each element from its catalog entry, so a corrected value or image reaches old sheets too.

## Add a new element

1. Add `public/catalog/FGX/pairs/balance/MY-ELEMENT.png`
2. Add an entry to [`catalog/FGX/manifest.json`](../catalog/FGX/manifest.json):

```json
{
  "id": "fgx-balance-my-element",
  "code": "FGX",
  "elementFamily": "balance",
  "subtype": "mount",
  "coordinates": "ROW-VI B",
  "image": "pairs/balance/MY-ELEMENT.png",
  "value": 2.0,
  "filters": {
    "levelSystems": ["RFEG", "FIG"],
    "categories": ["Pareja Femenina"],
    "exercises": ["Balance", "Combined"]
  }
}
```

3. Validate:

```bash
npm run validate-catalog
```

## Filters

An entry appears only if the sheet **header** matches:

- `filters.levelSystems` → header `levelSystem`
- `filters.categories` → header `category` (exact label)
- `filters.exercises` → header `exercise`

## Sheet mapping (Galician rules)

| Manifest field | On the tariff sheet |
|----------------|---------------------|
| `image` | Big cell (TOP/BASE area) |
| `coordinates` | **SH** row and picker labels |
| `value` | **VALUE** row (element column) |

## Code

| Module | Role |
|--------|------|
| [`lib/tariff/catalog/load-catalog.ts`](../lib/tariff/catalog/load-catalog.ts) | Loads `catalog/FGX/manifest.json` |
| [`lib/tariff/catalog/filter-catalog.ts`](../lib/tariff/catalog/filter-catalog.ts) | Filters by header |

## Optional: large image libraries in git

```gitignore
/public/catalog/FGX/**
!/public/catalog/FGX/pairs/balance/ROW-III-C.png
```

Keep `catalog/FGX/manifest.json` committed.

**TOD WG (to come).** Free-composition rulesets (`lib/tariff/rulesets/fig-open.ts`) take pair/group elements from catalog `FIG`, level `FIG`, age `TOD WG`. Each entry should carry `tags` for what it is (`static-hold`, `handstand`, `pyramid`, `flight`, `catch`, `landing`), `pyramidCategory` for group pyramids, and `rotation` for dynamic elements (e.g. "4/4 BACK"). In TOD WG an element is built from parts (top position + base position, mount, motion); a part that attaches to another is an add-on (`attachesTo`) and its tags count for the element.
