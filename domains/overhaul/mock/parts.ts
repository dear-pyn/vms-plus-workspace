/** master อะไหล่จำลองสำหรับเบิกจากคลัง (v2 EC-56) — ชื่อ/รหัส/ราคาสมมติ · ระบบจริงดึงจาก Smart Inventory (ยังไม่มี API) */
import type { PartCat } from "../features/po/types";

export interface CatalogPart {
  id: string;
  name: string;
  code: string;
  unit: string;
  /** ราคาต่อหน่วย (บาท) */
  price: number;
  /** หมวด (ตัวรถ/เครื่องยนต์ · เครื่องจักรกล) */
  cat: PartCat;
  /** ยอดคงเหลือจำลอง (คลังหลัก · คลังสำรอง) — แบบกล่องเลือกอะไหล่ของงานซ่อม · ระบบจริงรอ Smart Inventory API (EC-59) */
  stock: { main: number; spare: number };
}

export const PART_CATALOG: CatalogPart[] = [
  { id: "p-bat", name: "แบตเตอรี่ 12V 100Ah", code: "1-81200-345-0", unit: "ลูก", price: 3200, cat: "body", stock: { main: 4, spare: 2 } },
  { id: "p-alt", name: "ไดชาร์จ 24V 50A", code: "8-97253-921-0", unit: "ตัว", price: 6850, cat: "body", stock: { main: 1, spare: 0 } },
  { id: "p-wire", name: "สายไฟ 6 sq.mm สีแดง", code: "WR-6SQ-RED", unit: "เมตร", price: 45, cat: "body", stock: { main: 120, spare: 0 } },
  { id: "p-piston", name: "ชุดลูกสูบพร้อมแหวน", code: "PS-6HK1-STD", unit: "ชุด", price: 6850, cat: "body", stock: { main: 0, spare: 2 } },
  { id: "p-oilf", name: "กรองน้ำมันเครื่อง", code: "OF-1132", unit: "ชิ้น", price: 420, cat: "body", stock: { main: 12, spare: 6 } },
  { id: "p-oil", name: "น้ำมันเครื่อง 15W-40", code: "EO-15W40", unit: "ลิตร", price: 185, cat: "body", stock: { main: 80, spare: 40 } },
  { id: "p-hpump", name: "ปั๊มไฮดรอลิก", code: "HP-KYB-45", unit: "ตัว", price: 38500, cat: "tools", stock: { main: 0, spare: 0 } },
  { id: "p-hseal", name: "ชุดซีลกระบอกไฮดรอลิก", code: "HS-110", unit: "ชุด", price: 2400, cat: "tools", stock: { main: 3, spare: 1 } },
  { id: "p-sling", name: "ลวดสลิงเครน 16 มม.", code: "WR-16-6X36", unit: "เมตร", price: 520, cat: "tools", stock: { main: 60, spare: 0 } },
  { id: "p-limit", name: "สวิตช์ลิมิตบูม", code: "LS-BM-02", unit: "ตัว", price: 1850, cat: "tools", stock: { main: 2, spare: 0 } },
];
