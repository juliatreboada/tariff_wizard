import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recalculateValueBreakdown } from "./calc/value-breakdown";
import { catalogEntryToPlaced } from "./catalog/to-placed";
import type { CatalogEntry } from "./catalog/types";
import { isCatalogIdUsedInRoutine } from "./element-uniqueness";
import { inferElementBlock } from "./infer-element-block";
import {
  baseCountForCategory,
  findCategoryCodeForLabel,
  gymnastCountForCategory,
  normalizeBaseNames,
} from "./level-category";
import {
  migrateElementsRecordToRoutine,
  refreshRoutineFromCatalog,
} from "./migrate-routine";
import {
  countCompleteIndividualSets,
  syncGroupInternalLinks,
  findDisplayRowIndex,
  flattenDisplayRows,
  groupRoutineForDisplay,
  individualGroupId,
  moveDisplayRow,
} from "./routine-groups";
import { newRoutineItemId } from "./routine-id";
import type {
  RoutineElementRole,
  RoutineGymnastRole,
  RoutineItem,
} from "./routine-types";
import type {
  CompetitionStepFormValues,
  TeamContactStepValues,
} from "./schema";
import {
  emptyCompetitionStep,
  emptyTeamContactStep,
  normalizeTeamContact,
} from "./schema";
import type { ElementColumnId, PlacedElement } from "./sheet-types";
import type { StoredHeader, ValueBreakdown } from "./types";
import { emptyValueBreakdown } from "./value-breakdown";

const STORAGE_KEY = "tariff-wizard-v1";
const MAX_ESCOLAR_PER_BLOCK = 2;
const MAX_ESCOLAR_INDIVIDUAL_SETS = 3;

export type DefaultProfile = {
  competition: string;
  clubName: string;
  clubLogo: string;
  country: string;
  contactName: string;
  contactPhone: string;
};

export type WizardStore = {
  defaultProfile: DefaultProfile;
  competition: CompetitionStepFormValues;
  teamContact: TeamContactStepValues;
  header: StoredHeader | null;
  valueBreakdown: ValueBreakdown;
  routine: RoutineItem[];
  currentSheetId: string | null;
  savedSheets: SavedSheet[];
  setDefaultProfile: (values: DefaultProfile) => void;
  setCompetition: (values: CompetitionStepFormValues) => void;
  setTeamContact: (values: TeamContactStepValues) => void;
  commitHeader: () => void;
  addRoutineElement: (
    entry: CatalogEntry,
    options?: {
      linkedToPrevious?: boolean;
      block?: RoutineItem["block"];
      role?: RoutineElementRole;
      gymnastRole?: RoutineGymnastRole;
      individualOrder?: 1 | 2 | 3;
      allowDuplicate?: boolean;
      individualGroupId?: string;
      baseIndex?: number;
    },
  ) => boolean;
  addIndividualGroup: (
    picks: Array<{
      entry: CatalogEntry;
      gymnastRole: RoutineGymnastRole;
      baseIndex?: number;
    }>,
    options?: { linkedToPrevious?: boolean },
  ) => boolean;
  replaceRoutineElement: (
    itemId: string,
    entry: CatalogEntry,
    options?: {
      role?: RoutineElementRole;
    },
  ) => boolean;
  removeRoutineItem: (itemId: string) => void;
  moveRoutineItem: (itemId: string, direction: "up" | "down") => void;
  setRoutineItemLinked: (itemId: string, linked: boolean) => void;
  loadSavedSheet: (sheetId: string) => void;
  deleteSavedSheet: (sheetId: string) => void;
  /** Persist current TS, then clear in-progress work for a new wizard run. */
  saveProgressAndStartNew: () => void;
  reset: () => void;
};

export type SavedSheet = {
  id: string;
  updatedAtIso: string;
  header: StoredHeader;
  routine: RoutineItem[];
  valueBreakdown: ValueBreakdown;
};

