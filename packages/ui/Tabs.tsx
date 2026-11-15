"use client";
/** Figma (Component) VMS Plus › ↳ ✅ Tabs › `Tab item` (State=Default|Hover|Focused · Active=True|False · Badge)
 *  h48 · pad 12/24 · gap 8 · ข้อความ 14/600 · ไม่เลือก gray-600 เส้นล่าง 1px gray-300 · เลือก ดำ เส้นล่าง 2px
 *  ⚠ ไลบรารีใช้ #6E1AE7 (ม่วง) เป็นเส้น active และ pill ของหน้านี้หน้าเดียว ขณะที่ทั้งไลบรารีใช้ brand #A80689 —
 *    ใช้ brand-900 ไปก่อน รอถามเจ้าของงาน (บันทึกใน PROTOTYPE-NOTES ของเคส)
 *  อ้างอิงหน้าจอ: refinement sprint 09 (OH2 / C.1 · S2 แท็บ แผน Overhaul / รถที่ Overhaul) */
import type { ReactNode } from "react";
import { CountPill } from "./Badge";
import { cx } from "./cx";

export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
}

export function Tabs({ items, value, onChange, className }: { items: TabItem[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("flex overflow-x-auto border-b border-gray-300", className)}>
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cx(
              "-mb-px flex h-12 shrink-0 items-center gap-2 border-b px-6 text-sm font-semibold whitespace-nowrap transition-colors",
              on ? "border-b-2 border-brand-900 text-black" : "border-gray-300 text-gray-600 hover:bg-gray-50",
            )}
          >
            {t.label}
            {t.count !== undefined && <CountPill>{t.count}</CountPill>}
          </button>
        );
      })}
    </div>
  );
}
