import type { StoredHeader } from "./types";

/** Role labels for the gymnast rows (Spanish screens or the printed sheet). */
export type GymnastLabels = {
  top: string;
  base: string;
  baseNumber: (n: number) => string;
};

export function baseSidebarLabel(
  index: number,
  baseCount: number,
  labels: GymnastLabels,
  options?: { numberedBases?: boolean },
): string {
  if (options?.numberedBases === false || baseCount <= 1) {
    return labels.base;
  }
  return labels.baseNumber(index + 1);
}

export function gymnastSidebarRows(
  header: StoredHeader,
  labels: GymnastLabels,
  options?: { numberedBases?: boolean },
): Array<{ role: string; name: string }> {
  const rows: Array<{ role: string; name: string }> = [
    { role: labels.top, name: header.topName },
  ];
  for (let i = 0; i < header.baseNames.length; i++) {
    rows.push({
      role: baseSidebarLabel(i, header.baseNames.length, labels, options),
      name: header.baseNames[i] ?? "",
    });
  }
  return rows;
}
