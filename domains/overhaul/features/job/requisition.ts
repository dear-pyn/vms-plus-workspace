/** ตรรกะใบเบิกอะไหล่รายคัน (v2 EC-56) — ไม่ผูก UI เพื่อให้ node test import ได้
 *  สมมติฐาน 23 พ.ย. 2569 (รอลูกค้ายืนยัน · เจ้าของงาน "ควรเบิกก่อนทำ PO ได้"): ใบเบิกเก็บที่ยานพาหนะในแผน ·
 *  เบิกได้ตั้งแต่ยังไม่มี Purchase Order (หน้ารายละเอียดแผน) และเบิกเพิ่มระหว่างซ่อม (ขั้น 3) จนกด "ซ่อมสำเร็จ" · ยกเลิกได้เฉพาะใบที่ยังรอเบิกจากคลัง ·
 *  ยอดเบิกรวมเป็นค่าตั้งต้นของตารางอะไหล่ขั้น 6 (จำนวนที่คืน = เบิก − ใช้ ตามเดิม) */
import type { JobCode, PartCat, PartUsed, Requisition } from "../po/types";

/* ขั้นตาม JOB_STATUS (types.ts) — เขียนเป็นชุดสถานะเพื่อไม่ import ค่าจาก types.ts (node test import ไฟล์นี้ตรง ๆ) */
const BEFORE_STEP3 = new Set<JobCode>(["V1", "V2", "V3", "V4", "V4.1"]);
/** เบิก/ยกเลิกได้ตั้งแต่ยังไม่มีงาน (ไม่มี Purchase Order) จนถึงขั้น 3 ติดตามงานซ่อม (V5) · กด "ซ่อมสำเร็จ" (V6) แล้วล็อก */
export const canRequisition = (code?: JobCode) => !code || BEFORE_STEP3.has(code) || code === "V5";

/** ข้อมูลก่อนมีใบเบิก (งานที่ผ่านขั้น 3 แล้ว): ถือเป็นใบเบิกที่เบิกแล้ว 1 ใบ จากรายการเบิกคลังชุดเดิมของขั้น 6 */
const LEGACY_LINES: Requisition["lines"] = [
  { partId: "p-bat", name: "แบตเตอรี่ 12V 100Ah", code: "1-81200-345-0", unit: "ลูก", price: 3200, qty: 2, cat: "body" },
  { partId: "p-alt", name: "ไดชาร์จ 24V 50A", code: "8-97253-921-0", unit: "ตัว", price: 6850, qty: 1, cat: "body" },
  { partId: "p-wire", name: "สายไฟ 6 sq.mm สีแดง", code: "WR-6SQ-RED", unit: "เมตร", price: 45, qty: 30, cat: "body" },
];
/** stored = PlanVehicle.requisitions · code = สถานะงานของคันนั้น (ไม่มี = ยังไม่มี Purchase Order) */
export function requisitionsOf(stored: Requisition[] | undefined, code?: JobCode): Requisition[] {
  if (stored) return stored;
  if (!code || BEFORE_STEP3.has(code)) return [];
  return [{ id: "legacy", no: 1, at: "", by: "", lines: LEGACY_LINES, status: "issued" }];
}

export const activeRequisitions = (reqs: Requisition[]) => reqs.filter((r) => r.status !== "cancelled");
/** รายการที่เบิกและยังไม่ยกเลิก (ยกเลิกได้ทั้งครั้งที่เบิก หรือทีละรายการ) */
export const activeLines = (reqs: Requisition[]) => activeRequisitions(reqs).flatMap((r) => r.lines.filter((l) => !l.cancelled));
export const requisitionValue = (reqs: Requisition[]) => activeLines(reqs).reduce((a, l) => a + l.qty * l.price, 0);
/** สถานะของรายการ = ยกเลิกแล้ว ถ้ารายการหรือการเบิกครั้งนั้นถูกยกเลิก · ไม่งั้นตามการเบิกครั้งนั้น */
export const lineStatus = (r: Requisition, l: Requisition["lines"][number]): Requisition["status"] => (l.cancelled || r.status === "cancelled" ? "cancelled" : r.status);
export const nextRequisitionNo = (reqs: Requisition[]) => reqs.reduce((m, r) => Math.max(m, r.no), 0) + 1;

/** ยอดเบิกรวมต่ออะไหล่ (ไม่นับใบที่ยกเลิก) → แถวตั้งต้นของตารางอะไหล่ขั้น 6 ตามหมวด */
export function withdrawnParts(reqs: Requisition[], cat: PartCat): PartUsed[] {
  const sum = new Map<string, PartUsed>();
  for (const r of activeRequisitions(reqs))
    for (const l of r.lines) {
      if (l.cat !== cat || l.cancelled) continue;
      const key = `${l.partId}|${l.price}`;
      const cur = sum.get(key);
      if (cur) { cur.qty += l.qty; cur.withdrawn = (cur.withdrawn ?? 0) + l.qty; }
      else sum.set(key, { id: `rq-${l.partId}-${l.price}`, name: l.name, code: l.code, unit: l.unit, price: l.price, qty: l.qty, withdrawn: l.qty, oldQty: 0, remark: "" });
    }
  return [...sum.values()];
}

