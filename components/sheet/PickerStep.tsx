"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { getMessages } from "@/lib/i18n";

/**
 * A step that takes over the picker to choose one option of an element (a
 * landing, a twist, a pyramid's add-on): it slides in, scrolls into view and
 * has a back arrow to the full list.
 */
export function PickerStep({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const t = getMessages();
  const ref = useRef<HTMLDivElement>(null);
  const options = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // Focus the first option the coach can choose, not the back button.
    options.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className="picker-step flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          <span aria-hidden="true">←</span> {t.sheet.picker.back}
        </button>
        <p className="text-sm font-medium text-zinc-800">{title}</p>
      </div>
      <div ref={options} className="contents">
        {children}
      </div>
    </div>
  );
}
