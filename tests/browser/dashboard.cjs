// Dashboard Overhaul r3 (17 พ.ย. 2569) — ข้อมูล/วิธีเลือกตามต้นแบบ Downloads + CI VMS Plus
// รัน: VMS_TEST_URL=http://127.0.0.1:3020 CHROME_PATH=<chrome> NODE_PATH=<playwright-core>/node_modules node tests/browser/dashboard.cjs
const {chromium}=require('playwright-core');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=(process.env.VMS_TEST_URL||'http://127.0.0.1:3021')+'/prototypes/overhaul/';
await page.goto(base+'#/dashboard');await page.getByRole('heading',{name:'Dashboard Overhaul',exact:true}).waitFor();
// เมนูอยู่ใต้ จัดการยานพาหนะขนาดใหญ่
assert.ok(await page.evaluate(()=>[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='Dashboard Overhaul'&&a.getAttribute('href').endsWith('#/dashboard'))));
// ระดับแผน: ค่าเริ่มต้น = แผนล่าสุดของปี 2569 (ORZ6900093 · 3 คัน · ความคืบหน้า 66%)
await page.getByText('66%',{exact:true}).first().waitFor();
assert.equal(await page.getByRole('table',{name:'เปรียบเทียบรายแผน'}).locator('tbody tr:not([data-po-of])').count(),1); // แผนเดียวก็แสดง
const picker=page.getByRole('combobox',{name:/แผน Overhaul เลือกแล้ว/});await picker.click();
const list=page.getByRole('listbox');
// พิมพ์ค้นแผนได้
await picker.fill('เครน');assert.equal(await list.getByRole('option').count(),1);await picker.fill('');
await list.getByText('ORZ6900091',{exact:true}).click();await list.getByText('ORZ6900092',{exact:true}).click();
// ติ๊กออกครบทุกแผนไม่ได้ (เหลืออย่างน้อย 1)
await page.keyboard.press('Escape');await page.getByText('1,596,500.00',{exact:true}).first().waitFor();
assert.equal(await page.getByRole('table',{name:'เปรียบเทียบรายแผน'}).locator('tbody tr:not([data-po-of])').count(),3);
// PO เป็นแถวพื้นเทาใต้แถวแผน แสดงตลอด (ไม่ย่อ/ขยาย)
const cmp=page.getByRole('table',{name:'เปรียบเทียบรายแผน'});assert.equal(await cmp.locator('tr[data-po-of="ORZ6900091"]').count(),2);await cmp.getByText('PO-6900091-02').waitFor();assert.equal(await cmp.locator('tbody tr').count(),9);
await cmp.scrollIntoViewIfNeeded();await page.screenshot({path:process.env.SHOT||'/tmp/vms-dashboard-compare.png'});
// ระดับยานพาหนะ: ทุกแผนของปี 2569 = 12 คัน · ค้นหา · แผงรายละเอียด
await page.getByRole('tab',{name:'ระดับยานพาหนะ'}).click();await page.getByText('12 คัน',{exact:true}).waitFor();
// ระดับยานพาหนะใช้ช่องเลือกแผนแบบเดียวกัน: เริ่มทุกแผน → ค้นแล้วเอา ORZ6900091 ออก เหลือ 7 คัน
await page.getByRole('combobox',{name:/แผน Overhaul เลือกแล้ว 3 แผน/}).waitFor();const vp=page.getByRole('combobox',{name:/แผน Overhaul เลือกแล้ว/});await vp.click();await page.getByRole('listbox').getByText('ORZ6900091',{exact:true}).click();await page.keyboard.press('Escape');await page.getByText('7 คัน',{exact:true}).waitFor();
await vp.click();await page.getByRole('button',{name:'เลือกทุกแผน'}).click();await page.keyboard.press('Escape');await page.getByText('12 คัน',{exact:true}).waitFor();
await page.getByRole('searchbox',{name:'ค้นหายานพาหนะ'}).fill('ISUZU');assert.equal(await page.getByRole('table',{name:'ยานพาหนะที่ Overhaul'}).locator('tbody tr').count(),5);
// ไอคอนตา → หน้างานรายคันจริงของต้นแบบ แล้วกลับ Dashboard
const firstPlate=(await page.getByRole('table',{name:'ยานพาหนะที่ Overhaul'}).locator('tbody tr').first().locator('td').first().innerText()).trim();
await page.getByRole('button',{name:`ดูงานที่ทำ ${firstPlate}`}).click();await page.waitForFunction(()=>location.hash.startsWith('#/job/PO-69000'));
await page.getByRole('heading',{name:firstPlate,exact:true}).waitFor();assert.deepEqual(errors,[]);
await page.goBack();await page.getByRole('tab',{name:'ระดับยานพาหนะ'}).waitFor();
await page.getByLabel('ปีงบประมาณ').selectOption('all');await page.getByRole('searchbox',{name:'ค้นหายานพาหนะ'}).fill('');await page.getByText('22 คัน',{exact:true}).waitFor();
for(const w of [1440,390]){await page.setViewportSize({width:w,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${w}`);}
assert.deepEqual(errors,[]);console.log('dashboard ok');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
