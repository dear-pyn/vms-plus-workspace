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
