# repair

เก็บกติกาเฉพาะ domain ที่นี่ อย่ารวม business rule ของ domain อื่น

หน้าจอและ feature ที่จะใช้จริงให้เพิ่มใน domains/repair/features/ โดยรับข้อมูลและ callbacks จากภายนอก

กติกาใหม่ต้องมี id, description, status และ source; confirmed ต้องมีหลักฐาน ผู้อนุมัติ และตัวตรวจ
กติกากลางใช้จาก packages/rules ห้ามประกาศ id เดิมเพื่อทับกติกากลางเงียบๆ
เคสรีวิวอยู่ใน content/catalog.json; JO เชื่อมผ่าน joIds ไม่ต้องทำโฟลเดอร์ซ้ำตาม JO
