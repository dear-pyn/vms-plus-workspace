"use client";
/** ขั้น 6 ปิดงาน (S14 · จอ OH2 / O.1–O.6) — ปรับตามบอร์ด refinement 0.1 / 0.2 ที่เจ้าของงานส่ง 16 พ.ย. 2569
 *  - ตัด "ข้อมูลการส่งมอบรถ" (วันที่ส่งมอบรถคืน · ผู้รับรถ ได้มาจากขั้น 5 แล้ว — เก็บค่าไว้ใน draft ไม่แสดง)
 *  - อะไหล่ 2 หมวด (ตัวรถ · เครื่องมือกล): Section header + Secondary "นำเข้าไฟล์" · ตารางเดียว คอลัมน์
 *    ชื่ออะไหล่ (รหัสอะไหล่เป็นข้อความรอง) · ราคาต่อหน่วย · จำนวนที่ใช้ (Number input แก้ในแถว) · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน ·
 *    จำนวนอะไหล่เก่า (Number input) · หมายเหตุ (SMI = Text input ในแถว · กรอกเอง = ข้อความจาก modal) · เมนู … แก้ไข / ลบ
 *  - "+ เพิ่มรายการ" ใต้ตาราง → Modal "เพิ่มอะไหล่ที่ใช้จริง" (ชื่ออะไหล่ · รหัสอะไหล่ (ถ้ามี) · จำนวนที่ใช้จริง · หน่วย · ราคาต่อหน่วย · หมายเหตุ (ถ้ามี))
 *    แก้ไข = modal เดิม prefill · ยังไม่มีรายการ = Empty state + ปุ่มเพิ่มอะไหล่
 *  - อะไหล่ที่เบิกจากคลัง (SMI) รวมในตารางตัวรถ (เดิมเป็นตาราง "คืนอะไหล่ที่เบิกจากคลัง" แยก) — จำนวนที่คืน = เบิก − ใช้
 *  component: Section header · Table Alternating fills · Number input · Text input · Row menu · Modal Form · Empty state/Data empty ·
 *    Toggle with description · Input dropdown · Alert Info · Secondary lg ย้อนกลับ · Primary lg ปิดงาน
 *  AC-S14 + toast แถว 23 24 25 26 · เงินทุกช่องผ่าน currency() */
import { usePrototypeFill } from "../../prototype/MockTools";
import { mockDate, mockPartForm, mockParts } from "../../prototype/fixtures";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { currency } from "@rules/currency.mjs";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { DateField, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { ConfirmDialog, Modal } from "@ui/Modal";
import { NumberInput } from "@ui/NumberInput";
import { SectionHeader } from "@ui/PageHeader";
import { RowMenu } from "@ui/RowMenu";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import { Toggle } from "@ui/Toggle";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import type { CloseOut, PartUsed, WarrantyDays } from "../po/types";
import { IMPORT_SAMPLE, UNITS, WARRANTY_DAYS, costRows, partReturned, warrantyEnd } from "./close";
import { Row } from "./StepAppointment";

export type CloseDraft = Omit<CloseOut, "closedAt" | "approval" | "returned">;
type Cat = "body" | "tools";
const CATS = [
  { k: "body", title: "อะไหล่ — ตัวรถ" },
  { k: "tools", title: "อะไหล่ — เครื่องมือกล" },
] as const;
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/,/g, "")));
const okNum = (s: string) => /^\d+(\.\d{1,2})?$/.test(s.replace(/,/g, "").trim());

