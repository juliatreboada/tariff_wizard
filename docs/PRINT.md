# Print and PDF export (official format)

Competition output must match **`reference/tariff_example.pdf`** and **`reference/BASE.xls`**, not the simplified on-screen editor grid.

## Official layout (implemented)

| Area | Structure |
|------|-----------|
| **Title band** | `DIFICULTAD DE LA RUTINA`, As / Pages |
| **Main body** | 3 blocks (Balance, Dynamic, Combined) |
| **Per block** | 9 element columns (fixed); image row; VALUE (4 sub-cells); SH; TOP; BASE |
| **Block 3 footer** | `TF:`, `SR:`, `SIZE:` |
| **Right column** | PARTICIPATION NUMBER, COUNTRY, CLUB, GYMNASTS, TOP, BASE×2, CONTACT PERSON, NAME, TEL, COMPETITION, LEVEL, CATEGORY, EXERCISE, DIFFICULTY, D-SCORE, DV, VALUE, BALANCE, DYNAMIC, INDIVIDUAL |

Constants: [`lib/tariff/official-sheet-layout.ts`](../lib/tariff/official-sheet-layout.ts)  
Component: [`components/sheet/TariffSheet.tsx`](../components/sheet/TariffSheet.tsx)

## Data mapping (pair v1)

- **Block 1 (Balance):** elements placed in order (up to 9 columns per block). Column number in meta row only when filled. Blank columns between unlinked elements.
- **Blocks 2–3:** empty until Dynamic / Combined pickers exist.
- **DIFFICULTY / D-SCORE / DV:** placeholders (`0.0`) until difficulty rules are implemented.

## A4 fit

The TS is laid out for **one A4 landscape page**:

- **Outer margin:** 10 mm (`@page` / white page frame on screen).
- **Inner padding:** ~5–6 mm around grid + sidebar (content not flush to the page edge).
- **Gap** between element grid and right header column (~3 mm).
- **Between block rows:** same 1 px line as the rest of the grid (no blank gap).

Preview (`/sheet/view`) and print use the same dimensions.

## How to print

1. `/sheet` → build routine → **Ver hoja TS**
2. `/sheet/print` → **Imprimir / Guardar PDF**
3. Browser dialog: **Landscape**, **Background graphics** on

## Still different from the PDF (known gaps)

- Federation logo / stamp (top right of example)
- Fine-grained FIG scoring in every mini-cell (we only show element **value** in the last mini-cell)
- Pixel-perfect column widths vs Excel
- Filled **DIFFICULTY** chain when rules are coded

Compare side-by-side with `reference/tariff_example.pdf` after each change.
