"use client";
/** แท็บ "กระบวนการซ่อม" — 7 ขั้น (UAT 20 พ.ย. 2569)
 *  1 เบิกอะไหล่ · 2 นัดหมายวันซ่อม · 3 ตรวจสภาพก่อนซ่อม · 4 ดำเนินการซ่อม · 5 นัดหมายวันคืนรถ · 6 ตรวจสภาพหลังซ่อม · 7 รายงานปิดงาน
 *  ขั้นที่ผ่านแล้วกดดูย้อนหลังได้ (อ่านอย่างเดียว) · ขั้นปัจจุบันแก้ได้เมื่อ role ทำงานนี้ได้
 *  observed: ฟอร์มขั้น 3–7 · ขั้น 1–2 แบบอ่าน (ล็อกแล้ว) · หน้ารอ "รอตอบกลับจากหน่วยงาน" ขั้น 5
 *  added (ต้นแบบเติม): ขั้น 1–2 แบบแก้ไข · ต้นทางขอเปลี่ยนนัด · อนุมัติอาการเพิ่ม · ไม่อนุมัติปิดงาน */
import { useState, type ReactNode } from "react";
import { currency } from "@rules/currency.mjs";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { EmptyState } from "@ui/EmptyState";
import { Icon } from "@ui/Icon";
import { Modal } from "@ui/Modal";
import { NumberInput } from "@ui/NumberInput";
import { Radio } from "@ui/Radio";
import { RadioCard } from "@ui/RadioCard";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import { InfoTooltip } from "@ui/Tooltip";
import { cx } from "@ui/cx";
import { CLOSE_DOCS, INSPECT_ITEMS, INTAKE_DOCS, partOf, personOf, vehicleOf, type StatusCode } from "../mock/data";
import { DateRangeField } from "@ui/DateField";
import { nowBE, num, type Appointment, type DocCheck, type Notice, type RepairJob, type Role } from "./model";
import { PartsPicker } from "./parts";
import { GridRow, GridTable, InfoPanel, PersonPicker, SectionBar, SignBlock } from "./ui";

export type Notify = { to: Role; text: string; tone?: Notice["tone"] };
export type Act = (patch: Partial<RepairJob>, o?: { status?: StatusCode; log?: string; note?: string; toast?: string; notify?: Notify[] }) => void;
interface StepProps { job: RepairJob; edit: boolean; act: Act; role: Role }

const HQ = "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9";
export const Footer = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>;

/* ---------------- 1 เบิกอะไหล่ (UAT: ล็อกเสมอ) ---------------- */
export function StepParts({ job }: StepProps) {
  const locked = !!job.parts?.locked;
  return <PartsPicker readOnly lines={job.parts?.lines ?? []} footer={locked ? <p className="pt-2 text-xs text-gray-600">สถานะใบเบิก: รอสั่งซื้อ/เบิก (PENDING_ORDER)</p> : undefined} lockedText={locked ? undefined : "ยังไม่ได้เบิกอะไหล่"} />;
}

