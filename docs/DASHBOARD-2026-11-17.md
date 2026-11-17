# Dashboard Overhaul — นำเข้าจาก Downloads และปรับ CI VMS Plus

สถานะ: prototype draft · revision r1 · ruleVersion 1.0.0
หลักฐานคำสั่ง: เจ้าของงาน 17 พ.ย. 2569 ให้ดู Dashboard ใน Downloads นำมาใส่ vms-plus และเปลี่ยน CI ให้เหมาะกับ VMS Plus
ต้นทาง: `/Users/preeyanuchanprasert/Downloads/Dashboard/dashboard-review/plan/Main.dc.html` และ `vehicles/Vehicles.dc.html` (ตรวจภาพ render แล้ว) ไม่แก้ต้นฉบับ

## ขอบเขต
- Dashboard แยกจากหน้าจัดการเดิม: `/prototypes/overhaul/#/dashboard` (ระดับแผน) และ `#/dashboard/vehicles` (ระดับยานพาหนะ)
- เปิดจากเมนูภาพรวม Dashboard หรือปุ่ม Dashboard หน้าจัดการ Overhaul
- คงโครงข้อมูลหลักของต้นทาง: ตัวกรองปี/หลายแผน, ตัวเลขภาพรวม, วงเงิน/ค่าใช้จ่าย/ส่วนต่าง, กราฟสถานะ, งานค้างตาม 7 ขั้น, เปรียบเทียบซื้อใหม่/Overhaul, ความคืบหน้าแผนและ PO, ตารางเปรียบเทียบแผน, ยี่ห้อ 4 อันดับ, ตารางยานพาหนะ/ค้นหา/แบ่งหน้า/แผงรายละเอียด
- ใช้ plans/pos/jobs/garages ชุดเดียวกับ prototype; ไม่คัดลอกตัวเลข hardcode ต้นทาง; ไม่นับแผนสารบัญเคส ORZ6999999 ในสถิติ
- หน้าอ้างอิง HTML เดิมยังอยู่; ไม่โหลด runtime React/support.js ของไฟล์ export เข้าหน้าใหม่

## CI และแหล่ง component
- ใช้ tokens ใน packages/design-tokens: สีหลัก brand-900 #A80689, พื้น brand-25/50, gray-50/200/600/900, success-600; light mode, IBM Plex Sans Thai จาก app เดิม
- packages/ui: PageHeader, Tabs, Button, SidePanel, CheckboxRow, SelectField, SearchInput, Table/CellStack, Pill, ProgressBar, Pagination, EmptyState, Material Symbols
- Figma Component VmOC07pKEsDkHZagOgcSU2 และ UI Release#2 fYD1yA1uzWsJSjHlcWKMNe: ใช้ shared components ที่มี mapping อยู่แล้ว; องค์ประกอบ Dashboard/การ์ด/กราฟอิง Downloads ตามคำสั่งนี้ ไม่อ้างว่าประกอบตรงจอ Figma ที่ยังไม่มี
- chart geometry ใช้ conic-gradient ที่อ้างสี token; layout ใช้ Tailwind; ไม่มี icon SVG/สีม่วง indigo/ฟอนต์ Noto จากต้นทาง

## กติกาข้อมูล
- เงินใช้ shared currency 2 ตำแหน่ง; เปอร์เซ็นต์ตัดทิ้ง 1 ตำแหน่งตามคำสั่งเดิม
- ค่าใช้จ่ายจริงนับเฉพาะ V11 ที่มี close และรวมอะไหล่ตัวรถ + เครื่องมือกล + ค่าแรง + ค่าใช้จ่ายอื่น
- งบต่อคัน = budget / จำนวนยานพาหนะในแผน ตามต้นทาง; งานที่ยังไม่มี actual ใช้งบต่อคันเมื่อเปรียบเทียบ
- ราคาซื้อใหม่ใช้ referencePrice; ไม่ใช้มูลค่าทรัพย์สินแทน; คันที่ราคาไม่ครบ/0 ไม่นับในอัตราส่วน และบอกจำนวนที่เปรียบเทียบได้
- ความคืบหน้าแผน = เฉลี่ย PO ตามกติกา VMS Plus เดิม (ต่างจากต้นทางที่เฉลี่ยรายคันโดยตรง); ภาพรวมเฉลี่ยแผนที่เลือก
- ค้นหากรองตารางยานพาหนะเท่านั้น; ปี/แผนกรองทุกกราฟและตัวเลขตามต้นทาง
- เกณฑ์เทียบค่า Overhaul >50% ยกมาจากต้นทางเป็นเกณฑ์ prototype ไม่ใช่ข้อสรุปซื้อใหม่หรือ business rule ที่อนุมัติ

