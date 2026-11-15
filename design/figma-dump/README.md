# Figma dumps

## ชุดปัจจุบัน

อ่าน `current.json` ก่อน แล้วเปิด `index.json` ของชุด component เพื่อค้น page/component ที่ต้องใช้ ไม่อ่าน dump ทั้งหมดพร้อมกัน

- VMS Plus Component: `VmOC07pKEsDkHZagOgcSU2/import-2026-11-13/`
- Raw dump 54 JSON คัดลอกตรงจาก repo เดิม; ชื่อไฟล์เดิม ไม่รวม .DS_Store
- `source.json`: ต้นทาง รายการไฟล์ ขนาด และ SHA-256
- `index.json`: หน้าและชื่อ component ระดับบน สำหรับเลือกอ่านเฉพาะไฟล์
- วันในโฟลเดอร์คือวันนำเข้า ไม่ใช่วันที่ capture; capturedAt/dumpVersion ยังไม่ทราบ จึงใช้ null
- file key อ้างนโยบาย current-library.json; dump ไม่มี metadata ยืนยัน file identity เอง พบ key ของ Input label ที่กำหนด แต่ยังไม่ใช่การตรวจ live Figma หรือรับรองทุก component

## การเพิ่มชุดใหม่

ใช้ `tools/figma-dump/` (ดู README ในนั้น) — ผล dump ลงที่นี่ตรงพร้อม index/source ไม่ต้องคัดลอกจาก repo อื่น

เก็บตาม file key และวันนำเข้า ตรวจ JSON/hash แล้วเปลี่ยน current.json ให้ชี้ชุดที่เลือก ไม่คัดลอกซ้ำตาม JO/domain/case
เก็บ snapshot เดิมเฉพาะที่ต้องอ้างกับ revision ที่ยืนยันแล้ว ใช้ Git ช่วยเก็บประวัติ
ชื่อ component เหมือนกันไม่ถือว่าเป็นตัวเดียวกัน ต้องตรวจ published key, variant และ properties
## VMS Plus UI Kit

- ชุดปัจจุบัน: `fYD1yA1uzWsJSjHlcWKMNe/import-2026-11-13/` (ดู current.json → ui)
- Raw dump 38 JSON คัดลอกตรงจากต้นทางประมาณ 326 MB พร้อม source.json และ index.json
- ใช้อ้างโครงหน้าจอ/แพตเทิร์น UI ร่วมกับชุด Component; ไม่คัดลอกซ้ำตาม JO/domain
- อ่าน index.json ก่อน แล้วเปิดเฉพาะไฟล์หน้าที่เกี่ยวข้องเพื่อประหยัด token
- file key อ้าง current-library.json; ไม่มี metadata ยืนยันตัวตนไฟล์หรือวันที่ capture ใน dump และยังไม่ได้ตรวจ live Figma


## จอที่ทีมทำ (screens) — ไม่ใช่ไลบรารี

ดู `current.json → screens` · เป็นจอที่ทีมออกแบบเอง ใช้ตรวจหาจุดผิด **ไม่ใช่แหล่งความจริงของ component** (ยึด Component + UI Kit ด้านบน)

- `overhaul-refinement-09/import-2026-11-13/` — section "refinement sprint 09" หน้า Main · 1 JSON 6 MB · ~96k node · dump ด้วย figjam-dump-plugin (เฉพาะ section ที่เลือก)
- `index.json` = รายการ 576 ชิ้นระดับบนของ section (จอ OH2 / <state> · ป้ายหัวคอลัมน์ · section ย่อย) พร้อมขนาด จำนวนข้อความ จำนวนภาพ — เปิดอันนี้ก่อน แล้วค่อยเจาะ JSON ดิบเฉพาะจอที่ต้องใช้
- file key ยังไม่ทราบ (dump ไม่ฝังไว้) — รอลิงก์ไฟล์ Figma
