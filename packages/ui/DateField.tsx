"use client";
/** ช่องวันที่ + ปฏิทิน — เจ้าของงานสั่ง 16 พ.ย. 2569 "วันที่ให้ใช้ calendar"
 *  ช่อง: `Text input` (Size=md) + ไอคอนนำหน้า calendar_month · placeholder "วว/ดด/ปปปป" · ยังพิมพ์ได้ (ใส่ "/" ให้เอง) · ปี พ.ศ.
 *  ปฏิทิน: ไลบรารี `Date picker` [Type=Single] (ไฟล์ Component หน้า "✅ Date picker" 855:376) ไม่มี `_Time picker` —
 *    กล่อง 312 r16 ขอบ gray-300 พื้นขาว · Calendar p16 gap12 · Header = Tertiary 40 ‹ · ชื่อเดือน 14/600 · Tertiary 40 › ·
 *    `_Date picker calendar item base` 40×40 วงกลม 14/400 (หัววัน 14/600) — Selected day = brand-900 ตัวขาว (hover brand-800) ·
 *    Today = พื้น gray-100 ตัว brand-900 (hover gray-200) · `_Date picker footer` p16 ขอบบน gray-300: Tertiary brand "วันนี้" | Secondary "ยกเลิก" + Primary "ตกลง"
 *  ชื่อเดือนไทย + ปี พ.ศ. ตามที่ UI Release#2 ใช้ ("มกราคม 2567") · หัววัน จ–อา เริ่มวันจันทร์ตามไลบรารี (Mo…Su)
 *  ยังไม่ทำ: `_Date picker month list` / `year list` (กดชื่อเดือนเพื่อเลือกเดือน/ปี) — เลื่อนทีละเดือนด้วยลูกศร */
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Floating } from "./Floating";
import { Button } from "./Button";
import { cx } from "./cx";
import { TextField } from "./TextField";

/** "dd/mm/yyyy" (พ.ศ.) → Date | null */
export function parseThaiDate(t: string): Date | null {
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3]) - 543];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}

