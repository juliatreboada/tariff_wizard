# Level, category, exercise & VALUE breakdown

How federation rules map to the wizard and to [`lib/tariff/enums.ts`](../lib/tariff/enums.ts).

---

## Database or code?

| Approach | When |
|----------|------|
| **Constants in `lib/tariff/` (v1)** | Lists are stable; you learn one place; deploy updates the app. **We use this now.** |
| **Database later** | Federation changes categories often; non-developers edit lists; multiple clubs share one backend. |

No database needed for Step 2. Category **codes** (`W2`, `M2`, …) live in `CATEGORY_CODES` as optional aliases, not a separate table.

---

## LEVEL — two-step choice

### Step A — system (`levelSystem`)

| Value | Meaning |
|-------|---------|
| **Base** | Base programme |
| **Escolar** | School programme |
| **RFEG** | Royal Spanish Gymnastics Federation track |
| **FIG** | International FIG track |

### Step B — age band (`levelAge`)

Depends on system:

| System | Options |
|--------|---------|
| **Escolar** | Benxamín, Alevín, Infantil, Absoluto |
| **Base** | Alevín, Infantil, Cadete, Junior, Senior |
| **RFEG** | Alevín, Infantil, Cadete, Juvenil, Pre-Junior, Junior, Senior |
| **FIG** | Cadete, Pre-Youth, Youth, Junior, Senior |

In the form: pick system → second dropdown only shows valid ages for that system.

Stored as:

```ts
{ levelSystem: "FIG", levelAge: "Junior" }
```

---

## CATEGORY — depends on level system

| If `levelSystem` is… | Category options |
|----------------------|------------------|
| **Escolar** or **Base** | Parejas, Tríos, Cuartetos |
| **RFEG** or **FIG** | Pareja Femenina, Pareja Masculina, Pareja Mixta, Tríos, Cuartetos |

Helpers: `getCategoryOptions(levelSystem)` in [`lib/tariff/level-category.ts`](../lib/tariff/level-category.ts).

### Short codes (optional on sheet / programs)

| Code | Full label (RFEG/FIG) |
|------|------------------------|
| W2 | Pareja Femenina |
| M2 | Pareja Masculina |
| Mx2 | Pareja Mixta |
| W3 | Tríos |
| M4 | Cuartetos |

For Escolar/Base, codes can still be shown next to Parejas/Tríos/Cuartetos if you want — we can map pair → W2 when saving later.

---

## EXERCISE (header) vs VALUE rows (body)

These are **different**:

| Concept | Field on sheet | Purpose |
|---------|----------------|---------|
| **Exercise** | EXERCISE | Which **routine** you are submitting: Balance, Dynamic, or Combined |
| **VALUE breakdown** | BALANCE, DYNAMIC, INDIVIDUAL (under VALUE) | **Subtotals** of element values by type — filled/calculated from the sheet body |

The wizard will:

1. Ask **EXERCISE** in the header (enum: Balance, Dynamic, Combined).
2. Later show **three read/write rows** matching the template under VALUE: BALANCE, DYNAMIC, INDIVIDUAL — where element values accumulate.

```text
VALUE  ─── total (calculated)
  BALANCE     ← sum of balance-type elements
  DYNAMIC     ← sum of dynamic-type elements
  INDIVIDUAL  ← sum of individual-type elements
```

Constants: `VALUE_BREAKDOWN_ROWS` in `enums.ts`.

---

## Pair-first note

For v1 we still build **pair** UI (1 top, 1 base). Category “Parejas” / “Pareja Femenina” etc. selects the team **type** on the sheet; base count validation uses category (e.g. Tríos → 2 bases) in a later step.
