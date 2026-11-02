import { z } from "zod";
import { EXERCISES, LEVEL_SYSTEMS } from "../enums";
import { CATALOG_IDS, ELEMENT_FAMILIES, ELEMENT_TYPES } from "./types";

const catalogEntrySchema = z.object({
  id: z.string().min(1),
  code: z.enum(CATALOG_IDS),
  elementFamily: z.enum(ELEMENT_FAMILIES),
  type: z.enum(ELEMENT_TYPES).optional(),
  coordinates: z.string().min(1),
  image: z.string().min(1),
  value: z.number().min(0),
  holdDuration: z.string().optional(),
  rotation: z.string().optional(),
  attachesTo: z.array(z.string().min(1)).min(1).optional(),
  filters: z.object({
    levelSystems: z.array(z.enum(LEVEL_SYSTEMS)).min(1),
    categories: z.array(z.string().min(1)).min(1),
    exercises: z.array(z.enum(EXERCISES)).min(1),
    levelAges: z.array(z.string().min(1)).min(1).optional(),
  }),
});

/** Entry ids start with their catalog's code (fgx-…) so they never clash across catalogs. */
export function catalogIdPrefix(code: string): string {
  return `${code.toLowerCase()}-`;
}

export const catalogManifestSchema = z
  .object({
    version: z.literal(1),
    code: z.enum(CATALOG_IDS),
    description: z.string().optional(),
    entries: z.array(catalogEntrySchema).min(1),
  })
  .superRefine((manifest, ctx) => {
    const ids = new Set(manifest.entries.map((e) => e.id));
    manifest.entries.forEach((entry, i) => {
      for (const target of entry.attachesTo ?? []) {
        if (!ids.has(target)) {
          ctx.addIssue({
            code: "custom",
            path: ["entries", i, "attachesTo"],
            message: `attaches to unknown entry ${target}`,
          });
        }
      }
      if (entry.code !== manifest.code) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "code"],
          message: `entry.code must be ${manifest.code}`,
        });
      }
      if (!entry.id.startsWith(catalogIdPrefix(manifest.code))) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "id"],
          message: `id must start with "${catalogIdPrefix(manifest.code)}"`,
        });
      }
    });
  });
