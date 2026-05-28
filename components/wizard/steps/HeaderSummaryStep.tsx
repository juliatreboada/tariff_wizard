"use client";

import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { useWizardStore } from "@/lib/tariff/store";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-200 py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
        {title}
      </h3>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

export function HeaderSummaryStep() {
  const t = getMessages();
  const header = useWizardStore((s) => s.header);

  if (!header) {
    return (
      <p className="text-sm text-zinc-600">
        Completa los pasos anteriores para ver el resumen.
      </p>
    );
  }

  const levelDisplay = `${header.levelSystem} — ${header.levelAge}`;
  const categoryDisplay = header.categoryCode
    ? `${header.category} (${header.categoryCode})`
    : header.category;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-700">{t.wizard.step3.description}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummarySection title="Competición">
          <Row label={t.sheetLabels.competition} value={header.competition} />
          <Row
            label={t.sheetLabels.participationNumber}
            value={header.participationNumber}
          />
          <Row label={t.sheetLabels.club} value={header.clubName} />
          <Row label={t.sheetLabels.country} value={header.country} />
        </SummarySection>

        <SummarySection title="Categoría y ejercicio">
          <Row label="LEVEL" value={levelDisplay} />
          <Row label={t.sheetLabels.category} value={categoryDisplay} />
          <Row label={t.sheetLabels.exercise} value={header.exercise} />
        </SummarySection>

        <SummarySection title={t.sheetLabels.gymnastsSection}>
          <Row label={t.sheetLabels.top} value={header.topName} />
          <Row label={t.sheetLabels.base} value={header.baseNames[0]} />
        </SummarySection>

        <SummarySection title={t.sheetLabels.contactSection}>
          <Row label={t.sheetLabels.contactName} value={header.contactName} />
          <Row label={t.sheetLabels.contactPhone} value={header.contactPhone} />
        </SummarySection>
      </div>

      <Link
        href="/sheet"
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:w-auto sm:px-8"
      >
        {t.wizard.continueToSheet}
      </Link>
    </div>
  );
}
