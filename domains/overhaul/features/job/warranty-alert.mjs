/** แจ้งเตือนก่อนประกันงาน Overhaul หมด — v2 (feedback ลูกค้า 23 พ.ย. 2569 · EC-53)
 *  ลูกค้า: 30 วัน = เผื่อเวลาให้ผู้รับจ้างแก้ถ้าชำรุดตามเงื่อนไขประกัน · 15 วัน = ไม่มีชำรุดแล้ว เตรียมเอกสารคืนเงินค้ำประกัน
 *  ระบบรับจำนวนวันน้อยกว่า 30/15 ได้ → นับจากวันหมดประกันเทียบวันปิดงาน (วันที่อนุมัติ):
 *    - เหลือ > 30 วันตอนปิดงาน: แจ้ง 2 รอบตามปกติ
 *    - เหลือ 16–30 วัน: รอบ 30 วันส่งทันทีตอนปิดงาน แล้วรอบ 15 วันตามปกติ
 *    - เหลือ 1–15 วัน: ส่งรอบเดียวทันที (รวมเนื้อหาสองรอบ)
 *    - หมดแล้ว (เลือกวันเริ่มย้อนหลัง): ไม่แจ้ง แสดงว่าประกันหมดแล้ว
 *  ต้นแบบดูจาก "วันนี้": แสดงรอบที่ถึงกำหนดแล้วรอบล่าสุดรอบเดียว */

/** ระยะประกันขั้นต่ำตามสัญญา Overhaul ที่ลูกค้าแจ้ง ("จะกำหนด 180 วันขึ้นไป") — ต่ำกว่านี้เตือน ไม่บล็อก */
export const WARRANTY_USUAL_MIN_DAYS = 180;
export const ALERT_DAYS = [30, 15];

const DAY = 86_400_000;
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
/** วันที่เหลือจาก from ถึง end (ติดลบ = เลยแล้ว) */
export const daysBetween = (from, end) => Math.round((dayStart(end) - dayStart(from)) / DAY);

/**
 * รอบแจ้งเตือนที่แสดง ณ วันนี้
 * @param {Date} end วันหมดประกัน
 * @param {Date} today
 * @param {Date | null} closedOn วันที่ปิดงาน (อนุมัติ) — ใช้ดูว่ารอบ 30 วันถูกข้ามไปหรือไม่
 * @returns {null | { round: 30 | 15, combined: boolean, left: number }}
 */
export function warrantyAlert(end, today, closedOn = null) {
  const left = daysBetween(today, end);
  if (left < 0 || left > 30) return null;
  if (left > 15) return { round: 30, combined: false, left };
  const leftAtClose = closedOn ? daysBetween(closedOn, end) : null;
  return { round: 15, combined: leftAtClose !== null && leftAtClose <= 15, left };
}

/** ประกันจะเริ่มแจ้งเตือนทันทีตอนปิดงานไหม (เหลือ ≤ 30 วัน) — ใช้เตือนตอนกรอก */
export function alertsStartImmediately(end, closingOn) {
  const left = daysBetween(closingOn, end);
  return left >= 0 && left <= 30;
}
