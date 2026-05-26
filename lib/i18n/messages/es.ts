/**
 * Spanish UI strings.
 *
 * Sheet field labels (COUNTRY, CLUB, …) stay in English to match the PDF.
 */
export const es = {
  meta: {
    title: "Asistente de hoja de tarifa",
    description:
      "Crea hojas de tarifa para gimnasia acrobática paso a paso.",
  },
  home: {
    title: "Asistente de hoja de tarifa",
    subtitle: "El Mago que te ayudará con las Tariff Sheets",
    startWizard: "Comenzar asistente",
  },
  wizard: {
    pageTitle: "Asistente",
    stepIndicator: (current: number, total: number) =>
      `Paso ${current} de ${total}`,
    hint: "Datos de la columna derecha de la hoja (como en el PDF).",
    step1: {
      title: "Club y competición",
      description: "PARTICIPATION NUMBER, COUNTRY, CLUB, COMPETITION, LEVEL, CATEGORY, EXERCISE",
    },
    step2: {
      title: "Pareja y contacto",
      description: "GYMNASTS (TOP, BASE) y CONTACT PERSON",
    },
    step3: {
      title: "Resumen del encabezado",
      description: "Revisa antes de continuar con la rutina (próximamente).",
    },
    back: "Atrás",
    next: "Siguiente",
    finish: "Finalizar",
  },
  sheetLabels: {
    country: "COUNTRY",
    club: "CLUB",
    participationNumber: "PARTICIPATION NUMBER",
    competition: "COMPETITION",
    levelSystem: "LEVEL — sistema",
    levelAge: "LEVEL — categoría de edad",
    category: "CATEGORY",
    exercise: "EXERCISE",
    top: "TOP",
    base: "BASE",
    contactName: "NAME",
    contactPhone: "TEL",
    contactSection: "CONTACT PERSON",
    gymnastsSection: "GYMNASTS",
  },
  placeholders: {
    select: "Seleccionar…",
  },
} as const;

export type Messages = typeof es;
