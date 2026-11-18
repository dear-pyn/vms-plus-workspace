# ขั้น 02 · เซ็นรับทราบและล็อกทั้งฟอร์ม

สถานะ local prototype revision r1 · ruleVersion 1.0.0
หลักฐาน: ภาพกระดานและข้อความเจ้าของงาน 17 พ.ย. 2569; ตอบยืนยัน "ล็อกทั้งฟอร์มขั้น 02"

- เก็บข้อมูลที่กรอกทั้งชุดพร้อมคำขอส่งให้ผู้ลงนาม ไม่ใช่เก็บเฉพาะรายชื่อ
- ยังไม่มีการเซ็น: แก้ข้อมูลได้; Handover sign ที่ส่งแล้วมีสถานะรอเซ็นและปุ่มแก้ไข; แก้ข้อมูลแล้วส่งให้คนเดิมใหม่ได้
- มีผู้เซ็นรับทราบแล้ว: เลขไมล์ ชั่วโมง รูปภาพ รายการเอกสาร หมายเหตุ และรายชื่อผู้ลงนามอ่านอย่างเดียว/ปิดแก้ไขทั้งฟอร์ม; mock fill ใช้ไม่ได้
- เมื่อรับการเซ็นจากอีกแท็บ แสดง snapshot ที่ส่งจริงแทน draft ที่ยังไม่ได้ส่ง; รีเฟรชแล้วสถานะและข้อมูลยังอยู่
- คนที่ยังไม่ส่งคำขอสามารถส่งคำขอให้คนเดิมที่บันทึกไว้ได้จากข้อมูลที่ล็อกแล้ว เพื่อไม่ให้ flow ตัน แต่เปลี่ยนข้อมูลหรือเปลี่ยนคนไม่ได้
- ยังเซ็นไม่ครบ: บันทึกและถัดไปปิด; เซ็นครบสองฝ่ายแล้วปุ่มเปิดและไปขั้น 03 โดยคงข้อมูลที่เซ็น ไม่เขียน draft ทับ
- signIntake ไม่เพิ่ม audit ซ้ำเมื่อเซ็นแล้ว/ไม่มีคำขอ; update ข้ามแท็บใช้ poId+ทะเบียน แทน object identity

| จุด | UX/dev risk | วิธีจัดการ | สถานะ |
|---|---|---|---|
| ล็อกเฉพาะลายเซ็น | แก้เนื้อหาหลังรับทราบ | intakeLocked ใช้ลายเซ็นแรกล็อกทั้งขั้น | confirmed |
| คำขอไม่มีข้อมูลฟอร์ม | หน้าเซ็น/รีเฟรชเห็นข้อมูลว่าง | ส่ง IntakeDraft ไปเก็บใน job.intake พร้อมคำขอ | implemented |
| มี unsaved edits ขณะอีกคนเซ็น | แสดงข้อมูลที่ไม่ได้เซ็น | locked view อ่าน init จาก snapshot ล่าสุด | implemented |
| ล็อกแล้วคนที่สองยังไม่ได้ส่ง | ไปต่อไม่ได้ | ส่งเฉพาะคำขอให้ผู้ลงนามเดิมได้ โดยไม่เปลี่ยนเอกสาร | prototype behavior |
| บันทึกและถัดไปเขียนทับข้อมูลที่เซ็น | เอกสารเปลี่ยนหลังรับทราบ | ใช้ signed intake เดิมและเพิ่ม confirmedAt/log เท่านั้น | implemented |

ผลตรวจ: typecheck/check/test 7/7/production build ผ่าน; Chrome `tests/browser/intake-sign-lock.cjs` ผ่าน: pending แก้ได้, snapshot คงหลังรีเฟรช, เซ็นแท็บอื่นแล้วล็อกทั้งหมด, ไม่แสดง unsaved draft แทนเอกสารที่เซ็น, reload คงล็อก, ครบสองฝ่ายจึงไปขั้น 03, ไม่มี pageerror
การกัน concurrent edit/ลายเซ็นและสิทธิ์ในระบบจริงยังต้องตรวจฝั่ง server; งานนี้เป็น prototype local

