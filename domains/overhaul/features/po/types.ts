/** Purchase Order + งานรายคัน — โครงข้อมูลที่หน้าจอใช้ (ไม่ผูก mock/API)
 *  สถานะงานรายคัน V1–V11 ตาม Diagram/01-บำรุงรักษาตามวาระ/12-overhaul-สถานะ.md (ชื่อ status final เคาะ 30 ต.ค. 2569) */
import type { PillTone } from "@ui/Badge";
import type { PlanFile } from "../plan/types";
import type { PlanVehicle } from "../vehicle/types";

export interface Garage {
  id: string;
  name: string;
  phone: string;
  /** ที่อยู่บรรทัดเดียว (สร้างจาก addr ด้วย formatAddress) — หน้าจอ PO/งานรายคันใช้ค่านี้ */
  address: string;
  /** เมนู อู่/ศูนย์บริการ (19 พ.ย. 2569) — รหัสแสดงผล VND-xxx */
  code?: string;
  email?: string;
  vehicleTypes?: string[];
  brands?: string[];
  addr?: import("../garage/types").GarageAddress;
  lat?: string;
  lng?: string;
  docs?: PlanFile[];
  /** ลบแบบ soft delete — ไม่แสดงในรายการ/ตัวเลือก แต่ PO เดิมยังแสดงชื่อ */
  deleted?: boolean;
}

export interface PODocs {
  /** ใบสั่งจ้าง (บังคับ) */
  order: PlanFile[];
  other: PlanFile[];
}

export interface PurchaseOrder {
  /** รหัสคงรูป "PO-xxxxxx" (FigJam: เปลี่ยนคำ PO → Purchase Order ยกเว้นรหัส) */
  id: string;
  planId: string;
  name: string;
  garageId: string;
  /** dd/mm/yyyy (พ.ศ.) · "" = ยังไม่ระบุ */
  contractStart: string;
  contractEnd: string;
  plates: string[];
  docs: PODocs;
  createdAt: string;
}

export type PODraft = Pick<PurchaseOrder, "name" | "garageId" | "contractStart" | "contractEnd" | "plates" | "docs">;

/** ขั้นของหน้างานรายคัน — จอใช้ "นัดเอารถเข้าอู่" แต่ FigJam Section 11 ให้เปลี่ยนเป็น "การนำรถเข้าอู่" ·
 *  ขั้น 7 "ยืนยันการส่งอนุมัติ" มีในจอ J–P (S15/S20 อนุมัติปิดงาน) */
export const JOB_STEPS = ["การส่งมอบรถ", "ตรวจรับรถ", "ติดตามงานซ่อม", "ตรวจรับงาน", "นัดรับรถ", "ปิดงาน", "ยืนยันการส่งอนุมัติ"] as const;

/** ผู้ประสานงาน / ผู้ลงนาม (กบค. · หน่วยงาน) */
export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  /** "กบค." หรือชื่อสังกัดหน่วยงานเจ้าของยานพาหนะ */
  unit: string;
}

/** นัดหมายขั้น 1 (นำเข้าอู่) / ขั้น 5 (รับรถคืน) */
export interface Appointment {
  from: string;
  to: string;
  coordinatorId: string;
  note: string;
  /** วันที่ส่งนัด dd/mm/yyyy */
  sentAt: string;
  /** หน่วยงานตอบกลับ (S16) */
  reply?: { accepted: boolean; date?: string; deliverer?: string; reason?: string; at: string };
}

export type JobCode = "V1" | "V2" | "V3" | "V4" | "V4.1" | "V5" | "V6" | "V7" | "V8" | "V9" | "V10" | "V10.1" | "V10.2" | "V10.3" | "V11";

