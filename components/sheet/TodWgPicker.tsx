"use client";

import Image from "next/image";
import { type ReactNode, useMemo, useState } from "react";
import { catalogEntryToPlaced, catalogImageUrl, type CatalogEntry } from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import type { RoutineItem, TodWgPick, TodWgTopMove, TodWgTopPick } from "@/lib/tariff/routine-types";
import {
  baseForCatalogId,
  baseGroup,
  motionOptions,
  supportOptions,
  topPositions,
  topSlots,
  type SupportOption,
  type TodWgBase,
} from "@/lib/tariff/tod-wg";
import { pyramidOf } from "@/lib/tariff/tod-wg/pyramid";
import { formatTodWgValue as formatSheetValue } from "@/lib/tariff/value-breakdown";
import { PickerStep } from "./PickerStep";

type Props = {
  /** The TOD WG bases this sheet can use. */
  entries: CatalogEntry[];
  /** Why a base can't be added now (e.g. already in the routine), or null. */
  problemFor: (entry: CatalogEntry) => string | null;
  /** Editing a static hold: its base and choices. */
  initial?: { entry: CatalogEntry; pick: TodWgPick };
  onSave: (entry: CatalogEntry, pick: TodWgPick) => boolean;
  duplicateError: boolean;
  /** The pyramid's static hold right before this one in the routine, if any: this one can continue it. */
  previous?: { item: RoutineItem; entry: CatalogEntry };
  /** The routine before this hold (a transition can't go back to a base in it). */
  routineBefore?: RoutineItem[];
};

type Tile = { entry: CatalogEntry; base: TodWgBase };
type Slot = "top" | "middle";

const figImage = (path: string) => catalogImageUrl(path, "FIG");

const tileClass = (disabled = false) =>
  `flex h-full w-full flex-col items-center rounded-lg border bg-white p-2 ${
    disabled ? "cursor-not-allowed border-zinc-200 opacity-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
  }`;

/**
 * Women's Group static holds. A new pyramid: base → (per top step) support
 * table → position → hold (3" / 1") and legs together. Continuing the hold
 * before: transition of the bases or not → for each top, a motion (by the
 * new position's picture), a valued position held during the transition, or
 * one of no value → the next static hold (3").
 */
