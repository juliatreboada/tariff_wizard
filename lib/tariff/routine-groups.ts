import type { RoutineGymnastRole, RoutineItem } from "./routine-types";

export type RoutineDisplayRow =
  | {
      kind: "single";
      item: RoutineItem;
      index: number;
    }
  | {
      kind: "individual-group";
      groupId: string;
      items: RoutineItem[];
      index: number;
    };

/** Group id for an individual item (legacy items without group = one item per group). */
export function individualGroupId(item: RoutineItem): string {
  return item.individualGroupId ?? item.id;
}

export function groupRoutineForDisplay(routine: RoutineItem[]): RoutineDisplayRow[] {
  const rows: RoutineDisplayRow[] = [];
  const seenGroups = new Set<string>();
  let displayIndex = 0;

  for (let i = 0; i < routine.length; i++) {
    const item = routine[i];
    if (item.role === "individual") {
      const gid = individualGroupId(item);
      if (seenGroups.has(gid)) continue;
      seenGroups.add(gid);
      const items = routine.filter(
        (r) => r.role === "individual" && individualGroupId(r) === gid,
      );
      rows.push({
        kind: "individual-group",
        groupId: gid,
        items: sortIndividualGroupItems(items),
        index: displayIndex++,
      });
      continue;
    }
    rows.push({ kind: "single", item, index: displayIndex++ });
  }

  return rows;
}

export function sortIndividualGroupItems(items: RoutineItem[]): RoutineItem[] {
  const order = (item: RoutineItem) => {
    if (item.gymnastRole === "top") return 0;
    return 1 + (item.baseIndex ?? 0);
  };
  return [...items].sort((a, b) => order(a) - order(b));
}

export function countCompleteIndividualSets(
  routine: RoutineItem[],
  gymnastCount: number,
): { complete: number; totalGroups: number } {
  const groups = new Map<string, RoutineItem[]>();
  for (const item of routine) {
    if (item.role !== "individual") continue;
    const gid = individualGroupId(item);
    const list = groups.get(gid) ?? [];
    list.push(item);
    groups.set(gid, list);
  }

  let complete = 0;
  for (const items of groups.values()) {
    if (isCompleteIndividualSet(items, gymnastCount)) complete++;
  }
  return { complete, totalGroups: groups.size };
}

function isCompleteIndividualSet(
  items: RoutineItem[],
  gymnastCount: number,
): boolean {
  if (items.length < gymnastCount) return false;
  const hasTop = items.some((i) => i.gymnastRole === "top");
  const baseCount = items.filter((i) => i.gymnastRole === "base").length;
  return hasTop && baseCount >= gymnastCount - 1;
}

export function flattenDisplayRows(rows: RoutineDisplayRow[]): RoutineItem[] {
  return rows.flatMap((row) =>
    row.kind === "single" ? [row.item] : row.items,
  );
}

export function findDisplayRowIndex(
  rows: RoutineDisplayRow[],
  itemId: string,
): number {
  return rows.findIndex((row) =>
    row.kind === "single"
      ? row.item.id === itemId
      : row.items.some((item) => item.id === itemId),
  );
}

export function moveDisplayRow(
  rows: RoutineDisplayRow[],
  index: number,
  direction: "up" | "down",
): RoutineDisplayRow[] {
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= rows.length) return rows;
  const next = [...rows];
  [next[index], next[swap]] = [next[swap], next[index]];
  return next;
}

/** Keep gymnasts inside an individual set linked to each other. */
export function syncGroupInternalLinks(routine: RoutineItem[]): RoutineItem[] {
  const rows = groupRoutineForDisplay(routine);
  const notFirstInRow = new Set<string>();
  for (const row of rows) {
    if (row.kind === "individual-group") {
      for (let i = 1; i < row.items.length; i++) {
        notFirstInRow.add(row.items[i].id);
      }
    }
  }
  return routine.map((item) => {
    if (notFirstInRow.has(item.id)) {
      return { ...item, linkedToPrevious: true };
    }
    return item;
  });
}

export function gymnastKeysForHeader(baseCount: number): Array<{
  key: string;
  role: RoutineGymnastRole;
  baseIndex?: number;
}> {
  const rows: Array<{
    key: string;
    role: RoutineGymnastRole;
    baseIndex?: number;
  }> = [{ key: "top", role: "top" }];
  for (let i = 0; i < baseCount; i++) {
    rows.push({ key: `base-${i}`, role: "base", baseIndex: i });
  }
  return rows;
}