export const JOB_STATUS: Record<JobCode, { label: string; step: number; tone: PillTone }> = {
  V1: { label: "รอนัดหมายนำรถเข้าอู่", step: 1, tone: "gray" },
  V2: { label: "รอหน่วยงานตอบรับเข้าอู่", step: 1, tone: "warning" },
  V3: { label: "หน่วยงานปฏิเสธเข้าอู่", step: 1, tone: "error" },
  V4: { label: "หน่วยงานตอบรับเข้าอู่แล้ว", step: 1, tone: "info" },
  "V4.1": { label: "รอตรวจรับรถ", step: 2, tone: "warning" },
  V5: { label: "กำลังซ่อม", step: 3, tone: "info" },
  V6: { label: "อยู่ระหว่างรอตรวจ", step: 4, tone: "warning" },
  V7: { label: "รอนัดหมาย", step: 5, tone: "gray" },
  V8: { label: "รอหน่วยงานตอบรับรถ", step: 5, tone: "warning" },
  V9: { label: "หน่วยงานปฏิเสธรับรถ", step: 5, tone: "error" },
  V10: { label: "หน่วยงานตอบรับรถแล้ว", step: 6, tone: "info" },
  "V10.1": { label: "อยู่ระหว่างปิดงาน", step: 6, tone: "info" },
  /** D-O1 ปิดงานแล้ว รอกดส่งอนุมัติขั้น 7 (จอ P.1 เขียน "รอ ผบช. อนุมัติปิดงาน" — ตัดผู้อนุมัติตาม Refinement 9/11/2026 จึงไม่มีสถานะรอ ผบช.) */
  "V10.2": { label: "รอส่งอนุมัติปิดงาน", step: 7, tone: "warning" },
  /** เจ้าของงาน 17 พ.ย. 2569: กลับมามีผู้อนุมัติ — ส่งอนุมัติแล้วรอผู้อนุมัติ (เมนู "อนุมัติปิดงาน") · อนุมัติ = V11 · ส่งกลับแก้ไข = กลับ V10.2 */
  "V10.3": { label: "รออนุมัติปิดงาน", step: 7, tone: "warning" },
  V11: { label: "ปิดงานแล้ว", step: 7, tone: "success" },
};

/** รูปภาพ (File upload Type=Gallery) — url = object URL ของไฟล์ที่เลือกในต้นแบบ (ไม่มี = ภาพจำลอง แสดงไอคอนแทน) */
export interface Photo {
  name: string;
  sizeKb: number;
  url?: string;
  /** รูปจำลองที่เก็บใน IndexedDB เพื่อเปิดข้ามแท็บ/หลังรีเฟรช */
  assetId?: string;
}

/** ผู้ยืนยันการรับมอบ (FigJam Section 12: เลิกเซ็น → เลือกคน แล้วคนนั้น login เข้ามากด อนุมัติ/ปฏิเสธ · เก็บ audit log) */
export interface Approval {
  /** Unique notification identity, including resends within the same minute. */
  requestId?: string;
  requestedAt?: number;
  side: "กบค." | "หน่วยงาน";
  staffId: string;
  /** วันเวลาที่ส่งคำขอ dd/mm/yyyy HH:mm · ไม่มี = ยังไม่ส่ง */
  sentAt?: string;
  result?: "approved" | "rejected";
  reason?: string;
  /** วันเวลาที่ผู้ยืนยันกด */
  at?: string;
}

/** บันทึกเหตุการณ์ (audit log) ของขั้นที่มีการยืนยัน */
export interface AuditEntry {
  at: string;
  who: string;
  action: string;
}

/** รายการเอกสารรับรถ 1 ข้อ — ภาพ UAT 16 พ.ย. 2569 (ตาราง: รายการ · มี/ไม่มี (Radio) · ชำรุด · ผิดรุ่น (Checkbox) · หมายเหตุ) */
export interface CheckItem {
  item: string;
  /** มี = true · ไม่มี = false · ยังไม่เลือก = null */
  has: boolean | null;
  /** ชำรุด / ผิดรุ่น — เลือกได้เมื่อ "มี" เท่านั้น */
  damaged: boolean;
  wrongModel: boolean;
  note: string;
  /** ข้อ "แบตเตอรี่" — ยี่ห้อ · จำนวน (ลูก) */
  brand?: string;
  count?: string;
}

