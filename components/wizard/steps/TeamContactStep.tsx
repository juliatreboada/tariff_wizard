"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { FormField, fieldInputClass } from "@/components/wizard/FormField";
import { getMessages } from "@/lib/i18n";
import { baseCountForCategory } from "@/lib/tariff/level-category";
import {
  type TeamContactStepValues,
  normalizeTeamContact,
  teamContactStepSchema,
} from "@/lib/tariff/schema";
import { useWizardStore } from "@/lib/tariff/store";

const FORM_ID = "wizard-team-form";

type TeamContactStepProps = {
  onSuccess: () => void;
};

function baseFieldLabel(
  index: number,
  baseCount: number,
  labels: ReturnType<typeof getMessages>["sheetLabels"],
): string {
  return baseCount <= 1 ? labels.base : labels.baseNumber(index + 1);
}

export function TeamContactStep({ onSuccess }: TeamContactStepProps) {
  const t = getMessages();
  const competition = useWizardStore((s) => s.competition);
  const stored = useWizardStore((s) => s.teamContact);
  const setTeamContact = useWizardStore((s) => s.setTeamContact);
  const commitHeader = useWizardStore((s) => s.commitHeader);

  const baseCount = baseCountForCategory(competition.category);
  const schema = useMemo(
    () => teamContactStepSchema(baseCount),
    [baseCount],
  );

  const defaultValues = useMemo(
    () => normalizeTeamContact(stored, competition.category),
    [stored, competition.category],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamContactStepValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    reset(normalizeTeamContact(stored, competition.category));
  }, [stored, competition.category, reset]);

  function onSubmit(data: TeamContactStepValues) {
    setTeamContact(data);
    commitHeader();
    onSuccess();
  }

  const baseErrors = errors.baseNames;

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <fieldset className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/80 p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold tracking-wide text-zinc-800">
            {t.sheetLabels.gymnastsSection}
          </legend>
          <FormField
            label={t.sheetLabels.top}
            htmlFor="topName"
            error={errors.topName?.message}
          >
            <input
              id="topName"
              className={fieldInputClass(!!errors.topName)}
              autoComplete="name"
              {...register("topName")}
            />
          </FormField>
          {Array.from({ length: baseCount }, (_, index) => (
            <FormField
              key={index}
              label={baseFieldLabel(index, baseCount, t.sheetLabels)}
              htmlFor={`baseNames.${index}`}
              error={
                Array.isArray(baseErrors)
                  ? baseErrors[index]?.message
                  : baseErrors?.message
              }
            >
              <input
                id={`baseNames.${index}`}
                className={fieldInputClass(
                  !!(
                    Array.isArray(baseErrors)
                      ? baseErrors[index]
                      : baseErrors
                  ),
                )}
                autoComplete="name"
                {...register(`baseNames.${index}` as const)}
              />
            </FormField>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/80 p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold tracking-wide text-zinc-800">
            {t.sheetLabels.contactSection}
          </legend>
          <FormField
            label={t.sheetLabels.contactName}
            htmlFor="contactName"
            error={errors.contactName?.message}
          >
            <input
              id="contactName"
              className={fieldInputClass(!!errors.contactName)}
              autoComplete="name"
              {...register("contactName")}
            />
          </FormField>
          <FormField
            label={t.sheetLabels.contactPhone}
            htmlFor="contactPhone"
            error={errors.contactPhone?.message}
          >
            <input
              id="contactPhone"
              type="tel"
              inputMode="tel"
              className={fieldInputClass(!!errors.contactPhone)}
              placeholder="627 42 90 24"
              autoComplete="tel"
              {...register("contactPhone")}
            />
          </FormField>
        </fieldset>
      </div>
    </form>
  );
}

export { FORM_ID as TEAM_FORM_ID };