| จุด | ความเสี่ยง UX/dev | วิธีจัดการ | สถานะ |
|---|---|---|---|
| export ใช้ React/runtime ต่างชุด | state ไม่เชื่อมกับ VMS Plus | เขียนเป็น feature Next.js ใช้ snapshot เดียว | implemented |
| ข้อมูลตัวอย่างทุกสถานะทำยอดเพี้ยน | นับ test cases เป็นงานจริง | ตัด CASE_PLAN_ID ออกจากสถิติ | prototype choice |
| ค่าใช้จ่ายงานยังไม่ปิด | เข้าใจ estimate เป็น actual | label ชัด + actual เฉพาะ V11 | ต้นทางอ้างอิง |
| ราคากลางไม่ครบ/0 | อัตราส่วนผิด/หารศูนย์ | แสดง — และนับ coverage | implemented |
| เกณฑ์ 50%/สูตรงบต่อคัน | ไม่ใช่นโยบายจัดซื้อที่เคาะแล้ว | ระบุเกณฑ์เปรียบเทียบและคง draft | pending ยืนยันก่อนใช้จริง |
| เมนู hash ใช้ Next Link | เปลี่ยน URL แต่ไม่เปลี่ยนหน้าจอ | ใช้ ChildLink hash handler เดิมกับเมนูระดับบนด้วย | implemented |

## ค่าเริ่มต้นและทางเข้า
- ระดับแผนเริ่มปีงบล่าสุดและแผนล่าสุดที่มี PO; ระดับยานพาหนะเริ่มทุกแผนในปีงบล่าสุด; เปลี่ยนแท็บคงตัวกรองที่เลือก
- มี case draft `overhaul-dashboard-vms` ใน content/catalog.json เปิดผ่าน `/prototypes/overhaul-dashboard/` แล้วเข้าสู่ hash route เดิม จึงใช้ snapshot เดียวกัน
- เพิ่ม Dashboard 2 ระดับในสารบัญเคส รวมเป็น 27 เคส; หน้าอ้างอิง Downloads เดิมยังแยกเป็น reference

## ผลตรวจ 17 พ.ย. 2569
- npm run typecheck / check (8 catalog cases) / test (7/7) / production build ผ่าน
- Chrome `tests/browser/dashboard.cjs`: เมนูเปิดหน้าจอจริง, สลับ 2 ระดับ, ล้างแผนจนว่าง/คืนทุกแผน, ค้นหาไม่พบ, อัปเดตความคืบหน้าจากแท็บหน้างานแล้ว dashboard เปลี่ยนโดยไม่รีเฟรช, แผงรายละเอียดเปิดหน้างานจริง, mobile 390 ไม่มี horizontal overflow, ฟอนต์ IBM Plex Sans Thai, ไม่มี pageerror
- ตรวจภาพ desktop และ mobile จาก build แล้ว; สีแบรนด์/หน้าโครง VMS Plus ใช้ shared tokens
- Browser cases-smoke ตรวจสารบัญรวม Dashboard ใหม่ ไม่มี pageerror

## UX revision r2 — ลดความแน่นและปรับการเลือก (17 พ.ย. 2569)
คำสั่งเจ้าของงาน: เลือกหลายแผนแล้วลายตา และรูปแบบการเลือกแปลก ให้ปรับ UX/UI
- ใช้ PlanScopePicker: เลือกปี + ทุกแผน/เลือกเองในแผงเดียว เป็น draft จนกดแสดงผล; ยกเลิกไม่เปลี่ยนข้อมูลหน้าหลัก
- ค่าเริ่มต้นทั้งสองแท็บเป็นทุกแผนในปีงบล่าสุดตรงกัน; แยกปุ่มเลือกขอบเขตจากการสลับมุมมอง
- โหมดเลือกเองเริ่มว่าง ไม่แอบเลือกทุกแผน; ค้นหาเลข/ชื่อแผน, เลือกเฉพาะผลที่แสดง, ล้างการเลือกชัดเจน; footer บอกจำนวนตลอด; ไม่ให้ใช้ขอบเขตว่าง
- หน้าหลักสรุปขอบเขตสั้น ๆ ไม่วางรายชื่อทุกแผน/ชิปยาว; แสดงเพียง 4 metric หลัก สีม่วงอ่อน; มือถือ 2×2
- สรุปรายแผนเป็นตารางแบ่งหน้า 10 รายการ/ค้นหา; กาง PO เฉพาะแผนที่สนใจทีละแผน แทนการแสดงทุกแผนและทุก PO พร้อมกัน
- งบประมาณและความคุ้มค่าอยู่ใน disclosure ปิดเริ่มต้น; ตารางเงินมี pagination เช่นกัน ไม่ลบข้อมูลเดิม
- ตารางยานพาหนะเหลือข้อมูลระบุตัวตน แผน/PO สถานะ ความคืบหน้า และปุ่มรายละเอียด; ตัวเลขเงินอยู่ในรายละเอียดรายคันและส่วนงบประมาณ
- ยังคง shared VMS Plus Radio text card / Checkbox with description / Side panel / Table / Pagination / Search input; ไม่เปลี่ยนสูตรคำนวณ

