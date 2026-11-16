/** ข้อมูลจำลองของต้นแบบ — ค่า 10 แถวแรกและแผน ORZ7000011 ยกจากหน้าจอ refinement sprint 09
 *  (OH2 / C.1 รายการแผน · C.2 ฟอร์มแก้ไข · C.5 รายละเอียดแผน) ที่เหลือสร้างให้ครบ 96 รายการเพื่อทดสอบการแบ่งหน้า
 *  ⚠ ไม่ใช่ข้อมูลจริง ห้ามใช้เป็นเกณฑ์ AC */
import { BUDGET_TYPES, type Plan } from "../features/plan/types";

const FIGMA_ROWS: Array<[string, string, number, number | null]> = [
  ["ORZ7000010", "Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้", 20_000_000, null],
  ["ORZ7000009", "Overhaul รถกระเช้า ภาคเหนือ", 15_000_000, 77],
  ["ORZ7000008", "Overhaul รถกระเช้า ภาคกลาง", 12_500_000, 73],
  ["ORZ7000007", "Overhaul รถกระเช้า ภาคอีสาน", 18_000_000, null],
  ["ORZ7000006", "จัดซื้อรถกระเช้า ภาคใต้", 25_000_000, null],
  ["ORZ7000005", "ปรับปรุงรถบริการ ภาคเหนือ", 8_500_000, null],
  ["ORZ7000004", "Overhaul รถเครน ภาคกลาง", 16_000_000, null],
  ["ORZ7000003", "จัดซื้อเครื่องมือซ่อมบำรุง", 3_000_000, null],
  ["ORZ7000002", "ปรับปรุงรถกระเช้า ภาคใต้", 9_500_000, null],
  ["ORZ7000001", "Overhaul รถบริการ ภาคอีสาน", 11_000_000, null],
];

/** T20: หนังสืออนุมัติหลักการ + เอกสารอนุมัติงบ บังคับ (AC-S1) → ทุกแผนที่สร้างแล้วมีไฟล์เสมอ */
const emptyDocs = () => ({ principle: [{ name: "หนังสืออนุมัติหลักการ.pdf", sizeKb: 240 }], budget: [{ name: "เอกสารอนุมัติงบ.pdf", sizeKb: 180 }], other: [] });

/** ประเภทงบ + ช่องตามประเภท (AC-S1 · ฟอร์ม B.3.2–B.3.6) — เจ้าของงานเคาะ 16 พ.ย. 2569 ให้ทุกแผนใช้ค่าตาม AC (เดิมทุกแผนเป็น "งบลงทุน" + WBS) */
function budgetOf(i: number): Pick<Plan, "budgetType" | "costCenter" | "wbs" | "network" | "activity" | "orderNo" | "budgetNote"> {
  const none = { costCenter: "", wbs: "", network: "", activity: "", orderNo: "", budgetNote: "" };
  const seq = String(i + 2).padStart(4, "0");
  switch (i % 5) {
    case 0: return { ...none, budgetType: BUDGET_TYPES[2], wbs: `I-70-Z-DPMXX.JM.${seq}`, network: `6000${seq}`, activity: "0010" };
    case 1: return { ...none, budgetType: BUDGET_TYPES[3], orderNo: `410001${seq}` };
    case 2: return { ...none, budgetType: BUDGET_TYPES[0], costCenter: "Z903021100  ผจค.กพค.-บริหาร" };
    case 3: return { ...none, budgetType: BUDGET_TYPES[1], costCenter: "Z903031100  ผบร.กบค.-บริหาร" };
    default: return { ...none, budgetType: BUDGET_TYPES[4], budgetNote: "งบเหลือจ่ายปีก่อน (ข้อมูลจำลอง)" };
  }
}

function row([id, name, budget, progress]: (typeof FIGMA_ROWS)[number], i: number): Plan {
  return {
    id,
    name,
    fiscalYear: 2570,
    budget,
    ...budgetOf(i),
    progress,
    status: progress === null ? "รอเลข Purchase Order" : "รอดำเนินการ",
    createdAt: `${String(21 - i).padStart(2, "0")}/10/2569`,
    vehicles: [],
    docs: emptyDocs(),
    poCount: progress === null ? 0 : 1,
  };
}

const DETAIL: Plan = {
  id: "ORZ7000011",
  name: "Overhaul ประจำปีงบ 2570 — รถเจาะหลุม",
  budgetType: "งบลงทุน งานก่อสร้าง",
  fiscalYear: 2570,
  budget: 5_500_000,
  wbs: "C-70-OH-0003",
  network: "60001234",
  activity: "0010",
  progress: null,
  status: "รอเลข Purchase Order",
  createdAt: "22/10/2569",
  costCenter: "",
  orderNo: "",
  budgetNote: "",
  vehicles: [
    { plate: "8234 กค กทม", affiliation: "กฟฟ.กทม.", make: "HINO", model: "FM2P", type: "รถเครน 10 ตัน", value: 2_030_000, ageYears: 12, mileageKm: 182_400, engineHours: 9_800, referencePrice: 2_700_000, overhaulEstimate: 250_000, progress: null },
    { plate: "82-0457 สระบุรี", affiliation: "กฟฟ.สระบุรี", make: "ISUZU", model: "FXZ", type: "รถเจาะหลุมปักเสา", value: 1_920_000, ageYears: 13, mileageKm: 198_700, engineHours: 10_400, referencePrice: 2_550_000, overhaulEstimate: 310_000, progress: null },
  ],

  docs: {
    principle: [{ name: "Document.pdf", sizeKb: 200 }],
    budget: [{ name: "Image_เอกสารอนุมัติงบ01.jpg", sizeKb: 10 }, { name: "Image_เอกสารอนุมัติงบ02.png", sizeKb: 10 }],
    other: [{ name: "Image001.jpg", sizeKb: 10 }, { name: "Image002.png", sizeKb: 10 }],
  },
  poCount: 0,
};

const NAMES = ["Overhaul รถกระเช้า", "Overhaul รถเครน", "ปรับปรุงรถบริการ", "Overhaul รถเจาะหลุม"];
const REGIONS = ["ภาคเหนือ", "ภาคกลาง", "ภาคใต้", "ภาคอีสาน"];

export function seedPlans(): Plan[] {
  const extra: Plan[] = Array.from({ length: 85 }, (_, i) => {
    const n = 6900085 - i;
    const done = i % 7 === 3;
    const progress = done ? 100 : i % 3 === 0 ? null : 20 + ((i * 7) % 75);
    return {
      ...row([`ORZ${n}`, `${NAMES[i % 4]} ${REGIONS[(i >> 2) % 4]}`, 500_000 + ((i * 1_250_000) % 24_000_000), progress], i + 10),
      ...(done ? { status: "เสร็จสิ้น" as const } : {}),
      fiscalYear: i % 5 === 0 ? 2568 : 2569,
      createdAt: `${String(28 - (i % 28)).padStart(2, "0")}/09/2569`,
    };
  });
  return [DETAIL, ...FIGMA_ROWS.map(row), ...extra].map((p) => structuredClone(p));
}
