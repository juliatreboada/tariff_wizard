import type { OfficialSheetBlockId } from "./official-sheet-layout";
import type { PlacedElement } from "./sheet-types";

/** Meta row (3 combined cells): hold time or dynamic rotation text. */
export function elementMetaDisplay(
  element: PlacedElement | undefined,
  blockId: OfficialSheetBlockId,
): string {
  if (!element) return "";
  if (blockId === "dynamic") {
    return element.dynamicNotation ?? "";
  }
  return element.holdDuration ?? "";
}
