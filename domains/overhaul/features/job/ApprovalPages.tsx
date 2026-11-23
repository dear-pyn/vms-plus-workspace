"use client";
/** ฝั่งผู้อนุมัติปิดงาน — เจ้าของงาน 17 พ.ย. 2569 "หน้าอนุมัติ ทำเป็นเมนูใหม่ คล้ายๆ ตอบรับนัดหมาย"
 *  - เมนู "อนุมัติปิดงาน" ใต้ Overhaul = รายการรายคันที่ส่งอนุมัติมาถึงผู้อนุมัติคนนี้ (V10.3)
 *  - กดแถว → หน้ายานพาหนะรายคันแบบดูอย่างเดียว (หน้าเดียวกับ กบค.) แสดงเฉพาะสรุปปิดงาน (ขั้น 7)
 *    เจ้าของงาน 19 พ.ย. 2569: ไม่มี Progress steps — ไม่ใช่หน้าจัดการรถของ Overhaul (แบบเดียวกับมุมหน่วยงาน 16 พ.ย. 2569)
 *    ปุ่มขวาบน "ส่งกลับแก้ไข" (Tertiary danger · ghost ตามแบบปฏิเสธนัดหมาย) / "อนุมัติปิดงาน" (อนุมัติทันที ไม่มี modal ยืนยัน · กติกา submit 17 พ.ย. 2569)
 *  - ส่งกลับแก้ไข → Modal ใส่เหตุผล (บังคับ เพราะ กบค. ต้องรู้ว่าแก้อะไร) → กลับ V10.2 + Alert เหตุผลที่ขั้น 7
 *  ออกแบบตามแพทเทิร์นหน้า "ตอบรับนัดหมาย" (AgencyPages) — จอ Figma ฝั่งผู้อนุมัติยังไม่มี (Scene U เดิมถูกตัดไป 9/11) รอทีมออกแบบ
 *  component: Page header (actions) · Select (ผู้ใช้งานต้นแบบ) · Table + Pill · Empty state · Modal Form + Text area · Tertiary danger / Primary button lg */
import { useState, type ReactNode } from "react";
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { JOB_STATUS, type Staff } from "../po/types";
import type { AgencyItem } from "./AgencyPages";
import { JobPage } from "./JobPage";
import { usePrototypeFill } from "../../prototype/MockTools";

export type ApprovalDecision = { approved: true } | { approved: false; reason: string };

/** รอผู้อนุมัติคนนี้ตัดสิน */
export const awaitingApproval = (x: AgencyItem, approverId: string) => x.job.code === "V10.3" && x.job.close?.approval?.approverId === approverId;

