"use client";
/** ตารางยานพาหนะแบบ A.5 — ใช้ร่วม: แท็บยานพาหนะที่ Overhaul (A.5) · ตารางรถในฟอร์มสร้าง/แก้ไขแผน (เจ้าของงานเคาะ D2 13 พ.ย. 2569) · รายละเอียดแผน
 *  คอลัมน์ตามจอ A.5: ทะเบียน/สังกัด · ยี่ห้อ รุ่น/ประเภท · มูลค่ายานพาหนะ · ราคากลาง · ประเมิน Overhaul · อายุการใช้งาน · ความคืบหน้า · ปุ่มท้ายแถว
 *  ราคา null = badge "ยังไม่ระบุ" จุดแดง (T10) */
import type { ReactNode } from "react";
import { StatusBadge } from "@ui/Badge";
import { Icon } from "@ui/Icon";
import { ProgressBar } from "@ui/ProgressBar";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { currency } from "@rules/currency.mjs";
import type { VehicleInfo } from "./types";

export type VehicleRow = VehicleInfo & { referencePrice: number | null; overhaulEstimate: number | null; progress: number | null };
export type VehicleSortKey = "value" | "ageYears" | "progress";

/** T10: ยังไม่ระบุ = `Badge outline with indicator` (สี่เหลี่ยม r4) จุดแดง (Color=Error) */
const price = (v: number | null) => (v === null ? <StatusBadge tone="error">ยังไม่ระบุ</StatusBadge> : currency(v));

export function VehicleTable<T extends VehicleRow>({
  rows,
  label,
  action,
  sort,
  onSort,
  rowKey = (v) => v.plate,
}: {
  rows: T[];
  label: string;
  action?: (v: T) => ReactNode;
  sort?: { key: VehicleSortKey; dir: 1 | -1 } | null;
  onSort?: (k: VehicleSortKey) => void;
  rowKey?: (v: T) => string;
}) {
  const sortTh = (k: VehicleSortKey, text: string) =>
    onSort ? (
      <Th aria-sort={sort?.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
        <button type="button" onClick={() => onSort(k)} className="flex items-center gap-2 font-semibold">
          {text}
          <Icon name={sort?.key === k ? (sort.dir === 1 ? "arrow_upward" : "arrow_downward") : "swap_vert"} size={20} className="text-gray-500" />
        </button>
      </Th>
    ) : (
      <Th>{text}</Th>
    );
  return (
    <DataTable label={label} striped>
      <thead>
        <tr>
          <Th>ทะเบียน</Th>
          <Th>ประเภทยานพาหนะ</Th>
          {sortTh("value", "มูลค่ายานพาหนะ (บาท)")}
          <Th>ราคากลาง</Th>
          <Th>ประเมิน Overhaul (บาท)</Th>
          {sortTh("ageYears", "อายุการใช้งาน")}
          {sortTh("progress", "ความคืบหน้า")}
          {action && <Th aria-label="จัดการ" />}
        </tr>
      </thead>
      <tbody>
        {rows.map((v) => (
          <tr key={rowKey(v)}>
            <Td>
              <CellStack main={<span className="font-semibold">{v.plate}</span>} sub={v.affiliation} />
            </Td>
            <Td>
              <CellStack main={`${v.make} ${v.model}`} sub={v.type} />
            </Td>
            <Td className="tabular-nums">{currency(v.value)}</Td>
            <Td className="tabular-nums">{price(v.referencePrice)}</Td>
            <Td className="tabular-nums">{price(v.overhaulEstimate)}</Td>
            <Td>{v.ageYears} ปี</Td>
            <Td className="w-40">{v.progress === null ? "—" : <ProgressBar tone="info" decimals={1} value={v.progress} label={`ความคืบหน้า ${v.plate}`} />}</Td>
            {action && <Td className="w-14 text-right">{action(v)}</Td>}
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}
