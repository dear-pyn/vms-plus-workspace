/** ตรรกะขั้น 2 ตรวจรับรถ (ไม่ผูก UI)
 *  ภาพ UAT 16 พ.ย. 2569: รายการเอกสารรับรถ + ลงนามการรับมอบรถ → "บันทึกและถัดไป" (แทนการส่งขอยืนยัน 2 ฝ่ายของ FigJam Section 12)
 *  17 พ.ย. 2569: "ส่งอนุมัติ" ทีละผู้ลงนาม → แจ้งเตือนให้เซ็นรับทราบจากหน้า route approve (signIntake) */
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

/** ข้อมูลทั้งขั้นต้องครบก่อนส่งให้เซ็น เพื่อไม่ล็อกเอกสารที่ยังไม่สมบูรณ์ */
export function validateIntakeForSign(draft: { mileage: string; hours: string; checks: CheckItem[]; delivererId: string; receiverId: string }): Record<string, string> {
  const errors: Record<string,string> = {};
  const mileage = draft.mileage.trim().replace(/,/g, "");
  if (!mileage) errors.mileage = "กรุณาระบุเลขไมล์ปัจจุบัน";
  else if (!/^\d{1,7}$/.test(mileage)) errors.mileage = "กรุณาระบุเลขไมล์เป็นตัวเลขไม่เกิน 7 หลัก";
  if (draft.hours.trim() && !/^\d{1,6}$/.test(draft.hours.trim().replace(/,/g,""))) errors.hours = "กรุณาระบุชั่วโมงการทำงานเป็นตัวเลขไม่เกิน 6 หลัก";
  if (draft.checks.length !== INTAKE_CHECKS.length || draft.checks.some(c=>c.has!==true&&c.has!==false)) errors.checks = "กรุณาเลือกมีหรือไม่มีให้ครบทุกรายการ";
  const battery = draft.checks.find(c=>c.item===BATTERY);
  if (battery?.has) {
    if (!battery.brand?.trim()) errors.batteryBrand = "กรุณาระบุยี่ห้อแบตเตอรี่";
    if (!battery.count?.trim()) errors.batteryCount = "กรุณาระบุจำนวนแบตเตอรี่";
    else if (!/^\d+$/.test(battery.count) || !Number.isSafeInteger(Number(battery.count)) || Number(battery.count)<1) errors.batteryCount = "กรุณาระบุจำนวนแบตเตอรี่ตั้งแต่ 1 ลูก";
  }
  if (!draft.delivererId) errors.delivererId = "กรุณาเลือกผู้ส่งมอบรถ";
  if (!draft.receiverId) errors.receiverId = "กรุณาเลือกผู้รับมอบรถ (กบค.)";
  return errors;
}

/** ส่งคำขอลงนามสำเร็จแล้ว ล็อกข้อมูลทั้งขั้น 02 ทันที (เจ้าของงาน 18 พ.ย. 2569) */
export const intakeLocked = (intake?: Intake) => !!intake?.approvals.some(a => !!a.sentAt || a.result === "approved");

/** ผู้ลงนามกด "เซ็นลงนาม" (รับทราบอย่างเดียว ไม่มีปฏิเสธ — เจ้าของงาน 17 พ.ย. 2569) */
export function signIntake(prev: Intake, staffId: string, at: string, staffName: string): Intake {
  if (!prev.approvals.some(a => a.staffId === staffId && a.sentAt && !a.result)) return prev;
  return {
    ...prev,
    approvals: prev.approvals.map((a) => (a.staffId === staffId && a.sentAt && !a.result ? { ...a, result: "approved" as const, at } : a)),
    log: [...prev.log, { at, who: staffName, action: "เซ็นลงนามการรับมอบรถ" }],
  };
}
