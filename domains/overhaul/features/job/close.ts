/** ตรรกะขั้น 6 ปิดงาน (ไม่ผูก UI) — ค่าใช้จ่ายรวม · วันหมดประกัน · สถานะคืนอะไหล่ */
import { formatThaiDate, parseThaiDate } from "@ui/DateField";
import type { CloseOut, PartUsed, StockReturn, WarrantyDays } from "../po/types";

export const WARRANTY_DAYS: WarrantyDays[] = [90, 180, 360, 720];
export const UNITS = ["ชิ้น", "ชุด", "ลิตร", "เส้น", "ลูก", "ตัว", "เมตร", "คู่", "กล่อง"];

/** วันหมดอายุประกัน = วันเริ่ม + ระยะ (AC-S14: 09/11/2569 + 360 วัน = 04/11/2570) */
export function warrantyEnd(start: string, days: WarrantyDays | null): string {
  const d = parseThaiDate(start);
  if (!d || !days) return "";
  return formatThaiDate(new Date(d.getTime() + days * 86_400_000));
}
/** จำนวนวันที่เหลือของประกันนับจากวันนี้ (ติดลบ = หมดแล้ว) */
export function warrantyLeft(start: string, days: WarrantyDays | null): number | null {
  const d = parseThaiDate(start);
  if (!d || !days) return null;
  return Math.ceil((d.getTime() + days * 86_400_000 - new Date(new Date().toDateString()).getTime()) / 86_400_000);
}

export const sumParts = (ps: PartUsed[]) => ps.reduce((a, p) => a + p.qty * p.price, 0);
export const costRows = (c: Pick<CloseOut, "body" | "tools" | "labor" | "other">): Array<[string, number]> => {
  const rows: Array<[string, number]> = [
    ["ค่าอะไหล่ตัวรถ", sumParts(c.body)],
    ["ค่าอะไหล่เครื่องมือกล", sumParts(c.tools)],
    ["ค่าแรง", c.labor ?? 0],
    ["ค่าใช้จ่ายอื่นๆ", c.other ?? 0],
  ];
  return [...rows, ["รวมค่าใช้จ่ายทั้งสิ้น", rows.reduce((a, r) => a + r[1], 0)]];
};

export const returnQty = (s: StockReturn) => Math.max(0, s.withdrawn - s.used);
/** จำนวนที่คืนของแถวอะไหล่ (SMI = เบิก − ใช้ · กรอกเอง = 0) */
export const partReturned = (p: PartUsed) => (p.withdrawn != null ? Math.max(0, p.withdrawn - p.qty) : 0);
/** อะไหล่ที่เบิกจากคลัง (SMI) เป็นค่าตั้งต้นของตารางอะไหล่ — ราคาจำลอง · รหัสแยกจากชื่อหลัง "#" */
export const seedSmiParts = (): PartUsed[] =>
  seedStock().map((s, i) => {
    const [name, code] = s.name.split(" # ");
    return { id: `smi-${i}`, name, code, qty: s.withdrawn, unit: s.unit, price: [3_200, 6_850, 45][i] ?? 0, withdrawn: s.withdrawn, oldQty: 0, remark: "" };
  });
export function returnStatus(s: StockReturn): { label: string; tone: "gray" | "warning" } {
  if (returnQty(s) === 0) return { label: "ไม่มีคืน", tone: "gray" };
  return s.sent ? { label: "รอคลังรับคืน", tone: "warning" } : { label: "ยังไม่ส่งคืน", tone: "gray" };
}

/** อะไหล่ที่เบิกจากคลังตามแผน (ข้อมูลจำลองยกจากจอ O.5) */
export const seedStock = (): StockReturn[] => [
  { name: "แบตเตอรี่ 12V 100Ah # 1-81200-345-0", unit: "ลูก", withdrawn: 2, used: 2 },
  { name: "ไดชาร์จ 24V 50A # 8-97253-921-0", unit: "ตัว", withdrawn: 1, used: 1 },
  { name: "สายไฟ 6 sq.mm สีแดง # WR-6SQ-RED", unit: "เมตร", withdrawn: 30, used: 30 },
];

/** ไฟล์นำเข้าอะไหล่จำลอง (ต้นแบบไม่อ่านไฟล์จริง — ยกรายการจากจอ O.2) */
export const IMPORT_SAMPLE: Record<"body" | "tools", Omit<PartUsed, "id">[]> = {
  body: [
    { name: "ชุดลูกสูบพร้อมแหวน", qty: 6, unit: "ชุด", price: 6850 },
    { name: "กรองน้ำมันเครื่อง", qty: 2, unit: "ชิ้น", price: 420 },
    { name: "น้ำมันเครื่อง 15W-40", qty: 18, unit: "ลิตร", price: 185 },
  ],
  tools: [{ name: "สายเคเบิลกว้าน", qty: 1, unit: "เส้น", price: 12500 }],
};
