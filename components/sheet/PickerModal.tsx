"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * The element picker as a modal: centred in front of the page, the page dimmed
 * and not scrolling behind it. Esc or a click on the backdrop closes it; focus
 * goes back to where it was. Tab stays inside it. An open step (a landing,
 * an add-on) handles Esc first, going back to the full list.
 */
export function PickerModal({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      // Keep Tab inside the dialog.
      if (e.key === "Tab" && dialog.current) {
        const focusable = [
          ...dialog.current.querySelectorAll<HTMLElement>(
            "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
          ),
        ].filter((el) => el.offsetParent !== null);
        if (focusable.length === 0) return;
        const [first, last] = [focusable[0], focusable[focusable.length - 1]];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-2 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-xl outline-none"
      >
        {children}
      </div>
    </div>
  );
}
