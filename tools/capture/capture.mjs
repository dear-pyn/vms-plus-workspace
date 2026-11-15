// แคปหน้าจออัตโนมัติขณะกดตาม flow เอง (คล้าย Scribe แต่เก็บไฟล์ในเครื่องเท่านั้น)
//
//   ดับเบิลคลิก tools/capture/capture.command (ถามเว็บ + ชื่อ) หรือ
//   npm run capture                       → tools/capture/captures/<วันเวลา>/
//   npm run capture -- นัดหมาย             → tools/capture/captures/นัดหมาย/
//   npm run capture -- นัดหมาย <URL>       → เริ่มที่ URL นั้น (ค่าเริ่มต้น VMS เว็บเก่า)
//
// แคปเมื่อ: คลิก · เปลี่ยนหน้า · กด F8 (แคปเอง เช่นตอน hover หรือ dropdown ที่เปิดค้าง)
// ปิดหน้าต่าง Chrome = จบ · ได้ภาพ + steps.md (ลำดับขั้น · กดอะไร · URL)
//
// ความเป็นส่วนตัว: tools/capture/captures/ และ .capture-profile/ (session ล็อกอิน) อยู่ใน .gitignore
// เพราะภาพมีข้อมูลพนักงานจริง · บันทึกเฉพาะชื่อปุ่ม/ป้าย ไม่บันทึกค่าที่พิมพ์ในช่องกรอก

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from './index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HERE = path.join(ROOT, 'tools', 'capture');   // ภาพ + session เก็บในโฟลเดอร์นี้ ไม่รกหน้าแรกของโปรเจกต์
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HEADLESS = process.env.CAPTURE_HEADLESS === '1';   // ใช้ตอนทดสอบสคริปต์เท่านั้น