/* ---------------- ฟอร์มนัดหมาย (ขั้น 2 และ 5) ---------------- */
function ApptForm({ value, onChange, readOnly, kind }: { value: Appointment; onChange: (a: Appointment) => void; readOnly: boolean; kind: "repair" | "return" }) {
  const mech = personOf(value.mechanicId);
  return (
    <div className="flex flex-col gap-6">
      {kind === "repair" && (
        <section className="flex flex-col gap-4">
          <SectionBar>รูปแบบการซ่อม</SectionBar>
          <div className={cx("grid grid-cols-1 gap-4 md:grid-cols-2 lg:w-[672px]", readOnly && "pointer-events-none")}>
            <RadioCard name="appt-kind" checked={value.kind === "at_med"} onChange={() => onChange({ ...value, kind: "at_med", place: value.place || HQ })} title="เข้าซ่อมที่ กบค." description="นัดเข้ามาซ่อมที่สำนักงานใหญ่" />
            <RadioCard name="appt-kind" checked={value.kind === "onsite"} onChange={() => onChange({ ...value, kind: "onsite", place: "" })} title="จัดซ่อมที่หน้างาน" description="กบค. เดินทางไปซ่อม" />
          </div>
        </section>
      )}
      <section className="flex flex-col gap-4">
        <SectionBar>รายละเอียดการนัดหมาย</SectionBar>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-black">{kind === "repair" ? "ช่วงเวลาที่รับมอบรถ" : "ช่วงเวลาวันนัดคืนรถ"}</span>
            <DateRangeField aria-label="ช่วงวันที่" from={value.from} to={value.to} readOnly={readOnly} onChange={(from, to) => onChange({ ...value, from, to })} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-black">ช่างซ่อม</span>
            <PersonPicker value={value.mechanicId} onChange={(id) => onChange({ ...value, mechanicId: id })} disabled={readOnly} ids={["p4", "p5", "p1"]} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-black">เบอร์โทรศัพท์ผู้รับมอบรถ</span>
            <TextField aria-label="เบอร์โทรศัพท์ผู้รับมอบรถ" autoFilled value={mech?.phone ?? ""} placeholder="ระบุเบอร์โทรศัพท์ผู้รับมอบรถ" />
          </div>
        </div>
        <TextArea label={kind === "repair" ? (value.kind === "onsite" ? "สถานที่ซ่อม" : "สถานที่รับรถ") : "สถานที่นัดคืนรถ"} rows={5} readOnly={readOnly} value={value.place} onChange={(e) => onChange({ ...value, place: e.target.value })} placeholder="ระบุสถานที่" />
      </section>
    </div>
  );
}

/** หน้ารอหน่วยงานตอบ (UAT ขั้น 5: ภาพว่าง + "รอตอบกลับจากหน่วยงาน" + แก้ไขนัดหมาย + ต้นทางยืนยัน — กบค. กดแทนหน่วยงาน) */
function WaitingReply({ onEdit, onConfirm, appt }: { onEdit: () => void; onConfirm: () => void; appt: Appointment }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <EmptyState kind="data-empty" title="รอตอบกลับจากหน่วยงาน" description={`นัดหมาย ${appt.from}${appt.to && appt.to !== appt.from ? ` - ${appt.to}` : ""} · ${appt.place}`} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={onEdit}>แก้ไขนัดหมาย</Button>
        <Button onClick={onConfirm}>ต้นทางยืนยัน</Button>
      </div>
    </div>
  );
}

/* ---------------- 2 นัดหมายวันซ่อม (UAT: ล็อก · อ่านอย่างเดียว) ---------------- */
export function StepAppointment({ job }: StepProps) {
  return <ApptForm kind="repair" value={job.appt ?? { kind: "at_med", from: "", to: "", mechanicId: "", place: "" }} onChange={() => {}} readOnly />;
}

/* ---------------- ข้อมูลยานพาหนะ (ขั้น 3 และ 6) ---------------- */
export function VehiclePanel({ job, mileage }: { job: RepairJob; mileage?: boolean }) {
  const v = vehicleOf(job.plate);
  return (
    <section className="flex flex-col gap-4">
      <SectionBar>ข้อมูลยานพาหนะ</SectionBar>
      <InfoPanel
        cols={4}
        items={[
          ["ยี่ห้อรถยนต์", v.brand], ["รุ่น", v.model], ["หมายเลข (S/N)", "-"], ["ทะเบียน", `${v.plate} ${v.provinceShort}`],
          ["รหัสรถ", "-"], ["ยี่ห้อกระเช้า", "-"], ["รุ่นกระเช้า", "-"], ["หมายเลข HC", "-"],
          ["ชั่วโมงการทำงานเครื่องจักรสะสม", v.hours ? num(v.hours) : "-"], ["เลขไมล์สะสม", mileage === false ? "-" : num(v.mileage)], ["ใช้งาน ณ สถานที่", "-"],
        ]}
      />
    </section>
  );
}