export function TodWgPicker({ entries, problemFor, initial, onSave, duplicateError, previous, routineBefore = [] }: Props) {
  const t = getMessages();
  const tw = t.sheet.picker.todWg;
  const tiles = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, base: baseForCatalogId(entry.id) }))
        .filter((x): x is Tile => x.base !== undefined),
    [entries],
  );
  const categories = useMemo(() => [...new Set(tiles.map((x) => x.base.category))].sort((a, b) => a - b), [tiles]);
  const before = useMemo(() => (previous ? pyramidOf(previous.item) : null), [previous]);

  // Editing a continuation whose pyramid before was removed: it can only be saved as a new pyramid.
  const orphaned = initial?.pick.from != null && !before;
  const [mode, setMode] = useState<"new" | "continue" | null>(() =>
    initial ? (initial.pick.from && before ? "continue" : "new") : before ? null : "new",
  );
  const [transition, setTransition] = useState<boolean | null>(initial?.pick.from?.transition ?? null);
  const [category, setCategory] = useState<number | null>(null);
  const [chosen, setChosen] = useState<Tile | null>(() => {
    if (!initial) return null;
    const base = baseForCatalogId(initial.entry.id);
    return base ? { entry: initial.entry, base } : null;
  });
  const [tops, setTops] = useState<TodWgTopPick[]>(initial?.pick.tops ?? []);
  const [moves, setMoves] = useState<{ slot: Slot; how: TodWgTopMove }[]>(initial?.pick.from?.moves ?? []);
  const [how, setHow] = useState<TodWgTopMove | null>(null);
  const [support, setSupport] = useState<SupportOption | null>(null);
  const [hold, setHold] = useState<1 | 3>(initial?.pick.hold ?? 3);
  const [legs, setLegs] = useState(initial?.pick.legsTogether ?? false);

  const slotLabel = (slot: Slot) => (slot === "top" ? tw.slotTop : tw.slotMiddle);
  const continuing = mode === "continue" && before != null && previous != null;

  function resetTops() {
    setTops([]);
    setMoves([]);
    setHow(null);
    setSupport(null);
  }
  function resetAll() {
    setChosen(null);
    setTransition(null);
    resetTops();
    setHold(3);
    setLegs(false);
    setMode(before ? null : "new");
  }

  // Step 0: a new pyramid, or the next static hold of the one before.
  if (mode === null && before && previous) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-zinc-800">{tw.chooseMode}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setMode("new")} className={tileClass()}>
            <span className="text-sm font-medium text-zinc-800">{tw.modeNew}</span>
          </button>
          <button type="button" onClick={() => setMode("continue")} className={tileClass()}>
            <BasePicture base={before.base} />
            <span className="text-sm font-medium text-zinc-800">{tw.modeContinue(before.base.id)}</span>
            <span className="text-[11px] text-zinc-600">{tw.modeContinueHint}</span>
          </button>
        </div>
      </div>
    );
  }

  // Continuing: do the bases make a transition?
  if (continuing && transition === null) {
    return (
      <PickerStep title={tw.chooseTransition} onBack={resetAll}>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            // A base whose drawing has the top: without a transition nothing can move.
            disabled={before.base.topIncluded === true}
            onClick={() => {
              setTransition(false);
              setChosen({ entry: previous.entry, base: before.base });
              resetTops();
            }}
            className={tileClass(before.base.topIncluded === true)}
          >
            <BasePicture base={before.base} />
            <span className="text-sm font-medium text-zinc-800">{tw.noTransition}</span>
            <span className="text-[11px] text-zinc-600">{before.base.topIncluded ? tw.noTransitionTopIncluded : tw.noTransitionHint}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTransition(true);
              setChosen(null);
              resetTops();
            }}
            className={tileClass()}
          >
            <span className="text-2xl" aria-hidden="true">→</span>
            <span className="text-sm font-medium text-zinc-800">{tw.withTransition}</span>
            <span className="text-[11px] text-zinc-600">{tw.withTransitionHint}</span>
          </button>
        </div>
      </PickerStep>
    );
  }

  // The base: by category, then row.
  if (!chosen) {
    const activeCategory = category ?? categories[0];
    const inCategory = tiles.filter((x) => x.base.category === activeCategory);
    // A category's rows in TOD order (a category can run over two pages: 60 A… and 61 A…).
    const rowKey = (x: Tile) => `${x.base.page}|${x.base.row}`;
    const rows = [...new Set(inCategory.map(rowKey))];
    const repeated = (row: string) => rows.filter((r) => r.endsWith(`|${row}`)).length > 1;
    const sameAsBefore = (x: Tile) => before != null && x.base.id === before.base.id && x.base.category === before.base.category;
    const usedBases = new Set(routineBefore.map((i) => baseForCatalogId(i.element.catalogId)).filter(Boolean));
    const body = (
      <>
        <div role="tablist" aria-label={tw.chooseBase} className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={c === activeCategory}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                c === activeCategory ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {tw.category(c)}
            </button>
          ))}
        </div>
        {rows.map((key) => {
          const [page, row] = key.split("|");
          const inRow = inCategory.filter((x) => rowKey(x) === key);
          return (
            <section key={key} className="flex flex-col gap-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {tw.row(row, repeated(row) ? `${page} ${row}` : null)}
              </h3>
              <ul className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(6.5rem, 1fr))" }}>
                {inRow.map((x) => {
                  // A transition goes to another base, not yet in the routine.
                  const problem = continuing
                    ? sameAsBefore(x)
                      ? tw.sameBase
                      : usedBases.has(x.base)
                        ? tw.usedBase
                        : problemFor(x.entry)
                    : problemFor(x.entry);
                  return (
                    <li key={x.entry.id}>
                      <button
                        type="button"
                        disabled={problem != null}
                        title={problem ?? undefined}
                        onClick={() => {
                          setChosen(x);
                          resetTops();
                          setLegs(false);
                        }}
                        className={tileClass(problem != null)}
                      >
                        <Image src={figImage(x.base.image)} alt={x.base.id} width={96} height={68} className="h-14 w-full object-contain" />
                        <span className="mt-0.5 text-[10px] font-medium text-zinc-800">{x.base.id}</span>
                        <span className="text-[9px] text-zinc-600">
                          {formatSheetValue(x.base.value)} · {tw.catGroup(x.base.category, x.base.group)}
                        </span>
                        {x.base.topIncluded ? <span className="text-[9px] text-zinc-500">{tw.topIncluded}</span> : null}
                        {problem ? <span className="text-center text-[9px] leading-tight text-amber-700">{problem}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </>
    );
    return continuing ? (
      <PickerStep title={tw.chooseNewBase} onBack={() => setTransition(null)}>
        {body}
      </PickerStep>
    ) : (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-zinc-800">{tw.chooseBase}</p>
        {before ? (
          <button type="button" onClick={resetAll} className="self-start text-xs text-zinc-600 underline">
            {tw.backToMode}
          </button>
        ) : null}
        {body}
      </div>
    );
  }

  const { base, entry } = chosen;
  // Continuing, tops and motions are valued for the previous base's group.
  const group = continuing ? before.group : baseGroup(base.value);
  const slots = topSlots(base);
  const pending = slots[tops.length];
  const backOneTop = () => {
    if (tops.length > 0) {
      setTops(tops.slice(0, -1));
      setMoves(moves.slice(0, -1));
      setHow(null);
    } else if (continuing) {
      setTransition(null);
      setChosen(null);
    } else {
      resetAll();
    }
  };
  const addTop = (top: TodWgTopPick) => {
    setTops([...tops, top]);
    if (continuing && how) setMoves([...moves, { slot: top.slot, how }]);
    setSupport(null);
    setHow(null);
  };

  // Continuing: what does this top do between the two holds?
  if (pending && continuing && !how) {
    const was = before.tops.find((x) => x.pick.slot === pending.slot);
    return (
      <PickerStep title={tw.chooseMove(slotLabel(pending.slot))} onBack={backOneTop}>
        <ChosenBase base={base} />
        <div className="grid gap-2 sm:grid-cols-3">
          <MoveButton onClick={() => setHow("motion")} title={tw.moveMotion} hint={tw.moveMotionHint} />
          {transition ? (
            <MoveButton
              onClick={() => setHow("held")}
              disabled={!was}
              title={tw.moveHeld}
              hint={was ? tw.moveHeldHint(was.position.id, formatSheetValue(was.position.value)) : tw.moveHeldNone}
            />
          ) : null}
          {transition ? <MoveButton onClick={() => setHow("no-value")} title={tw.moveNoValue} hint={tw.moveNoValueHint} /> : null}
        </div>
      </PickerStep>
    );
  }

  // Continuing with a motion from a known position: the new position by its picture.
  if (pending && continuing && how === "motion" && !support) {
    const was = before.tops.find((x) => x.pick.slot === pending.slot);
    const sameSupport = was && pending.supports.includes(was.pick.support);
    const destinations =
      was && sameSupport
        ? motionOptions(was.pick.table, was.pick.support, group)
            .filter((m) => m.from === was.pick.position)
            .map((m) => ({
              motion: m,
              positions: topPositions(was.pick.table, was.pick.support, group).filter((p) => p.key === m.to),
            }))
        : [];
    return (
      <PickerStep title={tw.chooseDestination(slotLabel(pending.slot))} onBack={() => setHow(null)}>
        <ChosenBase base={base} />
        <ul className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7.5rem, 1fr))" }}>
          {destinations.flatMap(({ motion, positions }) =>
            positions.map((p) => (
              <li key={`${p.key}${p.option ?? ""}`}>
                <button
                  type="button"
                  onClick={() =>
                    addTop({
                      slot: pending.slot,
                      table: was!.pick.table,
                      support: was!.pick.support,
                      position: p.key,
                      ...(p.option ? { option: p.option } : {}),
                    })
                  }
                  className={tileClass()}
                >
                  <Pictures images={p.images} alt={p.id} />
                  <span className="mt-1 text-[11px] text-zinc-700">{tw.motionValue(formatSheetValue(motion.value))}</span>
                  <span className="text-[11px] text-zinc-700">{tw.holdValue(formatSheetValue(p.value))}</span>
                  {p.handstand ? <span className="text-[11px] font-medium text-emerald-800">{tw.handstand(p.handstand)}</span> : null}
                </button>
              </li>
            )),
          )}
          <li>
            <button
              type="button"
              onClick={() => setSupport({ table: 0, page: 0, support: "", images: [] })}
              className="flex h-full min-h-24 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-2 text-center text-sm text-zinc-700 hover:bg-zinc-50"
            >
              {tw.otherPosition}
            </button>
          </li>
        </ul>
      </PickerStep>
    );
  }

  // A top step's support table (also: continuing to another table, or after a held / no-value move).
  if (pending && (!support || support.table === 0)) {
    const options = supportOptions(pending.supports);
    const back = continuing ? () => (support ? setSupport(null) : setHow(null)) : backOneTop;
    return (
      <PickerStep title={tw.chooseSupport(slotLabel(pending.slot))} onBack={back}>
        <ChosenBase base={base} />
        {options.length === 0 ? <p className="text-sm text-amber-700">{tw.noSupport}</p> : null}
        <ul className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))" }}>
          {options.map((o) => (
            <li key={`${o.table}-${o.support}`}>
              <button type="button" onClick={() => setSupport(o)} className={tileClass()}>
                <Pictures images={o.images} alt={`${tw.table(o.table)} · ${o.support}`} />
                <span className="text-xs font-medium text-zinc-800">{tw.table(o.table)}</span>
                <span className="text-[11px] text-zinc-600">{o.support}</span>
              </button>
            </li>
          ))}
        </ul>
      </PickerStep>
    );
  }

  // The top position on that support, valued for the base group.
  if (pending && support) {
    const positions = topPositions(support.table, support.support, group);
    return (
      <PickerStep title={tw.choosePosition(slotLabel(pending.slot), support.table, support.support)} onBack={() => setSupport(null)}>
        <ChosenBase base={base} />
        <ul className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))" }}>
          {positions.map((p) => (
            <li key={`${p.key}${p.option ?? ""}`}>
              <button
                type="button"
                onClick={() =>
                  addTop({ slot: pending.slot, table: support.table, support: support.support, position: p.key, ...(p.option ? { option: p.option } : {}) })
                }
                className={tileClass()}
              >
                <Pictures images={p.images} alt={p.id} />
                <span className="mt-1 text-xs font-medium text-zinc-800">
                  {p.key}
                  {p.option ? ` · ${tw.optionLabel(p.option)}` : ""}
                </span>
                <span className="font-mono text-[11px] text-zinc-600">{formatSheetValue(p.value)}</span>
                {p.handstand ? <span className="text-[11px] font-medium text-emerald-800">{tw.handstand(p.handstand)}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </PickerStep>
    );
  }

  // Last step: hold time (a new pyramid), legs together, and what it adds.
  const pick: TodWgPick = {
    tops,
    ...(continuing ? { from: { transition: transition === true, moves } } : hold === 1 ? { hold: 1 as const } : {}),
    ...(legs ? { legsTogether: true } : {}),
  };
  const preview: RoutineItem = { id: "todwg-preview", block: "balance", linkedToPrevious: false, element: catalogEntryToPlaced(entry), todWg: pick };
  const result = continuing ? pyramidOf(preview, [...routineBefore, preview]) : pyramidOf(preview);
  const hasTop = base.topIncluded || tops.some((x) => x.slot === "top");
  return (
    <PickerStep title={tw.finish} onBack={backOneTop}>
      <ChosenBase base={base} />
      {result?.tops.map(({ pick: p, position }) => (
        <p key={p.slot} className="text-sm text-zinc-700">
          {slotLabel(p.slot)}: {position.id}
          {p.option ? ` · ${tw.optionLabel(p.option)}` : ""} ({p.support}) · <span className="font-mono">{formatSheetValue(position.value)}</span>
        </p>
      ))}
      {!continuing ? (
        <fieldset className="flex flex-col gap-1 text-sm text-zinc-800">
          <legend className="mb-1">{tw.holdTime}</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="todwg-hold" id="todwg-hold-3" checked={hold === 3} onChange={() => setHold(3)} />
            {tw.hold3}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="todwg-hold" id="todwg-hold-1" checked={hold === 1} onChange={() => setHold(1)} />
            {tw.hold1}
          </label>
        </fieldset>
      ) : null}
      {hasTop && (continuing || hold === 3) ? (
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input id="todwg-legs" type="checkbox" checked={legs} onChange={(e) => setLegs(e.target.checked)} />
          {tw.legsTogether}
        </label>
      ) : null}
      {orphaned ? <p className="text-sm text-amber-700">{tw.orphaned}</p> : null}
      {result ? <Summary result={result} /> : null}
      {result?.problems.map((p) => (
        <p key={p} className="text-sm text-amber-700">{p}</p>
      ))}
      {duplicateError ? <p className="text-sm text-amber-700">{t.sheet.picker.duplicateElement}</p> : null}
      <button
        type="button"
        disabled={!result || result.missing.length > 0 || result.problems.length > 0}
        onClick={() => onSave(entry, pick)}
        className="h-10 self-start rounded-full bg-zinc-900 px-5 text-sm font-medium text-white enabled:hover:bg-zinc-700 disabled:opacity-40"
      >
        {t.sheet.picker.save}
      </button>
    </PickerStep>
  );
}

function Summary({ result }: { result: NonNullable<ReturnType<typeof pyramidOf>> }) {
  const tw = getMessages().sheet.picker.todWg;
  const rows: [string, number][] = [];
  if (result.link?.transition) rows.push([tw.summaryTransition, result.link.transition.value]);
  for (const h of result.link?.held ?? []) rows.push([tw.summaryHeld, h.value]);
  for (const m of result.link?.motions ?? []) rows.push([tw.summaryMotion, m.value]);
  if (result.cell.tops != null) rows.push([tw.summaryTops, result.cell.tops]);
  if (result.cell.base != null) rows.push([tw.summaryBase, result.cell.base]);
  if (result.cell.legs != null) rows.push([tw.summaryLegs, result.cell.legs]);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
      {result.hold === 1 ? <dd className="col-span-2 text-zinc-600">{tw.hold1Summary}</dd> : null}
      {rows.map(([label, value], i) => (
        <div key={i} className="contents">
          <dt className="text-zinc-500">{label}</dt>
          <dd className="font-mono">{formatSheetValue(value)}</dd>
        </div>
      ))}
      {result.handstand ? <dd className="col-span-2 text-emerald-800">{tw.handstandSummary(result.handstand)}</dd> : null}
      <dt className="font-medium text-zinc-800">{tw.summaryTotal}</dt>
      <dd className="font-mono font-medium">{formatSheetValue(result.value)}</dd>
    </dl>
  );
}

function MoveButton({ onClick, title, hint, disabled = false }: { onClick: () => void; title: string; hint: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={tileClass(disabled)}>
      <span className="text-sm font-medium text-zinc-800">{title}</span>
      <span className="mt-1 text-center text-[11px] text-zinc-600">{hint}</span>
    </button>
  );
}

function Pictures({ images, alt }: { images: string[]; alt: string }) {
  return (
    <span className="flex w-full justify-center gap-1">
      {images.map((img) => (
        <Image key={img} src={figImage(img)} alt={alt} width={80} height={64} className="h-14 min-w-0 flex-1 object-contain" />
      ))}
    </span>
  );
}

function BasePicture({ base }: { base: TodWgBase }) {
  return <Image src={figImage(base.image)} alt={base.id} width={96} height={68} className="h-14 w-full object-contain" />;
}

function ChosenBase({ base }: { base: TodWgBase }) {
  const tw = getMessages().sheet.picker.todWg;
  return (
    <div className="flex items-center gap-2">
      <Image
        src={figImage(base.image)}
        alt={base.id}
        width={120}
        height={80}
        className="h-16 w-auto rounded border border-zinc-200 bg-white object-contain p-1"
      />
      <span className="text-xs text-zinc-600">
        {base.id} · {formatSheetValue(base.value)} · {tw.catGroup(base.category, base.group)}
      </span>
    </div>
  );
}
