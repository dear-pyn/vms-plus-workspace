/** ที่เก็บข้อมูลต้นแบบงานซ่อม "ตาม UAT" (localStorage เครื่องนี้) · ⚠ เฉพาะต้นแบบ — ระบบจริงต้องเป็น API/DB กลาง
 *  เวอร์ชันที่ปรับตาม feedback อยู่ branch repair-v2 */
import type { RepairJob } from "../features/model";
import { seedJobs } from "./jobs";

export const REPAIR_KEY = "vms-plus:repair-uat:v1";

export function loadRepairJobs(): RepairJob[] {
  try {
    const raw = localStorage.getItem(REPAIR_KEY);
    return raw ? (JSON.parse(raw) as RepairJob[]) : seedJobs();
  } catch {
    return seedJobs();
  }
}
