"use client";
/** ที่อยู่แบบเต็มของอู่ (เจ้าของงาน 19 พ.ย. 2569 "เปลี่ยนการ input ที่อยู่ เป็นแบบเต็ม" · แยก ตำบล/แขวง · อำเภอ/เขต · จังหวัด)
 *  แทนช่อง Text area "ที่อยู่ (ถ้ามี)" เดิม · เจ้าของงาน 19 พ.ย. 2569 (ต่อ): "ให้กรอกมาเอง เพราะไม่มี api ที่อยู่"
 *  ⇒ ทุกช่องเป็น Text input พิมพ์เอง ไม่มี dropdown จังหวัด → อำเภอ → ตำบล และไม่เติมรหัสไปรษณีย์ให้
 *  เจ้าของงาน 19 พ.ย. 2569 (ต่อ): "address require ยกเว้นถนน" ⇒ บังคับ เลขที่ · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์ · ถนน "(ถ้ามี)" */
import { TextField } from "@ui/TextField";
import type { GarageAddress } from "./types";

export type AddressErrors = Partial<Record<keyof GarageAddress, string>>;

export function AddressFields({ value, onChange, errors = {}, onBlur }: { value: GarageAddress; onChange: (a: GarageAddress) => void; errors?: AddressErrors; onBlur?: (k: keyof GarageAddress) => void }) {
  const field = (k: keyof GarageAddress, label: string, placeholder: string, extra: { inputMode?: "numeric"; maxLength?: number } = {}) => (
    <TextField label={label} optional={k === "street"} placeholder={placeholder} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} onBlur={() => onBlur?.(k)} error={errors[k]} {...extra} />
  );
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {field("houseNo", "เลขที่", "เช่น 99/1 หมู่ 5")}
      {field("street", "ถนน", "เช่น เพชรเกษม")}
      {field("subdistrict", "ตำบล/แขวง", "เช่น พระปฐมเจดีย์")}
      {field("district", "อำเภอ/เขต", "เช่น เมืองนครปฐม")}
      {field("province", "จังหวัด", "เช่น นครปฐม")}
      {field("zip", "รหัสไปรษณีย์", "เช่น 73000", { inputMode: "numeric", maxLength: 5 })}
    </div>
  );
}

/** บังคับทุกช่องยกเว้นถนน · รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก */
export function addressErrors(a: GarageAddress): AddressErrors {
  const zip = a.zip.trim();
  return {
    houseNo: a.houseNo.trim() ? undefined : "กรุณากรอกเลขที่",
    subdistrict: a.subdistrict.trim() ? undefined : "กรุณากรอกตำบล/แขวง",
    district: a.district.trim() ? undefined : "กรุณากรอกอำเภอ/เขต",
    province: a.province.trim() ? undefined : "กรุณากรอกจังหวัด",
    zip: !zip ? "กรุณากรอกรหัสไปรษณีย์" : /^\d{5}$/.test(zip) ? undefined : "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก",
  };
}
