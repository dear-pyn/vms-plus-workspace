"use client";
/** ขั้น 2 ตรวจรับรถ — ตามภาพ UAT ที่เจ้าของงานส่ง 16 พ.ย. 2569 (แทนจอ OH2 / I.1–I.7 และการส่งขอยืนยัน 2 ฝ่ายของ FigJam Section 12)
 *  ลำดับ: Section header "รายการเอกสารรับรถ" · Table Alternating fills
 *    (รายการ · มี/ไม่มี = Radio button · ชำรุด/ผิดรุ่น = Checkbox (เลือกได้เมื่อ "มี") · หมายเหตุ = Text input · ข้อแบตเตอรี่มีช่องยี่ห้อ + จำนวน ลูก)
 *  → Section header "ลงนามการรับมอบรถ" · Input dropdown พิมพ์ค้น 2 ช่อง (ผู้ส่งมอบรถ · ผู้รับมอบรถ (กบค.))
 *  → File upload Type=Gallery "รูปสภาพยานพาหนะ (ก่อน Overhaul)" (ตาม I.1 + FigJam Section 12)
 *  → Secondary button lg "ย้อนกลับ" · Primary button lg "บันทึกและถัดไป" (disable จนตอบ มี/ไม่มี ครบทุกข้อ + เลือกผู้ลงนามครบ)
 *  ย้อนดู (ขั้นที่ผ่านแล้ว) = ตารางปิดแก้ไข · ผู้ลงนามเป็น Text input Readonly (ภาพ UAT ชุดแรก)
 *  เจ้าของงานสั่ง 16 พ.ย. 2569: เลขไมล์ย้ายมาจากขั้น 1 ("ไม่มีการนัดหมาย") → ขั้น 2 ช่อง "เลขไมล์ปัจจุบัน (กม.)" บังคับกรอก
 *    วางใต้ Section header "ข้อมูลการรับรถเข้าอู่" ตามโครงจอ OH2 / I.1 (Text input "เลขไมล์ ณ วันรับรถ (กม.)") · ใส่จุลภาคหลักพันอัตโนมัติ · เต็มจำนวนไม่เกิน 7 หลัก
 *  component: Radio button · Checkbox · Text input · Input dropdown (Combobox) · Table — ไฟล์ Component VMS Plus */
import { usePrototypeFill } from "../../prototype/MockTools";
import { useMemo, useRef, useState } from "react";
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Combobox } from "@ui/Combobox";
import { SectionHeader } from "@ui/PageHeader";
import { Radio } from "@ui/Radio";
import { DataTable, Td, Th } from "@ui/Table";
import { TextField } from "@ui/TextField";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import { PhotoUploader } from "../shared/PhotoUploader";
import type { CheckItem, Intake, Staff, Photo } from "../po/types";
import { BATTERY, emptyChecks, intakeComplete, intakeLocked, validateIntakeForSign } from "./intake";
import { GIVER_INFO } from "../shared/messages";

export interface IntakeDraft {
  /** เลขไมล์ปัจจุบัน (กม.) — ข้อความที่มีจุลภาค ("182,400") */
  mileage: string;
  /** ชั่วโมงการทำงาน (ชม.) — ไม่บังคับ ข้อความที่มีจุลภาค */
  hours: string;
  photos: Photo[];
  checks: CheckItem[];
  delivererId: string;
  receiverId: string;
}

