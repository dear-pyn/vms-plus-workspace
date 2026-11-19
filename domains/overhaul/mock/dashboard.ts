/** ข้อมูล Dashboard Overhaul — ยกจากต้นแบบ Downloads/Dashboard/dashboard-review (plan/Main.dc.html + vehicles/Vehicles.dc.html)
 *  เจ้าของงาน 17 พ.ย. 2569: "ไปดูที่ download/dashboard แล้วเอาข้อมูล วิธีเลือกมาก่อน จากนั้นปรับ CI UX/UI ให้ตรงกับ VMS Plus"
 *  17 พ.ย. 2569: เลขแผนเลื่อนเป็น ORZ69000 9x / 68000 9x / 67000 91 (ต้นแบบมี ORZ6900001–85 อยู่แล้ว) และใส่ชุดนี้เข้าข้อมูลต้นแบบด้วย (seedDashboardSet)
 *    เพื่อให้ปุ่มไอคอนตาในตารางยานพาหนะเปิดหน้างานรายคันจริงได้ทุกคัน (เจ้าของงานเลือก "ไปหน้างานจริง") · อู่ใช้ชื่อเดียวกับ G01–G03 ของต้นแบบ
 *  ⚠ ข้อมูลจำลองทั้งหมด · แผน 6 แผน (ปีงบ 2567–2569) · ยานพาหนะ 22 คัน · ชื่อชนิดยานพาหนะ (รถกระเช้า/รถเครน) คงตามชื่อประเภท */

import type { Plan } from "../features/plan/types";
import type { JobCode, PartUsed, PurchaseOrder, VehicleJob } from "../features/po/types";
import type { PlanVehicle } from "../features/vehicle/types";

export interface DashPlan {
  id: string;
  fiscalYear: string;
  planNo: string;
  planName: string;
  approvedBudget: number;
  carCount: number;
}

export type DashStatus =
  | "pending_intake_appointment"
  | "pending_response"
  | "rejected"
  | "intake_accepted"
  | "pending_return_response"
  | "pending_submit_approval"
  | "pending_inspection"
  | "repairing"
  | "under_safety_inspection"
  | "pending_return_appointment"
  | "return_rejected"
  | "closing_in_progress"
  | "pending_approval"
  | "completed";

/** [ชื่ออะไหล่, รหัส, ราคาต่อหน่วย, จำนวน] */
export type DashPart = [string, string, number, number];

export interface DashVehicle {
  plan: string;
  plate: string;
  model: string;
  type: string;
  status: DashStatus;
  progress: number;
  newPrice: number;
  oldPrice: number;
  parts: DashPart[] | null;
  /** ค่าใช้จ่ายจริง = ผลรวมอะไหล่ตอนปิดงาน (null = ยังไม่ปิดงาน) */
  actual: number | null;
  po: string;
  vendor: string;
  garageId: string;
}

export const DASH_PLANS: DashPlan[] = [
  { id: "P1", fiscalYear: "2569", planNo: "ORZ6900091", planName: "Overhaul รถกระเช้า กฟก.1", approvedBudget: 2400000, carCount: 5 },
  { id: "P2", fiscalYear: "2569", planNo: "ORZ6900092", planName: "Overhaul รถเครน กฟก.2", approvedBudget: 1500000, carCount: 4 },
  { id: "P3", fiscalYear: "2569", planNo: "ORZ6900093", planName: "Overhaul รถเจาะหลุมปักเสา กฟน.3", approvedBudget: 1200000, carCount: 3 },
  { id: "P4", fiscalYear: "2568", planNo: "ORZ6800091", planName: "Overhaul รถกระเช้า กฟฉ.1", approvedBudget: 1900000, carCount: 4 },
  { id: "P5", fiscalYear: "2568", planNo: "ORZ6800092", planName: "Overhaul รถเครน กฟต.2", approvedBudget: 1200000, carCount: 3 },
  { id: "P6", fiscalYear: "2567", planNo: "ORZ6700091", planName: "Overhaul รถกระเช้า กฟน.2", approvedBudget: 1350000, carCount: 3 },
];

