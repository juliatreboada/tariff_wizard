"use client";

import { Fragment } from "react";
import { catalogImageUrl } from "@/lib/tariff/catalog";
import {
  combinedFooterSpans,
  OFFICIAL_COMBINED_FOOTER,
  type ComputedBlockLayout,
  type ComputedSheetLayout,
  type SheetColumnSlot,
} from "@/lib/tariff/compute-sheet-layout";
import { getMessages } from "@/lib/i18n";
import {
  formatSidebarBreakdownValue,
  sheetCoordinatesInRow,
  sheetImageCellRoleFooter,
  sheetSlotMetaDisplay,
  sheetValueInSubcell,
} from "@/lib/tariff/element-display";
import { isEscolarRuleset } from "@/lib/tariff/rules-escolar";
import { exerciseLabel } from "@/lib/tariff/exercise-display";
import { gymnastSidebarRows } from "@/lib/tariff/gymnast-display";
import {
  categoryDisplayLabel,
  usesDvOver100ForDScore,
} from "@/lib/tariff/level-category";
import {
  OFFICIAL_ROW_LABELS,
  OFFICIAL_VALUE_SUBCOLS,
} from "@/lib/tariff/official-sheet-layout";
import type { StoredHeader, ValueBreakdown } from "@/lib/tariff/types";
import { formatTsBannerLine } from "@/lib/tariff/sheet-banner";
import { formatSheetValue } from "@/lib/tariff/value-breakdown";

export type TariffSheetProps = {
  header: StoredHeader;
  layout: ComputedSheetLayout;
  valueBreakdown: ValueBreakdown;
};

function ValueSubcells({
  slot,
  escolar,
}: {
  slot: SheetColumnSlot;
  escolar: boolean;
}) {
  return (
    <div className="official-value-grid">
      {Array.from({ length: OFFICIAL_VALUE_SUBCOLS }, (_, i) => (
        <div key={i} className="official-value-subcell">
          {sheetValueInSubcell(slot, i, escolar)}
        </div>
      ))}
    </div>
  );
}

function ImageCell({
  slot,
  optionalLabel,
}: {
  slot: SheetColumnSlot;
  optionalLabel: string;
}) {
  if (slot.kind === "empty") return null;

  const roleFooter =
    slot.kind === "element"
      ? sheetImageCellRoleFooter(slot.role, optionalLabel)
      : "";

  const image =
    slot.kind === "individual-group" ? (
      <div
        className="official-stacked-images"
        style={
          {
            "--stack-count": slot.elements.length,
          } as React.CSSProperties
        }
      >
        {slot.elements.map((el, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${el.catalogId}-${index}`}
            src={catalogImageUrl(el.image)}
            alt={el.coordinates}
            className="official-stacked-img"
          />
        ))}
      </div>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={catalogImageUrl(slot.element.image)}
        alt={slot.element.coordinates}
        className="official-element-img"
      />
    );

  return (
    <div className="official-img-wrap">
      <div className="official-img-main">{image}</div>
      {roleFooter ? (
        <div className="official-img-role-footer">{roleFooter}</div>
      ) : null}
    </div>
  );
}

function MetaRowCell({ slot }: { slot: SheetColumnSlot }) {
  if (slot.kind === "empty") {
    return (
      <div className="official-meta-grid">
        <div className="official-meta-num" />
        <div className="official-meta-info" />
      </div>
    );
  }
  const meta = sheetSlotMetaDisplay(slot);
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
  exerciseDisplay,
  escolar,
}: {
  header: StoredHeader;
  valueBreakdown: ValueBreakdown;
  exerciseDisplay: string;
  escolar: boolean;
}) {
  const t = getMessages();
  const dv = valueBreakdown.total;
  const dScore = usesDvOver100ForDScore(header.levelSystem, header.levelAge)
    ? dv / 100
    : dv;
  const gymnastRows = gymnastSidebarRows(header, t.sheetLabels, {
    numberedBases: false,
  });

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
        {gymnastRows.map((row, index) => (
          <div
            key={`gymnast-${index}-${row.name}`}
            className="official-sidebar-gymnast-row"
          >
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
        value={categoryDisplayLabel(header)}
      />
      <SidebarBox title="EXERCISE" value={exerciseDisplay} />

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
            {formatSidebarBreakdownValue("balance", valueBreakdown, escolar)}
          </span>
        </div>
        <div className="official-sidebar-split-row">
          <span>DYNAMIC</span>
          <span className="tabular-nums">
            {formatSidebarBreakdownValue("dynamic", valueBreakdown, escolar)}
          </span>
        </div>
        <div className="official-sidebar-split-row">
          <span>INDIVIDUAL</span>
          <span className="tabular-nums">
            {formatSidebarBreakdownValue("individual", valueBreakdown, escolar)}
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

function ElementBlockRows({
  block,
  isLastBlock,
  escolar,
  optionalLabel,
}: {
  block: ComputedBlockLayout;
  isLastBlock: boolean;
  escolar: boolean;
  optionalLabel: string;
}) {
  const { columns } = block;
  const [spanA, spanB, spanC] = combinedFooterSpans(columns.length);

  return (
    <>
      <tr className="official-meta-row">
        <td className="official-corner-cell" />
        {columns.map((slot, col) => (
          <td key={col} className="official-element-col">
            <MetaRowCell slot={slot} />
          </td>
        ))}
      </tr>
      <tr className="official-image-row">
        <td className="official-corner-cell" />
        {columns.map((slot, col) => (
          <td key={col} className="official-element-col official-img-cell">
            <ImageCell slot={slot} optionalLabel={optionalLabel} />
          </td>
        ))}
      </tr>
      <tr>
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.value}
        </th>
        {columns.map((slot, col) => (
          <td key={col} className="official-element-col official-value-cell">
            <ValueSubcells slot={slot} escolar={escolar} />
          </td>
        ))}
      </tr>
      <tr>
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.sh}
        </th>
        {columns.map((slot, col) => (
          <td key={col} className="official-element-col official-sh-cell">
            {sheetCoordinatesInRow(slot, "sh")}
          </td>
        ))}
      </tr>
      <tr>
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.top}
        </th>
        {columns.map((slot, col) => (
          <td key={col} className="official-element-col official-top-row">
            {sheetCoordinatesInRow(slot, "top")}
          </td>
        ))}
      </tr>
      <tr className="official-block-last-row">
        <th className="official-row-label" scope="row">
          {OFFICIAL_ROW_LABELS.base}
        </th>
        {isLastBlock ? (
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
          columns.map((_, col) => (
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
  const t = getMessages();
  const exerciseDisplay = exerciseLabel(header.exercise, t.exercises);
  const escolar = isEscolarRuleset(header);

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
                <Fragment key={block.blockIndex}>
                  {index > 0 ? (
                    <BlockDivider colSpan={layout.columnCount + 1} />
                  ) : null}
                  <ElementBlockRows
                    block={block}
                    isLastBlock={index === layout.blocks.length - 1}
                    escolar={escolar}
                    optionalLabel={t.routine.escolarOptional}
                  />
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <TariffSidebar
          header={header}
          valueBreakdown={valueBreakdown}
          exerciseDisplay={exerciseDisplay}
          escolar={escolar}
        />
      </div>
    </div>
  );
}

export const OfficialTariffSheet = TariffSheet;
