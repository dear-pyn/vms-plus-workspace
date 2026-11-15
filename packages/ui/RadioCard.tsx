"use client";
/** Figma (Component) VMS Plus › `Radio text card` (pad 16 · r8 · ขอบ 1 gray-300 · เลือกแล้วขอบ 2 brand-900 · hover ขอบ brand-800 · Radio button 20 + หัว 16 SemiBold/คำอธิบาย 14 gap 4 · กล่องข้อความกว้างคงที่ 176)
 *  dump 2-17.json · อ้างอิงหน้าจอ OH2 / U.3 "ผลการพิจารณา" */
import { cx } from "./cx";

export function RadioCard({ name, checked, onChange, title, description }: { name: string; checked: boolean; onChange: () => void; title: string; description?: string }) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3 rounded-md bg-white p-4 hover:border-brand-800", checked ? "border-2 border-brand-900" : "border border-gray-300")}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span aria-hidden className={cx("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border peer-focus-visible:shadow-ring", checked ? "border-brand-900 bg-brand-900" : "border-gray-300 bg-white")}>
        {checked && <span className="size-2 rounded-full bg-white" />}
      </span>
      {/* Text and supporting text: ไลบรารี Default+ไม่เลือก = FIXED 176 (w-44 ตัดบรรทัดแบบจอ R.1) · เลือกแล้ว = FILL (บรรทัดเดียวแบบ R.1.4) · หัว 16 SemiBold (Label/02)
          Hover ในไลบรารีเป็น FILL แต่ไม่สลับความกว้างตอน hover กันการ์ดกระตุก */}
      <span className={cx("flex flex-col gap-1", checked ? "min-w-0 flex-1" : "w-44")}>
        <span className="text-md font-semibold text-black">{title}</span>
        {description && <span className="text-sm text-gray-600">{description}</span>}
      </span>
    </label>
  );
}
