/** ข้อมูลจำลอง Purchase Order + งานรายคัน — แผน ORZ6900001 และ PO-690101/02/03 ยกจากจอ OH2 / G.1 · F.4.2 · E.9
 *  แผนอื่นที่มี PO (poCount 1) สร้าง PO ละ 2 คันวนจากยานพาหนะที่ Overhaul · ⚠ ไม่ใช่ข้อมูลจริง ห้ามใช้เป็นเกณฑ์ AC */
import { formatThaiDate } from "@ui/DateField";
import { BUDGET_TYPES, type Plan } from "../features/plan/types";
import { JOB_STATUS, type JobCode, type PurchaseOrder, type VehicleJob } from "../features/po/types";
import { emptyChecks } from "../features/job/intake";
import { IMPORT_SAMPLE, seedStock } from "../features/job/close";
import type { OverhaulVehicle, PlanVehicle } from "../features/vehicle/types";

const toPlanVehicle = (v: OverhaulVehicle, mileageKm: number): PlanVehicle => ({
  plate: v.plate, affiliation: v.affiliation, make: v.make, model: v.model, type: v.type, value: v.value, ageYears: v.ageYears,
  mileageKm, engineHours: Math.round(mileageKm / 19), referencePrice: v.referencePrice, overhaulEstimate: v.overhaulEstimate, progress: null,
});

const docs = (id: string) => ({ order: [{ name: `ใบสั่งจ้าง-${id}.pdf`, sizeKb: 500 }], other: [] });

/** F.4.2 คอลัมน์ "รายละเอียดตามสถานะ" */
const JOB_FIGMA: Array<[string, JobCode, number, [string, string?], number]> = [
  ["8234 กค กทม", "V5", 60, ["อยู่อู่ 12 วัน", "รับรถ 09/10/2569"], 182_400],
  ["70-1123 ชลบุรี", "V2", 0, ["นัดเข้าอู่ 22 – 24/10/2569", "รอหน่วยงานตอบรับ"], 150_200],
  ["81-5521 นครปฐม", "V4.1", 0, ["นัดเข้าอู่ 23/10/2569", "ถึงวันนัด ยังไม่ตรวจรับรถ"], 210_050],
  ["82-0457 สระบุรี", "V11", 100, ["ปิดงาน 05/10/2569", "ประกันถึง 30/09/2570"], 198_700],
];

const CYCLE: Array<[JobCode, number, [string, string?]]> = [
  ["V1", 0, ["ยังไม่นัดหมาย"]],
  ["V2", 0, ["นัดเข้าอู่ 03 – 05/11/2569", "รอหน่วยงานตอบรับ"]],
  ["V5", 45, ["อยู่อู่ 8 วัน", "รับรถ 21/10/2569"]],
  ["V6", 100, ["ซ่อมเสร็จ 01/11/2569", "รอตรวจสภาพ"]],
  ["V8", 100, ["นัดรับรถ 10 – 12/11/2569", "รอหน่วยงานตอบรับ"]],
  ["V10", 100, ["นัดรับรถ 08/11/2569", "รอปิดงาน"]],
  ["V10.2", 100, ["ส่งมอบรถ 10/11/2569", "รอส่งอนุมัติปิดงาน"]], // เดิม V10.3 รอ ผบช. — ตัดผู้อนุมัติตามมติ Refinement 9/11/2026
];

