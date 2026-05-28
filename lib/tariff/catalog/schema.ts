import { z } from "zod";
import { EXERCISES, LEVEL_SYSTEMS } from "../enums";
import { BALANCE_SUBTYPES, CATALOG_IDS } from "./types";

const catalogEntrySchema = z.object({
  id: z.string().min(1),
  region: z.enum(CATALOG_IDS),
  elementFamily: z.literal("balance"),
  subtype: z.enum(BALANCE_SUBTYPES),
  label: z.string().min(1),
  image: z.string().min(1),
  galicianCode: z.string().min(1),
  value: z.number().positive(),
  filters: z.object({
    levelSystems: z.array(z.enum(LEVEL_SYSTEMS)).min(1),
    categories: z.array(z.string().min(1)).min(1),
    exercises: z.array(z.enum(EXERCISES)).min(1),
  }),
});

export const catalogManifestSchema = z.object({
  version: z.literal(1),
  region: z.enum(CATALOG_IDS),
  description: z.string().optional(),
  entries: z.array(catalogEntrySchema).min(1),
});