/** ตาราง "รายละเอียดการตรวจสภาพก่อน/หลังซ่อม" 24 ข้อ (ปกติ / ต้องแก้ไข / หมายเหตุ — หมายเหตุเปิดเมื่อ ต้องแก้ไข) */
function InspectTable({ title, check, notes, onChange, readOnly }: { title: string; check: Record<number, "ok" | "fix">; notes: Record<number, string>; onChange: (c: Record<number, "ok" | "fix">, n: Record<number, string>) => void; readOnly: boolean }) {
  const cols = "2fr 1fr 1fr 2fr";
  return (
    <section className="flex flex-col gap-4">
      <SectionBar>{title}</SectionBar>
      <GridTable cols={cols} head={["รายการ", { node: <span className="-mb-1 block border-b border-gray-200 pb-2">การตรวจสอบสภาพซ่อมจากสาเหตุส่งซ่อม</span>, span: 3 }]}>
        <GridRow cols={cols}>
          <span />
          <span className="px-1 text-sm">ปกติ</span>
          <span className="px-1 text-sm">ต้องแก้ไข</span>
          <span className="px-1 text-sm">หมายเหตุ</span>
        </GridRow>
        {INSPECT_ITEMS.map((it, i) => (
          <GridRow key={it} cols={cols}>
            <span className="px-1">{i + 1}. {it}</span>
            <span className="px-1"><Radio name={`${title}-${i}`} label={`ปกติ ${it}`} checked={check[i] === "ok"} disabled={readOnly} onChange={() => onChange({ ...check, [i]: "ok" }, { ...notes, [i]: "" })} /></span>
            <span className="px-1"><Radio name={`${title}-${i}`} label={`ต้องซ่อม ${it}`} checked={check[i] === "fix"} disabled={readOnly} onChange={() => onChange({ ...check, [i]: "fix" }, notes)} /></span>
            <TextField aria-label={`หมายเหตุ ${it}`} placeholder="ระบุหมายเหตุ" autoFilled={readOnly || check[i] !== "fix"} value={notes[i] ?? ""} onChange={(e) => onChange(check, { ...notes, [i]: e.target.value })} />
          </GridRow>
        ))}
      </GridTable>
    </section>
  );
}

/* ---------------- 3 ตรวจสภาพก่อนซ่อม ---------------- */
type Intake = NonNullable<RepairJob["intake"]>;
export function StepIntake({ job, edit, act }: StepProps) {
  const [s, setS] = useState<Intake>(job.intake ?? { docs: {}, signed: [false, false], check: {}, notes: {} });
  const ro = !edit || !!job.intake?.confirmed;
  const setDoc = (i: number, p: DocCheck) => setS({ ...s, docs: { ...s.docs, [i]: { ...s.docs[i], ...p } } });
  const ok = INTAKE_DOCS.every((_, i) => s.docs[i]?.v) && s.signed[0] && s.signed[1] && INSPECT_ITEMS.every((_, i) => s.check[i]);
  const cols = "2.4fr 0.8fr 0.8fr 0.9fr 0.9fr 2fr";
  return (
    <div className="flex flex-col gap-8">
      <VehiclePanel job={job} />
      <section className="flex flex-col gap-4">
        <SectionBar>รายการเอกสารรับรถ</SectionBar>
        <GridTable cols={cols} head={["รายการ", "มี", "ไม่มี", "ชำรุด", "ผิดรุ่น", "หมายเหตุ"]}>
          {INTAKE_DOCS.map((d, i) => {
            const r = s.docs[i] ?? {};
            return (
              <GridRow key={d} cols={cols}>
                <span className="flex flex-wrap items-center gap-2 px-1">
                  {i + 1}. {d}
                  {i === 4 && (
                    <>
                      <TextField aria-label="ยี่ห้อแบตเตอรี่" className="w-20" placeholder="ระบุยี่ห้อ" readOnly={ro} value={s.battery?.brand ?? ""} onChange={(e) => setS({ ...s, battery: { brand: e.target.value, qty: s.battery?.qty ?? "" } })} />
                      จำนวน
                      <TextField aria-label="จำนวนแบตเตอรี่" className="w-24" placeholder="ระบุจำนวน" inputMode="numeric" readOnly={ro} value={s.battery?.qty ?? ""} onChange={(e) => setS({ ...s, battery: { brand: s.battery?.brand ?? "", qty: e.target.value.replace(/\D/g, "") } })} />
                      ลูก
                    </>
                  )}
                </span>
                <span className="px-1"><Radio name={`doc-${i}`} label={`มี ${d}`} checked={r.v === "have"} disabled={ro} onChange={() => setDoc(i, { v: "have" })} /></span>
                <span className="px-1"><Radio name={`doc-${i}`} label={`ไม่มี ${d}`} checked={r.v === "none"} disabled={ro} onChange={() => setDoc(i, { v: "none", broken: false, wrong: false })} /></span>
                <span className="px-1"><Checkbox label={`ชำรุด ${d}`} checked={!!r.broken} disabled={ro || r.v !== "have"} onChange={(b) => setDoc(i, { broken: b })} /></span>
                <span className="px-1"><Checkbox label={`ผิดรุ่น ${d}`} checked={!!r.wrong} disabled={ro || r.v !== "have"} onChange={(b) => setDoc(i, { wrong: b })} /></span>
                <TextField aria-label={`หมายเหตุ ${d}`} placeholder="ระบุหมายเหตุ" readOnly={ro} value={r.note ?? ""} onChange={(e) => setDoc(i, { note: e.target.value })} />
              </GridRow>
            );
          })}
        </GridTable>
      </section>
      <SignBlock
        title="ลงนามการรับมอบรถ"
        readOnly={ro}
        left={{ label: "ผู้ส่งมอบรถ", placeholder: "เลือกผู้ส่งมอบรถ", value: s.delivererId, onChange: (v) => setS({ ...s, delivererId: v }), signed: s.signed[0], onSign: () => setS({ ...s, signed: [true, s.signed[1]] }) }}
        right={{ label: "ผู้รับมอบ (กบค.)", placeholder: "เลือกผู้รับมอบ (กบค.)", value: s.receiverId, onChange: (v) => setS({ ...s, receiverId: v }), signed: s.signed[1], onSign: () => setS({ ...s, signed: [s.signed[0], true] }) }}
      />
      <InspectTable title="รายละเอียดการตรวจสภาพก่อนซ่อม" check={s.check} notes={s.notes} readOnly={ro} onChange={(check, notes) => setS({ ...s, check, notes })} />
      {!ro && (
        <Footer>
          <Button disabled={!ok} onClick={() => act({ intake: { ...s, confirmed: true } }, { status: "repair_in_progress", log: "ยืนยันการตรวจสภาพก่อนซ่อม", toast: "ยืนยันการตรวจสภาพสำเร็จ" })}>ยืนยันการตรวจสภาพ</Button>
        </Footer>
      )}
    </div>
  );
}

