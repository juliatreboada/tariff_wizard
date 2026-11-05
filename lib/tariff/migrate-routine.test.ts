import { describe, expect, it } from "vitest";
import { catalogImageUrl } from "./catalog/load-catalog";
import { catalogManifestSchema } from "./catalog/schema";
import { catalogEntryToPlaced } from "./catalog/to-placed";
import { refreshRoutineFromCatalog } from "./migrate-routine";
import { entry, item, withoutCatalog } from "./test-fixtures";

describe("refreshing saved elements from the catalog", () => {
  it("replaces a saved element with the catalog's current data", () => {
    const stale = item("fgx-balance-row-i-b");
    stale.element = { ...stale.element, value: 9, image: "old.png" };
    const [refreshed] = refreshRoutineFromCatalog([stale]);
    expect(refreshed.element.value).toBe(entry("fgx-balance-row-i-b").value);
    expect(refreshed.element.image).toBe(entry("fgx-balance-row-i-b").image);
  });

  it("keeps an element whose catalog entry is gone, fixing legacy image paths", () => {
    const gone = item("fgx-balance-row-i-b");
    gone.element = { ...gone.element, catalogId: "fgx-removed", image: "balance/X.png" };
    const [kept] = refreshRoutineFromCatalog([gone]);
    expect(kept.element.catalogId).toBe("fgx-removed");
    expect(kept.element.image).toBe("pairs/balance/X.png");
  });
});

describe("the catalog an element comes from", () => {
  it("is recorded when an element is placed", () => {
    expect(catalogEntryToPlaced(entry("fgx-balance-row-i-b")).catalog).toBe("FGX");
  });

  it("defaults to FGX for elements saved before it was recorded", () => {
    // An entry no longer in the catalog, so the refresh can't fill it in.
    const legacy = withoutCatalog(item("fgx-balance-row-i-b"));
    legacy.element = { ...legacy.element, catalogId: "fgx-removed" };
    const [kept] = refreshRoutineFromCatalog([legacy]);
    expect(kept.element.catalog).toBe("FGX");
    expect(catalogImageUrl(kept.element.image, kept.element.catalog)).toMatch(
      /^\/catalog\/FGX\//,
    );
  });

  it("leaves an element from an unknown catalog as saved", () => {
    const foreign = item("fgx-balance-row-i-b");
    foreign.element = { ...foreign.element, catalog: "XYZ" as never, value: 9 };
    expect(refreshRoutineFromCatalog([foreign])).toEqual([foreign]);
  });

  it("must prefix every entry id in its manifest", () => {
    const manifest = (id: string) => ({
      version: 1,
      code: "FGX",
      entries: [{ ...entry("fgx-balance-row-i-b"), id }],
    });
    expect(catalogManifestSchema.safeParse(manifest("fgx-ok")).success).toBe(true);
    expect(catalogManifestSchema.safeParse(manifest("rfeg-x")).success).toBe(false);
  });
});

describe("elements of a box later split into options", () => {
  it("become the box's first option", () => {
    const [item] = refreshRoutineFromCatalog([
      {
        id: "x",
        block: "combined",
        linkedToPrevious: false,
        role: "individual",
        gymnastRole: "top",
        element: { catalogId: "fig-tod-balance-001", catalog: "FIG", coordinates: "001", value: 1, image: "tod/balance/001.png", type: "EQ" },
      },
    ]);
    expect(item.element).toMatchObject({ catalogId: "fig-tod-balance-001-a", image: "tod/balance/001-a.png" });
  });
});
