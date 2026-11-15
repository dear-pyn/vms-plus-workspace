/** ตรรกะขั้น 2 ตรวจรับรถ (ไม่ผูก UI) — ส่งคำขอยืนยัน · ผลการยืนยัน · audit log (FigJam Section 12) */
import type { Approval, Intake } from "../po/types";
import type { IntakeDraft } from "./StepIntake";

/** รายการตรวจสอบก่อนซ่อม 7 ข้อ — ยกจากจอ I.1 (ข้อมูลจำลอง · AC-S8 ยังไม่เคาะว่าชุดตายตัวหรือแยกตามประเภทยานพาหนะ) */
export const INTAKE_CHECKS = ["สำเนาคู่มือจดทะเบียนรถ", "กุญแจรถ (ตัวจริง + สำรอง)", "สภาพตัวรถภายนอกและสี", "ระบบไฟส่องสว่างและสัญญาณ", "ยางและล้อ (รวมยางอะไหล่)", "ระดับน้ำมันเครื่องและของเหลว", "เครื่องมือประจำรถ"];

/** ส่งคำขอยืนยันถึง 1 ฝ่าย — หลังถูกปฏิเสธ: ล้างผลรอบก่อนทั้ง 2 ฝ่าย (D-I4 ข้อมูลอาจเปลี่ยน ต้องยืนยันใหม่) */
export function sendIntake(prev: Intake | undefined, side: Approval["side"], d: IntakeDraft, at: string, staffName: string): Intake {
  const reset = !prev || !!prev.rejected;
  const base: Approval[] = (["กบค.", "หน่วยงาน"] as const).map((s) => {
    const old = prev?.approvals.find((a) => a.side === s);
    return reset || !old ? { side: s, staffId: d.staff[s] } : old;
  });
  return {
    date: d.date,
    mileageKm: Number(d.mileage.replace(/,/g, "")),
    checks: d.checks,
    photos: d.photos,
    approvals: base.map((a) => (a.side === side ? { side, staffId: d.staff[side], sentAt: at } : a.sentAt ? a : { ...a, staffId: d.staff[a.side] })),
    log: [...(prev?.log ?? []), { at, who: "กบค. (ผู้ใช้งานปัจจุบัน)", action: `ส่งขอยืนยันการรับมอบถึง ${staffName} (ฝั่ง ${side})` }],
  };
}

export function decideIntake(prev: Intake, staffId: string, approved: boolean, reason: string, at: string, staffName: string): Intake {
  const approvals = prev.approvals.map((a) => (a.staffId === staffId && a.sentAt && !a.result ? { ...a, result: approved ? ("approved" as const) : ("rejected" as const), reason: approved ? undefined : reason, at } : a));
  return {
    ...prev,
    approvals,
    rejected: approved ? prev.rejected : { who: staffName, reason, at },
    log: [...prev.log, { at, who: staffName, action: approved ? "อนุมัติการรับมอบ" : `ปฏิเสธการรับมอบ เหตุผล: ${reason}` }],
  };
}