function buildHeader(
  competition: CompetitionStepFormValues,
  team: TeamContactStepValues,
): StoredHeader {
  const categoryCode = findCategoryCodeForLabel(competition.category);
  return {
    country: competition.country,
    clubName: competition.clubName,
    clubLogo: competition.clubLogo,
    participationNumber:
      competition.participationNumber?.trim() || undefined,
    competition: competition.competition,
    levelSystem: competition.levelSystem,
    levelAge: competition.levelAge,
    category: competition.category,
    categoryCode,
    exercise: competition.exercise,
    topName: team.topName,
    baseNames: normalizeBaseNames(
      team.baseNames,
      baseCountForCategory(competition.category),
    ),
    contactName: team.contactName,
    contactPhone: team.contactPhone,
  };
}

type PersistedSlice = Pick<
  WizardStore,
  | "defaultProfile"
  | "competition"
  | "teamContact"
  | "header"
  | "routine"
  | "valueBreakdown"
  | "currentSheetId"
  | "savedSheets"
>;

type LegacyPersisted = PersistedSlice & {
  elements?: Record<ElementColumnId, PlacedElement | undefined>;
};

function emptyDefaultProfile(): DefaultProfile {
  return {
    competition: "",
    clubName: "",
    clubLogo: "",
    country: "",
    contactName: "",
    contactPhone: "",
  };
}

function withCompetitionDefaults(
  values: CompetitionStepFormValues,
  defaults: DefaultProfile,
): CompetitionStepFormValues {
  return {
    ...values,
    competition: values.competition || defaults.competition,
    clubName: values.clubName || defaults.clubName,
    clubLogo: values.clubLogo || defaults.clubLogo,
    country: values.country || defaults.country,
  };
}

function withTeamContactDefaults(
  values: TeamContactStepValues,
  defaults: DefaultProfile,
): TeamContactStepValues {
  return {
    ...values,
    contactName: values.contactName || defaults.contactName,
    contactPhone: values.contactPhone || defaults.contactPhone,
  };
}

function upsertSavedSheet(
  sheets: SavedSheet[],
  sheet: SavedSheet,
): SavedSheet[] {
  const next = sheets.filter((s) => s.id !== sheet.id);
  next.unshift(sheet);
  return next.slice(0, 30);
}

function saveCurrentSnapshot(state: Pick<
  WizardStore,
  "currentSheetId" | "header" | "routine" | "valueBreakdown" | "savedSheets"
>): SavedSheet[] {
  if (!state.currentSheetId || !state.header) return state.savedSheets;
  return upsertSavedSheet(state.savedSheets, {
    id: state.currentSheetId,
    updatedAtIso: new Date().toISOString(),
    header: state.header,
    routine: state.routine,
    valueBreakdown: state.valueBreakdown,
  });
}

function applyEscolarAutoRolesForBlock(
  routine: RoutineItem[],
  block: "balance" | "dynamic",
): RoutineItem[] {
  const indexes = routine
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.block === block && item.role !== "individual");
  if (indexes.length === 0) return routine;
  if (indexes.length === 1) {
    const idx = indexes[0]!.index;
    return routine.map((item, i) => (i === idx ? { ...item, role: "compulsory" } : item));
  }
  const minValue = Math.min(...indexes.map(({ item }) => item.element.value));
  const tied = indexes.filter(({ item }) => item.element.value === minValue);
  // On a tie keep whichever element is already optional (stable across reorder,
  // replace and reload); otherwise the last one — the newest on add — is optional.
  const optionalIdx = (
    tied.find(({ item }) => item.role === "optional") ?? tied[tied.length - 1]!
  ).index;
  return routine.map((item, i) => {
    if (!indexes.some((x) => x.index === i)) return item;
    return { ...item, role: i === optionalIdx ? "optional" : "compulsory" };
  });
}

/** Prefer the committed header: loading a saved sheet does not update `competition`. */
function escolarActive(
  state: Pick<WizardStore, "header" | "competition">,
): boolean {
  return (state.header ?? state.competition).levelSystem === "Escolar";
}

