"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { TariffSheet } from "@/components/sheet/TariffSheet";
import { computeSheetLayout } from "@/lib/tariff/compute-sheet-layout";
import { getMessages } from "@/lib/i18n";
import { useWizardStore } from "@/lib/tariff/store";
import { useStoreHydrated } from "@/lib/tariff/use-store-hydrated";

export function SheetPreviewView() {
  const t = getMessages();
  const router = useRouter();
  const header = useWizardStore((s) => s.header);
  const routine = useWizardStore((s) => s.routine);
  const valueBreakdown = useWizardStore((s) => s.valueBreakdown);
  const hydrated = useStoreHydrated();

  const layout = useMemo(() => {
    if (!header) return null;
    return computeSheetLayout(routine, header.exercise);
  }, [header, routine]);

  useEffect(() => {
    if (!hydrated) return;
    if (!header) {
      router.replace("/wizard");
      return;
    }
    if (routine.length === 0) {
      router.replace("/sheet");
    }
  }, [hydrated, header, routine.length, router]);

  if (!hydrated || !header || !layout) {
    return (
      <p className="px-6 py-12 text-sm text-zinc-500">{t.sheet.loading}</p>
    );
  }

  return (
    <div className="app-page sheet-preview-page">
      <div className="mx-auto flex w-full max-w-[297mm] flex-col gap-4 px-2 py-6 sm:px-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/sheet"
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← {t.routine.backToRoutine}
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{t.routine.previewTitle}</h1>
          <p className="text-sm text-zinc-500">{t.routine.previewSubtitle}</p>
        </div>
        <Link
          href="/sheet/print"
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          {t.sheet.printSheet}
        </Link>
      </header>

      <div className="ts-a4-scroll">
        <div className="ts-a4-page">
          <div className="ts-a4-frame">
            <TariffSheet
              header={header}
              layout={layout}
              valueBreakdown={valueBreakdown}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
