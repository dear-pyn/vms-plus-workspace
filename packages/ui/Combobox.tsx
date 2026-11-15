"use client";
/** Figma (Component) VMS Plus › ↳ ✅ Dropdowns › `Input dropdown` (ช่องพิมพ์ค้น) + `Dropdown list` + `Dropdown list item` (2-8.json)
 *  ช่อง: เหมือน Input dropdown Size=md — ไอคอนนำ search 24 gray-500 · ลูกศร keyboard_arrow_down/up 20 gray-500 · Focused ขอบ brand-800 + วงแหวน
 *  รายการ: Dropdown list pad 12/8 · gap 8 (ระหว่างรายการ 0 ในจอ E.4) · r8 · พื้นขาว ขอบ gray-300 · เงา 0 12 16 -4 (shadow-lg)
 *    item h40 (มีข้อความรอง = สูงตามเนื้อหา) pad 0/8 · r4 · hover พื้น gray-200 · ข้อความ 16/400 ดำ · เลือกแล้วตัวอักษร brand-900 + check 24 brand-900
 *    ข้อความรอง 12/400 gray-600 (เช่น "02-111-2202 · เขตพระนคร กรุงเทพฯ" จอ OH2 / E.4)
 *  ใช้เมื่อ: ตัวเลือกเยอะ ต้องพิมพ์ค้น (ศูนย์บริการ/อู่ · ผู้ประสานงาน) — ตัวเลือกน้อยใช้ <SelectField> */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { FieldShell, fieldBoxClass, fieldControlClass } from "./Field";
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface ComboOption {
  value: string;
  label: string;
  /** ข้อความรองใต้ชื่อ */
  sub?: string;
  /** คำค้นเพิ่ม (เช่น จังหวัด เบอร์โทร) */
  keywords?: string;
}

export function Combobox({
  label, optional, error, helper, options, value, onChange, placeholder, emptyText = "ไม่พบข้อมูล", icon = "search", className, disabled, footer,
}: {
  label?: ReactNode;
  optional?: boolean;
  error?: ReactNode;
  helper?: ReactNode;
  options: ComboOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  emptyText?: string;
  icon?: string;
  className?: string;
  disabled?: boolean;
  /** ต่อท้ายรายการ เช่น ปุ่ม "เพิ่มอู่/ศูนย์บริการ" */
  footer?: ReactNode;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const sel = options.find((o) => o.value === value);
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k ? options.filter((o) => [o.label, o.sub, o.keywords].some((s) => s?.toLowerCase().includes(k))) : options;
  }, [options, q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const pick = (o: ComboOption) => {
    onChange(o.value);
    setQ("");
    setOpen(false);
  };

  return (
    <FieldShell id={id} label={label} optional={optional} error={error} helper={helper} className={className}>
      <div ref={box} className="relative">
        <div className={fieldBoxClass({ error: !!error, disabled })}>
          <Icon name={icon} size={24} className="pointer-events-none ml-0.5 text-gray-500" />
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-invalid={error ? true : undefined}
            disabled={disabled}
            autoComplete="off"
            className={cx(fieldControlClass, "pr-7")}
            placeholder={sel ? undefined : placeholder}
            value={open ? q : (sel?.label ?? "")}
            onFocus={() => {
              setOpen(true);
              setHi(Math.max(0, list.findIndex((o) => o.value === value)));
            }}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setHi(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setHi((i) => Math.min(list.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHi((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && open && list[hi]) {
                e.preventDefault();
                pick(list[hi]);
              } else if (e.key === "Escape") {
                setOpen(false);
                setQ("");
              }
            }}
          />
          <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} className="pointer-events-none absolute right-3 text-gray-500" />
        </div>
        {open && (
          <div className="absolute top-full right-0 left-0 z-30 mt-1 rounded-md border border-gray-300 bg-white px-2 py-3 [box-shadow:var(--shadow-lg)]">
            <ul id={`${id}-list`} role="listbox" className="flex max-h-72 flex-col overflow-y-auto">
              {list.length === 0 && <li className="px-2 py-2 text-md text-gray-600">{emptyText}</li>}
              {list.map((o, i) => {
                const on = o.value === value;
                return (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={on}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(o)}
                    onMouseEnter={() => setHi(i)}
                    className={cx("flex min-h-10 cursor-pointer items-center gap-2 rounded-xs px-2 py-1", i === hi ? "bg-gray-200" : "bg-white")}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cx("text-md", on ? "text-brand-900" : "text-black")}>{o.label}</span>
                      {o.sub && <span className="text-xs tracking-[-0.2px] text-gray-600">{o.sub}</span>}
                    </span>
                    {on && <Icon name="check" size={24} className="text-brand-900" />}
                  </li>
                );
              })}
            </ul>
            {footer}
          </div>
        )}
      </div>
    </FieldShell>
  );
}
