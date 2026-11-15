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
import { TRANSITIONS_PAGE } from "./tod-wg";
import { pyramidOf, type PyramidLink } from "./tod-wg/pyramid";
import { formatSheetValue } from "./value-breakdown";

export const SHEET_NO_VALUE = "-";

type ElementSlot = Extract<SheetColumnSlot, { kind: "element" }>;

/** The TOD WG static hold in a cell (its base is the element), or null. */
function slotPyramid(slot: SheetColumnSlot) {
  if (slot.kind !== "element") return null;
  return (
    slot.pyramid ??
    pyramidOf({ id: slot.routineItemId, block: slot.block, linkedToPrevious: false, element: slot.element, todWg: slot.todWg })
  );
}

/** The pictures in an element cell: the element, then its add-on; a pyramid's tops above its base. */
export function slotElements(slot: ElementSlot): PlacedElement[] {
  const pyramid = slotPyramid(slot);
  if (pyramid) {
    // Every drawing of a top (some positions have two), above the base.
    const tops = pyramid.tops.flatMap(({ position }) =>
      position.images.map((image, i) => ({
        catalogId: `todwg-top:${position.id}${position.option ?? ""}:${i}`,
        catalog: "FIG" as const,
        coordinates: position.id,
        value: i === 0 ? position.value : 0,
        image,
      })),
    );
    return [...tops, slot.element];
  }
  return slot.addOn ? [slot.element, slot.addOn] : [slot.element];
}

/** Value of an element cell: the element plus its add-on. */
function slotValue(slot: ElementSlot): number {
  return slot.element.value + (slot.addOn?.value ?? 0);
}

/** Codes of an element cell ("ROW-I D + ROW-III C"). */
function slotCoordinates(slot: ElementSlot): string {
  return slotElements(slot).map((el) => el.coordinates).join(" + ");
}

/** Under a pyramid's pictures: its category and base group ("CAT 6 GR 3"); "" otherwise. */
export function sheetPyramidLabel(slot: SheetColumnSlot): string {
  const pyramid = slotPyramid(slot);
  return pyramid ? `CAT ${pyramid.base.category} GR ${pyramid.group}` : "";
}

const valueOrBlank = (v: number | null | undefined) => (v == null ? "" : formatSheetValue(v));

/** A static hold's VALUE subcells: A the tops, C the base, D legs together (a 1" hold shows none). */
function pyramidValueInSubcell(pyramid: NonNullable<ReturnType<typeof slotPyramid>>, subcellIndex: number): string {
  switch (subcellIndex) {
    case 0:
      return valueOrBlank(pyramid.cell.tops);
    case 2:
      return valueOrBlank(pyramid.cell.base);
    case 3:
      return valueOrBlank(pyramid.cell.legs);
    default:
      return "";
  }
}

/** The link cell's VALUE subcells: A tops held during the transition, B the motions, C the transition. */
function linkValueInSubcell(link: PyramidLink, subcellIndex: number): string {
  const total = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) : null);
  switch (subcellIndex) {
    case 0:
      return valueOrBlank(total(link.held.map((h) => h.value)));
    case 1:
      return valueOrBlank(total(link.motions.map((m) => m.value)));
    case 2:
      return valueOrBlank(link.transition?.value);
    default:
      return "";
  }
}

/** Meta row (top): rotation (dynamic) or hold time (balance / individual EQ static). */
export function elementMetaDisplay(element: PlacedElement | undefined): string {
  if (!element) return "";
  if (element.rotation) return element.rotation;
  return element.holdDuration ?? "";
}

/** Meta row for a sheet column (single element or stacked individuals); a static hold's time (3" or 1"). */
export function sheetSlotMetaDisplay(slot: SheetColumnSlot): string {
  const pyramid = slotPyramid(slot);
  if (pyramid) return `${pyramid.hold}"`;
  const elements =
    slot.kind === "element"
      ? slotElements(slot)
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
  if (slot.kind === "link") return linkValueInSubcell(slot.link, subcellIndex);

  if (slot.kind === "individual-group") {
    const el = individualElementAt(slot, subcellIndex);
    if (!el) return "";
    return hideIndividualValues ? SHEET_NO_VALUE : formatSheetValue(el.value);
  }

  const pyramid = slotPyramid(slot);
  if (pyramid) {
    if (slot.role === "optional") return subcellIndex === OFFICIAL_BALANCE_VALUE_SUBCELL ? SHEET_NO_VALUE : "";
    return pyramidValueInSubcell(pyramid, subcellIndex);
  }

  if (slot.block === "balance" && subcellIndex === OFFICIAL_BALANCE_VALUE_SUBCELL) {
    return elementValueText(
      slotValue(slot),
      slot.role,
      hideIndividualValues,
      slot.block,
    );
  }

  if (slot.block === "dynamic" && subcellIndex === OFFICIAL_DYNAMIC_VALUE_SUBCELL) {
    return elementValueText(
      slotValue(slot),
      slot.role,
      hideIndividualValues,
      slot.block,
    );
  }

  return "";
}

/**
 * Row 4 (SH): balance + all individual coordinates; row 5 (TOP): dynamic only.
 * A TOD WG pyramid: SH the tops' positions, TOP the motion, BASE the base (in
 * the last block, where BASE holds the footer, the base goes in SH: `baseInSh`).
 */
export function sheetCoordinatesInRow(
  slot: SheetColumnSlot,
  row: OfficialIndividualCoordinateRow,
  options: { baseInSh?: boolean } = {},
): string {
  if (slot.kind === "empty") return "";
  // The link: held positions in SH, motions in TOP, a transition by the TOD page
  // of the transitions table in BASE (in the last block, where BASE is the footer, in SH).
  if (slot.kind === "link") {
    const transition = slot.link.transition ? String(TRANSITIONS_PAGE) : "";
    if (row === "sh") return [...slot.link.held.map((h) => h.id), ...(options.baseInSh && transition ? [transition] : [])].join(" / ");
    if (row === "top") return slot.link.motions.map((m) => m.id ?? "—").join(" / ");
    return transition;
  }

  const pyramid = slotPyramid(slot);
  if (pyramid) {
    if (row === "sh") {
      const codes = pyramid.tops.map((t) => t.position.id);
      if (options.baseInSh) codes.push(slot.kind === "element" ? slot.element.coordinates : "");
      return codes.join(" / ");
    }
    if (row === "top") return "";
    return slot.kind === "element" ? slot.element.coordinates : "";
  }

  if (slot.kind === "individual-group") {
    if (row !== "sh") return "";
    return slot.elements
      .map((el) => el.coordinates)
      .filter(Boolean)
      .join(" / ");
  }

  if (row === "sh" && slot.block === "balance") {
    return slotCoordinates(slot);
  }
  if (row === "top" && slot.block === "dynamic") {
    return slotCoordinates(slot);
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