/** เติมข้อมูลขั้นที่ผ่านมาแล้วให้งานจำลอง (ดูย้อนหลังได้) — ค่าจำลองทั้งหมด */
export function enrichJob(j: VehicleJob): VehicleJob {
  const step = j.code === "V11" ? 7 : JOB_STATUS[j.code].step;
  const out: VehicleJob = { ...j };
  if (step >= 2 || j.code === "V4") out.appt1 = { from: "06/10/2569", to: "08/10/2569", coordinatorId: "500101", note: "", sentAt: "01/10/2569", reply: { accepted: true, date: "07/10/2569", deliverer: "ผู้นำส่งตัวอย่าง", at: "02/10/2569" } };
  if (j.code === "V2") out.appt1 = { from: "22/10/2569", to: "24/10/2569", coordinatorId: "500101", note: "นำคู่มือจดทะเบียนรถมาด้วย", sentAt: "19/10/2569" };
  if (step >= 3) {
    const log = [
      { at: "07/10/2569 10:15", who: "กบค. (ผู้ใช้งานปัจจุบัน)", action: "ส่งขอยืนยันการรับมอบถึง นายวิชัย ทองดี (ฝั่ง กบค.)" },
      { at: "07/10/2569 10:16", who: "กบค. (ผู้ใช้งานปัจจุบัน)", action: "ส่งขอยืนยันการรับมอบถึง นายประวิทย์ แสงทอง (ฝั่ง หน่วยงาน)" },
      { at: "07/10/2569 11:02", who: "นายวิชัย ทองดี", action: "อนุมัติการรับมอบ" },
      { at: "07/10/2569 13:40", who: "นายประวิทย์ แสงทอง", action: "อนุมัติการรับมอบ" },
      { at: "07/10/2569 14:05", who: "กบค. (ผู้ใช้งานปัจจุบัน)", action: "ยืนยันรับรถ" },
    ];
    out.intake = {
      date: "07/10/2569",
      mileageKm: 182_400,
      checks: emptyChecks().map((c, i) => ({ ...c, has: i !== 3, damaged: i === 5, note: i === 5 ? "แม่แรงชำรุด" : "", ...(c.brand !== undefined ? { brand: "GS", count: "2" } : {}) })),
      delivererId: "600201",
      receiverId: "500101",
      photos: [{ name: "รูปด้านหน้า.jpg", sizeKb: 820 }, { name: "รูปด้านข้าง.jpg", sizeKb: 760 }],
      approvals: [
        { side: "กบค.", staffId: "500101", sentAt: "07/10/2569 10:15", result: "approved", at: "07/10/2569 11:02" },
        { side: "หน่วยงาน", staffId: "600201", sentAt: "07/10/2569 10:16", result: "approved", at: "07/10/2569 13:40" },
      ],
      log,
      confirmedAt: "07/10/2569 14:05",
    };
  }
  if (step >= 3) {
    const all = [
      { id: "pg-1", at: "08/10/2569 10:00", percent: 20, detail: "รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน", note: "" },
      { id: "pg-2", at: "15/10/2569 14:00", percent: 45, detail: "เปลี่ยนชุดลูกสูบและแหวน", note: "รออะไหล่ปะเก็นฝาสูบ 3 วัน" },
      { id: "pg-3", at: "24/10/2569 09:30", percent: 70, detail: "ประกอบเครื่องยนต์กลับ ทดสอบติดเครื่อง", note: "" },
      { id: "pg-4", at: "01/11/2569 16:00", percent: 100, detail: "ทดสอบวิ่งและตรวจระบบไฮดรอลิกครบ", note: "" },
    ];
    out.progressLog = step === 3 ? all.filter((e) => e.percent <= j.progress || e.id === "pg-1") : all;
    if (step === 3) out.progress = out.progressLog[out.progressLog.length - 1].percent;
  }
  if (step >= 5) out.inspection = { safety: [{ name: "Safety-Inspection.pdf", sizeKb: 640 }], other: [], photos: [{ name: "หลังซ่อม-ด้านหน้า.jpg", sizeKb: 910 }], confirmedAt: "02/11/2569 15:20" };
  if (step >= 6) out.appt5 = { from: "08/11/2569", to: "09/11/2569", coordinatorId: "500101", note: "", sentAt: "03/11/2569", reply: { accepted: true, date: "08/11/2569", deliverer: "ผู้รับรถตัวอย่าง", at: "04/11/2569" } };
  if (step >= 7) {
    // ปิดงานแล้ว: 72-6648 สงขลา ประกันเหลือ 15 วัน (Q.2/Q.4 · T.3) · คันอื่นเริ่มประกัน 09/11/2569 360 วัน
    const nearEnd = j.plate === "72-6648 สงขลา";
    const start = nearEnd ? formatThaiDate(new Date(Date.now() - 345 * 86_400_000)) : "09/11/2569";
    out.close = {
      returnedAt: "09/11/2569",
      receiver: "ผู้รับรถตัวอย่าง",
      body: IMPORT_SAMPLE.body.map((p, i) => ({ ...p, id: `b${i}` })),
      tools: IMPORT_SAMPLE.tools.map((p, i) => ({ ...p, id: `t${i}` })),
      stock: seedStock().map((x, i) => (i === 2 ? { ...x, used: 22, sent: true } : x)),
      labor: 28_500,
      other: 3_200,
      warranty: { on: true, start, days: 360 },
      closedAt: "09/11/2569 15:00",
    };
  }
  else if (j.code === "V8") out.appt5 = { from: "10/11/2569", to: "12/11/2569", coordinatorId: "500101", note: "", sentAt: "05/11/2569" };
  return out;
}

