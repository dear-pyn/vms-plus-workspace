/** ข้อมูลจำลองศูนย์บริการ/อู่ — 2 รายการแรกยกจากจอ OH2 / E.4 · E.9 · ที่เหลือแต่งเพิ่ม (AC-S4: vendor list เป็น mockup) ⚠ ไม่ใช่ข้อมูลจริง
 *  19 พ.ย. 2569: ที่อยู่แบบเต็ม (เลขที่ · ถนน · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์) สำหรับเมนู อู่/ศูนย์บริการ · id เดิม (G01…) คงไว้เพราะ PO ตั้งต้นอ้างอยู่ */
import { formatAddress, type GarageAddress } from "../features/garage/types";
import type { Garage } from "../features/po/types";

const g = (id: string, code: string, name: string, phone: string, addr: GarageAddress, more: Partial<Garage> = {}): Garage => ({ id, code, name, phone, addr, address: formatAddress(addr), email: "", vehicleTypes: [], brands: [], lat: "", lng: "", docs: [], ...more });

export const seedGarages = (): Garage[] => [
  g("G01", "VND-001", "บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด", "02-000-1201", { houseNo: "99/1", street: "บางนา-ตราด", subdistrict: "แขวงบางนาใต้", district: "เขตบางนา", province: "กรุงเทพมหานคร", zip: "10260" }, { vehicleTypes: ["รถเครน 10 ตัน", "รถเครน 5 ตัน"], brands: ["HINO"], email: "service@example.com" }),
  g("G02", "VND-002", "บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด", "02-000-1202", { houseNo: "1", street: "ราชดำเนินกลาง", subdistrict: "แขวงวังบูรพาภิรมย์", district: "เขตพระนคร", province: "กรุงเทพมหานคร", zip: "10200" }, { vehicleTypes: ["รถกระเช้า", "รถเจาะหลุมปักเสา"], brands: ["ISUZU"] }),
  g("G03", "VND-003", "อู่ตัวอย่าง นครปฐม", "034-000-101", { houseNo: "12", street: "เพชรเกษม", subdistrict: "ตำบลพระปฐมเจดีย์", district: "อำเภอเมืองนครปฐม", province: "นครปฐม", zip: "73000" }, { vehicleTypes: ["รถเครน 10 ตัน"], brands: ["ISUZU", "HINO"] }),
  g("G04", "VND-004", "อู่ตัวอย่าง เชียงใหม่", "053-000-202", { houseNo: "45/6", street: "", subdistrict: "ตำบลยางเนิ้ง", district: "อำเภอสารภี", province: "เชียงใหม่", zip: "50140" }, { vehicleTypes: ["รถกระเช้า"], brands: ["MITSUBISHI"] }),
  g("G05", "VND-005", "อู่ตัวอย่าง ขอนแก่น", "043-000-303", { houseNo: "8", street: "มิตรภาพ", subdistrict: "ตำบลในเมือง", district: "อำเภอเมืองขอนแก่น", province: "ขอนแก่น", zip: "40000" }, { vehicleTypes: ["รถเครน 5 ตัน"], brands: ["HINO", "FUSO"], lat: "16.4419", lng: "102.8360" }),
  g("G06", "VND-006", "อู่ตัวอย่าง สงขลา", "074-000-404", { houseNo: "210", street: "เพชรเกษม", subdistrict: "ตำบลหาดใหญ่", district: "อำเภอหาดใหญ่", province: "สงขลา", zip: "90110" }, { vehicleTypes: ["รถกระเช้า"], brands: ["HINO"] }),
];

/** ประเภท/ยี่ห้อที่เลือกได้ในฟอร์มอู่ — ตามชุดยานพาหนะ mock (ระบบจริงมาจาก master ยานพาหนะ) */
export const GARAGE_VEHICLE_TYPES = ["รถเครน 10 ตัน", "รถเครน 5 ตัน", "รถกระเช้า", "รถเจาะหลุมปักเสา"];
export const GARAGE_BRANDS = ["FUSO", "HINO", "ISUZU", "MITSUBISHI"];
