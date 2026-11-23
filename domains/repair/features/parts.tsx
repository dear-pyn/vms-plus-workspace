"use client";
/** เลือกอะไหล่ 2 แผง (UAT: "คลังอะไหล่" ซ้าย · "อะไหล่ที่ต้องการใช้งาน" ขวา + "รวมค่าอะไหล่")
 *  ใช้ที่: แจ้งซ่อมขั้น 3 · กระบวนการซ่อมขั้น 1 เบิกอะไหล่ · ขั้น 4 พบอาการเพิ่ม + เบิกอะไหล่
 *  ⚠ UAT ค้นหาอะไหล่แล้วไม่พบรายการเสมอ (20 พ.ย. 2569) → หน้าตาผลค้นหาฝั่งซ้ายเป็นของต้นแบบ (pending) ·
 *    การ์ดฝั่งขวายกจากงานที่ยืนยันเบิกแล้วใน UAT (ชื่อ · รหัส • จำนวน หน่วย | ราคา · คลังสำรอง : คงเหลือ · ราคา · x จำนวน)
 *  เงินใช้ currency() (MONEY-001) → "0.00 บาท" ต่างจาก UAT ที่แสดง "0 บาท" โดยตั้งใจ */
import { useState } from "react";
import { currency } from "@rules/currency.mjs";
import { Button } from "@ui/Button";
import { EmptyState } from "@ui/EmptyState";
import { Icon } from "@ui/Icon";
import { NumberInput } from "@ui/NumberInput";
import { SearchInput } from "@ui/SearchInput";
import { cx } from "@ui/cx";
import { PARTS, partOf, type Part } from "../mock/data";
import type { PartLine, RepairJob } from "./model";
import { SectionBar } from "./ui";

export function partTotals(lines: PartLine[]) {
  let stock = 0;
  let buy = 0;
  for (const l of lines) {
    const p = partOf(l.partId);
    const have = Math.min(l.qty, p.stock.main + p.stock.spare);
    stock += have * p.price;
    buy += (l.qty - have) * p.price;
  }
  return { stock, buy, all: stock + buy };
}

function stockText(p: Part) {
  const s: string[] = [];
  if (p.stock.main) s.push(`คลังหลัก : คงเหลือ ${p.stock.main} ${p.unit}`);
  if (p.stock.spare) s.push(`คลังสำรอง : คงเหลือ ${p.stock.spare} ${p.unit}`);
  return s.length ? s : ["ไม่มีในคลัง : ต้องจัดซื้อ"];
}

function StockLine({ text }: { text: string }) {
  const [k, v] = text.split(" : ");
  return (
    <span className="text-xs text-gray-600">
      <b className="font-semibold text-gray-700">{k} :</b> {v}
    </span>
  );
}