| จุด | ความเสี่ยง UX/dev | วิธีจัดการ | สถานะ |
|---|---|---|---|
| เปลี่ยนปีแล้วขอบเขตหน้าหลักเปลี่ยนทันที | เลือกผิดโดยไม่รู้ | staged year+plan scope ใช้พร้อมกันเมื่อกดแสดงผล | r2 implementation |
| ค้นหาแล้วค่าที่เลือกหาย | สูญเสีย selection (EC-20) | เก็บ IDs ข้ามคำค้น; footer นับทั้งหมด | r2 implementation |
| เลือกทั้งหมด/ล้างใช้ปุ่มสลับความหมาย | ไม่แน่ใจว่ากดแล้วได้กี่แผน | explicit radio all/custom และเลือกเฉพาะผลค้นหาพร้อมจำนวน | r2 implementation |
| เลือก 96 แผนแล้วหน้ายาวมาก | เปรียบเทียบไม่ได้/ลายตา | สรุป 10 แถว, กาง PO ทีละแผน, finance progressive disclosure | confirmed ปัญหา · r2 implementation |
| ซ่อนรายละเอียดแล้วนึกว่าข้อมูลหาย | หาเงิน/PO ไม่เจอ | หัวข้อรายละเอียดชัดและปุ่มดู PO ต่อแถว; เก็บข้อมูลและสูตรเดิม | r2 draft review |

ผลตรวจ r2: typecheck/check/test 7/7/build ผ่าน; Chrome dashboard-selection ผ่าน — เลือกปีแบบ draft, สลับ all/custom แล้วค่าที่เลือกยังอยู่, ค้นหาข้ามผลลัพธ์ไม่ล้าง selection, ยกเลิกไม่เปลี่ยนหน้าหลัก, ว่างกดแสดงผลไม่ได้, 96 แผนแสดงสรุปเพียง 10 แถว, กาง PO ทีละแผน, finance ปิดเริ่มต้น, มือถือไม่มี overflow; dashboard regression เดิมผ่านทั้ง live sync/รายละเอียด/เปิดหน้างานจริง; ตรวจภาพ desktop/mobile แล้ว

## r3 — ข้อมูลและวิธีเลือกตามต้นแบบ Downloads + เมนูใต้จัดการยานพาหนะขนาดใหญ่ (17 พ.ย. 2569)
คำสั่งเจ้าของงาน: "เอาเมนูไปไว้ใต้ จัดการรถใหญ่ · ไปดูที่ download/dashboard แล้วเอาข้อมูล วิธีเลือกมาก่อน · จากนั้นปรับ CI UX/UI ให้ตรงกับ VMS Plus" · เลือกแบบ "ข้อมูลต้นแบบ + วิธีเลือกต้นแบบ" (แทน r2)
- เมนู: `จัดการยานพาหนะขนาดใหญ่ › Dashboard Overhaul` (src/lib/nav.ts) · เมนูภาพรวม Dashboard ระดับบนกลับเป็นไม่มีลิงก์
- ข้อมูล: `domains/overhaul/mock/dashboard.ts` ยกจากต้นแบบตรงตัว (6 แผน · 22 คัน · แบ่ง PO · อู่ · อะไหล่) — ไม่เชื่อม plans/pos/jobs ของ prototype แล้ว
- วิธีเลือก: ระดับแผน = ปี + หลายแผน (ชิปในช่อง + รายการติ๊ก) เริ่มที่แผนล่าสุด · ระดับยานพาหนะ = ปี + แผนเดียว/ทุกแผน + ค้นหา — เลิกใช้ PlanScopePicker/PlanSummary ของ r2 (ลบไฟล์)
- สูตร: `features/dashboard/model.ts` ตามต้นแบบ (ความคืบหน้าเฉลี่ยรายคันปัดลง ต่างจาก r1/r2 ที่เฉลี่ย PO)
- CI: การ์ดตัวเลขกรอบขาว + ไอคอนตามสถานะ แทนการ์ดไล่เฉด · โดนัท/แท่งใช้ token success-600 · brand-900 · gray-300 · เงินผ่าน currency()
- ตรวจ: typecheck · check · test 7/7 · `tests/browser/dashboard.cjs` (เมนู · ค่าเริ่มต้น 66% · เลือก 3 แผน = 1,596,500.00 · ตารางเปรียบเทียบ · ค้นหา ISUZU 5 คัน · แผงรายละเอียด · ทุกปี 22 คัน · ไม่ล้นจอ 1440/390 · ไม่มี pageerror)
- ข้อจำกัด: ตารางยานพาหนะ 11 คอลัมน์ เลื่อนแนวนอนในการ์ดที่ 1440 (มีเมนูข้าง) · multi-select ไม่มีในไลบรารี รอทีมออกแบบ