/** เมนู "อนุมัติปิดงาน" — รายการรายคันที่รออนุมัติ */
/** เจ้าของงาน 23 พ.ย. 2569 "รวมได้ แบ่งเป็นประเภท": เมนู "อนุมัติงาน" ใช้ร่วมกับงานซ่อม (เดิม "อนุมัติปิดงาน") — tabs/alt แบบเดียวกับ AgencyList */
export function ApprovalList({ items, staff, me, onOpen, tabs, alt }: { items: AgencyItem[]; staff: Staff[]; /** ผู้อนุมัติที่ login — ต้นแบบเลือกจาก header (prototypeBar) */ me: string; onOpen: (po: string, plate: string) => void; tabs?: ReactNode; alt?: ReactNode }) {
  const mine = items.filter((x) => awaitingApproval(x, me));
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader crumbs={[{ label: "อนุมัติงาน" }]} title="อนุมัติงาน" /* subtitle เอาออก: ซ้ำชื่อหน้า (เจ้าของงาน 18 พ.ย. 2569) */ />
      {tabs}
      {alt ?? <section className="flex flex-col gap-4">
        <SectionHeader title={`รออนุมัติปิดงาน (${mine.length})`} />
        {mine.length === 0 ? (
          <EmptyState kind="data-empty" title="ไม่มีงานที่รออนุมัติ" description="เมื่อ กบค. ส่งอนุมัติปิดงานมาถึงคุณ รายการจะแสดงที่นี่" />
        ) : (
          <DataTable label="รออนุมัติปิดงาน" striped>
            <thead>
              <tr>
                <Th>ทะเบียน</Th>
                <Th>ยี่ห้อ/รุ่น · ประเภท</Th>
                <Th>แผน / Purchase Order</Th>
                <Th>ศูนย์บริการ/อู่</Th>
                <Th>ส่งเมื่อ</Th>
                <Th>สถานะ</Th>
                <Th className="w-16"><span className="sr-only">อนุมัติปิดงาน</span></Th>
              </tr>
            </thead>
            <tbody>
              {mine.map(({ job, po, plan, vehicle, garage }) => (
                <tr key={`${po.id}-${job.plate}`} className="cursor-pointer hover:bg-gray-100" onClick={() => onOpen(po.id, job.plate)}>
                  <Td className="font-semibold">{job.plate}</Td>
                  <Td><CellStack main={vehicle ? `${vehicle.make} ${vehicle.model}` : "—"} sub={vehicle?.type} /></Td>
                  <Td><CellStack main={plan.id} sub={po.id} /></Td>
                  <Td className="whitespace-normal">{garage?.name ?? "—"}</Td>
                  <Td>{job.close?.approval?.sentAt ?? "—"}</Td>
                  <Td><Pill tone={JOB_STATUS[job.code].tone}>{JOB_STATUS[job.code].label}</Pill></Td>
                  <Td><Button variant="tertiary" iconOnly="keyboard_arrow_right" aria-label={`อนุมัติปิดงาน ${job.plate}`} onClick={() => onOpen(po.id, job.plate)} /></Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>}
    </div>
  );
}

/** หน้ายานพาหนะรายคัน (มุมผู้อนุมัติ) + ปุ่มอนุมัติ/ส่งกลับแก้ไข */
export function ApprovalReview({ item, staff, me, onBack, onDecide, onNotify }: { item: AgencyItem; staff: Staff[]; me: string; onBack: () => void; onDecide: (d: ApprovalDecision) => Promise<boolean>; onNotify: (msg: string, tone?: "success" | "error" | "info" | "warning", description?: string) => void }) {
  const { job, po, plan, vehicle, garage } = item;
  const [ask, setAsk] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = awaitingApproval(item, me);
  /* ปุ่ม Mock: ครบ = เหตุผลตัวอย่าง · ไม่ครบ = ว่าง · บันทึกไม่สำเร็จ = มีคำว่า error */
  usePrototypeFill((mode) => {
    setErr("");
    setReason(mode === "missing" ? "" : mode === "error" ? "error" : "ราคาอะไหล่ชุดไฮดรอลิกสูงกว่าใบเสนอราคา กรุณาตรวจสอบและแนบเอกสารเพิ่ม");
  }, ask && !busy);

  async function send(d: ApprovalDecision) {
    if (busy) return;
    setBusy(true);
    try {
      if (await onDecide(d)) setAsk(false);
    } finally { setBusy(false); }
  }

  return (
    <>
      <JobPage
        viewOnly
        hideSteps
        plan={plan}
        po={po}
        job={job}
        vehicle={vehicle}
        garage={garage}
        staff={staff}
        crumbs={[{ label: "อนุมัติปิดงาน", onClick: onBack }, { label: job.plate }]}
        onGoPlans={onBack}
        onGoPlan={onBack}
        onGoPO={onBack}
        onUpdate={() => undefined}
        onNotify={onNotify}
        onOpenApproval={() => undefined}
        actions={
          pending && (
            <>
              <Button variant="tertiaryDanger" size="lg" disabled={busy} onClick={() => { setReason(""); setErr(""); setAsk(true); }}>
                ส่งกลับแก้ไข
              </Button>
              <Button size="lg" loading={busy && !ask} onClick={() => void send({ approved: true })}>
                อนุมัติปิดงาน
              </Button>
            </>
          )
        }
      />
      <Modal
        open={ask}
        title="ส่งกลับแก้ไข"
        description="แจ้งเหตุผลให้ กบค. แก้ไขแล้วส่งอนุมัติใหม่"
        confirmLabel="ส่งกลับแก้ไข"
        confirmVariant="danger"
        confirmLoading={busy}
        onClose={() => !busy && setAsk(false)}
        onConfirm={() => {
          if (!reason.trim()) return setErr("กรุณาระบุเหตุผลที่ส่งกลับแก้ไข");
          void send({ approved: false, reason: reason.trim() });
        }}
      >
        <TextArea label="เหตุผลที่ส่งกลับแก้ไข" placeholder="ระบุเหตุผล" value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} error={err || undefined} />
      </Modal>
    </>
  );
}
