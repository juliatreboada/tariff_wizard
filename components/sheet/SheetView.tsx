"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RoutineBuilderView } from "@/components/sheet/RoutineBuilderView";
import { getMessages } from "@/lib/i18n";
import { useWizardStore } from "@/lib/tariff/store";
import { useStoreHydrated } from "@/lib/tariff/use-store-hydrated";

export function SheetView() {
  const t = getMessages();
  const router = useRouter();
  const header = useWizardStore((s) => s.header);
  const reset = useWizardStore((s) => s.reset);
  const hydrated = useStoreHydrated();
  const [confirmNewSheet, setConfirmNewSheet] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!header) {
      router.replace("/wizard");
    }
  }, [hydrated, header, router]);

  if (!hydrated) {
    return (
      <p className="px-6 py-12 text-sm text-zinc-500">{t.sheet.loading}</p>
    );
  }

  if (!header) {
    return null;
  }

  function handleNewSheet() {
    reset();
    router.push("/wizard");
  }

  return (
    <div className="app-page">
      <div className="app-shell app-shell-wide px-4 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/wizard"
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← {t.sheet.backToWizard}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {t.routine.title}
          </h1>
          <p className="text-sm text-zinc-500">{t.sheet.savedLocally}</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {!confirmNewSheet ? (
            <button
              type="button"
              onClick={() => setConfirmNewSheet(true)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              {t.sheet.newSheet}
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-900">{t.sheet.newSheetConfirm}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleNewSheet}
                  className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                  {t.sheet.newSheetYes}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmNewSheet(false)}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs"
                >
                  {t.sheet.newSheetNo}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <RoutineBuilderView header={header} />
      </div>
    </div>
  );
}
