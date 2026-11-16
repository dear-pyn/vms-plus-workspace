"use client";
/** ตารางยานพาหนะแบบ A.5 — ใช้ร่วม: แท็บยานพาหนะที่ Overhaul (A.5) · ตารางรถในฟอร์มสร้าง/แก้ไขแผน (เจ้าของงานเคาะ D2 13 พ.ย. 2569) · รายละเอียดแผน
 *  คอลัมน์ตามจอ A.5: ทะเบียน/สังกัด · ยี่ห้อ รุ่น/ประเภท · มูลค่ายานพาหนะ · ราคากลาง · ประเมิน Overhaul · อายุการใช้งาน · ความคืบหน้า · ปุ่มท้ายแถว
 *  ราคา null = badge "ยังไม่ระบุ" จุดแดง (T10) */
import type { ReactNode } from "react";
import { StatusBadge } from "@ui/Badge";
import { Icon } from "@ui/Icon";
import { ProgressBar } from "@ui/ProgressBar";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { cx } from "@ui/cx";
import { currency } from "@rules/currency.mjs";
import type { VehicleInfo } from "./types";

export type VehicleRow = VehicleInfo & { referencePrice: number | null; overhaulEstimate: number | null; progress: number | null };
export type VehicleSortKey = "value" | "ageYears" | "progress";
export type VehicleSort<K extends string = VehicleSortKey> = { key: K; dir: 1 | -1 } | null;

/** กดหัวคอลัมน์ซ้ำ = สลับ น้อยไปมาก/มากไปน้อย · คอลัมน์ใหม่เริ่มน้อยไปมาก (ใช้ร่วม: แท็บยานพาหนะที่ Overhaul + Modal เพิ่มยานพาหนะ) */
export const nextSort = <K extends string>(s: VehicleSort<K>, k: K): VehicleSort<K> => (s?.key === k ? { key: k, dir: s.dir === 1 ? -1 : 1 } : { key: k, dir: 1 });

/** เรียงตามตัวเลข — ไม่มีข้อมูล (null/undefined) อยู่ท้ายเสมอ */
export function sortRows<T, K extends keyof T & string>(rows: T[], sort: VehicleSort<K>): T[] {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    const x = a[sort.key] as unknown as number | null | undefined, y = b[sort.key] as unknown as number | null | undefined;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x - y) * sort.dir;
  });
}

/** หัวคอลัมน์ที่เรียงได้ — ไอคอน swap_vert / arrow_upward / arrow_downward แบบหัวตารางแท็บยานพาหนะที่ Overhaul (A.5) */
export function SortTh<K extends string>({ k, sort, onSort, children }: { k: K; sort: VehicleSort<K>; onSort: (k: K) => void; children: ReactNode }) {
  return (
    <Th aria-sort={sort?.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(k)} className="flex items-center gap-2 font-semibold">
        {children}
        <Icon name={sort?.key === k ? (sort.dir === 1 ? "arrow_upward" : "arrow_downward") : "swap_vert"} size={20} className="text-gray-500" />
      </button>
    </Th>
  );
}

/** T10: ยังไม่ระบุ = `Badge outline with indicator` (สี่เหลี่ยม r4) จุดแดง (Color=Error) */
const price = (v: number | null) => (v === null ? <StatusBadge tone="error">ยังไม่ระบุ</StatusBadge> : currency(v));

export function VehicleTable<T extends VehicleRow>({
  rows,
  label,
  action,
  sort,
  onSort,
  rowKey = (v) => v.plate,
  select,
  status,
  statusLabel = "สถานะ",
  rowClassName,
  onRowClick,
  scrollY,
  hideProgress,
}: {
  rows: T[];
  label: string;
  action?: (v: T) => ReactNode;
  sort?: { key: VehicleSortKey; dir: 1 | -1 } | null;
  onSort?: (k: VehicleSortKey) => void;
  rowKey?: (v: T) => string;
  /** คอลัมน์ Checkbox หน้าสุด (Modal เพิ่มยานพาหนะ) — head = เลือกทั้งหน้า */
  select?: { head: ReactNode; cell: (v: T) => ReactNode };
  /** คอลัมน์ "สถานะ" ท้ายตาราง (Modal เพิ่มยานพาหนะ: เลือกไม่ได้เพราะอะไร) */
  status?: (v: T) => ReactNode;
  statusLabel?: string;
  rowClassName?: (v: T) => string | undefined;
  onRowClick?: (v: T) => void;
  /** เลื่อนเฉพาะตาราง หัวตารางอยู่กับที่ (ใน Modal) */
  scrollY?: boolean;
  /** ไม่มีคอลัมน์ "ความคืบหน้า" — ตารางยานพาหนะในแผนและ Purchase Order (เจ้าของงานสั่ง 16 พ.ย. 2569) · แท็บยานพาหนะที่ Overhaul ยังมี */
  hideProgress?: boolean;
}) {
  const sortTh = (k: VehicleSortKey, text: string) =>
    onSort ? (
      <SortTh k={k} sort={sort ?? null} onSort={onSort}>
        {text}
      </SortTh>
    ) : (
      <Th>{text}</Th>
    );
  return (
    <DataTable label={label} striped scrollY={scrollY}>
      <thead>
        <tr>
          {select && <Th className="w-12">{select.head}</Th>}
          <Th>ทะเบียน</Th>
          <Th>ประเภทยานพาหนะ</Th>
          {sortTh("value", "มูลค่ายานพาหนะ (บาท)")}
          <Th>ราคากลาง</Th>
          <Th>ประเมิน Overhaul (บาท)</Th>
          {sortTh("ageYears", "อายุการใช้งาน")}
          {!hideProgress && sortTh("progress", "ความคืบหน้า")}
          {status && <Th>{statusLabel}</Th>}
          {action && <Th aria-label="จัดการ" />}
        </tr>
      </thead>
      <tbody>
        {rows.map((v) => (
          <tr key={rowKey(v)} className={cx(onRowClick && "cursor-pointer hover:bg-gray-50", rowClassName?.(v))} onClick={onRowClick ? () => onRowClick(v) : undefined}>
            {select && <Td>{select.cell(v)}</Td>}
            <Td>
              <CellStack main={<span className="font-semibold">{v.plate}</span>} sub={v.affiliation} />
            </Td>
            <Td>
              <CellStack main={`${v.make} ${v.model}`} sub={v.type} />
            </Td>
            <Td className="tabular-nums">{currency(v.value)}</Td>
            <Td className="tabular-nums">{price(v.referencePrice)}</Td>
            <Td className="tabular-nums">{price(v.overhaulEstimate)}</Td>
            <Td>{Number.isFinite(v.ageYears) ? `${v.ageYears} ปี` : "—"}</Td>
            {!hideProgress && <Td className="w-40">{v.progress === null ? "—" : <ProgressBar tone="info" decimals={1} value={v.progress} label={`ความคืบหน้า ${v.plate}`} />}</Td>}
            {status && <Td>{status(v)}</Td>}
            {action && <Td className="w-14 text-right">{action(v)}</Td>}
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}
