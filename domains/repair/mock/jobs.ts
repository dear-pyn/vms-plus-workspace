/** งานซ่อมตั้งต้นของต้นแบบ "ตาม UAT" — เฉพาะ 10 สถานะที่มีงาน/หน้าจอจริงใน UAT (20 พ.ย. 2569) + งานเพิ่มให้รายการมีหลายหน้า · ค่าสมมติทั้งหมด */
import type { RepairJob } from "../features/model";
import { INSPECT_ITEMS, INTAKE_DOCS, VEHICLES, type StatusCode } from "./data";

const all = <T,>(n: number, v: T) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, v])) as Record<number, T>;

function base(i: number, status: StatusCode, plate: string, day: number): RepairJob {
  const v = VEHICLES.find((x) => x.plate === plate)!;
  const zone = "ZCABF"[i % 5];
  const d = `${String(day).padStart(2, "0")}/11/2569`;
  return {
    id: `job-${i}`,
    no: `RR${zone}69${String(100 + i).padStart(5, "0")}`,
    createdAt: d,
    updatedAt: d,
    status,
    plate,
    carUsable: i % 4 !== 0,
    requestMode: i % 3 === 0 ? "self" : "med",
    repairParts: v.crane ? ["chassis", "equipment"] : [],
    attachments: 0,
    budget: i % 2 ? { type: "invest", wbs: `WB${200 + i}`, network: `${300 + i}`, activity: `${10 + i}` } : { type: "own" },
    reporterId: "p1",
    receiverId: "p2",
    symptoms: ["ดุมล้อมีน้ำมันรั่ว (อะไหล่ที่ใช้ต่อข้าง)", "เบรควิ้นซ์"],
    mileage: v.mileage,
    hours: v.hours,
    photos: 0,
    requestedParts: i % 2 ? [{ partId: "a2", qty: 1 }] : [],
    history: [{ at: `${d} 09:${String(10 + (i % 40)).padStart(2, "0")}`, byId: "p1", detail: "แจ้งซ่อม" }],
  };
}

/** เติมข้อมูลของขั้นที่ผ่านแล้ว ให้กดดูย้อนหลังได้ */
function upTo(j: RepairJob, step: number): RepairJob {
  if (step > 1) j.parts = { lines: [{ partId: "a1", qty: 1 }, { partId: "a2", qty: 2 }, { partId: "a6", qty: 1 }], locked: true };
  if (step > 2) j.appt = { kind: "at_med", from: "01/11/2569", to: "02/11/2569", mechanicId: "p4", place: "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9", sentAt: j.createdAt, reply: { ok: true, at: j.createdAt } };
  if (step > 3) j.intake = { docs: all(INTAKE_DOCS.length, { v: "have" }), battery: { brand: "GS", qty: "2" }, delivererId: "p6", receiverId: "p4", signed: [true, true], check: all(INSPECT_ITEMS.length, "ok"), notes: {}, confirmed: true };
  if (step > 4) j.work = { extra: false, extraParts: [], done: true };
  if (step > 5) j.returnAppt = { kind: "at_med", from: "12/11/2569", to: "13/11/2569", mechanicId: "p4", place: "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9", sentAt: j.createdAt, reply: { ok: true, at: j.createdAt } };
  if (step > 6) j.post = { mileage: String((j.mileage ?? 0) + 30), hours: String((j.hours ?? 0) + 4), check: all(INSPECT_ITEMS.length, "ok"), notes: {}, delivererId: "p4", receiverId: "p6", signed: [true, true], score: 5, used: { a1: 1, a2: 1, a6: 1 }, confirmed: true };
  j.method = "med";
  j.approverId = "p7";
  return j;
}

export function seedJobs(): RepairJob[] {
  const plates = VEHICLES.map((v) => v.plate);
  const P = (i: number) => plates[i % plates.length];
  const out: RepairJob[] = [];
  let i = 0;
  const add = (st: StatusCode, fill?: (j: RepairJob) => RepairJob) => {
    const j = base(i, st, P(i), 1 + (i % 19));
    out.push(fill ? fill(j) : j);
    i++;
  };
  add("waiting_unit_head_approval", (j) => ({ ...j, requestMode: "self", attachments: 1 }));
  add("waiting_med_head_approval", (j) => ({ ...j, approverId: "p7", history: [...j.history, { at: `${j.createdAt} 10:00`, byId: "p3", detail: "รับงานซ่อม · ส่งอนุมัติเพื่อเปิดงานซ่อม" }] }));
  /* UAT: อนุมัติแล้วไป "รอตรวจสภาพก่อนซ่อม" ทันที (ขั้น 1–2 ล็อก ไม่มีข้อมูลเบิก/นัด) */
  add("ready_to_proceed", (j) => ({ ...j, method: "med", approverId: "p7" }));
  add("repair_in_progress", (j) => upTo(j, 4));
  add("repair_finished", (j) => upTo(j, 5));
  add("waiting_origin_confirm_pickup", (j) => ({ ...upTo(j, 5), returnAppt: { kind: "at_med", from: "28/11/2569", to: "28/11/2569", mechanicId: "p4", place: "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9", sentAt: j.createdAt } }));
  add("waiting_med_post_repair_inspection", (j) => upTo(j, 6));
  add("waiting_med_closing_report", (j) => upTo(j, 7));
  add("waiting_closing_approval", (j) => ({ ...upTo(j, 7), close: { docs: { ...all(12, "none" as const), 12: "na", 13: "na", 14: "na" }, files: {}, oldParts: { a1: 1 }, partNotes: {} } }));
  add("job_closed", (j) => ({ ...upTo(j, 7), close: { docs: all(15, "na" as const), files: {}, oldParts: {}, partNotes: {} } }));
  /* UAT: งานที่ปิดแล้วแบบอู่ภายนอกไม่มีแท็บกระบวนการซ่อม */
  add("job_closed", (j) => ({ ...j, method: "garage" }));
  for (let k = 0; k < 14; k++) add(k % 3 ? "waiting_unit_head_approval" : "waiting_med_closing_report", (j) => (k % 3 ? j : upTo(j, 7)));
  /* วันที่สร้างไล่จากใหม่ไปเก่า (งานแรกในอาร์เรย์ = ใหม่สุด) */
  return out.map((j, k) => {
    const d = `${String(Math.max(1, 19 - Math.floor(k / 2))).padStart(2, "0")}/11/2569`;
    return { ...j, createdAt: d, updatedAt: d, history: j.history.map((h, n) => (n === 0 ? { ...h, at: `${d} ${h.at.slice(-5)}` } : h)) };
  });
}
