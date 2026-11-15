"use client";
/** Figma (Component) VMS Plus › `Notification card` (314 กว้าง) = `_Notification header` ("แจ้งเตือน" + Badge outline Gray "n แจ้งเตือนใหม่") ·
 *  เนื้อหา สูงสุด 400 เลื่อนได้ · `_Notification item base` (p12 · gap8 · เส้นล่าง gray-200 · Status 12 · ข้อความ 14 ดำ · เวลา 12 gray-600) ·
 *  `_Notification footer` (Primary button เต็มความกว้าง "ลบข้อความแจ้งเตือนทั้งหมด")
 *  ใช้ที่: OH2 / Q.1–Q.4 (แจ้งเตือนประกันใกล้หมด) · มติ FigJam (Refinement 9/11/2026): กระดิ่งแสดง badge dot สีเขียว + list ·
 *  แยกอ่านแล้ว/ยังไม่อ่านด้วยพื้นหลัง · มีสถานะรายการว่าง */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { OutlineBadge } from "./Badge";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { cx } from "./cx";

export type NotificationStatus = "success" | "warning" | "error" | "info" | "brand";
export interface NotificationItem {
  id: string;
  text: ReactNode;
  time: string;
  status: NotificationStatus;
  unread?: boolean;
}

const DOT: Record<NotificationStatus, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
  info: "bg-info-500",
  brand: "bg-brand-500",
};

/** ปุ่มกระดิ่ง + แผง Notification card (เปิดใต้กระดิ่ง ชิดขวา) */
export function NotificationBell({ items, onOpenItem, onClearAll }: { items: NotificationItem[]; onOpenItem: (id: string) => void; onClearAll: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((x) => x.unread).length;
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={unread ? `การแจ้งเตือน (${unread} ใหม่)` : "การแจ้งเตือน"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="relative flex size-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200">
        <Icon name="notifications" size={24} />
        {unread > 0 && <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-success-500 ring-2 ring-white" />}
      </button>
      {open && (
        <div role="dialog" aria-label="แจ้งเตือน" className="absolute top-12 right-0 z-50 flex w-[314px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white [box-shadow:var(--shadow-lg)]">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-3">
            <span className="text-lg font-semibold text-black">แจ้งเตือน</span>
            {unread > 0 && <OutlineBadge>{unread} แจ้งเตือนใหม่</OutlineBadge>}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-gray-600">ไม่มีการแจ้งเตือน</p>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenItem(n.id);
                    }}
                    className={cx("flex w-full items-start gap-2 border-b border-gray-200 p-3 text-left hover:bg-gray-50", n.unread && "bg-brand-25")}
                  >
                    <span className="flex h-[17px] shrink-0 items-center">
                      <span className={cx("size-3 rounded-full", DOT[n.status])} />
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className={cx("text-sm text-black", n.unread && "font-semibold")}>{n.text}</span>
                      <span className="text-xs text-gray-600">{n.time}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <Button block onClick={onClearAll}>
                ลบข้อความแจ้งเตือนทั้งหมด
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
