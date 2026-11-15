/** ยานพาหนะในระบบสำหรับ modal เลือกเข้าแผน — 60 คัน (30 คันจากชุดแท็บยานพาหนะ + 30 คันสร้างเพิ่ม)
 *  สถานะที่เลือกไม่ได้: อยู่ระหว่างซ่อม / รอจำหน่าย (EC-02 · เจ้าของงานให้ดูแค่ 2 อย่างนี้ 14 พ.ย. 2569) · ⚠ ไม่ใช่ข้อมูลจริง */
import type { FleetVehicle } from "../features/vehicle/types";
import { seedVehicles } from "./vehicles";

const PROVINCES = ["ลำพูน", "แพร่", "พะเยา", "ตาก", "กำแพงเพชร", "อุทัยธานี", "ชัยนาท", "สิงห์บุรี", "อ่างทอง", "นครนายก", "ปราจีนบุรี", "สระแก้ว", "จันทบุรี", "ตราด", "ราชบุรี", "สมุทรสาคร", "ประจวบคีรีขันธ์", "ชุมพร", "ระนอง", "พังงา", "กระบี่", "สตูล", "พัทลุง", "ปัตตานี", "นราธิวาส", "มุกดาหาร", "นครพนม", "เลย", "หนองคาย", "ยโสธร"];
const MODELS: Array<[string, string, string, number]> = [
  ["HINO", "FM2P", "รถเครน 10 ตัน", 2_040_000],
  ["ISUZU", "FVM", "รถกระเช้า", 1_890_000],
  ["HINO", "FG8J", "รถเครน 5 ตัน", 1_660_000],
  ["ISUZU", "FXZ", "รถเจาะหลุมปักเสา", 1_930_000],
  ["MITSUBISHI", "FN", "รถกระเช้า", 2_110_000],
  ["FUSO", "FJ", "รถเครน 10 ตัน", 2_300_000],
];

export function seedFleet(): FleetVehicle[] {
  const base: FleetVehicle[] = seedVehicles().map((v, i) => ({
    plate: v.plate,
    affiliation: v.affiliation,
    make: v.make,
    model: v.model,
    type: v.type,
    value: v.value,
    ageYears: v.ageYears,
    mileageKm: 150_000 + i * 3_100,
    engineHours: 7_000 + i * 210,
    // T8 (14 พ.ย. 2569): สถานะดูแค่ ระหว่างซ่อม / รอจำหน่าย
    ...(i % 9 === 4 ? { unavailableReason: "อยู่ระหว่างซ่อม" } : {}),
  }));
  const extra: FleetVehicle[] = PROVINCES.map((prov, i) => {
    const [make, model, type, value] = MODELS[i % MODELS.length];
    return {
      plate: `${84 + (i % 6)}-${String(1000 + i * 137).slice(-4)} ${prov}`,
      affiliation: `กฟฟ.${prov}`,
      make,
      model,
      type,
      value: value + (i % 5) * 35_000,
      ageYears: 9 + (i % 10),
      mileageKm: 120_000 + i * 4_700,
      engineHours: 6_000 + i * 260,
      ...(i % 11 === 5 ? { unavailableReason: "อยู่ระหว่างซ่อม" } : i % 13 === 7 ? { unavailableReason: "รอจำหน่าย" } : {}),
    };
  });
  return [...extra, ...base];
}
