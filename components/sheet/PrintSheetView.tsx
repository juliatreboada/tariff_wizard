"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { TariffSheet } from "@/components/sheet/TariffSheet";
import { computeSheetLayout } from "@/lib/tariff/compute-sheet-layout";
import { getMessages } from "@/lib/i18n";
import { useWizardStore } from "@/lib/tariff/store";
import { pdfFilenameFromHeader } from "@/lib/tariff/sheet-banner";
import { useStoreHydrated } from "@/lib/tariff/use-store-hydrated";

export function PrintSheetView() {
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
    }
  }, [hydrated, header, router]);

  useEffect(() => {
    if (!header) return;
    const filename = pdfFilenameFromHeader(header);
    const previousTitle = document.title;
    document.title = filename;
    return () => {
      document.title = previousTitle;
    };
  }, [header]);

  if (!hydrated || !header || !layout) {
    return (
      <p className="px-6 py-12 text-sm text-zinc-500">{t.sheet.loading}</p>
    );
  }

  function handlePrint() {
    if (header) {
      document.title = pdfFilenameFromHeader(header);
    }
    window.print();
  }

  return (
    <div className="app-page print-sheet-root">
      <div className="print-toolbar sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[297mm] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{t.print.title}</h1>
            <p className="text-sm text-zinc-600">{t.print.hint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sheet/view"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              {t.print.backToSheet}
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              {t.print.printButton}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto p-4 print:p-0">
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
