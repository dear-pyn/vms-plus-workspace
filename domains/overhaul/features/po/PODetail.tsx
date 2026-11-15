"use client";
/** หน้ารายละเอียด Purchase Order — จอ OH2 / E.9 · F.1.2 · F.4.2 (ตาราง F.4.2 ตรง AC-S4 มากกว่า E.9 → ยึด F.4.2)
 *  component: Page header (breadcrumb 3 ชั้น) · Secondary danger button "ลบ Purchase Order" · Secondary button "แก้ไข" ·
 *    Section label · Content item row · File upload (แสดงอย่างเดียว) · Table (Alternating fills) · Pill outline (สถานะงาน — ในตาราง)
 *  คอลัมน์ F.4.2: ทะเบียน · ยี่ห้อ/รุ่น · ประเภท · หน่วยงานเจ้าของ · เลขไมล์ (กม.) · อายุการใช้งาน · สถานะงาน · รายละเอียดตามสถานะ · ไปหน้างานรายคัน */
import type { ReactNode } from "react";
import { Button } from "@ui/Button";
import { Pill } from "@ui/Badge";
import { ContentItem as Item, PageHeader, SectionLabel } from "@ui/PageHeader";
import { DataTable, Td, Th } from "@ui/Table";
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
  onOpenSummary,
}: {
  plan: Plan;
  po: PurchaseOrder;
  garage?: Garage;
  jobs: VehicleJob[];
  /** T.1.1 ไอคอน quick_reference_all ท้ายแถวที่ปิดงานแล้ว → หน้าสรุปรายคัน */
  onOpenSummary?: (plate: string) => void;
  onGoPlans: () => void;
  onGoPlan: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenJob: (plate: string) => void;
}) {
  const rows = po.plates.map((p) => ({
    v: plan.vehicles.find((x) => x.plate === p),
    j: jobs.find((x) => x.poId === po.id && x.plate === p),
  }));
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
        <DataTable label="รายการยานพาหนะใน Purchase Order" striped>
          <thead>
            <tr>
              <Th>ทะเบียน</Th>
              <Th>ยี่ห้อ/รุ่น · ประเภท</Th>
              <Th>หน่วยงานเจ้าของยานพาหนะ</Th>
              <Th>เลขไมล์ (กม.)</Th>
              <Th>อายุการใช้งาน</Th>
              <Th>สถานะงาน</Th>
              <Th>รายละเอียดตามสถานะ</Th>
              <Th className="w-14">
                <span className="sr-only">ไปหน้างาน</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ v, j }, i) => (
              <tr
                key={po.plates[i]}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onOpenJob(po.plates[i])}
              >
                <Td className="font-semibold">{po.plates[i]}</Td>
                <Td>{v ? `${v.make} ${v.model} · ${v.type}` : "-"}</Td>
                <Td>{v?.affiliation ?? "-"}</Td>
                <Td className="tabular-nums">
                  {v?.mileageKm !== undefined
                    ? v.mileageKm.toLocaleString()
                    : "-"}
                </Td>
                <Td>{v ? `${v.ageYears} ปี` : "-"}</Td>
                <Td>
                  {j ? (
                    <Pill tone={JOB_STATUS[j.code].tone}>
                      {JOB_STATUS[j.code].label}
                    </Pill>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td>
                  {j ? (
                    <div className="flex flex-col">
                      <span>{j.detail[0]}</span>
                      {j.detail[1] && (
                        <span className="text-xs text-gray-600">
                          {j.detail[1]}
                        </span>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    {j?.code === "V11" && onOpenSummary && (
                      <Button
                        variant="tertiary"
                        iconOnly="quick_reference_all"
                        aria-label={`ดูสรุปรายคัน ${po.plates[i]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSummary(po.plates[i]);
                        }}
                      />
                    )}
                    <Button
                      variant="tertiary"
                      iconOnly="keyboard_arrow_right"
                      aria-label={`ไปหน้างาน ${po.plates[i]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenJob(po.plates[i]);
                      }}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}
