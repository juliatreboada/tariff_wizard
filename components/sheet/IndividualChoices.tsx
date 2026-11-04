"use client";

import Image from "next/image";
import { useState } from "react";
import { catalogImageUrl, type CatalogEntry } from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import { PickerStep } from "./PickerStep";

type Tile =
  | { kind: "entry"; entry: CatalogEntry }
  | { kind: "group"; group: string; image: string; entries: CatalogEntry[] };

/** Entries in table order; the options of one element (landings, twists, pictures) become one tile. */
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

const tileClass = (active: boolean, disabled: boolean) =>
  `flex h-full w-full min-w-0 flex-col items-center justify-center rounded-lg border p-1 ${
    active
      ? "border-zinc-900 bg-zinc-100"
      : disabled
        ? "cursor-not-allowed border-zinc-200 opacity-40"
        : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
  }`;

/**
 * One gymnast's individual elements of one type, as pictures only (the coach
 * doesn't need the ID or the value). An element with options (landings,
 * twists, several pictures) opens a step with just its options.
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
  /** Why an entry can't be picked (shown to screen readers and on hover), or null. */
  problemFor: (entry: CatalogEntry) => string | null;
}) {
  const t = getMessages();
  const tiles = tilesOf(entries);
  const [openGroup, setOpenGroup] = useState<string>();
  const open = tiles.find(
    (tile): tile is Extract<Tile, { kind: "group" }> => tile.kind === "group" && tile.group === openGroup,
  );

  if (tiles.length === 0) return <p className="text-xs text-zinc-500">{t.sheet.catalogEmpty}</p>;

  const picture = (entry: CatalogEntry, image: string, alt: string, problem: string | null, height = "h-12 sm:h-14") => (
    <>
      <Image
        src={catalogImageUrl(image, entry.code)}
        alt={alt}
        width={96}
        height={64}
        className={`${height} w-full object-contain`}
        sizes="96px"
      />
      {problem ? <span className="sr-only">{problem}</span> : null}
    </>
  );

  if (open) {
    return (
      <PickerStep title={t.sheet.picker.chooseVariant} onBack={() => setOpenGroup(undefined)}>
        <ul className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))" }}>
          {open.entries.map((entry) => {
            const problem = problemFor(entry);
            // Tumbling twists share one picture: their label tells them apart.
            const twist = entry.type === "TUM" ? entry.variant?.label : undefined;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  disabled={problem != null}
                  title={problem ?? undefined}
                  aria-pressed={selectedId === entry.id}
                  onClick={() => {
                    onSelect(entry);
                    setOpenGroup(undefined);
                  }}
                  className={`${tileClass(selectedId === entry.id, problem != null)} bg-white p-2`}
                >
                  {picture(entry, entry.image, `${entry.coordinates} · ${entry.variant?.label ?? t.sheet.picker.option}`, problem, "h-20")}
                  {twist ? <span className="mt-1 text-xs font-medium text-zinc-800">{twist}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </PickerStep>
    );
  }

  return (
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
                onClick={() => onSelect(entry)}
                className={tileClass(selectedId === entry.id, problem != null)}
              >
                {picture(entry, entry.image, `${t.sheet.picker.individualElement} ${entry.coordinates}`, problem)}
              </button>
            </li>
          );
        }
        const allBlocked = tile.entries.every((e) => problemFor(e) != null);
        const chosen = tile.entries.some((e) => e.id === selectedId);
        return (
          <li key={`group-${tile.group}`} className="min-w-0">
            <button
              type="button"
              disabled={allBlocked}
              aria-pressed={chosen}
              onClick={() => setOpenGroup(tile.group)}
              className={tileClass(chosen, allBlocked)}
            >
              {picture(tile.entries[0], tile.image, `${t.sheet.picker.elementWithOptions} ${tile.group}`, null)}
              <span className="text-[10px] text-zinc-500" aria-hidden="true">
                ▸
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
