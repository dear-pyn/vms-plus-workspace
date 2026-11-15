# Dump จาก Figma → design/figma-dump/ โดยตรง

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `dump.command` | ดับเบิลคลิก = เปิดตัวรับไฟล์ค้างไว้ (พอร์ต 8124) · หรือ `npm run dump` |
| `figma/manifest.json` | ปลั๊กอิน dump **ทั้งหน้า** (ติ๊กเลือกหน้า) — ใช้กับไลบรารี Component / UI Kit |
| `figjam/manifest.json` | ปลั๊กอิน dump **เฉพาะ section/frame ที่เลือก** — ใช้ได้ทั้ง Figma และ FigJam (เช่นจอ refinement) |
| `receive.mjs` | ตัวรับไฟล์ เขียนลง `design/figma-dump/<ชื่อ>/import-<วันที่>/` + สร้าง `index.json` `source.json` ให้เอง |

ครั้งแรก: Figma → Plugins → Development → Import plugin from manifest → เลือก manifest ทั้งสองตัวในโฟลเดอร์นี้

ทุกครั้ง: ดับเบิลคลิก `dump.command` → รันปลั๊กอิน → ตั้งชื่อชุด → เริ่ม dump → ปิดหน้าต่างเมื่อเสร็จ

- ชื่อชุดเดิม + วันเดียวกัน = เขียนทับไฟล์ node เดิม · คนละวัน = โฟลเดอร์ import ใหม่ (ของเก่าอยู่ครบ)
- ไม่แก้ `current.json` ให้อัตโนมัติ — จะใช้ชุดใหม่เป็นแหล่งอ้างอิงหลักต้องแก้เองและเติม fileKey ใน source.json
- ใช้พอร์ตเดียวกับ `serve.js` ของ repo Maintenance-Request-Form — เปิดพร้อมกันไม่ได้

## แปลง dump เป็น HTML ตรงตัว (render.mjs)

```sh
npm run render -- figma-overhaul-refinement-09 "^OH2 / (C|D)\."
```

ได้ `public/figma-render/<ชุด>/` + `index.html` สารบัญ — เปิดผ่าน `npm run dev` ที่ `/figma-render/<ชุด>/`
ไม่ตีความ: auto layout → flex ด้วยค่าจาก dump ทุกตัว · ไอคอน → Material Symbols Rounded · hidden layer ข้าม
ข้อจำกัด: ชิ้นนอก auto layout ไม่มี x/y ใน dump → วางมุมซ้ายบน (ติ๊ก "แสดงชิ้นที่ไม่รู้ตำแหน่ง" เพื่อเห็นกรอบส้ม)
ถ้าจอที่แปลงดูแปลก ให้เช็ค dump ก่อน — อาจเป็นปัญหาในไฟล์ Figma เอง (เช่นคอลัมน์ FILL เหลือ 16px)
