// สร้าง tools/capture/captures/INDEX.md — สารบัญว่าหน้าจอไหน (เว็บ + path) มีภาพอยู่ชุดไหน ไฟล์อะไร
// ให้ agent หาภาพของหน้าที่จะทำได้จากไฟล์เดียว ไม่ต้องเปิดทุกภาพ (ประหยัด token)
//   npm run capture:index    (capture.mjs เรียกให้เองทุกครั้งที่จบรอบ)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'captures');

// path ที่มีรหัสเฉพาะรายการ (uuid · เลขเอกสาร · ตัวเลข) ยุบเป็น :id ให้หน้าเดียวกันอยู่แถวเดียว
const norm = (p) => p.split('/').map((s) =>
  /^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(s) || /^[A-Z]{2,4}\d{4,}$/.test(s) || /^\d+$/.test(s) || /^[0-9a-f]{16,}$/i.test(s) ? ':id' : s).join('/');

export function buildIndex() {
  if (!fs.existsSync(DIR)) return null;
  const pages = new Map();   // key = host+path → { sets: Map(set → files[]) }
  const sets = [];
  for (const set of fs.readdirSync(DIR).sort()) {
    const f = path.join(DIR, set, 'steps.md');
    if (!fs.existsSync(f)) continue;
    const rows = fs.readFileSync(f, 'utf8').split('\n').filter((l) => /^\| \d+ \|/.test(l))
      .map((l) => l.split(/(?<!\\)\|/).map((c) => c.trim()));
    sets.push({ set, n: rows.length, start: (fs.readFileSync(f, 'utf8').match(/· (https?:\/\/\S+)/) || [])[1] || '' });
    for (const [, , , url, file] of rows) {
      let key;
      try { const u = new URL(url); key = u.host + norm(decodeURI(u.pathname)); } catch { continue; }
      if (/(^|\.)sso\d*\.|login|signin|auth|callback/i.test(key)) continue;   // หน้าล็อกอิน/ส่งต่อ SSO ไม่ใช่หน้าจอของระบบ
      if (!pages.has(key)) pages.set(key, new Map());
      const m = pages.get(key);
      if (!m.has(set)) m.set(set, []);
      m.get(set).push(file);
    }
  }
  const out = [
    '# สารบัญภาพหน้าจอ (สร้างอัตโนมัติ — อย่าแก้มือ)',
    '',
    'ภาพจากเว็บจริง = **หลักฐานสิ่งที่เห็น (observed) ไม่ใช่ requirement ที่ยืนยันแล้ว** · มีข้อมูลบุคคลจริง ห้ามคัดลอกชื่อ/รหัสพนักงานลงไฟล์ในรีโป mock หรือ Figma',
    '',
    '## ชุดภาพ',
    '',
    '| ชุด | ภาพ | เริ่มที่ |',
    '|---|---|---|',
    ...sets.map((s) => `| ${s.set} | ${s.n} | ${s.start} |`),
    '',
    '## หน้าจอ → ภาพ (ดูภาพแรกของแต่ละชุดก่อน เปิดเพิ่มเฉพาะที่ต้องใช้)',
    '',
    '| เว็บ + หน้า | ชุด: ไฟล์ |',
    '|---|---|',
    ...[...pages.keys()].sort().map((k) => `| ${k} | ${[...pages.get(k)].map(([s, fs_]) =>
      `${s}: ${fs_.slice(0, 3).join(', ')}${fs_.length > 3 ? ` (+${fs_.length - 3})` : ''}`).join('<br>')} |`),
    '',
  ];
  fs.writeFileSync(path.join(DIR, 'INDEX.md'), out.join('\n'));
  return { sets: sets.length, pages: pages.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = buildIndex();
  console.log(r ? `INDEX.md — ${r.sets} ชุด · ${r.pages} หน้าจอ` : 'ยังไม่มีภาพ');
}
