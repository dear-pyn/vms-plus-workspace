/** เคสทดสอบต้นแบบ — แผน/PO แยก 1 ชุด ที่มียานพาหนะ 1 คันต่อ 1 สถานะ ให้หน้า "สารบัญเคส" (#/cases) ลิงก์ไปได้ตรงทุกเคส
 *  เจ้าของงานขอ 17 พ.ย. 2569 "มีวิธีไหนที่จะดูทุกเคสได้บ้าง" → แบบที่ 1 (หน้าสารบัญเคสในต้นแบบ) · ⚠ ข้อมูลจำลองทั้งหมด */
import type { Plan } from "../features/plan/types";
import type { JobCode, PurchaseOrder, VehicleJob } from "../features/po/types";
import type { PlanVehicle } from "../features/vehicle/types";

export const CASE_PLAN_ID = "ORZ6999999";
export const CASE_PO_ID = "PO-699999";

export interface CaseDef {
  id: string;
  group: string;
  title: string;
  code: JobCode;
  progress: number;
  detail: [string, string?];
  /** ปรับข้อมูลหลังเติมขั้นที่ผ่านมาแล้ว (enrichJob) — เช่น ถูกปฏิเสธ / ไม่มีการนัดหมาย */
  tweak?: (j: VehicleJob) => VehicleJob;
}

export const CASES: CaseDef[] = [
  { id: "s1-new", group: "ขั้น 1 การนำรถเข้าอู่", title: "ยังไม่นัดหมาย (เลือกนัดหมาย / ไม่มีการนัดหมาย)", code: "V1", progress: 0, detail: ["ยังไม่นัดหมาย"] },
  { id: "s1-wait", group: "ขั้น 1 การนำรถเข้าอู่", title: "ส่งนัดแล้ว รอหน่วยงานตอบกลับ", code: "V2", progress: 0, detail: ["นัดเข้าอู่ 22 – 24/10/2569", "รอหน่วยงานตอบรับ"] },
  {
    id: "s1-reject", group: "ขั้น 1 การนำรถเข้าอู่", title: "หน่วยงานปฏิเสธนัด (แก้นัดแล้วส่งใหม่)", code: "V3", progress: 0, detail: ["หน่วยงานปฏิเสธนัด", "รอแก้นัดหมาย"],
    tweak: (j) => ({ ...j, appt1: { from: "22/10/2569", to: "24/10/2569", coordinatorId: "600201", note: "", sentAt: "19/10/2569", reply: { accepted: false, reason: "ช่วงวันดังกล่าวยานพาหนะออกปฏิบัติงาน (สะดวกช่วง 01/12/2569 - 05/12/2569)", at: "20/10/2569" } } }),
  },
  { id: "s2-wait", group: "ขั้น 2 ตรวจรับรถ", title: "รอตรวจรับรถ (มาจากการนัดหมาย)", code: "V4.1", progress: 0, detail: ["นัดเข้าอู่ 07/10/2569", "รอตรวจรับรถ"] },
  {
    id: "s2-direct", group: "ขั้น 2 ตรวจรับรถ", title: "รอตรวจรับรถ (ขั้น 1 เลือกไม่มีการนัดหมาย)", code: "V4.1", progress: 0, detail: ["นำรถเข้า 05/10/2569", "รอตรวจรับรถ"],
    tweak: (j) => ({ ...j, appt1: undefined, skipped1: true, direct1: { date: "05/10/2569", coordinatorId: "600201" /* ผู้ส่งมอบรถ (หน่วยงาน) */ } }),
  },
  { id: "s3-doing", group: "ขั้น 3 ติดตามงานซ่อม", title: "กำลังซ่อม (ความคืบหน้า 45%)", code: "V5", progress: 45, detail: ["อยู่อู่ 8 วัน", "รับรถ 07/10/2569"] },
  { id: "s3-full", group: "ขั้น 3 ติดตามงานซ่อม", title: "ครบ 100% กดซ่อมสำเร็จได้", code: "V5", progress: 100, detail: ["อยู่อู่ 25 วัน", "รับรถ 07/10/2569"] },
  { id: "s4-wait", group: "ขั้น 4 ตรวจสภาพ", title: "รอตรวจสภาพ", code: "V6", progress: 100, detail: ["ซ่อมเสร็จ 01/11/2569", "รอตรวจสภาพ"] },
  { id: "s5-new", group: "ขั้น 5 นัดรับรถ", title: "ยังไม่นัดรับรถ (เลือกนัดหมาย / ไม่มีการนัดหมาย)", code: "V7", progress: 100, detail: ["ตรวจสภาพ 02/11/2569", "รอนัดหมาย"] },
  { id: "s5-wait", group: "ขั้น 5 นัดรับรถ", title: "ส่งนัดแล้ว รอหน่วยงานตอบกลับ", code: "V8", progress: 100, detail: ["นัดรับรถ 10 – 12/11/2569", "รอหน่วยงานตอบรับ"] },
  {
    id: "s5-reject", group: "ขั้น 5 นัดรับรถ", title: "หน่วยงานปฏิเสธนัดรับรถ", code: "V9", progress: 100, detail: ["หน่วยงานปฏิเสธนัด", "รอแก้นัดหมาย"],
    tweak: (j) => ({ ...j, appt5: { from: "10/11/2569", to: "12/11/2569", coordinatorId: "600202", note: "", sentAt: "05/11/2569", reply: { accepted: false, reason: "ไม่มีพนักงานขับรถไปรับในช่วงนั้น", at: "06/11/2569" } } }),
  },
  { id: "s6-appt", group: "ขั้น 6 ปิดงาน", title: "รอปิดงาน (มาจากการนัดรับรถ)", code: "V10", progress: 100, detail: ["นัดรับรถ 08/11/2569", "รอปิดงาน"] },
  {
    id: "s6-direct", group: "ขั้น 6 ปิดงาน", title: "รอปิดงาน (ขั้น 5 เลือกไม่มีการนัดหมาย)", code: "V10.1", progress: 100, detail: ["ส่งมอบรถคืน 09/11/2569", "รอปิดงาน"],
    tweak: (j) => ({ ...j, appt5: undefined, skipped5: true, direct5: { date: "09/11/2569", coordinatorId: "600201" } }),
  },
  { id: "s7-wait", group: "ขั้น 7 ยืนยันการส่งอนุมัติ", title: "รอส่งอนุมัติปิดงาน", code: "V10.2", progress: 100, detail: ["ส่งมอบรถ 09/11/2569", "รอส่งอนุมัติปิดงาน"] },
  {
    id: "s7-approve", group: "ขั้น 7 ยืนยันการส่งอนุมัติ", title: "ส่งอนุมัติแล้ว รอผู้อนุมัติ (แก้ไขผู้อนุมัติได้)", code: "V10.3", progress: 100, detail: ["ส่งอนุมัติ 10/11/2569", "รอ นายสมชาย ตัวอย่าง อนุมัติ"],
    tweak: (j) => (j.close ? { ...j, close: { ...j.close, approval: { sentAt: "10/11/2569 10:30", sentBy: "กบค. (ผู้ใช้งานปัจจุบัน)", approverId: "500103" } } } : j),
  },
  {
    id: "s7-returned", group: "ขั้น 7 ยืนยันการส่งอนุมัติ", title: "ผู้อนุมัติส่งกลับแก้ไข (ส่งอนุมัติใหม่)", code: "V10.2", progress: 100, detail: ["ผู้อนุมัติส่งกลับแก้ไข", "รอส่งอนุมัติใหม่"],
    tweak: (j) => (j.close ? { ...j, close: { ...j.close, returned: { reason: "ค่าแรงสูงกว่าใบสั่งจ้าง กรุณาตรวจสอบ", at: "11/11/2569 09:15", by: "นายสมชาย ตัวอย่าง" } } } : j),
  },
  { id: "s7-done", group: "ขั้น 7 ยืนยันการส่งอนุมัติ", title: "ปิดงานแล้ว (ดูย้อนหลังทุกขั้น)", code: "V11", progress: 100, detail: ["ปิดงาน 10/11/2569", "ประกันถึง 05/11/2570"] },
];

