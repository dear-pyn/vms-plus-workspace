---
name: weekly-report
description: Writes the PEA Maintain-D weekly report from the FLO board (product MTD, board Maintain-d) into a new Claude Doc. Week 1 of a 2-week sprint gets a short mid-sprint update; week 2 gets the full sprint story (same style as the "เรื่องราวที่ PEA Maintain — Sprint 07" doc). Use when the user asks for "รายงานประจำสัปดาห์", "weekly report", or invokes /weekly-report; also run unattended every Friday evening by tools/weekly-report/run.sh.
---

# รายงานประจำสัปดาห์ — PEA Maintain-D

รันได้ทั้งแบบมีคนสั่ง และแบบอัตโนมัติ (ไม่มีคนตอบคำถาม) — ห้ามถามกลับ ถ้าข้อมูลไม่พอให้เขียนลงหัวข้อ "ต้องยืนยัน" ในรายงานแทน

ไฟล์ทั้งหมดอยู่ใน `tools/weekly-report/` (relative กับ vms-plus-workspace)
- `config.json` — ค่าตั้งต้น (อ่านก่อนเสมอ)
- `snapshots/<YYYY-MM-DD>.json` — ภาพบอร์ดของแต่ละศุกร์ (local, gitignored)
- `reports.md` — บันทึกลิงก์รายงานที่สร้างแล้ว (บรรทัดละ 1 สัปดาห์)

## 1. กำหนดช่วงสัปดาห์

- วันรายงาน = วันนี้ (เวลาไทย) · ช่วง = จันทร์–ศุกร์ของสัปดาห์นี้
- สัปดาห์ที่เท่าไรของ sprint:
  - ถ้า `config.sprint_anchor_start` มีค่า (วันจันทร์แรกของ sprint ใดก็ได้) → `week = (floor(วันที่ห่างจาก anchor / 7) mod 2) + 1`
  - ถ้าเป็น null → ใช้ snapshot ล่าสุด: sprint ชื่อเปลี่ยน หรือ snapshot ก่อนเป็น week 2 → week 1, ไม่งั้น week 2 · ไม่มี snapshot เลย → week 1 และใส่ "ต้องยืนยัน: วันเริ่ม sprint" ในรายงาน
- ชื่อ sprint = `sprint.name` ที่พบบ่อยที่สุดในการ์ดที่ `get_item` (ข้อ 2)

## 2. ดึงข้อมูลจาก FLO (อ่านอย่างเดียว ห้ามแก้การ์ด ห้ามย้าย column)

1. `get_agent_instructions` product MTD board Maintain-d — ทำตาม
2. `get_board` MTD / Maintain-d → column ของทุกการ์ดบนบอร์ด
3. โหลด snapshot ล่าสุดที่เก่ากว่าวันนี้ แล้วหา **การ์ดที่ขยับ** = column ต่างจาก snapshot หรือการ์ดที่ไม่เคยมีใน snapshot
4. `get_item` เฉพาะ: การ์ดที่ขยับ + การ์ดใน Done + การ์ดใน Defect · (ไม่มี snapshot ก่อน → get_item การ์ดทุกใบที่ไม่ใช่ To do) — ใช้ `started_at`, `done_at`, `sprint`, `epics`, `type`, บล็อกสถานะใน description
5. `list_wraps` / `get_wrap` สัปดาห์นี้ ถ้ามี — ใช้ตัวเลขประกอบ ไม่ต้องนับเอง
6. เขียน snapshot วันนี้: `{"date","sprint","week","items":[{"key","title","type","column","epic"}]}` — **ห้ามใส่ชื่อคน**

## 3. จัดกลุ่ม "ความคืบหน้าสัปดาห์นี้"

นับจากการย้าย column ไม่ใช่ Done อย่างเดียว:

| ไป column | ความหมายในรายงาน |
|---|---|
| Ready to test | Dev ทำเสร็จ รอทดสอบ |
| Testing | QA กำลังทดสอบ |
| Ready to deploy | ทดสอบผ่าน รอขึ้นระบบ |
| Done (`done_at` อยู่ในช่วงสัปดาห์) | เสร็จสมบูรณ์ |
| Defect | เจอปัญหา ต้องแก้ |
| In progress (ใหม่) | เริ่มทำ |

- จัดกลุ่มตาม epic `[JO<n>-UC<nn>]` → ถ้าไม่มี epic ใช้ prefix ในชื่อ (Overhaul, Login…) → ที่เหลือ "อื่น ๆ"
- การ์ด `[QA] …` รวมเป็นบรรทัดเดียวต่อกลุ่ม (เตรียม test case n ใบ / execute n ใบ)
- Technical (CI, ช่องโหว่, pipeline) รวมเป็นหัวข้อ "งานเบื้องหลัง" ไม่เกิน 1 ย่อหน้า
- การ์ดค้าง column เดิม ≥ 2 snapshot และไม่ใช่ To do → "ค้างนาน"

## 4. เขียนรายงานลง Claude Doc ใหม่

ใช้ connector Claude Docs (`batch` สร้าง doc + skeleton แล้ว `update` เติมทีละ section) ทำตาม `guide topic.index` ก่อนเขียน

