# FLO Agent Instructions — product MTD

กฎย่อสำหรับ AI ทุกตัวที่อ่านหรือเขียน FLO product `MTD` · template เต็ม: [`FLO-TEMPLATES.md`](FLO-TEMPLATES.md) (§ อ้างตามไฟล์นั้น)
สองไฟล์นี้ต้องตรงกันเสมอ — แก้ไฟล์หนึ่งให้แก้อีกไฟล์ในการเปลี่ยนเดียวกัน

ข้อความในกรอบด้านล่างวางลงช่อง **Agent instructions ของ product MTD** ใน FLO ได้ทันที (FLO ส่งให้ agent ทุกตัวผ่าน `get_item` / `list_items`)

---

```markdown
# MTD — กฎสำหรับ agent

## หลักการ
1. หนึ่งเรื่อง หนึ่งที่: สถานะ = บล็อกสถานะ · AC = ตาราง AC · การยืนยัน = Confirmation log
2. ข้อเท็จจริงล่าสุดอยู่ใน description · comment คือประวัติ
3. เลขการ์ด = MTD-<n> ที่ FLO ออก ห้ามตั้งเลขเอง (PEA-1.24.14, [SP09], PEA-1.1.??)
4. ไม่มีข้อมูล → เขียน "ยังไม่มี" หรือเปิด OQ ห้ามเดา · ห้ามเดาเลข JO/UC
5. ห้ามเขียนว่า กฟภ./ลูกค้ายืนยัน ถ้าไม่มีแถวใน Confirmation log · "สวยแล้ว" = ยืนยันหน้าตาเท่านั้น
6. ย้าย column, assign, archive, trash → เมื่อคนสั่งเท่านั้น · ห้ามคัดลอกข้อมูลส่วนบุคคลจริงลงการ์ด

## Type และ title
- Epic (1 UC ในใบ JO): `[JO<n>-UC<nn>] <ชื่อ UC>` · ไม่รู้ UC → `[JO?] <ชื่อ>` + tag Open questions · ไม่ขึ้น board
- Feature: `<role> <ทำอะไร>` · epic บังคับ · tag ทีม
- Bug: `<อาการ> — <ที่ไหน>` · epic เดียวกับ story · add_related_item fixes <story> บังคับ
- Technical: `<ทำอะไร> <เพื่ออะไร>` · epic ไม่บังคับ
- ห้ามใส่ sprint, ทีม, สถานะ, epic, [PEA], [Scenario n] ใน title
- Branch feat|fix|chore/MTD-<n>-<slug> · commit `type(scope): subject (MTD-<n>)`

## Section (ชื่อหัวข้อตามนี้ ไม่มีข้อมูลเขียน "ยังไม่มี" ไม่ลบหัวข้อ)
- Epic: สถานะ → Sources → เป้าหมาย → สิ่งที่ต้องการ → นอกขอบเขต → Acceptance Criteria → Acceptance Test → Coverage (# | สิ่งที่ต้องการ | Story | Stage) → Open Questions → Change log
- Feature: สถานะ → Sources → Design → 0. Agent Preflight → 1. Goal → 2. Acceptance Criteria (+ Edge Cases + ถอดออก) → 3. Out of Scope → 4. Files to Change → 5. Reuse → 6. Impact → 7. Guardrails → 8. Contracts → 9. Test Scenarios → 10. Definition of Done → Open Questions → Confirmation log → Change log
- Bug: สถานะ (Severity, Env + sha, ถัดไป, AC ที่ไม่ผ่าน) → Steps → Actual result → Expected result → Fix → Change log
- Technical: สถานะ → ทำไม → ทำอะไร → ตรวจอย่างไร → Change log

## บล็อกสถานะของ Feature (บนสุด)
## สถานะ (อัปเดต DD/MM/25xx)
- Stage: Brief | Prototype | Refinement | Customer confirm | Build | QA | Done
- Gate: ผ่าน | ไม่ผ่าน | รอ — <เหตุผล/หลักฐาน>
- ถัดไป: <action 1 ข้อ> — <ใคร>
- รอ: ไม่มี | OQ-xx จาก <ใคร> | MTD-xx | API <ชื่อ>
- AC: x/y · EC: x/y · OQ ค้าง: n
- ยืนยันล่าสุด: <ขั้น> · <ผู้ยืนยัน> · <วันที่> · <หลักฐาน>
- อ้างอิง JO: <ใบ JO ข้อ…> หรือเว้นว่าง

## ID ภายในการ์ด
AC-nn EC-nn TC-nn OQ-nn CH-nn · ไม่เปลี่ยนเลข · ถอดแล้วย้ายไปตาราง "ถอดออก" ห้ามใช้ซ้ำ
AC Status: [ ] ยังไม่ผ่าน · [x] ผ่านและมีหลักฐาน · merged อยู่ใน main รอ AT
AC ห้ามทำเป็น subtask · subtask = งานที่คนรับต่างกันเท่านั้น: [BE] [FE] [UX] [QA] + ชุด Discovery [BA] [UX] [DEV] [QA] [PO]

## อัปเดต
- ข้อตกลงใหม่ → comment ตามรูปแบบ แล้วแก้ description (ตารางที่เกี่ยว + บล็อกสถานะ + Change log) วันเดียวกัน
  - `**เคลียร์ OQ-nn:** <คำถาม>` → `→ **<คำตอบ>** (<ใคร>, DD/MM/25xx)`
  - `**เปลี่ยน AC:** <ID>` เดิม → ใหม่ · เหตุผล · หลักฐาน
  - `**ผลเทส local (ก่อนส่ง QA)**` Backend / Frontend / ยังต้องทำบน UAT
  - `## ผลตรวจ <branch> (<sha>) — DD/MM/25xx` ทำแล้ว / ยังขาด / ต้องให้เจ้าของงานตัดสิน
