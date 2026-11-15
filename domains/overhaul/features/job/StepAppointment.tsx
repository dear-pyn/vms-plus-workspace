"use client";
/** ขั้น 1 การนำรถเข้าอู่ (S7 · จอ OH2 / H.1–H.7) และขั้น 5 นัดรับรถ (S13 · N.1–N.5) — ฟอร์มเดียวกัน ต่างแค่คำ
 *  component: Section header · Text input (วันที่) · Input dropdown พิมพ์ค้น (ผู้ประสานงาน — Dropdown list item มีข้อความรอง "ตำแหน่ง · เบอร์") ·
 *    Text input State=Readonly (เบอร์ผู้ประสานงาน · ข้อมูลอู่จาก Purchase Order) · Text area · Alert Info/Warning/Success · Content item row ·
 *    Secondary button lg "ย้อนกลับ" · Tertiary button "ข้ามขั้นตอน" · Primary button lg "ยืนยันนัดหมาย"
 *  FigJam Section 11/15: ขั้น 1 ข้ามได้ (ยานพาหนะอยู่อู่แล้ว) · ขั้น 5 เพิ่มหมายเหตุ · ข้อความ toast จาก 16-overhaul-toast-notification.md ข้อ 13–16 */
import { useMemo, useState, type ReactNode } from "react";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { Combobox } from "@ui/Combobox";
import { DateField, formatThaiDate, parseThaiDate } from "@ui/DateField";
import { ConfirmDialog } from "@ui/Modal";
import { SectionHeader, ContentItem } from "@ui/PageHeader";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import type { Appointment, Garage, Staff } from "../po/types";

const WORD = {
  1: { section: "นัดหมายนำรถเข้าอู่", from: "นำรถเข้าตั้งแต่วันที่", range: "ช่วงวันนำรถเข้า", garage: "ชื่ออู่" },
  5: { section: "นัดหมายรับรถ", from: "นัดรับรถตั้งแต่วันที่", range: "ช่วงวันนัดรับรถ", garage: "ชื่ออู่ (ค่าตั้งต้นจาก Purchase Order)" },
} as const;

const ROW_COLS = { 2: "grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2", 3: "grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-3", 4: "grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-4" } as const;
export function Row({ items, cols = 4 }: { items: Array<[string, ReactNode]>; cols?: 2 | 3 | 4 }) {
  return (
    <div className={ROW_COLS[cols]}>
      {items.map(([k, v]) => (
        /* Content item row (H.1): หัว 16/600 ดำ · ค่า 16/400 — ของกลาง ContentItem */
        <ContentItem key={k} label={k}>
          {v || "—"}
        </ContentItem>
      ))}
    </div>
  );
}

