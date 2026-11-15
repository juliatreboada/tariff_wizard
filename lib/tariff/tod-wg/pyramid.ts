import type { RoutineItem, TodWgTopPick } from "../routine-types";
import {
  baseForCatalogId,
  baseGroup,
  motionOptions,
  topPositions,
  topSlots,
  transitionValue,
  type BaseGroup,
  type TodWgBase,
  type TopPositionOption,
} from "./index";

export type PyramidTop = { pick: TodWgTopPick; position: TopPositionOption };

/** What fills the cell between two static holds (cell 2): the bases' transition and the tops' moves. */
export type PyramidLink = {
  /** The bases change: transition from the previous base. */
  transition?: { from: TodWgBase; value: number };
  /** A top held in a valued position during the transition (its value counts here). */
  held: { slot: "top" | "middle"; id: string; value: number }[];
  /** A top's motion to its new position: valued only for a motion of the same wheel and support. */
  motions: { slot: "top" | "middle"; id?: string; value: number }[];
  value: number;
};

export type PyramidBreakdown = {
  base: TodWgBase;
  /** The base group the tops (and motions) are valued for: the previous base's when continuing. */
  group: BaseGroup;
  /** Static hold: 3" (valued) or 1" (only shown, before a motion). */
  hold: 1 | 3;
  /** The tops that fit this base. */
  tops: PyramidTop[];
  /** This hold's own cell: what counts (null = shown without value). */
  cell: { tops: number | null; base: number | null; legs: number | null };
  /** +1 for legs together, when it counts. */
  legs: number;
  /** Continuing the pyramid before it: cell 2. */
  link?: PyramidLink;
  /** Everything this item adds: its cell and its link. */
  value: number;
  /** Top steps the base still needs ("top", "middle"). */
  missing: ("top" | "middle")[];
  /** Choices that don't fit (not counted), in the coach's words. */
  problems: string[];
};

const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

/**
 * A TOD WG static hold and what it adds, read from the TOD WG data. Null when
 * the item's element isn't a TOD WG base. Pass the routine for a hold that
 * continues the pyramid before it (motion and/or transition):
 *
 * - cell 1, the first static hold: 3" counts base + tops; 1" is only shown;
 * - cell 2, the link: the bases' transition, tops held in a valued position
 *   during it, and the tops' motions (valued for the previous base's group);
 * - cell 3, the next static hold (3"): the new tops (previous base's group),
 *   and the base again only if it changed by a transition or the first hold
 *   was 1" — a Women's Group base counts once.
 */
export function pyramidOf(item: RoutineItem, routine?: readonly RoutineItem[]): PyramidBreakdown | null {
  const base = baseForCatalogId(item.element.catalogId);
  if (!base) return null;
  const pick = item.todWg ?? { tops: [] };
  const problems: string[] = [];

  const index = routine ? routine.findIndex((i) => i.id === item.id) : -1;
  // The hold before, on its own base: a motion or transition starts from the base
  // the top is on then, so the next hold is valued for that base's group.
  const before = pick.from && routine && index > 0 ? pyramidOf(routine[index - 1]) : null;
  if (pick.from && routine && !before) problems.push("La continuación necesita una pirámide justo antes.");
  const continuing = pick.from && before ? { from: pick.from, before } : null;

  const group = continuing ? continuing.before.group : baseGroup(base.value);
  // A continuation is the next 3" static hold.
  const hold: 1 | 3 = continuing ? 3 : (pick.hold ?? 3);
  const slots = topSlots(base);

  const tops: PyramidTop[] = [];
  for (const top of pick.tops) {
    const slot = slots.find((s) => s.slot === top.slot);
    if (!slot) {
      problems.push(base.topIncluded ? `${base.id} ya lleva el ágil en el dibujo.` : `${base.id} no tiene ese ágil.`);
      continue;
    }
    if (tops.some((t) => t.pick.slot === top.slot)) {
      problems.push(`${base.id}: el mismo ágil está elegido dos veces.`);
      continue;
    }
    if (!slot.supports.includes(top.support)) {
      problems.push(`${base.id} no da el apoyo «${top.support}».`);
      continue;
    }
    const position = topPositions(top.table, top.support, group).find(
      (p) => p.key === top.position && p.option === top.option,
    );
    if (!position) {
      problems.push(`Tabla ${top.table} ${top.position}${top.option ?? ""} no es posible sobre «${top.support}».`);
      continue;
    }
    tops.push({ pick: top, position });
  }
  const missing = slots.map((s) => s.slot).filter((s) => !tops.some((t) => t.pick.slot === s));

  // Cell 2: the link from the hold before.
  let link: PyramidLink | undefined;
  let baseCounts = hold === 3;
  if (continuing) {
    const { from, before: prev } = continuing;
    const sameBase = prev.base.id === base.id && prev.base.category === base.category;
    link = { held: [], motions: [], value: 0 };
    if (from.transition) {
      if (sameBase) problems.push("Con transición la base cambia: elige la nueva base.");
      else link.transition = { from: prev.base, value: transitionValue(prev.base.value, base.value) };
    } else if (!sameBase) {
      problems.push("Sin transición la base es la misma que antes.");
    }
    if (!from.transition && !from.moves.some((m) => m.how === "motion")) {
      problems.push("Sin transición, el ágil tiene que hacer un movimiento.");
    }
    for (const move of from.moves) {
      const was = prev.tops.find((t) => t.pick.slot === move.slot);
      const now = tops.find((t) => t.pick.slot === move.slot);
      if (move.how === "held") {
        if (!from.transition) problems.push("Solo con transición el ágil mantiene una posición con valor.");
        else if (!was) problems.push("No hay posición del ágil antes para mantener.");
        else link.held.push({ slot: move.slot, id: was.position.id, value: was.position.value });
      } else if (move.how === "no-value") {
        if (!from.transition) problems.push("Solo con transición el ágil pasa por una posición sin valor.");
      } else {
        // A motion of the same wheel, on the same support, is valued for the previous base's group.
        const valued =
          was && now && was.pick.table === now.pick.table && was.pick.support === now.pick.support
            ? motionOptions(now.pick.table, now.pick.support, group).find(
                (m) => m.from === was.pick.position && m.to === now.pick.position,
              )
            : undefined;
        link.motions.push({ slot: move.slot, id: valued?.id, value: valued?.value ?? 0 });
      }
    }
    link.value = (link.transition?.value ?? 0) + sum(link.held.map((h) => h.value)) + sum(link.motions.map((m) => m.value));
    // The base counts once: again only after a transition or a 1" first hold.
    baseCounts = link.transition !== undefined || prev.hold === 1;
  }

  const topsValue = hold === 3 ? sum(tops.map((t) => t.position.value)) : null;
  // Legs together is the top's: it counts only with a top (chosen, or in the drawing) in a valued hold.
  const hasTop = base.topIncluded || tops.some((t) => t.pick.slot === "top");
  if (pick.legsTogether && !hasTop) problems.push("«Piernas juntas» necesita un ágil.");
  const legs = pick.legsTogether && hasTop && hold === 3 ? 1 : 0;
  const cell = {
    tops: topsValue !== null && tops.length > 0 ? topsValue : null,
    base: baseCounts ? base.value : null,
    legs: legs ? legs : null,
  };
  const value = (cell.tops ?? 0) + (cell.base ?? 0) + legs + (link?.value ?? 0);
  return { base, group, hold, tops, cell, legs, link, value, missing, problems };
}
