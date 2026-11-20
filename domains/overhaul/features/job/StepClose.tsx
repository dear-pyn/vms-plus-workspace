"use client";
/** ขั้น 6 ปิดงาน (S14 · จอ OH2 / O.1–O.6) — ปรับตามบอร์ด refinement 0.1 / 0.2 ที่เจ้าของงานส่ง 16 พ.ย. 2569
 *  - ตัด "ข้อมูลการส่งมอบรถ" (วันที่ส่งมอบรถคืน · ผู้รับรถ ได้มาจากขั้น 5 แล้ว — เก็บค่าไว้ใน draft ไม่แสดง)
 *  - อะไหล่ 2 หมวด (ตัวรถ · เครื่องมือกล): Section header (ปุ่ม "นำเข้าไฟล์" เอาออก 16 พ.ย. 2569) · ตารางเดียว คอลัมน์
 *    ชื่ออะไหล่ (รหัสอะไหล่เป็นข้อความรอง) · ราคาต่อหน่วย · จำนวนที่ใช้ (Number input แก้ในแถว) · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน ·
 *    จำนวนอะไหล่เก่า (ข้อความ — แก้ใน modal 17 พ.ย. 2569) · หมายเหตุ (ข้อความ — แก้ใน modal ทุกแถว 16 พ.ย. 2569) · เมนู … แก้ไข / ลบ
 *  - "+ เพิ่มรายการ" ใต้ตาราง → Modal "เพิ่มอะไหล่ที่ใช้จริง" (ชื่ออะไหล่ · รหัสอะไหล่ (ถ้ามี) · จำนวนที่ใช้จริง · หน่วย · ราคาต่อหน่วย · หมายเหตุ (ถ้ามี))
 *    แก้ไข = modal เดิม prefill · ยังไม่มีรายการ = Empty state + ปุ่มเพิ่มอะไหล่
 *  - อะไหล่ที่เบิกจากคลัง (SMI) รวมในตารางตัวรถ (เดิมเป็นตาราง "คืนอะไหล่ที่เบิกจากคลัง" แยก) — จำนวนที่คืน = เบิก − ใช้
 *  component: Section header · Table Alternating fills · Number input · Text input · Row menu · Modal Form · Empty state/Data empty ·
 *    Toggle with description · Input dropdown · Alert Info · Secondary lg ย้อนกลับ · Primary lg ปิดงาน
 *  AC-S14 + toast แถว 23 24 25 26 · เงินทุกช่องผ่าน currency() */
