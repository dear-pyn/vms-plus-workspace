#!/bin/zsh
# ดับเบิลคลิกเพื่อแคปหน้าจอตาม flow — เว็บ PEA ต้องต่อ VPN ก่อน
cd "$(dirname "$0")/../.."   # รากโปรเจกต์ (ไฟล์นี้อยู่ tools/capture/)

echo "เลือกเว็บที่จะเปิด แล้วกด Enter"
echo "  1 = VMS เว็บเก่า   https://vmsplus-dev.pea.co.th/"
echo "  2 = UAT ใหม่       https://vms-plus-uat.odds.team/maintain-d/"
echo "  หรือวางลิงก์หน้าที่ต้องการได้เลย (เริ่มที่หน้านั้นทันที)"
read "web?เว็บ [1]: "
case "$web" in
  ""|1) url="https://vmsplus-dev.pea.co.th/" ;;
  2)    url="https://vms-plus-uat.odds.team/maintain-d/" ;;
  http*) url="$web" ;;
  *)    url="https://$web" ;;
esac

echo ""
echo "ตั้งชื่อชุดภาพ (เช่น นัดหมาย) — ไม่ใส่ก็ได้ จะใช้วันเวลาแทน"
read "name?ชื่อ: "

npm run -s capture -- ${name:+"$name"} "$url"
echo ""
open "tools/capture/captures"
read "?กด Enter เพื่อปิดหน้าต่างนี้"
