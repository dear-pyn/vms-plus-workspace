# VMS+ Workspace

พื้นที่ทำงาน Next.js สำหรับหลาย JO / domain / เคสรีวิว ตั้งแต่ requirement, Business Flow, prototype, Figma export และ AC บน FigJam

## เริ่มใช้งาน

```sh
npm install
npm run dev
```

บน Mac ดับเบิลคลิก `start.command` เพื่อเปิดเว็บจาก build ที่มีอยู่ แล้วเปิดลิงก์ที่แสดงใน Terminal; ถ้าแก้ code ให้ใช้ npm run dev หรือ build ใหม่ก่อน preview

เปิด http://localhost:3020/ — ทางเข้าเดียว เลือก domain, JO, สถานะ หรือค้นหาชื่อเคส

## โครงสร้าง

- `domains/<domain>/`: กติกาเฉพาะเรื่องและที่เก็บ feature แยกจากกติกากลาง (domainRuleVersion ต้องตรงกับเคส)
- `content/catalog.json`: รายการ domain, JO และเคส เป็นแหล่งเดียวที่สร้างหน้ารวมและหน้ารายละเอียด
- `public/content/<case>/`: Requirement, Business Flow และ AC พร้อมหลักฐาน
- `public/prototypes/<case>/<revision>/`: HTML อ้างอิงที่แยก revision
- `src/app/`: Next.js workspace และหน้ารายเคส
- `packages/ui/`: component เว็บที่คัดเลือกจาก overhaul-next; ยังไม่รับรองความตรงกับ dump ใหม่
- `packages/design-tokens/`: tokens ต้นทางเดียว; theme ของแอปนำเข้าจากที่นี่
- `packages/rules/`: กติกาที่ใช้ร่วมกัน เช่น MONEY-001
- `design/`: library policy, mapping, จุดรับ dump และ reference เก่า (ไม่ใช่กติกาเฉพาะทุก domain ที่บังคับใช้ทันที)
- `tools/figma-plugin/`: ปลั๊กอินตั้งต้นสร้างหน้าจอจาก screen spec ด้วย published component keys
- `tools/figjam-plugin/`: วาง AC จาก JSON เป็นข้อความที่แก้ไขได้บน FigJam
- `tools/examples/`: ตัวอย่างข้อมูลป้อนปลั๊กอิน แยกจากเคสที่ลูกค้าอนุมัติ

## JO / Domain / Case

JO = ขอบเขตส่งมอบ; domain = งานธุรกิจ; case = เคสรีวิวที่มี revision
หนึ่ง domain เชื่อมได้หลาย JO ผ่าน case.joIds ไม่สร้าง component ซ้ำตาม JO
ตอนนี้ยังไม่ทราบเลข JO จริง จึงเว้นว่างไว้ ไม่เดา mapping

## เพิ่มเคส

1. เพิ่ม JO ที่ยืนยันแล้วใน `jos`; เพิ่มเคสใน catalog ด้วย ID ไม่ซ้ำและ domain ที่มีจริง
2. คัดลอกแม่แบบ `public/content/repair-baseline/` เป็นเคสใหม่ แก้ caseId/revision/ruleVersion ใน AC
3. ระบุ requirement, flow, scenario, screenId, state และหลักฐาน
4. ทำ prototype โดยใช้ packages/ui; แยก mock data และ API adapter จาก feature
5. เพิ่ม artifact paths ใน catalog (null = ยังไม่จัดทำ จะแสดงเป็นข้อความแทนลิงก์เสีย)
6. รัน check และ tests; ก่อนเปลี่ยนเป็น review ต้องมี prototype, requirement, flow, AC, JO และ approval {by,at,evidence}
7. เมื่อมีฉบับแก้หลังรีวิว ให้สร้าง case ID/revision ใหม่ เก็บ URL ฉบับเก่า แล้ว archive เคสเก่า

## Figma และ FigJam

```sh
npm run plugins:build
```

