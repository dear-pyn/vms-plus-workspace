"use client";
/** ขั้น 6 ปิดงาน (S14 · จอ OH2 / O.1–O.6)
 *  component: Section header (+ Secondary button "นำเข้าไฟล์") · Text input (วันที่ส่งมอบรถคืน · ผู้รับรถ · ชื่ออะไหล่ · จำนวน · ราคาต่อหน่วย · ค่าแรง · ค่าใช้จ่ายอื่นๆ) ·
 *    Input dropdown (หน่วย · ระยะรับประกัน) · Empty state/Data empty · Table Alternating fills (อะไหล่ 2 หมวด · คืนอะไหล่ที่เบิกจากคลัง + Pill outline · สรุปค่าใช้จ่าย) ·
 *    Toggle with description (มีการรับประกันงานซ่อม) · Text input Readonly (วันหมดอายุประกัน) · Alert Info/Success/Warning · Secondary lg ย้อนกลับ · Primary lg ปิดงาน
 *  AC-S14 + toast แถว 23 24 25 26 · เงินทุกช่องผ่าน currency() */
import { usePrototypeFill } from "../../prototype/MockTools";
import { mockDate } from "../../prototype/fixtures";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { currency } from "@rules/currency.mjs";
import { Alert } from "@ui/Alert";
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { DateField, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { ConfirmDialog } from "@ui/Modal";
import { SectionHeader } from "@ui/PageHeader";
import { SelectField } from "@ui/SelectField";
import { DataTable, Td, Th } from "@ui/Table";
import { TextField } from "@ui/TextField";
import { Toggle } from "@ui/Toggle";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import type { CloseOut, PartUsed, WarrantyDays } from "../po/types";
import { IMPORT_SAMPLE, UNITS, WARRANTY_DAYS, costRows, returnQty, returnStatus, warrantyEnd } from "./close";
import { Row } from "./StepAppointment";

export type CloseDraft = Omit<CloseOut, "closedAt" | "approval" | "returned">;
const CATS = [
  { k: "body", title: "อะไหล่ — ตัวรถ", eg: "เช่น ชุดลูกสูบพร้อมแหวน" },
  { k: "tools", title: "อะไหล่ — เครื่องมือกล", eg: "เช่น สายเคเบิลกว้าน" },
] as const;
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/,/g, "")));
const okNum = (s: string) => /^\d+(\.\d{1,2})?$/.test(s.replace(/,/g, "").trim());

