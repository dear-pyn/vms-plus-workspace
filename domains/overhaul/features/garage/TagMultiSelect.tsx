"use client";
/** Dropdown multi-select ของฟอร์มอู่ (ประเภท/ยี่ห้อยานพาหนะที่รองรับ) — จอเจ้าของงาน 19 พ.ย. 2569 เขียน "Dropdown multi-select"
 *  ประกอบแบบเดียวกับ PlanMultiSelect (Dashboard): ช่องพิมพ์ค้น + ชิป RemovableBadge + Dropdown list item (เลือกแล้ว brand-900 + check)
 *  ต่างกันที่ไม่บังคับเลือก (ว่างได้) · ⚠ ไลบรารี VMS Plus ไม่มี multi-select dropdown — รอทีมออกแบบยืนยัน */
import { useEffect, useId, useRef, useState } from "react";
import { RemovableBadge } from "@ui/Badge";
import { FieldShell, fieldBoxClass } from "@ui/Field";
import { Icon } from "@ui/Icon";

export function TagMultiSelect({ label, optional, error, options, value, onChange, onClose, placeholder }: { label: string; optional?: boolean; error?: string; options: string[]; value: string[]; onChange: (v: string[]) => void; /** ปิดรายการ (คลิกนอก/Esc) — ใช้ตรวจช่องบังคับ */ onClose?: () => void; placeholder: string }) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) { setOpen(false); setQ(""); onClose?.(); }
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open, onClose]);
  const k = q.trim().toLowerCase();
  const list = k ? options.filter((o) => o.toLowerCase().includes(k)) : options;
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : options.filter((x) => x === o || value.includes(x)));
  return (
    <FieldShell id={id} label={label} optional={optional} error={error}>
      <div ref={box} className="relative">
        <div className={`${fieldBoxClass({ error: !!error })} h-auto! min-h-10 cursor-text py-1.5`} onClick={() => { setOpen(true); input.current?.focus(); }}>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {value.map((v) => (
              <span key={v} onClick={(e) => e.stopPropagation()}>
                <RemovableBadge onRemove={() => toggle(v)} removeLabel={`เอา ${v} ออก`}>{v}</RemovableBadge>
              </span>
            ))}
            <input
              ref={input}
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-invalid={!!error || undefined}
              value={q}
              placeholder={value.length ? "" : placeholder}
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); setQ(""); onClose?.(); }
                else if (e.key === "Enter" && list.length === 1) { e.preventDefault(); toggle(list[0]); setQ(""); }
                else if (e.key === "Backspace" && !q && value.length) toggle(value[value.length - 1]);
              }}
              className="h-7 min-w-24 flex-1 border-0 bg-transparent p-0 text-md text-gray-900 outline-none placeholder:text-gray-400"
            />
          </span>
          <button type="button" tabIndex={-1} aria-hidden className="flex shrink-0 items-center text-gray-500" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} />
          </button>
        </div>
        {open && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-gray-300 bg-white px-2 py-3 [box-shadow:var(--shadow-lg)]">
            <ul id={`${id}-list`} role="listbox" aria-multiselectable="true" aria-label={label} className="flex max-h-72 flex-col overflow-y-auto">
              {list.length === 0 && <li className="px-2 py-2 text-md text-gray-600">ไม่พบข้อมูล</li>}
              {list.map((o) => {
                const on = value.includes(o);
                return (
                  <li key={o} role="option" aria-selected={on} onMouseDown={(e) => e.preventDefault()} onClick={() => toggle(o)} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs px-2 py-1 hover:bg-gray-200">
                    <span className={`min-w-0 flex-1 text-md ${on ? "text-brand-900" : "text-black"}`}>{o}</span>
                    {on && <Icon name="check" size={24} className="text-brand-900" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </FieldShell>
  );
}