/** Date → "dd/mm/yyyy" (พ.ศ.) */
export function formatThaiDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`;
}

function mask(t: string) {
  const n = t.replace(/\D/g, "").slice(0, 8);
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join("/");
}

const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** `Date picker` — Type=Single (เลือกวันเดียว) หรือ range (เลือกวันเริ่ม แล้ววันสิ้นสุด) แล้วกด "ตกลง"
 *  range ใช้ variant `Day in range` ของ `_Date picker calendar item base`: วันในช่วง = พื้น gray-100 + connector gray-100 เชื่อมเป็นแถบ ·
 *  วันเริ่ม/สิ้นสุด = Selected day (brand-900) */
export function DatePicker({ value, end: endValue = null, range = false, min, max, onApply, onCancel, className }: {
  value: Date | null;
  /** range: วันสิ้นสุดเดิม */
  end?: Date | null;
  range?: boolean;
  /** วันแรกที่เลือกได้ — วันก่อนหน้า = State Disabled (ตัว gray-400 กดไม่ได้) */
  min?: Date;
  /** วันสุดท้ายที่เลือกได้ */
  max?: Date;
  onApply: (d: Date, end?: Date) => void;
  onCancel: () => void;
  className?: string;
}) {
  const today = new Date(new Date().toDateString());
  const [draft, setDraft] = useState<Date | null>(value);
  const [draftEnd, setDraftEnd] = useState<Date | null>(range ? endValue : null);
  /* เปิดที่เดือนของค่าเดิม — ถ้าค่าเดิมก่อน min (เช่นนัดเก่าที่เลยมาแล้ว) เปิดที่เดือนของ min แทน กันกดวันในเดือนเก่าโดยไม่ตั้งใจ */
  const [view, setView] = useState(() => {
    const base = value && (!min || value >= min) ? value : (min ?? today);
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const y = view.getFullYear();
  const m = view.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // เริ่มวันจันทร์
  const days = new Date(y, m + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const pick = (date: Date) => {
    if (!range) return setDraft(date);
    if (!draft || draftEnd || date < draft) { setDraft(date); setDraftEnd(null); return; }
    setDraftEnd(date);
  };
  const ready = range ? !!draft && !!draftEnd : !!draft;
  const band = range && draft && draftEnd && !sameDay(draft, draftEnd);
  return (
    <div role="dialog" aria-label={range ? "เลือกช่วงวันที่" : "เลือกวันที่"} className={cx("w-78 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-300 bg-white shadow-lg", className)}>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Button variant="tertiary" iconOnly="keyboard_arrow_left" aria-label="เดือนก่อนหน้า" onClick={() => setView(new Date(y, m - 1, 1))} />
          <span className="text-sm font-semibold text-black" aria-live="polite">{`${MONTHS[m]} ${y + 543}`}</span>
          <Button variant="tertiary" iconOnly="keyboard_arrow_right" aria-label="เดือนถัดไป" onClick={() => setView(new Date(y, m + 1, 1))} />
        </div>
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <span key={w} className="flex h-10 items-center justify-center text-sm font-semibold text-black">{w}</span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={`b${i}`} className="h-10" />;
            const date = new Date(y, m, d);
            const isStart = sameDay(date, draft);
            const isEnd = sameDay(date, draftEnd);
            const selected = isStart || isEnd;
            const inRange = !!band && date > draft! && date < draftEnd!;
            const isToday = sameDay(date, today);
            const off = (!!min && date < new Date(min.toDateString())) || (!!max && date > new Date(max.toDateString()));
            return (
              <span key={d} className="relative flex h-10 items-center justify-center">
                {/* connector (Day in range): แถบ gray-100 เชื่อมวันเริ่ม–สิ้นสุด */}
                {band && (inRange || isStart || isEnd) && (
                  <span aria-hidden className={cx("absolute inset-y-0 bg-gray-100", inRange ? "inset-x-0" : isStart ? "right-0 left-1/2" : "right-1/2 left-0")} />
                )}
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${d} ${MONTHS[m]} ${y + 543}`}
                  disabled={off}
                  onClick={() => pick(date)}
                  className={cx(
                    "relative flex size-10 items-center justify-center rounded-full text-sm focus-visible:outline-2 focus-visible:outline-brand-900",
                    off ? "cursor-not-allowed text-gray-400" : selected ? "bg-brand-900 text-white hover:bg-brand-800" : inRange ? "bg-gray-100 text-black hover:bg-gray-200" : isToday ? "bg-gray-100 text-brand-900 hover:bg-gray-200" : "text-black hover:bg-gray-100",
                  )}
                >
                  {d}
                </button>
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-gray-300 p-4">
        <Button variant="tertiaryBrand" onClick={() => { pick(today); setView(new Date(today.getFullYear(), today.getMonth(), 1)); }}>
          วันนี้
        </Button>
        <div className="ml-auto flex gap-3">
          <Button variant="secondary" onClick={onCancel}>ยกเลิก</Button>
          <Button disabled={!ready} onClick={() => draft && (range ? draftEnd && onApply(draft, draftEnd) : onApply(draft))}>ตกลง</Button>
        </div>
      </div>
    </div>
  );
}

type DateFieldProps = Omit<ComponentProps<typeof TextField>, "onChange" | "value" | "onBlur" | "min" | "max"> & {
  value: string;
  /** วันแรกที่เลือกได้ในปฏิทิน */
  min?: Date;
  /** วันสุดท้ายที่เลือกได้ในปฏิทิน */
  max?: Date;
  onChange: (v: string) => void;
  /** เรียกเมื่อออกจากช่อง (ไม่เรียกระหว่างเปิดปฏิทิน — กันข้อความ error ขึ้นก่อนเลือกวัน) */
  onBlur?: () => void;
};

