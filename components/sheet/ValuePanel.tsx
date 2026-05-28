"use client";

import {
  VALUE_BREAKDOWN_LABELS,
  VALUE_BREAKDOWN_ROWS,
  type ValueBreakdownRow,
} from "@/lib/tariff/enums";
import type { ValueBreakdown } from "@/lib/tariff/types";
import { formatSheetValue } from "@/lib/tariff/value-breakdown";

const BREAKDOWN_KEYS: Record<
  ValueBreakdownRow,
  keyof Pick<ValueBreakdown, "balance" | "dynamic" | "individual">
> = {
  Balance: "balance",
  Dynamic: "dynamic",
  Individual: "individual",
};

type ValuePanelProps = {
  breakdown: ValueBreakdown;
};

export function ValuePanel({ breakdown }: ValuePanelProps) {
  return (
    <aside
      className="flex w-full shrink-0 flex-col gap-1 border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:w-48"
      aria-label="VALUE"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-zinc-300 pb-2 dark:border-zinc-700">
        <span className="text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-400">
          VALUE
        </span>
        <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {formatSheetValue(breakdown.total)}
        </span>
      </div>
      <ul className="flex flex-col gap-2 pt-1">
        {VALUE_BREAKDOWN_ROWS.map((row) => (
          <li
            key={row}
            className="flex items-baseline justify-between gap-2"
          >
            <span className="text-xs text-zinc-500">
              {VALUE_BREAKDOWN_LABELS[row]}
            </span>
            <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
              {formatSheetValue(breakdown[BREAKDOWN_KEYS[row]])}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
