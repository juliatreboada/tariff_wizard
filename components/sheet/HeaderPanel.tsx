"use client";

import { getMessages } from "@/lib/i18n";
import { exerciseLabel } from "@/lib/tariff/exercise-display";
import type { StoredHeader } from "@/lib/tariff/types";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-zinc-200 py-2 last:border-0 dark:border-zinc-800">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="text-xs text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

type HeaderPanelProps = {
  header: StoredHeader;
};

export function HeaderPanel({ header }: HeaderPanelProps) {
  const t = getMessages();
  const levelDisplay = `${header.levelSystem} — ${header.levelAge}`;
  const categoryDisplay = header.categoryCode
    ? `${header.category} (${header.categoryCode})`
    : header.category;

  return (
    <aside
      className="flex w-full shrink-0 flex-col border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:w-52"
      aria-label="Header"
    >
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t.sheet.headerTitle}
      </h2>
      <dl>
        <Row label={t.sheetLabels.country} value={header.country} />
        <Row label={t.sheetLabels.club} value={header.clubName} />
        <Row
          label={t.sheetLabels.participationNumber}
          value={header.participationNumber}
        />
        <Row label={t.sheetLabels.competition} value={header.competition} />
        <Row label="LEVEL" value={levelDisplay} />
        <Row label={t.sheetLabels.category} value={categoryDisplay} />
        <Row
          label={t.sheetLabels.exercise}
          value={exerciseLabel(header.exercise, t.exercises)}
        />
        <Row label={t.sheetLabels.top} value={header.topName} />
        <Row label={t.sheetLabels.base} value={header.baseNames[0]} />
        <Row label={t.sheetLabels.contactName} value={header.contactName} />
        <Row label={t.sheetLabels.contactPhone} value={header.contactPhone} />
      </dl>
    </aside>
  );
}
