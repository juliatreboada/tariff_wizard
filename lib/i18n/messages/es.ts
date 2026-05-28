/**
 * Spanish UI strings.
 *
 * Sheet field labels (COUNTRY, CLUB, …) stay in English to match the PDF.
 */
export const es = {
  meta: {
    title: "Asistente de creación de Tariff Sheets",
    description:
      "Crea TS para gimnasia acrobática paso a paso.",
  },
  home: {
    title: "Asistente de creación de Tariff Sheets",
    subtitle:
      "Planifica y completa tu Tariff Sheet paso a paso, en cualquier dispositivo.",
    badge: "Tariff Sheet Wizard",
    startWizard: "Comenzar asistente",
    continueWizard: "Continuar asistente",
    continueRoutine: "Continuar rutina",
    viewTs: "Ver hoja TS",
    statusTitle: "Continuar editando",
    statusMissingHeader:
      "Aún no hay encabezado guardado. Empieza por el asistente.",
    statusReady: (count: number) =>
      count > 0
        ? `Encabezado listo y ${count} elemento(s) en la rutina.`
        : "Encabezado listo. Falta añadir elementos de rutina.",
    statusNoData: "—",
    processTitle: "Flujo recomendado",
    process1: "1. Completa encabezado (club, nivel, categoría, ejercicio).",
    process2: "2. Ordena los elementos y define enlaces.",
    process3: "3. Revisa TS en A4 y exporta a PDF.",
    savedTitle: "Tariff Sheets guardadas",
    savedEmpty: "Aún no hay hojas guardadas en este navegador.",
    savedUpdated: (date: string) => `Actualizada: ${date}`,
    openBuilder: "Editar",
    openPreview: "Ver TS",
    openPrint: "Imprimir",
    deleteSaved: "Eliminar",
  },
  wizard: {
    pageTitle: "Asistente",
    stepIndicator: (current: number, total: number) =>
      `Paso ${current} de ${total}`,
    hint: "Datos de la columna derecha de la hoja (como en el PDF).",
    step1: {
      title: "Club y Competición",
      description: "PARTICIPATION NUMBER, COUNTRY, CLUB, COMPETITION, LEVEL, CATEGORY, EXERCISE",
    },
    step2: {
      title: "Equipo y Contacto",
      description: "GYMNASTS (TOP, BASE) y CONTACT PERSON",
    },
    step3: {
      title: "Resumen del encabezado",
      description: "Revisa los datos y continúa a la TS.",
    },
    back: "Atrás",
    next: "Siguiente",
    finish: "Finalizar",
    continueToSheet: "Continuar a la TS",
  },
  sheet: {
    title: "Tariff Sheet",
    subtitle: "Vista previa en pantalla — no es un archivo Excel.",
    subtitleOfficial:
      "Vista como la hoja oficial. Pulsa una celda de imagen para añadir el elemento.",
    savedLocally:
      "Guardado automáticamente en este navegador (no en la nube).",
    newSheet: "Nueva hoja",
    newSheetConfirm: "¿Borrar esta hoja y empezar otra?",
    newSheetYes: "Sí, borrar",
    newSheetNo: "Cancelar",
    headerTitle: "Encabezado",
    backToWizard: "Volver al asistente",
    loading: "Cargando…",
    elementsAreaLabel: "Elementos de la rutina",
    elementsTitle: "Elementos (Balance)",
    gridHint:
      "Pulsa la celda grande (TOP/BASE) para abrir el selector de elemento.",
    gridEmptyCell: "+ elemento",
    gridCellAria: (n: number) => `Elemento columna ${n}`,
    picker: {
      title: (n: number) => `Columna ${n}`,
      stepIndicator: (step: string) =>
        step === "subtype"
          ? "Paso 1 de 3"
          : step === "picture"
            ? "Paso 2 de 3"
            : "Paso 3 de 3",
      stepSubtype: "Tipo de elemento",
      stepPicture: "Elige la figura",
      stepReview: "Confirmar",
      subtypeMount: "Mount",
      subtypeStatic: "Static",
      subtypeMotion: "Motion",
      save: "Guardar en la hoja",
      clear: "Quitar elemento",
      duplicateElement:
        "Este elemento ya está en otra columna. No puede repetirse en la rutina.",
      back: "Atrás",
      close: "Cerrar",
    },
    catalogToggle: "Ver catálogo FGX (referencia)",
    catalogSummary: (count: number, subtypes: string) =>
      `Catálogo FGX: ${count} elemento(s) para tu hoja (tipos: ${subtypes}).`,
    catalogEmpty:
      "Ningún elemento del catálogo coincide con LEVEL / CATEGORY / EXERCISE de esta hoja. Revisa manifest.json o los filtros.",
    printSheet: "Imprimir / PDF",
  },
  routine: {
    title: "Rutina — orden de elementos",
    description:
      "Añade los elementos en el orden de la rutina. Marca «Enlazado» si va en la columna siguiente sin hueco (p. ej. mount + static).",
    linkHint:
      "Sin enlazar: se deja una columna en blanco entre elementos. La hoja tiene 3 bloques × 9 columnas.",
    empty: "Aún no hay elementos. Pulsa «Añadir elemento».",
    addElement: "Añadir elemento",
    linkNextAdd: "Enlazar con el elemento anterior (sin columna en blanco)",
    linked: "Enlazado",
    linkNext: "Enlazar siguiente",
    remove: "Quitar",
    moveUp: "Subir",
    moveDown: "Bajar",
    viewSheet: "Ver hoja TS",
    previewTitle: "Hoja de tarifa (TS)",
    previewSubtitle:
      "Disposición automática según el orden y los enlaces de la rutina.",
    backToRoutine: "Editar rutina",
    blockBalance: "Balance",
    blockDynamic: "Dynamic",
    blockCombined: "Combined",
  },
  print: {
    title: "Imprimir hoja de tarifa",
    hint:
      "Usa «Imprimir» y elige «Guardar como PDF» en el diálogo del navegador.",
    officialFormatNote:
      "Hoja generada desde la rutina (3 bloques × 9 columnas).",
    printButton: "Imprimir / Guardar PDF",
    backToSheet: "Volver a la vista TS",
    noElementsWarning:
      "Aún no hay elementos en el primer bloque (Balance). La hoja se imprimirá con celdas vacías.",
    footer: "Tariff Wizard — vista para impresión",
  },
  sheetLabels: {
    country: "COUNTRY",
    club: "CLUB",
    participationNumber: "PARTICIPATION NUMBER",
    competition: "COMPETITION",
    levelSystem: "LEVEL",
    levelAge: "AGE-GROUP",
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