const ENG = "ชุดลูกสูบ-แหวน เครื่องยนต์";
/** อะไหล่ 2 รายการที่รวมเท่าค่าใช้จ่ายจริง (แผนปีก่อน) */
const two = (actual: number, sn: string): DashPart[] => {
  const a = Math.round(actual * 0.45);
  return [[ENG, "EN-" + sn, a, 1], ["ชุดไฮดรอลิกและซีล", "HY-" + sn, actual - a, 1]];
};

type Raw = [string, string, string, string, DashStatus, number, number, number, DashPart[] | null];
const RAW: Raw[] = [
  ["P1", "8234 กค กทม", "HINO FM2P", "รถกระเช้า", "completed", 100, 2700000, 2030000, [[ENG, "EN-48211", 185000, 1], ["ปั๊มไฮดรอลิก", "HP-10477", 142500, 1], ["ชุดซีลกระบอกบูม", "SK-2210", 12500, 4], ["ชุดคลัตช์", "CL-7719", 35000, 1]]],
  ["P1", "81-5521 นครปฐม", "ISUZU FVM", "รถกระเช้า", "completed", 100, 2500000, 1880000, [[ENG, "EN-51902", 198000, 1], ["ปั๊มไฮดรอลิก", "HP-11630", 150000, 1], ["สายไฮดรอลิกแรงดันสูง", "HH-0931", 9500, 6], ["ชุดเบรก", "BK-4402", 50000, 1]]],
  ["P1", "71-9902 ขอนแก่น", "MITSUBISHI FN", "รถกระเช้า", "closing_in_progress", 95, 2850000, 2130000, null],
  ["P1", "72-6648 สงขลา", "HINO FG1J", "รถกระเช้า", "repairing", 60, 3300000, 2480000, null],
  ["P1", "70-4410 ระยอง", "ISUZU FTR", "รถกระเช้า", "pending_response", 0, 2400000, 1790000, null],
  ["P2", "80-3316 เชียงใหม่", "HINO FM1A", "รถเครน 10 ตัน", "completed", 100, 2650000, 1980000, [[ENG, "EN-47705", 176000, 1], ["สลิงเครน", "WR-3318", 28000, 2], ["ชุดซีลกระบอก", "SK-2298", 11500, 4], ["หม้อน้ำ", "RD-6120", 60000, 1]]],
  ["P2", "70-1123 ชลบุรี", "HINO FG8J", "รถเครน 5 ตัน", "repairing", 40, 2200000, 1650000, null],
  ["P2", "84-1207 พิษณุโลก", "ISUZU FVZ", "รถเครน 10 ตัน", "under_safety_inspection", 85, 3000000, 2260000, null],
  ["P2", "83-9034 อุดรธานี", "HINO FC9J", "รถเครน 5 ตัน", "pending_intake_appointment", 0, 720000, 560000, null],
  ["P3", "82-0457 สระบุรี", "ISUZU FXZ", "รถเจาะหลุมปักเสา", "completed", 100, 2550000, 1920000, [[ENG, "EN-50033", 190000, 1], ["มอเตอร์ไฮดรอลิกหัวเจาะ", "HM-8841", 128000, 1], ["ดอกสว่าน", "AG-1175", 45000, 1], ["ชุดซีล", "SK-2304", 7000, 4]]],
  ["P3", "83-2210 นครราชสีมา", "ISUZU FVZ", "รถเจาะหลุมปักเสา", "pending_return_appointment", 90, 3000000, 2260000, null],
  ["P3", "85-7781 ลพบุรี", "HINO FM2P", "รถเจาะหลุมปักเสา", "pending_inspection", 10, 900000, 690000, null],
  ["P4", "80-1142 อุบลราชธานี", "HINO FM2P", "รถกระเช้า", "completed", 100, 2600000, 1950000, two(428000, "41120")],
  ["P4", "81-3390 ร้อยเอ็ด", "ISUZU FVM", "รถกระเช้า", "completed", 100, 2750000, 2060000, two(462000, "41377")],
  ["P4", "82-7715 สุรินทร์", "HINO FG8J", "รถกระเช้า", "completed", 100, 2450000, 1840000, two(401500, "41502")],
  ["P4", "83-0926 ศรีสะเกษ", "MITSUBISHI FN", "รถกระเช้า", "pending_approval", 98, 2900000, 2170000, null],
  ["P5", "80-6621 สุราษฎร์ธานี", "HINO FM1A", "รถเครน 10 ตัน", "completed", 100, 2300000, 1720000, two(371000, "42018")],
  ["P5", "81-4408 นครศรีธรรมราช", "ISUZU FVZ", "รถเครน 10 ตัน", "completed", 100, 2500000, 1880000, two(389500, "42233")],
  ["P5", "70-9917 ตรัง", "HINO FC9J", "รถเครน 5 ตัน", "completed", 100, 850000, 640000, two(412000, "42390")],
  ["P6", "80-2251 อยุธยา", "HINO FM2P", "รถกระเช้า", "completed", 100, 2400000, 1800000, two(405000, "39871")],
  ["P6", "81-7743 ปทุมธานี", "ISUZU FVM", "รถกระเช้า", "completed", 100, 2600000, 1950000, two(441000, "39904")],
  ["P6", "82-1186 นนทบุรี", "HINO FG1J", "รถกระเช้า", "completed", 100, 2350000, 1760000, two(398000, "40015")],
];