import { usePrototypeFill } from "../../prototype/MockTools";
import { mockDate, mockPartForm, mockParts } from "../../prototype/fixtures";
import { useMemo, useState, type ReactNode } from "react";
import { currency } from "@rules/currency.mjs";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { DateField, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { NumberInput } from "@ui/NumberInput";
import { SectionHeader } from "@ui/PageHeader";
import { RowMenu } from "@ui/RowMenu";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import { Toggle } from "@ui/Toggle";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import type { CloseOut, PartUsed } from "../po/types";
import { UNITS, WARRANTY_MAX_DAYS, costRows, partReturned, warrantyEnd } from "./close";
import { Row } from "./StepAppointment";
import { MoneyField } from "../plan/VehicleModals";

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
    /* เจ้าของงาน 17 พ.ย. 2569: fix ความกว้างคอลัมน์ ตารางตัวรถกับเครื่องมือกลจะได้ตรงกัน (ชื่ออะไหล่กว้างเท่ากันทุกตาราง) */
    <DataTable label={label} striped cols={edit ? [240, 120, 190, 130, 100, 130, 130, 200, 64] : [240, 120, 120, 130, 100, 130, 130, 220]}>
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
                {/* เจ้าของงาน 16 พ.ย. 2569: ข้อความรอง = รหัสอะไหล่ เท่านั้น · ไม่มีรหัส = ไม่แสดงบรรทัดรอง */}
                <CellStack main={p.name} sub={p.code || undefined} />
              </Td>
              <Td className="text-right tabular-nums">{currency(p.price)}</Td>
              <Td>
                {/* เจ้าของงาน 16 พ.ย. 2569: หน่วยอยู่ข้างหลังช่อง Number input (นอกกล่อง) */}
                {edit ? (
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <NumberInput label={`จำนวนที่ใช้ ${p.name}`} min={p.withdrawn != null ? 0 : 1} max={p.withdrawn} value={p.qty} onChange={(v) => onChange!(p.id, { qty: v })} />
                    <span className="text-md text-gray-600">{p.unit}</span>
                  </span>
                ) : (
                  <span className="whitespace-nowrap tabular-nums">{`${p.qty.toLocaleString()} ${p.unit}`}</span>
                )}
              </Td>
              <Td className="text-right tabular-nums">{currency(p.qty * p.price)}</Td>
              <Td className="text-right tabular-nums">{back.toLocaleString()}</Td>
              <Td className="text-right tabular-nums">{currency(back * p.price)}</Td>
              {/* เจ้าของงาน 17 พ.ย. 2569: จำนวนอะไหล่เก่าไม่ต้องเป็น input ในแถว — แสดงตัวเลข แก้ผ่านเมนู แก้ไข → modal */}
              <Td className="tabular-nums">{(p.oldQty ?? 0).toLocaleString() /* ไม่ใส่หน่วย (เจ้าของงาน 17 พ.ย. 2569) */}</Td>
              <Td className="min-w-48 whitespace-normal">
                {/* เจ้าของงาน 16 พ.ย. 2569: หมายเหตุไม่ต้องเป็นช่อง input ในแถว (แทนโน้ตบอร์ด "case SMI กรอกในแถว") — แก้ผ่านเมนู แก้ไข → modal */}
                {p.remark || "-"}
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
    <Row items={[["วันเริ่มรับประกัน", w.start], ["จำนวนวันที่รับประกัน", w.days ? `${w.days} วัน` : ""], ["วันหมดอายุประกัน", warrantyEnd(w.start, w.days)], ["แจ้งเตือนก่อนหมด", "เจ้าของยานพาหนะ และ กบค. 30 วัน และ 15 วัน"]]} />
  ) : (
    <Row items={[["การรับประกันงานซ่อม", "ไม่มี"], ["แจ้งเตือนก่อนหมด", "ไม่แจ้งเตือน"]]} />
  );
}

