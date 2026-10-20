# Rulesets — competition rules as config

Each competition's rules live in one `Ruleset` object in [`lib/tariff/rulesets/`](../lib/tariff/rulesets/). The store, element picker, sheet, rules checklist and wizard all read from it, so no routine rule checks `levelSystem === "Escolar"`. (Federation facts that are not routine rules — which category list a level uses, when D-SCORE is DV/100 — stay in `lib/tariff/level-category.ts`.)

| File | What |
|------|------|
| [`types.ts`](../lib/tariff/rulesets/types.ts) | The `Ruleset` shape: limits, penalties, role assignment, display |
| [`fgx-escolar.ts`](../lib/tariff/rulesets/fgx-escolar.ts) | FGX ESCOLAR (2027 rules) |
| [`index.ts`](../lib/tariff/rulesets/index.ts) | Registry (`RULESETS`) and `rulesetFor(header)` |
| [`roles.ts`](../lib/tariff/rulesets/roles.ts) | Compulsory / optional assignment |
| [`evaluate.ts`](../lib/tariff/rulesets/evaluate.ts) | Checklist and penalties |

A sheet follows the ruleset whose `levelSystem` matches its header. Levels without a ruleset have no limits or penalties, and the wizard shows them as "coming soon".

## Changing a rule

Edit the numbers in the ruleset (e.g. `penalties.missingIndividuals`), then update the matching test in `lib/tariff/store.test.ts` or `lib/tariff/rulesets/evaluate.test.ts`.

## Adding a competition

1. Add its catalog: `catalog/<CODE>/manifest.json` + images in `public/catalog/<CODE>/`, register the code in `CATALOG_IDS` and in `lib/tariff/catalog/load-catalog.ts`, run `npm run validate-catalog`.
2. Write `lib/tariff/rulesets/<code>-<level>.ts` and add it to `RULESETS`.
3. Add scenario tests for its rules. `rulesets.test.ts` checks every ruleset is consistent automatically.
4. Update the wizard hint texts in `lib/i18n/messages/es.ts` (`levelSystemAvailability`, `levelAgeAvailability`).
5. Compare a printed sheet with an official example.

## Known follow-ups

- **Placed elements don't record their catalog.** Images and reloads assume the default catalog (FGX). Add a catalog code to `PlacedElement` (with a migration for saved sheets) when the second catalog arrives.
- **Rulesets match on level system only.** If categories or ages within one level need different rules, extend `RulesetTarget` and `rulesetFor`.
- **No same-row restriction option.** FGX 2027 allows two elements from one row; a ruleset that forbids it needs a new setting and picker support.