ครั้งแรกให้ใช้ Figma → Plugins → Development → New plugin เพื่อรับ ID ของปลั๊กอินใหม่แต่ละตัว แล้วใส่ id ลงใน manifest.json ของโฟลเดอร์ที่ตรงกันก่อน (ไม่ใช้ ID ของปลั๊กอินเดิม) อ้างอิง https://developers.figma.com/docs/plugins/manifest/

จากนั้น Import development plugin จาก manifest.json ของ tools/figma-plugin หรือ tools/figjam-plugin แล้ววาง JSON จาก tools/examples/
Figma screen export นำเข้า component ด้วย key เท่านั้น ขาด component จะหยุด ไม่วาดตัวหน้าตาคล้ายขึ้นแทน
ปลั๊กอินนี้เป็น engine ตั้งต้น ยังไม่ได้ย้ายหน้าจอของ Overhaul/Maintenance/Repair เดิมทั้งหมด และยังไม่ได้รันใน Figma จริง
FigJam รับ AC ที่คน/agent วิเคราะห์จากภาพหรือ dump แล้ว ไม่ได้อนุมาน business rule อัตโนมัติจากรูป
ทุก AC ต้องมี source, screenId และ status; แนบภาพอ้างอิงบน FigJam คู่กับการ์ดได้ด้วยมือ

## กติกาไม่หายเมื่อ export

แก้ policy + shared implementation + regression test ด้วยกัน เพิ่ม version และตรวจเคสที่ได้รับผลกระทบก่อนอัปเดต ruleVersion
MONEY-001 ใช้ formatter เดียวกันในเว็บและ code ของ Figma plugin ที่ build มา ตรวจ zero/missing/invalid ด้วย tests
เก็บกติกาแต่ละเวอร์ชันใน packages/rules/versions และ domains/<domain>/versions เพื่อให้ archived case อ้างอิงฉบับเดิมได้ ส่วนเคสที่กำลังทำต้องใช้เวอร์ชันปัจจุบัน
ตัวตรวจจะหยุดหาก code.js ของปลั๊กอินไม่ตรงกับ source / mapping / shared formatter ปัจจุบัน ต้อง build ใหม่ก่อนส่งงาน

ไม่ได้รับประกันว่าจะเปลี่ยนข้อความใน HTML เก่าหรือเฟรม Figma ที่ทีมแก้มือแล้ว ต้องตรวจงานเก่าแยกก่อนรับรอง

## ตรวจและ build

```sh
npm run plugins:build
npm test
npm run check
npm run typecheck
npm run build
```

`out/` คือ static output สำหรับโฮสต์ ตั้ง NEXT_PUBLIC_BASE_PATH=/vms-plus-workspace เมื่อ build ไป GitHub Pages แบบ project site
ไม่รวม node_modules/.next/out ใน source repository

## ส่ง code ไป repo Next.js จริง

นำ packages/ui, packages/design-tokens, packages/rules และ feature ที่ผ่านการทดสอบไปใช้ พร้อม theme และฟอนต์ใน src/app/globals.css / layout.tsx
แยก props/callbacks ของหน้าจอจาก mock services ก่อนเปลี่ยนเป็น API จริง ตรวจ auth/permissions และ validation ฝั่ง server ใน repo ปลายทาง

## สิ่งที่ย้ายมาแล้ว / ยังไม่ย้าย

มีทางเข้ารวม, filter, deep links, แม่แบบ 3 domain, Dashboard reference 2 หน้า, UI พื้นฐาน, currency policy และ plugin engines
ยังไม่ย้าย flow/หน้าจอ/ปลั๊กอินเฉพาะงานเดิมทั้งหมด ยังไม่ผูก JO จริง และยังไม่รับรอง component fidelity จนกว่าจะเทียบ dump ล่าสุด
โฟลเดอร์ต้นฉบับ Maintenance-Request-Form ไม่ถูกแก้ ไม่มีการสร้าง GitHub repo หรือเผยแพร่เว็บในขั้นนี้