/** ขั้น 2 ตรวจรับรถ (S8 · scene I) */
/** ขั้น 1 "นำรถเข้า" — ยานพาหนะอยู่อู่แล้ว ไม่นัดหมายกับหน่วยงาน */
export interface DirectIntake {
  /** dd/mm/yyyy (พ.ศ.) */
  date: string;
  /** เลขไมล์ตอนนำรถเข้า — จอ 16 พ.ย. 2569 "ไม่มีการนัดหมาย" ไม่มีช่องนี้แล้ว (ข้อมูลเก่ายังมีได้) */
  mileageKm?: number;
  /** ขั้น 1: ผู้ส่งมอบรถ (พนักงานหน่วยงานที่นำรถมาส่ง · เจ้าของงาน 17 พ.ย. 2569 เดิม "ผู้ประสานงาน (กบค.)") · ขั้น 5: ผู้รับมอบรถ (หน่วยงาน · เดิม "ผู้ประสานงาน (กบค.)") — รหัสพนักงาน */
  coordinatorId: string;
}

export interface Intake {
  /** วันที่รับรถเข้าอู่ dd/mm/yyyy — ระบบใส่จากขั้น 1 (วันที่หน่วยงานเลือก / วันที่นำรถเข้า) หรือวันที่บันทึก */
  date: string;
  mileageKm: number | null;
  /** ชั่วโมงการทำงาน (ชม.) ตอนรับรถ — ไม่บังคับ (เจ้าของงาน 17 พ.ย. 2569) */
  engineHours?: number | null;
  checks: CheckItem[];
  /** ลงนามการรับมอบรถ (ภาพ UAT 16 พ.ย. 2569): ผู้ส่งมอบรถ (หน่วยงาน) · ผู้รับมอบรถ (กบค.) — รหัสพนักงาน */
  delivererId?: string;
  receiverId?: string;
  photos: Photo[];
  approvals: Approval[];
  log: AuditEntry[];
  /** ผู้ยืนยันปฏิเสธล่าสุด (แสดง Alert จนกว่าจะส่งใหม่) */
  rejected?: { who: string; reason: string; at: string };
  confirmedAt?: string;
}

/** ขั้น 3 ความคืบหน้า 1 รายการ (S9–S11 · scene J/K/L) — at = เวลาที่เพิ่ม ระบบใส่ แก้แล้วไม่เปลี่ยน (FigJam Section 13) */
export interface ProgressEntry {
  id: string;
  at: string;
  percent: number;
  detail: string;
  note: string;
}

/** ขั้น 4 ตรวจสภาพ (S12 · scene M) */
export interface Inspection {
  safety: PlanFile[];
  other: PlanFile[];
  photos: Photo[];
  confirmedAt?: string;
}

/** ขั้น 6 อะไหล่ที่ใช้ 1 รายการ (ตาราง O.2: ชื่ออะไหล่ · จำนวน · หน่วย · ราคาต่อหน่วย · ราคารวม) */
export interface PartUsed {
  id: string;
  name: string;
  /** จำนวนที่ใช้ */
  qty: number;
  unit: string;
  /** ราคาต่อหน่วย (บาท) */
  price: number;
  /** รหัสอะไหล่ (Serial number) — แสดงเป็นข้อความรองใต้ชื่ออะไหล่ (Scope 16 พ.ย. 2569) */
  code?: string;
  /** อะไหล่ที่เบิกจากคลัง (SMI): จำนวนที่เบิก — จำนวนที่คืน = เบิก − ใช้ · ไม่มี = กรอกเอง (Input) */
  withdrawn?: number;
  /** จำนวนอะไหล่เก่า (old_part_quantity) */
  oldQty?: number;
  /** หมายเหตุ (SMI กรอกในแถว · Input กรอกใน modal) */
  remark?: string;
}

