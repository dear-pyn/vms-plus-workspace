/** โมเดลงานซ่อม (แจ้งซ่อม) + การเปลี่ยนสถานะ
 *  ⚠ การเปลี่ยนสถานะที่เห็นจริงใน UAT (observed 20 พ.ย. 2569):
 *    แจ้งซ่อม → รอหัวหน้าหน่วยงานอนุมัติ → [รับงานซ่อม + ส่งอนุมัติ] → รอหัวหน้า กบค. อนุมัติ
 *    (ขั้นกระบวนการซ่อม) รอตรวจสภาพก่อนซ่อม → ดำเนินการซ่อม → ซ่อมเสร็จ → รอต้นทางยืนยันรับรถ → [ต้นทางยืนยัน] → รอ กบค. ตรวจสภาพหลังซ่อม
 *    → รอ กบค. ส่งรายงานปิดงาน → รออนุมัติปิดงาน → ปิดงาน
 *  ที่เหลือเป็น flow ที่ต้นแบบเติม (STATUSES.evidence = "added") — ทุกจุดรอยืนยันกับ กฟภ. ดู public/content/repair-uat-baseline/review.md */
import type { BudgetType, StatusCode } from "../mock/data";

export type Role = "admin" | "origin" | "unitHead" | "ecd" | "med" | "medHead";
export const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "นาย กบค · admin-super (เหมือน UAT เห็นทุกปุ่ม)" },
  { value: "origin", label: "หน่วยงานต้นทาง / ผู้แจ้งซ่อม" },
  { value: "unitHead", label: "หัวหน้าหน่วยงาน" },
  { value: "ecd", label: "กรย." },
  { value: "med", label: "กบค. (ช่าง/ธุรการ)" },
  { value: "medHead", label: "หัวหน้า กบค." },
];

export interface PartLine { partId: string; qty: number }
export interface Warranty { on: boolean; start: string; days: number | null }
export type DocCheck = { v?: "have" | "none"; broken?: boolean; wrong?: boolean; note?: string };
export interface Appointment { kind: "at_med" | "onsite"; from: string; to: string; mechanicId: string; place: string; sentAt?: string; reply?: { ok: boolean; reason?: string; at: string } }
export interface LogRow { at: string; byId: string; detail: string; note?: string }
/** แจ้งเตือนตามเหตุการณ์ (แบบเดียวกับ Overhaul · UAT งานซ่อมยังไม่มี) */
export interface Notice { id: string; at: string; to: Role; text: string; tone: "success" | "warning" | "error" | "info" | "brand" }
/** บันทึกความคืบหน้าระหว่างซ่อม (ขั้น 4 · แบบ "ติดตามงานซ่อม" ของ Overhaul · To-Be ข้อ 5) */
export interface ProgressRow { at: string; detail: string; pct: number; note?: string }

export interface RepairJob {
  id: string;
  no: string;
  createdAt: string;
  updatedAt: string;
  status: StatusCode;
  plate: string;
  carUsable: boolean;
  /** รูปแบบการซ่อมที่ผู้แจ้งเลือก */
  requestMode: "self" | "med";
  repairParts: ("chassis" | "equipment")[];
  attachments: number;
  budget: { type: BudgetType; costCenter?: string; wbs?: string; network?: string; activity?: string; reason?: string };
  reporterId: string;
  receiverId: string;
  symptoms: string[];
  otherSymptom?: string;
  mileage?: number;
  hours?: number;
  photos: number;
  note?: string;
  requestedParts: PartLine[];
  /** วิธีซ่อมที่ผู้อนุมัติเลือก (เลือกวิธีซ่อม) · med = ซ่อมโดย กบค. · garage = ศูนย์บริการ/อู่ภายนอก */
  method?: "med" | "garage";
  approverId?: string;
  returnReason?: string;
  parts?: { lines: PartLine[]; locked: boolean };
  appt?: Appointment;
  intake?: { docs: Record<number, DocCheck>; battery?: { brand: string; qty: string }; delivererId?: string; receiverId?: string; signed: [boolean, boolean]; check: Record<number, "ok" | "fix">; notes: Record<number, string>; confirmed?: boolean };
  work?: { extra?: boolean; extraText?: string; withdraw?: boolean; extraParts: PartLine[]; extraResult?: "approved" | "rejected"; extraReason?: string; done?: boolean };
  returnAppt?: Appointment;
  post?: { mileage: string; hours: string; check: Record<number, "ok" | "fix">; notes: Record<number, string>; delivererId?: string; receiverId?: string; signed: [boolean, boolean]; score?: number; used: Record<string, number>; confirmed?: boolean };
  close?: { docs: Record<number, "have" | "none" | "na">; files: Record<number, string>; oldParts: Record<string, number>; partNotes: Record<string, string> };
  history: LogRow[];
}

/** ขั้นตอนกระบวนการซ่อม (UAT) */
export const PROCESS_STEPS = ["เบิกอะไหล่", "นัดหมายวันซ่อม", "ตรวจสภาพก่อนซ่อม", "ดำเนินการซ่อม", "นัดหมายวันคืนรถ", "ตรวจสภาพหลังซ่อม", "รายงานปิดงาน"] as const;

/** สถานะที่อยู่ในกระบวนการซ่อมของ กบค. → ขั้นปัจจุบัน (8 = ครบทุกขั้น) */
export function processStep(j: RepairJob): number | null {
  switch (j.status) {
    case "preparing_spare_parts": return j.parts?.locked ? 2 : 1;
    case "waiting_origin_confirm_appointment": return 2;
    case "ready_to_proceed": return 3;
    case "repair_in_progress":
    case "found_additional_symptoms": return 4;
    case "repair_finished":
    case "waiting_origin_confirm_pickup":
    case "waiting_med_reschedule_return": return 5;
    case "waiting_med_post_repair_inspection": return 6;
    case "waiting_med_closing_report":
    case "waiting_closing_approval": return 7;
    case "job_closed": return j.method === "med" && j.intake ? 8 : null;
    default: return null;
  }
}

/** ใครทำงานต่อในสถานะนี้ (ใช้กับตัวเลือก role ของต้นแบบ — admin ทำได้ทุกอย่างเหมือน UAT) */
export const ACTOR: Partial<Record<StatusCode, Role[]>> = {
  waiting_unit_head_approval: ["unitHead"],
  waiting_med_head_approval: ["medHead"],
  waiting_ecd_review: ["ecd"],
  ecd_approved_self_repair: ["origin"],
  returned_for_self_repair: ["origin"],
  self_repair_in_progress: ["origin"],
  waiting_ecd_action: ["ecd"],
  waiting_med_receive: ["med"],
  waiting_med_review: ["med"],
  preparing_spare_parts: ["med"],
  waiting_origin_confirm_appointment: ["origin", "med"],
  ready_to_proceed: ["med"],
  repair_in_progress: ["med"],
  found_additional_symptoms: ["medHead"],
  repair_finished: ["med"],
  waiting_origin_confirm_pickup: ["origin", "med"],
  waiting_med_reschedule_return: ["med"],
  waiting_med_post_repair_inspection: ["med"],
  waiting_med_closing_report: ["med"],
  waiting_closing_approval: ["medHead"],
};
export const canAct = (role: Role, s: StatusCode) => role === "admin" || !!ACTOR[s]?.includes(role);

export function todayBE(d = new Date()) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`;
}
export function nowBE(d = new Date()) {
  return `${todayBE(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export const num = (n?: number | string) => (n === undefined || n === "" ? "-" : Number(n).toLocaleString("en-US"));

