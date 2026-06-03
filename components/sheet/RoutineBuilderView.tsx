"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ElementPickerPanel,
  type ElementPickerSelection,
} from "@/components/sheet/ElementPickerPanel";
import { catalogImageUrl } from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import {
  groupRoutineForDisplay,
  sortIndividualGroupItems,
} from "@/lib/tariff/routine-groups";
import { routineRoleLabel } from "@/lib/tariff/routine-role-label";
import { evaluateEscolarRules, isEscolarRuleset } from "@/lib/tariff/rules-escolar";
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
  const addIndividualGroup = useWizardStore((s) => s.addIndividualGroup);
  const removeRoutineItem = useWizardStore((s) => s.removeRoutineItem);
  const moveRoutineItem = useWizardStore((s) => s.moveRoutineItem);
  const setRoutineItemLinked = useWizardStore((s) => s.setRoutineItemLinked);
  const replaceRoutineElement = useWizardStore((s) => s.replaceRoutineElement);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkNext, setLinkNext] = useState(false);
  const [editingSingle, setEditingSingle] = useState<{
    itemId: string;
    block: "balance" | "dynamic";
  } | null>(null);
  const escolarMode = isEscolarRuleset(header);
  const escolarStatus = evaluateEscolarRules(header, routine);

  function savePickerSelection(selection: ElementPickerSelection): boolean {
    if (selection.kind === "single") {
      if (editingSingle) {
        return replaceRoutineElement(editingSingle.itemId, selection.entry);
      }
      return addRoutineElement(selection.entry, {
        linkedToPrevious: linkNext && routine.length > 0,
        block: selection.block,
      });
    }
    return addIndividualGroup(
      selection.picks.map((pick) => ({
        entry: pick.entry,
        gymnastRole: pick.gymnastRole,
        baseIndex: pick.baseIndex,
      })),
      { linkedToPrevious: linkNext && routine.length > 0 },
    );
  }

  const displayRows = groupRoutineForDisplay(routine);

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

      {escolarMode ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {t.routine.escolarChecklistTitle}
              </p>
              <ul className="mt-2 grid gap-2 text-xs text-amber-900 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
                <li className="rounded-md border border-amber-200/80 bg-white/60 px-2 py-1.5">
                  <span className="font-medium">
                    {escolarStatus.missingCompulsoryBalance ? "□" : "✓"}
                  </span>{" "}
                  {t.routine.escolarRuleCompBalance}
                </li>
                <li className="rounded-md border border-amber-200/80 bg-white/60 px-2 py-1.5">
                  <span className="font-medium">
                    {escolarStatus.missingCompulsoryDynamic ? "□" : "✓"}
                  </span>{" "}
                  {t.routine.escolarRuleCompDynamic}
                </li>
                <li className="rounded-md border border-amber-200/80 bg-white/60 px-2 py-1.5">
                  <span className="font-medium">
                    {escolarStatus.missingOptionalBalance ? "□" : "✓"}
                  </span>{" "}
                  {t.routine.escolarRuleOptBalance}
                </li>
                <li className="rounded-md border border-amber-200/80 bg-white/60 px-2 py-1.5">
                  <span className="font-medium">
                    {escolarStatus.missingOptionalDynamic ? "□" : "✓"}
                  </span>{" "}
                  {t.routine.escolarRuleOptDynamic}
                </li>
                <li className="rounded-md border border-amber-200/80 bg-white/60 px-2 py-1.5 sm:col-span-2 lg:col-span-1">
                  <span className="font-medium">
                    {escolarStatus.missingIndividuals ? "□" : "✓"}
                  </span>{" "}
                  {t.routine.escolarRuleIndividuals} (
                  {escolarStatus.individualPerGymnast.actual}/
                  {escolarStatus.individualPerGymnast.expected})
                </li>
              </ul>
            </div>
            <p className="shrink-0 text-xs font-semibold text-amber-900 lg:pt-6 lg:text-sm">
              {t.routine.escolarPenalty}: -{escolarStatus.penaltyTotal.toFixed(1)}
            </p>
          </div>
          {escolarStatus.missingMessages.length > 0 ? (
            <div className="mt-3 border-t border-amber-200/80 pt-3">
              <p className="text-xs font-medium text-amber-900">
                {t.routine.escolarMissingTitle}
              </p>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-900">
                {escolarStatus.missingMessages.map((msg) => (
                  <li key={msg} className="list-none">
                    · {msg}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {displayRows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          {t.routine.empty}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {displayRows.map((row) => {
            const controlId =
              row.kind === "single" ? row.item.id : row.items[0]?.id ?? row.groupId;
            const linked =
              row.kind === "single"
                ? row.item.linkedToPrevious
                : row.items[0]?.linkedToPrevious ?? false;

            return (
              <li
                key={row.kind === "single" ? row.item.id : row.groupId}
                className="rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold tabular-nums">
                    {row.index + 1}
                  </span>
                  {row.kind === "single" ? (
                    <>
                      <Image
                        src={catalogImageUrl(row.item.element.image)}
                        alt={row.item.element.coordinates}
                        width={96}
                        height={72}
                        className="h-[4.5rem] w-24 shrink-0 rounded border border-zinc-100 bg-zinc-50 object-contain sm:h-20 sm:w-28"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[15px] font-semibold leading-5 text-zinc-900 sm:text-sm">
                          {row.item.element.coordinates}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-700">
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium">
                            {formatSheetValue(row.item.element.value)}
                          </span>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5">
                            {blockLabel(row.item.block, t)}
                            {row.item.role
                              ? ` · ${routineRoleLabel(row.item.role, t.routine)}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-zinc-900 sm:text-sm">
                        {t.routine.escolarIndividual} ({row.items.length}{" "}
                        {t.routine.escolarGymnastsInSet})
                      </p>
                      <div
                        className="mt-2 grid w-full min-w-0 gap-1 sm:gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${row.items.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {sortIndividualGroupItems(row.items).map((item) => (
                          <div
                            key={item.id}
                            className="flex min-w-0 flex-col items-center rounded-lg border border-zinc-100 bg-zinc-50 p-1 sm:p-1.5"
                          >
                            <Image
                              src={catalogImageUrl(item.element.image)}
                              alt={item.element.coordinates}
                              width={56}
                              height={42}
                              className="h-10 w-full object-contain"
                            />
                            <p className="mt-1 w-full truncate text-center text-[10px] font-medium">
                              {item.gymnastRole === "top"
                                ? t.routine.topRole
                                : t.routine.baseRole}
                            </p>
                            <p className="w-full truncate text-center font-mono text-[9px] text-zinc-600">
                              {formatSheetValue(item.element.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-[13px] text-zinc-700">
                      <input
                        type="checkbox"
                        checked={linked}
                        disabled={row.index === 0}
                        onChange={(e) =>
                          setRoutineItemLinked(controlId, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {t.routine.linked}
                    </label>
                    <p className="text-xs text-zinc-500">
                      {row.index === 0
                        ? t.routine.linkedHintFirst
                        : t.routine.linkedHint}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-1">
                    {row.kind === "single" &&
                    (row.item.block === "balance" || row.item.block === "dynamic") ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSingle({
                            itemId: row.item.id,
                            block:
                              row.item.block === "dynamic" ? "dynamic" : "balance",
                          });
                          setPickerOpen(true);
                        }}
                        className="rounded border border-zinc-300 px-3 py-2 text-[13px]"
                      >
                        {t.routine.edit}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={row.index === 0}
                      onClick={() => moveRoutineItem(controlId, "up")}
                      className="rounded border border-zinc-300 px-3 py-2 text-[13px] disabled:opacity-40"
                      aria-label={t.routine.moveUp}
                    >
                      ↑ {t.routine.moveUp}
                    </button>
                    <button
                      type="button"
                      disabled={row.index === displayRows.length - 1}
                      onClick={() => moveRoutineItem(controlId, "down")}
                      className="rounded border border-zinc-300 px-3 py-2 text-[13px] disabled:opacity-40"
                      aria-label={t.routine.moveDown}
                    >
                      ↓ {t.routine.moveDown}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRoutineItem(controlId)}
                      className="rounded border border-zinc-300 px-3 py-2 text-[13px] text-red-700 hover:bg-red-50"
                    >
                      {t.routine.remove}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
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
            onClick={() => {
              setEditingSingle(null);
              setPickerOpen(true);
            }}
            className="h-11 w-full rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 sm:w-auto"
          >
            {t.routine.addElement}
          </button>
        ) : (
          <ElementPickerPanel
            variant="popover"
            header={header}
            editItemId={editingSingle?.itemId}
            editBlock={editingSingle?.block}
            onClose={() => {
              setPickerOpen(false);
              setEditingSingle(null);
            }}
            onSave={(selection) => {
              const ok = savePickerSelection(selection);
              if (ok) {
                setPickerOpen(false);
                setLinkNext(false);
                setEditingSingle(null);
              }
              return ok;
            }}
          />
        )}
      </div>
    </div>
  );
}