export function PartsTable({ label, parts, onRemove }: { label: string; parts: PartUsed[]; onRemove?: (id: string) => void }) {
  return (
    <DataTable label={label} striped>
      <thead>
        <tr>
          <Th>ชื่ออะไหล่</Th>
          <Th className="text-right">จำนวน</Th>
          <Th>หน่วย</Th>
          <Th className="text-right">ราคาต่อหน่วย (บาท)</Th>
          <Th className="text-right">ราคารวม (บาท)</Th>
          {onRemove && <Th className="w-16"><span className="sr-only">จัดการ</span></Th>}
        </tr>
      </thead>
      <tbody>
        {parts.map((p) => (
          <tr key={p.id}>
            <Td className="whitespace-normal">{p.name}</Td>
            <Td className="text-right tabular-nums">{p.qty.toLocaleString()}</Td>
            <Td>{p.unit}</Td>
            <Td className="text-right tabular-nums">{currency(p.price)}</Td>
            <Td className="text-right tabular-nums">{currency(p.qty * p.price)}</Td>
            {onRemove && (
              <Td>
                <Button variant="tertiary" iconOnly="delete" aria-label={`ลบ ${p.name}`} onClick={() => onRemove(p.id)} />
              </Td>
            )}
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

export function CostTable({ c }: { c: Pick<CloseOut, "body" | "tools" | "labor" | "other"> }) {
  const rows = costRows(c);
  return (
    <DataTable label="สรุปค่าใช้จ่าย" striped>
      <thead>
        <tr>
          <Th>รายการค่าใช้จ่าย</Th>
          <Th className="text-right">จำนวนเงิน (บาท)</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={k}>
            <Td className={i === rows.length - 1 ? "font-semibold" : undefined}>{k}</Td>
            <Td className={`text-right tabular-nums ${i === rows.length - 1 ? "font-semibold" : ""}`}>{currency(v)}</Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

export function StockTable({ stock, onUsed }: { stock: CloseOut["stock"]; onUsed?: (i: number, v: string) => void }) {
  return (
    <DataTable label="คืนอะไหล่ที่เบิกจากคลัง" striped>
      <thead>
        <tr>
          <Th>ชื่ออะไหล่</Th>
          <Th>หน่วย</Th>
          <Th className="text-right">จำนวนที่เบิก</Th>
          <Th className="text-right">จำนวนที่ใช้</Th>
          <Th className="text-right">จำนวนที่คืน</Th>
          <Th>สถานะการคืน</Th>
        </tr>
      </thead>
      <tbody>
        {stock.map((s, i) => {
          const st = returnStatus(s);
          return (
            <tr key={s.name}>
              <Td className="whitespace-normal">{s.name}</Td>
              <Td>{s.unit}</Td>
              <Td className="text-right tabular-nums">{s.withdrawn.toLocaleString()}</Td>
              <Td className="text-right tabular-nums">
                {onUsed ? <TextField aria-label={`จำนวนที่ใช้ ${s.name}`} inputMode="numeric" className="ml-auto w-24" inputClassName="text-right" value={String(s.used)} onChange={(e) => onUsed(i, e.target.value)} /> : s.used.toLocaleString()}
              </Td>
              <Td className="text-right tabular-nums">{returnQty(s).toLocaleString()}</Td>
              <Td>
                <Pill tone={st.tone}>{st.label}</Pill>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}

export function WarrantyRows({ w }: { w: CloseOut["warranty"] }) {
  return w.on ? (
    <Row items={[["วันเริ่มรับประกัน", w.start], ["ระยะรับประกัน", w.days ? `${w.days} วัน` : ""], ["วันหมดอายุประกัน", warrantyEnd(w.start, w.days)], ["แจ้งเตือนก่อนหมด", "เจ้าของยานพาหนะ และ กบค. 30 วัน และ 15 วัน"]]} />
  ) : (
    <Row items={[["การรับประกันงานซ่อม", "ไม่มี"], ["แจ้งเตือนก่อนหมด", "ไม่แจ้งเตือน"]]} />
  );
}

export function StepClose({
  close, defaults, readOnly, onBack, onClose, onNotify,
}: {
  close?: CloseOut;
  /** ค่าตั้งต้นเมื่อยังไม่เคยกรอก (วันที่/ผู้รับรถจากนัดรับรถ · วันเริ่มประกัน = วันนี้ · อะไหล่ที่เบิกจากคลัง) */
  defaults: CloseDraft;
  readOnly?: boolean;
  onBack: () => void;
  onClose: (d: CloseDraft) => Promise<boolean>;
  onNotify: (msg: string, tone?: "success" | "error" | "info") => void;
}) {
  const init = useMemo<CloseDraft>(() => (close ? { ...close } : defaults), [close, defaults]);
  const [d, setD] = useState<CloseDraft>(init);
  const [labor, setLabor] = useState(init.labor != null ? String(init.labor) : "");
  const [other, setOther] = useState(init.other != null ? String(init.other) : "");
  const [add, setAdd] = useState({ body: { name: "", qty: "1", unit: "ชิ้น", price: "" }, tools: { name: "", qty: "1", unit: "ชิ้น", price: "" } });
  const [err, setErr] = useState<Record<string, string>>({});
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const files = useRef<Record<string, HTMLInputElement | null>>({});
  usePrototypeFill((mode) => {
    setD({ ...d, returnedAt: mockDate(), receiver: mode === "missing" ? "" : mode === "error" ? "error" : "ผู้รับยานพาหนะจำลอง", warranty: { on: true, start: mockDate(), days: 90 }, stock: d.stock.map((s) => ({ ...s, used: s.withdrawn })) });
    setLabor("10000"); setOther("0"); setErr({});
  }, !readOnly && !busy && !ask);
  const draft: CloseDraft = { ...d, labor: okNum(labor) ? num(labor) : null, other: okNum(other) ? num(other) : null };
  const dirty = !readOnly && (JSON.stringify(draft) !== JSON.stringify(init) || Object.values(add).some((a) => a.name || a.price));
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);
  const end = warrantyEnd(d.warranty.start, d.warranty.days);

  if (readOnly && close) {
    return (
      <>
        {/* ตัดผู้อนุมัติ (Refinement 9/11/2026) — ไม่มีข้อความรอ ผบช. */}
        {close.closedAt && <Alert tone="info" title={`บันทึกปิดงานแล้ว ${close.closedAt}`}>ส่งต่อขั้นยืนยันการส่งอนุมัติ</Alert>}
        <section className="flex flex-col gap-4">
          <SectionHeader title="ข้อมูลการส่งมอบรถ" />
          <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
            <Row items={[["วันที่ส่งมอบรถคืน", close.returnedAt], ["ผู้รับรถ", close.receiver]]} />
          </dl>
        </section>
        {CATS.map((c) => (
          <section key={c.k} className="flex flex-col gap-4">
            <SectionHeader title={c.title} />
            {close[c.k].length ? <PartsTable label={c.title} parts={close[c.k]} /> : <p className="text-md text-gray-600">ไม่มีอะไหล่หมวดนี้</p>}
          </section>
        ))}
        <section className="flex flex-col gap-4">
          <SectionHeader title={`คืนอะไหล่ที่เบิกจากคลัง (${close.stock.length})`} />
          <StockTable stock={close.stock} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="ค่าใช้จ่ายในการดำเนินการ Overhaul" />
          <CostTable c={close} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="การรับประกันงานซ่อม" />
          <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
            <WarrantyRows w={close.warranty} />
          </dl>
        </section>
        <div className="flex justify-start">
          <Button variant="secondary" size="lg" onClick={onBack}>
            ย้อนกลับ
          </Button>
        </div>
      </>
    );
  }

  function addPart(k: "body" | "tools") {
    const a = add[k];
    const e: Record<string, string> = {};
    if (!a.name.trim()) e[`${k}Name`] = "กรุณาระบุชื่ออะไหล่";
    if (!/^\d+$/.test(a.qty.trim()) || Number(a.qty) < 1) e[`${k}Qty`] = "กรุณาระบุจำนวนเป็นจำนวนเต็มตั้งแต่ 1";
    if (!okNum(a.price)) e[`${k}Price`] = "กรุณาระบุราคาต่อหน่วย";
    setErr((x) => ({ ...x, [`${k}Name`]: "", [`${k}Qty`]: "", [`${k}Price`]: "", ...e }));
    if (Object.keys(e).length) return;
    setD({ ...d, [k]: [...d[k], { id: `pt-${Date.now()}`, name: a.name.trim(), qty: Number(a.qty), unit: a.unit, price: Number(a.price.replace(/,/g, "")) }] });
    setAdd({ ...add, [k]: { name: "", qty: "1", unit: a.unit, price: "" } });
    setErr((x) => ({ ...x, parts: "" }));
  }
  function importFile(k: "body" | "tools", f?: File) {
    if (!f) return;
    // toast แถว 24: ไฟล์ผิดรูปแบบ = ข้อความที่ตัวไฟล์ ไม่ใช่ toast · ต้นแบบ: ชื่อมี "error" = ผิดรูปแบบ
    if (!/\.(xlsx|csv)$/i.test(f.name) || /error/i.test(f.name)) {
      setErr((x) => ({ ...x, [`${k}Import`]: `${f.name}: รูปแบบไฟล์ไม่ถูกต้อง ใช้ไฟล์ .xlsx หรือ .csv ตามแม่แบบ (คอลัมน์ ชื่ออะไหล่ จำนวน หน่วย ราคาต่อหน่วย)` }));
      return;
    }
    setErr((x) => ({ ...x, [`${k}Import`]: "", parts: "" }));
    setD({ ...d, [k]: [...d[k], ...IMPORT_SAMPLE[k].map((p, i) => ({ ...p, id: `im-${Date.now()}-${i}` }))] });
    onNotify(`นำเข้าไฟล์ ${f.name} สำเร็จ`); // toast แถว 23
  }
  function validate(): boolean {
    const e: Record<string, string> = {
      returnedAt: !d.returnedAt ? "กรุณาเลือกวันที่ส่งมอบรถคืน" : !parseThaiDate(d.returnedAt) ? "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)" : "",
      receiver: d.receiver.trim() ? "" : "กรุณาระบุผู้รับรถ",
      parts: d.body.length + d.tools.length ? "" : "กรุณาระบุอะไหล่ที่ใช้อย่างน้อย 1 รายการ",
      labor: !labor.trim() ? "กรุณาระบุค่าแรง" : okNum(labor) ? "" : "กรุณาระบุจำนวนเงินเป็นตัวเลข",
      other: other.trim() && !okNum(other) ? "กรุณาระบุจำนวนเงินเป็นตัวเลข" : "",
      start: d.warranty.on && !parseThaiDate(d.warranty.start) ? "กรุณาเลือกวันเริ่มรับประกัน" : "",
      days: d.warranty.on && !d.warranty.days ? "กรุณาเลือกระยะรับประกัน" : "",
      stock: d.stock.some((s) => s.used > s.withdrawn) ? "จำนวนที่ใช้ต้องไม่เกินจำนวนที่เบิก" : "",
    };
    setErr((x) => ({ ...x, ...e }));
    return !Object.values(e).some(Boolean);
  }

  const partsSection = (c: (typeof CATS)[number]): ReactNode => {
    const a = add[c.k];
    const setA = (p: Partial<typeof a>) => setAdd({ ...add, [c.k]: { ...a, ...p } });
    return (
      <section key={c.k} className="flex flex-col gap-4">
        <SectionHeader
          title={c.title}
          actions={
            <>
              <Button variant="secondary" iconLeft="upload_file" onClick={() => files.current[c.k]?.click()}>
                นำเข้าไฟล์
              </Button>
              <input
                ref={(el) => {
                  files.current[c.k] = el;
                }}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                aria-label={`นำเข้าไฟล์ ${c.title}`}
                onChange={(e) => {
                  importFile(c.k, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </>
          }
        />
        {err[`${c.k}Import`] && <span className="text-sm text-error-600">{err[`${c.k}Import`]}</span>}
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <TextField label="ชื่ออะไหล่" placeholder={c.eg} value={a.name} onChange={(e) => setA({ name: e.target.value })} error={err[`${c.k}Name`] || undefined} />
          <TextField label="จำนวน" inputMode="numeric" value={a.qty} onChange={(e) => setA({ qty: e.target.value })} error={err[`${c.k}Qty`] || undefined} />
          <SelectField label="หน่วย" value={a.unit} onChange={(e) => setA({ unit: e.target.value })} options={UNITS.map((u) => ({ value: u, label: u }))} />
          <TextField label="ราคาต่อหน่วย (บาท)" placeholder="0.00" inputMode="decimal" value={a.price} onChange={(e) => setA({ price: e.target.value })} error={err[`${c.k}Price`] || undefined} />
          <Button variant="secondary" iconLeft="add" className="md:mt-8" aria-label={`เพิ่ม${c.title}`} onClick={() => addPart(c.k)}>
            เพิ่ม
          </Button>
        </div>
        {d[c.k].length ? (
          <PartsTable label={c.title} parts={d[c.k]} onRemove={(id) => setD({ ...d, [c.k]: d[c.k].filter((p) => p.id !== id) })} />
        ) : (
          <EmptyState kind="data-empty" title="ยังไม่ได้ระบุอะไหล่หมวดนี้" description="เพิ่มทีละรายการหรือนำเข้าไฟล์" />
        )}
      </section>
    );
  };

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader title="ข้อมูลการส่งมอบรถ" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DateField label="วันที่ส่งมอบรถคืน" value={d.returnedAt} onChange={(v) => {
              setD({ ...d, returnedAt: v });
              setErr((x) => ({ ...x, returnedAt: "" }));
            }} error={err.returnedAt || undefined} />
          <TextField label="ผู้รับรถ" placeholder="ระบุชื่อ-นามสกุลผู้รับรถ" value={d.receiver} onChange={(e) => {
              setD({ ...d, receiver: e.target.value });
              setErr((x) => ({ ...x, receiver: "" }));
            }} error={err.receiver || undefined} />
        </div>
      </section>
      {err.parts && <Alert tone="error" title={err.parts}>เพิ่มทีละรายการหรือนำเข้าไฟล์ในหมวดใดหมวดหนึ่ง</Alert>}
      {CATS.map(partsSection)}
      <section className="flex flex-col gap-4">
        <SectionHeader title={`คืนอะไหล่ที่เบิกจากคลัง (${d.stock.length})`} description="ระบุจำนวนที่ใช้จริง ส่วนที่เหลือระบบจะส่งคำขอคืนคลังเมื่อปิดงาน" />
        {err.stock && <span className="text-sm text-error-600">{err.stock}</span>}
        <StockTable stock={d.stock} onUsed={(i, v) => setD({ ...d, stock: d.stock.map((s, j) => (j === i ? { ...s, used: /^\d+$/.test(v) ? Number(v) : 0 } : s)) })} />
      </section>
      <section className="flex flex-col gap-4">
        <SectionHeader title="ค่าใช้จ่ายในการดำเนินการ Overhaul" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <TextField label="ค่าแรง (บาท)" placeholder="0.00" inputMode="decimal" value={labor} onChange={(e) => {
              setLabor(e.target.value);
              setErr((x) => ({ ...x, labor: "" }));
            }} error={err.labor || undefined} />
          <TextField label="ค่าใช้จ่ายอื่นๆ (บาท)" optional placeholder="0.00" inputMode="decimal" value={other} onChange={(e) => setOther(e.target.value)} error={err.other || undefined} />
        </div>
        <CostTable c={draft} />
      </section>
      <section className="flex flex-col gap-4">
        <SectionHeader title="การรับประกันงานซ่อม" />
        <Toggle checked={d.warranty.on} onChange={(on) => setD({ ...d, warranty: { ...d.warranty, on } })} label="มีการรับประกันงานซ่อม" description="ประกันผลงานของผู้รับจ้างตามสัญญา" />
        {d.warranty.on ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <DateField label="วันเริ่มรับประกัน" value={d.warranty.start} onChange={(v) => setD({ ...d, warranty: { ...d.warranty, start: v } })} error={err.start || undefined} />
              <SelectField
                label="ระยะรับประกัน"
                placeholder="เลือกระยะรับประกัน"
                value={d.warranty.days ? String(d.warranty.days) : ""}
                onChange={(e) => {
                  setD({ ...d, warranty: { ...d.warranty, days: (Number(e.target.value) || null) as WarrantyDays | null } });
                  setErr((x) => ({ ...x, days: "" }));
                }}
                options={WARRANTY_DAYS.map((n) => ({ value: String(n), label: `${n} วัน${warrantyEnd(d.warranty.start, n) ? ` (ถึง ${warrantyEnd(d.warranty.start, n)})` : ""}` }))}
                error={err.days || undefined}
              />
              <TextField label="วันหมดอายุประกัน" readOnly placeholder="คำนวณเมื่อเลือกระยะรับประกัน" value={end} />
            </div>
            <Alert tone="info" title="ระบบจะแจ้งเตือนหน่วยงานเจ้าของยานพาหนะ และ กบค. ก่อนประกันหมด 30 วัน และ 15 วัน">แจ้งทางกระดิ่งในระบบ เพื่อให้หน่วยงานสำรวจความสมบูรณ์ของยานพาหนะก่อนหมดประกัน</Alert>
          </>
        ) : (
          <p className="text-md text-gray-600">งานนี้ไม่มีการรับประกัน ระบบจะไม่แจ้งเตือนก่อนหมดประกัน</p>
        )}
      </section>
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          ย้อนกลับ
        </Button>
        <Button
          size="lg"
          onClick={() => {
            if (validate()) setAsk(true);
          }}
        >
          ปิดงาน
        </Button>
      </div>
      <ConfirmDialog
        open={ask}
        icon="task_alt"
        title="ยืนยันการปิดงาน"
        description="ตรวจสอบอะไหล่ ค่าใช้จ่าย และการรับประกันก่อนยืนยัน ระบบจะไปขั้นส่งอนุมัติปิดงาน"
        loading={busy}
        onClose={() => setAsk(false)}
        onConfirm={async () => {
          setBusy(true);
          const ok = await runSave(() => onClose(draft), () => false);
          setBusy(false);
          if (ok) setAsk(false);
        }}
      />
      {dialog}
    </>
  );
}
