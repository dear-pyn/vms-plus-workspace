"use client";
/** ชิ้นส่วนที่ใช้ซ้ำในหน้างานซ่อม — ประกอบจาก packages/ui · หน้าตายึดภาพ UAT 20 พ.ย. 2569 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { Combobox } from "@ui/Combobox";
import { Floating } from "@ui/Floating";
import { Icon } from "@ui/Icon";
import { cx } from "@ui/cx";
import { PEOPLE, statusOf, type StatusCode } from "../mock/data";

/** ป้ายสถานะในตาราง (UAT: badge border · warning/brand/success/gray) */
export function StatusPill({ status }: { status: StatusCode }) {
  const s = statusOf(status);
  return <Pill tone={s.tone}>{s.name}</Pill>;
}

/** ป้ายสถานะหัวหน้ารายละเอียด (UAT: pill พื้น brand-50 ทุกสถานะ) */
export function HeaderPill({ status }: { status: StatusCode }) {
  return <Pill tone="brand">{statusOf(status).name}</Pill>;
}

/** ป้ายบอกว่าเป็น flow ที่ต้นแบบเติม (ไม่มีใน UAT) — เฉพาะต้นแบบ */
export function AddedTag({ children = "เพิ่มใหม่ · รอยืนยัน" }: { children?: ReactNode }) {
  return (
    <span title="ไม่มีหน้าจอนี้ใน UAT (20 พ.ย. 2569) — ต้นแบบเติมให้ครบ flow รอยืนยันกับ กฟภ." className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-dashed border-purple-300 bg-purple-50 px-2 text-xs font-semibold text-purple-700">
      <Icon name="science" size={16} />
      {children}
    </span>
  );
}

/** แถบอธิบาย flow เพิ่มบนหัวส่วน */
export function AddedNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-purple-300 bg-purple-50 px-4 py-3 text-sm text-purple-800">
      <Icon name="science" size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** กล่องข้อมูลพื้นเทา (UAT: พื้น gray-50 r12 pad 24 · หัว 14/600 · ค่า 14/400 gray-700) */
