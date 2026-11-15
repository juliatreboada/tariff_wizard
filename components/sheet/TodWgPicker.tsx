"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { catalogEntryToPlaced, catalogImageUrl, type CatalogEntry } from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import type { RoutineItem, TodWgPick, TodWgTopPick } from "@/lib/tariff/routine-types";
import {
  baseForCatalogId,
  baseGroup,
  motionOptions,
  supportOptions,
  topPositions,
  topSlots,
  transitionValue,
  type SupportOption,
  type TodWgBase,
} from "@/lib/tariff/tod-wg";
import { pyramidOf } from "@/lib/tariff/tod-wg/pyramid";
import { formatSheetValue } from "@/lib/tariff/value-breakdown";
import { PickerStep } from "./PickerStep";

type Props = {
  /** The TOD WG bases this sheet can use. */
  entries: CatalogEntry[];
  /** Why a base can't be added now (e.g. already in the routine), or null. */
  problemFor: (entry: CatalogEntry) => string | null;
  /** Editing a pyramid: its base and choices. */
  initial?: { entry: CatalogEntry; pick: TodWgPick };
  onSave: (entry: CatalogEntry, pick: TodWgPick) => boolean;
  duplicateError: boolean;
  /** The pyramid right before this one in the routine, if any: a transition can come from it. */
  previousBase?: TodWgBase;
};

type Tile = { entry: CatalogEntry; base: TodWgBase };

const figImage = (path: string) => catalogImageUrl(path, "FIG");

