"use client";
/** Figma (Component) VMS Plus › ↳ ✅ Inputs › `Number input` (2-6.json) — Size=md
 *  Container สูง 40 r8 พื้นขาว ขอบ gray-300 (Hover ขอบ brand-800) · Tertiary button 40×40 ไอคอน remove / add 20 สี gray-600 ·
 *  ตัวเลข 16/400 ดำ ชิดกลาง · ใช้ในแถวตาราง (ไม่มี label ที่เห็น — ส่ง aria-label) หรือในฟอร์ม (label ด้านบนผ่าน FieldShell ได้ในอนาคต)
 *  เพิ่ม 16 พ.ย. 2569 สำหรับตารางอะไหล่ขั้น 6 ปิดงาน ("สามารถแก้จำนวนใน row ได้เลย") */
import { cx } from "./cx";
import { Icon } from "./Icon";

export function NumberInput({ value, onChange, min = 0, max, label, disabled, className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; disabled?: boolean; className?: string }) {
  const clamp = (n: number) => Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, Math.trunc(n)));
  const btn = "flex size-10 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300";
  return (
    <div className={cx("flex h-10 w-32 items-center rounded-md border border-gray-300 bg-white hover:border-brand-800 focus-within:border-brand-800 focus-within:shadow-ring", disabled && "bg-gray-50 hover:border-gray-300", className)}>
      <button type="button" className={btn} aria-label={`ลด${label}`} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - 1))}>
        <Icon name="remove" size={20} />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        disabled={disabled}
        className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-center text-md text-black outline-none tabular-nums"
        value={String(value)}
        onChange={(e) => {
          const d = e.target.value.replace(/\D/g, "");
          onChange(clamp(d === "" ? min : Number(d)));
        }}
      />
      <button type="button" className={btn} aria-label={`เพิ่ม${label}`} disabled={disabled || (max != null && value >= max)} onClick={() => onChange(clamp(value + 1))}>
        <Icon name="add" size={20} />
      </button>
    </div>
  );
}
