"use client";
/** ขั้น 1 การนำรถเข้าอู่ (S7 · จอ OH2 / H.1–H.7) และขั้น 5 นัดรับรถ (S13 · N.1–N.5) — ฟอร์มเดียวกัน ต่างแค่คำ
 *  component: Section header · Text input (วันที่) · Input dropdown พิมพ์ค้น (ผู้ประสานงาน — Dropdown list item มีข้อความรอง "ตำแหน่ง · เบอร์") ·
 *    Text input State=Readonly (เบอร์ผู้ประสานงาน · ข้อมูลอู่จาก Purchase Order) · Alert Info/Warning/Success · Content item row ·
 *    Secondary button lg "ย้อนกลับ" · Primary button lg "ยืนยัน" (16 พ.ย. 2569: ตัดปุ่ม "ข้ามขั้นตอน" · เดิม "ยืนยันนัดหมาย")
 *  FigJam Section 11/15: ขั้น 1 ข้ามได้ (ยานพาหนะอยู่อู่แล้ว) · ขั้น 5 เพิ่มหมายเหตุ · ข้อความ toast จาก 16-overhaul-toast-notification.md ข้อ 13–16
 *  เจ้าของงานสั่ง 16 พ.ย. 2569: ขั้น 1 (ยังไม่ส่งนัด) มี Radio text card ให้เลือก "นัดหมาย" / "นำรถเข้า" ใต้ "รายละเอียดการนัดหมาย" แทนปุ่ม "ข้ามขั้นตอน"
 *    นัดหมาย (ค่าตั้งต้น) = ฟอร์มนัดเดิม · นำรถเข้า = ซ่อนช่องนัด · ปุ่มหลัก "ยืนยัน" → ไปขั้นตรวจรับรถทันที (ไม่มี Modal ยืนยัน) (onSkip เดิม) */
