"use client";
/** เบิกอะไหล่จากคลัง รายคัน (v2 EC-56 · สมมติฐาน 23 พ.ย. 2569 รอลูกค้ายืนยัน)
 *  ใบเบิกเก็บที่ยานพาหนะในแผน — เจ้าของงาน 23 พ.ย. 2569 "ควรเบิกก่อนทำ PO ได้":
 *    หน้ารายละเอียดแผน "อะไหล่ที่ใช้" = จุดเบิกหลัก (ทุกคันในแผน แม้ยังไม่มี Purchase Order) · ขั้น 3 ติดตามงานซ่อม = เบิกเพิ่มระหว่างซ่อม
 *  เบิกได้หลายครั้งจนกด "ซ่อมสำเร็จ" · แสดงเป็นรายการที่เบิก ไม่มีใบเบิกกำกับ (เจ้าของงาน 23 พ.ย. 2569) · ยกเลิกทีละรายการที่ยังรอเบิกจากคลัง (บังคับเหตุผล) ·
 *  Smart Inventory ยังไม่มี API → รายการใหม่ "รอเบิกจากคลัง" · เลขที่เอกสารจากคลังเก็บใน Requisition.docNo (ยังไม่แสดง)
 *  component: Section header · Empty state · Table · Pill · Row menu · Modal Form (Select · Combobox · Number input) · Text area */
import { useState, type ReactNode } from "react";
import { currency } from "@rules/currency.mjs";
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { SearchInput } from "@ui/SearchInput";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { NumberInput } from "@ui/NumberInput";
import { SectionHeader } from "@ui/PageHeader";
import { RowMenu } from "@ui/RowMenu";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { PART_CATALOG } from "../../mock/parts";
import type { PartCat, Requisition, RequisitionLine } from "../po/types";
import { lineStatus, partQty, withdrawnParts } from "./requisition";
import { PartsTable } from "./StepClose";

const CAT_LABEL: Record<PartCat, string> = { body: "ตัวรถ/เครื่องยนต์", tools: "เครื่องจักรกล" };
const CATS: PartCat[] = ["body", "tools"];
const STATUS: Record<Requisition["status"], { label: string; tone: "warning" | "success" | "gray" }> = {
  pending: { label: "รอเบิกจากคลัง", tone: "warning" },
  issued: { label: "เบิกแล้ว", tone: "success" },
  cancelled: { label: "ยกเลิกแล้ว", tone: "gray" },
};

/** ยานพาหนะ 1 คันที่เบิกได้ · editable = ยังไม่กด "ซ่อมสำเร็จ" · sub = Purchase Order หรือ "ยังไม่มี Purchase Order" · model/type แสดงในกล่องเบิก */
export interface ReqVehicle { plate: string; sub?: string; model?: string; type?: string; editable: boolean; reqs: Requisition[] }
type AddFn = (plate: string, lines: RequisitionLine[]) => Promise<boolean>;
type CancelFn = (plate: string, reqId: string, partId: string, reason: string) => Promise<boolean>;
type Row = { v: ReqVehicle; r: Requisition; l: RequisitionLine };
/** ขั้น 3: ตั้งยอดรวมของอะไหล่ 1 แถว · ยกเลิกส่วนที่ยังรอเบิกของอะไหล่ 1 แถว */
type QtyFn = (plate: string, partId: string, price: number, qty: number) => Promise<boolean> | boolean;
type CancelPartFn = (plate: string, partId: string, price: number, reason: string) => Promise<boolean>;
type Ask = { title: string; description: string; run: (reason: string) => Promise<boolean> };