export function DateField({ value, onChange, onBlur, min, max, className, disabled, readOnly, autoFilled, ...rest }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const canOpen = !disabled && !readOnly && !autoFilled;
  /* เรียก onBlur ตัวล่าสุดหลังฟอร์ม render ค่าใหม่แล้ว — ถ้าเรียกทันทีหลัง onChange ฟอร์มจะตรวจค่าเดิม (ว่าง) แล้วขึ้น error ค้าง */
  const blurRef = useRef(onBlur);
  blurRef.current = onBlur;
  const close = () => { setOpen(false); setTimeout(() => blurRef.current?.(), 0); };

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { const t = e.target as Node; if (!wrap.current?.contains(t) && !pop.current?.contains(t)) close(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", esc); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={wrap} className={cx("relative", className)}>
      <TextField
        icon="calendar_month"
        inputMode="numeric"
        placeholder="วว/ดด/ปปปป"
        maxLength={10}
        autoComplete="off"
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        autoFilled={autoFilled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onChange={(e) => onChange(mask(e.target.value))}
        onClick={() => canOpen && setOpen(true)}
        onKeyDown={(e) => { if (canOpen && (e.key === "ArrowDown" || (e.key === "Enter" && !open))) { e.preventDefault(); setOpen(true); } }}
        onBlur={() => { if (!open) onBlur?.(); }}
        {...rest}
      />
      {/* ปฏิทินลอยนอกกล่อง (Floating) — กันถูกตัดใน Modal body (17 พ.ย. 2569) */}
      <Floating anchor={wrap} open={open} floatingRef={pop} matchWidth={false} estHeight={440}>
        <DatePicker
          min={min}
          max={max}
          value={parseThaiDate(value)}
          onCancel={close}
          onApply={(d) => { onChange(formatThaiDate(d)); close(); }}
        />
      </Floating>
    </div>
  );
}

/** "dd/mm/yyyy - dd/mm/yyyy" ตอนพิมพ์ — ใส่ "/" และ " - " ให้เอง */
function maskRange(t: string) {
  const n = t.replace(/\D/g, "").slice(0, 16);
  return n.length > 8 ? `${mask(n.slice(0, 8))} - ${mask(n.slice(8))}` : mask(n);
}

type DateRangeFieldProps = Omit<ComponentProps<typeof TextField>, "onChange" | "value" | "onBlur" | "min"> & {
  from: string;
  /** วันแรกที่เลือกได้ในปฏิทิน */
  min?: Date;
  to: string;
  onChange: (from: string, to: string) => void;
  onBlur?: () => void;
};

/** ช่องช่วงวันที่ช่องเดียว (ภาพ UAT 16 พ.ย. 2569 "ช่วงวันนัดรับรถ" 13/11/2569 - 13/11/2569) + `Date picker` แบบเลือกช่วง */
export function DateRangeField({ from, to, onChange, onBlur, min, className, disabled, readOnly, autoFilled, ...rest }: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const canOpen = !disabled && !readOnly && !autoFilled;
  const blurRef = useRef(onBlur);
  blurRef.current = onBlur;
  const close = () => { setOpen(false); setTimeout(() => blurRef.current?.(), 0); };

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { const t = e.target as Node; if (!wrap.current?.contains(t) && !pop.current?.contains(t)) close(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", esc); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const text = from || to ? `${from}${to ? ` - ${to}` : ""}` : "";
  return (
    <div ref={wrap} className={cx("relative", className)}>
      <TextField
        icon="calendar_month"
        inputMode="numeric"
        placeholder="เลือกวันที่เริ่มต้น - วันที่สิ้นสุด"
        maxLength={23}
        autoComplete="off"
        value={text}
        disabled={disabled}
        readOnly={readOnly}
        autoFilled={autoFilled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onChange={(e) => { const [a = "", b = ""] = maskRange(e.target.value).split(" - "); onChange(a, b); }}
        onClick={() => canOpen && setOpen(true)}
        onKeyDown={(e) => { if (canOpen && (e.key === "ArrowDown" || (e.key === "Enter" && !open))) { e.preventDefault(); setOpen(true); } }}
        onBlur={() => { if (!open) onBlur?.(); }}
        {...rest}
      />
      {/* ปฏิทินลอยนอกกล่อง (Floating) — กันถูกตัดใน Modal body (17 พ.ย. 2569) */}
      <Floating anchor={wrap} open={open} floatingRef={pop} matchWidth={false} estHeight={440}>
        <DatePicker
          range
          min={min}
          value={parseThaiDate(from)}
          end={parseThaiDate(to)}
          onCancel={close}
          onApply={(a, b) => { onChange(formatThaiDate(a), b ? formatThaiDate(b) : ""); close(); }}
        />
      </Floating>
    </div>
  );
}
