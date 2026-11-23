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
import { WARRANTY_MAX_DAYS, warrantyEnd } from "@overhaul/features/job/close";
import { DateField, DateRangeField, parseThaiDate } from "@ui/DateField";
import { Toggle } from "@ui/Toggle";
import { MoneyField } from "@overhaul/features/plan/VehicleModals";
import { nowBE, num, todayBE, type Warranty, type Appointment, type DocCheck, type Notice, type PartLine, type RepairJob, type Role } from "./model";
import { ProgressBar } from "@ui/ProgressBar";
import { CostAlert, PartsPicker, jobCost, money, usedPartsCost } from "./parts";
import { AddedNote, AddedTag, GridRow, GridTable, InfoPanel, PersonPicker, SectionBar, SignBlock, UploadBox } from "./ui";

export type Notify = { to: Role; text: string; tone?: Notice["tone"] };
export type Act = (patch: Partial<RepairJob>, o?: { status?: StatusCode; log?: string; note?: string; toast?: string; notify?: Notify[] }) => void;
interface StepProps { job: RepairJob; edit: boolean; act: Act; role: Role }

const HQ = "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9";
export const Footer = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>;

/* ---------------- 1 เบิกอะไหล่ ---------------- */
export function StepParts({ job, edit, act }: StepProps) {
  const [lines, setLines] = useState<PartLine[]>(job.parts?.lines ?? job.requestedParts);
  const locked = !!job.parts?.locked;
  if (locked || !edit)
    return <PartsPicker readOnly lines={job.parts?.lines ?? []} footer={locked ? <p className="pt-2 text-xs text-gray-600">สถานะใบเบิก: รอสั่งซื้อ/เบิก (PENDING_ORDER)</p> : undefined} lockedText={locked ? undefined : "ยังไม่ได้เบิกอะไหล่"} />;
  return (
    <div className="flex flex-col gap-6">
      <AddedNote>UAT มีแต่หน้าขั้นนี้แบบล็อกแล้ว — ต้นแบบเติมหน้าเลือกอะไหล่ก่อนยืนยันเบิก (ตั้งต้นจาก &quot;อะไหล่ที่ผู้แจ้งเลือกไว้&quot;) · เบิกแล้วแก้ไม่ได้</AddedNote>
      <PartsPicker lines={lines} onChange={setLines} subtitle="จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ" />
      <CostAlert plate={job.plate} {...jobCost({ ...job, parts: { lines, locked: false } })} />
      <Footer>
        <Button variant="secondary" onClick={() => act({ parts: { lines: [], locked: true } }, { log: "ไม่เบิกอะไหล่", toast: "บันทึกสำเร็จ" })}>ไม่เบิกอะไหล่</Button>
        <Button disabled={!lines.length} onClick={() => act({ parts: { lines, locked: true } }, { log: `ยืนยันเบิกอะไหล่ ${lines.length} รายการ`, toast: "ยืนยันเบิกอะไหล่สำเร็จ" })}>ยืนยันเบิกอะไหล่</Button>
      </Footer>
    </div>
  );
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

/** หน้ารอหน่วยงานตอบ (UAT ขั้น 5: ภาพว่าง + "รอตอบกลับจากหน่วยงาน" + แก้ไขนัดหมาย + ต้นทางยืนยัน)
 *  เพิ่มใหม่: หน่วยงานตอบเองจากเมนู "ตอบรับนัดหมายงานซ่อม" (แบบ Overhaul) — ปุ่ม "ต้นทางยืนยัน" ใน UAT เป็นทางลัดให้ กบค. กดแทน จึงแสดงเฉพาะ role admin-super (EC-R01) */
function WaitingReply({ onEdit, onConfirm, appt, shortcut }: { onEdit: () => void; onConfirm: () => void; appt: Appointment; shortcut: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <EmptyState kind="data-empty" title="รอตอบกลับจากหน่วยงาน" description={`นัดหมาย ${appt.from}${appt.to && appt.to !== appt.from ? ` - ${appt.to}` : ""} · ${appt.place}`} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={onEdit}>แก้ไขนัดหมาย</Button>
        {shortcut && <Button onClick={onConfirm}>ต้นทางยืนยัน</Button>}
      </div>
      <p className="flex items-center gap-2 text-sm text-gray-600"><AddedTag /> หน่วยงานต้นทางตอบรับ/ปฏิเสธจากเมนู &quot;ตอบรับนัดหมายงานซ่อม&quot;</p>
    </div>
  );
}

/* ---------------- 2 นัดหมายวันซ่อม ---------------- */
export function StepAppointment({ job, edit, act, role }: StepProps) {
  const [a, setA] = useState<Appointment>(job.appt ?? { kind: "at_med", from: "", to: "", mechanicId: "", place: HQ });
  const [editing, setEditing] = useState(false);
  const waiting = job.status === "waiting_origin_confirm_appointment";
  if (edit && waiting && !editing)
    return (
      <WaitingReply
        appt={job.appt!}
        shortcut={role === "admin"}
        onEdit={() => setEditing(true)}
        onConfirm={() => act({ appt: { ...job.appt!, reply: { ok: true, at: nowBE() } } }, { status: "ready_to_proceed", log: "ต้นทางยืนยันนัดหมายวันซ่อม (กบค. กดแทน)", toast: "ยืนยันนัดหมายสำเร็จ" })}
      />
    );
  const can = edit && (job.status === "preparing_spare_parts" || editing);
  const ok = !!a.from && !!a.mechanicId && !!a.place.trim();
  return (
    <div className="flex flex-col gap-6">
      {can && <AddedNote>UAT มีแต่หน้าขั้นนี้แบบอ่าน — ต้นแบบเติมฟอร์มส่งนัดหมายให้หน่วยงานต้นทางยืนยัน (ใช้ฟิลด์เดียวกับหน้าอ่าน)</AddedNote>}
      {job.appt?.reply?.ok === false && can && <Alert tone="warning" title="ต้นทางขอเปลี่ยนวันนัดหมาย">{job.appt.reply.reason}</Alert>}
      <ApptForm kind="repair" value={a} onChange={setA} readOnly={!can} />
      {can && (
        <Footer>
          {editing && <Button variant="secondary" onClick={() => setEditing(false)}>ยกเลิก</Button>}
          <Button disabled={!ok} onClick={() => { setEditing(false); act({ appt: { ...a, sentAt: nowBE(), reply: undefined } }, { status: "waiting_origin_confirm_appointment", log: "ส่งนัดหมายวันซ่อม", toast: "ส่งนัดหมายสำเร็จ", notify: [{ to: "origin", text: `นัดหมายวันซ่อม ${job.no} รอการตอบรับ`, tone: "warning" }] }); }}>ส่งนัดหมาย</Button>
        </Footer>
      )}
    </div>
  );
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
export function StepIntake({ job, edit, act, role }: StepProps) {
  const [s, setS] = useState<Intake>(job.intake ?? { docs: {}, signed: [false, false], check: {}, notes: {} });
  const ro = !edit || !!job.intake?.confirmed;
  const setDoc = (i: number, p: DocCheck) => setS({ ...s, docs: { ...s.docs, [i]: { ...s.docs[i], ...p } } });
  /* แบบ Overhaul: ตรวจสภาพครบก่อนจึงเซ็น · ส่งคำขอ/เซ็นแล้วล็อกข้อมูลทั้งขั้น */
  const complete = INTAKE_DOCS.every((_, i) => s.docs[i]?.v) && (s.docs[4]?.v !== "have" || (!!s.battery?.brand?.trim() && !!s.battery?.qty)) && INSPECT_ITEMS.every((_, i) => s.check[i]) && (s.photos ?? 0) > 0;
  const locked = !!s.signReq || s.signed[0] || s.signed[1];
  const ok = complete && s.signed[0] && s.signed[1];
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
                      <TextField aria-label="ยี่ห้อแบตเตอรี่" className="w-20" placeholder="ระบุยี่ห้อ" readOnly={ro || locked} value={s.battery?.brand ?? ""} onChange={(e) => setS({ ...s, battery: { brand: e.target.value, qty: s.battery?.qty ?? "" } })} />
                      จำนวน
                      <TextField aria-label="จำนวนแบตเตอรี่" className="w-24" placeholder="ระบุจำนวน" inputMode="numeric" readOnly={ro || locked} value={s.battery?.qty ?? ""} onChange={(e) => setS({ ...s, battery: { brand: s.battery?.brand ?? "", qty: e.target.value.replace(/\D/g, "") } })} />
                      ลูก
                    </>
                  )}
                </span>
                <span className="px-1"><Radio name={`doc-${i}`} label={`มี ${d}`} checked={r.v === "have"} disabled={ro || locked} onChange={() => setDoc(i, { v: "have" })} /></span>
                <span className="px-1"><Radio name={`doc-${i}`} label={`ไม่มี ${d}`} checked={r.v === "none"} disabled={ro || locked} onChange={() => setDoc(i, { v: "none", broken: false, wrong: false })} /></span>
                <span className="px-1"><Checkbox label={`ชำรุด ${d}`} checked={!!r.broken} disabled={ro || locked || r.v !== "have"} onChange={(b) => setDoc(i, { broken: b })} /></span>
                <span className="px-1"><Checkbox label={`ผิดรุ่น ${d}`} checked={!!r.wrong} disabled={ro || locked || r.v !== "have"} onChange={(b) => setDoc(i, { wrong: b })} /></span>
                <TextField aria-label={`หมายเหตุ ${d}`} placeholder="ระบุหมายเหตุ" readOnly={ro || locked} value={r.note ?? ""} onChange={(e) => setDoc(i, { note: e.target.value })} />
              </GridRow>
            );
          })}
        </GridTable>
      </section>
      <InspectTable title="รายละเอียดการตรวจสภาพก่อนซ่อม" check={s.check} notes={s.notes} readOnly={ro || locked} onChange={(check, notes) => setS({ ...s, check, notes })} />
      <PhotoSection title="รูปสภาพยานพาหนะ (ก่อนซ่อม)" note="JO1 7.2.4.1 ข้อ 4 ข้อมูลภาพและเอกสาร · บันทึกจุดชำรุดเป็นหลักฐาน" count={s.photos ?? 0} readOnly={ro || locked} onAdd={(n) => setS({ ...s, photos: (s.photos ?? 0) + n })} />
      <SignBlock
        title="ลงนามการรับมอบรถ"
        readOnly={ro}
        hint={!ro && !complete ? "ตรวจสภาพให้ครบทุกรายการ (เอกสารรับรถ + รายละเอียดการตรวจสภาพ) และแนบรูปสภาพยานพาหนะก่อนเซ็นลงนาม" : undefined}
        left={{
          label: "ผู้ส่งมอบรถ", placeholder: "เลือกผู้ส่งมอบรถ", value: s.delivererId, onChange: (v) => setS({ ...s, delivererId: v }), signed: s.signed[0],
          remote: role !== "admin", requested: s.signReq, ready: complete,
          onCancel: () => { const next = { ...s, signReq: false }; setS(next); act({ intake: next }, { log: "ยกเลิกคำขอเซ็นลงนามการรับมอบรถ · แก้ไขข้อมูล", toast: "ยกเลิกคำขอเซ็นลงนามแล้ว" }); },
          onSign: () => {
            if (role === "admin") return setS({ ...s, signed: [true, s.signed[1]] });
            const next = { ...s, signReq: true };
            setS(next);
            act({ intake: next }, { log: "ส่งให้ผู้ส่งมอบรถเซ็นลงนามการรับมอบรถ", toast: "ส่งคำขอเซ็นลงนามสำเร็จ", notify: [{ to: "origin", text: `กรุณาเซ็นลงนามการรับมอบรถ ${job.no}`, tone: "warning" }] });
          },
        }}
        right={{ label: "ผู้รับมอบ (กบค.)", placeholder: "เลือกผู้รับมอบ (กบค.)", value: s.receiverId, onChange: (v) => setS({ ...s, receiverId: v }), signed: s.signed[1], ready: complete, onSign: () => setS({ ...s, signed: [s.signed[0], true] }) }}
      />
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
  const [reject, setReject] = useState<string | null>(null);
  const ro = !edit || job.status !== "repair_in_progress";

  if (job.status === "found_additional_symptoms") {
    return (
      <div className="flex flex-col gap-6">
        <AddedNote>UAT มีสถานะ &quot;เจออาการเพิ่ม&quot; และกล่อง &quot;ส่งอนุมัติเพื่อเปิดงานซ่อม&quot; แต่ไม่มีหน้าพิจารณา — ต้นแบบเติมหน้าอนุมัติอาการเพิ่มของหัวหน้า กบค.</AddedNote>
        <WorkRead w={prev!} />
        {edit && (
          <Footer>
            <Button variant="tertiaryDanger" onClick={() => setReject("")}>ไม่อนุมัติ</Button>
            <Button onClick={() => act({ work: { ...prev!, extraResult: "approved" }, parts: { locked: true, lines: mergeLines(job.parts?.lines ?? [], prev!.extraParts) } }, { status: "repair_in_progress", log: "อนุมัติอาการเพิ่ม", toast: "อนุมัติสำเร็จ", notify: [{ to: "med", text: `อาการเพิ่มของ ${job.no} ได้รับอนุมัติแล้ว`, tone: "success" }] })}>อนุมัติ</Button>
          </Footer>
        )}
        <Modal open={reject !== null} onClose={() => setReject(null)} title="ไม่อนุมัติอาการเพิ่ม" confirmLabel="ยืนยัน" confirmDisabled={!reject?.trim()} onConfirm={() => { act({ work: { ...prev!, extraResult: "rejected", extraReason: reject!.trim() } }, { status: "repair_in_progress", log: "ไม่อนุมัติอาการเพิ่ม", note: reject!.trim(), toast: "บันทึกสำเร็จ", notify: [{ to: "med", text: `อาการเพิ่มของ ${job.no} ไม่ได้รับอนุมัติ เหตุผล: ${reject!.trim()}`, tone: "error" }] }); setReject(null); }}>
          <TextArea label="เหตุผล" rows={4} placeholder="ระบุเหตุผล" value={reject ?? ""} onChange={(e) => setReject(e.target.value)} />
        </Modal>
      </div>
    );
  }

  if (ro) return <div className="flex flex-col gap-8"><ProgressLog job={job} edit={false} act={act} role={role} /><WorkRead w={prev ?? { extraParts: [] }} /></div>;
  const canDone = w.extra === false;
  const canExtra = w.extra === true && !!w.extraText?.trim() && w.withdraw !== undefined && (!w.withdraw || w.extraParts.length > 0);
  return (
    <div className="flex flex-col gap-6">
      {prev?.extraResult && (
        <Alert tone={prev.extraResult === "approved" ? "success" : "warning"} title={prev.extraResult === "approved" ? "หัวหน้า กบค. อนุมัติอาการเพิ่มแล้ว" : "หัวหน้า กบค. ไม่อนุมัติอาการเพิ่ม"}>
          {prev.extraText}{prev.extraReason ? ` · เหตุผล: ${prev.extraReason}` : ""}
        </Alert>
      )}
      <ProgressLog job={job} edit act={act} role={role} />
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
function mergeLines(a: PartLine[], b: PartLine[]) {
  const m = new Map(a.map((l) => [l.partId, l.qty]));
  b.forEach((l) => m.set(l.partId, (m.get(l.partId) ?? 0) + l.qty));
  return [...m].map(([partId, qty]) => ({ partId, qty }));
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
        shortcut={role === "admin"}
        onEdit={() => setEditing(true)}
        onConfirm={() => act({ returnAppt: { ...job.returnAppt!, reply: { ok: true, at: nowBE() } } }, { status: "waiting_med_post_repair_inspection", log: "ต้นทางยืนยันรับรถ (กบค. กดแทน)", toast: "ยืนยันนัดหมายสำเร็จ" })}
      />
    );
  const can = edit && (job.status === "repair_finished" || job.status === "waiting_med_reschedule_return" || editing);
  const ok = !!a.from && !!a.mechanicId && !!a.place.trim();
  return (
    <div className="flex flex-col gap-6">
      {job.status === "waiting_med_reschedule_return" && (
        <>
          <AddedNote>UAT มีสถานะ &quot;รอ กบค. ส่งนัดหมายวันคืนรถใหม่อีกครั้ง&quot; แต่ไม่มีปุ่มให้ต้นทางขอเปลี่ยนวัน — ต้นแบบเติมทางนี้</AddedNote>
          <Alert tone="warning" title="ต้นทางขอเปลี่ยนวันคืนรถ">{job.returnAppt?.reply?.reason}</Alert>
        </>
      )}
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
export function StepPost({ job, edit, act, role }: StepProps) {
  const lines = job.parts?.lines ?? [];
  const [s, setS] = useState<Post>(job.post ?? { mileage: "", hours: "", check: {}, notes: {}, signed: [false, false], used: Object.fromEntries(lines.map((l) => [l.partId, l.qty])) });
  const ro = !edit || !!job.post?.confirmed;
  const warrantyOk = warrantyValid(s.warranty ?? NO_WARRANTY_YET);
  /* แบบ Overhaul: เลขไมล์ + ตรวจสภาพครบก่อนจึงเซ็น · ส่งคำขอ/เซ็นแล้วล็อกส่วนตรวจสภาพ */
  const complete = !!s.mileage && INSPECT_ITEMS.every((_, i) => s.check[i]);
  const locked = !!s.signReq || s.signed[0] || s.signed[1];
  const ok = complete && s.signed[0] && s.signed[1] && !!s.score && warrantyOk;
  return (
    <div className="flex flex-col gap-8">
      <VehiclePanel job={job} mileage={false} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField label="เลขไมล์ปัจจุบัน" inputMode="numeric" placeholder="ระบุเลขไมล์" readOnly={ro || locked} value={s.mileage} onChange={(e) => setS({ ...s, mileage: e.target.value.replace(/\D/g, "") })} />
        <TextField label="ชั่วโมงการทำงานเครื่องจักรปัจจุบัน" inputMode="numeric" placeholder="ระบุชั่วโมงการทำงานเครื่องจักรปัจจุบัน" readOnly={ro || locked} value={s.hours} onChange={(e) => setS({ ...s, hours: e.target.value.replace(/\D/g, "") })} />
      </div>
      <InspectTable title="รายละเอียดการตรวจสภาพหลังซ่อม" check={s.check} notes={s.notes} readOnly={ro || locked} onChange={(check, notes) => setS({ ...s, check, notes })} />
      <SignBlock
        title="ลงนามการส่งคืนรถ (วันที่หน่วยงานเซ็น = วันปิดงาน)"
        readOnly={ro}
        hint={!ro && !complete ? "ระบุเลขไมล์และตรวจสภาพหลังซ่อมให้ครบทุกรายการก่อนเซ็นลงนาม" : undefined}
        left={{
          label: "ผู้ส่งมอบรถ", placeholder: "เลือกผู้ส่งมอบรถ", value: s.delivererId, onChange: (v) => setS({ ...s, delivererId: v }), signed: s.signed[0],
          remote: role !== "admin", requested: s.signReq, signedAt: s.signedAt, ready: complete,
          onCancel: () => { const next = { ...s, signReq: false }; setS(next); act({ post: next }, { log: "ยกเลิกคำขอเซ็นลงนามการส่งคืนรถ · แก้ไขข้อมูล", toast: "ยกเลิกคำขอเซ็นลงนามแล้ว" }); },
          onSign: () => {
            if (role === "admin") return setS({ ...s, signed: [true, s.signed[1]], signedAt: todayBE() });
            const next = { ...s, signReq: true };
            setS(next);
            act({ post: next }, { log: "ส่งให้หน่วยงานเซ็นลงนามการส่งคืนรถ", toast: "ส่งคำขอเซ็นลงนามสำเร็จ", notify: [{ to: "origin", text: `กรุณาเซ็นลงนามการส่งคืนรถ ${job.no}`, tone: "warning" }] });
          },
        }}
        right={{ label: "ผู้รับมอบ (กบค.)", placeholder: "เลือกผู้รับมอบ (กบค.)", value: s.receiverId, onChange: (v) => setS({ ...s, receiverId: v }), signed: s.signed[1], ready: complete, onSign: () => setS({ ...s, signed: [s.signed[0], true] }) }}
      />
      <PhotoSection title="รูปสภาพยานพาหนะ (หลังซ่อม)" optional note="JO1 งานซ่อมไม่ได้ระบุรูปหลังซ่อม (งานบำรุงรักษาระบุ ก่อน/หลัง) — ใส่เป็น (ถ้ามี)" count={s.photos ?? 0} readOnly={ro} onAdd={(n) => setS({ ...s, photos: (s.photos ?? 0) + n })} />
      <section className="flex flex-col gap-4">
        <SectionBar extra={<AddedTag />} description="JO1 7.2.4.2 ข้อ 4 รองรับการรับประกันงานซ่อม (ถ้ามี) เช่น 180 วัน · เริ่มนับวันส่งคืนยานพาหนะ">การรับประกันงานซ่อมของ กบค.</SectionBar>
        <WarrantyField who="med" value={s.warranty} readOnly={ro} onChange={(v) => setS({ ...s, warranty: v })} />
      </section>
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
          <Button disabled={!ok} onClick={() => act({ post: { ...s, warranty: s.warranty ?? NO_WARRANTY_YET, confirmed: true } }, { status: "waiting_med_closing_report", log: "ยืนยันการตรวจสภาพหลังซ่อม", toast: "ยืนยันการตรวจสภาพสำเร็จ" })}>ยืนยันการตรวจสภาพ</Button>
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
  const [ask, setAsk] = useState<"send" | "approve" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const draft = job.status === "waiting_med_closing_report";
  const ro = !edit || !draft;
  const costs = c.costs ?? { labor: "", travel: "", lodging: "", other: "" };
  const setCost = (k: keyof typeof costs, v: string) => setC({ ...c, costs: { ...costs, [k]: v } });
  const partsCost = usedPartsCost(job);
  const total = partsCost + money(costs.labor) + money(costs.travel) + money(costs.lodging) + money(costs.other);
  const ok = CLOSE_DOCS.every((_, i) => c.docs[i]) && !!costs.labor.trim();
  const v = vehicleOf(job.plate);
  const cols = "2fr 1fr 1fr 1fr 1fr 1fr 1.3fr 1.6fr";
  return (
    <div className="flex flex-col gap-8">
      {job.close?.result === "returned" && draft && <Alert tone="warning" title="ผู้อนุมัติส่งกลับแก้ไข">{job.close.returnReason}</Alert>}
      <section className="flex flex-col gap-4">
        <SectionBar>ข้อมูลเอกสาร</SectionBar>
        <InfoPanel cols={3} items={[["เลขที่งาน", job.no], ["หน่วยงานผู้ใช้บริการ", "-"], ["ชื่องาน", `งานซ่อม ${v.plate} ${v.provinceShort}`], ["วันที่รับงาน", job.createdAt], ["วันที่เสร็จงาน (วันที่เซ็นรับรถคืน)", job.post?.signedAt ?? "-"]]} />
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
        <SectionBar extra={<AddedTag />} description="JO1 7.2.4.1 ข้อ 3 ค่าแรง · ค่าอะไหล่ · ยอดรวม · ศูนย์ต้นทุน/หมายเลขงาน">ค่าใช้จ่ายในการซ่อม</SectionBar>
        <InfoPanel cols={3} items={[
          ["งบที่ตัด / ศูนย์ต้นทุน", job.budget.type === "invest" ? `WBS ${job.budget.wbs ?? "-"} · โครงข่าย ${job.budget.network ?? "-"} · กิจกรรม ${job.budget.activity ?? "-"}` : job.budget.costCenter ?? "ตามงบที่แจ้ง"],
          ["วันที่เริ่มซ่อม", job.appt?.reply?.at?.slice(0, 10) || job.appt?.from],
          ["วันที่ซ่อมเสร็จ", job.history.find((h) => h.detail === "ซ่อมเสร็จสิ้น")?.at.slice(0, 10) ?? job.updatedAt],
        ]} />
        {ro ? (
          <InfoPanel cols={3} items={[["ค่าอะไหล่ (ตามจำนวนที่ใช้)", `${currency(partsCost)} บาท`], ["ค่าแรง", costs.labor ? `${currency(money(costs.labor))} บาท` : "-"], ["ค่าเดินทาง", costs.travel ? `${currency(money(costs.travel))} บาท` : "-"], ["ค่าที่พัก", costs.lodging ? `${currency(money(costs.lodging))} บาท` : "-"], ["ค่าใช้จ่ายอื่น ๆ", costs.other ? `${currency(money(costs.other))} บาท` : "-"], ["รวมค่าใช้จ่ายทั้งสิ้น", `${currency(total)} บาท`]]} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <TextField label="ค่าอะไหล่ (บาท)" autoFilled value={currency(partsCost)} helper="คำนวณจากจำนวนที่ใช้จริง (ขั้น 6)" />
              <MoneyField label="ค่าแรง (บาท)" placeholder="0.00" value={costs.labor} onChange={(v) => setCost("labor", v)} />
              <MoneyField label="ค่าเดินทาง (บาท)" optional placeholder="0.00" value={costs.travel} onChange={(v) => setCost("travel", v)} />
              <MoneyField label="ค่าที่พัก (บาท)" optional placeholder="0.00" value={costs.lodging} onChange={(v) => setCost("lodging", v)} />
              <MoneyField label="ค่าใช้จ่ายอื่น ๆ (บาท)" optional placeholder="0.00" value={costs.other} onChange={(v) => setCost("other", v)} />
              <TextField label="รวมค่าใช้จ่ายทั้งสิ้น (บาท)" autoFilled value={currency(total)} />
            </div>
          </>
        )}
        <CostAlert plate={job.plate} cost={total} basis="ค่าใช้จ่ายจริงในการซ่อม" />
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
          <AddedTag />
          <Button variant="tertiaryDanger" onClick={() => { setReason(""); setAsk("return"); }}>ส่งกลับแก้ไข</Button>
          <Button onClick={() => setAsk("approve")}>อนุมัติปิดงาน</Button>
        </Footer>
      )}
      <Modal open={ask === "send"} onClose={() => setAsk(null)} variant="centered" icon="send" title="ยืนยันการส่งอนุมัติปิดงาน" description={`ส่งรายงานปิดงาน ${job.no} ให้ผู้อนุมัติ`} confirmLabel="ส่งอนุมัติ" onConfirm={() => { setAsk(null); act({ close: { ...c, result: undefined } }, { status: "waiting_closing_approval", log: "ส่งรายงานปิดงาน · ส่งอนุมัติ", toast: "ส่งอนุมัติสำเร็จ", notify: [{ to: "medHead", text: `คำขอปิดงาน ${job.no} รอการตอบรับ`, tone: "warning" }] }); }} />
      <Modal open={ask === "approve"} onClose={() => setAsk(null)} variant="centered" icon="task_alt" title="ยืนยันอนุมัติปิดงาน" description={`อนุมัติปิดงาน ${job.no} หรือไม่ ?`} confirmLabel="อนุมัติปิดงาน" onConfirm={() => { setAsk(null); act({}, { status: "job_closed", log: "อนุมัติปิดงาน", toast: "อนุมัติปิดงานสำเร็จ", notify: [{ to: "med", text: `ดำเนินการปิดงาน ${job.no} เรียบร้อยแล้ว`, tone: "success" }, { to: "origin", text: `งานซ่อม ${job.no} ปิดงานแล้ว`, tone: "success" }] }); }} />
      <Modal open={ask === "return"} onClose={() => setAsk(null)} title="ส่งกลับแก้ไข" confirmLabel="ส่งกลับ" confirmDisabled={!reason.trim()} onConfirm={() => { setAsk(null); act({ close: { ...c, result: "returned", returnReason: reason.trim() } }, { status: "waiting_med_closing_report", log: "ไม่อนุมัติปิดงาน · ส่งกลับแก้ไข", note: reason.trim(), toast: "ส่งกลับแก้ไขสำเร็จ", notify: [{ to: "med", text: `คำขอปิดงาน ${job.no} ไม่ได้รับอนุมัติ เหตุผล: ${reason.trim()}`, tone: "error" }] }); }}>
        <TextArea label="เหตุผล" rows={4} placeholder="ระบุเหตุผล" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
}


/** เพิ่มใหม่: บันทึกความคืบหน้าระหว่างซ่อม (ขั้น 4) — แบบ "ติดตามงานซ่อม" ของ Overhaul (ระบบใส่วันเวลาให้ · ความคืบหน้า % · หมายเหตุ)
 *  ที่มา: To-Be ข้อ 5 "อัปเดต progress ระหว่างซ่อม" (CLAUDE.md) · UAT ขั้น 4 มีแค่ผลตรวจอาการเพิ่ม */
export function ProgressLog({ job, edit, act }: StepProps) {
  const rows = job.progress ?? [];
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ detail: "", pct: "", note: "" });
  const pct = Number(f.pct);
  const ok = !!f.detail.trim() && f.pct !== "" && pct >= 0 && pct <= 100;
  return (
    <section className="flex flex-col gap-4">
      <SectionBar extra={<AddedTag />}>บันทึกความคืบหน้า</SectionBar>
      {rows.length === 0 ? (
        <div className="rounded-xl bg-gray-50 px-6 py-6 text-center text-sm text-gray-600">ยังไม่มีบันทึกความคืบหน้า</div>
      ) : (
        <GridTable cols="1.2fr 2.4fr 1.6fr 1.6fr" head={["วันที่ / เวลา", "รายละเอียด", "ความคืบหน้า", "หมายเหตุ"]}>
          {rows.map((r, i) => (
            <GridRow key={i} cols="1.2fr 2.4fr 1.6fr 1.6fr">
              <span className="px-1">{r.at}</span>
              <span className="px-1">{r.detail}</span>
              <span className="px-1"><ProgressBar value={r.pct} label={`ความคืบหน้า ${r.pct}%`} /></span>
              <span className="px-1 text-gray-600">{r.note || "-"}</span>
            </GridRow>
          ))}
        </GridTable>
      )}
      {edit && (
        <div>
          <Button variant="secondary" iconLeft="add" onClick={() => { setF({ detail: "", pct: "", note: "" }); setOpen(true); }}>บันทึกความคืบหน้า</Button>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="บันทึกความคืบหน้า" confirmLabel="บันทึก" confirmDisabled={!ok} onConfirm={() => { setOpen(false); act({ progress: [...rows, { at: nowBE(), detail: f.detail.trim(), pct, note: f.note.trim() }] }, { log: `บันทึกความคืบหน้า ${pct}%`, note: f.detail.trim(), toast: "บันทึกความคืบหน้าสำเร็จ" }); }}>
        <TextArea label="รายละเอียด" rows={3} placeholder="ระบุสิ่งที่ทำ เช่น ถอดกระบอกขาช้างเปลี่ยนซีล" value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} />
        <TextField label="ความคืบหน้า" suffix="%" inputMode="numeric" placeholder="0-100" value={f.pct} error={f.pct !== "" && (pct < 0 || pct > 100) ? "กรุณาระบุ 0 ถึง 100" : undefined} onChange={(e) => setF({ ...f, pct: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
        <TextArea label="หมายเหตุ" optional rows={2} placeholder="ระบุหมายเหตุ" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </Modal>
    </section>
  );
}

/** อัปโหลดรูปสภาพยานพาหนะ (ต้นแบบนับจำนวนไฟล์) — แบบ "รูปสภาพยานพาหนะ (ก่อน Overhaul)" ของ Overhaul ขั้น 2 */
export function PhotoSection({ title, note, count, readOnly, onAdd, optional }: { title: string; note: string; count: number; readOnly: boolean; onAdd: (n: number) => void; optional?: boolean }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionBar extra={<AddedTag />} description={note}>
        {title}{optional && <span className="ml-1 text-md font-normal text-gray-500">(ถ้ามี)</span>}
      </SectionBar>
      {readOnly ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-6 text-center text-sm text-gray-600">{count ? `รูปภาพ ${count} ไฟล์` : "ไม่มีรูปภาพ"}</div>
      ) : (
        <UploadBox hint="PNG, JPG หรือ WebP ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์" count={count} max={50} onAdd={onAdd} />
      )}
    </section>
  );
}

/** การรับประกันงานซ่อม — แบบเดียวกับขั้นปิดงานของ Overhaul (เจ้าของงาน 23 พ.ย. 2569 "เลือกได้ เอาแบบงาน overhaul")
 *  Toggle "มีการรับประกันงานซ่อม" · วันเริ่มรับประกัน (ไม่เติมให้) · จำนวนวันที่รับประกัน (ตรวจตอนออกจากช่อง) · วันหมดอายุประกัน (คำนวณ) · Alert แจ้งเตือน 30/15 วัน
 *  who: med = ประกันผลงานซ่อมของ กบค. · garage = ประกันผลงานของศูนย์บริการ/อู่ */
export const NO_WARRANTY_YET: Warranty = { on: true, start: "", days: null };
export const warrantyValid = (w?: Warranty) => !!w && (!w.on || (!!parseThaiDate(w.start) && !!w.days && w.days > 0 && w.days <= WARRANTY_MAX_DAYS));
export function WarrantyField({ value = NO_WARRANTY_YET, onChange, readOnly, who }: { value?: Warranty; onChange: (w: Warranty) => void; readOnly?: boolean; who: "med" | "garage" | "ecd" }) {
  const [err, setErr] = useState({ start: "", days: "" });
  const end = value.on ? warrantyEnd(value.start, value.days) : "";
  const daysError = () => (!value.days ? "กรุณาระบุจำนวนวันที่รับประกัน" : value.days > WARRANTY_MAX_DAYS ? `จำนวนวันที่รับประกันต้องไม่เกิน ${WARRANTY_MAX_DAYS.toLocaleString()} วัน` : "");
  if (readOnly)
    return value.on ? (
      <InfoPanel cols={4} items={[["วันเริ่มรับประกัน", value.start], ["จำนวนวันที่รับประกัน", value.days ? `${value.days} วัน` : ""], ["วันหมดอายุประกัน", end], ["แจ้งเตือนก่อนหมด", "เจ้าของยานพาหนะ และ กบค. 30 วัน และ 15 วัน"]]} />
    ) : (
      <InfoPanel cols={2} items={[["การรับประกันงานซ่อม", "ไม่มี"], ["แจ้งเตือนก่อนหมด", "ไม่แจ้งเตือน"]]} />
    );
  return (
    <div className="flex flex-col gap-4">
      <Toggle checked={value.on} onChange={(on) => onChange({ ...value, on })} label="มีการรับประกันงานซ่อม" description={who === "med" ? "ประกันผลงานซ่อมของ กบค." : who === "ecd" ? "ประกันผลงานซ่อมของ กรย." : "ประกันผลงานของศูนย์บริการ/อู่ ตามใบเสนอราคา/ใบรับประกัน"} />
      {value.on ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <DateField label="วันเริ่มรับประกัน" placeholder="เลือกวันเริ่มรับประกัน" value={value.start} onChange={(v) => { onChange({ ...value, start: v }); setErr((x) => ({ ...x, start: "" })); }} onBlur={() => setErr((x) => ({ ...x, start: parseThaiDate(value.start) ? "" : "กรุณาเลือกวันเริ่มรับประกัน" }))} error={err.start || undefined} />
            <TextField
              label="จำนวนวันที่รับประกัน"
              inputMode="numeric"
              placeholder="ระบุจำนวนวันที่รับประกัน"
              suffix="วัน"
              value={value.days != null ? String(value.days) : ""}
              onChange={(e) => { const n = e.target.value.replace(/\D/g, "").slice(0, 4); onChange({ ...value, days: n ? Number(n) : null }); setErr((x) => ({ ...x, days: "" })); }}
              onBlur={() => setErr((x) => ({ ...x, days: daysError() }))}
              error={err.days || undefined}
            />
            <TextField label="วันหมดอายุประกัน" autoFilled placeholder="คำนวณเมื่อระบุจำนวนวันที่รับประกัน" value={end} />
          </div>
          <Alert tone="info" title="ระบบจะแจ้งเตือนหน่วยงานเจ้าของรถ และ กบค. ก่อนประกันหมด 30 วัน และ 15 วัน แจ้งทางกระดิ่งในระบบ">
            เพื่อให้หน่วยงานสำรวจความสมบูรณ์ของรถ และนำรถเข้าเก็บงานก่อนหมดประกัน วันหมดอายุ = วันเริ่ม + จำนวนวันที่รับประกัน
          </Alert>
        </>
      ) : (
        <p className="text-md text-gray-600">งานนี้ไม่มีการรับประกัน ระบบจะไม่แจ้งเตือนก่อนหมดประกัน</p>
      )}
    </div>
  );
}

