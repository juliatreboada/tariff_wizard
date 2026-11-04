"use client";

import Image from "next/image";
import { useState } from "react";
import { catalogImageUrl, type CatalogEntry } from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";

type Tile =
  | { kind: "entry"; entry: CatalogEntry }
  | { kind: "group"; group: string; image: string; entries: CatalogEntry[] };

/** Entries in table order; the choices of a group (landings, twists) become one tile. */
function tilesOf(entries: CatalogEntry[]): Tile[] {
  const tiles: Tile[] = [];
  const groups = new Map<string, Extract<Tile, { kind: "group" }>>();
  for (const entry of entries) {
    if (!entry.variant) {
      tiles.push({ kind: "entry", entry });
      continue;
    }
    let tile = groups.get(entry.variant.group);
    if (!tile) {
      tile = { kind: "group", group: entry.variant.group, image: entry.variant.groupImage, entries: [] };
      groups.set(entry.variant.group, tile);
      tiles.push(tile);
    }
    tile.entries.push(entry);
  }
  return tiles;
}

/** "V 4" or "V 5–7"; empty for catalogs without values (ESCOLAR individuals are 0). */
const valueText = (entries: CatalogEntry[]) => {
  const values = entries.map((e) => e.value);
  const [min, max] = [Math.min(...values), Math.max(...values)];
  if (max === 0) return "";
  return min === max ? `V ${min}` : `V ${min}–${max}`;
};

/**
 * One gymnast's individual elements of one type: a wrapping grid of tiles.
 * Agilities with landings and tumbling columns are picked in two steps
 * (the element, then its landing or twist).
 */
export function IndividualChoices({
  entries,
  selectedId,
  onSelect,
  problemFor,
}: {
  entries: CatalogEntry[];
  selectedId?: string;
  onSelect: (entry: CatalogEntry) => void;
  /** Why an entry can't be picked (shown on it), or null. */
  problemFor: (entry: CatalogEntry) => string | null;
}) {
  const t = getMessages();
  const tiles = tilesOf(entries);
  const selectedGroup = entries.find((e) => e.id === selectedId)?.variant?.group;
  const [openGroup, setOpenGroup] = useState<string | undefined>(selectedGroup);
  const open = tiles.find(
    (tile): tile is Extract<Tile, { kind: "group" }> => tile.kind === "group" && tile.group === openGroup,
  );

  if (tiles.length === 0) return <p className="text-xs text-zinc-500">{t.sheet.catalogEmpty}</p>;

  const tileClass = (active: boolean, disabled: boolean) =>
    `flex h-full w-full min-w-0 flex-col items-center rounded-lg border p-1 ${
      active
        ? "border-zinc-900 bg-zinc-100"
        : disabled
          ? "cursor-not-allowed border-zinc-200 opacity-40"
          : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
    }`;

  return (
    <div className="flex flex-col gap-2">
      <ul
        className="grid max-h-72 w-full min-w-0 gap-1 overflow-y-auto pr-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(4.5rem, 1fr))" }}
      >
        {tiles.map((tile) => {
          if (tile.kind === "entry") {
            const { entry } = tile;
            const problem = problemFor(entry);
            return (
              <li key={entry.id} className="min-w-0">
                <button
                  type="button"
                  disabled={problem != null}
                  title={problem ?? undefined}
                  aria-pressed={selectedId === entry.id}
                  onClick={() => {
                    setOpenGroup(undefined);
                    onSelect(entry);
                  }}
                  className={tileClass(selectedId === entry.id, problem != null)}
                >
                  <Image
                    src={catalogImageUrl(entry.image, entry.code)}
                    alt={entry.coordinates}
                    width={80}
                    height={56}
                    className="h-10 w-full object-contain sm:h-12"
                    sizes="80px"
                  />
                  <span className="mt-0.5 w-full truncate text-center text-[10px] font-medium leading-tight">
                    {entry.coordinates}
                  </span>
                  <span className="text-[9px] text-zinc-500">{valueText([entry])}</span>
                  {problem ? <span className="sr-only">{problem}</span> : null}
                </button>
              </li>
            );
          }
          const allBlocked = tile.entries.every((e) => problemFor(e) != null);
          const active = tile.group === openGroup || tile.entries.some((e) => e.id === selectedId);
          return (
            <li key={`group-${tile.group}`} className="min-w-0">
              <button
                type="button"
                disabled={allBlocked}
                aria-expanded={tile.group === openGroup}
                onClick={() => setOpenGroup(tile.group === openGroup ? undefined : tile.group)}
                className={tileClass(active, allBlocked)}
              >
                <Image
                  src={catalogImageUrl(tile.image, tile.entries[0].code)}
                  alt={tile.group}
                  width={80}
                  height={56}
                  className="h-10 w-full object-contain sm:h-12"
                  sizes="80px"
                />
                <span className="mt-0.5 w-full truncate text-center text-[10px] font-medium leading-tight">
                  {tile.group} ▾
                </span>
                <span className="text-[9px] text-zinc-500">{valueText(tile.entries)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
          <p className="mb-1 text-[11px] font-medium text-zinc-700">{t.sheet.picker.chooseVariant(open.group)}</p>
          <ul className="flex flex-wrap gap-1">
            {open.entries.map((entry) => {
              const problem = problemFor(entry);
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    disabled={problem != null}
                    title={problem ?? undefined}
                    aria-pressed={selectedId === entry.id}
                    onClick={() => onSelect(entry)}
                    className={`${tileClass(selectedId === entry.id, problem != null)} w-24`}
                  >
                    <Image
                      src={catalogImageUrl(entry.image, entry.code)}
                      alt={`${entry.coordinates} ${entry.variant?.label ?? ""}`}
                      width={96}
                      height={56}
                      className="h-12 w-full object-contain"
                      sizes="96px"
                    />
                    <span className="mt-0.5 text-[10px] font-medium">{entry.variant?.label}</span>
                    <span className="text-[9px] text-zinc-500">{valueText([entry])}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
