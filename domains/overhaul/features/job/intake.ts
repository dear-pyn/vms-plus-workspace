/** ตรรกะขั้น 2 ตรวจรับรถ (ไม่ผูก UI)
 *  ภาพ UAT 16 พ.ย. 2569: รายการเอกสารรับรถ + ลงนามการรับมอบรถ → "บันทึกและถัดไป" (แทนการส่งขอยืนยัน 2 ฝ่ายของ FigJam Section 12)
 *  decideIntake ยังเก็บไว้ให้หน้าผู้ยืนยันเดิม (route approve) คอมไพล์ผ่าน — ไม่มีทางเข้าจากขั้น 2 แล้ว */
import type { CheckItem, Intake } from "../po/types";

/** รายการเอกสารรับรถ 13 ข้อ — ยกจากภาพ UAT 16 พ.ย. 2569 (แทนชุด 7 ข้อของจอ I.1) · ข้อที่มี brand/count = แบตเตอรี่ */
export const INTAKE_CHECKS = [
  "แผ่นป้ายทะเบียนหน้า-หลัง",
  "ป้ายทะเบียนติดกระจก และ พรบ.",
  "กระจกมองข้างซ้าย-ขวา, กระจกมองหลัง",
  "ยางอะไหล่",
  "แบตเตอรี่",
  "เครื่องมือประจำรถ, แม่แรง, ประแจถอดล้อ",
  "ฝาถังน้ำมัน",
  "อุปกรณ์บนหน้าปัด, แตร",
  "ใบปัดน้ำฝน",
  "วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ-ส่ง",
  "ระบบไฟส่องสว่าง",
  "สภาพยาง",
  "สภาพตัวถังและสี",
];
export const BATTERY = "แบตเตอรี่";

export const emptyChecks = (): CheckItem[] =>
  INTAKE_CHECKS.map((item) => ({ item, has: null, damaged: false, wrongModel: false, note: "", ...(item === BATTERY ? { brand: "", count: "" } : {}) }));

/** บันทึกได้เมื่อตอบ มี/ไม่มี ครบทุกข้อ + เลือกผู้ส่งมอบและผู้รับมอบแล้ว */
export const intakeComplete = (checks: CheckItem[], delivererId: string, receiverId: string) => checks.every((c) => c.has !== null) && !!delivererId && !!receiverId;

export function decideIntake(prev: Intake, staffId: string, approved: boolean, reason: string, at: string, staffName: string): Intake {
  const approvals = prev.approvals.map((a) => (a.staffId === staffId && a.sentAt && !a.result ? { ...a, result: approved ? ("approved" as const) : ("rejected" as const), reason: approved ? undefined : reason, at } : a));
  return {
    ...prev,
    approvals,
    rejected: approved ? prev.rejected : { who: staffName, reason, at },
    log: [...prev.log, { at, who: staffName, action: approved ? "อนุมัติการรับมอบ" : `ปฏิเสธการรับมอบ เหตุผล: ${reason}` }],
  };
}