/** ขั้น 6 อะไหล่ที่เบิกจากคลัง (ตาราง O.5: เบิก · ใช้ · คืน = เบิก − ใช้ · สถานะการคืน) */
export interface StockReturn {
  name: string;
  unit: string;
  withdrawn: number;
  used: number;
  /** หลังปิดงาน: คืน > 0 = "รอคลังรับคืน" (O.6) */
  sent?: boolean;
}

/** ระยะรับประกัน (วัน) — เจ้าของงาน 16 พ.ย. 2569: กรอกตัวเลขเองได้ (เดิมเลือก 90/180/360/720) */
export type WarrantyDays = number;

/** ขั้น 6–7 ปิดงาน + ส่งอนุมัติ (S14 · S15 · S20 · scene O P U) */
export interface CloseOut {
  /** วันที่ส่งมอบรถคืน dd/mm/yyyy */
  returnedAt: string;
  receiver: string;
  body: PartUsed[];
  tools: PartUsed[];
  stock: StockReturn[];
  labor: number | null;
  other: number | null;
  warranty: { on: boolean; start: string; days: WarrantyDays | null };
  closedAt?: string;
  /** ส่งอนุมัติปิดงาน (ขั้น 7) */
  approval?: { sentAt: string; sentBy: string; approverId: string; result?: "approved" | "returned"; reason?: string; at?: string };
  /** ผู้บังคับบัญชาส่งกลับแก้ไข (U.13) — แสดงจนกว่าจะส่งอนุมัติใหม่ */
  returned?: { reason: string; at: string; by: string };
}

/** งานของยานพาหนะ 1 คันใน PO — รายละเอียดแต่ละขั้นเติมใน scene H–P */
export interface VehicleJob {
  poId: string;
  plate: string;
  code: JobCode;
  /** ร้อยละความคืบหน้าล่าสุด (J: เพิ่ม input percent) · ปิดงาน = 100 */
  progress: number;
  /** ข้อความรายละเอียดตามสถานะ 2 บรรทัด (คอลัมน์ "รายละเอียดตามสถานะ" จอ F.4.2) */
  detail: [string, string?];
  /** ขั้น 1 — ไม่มี = ยังไม่นัด · skipped = ข้ามขั้นตอน (FigJam Section 11: ยานพาหนะอยู่อู่แล้ว) */
  appt1?: Appointment;
  skipped1?: boolean;
  /** ขั้น 1 เลือก "นำรถเข้า" (16 พ.ย. 2569): ข้อมูลตอนรับรถเข้าอู่ — ใช้เป็นค่าตั้งต้นของขั้น 2 */
  direct1?: DirectIntake;
  /** ขั้น 2 */
  intake?: Intake;
  /** ขั้น 3 */
  progressLog?: ProgressEntry[];
  /** ขั้น 4 */
  inspection?: Inspection;
  /** ขั้น 5 */
  appt5?: Appointment;
  skipped5?: boolean;
  /** ขั้น 5 เลือก "ไม่มีการนัดหมาย" (16 พ.ย. 2569): วันที่ส่งมอบรถคืน · ผู้รับมอบรถ (หน่วยงาน · เจ้าของงาน 17 พ.ย. 2569 ลบช่อง "ผู้รับรถ (หน่วยงาน)" ที่ซ้ำออก) — ค่าตั้งต้นขั้น 6 */
  direct5?: DirectIntake;
  /** ขั้น 6–7 */
  close?: CloseOut;
}

/** งานรายคัน + PO + อู่ + ยานพาหนะ (หน้าสรุปรายคัน · หน้าฝั่งหน่วยงาน) — ย้ายจาก CloseApproval.tsx ที่ลบไปตามมติตัดผู้อนุมัติ */
export interface PendingClose {
  job: VehicleJob;
  po: PurchaseOrder;
  garage?: Garage;
  vehicle?: PlanVehicle;
}