import { usePrototypeFill } from "../../prototype/MockTools";
import { mockDate } from "../../prototype/fixtures";
import { useMemo, useState, type ReactNode } from "react";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { Combobox } from "@ui/Combobox";
import { DateField, DateRangeField, formatThaiDate, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { RadioCard } from "@ui/RadioCard";
import { SectionHeader, ContentItem } from "@ui/PageHeader";
import { TextField } from "@ui/TextField";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import type { Appointment, DirectIntake, Garage, Staff } from "../po/types";

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
  kind, appt, rejected, garage, staff, readOnly, past, onBack, onSubmit, onSkip, onSimulateReply,
}: {
  kind: 1 | 5;
  appt?: Appointment;
  /** หน่วยงานปฏิเสธ (V3 / V9) */
  rejected?: boolean;
  garage?: Garage;
  staff: Staff[];
  /** อ่านอย่างเดียว (ขั้นที่ผ่านไปแล้ว หรือมุมมองดูอย่างเดียวของหน่วยงาน S17) */
  readOnly?: boolean;
  /** ย้อนกลับมาดูขั้นที่ผ่านไปแล้ว — ใช้หน้าตาแบบ UAT (รายละเอียดการนัดหมาย) */
  past?: boolean;
  onBack: () => void;
  onSubmit: (a: Appointment) => Promise<boolean>;
  /** ขั้น 1 เลือก "นำรถเข้า" — ส่งวันที่ · เลขไมล์ปัจจุบัน · ผู้ประสานงาน (กบค.) */
  onSkip: (d: DirectIntake) => void;
  /** ต้นแบบเท่านั้น: จำลองหน่วยงานตอบกลับ (ฝั่งหน่วยงานคือ scene R / S16) */
  onSimulateReply?: (accepted: boolean) => void;
}) {
  const w = WORD[kind];
  /* เจ้าของงาน 16 พ.ย. 2569 (ภาพ UAT): ยังไม่ส่ง / ถูกปฏิเสธ = ฟอร์มกรอกได้ ค่าตั้งต้นจากนัดเดิม ·
     ส่งนัดแล้วรอตอบรับ = หน้ารอตอบกลับ (กด "แก้ไขนัดหมาย" แล้วเป็นฟอร์ม) · ตอบรับแล้ว / ย้อนดู / มุมมองดูอย่างเดียว = อ่านอย่างเดียว */
  const waiting = !!appt && !appt.reply && !rejected;
  const [editMode, setEditMode] = useState(false);
  const editing = !past && !readOnly && !appt?.reply?.accepted && (!waiting || editMode);
  const init = useMemo(() => ({ from: appt?.from ?? "", to: appt?.to ?? "", coordinatorId: appt?.coordinatorId ?? "", note: appt?.note ?? "" }), [appt]);
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  /** ยังไม่ส่งนัด: เลือกได้ว่าจะนัดหมาย หรือไม่มีการนัดหมาย — ขั้น 1 และขั้น 5 (เจ้าของงาน 16 พ.ย. 2569: ขั้น 5 เหมือนขั้น 1 · ไม่ใช่การข้ามขั้น แต่เป็นอีกวิธี — แทน D-N1) */
  const canDirect = !appt;
  /* ภาพเจ้าของงาน 16 พ.ย. 2569: เปิดหน้ามายังไม่เลือก — ปุ่ม "ยืนยัน" ปิดจนกว่าจะเลือก */
  const [mode, setMode] = useState<"" | "appt" | "direct">(canDirect ? "" : "appt");
  const direct = canDirect && mode === "direct";
  const [dx, setDx] = useState({ date: "", receiverId: "" });
  /** เปลี่ยนรูปแบบ = ล้างค่าเก่าทั้งหมด (วันที่ · ผู้ประสานงาน · error) — เจ้าของงาน 16 พ.ย. 2569 */
  const pickMode = (m: "appt" | "direct") => {
    if (m === mode) return;
    setMode(m);
    setF({ from: "", to: "", coordinatorId: "", note: "" });
    setDx({ date: "", receiverId: "" });
    setErr({});
  };
  usePrototypeFill((preset) => {
    const coordinatorId = staff.find((s) => s.unit === "กบค.")?.id || "";
    setErr({});
    if (direct) {
      setDx({ date: preset === "error" ? "99/99/2569" : mockDate(), receiverId: preset === "missing" ? "" : staff.find((s) => s.unit === "หน่วยงาน")?.id || "" });
      setF((x) => ({ ...x, coordinatorId: preset === "missing" ? "" : coordinatorId }));
    } else {
      if (!mode) setMode("appt"); // ยังไม่เลือกรูปแบบ → Mock เลือก "นัดหมาย" ให้ (17 พ.ย. 2569)
      setF({ from: mockDate(), to: mockDate(), coordinatorId: preset === "missing" ? "" : coordinatorId, note: preset === "error" ? "error — ทดสอบบันทึกไม่สำเร็จ" : "ข้อมูลนัดหมายจำลอง" });
    }
  }, editing && !saving);
  const dayWord = kind === 1 ? "วันที่นำรถเข้า" : "วันที่ส่งมอบรถคืน";
  function checkDirect(x = dx): string {
    if (!x.date) return `กรุณาเลือก${dayWord}`;
    const d = parseThaiDate(x.date);
    if (!d) return "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)";
    return d > new Date() ? `${dayWord}ต้องไม่หลังวันนี้` : "";
  }
  function submitDirect() {
    /* "ไม่มีการนัดหมาย" (ภาพ 16 พ.ย. 2569): วันที่นำรถเข้า 1 วัน + ผู้ประสานงาน · ไม่มีช่องเลขไมล์ · ไม่มี Modal ยืนยัน → ไปขั้นตรวจรับรถทันที */
    const e = { range: checkDirect(), coord: check("coord"), receiver: kind === 5 && !dx.receiverId ? "กรุณาเลือกผู้รับรถ (หน่วยงาน)" : "" };
    setErr((x) => ({ ...x, ...e }));
    if (!Object.values(e).some(Boolean)) onSkip({ date: dx.date, coordinatorId: f.coordinatorId, ...(kind === 5 ? { receiverId: dx.receiverId } : {}) });
  }
  const dirty = editing && (JSON.stringify(f) !== JSON.stringify(init) || mode === "direct");

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
    const e = { range: check("from") || check("to"), coord: check("coord") };
    setErr(e);
    if (Object.values(e).some(Boolean)) return;
    setSaving(true);
    const ok = await runSave(() => onSubmit({ ...f, sentAt: formatThaiDate(new Date()) }), (r) => r);
    setSaving(false);
    if (ok) setEditMode(false);
  }

  /* ดูย้อนหลัง (ขั้นที่ผ่านไปแล้ว) — เจ้าของงานส่งภาพ UAT 16 พ.ย. 2569 "หน้า step 1 แบบย้อนกลับมาดูจะเป็นแบบนี้":
     Section header "รายละเอียดการนัดหมาย" · กล่องเทา Content item row 3 ช่อง (อู่ · เบอร์อู่ · ที่อยู่) ·
     Text input Readonly 3 ช่อง (ช่วงวัน · ผู้ประสานงาน · เบอร์ผู้ประสานงาน) · ไม่มี Alert และไม่มีปุ่มท้ายหน้า */
  /* ข้อมูลนัดหมายแบบ UAT — ใช้ทั้งตอนย้อนดูและตอนส่งนัดแล้ว (รอตอบรับ / ตอบรับแล้ว / ถูกปฏิเสธ) */
  const summary = appt && (
    <>
      <dl className="rounded-lg bg-gray-50 p-6">
        <Row cols={3} items={[["ศูนย์บริการ/อู่", garage?.name], ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone], ["ที่อยู่", garage?.address]]} />
      </dl>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <TextField label={w.range} readOnly value={`${appt.from} - ${appt.to}`} />
        <TextField label="ผู้ประสานงาน (กบค.)" readOnly value={coord?.name ?? ""} />
        <TextField label="เบอร์โทรผู้ประสานงาน (กบค.)" readOnly value={coord?.phone ?? ""} />
      </div>
    </>
  );

  if (past && appt) {
    return (
      <section className="flex flex-col gap-6">
        <SectionHeader title="รายละเอียดการนัดหมาย" />
        {summary}
      </section>
    );
  }

  /* ภาพ UAT 16 พ.ย. 2569 "ยืนยันนัดหมายแล้ว ต้องปรับเป็นหน้ารอตอบกลับ": ข้อมูลอู่ + Empty state "รอตอบกลับจากหน่วยงาน" ·
     ปุ่ม แก้ไขนัดหมาย (Secondary) อย่างเดียว */
  if (waiting && !editMode && !past && !readOnly && appt) {
    return (
      <section className="flex flex-col gap-6">
        <SectionHeader title="รายละเอียดการนัดหมาย" />
        <dl className="rounded-lg bg-gray-50 p-6">
          <Row cols={3} items={[["ศูนย์บริการ/อู่", garage?.name], ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone], ["ที่อยู่", garage?.address]]} />
        </dl>
        <EmptyState
          kind="data-empty"
          title="รอตอบกลับจากหน่วยงาน"
          action={
            /* เจ้าของงาน 16 พ.ย. 2569: มีปุ่มแก้ไขอย่างเดียว — ปุ่มปฏิเสธ/ตอบรับในภาพ UAT เป็น mock ของทีม dev (หน่วยงานตอบจากมุมมองหน่วยงาน S16) */
            <Button variant="secondary" size="lg" onClick={() => { setF(init); setErr({}); setEditMode(true); }}>
              แก้ไขนัดหมาย
            </Button>
          }
        />
      </section>
    );
  }

  if (!editing && appt) {
    return (
      <>
        <section className="flex flex-col gap-6">
          <SectionHeader title="รายละเอียดการนัดหมาย" />
          {/* เจ้าของงาน 16 พ.ย. 2569: ไม่แสดง Alert "รอหน่วยงานเจ้าของยานพาหนะตอบกลับ" (UAT ไม่มี · สถานะอยู่ที่ป้ายบนหัวหน้าแล้ว) */}
          {!readOnly && rejected && (
            <Alert tone="warning" title="หน่วยงานปฏิเสธนัดหมาย">
              หมายเหตุ: {appt.reply?.reason || "—"}
            </Alert>
          )}
          {appt.reply?.accepted && <Alert tone="success" title={`หน่วยงานยืนยันนัดหมายแล้ว ${appt.reply.at}`}>{appt.reply.date ? `วันที่หน่วยงานเลือก ${appt.reply.date}` : null}{appt.reply.deliverer ? ` · ผู้นำส่งรถ ${appt.reply.deliverer}` : null}</Alert>}
          {summary}
        </section>
        <div className="flex items-center justify-between gap-3" /* H.5 ไม่มีเส้นคั่น */>
          <Button variant="secondary" size="lg" onClick={onBack}>
            ย้อนกลับ
          </Button>
        </div>
      </>
    );
  }

  /* ขั้น 1 ตามภาพเจ้าของงาน 16 พ.ย. 2569 (3 สถานะ: ยังไม่เลือก · นัดหมาย · ไม่มีการนัดหมาย):
     Section header "รูปแบบการนำรถเข้าอู่" + Radio text card 2 ใบ · Section header "รายละเอียดการนำรถเข้า" + กล่องเทาข้อมูลอู่ ·
     แถว 3 ช่อง: ช่วงเวลาที่นำรถเข้า (นัดหมาย = ช่วงวัน · ไม่มีการนัดหมาย = วันเดียว) · ผู้ประสานงาน (Input dropdown) · เบอร์โทรศัพท์ผู้รับมอบรถ (ระบบเติมให้)
     ขั้น 5 / แก้นัดที่ส่งแล้ว ใช้คำเดิม ("รายละเอียดการนัดหมาย" · ผู้ประสานงาน (กบค.)) */
  const L = kind === 1
    ? { mode: "รูปแบบการนำรถเข้าอู่", apptDesc: "หน่วยงานนัดหมายกับเจ้าของรถก่อนนำรถเข้า", directDesc: "กรณีที่รถถึงอู่ก่อนมีการนัดหมาย", detail: "รายละเอียดการนำรถเข้า", range: "ช่วงเวลาที่นำรถเข้า", day: "ช่วงเวลาที่นำรถเข้า", coord: "ผู้ประสานงาน", phone: "เบอร์โทรศัพท์ผู้รับมอบรถ" }
    : { mode: "รูปแบบการรับรถคืน", apptDesc: "นัดหน่วยงานมารับรถที่อู่", directDesc: "หน่วยงานรับรถคืนแล้ว หรือส่งคืนโดยไม่ต้องนัด", detail: "รายละเอียดการรับรถคืน", range: "ช่วงเวลาที่นัดรับรถ", day: "วันที่ส่งมอบรถคืน", coord: "ผู้ประสานงาน", phone: "เบอร์โทรศัพท์ผู้ประสานงาน" };
  const receiver = staff.find((s) => s.id === dx.receiverId);
  return (
    <>
      {canDirect && (
        <section className="flex flex-col gap-6">
          <SectionHeader title={L.mode} />
          {/* Radio text card (ไฟล์ Component · สูง 81 p16 r8) — ความกว้างตามภาพเจ้าของงาน 16 พ.ย. 2569: การ์ดละ 370px เว้น 20px (วัดเทียบเนื้อหา 1296) · จอแคบเรียงลงเต็มกว้าง */}
          <div role="radiogroup" aria-label={L.mode} className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(2,minmax(0,370px))]">
            <RadioCard name="intake-mode" checked={mode === "appt"} onChange={() => pickMode("appt")} title="นัดหมาย" description={L.apptDesc} />
            <RadioCard name="intake-mode" checked={mode === "direct"} onChange={() => pickMode("direct")} title="ไม่มีการนัดหมาย" description={L.directDesc} />
          </div>
        </section>
      )}
      <section className="flex flex-col gap-6">
        <SectionHeader title={L.detail} />
        {rejected && (
          <Alert tone="warning" title="หน่วยงานปฏิเสธนัดหมาย">
            หมายเหตุ: {appt?.reply?.reason || "—"}
          </Alert>
        )}
        <dl className="rounded-lg bg-gray-50 p-6">
          <Row cols={3} items={[["ศูนย์บริการ/อู่", garage?.name], ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone], ["ที่อยู่", garage?.address]]} />
        </dl>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {direct ? (
            <DateField
              label={L.day}
              max={new Date()} /* เกิดขึ้นแล้ว — ห้ามเป็นวันในอนาคต */
              value={dx.date}
              onChange={(v) => { setDx((x) => ({ ...x, date: v })); setErr((e) => ({ ...e, range: "" })); }}
              onBlur={() => setErr((e) => ({ ...e, range: checkDirect() }))}
              error={err.range || undefined}
            />
          ) : (
            <DateRangeField
              label={L.range}
              min={new Date()} /* D-H2 วันเริ่มต้องไม่ก่อนวันนี้ — ปิดวันในอดีตในปฏิทิน */
              from={f.from}
              to={f.to}
              onChange={(from, to) => setF((x) => ({ ...x, from, to }))}
              onBlur={() => setErr((e) => ({ ...e, range: check("from") || check("to") }))}
              error={err.range || undefined}
            />
          )}
          <Combobox
            minChars={3}
            label={L.coord}
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
          <TextField label={L.phone} autoFilled placeholder="แสดงเมื่อเลือกผู้ประสานงาน" value={coord?.phone ?? ""} />
        </div>
        {/* ขั้น 5 "ไม่มีการนัดหมาย": ต้องรู้ว่าใครรับรถไป (เจ้าของงาน 16 พ.ย. 2569 — บังคับ) */}
        {kind === 5 && direct && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Combobox
              minChars={3}
              label="ผู้รับรถ (หน่วยงาน)"
              placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน"
              emptyText="ไม่พบรายชื่อ"
              value={dx.receiverId}
              onChange={(v) => { setDx((x) => ({ ...x, receiverId: v })); setErr((e) => ({ ...e, receiver: "" })); }}
              options={staff.filter((s) => s.unit === "หน่วยงาน").map((s) => ({ value: s.id, label: s.name, sub: s.role, keywords: s.id }))}
              error={err.receiver || undefined}
            />
            <TextField label="เบอร์โทรศัพท์ผู้รับรถ" autoFilled placeholder="แสดงเมื่อเลือกผู้รับรถ" value={receiver?.phone ?? ""} />
          </div>
        )}
      </section>
      <div className="flex items-center justify-between gap-6" /* H.1 ไม่มีเส้นคั่นเหนือปุ่ม */>
        {/* แก้นัดที่ส่งแล้ว: ย้อนกลับ = กลับหน้ารอตอบกลับ (ไม่บันทึก) */}
        <Button variant="secondary" size="lg" onClick={() => (editMode ? setEditMode(false) : requestLeave())}>
          ย้อนกลับ
        </Button>
        {/* ปุ่มเดียว "ยืนยัน" — นัดหมาย = ส่งนัด · ไม่มีการนัดหมาย = ไปขั้นตรวจรับรถทันที · ยังไม่เลือกรูปแบบ = ปิด */}
        <Button size="lg" disabled={!mode} onClick={direct ? submitDirect : submit} loading={saving}>
          ยืนยัน
        </Button>
      </div>
      {dialog}
    </>
  );
}