/** ตารางอะไหล่ (บอร์ด 0.2) — onChange/onEdit/onRemove ไม่ส่ง = อ่านอย่างเดียว */
export function PartsTable({ label, parts, onChange, onEdit, onRemove }: { label: string; parts: PartUsed[]; onChange?: (id: string, p: Partial<PartUsed>) => void; onEdit?: (p: PartUsed) => void; onRemove?: (p: PartUsed) => void }) {
  const edit = !!onChange;
  return (
    <DataTable label={label} striped>
      <thead>
        <tr>
          <Th>ชื่ออะไหล่</Th>
          <Th className="text-right">ราคาต่อหน่วย</Th>
          <Th>จำนวนที่ใช้</Th>
          <Th className="text-right">ราคารวมที่ใช้</Th>
          <Th className="text-right">จำนวนที่คืน</Th>
          <Th className="text-right">ราคารวมที่คืน</Th>
          <Th>จำนวนอะไหล่เก่า</Th>
          <Th>หมายเหตุ</Th>
          {edit && <Th className="w-16"><span className="sr-only">จัดการ</span></Th>}
        </tr>
      </thead>
      <tbody>
        {parts.map((p) => {
          const back = partReturned(p);
          return (
            <tr key={p.id}>
              <Td className="whitespace-normal">
                <CellStack main={p.name} sub={[p.code, p.unit].filter(Boolean).join(" · ")} />
              </Td>
              <Td className="text-right tabular-nums">{currency(p.price)}</Td>
              <Td>{edit ? <NumberInput label={`จำนวนที่ใช้ ${p.name}`} min={p.withdrawn != null ? 0 : 1} max={p.withdrawn} value={p.qty} onChange={(v) => onChange!(p.id, { qty: v })} /> : <span className="tabular-nums">{p.qty.toLocaleString()}</span>}</Td>
              <Td className="text-right tabular-nums">{currency(p.qty * p.price)}</Td>
              <Td className="text-right tabular-nums">{back.toLocaleString()}</Td>
              <Td className="text-right tabular-nums">{currency(back * p.price)}</Td>
              <Td>{edit ? <NumberInput label={`จำนวนอะไหล่เก่า ${p.name}`} value={p.oldQty ?? 0} onChange={(v) => onChange!(p.id, { oldQty: v })} /> : <span className="tabular-nums">{(p.oldQty ?? 0).toLocaleString()}</span>}</Td>
              <Td className="min-w-48 whitespace-normal">
                {/* โน้ตบอร์ด: SMI กรอกหมายเหตุในแถว · กรอกเอง (Input) กรอกใน modal */}
                {edit && p.withdrawn != null ? (
                  <TextField aria-label={`หมายเหตุ ${p.name}`} placeholder="ระบุหมายเหตุ" value={p.remark ?? ""} onChange={(e) => onChange!(p.id, { remark: e.target.value })} />
                ) : (
                  p.remark || "-"
                )}
              </Td>
              {edit && (
                <Td>
                  <RowMenu
                    label={`จัดการ ${p.name}`}
                    items={[
                      ...(onEdit ? [{ label: "แก้ไข", icon: "edit", onSelect: () => onEdit(p) }] : []),
                      ...(onRemove ? [{ label: "ลบ", icon: "delete", onSelect: () => onRemove(p) }] : []),
                    ]}
                  />
                </Td>
              )}
            </tr>
          );
        })}
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

export function WarrantyRows({ w }: { w: CloseOut["warranty"] }) {
  return w.on ? (
    <Row items={[["วันเริ่มรับประกัน", w.start], ["ระยะรับประกัน", w.days ? `${w.days} วัน` : ""], ["วันหมดอายุประกัน", warrantyEnd(w.start, w.days)], ["แจ้งเตือนก่อนหมด", "เจ้าของยานพาหนะ และ กบค. 30 วัน และ 15 วัน"]]} />
  ) : (
    <Row items={[["การรับประกันงานซ่อม", "ไม่มี"], ["แจ้งเตือนก่อนหมด", "ไม่แจ้งเตือน"]]} />
  );
}

type PartForm = { id?: string; cat: Cat; name: string; code: string; qty: string; unit: string; price: string; remark: string };
const blankPart = (cat: Cat): PartForm => ({ cat, name: "", code: "", qty: "", unit: "", price: "", remark: "" });

/** Modal "เพิ่มอะไหล่ที่ใช้จริง" (บอร์ด 0.2) + ราคา + หมายเหตุ (โน้ต "เพิ่ม ราคา · ลบได้ · แก้ได้" · "เพิ่มหมายเหตุใน modal นี้ด้วย") */
function PartModal({ form, onClose, onSave }: { form: PartForm | null; onClose: () => void; onSave: (f: PartForm) => void }) {
  const [f, setF] = useState<PartForm | null>(form);
  const [err, setErr] = useState<Record<string, string>>({});
  /* ปุ่ม Mock ขณะ modal เปิด = เติมช่องใน modal (ครบ / ไม่ครบ / ค่าไม่ผ่าน) — ไม่บันทึกเอง */
  usePrototypeFill((mode) => {
    setF((x) => (x ? { ...x, ...(x.id?.startsWith("smi-") ? { qty: mode === "ready" ? x.qty : mode === "missing" ? "" : "0", remark: mode === "ready" ? "ใช้ไม่หมด คืนคลัง" : "" } : mockPartForm(mode)) } : x));
    setErr({});
  }, !!form);
  if (!form || !f) return null;
  const smi = !!f.id && f.id.startsWith("smi-");
  const set = (p: Partial<PartForm>, k?: string) => { setF({ ...f, ...p }); if (k) setErr((e) => ({ ...e, [k]: "" })); };
  function save() {
    const e: Record<string, string> = {
      name: f!.name.trim() ? "" : "กรุณาระบุชื่ออะไหล่",
      qty: /^\d+$/.test(f!.qty.trim()) && Number(f!.qty) >= 1 ? "" : "กรุณาระบุจำนวนเป็นจำนวนเต็มตั้งแต่ 1",
      unit: f!.unit ? "" : "กรุณาเลือกหน่วย",
      price: okNum(f!.price) ? "" : "กรุณาระบุราคาต่อหน่วย",
    };
    setErr(e);
    if (!Object.values(e).some(Boolean)) onSave(f!);
  }
  return (
    <Modal open title={f.id ? "แก้ไขอะไหล่ที่ใช้จริง" : "เพิ่มอะไหล่ที่ใช้จริง"} confirmLabel={f.id ? "บันทึก" : "เพิ่ม"} onClose={onClose} onConfirm={save}>
      <div className="flex flex-col gap-4">
        <TextField label="ชื่ออะไหล่" placeholder="ระบุชื่ออะไหล่" readOnly={smi} value={f.name} onChange={(e) => set({ name: e.target.value }, "name")} error={err.name || undefined} />
        <TextField label="รหัสอะไหล่" optional placeholder="ระบุรหัสอะไหล่" readOnly={smi} value={f.code} onChange={(e) => set({ code: e.target.value })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="จำนวนที่ใช้จริง" inputMode="numeric" placeholder="0" value={f.qty} onChange={(e) => set({ qty: e.target.value.replace(/\D/g, "") }, "qty")} error={err.qty || undefined} />
          <SelectField label="หน่วย" placeholder="เลือกหน่วย" disabled={smi} value={f.unit} onChange={(e) => set({ unit: e.target.value }, "unit")} options={UNITS.map((u) => ({ value: u, label: u }))} error={err.unit || undefined} />
        </div>
        <TextField label="ราคาต่อหน่วย (บาท)" inputMode="decimal" placeholder="0.00" value={f.price} onChange={(e) => set({ price: e.target.value }, "price")} onBlur={() => okNum(f.price) && set({ price: currency(num(f.price) ?? 0) })} error={err.price || undefined} />
        <TextArea label="หมายเหตุ" optional placeholder="ระบุหมายเหตุ" rows={3} value={f.remark} onChange={(e) => set({ remark: e.target.value })} />
      </div>
    </Modal>
  );
}

export function StepClose({
  close, defaults, readOnly, onBack, onClose, onNotify,
}: {
  close?: CloseOut;
  /** ค่าตั้งต้นเมื่อยังไม่เคยกรอก (วันที่/ผู้รับรถจากขั้น 5 · วันเริ่มประกัน = วันนี้ · อะไหล่ที่เบิกจากคลังในตารางตัวรถ) */
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
  const [err, setErr] = useState<Record<string, string>>({});
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<PartForm | null>(null);
  const [toRemove, setToRemove] = useState<{ cat: Cat; p: PartUsed } | null>(null);
  const files = useRef<Record<string, HTMLInputElement | null>>({});
  /* ปุ่ม Mock (16 พ.ย. 2569 เติมเรื่องอะไหล่ด้วย):
     ครบ = อะไหล่เบิกคลังใช้ไม่หมด 1 รายการ (มีคืน + หมายเหตุ) + อะไหล่กรอกเอง 3 รายการ (รหัส · อะไหล่เก่า · หมายเหตุ) + เครื่องมือกล 1 รายการ · ค่าแรง · ประกัน 360 วัน
     ไม่ครบ = ไม่มีอะไหล่ทั้ง 2 หมวด + ไม่มีค่าแรง/ระยะประกัน · บันทึกไม่สำเร็จ = ข้อมูลครบแต่ server ตอบ 500 (marker "error") */
  usePrototypeFill((mode) => {
    const mk = mockParts();
    const smi = defaults.body.filter((p) => p.withdrawn != null).map((p, i) => (i === 0 && p.withdrawn! > 1 ? { ...p, qty: p.withdrawn! - 1, oldQty: p.withdrawn! - 1, remark: "ใช้ไม่หมด คืนคลัง 1" } : { ...p, oldQty: p.qty }));
    setD({
      ...d,
      receiver: mode === "error" ? "error" : defaults.receiver,
      body: mode === "missing" ? [] : [...smi, ...mk.body],
      tools: mode === "missing" ? [] : mk.tools,
      warranty: { on: true, start: mockDate(), days: mode === "missing" ? null : 360 },
    });
    setLabor(mode === "missing" ? "" : "28,500.00"); setOther(mode === "missing" ? "" : "3,200.00"); setErr({});
  }, !readOnly && !busy && !ask && !modal);
  const draft: CloseDraft = { ...d, labor: okNum(labor) ? num(labor) : null, other: okNum(other) ? num(other) : null };
  const dirty = !readOnly && JSON.stringify(draft) !== JSON.stringify(init);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);
  const end = warrantyEnd(d.warranty.start, d.warranty.days);

  if (readOnly && close) {
    return (
      <>
        {/* ตัดผู้อนุมัติ (Refinement 9/11/2026) — ไม่มีข้อความรอ ผบช. */}
        {close.closedAt && <Alert tone="info" title={`บันทึกปิดงานแล้ว ${close.closedAt}`}>ส่งต่อขั้นยืนยันการส่งอนุมัติ</Alert>}
        {CATS.map((c) => (
          <section key={c.k} className="flex flex-col gap-4">
            <SectionHeader title={c.title} />
            {close[c.k].length ? <PartsTable label={c.title} parts={close[c.k]} /> : <p className="text-md text-gray-600">ไม่มีอะไหล่หมวดนี้</p>}
          </section>
        ))}
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

  const patchPart = (cat: Cat, id: string, p: Partial<PartUsed>) => setD((x) => ({ ...x, [cat]: x[cat].map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  function savePart(f: PartForm) {
    const row: PartUsed = { id: f.id ?? `pt-${Date.now()}`, name: f.name.trim(), code: f.code.trim() || undefined, qty: Number(f.qty), unit: f.unit, price: num(f.price) ?? 0, remark: f.remark.trim() };
    setD((x) => {
      const old = x[f.cat].find((r) => r.id === row.id);
      const next = old ? x[f.cat].map((r) => (r.id === row.id ? { ...old, ...row, withdrawn: old.withdrawn, oldQty: old.oldQty } : r)) : [...x[f.cat], { ...row, oldQty: 0 }];
      return { ...x, [f.cat]: next };
    });
    setErr((x) => ({ ...x, parts: "" }));
    onNotify(f.id ? "แก้ไขอะไหล่สำเร็จ" : "เพิ่มอะไหล่สำเร็จ");
    setModal(null);
  }
  const openEdit = (cat: Cat, p: PartUsed) => setModal({ id: p.id, cat, name: p.name, code: p.code ?? "", qty: String(p.qty), unit: p.unit, price: currency(p.price), remark: p.remark ?? "" });
  function importFile(k: Cat, f?: File) {
    if (!f) return;
    // toast แถว 24: ไฟล์ผิดรูปแบบ = ข้อความที่ตัวไฟล์ ไม่ใช่ toast · ต้นแบบ: ชื่อมี "error" = ผิดรูปแบบ
    if (!/\.(xlsx|csv)$/i.test(f.name) || /error/i.test(f.name)) {
      setErr((x) => ({ ...x, [`${k}Import`]: `${f.name}: รูปแบบไฟล์ไม่ถูกต้อง ใช้ไฟล์ .xlsx หรือ .csv ตามแม่แบบ (คอลัมน์ ชื่ออะไหล่ รหัสอะไหล่ จำนวน หน่วย ราคาต่อหน่วย)` }));
      return;
    }
    setErr((x) => ({ ...x, [`${k}Import`]: "", parts: "" }));
    setD({ ...d, [k]: [...d[k], ...IMPORT_SAMPLE[k].map((p, i) => ({ ...p, id: `im-${Date.now()}-${i}`, oldQty: 0 }))] });
    onNotify(`นำเข้าไฟล์ ${f.name} สำเร็จ`); // toast แถว 23
  }
  function validate(): boolean {
    const e: Record<string, string> = {
      parts: d.body.length + d.tools.length ? "" : "กรุณาระบุอะไหล่ที่ใช้อย่างน้อย 1 รายการ",
      labor: !labor.trim() ? "กรุณาระบุค่าแรง" : okNum(labor) ? "" : "กรุณาระบุจำนวนเงินเป็นตัวเลข",
      other: other.trim() && !okNum(other) ? "กรุณาระบุจำนวนเงินเป็นตัวเลข" : "",
      start: d.warranty.on && !parseThaiDate(d.warranty.start) ? "กรุณาเลือกวันเริ่มรับประกัน" : "",
      days: d.warranty.on && !d.warranty.days ? "กรุณาเลือกระยะรับประกัน" : "",
    };
    setErr((x) => ({ ...x, ...e }));
    return !Object.values(e).some(Boolean);
  }

  const partsSection = (c: (typeof CATS)[number]): ReactNode => (
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
      {d[c.k].length ? (
        <>
          <PartsTable label={c.title} parts={d[c.k]} onChange={(id, p) => patchPart(c.k, id, p)} onEdit={(p) => openEdit(c.k, p)} onRemove={(p) => setToRemove({ cat: c.k, p })} />
          <div>
            <Button variant="secondary" iconLeft="add" onClick={() => setModal(blankPart(c.k))}>
              เพิ่มรายการ
            </Button>
          </div>
        </>
      ) : (
        /* บอร์ด 0.1: Empty state ในกรอบ — ต้องมีอย่างน้อย 1 รายการรวมทั้ง 2 หมวด */
        <div className="rounded-lg border border-gray-200">
          <EmptyState
            kind="data-empty"
            title="ยังไม่ได้ระบุอะไหล่ที่ใช้"
            description="เพิ่มทีละรายการ หรือนำเข้าไฟล์ — ต้องมีอย่างน้อย 1 รายการจึงปิดงานได้"
            action={
              <Button variant="secondary" iconLeft="add" onClick={() => setModal(blankPart(c.k))}>
                เพิ่มอะไหล่
              </Button>
            }
          />
        </div>
      )}
    </section>
  );

  return (
    <>
      {err.parts && <Alert tone="error" title={err.parts}>เพิ่มทีละรายการหรือนำเข้าไฟล์ในหมวดใดหมวดหนึ่ง</Alert>}
      {CATS.map(partsSection)}
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
                options={WARRANTY_DAYS.map((n) => ({ value: String(n), label: `${n} วัน` }))}
                error={err.days || undefined}
              />
              <TextField label="วันหมดอายุประกัน" autoFilled placeholder="คำนวณเมื่อเลือกระยะรับประกัน" value={end} />
            </div>
            <Alert tone="info" title="ระบบจะแจ้งเตือนหน่วยงานเจ้าของรถ และ กบค. ก่อนประกันหมด 30 วัน และ 15 วัน">
              แจ้งทางกระดิ่งในระบบ เพื่อให้หน่วยงานสำรวจความสมบูรณ์ของรถ และนำรถเข้าเก็บงานก่อนหมดประกัน · วันเริ่มตั้งต้นเป็นวันปิดงาน แก้ได้ · วันหมดอายุ = วันเริ่ม + ระยะรับประกัน
            </Alert>
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
      <PartModal key={modal ? `${modal.cat}-${modal.id ?? "new"}` : "none"} form={modal} onClose={() => setModal(null)} onSave={savePart} />
      <ConfirmDialog
        open={!!toRemove}
        danger
        icon="delete"
        title="ยืนยันการลบอะไหล่"
        description={toRemove ? `ลบ "${toRemove.p.name}" ออกจากรายการอะไหล่ที่ใช้` : ""}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) setD((x) => ({ ...x, [toRemove.cat]: x[toRemove.cat].filter((r) => r.id !== toRemove.p.id) }));
          setToRemove(null);
        }}
      />
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
