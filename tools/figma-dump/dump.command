#!/bin/zsh
# ดับเบิลคลิก → เปิดตัวรับ dump ค้างไว้ แล้วไปรันปลั๊กอินใน Figma
cd "$(dirname "$0")/../.."   # รากโปรเจกต์ (ไฟล์นี้อยู่ tools/figma-dump/)
node tools/figma-dump/receive.mjs