// --web=1 (เว็บเก่า) · 2 (UAT ใหม่) · หรือลิงก์ — ใช้จาก VS Code Task ที่ถามช่องเดียว
const WEBS = { '1': 'https://vmsplus-dev.pea.co.th/', '2': 'https://vms-plus-uat.odds.team/maintain-d/' };
const webArg = (process.argv.find((a) => a.startsWith('--web=')) || '').slice(6).trim();
const args = process.argv.slice(2).filter((a) => !a.startsWith('--') && a.trim());
const startUrl = WEBS[webArg] || (webArg ? (/^https?:\/\//.test(webArg) ? webArg : 'https://' + webArg) : '')
  || args.find((a) => /^https?:\/\//.test(a)) || WEBS['1'];
const stamp = new Date().toLocaleString('sv-SE', { hour12: false }).replace(' ', '_').replace(/:/g, '').slice(0, 15);
const name = (args.find((a) => !/^https?:\/\//.test(a)) || stamp).replace(/[\\/:*?"<>|]/g, '-');

let outDir = path.join(HERE, 'captures', name);
for (let i = 2; fs.existsSync(outDir) && fs.readdirSync(outDir).length; i++) outDir = path.join(HERE, 'captures', `${name}-${i}`);
fs.mkdirSync(outDir, { recursive: true });

const stepsFile = path.join(outDir, 'steps.md');
fs.writeFileSync(stepsFile, `# ${path.basename(outDir)}\n\nเริ่ม ${new Date().toLocaleString('th-TH')} · ${startUrl}\n\n| # | กดอะไร | หน้า | ไฟล์ |\n|---|---|---|---|\n`);

const safe = (s) => String(s || '').replace(/[\\/:*?"<>|\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
const cell = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
let n = 0;
let busyUntil = 0;     // ช่วงที่การแคปจากคลิกยังไม่จบ — ไม่แคปซ้ำตอนหน้าเปลี่ยนจากคลิกเดียวกัน
let chain = Promise.resolve();

// หน้าล็อกอิน (SSO) ห้ามแคป — ภาพจะติดรหัสพนักงานที่พิมพ์ (เจอจริง 13 พ.ย. 2569: sso2.pea.co.th ถูกแคป 10 ภาพ)
const isLogin = (u) => { try { const x = new URL(u); return /(^|\.)sso\d*\.|login|signin|auth/i.test(x.hostname + x.pathname); } catch { return false; } };

function shoot(page, label) {
  chain = chain.then(async () => {
    try {
      if (isLogin(page.url())) return;
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);   // รอ animation ของ modal/drawer
      n += 1;
      const file = `${String(n).padStart(2, '0')}-${safe(label) || 'หน้า'}.png`;
      await page.screenshot({ path: path.join(outDir, file), fullPage: true });
      const url = page.url().replace(/[?#].*$/, '');
      fs.appendFileSync(stepsFile, `| ${n} | ${cell(label)} | ${cell(url)} | ${file} |\n`);
      console.log(`  ${n}. ${label}`);
    } catch (e) {
      if (!/closed|Target/.test(String(e))) console.log('  ✗ แคปไม่ได้:', e.message);
    }
  });
  return chain;
}

const context = await chromium.launchPersistentContext(path.join(HERE, '.capture-profile'), {
  executablePath: CHROME,
  headless: HEADLESS,
  viewport: HEADLESS ? { width: 1440, height: 900 } : null,
  args: HEADLESS ? [] : ['--start-maximized'],
  ignoreDefaultArgs: ['--enable-automation'],
});

const closed = new Promise((r) => context.on('close', r));

await context.exposeBinding('__capture', async ({ page }, label) => {
  if (label.startsWith('กด ')) busyUntil = Date.now() + 2500;   // F8 ไม่กันการแคปตอนเปลี่ยนหน้า
  await shoot(page, label);
});

// ฝังในทุกหน้า: ดักคลิก + F8 แล้วส่ง "ชื่อ" ของสิ่งที่กดกลับมา (ไม่ส่งค่าที่พิมพ์)
await context.addInitScript(() => {
  const describe = (el) => {
    const t = el.closest('button,a,[role=button],[role=tab],[role=menuitem],[role=option],label,input,select,textarea,th,td,li') || el;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
      const lab = t.id && document.querySelector(`label[for="${CSS.escape(t.id)}"]`);
      return 'ช่อง ' + (t.getAttribute('aria-label') || t.placeholder || (lab && lab.innerText) || t.name || t.type || '');
    }
    const txt = (t.getAttribute('aria-label') || t.innerText || t.title || '').trim().split('\n').filter(Boolean)
      .filter((s) => !/^[a-z_]+$/.test(s))           // ตัดชื่อไอคอน Material เช่น filter_list
      .join(' ');
    return txt || t.getAttribute('aria-label') || t.tagName.toLowerCase();
  };
  window.addEventListener('click', (e) => { if (document.querySelector('input[type=password]')) return; try { window.__capture('กด ' + describe(e.target)); } catch (_) {} }, true);
  window.addEventListener('keydown', (e) => { if (e.key === 'F8') { try { window.__capture('แคปเอง (F8)'); } catch (_) {} } }, true);
});

const watch = (page) => page.on('framenavigated', (f) => {
  if (f !== page.mainFrame() || Date.now() < busyUntil) return;
  shoot(page, 'เปิดหน้า ' + decodeURI(new URL(f.url()).pathname));
});
context.on('page', watch);

const page = context.pages()[0] || (await context.newPage());
watch(page);
console.log(`\nเก็บภาพที่ ${path.relative(ROOT, outDir)}/`);
console.log('กดตาม flow ได้เลย · F8 = แคปเอง · ปิดหน้าต่าง Chrome เมื่อเสร็จ\n');
await page.goto(startUrl).catch((e) => console.log('เปิดหน้าไม่ได้ (ต่อ VPN หรือยัง?):', e.message));

if (HEADLESS && process.env.CAPTURE_TEST) {
  const run = (await import(path.resolve(process.env.CAPTURE_TEST))).default;
  await run(page);
  await chain;
  await context.close();
}

await closed;
await chain;
try { buildIndex(); } catch (e) { console.log('สร้าง INDEX.md ไม่ได้:', e.message); }
console.log(`\nจบ — ${n} ภาพ · ดูสรุปที่ ${path.relative(ROOT, stepsFile)}`);
