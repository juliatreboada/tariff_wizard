"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormField, fieldInputClass } from "@/components/wizard/FormField";
import { getMessages } from "@/lib/i18n";
import {
  type TeamContactStepValues,
  teamContactStepSchema,
} from "@/lib/tariff/schema";
import { useWizardStore } from "@/lib/tariff/store";

const FORM_ID = "wizard-team-form";

type TeamContactStepProps = {
  onSuccess: () => void;
};

export function TeamContactStep({ onSuccess }: TeamContactStepProps) {
  const t = getMessages();
  const stored = useWizardStore((s) => s.teamContact);
  const setTeamContact = useWizardStore((s) => s.setTeamContact);
  const commitHeader = useWizardStore((s) => s.commitHeader);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamContactStepValues>({
    resolver: zodResolver(teamContactStepSchema),
    defaultValues: stored,
  });

  useEffect(() => {
    reset(stored);
  }, [stored, reset]);

  function onSubmit(data: TeamContactStepValues) {
    setTeamContact(data);
    commitHeader();
    onSuccess();
  }

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <p className="text-sm text-zinc-500">{t.wizard.step2.description}</p>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <legend className="px-1 text-sm font-medium">
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
            {...register("topName")}
          />
        </FormField>
        <FormField
          label={t.sheetLabels.base}
          htmlFor="baseName"
          error={errors.baseName?.message}
        >
          <input
            id="baseName"
            className={fieldInputClass(!!errors.baseName)}
            {...register("baseName")}
          />
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <legend className="px-1 text-sm font-medium">
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
            className={fieldInputClass(!!errors.contactPhone)}
            placeholder="627 42 90 24"
            {...register("contactPhone")}
          />
        </FormField>
      </fieldset>
    </form>
  );
}

export { FORM_ID as TEAM_FORM_ID };
