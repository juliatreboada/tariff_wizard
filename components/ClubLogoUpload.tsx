"use client";

import { useId, useState } from "react";
import { getMessages } from "@/lib/i18n";
import { readClubLogoFile } from "@/lib/tariff/club-logo";
import { fieldInputClass } from "@/components/wizard/FormField";

type ClubLogoUploadProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  hasError?: boolean;
};

export function ClubLogoUpload({
  value,
  onChange,
  id,
  hasError,
}: ClubLogoUploadProps) {
  const t = getMessages();
  const autoId = useId();
  const inputId = id ?? autoId;
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const dataUrl = await readClubLogoFile(file);
      onChange(dataUrl);
      setError(null);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "too-large") {
        setError(t.sheetLabels.clubLogoTooLarge);
      } else {
        setError(t.sheetLabels.clubLogoInvalid);
      }
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative h-14 w-14 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-14 w-14 rounded-sm border border-zinc-200 object-contain"
            />
            <button
              type="button"
              onClick={() => {
                onChange("");
                setError(null);
              }}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 bg-white text-[10px] leading-none text-zinc-600 hover:bg-zinc-100"
              aria-label={t.sheetLabels.clubLogoRemove}
            >
              ×
            </button>
          </div>
        ) : null}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={`min-w-0 flex-1 ${fieldInputClass(hasError || !!error)}`}
        />
      </div>
      <p className="text-xs text-zinc-500">{t.sheetLabels.clubLogoHint}</p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