export function PartsPicker({ lines, onChange, readOnly, lockedText, subtitle = "เลือกอะไหล่จากคลังเพื่อเบิกหรือยื่นรายการจัดซื้อสำหรับงานซ่อมครั้งนี้", footer }: { lines: PartLine[]; onChange?: (l: PartLine[]) => void; readOnly?: boolean; lockedText?: string; subtitle?: string; footer?: React.ReactNode }) {
  const [q, setQ] = useState("");
  const k = q.trim().toLowerCase();
  const found = k ? PARTS.filter((p) => p.name.toLowerCase().includes(k) || p.code.includes(k)) : [];
  const set = (partId: string, qty: number) => onChange?.(qty <= 0 ? lines.filter((l) => l.partId !== partId) : lines.some((l) => l.partId === partId) ? lines.map((l) => (l.partId === partId ? { ...l, qty } : l)) : [...lines, { partId, qty }]);
  const t = partTotals(lines);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex min-h-[560px] flex-col gap-4 rounded-xl border border-gray-200 p-6">
        {readOnly ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-600">{lockedText ?? "รายการอะไหล่ถูกล็อกแล้ว (ยืนยันเบิกแล้ว)"}</div>
        ) : (
          <>
            <SectionBar description="อะไหล่ทั้งหมดจาก Smart Inventory และ คลังสำรอง">คลังอะไหล่</SectionBar>
            <SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อหรือรหัสอะไหล่" aria-label="ค้นหาชื่อหรือรหัสอะไหล่" />
            {found.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState kind="data-empty" title="ไม่พบรายการ" description="กรุณาค้นหาอะไหล่" />
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {found.map((p) => {
                  const sel = lines.find((l) => l.partId === p.id);
                  return (
                    <li key={p.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-black">{p.name}</span>
                        <span className="text-xs text-gray-600">{p.code} • {currency(p.price)} บาท / {p.unit}</span>
                        {stockText(p).map((s) => <StockLine key={s} text={s} />)}
                      </div>
                      <Button variant={sel ? "secondary" : "primary"} size="sm" iconLeft={sel ? "check" : "add"} onClick={() => set(p.id, (sel?.qty ?? 0) + 1)}>
                        {sel ? `เลือกแล้ว ${sel.qty}` : "เลือก"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="flex min-h-[560px] flex-col gap-4 rounded-xl border border-gray-200 p-6">
        <SectionBar description={readOnly ? "จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ" : subtitle}>อะไหล่ที่ต้องการใช้งาน</SectionBar>
        <ul className="flex flex-1 flex-col gap-3">
          {lines.map((l) => {
            const p = partOf(l.partId);
            return (
              <li key={l.partId} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-black">{p.name}</span>
                    <span className="text-xs text-gray-600">{p.code} • {l.qty} {p.unit} | {currency(p.price)} บาท</span>
                    {stockText(p).map((s) => <StockLine key={s} text={s} />)}
                  </div>
                  {!readOnly && <Button variant="tertiary" iconOnly="delete" aria-label={`ลบ ${p.name}`} onClick={() => set(p.id, 0)} />}
                </div>
                <div className="flex items-center justify-between gap-2 pr-5">
                  <span className="text-sm font-semibold text-black">{currency(l.qty * p.price)} บาท</span>
                  {readOnly ? <span className="text-sm font-semibold text-black">x {l.qty}</span> : <NumberInput label={`จำนวน ${p.name}`} value={l.qty} min={1} onChange={(n) => set(p.id, n)} />}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
          <SectionBar>รวมค่าอะไหล่</SectionBar>
          <Row k="เบิกจากคลัง" v={t.stock} />
          <Row k="ต้องจัดซื้อ" v={t.buy} />
          <Row k="รวมทั้งหมด" v={t.all} strong />
          {footer}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: number; strong?: boolean }) {
  return (
    <div className={cx("flex items-center justify-between text-sm", strong ? "font-semibold text-black" : "text-gray-700")}>
      <span>{k}</span>
      <span className={cx("font-semibold text-black", strong && "text-md")}>{currency(v)} บาท</span>
    </div>
  );
}

export function PartsReadList({ lines }: { lines: PartLine[] }) {
  if (!lines.length) return <div className="rounded-xl bg-gray-50 px-6 py-8 text-center text-sm text-gray-600">ไม่มีรายการอะไหล่ที่เลือกไว้</div>;
  return (
    <ul className="flex flex-col gap-2 rounded-xl bg-gray-50 p-4">
      {lines.map((l) => {
        const p = partOf(l.partId);
        return (
          <li key={l.partId} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-black"><Icon name="build" size={16} className="text-gray-500" />{p.name}</span>
            <span className="text-gray-700">x {l.qty}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** ค่าซ่อมที่ใช้เทียบเกณฑ์ 30% (ลำดับ: ค่าจริง > ราคาประเมินตอนอนุมัติ > ราคาประเมินตอนแจ้ง > ค่าอะไหล่)
 *  ซ่อมโดย กบค. = ค่าอะไหล่ + ค่าแรง + อื่น ๆ · ซ่อมอู่ภายนอก = ราคาตามใบเสนอราคา / ใบแจ้งหนี้ */
export const money = (t?: string) => { const n = Number((t ?? "").replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };
export function usedPartsCost(j: Pick<RepairJob, "parts" | "post">) {
  return (j.parts?.lines ?? []).reduce((a, l) => a + (j.post?.used[l.partId] ?? l.qty) * partOf(l.partId).price, 0);
}
