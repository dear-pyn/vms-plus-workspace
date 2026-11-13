# สถานะการตั้งต้น VMS+ Workspace

## ทำงานได้แล้ว
- Next.js static workspace: หน้าแรกเดียว, domain/status/JO/search filters, case deep links
- 3 domain templates และ Dashboard HTML reference (ระดับแผน / รถ)
- อ่าน AC พร้อม source/status ในหน้ารายเคส
- แยก reusable web UI, tokens, global rules, domain rules และ mock/reference artifacts
- shared currency ที่ไม่พึ่ง Intl; generated Figma code ใช้ implementation เดียวกัน
- ตรวจ stale generated plugin, artifact links, case/AC revisions, rule versions และ approval ของ review cases
- รักษา policy snapshots สำหรับ archived cases
- engine ตั้งต้นของ Figma และ FigJam plugins พร้อมตัวอย่าง
- Git repository ในเครื่อง; ยังไม่มี remote/commit และยังไม่ publish

## ตรวจแล้ว
- npm test: 5 tests ผ่าน (รวม currency, actual text assignment ของ Figma instance จำลอง, key mismatch และ AC evidence)
- TypeScript และ Next.js production static build ผ่าน
- Chrome: hydration, domain filter, review empty state, case deep link, mobile horizontal overflow และ runtime exceptions ผ่าน
- localhost HTTP: หน้าแรก, guide, รายเคส และ Dashboard ทั้งสองหน้า 200
- ตรวจ local href/src ของ HTML ที่นำเข้า ครบ
- start.command ผ่าน zsh syntax check

## ยังต้องทำต่อก่อนใช้กับงานลูกค้าจริง
- ยืนยันรายการ JO และ mapping กับ domain
- เติม requirement/flow/scenario/state และ AC ของงานจริง ไม่อนุมานจากแม่แบบ
- ย้ายหน้าจอและ business behavior ของ repo เดิมเป็นรายเคส ยังไม่ได้ย้ายทั้งหมด
- อ่าน dump ชุดใหม่และยืนยัน tokens, variant keys, component properties และ layer names
- ขยาย mapping/export layout ให้ครบ component ที่แต่ละเคสใช้ (engine ปัจจุบันเป็นตัวตั้งต้น ไม่ใช่ exporter ครบทุกหน้าจอเดิม)
- ตั้ง plugin IDs จาก Figma และรัน export ใน Figma/FigJam จริง; browser/VM tests ไม่ทดแทน Figma auto-layout/font verification
- นำ feature ไปต่อ API/auth/permissions ใน repo Next.js ปลายทาง

## เปิดดู
บน Mac ดับเบิลคลิก start.command แล้วเปิด http://localhost:3020/ และเปิด Terminal ค้างไว้
แก้ code ใช้ npm run dev; หลัง build ใหม่ npm run preview จะเสิร์ฟ out/
