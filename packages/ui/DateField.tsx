"use client";
/** วันที่แบบพิมพ์ — Figma ใช้ `Text input` (Size=md) placeholder "วว/ดด/ปปปป" ไม่มีไอคอน (จอ OH2 / E.2 วันเริ่มสัญญา · วันสิ้นสุดสัญญา)
 *  พิมพ์ตัวเลขแล้วใส่ "/" ให้เอง · ปี พ.ศ. · ตรวจรูปแบบด้วย parseThaiDate() */
import type { ComponentProps } from "react";
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

export function DateField({ value, onChange, ...rest }: Omit<ComponentProps<typeof TextField>, "onChange" | "value"> & { value: string; onChange: (v: string) => void }) {
  return <TextField inputMode="numeric" placeholder="วว/ดด/ปปปป" maxLength={10} value={value} onChange={(e) => onChange(mask(e.target.value))} {...rest} />;
}
