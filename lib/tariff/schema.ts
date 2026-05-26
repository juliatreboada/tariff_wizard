import { z } from "zod";
import { EXERCISES, LEVEL_AGE_BY_SYSTEM, LEVEL_SYSTEMS } from "./enums";
import { getCategoryOptions, getLevelAgeOptions } from "./level-category";
import { isValidParticipationNumber, isValidPhone } from "./validation";

const requiredName = z.string().trim().min(2, "Mínimo 2 caracteres");

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

export const teamContactStepSchema = z.object({
  topName: requiredName,
  baseName: requiredName,
  contactName: requiredName,
  contactPhone: z
    .string()
    .trim()
    .min(1, "Obligatorio")
    .refine(isValidPhone, "Teléfono: 9–15 dígitos"),
});

export const tariffHeaderSchema = competitionStepSchema.and(
  teamContactStepSchema,
);

export type CompetitionStepValues = z.infer<typeof competitionStepSchema>;
export type CompetitionStepFormValues = z.input<typeof competitionStepSchema>;
export type TeamContactStepValues = z.infer<typeof teamContactStepSchema>;

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

export function emptyTeamContactStep(): TeamContactStepValues {
  return {
    topName: "",
    baseName: "",
    contactName: "",
    contactPhone: "",
  };
}