/* ---------------- 4 ดำเนินการซ่อม ---------------- */
type Work = NonNullable<RepairJob["work"]>;
export function StepWork({ job, edit, act, role }: StepProps) {
  const prev = job.work;
  const fresh = !prev || prev.extraResult !== undefined; // อนุมัติ/ไม่อนุมัติอาการเพิ่มแล้ว → เลือกใหม่ได้
  const [w, setW] = useState<Work>(fresh && edit && !prev?.done ? { extraParts: [], extra: undefined } : prev ?? { extraParts: [] });
  const [ask, setAsk] = useState(false);
  const [approver, setApprover] = useState("");
  const ro = !edit || job.status !== "repair_in_progress";

  /* UAT: มีสถานะ "เจออาการเพิ่ม" แต่ไม่มีหน้าพิจารณา → แสดงผลที่บันทึกไว้อย่างเดียว */
  if (job.status === "found_additional_symptoms") return <WorkRead w={prev!} />;

  if (ro) return <WorkRead w={prev ?? { extraParts: [] }} />;
  const canDone = w.extra === false;
  const canExtra = w.extra === true && !!w.extraText?.trim() && w.withdraw !== undefined && (!w.withdraw || w.extraParts.length > 0);
  return (
    <div className="flex flex-col gap-6">
      {prev?.extraResult && (
        <Alert tone={prev.extraResult === "approved" ? "success" : "warning"} title={prev.extraResult === "approved" ? "หัวหน้า กบค. อนุมัติอาการเพิ่มแล้ว" : "หัวหน้า กบค. ไม่อนุมัติอาการเพิ่ม"}>
          {prev.extraText}{prev.extraReason ? ` · เหตุผล: ${prev.extraReason}` : ""}
        </Alert>
      )}
      <section className="flex flex-col gap-4">
        <SectionBar>ผลการตรวจสอบอาการเพิ่มเติม</SectionBar>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:w-[672px]">
          <RadioCard name="extra" checked={w.extra === false} onChange={() => setW({ extraParts: [], extra: false })} title="ไม่พบอาการเพิ่ม" />
          <RadioCard name="extra" checked={w.extra === true} onChange={() => setW({ ...w, extra: true })} title="พบอาการเพิ่ม" />
        </div>
      </section>
      {w.extra && (
        <>
          <section className="flex flex-col gap-4">
            <SectionBar>ข้อมูลอาการที่พบ</SectionBar>
            <TextArea label="อาการที่พบ" rows={4} placeholder="ระบุอาการที่พบ" value={w.extraText ?? ""} onChange={(e) => setW({ ...w, extraText: e.target.value })} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:w-[672px]">
              <RadioCard name="withdraw" checked={w.withdraw === false} onChange={() => setW({ ...w, withdraw: false, extraParts: [] })} title="ไม่เบิกอะไหล่" />
              <RadioCard name="withdraw" checked={w.withdraw === true} onChange={() => setW({ ...w, withdraw: true })} title="เบิกอะไหล่" />
            </div>
          </section>
          {w.withdraw && (
            <section className="flex flex-col gap-4">
              <SectionBar>อะไหล่ที่ต้องใช้</SectionBar>
              <PartsPicker lines={w.extraParts} onChange={(l) => setW({ ...w, extraParts: l })} />
            </section>
          )}
        </>
      )}
      <Footer>
        {w.extra ? (
          <Button disabled={!canExtra} onClick={() => setAsk(true)}>บันทึกอาการเพิ่ม</Button>
        ) : (
          <Button disabled={!canDone} onClick={() => act({ work: { ...w, done: true } }, { status: "repair_finished", log: "ซ่อมเสร็จสิ้น", toast: "บันทึกซ่อมเสร็จสิ้นสำเร็จ" })}>ซ่อมเสร็จสิ้น</Button>
        )}
      </Footer>
      {/* UAT มีกล่องนี้ซ่อนอยู่ในหน้าขั้น 4 (ผู้อนุมัติ · ปิด / ส่งอนุมัติ) */}
      <Modal open={ask} onClose={() => setAsk(false)} title="ส่งอนุมัติเพื่อเปิดงานซ่อม" cancelLabel="ปิด" confirmLabel="ส่งอนุมัติ" confirmDisabled={!approver} onConfirm={() => { setAsk(false); act({ work: { ...w, extraResult: undefined, extraReason: undefined }, approverId: approver }, { status: "found_additional_symptoms", log: "บันทึกอาการเพิ่ม · ส่งอนุมัติ", note: w.extraText, toast: "ส่งอนุมัติสำเร็จ", notify: [{ to: "medHead", text: `${job.no} พบอาการเพิ่ม รออนุมัติ`, tone: "warning" }] }); }}>
        <PersonPicker label="ผู้อนุมัติ" value={approver} onChange={setApprover} ids={["p7", "p3"]} />
      </Modal>
    </div>
  );
}
function WorkRead({ w }: { w: Work }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <SectionBar>ผลการตรวจสอบอาการเพิ่มเติม</SectionBar>
        <div className="pointer-events-none grid grid-cols-1 gap-4 md:grid-cols-2 lg:w-[672px]">
          <RadioCard name="extra-r" checked={w.extra === false} onChange={() => {}} title="ไม่พบอาการเพิ่ม" />
          <RadioCard name="extra-r" checked={w.extra === true} onChange={() => {}} title="พบอาการเพิ่ม" />
        </div>
      </section>
      {w.extra && (
        <section className="flex flex-col gap-4">
          <SectionBar>ข้อมูลอาการที่พบ</SectionBar>
          <TextArea label="อาการที่พบ" rows={3} readOnly value={w.extraText ?? ""} />
          {w.extraParts.length > 0 && <PartsPicker readOnly lines={w.extraParts} lockedText="อะไหล่ที่ขอเบิกเพิ่ม" />}
        </section>
      )}
    </div>
  );
}