/** เพิ่มแผน + PO เคสทดสอบต่อท้ายข้อมูลตั้งต้น · ทะเบียนรถไล่จาก fleet ไม่ซ้ำกันในชุดนี้ */
export function seedCases(base: Plan, vehicles: PlanVehicle[], enrich: (j: VehicleJob) => VehicleJob): { plan: Plan; po: PurchaseOrder; jobs: VehicleJob[]; plates: Record<string, string> } {
  const picked = vehicles.slice(0, CASES.length);
  const plates: Record<string, string> = {};
  const jobs = CASES.map((c, i) => {
    plates[c.id] = picked[i].plate;
    const j = enrich({ poId: CASE_PO_ID, plate: picked[i].plate, code: c.code, progress: c.progress, detail: c.detail });
    return c.tweak ? c.tweak(j) : j;
  });
  const plan: Plan = { ...base, id: CASE_PLAN_ID, name: "แผนเคสทดสอบต้นแบบ (ยานพาหนะ 1 คันต่อ 1 สถานะ)", status: "รอดำเนินการ", progress: 50, vehicles: picked, poCount: 1, createdAt: "01/10/2569" };
  const po: PurchaseOrder = { id: CASE_PO_ID, planId: CASE_PLAN_ID, name: "เคสทดสอบทุกสถานะ", garageId: "G01", contractStart: "01/09/2569", contractEnd: "31/12/2569", plates: picked.map((v) => v.plate), docs: { order: [{ name: `ใบสั่งจ้าง-${CASE_PO_ID}.pdf`, sizeKb: 500 }], other: [] }, createdAt: "01/10/2569" };
  return { plan, po, jobs, plates };
}
