/** Figma (Component) VMS Plus › `Progress bar` (Label=Right · Size=md · Percentage=true) — dump 2843-13902.json
 *  แถว: gap 8 · แถบเต็มความกว้างที่เหลือ สูง 8 r-full · Track gray-300 (Color/component/progress/track)
 *  · ตัวเลข กว้างขั้นต่ำ 40 ชิดขวา (ขยายได้เมื่อมีทศนิยม เช่น 100.0% — แถบหดแทน) 14/400 gray-600 (Color/text/secondary)
 *  สีแถบ Progress:
 *    tone="brand" (ค่าตั้งต้นของ Progress bar เดี่ยว) = brand-900 (Color/component/progress/progress)
 *    tone="info"  (ในตาราง) = icon-info #444CE7 (Color/icon/info) — `Table cell` Style=Lead Progress Bar ในไลบรารี (2-14.json) ใช้ค่านี้
 *  decimals = จำนวนทศนิยมของตัวเลข (FigJam refinement: "percent แบบทศนิยม 1 ตำแหน่ง" สำหรับความคืบหน้ารายคัน)
 *  ใช้ในตาราง: pad 8/16 · ช่อง 160 → แถบ 80 + ตัวเลข 40 · อ้างอิงหน้าจอ refinement sprint 09 (OH2 / C.1 · S2) */
import { cx } from "./cx";

export function ProgressBar({ value, tone = "brand", decimals = 0, className, label }: { value: number; tone?: "brand" | "info"; decimals?: number; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "ความคืบหน้า"} className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-300">
        <div className={cx("h-full rounded-full", tone === "info" ? "bg-icon-info" : "bg-brand-900")} style={{ width: `${v}%` }} />
      </div>
      <span className="min-w-10 shrink-0 text-right text-sm tracking-[-0.2px] text-gray-600 tabular-nums">{v.toFixed(decimals)}%</span>
    </div>
  );
}
