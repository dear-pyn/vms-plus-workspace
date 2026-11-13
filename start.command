#!/bin/zsh
set -e
cd "$(dirname "$0")"
if [[ ! -d node_modules ]]; then
  npm ci
fi
if [[ ! -f out/index.html ]]; then
  npm run build
fi
printf '\nVMS+ Workspace: http://localhost:3020/\nเปิดลิงก์นี้ใน browser และเปิด Terminal นี้ค้างไว้ ใช้ Ctrl+C เพื่อหยุด\n\n'
npm run preview
