/** ด่านกันออกจากหน้าระหว่างแก้ไข (EC-27) — ตัวจัดเส้นทาง hash ของหน้าเรียก blockHashLeave() ก่อนเปลี่ยนหน้า
 *  ต้องผ่านตัวกลางนี้ เพราะ hashchange บน window เรียกตามลำดับที่ลงทะเบียน (capture ไม่ช่วยให้มาก่อน) */
type Guard = (toHash: string) => boolean;
let guard: Guard | null = null;

export function setLeaveGuard(g: Guard | null) {
  guard = g;
}

/** true = มีฟอร์มค้างแก้ไข ถามผู้ใช้แล้ว อย่าเพิ่งเปลี่ยนหน้า */
export function blockHashLeave(toHash: string): boolean {
  return guard ? guard(toHash) : false;
}
