import manifestFgx from "@/catalog/FGX/manifest.json";
import { catalogManifestSchema } from "./schema";
import type { CatalogEntry, CatalogId, CatalogManifest } from "./types";
import { DEFAULT_CATALOG_ID } from "./types";

const manifests: Record<CatalogId, unknown> = {
  FGX: manifestFgx,
};

const cache = new Map<CatalogId, CatalogManifest>();

export function loadCatalog(
  catalogId: CatalogId = DEFAULT_CATALOG_ID,
): CatalogManifest {
  let loaded = cache.get(catalogId);
  if (!loaded) {
    const raw = manifests[catalogId];
    if (!raw) {
      throw new Error(`Unknown catalog: ${catalogId}`);
    }
    loaded = catalogManifestSchema.parse(raw);
    cache.set(catalogId, loaded);
  }
  return loaded;
}

export function getCatalogEntries(
  catalogId: CatalogId = DEFAULT_CATALOG_ID,
): CatalogEntry[] {
  return loadCatalog(catalogId).entries;
}

/** Public URL for an entry image (`public/catalog/<code>/…`). */
export function catalogImageUrl(
  imagePath: string,
  catalogId: CatalogId = DEFAULT_CATALOG_ID,
): string {
  return `/catalog/${catalogId}/${imagePath.replace(/^\//, "")}`;
}
