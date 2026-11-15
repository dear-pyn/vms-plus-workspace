/** Figma (Component) VMS Plus › `Empty state/Search not found` · `Empty state/Data empty` (dump 2-14.json · จอ OH2 / A.3 · A.4)
 *  กล่อง pad 40/0 · gap 24 · กลางจอ · เนื้อหากว้าง 360 gap 12 · ภาพประกอบ 200×200 (ยกจาก dump → public/illustrations/)
 *  หัวข้อ 24/600 ดำ กึ่งกลาง · ข้อความรอง 16/400 gray-600 · ระยะหัวข้อ-ข้อความ 8 · ปุ่ม md ใต้ข้อความ */
import type { ReactNode } from "react";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const ART = { "search-not-found": "search-not-found.png", "data-empty": "data-empty.png" } as const;

export function EmptyState({ kind, title, description, action }: { kind: keyof typeof ART; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6 bg-white py-10">
      <div className="flex w-90 max-w-full flex-col items-center gap-3 text-center">
        <img src={`${base}/illustrations/${ART[kind]}`} alt="" width={200} height={200} />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-black">{title}</h2>
          {description && <p className="text-md text-gray-600">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