type PartForm = { id?: string; cat: Cat; name: string; code: string; qty: string; unit: string; price: string; oldQty: string; remark: string };
const blankPart = (cat: Cat): PartForm => ({ cat, name: "", code: "", qty: "", unit: "", price: "", oldQty: "", remark: "" });

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
          {/* เจ้าของงาน 16 พ.ย. 2569: แก้ไขแล้วแก้หน่วยได้ (รวมอะไหล่เบิกคลัง) */}
          <SelectField label="หน่วย" placeholder="เลือกหน่วย" value={f.unit} onChange={(e) => set({ unit: e.target.value }, "unit")} options={UNITS.map((u) => ({ value: u, label: u }))} error={err.unit || undefined} />
        </div>
        {/* จำนวนอะไหล่เก่าย้ายมากรอกใน modal (17 พ.ย. 2569) · ไม่บังคับ ว่าง = 0 */}
        <TextField label="จำนวนอะไหล่เก่า" optional inputMode="numeric" placeholder="0" value={f.oldQty} onChange={(e) => set({ oldQty: e.target.value.replace(/\D/g, "") })} />
        {/* เจ้าของงาน 16 พ.ย. 2569: ช่องเงินทุกช่องใช้รูปแบบเงิน — พิมพ์แล้วใส่จุลภาค · ออกจากช่องเติม .00 (MoneyField · T12) */}
        <MoneyField label="ราคาต่อหน่วย (บาท)" placeholder="0.00" value={f.price} onChange={(v) => set({ price: v }, "price")} error={err.price || undefined} />
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
  onNotify: (msg: string, tone?: "success" | "error" | "info" | "warning", description?: string) => void;
}) {
  const init = useMemo<CloseDraft>(() => (close ? { ...close } : defaults), [close, defaults]);
  const [d, setD] = useState<CloseDraft>(init);
  const [labor, setLabor] = useState(init.labor != null ? currency(init.labor) : "");
  const [other, setOther] = useState(init.other != null ? currency(init.other) : "");
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<PartForm | null>(null);
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
  }, !readOnly && !busy && !modal);
  const draft: CloseDraft = { ...d, labor: okNum(labor) ? num(labor) : null, other: okNum(other) ? num(other) : null };
  const dirty = !readOnly && JSON.stringify(draft) !== JSON.stringify(init);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);
  const end = warrantyEnd(d.warranty.start, d.warranty.days);

  if (readOnly && close) {
    return (
      <>
        {/* ตัดผู้อนุมัติ (Refinement 9/11/2026) — ไม่มีข้อความรอ ผบช. */}
        {/* เจ้าของงาน 17 พ.ย. 2569: ไม่ใส่ Alert info (เดิม "บันทึกปิดงานแล้ว …") */}
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
    const row: PartUsed = { id: f.id ?? `pt-${Date.now()}`, name: f.name.trim(), code: f.code.trim() || undefined, qty: Number(f.qty), unit: f.unit, price: num(f.price) ?? 0, oldQty: f.oldQty ? Number(f.oldQty) : 0, remark: f.remark.trim() };
    setD((x) => {
      const old = x[f.cat].find((r) => r.id === row.id);
      const next = old ? x[f.cat].map((r) => (r.id === row.id ? { ...old, ...row, withdrawn: old.withdrawn } : r)) : [...x[f.cat], row];
      return { ...x, [f.cat]: next };
    });
    setErr((x) => ({ ...x, parts: "" }));
    onNotify(f.id ? "แก้ไขอะไหล่สำเร็จ" : "เพิ่มอะไหล่สำเร็จ");
    setModal(null);
  }
  const openEdit = (cat: Cat, p: PartUsed) => setModal({ id: p.id, cat, name: p.name, code: p.code ?? "", qty: String(p.qty), unit: p.unit, price: currency(p.price), oldQty: p.oldQty ? String(p.oldQty) : "", remark: p.remark ?? "" });
  const daysError = () => (!d.warranty.on ? "" : !d.warranty.days ? "กรุณาระบุจำนวนวันที่รับประกัน" : d.warranty.days > WARRANTY_MAX_DAYS ? `จำนวนวันที่รับประกันต้องไม่เกิน ${WARRANTY_MAX_DAYS.toLocaleString()} วัน` : "");
  function validate(): boolean {
    const e: Record<string, string> = {
      parts: d.body.length + d.tools.length ? "" : "กรุณาระบุอะไหล่ที่ใช้อย่างน้อย 1 รายการ",
      labor: !labor.trim() ? "กรุณาระบุค่าแรง" : okNum(labor) ? "" : "กรุณาระบุจำนวนเงินเป็นตัวเลข",
      other: other.trim() && !okNum(other) ? "กรุณาระบุจำนวนเงินเป็นตัวเลข" : "",
      start: d.warranty.on && !parseThaiDate(d.warranty.start) ? "กรุณาเลือกวันเริ่มรับประกัน" : "",
      /* เจ้าของงาน 20 พ.ย. 2569 "ขอแบบ uat": 0 วัน = ยังไม่ระบุ ขึ้นข้อความเดียวกับช่องว่าง (เลข 0 ค้างในช่อง) — EC-53 */
      days: daysError(),
    };
    setErr((x) => ({ ...x, ...e }));
    return !Object.values(e).some(Boolean);
  }

  const partsSection = (c: (typeof CATS)[number]): ReactNode => (
    <section key={c.k} className="flex flex-col gap-4">
      {/* เจ้าของงาน 16 พ.ย. 2569: เอาปุ่ม "นำเข้าไฟล์" ออก — เพิ่มอะไหล่ทีละรายการผ่าน modal เท่านั้น */}
      <SectionHeader title={c.title} />
      {d[c.k].length ? (
        <>
          <PartsTable label={c.title} parts={d[c.k]} onChange={(id, p) => patchPart(c.k, id, p)} onEdit={(p) => openEdit(c.k, p)} onRemove={(p) => setD((prev) => ({ ...prev, [c.k]: prev[c.k].filter((x) => x.id !== p.id) }))} />
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
            description="เพิ่มทีละรายการ — ต้องมีอย่างน้อย 1 รายการจึงปิดงานได้"
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
      {/* ตัด Alert (18 พ.ย. 2569) → ข้อความ error แบบช่องกรอก */}
      {err.parts && <p className="text-sm text-error-600" role="alert">{err.parts} เพิ่มอะไหล่ในหมวดใดหมวดหนึ่งอย่างน้อย 1 รายการ</p>}
      {CATS.map(partsSection)}
      <section className="flex flex-col gap-4">
        <SectionHeader title="ค่าใช้จ่ายในการดำเนินการ Overhaul" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* ช่องเงิน: จุลภาคระหว่างพิมพ์ · blur เติม .00 (MoneyField) — เจ้าของงาน 16 พ.ย. 2569 */}
          <MoneyField label="ค่าแรง (บาท)" placeholder="0.00" value={labor} onChange={(v) => { setLabor(v); setErr((x) => ({ ...x, labor: "" })); }} error={err.labor || undefined} />
          <MoneyField label="ค่าใช้จ่ายอื่นๆ (บาท)" optional placeholder="0.00" value={other} onChange={(v) => { setOther(v); setErr((x) => ({ ...x, other: "" })); }} error={err.other || undefined} />
        </div>
        <CostTable c={draft} />
      </section>
      <section className="flex flex-col gap-4">
        <SectionHeader title="การรับประกันงานซ่อม" />
        <Toggle checked={d.warranty.on} onChange={(on) => setD({ ...d, warranty: { ...d.warranty, on } })} label="มีการรับประกันงานซ่อม" description="ประกันผลงานของผู้รับจ้างตามสัญญา" />
        {d.warranty.on ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <DateField label="วันเริ่มรับประกัน" placeholder="เลือกวันเริ่มรับประกัน" value={d.warranty.start} onChange={(v) => setD({ ...d, warranty: { ...d.warranty, start: v } })} error={err.start || undefined} />
              {/* เจ้าของงาน 16 พ.ย. 2569: กรอกตัวเลขได้เลย (เดิม Input dropdown 90/180/360/720 วัน) · Text input + หน่วย "วัน" ต่อท้าย */}
              <TextField
                label="จำนวนวันที่รับประกัน" /* ชื่อช่อง/placeholder ตาม UAT 20 พ.ย. 2569 */
                inputMode="numeric"
                placeholder="ระบุจำนวนวันที่รับประกัน"
                suffix="วัน"
                value={d.warranty.days != null ? String(d.warranty.days) : ""}
                onChange={(e) => {
                  const n = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setD({ ...d, warranty: { ...d.warranty, days: n ? Number(n) : null } });
                  setErr((x) => ({ ...x, days: "" }));
                }}
                /* เจ้าของงาน 20 พ.ย. 2569 "กรอก 0 แล้วไม่มี validate" ⇒ ตรวจตอนออกจากช่องแบบ UAT (เดิมตรวจเฉพาะตอนกดปิดงาน) */
                onBlur={() => setErr((x) => ({ ...x, days: daysError() }))}
                error={err.days || undefined}
              />
              <TextField label="วันหมดอายุประกัน" autoFilled placeholder="คำนวณเมื่อระบุจำนวนวันที่รับประกัน" value={end} />
            </div>
            {/* เจ้าของงาน 20 พ.ย. 2569 "เอาตาม uat แต่วันที่ไม่ prefill" ⇒ กลับมาใส่ Alert info แบบ UAT (แทนมติ 17 พ.ย. ที่ตัดออก)
                ข้อความตาม UAT 20 พ.ย. 2569 ยกเว้นตัด "วันเริ่มตั้งต้นเป็นวันปิดงาน แก้ได้" เพราะต้นแบบไม่เติมวันเริ่มให้ */}
            <Alert tone="info" title="ระบบจะแจ้งเตือนหน่วยงานเจ้าของรถ และ กบค. ก่อนประกันหมด 30 วัน และ 15 วัน แจ้งทางกระดิ่งในระบบ">
              เพื่อให้หน่วยงานสำรวจความสมบูรณ์ของรถ และนำรถเข้าเก็บงานก่อนหมดประกัน วันหมดอายุ = วันเริ่ม + จำนวนวันที่รับประกัน
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
        {/* เจ้าของงาน 16 พ.ย. 2569: ไม่มี modal ยืนยันการปิดงาน — ผ่านการตรวจแล้วบันทึกทันที · loading กันกดซ้ำ */}
        <Button
          size="lg"
          loading={busy}
          onClick={async () => {
            if (busy || !validate()) return;
            setBusy(true);
            await runSave(() => onClose(draft), () => false);
            setBusy(false);
          }}
        >
          ปิดงาน
        </Button>
      </div>
      <PartModal key={modal ? `${modal.cat}-${modal.id ?? "new"}` : "none"} form={modal} onClose={() => setModal(null)} onSave={savePart} />
      {dialog}
    </>
  );
}
