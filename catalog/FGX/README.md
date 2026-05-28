# Catálogo FGX

## Archivos

| Qué | Dónde |
|-----|--------|
| **Lista de elementos** (editas esto) | [`manifest.json`](manifest.json) |
| **Imágenes** (PNG) | [`public/catalog/FGX/balance/`](../../public/catalog/FGX/balance/) |

El campo `image` en el manifest es la ruta **desde** `public/catalog/FGX/`.

Ejemplo: `"image": "balance/ROW-III-C.png"` → archivo  
`public/catalog/FGX/balance/ROW-III-C.png`

## Añadir un elemento

1. Copia el PNG a `public/catalog/FGX/balance/TU-ARCHIVO.png`
2. Añade un bloque en `entries` en `manifest.json` (copia uno existente y cambia `id`, `label`, `galicianCode`, `value`, `image`, `subtype`, `filters`)
3. Ejecuta: `npm run validate-catalog`

## Campos importantes

| Campo | Uso en la hoja |
|-------|----------------|
| `galicianCode` | Referencia en fila **SH** |
| `value` | Número en fila **VALUE** (columna del elemento) |
| `image` | Imagen en la celda grande (TOP/BASE) |
| `subtype` | `mount` \| `static` \| `motion` (paso 1 del picker) |
| `filters` | Cuándo se muestra según LEVEL / CATEGORY / EXERCISE del encabezado |

Guía completa: [docs/CATALOG.md](../../docs/CATALOG.md)
