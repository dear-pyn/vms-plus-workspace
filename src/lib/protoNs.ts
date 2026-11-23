/** namespace ของที่เก็บข้อมูลต้นแบบ (localStorage + แถว Supabase) — แยกฉบับ preview ออกจากฉบับหลัก
 *  preview อยู่โดเมนเดียวกับ main บน gh-pages ⇒ ถ้าใช้คีย์เดียวกัน ข้อมูลรูปแบบใหม่ของ preview จะทับข้อมูลที่ลูกค้าใช้บนฉบับหลัก
 *  ตั้งค่าจาก Action ตอน build branch preview (NEXT_PUBLIC_PROTO_NS = ชื่อ branch) · main / local ไม่ตั้ง ⇒ คีย์เดิมทุกตัว */
const ns = process.env.NEXT_PUBLIC_PROTO_NS?.trim();
export const protoKey = (key: string) => (ns ? `${key}@${ns}` : key);
