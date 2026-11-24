"use client";
/** หน้ารายละเอียดแผน — ตาม refinement sprint 09: OH2 / C.5 · S2 (หลังบันทึกแก้ไข) · D.1.2 · S3 (ปุ่ม "ลบแผน") · D.2.2 (ยืนยันลบในหน้า Detail)
 *  เจ้าของงานสั่ง 16 พ.ย. 2569 "ปรับตามหน้าจอ" UAT (maintain-d/overhaul-utility-vehicle/<id>): breadcrumb "หมายเลขแผน …" · ปุ่ม lg "แก้ไขแผน" ·
 *  เอกสารเรียงซ้อนในกล่องเทา · "ยานพาหนะในแผน" แสดงเสมอ (แก้ 16 พ.ย. 2569) · ปุ่มเพิ่ม PO ใต้ตาราง · อะไหล่ในกล่องเทา
 *  คงตาม Figma ที่เคาะแล้ว: ความคืบหน้า % + แถบ · วันเริ่ม/สิ้นสุดสัญญาแยกคอลัมน์ · คำว่า "Purchase Order" (มติ FigJam Section 10) · "ยานพาหนะ" แทน "รถ"
 *  component: Page header · Badge outline (Gray) · Pill outline · Section header · Secondary danger button · Secondary button · File upload item (แสดงอย่างเดียว) */
import { useState, type ReactNode } from "react";
import { Button } from "@ui/Button";
import { EmptyState } from "@ui/EmptyState";
import { OutlineBadge, Pill } from "@ui/Badge";
import { Icon } from "@ui/Icon";
import { ContentItem as Item, PageHeader, SectionLabel } from "@ui/PageHeader";
import { RowMenu } from "@ui/RowMenu";
import { currency } from "@rules/currency.mjs";
import { VehicleTable } from "../vehicle/VehicleTable";
import type { PlanVehicle } from "../vehicle/types";
import { PriceModal } from "./VehicleModals";
import type { Plan, PlanFile } from "./types";
import { POList } from "../po/POList";
import type { Garage, PurchaseOrder, Requisition, RequisitionLine, VehicleJob } from "../po/types";
import { canRequisition, requisitionsOf, withCancelledLine, withCancelledPart, withNewRequisition, withPartQty } from "../job/requisition";
import { AddRequisition, PartsRequisition, type ReqVehicle } from "../job/PartsRequisition";
import { nowStamp } from "../shared/time";
import type { ToastMsg } from "../shared/messages";

