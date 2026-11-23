/** สูตร Dashboard Overhaul — ยกตามต้นแบบ Downloads/Dashboard/dashboard-review (17 พ.ย. 2569)
 *  - ความคืบหน้าแผน = เฉลี่ยความคืบหน้ารายคัน ปัดลง (ขึ้น 100% เมื่อทุกคันครบ 100% เท่านั้น)
 *  - งบต่อคัน = วงเงินอนุมัติ ÷ จำนวนยานพาหนะในแผน
 *  - ค่าใช้จ่ายจริงนับเฉพาะคันที่ปิดงานแล้ว (completed) · คันที่ยังไม่ปิดใช้งบต่อคันเมื่อเทียบราคาซื้อใหม่
 *  - ความคุ้มค่า: Overhaul ไม่เกิน 50% ของราคาซื้อใหม่ = คุ้มค่า · เกิน = ควรพิจารณาซื้อใหม่ (เกณฑ์ต้นแบบ ยังไม่เคาะ) */
import type { PillTone } from "@ui/Badge";
import type { DashPart, DashPlan, DashStatus, DashVehicle } from "../../mock/dashboard";
import type { JobCode, VehicleJob } from "../po/types";
import { costRows } from "../job/close";

export const WORTH_LIMIT = 50;

export const DASH_STEPS = ["การส่งมอบยานพาหนะ", "ตรวจรับยานพาหนะ", "ติดตามงานซ่อม", "ตรวจรับงาน", "นัดรับยานพาหนะ", "ปิดงาน", "ยืนยันการส่งอนุมัติ"];

/** สถานะ → [ชื่อ, ขั้น 1–7 (8 = เสร็จสิ้น), สี Pill] */
export const DASH_STATUS: Record<DashStatus, [string, number, PillTone]> = {
  pending_intake_appointment: ["รอนัดหมายนำยานพาหนะเข้าอู่", 1, "gray"],
  pending_response: ["รอหน่วยงานตอบรับเข้าอู่", 1, "gray"],
  rejected: ["หน่วยงานปฏิเสธเข้าอู่", 1, "error"],
  pending_inspection: ["รอตรวจรับยานพาหนะ", 2, "info"],
  repairing: ["กำลังซ่อม", 3, "info"],
  under_safety_inspection: ["อยู่ระหว่างรอตรวจ", 4, "info"],
  intake_accepted: ["หน่วยงานตอบรับเข้าอู่แล้ว", 1, "info"],
  pending_return_appointment: ["รอนัดหมาย", 5, "warning"],
  pending_return_response: ["รอหน่วยงานตอบรับยานพาหนะ", 5, "warning"],
  return_rejected: ["หน่วยงานปฏิเสธรับยานพาหนะ", 5, "error"],
  closing_in_progress: ["อยู่ระหว่างปิดงาน", 6, "warning"],
  pending_submit_approval: ["รอส่งอนุมัติปิดงาน", 7, "warning"],
  pending_approval: ["รออนุมัติ", 7, "warning"],
  completed: ["เสร็จสิ้น", 8, "success"],
};

export const perCar = (p: DashPlan) => p.approvedBudget / p.carCount;

/** สถานะงานรายคัน (หน้าจัดการงาน Overhaul) → สถานะ Dashboard · "เสร็จสิ้น" = V11 (ผู้อนุมัติกดอนุมัติแล้ว) เท่านั้น */
export const JOB_TO_DASH: Record<JobCode, DashStatus> = {
  V1: "pending_intake_appointment", V2: "pending_response", V3: "rejected", V4: "intake_accepted", "V4.1": "pending_inspection",
  V5: "repairing", V6: "under_safety_inspection", V7: "pending_return_appointment", V8: "pending_return_response", V9: "return_rejected",
  V10: "closing_in_progress", "V10.1": "closing_in_progress", "V10.2": "pending_submit_approval", "V10.3": "pending_approval", V11: "completed",
};

/** บั๊ก 18 พ.ย. 2569 "Dashboard ไม่อัปเดตตามงาน": เดิมใช้ค่าตั้งต้นของ DASH_VEHICLES ตลอด
 *  ตอนนี้ทับสถานะ · ความคืบหน้า · ค่าใช้จ่ายจริง ด้วยงานรายคันจริง (จับคู่ด้วย PO + ทะเบียน)
 *  ค่าใช้จ่ายจริง = "รวมค่าใช้จ่ายทั้งสิ้น" ของขั้น 6 (อะไหล่ตัวรถ + เครื่องมือกล + ค่าแรง + อื่นๆ) นับเมื่อเสร็จสิ้นแล้วเท่านั้น */
export function liveVehicles(base: DashVehicle[], jobs: VehicleJob[]): DashVehicle[] {
  return base.map((v) => {
    const j = jobs.find((x) => x.poId === v.po && x.plate === v.plate);
    if (!j) return v;
    const status = JOB_TO_DASH[j.code];
    const done = status === "completed";
    const c = j.close;
    const parts: DashPart[] | null = done && c ? [...c.body, ...c.tools].map((p) => [p.name, p.code ?? "", p.price, p.qty]) : null;
    const actual = done ? (c ? costRows(c)[4][1] : v.actual) : null;
    return { ...v, status, progress: done ? 100 : j.progress, parts: parts ?? (done ? v.parts : null), actual };
  });
}

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
