import type { SheetColumnSlot } from "./compute-sheet-layout";
import type {
  OfficialIndividualCoordinateRow,
  OfficialSheetBlockId,
} from "./official-sheet-layout";
import {
  OFFICIAL_BALANCE_VALUE_SUBCELL,
  OFFICIAL_DYNAMIC_VALUE_SUBCELL,
} from "./official-sheet-layout";
import type { RoutineElementRole } from "./routine-types";
import type { PlacedElement } from "./sheet-types";
import type { ValueBreakdown } from "./types";
import { formatSheetValue } from "./value-breakdown";

export const SHEET_NO_VALUE = "-";

/** Meta row (top): rotation (dynamic) or hold time (balance / individual EQ static). */
export function elementMetaDisplay(element: PlacedElement | undefined): string {
  if (!element) return "";
  if (element.rotation) return element.rotation;
  return element.holdDuration ?? "";
}

/** Meta row for a sheet column (single element or stacked individuals). */
export function sheetSlotMetaDisplay(slot: SheetColumnSlot): string {
  const elements =
    slot.kind === "element"
      ? [slot.element]
      : slot.kind === "individual-group"
        ? slot.elements
        : [];
  const parts = elements.map(elementMetaDisplay).filter(Boolean);
  return [...new Set(parts)].join(" / ");
}

/** Bottom of image cell: optional label only (compulsory / individual show nothing). */
export function sheetImageCellRoleFooter(
  role: RoutineElementRole | undefined,
  optionalLabel: string,
): string {
  return role === "optional" ? optionalLabel : "";
}

function elementValueText(
  value: number,
  role: RoutineElementRole | undefined,
  hideIndividualValues: boolean,
  block: OfficialSheetBlockId,
): string {
  if (block === "combined") {
    return hideIndividualValues ? SHEET_NO_VALUE : formatSheetValue(value);
  }
  if (role === "optional") return SHEET_NO_VALUE;
  if (role === "compulsory" || block === "balance" || block === "dynamic") {
    return formatSheetValue(value);
  }
  return formatSheetValue(value);
}

function individualElementAt(
  slot: Extract<SheetColumnSlot, { kind: "individual-group" }>,
  gymnastIndex: number,
): PlacedElement | undefined {
  return slot.elements[gymnastIndex];
}

/** VALUE row (row 3): balance/dynamic in subcells 1–2; individuals one per subcell 1–4. */
export function sheetValueInSubcell(
  slot: SheetColumnSlot,
  subcellIndex: number,
  hideIndividualValues: boolean,
): string {
  if (slot.kind === "empty") return "";

  if (slot.kind === "individual-group") {
    const el = individualElementAt(slot, subcellIndex);
    if (!el) return "";
    return hideIndividualValues ? SHEET_NO_VALUE : formatSheetValue(el.value);
  }

  if (slot.block === "balance" && subcellIndex === OFFICIAL_BALANCE_VALUE_SUBCELL) {
    return elementValueText(
      slot.element.value,
      slot.role,
      hideIndividualValues,
      slot.block,
    );
  }

  if (slot.block === "dynamic" && subcellIndex === OFFICIAL_DYNAMIC_VALUE_SUBCELL) {
    return elementValueText(
      slot.element.value,
      slot.role,
      hideIndividualValues,
      slot.block,
    );
  }

  return "";
}

/** Row 4 (SH): balance + all individual coordinates; row 5 (TOP): dynamic only. */
export function sheetCoordinatesInRow(
  slot: SheetColumnSlot,
  row: OfficialIndividualCoordinateRow,
): string {
  if (slot.kind === "empty") return "";

  if (slot.kind === "individual-group") {
    if (row !== "sh") return "";
    return slot.elements
      .map((el) => el.coordinates)
      .filter(Boolean)
      .join(" / ");
  }

  if (row === "sh" && slot.block === "balance") {
    return slot.element.coordinates;
  }
  if (row === "top" && slot.block === "dynamic") {
    return slot.element.coordinates;
  }

  return "";
}

export function formatSidebarBreakdownValue(
  key: keyof Pick<ValueBreakdown, "balance" | "dynamic" | "individual">,
  breakdown: ValueBreakdown,
  hideIndividualValues: boolean,
): string {
  if (hideIndividualValues && key === "individual") return SHEET_NO_VALUE;
  return formatSheetValue(breakdown[key]);
}
