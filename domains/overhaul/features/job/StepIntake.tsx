"use client";
/** ขั้น 2 ตรวจรับรถ (S8 · จอ OH2 / I.1–I.7)
 *  component: Section header · Text input (วันที่รับรถเข้าอู่ · เลขไมล์ ณ วันรับรถ) · Table Alternating fills (Checkbox + ผลตรวจ Pill outline Success "ผ่าน" + หมายเหตุ) ·
 *    Input dropdown (ผู้ยืนยันฝั่ง กบค. / หน่วยงานเจ้าของรถ) · Secondary button md (เดิม "เซ็น" → "ส่งขอยืนยัน") · Badge outline (สถานะการยืนยัน — นอกตารางจึงไม่ใช้ pill) ·
 *    File upload Type=Gallery (รูปสภาพรถ) · Alert · Secondary button lg "ย้อนกลับ" · Primary button lg "ยืนยันรับรถ"
 *  FigJam Section 12 (refinement 12 พ.ย. 2569) แทนจอ: ไม่มีการเซ็น → เลือกคนให้ login เข้ามา อนุมัติ/ปฏิเสธ (audit log) · ส่งแล้ว disable ส่วนรายการเอกสารรับรถ ·
 *    รูปภาพแบบงานซ่อม ไม่จำกัดจำนวน 10 MB/ไฟล์ "จำนวน n ไฟล์" */
import { useMemo, useState } from "react";
import { Alert } from "@ui/Alert";
import { OutlineBadge, Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Combobox } from "@ui/Combobox";
import { DateField, parseThaiDate } from "@ui/DateField";
import { SectionHeader } from "@ui/PageHeader";
import { DataTable, Td, Th } from "@ui/Table";
import { TextField } from "@ui/TextField";
import { PhotoUploader } from "../shared/PhotoUploader";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import type { Approval, CheckItem, Intake, Staff } from "../po/types";
import { Row } from "./StepAppointment";
import { INTAKE_CHECKS } from "./intake";


const SIDES = [
  { side: "กบค.", label: "ผู้ยืนยันฝั่ง กบค." },
  { side: "หน่วยงาน", label: "ผู้ยืนยันฝั่งหน่วยงานเจ้าของยานพาหนะ" },
] as const;

export function approvalBadge(a?: Approval) {
  if (!a?.sentAt) return null;
  if (a.result === "approved") return <OutlineBadge tone="success">อนุมัติแล้ว {a.at}</OutlineBadge>;
  if (a.result === "rejected") return <OutlineBadge tone="error">ปฏิเสธ {a.at}</OutlineBadge>;
  return <OutlineBadge tone="gray">รอยืนยัน · ส่งแล้ว {a.sentAt}</OutlineBadge>;
}

export interface IntakeDraft {
  date: string;
  mileage: string;
  checks: CheckItem[];
  photos: Intake["photos"];
  staff: Record<"กบค." | "หน่วยงาน", string>;
}

