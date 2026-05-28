"use client";

import Image from "next/image";
import { useState } from "react";
import {
  BALANCE_SUBTYPES,
  catalogImageUrl,
  filterCatalogEntries,
  getCatalogEntries,
  type BalanceSubtype,
  type CatalogEntry,
} from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import { isCatalogIdUsedInRoutine } from "@/lib/tariff/element-uniqueness";
import type { StoredHeader } from "@/lib/tariff/types";
import { useWizardStore } from "@/lib/tariff/store";
import { formatSheetValue } from "@/lib/tariff/value-breakdown";

type PickerStep = "subtype" | "picture" | "review";

type ElementPickerPanelProps = {
  header: StoredHeader;
  onClose: () => void;
  onSave: (entry: CatalogEntry) => boolean;
  variant?: "panel" | "popover";
};

function subtypeLabel(
  subtype: BalanceSubtype,
  t: ReturnType<typeof getMessages>,
): string {
  const map = {
    mount: t.sheet.picker.subtypeMount,
    static: t.sheet.picker.subtypeStatic,
    motion: t.sheet.picker.subtypeMotion,
  };
  return map[subtype];
}

export function ElementPickerPanel({
  header,
  onClose,
  onSave,
  variant = "panel",
}: ElementPickerPanelProps) {
  const t = getMessages();
  const allEntries = getCatalogEntries();
  const routine = useWizardStore((s) => s.routine);

  const [step, setStep] = useState<PickerStep>("subtype");
  const [subtype, setSubtype] = useState<BalanceSubtype | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);

  const pictureEntries = (
    subtype === null
      ? []
      : filterCatalogEntries(allEntries, { header, subtype })
  ).filter((entry) => !isCatalogIdUsedInRoutine(routine, entry.id));

  function handleSubtypePick(next: BalanceSubtype) {
    setSubtype(next);
    setSelectedEntry(null);
    setDuplicateError(false);
    setStep("picture");
  }

  function handlePicturePick(entry: CatalogEntry) {
    setSelectedEntry(entry);
    setDuplicateError(false);
    setStep("review");
  }

  function handleSave() {
    if (!selectedEntry) return;
    if (!onSave(selectedEntry)) {
      setDuplicateError(true);
      return;
    }
    onClose();
  }

  const isPopover = variant === "popover";
  const shellClass = isPopover
    ? "flex w-full max-w-md flex-col rounded-xl border border-zinc-300 bg-white shadow-lg"
    : "flex w-full shrink-0 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm lg:w-80";

  const reviewImage = selectedEntry
    ? catalogImageUrl(selectedEntry.image)
    : null;

  return (
    <aside className={shellClass} aria-label={t.sheet.picker.stepSubtype}>
      <header
        className={`flex items-center justify-between border-b border-zinc-200 ${isPopover ? "px-3 py-2" : "px-4 py-3"}`}
      >
        <p className="text-xs text-zinc-600">
          {t.sheet.picker.stepIndicator(step)}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2.5 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          aria-label={t.sheet.picker.close}
        >
          ×
        </button>
      </header>

      <div
        className={`flex flex-1 flex-col gap-3 ${isPopover ? "max-h-[min(70vh,420px)] overflow-y-auto p-3" : "p-4"}`}
      >
        {step === "subtype" && (
          <>
            <p className="text-sm text-zinc-600">{t.sheet.picker.stepSubtype}</p>
            <div className="flex flex-col gap-2">
              {BALANCE_SUBTYPES.map((st) => {
                const count = filterCatalogEntries(allEntries, {
                  header,
                  subtype: st,
                }).filter(
                  (e) => !isCatalogIdUsedInRoutine(routine, e.id),
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSubtypePick(st)}
                    className="rounded-lg border border-zinc-200 px-4 py-3.5 text-left text-sm font-medium hover:bg-zinc-50"
                  >
                    {subtypeLabel(st, t)}
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "picture" && subtype && (
          <>
            <button
              type="button"
              onClick={() => setStep("subtype")}
              className="self-start rounded px-1 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              ← {t.sheet.picker.back}
            </button>
            <p className="text-sm text-zinc-600">
              {t.sheet.picker.stepPicture} — {subtypeLabel(subtype, t)}
            </p>
            {pictureEntries.length === 0 ? (
              <p className="text-sm text-amber-700">{t.sheet.catalogEmpty}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-2">
                {pictureEntries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => handlePicturePick(entry)}
                      className="flex w-full flex-col items-center rounded-lg border border-zinc-200 p-2.5 hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      <Image
                        src={catalogImageUrl(entry.image)}
                        alt={entry.label}
                        width={120}
                        height={80}
                        className="h-16 w-full object-contain"
                      />
                      <span className="mt-1 w-full truncate text-center text-xs font-medium">
                        {entry.label}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {entry.galicianCode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === "review" && selectedEntry && reviewImage && (
          <>
            <button
              type="button"
              onClick={() => setStep("picture")}
              className="self-start rounded px-1 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              ← {t.sheet.picker.back}
            </button>
            <p className="text-sm text-zinc-600">{t.sheet.picker.stepReview}</p>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 p-4">
              <Image
                src={reviewImage}
                alt={selectedEntry.label}
                width={160}
                height={120}
                className="max-h-28 object-contain"
              />
              <dl className="w-full space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">SH</dt>
                  <dd className="font-mono">{selectedEntry.galicianCode}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">VALUE</dt>
                  <dd className="font-mono tabular-nums">
                    {formatSheetValue(selectedEntry.value)}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="-mx-3 mt-1 flex flex-col gap-2 border-t border-zinc-200 bg-white px-3 pt-3 pb-1 sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
              {duplicateError ? (
                <p className="text-sm text-amber-700">
                  {t.sheet.picker.duplicateElement}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                className="h-11 rounded-full bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700"
              >
                {t.sheet.picker.save}
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
