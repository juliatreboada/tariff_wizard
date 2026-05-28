"use client";

import Image from "next/image";
import {
  catalogImageUrl,
  filterCatalogEntries,
  getAvailableTypes,
  getCatalogEntries,
  type CatalogEntry,
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
  const types = getAvailableTypes(entries, header);

  return (
    <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-800">
        {t.sheet.catalogToggle}
      </summary>
      <p className="mt-2 text-xs text-zinc-600">
        {matching.length === 0
          ? t.sheet.catalogEmpty
          : t.sheet.catalogSummary(matching.length, types.join(", "))}
      </p>
      {matching.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {matching.map((entry: CatalogEntry) => (
            <li
              key={entry.id}
              className="flex flex-col items-center rounded border border-zinc-200 bg-white p-1"
            >
              <Image
                src={catalogImageUrl(entry.image)}
                alt={entry.coordinates}
                width={64}
                height={48}
                className="h-10 w-full object-contain"
              />
              <span className="mt-0.5 truncate text-[10px]">{entry.coordinates}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}