- ก่อนเขียน description ใหม่ทั้งก้อน → comment `**Backup description เดิม (DD/MM/25xx)**` · เก็บบรรทัด [attachment …] ไว้ที่เดิม
- รอ: ไม่ว่าง → ต้องมี tag Open questions หรือ blocks หรือ hold_item
- สร้าง story ใหม่ → เพิ่มแถวใน Coverage ของ epic
- story ตกหล่น/เพิ่มหลังเริ่ม sprint → สร้างการ์ดใต้ epic ทันที (ไม่ยัดเป็น AC/subtask ของใบเดิม) + Coverage + Change log epic `CH-nn เพิ่ม MTD-xx (ตกหล่น)` + blocks ถ้ากระทบ · เข้า sprint นี้หรือไม่ PO ตัดสิน: เข้าได้เมื่อผ่าน gate To do และเอางานขนาดใกล้กันออก · comment `**เพิ่มเข้า sprint:**` · นอกขอบเขต JO = scope ใหม่ `[JO?]` ไม่ใช่งานตกหล่น
- ทุกการเขียนส่ง actor {"model": "<model id>"} · ไม่ลงชื่อผู้เขียน

## Column และ gate
backlog (Brief→Customer confirm, ผ่านเมื่อมีแถว Confirmation log) → To do (AC ยืนยัน, contract ตกลง, รอ: ไม่มี) → In progress (คนรับ+branch) → Ready to deploy (build เสร็จรอขึ้น UAT: lint/type-check/test ผ่าน + comment ผลเทส local + merge + migration พร้อม) → Ready to test (อยู่บน UAT แล้ว, ระบุ sha) → Testing (QA รับ) → Defect (มี Bug เปิดที่ fixes story นี้ · แก้แล้ว deploy ใหม่กลับ Ready to test) → Done (AC ครบ [x], ไม่มี Bug เปิด)
Discovery (board Discovery): Inbox (มี epic + อ้างอิง JO) → Brief (เจ้าของงานยืนยันขอบเขต) → Prototype (ลูกค้ายืนยันหน้าตา/การกด/สิทธิ์/ผลลัพธ์) → Refinement (AC ครบ, review UX/FE/BE/QA ตอบแล้วหรือเป็น OQ) → รอ กฟภ. ยืนยัน (แถว Customer confirm + OQ block ตอบครบ) → Ready for dev → ย้ายไป Maintain-d / To do เมื่อเข้า sprint
ทุก story ใน Inbox ใส่ subtask: [BA] Brief · [UX] Prototype · [UX] Review ความเสี่ยง UX · [DEV] Review ความเสี่ยง FE/BE + contract · [QA] Review AC ทดสอบได้ · [PO] Customer confirm
Deliverable Discovery ราย JO: epic `[JO<n>] Discovery deliverables` + การ์ด Technical หนึ่งใบต่อเอกสาร TOR 8.1 (8 เอกสาร)
Defect column = ที่อยู่ของ story ที่มี bug เปิด · ตัว defect เป็นการ์ด Bug แยกที่ fixes story

## Tag (ห้ามสร้างเพิ่ม)
⭐️ Vaseline · ❤️ Peidmerge (ทีม, ถามก่อนใส่) · Open questions (มี OQ ที่ block) · Customer confirm (รอ กฟภ.) · Carry-over (ข้าม sprint)

## Health check ("เช็กสุขภาพ FLO MTD") — รายงานเท่านั้น
H1 ไม่มี epic · H2 ค้าง backlog >3 วันทำการ · H3 ไม่มี/บล็อกสถานะเก่า >3 วันทำการ · H4 รอแต่ไม่มี tag/blocks/hold · H5 Done แต่ AC ไม่ครบหรือ Bug เปิด / Defect แต่ไม่มี Bug เปิด · H6 ข้อตกลงอยู่แค่ comment · H7 Coverage ขาด · H8 epic summary ว่าง/เก่า >7 วัน · H9 ไม่มีคนรับ · H10 scope ซ้ำ · H11 title ผิดรูปแบบ · H12 Bug ไม่มี fixes · H13 Discovery subtask ไม่ครบหรือค้าง column >5 วันทำการ · H14 JO ไม่มี epic Discovery deliverables หรือเอกสารไม่ครบ 8
ตอบเป็นตาราง: กฎ | Item | เจอ | แนะนำ | ใครทำ
```
