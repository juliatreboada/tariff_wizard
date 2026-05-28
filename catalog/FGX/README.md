# Catálogo FGX

## Archivos

| Qué | Dónde |
|-----|--------|
| **Lista de elementos** (editas esto) | [`manifest.json`](manifest.json) |
| **Imágenes parejas** (equilibrio / dinámico) | [`public/catalog/FGX/pairs/`](../../public/catalog/FGX/pairs/) |
| **Imágenes individuales** | [`public/catalog/FGX/individuals/`](../../public/catalog/FGX/individuals/) |

El campo `image` en el manifest es la ruta **desde** `public/catalog/FGX/`.

Ejemplo: `"image": "pairs/balance/ROW-III-C.png"` → archivo  
`public/catalog/FGX/pairs/balance/ROW-III-C.png`

## Regenerar manifest desde PNGs (ESCOLAR parejas)

Si tienes las carpetas `pairs/balance/`, `pairs/dynamic/` e `individuals/` rellenas:

```bash
npm run generate-catalog
npm run validate-catalog
```

El script asigna valores por columna **A=0, B=0.1, C=0.2, D=0.3, E=0.4** (parejas), individuales **value=0**, y filtros `Escolar` + `Parejas` + `Combined`.

## Añadir un elemento a mano

1. Copia el PNG a `public/catalog/FGX/pairs/balance/TU-ARCHIVO.png` (o `pairs/dynamic/…`)
2. Añade un bloque en `entries` en `manifest.json` (copia uno existente y cambia `id`, `coordinates`, `value`, `image`, `elementFamily`, `type`, `filters`)
3. Ejecuta: `npm run validate-catalog`

## Campos importantes

| Campo | Uso en la hoja |
|-------|----------------|
| `coordinates` | Coordenadas de tabla (ej. `ROW-I A`) — fila **SH** y UI |
| `value` | Número en fila **VALUE** (columna del elemento) |
| `image` | Imagen en la celda grande (TOP/BASE) |
| `elementFamily` | `balance` \| `dynamic` \| `individual` |
| `type` | `EQ` \| `FLEX` \| `AG` \| `TUM` (equilibrio/dinámico usan `EQ`) |
| `filters` | Cuándo se muestra según LEVEL / CATEGORY / EXERCISE del encabezado |

Guía completa: [docs/CATALOG.md](../../docs/CATALOG.md)
