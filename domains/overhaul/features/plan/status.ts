import type { PillTone } from "@ui/Badge";
import type { PlanStatus } from "./types";

/** `Pill outline` ตามจอ refinement sprint 09: "รอเลข Purchase Order" = Gray (C.1) · "รอดำเนินการ" = Info (C.1) · "เสร็จสิ้น" = Success (A.2 แผงตัวกรอง) */
export function statusTone(s: PlanStatus): PillTone {
  return s === "รอดำเนินการ" ? "info" : s === "เสร็จสิ้น" ? "success" : "gray";
}
