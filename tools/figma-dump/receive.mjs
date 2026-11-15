// ตัวรับผล dump จากปลั๊กอิน Figma/FigJam → เขียนตรงลง design/figma-dump/<ชื่อ>/import-<วันที่>/
// พร้อมสร้าง index.json (สารบัญ) + source.json (ที่มา · ขนาด · sha256) ให้อัตโนมัติ
//
//   ดับเบิลคลิก tools/figma-dump/dump.command   หรือ   npm run dump
//
// ปลั๊กอิน: tools/figma-dump/figma (ทั้งหน้า) · tools/figma-dump/figjam (เฉพาะ section ที่เลือก)
// ฟังเฉพาะ loopback พอร์ต 8124 (ค่าที่ manifest อนุญาต) · เขียนได้เฉพาะ .json ใต้ design/figma-dump/ เท่านั้น
// ชุดใหม่ไม่ถูกตั้งเป็น current.json อัตโนมัติ — การเปลี่ยนชุดอ้างอิงหลักต้องตัดสินใจเอง

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DUMP = path.join(ROOT, 'design', 'figma-dump');
const PORT = Number(process.env.PORT) || 8124;
const today = new Date().toLocaleDateString('sv-SE');   // YYYY-MM-DD เวลาเครื่อง
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' };
const safe = (s) => { try { s = decodeURIComponent(s); } catch { return ''; }
  return s.replace(/[\\/:*?"<>|\0]/g, '-').replace(/\.{2,}/g, '').replace(/^[.\-\s]+/, '').trim(); };

const pending = new Map();   // dir → timer — สร้าง index ใหม่หลังรับไฟล์สุดท้าย 3 วินาที

function summarize(file, d) {
  if (d.root) {   // ปลั๊กอิน figjam: section/frame เดียว → ไล่ชิ้นระดับบน
    const walk = (n, a) => { if (n.text) a.texts++; if (n.hasImage) a.images++; (n.kids || []).forEach((k) => walk(k, a)); return a; };
    return { file, kind: 'section', page: d.page, section: d.section, nodeId: d.node,
      frames: (d.root.kids || []).map((k) => ({ name: k.name, type: k.type, w: k.w, h: k.h, children: (k.kids || []).length, ...walk(k, { texts: 0, images: 0 }) })) };
  }
  return { file, kind: 'page', page: d.page, nodeId: d.node,   // ปลั๊กอิน figma: ทั้งหน้า → component/frame ระดับบน
    components: (d.sets || []).map((s) => ({ name: s.name, type: s.type, key: s.key || (s.component && s.component.key) || null })) };
}

function buildIndex(dir, name) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !['index.json', 'source.json'].includes(f)).sort();
  const items = [], meta = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f));
    meta.push({ path: f, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
    try { items.push(summarize(f, JSON.parse(buf))); } catch (e) { items.push({ file: f, error: 'JSON เสีย: ' + e.message }); }
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ name, items }, null, 2));
  fs.writeFileSync(path.join(dir, 'source.json'), JSON.stringify({
    name, fileKey: null, fileKeyEvidence: 'dump ไม่ฝัง file key — ใส่เองจากลิงก์ไฟล์ Figma',
    exporter: 'tools/figma-dump (receive.mjs)', capturedAt: new Date().toISOString(), fileCount: meta.length,
    totalBytes: meta.reduce((n, m) => n + m.bytes, 0), validation: { jsonParsed: !items.some((i) => i.error), liveFigmaVerified: false }, files: meta,
  }, null, 2));
  console.log(`  ↳ index.json + source.json — ${meta.length} ไฟล์ใน ${path.relative(ROOT, dir)}/`);
}

const handler = (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...cors }); res.end(JSON.stringify(obj)); };
  // ปลั๊กอินส่งมาเป็น /figma-dump/<ชื่อ>/<node>.json หรือ /figjam-dump/<ชื่อ>/<node>.json
  const m = req.method === 'POST' && req.url.match(/^\/(figma|figjam)-dump\/([^/]+)\/([^/]+\.json)$/);
  if (!m) return send(404, { error: 'รับเฉพาะ POST /figma-dump/<ชื่อ>/<ไฟล์>.json' });
  const name = safe(m[2]) || 'dump', fileName = safe(m[3]);
  const dir = path.join(DUMP, name, `import-${today}`);
  const file = path.join(dir, fileName);
  if (!file.startsWith(DUMP + path.sep) || ['index.json', 'source.json'].includes(fileName)) return send(403, { error: 'path ไม่อนุญาต' });
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    try { JSON.parse(body); } catch (e) { return send(400, { error: 'ไม่ใช่ JSON: ' + e.message }); }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, body);
    console.log(`✓ ${path.relative(ROOT, file)} (${body.length.toLocaleString()} ไบต์)`);
    clearTimeout(pending.get(dir));
    pending.set(dir, setTimeout(() => { pending.delete(dir); try { buildIndex(dir, name); } catch (e) { console.log('  ✗ สร้าง index ไม่ได้:', e.message); } }, 3000));
    send(200, { ok: true, bytes: body.length, saved: path.relative(ROOT, file) });
  });
};

// Figma อนุญาตแค่ "localhost" — บน macOS resolve เป็น ::1 ก่อน 127.0.0.1 จึงต้องฟังทั้งสอง (loopback ล้วน)
let up = 0;
for (const host of ['127.0.0.1', '::1']) {
  const s = http.createServer(handler);
  s.on('error', (e) => {
    if (e.code === 'EADDRINUSE') { console.error(`พอร์ต ${PORT} ถูกใช้อยู่ — ปิด serve.js ของ Maintenance-Request-Form หรือหน้าต่าง dump ที่เปิดค้างก่อน`); process.exit(1); }
    if (host !== '::1') throw e;
  });
  s.listen(PORT, host, () => {
    if (++up === 1) console.log(`\nรอรับ dump ที่ http://localhost:${PORT} → ${path.relative(ROOT, DUMP)}/<ชื่อ>/import-${today}/\nรันปลั๊กอินใน Figma ได้เลย · เสร็จแล้วปิดหน้าต่างนี้ (Ctrl+C)\n`);
  });
}
