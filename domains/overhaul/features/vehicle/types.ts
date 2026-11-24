/** โครงข้อมูลยานพาหนะของ Overhaul — ฟีเจอร์รับข้อมูลจากภายนอก ไม่ผูก mock หรือ API */
import type { Requisition } from "../po/types";

/** ข้อมูลตัวยานพาหนะ (มาจากระบบยานพาหนะ — EC-06: VMMS ยังไม่มี API) */
export interface VehicleInfo {
  plate: string;
  /** สังกัด (Supporting text ใต้ทะเบียน) */
  affiliation: string;
  make: string;
  model: string;
  /** ประเภทยานพาหนะ (Supporting text ใต้ยี่ห้อ รุ่น) */
  type: string;
  /** มูลค่ายานพาหนะ / ราคาที่ได้มา (บาท) */
  value: number;
  ageYears: number;
  mileageKm?: number;
  engineHours?: number;
}

/** ยานพาหนะที่ Overhaul (แท็บ A.5) — 1 แถว ต่อ ยานพาหนะ + แผน (FigJam: car_id + ยี่ห้อ + plan_no เป็น unique) */
export interface OverhaulVehicle extends VehicleInfo {
  referencePrice: number;
  overhaulEstimate: number;
  /** ร้อยละ ทศนิยม 1 ตำแหน่ง · null = ยังไม่มีข้อมูล (แสดง —) */
  progress: number | null;
  fiscalYear: number;
}

/** ยานพาหนะในแผน (ฟอร์มสร้าง/แก้ไขแผน · รายละเอียดแผน) — ราคาใส่ทีหลังได้ (B.18 ยังไม่ระบุราคา) */
export interface PlanVehicle extends VehicleInfo {
  referencePrice: number | null;
  overhaulEstimate: number | null;
  note?: string;
  progress: number | null;
  /** v2 EC-56: ใบเบิกอะไหล่ของคันนี้ในแผน — เบิกได้ตั้งแต่ก่อนทำ Purchase Order จนกด "ซ่อมสำเร็จ" · ไม่มี = ข้อมูลก่อนมีใบเบิก (ดู requisitionsOf) */
  requisitions?: Requisition[];
}

/** ยานพาหนะในระบบที่ให้เลือกเข้าแผน (modal B.15) */
export interface FleetVehicle extends VehicleInfo {
  /** EC-02: "อยู่ระหว่างซ่อม" / "รอจำหน่าย" → เลือกไม่ได้ (T8 ดูแค่ 2 สถานะนี้) */
  unavailableReason?: "อยู่ระหว่างซ่อม" | "รอจำหน่าย";
}

export const missingPrice = (v: PlanVehicle) => v.referencePrice === null || v.overhaulEstimate === null;
