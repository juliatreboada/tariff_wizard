# Product & domain context — Tariff Wizard

References (local): `reference/tariff_example.pdf`, `reference/BASE.xls` in [`reference/`](../reference/).

- **Labels:** [FIELD-LABELS.md](./FIELD-LABELS.md)
- **Level & category rules:** [LEVEL-AND-CATEGORY.md](./LEVEL-AND-CATEGORY.md)
- **Code lists:** [`lib/tariff/enums.ts`](../lib/tariff/enums.ts)

---

## Users & scope

| Decision | Choice |
|----------|--------|
| Primary user | **Coach** |
| First sheet type | **Pair** (1 top + 1 base) |

---

## Header fields (summary)

| Field | Required | Notes |
|-------|----------|--------|
| PARTICIPATION NUMBER | No | Can fill later |
| COUNTRY | No | |
| CLUB | Yes | |
| TOP / BASE | Yes | Count by team type |
| CONTACT NAME / TEL | Yes | Phone format rules in code (Step 2) |
| COMPETITION | Yes | |
| LEVEL | Yes | Two-part: system + age — [LEVEL-AND-CATEGORY.md](./LEVEL-AND-CATEGORY.md) |
| CATEGORY | Yes | Depends on level system |
| EXERCISE | Yes | `Balance` \| `Dynamic` \| `Combined` |

---

## LEVEL & CATEGORY (confirmed)

See [LEVEL-AND-CATEGORY.md](./LEVEL-AND-CATEGORY.md). Implemented in:

- [`lib/tariff/enums.ts`](../lib/tariff/enums.ts)
- [`lib/tariff/level-category.ts`](../lib/tariff/level-category.ts)

**Storage:** TypeScript constants for v1 — **no database** unless lists need frequent edits without deploy.

---

## EXERCISE vs VALUE rows

| | EXERCISE (header) | BALANCE / DYNAMIC / INDIVIDUAL (under VALUE) |
|--|-------------------|-----------------------------------------------|
| **What** | Routine type for this sheet | Subtotals by element type |
| **When** | Step 2 form | After element entry / calculation |
| **Values** | Balance, Dynamic, Combined | Numbers (display + sum to VALUE) |

---

## Calculated header outputs (read-only later)

DIFFICULTY, D-SCORE, DV, **VALUE** (total). VALUE is built from the three breakdown rows.

---

## Data shape (Step 2)

```ts
type TariffHeader = {
  participationNumber?: string;
  country?: string;
  clubName: string;
  topName: string;
  baseNames: string[];
  contactName: string;
  contactPhone: string;
  competition: string;
  levelSystem: "Base" | "Escolar" | "RFEG" | "FIG";
  levelAge: string; // valid for chosen system
  category: string;
  categoryCode?: "W2" | "M2" | "Mx2" | "W3" | "M4"; // optional alias
  exercise: "Balance" | "Dynamic" | "Combined";
};

// Later — not header
type ValueBreakdown = {
  balance: number;
  dynamic: number;
  individual: number;
};
```

---

## Checklist

- [x] Reference files in `reference/`
- [x] Participation number optional
- [x] Exact labels from BASE.xls
- [x] Exercise enum
- [x] Level two-part + category rules
- [x] VALUE breakdown rows (Balance, Dynamic, Individual)
- [x] Enums in code (no DB for v1)
- [x] Step 2: form + Zod + store (`/wizard`, 3 pasos)