export function StepAppointment({
  kind, appt, rejected, garage, staff, readOnly, onBack, onSubmit, onSkip, onSimulateReply,
}: {
  kind: 1 | 5;
  appt?: Appointment;
  /** หน่วยงานปฏิเสธ (V3 / V9) */
  rejected?: boolean;
  garage?: Garage;
  staff: Staff[];
  /** ดูย้อนหลัง (ขั้นที่ผ่านไปแล้ว) */
  readOnly?: boolean;
  onBack: () => void;
  onSubmit: (a: Appointment) => Promise<boolean>;
  onSkip: () => void;
  /** ต้นแบบเท่านั้น: จำลองหน่วยงานตอบกลับ (ฝั่งหน่วยงานคือ scene R / S16) */
  onSimulateReply?: (accepted: boolean) => void;
}) {
  const w = WORD[kind];
  const [editing, setEditing] = useState(!appt);
  const init = useMemo(() => ({ from: appt?.from ?? "", to: appt?.to ?? "", coordinatorId: appt?.coordinatorId ?? "", note: appt?.note ?? "" }), [appt]);
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [askSkip, setAskSkip] = useState(false);
  const dirty = editing && JSON.stringify(f) !== JSON.stringify(init);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);
  const coord = staff.find((s) => s.id === (editing ? f.coordinatorId : appt?.coordinatorId));

  function check(k: string, x = f): string {
    const today = new Date(new Date().toDateString());
    if (k === "from") {
      if (!x.from) return "กรุณาเลือกวันที่เริ่ม";
      const d = parseThaiDate(x.from);
      if (!d) return "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)";
      return d < today ? "วันที่เริ่มต้องไม่ก่อนวันนี้" : "";
    }
    if (k === "to") {
      if (!x.to) return "กรุณาเลือกวันที่สิ้นสุด";
      const d = parseThaiDate(x.to);
      if (!d) return "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)";
      const s = parseThaiDate(x.from);
      return s && d < s ? "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม" : "";
    }
    if (k === "coord") return x.coordinatorId ? "" : "กรุณาเลือกผู้ประสานงาน";
    return "";
  }
  async function submit() {
    const e = { from: check("from"), to: check("to"), coord: check("coord") };
    setErr(e);
    if (Object.values(e).some(Boolean)) return;
    setSaving(true);
    const ok = await runSave(() => onSubmit({ ...f, sentAt: formatThaiDate(new Date()) }), (r) => r);
    setSaving(false);
    if (ok) setEditing(false);
  }

  const garageRows: Array<[string, ReactNode]> = [
    [w.garage.replace(" (ค่าตั้งต้นจาก Purchase Order)", ""), garage?.name],
    ["เบอร์อู่", garage?.phone],
    ["ที่อยู่", garage?.address],
  ];

  if (!editing && appt) {
    const waiting = !appt.reply && !rejected;
    return (
      <>
        <section className="flex flex-col gap-4">
          <SectionHeader title={w.section} />
          {!readOnly && waiting && (
            <Alert tone="info" title="รอหน่วยงานเจ้าของยานพาหนะตอบกลับ">
              ส่งนัดหมายแล้ว {appt.sentAt} · แก้ไขนัดหมายได้จนกว่าหน่วยงานจะตอบรับ
            </Alert>
          )}
          {!readOnly && rejected && (
            <Alert tone="warning" title="หน่วยงานปฏิเสธนัดหมาย">
              หมายเหตุ: {appt.reply?.reason || "—"}
            </Alert>
          )}
          {appt.reply?.accepted && <Alert tone="success" title={`หน่วยงานยืนยันนัดหมายแล้ว ${appt.reply.at}`}>{appt.reply.date ? `วันที่หน่วยงานเลือก ${appt.reply.date}` : null}{appt.reply.deliverer ? ` · ผู้นำส่งรถ ${appt.reply.deliverer}` : null}</Alert>}
          <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
            <Row items={[[w.range, `${appt.from} – ${appt.to}`], ["ผู้ประสานงาน (กบค.)", coord?.name], ["เบอร์โทรผู้ประสานงาน (กบค.)", coord?.phone]]} />
            <Row items={garageRows} />
            <Row items={[["หมายเหตุ", appt.note]]} />
          </dl>
          {/* ต้นแบบเท่านั้น (ไม่มีใน Figma): จำลองหน่วยงานตอบกลับ — ย่อเป็นข้อความเล็กไม่เด่น (ฝั่งหน่วยงานจริงอยู่ที่มุมมอง "หน่วยงานเจ้าของยานพาหนะ") */}
          {!readOnly && waiting && onSimulateReply && (
            <p className="flex items-center gap-2 text-xs text-gray-400">
              ต้นแบบ: จำลองหน่วยงานตอบกลับ
              <button type="button" className="underline hover:text-gray-600" onClick={() => onSimulateReply(true)}>
                ตอบรับ
              </button>
              <button type="button" className="underline hover:text-gray-600" onClick={() => onSimulateReply(false)}>
                ปฏิเสธ
              </button>
            </p>
          )}
        </section>
        <div className="flex items-center justify-between gap-3" /* H.5 ไม่มีเส้นคั่น · ปุ่มแก้ไขนัดหมายไม่มีไอคอน */>
          <Button variant="secondary" size="lg" onClick={onBack}>
            ย้อนกลับ
          </Button>
          {!readOnly && !appt.reply?.accepted && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setF(init);
                setErr({});
                setEditing(true);
              }}
            >
              แก้ไขนัดหมาย
            </Button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader title={w.section} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DateField label={w.from} value={f.from} onChange={(v) => setF({ ...f, from: v })} onBlur={() => setErr((e) => ({ ...e, from: check("from") }))} error={err.from || undefined} />
          <DateField label="ถึงวันที่" value={f.to} onChange={(v) => setF({ ...f, to: v })} onBlur={() => setErr((e) => ({ ...e, to: check("to") }))} error={err.to || undefined} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Combobox
            label="ผู้ประสานงาน (กบค.)"
            placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน"
            emptyText="ไม่พบผู้ประสานงาน"
            value={f.coordinatorId}
            onChange={(v) => {
              setF({ ...f, coordinatorId: v });
              setErr((e) => ({ ...e, coord: "" }));
            }}
            options={staff.filter((s) => s.unit === "กบค.").map((s) => ({ value: s.id, label: s.name, sub: `${s.role} · ${s.phone}`, keywords: s.id }))}
            error={err.coord || undefined}
          />
          <TextField label="เบอร์โทรผู้ประสานงาน (กบค.)" readOnly placeholder="แสดงเมื่อเลือกผู้ประสานงาน" value={coord?.phone ?? ""} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <TextField label={w.garage} readOnly value={garage?.name ?? ""} />
          <TextField label="เบอร์อู่" readOnly value={garage?.phone ?? ""} />
          <TextField label="ที่อยู่" readOnly value={garage?.address ?? ""} />
        </div>
        <TextArea label="หมายเหตุ" optional placeholder="ระบุหมายเหตุ" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </section>
      <div className="flex items-center justify-between gap-6" /* H.1 ไม่มีเส้นคั่นเหนือปุ่ม */>
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          ย้อนกลับ
        </Button>
        <div className="flex items-center gap-3">
          {/* FigJam Section 15: ขั้น 5 ไม่มีปุ่มข้ามแล้ว (D-N1) */}
          {!appt && kind === 1 && (
            <Button variant="tertiary" onClick={() => setAskSkip(true)}>
              ข้ามขั้นตอน
            </Button>
          )}
          <Button size="lg" onClick={submit} loading={saving}>
            ยืนยันนัดหมาย
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={askSkip}
        icon="skip_next"
        title="ข้ามขั้นตอนนัดหมาย"
        description={kind === 1 ? "ใช้เมื่อยานพาหนะอยู่ที่อู่แล้ว ไม่ต้องนัดนำเข้าอู่ ระบบจะไปขั้นตรวจรับรถ" : "ใช้เมื่อไม่ต้องนัดรับรถผ่านระบบ ระบบจะไปขั้นปิดงาน"}
        onClose={() => setAskSkip(false)}
        onConfirm={() => {
          setAskSkip(false);
          onSkip();
        }}
      />
      {dialog}
    </>
  );
}