export function InfoPanel({ items, cols = 2, className }: { items: [ReactNode, ReactNode][]; cols?: 2 | 3 | 4; className?: string }) {
  const grid = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[cols];
  return (
    <dl className={cx("grid grid-cols-1 gap-x-6 gap-y-5 rounded-xl bg-gray-50 p-6", grid, className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="flex min-w-0 flex-col gap-1">
          <dt className="text-sm font-semibold text-black">{k}</dt>
          <dd className="text-sm break-words text-gray-700">{v === "" || v == null ? "-" : v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** หัวข้อส่วนแบบไม่มีแถบสี (หน้าข้อมูลการซ่อม/ยืนยันการแจ้งซ่อม) */
export function PlainTitle({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-md font-semibold text-black">{children}</h2>
      {extra}
    </div>
  );
}

/** ช่องเลือกพนักงาน (UAT: ไอคอน person · "ค้นหาชื่อ-นามสกุล, รหัสพนักงาน") */
export function PersonPicker({ label, value, onChange, placeholder = "ค้นหาชื่อ-นามสกุล, รหัสพนักงาน", info, disabled, ids, className }: { label?: ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; info?: { title: string; text: string }; disabled?: boolean; ids?: string[]; className?: string }) {
  const list = PEOPLE.filter((p) => !ids || ids.includes(p.id));
  return (
    <Combobox
      label={label}
      info={info}
      icon="person"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      options={list.map((p) => ({ value: p.id, label: p.name, sub: `${p.position}`, keywords: p.unit }))}
    />
  );
}

/** เลือกหลายรายการ + ชิป (UAT ช่อง "ระบบเครนและอุปกรณ์พิเศษ" · ไลบรารียังไม่มี multi-select → ประกอบจาก Floating + ชิป RemovableBadge แบบเดียวกับ UAT) */
export function MultiSelect({ value, onChange, options, placeholder }: { value: string[]; onChange: (v: string[]) => void; options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => !box.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, [open]);
  const list = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div ref={box} className="relative">
      <div
        onClick={() => setOpen(true)}
        className={cx("flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-md border bg-white py-1.5 pr-9 pl-3 shadow-field", open ? "border-brand-800 shadow-ring" : "border-gray-300")}
      >
        {value.map((v) => (
          <span key={v} className="inline-flex h-6 items-center gap-1 rounded-xs border border-gray-300 bg-white py-0.5 pr-1 pl-2 text-xs font-medium text-gray-700">
            {v}
            <button type="button" aria-label={`ลบ ${v}`} onClick={(e) => { e.stopPropagation(); toggle(v); }} className="flex size-4 items-center justify-center text-gray-400 hover:text-gray-600">
              <Icon name="close" size={12} />
            </button>
          </span>
        ))}
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={value.length ? "" : placeholder} className="h-7 min-w-24 flex-1 border-0 bg-transparent text-md outline-none placeholder:text-gray-400" />
        <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} className="pointer-events-none absolute right-3 text-gray-500" />
      </div>
      <Floating anchor={box} open={open} floatingRef={panel}>
        <ul role="listbox" aria-multiselectable className="max-h-72 overflow-y-auto rounded-md border border-gray-300 bg-white px-2 py-3 shadow-lg">
          {list.length === 0 && <li className="px-2 py-2 text-sm text-gray-500">ไม่พบข้อมูล</li>}
          {list.map((o) => {
            const on = value.includes(o);
            return (
              <li key={o} role="option" aria-selected={on}>
                <button type="button" onClick={() => toggle(o)} className={cx("flex min-h-10 w-full items-center justify-between gap-2 rounded-xs px-2 text-left text-md hover:bg-gray-200", on ? "text-brand-900" : "text-black")}>
                  {o}
                  {on && <Icon name="check" size={24} className="text-brand-900" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Floating>
    </div>
  );
}

/** กล่องลงนาม 2 ฝั่ง (UAT ขั้น 3 "ลงนามการรับมอบรถ" · ขั้น 6 "ลงนามการส่งคืนรถ") */
/** แบบ Overhaul (StepIntake): ปุ่มเซ็นเปิดเมื่อกรอก/ติ๊กตรวจสภาพครบ (ready) · ส่งคำขอแล้วล็อกข้อมูลทั้งขั้น · ยังไม่เซ็น → "แก้ไข" ยกเลิกคำขอได้ */
export function SignBlock({ title, left, right, readOnly, hint }: { title: string; left: SignSide; right: SignSide; readOnly?: boolean; hint?: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionBar>{title}</SectionBar>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {[left, right].map((s, i) => (
          <div key={i} className="flex flex-col gap-3">
            <PersonPicker label={s.label} placeholder={s.placeholder} value={s.value ?? ""} onChange={s.onChange} disabled={readOnly || s.signed || (s.remote && s.requested)} />
            <div className="flex flex-wrap items-center gap-3">
              {!(s.remote && s.requested) && !s.signed && (
                <Button variant="secondary" size="sm" disabled={readOnly || !s.value || s.ready === false} onClick={s.onSign} className={cx((readOnly || !s.value || s.ready === false) && "border-transparent bg-gray-100 shadow-none")}>
                  {s.remote ? "ส่งให้เซ็นลงนาม" : "เซ็นลงนาม"}
                </Button>
              )}
              {s.remote && s.requested && !s.signed && s.onCancel && !readOnly && (
                <Button variant="tertiary" size="sm" iconLeft="edit" onClick={s.onCancel}>แก้ไข</Button>
              )}
              {s.signed && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-success-700">
                  <Icon name="check_circle" size={20} filled /> ลงนามแล้ว{s.signedAt ? ` · ${s.signedAt}` : ""}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {hint && <p className="text-sm text-gray-600">{hint}</p>}
    </section>
  );
}
export interface SignSide {
  label: string; placeholder: string; value?: string; onChange: (v: string) => void; signed: boolean; onSign: () => void;
  /** เพิ่มใหม่: ผู้ลงนามอยู่หน่วยงานอื่น → ส่งคำขอให้เซ็นจากหน้าของตัวเอง (แบบ IntakeApproval ของ Overhaul) */
  remote?: boolean; requested?: boolean;
  /** false = ข้อมูลตรวจสภาพยังไม่ครบ ปุ่มเซ็นปิด */ ready?: boolean;
  /** ยกเลิกคำขอเซ็น (ยังไม่เซ็น) เพื่อกลับไปแก้ข้อมูล */ onCancel?: () => void;
  /** วันที่เซ็น (ขั้น 6 = วันปิดงาน) */ signedAt?: string;
}

/** หัวข้อพร้อมแถบสี (UAT: แถบ brand 4px + 20/600) */
export function SectionBar({ children, extra, description }: { children: ReactNode; extra?: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-6 w-1 shrink-0 rounded-full bg-brand-900" />
        <h2 className="text-lg font-semibold text-black">{children}</h2>
        {extra}
      </div>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  );
}

/** ตารางหัวเทา (สไตล์ตาราง checklist ใน UAT — หัว gray-100 แถวสลับ gray-50) */
export function GridTable({ head, cols, children, className }: { head: (ReactNode | { node: ReactNode; span: number })[]; cols: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-x-auto rounded-md border border-gray-200", className)}>
      <div className="min-w-[880px]">
        <div className="grid items-center bg-gray-100 px-3 py-3 text-sm text-black" style={{ gridTemplateColumns: cols }}>
          {head.map((h, i) => {
            const spanned = !!h && typeof h === "object" && "span" in h;
            return (
              <div key={i} className="px-1" style={spanned ? { gridColumn: `span ${h.span}` } : undefined}>
                {spanned ? h.node : (h as ReactNode)}
              </div>
            );
          })}
        </div>
        <div className="[&>*:nth-child(even)]:bg-gray-50">{children}</div>
      </div>
    </div>
  );
}
export function GridRow({ cols, children }: { cols: string; children: ReactNode }) {
  return (
    <div className="grid min-h-14 items-center px-3 py-2 text-sm text-black" style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  );
}

/** กล่องอัปโหลด (UAT: "คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางบริเวณนี้") — ต้นแบบนับจำนวนไฟล์อย่างเดียว */
export function UploadBox({ hint, count, max, onAdd, disabled }: { hint: string; count: number; max: number; onAdd: (n: number) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      className={cx("flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 px-6 py-6 text-center", disabled ? "bg-gray-50" : "cursor-pointer hover:bg-gray-50")}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
        <Icon name="cloud_upload" size={20} />
      </span>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-brand-900">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวางบริเวณนี้
        <br />
        <span className="text-xs">{hint}</span>
      </p>
      {count > 0 && <p className="text-xs font-semibold text-gray-700">แนบแล้ว {count} ไฟล์</p>}
      <input ref={ref} type="file" multiple hidden onChange={(e) => { onAdd(Math.min(max - count, e.target.files?.length ?? 0)); e.target.value = ""; }} />
    </div>
  );
}
