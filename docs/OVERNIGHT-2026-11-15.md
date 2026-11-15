# งานกลางคืน 15 พ.ย. 2569 — ต้นแบบ Overhaul scene ที่เหลือ (E–U)

คำสั่งเจ้าของงาน (14 พ.ย. 2569 ดึก): ทำ scene ที่เหลือ **ดูวิธีประกอบ component จาก Figma ก่อน** · token ใกล้หมดให้ส่งต่อ agent ทำต่อ · ตื่น 08:00

## วิธีทำ (ต่อ scene) — ตาม docs/WORKFLOW.md
1. โครงจอ: `node <scratchpad>/outline.cjs "E\.2 "` (ต้นไม้ component ← ชื่อ component [variant] จาก dump `design/figma-dump/figma-overhaul-refinement-09/import-2026-11-13/1-5795.json`)
   - สคริปต์สำรองในรีโป: `tools/figma-dump/outline.cjs`
2. มติ FigJam: `design/figma-dump/overhaul-refinement-09/`
3. AC: `../Maintenance-Request-Form/Diagram/01-บำรุงรักษาตามวาระ/15-overhaul-AC.md` (AC-S4 … AC-S18) + `16-overhaul-toast-notification.md`
4. รีวิวสั้น (senior UX + dev) → `public/content/overhaul-scene-<x>/review.md` · เคสเสี่ยงลง `domains/overhaul/edge-cases.md`
5. ทำต้นแบบใน `src/app/(prototype)/prototypes/overhaul/page.tsx` + `domains/overhaul/features/...` ใช้ `packages/ui` ก่อน
6. ทดสอบเบราว์เซอร์ (dev server พอร์ต 3020 · playwright-core) + `npx tsc --noEmit` + `npm run check` + `npm test`

กติกา: ห้าม commit/push · ไม่ใช้ข้อมูลจริงจาก captures · เงิน 1,000.00 · "ยานพาหนะ" แทน "รถ" ใน UI · ปุ่ม modal hug · ไม่แสดงชิปตัวกรอง · pill มีเฉพาะในตาราง (ยกเว้นตัวเลือกสถานะในแผงตัวกรอง)
ตัดสินใจเองระหว่างคืน = จดในหัวข้อ "ตัดสินใจแทนไปก่อน" ให้เจ้าของงานเคาะตอนเช้า

## สถานะ
| Scene | จอ | เรื่อง | สถานะ |
|---|---|---|---|
| E | E.1–E.9 | S4 สร้าง Purchase Order | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-efg/review.md` |
| F | F.1–F.4 | S5 แก้ไข PO | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-efg/review.md` |
| G | G.1–G.2 | S6 ลบ PO | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-efg/review.md` |
| H | H.1–H.7 | S7 นัดหมายนำยานพาหนะเข้า Overhaul | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-h/review.md` · ขั้น 5 (N) ใช้ `StepAppointment kind=5` ต่อได้เลย |
| I | I.1–I.7 | S8 ตรวจรับยานพาหนะก่อน Overhaul | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-i/review.md` |
| J K L | J.1–L.3 | S9–S11 ติดตามผลการดำเนินการ เพิ่ม/แก้/ลบ | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-jkl/review.md` |
| M | M.1–M.2 | S12 เอกสารความปลอดภัย | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-m/review.md` |
| N | N.1–N.5 | S13 นัดหมายส่งคืน | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-n/review.md` |
| O | O.1–O.6 | S14 ปิดงาน | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-o/review.md` |
| P Q | P.1–Q.5 | S15 ส่งอนุมัติ · แจ้งเตือนประกัน | ✅ P ทดสอบแล้ว · Q บางส่วน (ไม่มีแผงกระดิ่ง) · `public/content/overhaul-scene-pq/review.md` |
| R | R.1–R.4.2 | S16 เจ้าของยานพาหนะตอบกลับนัด | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-r/review.md` |
| S | S.1–S.8 | S17 มุมมองหน่วยงานเจ้าของ (ดูอย่างเดียว) | 🟡 ทำแบบย่อ + ทดสอบแล้ว (ไม่มีมุมดูแผน/PO) · `public/content/overhaul-scene-s/review.md` |
| T | T.1–T.12 | S18 สรุปรายคัน + ส่งออก | ✅ ทดสอบเบราว์เซอร์แล้ว (ไม่สร้างไฟล์จริง) · `public/content/overhaul-scene-t/review.md` |
| U | U.1–U.13 | S20 ผู้บังคับบัญชาอนุมัติปิดงาน | ✅ ทดสอบเบราว์เซอร์แล้ว · `public/content/overhaul-scene-u/review.md` |

