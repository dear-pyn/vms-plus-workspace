"use client";
/** หน้ารายละเอียด Purchase Order — จอ OH2 / E.9 · F.1.2 · F.4.2 (ตาราง F.4.2 ตรง AC-S4 มากกว่า E.9 → ยึด F.4.2)
 *  component: Page header (breadcrumb 3 ชั้น) · Secondary danger button "ลบ Purchase Order" · Secondary button "แก้ไข" ·
 *    Section label · Content item row · File upload (แสดงอย่างเดียว) · Table (Alternating fills) · Pill outline (สถานะงาน — ในตาราง)
 *  เจ้าของงานยืนยัน 16 พ.ย. 2569: ตารางชุด A.5 + ความคืบหน้าจากงานรายคัน + สถานะงาน + ไปหน้างาน (แทนตาราง F.4.2 เดิม) */
import { useState } from "react";
import { Button } from "@ui/Button";
import { Pill } from "@ui/Badge";
import { ContentItem as Item, PageHeader, SectionLabel } from "@ui/PageHeader";
import { VehicleTable, nextSort, sortRows, type VehicleSortKey } from "../vehicle/VehicleTable";
import { FileRow } from "../plan/PlanDetail";
import type { Plan } from "../plan/types";
import {
  JOB_STATUS,
  type Garage,
  type PurchaseOrder,
  type VehicleJob,
} from "./types";

export function PODetail({
  plan,
  po,
  garage,
  jobs,
  onGoPlans,
  onGoPlan,
  onEdit,
  onDelete,
  onOpenJob,
}: {
  plan: Plan;
  po: PurchaseOrder;
  garage?: Garage;
  jobs: VehicleJob[];
  onGoPlans: () => void;
  onGoPlan: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenJob: (plate: string) => void;
}) {
  const [sort, setSort] = useState<{ key: VehicleSortKey; dir: 1 | -1 } | null>(null);
  const rows = po.plates.map((plate) => {
    const vehicle = plan.vehicles.find((v) => v.plate === plate);
    const job = jobs.find((j) => j.poId === po.id && j.plate === plate);
    return {
      plate, affiliation: "—", make: "—", model: "", type: "—", value: NaN, ageYears: NaN,
      referencePrice: null, overhaulEstimate: null,
      ...vehicle,
      // The plan's vehicle snapshot may predate job updates; use the matching PO job.
      progress: job?.progress ?? null,
      job,
    };
  });
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[
          { label: "จัดการงาน Overhaul", onClick: onGoPlans },
          { label: `แผน ${plan.id}`, onClick: onGoPlan },
          { label: po.id },
        ]}
        title={`หมายเลข ${po.id}`}
        actions={
          <>
            <Button
              variant="secondaryDanger"
              iconLeft="delete"
              onClick={onDelete}
            >
              ลบ Purchase Order
            </Button>
            <Button variant="secondary" iconLeft="stylus" onClick={onEdit}>
              แก้ไข
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-5">
        <SectionLabel
          /* Section label (หน้าดูรายละเอียด) */ title="รายละเอียด Purchase Order"
        />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-6 md:grid-cols-2 xl:grid-cols-4">
          <Item label="ชื่อแผน">{plan.name}</Item>
          <Item label="ชื่อ Purchase Order">{po.name}</Item>
          <Item label="ศูนย์บริการ/อู่">{garage?.name}</Item>
          <Item label="เบอร์โทรอู่">{garage?.phone}</Item>
          <Item label="ที่อยู่">{garage?.address}</Item>
          <Item label="วันเริ่มสัญญา">{po.contractStart}</Item>
          <Item label="วันสิ้นสุดสัญญา">{po.contractEnd}</Item>
        </dl>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="เอกสาร" />
        {/* เจ้าของงาน 16 พ.ย. 2569: การ์ดไฟล์กว้างเต็ม 100% (กลุ่มเรียงซ้อนแทน 2 คอลัมน์) */}
        <div className="flex flex-col gap-6">
          {(
            [
              ["order", "ใบสั่งจ้าง"],
              ["other", "เอกสารอื่น ๆ"],
            ] as const
          )
            .filter(
              ([k]) => k === "order" || po.docs[k].length > 0,
            ) /* E.9 แสดงเฉพาะกลุ่มที่มีไฟล์ (ใบสั่งจ้างบังคับเสมอ) */
            .map(([k, label]) => (
              <div key={k} className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  {label}
                </span>
                {po.docs[k].length ? (
                  <ul className="flex flex-col gap-2">
                    {po.docs[k].map((f) => (
                      <FileRow key={f.name} file={f} />
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-600">ไม่มีไฟล์</span>
                )}
              </div>
            ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel
          /* Section label (หน้าดูรายละเอียด) */ title={`รายการยานพาหนะ (${po.plates.length})`}
        />
        <VehicleTable
          rows={sortRows(rows, sort)}
          label="รายการยานพาหนะใน Purchase Order"
          sort={sort}
          onSort={(key) => { if (key !== "statusOrder" && key !== "planNo") setSort((prev) => nextSort(prev, key)); } /* ตารางนี้ไม่มีคอลัมน์ planStatus */}
          statusLabel="สถานะงาน"
          status={(v) => v.job ? <Pill tone={JOB_STATUS[v.job.code].tone}>{JOB_STATUS[v.job.code].label}</Pill> : "—"}
          onRowClick={(v) => onOpenJob(v.plate)}
          action={(v) => (
            <div className="flex items-center justify-end gap-1">
              <Button variant="tertiary" iconOnly="keyboard_arrow_right" aria-label={`ไปหน้างาน ${v.plate}`} onClick={(e) => { e.stopPropagation(); onOpenJob(v.plate); }} />
            </div>
          )}
        />
      </section>
    </div>
  );
}
