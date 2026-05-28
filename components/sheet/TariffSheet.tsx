"use client";

import { Fragment } from "react";
import { catalogImageUrl } from "@/lib/tariff/catalog";
import {
  combinedFooterSpans,
  type ComputedBlockLayout,
  type ComputedSheetLayout,
  type SheetColumnSlot,
  OFFICIAL_COMBINED_FOOTER,
} from "@/lib/tariff/compute-sheet-layout";
import { elementMetaDisplay } from "@/lib/tariff/element-display";
import { usesDvOver100ForDScore } from "@/lib/tariff/level-category";
import {
  OFFICIAL_ROW_LABELS,
  OFFICIAL_VALUE_SUBCOLS,
  type OfficialSheetBlockId,
} from "@/lib/tariff/official-sheet-layout";
import type { PlacedElement } from "@/lib/tariff/sheet-types";
import type { StoredHeader, ValueBreakdown } from "@/lib/tariff/types";
import { formatTsBannerLine } from "@/lib/tariff/sheet-banner";
import { formatSheetValue } from "@/lib/tariff/value-breakdown";

export type TariffSheetProps = {
  header: StoredHeader;
  layout: ComputedSheetLayout;
  valueBreakdown: ValueBreakdown;
};

function slotElement(slot: SheetColumnSlot): PlacedElement | undefined {
  return slot.kind === "element" ? slot.element : undefined;
}

function ValueSubcells({ element }: { element?: PlacedElement }) {
  return (
    <div className="official-value-grid">
      {Array.from({ length: OFFICIAL_VALUE_SUBCOLS }, (_, i) => (
        <div key={i} className="official-value-subcell">
          {i === 0 && element != null ? formatSheetValue(element.value) : ""}
        </div>
      ))}
    </div>
  );
}

function MetaRowCell({
  blockId,
  slot,
}: {
  blockId: OfficialSheetBlockId;
  slot: SheetColumnSlot;
}) {
  if (slot.kind === "empty") {
    return (
      <div className="official-meta-grid">
        <div className="official-meta-num" />
        <div className="official-meta-info" />
      </div>
    );
  }
  const meta = elementMetaDisplay(slot.element, blockId);
  return (
    <div className="official-meta-grid">
      <div className="official-meta-num">{slot.elementNumber}</div>
      <div className="official-meta-info">{meta}</div>
    </div>
  );
}

function SidebarBox({ title, value }: { title: string; value?: string }) {
  return (
    <div className="official-sidebar-box">
      <div className="official-sidebar-box-title">{title}</div>
      <div className="official-sidebar-box-value">{value ?? ""}</div>
    </div>
  );
}

function TariffSidebar({
  header,
  valueBreakdown,
}: {
  header: StoredHeader;
  valueBreakdown: ValueBreakdown;
}) {
  const dv =
    valueBreakdown.balance + valueBreakdown.dynamic + valueBreakdown.individual;
  const dScore = usesDvOver100ForDScore(header.levelSystem, header.levelAge)
    ? dv / 100
    : dv;
  const gymnastRows = [
    { role: "TOP", name: header.topName },
    { role: "BASE", name: header.baseNames[0] },
  ];

  return (
    <aside className="official-ts-sidebar">
      <SidebarBox
        title="PARTICIPATION NUMBER"
        value={header.participationNumber}
      />
      <SidebarBox title="COUNTRY" value={header.country} />
      <SidebarBox title="CLUB" value={header.clubName} />

      <div className="official-sidebar-box">
        <div className="official-sidebar-box-title">GYMNASTS</div>
        {gymnastRows.map((row) => (
          <div key={row.role} className="official-sidebar-gymnast-row">
            <span className="official-sidebar-gymnast-role">{row.role}</span>
            <span className="official-sidebar-gymnast-name">{row.name}</span>
          </div>
        ))}
      </div>

      <div className="official-sidebar-box">
        <div className="official-sidebar-box-title">CONTACT PERSON</div>
        <div className="official-sidebar-gymnast-row">
          <span className="official-sidebar-gymnast-role">NAME</span>
          <span className="official-sidebar-gymnast-name">
            {header.contactName}
          </span>
        </div>
        <div className="official-sidebar-gymnast-row">
          <span className="official-sidebar-gymnast-role">TEL</span>
          <span className="official-sidebar-gymnast-name">
            {header.contactPhone}
          </span>
        </div>
      </div>

      <SidebarBox title="COMPETITION" value={header.competition} />
      <SidebarBox
        title="LEVEL"
        value={`${header.levelAge} ${header.levelSystem}`}
      />
      <SidebarBox
        title="CATEGORY"
        value={header.categoryCode ?? header.category}
      />
      <SidebarBox title="EXERCISE" value={header.exercise} />

      <div className="official-sidebar-box">
        <div className="official-sidebar-box-title">DIFFICULTY</div>
        <div className="official-sidebar-split-row">
          <span>D-SCORE</span>
          <span className="tabular-nums">{formatSheetValue(dScore)}</span>
        </div>
        <div className="official-sidebar-split-row">
          <span>DV</span>
          <span className="tabular-nums">{formatSheetValue(dv)}</span>
        </div>
      </div>

      <div className="official-sidebar-box">
        <div className="official-sidebar-box-title">VALUE</div>
        <div className="official-sidebar-split-row">
          <span>BALANCE</span>
          <span className="tabular-nums">
            {formatSheetValue(valueBreakdown.balance)}
          </span>
        </div>
        <div className="official-sidebar-split-row">
          <span>DYNAMIC</span>
          <span className="tabular-nums">
            {formatSheetValue(valueBreakdown.dynamic)}
          </span>
        </div>
        <div className="official-sidebar-split-row">
          <span>INDIVIDUAL</span>
          <span className="tabular-nums">
            {formatSheetValue(valueBreakdown.individual)}
          </span>
        </div>
      </div>
    </aside>
  );
}

