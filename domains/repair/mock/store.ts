/** ที่เก็บข้อมูลต้นแบบงานซ่อม (localStorage เครื่องนี้) — ใช้ร่วมกับหน้ารวม "ตอบรับนัดหมาย" / "อนุมัติงาน" ในต้นแบบ Overhaul
 *  และอ่าน master อู่/ศูนย์บริการชุดเดียวกับ Overhaul (เจ้าของงาน 23 พ.ย. 2569: ดึงจาก vendor list มาเก็บของเรา + เพิ่ม field แล้วใช้ทุกงาน)
 *  ⚠ เฉพาะต้นแบบ — ระบบจริงต้องเป็น API/DB กลาง */
import type { Garage } from "@overhaul/features/po/types";
import { seedGarages } from "@overhaul/mock/garages";
import type { RepairJob } from "../features/model";
import { seedJobs } from "./jobs";
import { protoKey } from "@/lib/protoNs";

export const REPAIR_KEY = protoKey("vms-plus:repair:v8"); // v6 (23 พ.ย. 2569): วันเซ็นรับรถคืน = วันปิดงาน · เตือน 30% ในรายการ
const GARAGE_KEY = protoKey("vms-plus:overhaul-garages:v1"); // คีย์เดียวกับต้นแบบ Overhaul (เมนู อู่/ศูนย์บริการ)

export function loadRepairJobs(): RepairJob[] {
  try {
    const raw = localStorage.getItem(REPAIR_KEY);
    return raw ? (JSON.parse(raw) as RepairJob[]) : seedJobs();
  } catch {
    return seedJobs();
  }
}
export function saveRepairJobs(jobs: RepairJob[]) {
  try { localStorage.setItem(REPAIR_KEY, JSON.stringify(jobs)); } catch { /* storage unavailable */ }
}

export function loadGarages(): Garage[] {
  try {
    const raw = localStorage.getItem(GARAGE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    const list: Garage[] = v?.version === 1 && Array.isArray(v.data) ? v.data : seedGarages();
    return list.filter((g) => !g.deleted);
  } catch {
    return seedGarages();
  }
}

/** ลิงก์ข้ามต้นแบบ */
const base = () => process.env.NEXT_PUBLIC_BASE_PATH || "";
export const repairHref = (hash: string) => `${base()}/prototypes/repair/${hash}`;
export const mergedHref = (page: "agency" | "approval", type?: "repair" | "overhaul") => `${base()}/prototypes/overhaul/#/${page}${type ? `?type=${type}` : ""}`;
