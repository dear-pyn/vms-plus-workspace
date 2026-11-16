"use client";
/** Figma (Component) VMS Plus › `Radio button` (State=Default|Hover|Focused|Disabled · Selected=True|False) — dump 2-17.json
 *  วง 20×20 · ไม่เลือก: ขอบ 2 gray-300 (Color/border/primary) พื้นขาว · เลือก: พื้น brand-900 (Color/component/selection/surface) + จุดขาว 8
 *  ปิดใช้งาน: พื้น gray-200 (surface-disabled) ขอบ 2 gray-300 · เลือกแล้วจุด gray-300 (icon-disabled) · โฟกัสคีย์บอร์ด: วงแหวน focus
 *  ใช้ในตาราง "รายการเอกสารรับรถ" (ขั้น 2 ตรวจรับรถ — ภาพ UAT 16 พ.ย. 2569) · การ์ดมีคำอธิบายใช้ <RadioCard> */
import { cx } from "./cx";

export function Radio({ name, checked, onChange, disabled, label }: { name: string; checked: boolean; onChange: () => void; disabled?: boolean; label?: string }) {
  return (
    <label className={cx("relative inline-flex", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input type="radio" name={name} aria-label={label} checked={checked} disabled={disabled} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={cx(
          "flex size-5 shrink-0 items-center justify-center rounded-full peer-focus-visible:shadow-ring",
          disabled ? "border-2 border-gray-300 bg-gray-200" : checked ? "bg-brand-900" : "border-2 border-gray-300 bg-white",
        )}
      >
        {checked && <span className={cx("size-2 rounded-full", disabled ? "bg-gray-300" : "bg-white")} />}
      </span>
    </label>
  );
}