export function seedPOs(plans: Plan[], fleet: OverhaulVehicle[]): { plans: Plan[]; pos: PurchaseOrder[]; jobs: VehicleJob[] } {
  const pos: PurchaseOrder[] = [];
  const jobs: VehicleJob[] = [];
  const byPlate = new Map(fleet.map((v) => [v.plate, v]));
  let k = 0;
  let w = 0;
  const out = plans.map((p) => {
    if (p.id === "ORZ6900001") {
      const plates4 = JOB_FIGMA.map((r) => r[0]);
      const vehicles = [...JOB_FIGMA.map((r) => toPlanVehicle(byPlate.get(r[0])!, r[4])), toPlanVehicle(byPlate.get("80-3316 เชียงใหม่")!, 120_300), toPlanVehicle(byPlate.get("72-6648 สงขลา")!, 240_800)];
      pos.push(
        { id: "PO-690101", planId: p.id, name: "ซ่อมระบบเครื่องยนต์", garageId: "G01", contractStart: "01/09/2569", contractEnd: "30/11/2569", plates: plates4, docs: docs("PO-690101"), createdAt: "20/08/2569" },
        { id: "PO-690102", planId: p.id, name: "ซ่อมระบบไฮดรอลิกเครน", garageId: "G01", contractStart: "15/09/2569", contractEnd: formatThaiDate(new Date(Date.now() + 7 * 86_400_000)) /* G.1 "ใกล้ครบสัญญา (เหลือ 7 วัน)" */, plates: ["80-3316 เชียงใหม่"], docs: docs("PO-690102"), createdAt: "25/08/2569" },
        { id: "PO-690103", planId: p.id, name: "ซ่อมระบบแอร์", garageId: "G02", contractStart: "01/10/2569", contractEnd: "31/12/2569", plates: ["72-6648 สงขลา"], docs: docs("PO-690103"), createdAt: "28/08/2569" },
      );
      JOB_FIGMA.forEach(([plate, code, progress, detail]) => jobs.push({ poId: "PO-690101", plate, code, progress, detail }));
      jobs.push({ poId: "PO-690102", plate: "80-3316 เชียงใหม่", code: "V5", progress: 40, detail: ["อยู่อู่ 20 วัน", "รับรถ 01/10/2569"] });
      jobs.push({ poId: "PO-690103", plate: "72-6648 สงขลา", code: "V11", progress: 100, detail: ["ปิดงาน 30/10/2569", "ประกันถึง 30/10/2570"] });
      return { ...p, name: "Overhaul ประจำปีงบ 2569 — รถเครน", budget: 10_000_000, budgetType: BUDGET_TYPES[2], costCenter: "", orderNo: "", budgetNote: "", wbs: "C-69-OH-0101", network: "60001234", activity: "0010", createdAt: "12/08/2569", status: "รอดำเนินการ" as const, progress: 66.7, vehicles, poCount: 3 };
    }
    // EC-46 แผนมียานพาหนะเสมอ — แผนที่ยังไม่มี PO ได้ 1–3 คันจากชุดเดียวกัน (ทุกคันที่ 3 ยังไม่ระบุราคา → ป้าย "ยังไม่ระบุ")
    if (p.poCount === 0) {
      if (p.vehicles.length) return p;
      const n = 1 + (w % 3);
      const pick = Array.from({ length: n }, (_, i) => fleet[(w * 5 + i * 11) % fleet.length]);
      w += 1;
      return { ...p, vehicles: pick.map((v, i) => ({ ...toPlanVehicle(v, 140_000 + i * 15_500), ...((w + i) % 3 === 0 ? { referencePrice: null, overhaulEstimate: null } : {}) })) };
    }
    const pick = [fleet[k % fleet.length], fleet[(k + 7) % fleet.length]];
    k += 1;
    const id = `PO-${String(p.fiscalYear).slice(-2)}${String(k).padStart(4, "0")}`;
    const done = p.status === "เสร็จสิ้น";
    pos.push({ id, planId: p.id, name: k % 2 ? "ซ่อมระบบเครื่องยนต์" : "ซ่อมระบบไฮดรอลิก", garageId: `G0${(k % 6) + 1}`, contractStart: "01/09/2569", contractEnd: k % 4 === 0 ? "20/11/2569" : "31/12/2569", plates: pick.map((v) => v.plate), docs: docs(id), createdAt: p.createdAt });
    pick.forEach((v, i) => {
      const [code, progress, detail] = done ? (["V11", 100, ["ปิดงาน 30/09/2569", "ประกันถึง 30/09/2570"]] as const) : CYCLE[(k + i) % CYCLE.length];
      jobs.push({ poId: id, plate: v.plate, code, progress, detail: [...detail] as [string, string?] });
    });
    return { ...p, vehicles: pick.map((v, i) => toPlanVehicle(v, 150_000 + i * 12_345)) };
  });
  return { plans: out, pos, jobs: jobs.map(enrichJob) };
}