/* ---------------- 5 นัดหมายวันคืนรถ ---------------- */
export function StepReturn({ job, edit, act, role }: StepProps) {
  const [a, setA] = useState<Appointment>(job.status === "waiting_med_reschedule_return" ? { ...job.returnAppt!, from: "", to: "" } : job.returnAppt ?? { kind: "at_med", from: "", to: "", mechanicId: "", place: HQ });
  const [editing, setEditing] = useState(false);
  if (edit && job.status === "waiting_origin_confirm_pickup" && !editing)
    return (
      <WaitingReply
        appt={job.returnAppt!}
        onEdit={() => setEditing(true)}
        onConfirm={() => act({ returnAppt: { ...job.returnAppt!, reply: { ok: true, at: nowBE() } } }, { status: "waiting_med_post_repair_inspection", log: "ต้นทางยืนยันรับรถ (กบค. กดแทน)", toast: "ยืนยันนัดหมายสำเร็จ" })}
      />
    );
  const can = edit && (job.status === "repair_finished" || job.status === "waiting_med_reschedule_return" || editing);
  const ok = !!a.from && !!a.mechanicId && !!a.place.trim();
  return (
    <div className="flex flex-col gap-6">
      <ApptForm kind="return" value={a} onChange={setA} readOnly={!can} />
      {can && (
        <Footer>
          {editing && <Button variant="secondary" onClick={() => setEditing(false)}>ยกเลิก</Button>}
          <Button disabled={!ok} onClick={() => { setEditing(false); act({ returnAppt: { ...a, sentAt: nowBE(), reply: undefined } }, { status: "waiting_origin_confirm_pickup", log: "ส่งนัดหมายวันคืนรถ", toast: "ส่งนัดหมายสำเร็จ", notify: [{ to: "origin", text: `นัดหมายวันคืนรถ ${job.no} รอการตอบรับ`, tone: "warning" }] }); }}>ส่งนัดหมาย</Button>
        </Footer>
      )}
    </div>
  );
}

