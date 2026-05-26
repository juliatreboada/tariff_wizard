# Step 2 prerequisites

Step 2 adds the **first real form**: the **right-column header** with validation and wizard state.

Field list is defined in [CONTEXT.md](./CONTEXT.md). UX split in [UX.md](./UX.md).

## Checklist

- [x] Primary user: coach
- [x] First sheet type: pair
- [x] Header fields identified (see CONTEXT)
- [x] Reference files in `reference/`: `tariff_example.pdf`, `BASE.xls`
- [x] Labels from BASE.xls → [FIELD-LABELS.md](./FIELD-LABELS.md)
- [x] Level & category rules → [LEVEL-AND-CATEGORY.md](./LEVEL-AND-CATEGORY.md) + `lib/tariff/enums.ts`
- [x] Step 2 implemented (form + Zod + store) — try `/wizard`

## What Step 2 will add

| Piece | File | Purpose |
|-------|------|---------|
| Zod schema | `lib/tariff/schema.ts` | `header` + `teamType`; base name array length rules |
| Store | `lib/tariff/store.ts` | Persist header between wizard steps |
| Form steps | `components/wizard/steps/` | Paso 1 & 2 fields (see UX.md) |
| i18n | `lib/i18n/messages/es.ts` | Labels for each field |

We will **not** implement difficulty/value calculation or element rows in Step 2.

## Reference files

Place on your machine (gitignored):

- `reference/tariff_example.pdf`
- `reference/BASE.xls`

See [reference/README.example.md](../reference/README.example.md).