## สรุปท้ายคืน (agent รอบ 2)
- เสร็จและทดสอบเบราว์เซอร์: I · J K L · M · N · O · P · R · T · U · S (ย่อ)
- ยังไม่ทำ: Q แผงกระดิ่งแจ้งเตือน (Q.1–Q.4 · U.1 · U.12 · N2–N15) — มีแค่สถานะประกันบนหน้าสรุปรายคัน · S.1–S.3 มุมดูอย่างเดียวของหน้าแผน/PO · T.1.1/T.1.2 ทางเข้าสรุปรายคันจาก PO/Dashboard · T.9–T.12 ไฟล์ส่งออกจริง
- ไม่ได้รัน `npm run build` (กลัวชน `.next` ของ dev server ที่รันอยู่) — tsc · check · test ผ่าน
- ทดสอบซ้ำได้: scratchpad `i.js jkl.js mn.js o.js rs.js` (+ `lib.js`) · `h.js` เดิมอ่าน toast error ไม่เห็นเพราะ toast ไม่สำเร็จใช้ role=alert (ไม่ใช่บั๊ก)

## ตัดสินใจแทนไปก่อน (รอเจ้าของงานเคาะ)
- E F G: ดู D-E1…D-G2 ใน `public/content/overhaul-scene-efg/review.md`
- H: ดู D-H1…D-H6 ใน `public/content/overhaul-scene-h/review.md`
- I: D-I1…D-I9 ใน `public/content/overhaul-scene-i/review.md` (สำคัญ: ผู้ยืนยัน 2 ฝ่ายแทนการเซ็น · หน้าผู้ยืนยันประกอบเอง · ปฏิเสธแล้วต้องยืนยันใหม่ทั้งคู่)
- J K L: D-J1…D-J6 ใน `public/content/overhaul-scene-jkl/review.md` (สำคัญ: ซ่อมสำเร็จเปิดเมื่อถึง 100% ตามจอ ไม่ใช่ ≥1 รายการตาม AC)
- M: D-M1…D-M4 ใน `public/content/overhaul-scene-m/review.md`
- N: D-N1…D-N3 ใน `public/content/overhaul-scene-n/review.md` (สำคัญ: ตัดปุ่มข้ามขั้น 5 ตามการตีความ FigJam)
- O: D-O1…D-O9 ใน `public/content/overhaul-scene-o/review.md` (สำคัญ: เพิ่มสถานะ V10.2 V10.3 · ช่องราคาต่อหน่วยเพิ่มจากจอ)
- P Q: D-P1…D-P3 · D-Q1 D-Q2 ใน `public/content/overhaul-scene-pq/review.md` (สำคัญ: ผู้อนุมัติกำหนดโดยระบบ · ยังไม่มีแผงกระดิ่ง)
- T: D-T1…D-T5 ใน `public/content/overhaul-scene-t/review.md`
- R: D-R1…D-R6 ใน `public/content/overhaul-scene-r/review.md` (สำคัญ: แถบสลับมุมมองต้นแบบ)
- S: D-S1…D-S3 ใน `public/content/overhaul-scene-s/review.md` (ย่อ S.1–S.3 เป็นหน้าเดียว)
- U: D-U1…D-U5 ใน `public/content/overhaul-scene-u/review.md` (สำคัญ: ส่งกลับแก้ไข = กลับขั้น 6)

