"use client";
/** ช่องเลือกแผนหลายแผน + พิมพ์ค้นได้ — ใช้ทั้งระดับแผนและระดับยานพาหนะ (เจ้าของงาน 17 พ.ย. 2569 "ระดับแผน ระดับรถควรกรองได้คล้ายๆกัน เลือกได้ และ search ได้")
 *  ช่อง = `Input dropdown` แบบพิมพ์ค้น (ไอคอน search นำ · ลูกศรท้าย) เหมือน <Combobox> · แผนที่เลือกเป็นชิป `Badge` removable หน้าช่องพิมพ์
 *    เลือกครบทุกแผน = แสดงชิปเดียว "ทุกแผน (n)" กันช่องยาว
 *  รายการ = `Dropdown list` + `Dropdown list item` Type=Default (2-8.json): เลือกแล้วตัวอักษร brand-900 + check 24 ขวา · hover gray-200
 *    (ไลบรารีไม่มี item แบบ checkbox — เจ้าของงาน 17 พ.ย. 2569) · ท้ายรายการ: จำนวนที่เลือก + `Tertiary brand button` เลือกทุกแผน
 *  ต้องเหลืออย่างน้อย 1 แผนเสมอ (เอาแผนสุดท้ายออกไม่ได้)
 *  ⚠ ไลบรารี VMS Plus ไม่มี multi-select dropdown — ประกอบจากของในไลบรารีข้างบน รอทีมออกแบบยืนยัน */
import { useEffect, useId, useRef, useState } from "react";
import { RemovableBadge } from "@ui/Badge";
import { Button } from "@ui/Button";
import { FieldShell, fieldBoxClass } from "@ui/Field";
import { Icon } from "@ui/Icon";
import type { DashPlan } from "../../mock/dashboard";

const chip = "inline-flex h-6 shrink-0 items-center rounded-xs border border-brand-200 bg-brand-50 px-2 text-xs font-semibold text-brand-900";

export function PlanMultiSelect({ label, plans, value, onChange }: { label: string; plans: DashPlan[]; value: string[]; onChange: (ids: string[]) => void }) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) { setOpen(false); setQ(""); }
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const picked = plans.filter((p) => value.includes(p.id));
  const all = picked.length === plans.length && plans.length > 1;
  const k = q.trim().toLowerCase();
  const list = k ? plans.filter((p) => `${p.planNo} ${p.planName}`.toLowerCase().includes(k)) : plans;
  const set = (ids: string[]) => ids.length && onChange(plans.filter((p) => ids.includes(p.id)).map((p) => p.id));
  const toggle = (pid: string, on: boolean) => set(on ? [...value, pid] : value.filter((v) => v !== pid));
  return (
    <FieldShell id={id} label={label}>
      <div ref={box} className="relative">
        <div className={`${fieldBoxClass({})} h-auto! min-h-10 cursor-text py-1.5`} onClick={() => { setOpen(true); input.current?.focus(); }}>
          <Icon name="search" size={24} className="pointer-events-none ml-0.5 shrink-0 text-gray-500" />
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {all ? (
              <span className={chip}>ทุกแผน ({plans.length})</span>
            ) : (
              picked.map((p) =>
                picked.length > 1 ? (
                  <span key={p.id} onClick={(e) => e.stopPropagation()}>
                    <RemovableBadge onRemove={() => toggle(p.id, false)} removeLabel={`เอาแผน ${p.planNo} ออก`}>{p.planNo}</RemovableBadge>
                  </span>
                ) : (
                  <span key={p.id} className={chip}>{p.planNo}</span>
                ),
              )
            )}
            <input
              ref={input}
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-label={`${label} เลือกแล้ว ${picked.length} แผน`}
              value={q}
              placeholder="ค้นหาเลขแผน, ชื่อแผน"
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); setQ(""); }
                else if (e.key === "Enter" && list.length === 1) { e.preventDefault(); toggle(list[0].id, !value.includes(list[0].id)); setQ(""); }
                else if (e.key === "Backspace" && !q && picked.length > 1 && !all) toggle(picked[picked.length - 1].id, false);
              }}
              className="h-7 min-w-32 flex-1 border-0 bg-transparent p-0 text-md text-gray-900 outline-none placeholder:text-gray-400"
            />
          </span>
          <button type="button" tabIndex={-1} aria-hidden className="flex shrink-0 items-center text-gray-500" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} />
          </button>
        </div>
        {open && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-gray-300 bg-white px-2 py-3 [box-shadow:var(--shadow-lg)]">
            <ul id={`${id}-list`} role="listbox" aria-multiselectable="true" aria-label={label} className="flex max-h-72 flex-col overflow-y-auto">
              {list.length === 0 && <li className="px-2 py-2 text-md text-gray-600">ไม่พบแผน</li>}
              {list.map((p) => {
                const on = value.includes(p.id);
                const last = on && value.length === 1;
                return (
                  <li
                    key={p.id}
                    role="option"
                    aria-selected={on}
                    aria-disabled={last || undefined}
                    title={last ? "ต้องเลือกอย่างน้อย 1 แผน" : undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(p.id, !on)}
                    className={`flex min-h-10 items-center gap-2 rounded-xs px-2 py-1 hover:bg-gray-200 ${last ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`text-md ${on ? "text-brand-900" : "text-black"}`}>{p.planNo}</span>
                      <span className="text-xs tracking-[-0.2px] text-gray-600">{p.planName}</span>
                    </span>
                    {on && <Icon name="check" size={24} className="text-brand-900" />}
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-2 pt-2">
              <span className="text-xs text-gray-600">เลือกแล้ว {picked.length} จาก {plans.length} แผน · ต้องเลือกอย่างน้อย 1 แผน</span>
              {!all && plans.length > 1 && <Button variant="tertiaryBrand" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => set(plans.map((p) => p.id))}>เลือกทุกแผน</Button>}
            </div>
          </div>
        )}
      </div>
    </FieldShell>
  );
}
