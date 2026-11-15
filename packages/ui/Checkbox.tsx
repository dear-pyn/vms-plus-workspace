"use client";
/** Figma (Component) VMS Plus › ↳ ✅ Checkbox › `Checkbox` (State=Default|Disabled · Type=Unselected|Selected|Indeterminate) — dump 2-18.json
 *  กล่อง 20×20 r4 · ไม่เลือก: ขอบ 2px gray-300 พื้นขาว · เลือก: พื้น brand-900 + check 20 ขาว · บางส่วน: พื้น brand-900 + remove 20 ขาว
 *  ปิดใช้งาน: พื้น gray-100 ขอบ gray-300 จาง · โฟกัสคีย์บอร์ด: วงแหวน focus
 *  แถวในแผงตัวกรอง (จอ OH2 / A.2 · refinement sprint 09):
 *    `Checkbox with description` — gap 12 · ข้อความ 16/400 ดำ
 *    `Checkbox with badge` — gap 12 · ป้ายเป็น `Pill outline` */
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  /** aria-label เมื่อไม่มีข้อความข้างกล่อง (เช่นในตาราง) */
  label?: string;
}

export function Checkbox({ checked, onChange, indeterminate, disabled, label }: CheckboxProps) {
  const on = checked || indeterminate;
  return (
    <label className={cx("relative inline-flex", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        aria-checked={indeterminate ? "mixed" : checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cx(
          "flex size-5 shrink-0 items-center justify-center rounded-xs border-2 transition-colors peer-focus-visible:shadow-ring",
          disabled ? "border-gray-300 bg-gray-100 opacity-60" : on ? "border-brand-900 bg-brand-900 text-white" : "border-gray-300 bg-white",
        )}
      >
        {on && !disabled && <Icon name={indeterminate ? "remove" : "check"} size={20} />}
      </span>
    </label>
  );
}

export function CheckboxRow({ checked, onChange, children, className }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3 text-md text-black", className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cx(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs border-2 transition-colors peer-focus-visible:shadow-ring",
          checked ? "border-brand-900 bg-brand-900 text-white" : "border-gray-300 bg-white",
        )}
      >
        {checked && <Icon name="check" size={20} />}
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  );
}
