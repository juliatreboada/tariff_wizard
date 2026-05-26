"use client";

import Link from "next/link";
import { useState } from "react";
import {
  COMPETITION_FORM_ID,
  CompetitionStep,
} from "@/components/wizard/steps/CompetitionStep";
import { HeaderSummaryStep } from "@/components/wizard/steps/HeaderSummaryStep";
import { TeamContactStep } from "@/components/wizard/steps/TeamContactStep";
import { TEAM_FORM_ID } from "@/components/wizard/steps/TeamContactStep";
import { getMessages } from "@/lib/i18n";

const TOTAL_STEPS = 3;

export function WizardShell() {
  const t = getMessages();
  const [step, setStep] = useState(1);

  const isFirst = step === 1;
  const isLast = step === TOTAL_STEPS;

  const stepMeta = [
    t.wizard.step1,
    t.wizard.step2,
    t.wizard.step3,
  ][step - 1];

  const activeFormId =
    step === 1
      ? COMPETITION_FORM_ID
      : step === 2
        ? TEAM_FORM_ID
        : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Inicio
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.wizard.pageTitle}
        </h1>
        <p className="text-sm text-zinc-500">
          {t.wizard.stepIndicator(step, TOTAL_STEPS)}
        </p>
        <p className="text-xs text-zinc-400">{t.wizard.hint}</p>
      </header>

      <section
        className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
        aria-live="polite"
      >
        <h2 className="mb-4 text-xl font-semibold">{stepMeta.title}</h2>
        {step === 1 && (
          <CompetitionStep onSuccess={() => setStep(2)} />
        )}
        {step === 2 && (
          <TeamContactStep onSuccess={() => setStep(3)} />
        )}
        {step === 3 && <HeaderSummaryStep />}
      </section>

      <footer className="flex justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={isFirst}
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium transition-colors enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:enabled:hover:bg-zinc-900"
        >
          {t.wizard.back}
        </button>
        {activeFormId ? (
          <button
            type="submit"
            form={activeFormId}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {t.wizard.next}
          </button>
        ) : (
          <button
            type="button"
            disabled={isLast}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors enabled:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:enabled:hover:bg-zinc-300"
          >
            {t.wizard.finish}
          </button>
        )}
      </footer>
    </div>
  );
}
