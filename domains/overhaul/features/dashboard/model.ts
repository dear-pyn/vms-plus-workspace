/** สูตร Dashboard Overhaul — ยกตามต้นแบบ Downloads/Dashboard/dashboard-review (17 พ.ย. 2569)
 *  - ความคืบหน้าแผน = เฉลี่ยความคืบหน้ารายคัน ปัดลง (ขึ้น 100% เมื่อทุกคันครบ 100% เท่านั้น)
 *  - งบต่อคัน = วงเงินอนุมัติ ÷ จำนวนยานพาหนะในแผน
 *  - ค่าใช้จ่ายจริงนับเฉพาะคันที่ปิดงานแล้ว (completed) · คันที่ยังไม่ปิดใช้งบต่อคันเมื่อเทียบราคาซื้อใหม่
 *  - ความคุ้มค่า: Overhaul ไม่เกิน 50% ของราคาซื้อใหม่ = คุ้มค่า · เกิน = ควรพิจารณาซื้อใหม่ (เกณฑ์ต้นแบบ ยังไม่เคาะ) */
import type { PillTone } from "@ui/Badge";
import type { DashPlan, DashStatus, DashVehicle } from "../../mock/dashboard";

export const WORTH_LIMIT = 50;

export const DASH_STEPS = ["นัดหมายนำยานพาหนะเข้าอู่", "ตรวจรับยานพาหนะ", "ติดตามงานซ่อม", "ตรวจสภาพ", "นัดรับยานพาหนะ", "ปิดงาน", "ยืนยันการส่งอนุมัติ"];

/** สถานะ → [ชื่อ, ขั้น 1–7 (8 = เสร็จสิ้น), สี Pill] */
export const DASH_STATUS: Record<DashStatus, [string, number, PillTone]> = {
  pending_intake_appointment: ["รอนัดหมายนำยานพาหนะเข้าอู่", 1, "gray"],
  pending_response: ["รอหน่วยงานตอบรับเข้าอู่", 1, "gray"],
  rejected: ["หน่วยงานปฏิเสธเข้าอู่", 1, "error"],
  pending_inspection: ["รอตรวจรับยานพาหนะ", 2, "info"],
  repairing: ["กำลังซ่อม", 3, "info"],
  under_safety_inspection: ["อยู่ระหว่างรอตรวจ", 4, "info"],
  pending_return_appointment: ["รอนัดหมาย", 5, "warning"],
  return_rejected: ["หน่วยงานปฏิเสธรับยานพาหนะ", 5, "error"],
  closing_in_progress: ["อยู่ระหว่างปิดงาน", 6, "warning"],
  pending_approval: ["รออนุมัติ", 7, "warning"],
  completed: ["เสร็จสิ้น", 8, "success"],
};

export const perCar = (p: DashPlan) => p.approvedBudget / p.carCount;

export interface DashRow extends DashVehicle {
  p: DashPlan;
  per: number;
  /** ค่าที่ใช้เทียบราคาซื้อใหม่: จริงถ้าปิดงานแล้ว ไม่งั้นงบต่อคัน */
  cost: number;
  ratio: number;
  worth: boolean;
  done: boolean;
}

export function toRows(vehicles: DashVehicle[], plans: DashPlan[]): DashRow[] {
  return vehicles.flatMap((x) => {
    const p = plans.find((q) => q.id === x.plan);
    if (!p) return [];
    const per = perCar(p);
    const cost = x.actual ?? per;
    const ratio = (cost / x.newPrice) * 100;
    return [{ ...x, p, per, cost, ratio, worth: ratio <= WORTH_LIMIT, done: x.status === "completed" }];
  });
}

export const planProgress = (rows: DashRow[]) => (rows.length ? Math.floor(rows.reduce((s, x) => s + x.progress, 0) / rows.length) : 0);

export function summarize(rows: DashRow[]) {
  const done = rows.filter((x) => x.done);
  const actual = done.reduce((s, x) => s + (x.actual ?? 0), 0);
  const save = done.reduce((s, x) => s + (x.per - (x.actual ?? 0)), 0);
  const oh = rows.reduce((s, x) => s + x.cost, 0);
  const nw = rows.reduce((s, x) => s + x.newPrice, 0);
  return {
    total: rows.length,
    done: done.length,
    pending: rows.length - done.length,
    pct: planProgress(rows),
    actual,
    save,
    saveAvg: done.length ? save / done.length : null,
    actualAvg: done.length ? actual / done.length : null,
    oh,
    nw,
    ratio: nw ? Math.round((oh / nw) * 100) : 0,
    rebuy: rows.filter((x) => !x.worth).length,
  };
}

/** แบ่งกลุ่มสถานะ: เสร็จแล้ว / อยู่ระหว่างดำเนินการ / ยังไม่เข้าอู่ (ขั้น 1) */
export function groups(rows: DashRow[]) {
  const done = rows.filter((x) => x.done).length;
  const wait = rows.filter((x) => DASH_STATUS[x.status][1] === 1).length;
  return { done, inProgress: rows.length - done - wait, wait };
}

export const pctOf = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
