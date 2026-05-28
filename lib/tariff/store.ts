import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recalculateValueBreakdown } from "./calc/value-breakdown";
import { catalogEntryToPlaced } from "./catalog/to-placed";
import type { CatalogEntry } from "./catalog/types";
import { isCatalogIdUsedInRoutine } from "./element-uniqueness";
import { inferElementBlock } from "./infer-element-block";
import { findCategoryCodeForLabel } from "./level-category";
import {
  migrateElementsRecordToRoutine,
  refreshRoutineFromCatalog,
} from "./migrate-routine";
import {
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
import { emptyCompetitionStep, emptyTeamContactStep } from "./schema";
import type { ElementColumnId, PlacedElement } from "./sheet-types";
import type { StoredHeader, ValueBreakdown } from "./types";
import { emptyValueBreakdown } from "./value-breakdown";

const STORAGE_KEY = "tariff-wizard-v1";

export type WizardStore = {
  competition: CompetitionStepFormValues;
  teamContact: TeamContactStepValues;
  header: StoredHeader | null;
  valueBreakdown: ValueBreakdown;
  routine: RoutineItem[];
  currentSheetId: string | null;
  savedSheets: SavedSheet[];
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
    participationNumber:
      competition.participationNumber?.trim() || undefined,
    competition: competition.competition,
    levelSystem: competition.levelSystem,
    levelAge: competition.levelAge,
    category: competition.category,
    categoryCode,
    exercise: competition.exercise,
    topName: team.topName,
    baseNames: [team.baseName],
    contactName: team.contactName,
    contactPhone: team.contactPhone,
  };
}

type PersistedSlice = Pick<
  WizardStore,
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

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      competition: emptyCompetitionStep(),
      teamContact: emptyTeamContactStep(),
      header: null,
      valueBreakdown: emptyValueBreakdown(),
      routine: [],
      currentSheetId: null,
      savedSheets: [],

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
        const routine = get().routine;
        if (!options?.allowDuplicate && isCatalogIdUsedInRoutine(routine, entry.id)) {
          return false;
        }
        const item: RoutineItem = {
          id: newRoutineItemId(),
          block: options?.block ?? inferElementBlock(entry),
          linkedToPrevious: options?.linkedToPrevious ?? false,
          role: options?.role,
          gymnastRole: options?.gymnastRole,
          baseIndex: options?.baseIndex,
          individualGroupId: options?.individualGroupId,
          individualOrder: options?.individualOrder,
          element: catalogEntryToPlaced(entry),
        };
        const next = [...routine, item];
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
        const groupId = newRoutineItemId();
        const routine = get().routine;
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

      removeRoutineItem: (itemId) => {
        const target = get().routine.find((item) => item.id === itemId);
        const next = get().routine.filter((item) => {
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
        set({
          header: sheet.header,
          routine: sheet.routine,
          valueBreakdown: sheet.valueBreakdown,
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
          competition: emptyCompetitionStep(),
          teamContact: emptyTeamContactStep(),
          header: null,
          valueBreakdown: emptyValueBreakdown(),
          routine: [],
          currentSheetId: null,
        });
      },

      reset: () =>
        set({
          competition: emptyCompetitionStep(),
          teamContact: emptyTeamContactStep(),
          header: null,
          valueBreakdown: emptyValueBreakdown(),
          routine: [],
          currentSheetId: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedSlice => ({
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
        let routine = p.routine ?? [];
        if (routine.length === 0 && p.elements) {
          routine = migrateElementsRecordToRoutine(p.elements);
        }
        if (p.header) {
          routine = refreshRoutineFromCatalog(routine);
        }
        const valueBreakdown = p.header
          ? recalculateValueBreakdown(routine)
          : emptyValueBreakdown();
        return {
          ...current,
          competition: p.competition ?? current.competition,
          teamContact: p.teamContact ?? current.teamContact,
          header: p.header ?? null,
          routine,
          valueBreakdown,
          currentSheetId: p.currentSheetId ?? current.currentSheetId,
          savedSheets: p.savedSheets ?? current.savedSheets,
        };
      },
    },
  ),
);
