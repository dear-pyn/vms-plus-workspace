"use client";
/** หน้ารายละเอียดแผน — ตาม refinement sprint 09: OH2 / C.5 · S2 (หลังบันทึกแก้ไข) · D.1.2 · S3 (ปุ่ม "ลบแผน") · D.2.2 (ยืนยันลบในหน้า Detail)
 *  component: Page header · Badge outline (Gray) · Pill outline · Section header · Secondary danger button · Secondary button · File upload item (แสดงอย่างเดียว) */
import type { ReactNode } from "react";
import { Button } from "@ui/Button";
import { EmptyState } from "@ui/EmptyState";
import { OutlineBadge } from "@ui/Badge";
import { Icon } from "@ui/Icon";
import { ContentItem as Item, PageHeader, SectionLabel } from "@ui/PageHeader";
import { RowMenu } from "@ui/RowMenu";
import { currency } from "@rules/currency.mjs";
import { VehicleTable } from "../vehicle/VehicleTable";
import type { Plan, PlanFile } from "./types";
import { POList } from "../po/POList";
import type { Garage, PurchaseOrder, VehicleJob } from "../po/types";

export interface PlanDetailProps {
  plan: Plan;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNotInScope: (what: string) => void;
  onOpenVehicle: (plate: string, tab: "info" | "repair") => void;
  /** S4–S6 */
  pos: PurchaseOrder[];
  jobs: VehicleJob[];
  garages: Garage[];
  onAddPO: () => void;
  onOpenPO: (id: string) => void;
  onEditPO: (id: string) => void;
  onDeletePO: (id: string) => void;
}


/** `_File upload item base` (จอ OH2 / B.3.4): การ์ด r8 ขอบ gray-300 pad 16 · `_File icon` = Featured icon 36 พื้น gray-100 ไอคอน draft 24 ·
 *  ชื่อไฟล์ 14/600 gray-600 · ขนาด 12 gray-600 · ปุ่ม Tertiary 40 ดาวน์โหลด/ลบ มุมขวาบน */
export function FileRow({ file, onRemove }: { file: PlanFile; onRemove?: () => void }) {
  return (
    <li className="relative flex items-center gap-3 rounded-md border border-gray-300 bg-white p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Icon name="draft" size={24} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col pr-24">
        <span className="truncate text-sm font-semibold text-gray-600">{file.name}</span>
        <span className="text-xs text-gray-600">{file.sizeKb.toLocaleString()} KB</span>
      </div>
      <div className="absolute top-2 right-2 flex">
        <Button variant="tertiary" iconOnly="download" aria-label={`ดาวน์โหลด ${file.name}`} />
        {onRemove && <Button variant="tertiary" iconOnly="delete" aria-label={`ลบไฟล์ ${file.name}`} onClick={onRemove} />}
      </div>
    </li>
  );
}

const DOC_GROUPS = [
  ["principle", "หนังสืออนุมัติหลักการ"],
  ["budget", "เอกสารอนุมัติงบ"],
  ["other", "เอกสารอื่น ๆ"],
] as const;

/** ป้ายสถานะบนหัวหน้า = `Badge outline` (ไม่ใช่ pill — เจ้าของงาน 14 พ.ย. 2569 pill มีเฉพาะในตาราง)
 *  E.1 Gray "ยังไม่มี Purchase Order" · G.1 Brand "รอดำเนินการ" · เสร็จสิ้น = Success */
const BADGE_TONE = { "รอเลข Purchase Order": "gray", รอดำเนินการ: "brand", เสร็จสิ้น: "success" } as const;

