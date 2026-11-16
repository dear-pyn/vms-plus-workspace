/** Figma (Component) VMS Plus › ↳ ✅ Alerts › `Alert` (2-11.json)
 *  Color=Error: pad 12 · gap 12 · r8 · พื้น error-50 ขอบ error-200 · ไอคอน cancel_circle fill 24 error-500 ·
 *  ข้อความ 16/600 ดำ · ข้อความรอง 14/400 gray-600 (gap 4) · ปุ่มปิด Tertiary 40 (ถ้ามี onClose)
 *  ใช้ที่: OH2 / E.3 "กรุณาเลือกรถอย่างน้อย 1 คัน" ใต้ empty state ของตารางยานพาหนะใน PO */
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export type AlertTone = "error" | "warning" | "success" | "info" | "brand";
const TONE: Record<AlertTone, { box: string; icon: string; name: string }> = {
  error: { box: "border-error-200 bg-error-50", icon: "text-error-500", name: "cancel" },
  warning: { box: "border-warning-200 bg-warning-50", icon: "text-warning-600", name: "warning" },
  success: { box: "border-success-200 bg-success-50", icon: "text-success-500", name: "check_circle" },
  info: { box: "border-info-200 bg-info-50", icon: "text-info-600", name: "info" },
  brand: { box: "border-brand-200 bg-brand-50", icon: "text-brand-800", name: "info" },
};

export function Alert({ tone = "error", title, children, onClose, className }: { tone?: AlertTone; title: ReactNode; children?: ReactNode; onClose?: () => void; className?: string }) {
  const t = TONE[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cx("flex items-start gap-3 rounded-md border p-3", t.box, className)}>
      <Icon name={t.name} filled size={24} className={cx("shrink-0", t.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-md font-semibold tracking-[-0.2px] text-black">{title}</p>
        {children && <div className="text-sm tracking-[-0.2px] text-gray-600">{children}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="ปิด" className="-my-2 -mr-2 flex size-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100">
          <Icon name="close" size={20} />
        </button>
      )}
    </div>
  );
}