/* ---------------- 6 ตรวจสภาพหลังซ่อม ---------------- */
type Post = NonNullable<RepairJob["post"]>;
export function StepPost({ job, edit, act }: StepProps) {
  const lines = job.parts?.lines ?? [];
  const [s, setS] = useState<Post>(job.post ?? { mileage: "", hours: "", check: {}, notes: {}, signed: [false, false], used: Object.fromEntries(lines.map((l) => [l.partId, l.qty])) });
  const ro = !edit || !!job.post?.confirmed;
  const ok = !!s.mileage && INSPECT_ITEMS.every((_, i) => s.check[i]) && s.signed[0] && s.signed[1] && !!s.score;
  return (
    <div className="flex flex-col gap-8">
      <VehiclePanel job={job} mileage={false} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField label="เลขไมล์ปัจจุบัน" inputMode="numeric" placeholder="ระบุเลขไมล์" readOnly={ro} value={s.mileage} onChange={(e) => setS({ ...s, mileage: e.target.value.replace(/\D/g, "") })} />
        <TextField label="ชั่วโมงการทำงานเครื่องจักรปัจจุบัน" inputMode="numeric" placeholder="ระบุชั่วโมงการทำงานเครื่องจักรปัจจุบัน" readOnly={ro} value={s.hours} onChange={(e) => setS({ ...s, hours: e.target.value.replace(/\D/g, "") })} />
      </div>
      <InspectTable title="รายละเอียดการตรวจสภาพหลังซ่อม" check={s.check} notes={s.notes} readOnly={ro} onChange={(check, notes) => setS({ ...s, check, notes })} />
      <SignBlock
        title="ลงนามการส่งคืนรถ"
        readOnly={ro}
        left={{ label: "ผู้ส่งมอบรถ", placeholder: "เลือกผู้ส่งมอบรถ", value: s.delivererId, onChange: (v) => setS({ ...s, delivererId: v }), signed: s.signed[0], onSign: () => setS({ ...s, signed: [true, s.signed[1]] }) }}
        right={{ label: "ผู้รับมอบ (กบค.)", placeholder: "เลือกผู้รับมอบ (กบค.)", value: s.receiverId, onChange: (v) => setS({ ...s, receiverId: v }), signed: s.signed[1], onSign: () => setS({ ...s, signed: [s.signed[0], true] }) }}
      />
      <section className="flex flex-col gap-4">
        <SectionBar>คะแนนประเมินคุณภาพงานซ่อมบำรุง</SectionBar>
        <div className={cx("grid grid-cols-5 gap-2", ro && "pointer-events-none")}>
          {[1, 2, 3, 4, 5].map((n) => <RadioCard key={n} name="score" checked={s.score === n} onChange={() => setS({ ...s, score: n })} title={String(n)} />)}
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <SectionBar>รายการสภาพวัสดุอะไหล่</SectionBar>
        {lines.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-6 py-8 text-center text-sm text-gray-600">ไม่มีรายการอะไหล่ที่เบิก</div>
        ) : (
          <GridTable cols="2fr 1fr 1fr 1fr 1fr" head={["รายการ", "จำนวนที่ใช้", <span key="r" className="inline-flex items-center gap-1">จำนวนที่คืน <InfoTooltip title="จำนวนที่คืน" text="รายการที่ถูกลดจำนวนของรายการจำนวนที่ใช้" /></span>, "ราคาต่อหน่วย", "ราคารวม"]}>
            {lines.map((l, i) => {
              const p = partOf(l.partId);
              const used = s.used[l.partId] ?? l.qty;
              return (
                <GridRow key={l.partId} cols="2fr 1fr 1fr 1fr 1fr">
                  <span className="px-1">{i + 1}. {p.name}</span>
                  <NumberInput label={`จำนวนที่ใช้ ${p.name}`} value={used} min={0} max={l.qty} disabled={ro} onChange={(n) => setS({ ...s, used: { ...s.used, [l.partId]: n } })} />
                  <TextField aria-label={`จำนวนที่คืน ${p.name}`} className="w-40" autoFilled value={String(l.qty - used)} />
                  <span className="px-1 text-gray-700">{currency(p.price)}</span>
                  <TextField aria-label={`ราคารวม ${p.name}`} autoFilled value={currency(used * p.price)} />
                </GridRow>
              );
            })}
          </GridTable>
        )}
      </section>
      {!ro && (
        <Footer>
          <Button disabled={!ok} onClick={() => act({ post: { ...s, confirmed: true } }, { status: "waiting_med_closing_report", log: "ยืนยันการตรวจสภาพหลังซ่อม", toast: "ยืนยันการตรวจสภาพสำเร็จ" })}>ยืนยันการตรวจสภาพ</Button>
        </Footer>
      )}
    </div>
  );
}

