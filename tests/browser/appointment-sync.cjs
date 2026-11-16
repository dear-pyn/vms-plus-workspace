// Run against npm run dev or a static build: VMS_TEST_URL=http://localhost:3020 node tests/browser/appointment-sync.cjs
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const context = await browser.newContext();
    const a = await context.newPage(), b = await context.newPage();
    const errors = [];
    for (const p of [a, b]) { p.setDefaultTimeout(10000); p.on('pageerror', e => errors.push(e.message)); }
    const base = (process.env.VMS_TEST_URL || 'http://127.0.0.1:3021') + '/prototypes/overhaul/';
    const suffix = 'PO-690101/' + encodeURIComponent('70-1123 ชลบุรี');
    await a.goto(base + '#/job/' + suffix); await a.waitForLoadState('networkidle');
    await b.goto(base + '#/agency/job/' + suffix); await b.waitForLoadState('networkidle');
    await b.getByRole('button', {name: 'ปฏิเสธนัดหมาย', exact: true}).click();
    await b.getByPlaceholder('ระบุเหตุผล', {exact:true}).fill('ติดภารกิจ ทดสอบ sync');
    await b.getByRole('dialog').getByRole('button', {name: 'ปฏิเสธนัดหมาย', exact: true}).click();
    await b.getByText('ตอบกลับสำเร็จ', {exact: true}).waitFor();
    await a.getByText('ติดภารกิจ ทดสอบ sync', {exact: false}).first().waitFor();
    await a.reload(); await a.getByText('ติดภารกิจ ทดสอบ sync', {exact: false}).first().waitFor();
    // Resend from coordinator; the already-open agency tab must receive the new appointment.
    await a.getByRole('button', {name:'Mock · Prototype', exact:true}).click();
    await a.getByRole('button', {name:'เติมข้อมูลให้ครบ', exact:true}).click();
    await a.getByRole('button', {name:'ยืนยัน', exact:true}).click();
    await a.getByText('รอตอบกลับจากหน่วยงาน', {exact:true}).waitFor();
    await b.goto(base + '#/agency/job/' + suffix);
    await b.getByRole('button', {name:'ตอบรับนัดหมาย', exact:true}).last().waitFor();
    const date = new Date().toLocaleDateString('en-GB', {timeZone:'Asia/Bangkok'}).split('/');
    date[2] = String(Number(date[2]) + 543);
    await b.getByPlaceholder('วว/ดด/ปปปป', {exact:true}).fill(date.join('/'));
    await b.getByRole('button', {name:'ตอบรับนัดหมาย', exact:true}).last().click();
    assert.equal(await b.getByRole('dialog').count(), 0, 'acceptance submits without a confirmation modal');
    await a.getByRole('button', {name:'บันทึกและถัดไป', exact:true}).waitFor();
    await a.reload();
    await a.getByRole('button', {name:'บันทึกและถัดไป', exact:true}).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: rejection syncs, resend syncs, acceptance advances coordinator to intake, reload preserves state');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
