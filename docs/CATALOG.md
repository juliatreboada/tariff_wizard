# Element catalog (FGX — Balance v1)

How pictures and codes are stored **without a database**. The picker (Phase D) reads this data.

## Folder layout

```text
catalog/FGX/manifest.json          ← edit here (metadata)
public/catalog/FGX/balance/      ← PNG files (served by the app)
  ROW-III-C.png
  ROW-IV-A.png
  ROW-V-D.png
```

| File | Role |
|------|------|
| `manifest.json` | List of elements: codes, values, filters, image path |
| `public/catalog/FGX/…` | Images the coach selects |

**Rule:** `image` in the manifest is relative to `public/catalog/FGX/`.

## Add a new element

1. Add `public/catalog/FGX/balance/MY-ELEMENT.png`
2. Add an entry to [`catalog/FGX/manifest.json`](../catalog/FGX/manifest.json):

```json
{
  "id": "fgx-balance-my-element",
  "region": "FGX",
  "elementFamily": "balance",
  "subtype": "mount",
  "label": "My element",
  "image": "balance/MY-ELEMENT.png",
  "galicianCode": "ROW-VI-B",
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
| `galicianCode` | **SH** row |
| `value` | **VALUE** row (element column) |

## Code

| Module | Role |
|--------|------|
| [`lib/tariff/catalog/load-catalog.ts`](../lib/tariff/catalog/load-catalog.ts) | Loads `catalog/FGX/manifest.json` |
| [`lib/tariff/catalog/filter-catalog.ts`](../lib/tariff/catalog/filter-catalog.ts) | Filters by header |

## Optional: large image libraries in git

```gitignore
/public/catalog/FGX/**
!/public/catalog/FGX/balance/ROW-III-C.png
```

Keep `catalog/FGX/manifest.json` committed.
