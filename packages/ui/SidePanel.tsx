"use client";
/** แผงด้านขวา (ตัวกรอง) — ค่าจากจอ OH2 / A.2 · refinement sprint 09 (dump figma-overhaul-refinement-09)
 *  `Background overlay` ดำ 40% (#00000066) · Panel กว้าง 480 สูงเต็มจอ พื้นขาว gap 24
 *  `Side panel header` pad 24 · gap 16 · เส้นล่าง gray-300 · `Featured icon` Gray md 48 (พื้น gray-100) · หัวข้อ 20/600 ดำ · ข้อความรอง 14/400 gray-600 · ปุ่มปิด close 24
 *  Content pad 0/24 · gap 24 (เลื่อนในแผงได้)
 *  `Side panel footer` pad 16/24 · gap 12 · เส้นบน gray-300 · ซ้าย `Tertiary brand button` · ขวา `Secondary button` + `Primary button`
 *  มือถือ (< 768) ใช้เต็มความกว้าง — AC หน้า 1 หัวข้อ 5 ระบุ bottom sheet บนมือถือ (ยังไม่ทำในรอบนี้) */
import type { ReactNode } from "react";
import { FeaturedIcon, Portal, useOverlay } from "./Modal";
import { Icon } from "./Icon";

export interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: string;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
}

export function SidePanel({ open, onClose, title, description, icon = "filter_list", children, footerLeft, footerRight }: SidePanelProps) {
  useOverlay(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-60 bg-black/40" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={title} className="fixed inset-y-0 right-0 z-60 flex w-120 max-w-full animate-drawer-in flex-col gap-6 bg-white">
        <header className="flex items-start gap-4 border-b border-gray-300 p-6">
          <FeaturedIcon name={icon} tone="gray" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-lg font-semibold text-black">{title}</h2>
            {description && <p className="text-sm tracking-[-0.2px] text-gray-600">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="flex size-6 items-center justify-center text-gray-500 hover:text-gray-700">
            <Icon name="close" size={24} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6">{children}</div>
        {(footerLeft || footerRight) && (
          <footer className="flex items-center gap-3 border-t border-gray-300 px-6 py-4">
            {footerLeft}
            <div className="ml-auto flex items-center gap-3">{footerRight}</div>
          </footer>
        )}
      </aside>
    </Portal>
  );
}

/** หัวข้อกลุ่มในแผง = `Input label` (16/600 gray-600 ตาม Field.tsx) · กลุ่ม gap 12 */
export function PanelSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-md font-semibold text-gray-600">{label}</legend>
      {children}
    </fieldset>
  );
}