export function StepIntake({
  intake, staff, readOnly, onBack, onSave, onSendSign, defaultDeliverer,
}: {
  intake?: Intake;
  /** ขั้น 1 "ไม่มีการนัดหมาย" เลือกผู้ส่งมอบรถไว้แล้ว → ตั้งต้นช่องผู้ส่งมอบรถ (หน่วยงาน) (17 พ.ย. 2569) */
  defaultDeliverer?: string;
  staff: Staff[];
  readOnly?: boolean;
  onBack: () => void;
  /** บันทึกและไปขั้นติดตามงานซ่อม — คืน true เมื่อสำเร็จ */
  onSave: (d: IntakeDraft) => Promise<boolean>;
  /** "เซ็นลงนาม" ให้ผู้ลงนามคนนี้เซ็นรับทราบ (แจ้งเตือน) — คืน true เมื่อสำเร็จ */
  onSendSign: (side: "หน่วยงาน" | "กบค.", staffId: string, draft: IntakeDraft) => Promise<boolean>;
}) {
  const init = useMemo<IntakeDraft>(
    () => ({ mileage: intake?.mileageKm != null ? intake.mileageKm.toLocaleString() : "", hours: intake?.engineHours != null ? intake.engineHours.toLocaleString() : "", photos: intake?.photos ?? [], checks: intake?.checks ?? emptyChecks(), delivererId: intake?.delivererId ?? defaultDeliverer ?? "", receiverId: intake?.receiverId ?? "" }),
    [intake, defaultDeliverer],
  );
  const [f, setF] = useState(init);
  const formRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const locked = !!readOnly || intakeLocked(intake);
  const signerLocked = !!readOnly;
  const delivererSigned = intake?.approvals.some((a) => a.side === "หน่วยงาน" && a.result === "approved");
  const receiverSigned = intake?.approvals.some((a) => a.side === "กบค." && a.result === "approved");
  const shown = locked ? { ...init,
    delivererId: signerLocked || delivererSigned ? init.delivererId : f.delivererId,
    receiverId: signerLocked || receiverSigned ? init.receiverId : f.receiverId,
  } : f;
  usePrototypeFill((mode) => {
    setMileErr(""); setErrors({});
    setF({ mileage: mode === "missing" ? "" : mode === "error" ? "12a" : "182,400", hours: mode === "ready" ? "9,180" : "", photos: f.photos, checks: emptyChecks().map((c, i) => ({ ...c, has: mode === "missing" && i === 0 ? null : true, note: mode === "error" && i === 0 ? "error" : "", ...(c.item === BATTERY ? { brand: "ยี่ห้อจำลอง", count: "2" } : {}) })), delivererId: staff.find((s) => s.unit !== "กบค.")?.id || "", receiverId: staff.find((s) => s.unit === "กบค.")?.id || "" });
  }, !locked && !busy);
  const dirty = (!locked && JSON.stringify(f) !== JSON.stringify(init)) || (!signerLocked && ((!delivererSigned && f.delivererId !== init.delivererId) || (!receiverSigned && f.receiverId !== init.receiverId)));
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? "";
  const [mileErr, setMileErr] = useState("");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const currentErrors = validateIntakeForSign(shown);
  const fieldError = (key: string) => errors[key] ? currentErrors[key] : undefined;
  const checkMileage = (v = shown.mileage) => (!v.trim() ? "กรุณาระบุเลขไมล์ปัจจุบัน" : /^\d{1,7}$/.test(v.replace(/,/g, "")) ? "" : "กรุณาระบุเลขไมล์เป็นตัวเลข");
  /* ลงนาม: ต้องเซ็นครบทั้ง 2 ฝ่าย (ผู้ส่งมอบ + ผู้รับมอบ) ก่อนบันทึกและถัดไป */
  const signedBoth = (["หน่วยงาน", "กบค."] as const).every((side) => intake?.approvals.find((a) => a.side === side)?.result === "approved");
  const ready = intakeComplete(shown.checks, shown.delivererId, shown.receiverId) && !Object.keys(currentErrors).length && signedBoth;

  const patch = (i: number, p: Partial<CheckItem>) => setF((x) => ({ ...x, checks: x.checks.map((c, j) => (j === i ? { ...c, ...p } : c)) }));

  async function requestSign(side: "หน่วยงาน" | "กบค.", staffId: string) {
    if (busy || uploading) return false;
    const next = validateIntakeForSign(shown);
    setErrors(next);
    setMileErr(next.mileage ?? "");
    if (Object.keys(next).length) {
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-intake-error]');
        first?.focus({ preventScroll: true });
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return false;
    }
    setBusy(true);
    try { return await onSendSign(side,staffId,shown); } finally { setBusy(false); }
  }

  async function save() {
    const e = checkMileage();
    setMileErr(e);
    if (e) return;
    setBusy(true);
    await runSave(() => onSave(shown), (r) => r);
    setBusy(false);
  }

  return (
    <div ref={formRef} className="contents">
      <section className="flex flex-col gap-4">
        <SectionHeader title="ข้อมูลการรับรถเข้าอู่" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextField
            label="เลขไมล์ปัจจุบัน (กม.)"
            inputMode="numeric"
            placeholder={locked ? "—" : "ระบุเลขไมล์"}
            readOnly={locked}
            value={shown.mileage}
            onChange={(e) => {
              const n = e.target.value.replace(/[^\d]/g, "").slice(0, 7);
              setF((x) => ({ ...x, mileage: n ? Number(n).toLocaleString() : "" }));
              setMileErr("");
            }}
            onBlur={() => !locked && setMileErr(checkMileage())}
            error={fieldError("mileage") || mileErr || undefined}
          />
          {/* เจ้าของงาน 17 พ.ย. 2569: เพิ่ม "ชั่วโมงการทำงาน" (ถ้ามี) — ยานพาหนะที่มีมิเตอร์ชั่วโมง (เครน/กระเช้า) · ตัวเลขเต็ม ใส่จุลภาค ไม่เกิน 6 หลัก
              component: `Text input` ของไลบรารี (TextField optional) แบบเดียวกับเลขไมล์ */}
          <TextField
            label="ชั่วโมงการทำงาน (ชม.)"
            error={fieldError("hours")}
            optional
            inputMode="numeric"
            placeholder={locked ? "—" : "ระบุชั่วโมงการทำงาน"}
            readOnly={locked}
            value={shown.hours}
            onChange={(e) => {
              const n = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
              setF((x) => ({ ...x, hours: n ? Number(n).toLocaleString() : "" }));
            }}
          />
        </div>
      </section>

      {/* รูปก่อน Overhaul = ส่วนที่ 2 ต่อจากข้อมูลการรับรถเข้าอู่ (เจ้าของงาน 17 พ.ย. 2569 · เดิม OH2 I.1 วางหลังส่วนรับมอบ) · File upload Type=Gallery ตาม FigJam Section 12 */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="รูปสภาพยานพาหนะก่อน Overhaul" />
        <PhotoUploader label="รูปสภาพยานพาหนะก่อน Overhaul" optional photos={shown.photos} readOnly={locked} disabled={busy} onBusyChange={setUploading} onChange={(photos) => setF((prev) => ({ ...prev, photos }))} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="รายการเอกสารรับรถ" />
        {fieldError("checks") && <p tabIndex={-1} data-intake-error className="text-sm text-error-600">{fieldError("checks")}</p>}
        <DataTable label="รายการเอกสารรับรถ" striped>
          <thead>
            <tr>
              <Th>รายการ</Th>
              <Th className="w-28">มี</Th>
              <Th className="w-28">ไม่มี</Th>
              <Th className="w-28">ชำรุด</Th>
              <Th className="w-28">ผิดรุ่น</Th>
              <Th className="w-80">หมายเหตุ</Th>
            </tr>
          </thead>
          <tbody>
            {shown.checks.map((c, i) => (
              <tr key={c.item}>
                <Td>
                  {c.item === BATTERY ? (
                    /* ภาพ UAT: "5. แบตเตอรี่ยี่ห้อ [ระบุยี่ห้อ] จำนวน [ระบุจำนวน] ลูก" */
                    <span className="flex flex-wrap items-center gap-2">
                      {i + 1}. {c.item}ยี่ห้อ
                      <TextField aria-label="ยี่ห้อแบตเตอรี่" placeholder="ระบุยี่ห้อ" error={fieldError("batteryBrand")} className="w-28" readOnly={locked} value={c.brand ?? ""} onChange={(e) => patch(i, { brand: e.target.value })} />
                      จำนวน
                      <TextField aria-label="จำนวนแบตเตอรี่" placeholder="ระบุจำนวน" error={fieldError("batteryCount")} inputMode="numeric" className="w-32" readOnly={locked} value={c.count ?? ""} onChange={(e) => patch(i, { count: e.target.value.replace(/\D/g, "") })} />
                      ลูก
                    </span>
                  ) : (
                    `${i + 1}. ${c.item}`
                  )}
                </Td>
                <Td>
                  <Radio name={`has-${i}`} label={`มี ${c.item}`} checked={c.has === true} disabled={locked} onChange={() => patch(i, { has: true })} />
                </Td>
                <Td>
                  {/* ไม่มี → ล้างชำรุด/ผิดรุ่น (เลือกได้เฉพาะของที่มี) */}
                  <Radio name={`has-${i}`} label={`ไม่มี ${c.item}`} checked={c.has === false} disabled={locked} onChange={() => patch(i, { has: false, damaged: false, wrongModel: false })} />
                </Td>
                <Td>
                  <Checkbox label={`ชำรุด ${c.item}`} checked={c.damaged} disabled={locked || c.has !== true} onChange={(v) => patch(i, { damaged: v })} />
                </Td>
                <Td>
                  <Checkbox label={`ผิดรุ่น ${c.item}`} checked={c.wrongModel} disabled={locked || c.has !== true} onChange={(v) => patch(i, { wrongModel: v })} />
                </Td>
                <Td>
                  <TextField aria-label={`หมายเหตุ ${c.item}`} placeholder="ระบุหมายเหตุ" readOnly={locked} value={c.note} onChange={(e) => patch(i, { note: e.target.value })} />
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="ลงนามการรับมอบรถ" />
        {/* กระดานเจ้าของงาน 17 พ.ย. 2569 (ต่อผู้ลงนาม 1 คน):
            ① ยังไม่เลือก = ช่องเปิด (placeholder) · ปุ่ม "เซ็นลงนาม" ปิด
            ② เลือกแล้ว = ช่องเปิด · "เซ็นลงนาม" เปิด → แจ้งเตือนให้คนนั้นเซ็นรับทราบจากหน้าเซ็นลงนาม
            ③ ส่งแล้ว = ช่องปิด · ปุ่ม "แก้ไข" เปิด (ยังไม่เซ็น → กลับไป ②) · เซ็นแล้ว (Confirm) = ช่องปิด + Pill "เซ็นลงนามแล้ว" ไม่มีแก้ไข
            component: Input dropdown (Combobox · disabled) · Secondary button md · `Pill outline` Success/Warning — ไฟล์ Component VMS Plus · ภาพ UAT handover sign */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Signer label="ผู้ส่งมอบรถ" info={GIVER_INFO} error={fieldError("delivererId")} side="หน่วยงาน" unit="หน่วยงาน" value={shown.delivererId} onChange={(v) => setF((x) => ({ ...x, delivererId: v }))} intake={intake} staff={staff} locked={signerLocked} allowSend={!readOnly} onSend={requestSign} blocked={busy || uploading} />
          <Signer label="ผู้รับมอบรถ (กบค.)" error={fieldError("receiverId")} side="กบค." unit="กบค." value={shown.receiverId} onChange={(v) => setF((x) => ({ ...x, receiverId: v }))} intake={intake} staff={staff} locked={signerLocked} allowSend={!readOnly} onSend={requestSign} blocked={busy || uploading} />
        </div>
      </section>


      <div className="flex flex-wrap items-center justify-between gap-3" /* ภาพ UAT ไม่มีเส้นคั่น */>
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          ย้อนกลับ
        </Button>
        {!readOnly && (
          <Button size="lg" disabled={!ready || uploading} loading={busy} onClick={save}>
            บันทึกและถัดไป
          </Button>
        )}
      </div>
      {dialog}
    </div>
  );
}

/** ผู้ลงนาม 1 คน — สถานะ ①②③ ตามกระดานเจ้าของงาน 17 พ.ย. 2569 */
function Signer({ label, info, side, unit, value, onChange, intake, staff, locked, allowSend, onSend, error, blocked }: {
  label: string;
  info?: { title: string; text: string };
  side: "หน่วยงาน" | "กบค.";
  unit: string;
  value: string;
  onChange: (v: string) => void;
  intake?: Intake;
  staff: Staff[];
  locked: boolean;
  allowSend: boolean;
  error?: string;
  blocked?: boolean;
  onSend: (side: "หน่วยงาน" | "กบค.", staffId: string) => Promise<boolean>;
}) {
  const sent = intake?.approvals.find((a) => a.side === side);
  /* ข้อมูลเดิมก่อนมีการเซ็นลงนาม (ไม่มีรายการ แต่บันทึกขั้น 2 แล้ว) = ถือว่าเซ็นแล้ว */
  const signed = sent?.result === "approved" || (!sent && !!intake?.confirmedAt);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = !locked && !signed && (!sent || editing);
  const canSend = !signed && allowSend && (open || !sent);
  async function send() {
    if (busy || blocked || !value) return;
    setBusy(true);
    try { if (await onSend(side, value)) setEditing(false); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <Combobox
        className="w-full"
        minChars={3}
        label={label}
        info={info}
        error={error}
        placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน"
        emptyText="ไม่พบรายชื่อ"
        disabled={!open || busy || blocked}
        value={value}
        onChange={onChange}
        options={staff.filter((s) => s.unit === unit).map((s) => ({ value: s.id, label: s.name, sub: `${s.id} · ${s.role}`, keywords: s.id }))}
      />
      {signed ? (
        <Pill tone="success">เซ็นลงนามแล้ว</Pill>
      ) : canSend ? (
        <Button variant="secondary" disabled={blocked || !value} loading={busy} onClick={() => void send()}>
          เซ็นลงนาม
        </Button>
      ) : sent ? (
        <div className="flex flex-wrap items-center gap-3">
          {!locked && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              แก้ไข
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
