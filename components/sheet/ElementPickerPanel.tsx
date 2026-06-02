"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  catalogImageUrl,
  filterCatalogEntries,
  getCatalogEntries,
  groupCatalogEntriesByRow,
  type CatalogEntry,
  type ElementFamily,
  type ElementType,
} from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import { isCatalogIdUsedInRoutine } from "@/lib/tariff/element-uniqueness";
import { rowKeysUsedInRoutine } from "@/lib/tariff/row-uniqueness";
import { gymnastKeysForHeader } from "@/lib/tariff/routine-groups";
import type { RoutineGymnastRole } from "@/lib/tariff/routine-types";
import type { StoredHeader } from "@/lib/tariff/types";
import { useWizardStore } from "@/lib/tariff/store";
import { formatSheetValue } from "@/lib/tariff/value-breakdown";

type PickerElementType = "balance" | "dynamic" | "individual";
type PickerRole = "compulsory" | "optional";

const INDIVIDUAL_TYPES: ElementType[] = ["EQ", "FLEX", "AG", "TUM"];

type GymnastPickState = {
  type: ElementType;
  entry?: CatalogEntry;
};

export type ElementPickerSelection =
  | {
      kind: "single";
      entry: CatalogEntry;
      block: "balance" | "dynamic";
      role: PickerRole;
    }
  | {
      kind: "individual";
      picks: Array<{
        gymnastRole: RoutineGymnastRole;
        baseIndex?: number;
        entry: CatalogEntry;
      }>;
    };

type ElementPickerPanelProps = {
  header: StoredHeader;
  onClose: () => void;
  onSave: (selection: ElementPickerSelection) => boolean;
  variant?: "panel" | "popover";
};

function entriesForFamily(
  allEntries: CatalogEntry[],
  header: StoredHeader,
  elementFamily: ElementFamily,
  type?: ElementType,
): CatalogEntry[] {
  return filterCatalogEntries(allEntries, { header, elementFamily, type });
}