export interface PlanDetailProps {
  plan: Plan;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** เดิมใช้กับปุ่ม "เบิกอะไหล่" ระดับแผน — v2 EC-56 ย้ายไปเบิกรายคัน (คง prop ไว้ให้หน้าเรียกใช้เดิม) */
  onNotInScope: (what: string) => void;
  /** v2 EC-56: บันทึกใบเบิกของคันนั้นลงยานพาหนะในแผน */
  onSaveRequisitions: (plate: string, reqs: Requisition[], toast?: ToastMsg) => void;
  onOpenVehicle: (plate: string, tab: "info" | "repair") => void;
  /** ระบุ/แก้ไขราคารายคันจากหน้ารายละเอียด (เจ้าของงานสั่ง 16 พ.ย. 2569) — Modal เดียวกับฟอร์มแผน (B.12) */
  onSavePrice: (plate: string, p: { referencePrice: number; overhaulEstimate: number }) => void;
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
 *  รอเลข Purchase Order = Gray · G.1 Brand "รอดำเนินการ" · เสร็จสิ้น = Success */
const BADGE_TONE = { "รอเลข Purchase Order": "gray", รอดำเนินการ: "brand", เสร็จสิ้น: "success" } as const;

export function PlanDetail({ plan, onBack, onEdit, onDelete, onOpenVehicle, onSavePrice, onSaveRequisitions, pos, jobs, garages, onAddPO, onOpenPO, onEditPO, onDeletePO }: PlanDetailProps) {
  const [priceFor, setPriceFor] = useState<PlanVehicle | null>(null);
  /* v2 EC-56 เบิกอะไหล่รายคัน */
  const [reqFor, setReqFor] = useState<string | null>(null);
  const reqVehicles = planReqVehicles(plan, pos, jobs);
  const reqsOf = (plate: string) => reqVehicles.find((v) => v.plate === plate)?.reqs ?? [];
  async function addReq(plate: string, lines: RequisitionLine[]) {
    await new Promise((r) => setTimeout(r, 500));
    const { next } = withNewRequisition(reqsOf(plate), lines, nowStamp(), "กบค. (ผู้ใช้งานปัจจุบัน)", `rq-${Date.now()}`);
    onSaveRequisitions(plate, next, { msg: "เบิกอะไหล่สำเร็จ", description: `${plate} · ${lines.length} รายการ รอเบิกจากคลัง` });
    return true;
  }
  async function cancelReq(plate: string, reqId: string, partId: string, reason: string) {
    await new Promise((r) => setTimeout(r, 400));
    const v = reqVehicles.find((x) => x.plate === plate);
    const next = v?.editable ? withCancelledLine(v.reqs, reqId, partId, reason, nowStamp()) : null;
    if (!next) return false;
    onSaveRequisitions(plate, next, { msg: "ยกเลิกรายการเบิกสำเร็จ" });
    return true;
  }
  /* ตารางแบบขั้น 6 (เจ้าของงาน 24 พ.ย. 2569): แก้จำนวนในแถว = ปรับส่วนที่รอเบิกจากคลังของคันนั้น · ทันทีไม่มี toast */
  function setPartQty(plate: string, partId: string, price: number, qty: number) {
    const v = reqVehicles.find((x) => x.plate === plate);
    const next = v?.editable ? withPartQty(v.reqs, partId, price, qty, nowStamp(), "กบค. (ผู้ใช้งานปัจจุบัน)", `rq-${Date.now()}`) : null;
    if (!next || next === v?.reqs) return false;
    onSaveRequisitions(plate, next);
    return true;
  }
  async function cancelPart(plate: string, partId: string, price: number, reason: string) {
    await new Promise((r) => setTimeout(r, 400));
    const v = reqVehicles.find((x) => x.plate === plate);
    const next = v?.editable ? withCancelledPart(v.reqs, partId, price, reason, nowStamp()) : null;
    if (!next) return false;
    onSaveRequisitions(plate, next, { msg: "ยกเลิกรายการเบิกสำเร็จ" });
    return true;
  }
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "จัดการงาน Overhaul", onClick: onBack }, { label: `หมายเลขแผน ${plan.id}` }]}
        title={`หมายเลขแผน ${plan.id}`}
        /* เจ้าของงาน 16 พ.ย. 2569: ป้ายบนหัว = สถานะแผนเสมอ (ยังไม่มี PO = "รอเลข Purchase Order") ไม่ใช้ข้อความ "ยังไม่มี Purchase Order" ของจอ E.1 */
        badge={<OutlineBadge tone={BADGE_TONE[plan.status]}>{plan.status}</OutlineBadge>}
        actions={
          <>
            <Button variant="secondaryDanger" size="lg" iconLeft="delete" onClick={onDelete}>
              ลบแผน
            </Button>
            <Button variant="secondary" size="lg" iconLeft="stylus" onClick={onEdit}>
              แก้ไขแผน
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="รายละเอียดแผน" />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-6 md:grid-cols-2 xl:grid-cols-4">
          <Item label="ชื่อแผน">{plan.name}</Item>
          <Item label="ประจำปีงบประมาณ">{plan.fiscalYear}</Item>
          <Item label="วงเงินงบประมาณ (บาท)">{currency(plan.budget)}</Item>
          {/* จำนวน = ยานพาหนะในแผน (จอ B.7/E.1/E.8 เป็นค่าคงที่ "0 คัน" แม้มี PO แล้ว — ไม่ใช้เป็นสูตร) */}
          <Item label="จำนวนยานพาหนะที่ Overhaul">{`${plan.vehicles.length} คัน`}</Item>
          <Item label="วันที่สร้าง">{plan.createdAt}</Item>
          {/* เจ้าของงานเคาะ 16 พ.ย. 2569: ช่องงบประมาณตามประเภทงบ แบบ AC-S1 + UAT (ไม่ใช้ "เลข WBS (ศูนย์ต้นทุน)" รวมช่องของจอ B.7/G.1)
              ประเภทงบประมาณ แล้วตามด้วยช่องของประเภทนั้น (ป้ายเดียวกับฟอร์ม B.3.2–B.3.6) — แสดงเฉพาะช่องที่มีค่า */}
          <Item label="ประเภทงบประมาณ">{plan.budgetType || "-"}</Item>
          {plan.costCenter && <Item label="ศูนย์ต้นทุน">{plan.costCenter}</Item>}
          {plan.wbs && <Item label="เลข WBS">{plan.wbs}</Item>}
          {plan.network && <Item label="เลขโครงข่าย">{plan.network}</Item>}
          {plan.activity && <Item label="เลขกิจกรรม">{plan.activity}</Item>}
          {plan.orderNo && <Item label="เลขที่ใบสั่ง">{plan.orderNo}</Item>}
          {plan.budgetNote && <Item label="หมายเหตุ">{plan.budgetNote}</Item>}
        </dl>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="เอกสาร" />
        {/* UAT: กล่องเทา หัวกลุ่มแล้วการ์ดไฟล์เต็มความกว้าง เรียงซ้อน · "เอกสารอื่น ๆ" แสดงเมื่อมีไฟล์ (UAT ไม่มีกลุ่มนี้) */}
        <div className="flex flex-col gap-6 rounded-lg bg-gray-50 p-6 max-md:p-4">
          {DOC_GROUPS.filter(([k]) => k !== "other" || plan.docs.other.length > 0).map(([k, label]) => (
            <div key={k} className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-black">{label}</h3>
              {plan.docs[k].length ? (
                <ul className="flex flex-col gap-2">{plan.docs[k].map((f) => <FileRow key={f.name} file={f} />)}</ul>
              ) : (
                <span className="text-sm text-gray-600">ไม่มีไฟล์</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* เจ้าของงาน 16 พ.ย. 2569: กดเข้ามาดูแผนต้องเห็นยานพาหนะในแผนเสมอ (เดิมซ่อนเมื่อมี PO ตาม UAT/G.1) */}
      {(
        <section className="flex flex-col gap-5">
          <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title={`ยานพาหนะในแผน (${plan.vehicles.length} คัน)`} />
          {/* EC-46 แผนมียานพาหนะเสมอ (เจ้าของงานเคาะ 16 พ.ย. 2569) — ไม่มี Empty state "ยังไม่มียานพาหนะในแผน" แล้ว */}
            <VehicleTable
              rows={plan.vehicles}
              label="ยานพาหนะในแผน"
              hideProgress /* เจ้าของงาน 16 พ.ย. 2569 */
              action={(v) => (
                <RowMenu
                  label={`จัดการ ${v.plate}`}
                  items={[
                    { label: "ดูข้อมูลยานพาหนะ", icon: "quick_reference_all", onSelect: () => onOpenVehicle(v.plate, "info") },
                    { label: "ดูข้อมูลการซ่อม", icon: "build", onSelect: () => onOpenVehicle(v.plate, "repair") },
                    { label: "ระบุราคา", icon: "payments", onSelect: () => setPriceFor(v) },
                    /* v2 EC-56: เบิกอะไหล่ของคันนี้ (ก่อนทำ Purchase Order ได้) · ซ่อมสำเร็จแล้วปิด */
                    { label: "เบิกอะไหล่", icon: "inventory_2", disabled: !reqVehicles.find((x) => x.plate === v.plate)?.editable, onSelect: () => setReqFor(v.plate) },
                  ]}
                />
              )}
            />
        </section>
      )}

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) · UAT ไม่มีจำนวนในหัว */ title="Purchase Order" />
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
          <>
            <POList pos={pos} jobs={jobs} garages={garages} onOpen={onOpenPO} onEdit={onEditPO} onDelete={onDeletePO} />
            {/* UAT: ปุ่มเพิ่มอยู่ใต้ตาราง ชิดซ้าย (Secondary lg) แทน Tertiary brand ที่หัว section ของจอ F.1.1 */}
            <div>
              <Button variant="secondary" size="lg" iconLeft="add" onClick={onAddPO}>
                เพิ่ม Purchase Order
              </Button>
            </div>
          </>
        )}
      </section>

      {/* E.1 "อะไหล่ที่ใช้" — v2 EC-56 (23 พ.ย. 2569): ลูกค้าเบิกอะไหล่รายคัน ไม่ใช่ระดับแผน → ตารางสรุปยอดเบิกของแต่ละคัน (อ่านอย่างเดียว)
          เบิกได้ที่หน้างานรายคันขั้น 1–3 · เดิมเป็น empty state + ปุ่ม "เบิกอะไหล่" ที่ยังไม่อยู่ในขอบเขต · UAT: empty state อยู่ในกล่องเทา */}
      <PartsRequisition
        title="อะไหล่ที่ใช้"
        vehicles={reqVehicles}
        label={(actions) => <SectionLabel title={<span className="flex items-center gap-2">อะไหล่ที่ใช้ <Pill tone="purple">v2 · รอยืนยัน</Pill></span>} description="เบิกอะไหล่รายคันได้ตั้งแต่ก่อนทำ Purchase Order จนกว่าจะกดซ่อมสำเร็จ · ระหว่างซ่อมเบิกเพิ่มได้ที่หน้างานรายคันขั้น 3" actions={actions} />}
        onAdd={addReq}
        onCancel={cancelReq}
        onQty={setPartQty}
        onCancelPart={cancelPart}
        emptyText="เบิกอะไหล่ให้ยานพาหนะในแผนได้ตั้งแต่ก่อนทำ Purchase Order"
      />
      {reqFor && <AddRequisition vehicles={reqVehicles.filter((v) => v.editable)} pickVehicle initialPlate={reqFor} onClose={() => setReqFor(null)} onAdd={addReq} />}
      <PriceModal
        vehicle={priceFor}
        onClose={() => setPriceFor(null)}
        onSave={(pr) => {
          if (priceFor) onSavePrice(priceFor.plate, pr);
          setPriceFor(null);
        }}
      />
    </div>
  );
}

/** อะไหล่ที่ใช้ของแผน (v2 EC-56) — จุดเบิกหลัก: ทุกคันในแผน แม้ยังไม่มี Purchase Order (เจ้าของงาน 23 พ.ย. 2569 "ควรเบิกก่อนทำ PO ได้") */
export function planReqVehicles(plan: Plan, pos: PurchaseOrder[], jobs: VehicleJob[]): ReqVehicle[] {
  return plan.vehicles.map((v) => {
    const job = jobs.find((j) => j.plate === v.plate && pos.some((p) => p.id === j.poId));
    return { plate: v.plate, sub: job ? job.poId : "ยังไม่มี Purchase Order", model: `${v.make} ${v.model}`, type: v.type, editable: canRequisition(job?.code), reqs: requisitionsOf(v.requisitions, job?.code) };
  });
}
