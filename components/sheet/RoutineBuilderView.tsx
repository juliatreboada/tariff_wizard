"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ElementPickerPanel } from "@/components/sheet/ElementPickerPanel";
import { catalogImageUrl } from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import type { StoredHeader } from "@/lib/tariff/types";
import type { RoutineItem } from "@/lib/tariff/routine-types";
import { useWizardStore } from "@/lib/tariff/store";
import { formatSheetValue } from "@/lib/tariff/value-breakdown";

type RoutineBuilderViewProps = {
  header: StoredHeader;
};

function blockLabel(
  block: RoutineItem["block"],
  t: ReturnType<typeof getMessages>,
): string {
  const map = {
    balance: t.routine.blockBalance,
    dynamic: t.routine.blockDynamic,
    combined: t.routine.blockCombined,
  };
  return map[block];
}

export function RoutineBuilderView({ header }: RoutineBuilderViewProps) {
  const t = getMessages();
  const routine = useWizardStore((s) => s.routine);
  const addRoutineElement = useWizardStore((s) => s.addRoutineElement);
  const removeRoutineItem = useWizardStore((s) => s.removeRoutineItem);
  const moveRoutineItem = useWizardStore((s) => s.moveRoutineItem);
  const setRoutineItemLinked = useWizardStore((s) => s.setRoutineItemLinked);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkNext, setLinkNext] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm text-zinc-600">{t.routine.description}</p>
          <p className="mt-1 text-xs text-zinc-500">{t.routine.linkHint}</p>
        </div>
        <Link
          href="/sheet/view"
          className={`inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium sm:w-auto ${
            routine.length === 0
              ? "pointer-events-none border border-zinc-200 text-zinc-400"
              : "bg-zinc-900 text-white hover:bg-zinc-700"
          }`}
          aria-disabled={routine.length === 0}
        >
          {t.routine.viewSheet}
        </Link>
      </div>

      {routine.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          {t.routine.empty}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {routine.map((item, index) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold tabular-nums">
                  {index + 1}
                </span>
                <Image
                  src={catalogImageUrl(item.element.image)}
                  alt={item.element.label}
                  width={64}
                  height={48}
                  className="h-12 w-16 shrink-0 rounded border border-zinc-100 bg-zinc-50 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-5 text-zinc-900 sm:text-sm">
                    {item.element.label}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-zinc-700">
                    {item.element.galicianCode}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-700">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium">
                      {formatSheetValue(item.element.value)}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5">
                      {blockLabel(item.block, t)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-[13px] text-zinc-700">
                  <input
                    type="checkbox"
                    checked={item.linkedToPrevious}
                    disabled={index === 0}
                    onChange={(e) =>
                      setRoutineItemLinked(item.id, e.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  {t.routine.linked}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveRoutineItem(item.id, "up")}
                    className="rounded border border-zinc-300 px-3 py-2 text-[13px] disabled:opacity-40"
                    aria-label={t.routine.moveUp}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === routine.length - 1}
                    onClick={() => moveRoutineItem(item.id, "down")}
                    className="rounded border border-zinc-300 px-3 py-2 text-[13px] disabled:opacity-40"
                    aria-label={t.routine.moveDown}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRoutineItem(item.id)}
                    className="rounded border border-zinc-300 px-3 py-2 text-[13px] text-red-700 hover:bg-red-50"
                  >
                    {t.routine.remove}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={linkNext}
            onChange={(e) => setLinkNext(e.target.checked)}
            disabled={routine.length === 0}
            className="rounded border-zinc-300"
          />
          {t.routine.linkNextAdd}
        </label>
        {!pickerOpen ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="h-11 w-full rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 sm:w-auto"
          >
            {t.routine.addElement}
          </button>
        ) : (
          <ElementPickerPanel
            variant="popover"
            header={header}
            onClose={() => setPickerOpen(false)}
            onSave={(entry) => {
              const ok = addRoutineElement(entry, {
                linkedToPrevious: linkNext && routine.length > 0,
              });
              if (ok) {
                setPickerOpen(false);
                setLinkNext(false);
              }
              return ok;
            }}
          />
        )}
      </div>
    </div>
  );
}
