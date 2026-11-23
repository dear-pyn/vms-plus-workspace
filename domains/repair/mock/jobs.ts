/** งานซ่อมตั้งต้นของต้นแบบ — 1 งานต่อทุกสถานะ (24) + งานเพิ่มให้รายการมีหลายหน้า · ค่าสมมติทั้งหมด */
import type { RepairJob } from "../features/model";
import { INSPECT_ITEMS, INTAKE_DOCS, STATUSES, VEHICLES, type StatusCode } from "./data";

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
  if (step > 3) j.intake = { docs: all(INTAKE_DOCS.length, { v: "have" }), battery: { brand: "GS", qty: "2" }, delivererId: "p6", receiverId: "p4", signed: [true, true], check: all(INSPECT_ITEMS.length, "ok"), notes: {}, confirmed: true, photos: 4 };
  if (step > 4) j.work = { extra: false, extraParts: [], done: true };
  if (step > 3) j.progress = [
    { at: `${j.createdAt} 10:30`, detail: "ถอดชุดดุมล้อ ตรวจซีลรั่ว", pct: 40 },
    ...(step > 4 ? [{ at: `${j.createdAt} 15:00`, detail: "เปลี่ยนลูกปืนและซีล ทดสอบเบรค", pct: 100, note: "ทดลองขับแล้วปกติ" }] : []),
  ];
  if (step > 5) j.returnAppt = { kind: "at_med", from: "12/11/2569", to: "13/11/2569", mechanicId: "p4", place: "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9", sentAt: j.createdAt, reply: { ok: true, at: j.createdAt } };
  if (step > 6) j.post = { mileage: String((j.mileage ?? 0) + 30), hours: String((j.hours ?? 0) + 4), check: all(INSPECT_ITEMS.length, "ok"), notes: {}, delivererId: "p4", receiverId: "p6", signed: [true, true], score: 5, used: { a1: 1, a2: 1, a6: 1 }, confirmed: true, photos: 2, signedAt: j.createdAt, warranty: { on: true, start: j.createdAt, days: 180 } };
  j.method = "med";
  j.approverId = "p7";
  return j;
}

