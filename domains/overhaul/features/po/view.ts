/** ค่าที่หน้าจอคำนวณจาก Purchase Order + งานรายคัน */
import { parseThaiDate } from "@ui/DateField";
import type { PurchaseOrder, VehicleJob } from "./types";

/** ความคืบหน้า Purchase Order = เฉลี่ยความคืบหน้ารายคัน (จอ G.1: 62% · 40% · 100%) ทศนิยม 1 ตำแหน่ง */
export function poProgress(po: PurchaseOrder, jobs: VehicleJob[]): number {
  const js = jobs.filter((j) => j.poId === po.id);
  if (!js.length) return 0;
  return Math.round((js.reduce((n, j) => n + j.progress, 0) / js.length) * 10) / 10;
}

/** ข้อความรองสีแดงใต้วันสิ้นสุดสัญญา (จอ G.1 "ใกล้ครบสัญญา (เหลือ 7 วัน)") — เกณฑ์ 30 วัน (ตัดสินใจแทนไปก่อน รอเคาะ) */
export function contractNote(end: string, done: boolean, today = new Date()): string | null {
  const e = parseThaiDate(end);
  if (!e || done) return null;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((e.getTime() - t.getTime()) / 86_400_000);
  if (days < 0) return `ครบสัญญาแล้ว (เลยมา ${-days} วัน)`;
  if (days <= 30) return `ใกล้ครบสัญญา (เหลือ ${days} วัน)`;
  return null;
}
