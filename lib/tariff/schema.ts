import { z } from "zod";
import { EXERCISES, LEVEL_AGE_BY_SYSTEM, LEVEL_SYSTEMS } from "./enums";
import {
  baseCountForCategory,
  getCategoryOptions,
  getLevelAgeOptions,
  normalizeBaseNames,
} from "./level-category";
import { isValidParticipationNumber, isValidPhone } from "./validation";

const requiredName = z.string().trim().min(2, "Obligatorio");

export const competitionStepSchema = z
  .object({
    country: z
      .string()
      .transform((s) => s.trim())
      .transform((s) => (s === "" ? undefined : s))
      .optional(),
    clubName: requiredName,
    participationNumber: z
      .string()
      .transform((s) => s.trim())
      .refine(isValidParticipationNumber, "Formato no válido"),
    competition: requiredName,
    levelSystem: z.enum(LEVEL_SYSTEMS),
    levelAge: z.string().min(1, "Selecciona una opción"),
    category: z.string().min(1, "Selecciona una opción"),
    exercise: z.enum(EXERCISES),
  })
  .superRefine((data, ctx) => {
    const ages = getLevelAgeOptions(data.levelSystem);
    if (!ages.includes(data.levelAge)) {
      ctx.addIssue({
        code: "custom",
        path: ["levelAge"],
        message: "No válido para este nivel",
      });
    }
    const categories = getCategoryOptions(data.levelSystem);
    if (!categories.includes(data.category)) {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "No válida para este nivel",
      });
    }
  });

export type TeamContactStepValues = {
  topName: string;
  baseNames: string[];
  contactName: string;
  contactPhone: string;
};

export function teamContactStepSchema(baseCount: number) {
  return z.object({
    topName: requiredName,
    baseNames: z
      .array(requiredName)
      .length(baseCount, `Indica ${baseCount} base(s)`),
    contactName: requiredName,
    contactPhone: z
      .string()
      .trim()
      .min(1, "Obligatorio")
      .refine(isValidPhone, "Teléfono: 9–15 dígitos"),
  });
}

export type CompetitionStepValues = z.infer<typeof competitionStepSchema>;
export type CompetitionStepFormValues = z.input<typeof competitionStepSchema>;

export function emptyCompetitionStep(): CompetitionStepFormValues {
  return {
    country: "",
    clubName: "",
    participationNumber: "",
    competition: "",
    levelSystem: "RFEG",
    levelAge: LEVEL_AGE_BY_SYSTEM.RFEG[0],
    category: getCategoryOptions("RFEG")[0],
    exercise: "Balance",
  };
}

export function emptyTeamContactStep(baseCount = 1): TeamContactStepValues {
  return {
    topName: "",
    baseNames: Array.from({ length: baseCount }, () => ""),
    contactName: "",
    contactPhone: "",
  };
}

export function normalizeTeamContact(
  raw: unknown,
  category: string,
): TeamContactStepValues {
  const baseCount = baseCountForCategory(category);
  const empty = emptyTeamContactStep(baseCount);

  if (!raw || typeof raw !== "object") return empty;

  const record = raw as Record<string, unknown>;
  const legacyBase =
    typeof record.baseName === "string" ? record.baseName.trim() : "";

  const baseNames = Array.isArray(record.baseNames)
    ? normalizeBaseNames(
        record.baseNames.map((n) => String(n)),
        baseCount,
      )
    : legacyBase
      ? normalizeBaseNames([legacyBase], baseCount)
      : empty.baseNames;

  return {
    topName: typeof record.topName === "string" ? record.topName : "",
    baseNames,
    contactName:
      typeof record.contactName === "string" ? record.contactName : "",
    contactPhone:
      typeof record.contactPhone === "string" ? record.contactPhone : "",
  };
}
