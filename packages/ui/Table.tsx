/** Figma (Component) VMS Plus › ↳ ✅ Table › `Table` · `Table header cell` · `Table cell`
 *  หัว: h44 · pad 12/16 · พื้น gray-100 · 14/600 ดำ · มุมโค้ง 8 ที่ปลายแถวหัว (ตรงกับระบบเดิม vmsplus-dev)
 *  แถว: สูงขั้นต่ำ 56 รวมเส้นล่าง (stroke INSIDE → วาดเส้นด้วย inset shadow ไม่บวกความสูง · ปุ่ม action 40 + pad 8/8 = 56 พอดี) · pad 8/16 · เส้นล่าง 1px gray-200 · 14/400 · Supporting text 12 gray-600 (บรรทัดที่ 2)
 *  ตารางกว้างเกินจอ → เลื่อนแนวนอนในกรอบ (ระบบเดิมไม่ fix คอลัมน์ action — ดู design/reference/legacy-table-pattern.md)
 *  อ้างอิงหน้าจอ: refinement sprint 09 (OH2 / C.1 · S2 รายการแผน · C.2 ตารางรถในฟอร์ม) */
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cx } from "./cx";

/** striped = `Table` Alternating fills=True — แถวคู่พื้น gray-50 (Table cell Alternating fills=True fill #F9FAFB) */
/** scrollY = กรอบเลื่อนแนวตั้งเอง (หัวตารางติดบน) — ใช้ใน modal ที่เลื่อนเฉพาะตาราง */
/** cols = ความกว้างคอลัมน์คงที่ (px) → table-fixed: เปลี่ยนหน้าแล้วคอลัมน์ไม่ขยับ (เจ้าของงาน 14 พ.ย. 2569) */
export function DataTable({ children, className, label, striped, scrollY, cols }: { children: ReactNode; className?: string; label: string; striped?: boolean; scrollY?: boolean; cols?: number[] }) {
  return (
    <div className={cx(scrollY ? "min-h-0 flex-1 overflow-auto [&_th]:sticky [&_th]:top-0 [&_th]:z-10" : "overflow-x-auto", className)}>
      <table aria-label={label} className={cx("w-full border-separate border-spacing-0 text-left text-sm", cols ? "table-fixed" : "min-w-max", striped && "[&>tbody>tr:nth-child(even)]:bg-gray-50")}>
        {cols && (
          <colgroup>
            {cols.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
        )}
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cx("h-11 bg-gray-100 px-4 py-3 font-semibold whitespace-nowrap text-black first:rounded-l-md last:rounded-r-md", className)} {...rest}>
      {children}
    </th>
  );
}

export function Td({ children, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cx("h-14 [box-shadow:inset_0_-1px_0_var(--gray-200)] px-4 py-2 align-middle text-black", className)} {...rest}>
      {children}
    </td>
  );
}

/** เซลล์ 2 บรรทัด: ข้อความหลัก + Supporting text */
export function CellStack({ main, sub }: { main: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span>{main}</span>
      {sub && <span className="text-xs text-gray-600">{sub}</span>}
    </div>
  );
}
