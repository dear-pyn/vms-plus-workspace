"use client";
/** ข้อความแจ้งผล = Figma (Component) VMS Plus › ↳ ✅ Notifications › `Notification` (Type=Success|Warning|Error|Information · Breakpoint=Desktop)
 *  ค่าตามที่จอ refinement sprint 09 ใช้จริง (B.18 · C.5 · D.3 override เป็นพื้นขาว — ไลบรารี dump เป็นโหมดมืด):
 *    วางมุมขวาบน (กรอบ 520 pad บน/ขวา 24) · การ์ดกว้าง 400 · pad 16 · gap 16 · r12 · พื้นขาว ขอบ gray-300 · เงา shadow-lg
 *    ไอคอน 24 ทึบ: Success check_circle success-600 · Warning error warning-600 · Error cancel error-500 · Information info info-600
 *    หัวข้อ 16/600 ดำ · ข้อความรอง 14/400 gray-600 (ถ้ามี) · ปุ่มปิด Tertiary button 40 ไอคอน close 20
 *  มือถือ: ชิดบนเต็มกว้าง เว้นขอบ 16 (17 พ.ย. 2569 · เดิมกล่อง 400 ดันซ้ายไม่สมดุล)
 *  เวลาปิดเอง ไม่มีในไลบรารี — 5 วินาที (รอยืนยัน)
 *  ชื่อ export คง Toast ไว้ให้โค้ดเดิมใช้ต่อ */
import { useEffect } from "react";
import { Icon } from "./Icon";
import { Portal } from "./Modal";

export type ToastTone = "success" | "warning" | "error" | "info";
const ICON: Record<ToastTone, [string, string]> = {
  success: ["check_circle", "text-success-600"],
  warning: ["error", "text-warning-600"],
  error: ["cancel", "text-error-500"],
  info: ["info", "text-info-600"],
};

export function Toast({ message, description, tone = "success", onClose, duration = 5000 }: { message: string | null; description?: string; tone?: ToastTone; onClose: () => void; duration?: number }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);
  if (!message) return null;
  const [icon, color] = ICON[tone];
  return (
    <Portal>
      <div
        role={tone === "error" ? "alert" : "status"}
        aria-live="polite"
        className="fixed top-6 right-6 z-70 flex w-100 max-w-[calc(100%-32px)] max-md:top-4 max-md:right-4 max-md:left-4 max-md:w-auto max-md:max-w-none animate-fade-in items-start gap-4 rounded-lg border border-gray-300 bg-white p-4 [box-shadow:var(--shadow-lg)]"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Icon name={icon} size={24} filled className={color} />
          <div className="flex min-w-0 flex-col gap-2 pt-0.5">
            <span className="text-md font-semibold text-black">{message}</span>
            {description && <span className="text-sm text-gray-600">{description}</span>}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="ปิดข้อความแจ้ง" className="-m-2 flex size-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50">
          <Icon name="close" size={20} />
        </button>
      </div>
    </Portal>
  );
}
