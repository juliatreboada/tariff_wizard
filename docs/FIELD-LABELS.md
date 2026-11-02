# Field labels (from `reference/BASE.xls`)

Inputs and screens show **Spanish** labels (`fieldLabels` in [`lib/i18n/messages/es.ts`](../lib/i18n/messages/es.ts)). The **printed official sheet** keeps the **English** labels of the federation form's right column. TOP and BASE stay as they are everywhere.

## Header inputs (Step 2)

| Key | Input label (Spanish) | Sheet label (printed) |
|-----|-----------------------|-----------------------|
| `participationNumber` | Número de participación (opcional) | PARTICIPATION NUMBER |
| `country` | País (opcional) | COUNTRY |
| `clubName` | Club | CLUB |
| `topName` | TOP | TOP |
| `baseNames` | BASE | BASE |
| `contactName` | Nombre | NAME |
| `contactPhone` | Teléfono | TEL |
| `competition` | Competición | COMPETITION |
| `levelSystem` + `levelAge` | Nivel + Categoría de edad | LEVEL (two selections — see [LEVEL-AND-CATEGORY.md](./LEVEL-AND-CATEGORY.md)) |
| `category` | Categoría | CATEGORY |
| `exercise` | Ejercicio | EXERCISE |

## Calculated / breakdown (not Step 2 header form)

| Sheet label | Role |
|-------------|------|
| DIFFICULTY | Calculated total |
| D-SCORE | Calculated |
| DV | Calculated |
| VALUE | **Total** value (calculated) |
| **BALANCE** | Breakdown row — balance element values |
| **DYNAMIC** | Breakdown row — dynamic element values |
| **INDIVIDUAL** | Breakdown row — individual element values |

BALANCE / DYNAMIC / INDIVIDUAL are **not** the EXERCISE dropdown. See [LEVEL-AND-CATEGORY.md](./LEVEL-AND-CATEGORY.md).
