/** Synthetic fixture factories, used only by the Overhaul prototype controls. */
import type { FleetVehicle, PlanVehicle } from "../features/vehicle/types";
import type { PlanDraft } from "../features/plan/types";
import { BUDGET_TYPES } from "../features/plan/types";
import { formatThaiDate } from "@ui/DateField";
export const mockDate = () => formatThaiDate(new Date());
export const mockFile = (name: string) => ({ name: `mock-${name}.pdf`, sizeKb: 128 });
export function mockPlan(current: PlanDraft, fleet: FleetVehicle[], ownCostCenter: string): PlanDraft {
  const now = new Date();
  const vehicles: PlanVehicle[] = current.vehicles.length ? current.vehicles : fleet.filter((v) => !v.unavailableReason).slice(0, 2).map((v) => ({ ...v, referencePrice: 500000, overhaulEstimate: 100000, progress: null }));
  return { ...current, name: /error/i.test(current.name) ? "แผน Overhaul ทดสอบ" : current.name || "แผน Overhaul ทดสอบ", fiscalYear: current.fiscalYear || now.getFullYear() + 543 + (now.getMonth() >= 9 ? 1 : 0), budget: Number.isFinite(current.budget) ? current.budget : 1000000, budgetType: current.budgetType || BUDGET_TYPES[0], costCenter: current.costCenter || ownCostCenter, vehicles, docs: { principle: current.docs.principle.length ? current.docs.principle : [mockFile("principle")], budget: current.docs.budget.length ? current.docs.budget : [mockFile("budget")], other: current.docs.other } };
}

/** อะไหล่จำลองขั้น 6 (กรอกเอง · มีรหัส/หมายเหตุ) — ปุ่ม Mock เติมข้อมูลอะไหล่ */
export const mockParts = () => ({
  body: [
    { id: "mk-b1", name: "ชุดลูกสูบพร้อมแหวน", code: "PE08642", qty: 6, unit: "ชุด", price: 6_850, oldQty: 6, remark: "" },
    { id: "mk-b2", name: "กรองน้ำมันเครื่อง", code: "PE08653", qty: 2, unit: "ชิ้น", price: 420, oldQty: 2, remark: "" },
    { id: "mk-b3", name: "น้ำมันเครื่อง 15W-40", code: "PE08664", qty: 18, unit: "ลิตร", price: 185, oldQty: 0, remark: "ไม่มีอะไหล่เก่า (ของเหลว)" },
  ],
  tools: [{ id: "mk-t1", name: "สายเคเบิลกว้าน", code: "PE08675", qty: 1, unit: "เส้น", price: 12_500, oldQty: 1, remark: "เปลี่ยนตามอายุใช้งาน" }],
});
/** ค่าใน modal "เพิ่มอะไหล่ที่ใช้จริง" */
export const mockPartForm = (mode: "ready" | "missing" | "error") =>
  mode === "ready"
    ? { name: "ซีลยางกันน้ำมัน", code: "SL-2045-01", qty: "2", unit: "ชิ้น", price: "450.00", remark: "เปลี่ยนตามอาการรั่วซึม" }
    : mode === "missing"
      ? { name: "ซีลยางกันน้ำมัน", code: "", qty: "", unit: "", price: "", remark: "" }
      : { name: "ซีลยางกันน้ำมัน", code: "SL-2045-01", qty: "0", unit: "ชิ้น", price: "abc", remark: "" };

