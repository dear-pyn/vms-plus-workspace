# แบบฟอร์มคำถามระบบ Overhaul (ไม่ต้องล็อกอิน)

- หน้าเว็บ: `public/overhaul-q/` → https://dear-pyn.github.io/vms-plus-workspace/overhaul-q/
- คำถาม: `public/overhaul-q/qdata.js` (เลขข้อตรงกับ `domains/overhaul/line-questions-map.md`)
- คำตอบเก็บใน Supabase project `weekly-recap` ตาราง `oh_answers` (`schema.sql` ในโฟลเดอร์นี้) · คนทั่วไปส่งได้อย่างเดียว อ่านไม่ได้
- ดูคำตอบ: Supabase → Table Editor → `oh_answers` หรือ `npx supabase db query --remote=raetgyyymogvslducacr "select name, team, summary, created_at from oh_answers order by created_at"`