/* ---------------- 7 รายงานปิดงาน ---------------- */
type Close = NonNullable<RepairJob["close"]>;
export function StepClose({ job, edit, act }: StepProps) {
  const lines = job.parts?.lines ?? [];
  const [c, setC] = useState<Close>(job.close ?? { docs: {}, files: {}, oldParts: {}, partNotes: {} });
  const [ask, setAsk] = useState<"send" | "approve" | null>(null);
  const draft = job.status === "waiting_med_closing_report";
  const ro = !edit || !draft;
  const ok = CLOSE_DOCS.every((_, i) => c.docs[i]);
  const v = vehicleOf(job.plate);
  const cols = "2fr 1fr 1fr 1fr 1fr 1fr 1.3fr 1.6fr";
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <SectionBar>ข้อมูลเอกสาร</SectionBar>
        <InfoPanel cols={3} items={[["เลขที่งาน", job.no], ["หน่วยงานผู้ใช้บริการ", "-"], ["ชื่องาน", `งานซ่อม ${v.plate} ${v.provinceShort}`], ["วันที่รับงาน", job.createdAt], ["วันที่เสร็จงาน", "-"]]} />
      </section>
      <section className="flex flex-col gap-4">
        <SectionBar>บันทึกข้อตกลงลูกค้า</SectionBar>
        <InfoPanel cols={4} items={[["ติดต่อลูกค้าชื่อ", "-"], ["ตำแหน่ง", "-"], ["เมื่อวันที่", "-"], ["เบอร์โทรศัพท์", "-"], ["ความต้องการลูกค้า", "-"]]} />
      </section>
      <section className="flex flex-col gap-4">
        <SectionBar>รายการสภาพวัสดุอะไหล่</SectionBar>
        <GridTable cols={cols} head={["ชื่ออะไหล่", "ราคาต่อหน่วย", "จำนวนที่ใช้", "ราคารวมที่ใช้", "จำนวนที่คืน", "ราคารวมที่คืน", "จำนวนอะไหล่เก่า", "หมายเหตุ"]}>
          {lines.map((l, i) => {
            const p = partOf(l.partId);
            const used = job.post?.used[l.partId] ?? l.qty;
            return (
              <GridRow key={l.partId} cols={cols}>
                <span className="px-1">{i + 1}. {p.name}</span>
                <span className="px-1">{currency(p.price)}</span>
                <span className="px-1">{used}</span>
                <span className="px-1">{currency(used * p.price)}</span>
                <span className="px-1">{l.qty - used}</span>
                <span className="px-1">{currency((l.qty - used) * p.price)}</span>
                <NumberInput label={`จำนวนอะไหล่เก่า ${p.name}`} value={c.oldParts[l.partId] ?? 0} disabled={ro} onChange={(n) => setC({ ...c, oldParts: { ...c.oldParts, [l.partId]: n } })} />
                <TextField aria-label={`หมายเหตุ ${p.name}`} placeholder="ระบุหมายเหตุ" readOnly={ro} value={c.partNotes[l.partId] ?? ""} onChange={(e) => setC({ ...c, partNotes: { ...c.partNotes, [l.partId]: e.target.value } })} />
              </GridRow>
            );
          })}
        </GridTable>
      </section>
      <section className="flex flex-col gap-4">
        <SectionBar>บันทึกตรวจสอบเอกสารปิดงาน</SectionBar>
        <GridTable cols="2fr 1fr 1fr 1fr 1.6fr" head={["รายการ", "มี", "ไม่มี", "ไม่ต้องใช้", "เอกสารแนบ"]}>
          {CLOSE_DOCS.map((d, i) => (
            <GridRow key={d} cols="2fr 1fr 1fr 1fr 1.6fr">
              <span className="px-1">{i + 1}. {d}</span>
              {(["have", "none", "na"] as const).map((k) => (
                <span key={k} className="px-1"><Radio name={`close-${i}`} label={`${{ have: "มี", none: "ไม่มี", na: "ไม่ต้องใช้" }[k]} ${d}`} checked={c.docs[i] === k} disabled={ro} onChange={() => setC({ ...c, docs: { ...c.docs, [i]: k } })} /></span>
              ))}
              <label className={cx("flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm", ro || c.docs[i] !== "have" ? "cursor-not-allowed bg-gray-100 text-gray-400" : "cursor-pointer bg-white text-gray-700 hover:border-brand-800")}>
                <Icon name="attach_file" size={20} />
                <span className="truncate">{c.files[i] || "อัพโหลดเอกสารแนบ"}</span>
                <input type="file" hidden disabled={ro || c.docs[i] !== "have"} onChange={(e) => { const f = e.target.files?.[0]; if (f) setC({ ...c, files: { ...c.files, [i]: f.name } }); }} />
              </label>
            </GridRow>
          ))}
        </GridTable>
      </section>
      {edit && draft && <Footer><Button disabled={!ok} onClick={() => setAsk("send")}>ส่งอนุมัติ</Button></Footer>}
      {edit && job.status === "waiting_closing_approval" && (
        <Footer>
          <Button onClick={() => setAsk("approve")}>อนุมัติปิดงาน</Button>
        </Footer>
      )}
      <Modal open={ask === "send"} onClose={() => setAsk(null)} variant="centered" icon="send" title="ยืนยันการส่งอนุมัติปิดงาน" description={`ส่งรายงานปิดงาน ${job.no} ให้ผู้อนุมัติ`} confirmLabel="ส่งอนุมัติ" onConfirm={() => { setAsk(null); act({ close: c }, { status: "waiting_closing_approval", log: "ส่งรายงานปิดงาน · ส่งอนุมัติ", toast: "ส่งอนุมัติสำเร็จ", notify: [{ to: "medHead", text: `คำขอปิดงาน ${job.no} รอการตอบรับ`, tone: "warning" }] }); }} />
      <Modal open={ask === "approve"} onClose={() => setAsk(null)} variant="centered" icon="task_alt" title="ยืนยันอนุมัติปิดงาน" description={`อนุมัติปิดงาน ${job.no} หรือไม่ ?`} confirmLabel="อนุมัติปิดงาน" onConfirm={() => { setAsk(null); act({}, { status: "job_closed", log: "อนุมัติปิดงาน", toast: "อนุมัติปิดงานสำเร็จ", notify: [{ to: "med", text: `ดำเนินการปิดงาน ${job.no} เรียบร้อยแล้ว`, tone: "success" }, { to: "origin", text: `งานซ่อม ${job.no} ปิดงานแล้ว`, tone: "success" }] }); }} />
    </div>
  );
}
