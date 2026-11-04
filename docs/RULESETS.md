# Rulesets — competition rules as config

Each competition's rules live in one `Ruleset` object in [`lib/tariff/rulesets/`](../lib/tariff/rulesets/). The store, element picker, sheet, rules checklist and wizard all read from it, so no routine rule checks `levelSystem === "Escolar"`. (Federation facts that are not routine rules — which category list a level uses, when D-SCORE is DV/100 — stay in `lib/tariff/level-category.ts`.)

| File | What |
|------|------|
| [`types.ts`](../lib/tariff/rulesets/types.ts) | The `Ruleset` shape: limits, penalties, role assignment, display |
| [`fgx-escolar.ts`](../lib/tariff/rulesets/fgx-escolar.ts) | FGX ESCOLAR (2027 rules) |
| [`rfeg-base.ts`](../lib/tariff/rulesets/rfeg-base.ts) | RFEG Base — Alevín, Infantil, Cadete (Código 2026) |
| [`slots.ts`](../lib/tariff/rulesets/slots.ts) | Slots per block and category, an element's role, its table row |
| [`constraints.ts`](../lib/tariff/rulesets/constraints.ts) | Why an element can't be added (`addProblem`) — used by the store and the picker |
| [`index.ts`](../lib/tariff/rulesets/index.ts) | Registry (`RULESETS`) and `rulesetFor(header)` |
| [`roles.ts`](../lib/tariff/rulesets/roles.ts) | Compulsory / optional assignment |
| [`evaluate.ts`](../lib/tariff/rulesets/evaluate.ts) | Checklist and penalties |

A sheet follows the ruleset whose `levelSystem` matches its header. Levels without a ruleset have no limits or penalties, and the wizard shows them as "coming soon".

## The two rulesets

| | ESCOLAR | BASE |
|--|--|--|
| Balance, pairs | 1 compulsory + 1 optional | 2 compulsory + 1 optional |
| Balance, groups | 1 + 1 | 1 + 1 |
| Dynamic, pairs and groups | 1 + 1 | 2 + 1 |
| Compulsory vs optional (`roleAssignment`) | `higher-value-compulsory`: among the FGX table's elements the higher value is compulsory | `by-table`: the sheet's own age group's table is compulsory |
| Optional from another table (`optionalTables`) | any Base age group (Alevín, Infantil, Cadete), same category — always optional | Alevín → Base Infantil, Cto. España Alevín; Infantil → Base Cadete, Cto. España Infantil; Cadete → FIG Age Group 11-16 — always optional |
| Optional's row may not hold the same element as a compulsory (`optionalNotInCompulsoryRow`) | no | yes |
| Compulsory from different rows | no | yes |
| Difficulty | compulsory only | compulsory only |
| Missing element | 0.5 each | 1 each |
| Individuals | 3 sets; 1 point if any missing | 3 sets (≥1 tumbling); 1 point if any missing — **coming soon** (`individuals.available: false`) |

Optionals should come from a higher level. For BASE, the RFEG *Programa técnico Campeonato Nacional Base y Clubes* (approved 26 Sept 2025; Anexo, tabla 1) allows: Alevín → TOD Base Infantil, TOD Alevín, TOD FIG; Infantil → TOD Base Cadete, TOD Infantil, TOD FIG; Cadete → TOD Age Group 11-16, TOD FIG (WG from 2027). "TOD Alevín / Infantil" are the Campeonato de España tables; "TOD Age Group 11-16" is the FIG Pre-Youth compulsory table (catalog `FIG`; Tríos = Women's Group, Cuartetos = Men's Group). A Base Parejas sheet sees their three pair tables (femenina, masculina, mixta) separately (`TableRef.categories`). TOD FIG isn't in the catalog yet. Base Cadete may not use horizontal 360º/540º/720º twists as optionals (`notOptional`: 11-16 Women's Group dynamic ROW I Box 4). The programme asks for optionals from rows "different from the compulsory ones"; across tables the coach reads that as "not a row holding the same element" (below). ESCOLAR may take its optional from any Base age group.

**Optional value ranges** (`optionalValueRanges`, [`optional-value-ranges.ts`](../lib/tariff/rulesets/optional-value-ranges.ts)). The programmes give the value an optional must have, in TOD WG (FIG) points. Base, Cto. España and 11-16 compulsory tables print tenths (0 / 0,1 / … / 0,5), not points, so their elements aren't held to it; it applies to optionals from TOD WG (and the 11-16 optional elements appendix, valued in points) once those catalogs exist. Until then the checklist shows it under each optional ("de TOD WG: valor 0–4").