export function StepIntake({
  intake, defaultDate, staff, readOnly, onBack, onSend, onConfirm, onOpenApproval,
}: {
  intake?: Intake;
  /** วันที่หน่วยงานเลือกตอนตอบรับนัด (ขั้น 1) · ข้ามนัดหมาย = "" (จอ I.6) */
  defaultDate: string;
  staff: Staff[];
  readOnly?: boolean;
  onBack: () => void;
  /** ส่งคำขอยืนยันถึงผู้ยืนยัน 1 ฝ่าย (บันทึกข้อมูลรับรถ ณ ตอนส่ง) */
  onSend: (side: "กบค." | "หน่วยงาน", d: IntakeDraft) => Promise<boolean>;
  onConfirm: () => Promise<boolean>;
  /** ต้นแบบ: เปิดหน้าผู้ยืนยัน (ระบบจริงผู้ยืนยัน login แล้วเข้าจากกระดิ่งแจ้งเตือน) */
  onOpenApproval: (staffId: string) => void;
}) {
  const init = useMemo<IntakeDraft>(
    () => ({
      date: intake?.date ?? defaultDate,
      mileage: intake?.mileageKm != null ? String(intake.mileageKm) : "",
      checks: intake?.checks ?? INTAKE_CHECKS.map((item) => ({ item, ok: false, note: "" })),
      photos: intake?.photos ?? [],
      staff: { "กบค.": intake?.approvals.find((a) => a.side === "กบค.")?.staffId ?? "", หน่วยงาน: intake?.approvals.find((a) => a.side === "หน่วยงาน")?.staffId ?? "" },
    }),
    [intake, defaultDate],
  );
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>("");
  const approvals = intake?.approvals ?? [];
  const ap = (side: string) => approvals.find((a) => a.side === side);
  /** FigJam: ส่งให้ผู้ยืนยันแล้ว → disable ส่วนรายการเอกสารรับรถ (ปลดเมื่อถูกปฏิเสธ — ระบบล้างคำขอให้ส่งใหม่ D-I4) */
  const rejected = !!intake?.rejected;
  const sentLive = (side: string) => !rejected && !!ap(side)?.sentAt;
  const locked = readOnly || (!rejected && approvals.some((a) => a.sentAt));
  const bothApproved = !rejected && SIDES.every((s) => ap(s.side)?.result === "approved");
  const dirty = !locked && JSON.stringify(f) !== JSON.stringify(init);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);
  const name = (id: string) => staff.find((s) => s.id === id)?.name;

  function check(k: string, x = f): string {
    if (k === "date") {
      if (!x.date) return "กรุณาเลือกวันที่รับรถเข้าอู่";
      const d = parseThaiDate(x.date);
      if (!d) return "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)";
      return d > new Date() ? "วันที่รับรถเข้าอู่ต้องไม่เกินวันนี้" : "";
    }
    if (k === "mileage") {
      if (!x.mileage.trim()) return "กรุณาระบุเลขไมล์";
      return /^\d{1,7}$/.test(x.mileage.replace(/,/g, "")) ? "" : "กรุณาระบุเลขไมล์เป็นตัวเลข";
    }
    if (k === "กบค." || k === "หน่วยงาน") return x.staff[k] ? "" : "กรุณาเลือกผู้ยืนยัน";
    return "";
  }
  async function send(side: "กบค." | "หน่วยงาน") {
    const e = { ...err, date: check("date"), mileage: check("mileage"), [side]: check(side) };
    setErr(e);
    if (e.date || e.mileage || e[side]) return;
    setBusy(side);
    await runSave(() => onSend(side, f), () => false);
    setBusy("");
  }
  async function confirm() {
    setBusy("confirm");
    await onConfirm();
    setBusy("");
  }

  const table = (
    <DataTable label="รายการตรวจสอบก่อนซ่อม" striped>
      <thead>
        <tr>
          <Th>รายการตรวจสอบ</Th>
          <Th className="w-36">ผลตรวจ</Th>
          <Th>หมายเหตุ</Th>
        </tr>
      </thead>
      <tbody>
        {f.checks.map((c, i) => (
          <tr key={c.item}>
            <Td>
              {locked ? (
                <span>{c.item}</span>
              ) : (
                <div className="flex items-center gap-3">
                  <Checkbox checked={c.ok} label={c.item} onChange={(v) => setF({ ...f, checks: f.checks.map((x, j) => (j === i ? { ...x, ok: v } : x)) })} />
                  <span>{c.item}</span>
                </div>
              )}
            </Td>
            <Td>{c.ok ? <Pill tone="success">ผ่าน</Pill> : "—"}</Td>
            <Td>
              {locked ? (
                c.note || "—"
              ) : (
                <TextField aria-label={`หมายเหตุ ${c.item}`} placeholder="ระบุหมายเหตุ" value={c.note} onChange={(e) => setF({ ...f, checks: f.checks.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} />
              )}
            </Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );

  return (
    <>
      {!readOnly && intake?.rejected && (
        <Alert tone="warning" title={`${intake.rejected.who} ปฏิเสธการรับมอบยานพาหนะ`}>
          เหตุผล: {intake.rejected.reason} · แก้ไขข้อมูลแล้วส่งขอยืนยันใหม่ทั้ง 2 ฝ่าย
        </Alert>
      )}
      {!readOnly && intake?.confirmedAt && <Alert tone="success" title={`ยืนยันรับรถแล้ว ${intake.confirmedAt}`} />}
      <section className="flex flex-col gap-4">
        <SectionHeader title="ข้อมูลการรับรถเข้าอู่" />
        {locked ? (
          <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
            <Row items={[["วันที่รับรถเข้าอู่", f.date], ["เลขไมล์ ณ วันรับรถ (กม.)", f.mileage ? Number(f.mileage).toLocaleString() : ""]]} />
          </dl>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <DateField label="วันที่รับรถเข้าอู่" value={f.date} onChange={(v) => setF({ ...f, date: v })} onBlur={() => setErr((e) => ({ ...e, date: check("date") }))} error={err.date || undefined} />
            <TextField
              label="เลขไมล์ ณ วันรับรถ (กม.)"
              placeholder="ระบุเลขไมล์"
              inputMode="numeric"
              value={f.mileage}
              onChange={(e) => setF({ ...f, mileage: e.target.value })}
              onBlur={() => setErr((e) => ({ ...e, mileage: check("mileage") }))}
              error={err.mileage || undefined}
            />
          </div>
        )}
      </section>
      <section className="flex flex-col gap-4">
        <SectionHeader title="รายการตรวจสอบก่อนซ่อม" />
        {table}
      </section>
      {/* I.1 ลำดับตามจอ: ผู้ยืนยัน (เดิม "ลงนามรับรถ") ก่อนรูปสภาพ */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="ผู้ยืนยันการรับมอบยานพาหนะ" description="ผู้ที่เลือกจะได้รับแจ้งเตือนให้เข้าระบบมาอนุมัติหรือปฏิเสธการรับมอบ" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {SIDES.map(({ side, label }) => {
            const a = ap(side);
            return (
              <div key={side} className="flex flex-col gap-3">
                {sentLive(side) || readOnly ? (
                  <dl className="flex flex-col gap-1">
                    <dt className="text-sm text-gray-600">{label}</dt>
                    <dd className="text-md text-black">{name(a?.staffId ?? f.staff[side]) ?? "—"}</dd>
                  </dl>
                ) : (
                  <Combobox
                    label={label}
                    placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน"
                    emptyText="ไม่พบรายชื่อ"
                    value={f.staff[side]}
                    onChange={(v) => {
                      setF({ ...f, staff: { ...f.staff, [side]: v } });
                      setErr((e) => ({ ...e, [side]: "" }));
                    }}
                    options={staff.filter((s) => (side === "กบค." ? s.unit === "กบค." : s.unit === "หน่วยงาน")).map((s) => ({ value: s.id, label: s.name, sub: s.role, keywords: s.id }))}
                    error={err[side] || undefined}
                  />
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {(!rejected || a?.result === "rejected") && approvalBadge(a)}
                  {!readOnly && !sentLive(side) && (
                    <Button variant="secondary" iconLeft="send" loading={busy === side} onClick={() => send(side)}>
                      ส่งขอยืนยัน
                    </Button>
                  )}
                </div>
                {a?.result === "rejected" && a.reason && <span className="text-sm text-gray-600">เหตุผล: {a.reason}</span>}
              </div>
            );
          })}
        </div>
        {!readOnly && !rejected && approvals.some((a) => a.sentAt && !a.result) && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-600">
            ต้นแบบ: เปิดหน้าผู้ยืนยัน (ระบบจริงผู้ยืนยันเข้าจากแจ้งเตือน)
            {approvals
              .filter((a) => a.sentAt && !a.result)
              .map((a) => (
                <Button key={a.side} size="sm" variant="secondary" onClick={() => onOpenApproval(a.staffId)}>
                  {name(a.staffId)}
                </Button>
              ))}
          </div>
        )}
      </section>
      <section className="flex flex-col gap-4">
        <SectionHeader title="รูปสภาพยานพาหนะ (ก่อน Overhaul)" />
        <PhotoUploader label="รูปสภาพยานพาหนะ" optional photos={f.photos} readOnly={locked} onChange={(p) => setF({ ...f, photos: p })} />
      </section>
      {intake?.log.length ? (
        <section className="flex flex-col gap-4">
          <SectionHeader title="ประวัติการยืนยัน" />
          <DataTable label="ประวัติการยืนยัน" striped>
            <thead>
              <tr>
                <Th>วันที่และเวลา</Th>
                <Th>ผู้ดำเนินการ</Th>
                <Th>การดำเนินการ</Th>
              </tr>
            </thead>
            <tbody>
              {intake.log.map((l, i) => (
                <tr key={i}>
                  <Td className="whitespace-nowrap">{l.at}</Td>
                  <Td>{l.who}</Td>
                  <Td>{l.action}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3" /* จอไม่มีเส้นคั่น */>
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          ย้อนกลับ
        </Button>
        {!readOnly && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {!bothApproved && <span className="text-sm text-gray-600">ยืนยันรับรถได้เมื่อผู้ยืนยันทั้ง 2 ฝ่ายอนุมัติแล้ว</span>}
            <Button size="lg" disabled={!bothApproved} loading={busy === "confirm"} onClick={confirm}>
              ยืนยันรับรถ
            </Button>
          </div>
        )}
      </div>
      {dialog}
    </>
  );
}