/** Women's Group pyramid builder: base → (per top step) support table → position → motion / legs together. */
export function TodWgPicker({ entries, problemFor, initial, onSave, duplicateError, previousBase }: Props) {
  const t = getMessages();
  const tw = t.sheet.picker.todWg;
  const tiles = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, base: baseForCatalogId(entry.id) }))
        .filter((x): x is Tile => x.base !== undefined),
    [entries],
  );
  const pages = useMemo(() => [...new Set(tiles.map((x) => x.base.page))].sort((a, b) => a - b), [tiles]);

  const [page, setPage] = useState<number | null>(null);
  const [chosen, setChosen] = useState<Tile | null>(() => {
    if (!initial) return null;
    const base = baseForCatalogId(initial.entry.id);
    return base ? { entry: initial.entry, base } : null;
  });
  const [tops, setTops] = useState<TodWgTopPick[]>(initial?.pick.tops ?? []);
  const [support, setSupport] = useState<SupportOption | null>(null);
  const [motion, setMotion] = useState<string | undefined>(initial?.pick.motion);
  const [legs, setLegs] = useState(initial?.pick.legsTogether ?? false);
  const [transition, setTransition] = useState(initial?.pick.transitionFromPrevious ?? false);

  const activePage = page ?? pages[0];
  const slotLabel = (slot: "top" | "middle") => (slot === "top" ? tw.slotTop : tw.slotMiddle);

  function reset() {
    setChosen(null);
    setTops([]);
    setSupport(null);
    setMotion(undefined);
    setLegs(false);
    setTransition(false);
  }

  // Step 1: the base.
  if (!chosen) {
    const onPage = tiles.filter((x) => x.base.page === activePage);
    const rows = [...new Set(onPage.map((x) => `${x.base.category}|${x.base.row}`))];
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-zinc-800">{tw.chooseBase}</p>
        <div role="tablist" aria-label={tw.chooseBase} className="flex flex-wrap gap-1.5">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === activePage}
              onClick={() => setPage(p)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                p === activePage
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {tw.page(p)}
            </button>
          ))}
        </div>
        {rows.map((key) => {
          const [cat, row] = key.split("|");
          const inRow = onPage.filter((x) => `${x.base.category}|${x.base.row}` === key);
          return (
            <section key={key} className="flex flex-col gap-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {tw.row(Number(cat), row)}
              </h3>
              <ul className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(6.5rem, 1fr))" }}>
                {inRow.map((x) => {
                  const problem = problemFor(x.entry);
                  return (
                    <li key={x.entry.id}>
                      <button
                        type="button"
                        disabled={problem != null}
                        title={problem ?? undefined}
                        onClick={() => {
                          setChosen(x);
                          setTops([]);
                          setSupport(null);
                          setMotion(undefined);
                          setLegs(false);
                        }}
                        className={`flex h-full w-full flex-col items-center rounded-lg border bg-white p-1.5 ${
                          problem
                            ? "cursor-not-allowed border-zinc-200 opacity-50"
                            : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                        }`}
                      >
                        <Image
                          src={figImage(x.base.image)}
                          alt={x.base.id}
                          width={96}
                          height={68}
                          className="h-14 w-full object-contain"
                        />
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
      </div>
    );
  }

  const { base, entry } = chosen;
  const group = baseGroup(base.value);
  const slots = topSlots(base);
  const pending = slots[tops.length];

  // Step 2: a top step's support table.
  if (pending && !support) {
    const options = supportOptions(pending.supports);
    const back = () => {
      if (tops.length > 0) setTops(tops.slice(0, -1));
      else reset();
    };
    return (
      <PickerStep title={tw.chooseSupport(slotLabel(pending.slot))} onBack={back}>
        <ChosenBase base={base} />
        {options.length === 0 ? <p className="text-sm text-amber-700">{tw.noSupport}</p> : null}
        <ul className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))" }}>
          {options.map((o) => (
            <li key={`${o.table}-${o.support}`}>
              <button
                type="button"
                onClick={() => setSupport(o)}
                className="flex h-full w-full flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white p-2 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <span className="flex w-full justify-center gap-1">
                  {o.images.map((img) => (
                    <Image key={img} src={figImage(img)} alt={`${tw.table(o.table)} · ${o.support}`} width={80} height={80} className="h-16 min-w-0 flex-1 object-contain" />
                  ))}
                </span>
                <span className="text-xs font-medium text-zinc-800">{tw.table(o.table)}</span>
                <span className="text-[11px] text-zinc-600">{o.support}</span>
              </button>
            </li>
          ))}
        </ul>
      </PickerStep>
    );
  }

  // Step 3: the top position on that support, valued for the base group.
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
                onClick={() => {
                  setTops([
                    ...tops,
                    { slot: pending.slot, table: support.table, support: support.support, position: p.key, ...(p.option ? { option: p.option } : {}) },
                  ]);
                  setSupport(null);
                }}
                className="flex h-full w-full flex-col items-center rounded-lg border border-zinc-200 bg-white p-2 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <span className="flex w-full justify-center gap-1">
                  {p.images.map((img) => (
                    <Image key={img} src={figImage(img)} alt={p.id} width={80} height={64} className="h-14 min-w-0 flex-1 object-contain" />
                  ))}
                </span>
                <span className="mt-1 text-xs font-medium text-zinc-800">
                  {p.key}
                  {p.option ? ` · ${tw.optionLabel(p.option)}` : ""}
                </span>
                <span className="font-mono text-[11px] text-zinc-600">{formatSheetValue(p.value)}</span>
              </button>
            </li>
          ))}
        </ul>
      </PickerStep>
    );
  }

  // Step 4: motion (wheels), legs together, and the value.
  const withTransition = transition && previousBase != null;
  const pick: TodWgPick = {
    tops,
    ...(motion ? { motion } : {}),
    ...(legs ? { legsTogether: true } : {}),
    ...(withTransition ? { transitionFromPrevious: true } : {}),
  };
  // The transition is valued against the pyramid before it in the routine.
  const transitionPoints = withTransition ? transitionValue(previousBase.value, base.value) : 0;
  const preview: RoutineItem = { id: "todwg-preview", block: "balance", linkedToPrevious: false, element: catalogEntryToPlaced(entry), todWg: pick };
  const result = pyramidOf(preview);
  const top = tops.find((x) => x.slot === "top");
  const motions = top ? motionOptions(top.table, top.support, group) : [];
  // Back: to the last top step (choose it again), or to the bases when there is none.
  const backFromFinish = () => {
    if (tops.length === 0) {
      reset();
      return;
    }
    setTops(tops.slice(0, -1));
    setMotion(undefined);
  };
  return (
    <PickerStep title={tw.finish} onBack={backFromFinish}>
      <ChosenBase base={base} />
      {result?.tops.map(({ pick: p, position }) => (
        <p key={p.slot} className="text-sm text-zinc-700">
          {slotLabel(p.slot)}: {position.id}
          {p.option ? ` · ${tw.optionLabel(p.option)}` : ""} ({p.support}) · <span className="font-mono">{formatSheetValue(position.value)}</span>
        </p>
      ))}
      {slots.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            setTops([]);
            setMotion(undefined);
          }}
          className="self-start text-xs text-zinc-600 underline"
        >
          {tw.changeTop}
        </button>
      ) : null}
      {motions.length > 0 ? (
        <label className="flex flex-col gap-1 text-sm text-zinc-800">
          {tw.motion}
          <select
            id="todwg-motion"
            value={motion ?? ""}
            onChange={(e) => setMotion(e.target.value || undefined)}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-2 text-sm"
          >
            <option value="">{tw.noMotion}</option>
            {motions.map((m) => (
              <option key={m.key} value={m.key}>
                {m.from} → {m.to} · {formatSheetValue(m.value)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {top || base.topIncluded ? (
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input id="todwg-legs" type="checkbox" checked={legs} onChange={(e) => setLegs(e.target.checked)} />
          {tw.legsTogether}
        </label>
      ) : null}
      {previousBase ? (
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input id="todwg-transition" type="checkbox" checked={transition} onChange={(e) => setTransition(e.target.checked)} />
          {tw.transition(previousBase.id)}
        </label>
      ) : null}
      {result ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
          <dt className="text-zinc-500">{tw.summaryBase}</dt>
          <dd className="font-mono">{formatSheetValue(base.value)}</dd>
          {result.motion ? (
            <>
              <dt className="text-zinc-500">{tw.summaryMotion}</dt>
              <dd className="font-mono">{formatSheetValue(result.motion.value)}</dd>
            </>
          ) : null}
          {result.legs ? (
            <>
              <dt className="text-zinc-500">{tw.summaryLegs}</dt>
              <dd className="font-mono">{formatSheetValue(result.legs)}</dd>
            </>
          ) : null}
          {withTransition ? (
            <>
              <dt className="text-zinc-500">{tw.summaryTransition}</dt>
              <dd className="font-mono">{formatSheetValue(transitionPoints)}</dd>
            </>
          ) : null}
          <dt className="font-medium text-zinc-800">{tw.summaryTotal}</dt>
          <dd className="font-mono font-medium">{formatSheetValue(result.value + transitionPoints)}</dd>
        </dl>
      ) : null}
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
