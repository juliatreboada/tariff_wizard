import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-zinc-500">(opcional)</span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function fieldInputClass(hasError?: boolean) {
  return `${inputClass}${hasError ? " border-red-500 dark:border-red-500" : ""}`;
}

export { inputClass };
