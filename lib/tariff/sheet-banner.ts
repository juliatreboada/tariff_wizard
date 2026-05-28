import type { StoredHeader } from "./types";

/** Top-of-sheet summary line (competition TS header band). */
export function formatTsBannerLine(header: StoredHeader): string {
  const category = header.categoryCode ?? header.category;
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