/** แบ่งยานพาหนะเข้า PO ตามลำดับ (vms_trn_purchase_order.po_seq) */
const SPLIT: Record<string, number[]> = { P1: [3, 2], P2: [2, 2], P3: [2, 1], P4: [2, 2], P5: [3], P6: [3] };
/** อู่ = ศูนย์บริการ G01–G03 ของข้อมูลต้นแบบ (ชื่อตรงกับหน้างานรายคัน) */
const GARAGES = [["G01", "บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด"], ["G02", "บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด"], ["G03", "อู่ตัวอย่าง นครปฐม"]] as const;

export const DASH_VEHICLES: DashVehicle[] = (() => {
  const cnt: Record<string, number> = {};
  return RAW.map(([plan, plate, model, type, status, progress, newPrice, oldPrice, parts]) => {
    const i = (cnt[plan] = (cnt[plan] ?? 0) + 1);
    let acc = 0;
    let seq = 1;
    SPLIT[plan].some((k, j) => {
      acc += k;
      seq = j + 1;
      return i <= acc;
    });
    const pi = DASH_PLANS.findIndex((p) => p.id === plan);
    const p = DASH_PLANS[pi];
    return {
      plan, plate, model, type, status, progress, newPrice, oldPrice, parts,
      actual: parts ? parts.reduce((s, x) => s + x[2] * x[3], 0) : null,
      po: `PO-${p.planNo.slice(3)}-0${seq}`,
      vendor: GARAGES[(pi + seq) % 3][1],
      garageId: GARAGES[(pi + seq) % 3][0],
    };
  });
})();

/* ───────── ใส่ชุด Dashboard เข้าข้อมูลต้นแบบ (แผน · PO · งานรายคัน) ───────── */

/** สถานะ Dashboard → รหัสสถานะงานรายคันของต้นแบบ */
export const DASH_TO_JOB: Record<DashStatus, JobCode> = {
  pending_intake_appointment: "V1", pending_response: "V2", rejected: "V3", pending_inspection: "V4.1", repairing: "V5",
  under_safety_inspection: "V6", pending_return_appointment: "V7", return_rejected: "V9", closing_in_progress: "V10.1", pending_approval: "V10.3", completed: "V11",
  intake_accepted: "V4", pending_return_response: "V8", pending_submit_approval: "V10.2",
};

