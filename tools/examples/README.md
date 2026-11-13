# ตัวอย่างปลั๊กอิน

screen-spec.json เป็นตัวอย่างเชิงเทคนิคของการใช้ instance กับ shared currency ไม่ใช่หน้าจอลูกค้า
ต้องเปิดดูชื่อ text layer จริงใน Input label จาก dump ใหม่ แล้วแก้ nodeName ของตัวอย่างให้ตรงก่อนรัน ปลั๊กอินจงใจหยุดเมื่อชื่อไม่ตรง
engine ปัจจุบันรองรับ component เดี่ยว, setProperties และ text overrides แบบชื่อ unique; ยังไม่รองรับการเลือก variant จาก component set หรือการประกอบ layout ซ้อนอัตโนมัติ
เพิ่ม published variant key ใน mapping ก่อนใช้ component อื่น ห้ามเดา key

AC ตัวอย่าง: ใช้ public/content/overhaul-dashboard-reference/ac.json โดยวาง JSON ลงใน FigJam plugin
AC นี้เป็น observed เท่านั้น ไม่ใช่ behavior ที่ลูกค้าอนุมัติแล้ว