/** รายการที่เบิก (เจ้าของงาน 23 พ.ย. 2569: ไม่ต้องมีใบเบิกกำกับ → แถวละ 1 รายการ · ยกเลิกทีละรายการ) */
export function PartsRequisition({ vehicles, onAdd, onCancel, onQty, onCancelPart, title = "เบิกอะไหล่จากคลัง", label, description, emptyText, addInHeader }: {
  vehicles: ReqVehicle[];
  onAdd: AddFn;
  onCancel: CancelFn;
  /** ขั้น 3 (คันเดียว) — เจ้าของงาน 24 พ.ย. 2569 "ตารางต้องเหมือนที่ส่งให้ ปรับจำนวนต่อได้": ส่ง = ตารางแบบขั้น 6 (PartsTable) รวมยอดต่ออะไหล่ แก้จำนวนในแถว */
  onQty?: QtyFn;
  onCancelPart?: CancelPartFn;
  title?: string;
  /** หัวข้อแบบหน้าดูรายละเอียด (SectionLabel ของหน้าแผน) — ไม่ส่ง = Section header */
  label?: (actions: ReactNode) => ReactNode;
  description?: string;
  emptyText?: string;
  addInHeader?: boolean;
}) {
  const multi = vehicles.length > 1 || !!label;
  const [adding, setAdding] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const setCancel = (row: Row) => setAsk({
    title: "ยกเลิกรายการเบิก",
    description: `${multi ? `${row.v.plate} · ` : ""}${row.l.name} ${row.l.qty.toLocaleString()} ${row.l.unit} · ยกเลิกแล้วเบิกใหม่ได้`,
    run: (reason) => onCancel(row.v.plate, row.r.id, row.l.partId, reason),
  });
  const open = vehicles.filter((v) => v.editable);
  const rows: Row[] = vehicles.flatMap((v) => v.reqs.flatMap((r) => r.lines.map((l) => ({ v, r, l }))));
  const live = rows.filter(({ r, l }) => lineStatus(r, l) !== "cancelled");
  const value = live.reduce((a, { l }) => a + l.qty * l.price, 0);
  const addBtn = (text: string) => (open.length ? <Button variant="secondary" iconLeft="add" onClick={() => setAdding(true)}>{text}</Button> : undefined);
  const tableAdd = addInHeader ? undefined : addBtn("เบิกอะไหล่");
  const single = vehicles[0];
  const usage = !!onQty && vehicles.length > 0;
  const desc = description ?? (single && !multi && !single.editable ? "ล็อกแล้วหลังซ่อมสำเร็จ · ปรับจำนวนที่ใช้และจำนวนที่คืนได้ในขั้นปิดงาน" : "เบิกได้หลายครั้งจนกว่าจะกดซ่อมสำเร็จ · ยอดเบิกใช้ตั้งต้นตารางอะไหล่ในขั้นปิดงาน");

  return (
    <section className="flex flex-col gap-6" aria-label={title}>
      {label ? label(addInHeader ? addBtn("เบิกอะไหล่") : undefined) : (
        <SectionHeader title={title} badge={<Pill tone="purple">v2 · รอยืนยัน</Pill>} description={desc} actions={addInHeader ? addBtn("เบิกอะไหล่") : undefined} />
      )}
      {/* เจ้าของงาน 24 พ.ย. 2569 "ตารางที่ว่าต้องเป็นตารางแบบนี้" (ภาพขั้น 6 ปิดงาน): ทุกหมวดเป็น section — Section header · ตาราง (คอลัมน์กว้างเท่าขั้น 6)
          · ปุ่ม "+ เบิกอะไหล่" ใต้ตาราง · หมวดที่ยังไม่มีรายการ = Empty state ในกรอบ + ปุ่มเบิก */}
      {usage ? CATS.map((c) => {
        /* ขั้น 3 + หน้ารายละเอียดแผน: ตารางเดียวกับขั้น 6 ปิดงาน (ชื่ออะไหล่ · ราคาต่อหน่วย · จำนวนที่ใช้ แก้ในแถว · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน · จำนวนอะไหล่เก่า · หมายเหตุ)
           ยอดรวมต่ออะไหล่ต่อคันจากทุกครั้งที่เบิก (ไม่นับที่ยกเลิก) · ลดได้ไม่ต่ำกว่ายอดที่เบิกแล้ว · คืน/อะไหล่เก่า/หมายเหตุ กรอกในขั้นปิดงาน ·
           หน้าแผน (เจ้าของงาน 24 พ.ย. 2569 "อันนี้ด้วย แบบเมื่อกี้เลย") มีคอลัมน์ยานพาหนะนำหน้า · คันที่ซ่อมสำเร็จแล้วแสดงจำนวนเป็นข้อความ */
        const heading = `อะไหล่ — ${CAT_LABEL[c]}`;
        type K = { v: ReqVehicle; partId: string; price: number };
        const keys = new Map<string, K>();
        const parts = vehicles.flatMap((v) => withdrawnParts(v.reqs, c).map((p) => {
          const l = v.reqs.flatMap((r) => r.lines).find((x) => `rq-${x.partId}-${x.price}` === p.id)!;
          const id = `${v.plate}|${p.id}`;
          keys.set(id, { v, partId: l.partId, price: l.price });
          return { ...p, id, withdrawn: undefined };
        }));
        const q = (id: string) => { const k = keys.get(id)!; return { k, ...partQty(k.v.reqs, k.partId, k.price) }; };
        return (
          <section key={c} className="flex flex-col gap-4" aria-label={heading}>
            <SectionHeader title={heading} />
            {parts.length ? (
              <>
                <PartsTable
                  label={heading}
                  parts={parts}
                  lead={multi ? { head: "ยานพาหนะ", width: 180, cell: (p) => { const v = keys.get(p.id)!.v; return <CellStack main={<span className="font-semibold">{v.plate}</span>} sub={v.sub} />; } } : undefined}
                  onChange={open.length ? (id, p) => { const k = keys.get(id); if (k?.v.editable && p.qty != null) void onQty!(k.v.plate, k.partId, k.price, p.qty); } : undefined}
                  rowEditable={(p) => !!keys.get(p.id)?.v.editable}
                  limits={(p) => ({ min: Math.max(1, q(p.id).issued) })}
                  menu={onCancelPart ? (p) => {
                    const { k, pending, issued } = q(p.id);
                    if (!k.v.editable || pending <= 0) return [];
                    return [{ label: "ยกเลิกรายการที่รอเบิก", icon: "block", danger: true, onSelect: () => setAsk({
                      title: "ยกเลิกรายการเบิก",
                      description: `${multi ? `${k.v.plate} · ` : ""}${p.name} ${pending.toLocaleString()} ${p.unit} ที่ยังรอเบิกจากคลัง${issued ? ` · ส่วนที่เบิกแล้ว ${issued.toLocaleString()} ${p.unit} ยังอยู่` : ""} · ยกเลิกแล้วเบิกใหม่ได้`,
                      run: (reason) => onCancelPart(k.v.plate, k.partId, k.price, reason),
                    }) }];
                  } : undefined}
                />
                {tableAdd && <div>{tableAdd}</div>}
              </>
            ) : (
              <div className="rounded-lg border border-gray-200">
                <EmptyState kind="data-empty" title="ยังไม่ได้เบิกอะไหล่หมวดนี้" description={emptyText ?? (open.length ? "เบิกได้จนกว่าจะกดซ่อมสำเร็จ" : "ไม่มีการเบิกอะไหล่จากคลัง")} action={tableAdd} />
              </div>
            )}
          </section>
        );
      }) : CATS.map((c) => {
        const catRows = rows.filter(({ l }) => l.cat === c);
        const heading = `อะไหล่ — ${CAT_LABEL[c]}`;
        return (
          <section key={c} className="flex flex-col gap-4" aria-label={heading}>
            <SectionHeader title={heading} />
            {catRows.length ? (
              <>
                <DataTable label={heading} striped cols={multi ? [180, 240, 120, 120, 130, 150, 150, 64] : [240, 120, 120, 130, 150, 150, 64]}>
                  <thead>
                    <tr>
                      {multi && <Th>ยานพาหนะ</Th>}
                      <Th>ชื่ออะไหล่</Th><Th className="text-right">ราคาต่อหน่วย</Th><Th>จำนวนที่เบิก</Th><Th className="text-right">ราคารวมที่เบิก</Th><Th>วันที่เบิก</Th><Th>สถานะ</Th><Th><span className="sr-only">จัดการ</span></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {catRows.map((row) => {
                      const { v, r, l } = row;
                      const st = lineStatus(r, l);
                      return (
                        <tr key={`${v.plate}-${r.id}-${l.partId}`} className={st === "cancelled" ? "text-gray-400" : undefined}>
                          {multi && <Td><CellStack main={<span className="font-semibold">{v.plate}</span>} sub={v.sub} /></Td>}
                          <Td className="whitespace-normal"><CellStack main={l.name} sub={l.code || undefined} /></Td>
                          <Td className="text-right tabular-nums">{currency(l.price)}</Td>
                          <Td><span className="whitespace-nowrap tabular-nums">{`${l.qty.toLocaleString()} ${l.unit}`}</span></Td>
                          <Td className="text-right tabular-nums">{currency(l.qty * l.price)}</Td>
                          <Td className="whitespace-normal">{r.at || "ข้อมูลเดิม"}</Td>
                          <Td><Pill tone={STATUS[st].tone}>{STATUS[st].label}</Pill></Td>
                          <Td>
                            {v.editable && st === "pending" ? (
                              <RowMenu label={`จัดการ ${l.name}${multi ? ` ${v.plate}` : ""}`} items={[{ label: "ยกเลิกรายการเบิก", icon: "block", danger: true, onSelect: () => setCancel(row) }]} />
                            ) : null}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </DataTable>
                {open.length > 0 && <div>{addBtn("เบิกอะไหล่")}</div>}
              </>
            ) : (
              <div className="rounded-lg border border-gray-200">
                <EmptyState kind="data-empty" title="ยังไม่ได้เบิกอะไหล่หมวดนี้" description={emptyText ?? (open.length ? "เบิกได้ตั้งแต่ก่อนทำ Purchase Order จนกว่าจะกดซ่อมสำเร็จ" : "ไม่มีการเบิกอะไหล่จากคลัง")} action={addBtn("เบิกอะไหล่")} />
              </div>
            )}
          </section>
        );
      })}
      {live.length > 0 && (
        <p className="text-sm text-gray-600">
          {multi ? `${new Set(live.map(({ v }) => v.plate)).size} คัน · ` : ""}เบิก {live.length} รายการ · มูลค่า {currency(value)} บาท
          {rows.length > live.length ? " (ไม่นับรายการที่ยกเลิก)" : ""}
        </p>
      )}
      {adding && <AddRequisition vehicles={open} pickVehicle={multi} onClose={() => setAdding(false)} onAdd={onAdd} />}
      {ask && <CancelLine ask={ask} onClose={() => setAsk(null)} />}
    </section>
  );
}

/** กล่องเบิกอะไหล่ — เจ้าของงาน 23 พ.ย. 2569 "modal ควรคล้ายกับเบิกอะไหล่ ซ่อม": 2 แผงแบบ PartsPicker ของงานซ่อม
 *  ซ้าย "คลังอะไหล่" (ค้นหา · การ์ดอะไหล่ + ยอดคงเหลือ · ปุ่มเลือก) · ขวา "อะไหล่ที่ต้องการเบิก" (การ์ด · จำนวน · ลบ) + "รวมค่าอะไหล่"
 *  ด้านบน: ยานพาหนะ (เลือกได้ที่หน้าแผน) + กล่องข้อมูลยานพาหนะ · ยอดคงเหลือเป็นข้อมูลจำลอง รอ Smart Inventory API (EC-59) */
export function AddRequisition({ vehicles, pickVehicle, initialPlate, onClose, onAdd }: { vehicles: ReqVehicle[]; pickVehicle: boolean; initialPlate?: string; onClose: () => void; onAdd: AddFn }) {
  const [plate, setPlate] = useState(initialPlate ?? (pickVehicle && vehicles.length > 1 ? "" : vehicles[0]?.plate ?? ""));
  const [lines, setLines] = useState<RequisitionLine[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const v = vehicles.find((x) => x.plate === plate);
  const k = q.trim().toLowerCase();
  const found = k ? PART_CATALOG.filter((p) => p.name.toLowerCase().includes(k) || p.code.toLowerCase().includes(k)) : [];
  const setQty = (id: string, qty: number) => {
    const p = PART_CATALOG.find((x) => x.id === id);
    if (!p) return;
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.partId !== id) : ls.some((l) => l.partId === id) ? ls.map((l) => (l.partId === id ? { ...l, qty } : l)) : [...ls, { partId: p.id, name: p.name, code: p.code, unit: p.unit, price: p.price, qty, cat: p.cat }]));
  };
  const totals = lines.reduce((t, l) => {
    const p = PART_CATALOG.find((x) => x.id === l.partId);
    const have = Math.min(l.qty, p ? p.stock.main + p.stock.spare : 0);
    return { stock: t.stock + have * l.price, buy: t.buy + (l.qty - have) * l.price };
  }, { stock: 0, buy: 0 });
  async function confirm() {
    if (busy || !lines.length || !plate) return;
    setBusy(true);
    const ok = await onAdd(plate, lines);
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <Modal
      open
      size="xl"
      fill
      hideCancel
      onClose={() => !busy && onClose()}
      title="เบิกอะไหล่"
      description={v ? [v.plate, v.model, v.sub].filter(Boolean).join(" · ") : "เลือกยานพาหนะในแผนที่จะเบิกอะไหล่"}
      confirmLabel="ยืนยันเบิกอะไหล่"
      confirmDisabled={!lines.length || !plate}
      confirmLoading={busy}
      onConfirm={() => void confirm()}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        {pickVehicle && !initialPlate && (
          <div className="shrink-0"><SelectField
            label="ยานพาหนะ"
            placeholder="เลือกยานพาหนะในแผน"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            options={vehicles.map((x) => ({ value: x.plate, label: x.sub ? `${x.plate} · ${x.sub}` : x.plate }))}
          /></div>
        )}
        {/* เจ้าของงาน 24 พ.ย. 2569 "กล่องเบิกอะไหล่ให้ทำเหมือนงานซ่อมเลย": ยก PartsPicker งานซ่อม (repair-v2 domains/repair/features/parts.tsx) มาทั้งแผง
            ซ้าย "คลังอะไหล่" · ขวา "อะไหล่ที่ต้องการใช้งาน" (การ์ด · ราคารวม · จำนวน · ลบ) + "รวมค่าอะไหล่" · แถวแบบตารางขั้นปิดงานใช้ที่ตารางบนหน้าเท่านั้น
            เจ้าของงาน 24 พ.ย. 2569 ส่งภาพจอ UAT งานซ่อม "ต้องเป็นแบบนี้": คำเหมือนงานซ่อมทุกคำ (รวม "ต้องจัดซื้อ") · ไม่มีกล่องข้อมูลยานพาหนะ (ทะเบียน · รุ่น · Purchase Order อยู่ใต้หัวกล่อง)
            เลือกยานพาหนะเฉพาะตอนกดเบิกจากหัวตารางหน้าแผน · ปิดจากเมนูรายคัน/ขั้น 3 = ไม่มีช่องเลือก · การตั้งรายการจัดซื้อของ Overhaul ยัง pending (EC-59)
            เจ้าของงาน 24 พ.ย. 2569 ส่งภาพเดิมซ้ำ "เปลี่ยน modal เป็น design แบบนี้": 2 แผงสูงเต็มกล่อง (Modal fill) · รายการเลื่อนในแผง · "รวมค่าอะไหล่" ติดล่างแผงขวาเสมอ ·
            ท้ายกล่องมีแต่ "ยืนยันเบิกอะไหล่" ชิดขวา (ปิดด้วย ✕) */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="flex min-h-0 flex-col gap-4 rounded-xl border border-gray-200 p-6" aria-label="คลังอะไหล่">
            <SectionBar description="อะไหล่ทั้งหมดจาก Smart Inventory และ คลังสำรอง">คลังอะไหล่</SectionBar>
            <div className="shrink-0"><SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อหรือรหัสอะไหล่" aria-label="ค้นหาชื่อหรือรหัสอะไหล่" /></div>
            {found.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <div className="m-auto"><EmptyState kind="data-empty" title="ไม่พบรายการ" description="กรุณาค้นหาอะไหล่" /></div>
              </div>
            ) : (
              <ul className="-mr-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2 [&>li]:shrink-0">
                {found.map((p) => {
                  const sel = lines.find((l) => l.partId === p.id);
                  return (
                    <li key={p.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-black">{p.name}</span>
                        <span className="text-xs text-gray-600">{p.code} • {currency(p.price)} บาท / {p.unit}</span>
                        <StockText main={p.stock.main} spare={p.stock.spare} unit={p.unit} />
                      </div>
                      <Button variant={sel ? "secondary" : "primary"} size="sm" iconLeft={sel ? "check" : "add"} onClick={() => setQty(p.id, (sel?.qty ?? 0) + 1)}>
                        {sel ? `เลือกแล้ว ${sel.qty}` : "เลือก"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section className="flex min-h-0 flex-col gap-4 rounded-xl border border-gray-200 p-6" aria-label="อะไหล่ที่ต้องการใช้งาน">
            <SectionBar description="เลือกอะไหล่จากคลังเพื่อเบิกหรือยื่นรายการจัดซื้อสำหรับงานซ่อมครั้งนี้">อะไหล่ที่ต้องการใช้งาน</SectionBar>
            <ul className="-mr-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2 [&>li]:shrink-0">
              {lines.map((l) => {
                const p = PART_CATALOG.find((x) => x.id === l.partId);
                return (
                  <li key={l.partId} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-black">{l.name}</span>
                        <span className="text-xs text-gray-600">{l.code} • {l.qty} {l.unit} | {currency(l.price)} บาท</span>
                        {p && <StockText main={p.stock.main} spare={p.stock.spare} unit={p.unit} />}
                      </div>
                      <Button variant="tertiary" iconOnly="delete" aria-label={`ลบ ${l.name}`} onClick={() => setQty(l.partId, 0)} />
                    </div>
                    <div className="flex items-center justify-between gap-2 pr-5">
                      <span className="text-sm font-semibold text-black">{currency(l.qty * l.price)} บาท</span>
                      <NumberInput label={`จำนวน ${l.name}`} value={l.qty} min={1} onChange={(n) => setQty(l.partId, n)} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex shrink-0 flex-col gap-2 border-t border-gray-200 pt-4">
              <SectionBar>รวมค่าอะไหล่</SectionBar>
              <SumRow k="เบิกจากคลัง" v={totals.stock} />
              <SumRow k="ต้องจัดซื้อ" v={totals.buy} />
              <SumRow k="รวมทั้งหมด" v={totals.stock + totals.buy} strong />
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}

/** หัวข้อแผงแบบงานซ่อม (repair ui.tsx SectionBar) */
function SectionBar({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-6 w-1 shrink-0 rounded-full bg-brand-900" />
        <h2 className="text-lg font-semibold text-black">{children}</h2>
      </div>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  );
}

function StockText({ main, spare, unit }: { main: number; spare: number; unit: string }) {
  const s: Array<[string, string]> = [];
  if (main) s.push(["คลังหลัก", `คงเหลือ ${main} ${unit}`]);
  if (spare) s.push(["คลังสำรอง", `คงเหลือ ${spare} ${unit}`]);
  if (!s.length) s.push(["ไม่มีในคลัง", "ต้องจัดซื้อ"]);
  return (
    <>
      {s.map(([a, b]) => (
        <span key={a} className="text-xs text-gray-600"><b className="font-semibold text-gray-700">{a} :</b> {b}</span>
      ))}
    </>
  );
}

function SumRow({ k, v, strong }: { k: string; v: number; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-center justify-between text-sm font-semibold text-black" : "flex items-center justify-between text-sm text-gray-700"}>
      <span>{k}</span>
      <span className={strong ? "text-md font-semibold text-black tabular-nums" : "font-semibold text-black tabular-nums"}>{currency(v)} บาท</span>
    </div>
  );
}

function CancelLine({ ask, onClose }: { ask: Ask; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={ask.title}
      description={ask.description}
      cancelLabel="ปิด"
      confirmLabel="ยกเลิกรายการเบิก"
      confirmVariant="danger"
      confirmDisabled={!reason.trim()}
      confirmLoading={busy}
      onConfirm={async () => { setBusy(true); const ok = await ask.run(reason.trim()); setBusy(false); if (ok) onClose(); }}
    >
      <TextArea label="เหตุผลที่ยกเลิก" rows={3} placeholder="ระบุเหตุผล" value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );
}
