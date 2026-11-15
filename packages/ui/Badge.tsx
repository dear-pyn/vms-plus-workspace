/** Figma (Component) VMS Plus › ↳ ✅ Badge — ค่าทุกตัวยกจาก dump `VmOC07pKEsDkHZagOgcSU2/import-2026-11-13/2-13.json`
 *
 *  Pill = `Pill outline` (Color=Brand|Gray|Info|Success|Warning|Error|Disabled|Purple)
 *    h24 · pad 4/8 · r-full · ขอบ 1px · ข้อความ 12/600 (IBM Plex Sans Thai SemiBold · ls -0.2)
 *    สี (พื้น / ขอบ / ตัวอักษร):
 *      Brand    brand-50   brand-200   brand-900     Gray     gray-50    gray-200    gray-700
 *      Info     info-50    info-200    info-700      Success  success-50 success-200 success-700
 *      Warning  warning-50 warning-200 warning-700   Error    error-50   error-200   error-700
 *      Disabled gray-100   gray-300    gray-400      Purple   purple-50  purple-200  purple-700
 *    ใช้ที่: คอลัมน์สถานะ (OH2 / C.1 · S2 — "รอดำเนินการ" = Info · "รอเลข Purchase Order" = Gray) · จำนวนในแท็บ (Brand)
 *
 *  OutlineBadge = `Badge outline` (Color=Gray): h24 · pad 4/8 · gap 4 · r4 · พื้นขาว ขอบ gray-300 · 12/600 gray-600
 *    ใช้ที่: หัวหน้ารายละเอียดแผน "ยังไม่มี Purchase Order" (OH2 / C.5 · S2)
 *
 *  RemovableBadge = `Badge outline with remove icon` (Color=Brand): pad 4/4/4/8 · gap 4 · r4 · พื้น brand-50 ขอบ brand-200 · 12/600 brand-900 ·
 *    ไอคอนปิด 12 brand-800 · ใช้ที่: ตัวกรองที่ใช้อยู่ (Applied filters gap 8) จอ OH2 / A.7
 *
 *  StatusBadge = `Badge outline with indicator` — เหมือน OutlineBadge + จุด 6px ตามสี (Gray gray-500 · Brand brand-500 ·
 *    Info info-600 · Success success-600 · Warning warning-600 · Error error-500) */
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export type PillTone = "brand" | "gray" | "info" | "success" | "warning" | "error" | "disabled" | "purple";

const PILL: Record<PillTone, string> = {
  brand: "bg-brand-50 border-brand-200 text-brand-900",
  gray: "bg-gray-50 border-gray-200 text-gray-700",
  info: "bg-info-50 border-info-200 text-info-700",
  success: "bg-success-50 border-success-200 text-success-700",
  warning: "bg-warning-50 border-warning-200 text-warning-700",
  error: "bg-error-50 border-error-200 text-error-700",
  disabled: "bg-gray-100 border-gray-300 text-gray-400",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
};

const TEXT_12_600 = "text-xs font-semibold tracking-[-0.2px] whitespace-nowrap";

export function Pill({ tone = "brand", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex h-6 shrink-0 items-center justify-center rounded-full border px-2 py-1", TEXT_12_600, PILL[tone], className)}>{children}</span>;
}

/** จำนวนในแท็บ / หัวข้อ — Pill outline Color=Brand */
export function CountPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Pill tone="brand" className={cx("min-w-6", className)}>
      {children}
    </Pill>
  );
}

/** `Badge outline` Color=Gray|Brand|Success|Error|Disabled (2-13.json) — ป้ายสถานะบนหัวหน้ารายละเอียด (OH2 / E.1 Gray "ยังไม่มี Purchase Order" · G.1 Brand "รอดำเนินการ") */
export type OutlineTone = "gray" | "brand" | "success" | "error" | "disabled";
const OUTLINE: Record<OutlineTone, string> = {
  gray: "border-gray-300 bg-white text-gray-600",
  brand: "border-brand-200 bg-brand-50 text-brand-900",
  success: "border-success-200 bg-success-50 text-success-700",
  error: "border-error-200 bg-error-50 text-error-700",
  disabled: "border-gray-300 bg-gray-100 text-gray-400",
};

export function OutlineBadge({ tone = "gray", children, className }: { tone?: OutlineTone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex h-6 shrink-0 items-center gap-1 rounded-xs border px-2 py-1", OUTLINE[tone], TEXT_12_600, className)}>{children}</span>;
}

export type BadgeTone = "gray" | "brand" | "info" | "success" | "warning" | "error";

const DOT: Record<BadgeTone, string> = {
  gray: "bg-gray-500",
  brand: "bg-brand-500",
  info: "bg-info-600",
  success: "bg-success-600",
  warning: "bg-warning-600",
  error: "bg-error-500",
};

export function StatusBadge({ tone = "gray", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <OutlineBadge className={className}>
      <span aria-hidden className={cx("size-1.5 rounded-full", DOT[tone])} />
      {children}
    </OutlineBadge>
  );
}

export function RemovableBadge({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <span className={cx("inline-flex h-6 shrink-0 items-center gap-1 rounded-xs border border-brand-200 bg-brand-50 py-1 pr-1 pl-2 text-brand-900", TEXT_12_600)}>
      {children}
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="flex size-4 items-center justify-center rounded-xs text-brand-800 hover:bg-brand-100">
        <Icon name="close" size={12} />
      </button>
    </span>
  );
}
