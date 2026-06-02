import { categoryDisplayLabel } from "./level-category";
import type { StoredHeader } from "./types";

/** Top-of-sheet summary line (competition TS header band). */
export function formatTsBannerLine(header: StoredHeader): string {
  const category = categoryDisplayLabel(header);
  const level = `${header.levelAge} ${header.levelSystem}`;
  const gymnasts = [header.topName, ...header.baseNames]
    .map((n) => n.trim())
    .filter(Boolean)
    .join(" · ");

  const parts = [
    header.participationNumber?.trim(),
    category,
    level,
    gymnasts || undefined,
    header.clubName.trim(),
  ].filter((part): part is string => Boolean(part));

  return parts.join(" - ");
}

const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;

/** Default name when the user chooses «Guardar como PDF» in the print dialog. */
export function pdfFilenameFromHeader(header: StoredHeader): string {
  const line = formatTsBannerLine(header)
    .replace(INVALID_FILENAME_CHARS, "-")
    .replace(/\s+/g, " ")
    .trim();
  return line.slice(0, 200) || "hoja-tarifa";
}
