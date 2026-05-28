"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField, fieldInputClass } from "@/components/wizard/FormField";
import { getMessages } from "@/lib/i18n";
import { LEVEL_SYSTEMS } from "@/lib/tariff/enums";
import {
  exerciseLabel,
  exerciseOptionsForLevel,
  isCombinedRoutineLevel,
} from "@/lib/tariff/exercise-display";
import { getCategoryOptions, getLevelAgeOptions } from "@/lib/tariff/level-category";
import {
  type CompetitionStepFormValues,
  type CompetitionStepValues,
  competitionStepSchema,
} from "@/lib/tariff/schema";
import { useWizardStore } from "@/lib/tariff/store";

const FORM_ID = "wizard-competition-form";

type CompetitionStepProps = {
  onSuccess: () => void;
};

export function CompetitionStep({ onSuccess }: CompetitionStepProps) {
  const t = getMessages();
  const stored = useWizardStore((s) => s.competition);
  const setCompetition = useWizardStore((s) => s.setCompetition);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompetitionStepFormValues>({
    resolver: zodResolver(competitionStepSchema),
    defaultValues: {
      ...stored,
      country: stored.country ?? "",
      participationNumber: stored.participationNumber ?? "",
    },
  });

  const levelSystem = watch("levelSystem");
  const levelAge = watch("levelAge");
  const prevSystem = useRef(levelSystem);
  const exerciseOptions = exerciseOptionsForLevel(levelSystem, levelAge);
  const combinedRoutineLevel = isCombinedRoutineLevel(levelSystem, levelAge);

  useEffect(() => {
    reset({
      ...stored,
      country: stored.country ?? "",
      participationNumber: stored.participationNumber ?? "",
    });
  }, [stored, reset]);

  useEffect(() => {
    if (prevSystem.current === levelSystem) return;
    prevSystem.current = levelSystem;
    const ages = getLevelAgeOptions(levelSystem);
    const categories = getCategoryOptions(levelSystem);
    setValue("levelAge", ages[0] ?? "");
    setValue("category", categories[0] ?? "");
  }, [levelSystem, setValue]);

  useEffect(() => {
    if (combinedRoutineLevel) {
      setValue("exercise", "Combined");
    }
  }, [combinedRoutineLevel, setValue]);

  function onSubmit(data: CompetitionStepValues) {
    setCompetition({
      ...data,
      country: data.country ?? "",
      participationNumber: data.participationNumber ?? "",
    });
    onSuccess();
  }

  const ageOptions = getLevelAgeOptions(levelSystem);
  const categoryOptions = getCategoryOptions(levelSystem);

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      {/* <p className="text-sm text-zinc-700">{t.wizard.step1.description}</p> */}

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
          <FormField
            label={t.sheetLabels.competition}
            htmlFor="competition"
            error={errors.competition?.message}
          >
            <input
              id="competition"
              className={fieldInputClass(!!errors.competition)}
              {...register("competition")}
            />
          </FormField>

          <FormField
            label={t.sheetLabels.participationNumber}
            htmlFor="participationNumber"
            optional
            error={errors.participationNumber?.message}
          >
            <input
              id="participationNumber"
              className={fieldInputClass(!!errors.participationNumber)}
              {...register("participationNumber")}
            />
          </FormField>
        </div>

        <div className="flex flex-col gap-5">
          <FormField
            label={t.sheetLabels.club}
            htmlFor="clubName"
            error={errors.clubName?.message}
          >
            <input
              id="clubName"
              className={fieldInputClass(!!errors.clubName)}
              {...register("clubName")}
            />
          </FormField>

          <FormField
            label={t.sheetLabels.country}
            htmlFor="country"
            optional
            error={errors.country?.message}
          >
            <input
              id="country"
              className={fieldInputClass(!!errors.country)}
              {...register("country")}
            />
          </FormField>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label={t.sheetLabels.levelSystem}
              htmlFor="levelSystem"
              error={errors.levelSystem?.message}
            >
              <select
                id="levelSystem"
                className={fieldInputClass(!!errors.levelSystem)}
                {...register("levelSystem")}
              >
                {LEVEL_SYSTEMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label={t.sheetLabels.levelAge}
              htmlFor="levelAge"
              error={errors.levelAge?.message}
            >
              <select
                id="levelAge"
                className={fieldInputClass(!!errors.levelAge)}
                {...register("levelAge")}
              >
                {ageOptions.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label={t.sheetLabels.category}
              htmlFor="category"
              error={errors.category?.message}
            >
              <select
                id="category"
                className={fieldInputClass(!!errors.category)}
                {...register("category")}
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label={t.sheetLabels.exercise}
              htmlFor="exercise"
              error={errors.exercise?.message}
            >
              <select
                id="exercise"
                className={fieldInputClass(!!errors.exercise)}
                {...register("exercise")}
              >
                {exerciseOptions.map((ex) => (
                  <option key={ex} value={ex}>
                    {exerciseLabel(ex, t.exercises)}
                  </option>
                ))}
              </select>
              {combinedRoutineLevel ? (
                <p className="mt-1 text-xs text-zinc-600">
                  {t.exercises.combinedRoutineHint}
                </p>
              ) : null}
            </FormField>
          </div>
        </div>
      </div>
    </form>
  );
}

export { FORM_ID as COMPETITION_FORM_ID };