ผู้อ่าน: ทีม + ฝั่ง กฟภ. · น้ำเสียงเดียวกับ doc Sprint 07 (เล่าเป็นภาษาคน ลงท้าย "ค่ะ" ได้) · ใช้คำว่า "ยานพาหนะ" ตามคำในระบบ · ห้ามใส่ข้อมูลส่วนบุคคลของ กฟภ. · อ้างการ์ดเป็นลิงก์ `MTD-<n>`

**ชื่อ doc:** `รายงานประจำสัปดาห์ PEA Maintain — <sprint> สัปดาห์ <1|2> (<dd/mm>–<dd/mm/25xx>)` (ปี พ.ศ.)

**Week 1 — รายงานกลาง sprint (สั้น ≤ 1 หน้า)**
1. สรุปสั้น 2–3 บรรทัด: sprint นี้ตั้งใจทำอะไร และตอนนี้อยู่ตรงไหน
2. ตัวเลขสัปดาห์นี้: Dev เสร็จ · กำลังทดสอบ · เสร็จสมบูรณ์ · Defect (แถวตัวเลขสั้น ๆ)
3. ความคืบหน้าตามกลุ่มงาน: หัวข้อย่อยต่อกลุ่ม bullet ละการ์ด `<ทำอะไรได้แล้ว> — <column>`
4. ติดอะไร / ต้องการอะไร: Defect, การ์ดค้างนาน, OQ ที่รอ กฟภ. (จากบล็อกสถานะ "รอ:")
5. สัปดาห์หน้า: การ์ดใน In progress / Ready to test ที่ควรไปต่อ
6. ต้องยืนยัน (ถ้ามี)

**Week 2 — รายงานปิด sprint (แบบ Sprint 07)**
ไม่สร้าง doc ใหม่: เพิ่มเป็น **แท็บใหม่ชื่อ `Sprint <nn>`** ใน doc รวม "เรื่องราวที่ PEA Maintain" (`config.story_doc_url`) ตาม `guide topic.tabs` ex.1 · ใน patch เดียวกันตั้ง order ของทุกแท็บ Sprint ใหม่เป็น `"a" + (99 - nn)` (เลข 2 หลัก) ให้ sprint ล่าสุดอยู่ซ้ายสุด · ลิงก์ใน Hub/reports.md = `<story_doc_url>#<tab id>`
ใช้โครงเดียวกับ doc Sprint 07: หัวเรื่อง + sprint · คืออะไร (1 ย่อหน้า ใช้ซ้ำได้) · ✨ Highlight · ภาพรวม Sprint · หัวข้อต่อกลุ่มงาน (เล่าว่าผู้ใช้ทำอะไรได้แล้ว) · 🧹 เก็บกวาดบ้าน (Defect/บั๊กที่แก้) · งานเบื้องหลัง · 📌 ยังต้องตามกันต่อ (checklist) · ต้องยืนยัน
ครอบคลุมทั้ง 2 สัปดาห์ของ sprint (รวม snapshot week 1 ด้วย) · วางช่องภาพประกอบเป็น blockquote `🖼️ (ภาพประกอบ: …)` ให้ทีมใส่รูปเอง

กฎเนื้อหา:
- เขียนเฉพาะสิ่งที่มีหลักฐานจากการ์ด (column, done_at, description, comment) · ห้ามเขียนว่า กฟภ. ยืนยัน ถ้าการ์ดไม่มีแถวใน Confirmation log
- ไม่รู้ว่าการ์ดทำอะไร (description ว่าง) → เขียนจากชื่อการ์ด และใส่ใน "ต้องยืนยัน"
- ไม่มีการ์ดขยับเลย → เขียนรายงานสั้นว่าไม่มีความเคลื่อนไหว พร้อมรายการค้าง

## 5. ปิดงาน

- เพิ่มบรรทัดใน `tools/weekly-report/reports.md`: `- <YYYY-MM-DD> · <sprint> สัปดาห์ <n> · <ลิงก์ doc>`
- อัปเดตหน้า Hub (`config.hub_url`, ไฟล์ `tools/hub/index.html`):
  1. `Artifact` action `read` url = hub_url (ต้องอ่านก่อน publish ทุกครั้ง)
  2. แก้ JSON ใน `<script id="hub-data">` ของไฟล์ local: เพิ่ม object ต้น array `reports` → `{"date":"<YYYY-MM-DD>","sprint":"Sprint <nn>","kind":"week1"|"week2","title":"<ชื่อ doc>","url":"<ลิงก์ doc>"}` (รายงานปิด sprint ใช้ `"week2"`) · ตั้ง `updated` เป็นวันนี้ · sprint ใหม่ (วันนี้เลย `sprint.end`) → อัปเดต `sprint` เป็น sprint ปัจจุบัน · แก้อย่างอื่นไม่ได้
  3. `Artifact` publish `file_path` = `tools/hub/index.html`, `url` = hub_url (ไม่ส่ง icon) — ถ้า publish ถูกปฏิเสธเพราะมีเวอร์ชันใหม่กว่า ให้รวมแถวใหม่เข้ากับเวอร์ชันที่ได้มาแล้ว publish อีกครั้ง
- doc รายงานใหม่เป็นแบบส่วนตัว: บอกในคำตอบว่าต้องกด Share ให้ทีม/กฟภ. เปิดได้
- บรรทัดสุดท้ายของคำตอบ: `REPORT_URL: <ลิงก์ doc>` (สคริปต์ใช้ส่งแจ้งเตือน)