## บันทึกส่งต่อ
- ของกลางใหม่: `packages/ui/Alert.tsx` `Combobox.tsx` `DateField.tsx` · `OutlineBadge tone` · `ConfirmDialog hideCancel` · `domains/overhaul/features/shared/useLeaveGuard.tsx` (ทุกฟอร์มใช้ตัวนี้)
- โครงข้อมูล PO/งานรายคัน: `domains/overhaul/features/po/types.ts` (JOB_STATUS V1–V11 · JOB_STEPS 6 ขั้น) · mock `mock/pos.ts` `mock/garages.ts`
- เส้นทาง: `#/plan/<id>/po/new` · `#/plan/<id>/po/<po>` · `#/plan/<id>/po/<po>/edit?from=plan|po` · `#/job/<po>/<ทะเบียน>` (หน้างานรายคัน — ทำใน H–O)
- เครื่องมืออ่าน Figma: `node tools/figma-dump/outline.cjs "H\.[0-9.]+ "` (โครงจอ) · `node tools/figma-dump/spec.cjs <หน้า>.json "<ชุด>" "<variant>"` (สเปกไลบรารี)
- โน้ต FigJam ราย section: `design/figma-dump/overhaul-refinement-09/notes-by-section.txt` — Section 11 = H · 12 = I · 13 = J/K · 14 = M · 15 = N
- ทดสอบ: dev server ที่ 3020 (`npm run dev`) · playwright-core อยู่ที่ scratchpad ของ session ก่อน (NODE_PATH)
- หน้างานรายคัน: `domains/overhaul/features/job/JobPage.tsx` (renderStep() ต่อขั้นใหม่) · `StepAppointment.tsx` (ขั้น 1 และ 5) · `Row` ใช้แสดงข้อมูลแบบ Content item row
- ข้อมูลงาน `VehicleJob` (po/types.ts): ขั้น 2–7 ยังเป็น `unknown` — scene ที่ทำต้องกำหนด type จริงแทน
- จำลองการตอบกลับหน่วยงานใน JobPage.reply() (ต้นแบบ) — scene R (S16) ทำหน้าฝั่งหน่วยงานแล้วค่อยต่อกับข้อมูลเดียวกัน
- (scene I) ของกลางใหม่: `shared/PhotoUploader.tsx` (File upload Gallery · "จำนวน n ไฟล์" · 10 MB/ไฟล์ · ใช้ขั้น 2 และ 4) · `shared/time.ts` (nowStamp/todayThai/wait) ·
  `job/StepIntake.tsx` + `job/intake.ts` (ตรรกะส่ง/ตัดสินการยืนยัน) · `job/IntakeApproval.tsx` หน้าผู้ยืนยัน เส้นทาง `#/approve/<PO>/<ทะเบียน>/<รหัสพนักงาน>` ·
  type จริงใน po/types.ts: Photo Approval AuditEntry CheckItem Intake ProgressEntry Inspection PartUsed · mock `enrichJob()` ใน mock/pos.ts เติมข้อมูลขั้นที่ผ่านแล้ว (ต่อเติมเมื่อทำขั้นใหม่) ·
  ผู้ยืนยันฝั่งหน่วยงาน 3 คนใน mock/staff.ts (unit "หน่วยงาน") · ทดสอบ: scratchpad `lib.js` (ตัวช่วย) + `i.js`
- (scene J K L) `job/StepProgress.tsx` (ตาราง + modal เพิ่ม/แก้ + ลบ + ซ่อมสำเร็จ) · JobPage saveProgress/deleteProgress/finishRepair · mock progressLog 4 รายการใน enrichJob · ทดสอบ scratchpad `jkl.js`
- (scene M N) `job/StepInspection.tsx` (Uploader/FileRow ของแผน + PhotoUploader) · StepAppointment ตัดปุ่มข้ามเมื่อ kind=5 · mock inspection/appt5 ใน enrichJob · ทดสอบ scratchpad `mn.js`
- (scene O P T U) ของกลางใหม่ `packages/ui/Toggle.tsx` `packages/ui/RadioCard.tsx` · `job/close.ts` (ประกัน/ค่าใช้จ่าย/คืนอะไหล่) · `job/StepClose.tsx` (+ PartsTable CostTable StockTable) ·
  `job/CloseSummary.tsx` (สรุปใช้ร่วม P U) · `job/StepSendApproval.tsx` · `job/CloseApproval.tsx` (ApproverList CloseReview) · `job/SummaryPage.tsx` ·
  สถานะใหม่ V10.2 V10.3 ใน po/types.ts (V11 = ครบทุกขั้น current 8) · type CloseOut StockReturn PartUsed.price ·
  เส้นทาง `#/approver` `#/approver/<PO>/<ทะเบียน>` `#/summary/<PO>/<ทะเบียน>` · แถบ "ต้นแบบ: มุมมอง" บนทุกหน้า (page.tsx) · notify รับ description ได้ ·
  mock: CYCLE เพิ่ม V10 V10.3 (จำกัด V10.3 ไว้ 2 คัน) · close mock ใน enrichJob · ทดสอบ scratchpad `o.js`
- (scene R S) `job/AgencyPages.tsx` (AgencyList · AgencyReply · awaitingReply) · JobPage `viewOnly` · StepSendApproval `viewOnly` · page.tsx agencyAnswer() + เส้นทาง `#/agency` `#/agency/job/<PO>/<ทะเบียน>` · mock V2 มี appt1 · ทดสอบ scratchpad `rs.js`
- ข้อควรระวัง: `runSave(save, ok)` — ถ้า save พาไปหน้าอื่น ต้องให้ ok คืน true เมื่อสำเร็จ (ไม่งั้น modal ออกจากหน้าจะดักการเปลี่ยนหน้าเอง)
