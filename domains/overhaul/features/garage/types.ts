/** อู่/ศูนย์บริการ — โครงข้อมูลที่หน้าจอใช้ (19 พ.ย. 2569)
 *  ตาราง: vms_mas_garage · vms_ref_garage_address · vms_mas_garage_vehicle_type · vms_mas_garage_vehicle_brand · vms_mas_garage_document
 *  ที่อยู่แบบเต็ม พิมพ์เองทุกช่อง (ไม่มี API ที่อยู่ — เจ้าของงาน 19 พ.ย. 2569): เลขที่ (house_number) · ถนน (street) · ตำบล/แขวง (district) · อำเภอ/เขต (city) · จังหวัด (province) · รหัสไปรษณีย์ (zip_code) · country = ไทย ไม่แสดง */
import type { PlanFile } from "../plan/types";
import type { Garage } from "../po/types";

export interface GarageAddress {
  houseNo: string;
  street: string;
  /** ตำบล/แขวง → district */
  subdistrict: string;
  /** อำเภอ/เขต → city */
  district: string;
  province: string;
  zip: string;
}

export interface GarageDraft {
  name: string;
  vehicleTypes: string[];
  brands: string[];
  addr: GarageAddress;
  phone: string;
  email: string;
  /** ข้อความตามที่พิมพ์ (ว่าง = ไม่ระบุ) */
  lat: string;
  lng: string;
  docs: PlanFile[];
}

export const EMPTY_ADDRESS: GarageAddress = { houseNo: "", street: "", subdistrict: "", district: "", province: "", zip: "" };
export const emptyGarage = (): GarageDraft => ({ name: "", vehicleTypes: [], brands: [], addr: { ...EMPTY_ADDRESS }, phone: "", email: "", lat: "", lng: "", docs: [] });

/** ที่อยู่บรรทัดเดียว — ใช้ทุกที่ที่เคยแสดง garage.address (PO · งานรายคัน · ใบสรุป) */
export function formatAddress(a?: GarageAddress): string {
  if (!a) return "";
  return [a.houseNo && `เลขที่ ${a.houseNo}`, a.street && `ถ.${a.street.replace(/^ถ(นน|\.)\s*/, "")}`, a.subdistrict, a.district, a.province, a.zip].filter(Boolean).join(" ");
}

export const draftOf = (g: Garage): GarageDraft => ({
  name: g.name,
  vehicleTypes: g.vehicleTypes ?? [],
  brands: g.brands ?? [],
  addr: { ...EMPTY_ADDRESS, ...g.addr },
  phone: g.phone,
  email: g.email ?? "",
  lat: g.lat ?? "",
  lng: g.lng ?? "",
  docs: g.docs ?? [],
});

/** รหัส VND-xxx รันต่อจากเลขสูงสุด (ระบบจริงออกที่ server) */
export function nextGarageCode(list: Garage[]): string {
  const max = Math.max(0, ...list.map((g) => Number(g.code?.replace(/\D/g, "") || 0)));
  return `VND-${String(max + 1).padStart(3, "0")}`;
}