function BlockDivider({ colSpan }: { colSpan: number }) {
  return (
    <tr className="official-block-divider" aria-hidden>
      <td colSpan={colSpan} className="official-block-divider-cell" />
    </tr>
  );
}

function ElementBlockRows({ block }: { block: ComputedBlockLayout }) {
  const isCombined = block.blockId === "combined";
  const [spanA, spanB, spanC] = combinedFooterSpans(block.columns.length);

  return (
    <>
      <tr className="official-meta-row">
        <td className="official-corner-cell" />
        {block.columns.map((slot, col) => (
          <td key={col} className="official-element-col">
            <MetaRowCell blockId={block.blockId} slot={slot} />
          </td>
        ))}
      </tr>
      <tr className="official-image-row">
        <td className="official-corner-cell" />
        {block.columns.map((slot, col) => {
          const el = slotElement(slot);
          return (
            <td key={col} className="official-element-col official-img-cell">
              {el ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={catalogImageUrl(el.image)}
                  alt={el.label}
                  className="official-element-img"
                />
              ) : null}
            </td>
          );
        })}
      </tr>
      <tr>
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.value}
        </th>
        {block.columns.map((slot, col) => (
          <td key={col} className="official-element-col official-value-cell">
            <ValueSubcells element={slotElement(slot)} />
          </td>
        ))}
      </tr>
      <tr>
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.sh}
        </th>
        {block.columns.map((slot, col) => (
          <td key={col} className="official-element-col official-sh-cell">
            {slotElement(slot)?.galicianCode ?? ""}
          </td>
        ))}
      </tr>
      <tr>
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.top}
        </th>
        {block.columns.map((_, col) => (
          <td key={col} className="official-element-col official-top-row" />
        ))}
      </tr>
      <tr className="official-block-last-row">
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.base}
        </th>
        {isCombined ? (
          <>
            <td colSpan={spanA} className="official-footer-label">
              {OFFICIAL_COMBINED_FOOTER[0]}
            </td>
            <td colSpan={spanB} className="official-footer-label">
              {OFFICIAL_COMBINED_FOOTER[1]}
            </td>
            <td colSpan={spanC} className="official-footer-label">
              {OFFICIAL_COMBINED_FOOTER[2]}
            </td>
          </>
        ) : (
          block.columns.map((_, col) => (
            <td key={col} className="official-element-col official-base-row" />
          ))
        )}
      </tr>
    </>
  );
}

export function TariffSheet({
  header,
  layout,
  valueBreakdown,
}: TariffSheetProps) {
  return (
    <div
      className="official-ts"
      data-block-count={layout.blocks.length}
      data-column-count={layout.columnCount}
      style={
        {
          "--official-column-count": layout.columnCount,
          "--ts-block-count": layout.blocks.length,
        } as React.CSSProperties
      }
    >
      <header className="official-ts-banner">
        <p className="official-ts-banner-line">{formatTsBannerLine(header)}</p>
        <div className="official-ts-meta">
          <span>As: 1</span>
          <span>Pages: 1</span>
        </div>
      </header>

      <div className="official-ts-body">
        <div className="official-ts-main">
          <table className="official-main-table">
            <colgroup>
              <col className="official-col-label" />
              {Array.from({ length: layout.columnCount }, (_, i) => (
                <col key={i} className="official-col-element" />
              ))}
            </colgroup>
            <tbody>
              {layout.blocks.map((block, index) => (
                <Fragment key={block.blockId}>
                  {index > 0 ? (
                    <BlockDivider colSpan={layout.columnCount + 1} />
                  ) : null}
                  <ElementBlockRows block={block} />
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <TariffSidebar header={header} valueBreakdown={valueBreakdown} />
      </div>
    </div>
  );
}

export const OfficialTariffSheet = TariffSheet;
