/** โครงข้อมูลแผน Overhaul ที่หน้าจอใช้ — ฟีเจอร์รับข้อมูล/callback จากภายนอก ไม่ผูก mock หรือ API */
import type { PlanVehicle } from "../vehicle/types";

export type PlanStatus = "รอเลข Purchase Order" | "รอดำเนินการ" | "เสร็จสิ้น";

/** ประเภทงบประมาณ 5 ค่า (จอ B.3.1 · AC-S1) */
export const BUDGET_TYPES = ["งบทำการ หน่วยงานต้นสังกัด", "งบทำการ หน่วยงานอื่น", "งบลงทุน งานก่อสร้าง", "งบลงทุน งานบำรุงรักษา", "อื่น ๆ (โปรดระบุในหมายเหตุ)"] as const;

export interface PlanFile {
  name: string;
  sizeKb: number;
}

export interface PlanDocs {
  principle: PlanFile[];
  budget: PlanFile[];
  other: PlanFile[];
}

export interface Plan {
  id: string;
  name: string;
  /** ค่าใน BUDGET_TYPES หรือค่าเดิมของข้อมูลเก่า เช่น "งบลงทุน" */
  budgetType: string;
  fiscalYear: number;
  budget: number;
  /** ช่องตามประเภทงบ (B.3.2–B.3.6) — ไม่บังคับทุกช่อง (AC-S1 "(ถ้ามี)") */
  costCenter: string;
  wbs: string;
  network: string;
  activity: string;
  orderNo: string;
  budgetNote: string;
  progress: number | null;
  status: PlanStatus;
  /** dd/mm/yyyy (พ.ศ.) */
  createdAt: string;
  vehicles: PlanVehicle[];
  docs: PlanDocs;
  poCount: number;
}

/** ค่าที่กรอกในฟอร์มสร้าง/แก้ไข (S1 · S2) */
export type PlanDraft = Pick<Plan, "name" | "fiscalYear" | "budget" | "budgetType" | "costCenter" | "wbs" | "network" | "activity" | "orderNo" | "budgetNote" | "vehicles" | "docs">;

/** รหัสงบประมาณที่แสดงใต้ประเภทงบในตาราง (AC หน้า 1 คอลัมน์ 3) */
export const budgetCode = (p: Pick<Plan, "wbs" | "costCenter" | "orderNo">) => p.wbs || p.costCenter || p.orderNo;