function ElementPickerPreview({
  entry,
  title,
  onBack,
  onSave,
  saveDisabled,
  role,
  onRoleChange,
  showRole,
  duplicateError,
  t,
}: {
  entry: CatalogEntry;
  title?: string;
  onBack: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  role?: PickerRole;
  onRoleChange?: (role: PickerRole) => void;
  showRole?: boolean;
  duplicateError?: boolean;
  t: ReturnType<typeof getMessages>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
      {title ? (
        <p className="mb-3 text-xs font-semibold text-zinc-800">{title}</p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-start gap-3">
          <div className="w-full max-w-[220px] rounded-lg border border-zinc-200 bg-white p-3">
            <Image
              src={catalogImageUrl(entry.image)}
              alt={entry.coordinates}
              width={200}
              height={140}
              className="h-32 w-full object-contain sm:h-36"
            />
          </div>
          {showRole && role != null && onRoleChange ? (
            <label className="flex max-w-[9rem] cursor-pointer items-start gap-2 pt-1 text-sm text-zinc-800">
              <input
                type="checkbox"
                checked={role === "optional"}
                onChange={(e) =>
                  onRoleChange(e.target.checked ? "optional" : "compulsory")
                }
                className="mt-0.5 size-4 shrink-0 rounded border-zinc-300"
              />
              <span className="leading-snug">{t.routine.escolarOptional}</span>
            </label>
          ) : null}
        </div>
        <dl className="min-w-0 flex-1 space-y-2 text-sm">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              {t.sheet.picker.previewCoordinates}
            </dt>
            <dd className="font-medium text-zinc-900">{entry.coordinates}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              {t.sheet.picker.previewValue}
            </dt>
            <dd className="font-mono text-zinc-900">{formatSheetValue(entry.value)}</dd>
          </div>
          {entry.holdDuration ? (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {t.sheet.picker.previewHold}
              </dt>
              <dd className="text-zinc-900">{entry.holdDuration}</dd>
            </div>
          ) : null}
          {entry.rotation ? (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {t.sheet.picker.previewRotation}
              </dt>
              <dd className="text-zinc-900">{entry.rotation}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      {duplicateError ? (
        <p className="mt-3 text-sm text-amber-700">{t.sheet.picker.duplicateElement}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-10 rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-white"
        >
          {t.sheet.picker.previewBack}
        </button>
        <button
          type="button"
          disabled={saveDisabled}
          onClick={onSave}
          className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white enabled:hover:bg-zinc-700 disabled:opacity-40"
        >
          {t.sheet.picker.save}
        </button>
      </div>
    </div>
  );
}

function CatalogRowGrid({
  entries,
  disabledRowKeys,
  rowDisabledHint,
  onSelect,
}: {
  entries: CatalogEntry[];
  disabledRowKeys: Set<string>;
  rowDisabledHint: string;
  onSelect: (entry: CatalogEntry) => void;
}) {
  const rows = useMemo(() => groupCatalogEntriesByRow(entries), [entries]);

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ rowKey, rowLabel, entries: rowEntries }) => {
        const rowDisabled = disabledRowKeys.has(rowKey);
        return (
          <div
            key={rowKey}
            className={rowDisabled ? "rounded-lg bg-zinc-50/80" : undefined}
            title={rowDisabled ? rowDisabledHint : undefined}
          >
            <p
              className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                rowDisabled ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              {rowLabel}
              {rowDisabled ? " · —" : ""}
            </p>
            <ul
              className={`flex flex-nowrap gap-2.5 overflow-x-auto pb-1 sm:gap-3 ${
                rowDisabled ? "pointer-events-none opacity-50" : ""
              }`}
              aria-disabled={rowDisabled}
            >
              {rowEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="w-[8.5rem] shrink-0 sm:w-[9.5rem] md:w-[10.5rem]"
                >
                  <button
                    type="button"
                    disabled={rowDisabled}
                    onClick={() => onSelect(entry)}
                    className={`flex h-full w-full flex-col items-center rounded-lg border p-2.5 sm:p-3 ${
                      rowDisabled
                        ? "border-zinc-200 bg-zinc-100"
                        : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    <Image
                      src={catalogImageUrl(entry.image)}
                      alt={entry.coordinates}
                      width={128}
                      height={96}
                      className="h-20 w-full object-contain sm:h-24 md:h-28"
                      sizes="(max-width: 640px) 136px, 168px"
                    />
                    <span className="mt-1.5 w-full truncate text-center text-[11px] font-medium sm:text-xs">
                      {entry.coordinates.replace(/^ROW-[IVX]+\s+/i, "")}
                    </span>
                    <span className="text-[10px] text-zinc-600 sm:text-[11px]">
                      {formatSheetValue(entry.value)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function individualTypeLabel(type: ElementType, t: ReturnType<typeof getMessages>) {
  switch (type) {
    case "EQ":
      return t.routine.escolarFamilyStatic;
    case "FLEX":
      return t.routine.escolarFamilyFlexibility;
    case "AG":
      return t.routine.escolarFamilyAgility;
    case "TUM":
      return t.routine.escolarFamilyTumbling;
  }
}

function gymnastRowTitle(
  row: { role: RoutineGymnastRole; baseIndex?: number; name: string },
  t: ReturnType<typeof getMessages>,
) {
  const roleLabel =
    row.role === "top"
      ? t.routine.topRole
      : row.baseIndex != null && row.baseIndex > 0
        ? `${t.routine.baseRole} ${row.baseIndex + 1}`
        : t.routine.baseRole;
  const name = row.name || t.home.statusNoData;
  return `${roleLabel} · ${name}`;
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

  const [elementType, setElementType] = useState<PickerElementType>("balance");
  const [selectedRole, setSelectedRole] = useState<PickerRole>("optional");
  const [previewEntry, setPreviewEntry] = useState<CatalogEntry | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);

  const gymnastKeys = gymnastKeysForHeader(header.baseNames.length);
  const gymnastRows = gymnastKeys.map((g) => ({
    ...g,
    name:
      g.role === "top"
        ? header.topName
        : header.baseNames[g.baseIndex ?? 0] ?? "",
  }));

  const initialIndividualState = useMemo(() => {
    const state: Record<string, GymnastPickState> = {};
    for (const g of gymnastKeys) {
      state[g.key] = { type: "EQ" };
    }
    return state;
  }, [gymnastKeys]);

  const [individualByGymnast, setIndividualByGymnast] =
    useState<Record<string, GymnastPickState>>(initialIndividualState);

  const usedRowKeys = useMemo(() => {
    if (elementType === "individual") return new Set<string>();
    return rowKeysUsedInRoutine(routine, elementType);
  }, [routine, elementType]);

  const balanceEntries = entriesForFamily(allEntries, header, "balance").filter(
    (entry) => !isCatalogIdUsedInRoutine(routine, entry.id),
  );
  const dynamicEntries = entriesForFamily(allEntries, header, "dynamic").filter(
    (entry) => !isCatalogIdUsedInRoutine(routine, entry.id),
  );

  function saveSingle(block: "balance" | "dynamic", entry: CatalogEntry) {
    const ok = onSave({
      kind: "single",
      entry,
      block,
      role: selectedRole,
    });
    if (!ok) {
      setDuplicateError(true);
      return;
    }
    setDuplicateError(false);
    setPreviewEntry(null);
    onClose();
  }

  const allIndividualsPicked = gymnastRows.every(
    (g) => individualByGymnast[g.key]?.entry != null,
  );

  function saveAllIndividuals() {
    if (!allIndividualsPicked) return;
    const picks = gymnastRows.map((g) => ({
      gymnastRole: g.role,
      baseIndex: g.baseIndex,
      entry: individualByGymnast[g.key]!.entry!,
    }));
    const ok = onSave({ kind: "individual", picks });
    if (!ok) {
      setDuplicateError(true);
      return;
    }
    setDuplicateError(false);
    onClose();
  }

  const isPopover = variant === "popover";
  const shellClass = isPopover
    ? "flex w-full min-w-0 max-w-5xl flex-col rounded-xl border border-zinc-300 bg-white shadow-lg"
    : "flex w-full min-w-0 max-w-5xl shrink-0 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm";

  const currentEntries =
    elementType === "balance"
      ? balanceEntries
      : elementType === "dynamic"
        ? dynamicEntries
        : [];

  return (
    <aside className={shellClass} aria-label={t.routine.addElement}>
      <header
        className={`flex items-center justify-between border-b border-zinc-200 ${isPopover ? "px-3 py-2" : "px-4 py-3"}`}
      >
        <p className="text-xs text-zinc-600">{t.routine.escolarTagTitle}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
          aria-label={t.sheet.picker.close}
        >
          ×
        </button>
      </header>

      <div
        className={`grid gap-3 ${isPopover ? "max-h-[min(70vh,520px)] overflow-y-auto p-3 md:grid-cols-[130px_1fr]" : "p-4 md:grid-cols-[130px_1fr]"}`}
      >
        <div className="flex flex-row gap-2 md:flex-col">
          {(["balance", "dynamic", "individual"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setElementType(type);
                setDuplicateError(false);
                setPreviewEntry(null);
              }}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                elementType === type
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {type === "balance"
                ? t.routine.blockBalance
                : type === "dynamic"
                  ? t.routine.blockDynamic
                  : t.routine.escolarIndividual}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {elementType !== "individual" ? (
            previewEntry ? (
              <ElementPickerPreview
                entry={previewEntry}
                onBack={() => {
                  setPreviewEntry(null);
                  setDuplicateError(false);
                }}
                onSave={() =>
                  saveSingle(
                    elementType === "balance" ? "balance" : "dynamic",
                    previewEntry,
                  )
                }
                role={selectedRole}
                onRoleChange={setSelectedRole}
                showRole
                duplicateError={duplicateError}
                t={t}
              />
            ) : currentEntries.length === 0 ? (
              <p className="text-sm text-amber-700">{t.sheet.catalogEmpty}</p>
            ) : (
              <CatalogRowGrid
                entries={currentEntries}
                disabledRowKeys={usedRowKeys}
                rowDisabledHint={t.sheet.picker.rowAlreadyUsed}
                onSelect={(entry) => {
                  setPreviewEntry(entry);
                  setDuplicateError(false);
                }}
              />
            )
          ) : (
            <>
              <p className="text-xs text-zinc-600">{t.routine.escolarIndividualHint}</p>
              <div className="flex flex-col gap-3">
                {gymnastRows.map((row) => {
                  const state = individualByGymnast[row.key] ?? { type: "EQ" as const };
                  const individualEntries = entriesForFamily(
                    allEntries,
                    header,
                    "individual",
                    state.type,
                  ).filter((entry) => !isCatalogIdUsedInRoutine(routine, entry.id));
                  const rowTitle = gymnastRowTitle(row, t);

                  return (
                    <div
                      key={row.key}
                      className="min-w-0 rounded-lg border border-zinc-200 p-2.5"
                    >
                      <p className="mb-2 text-xs font-semibold text-zinc-800">
                        {rowTitle}
                        {state.entry ? (
                          <span className="ml-1 font-normal text-emerald-700">
                            · {state.entry.coordinates}
                          </span>
                        ) : null}
                      </p>
                      <label className="mb-2 flex flex-col gap-1 text-xs text-zinc-700">
                        <span>{t.routine.escolarIndividualFamily}</span>
                        <select
                          value={state.type}
                          onChange={(e) =>
                            setIndividualByGymnast((prev) => ({
                              ...prev,
                              [row.key]: {
                                type: e.target.value as ElementType,
                                entry: undefined,
                              },
                            }))
                          }
                          className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
                        >
                          {INDIVIDUAL_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {individualTypeLabel(type, t)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <ul
                        className="grid w-full min-w-0 gap-0.5 sm:gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(individualEntries.length, 1)}, minmax(0, 1fr))`,
                        }}
                      >
                        {individualEntries.map((entry) => (
                          <li key={`${row.key}-${entry.id}`} className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setIndividualByGymnast((prev) => ({
                                  ...prev,
                                  [row.key]: {
                                    type: state.type,
                                    entry,
                                  },
                                }));
                                setDuplicateError(false);
                              }}
                              className={`flex h-full w-full min-w-0 flex-col items-center rounded-lg border p-0.5 sm:p-1.5 ${
                                state.entry?.id === entry.id
                                  ? "border-zinc-900 bg-zinc-100"
                                  : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                              }`}
                            >
                              <Image
                                src={catalogImageUrl(entry.image)}
                                alt={entry.coordinates}
                                width={80}
                                height={56}
                                className="h-8 w-full object-contain sm:h-12"
                                sizes="(max-width: 640px) 20vw, 80px"
                              />
                              <span className="mt-0.5 w-full truncate text-center text-[8px] font-medium leading-tight sm:text-[10px]">
                                {entry.coordinates}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              {duplicateError ? (
                <p className="text-sm text-amber-700">{t.sheet.picker.duplicateElement}</p>
              ) : null}
              <div className="border-t border-zinc-200 pt-3">
                <button
                  type="button"
                  disabled={!allIndividualsPicked}
                  onClick={saveAllIndividuals}
                  className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white enabled:hover:bg-zinc-700 disabled:opacity-40"
                >
                  {t.sheet.picker.save}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