export function seedDashboardSet(base: Plan, enrich: (j: VehicleJob) => VehicleJob): { plans: Plan[]; pos: PurchaseOrder[]; jobs: VehicleJob[] } {
  const plans: Plan[] = [];
  const pos: PurchaseOrder[] = [];
  const jobs: VehicleJob[] = [];
  DASH_PLANS.forEach((p, pi) => {
    const vs = DASH_VEHICLES.filter((v) => v.plan === p.id);
    const vehicles: PlanVehicle[] = vs.map((v, i) => {
      const [make, ...rest] = v.model.split(" ");
      return { plate: v.plate, affiliation: `กฟฟ.${v.plate.split(" ").pop()}`, make, model: rest.join(" "), type: v.type, value: v.oldPrice, ageYears: 9 + ((pi + i) % 8), mileageKm: 150_000 + i * 9_800, engineHours: 7_200 + i * 410, referencePrice: v.newPrice, overhaulEstimate: Math.round(p.approvedBudget / p.carCount), progress: v.progress };
    });
    const done = vs.every((v) => v.status === "completed");
    const prog = vs.length ? Math.floor(vs.reduce((t, v) => t + v.progress, 0) / vs.length) : 0;
    plans.push({ ...base, id: p.planNo, name: p.planName, fiscalYear: Number(p.fiscalYear), budget: p.approvedBudget, status: done ? "เสร็จสิ้น" : "รอดำเนินการ", progress: prog, vehicles, poCount: 0, createdAt: `01/0${(pi % 9) + 1}/${p.fiscalYear}` });
    [...new Set(vs.map((v) => v.po))].forEach((poId) => {
      const inPo = vs.filter((v) => v.po === poId);
      pos.push({ id: poId, planId: p.planNo, name: "Overhaul ตามแผน", garageId: inPo[0].garageId, contractStart: `01/10/${Number(p.fiscalYear) - 1}`, contractEnd: `30/09/${p.fiscalYear}`, plates: inPo.map((v) => v.plate), docs: { order: [{ name: `ใบสั่งจ้าง-${poId}.pdf`, sizeKb: 500 }], other: [] }, createdAt: `01/10/${Number(p.fiscalYear) - 1}` });
      inPo.forEach((v) => {
        const code = DASH_TO_JOB[v.status];
        let j = enrich({ poId, plate: v.plate, code, progress: v.progress, detail: [code === "V11" ? "ปิดงานแล้ว" : "งานตามแผน Dashboard"] });
        if (j.close && v.parts) {
          const body: PartUsed[] = v.parts.map(([name, codeNo, price, qty], i) => ({ id: `d${i}`, name, code: codeNo, price, qty, unit: "ชุด" }));
          j = { ...j, close: { ...j.close, body, tools: [], labor: null, other: null } };
        }
        if (code === "V10.3" && j.close) j = { ...j, close: { ...j.close, approval: { sentAt: "10/11/2569 09:00", sentBy: "กบค. (ผู้ใช้งานปัจจุบัน)", approverId: "500103" } } };
        /* บั๊ก 18 พ.ย. 2569 (Additional notes): "เสร็จแล้ว" ต้องผ่านผู้อนุมัติแล้ว → คันที่ปิดงานแล้วมีผลอนุมัติ ขั้น 7 จึงติ๊ก */
        if (code === "V11" && j.close) j = { ...j, close: { ...j.close, approval: { sentAt: "10/11/2569 09:00", sentBy: "กบค. (ผู้ใช้งานปัจจุบัน)", approverId: "500103", result: "approved", at: "10/11/2569 14:00" } } };
        jobs.push(j);
      });
    });
    plans[plans.length - 1].poCount = pos.filter((x) => x.planId === p.planNo).length;
  });
  return { plans, pos, jobs };
}
