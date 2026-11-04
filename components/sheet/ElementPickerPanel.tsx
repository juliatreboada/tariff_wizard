"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  catalogEntryByAnyId,
  catalogImageUrl,
  filterCatalogEntries,
  getCatalogEntries,
  groupCatalogEntriesByRow,
  parseRowColumnFromCoordinates,
  type CatalogEntry,
  type ElementFamily,
  type ElementType,
} from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import { isCatalogIdUsedInRoutine } from "@/lib/tariff/element-uniqueness";
import { gymnastCountForCategory } from "@/lib/tariff/level-category";
import { countCompleteIndividualSets, gymnastKeysForHeader } from "@/lib/tariff/routine-groups";
import type { RoutineGymnastRole } from "@/lib/tariff/routine-types";
import type { StoredHeader } from "@/lib/tariff/types";
import {
  addProblem,
  blockSlots,
  individualEntries,
  individualProblem,
  individualValueRange,
  optionalAvailable,
  optionalCategoryTables,
  pyramidForAddOn,
  roleForEntry,
  rulesetFor,
  type Ruleset,
} from "@/lib/tariff/rulesets";
import { useWizardStore } from "@/lib/tariff/store";
import { IndividualChoices } from "./IndividualChoices";
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
  editItemId?: string;
  editBlock?: "balance" | "dynamic";
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
  duplicateError,
  t,
}: {
  entry: CatalogEntry;
  title?: string;
  onBack: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
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
              src={catalogImageUrl(entry.image, entry.code)}
              alt={entry.coordinates}
              width={200}
              height={140}
              className="h-32 w-full object-contain sm:h-36"
            />
          </div>
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

/** Add-ons of the sheet's own catalog and of its optional tables' catalogs. */
function addOnEntriesFor(ruleset: Ruleset, header: StoredHeader): CatalogEntry[] {
  const catalogs = new Set([
    ruleset.catalogId,
    ...optionalCategoryTables(ruleset, header).map((table) => table.catalogId),
  ]);
  return [...catalogs].flatMap((id) => getCatalogEntries(id).filter((e) => e.attachesTo));
}

function CatalogRowGrid({
  entries,
  onSelect,
  selectedCatalogId,
  selectedCatalogIds,
  selectedHint,
  problemFor,
  noteFor,
}: {
  entries: CatalogEntry[];
  onSelect: (entry: CatalogEntry) => void;
  selectedCatalogId?: string;
  selectedCatalogIds?: Set<string>;
  selectedHint?: string;
  /** Why this entry can't be picked now (shown under it), or null. */
  problemFor?: (entry: CatalogEntry) => string | null;
  /** Extra line under the entry (e.g. which pyramid an add-on attaches to). */
  noteFor?: (entry: CatalogEntry) => string | null;
}) {
  const rows = useMemo(() => groupCatalogEntriesByRow(entries), [entries]);
  const columnOf = (entry: CatalogEntry) =>
    parseRowColumnFromCoordinates(entry.coordinates)?.columnKey ?? "?";
  // The table's columns (A–D or A–E, or box numbers), as on the official tables.
  const columns = useMemo(() => {
    const order = new Map<string, number>();
    for (const entry of entries) {
      const parsed = parseRowColumnFromCoordinates(entry.coordinates);
      order.set(parsed?.columnKey ?? "?", parsed?.columnOrder ?? Infinity);
    }
    return [...order.keys()].sort((a, b) => order.get(a)! - order.get(b)!);
  }, [entries]);

  if (rows.length === 0) return null;

  function cell(entry: CatalogEntry) {
    const isSelected =
      selectedCatalogId === entry.id || (selectedCatalogIds?.has(entry.id) ?? false);
    // Already in the routine (and not the element being edited).
    const isUsed = isSelected && selectedCatalogId !== entry.id;
    const problem = isSelected ? null : (problemFor?.(entry) ?? null);
    const note = noteFor?.(entry) ?? null;
    return (
      <button
        key={entry.id}
        type="button"
        disabled={isUsed || problem != null}
        onClick={() => onSelect(entry)}
        className={`flex h-full w-full flex-col items-center rounded-lg border p-1.5 sm:p-2 ${
          isSelected
            ? "border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900/20"
            : problem
              ? "cursor-not-allowed border-zinc-200 opacity-50"
              : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
        }`}
      >
        <Image
          src={catalogImageUrl(entry.image, entry.code)}
          alt={entry.coordinates}
          width={96}
          height={68}
          className="h-14 w-full object-contain sm:h-16"
        />
        <span className="mt-0.5 text-[9px] text-zinc-600 sm:text-[10px]">
          {formatSheetValue(entry.value)}
        </span>
        {isSelected ? (
          <span className="mt-0.5 text-[9px] font-medium text-zinc-800">✓ {selectedHint}</span>
        ) : null}
        {note ? (
          <span className="mt-0.5 text-center text-[9px] leading-tight text-zinc-600">{note}</span>
        ) : null}
        {problem ? (
          <span className="mt-0.5 text-center text-[9px] leading-tight text-amber-700">
            {problem}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[22rem] table-fixed border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-12" />
            {columns.map((col) => (
              <th key={col} scope="col" className="text-[11px] font-semibold text-zinc-500">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ rowKey, rowLabel, entries: rowEntries }) => (
            <tr key={rowKey}>
              <th
                scope="row"
                className="text-left align-middle text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
              >
                {rowLabel}
              </th>
              {columns.map((col) => {
                const inCell = rowEntries.filter((e) => columnOf(e) === col);
                return (
                  <td key={col} className="align-top">
                    {inCell.length > 0 ? (
                      <div className="flex flex-col gap-1">{inCell.map(cell)}</div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
  editItemId,
  editBlock,
}: ElementPickerPanelProps) {
  const t = getMessages();
  const ruleset = rulesetFor(header);
  const allEntries = getCatalogEntries(ruleset?.catalogId);
  const routine = useWizardStore((s) => s.routine);

  const editMode = editItemId != null && editBlock != null;
  const maxIndividualSets = ruleset?.individuals.sets ?? Infinity;
  const [elementType, setElementType] = useState<PickerElementType>(
    editBlock ?? "balance",
  );
  const [previewEntry, setPreviewEntry] = useState<CatalogEntry | null>(null);
  const [tableKey, setTableKey] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);
  const [limitError, setLimitError] = useState<"roleBlock" | "individuals" | null>(
    null,
  );

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

  const [individualRefused, setIndividualRefused] = useState(false);
  const [individualByGymnast, setIndividualByGymnast] =
    useState<Record<string, GymnastPickState>>(initialIndividualState);

  const editingItem = useMemo(
    () => routine.find((item) => item.id === editItemId),
    [routine, editItemId],
  );
  const routineExcludingEditing = useMemo(
    () => routine.filter((item) => item.id !== editItemId),
    [routine, editItemId],
  );
  const compulsoryBalanceCount = useMemo(
    () =>
      routineExcludingEditing.filter(
        (item) => item.block === "balance" && item.role === "compulsory",
      ).length,
    [routineExcludingEditing],
  );
  const optionalBalanceCount = useMemo(
    () =>
      routineExcludingEditing.filter(
        (item) => item.block === "balance" && item.role === "optional",
      ).length,
    [routineExcludingEditing],
  );
  const compulsoryDynamicCount = useMemo(
    () =>
      routineExcludingEditing.filter(
        (item) => item.block === "dynamic" && item.role === "compulsory",
      ).length,
    [routineExcludingEditing],
  );
  const optionalDynamicCount = useMemo(
    () =>
      routineExcludingEditing.filter(
        (item) => item.block === "dynamic" && item.role === "optional",
      ).length,
    [routineExcludingEditing],
  );

  /** No slot left that the catalog can fill. */
  function isBlockFull(block: "balance" | "dynamic", compulsory: number, optional: number) {
    if (!ruleset) return false;
    const slots = blockSlots(ruleset, block, header.category);
    if (ruleset.roleAssignment === "higher-value-compulsory") {
      return compulsory + optional >= slots.compulsory + slots.optional;
    }
    // By-table blocks stay open while an add-on (Cuartetos ROW III, an 11-16 top)
    // can still attach to a pyramid in the routine, from any table the sheet uses.
    const addOnOpen = addOnEntriesFor(ruleset, header).some(
      (entry) => entry.elementFamily === block && pyramidForAddOn(routineExcludingEditing, entry),
    );
    return (
      !addOnOpen &&
      compulsory >= slots.compulsory &&
      (optional >= slots.optional || !optionalAvailable(ruleset, header.levelAge))
    );
  }
  const balanceBlockFull = isBlockFull("balance", compulsoryBalanceCount, optionalBalanceCount);
  const dynamicBlockFull = isBlockFull("dynamic", compulsoryDynamicCount, optionalDynamicCount);
  const individualGroupCount = useMemo(() => {
    const gymnastCount = gymnastCountForCategory(header.category);
    return countCompleteIndividualSets(routineExcludingEditing, gymnastCount).totalGroups;
  }, [routineExcludingEditing, header.category]);


  const currentBlockIsFull =
    elementType === "balance"
      ? balanceBlockFull
      : elementType === "dynamic"
        ? dynamicBlockFull
        : false;

  function saveSingle(block: "balance" | "dynamic", entry: CatalogEntry) {
    const ok = onSave({
      kind: "single",
      entry,
      block,
      role: "compulsory",
    });
    if (!ok) {
      setDuplicateError(true);
      setLimitError(null);
      return;
    }
    setDuplicateError(false);
    setLimitError(null);
    setPreviewEntry(null);
    onClose();
  }

  const allIndividualsPicked = gymnastRows.every(
    (g) => individualByGymnast[g.key]?.entry != null,
  );

  function saveAllIndividuals() {
    if (!allIndividualsPicked) return;
    if (individualGroupCount >= maxIndividualSets) {
      setLimitError("individuals");
      setDuplicateError(false);
      return;
    }
    const picks = gymnastRows.map((g) => ({
      gymnastRole: g.role,
      baseIndex: g.baseIndex,
      entry: individualByGymnast[g.key]!.entry!,
    }));
    const ok = onSave({ kind: "individual", picks });
    if (!ok) {
      // Refused for a rule (value, source) rather than a repeated element.
      const breaksRule = picks.some((pick) => individualProblem(ruleset, header, pick.entry));
      setDuplicateError(!breaksRule);
      setIndividualRefused(breaksRule);
      setLimitError(null);
      return;
    }
    setIndividualRefused(false);
    setDuplicateError(false);
    setLimitError(null);
    onClose();
  }

  const isPopover = variant === "popover";
  const shellClass = isPopover
    ? "flex w-full min-w-0 max-w-5xl flex-col rounded-xl border border-zinc-300 bg-white shadow-lg"
    : "flex w-full min-w-0 max-w-5xl shrink-0 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm";

  /** The sheet's own table, then the tables that supply optional elements. */
  function tablesFor(family: "balance" | "dynamic") {
    const own = {
      key: "own",
      label: t.sheet.picker.tableOwn(header.levelSystem, header.levelAge),
      optional: false,
      entries: entriesForFamily(allEntries, header, family),
    };
    if (!ruleset) return [own];
    return [
      own,
      ...optionalCategoryTables(ruleset, header).map((table) => ({
        key: `${table.catalogId}-${table.levelSystem}-${table.levelAge}-${table.category}`,
        label: t.sheet.picker.tableOptional(
          table.label,
          table.levelAge,
          table.category === header.category ? null : table.category,
        ),
        optional: true,
        entries: entriesForFamily(
          getCatalogEntries(table.catalogId),
          {
            ...header,
            levelSystem: table.levelSystem,
            levelAge: table.levelAge,
            category: table.category,
          },
          family,
        ),
      })),
    ].filter((table) => table === own || table.entries.length > 0);
  }
  const tables = elementType === "individual" ? [] : tablesFor(elementType);
  // Until a table is chosen: the edited element's table, else the sheet's own.
  const activeTable =
    tables.find((table) => table.key === tableKey) ??
    tables.find((table) =>
      table.entries.some((entry) => entry.id === editingItem?.element.catalogId),
    ) ??
    tables[0];

  const individualRange = individualValueRange(ruleset, header.levelAge);
  function individualProblemText(entry: CatalogEntry): string | null {
    switch (individualProblem(ruleset, header, entry)) {
      case "out-of-range":
        return individualRange
          ? t.sheet.picker.problemValueRange(individualRange.min, individualRange.max)
          : null;
      case "not-allowed":
        return t.sheet.picker.problemNotAllowed;
      default:
        return null;
    }
  }

  const coordinatesOf = (ids: readonly string[]) =>
    ids
      .map((id) => catalogEntryByAnyId(id)?.coordinates ?? id)
      .join(" / ");

  function problemFor(entry: CatalogEntry): string | null {
    if (elementType !== "balance" && elementType !== "dynamic") return null;
    const problem = addProblem(ruleset, header, routine, entry, elementType, editItemId);
    switch (problem) {
      case null:
      case "duplicate": // shown as already chosen
        return null;
      case "same-row":
        return t.sheet.picker.problemSameRow;
      case "full":
        return ruleset && roleForEntry(ruleset, header, entry) === "optional"
          ? t.sheet.picker.problemFullOptional
          : t.sheet.picker.problemFullCompulsory;
      case "no-pyramid":
        return t.sheet.picker.problemNoPyramid(coordinatesOf(entry.attachesTo ?? []));
      case "not-allowed":
        return t.sheet.picker.problemNotAllowed;
      case "same-element-row":
        return t.sheet.picker.problemSameElementRow;
    }
  }

  const noteFor = (entry: CatalogEntry) =>
    entry.attachesTo ? t.sheet.picker.addOnHint(coordinatesOf(entry.attachesTo)) : null;

  const selectedCatalogIds = useMemo(() => {
    if (elementType !== "balance" && elementType !== "dynamic") {
      return new Set<string>();
    }
    return new Set(
      routine
        .filter((item) => item.block === elementType)
        .flatMap((item) =>
          item.addOn ? [item.element.catalogId, item.addOn.catalogId] : [item.element.catalogId],
        ),
    );
  }, [routine, elementType]);
  return (
    <aside className={shellClass} aria-label={t.routine.addElement}>
      <header
        className={`flex items-center justify-between border-b border-zinc-200 ${isPopover ? "px-3 py-2" : "px-4 py-3"}`}
      >
        <p className="text-xs text-zinc-600">{ruleset ? t.routine.tagTitle(ruleset.label) : t.sheet.picker.stepSubtype}</p>
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
                if (editMode && type !== editBlock) return;
                if ((type === "balance" && balanceBlockFull) || (type === "dynamic" && dynamicBlockFull)) {
                  return;
                }
                setElementType(type);
                setDuplicateError(false);
                setLimitError(null);
                setPreviewEntry(null);
              }}
              disabled={
                (editMode && type !== editBlock) ||
                (type === "balance" && balanceBlockFull) ||
                (type === "dynamic" && dynamicBlockFull)
              }
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                elementType === type
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : (type === "balance" && balanceBlockFull) || (type === "dynamic" && dynamicBlockFull)
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
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
            currentBlockIsFull ? (
              <p className="text-sm text-amber-700">{t.sheet.picker.limitRoleBlock}</p>
            ) :
            previewEntry ? (
              <>
                <ElementPickerPreview
                  entry={previewEntry}
                  onBack={() => {
                    setPreviewEntry(null);
                    setDuplicateError(false);
                    setLimitError(null);
                  }}
                  onSave={() =>
                    saveSingle(
                      elementType === "balance" ? "balance" : "dynamic",
                      previewEntry,
                    )
                  }
                  duplicateError={duplicateError}
                  t={t}
                />
                {limitError === "roleBlock" ? (
                  <p className="text-sm text-amber-700">{t.sheet.picker.limitRoleBlock}</p>
                ) : null}
              </>
            ) : tables.every((table) => table.entries.length === 0) ? (
              <p className="text-sm text-amber-700">{t.sheet.catalogEmpty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {tables.length > 1 ? (
                  <div
                    role="tablist"
                    aria-label={t.sheet.picker.tableChooser}
                    className="flex flex-wrap gap-1.5"
                  >
                    {tables.map((table) => (
                      <button
                        key={table.key}
                        type="button"
                        role="tab"
                        aria-selected={table.key === activeTable?.key}
                        onClick={() => {
                          setTableKey(table.key);
                          setPreviewEntry(null);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          table.key === activeTable?.key
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {table.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {activeTable?.optional ? (
                  <p className="text-xs text-zinc-600">{t.sheet.picker.optionalTableHint}</p>
                ) : null}
                {activeTable && activeTable.entries.length > 0 ? (
                  <CatalogRowGrid
                    key={activeTable.key}
                    entries={activeTable.entries}
                    selectedCatalogId={editingItem?.element.catalogId}
                    selectedCatalogIds={selectedCatalogIds}
                    selectedHint={t.routine.escolarDone}
                    problemFor={problemFor}
                    noteFor={noteFor}
                    onSelect={(entry) => {
                      setPreviewEntry(entry);
                      setDuplicateError(false);
                      setLimitError(null);
                    }}
                  />
                ) : (
                  <p className="text-sm text-amber-700">{t.sheet.catalogEmpty}</p>
                )}
              </div>
            )
          ) : ruleset && !ruleset.individuals.available ? (
            <p className="text-sm text-amber-700">{t.sheet.picker.individualsComingSoon}</p>
          ) : (
            <>
              <p className="text-xs text-zinc-600">{t.routine.escolarIndividualHint}</p>
              {individualRange ? (
                <p className="text-xs text-zinc-600">
                  {t.sheet.picker.individualValueRange(individualRange.min, individualRange.max)}
                </p>
              ) : null}
              <div className="flex flex-col gap-3">
                {gymnastRows.map((row) => {
                  const state = individualByGymnast[row.key] ?? { type: "EQ" as const };
                  const choices = individualEntries(ruleset, header, state.type).filter(
                    (entry) => !isCatalogIdUsedInRoutine(routine, entry.id),
                  );
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
                      <IndividualChoices
                        key={`${row.key}-${state.type}`}
                        entries={choices}
                        selectedId={state.entry?.id}
                        onSelect={(entry) => {
                          setIndividualByGymnast((prev) => ({
                            ...prev,
                            [row.key]: { type: state.type, entry },
                          }));
                          setDuplicateError(false);
                          setLimitError(null);
                        }}
                        problemFor={individualProblemText}
                      />
                    </div>
                  );
                })}
              </div>
              {duplicateError ? (
                <p className="text-sm text-amber-700">{t.sheet.picker.duplicateElement}</p>
              ) : null}
              {individualRefused ? (
                <p className="text-sm text-amber-700">{t.sheet.picker.individualRefused}</p>
              ) : null}
              {limitError === "individuals" ? (
                <p className="text-sm text-amber-700">{t.sheet.picker.limitIndividuals(maxIndividualSets)}</p>
              ) : null}
              <div className="border-t border-zinc-200 pt-3">
                <button
                  type="button"
                  disabled={
                    !allIndividualsPicked ||
                    individualGroupCount >= maxIndividualSets
                  }
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
