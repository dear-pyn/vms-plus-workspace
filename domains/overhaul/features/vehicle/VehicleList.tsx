"use client";
/** แท็บ "ยานพาหนะที่ Overhaul" — Scene A.5–A.8 (refinement sprint 09) **ไม่ทำการ์ดสรุป/กราฟ** (เจ้าของงานสั่ง 13 พ.ย. 2569)
 *  ตารางครบชุดอยู่ที่ VehicleBrowser (ใช้ร่วมกับฟอร์มแผน)
 *  เจ้าของงาน 19 พ.ย. 2569: เพิ่มคอลัมน์ "แผน / Purchase Order" แบบ Dashboard ระดับยานพาหนะ · ปุ่มท้ายแถวเป็นรูปตา เปิดข้อมูลยานพาหนะในแท็บใหม่
 *    เจ้าของงาน 19 พ.ย. 2569 (ต่อ): รูปตา → ปุ่ม 3 จุด (RowMenu) คำเดียวกับเมนูในหน้าเลือกยานพาหนะของฟอร์มแผน (D3) — เปิดแท็บใหม่ทั้งคู่
 *    + คอลัมน์ "สถานะ" ของยานพาหนะในแผน (Pill สถานะงานรายคัน แบบตาราง PO) · ยังไม่มี PO = ยังไม่มีงาน แสดง — · ไม่แสดงข้อความ "ยังไม่มี PO"
 *    ⇒ แถวสร้างจากแผนจริง (1 แถว ต่อ ยานพาหนะ + แผน ตาม FigJam) · PO = ใบที่มีทะเบียนนั้นในแผนนั้น · ความคืบหน้า = งานรายคันของ PO นั้น */
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { RowMenu } from "@ui/RowMenu";
import type { Plan } from "../plan/types";
import { JOB_STATUS, type JobCode, type PurchaseOrder, type VehicleJob } from "../po/types";
import type { PlanVehicle } from "./types";
import { VehicleBrowser } from "./VehicleBrowser";

type Row = PlanVehicle & { fiscalYear: number; planNo: string; poNo?: string; code?: JobCode };

/** ลำดับขั้นงาน V1 → V11 ตามลำดับใน JOB_STATUS — เรียงคอลัมน์สถานะ */
const ORDER = Object.keys(JOB_STATUS) as JobCode[];

export function vehicleRows(plans: Plan[], pos: PurchaseOrder[], jobs: VehicleJob[]): Row[] {
  return plans.flatMap((p) =>
    p.vehicles.map((v) => {
      const po = pos.find((x) => x.planId === p.id && x.plates.includes(v.plate));
      const job = po && jobs.find((j) => j.poId === po.id && j.plate === v.plate);
      return { ...v, fiscalYear: p.fiscalYear, planNo: p.id, poNo: po?.id, progress: job ? job.progress : null, code: job?.code, statusOrder: job ? ORDER.indexOf(job.code) : null };
    }),
  );
}

export function VehicleList({ plans, pos, jobs, onOpenVehicle, onReport }: { plans: Plan[]; pos: PurchaseOrder[]; jobs: VehicleJob[]; onOpenVehicle: (plate: string, tab: "info" | "repair") => void; onReport: () => void }) {
  return (
    <VehicleBrowser
      rows={vehicleRows(plans, pos, jobs)}
      label="ยานพาหนะที่ Overhaul"
      title={(n) => `ยานพาหนะที่ Overhaul (${n})`}
      showYear
      showPlan
      toolbarActions={<Button variant="secondary" iconLeft="download" onClick={onReport}>รายงาน</Button>}
      planStatus={(v) => (v.code ? <Pill tone={JOB_STATUS[v.code].tone}>{JOB_STATUS[v.code].label}</Pill> : "—")}
      rowKey={(v) => `${v.plate}-${v.planNo}`}
      action={(v) => (
        <RowMenu
          label={`จัดการ ${v.plate}`}
          items={[
            { label: "ดูข้อมูลยานพาหนะ", icon: "quick_reference_all", onSelect: () => onOpenVehicle(v.plate, "info") },
            { label: "ดูข้อมูลการซ่อม", icon: "build", onSelect: () => onOpenVehicle(v.plate, "repair") },
          ]}
        />
      )}
    />
  );
}
