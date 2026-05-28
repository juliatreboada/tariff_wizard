"use client";

import Image from "next/image";
import {
  catalogImageUrl,
  filterCatalogEntries,
  getAvailableBalanceSubtypes,
  getCatalogEntries,
} from "@/lib/tariff/catalog";
import { getMessages } from "@/lib/i18n";
import type { StoredHeader } from "@/lib/tariff/types";

type CatalogPreviewProps = {
  header: StoredHeader;
};

export function CatalogPreview({ header }: CatalogPreviewProps) {
  const t = getMessages();
  const entries = getCatalogEntries();
  const matching = filterCatalogEntries(entries, { header });
  const subtypes = getAvailableBalanceSubtypes(entries, header);

  if (matching.length === 0) {
    return (
      <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
        {t.sheet.catalogEmpty}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t.sheet.catalogSummary(matching.length, subtypes.join(", "))}
      </p>
      <ul className="flex flex-wrap gap-3">
        {matching.map((entry) => (
          <li
            key={entry.id}
            className="flex w-28 flex-col gap-1 rounded border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <Image
              src={catalogImageUrl(entry.image)}
              alt={entry.label}
              width={112}
              height={75}
              className="h-[75px] w-full object-contain"
            />
            <span className="truncate text-xs font-medium">{entry.label}</span>
            <span className="font-mono text-[10px] text-zinc-500">
              {entry.galicianCode} · {entry.value.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
