import { create } from "zustand";
import { findCategoryCodeForLabel } from "./level-category";
import type {
  CompetitionStepFormValues,
  TeamContactStepValues,
} from "./schema";
import { emptyCompetitionStep, emptyTeamContactStep } from "./schema";
import type { StoredHeader } from "./types";

type WizardStore = {
  competition: CompetitionStepFormValues;
  teamContact: TeamContactStepValues;
  header: StoredHeader | null;
  setCompetition: (values: CompetitionStepFormValues) => void;
  setTeamContact: (values: TeamContactStepValues) => void;
  commitHeader: () => void;
  reset: () => void;
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

export const useWizardStore = create<WizardStore>((set, get) => ({
  competition: emptyCompetitionStep(),
  teamContact: emptyTeamContactStep(),
  header: null,

  setCompetition: (values) => set({ competition: values }),

  setTeamContact: (values) => set({ teamContact: values }),

  commitHeader: () => {
    const { competition, teamContact } = get();
    set({ header: buildHeader(competition, teamContact) });
  },

  reset: () =>
    set({
      competition: emptyCompetitionStep(),
      teamContact: emptyTeamContactStep(),
      header: null,
    }),
}));