| Optional (pairs bal. / dyn. · groups bal. / dyn.) | 2026 | 2027 |
|--|--|--|
| Base Alevín | 0–4 / 0–4 · 0–6 / 0–4 | same |
| Base Infantil | 0–6 / 0–6 · 0–10 / 0–6 | same |
| Base Cadete | 1–6 / 1–8 · 1–12 / 1–8 | same |
| Cto. España Alevín | 1–6 / 1–6 · 1–10 / 1–6 | 1–8 / 1–12 · 1–12 / 1–12 |
| Cto. España Infantil | 1–6 / 1–8 · 1–12 / 1–8 | 1–8 / 1–12 · 1–12 / 1–12 |
| Cto. España Cadete | 1–6 / 1–10 · 1–14 / 1–10 | 1–9 / 1–14 · 1–16 / 1–14 |

The app uses 2027. Base Cadete pairs balance: the requirement text says 1–6 held 3", the summary table 1–8; we follow the text. The España ranges wait for an España ruleset (`RFEG_ESPANA_OPTIONAL_VALUE_RANGES`).

Still to do (same programmes): the top standing on the base's hands or feet with the base on the floor only in Alevín and Infantil; individuals from TOD 11-16 (Appendix 3, page 34) / WG with one tumbling; "no element above 4 / 6 / 8 difficulty values" in Base (2027 España: 10 for every age).

**2027 programmes.** Mostly "FIG" → "WG" (World Gymnastics). Base Alevín / Infantil / Cadete rules are unchanged; Cto. España optional ranges widened (above). The 2027 España summary table merges "Alevín e Infantil" (compulsory from TOD Infantil), which contradicts its own Alevín text (TOD Alevín) — we follow the text.

**Same element in another table.** In BASE an optional can't come from a row that holds the same element as one of the block's compulsory elements (e.g. Alevín Parejas dynamic ROW I C is Infantil ROW I B, so nothing from Infantil ROW I can be the optional). Which cells are the same element — Base age groups with each other, Base with the Cto. España table of the same age, and Base Cadete with the 11-16 tables (links across catalogs: `scripts/same-elements.mjs` puts them on both sides, `scripts/validate-catalog.mjs` checks they exist and link back) — is in [`catalog/same-elements.json`](../catalog/same-elements.json), reviewed by the coach; the generator turns it into `sameAs` on each entry. A cell with two figures ("OR") can match two cells, so these are links between cells rather than one id per element. A requirement the catalog can't offer yet (Base individuals) shows as "próximamente" in the checklist and is **not** penalised.

**Add-ons.** In Base Cuartetos balance, ROW III is a plus value attached to a pyramid (black arrow in the tables), not an element of its own. The catalog entry lists the pyramids in `attachesTo`; in the routine it is stored on the pyramid (`RoutineItem.addOn`), shares its sheet cell, and adds its value. Removing or replacing the pyramid with one it can't attach to removes it.

## Changing a rule

Edit the numbers in the ruleset (e.g. `penalties.missingIndividuals`), then update the matching test in `lib/tariff/store.test.ts` or `lib/tariff/rulesets/evaluate.test.ts`.

## Adding a competition

1. Add its catalog: `catalog/<CODE>/manifest.json` + images in `public/catalog/<CODE>/`, register the code in `CATALOG_IDS` and in `lib/tariff/catalog/load-catalog.ts`, run `npm run validate-catalog`. Entry ids must start with the code in lower case (`rfeg-…`) so they never clash with another catalog's.
2. Write `lib/tariff/rulesets/<code>-<level>.ts` and add it to `RULESETS`.
3. Add scenario tests for its rules. `rulesets.test.ts` checks every ruleset is consistent automatically.
4. Update the wizard hint texts in `lib/i18n/messages/es.ts` (`levelSystemAvailability`, `levelAgeAvailability`).
5. Compare a printed sheet with an official example.

## Known follow-ups

- **Rulesets match on level system only.** If categories or ages within one level need different rules, extend `RulesetTarget` and `rulesetFor`.
- **Base tumbling requirement.** "At least 1 tumbling individual" is not checked yet; add it with the FIG individual pictures.
- **Higher-level optionals.** When Nacional / FIG catalogs arrive, Base optionals should come from them (today: older Base age groups).
