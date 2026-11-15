"use client";
/** ตาราง Purchase Order ในหน้ารายละเอียดแผน — จอ OH2 / E.8 · G.1 · G.2
 *  component: Table (Alternating fills) · Table cell Lead Progress Bar · ปุ่ม more_horiz ท้ายแถว (ดูรายละเอียด · แก้ไข · ลบ — AC-S4)
 *  คอลัมน์: หมายเลข · ชื่อ · ศูนย์บริการ/อู่ · จำนวนยานพาหนะ · ความคืบหน้า · วันเริ่มสัญญา · วันสิ้นสุดสัญญา (+ ใกล้ครบสัญญา สีแดง) */
import { ProgressBar } from "@ui/ProgressBar";
import { RowMenu } from "@ui/RowMenu";
import { DataTable, Td, Th } from "@ui/Table";
import type { Garage, PurchaseOrder, VehicleJob } from "./types";
import { contractNote, poProgress } from "./view";

export function POList({ pos, jobs, garages, onOpen, onEdit, onDelete }: { pos: PurchaseOrder[]; jobs: VehicleJob[]; garages: Garage[]; onOpen: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <DataTable label="Purchase Order" striped>
      <thead>
        <tr>
          <Th>หมายเลข Purchase Order</Th>
          <Th>ชื่อ Purchase Order</Th>
          <Th>ศูนย์บริการ/อู่</Th>
          <Th>จำนวนยานพาหนะ</Th>
          <Th>ความคืบหน้า</Th>
          <Th>วันเริ่มสัญญา</Th>
          <Th>วันสิ้นสุดสัญญา</Th>
          <Th className="w-14">
            <span className="sr-only">จัดการ</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {pos.map((po) => {
          const pr = poProgress(po, jobs);
          const note = contractNote(po.contractEnd, pr >= 100);
          return (
            <tr key={po.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onOpen(po.id)}>
              <Td className="font-semibold text-brand-900">{po.id}</Td>
              <Td>{po.name}</Td>
              <Td>{garages.find((g) => g.id === po.garageId)?.name ?? "-"}</Td>
              <Td>{po.plates.length}</Td>
              <Td className="w-40">
                <ProgressBar tone="info" decimals={1} value={pr} label={`ความคืบหน้า ${po.id}`} />
              </Td>
              <Td>{po.contractStart || "-"}</Td>
              <Td>
                <div className="flex flex-col">
                  <span>{po.contractEnd || "-"}</span>
                  {note && <span className="text-xs text-error-600">{note}</span>}
                </div>
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                <RowMenu
                  label={`จัดการ ${po.id}`}
                  items={[
                    { label: "ดูรายละเอียด", icon: "quick_reference_all", onSelect: () => onOpen(po.id) },
                    { label: "แก้ไข", icon: "stylus", onSelect: () => onEdit(po.id) },
                    { label: "ลบ Purchase Order", icon: "delete", danger: true, onSelect: () => onDelete(po.id) },
                  ]}
                />
              </Td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
