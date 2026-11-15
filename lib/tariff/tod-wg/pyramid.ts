import type { RoutineItem, TodWgTopPick } from "../routine-types";
import {
  baseForCatalogId,
  baseGroup,
  motionOptions,
  topPositions,
  topSlots,
  type BaseGroup,
  type MotionOption,
  type TodWgBase,
  type TopPositionOption,
} from "./index";

export type PyramidTop = { pick: TodWgTopPick; position: TopPositionOption };

export type PyramidBreakdown = {
  base: TodWgBase;
  group: BaseGroup;
  /** The tops that count (valid for this base). */
  tops: PyramidTop[];
  motion?: MotionOption;
  /** +1 for legs together, else 0. */
  legs: number;
  /** Base + tops + motion + legs. */
  value: number;
  /** Top steps the base still needs ("top", "middle"). */
  missing: ("top" | "middle")[];
  /** Choices that don't fit this base (not counted). */
  problems: string[];
};

/**
 * A TOD WG pyramid's parts and value, read from the TOD WG data. Null when the
 * item's element isn't a TOD WG base.
 */
export function pyramidOf(item: RoutineItem): PyramidBreakdown | null {
  const base = baseForCatalogId(item.element.catalogId);
  if (!base) return null;
  const group = baseGroup(base.value);
  const slots = topSlots(base);
  const pick = item.todWg ?? { tops: [] };
  const problems: string[] = [];
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

  let motion: MotionOption | undefined;
  if (pick.motion) {
    const top = tops.find((t) => t.pick.slot === "top");
    motion = top && motionOptions(top.pick.table, top.pick.support, group).find((m) => m.key === pick.motion);
    if (!motion) problems.push(`El movimiento ${pick.motion} no es posible con ese ágil.`);
  }

  // Legs together is the top's: it counts only with a top (chosen, or in the drawing).
  const hasTop = base.topIncluded || tops.some((t) => t.pick.slot === "top");
  const legs = pick.legsTogether && hasTop ? 1 : 0;
  if (pick.legsTogether && !hasTop) problems.push("«Piernas juntas» necesita un ágil.");
  const missing = slots.map((s) => s.slot).filter((s) => !tops.some((t) => t.pick.slot === s));
  const value = base.value + tops.reduce((sum, t) => sum + t.position.value, 0) + (motion?.value ?? 0) + legs;
  return { base, group, tops, motion, legs, value, missing, problems };
}