/** เพิ่มใบเบิกใหม่ (สถานะรอเบิกจากคลัง) ต่อท้ายใบเดิมของคันนั้น */
export function withNewRequisition(reqs: Requisition[], lines: Requisition["lines"], at: string, by: string, id: string): { next: Requisition[]; added: Requisition } {
  const added: Requisition = { id, no: nextRequisitionNo(reqs), at, by, lines, status: "pending" };
  return { next: [...reqs, added], added };
}
/** ยกเลิกรายการเบิก 1 รายการ — ได้เฉพาะรายการที่ยังรอเบิกจากคลัง · ต้องมีเหตุผล · ไม่เข้าเงื่อนไข = null */
export function withCancelledLine(reqs: Requisition[], reqId: string, partId: string, reason: string, at: string): Requisition[] | null {
  const r = reqs.find((x) => x.id === reqId);
  const l = r?.lines.find((x) => x.partId === partId);
  if (!r || !l || lineStatus(r, l) !== "pending" || !reason.trim()) return null;
  return reqs.map((x) => (x.id !== reqId ? x : { ...x, lines: x.lines.map((y) => (y.partId === partId ? { ...y, cancelled: { reason: reason.trim(), at } } : y)) }));
}
/** ยกเลิกการเบิกทั้งครั้ง — ได้เฉพาะที่ยังรอเบิกจากคลัง · ไม่เข้าเงื่อนไข = null */
export function withCancelledRequisition(reqs: Requisition[], id: string, reason: string, at: string): Requisition[] | null {
  const target = reqs.find((r) => r.id === id);
  if (!target || target.status !== "pending" || !reason.trim()) return null;
  return reqs.map((r) => (r.id === id ? { ...r, status: "cancelled" as const, cancelReason: reason.trim(), cancelledAt: at } : r));
}

/* ขั้น 3 — เจ้าของงาน 24 พ.ย. 2569 "ตารางต้องเหมือนที่ส่งให้ ปรับจำนวนต่อได้": ตารางแบบขั้น 6 รวมยอดต่ออะไหล่ (withdrawnParts) แก้จำนวนในแถว
   ปรับเฉพาะส่วนที่ยังรอเบิกจากคลัง · ลดต่ำกว่ายอดที่เบิกแล้วไม่ได้ · เพิ่ม = ต่อท้ายรายการรอเบิกล่าสุดของอะไหล่นั้น (ไม่มี = เบิกใหม่ 1 ครั้ง) */
const samePart = (l: Requisition["lines"][number], partId: string, price: number) => l.partId === partId && l.price === price && !l.cancelled;
/** ยอดของอะไหล่ 1 แถว (partId + ราคา): issued = เบิกแล้ว (ลดไม่ได้) · total = ยอดที่ยังไม่ยกเลิก */
export function partQty(reqs: Requisition[], partId: string, price: number) {
  let issued = 0, total = 0;
  for (const r of activeRequisitions(reqs))
    for (const l of r.lines)
      if (samePart(l, partId, price)) { total += l.qty; if (r.status === "issued") issued += l.qty; }
  return { issued, total, pending: total - issued };
}
/** ตั้งยอดรวมของอะไหล่ 1 แถวเป็น qty · ต่ำกว่ายอดที่เบิกแล้ว / ไม่มีอะไหล่นี้ = null · รายการรอเบิกที่เหลือ 0 ถูกนำออก */
export function withPartQty(reqs: Requisition[], partId: string, price: number, qty: number, at: string, by: string, id: string): Requisition[] | null {
  const { issued, total } = partQty(reqs, partId, price);
  const tpl = reqs.flatMap((r) => r.lines).find((l) => samePart(l, partId, price));
  if (!tpl || !Number.isInteger(qty) || qty < issued) return null;
  let delta = qty - total;
  if (delta === 0) return reqs;
  if (delta > 0) {
    const last = [...reqs].reverse().find((r) => r.status === "pending" && r.lines.some((l) => samePart(l, partId, price)));
    if (last) return reqs.map((r) => (r !== last ? r : { ...r, lines: r.lines.map((l) => (samePart(l, partId, price) ? { ...l, qty: l.qty + delta } : l)) }));
    return withNewRequisition(reqs, [{ ...tpl, qty: delta }], at, by, id).next;
  }
  const out = [...reqs];
  for (let i = out.length - 1; i >= 0 && delta < 0; i--) {
    const r = out[i];
    if (r.status !== "pending") continue;
    const lines = r.lines.map((l) => {
      if (delta >= 0 || !samePart(l, partId, price)) return l;
      const cut = Math.min(l.qty, -delta);
      delta += cut;
      return { ...l, qty: l.qty - cut };
    }).filter((l) => l.qty > 0);
    out[i] = { ...r, lines };
  }
  return out.filter((r) => r.lines.length > 0);
}
/** ยกเลิกส่วนที่ยังรอเบิกของอะไหล่ 1 แถว (บังคับเหตุผล) · ไม่มีส่วนรอเบิก = null */
export function withCancelledPart(reqs: Requisition[], partId: string, price: number, reason: string, at: string): Requisition[] | null {
  if (!reason.trim() || partQty(reqs, partId, price).pending <= 0) return null;
  return reqs.map((r) => (r.status !== "pending" ? r : { ...r, lines: r.lines.map((l) => (samePart(l, partId, price) ? { ...l, cancelled: { reason: reason.trim(), at } } : l)) }));
}
