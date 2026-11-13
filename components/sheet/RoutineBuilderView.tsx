"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ElementPickerPanel,
  type ElementPickerSelection,
} from "@/components/sheet/ElementPickerPanel";
import { PickerModal } from "@/components/sheet/PickerModal";
import { catalogImageUrl } from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import {
  groupRoutineForDisplay,
  sortIndividualGroupItems,
} from "@/lib/tariff/routine-groups";
import { routineRoleLabel } from "@/lib/tariff/routine-role-label";
import { evaluateRules, rulesetFor } from "@/lib/tariff/rulesets";
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
  const removeAddOn = useWizardStore((s) => s.removeAddOn);
  const moveRoutineItem = useWizardStore((s) => s.moveRoutineItem);
  const setRoutineItemLinked = useWizardStore((s) => s.setRoutineItemLinked);
  const replaceRoutineElement = useWizardStore((s) => s.replaceRoutineElement);
  const replaceIndividualGroup = useWizardStore((s) => s.replaceIndividualGroup);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkNext, setLinkNext] = useState(false);
  const [editingSingle, setEditingSingle] = useState<{
    itemId: string;
    block: "balance" | "dynamic";
  } | null>(null);
  const ruleset = rulesetFor(header);
  const escolarStatus = evaluateRules(ruleset, header, routine);

  function savePickerSelection(selection: ElementPickerSelection): boolean {
    if (selection.kind === "single") {
      if (editingSingle) {
        return replaceRoutineElement(editingSingle.itemId, selection.entry);
      }
      return addRoutineElement(selection.entry, {
        linkedToPrevious: linkNext && routine.length > 0,
        block: selection.block,
        attachTo: selection.attachTo,
      });
    }
    if (selection.replaceGroupId) {
      return replaceIndividualGroup(selection.replaceGroupId, selection.picks);
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

      {ruleset ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {t.routine.checklistTitle(ruleset.label)}
              </p>
              <ul className="mt-2 grid gap-2 text-xs text-amber-900 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
                {/* Free composition (Youth, Junior, Senior): its Special Requirements. */}
                {escolarStatus.requirements?.map((req) => (
                  <li key={req.id} className="rounded-md border border-amber-200/80 bg-white/60 px-2 py-1.5">
                    {req.pending ? (
                      <>
                        <span className="font-medium">–</span> {req.label} ({t.wizard.comingSoon})
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{req.met ? "✓" : "□"}</span> {req.label} ({req.actual}
                        {req.min !== undefined ? `/${req.min}` : ""}
                        {req.max !== undefined ? `, máx. ${req.max}` : ""})
                      </>
                    )}
                  </li>
                ))}
                {!escolarStatus.requirements && ((
                  [
                    [escolarStatus.compulsoryBalance, t.routine.escolarRuleCompBalance, false, "balance"],
                    [escolarStatus.compulsoryDynamic, t.routine.escolarRuleCompDynamic, false, "dynamic"],
                    [escolarStatus.optionalBalance, t.routine.escolarRuleOptBalance, false, "balance"],
                    [escolarStatus.optionalDynamic, t.routine.escolarRuleOptDynamic, false, "dynamic"],
                    [escolarStatus.individualPerGymnast, t.routine.escolarRuleIndividuals, true, null],
                  ] as const
                )
                  // A Balance routine has no dynamic requirements, and vice versa.
                  .filter(
                    ([, , , block]) =>
                      !(header?.exercise === "Balance" && block === "dynamic") &&
                      !(header?.exercise === "Dynamic" && block === "balance"),
                  )
                  .map(([req, label, alwaysCount]) => (
                  <li
                    key={label}
                    className={`rounded-md border border-amber-200/80 bg-white/60 px-2 py-1.5 ${alwaysCount ? "sm:col-span-2 lg:col-span-1" : ""}`}
                  >
                    {req.expected === 0 ? (
                      // Required by the rules but not in the catalog yet.
                      <>
                        <span className="font-medium">–</span> {label} ({t.wizard.comingSoon})
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{req.actual >= req.expected ? "✓" : "□"}</span>{" "}
                        {label}
                        {alwaysCount || req.expected > 1 ? ` (${req.actual}/${req.expected})` : ""}
                      </>
                    )}
                    {req.valueRange ? (
                      <span className="block text-[11px] text-amber-800">
                        {t.routine.optionalValueRange(req.valueRange.min, req.valueRange.max)}
                      </span>
                    ) : null}
                  </li>
                )))}
              </ul>
            </div>
            <p className="shrink-0 text-xs font-semibold text-amber-900 lg:pt-6 lg:text-sm">
              {t.routine.escolarPenalty}:{" "}
              {escolarStatus.penaltyTotal > 0 ? "-" : ""}
              {escolarStatus.penaltyTotal.toFixed(1)}
            </p>
          </div>
          {escolarStatus.pendingMessages.length > 0 ? (
            <ul className="mt-2 text-xs text-amber-800">
              {escolarStatus.pendingMessages.map((msg) => (
                <li key={msg} className="list-none">
                  · {msg}
                </li>
              ))}
            </ul>
          ) : null}
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
        <>
        <p className="text-xs text-zinc-500">{t.routine.linkedHint}</p>
        <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {displayRows.map((row) => {
            const controlId =
              row.kind === "single" ? row.item.id : row.items[0]?.id ?? row.groupId;
            const linked =
              row.kind === "single"
                ? row.item.linkedToPrevious
                : row.items[0]?.linkedToPrevious ?? false;
            const iconButton =
              "flex h-8 min-w-8 items-center justify-center rounded border border-zinc-300 px-1.5 text-[13px] hover:bg-zinc-50 disabled:opacity-40";

            return (
              <li
                key={row.kind === "single" ? row.item.id : row.groupId}
                className={`flex min-w-0 flex-col rounded-xl border bg-white p-2.5 ${
                  linked ? "border-zinc-400" : "border-zinc-200"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold tabular-nums">
                    {row.index + 1}
                  </span>
                  <span className="truncate text-[11px] text-zinc-600">
                    {row.kind === "single"
                      ? `${blockLabel(row.item.block, t)}${row.item.role ? ` · ${routineRoleLabel(row.item.role, t.routine)}` : ""}`
                      : t.routine.escolarIndividual}
                  </span>
                  {linked ? (
                    <span className="ml-auto text-[11px] text-zinc-500" title={t.routine.linked}>
                      <span aria-hidden="true">🔗</span>
                      <span className="sr-only">{t.routine.linked}</span>
                    </span>
                  ) : null}
                </div>

                {row.kind === "single" ? (
                  <div className="mt-2 flex min-w-0 flex-1 flex-col items-center">
                    <div className="flex w-full items-end justify-center gap-1">
                      <Image
                        src={catalogImageUrl(row.item.element.image, row.item.element.catalog)}
                        alt={row.item.element.coordinates}
                        width={120}
                        height={84}
                        className="h-20 w-full min-w-0 object-contain"
                      />
                      {row.item.addOn ? (
                        <Image
                          src={catalogImageUrl(row.item.addOn.image, row.item.addOn.catalog)}
                          alt={row.item.addOn.coordinates}
                          width={56}
                          height={42}
                          className="h-12 w-12 shrink-0 object-contain"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 w-full truncate text-center font-mono text-xs font-semibold text-zinc-900">
                      {row.item.element.coordinates}
                      {row.item.addOn ? ` + ${row.item.addOn.coordinates}` : ""}
                      <span className="ml-1.5 rounded bg-zinc-100 px-1 font-medium">
                        {formatSheetValue(row.item.element.value + (row.item.addOn?.value ?? 0))}
                      </span>
                    </p>
                    {row.item.addOn ? (
                      <button
                        type="button"
                        onClick={() => removeAddOn(row.item.id)}
                        className="mt-0.5 rounded px-1.5 text-[11px] text-zinc-600 hover:bg-zinc-100"
                      >
                        {t.routine.removeAddOn(row.item.addOn.coordinates)}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div
                    className="mt-2 grid min-w-0 flex-1 gap-1"
                    style={{ gridTemplateColumns: `repeat(${row.items.length}, minmax(0, 1fr))` }}
                  >
                    {sortIndividualGroupItems(row.items).map((item) => (
                      <div key={item.id} className="flex min-w-0 flex-col items-center">
                        <Image
                          src={catalogImageUrl(item.element.image, item.element.catalog)}
                          alt={item.element.coordinates}
                          width={56}
                          height={42}
                          className="h-14 w-full object-contain"
                        />
                        <p className="w-full truncate text-center text-[10px] font-medium text-zinc-700">
                          {item.gymnastRole === "top"
                            ? t.routine.topRole
                            : `${t.routine.baseRole}${row.items.length > 2 ? ` ${(item.baseIndex ?? 0) + 1}` : ""}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex flex-col gap-1.5 border-t border-zinc-100 pt-2">
                  <label
                    className="flex items-center gap-1.5 text-[12px] text-zinc-700"
                    title={row.index === 0 ? t.routine.linkedHintFirst : t.routine.linkedHint}
                  >
                    <input
                      type="checkbox"
                      checked={linked}
                      disabled={row.index === 0}
                      onChange={(e) => setRoutineItemLinked(controlId, e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    {t.routine.linked}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={row.index === 0}
                      onClick={() => moveRoutineItem(controlId, "up")}
                      className={iconButton}
                      aria-label={t.routine.moveUp}
                      title={t.routine.moveUp}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={row.index === displayRows.length - 1}
                      onClick={() => moveRoutineItem(controlId, "down")}
                      className={iconButton}
                      aria-label={t.routine.moveDown}
                      title={t.routine.moveDown}
                    >
                      →
                    </button>
                    {row.kind === "single" &&
                    (row.item.block === "balance" || row.item.block === "dynamic") ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroupId(null);
                          setEditingSingle({
                            itemId: row.item.id,
                            block: row.item.block === "dynamic" ? "dynamic" : "balance",
                          });
                          setPickerOpen(true);
                        }}
                        className={iconButton}
                      >
                        {t.routine.edit}
                      </button>
                    ) : row.kind === "individual-group" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSingle(null);
                          setEditingGroupId(row.groupId);
                          setPickerOpen(true);
                        }}
                        className={iconButton}
                      >
                        {t.routine.edit}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        removeRoutineItem(controlId);
                        if (editingSingle?.itemId === controlId) {
                          setPickerOpen(false);
                          setEditingSingle(null);
                        }
                      }}
                      className={`${iconButton} ml-auto text-red-700 hover:bg-red-50`}
                    >
                      {t.routine.remove}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        </>
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
        <button
          type="button"
          onClick={() => {
            setEditingSingle(null);
            setEditingGroupId(null);
            setPickerOpen(true);
          }}
          className="h-11 w-full rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 sm:w-auto"
        >
          {t.routine.addElement}
        </button>
        {pickerOpen ? (
          <PickerModal
            label={editingSingle || editingGroupId ? t.routine.editElement : t.routine.addElement}
            onClose={() => {
              setPickerOpen(false);
              setEditingSingle(null);
              setEditingGroupId(null);
            }}
          >
            <ElementPickerPanel
              key={editingSingle?.itemId ?? editingGroupId ?? "add"}
              variant="popover"
              header={header}
              editItemId={editingSingle?.itemId}
              editBlock={editingSingle?.block}
              editGroupId={editingGroupId ?? undefined}
              onClose={() => {
                setPickerOpen(false);
                setEditingSingle(null);
                setEditingGroupId(null);
              }}
              onSave={(selection) => {
                const ok = savePickerSelection(selection);
                if (ok) {
                  setPickerOpen(false);
                  setLinkNext(false);
                  setEditingSingle(null);
                  setEditingGroupId(null);
                }
                return ok;
              }}
            />
          </PickerModal>
        ) : null}
      </div>
    </div>
  );
}