function applyEscolarAutoRoles(
  routine: RoutineItem[],
  levelSystem: string | undefined,
): RoutineItem[] {
  if (levelSystem !== "Escolar") return routine;
  return applyEscolarAutoRolesForBlock(
    applyEscolarAutoRolesForBlock(routine, "balance"),
    "dynamic",
  );
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      defaultProfile: emptyDefaultProfile(),
      competition: emptyCompetitionStep(),
      teamContact: emptyTeamContactStep(),
      header: null,
      valueBreakdown: emptyValueBreakdown(),
      routine: [],
      currentSheetId: null,
      savedSheets: [],

      setDefaultProfile: (values) => {
        set({
          defaultProfile: {
            competition: values.competition.trim(),
            clubName: values.clubName.trim(),
            clubLogo: values.clubLogo.trim(),
            country: values.country.trim(),
            contactName: values.contactName.trim(),
            contactPhone: values.contactPhone.trim(),
          },
        });
      },

      setCompetition: (values) => set({ competition: values }),

      setTeamContact: (values) => set({ teamContact: values }),

      commitHeader: () => {
        const previous = get();
        const { competition, teamContact } = previous;
        const header = buildHeader(competition, teamContact);
        const currentSheetId = previous.currentSheetId ?? newRoutineItemId();
        const valueBreakdown = recalculateValueBreakdown(previous.routine);
        set({
          header,
          valueBreakdown,
          routine: previous.routine,
          currentSheetId,
          savedSheets: upsertSavedSheet(previous.savedSheets, {
            id: currentSheetId,
            updatedAtIso: new Date().toISOString(),
            header,
            routine: previous.routine,
            valueBreakdown,
          }),
        });
      },

      addRoutineElement: (entry, options) => {
        const state = get();
        const routine = state.routine;
        if (!options?.allowDuplicate && isCatalogIdUsedInRoutine(routine, entry.id)) {
          return false;
        }
        const block = options?.block ?? inferElementBlock(entry);
        if (escolarActive(state)) {
          if (block === "balance" || block === "dynamic") {
            const existing = routine.filter((item) => item.block === block).length;
            if (existing >= MAX_ESCOLAR_PER_BLOCK) {
              return false;
            }
          }
        }
        const item: RoutineItem = {
          id: newRoutineItemId(),
          block,
          linkedToPrevious: options?.linkedToPrevious ?? false,
          role: options?.role ?? "compulsory",
          gymnastRole: options?.gymnastRole,
          baseIndex: options?.baseIndex,
          individualGroupId: options?.individualGroupId,
          individualOrder: options?.individualOrder,
          element: catalogEntryToPlaced(entry),
        };
        let next = [...routine, item];
        if (escolarActive(state) && (block === "balance" || block === "dynamic")) {
          next = applyEscolarAutoRolesForBlock(next, block);
        }
        const valueBreakdown = recalculateValueBreakdown(next);
        set({
          routine: next,
          valueBreakdown,
          savedSheets: saveCurrentSnapshot({
            ...get(),
            routine: next,
            valueBreakdown,
          }),
        });
        return true;
      },

      addIndividualGroup: (picks, options) => {
        if (picks.length === 0) return false;
        const state = get();
        if (escolarActive(state)) {
          const gymnastCount = gymnastCountForCategory(
            (state.header ?? state.competition).category,
          );
          const { totalGroups } = countCompleteIndividualSets(
            state.routine,
            gymnastCount,
          );
          if (totalGroups >= MAX_ESCOLAR_INDIVIDUAL_SETS) {
            return false;
          }
        }
        const groupId = newRoutineItemId();
        const routine = state.routine;
        const newItems: RoutineItem[] = picks.map((pick, idx) => ({
          id: newRoutineItemId(),
          block: "combined",
          role: "individual",
          linkedToPrevious:
            idx === 0 ? (options?.linkedToPrevious ?? false) : true,
          gymnastRole: pick.gymnastRole,
          baseIndex: pick.baseIndex,
          individualGroupId: groupId,
          element: catalogEntryToPlaced(pick.entry),
        }));
        const next = [...routine, ...newItems];
        const valueBreakdown = recalculateValueBreakdown(next);
        set({
          routine: next,
          valueBreakdown,
          savedSheets: saveCurrentSnapshot({
            ...get(),
            routine: next,
            valueBreakdown,
          }),
        });
        return true;
      },

      replaceRoutineElement: (itemId, entry, options) => {
        const state = get();
        const target = state.routine.find((item) => item.id === itemId);
        if (!target || target.role === "individual") return false;
        const nextBlock = target.block;
        if (inferElementBlock(entry) !== nextBlock) return false;

        if (
          state.routine.some(
            (item) => item.id !== itemId && item.element.catalogId === entry.id,
          )
        ) {
          return false;
        }

        let next = state.routine.map((item) =>
          item.id === itemId
            ? {
                ...item,
                role: options?.role ?? item.role ?? "compulsory",
                element: catalogEntryToPlaced(entry),
              }
            : item,
        );
        if (
          escolarActive(state) &&
          (nextBlock === "balance" || nextBlock === "dynamic")
        ) {
          next = applyEscolarAutoRolesForBlock(next, nextBlock);
        }
        const valueBreakdown = recalculateValueBreakdown(next);
        set({
          routine: next,
          valueBreakdown,
          savedSheets: saveCurrentSnapshot({
            ...get(),
            routine: next,
            valueBreakdown,
          }),
        });
        return true;
      },

      removeRoutineItem: (itemId) => {
        const target = get().routine.find((item) => item.id === itemId);
        let next = get().routine.filter((item) => {
          if (item.id === itemId) return false;
          if (
            target?.role === "individual" &&
            target.individualGroupId &&
            item.individualGroupId === target.individualGroupId
          ) {
            return false;
          }
          return true;
        });
        if (
          escolarActive(get()) &&
          (target?.block === "balance" || target?.block === "dynamic")
        ) {
          next = applyEscolarAutoRolesForBlock(next, target.block);
        }
        const valueBreakdown = recalculateValueBreakdown(next);
        set({
          routine: next,
          valueBreakdown,
          savedSheets: saveCurrentSnapshot({
            ...get(),
            routine: next,
            valueBreakdown,
          }),
        });
      },

      moveRoutineItem: (itemId, direction) => {
        const routine = get().routine;
        const rows = groupRoutineForDisplay(routine);
        const rowIndex = findDisplayRowIndex(rows, itemId);
        if (rowIndex < 0) return;
        const moved = moveDisplayRow(rows, rowIndex, direction);
        let next = flattenDisplayRows(moved);
        if (next[0]) next[0].linkedToPrevious = false;
        next = syncGroupInternalLinks(next);
        const valueBreakdown = recalculateValueBreakdown(next);
        set({
          routine: next,
          valueBreakdown,
          savedSheets: saveCurrentSnapshot({
            ...get(),
            routine: next,
            valueBreakdown,
          }),
        });
      },

      setRoutineItemLinked: (itemId, linked) => {
        const state = get().routine;
        const rows = groupRoutineForDisplay(state);
        const rowIndex = findDisplayRowIndex(rows, itemId);
        const row = rowIndex >= 0 ? rows[rowIndex] : null;
        const firstId =
          row == null
            ? itemId
            : row.kind === "single"
              ? row.item.id
              : row.items[0]?.id;
        const routine = state.map((item) =>
          item.id === firstId ? { ...item, linkedToPrevious: linked } : item,
        );
        if (routine[0]) routine[0].linkedToPrevious = false;
        const valueBreakdown = recalculateValueBreakdown(routine);
        set({
          routine,
          valueBreakdown,
          savedSheets: saveCurrentSnapshot({
            ...get(),
            routine,
            valueBreakdown,
          }),
        });
      },

      loadSavedSheet: (sheetId) => {
        const sheet = get().savedSheets.find((s) => s.id === sheetId);
        if (!sheet) return;
        const routine = applyEscolarAutoRoles(
          sheet.routine,
          sheet.header.levelSystem,
        );
        set({
          header: sheet.header,
          routine,
          valueBreakdown: recalculateValueBreakdown(routine),
          currentSheetId: sheet.id,
        });
      },

      deleteSavedSheet: (sheetId) => {
        const state = get();
        const savedSheets = state.savedSheets.filter((s) => s.id !== sheetId);
        const isCurrent = state.currentSheetId === sheetId;
        set({
          savedSheets,
          ...(isCurrent
            ? {
                header: null,
                routine: [],
                valueBreakdown: emptyValueBreakdown(),
                currentSheetId: null,
              }
            : {}),
        });
      },

      saveProgressAndStartNew: () => {
        const state = get();
        let savedSheets = state.savedSheets;
        if (state.header) {
          const sheetId = state.currentSheetId ?? newRoutineItemId();
          const valueBreakdown = recalculateValueBreakdown(state.routine);
          savedSheets = upsertSavedSheet(state.savedSheets, {
            id: sheetId,
            updatedAtIso: new Date().toISOString(),
            header: state.header,
            routine: state.routine,
            valueBreakdown,
          });
        }
        set({
          savedSheets,
          competition: withCompetitionDefaults(
            emptyCompetitionStep(),
            state.defaultProfile,
          ),
          teamContact: withTeamContactDefaults(
            emptyTeamContactStep(),
            state.defaultProfile,
          ),
          header: null,
          valueBreakdown: emptyValueBreakdown(),
          routine: [],
          currentSheetId: null,
        });
      },

      reset: () =>
        set((state) => ({
          competition: withCompetitionDefaults(
            emptyCompetitionStep(),
            state.defaultProfile,
          ),
          teamContact: withTeamContactDefaults(
            emptyTeamContactStep(),
            state.defaultProfile,
          ),
          header: null,
          valueBreakdown: emptyValueBreakdown(),
          routine: [],
          currentSheetId: null,
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedSlice => ({
        defaultProfile: state.defaultProfile,
        competition: state.competition,
        teamContact: state.teamContact,
        header: state.header,
        routine: state.routine,
        valueBreakdown: state.valueBreakdown,
        currentSheetId: state.currentSheetId,
        savedSheets: state.savedSheets,
      }),
      merge: (persisted, current) => {
        const p = persisted as LegacyPersisted;
        const defaultProfile = {
          ...emptyDefaultProfile(),
          ...(p.defaultProfile ?? {}),
        };
        let routine = p.routine ?? [];
        if (routine.length === 0 && p.elements) {
          routine = migrateElementsRecordToRoutine(p.elements);
        }
        if (p.header) {
          routine = applyEscolarAutoRoles(
            refreshRoutineFromCatalog(routine),
            p.header.levelSystem,
          );
        }
        const valueBreakdown = p.header
          ? recalculateValueBreakdown(routine)
          : emptyValueBreakdown();
        const competition = withCompetitionDefaults(
          p.competition ?? current.competition,
          defaultProfile,
        );
        const teamContact = normalizeTeamContact(
          withTeamContactDefaults(
            p.teamContact ?? current.teamContact,
            defaultProfile,
          ),
          competition.category,
        );
        let header = p.header ?? null;
        if (header && header.baseNames.length !== baseCountForCategory(header.category)) {
          header = {
            ...header,
            baseNames: normalizeBaseNames(
              header.baseNames,
              baseCountForCategory(header.category),
            ),
          };
        }
        return {
          ...current,
          defaultProfile,
          competition,
          teamContact,
          header,
          routine,
          valueBreakdown,
          currentSheetId: p.currentSheetId ?? current.currentSheetId,
          savedSheets: p.savedSheets ?? current.savedSheets,
        };
      },
    },
  ),
);
