const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=(process.env.VMS_TEST_URL||'http://127.0.0.1:3021')+'/prototypes/overhaul/';
 await page.goto(base+'#/cases');await page.waitForLoadState('networkidle');await page.getByRole('heading',{name:'สารบัญเคส',exact:true}).waitFor();
 const tables=page.getByRole('table');assert.ok(await tables.count()>=9);
 const labels=await page.locator('tbody tr').evaluateAll(rows=>rows.filter(r=>r.querySelector('button')).map(r=>r.querySelector('td').textContent));
 assert.ok(labels.length>=25);
 for(const [index,label] of labels.entries()){
   await page.locator('tbody tr').nth(index).getByRole('button',{name:'เปิด',exact:true}).click();
   await page.waitForFunction(()=>location.hash!=='#/cases');
   assert.ok(await page.getByRole('heading').count()>0,label);
   assert.deepEqual(errors,[],label);
   await page.evaluate(()=>{location.hash='/cases'});
   await page.getByRole('heading',{name:'สารบัญเคส',exact:true}).waitFor();
 }
 console.log(`PASS: ${labels.length} catalog cases open without pageerror`);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
