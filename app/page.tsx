"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClubLogoUpload } from "@/components/ClubLogoUpload";
import { getMessages } from "@/lib/i18n";
import { exerciseLabel } from "@/lib/tariff/exercise-display";
import { categoryDisplayLabel } from "@/lib/tariff/level-category";
import type { DefaultProfile } from "@/lib/tariff/store";
import { useWizardStore } from "@/lib/tariff/store";
import { useStoreHydrated } from "@/lib/tariff/use-store-hydrated";

export default function Home() {
  const t = getMessages();
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const header = useWizardStore((s) => s.header);
  const routineCount = useWizardStore((s) => s.routine.length);
  const savedSheets = useWizardStore((s) => s.savedSheets);
  const loadSavedSheet = useWizardStore((s) => s.loadSavedSheet);
  const deleteSavedSheet = useWizardStore((s) => s.deleteSavedSheet);
  const saveProgressAndStartNew = useWizardStore((s) => s.saveProgressAndStartNew);
  const reset = useWizardStore((s) => s.reset);
  const defaultProfile = useWizardStore((s) => s.defaultProfile);
  const setDefaultProfile = useWizardStore((s) => s.setDefaultProfile);
  const [defaultsDraft, setDefaultsDraft] = useState<DefaultProfile>(defaultProfile);

  const hasHeader = Boolean(header);
  const resumeHref = hasHeader ? "/sheet" : "/wizard";
  const resumeLabel = hasHeader ? t.home.continueRoutine : t.home.continueWizard;

  useEffect(() => {
    setDefaultsDraft(defaultProfile);
  }, [defaultProfile]);

  function formatShortDate(iso: string): string {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openSaved(sheetId: string, path: "/sheet" | "/sheet/view" | "/sheet/print") {
    loadSavedSheet(sheetId);
    router.push(path);
  }

  function startNewWizard() {
    if (hasHeader) {
      saveProgressAndStartNew();
    } else {
      reset();
    }
    router.push("/wizard");
  }

  function saveDefaults() {
    setDefaultProfile(defaultsDraft);
  }

  return (
    <div className="app-page">
      <div className="app-shell app-shell-wide px-4 sm:px-6 lg:px-10">
      <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <section className="app-card h-full border-indigo-200 p-6 sm:p-8">
          <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
            {t.home.badge}
          </span>
          <h1 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {t.home.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-800 sm:text-base">
            {t.home.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={resumeHref}
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              {resumeLabel}
            </Link>
            <button
              type="button"
              onClick={startNewWizard}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {t.home.startWizard}
            </button>
          </div>
        </section>

        <section className="app-card h-full border-indigo-200 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
            {t.home.processTitle}
          </h2>
          <div className="mt-3 grid gap-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              {t.home.process1}
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              {t.home.process2}
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              {t.home.process3}
            </div>
          </div>
        </section>
      </main>
      
      <section className="app-card mt-6 border-zinc-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
          {t.home.defaultsTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-700">{t.home.defaultsHint}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            <span>{t.sheetLabels.club}</span>
            <input
              value={defaultsDraft.clubName}
              onChange={(e) =>
                setDefaultsDraft((prev) => ({ ...prev, clubName: e.target.value }))
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            <span>{t.sheetLabels.clubLogo}</span>
            <ClubLogoUpload
              value={defaultsDraft.clubLogo}
              onChange={(clubLogo) =>
                setDefaultsDraft((prev) => ({ ...prev, clubLogo }))
              }
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            <span>{t.sheetLabels.competition}</span>
            <input
              value={defaultsDraft.competition}
              onChange={(e) =>
                setDefaultsDraft((prev) => ({
                  ...prev,
                  competition: e.target.value,
                }))
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            <span>{t.sheetLabels.contactName}</span>
            <input
              value={defaultsDraft.contactName}
              onChange={(e) =>
                setDefaultsDraft((prev) => ({ ...prev, contactName: e.target.value }))
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            <span>{t.sheetLabels.country}</span>
            <input
              value={defaultsDraft.country}
              onChange={(e) =>
                setDefaultsDraft((prev) => ({ ...prev, country: e.target.value }))
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            <span>{t.sheetLabels.contactPhone}</span>
            <input
              type="tel"
              inputMode="tel"
              value={defaultsDraft.contactPhone}
              onChange={(e) =>
                setDefaultsDraft((prev) => ({ ...prev, contactPhone: e.target.value }))
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={saveDefaults}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          {t.home.defaultsSave}
        </button>
      </section>

      <section className="app-card mt-6 border-zinc-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
          {t.home.savedTitle}
        </h2>
        {!hydrated || savedSheets.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-700">{t.home.savedEmpty}</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {savedSheets.map((sheet) => (
              <li
                key={sheet.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
              >
                {(() => {
                  const gymnasts = [sheet.header.topName, ...sheet.header.baseNames]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-zinc-900">
                      {[sheet.header.clubName, gymnasts]
                        .filter(Boolean)
                        .join(" · ") || t.home.statusNoData}
                    </p>
                    <p className="text-sm text-zinc-700">
                      {sheet.header.levelAge} {sheet.header.levelSystem} ·{" "}
                      {categoryDisplayLabel(sheet.header)} ·{" "}
                      {exerciseLabel(sheet.header.exercise, t.exercises)}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {t.home.savedUpdated(formatShortDate(sheet.updatedAtIso))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openSaved(sheet.id, "/sheet")}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-white"
                    >
                      {t.home.openBuilder}
                    </button>
                    <button
                      type="button"
                      onClick={() => openSaved(sheet.id, "/sheet/view")}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-white"
                    >
                      {t.home.openPreview}
                    </button>
                    <button
                      type="button"
                      onClick={() => openSaved(sheet.id, "/sheet/print")}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-white"
                    >
                      {t.home.openPrint}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedSheet(sheet.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      {t.home.deleteSaved}
                    </button>
                  </div>
                </div>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </section>

      </div>
    </div>
  );
}