export function PlanDetail({ plan, onBack, onEdit, onDelete, onNotInScope, onOpenVehicle, pos, jobs, garages, onAddPO, onOpenPO, onEditPO, onDeletePO }: PlanDetailProps) {
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "จัดการงาน Overhaul", onClick: onBack }, { label: `แผน ${plan.id}` }]}
        title={`หมายเลขแผน ${plan.id}`}
        badge={pos.length === 0 ? <OutlineBadge>ยังไม่มี Purchase Order</OutlineBadge> : <OutlineBadge tone={BADGE_TONE[plan.status]}>{plan.status}</OutlineBadge>}
        actions={
          <>
            <Button variant="secondaryDanger" iconLeft="delete" onClick={onDelete}>
              ลบแผน
            </Button>
            <Button variant="secondary" iconLeft="stylus" onClick={onEdit}>
              แก้ไข
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="รายละเอียดแผน" />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-6 md:grid-cols-2 xl:grid-cols-4">
          <Item label="ชื่อแผน">{plan.name}</Item>
          <Item label="ประจำปีงบประมาณ">{plan.fiscalYear}</Item>
          <Item label="วงเงินอนุมัติ (บาท)">{currency(plan.budget)}</Item>
          {/* B.7: ไม่มีช่องประเภทงบประมาณ · จำนวน = ยานพาหนะในแผน (จอ B.7/E.1/E.8 เป็นค่าคงที่ "0 คัน" แม้มี PO แล้ว — ไม่ใช้เป็นสูตร) */}
          <Item label="จำนวนยานพาหนะที่ Overhaul">{`${plan.vehicles.length} คัน`}</Item>
          <Item label="วันที่สร้าง">{plan.createdAt}</Item>
          {/* ช่องตามประเภทงบ (AC-S1 ยังไม่เคาะ: หน้ารายละเอียดแสดงช่องตามประเภทงบ) — แสดงเฉพาะช่องที่มีค่า */}
          {plan.costCenter && <Item label="ศูนย์ต้นทุน">{plan.costCenter}</Item>}
          {plan.wbs && <Item label="เลข WBS (ศูนย์ต้นทุน)">{plan.wbs}</Item>}
          {plan.network && <Item label="เลขโครงข่าย">{plan.network}</Item>}
          {plan.activity && <Item label="เลขกิจกรรม">{plan.activity}</Item>}
          {plan.orderNo && <Item label="เลขที่ใบสั่ง">{plan.orderNo}</Item>}
          {plan.budgetNote && <Item label="หมายเหตุ">{plan.budgetNote}</Item>}
        </dl>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="เอกสาร" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {DOC_GROUPS.map(([k, label]) => (
            <div key={k} className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-gray-700">{label}</span>
              {plan.docs[k].length ? (
                <ul className="flex flex-col gap-2">{plan.docs[k].map((f) => <FileRow key={f.name} file={f} />)}</ul>
              ) : (
                <span className="text-sm text-gray-600">ไม่มีไฟล์</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title={`ยานพาหนะในแผน (${plan.vehicles.length} คัน)`} />
        {plan.vehicles.length === 0 ? (
          <EmptyState kind="data-empty" title="ยังไม่มียานพาหนะในแผน" description="แก้ไขแผนเพื่อเพิ่มยานพาหนะที่จะเข้า Overhaul" action={<Button iconLeft="stylus" onClick={onEdit}>แก้ไขแผน</Button>} />
        ) : (
          <VehicleTable
            rows={plan.vehicles}
            label="ยานพาหนะในแผน"
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
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */
          title={`Purchase Order (${pos.length})`}
          actions={
            pos.length > 0 && (
              /* F.1.1: Section label action = Tertiary brand button + add (จอเขียนแค่ "Purchase Order" — ใช้คำกลาง "เพิ่ม Purchase Order" ตามมติ FigJam Section 10) */
              <Button variant="tertiaryBrand" iconLeft="add" onClick={onAddPO}>
                เพิ่ม Purchase Order
              </Button>
            )
          }
        />
        {pos.length === 0 ? (
          /* T19 empty state แบบมีภาพประกอบ (Empty state/Data empty) · E.1 */
          <EmptyState
            kind="data-empty"
            title="ยังไม่มี Purchase Order"
            description="เพิ่ม Purchase Order เพื่อเลือกยานพาหนะที่จะเข้า Overhaul และเริ่มงานรายคัน"
            action={
              <Button iconLeft="add" onClick={onAddPO}>
                เพิ่ม Purchase Order
              </Button>
            }
          />
        ) : (
          <POList pos={pos} jobs={jobs} garages={garages} onOpen={onOpenPO} onEdit={onEditPO} onDelete={onDeletePO} />
        )}
      </section>

      {/* E.1 "อะไหล่ที่ใช้" — จองไว้ตาม userflow ขั้นเบิกอะไหล่ยังไม่อยู่ในต้นแบบรอบนี้ */}
      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="อะไหล่ที่ใช้" />
        <EmptyState
          kind="data-empty"
          title="ยังไม่มีรายการเบิกอะไหล่"
          description="รายการอะไหล่ที่เบิกให้แผนนี้จะแสดงที่นี่"
          action={
            <Button variant="secondary" iconLeft="add" onClick={() => onNotInScope("เบิกอะไหล่")}>
              เบิกอะไหล่
            </Button>
          }
        />
      </section>
    </div>
  );
}
