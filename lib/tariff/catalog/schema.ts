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
  filters: z.object({
    levelSystems: z.array(z.enum(LEVEL_SYSTEMS)).min(1),
    categories: z.array(z.string().min(1)).min(1),
    exercises: z.array(z.enum(EXERCISES)).min(1),
  }),
});

export const catalogManifestSchema = z.object({
  version: z.literal(1),
  code: z.enum(CATALOG_IDS),
  description: z.string().optional(),
  entries: z.array(catalogEntrySchema).min(1),
});
