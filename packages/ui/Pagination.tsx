"use client";
/** Figma: `Table pagination` (Breakpoint=Desktop|Mobile) ของไฟล์ Component (Pagination 2-15)
 *  = Container (ข้อความ "แสดง a ถึง b จาก n รายการ" 14 ดำ + `Items per page dropdown` = `Input dropdown` 92×40 · gap 8)
 *  + Pagination (กรอบ r8 ขอบ gray-300 · `Button groups pagination item` 40×40 ขอบกั้น gray-300 · 14 gray-600 ·
 *    Hover/Active พื้น gray-200 · Previous/Next = keyboard_arrow_left/right 20 (Disabled gray-400 · ปกติ gray-500))
 *  Desktop: แถวเดียว ข้อความซ้าย ปุ่มหน้าขวา (gap 24) · Mobile: ปุ่มหน้าบน ข้อความล่าง จัดกลาง (gap 16)
 *  ⚠ components.css .pager เป็นปุ่มแยกกัน (runtime) — ยึดไลบรารีตามคำสั่ง 19 ต.ค. 2569 "ทำทั้ง component Table"
 *  จำนวนต่อหน้า (เจ้าของงานสั่ง 16 พ.ย. 2569 "แบบนี้ทุกที่" · ตัวเลือก 10 25 50 100): `Items per page dropdown` State=Default|Open|List ของไฟล์ Component (2-15)
 *    Open = ขอบ brand + วงแหวน focus + ลูกศร keyboard_arrow_up · List = `Dropdown list` กว้าง 92 r8 pad 12/8 gap 8 ขอบ gray-300 shadow-lg
 *    + `Dropdown list item` h40 r4 pad 4/8 · เลือกอยู่ = ตัวอักษร brand-900 + check 24 brand-900 (สไตล์เดียวกับ <Combobox>) · กางขึ้นด้านบน (ตารางอยู่เหนือ pagination) */
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface PaginationProps {
  /** หน้าเริ่มที่ 1 */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
  className?: string;
}

/** เลขหน้าที่แสดง — เกิน 7 หน้าแทรก "..." */
function pageList(page: number, pages: number): Array<number | "..."> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: Array<number | "..."> = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push("...");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push("...");
  out.push(pages);
  return out;
}

const ITEM = "flex size-10 shrink-0 items-center justify-center border-l border-gray-300 first:border-l-0 text-sm text-gray-600";

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [10, 25, 50, 100], className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div className={cx("flex items-center justify-between gap-6 max-md:flex-col-reverse max-md:gap-4", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-black">
          แสดง {from} ถึง {to} จาก {total} รายการ
        </span>
        <PageSizeDropdown value={pageSize} options={[...new Set([...pageSizes, pageSize])].sort((a, b) => a - b)} onChange={(n) => onPageSizeChange?.(n)} />
      </div>
      <nav aria-label="เลขหน้า" className="flex overflow-hidden rounded-md border border-gray-300 bg-white">
        <button
          type="button"
          aria-label="หน้าก่อน"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cx(ITEM, page <= 1 ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-500 hover:bg-gray-200")}
        >
          <Icon name="keyboard_arrow_left" size={20} />
        </button>
        {pageList(page, pages).map((p, i) =>
          p === "..." ? (
            <span key={"e" + i} className={ITEM}>...</span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cx(ITEM, "cursor-pointer", p === page ? "bg-gray-200" : "bg-white hover:bg-gray-200")}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="หน้าถัดไป"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className={cx(ITEM, page >= pages ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-500 hover:bg-gray-200")}
        >
          <Icon name="keyboard_arrow_right" size={20} />
        </button>
      </nav>
    </div>
  );
}

/** `Items per page dropdown` — ปุ่ม + รายการ (listbox) · คีย์บอร์ด: ↑↓ เลื่อน · Enter/Space เลือก · Esc ปิด · คลิกนอกกรอบปิด */
function PageSizeDropdown({ value, options, onChange }: { value: number; options: number[]; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);

  const show = () => {
    setHi(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const pick = (n: number) => {
    onChange(n);
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <div ref={box} className="relative inline-flex">
      <button
        ref={btn}
        type="button"
        aria-label="จำนวนแถวต่อหน้า"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "Escape") return setOpen(false);
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) return show();
            setHi((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
          }
          if (open && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            pick(options[hi]);
          }
        }}
        className={cx(
          "flex h-10 w-[92px] cursor-pointer items-center justify-between rounded-md border bg-white pr-3 pl-3 text-md text-gray-900 outline-none",
          open ? "border-brand-800 shadow-field-focus" : "border-gray-300 shadow-field focus-visible:border-brand-800 focus-visible:shadow-field-focus",
        )}
      >
        {value}
        <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} className="text-gray-500" />
      </button>
      {open && (
        <ul role="listbox" aria-label="จำนวนแถวต่อหน้า" className="absolute bottom-full left-0 z-30 mb-1 flex w-[92px] flex-col gap-2 rounded-md border border-gray-300 bg-white px-2 py-3 [box-shadow:var(--shadow-lg)]">
          {options.map((n, i) => {
            const on = n === value;
            return (
              <li
                key={n}
                role="option"
                aria-selected={on}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(n)}
                className={cx("flex h-10 cursor-pointer items-center gap-2 rounded-xs px-2 py-1", i === hi ? "bg-gray-200" : "bg-white")}
              >
                <span className={cx("flex-1 text-md", on ? "text-brand-900" : "text-black")}>{n}</span>
                {on && <Icon name="check" size={24} className="text-brand-900" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
