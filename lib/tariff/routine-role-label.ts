import type { Messages } from "@/lib/i18n/messages/es";
import type { RoutineElementRole } from "./routine-types";

export function routineRoleLabel(
  role: RoutineElementRole | undefined,
  routine: Messages["routine"],
): string {
  switch (role) {
    case "compulsory":
      return routine.escolarCompulsory;
    case "optional":
      return routine.escolarOptional;
    case "individual":
      return routine.escolarIndividual;
    default:
      return "";
  }
}