ข้อความล่าสุดจากเจ้าของงาน: ปุ่มส่วนลงนามขั้น 02 เปลี่ยน "ส่งอนุมัติ" → "เซ็นลงนาม"; คงพฤติกรรมส่งแจ้งเตือน/รับทราบเดิม

## Validation ก่อนเซ็นลงนาม
คำสั่งเจ้าของงาน: ต้องกรอกข้อมูลด้านบนก่อนกดเซ็นลงนาม
- ตรวจเลขไมล์บังคับ/ไม่เกิน 7 หลัก, checklist มี/ไม่มีครบ 13 ข้อ, ผู้ส่งมอบและผู้รับมอบครบทั้งคู่
- ระบุว่ามีแบตเตอรี่ → ตรวจยี่ห้อและจำนวนเต็มตั้งแต่ 1 ลูก; ระบุว่าไม่มีไม่บังคับข้อมูลแบตเตอรี่
- ชั่วโมงการทำงานไม่บังคับ แต่ถ้ากรอกต้องจำนวนเต็มไม่เกิน 6 หลัก; รูปยังไม่บังคับตาม label เดิม
- ก่อนส่งคำขอแสดง error ใต้ช่อง/หัว checklist และ focus+เลื่อนไป error แรก; แก้ครบแล้ว error หาย; ระหว่างอัปโหลดรูป/ส่งอยู่ปิดปุ่มกันส่งซ้ำ
- ตรวจซ้ำใน sendSign ก่อนสร้าง intake/แจ้งเตือน จึงไม่มีคำขอเซ็นจากข้อมูลไม่ครบ
- ใช้ validator เดียวกันกับเงื่อนไขบันทึกและถัดไป; คงล็อกเอกสารหลังมีลายเซ็น

| ความเสี่ยง | วิธีจัดการ | สถานะ |
|---|---|---|
| ส่งเอกสารไม่ครบแล้วถูกล็อก | validate ก่อนทุกคำขอเซ็น | confirmed |
| ช่องผิดอยู่เหนือปุ่มจนมองไม่เห็น | focus+scroll error แรก | implementation |
| เผลอบังคับข้อมูลที่ระบุถ้ามี | รูปและชั่วโมงยัง optional | confirmed เดิม |

เมื่อกดแก้ไขผู้ลงนามที่ยังรอ: กลับเป็นช่องเปิด + ปุ่มเซ็นลงนาม enabled ทันทีแม้ยังเป็นคนเดิม; ไม่แสดง pill รอเซ็นในโหมดแก้ไข; กดส่งยังตรวจ validation เดิมและปิดระหว่างส่ง

### Revision: remove waiting pill and surface new signing notifications
User request: remove “รอเซ็นลงนาม”; new signing notifications must be visible.

| Behavior | Risk | Resolution | Status |
|---|---|---|---|
| Same-minute resend | Read/cleared IDs suppress a new request | Unique request ID and precise request timestamp; legacy snapshots retain fallback | implemented |
| Notification order | New requests appear below older jobs/warranty alerts | Sort by event time descending | implemented |
| Pending signature | Unwanted waiting pill | Remove from Step 02 and signer page; retain edit action and signed pill | confirmed request; implemented |

### Revision 18 November 2026: lock on submission
Confirmed by owner: after a valid signing request is saved, lock intake information, pre-Overhaul photos, document checklist and signer selection immediately. No edit action remains. Keep the other selected signer's request action available; acknowledgement still happens on the separate signing page. Validation failure does not lock the form. Both acknowledgements remain required to continue.

| Risk | Resolution | Status |
|---|---|---|
| Editing data after sending a signing request | Lock on persisted sentAt, use saved snapshot and preserve it when sending the remaining request | confirmed; implemented |
| Lock prevents remaining signer from proceeding | Keep the unsent selected signer's action enabled, lock both name selectors | implemented |

Owner clarification (18 November): the immediate lock applies to the three upper sections. The signer section retains its previous behavior: edit selected signers and resend while no acknowledgement exists; lock signer editing after an acknowledgement. Upper data remains the persisted snapshot during signer edits/resends.

Owner clarification (18 November, PO-700004): signer lock is per person. A signed person's selection cannot change. The other unsigned person can still be edited and resent even after the first acknowledgement. The three upper sections remain locked. Browser regression covers editing/resending the remaining signer after the first acknowledgement.