export function seedJobs(): RepairJob[] {
  const plates = VEHICLES.map((v) => v.plate);
  const P = (i: number) => plates[i % plates.length];
  const out: RepairJob[] = [];
  let i = 0;
  const add = (s: StatusCode, fill?: (j: RepairJob) => RepairJob) => {
    const j = base(i, s, P(i), 1 + (i % 19));
    out.push(fill ? fill(j) : j);
    i++;
  };

  /* ก่อนเข้ากระบวนการซ่อม */
  /* ซ่อมศูนย์บริการ/อู่ · ราคาประเมินเกิน 30% ของมูลค่าสินทรัพย์ (45,000 บาท) → เตือนพิจารณาจำหน่าย */
  add("waiting_unit_head_approval", (j) => ({ ...j, requestMode: "self", estimate: "18500", requestGarageId: "G03", attachments: 1 }));
  add("waiting_med_head_approval", (j) => ({ ...j, approverId: "p7", method: "med", estimateDetail: { method: "med", parts: 420, labor: "3,500.00", other: "", total: 3920 }, history: [...j.history, { at: `${j.createdAt} 10:00`, byId: "p3", detail: "รับงานซ่อม · ส่งอนุมัติเพื่อเปิดงานซ่อม" }] }));
  add("waiting_ecd_review");
  add("ecd_approved_self_repair", (j) => ({ ...j, method: "garage", estimateDetail: { method: "garage", parts: 0, labor: "", other: "", total: 6500 } }));
  add("waiting_ecd_action", (j) => ({ ...j, method: "ecd", estimateDetail: { method: "ecd", parts: 0, labor: "1,200.00", other: "", total: 1200 } }));
  add("waiting_med_receive", (j) => ({ ...j, history: [...j.history, { at: `${j.createdAt} 11:00`, byId: "p2", detail: "กรย อนุมัติ · ซ่อมโดย กบค." }] }));
  add("waiting_med_review");
  add("returned_for_self_repair", (j) => ({ ...j, returnReason: "อาการเสียเล็กน้อย หน่วยงานซ่อมเองได้" }));
  add("self_repair_in_progress", (j) => ({ ...j, method: "garage", requestGarageId: "G03", external: { garageId: "G03", garage: "อู่ตัวอย่าง นครปฐม", doneDate: "", cost: "", mileage: "", files: 0, stage: 2, inDate: j.createdAt, inMileage: String(j.mileage ?? 0), inPhotos: 2, quoteFiles: 1, quote: "6,500.00" }, progress: [{ at: `${j.createdAt} 14:00`, detail: "อู่ถอดตรวจระบบเบรก รออะไหล่", pct: 30 }] }));
  add("not_approved", (j) => ({ ...j, returnReason: "ยานพาหนะอยู่ระหว่างรอจำหน่าย" }));
  /* กระบวนการซ่อม */
  add("preparing_spare_parts", (j) => ({ ...j, method: "med", approverId: "p7" }));
  add("preparing_spare_parts", (j) => ({ ...upTo(j, 1), parts: { lines: [{ partId: "a1", qty: 1 }, { partId: "a3", qty: 1 }], locked: true } }));
  add("waiting_origin_confirm_appointment", (j) => ({ ...upTo(j, 2), appt: { kind: "at_med", from: "25/11/2569", to: "26/11/2569", mechanicId: "p4", place: "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9", sentAt: j.createdAt } }));
  add("ready_to_proceed", (j) => upTo(j, 3));
  /* เพิ่มใหม่: ส่งให้ผู้ส่งมอบรถ (หน่วยงาน) เซ็นแล้ว รอเซ็นจากเมนู ตอบรับนัดหมายงานซ่อม */
  add("ready_to_proceed", (j) => ({ ...upTo(j, 3), intake: { docs: all(INTAKE_DOCS.length, { v: "have" }), battery: { brand: "GS", qty: "2" }, delivererId: "p6", receiverId: "p4", signed: [false, true], signReq: true, check: all(INSPECT_ITEMS.length, "ok"), notes: {}, photos: 3 } }));
  add("repair_in_progress", (j) => upTo(j, 4));
  add("found_additional_symptoms", (j) => ({ ...upTo(j, 4), work: { extra: true, extraText: "พบซีลกระบอกขาช้างหลังรั่วเพิ่ม", withdraw: true, extraParts: [{ partId: "a7", qty: 2 }] } }));
  add("repair_finished", (j) => upTo(j, 5));
  add("waiting_origin_confirm_pickup", (j) => ({ ...upTo(j, 5), returnAppt: { kind: "at_med", from: "28/11/2569", to: "28/11/2569", mechanicId: "p4", place: "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9", sentAt: j.createdAt } }));
  add("waiting_med_reschedule_return", (j) => ({ ...upTo(j, 5), returnAppt: { kind: "at_med", from: "28/11/2569", to: "28/11/2569", mechanicId: "p4", place: "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9", sentAt: j.createdAt, reply: { ok: false, reason: "วันที่นัดติดภารกิจ ขอเลื่อนเป็นสัปดาห์ถัดไป", at: j.createdAt } } }));
  add("waiting_med_post_repair_inspection", (j) => upTo(j, 6));
  add("waiting_med_closing_report", (j) => upTo(j, 7));
  add("waiting_closing_approval", (j) => ({ ...upTo(j, 7), close: { docs: { ...all(12, "none" as const), 12: "na", 13: "na", 14: "na" }, files: {}, oldParts: { a1: 1 }, partNotes: {} } }));
  /* ปิดงานแล้ว · ประกันของ กบค. ใกล้หมด (เริ่ม 01/06/2569 · 180 วัน) → แจ้งเตือนก่อนหมด */
  add("job_closed", (j) => { const x = upTo(j, 7); return { ...x, post: { ...x.post!, warranty: { on: true, start: "01/06/2569", days: 180 } }, close: { costs: { labor: "2,500.00", travel: "800.00", lodging: "", other: "" }, docs: all(15, "na" as const), files: {}, oldParts: {}, partNotes: {} } }; });
  add("job_closed", (j) => ({ ...j, method: "garage", external: { garageId: "G03", garage: "อู่ตัวอย่าง นครปฐม", doneDate: j.createdAt, cost: "4500", mileage: String(j.mileage ?? ""), files: 1, warranty: { on: true, start: j.createdAt, days: 90 }, stage: 3, inDate: j.createdAt, inMileage: String(j.mileage ?? ""), inPhotos: 1, quoteFiles: 1, quote: "4,500.00" } }));
  /* สถานะที่ยังไม่รู้ว่าใช้ตอนไหน — ใส่ไว้ให้เห็นในรายการ/ตัวกรอง */
  add("waiting_origin_pickup", (j) => upTo(j, 7));
  add("waiting_reporter_confirm_return_date", (j) => upTo(j, 5));
  /* เติมรายการให้ครบหลายหน้า (สถานะที่พบบ่อยใน UAT) */
  /* เพิ่มใหม่: ไม่อนุมัติ → ผู้แจ้งยกเลิก */
  add("cancelled", (j) => ({ ...j, returnReason: "ยานพาหนะอยู่ระหว่างรอจำหน่าย", closedEarly: "ไม่ซ่อมแล้ว รอจำหน่าย" }));
  for (let k = 0; k < 13; k++) add(k % 3 ? "waiting_unit_head_approval" : "waiting_med_closing_report", (j) => (k % 3 ? j : upTo(j, 7)));

  /* แจ้งเตือนตั้งต้นของงานที่รอคนอื่นทำต่อ */
  const NOTE: Partial<Record<StatusCode, [import("../features/model").Role, string, "warning"]>> = {
    waiting_unit_head_approval: ["unitHead", "ใบแจ้งซ่อม {no} รอหัวหน้าหน่วยงานอนุมัติ", "warning"],
    waiting_med_head_approval: ["medHead", "ใบแจ้งซ่อม {no} รอหัวหน้า กบค. อนุมัติ", "warning"],
    waiting_origin_confirm_appointment: ["origin", "นัดหมายวันซ่อม {no} รอการตอบรับ", "warning"],
    waiting_origin_confirm_pickup: ["origin", "นัดหมายวันคืนรถ {no} รอการตอบรับ", "warning"],
    found_additional_symptoms: ["medHead", "{no} พบอาการเพิ่ม รออนุมัติ", "warning"],
    waiting_closing_approval: ["medHead", "คำขอปิดงาน {no} รอการตอบรับ", "warning"],
  };
  out.slice(0, 26).forEach((j) => {
    const n = NOTE[j.status];
    if (n) j.notices = [{ id: `${j.id}-seed`, at: `${j.createdAt} 09:00`, to: n[0], text: n[1].replace("{no}", j.no), tone: n[2] }];
    if (j.intake?.signReq) j.notices = [{ id: `${j.id}-sign`, at: `${j.createdAt} 11:00`, to: "origin", text: `กรุณาเซ็นลงนามการรับมอบรถ ${j.no}`, tone: "warning" }];
  });
  if (out.length && !STATUSES.every((s) => out.some((j) => j.status === s.code))) throw new Error("seed ต้องมีครบทุกสถานะ");
  /* วันที่สร้างไล่จากใหม่ไปเก่า (งานแรกในอาร์เรย์ = ใหม่สุด) */
  return out.map((j, k) => {
    const d = `${String(Math.max(1, 19 - Math.floor(k / 2))).padStart(2, "0")}/11/2569`;
    return { ...j, createdAt: d, updatedAt: d, history: j.history.map((h, n) => (n === 0 ? { ...h, at: `${d} ${h.at.slice(-5)}` } : h)) };
  });
}
