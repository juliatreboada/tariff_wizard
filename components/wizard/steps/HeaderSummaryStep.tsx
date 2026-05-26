"use client";

import { getMessages } from "@/lib/i18n";
import { useWizardStore } from "@/lib/tariff/store";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export function HeaderSummaryStep() {
  const t = getMessages();
  const header = useWizardStore((s) => s.header);

  if (!header) {
    return (
      <p className="text-sm text-zinc-500">
        Completa los pasos anteriores para ver el resumen.
      </p>
    );
  }

  const levelDisplay = `${header.levelSystem} — ${header.levelAge}`;
  const categoryDisplay = header.categoryCode
    ? `${header.category} (${header.categoryCode})`
    : header.category;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-zinc-500">{t.wizard.step3.description}</p>
      <dl className="mt-2">
        <Row label={t.sheetLabels.country} value={header.country} />
        <Row label={t.sheetLabels.club} value={header.clubName} />
        <Row
          label={t.sheetLabels.participationNumber}
          value={header.participationNumber}
        />
        <Row label={t.sheetLabels.competition} value={header.competition} />
        <Row label="LEVEL" value={levelDisplay} />
        <Row label={t.sheetLabels.category} value={categoryDisplay} />
        <Row label={t.sheetLabels.exercise} value={header.exercise} />
        <Row label={t.sheetLabels.top} value={header.topName} />
        <Row label={t.sheetLabels.base} value={header.baseNames[0]} />
        <Row label={t.sheetLabels.contactName} value={header.contactName} />
        <Row label={t.sheetLabels.contactPhone} value={header.contactPhone} />
      </dl>
    </div>
  );
}
