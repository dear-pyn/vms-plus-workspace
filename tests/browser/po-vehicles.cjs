const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const po=await context.newPage(),job=await context.newPage(); const errors=[];
 for(const p of [po,job]) {p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));}
 const base=(process.env.VMS_TEST_URL||'http://127.0.0.1:3021')+'/prototypes/overhaul/';
 await po.goto(base+'#/plan/ORZ6900001/po/PO-690101');await po.waitForLoadState('networkidle');
 const table=po.getByRole('table',{name:'รายการยานพาหนะใน Purchase Order',exact:true});
 const headers=await table.getByRole('columnheader').allTextContents();
 assert.deepEqual(headers.map(x=>x.replace(/swap_vert|arrow_upward|arrow_downward/g,'').trim()),['ทะเบียน','ประเภทยานพาหนะ','มูลค่ายานพาหนะ (บาท)','ราคากลาง','ประเมิน Overhaul (บาท)','อายุการใช้งาน','ความคืบหน้า','สถานะงาน','']);
 assert.equal(await table.getByRole('columnheader',{name:'เลขไมล์ (กม.)',exact:true}).count(),0);
 const plate='8234 กค กทม';
 const row=table.getByRole('row').filter({hasText:plate});
 assert.equal(await row.getByRole('progressbar').count(),1);
 await job.goto(base+'#/job/PO-690101/'+encodeURIComponent(plate));await job.waitForLoadState('networkidle');
 await job.getByRole('button',{name:'Mock · Prototype',exact:true}).click();
 await job.getByRole('button',{name:'เติมข้อมูลให้ครบ',exact:true}).click();
 await job.getByRole('dialog').getByRole('button',{name:'บันทึก',exact:true}).click();
 await row.getByText('100.0%',{exact:true}).waitFor();
 await row.getByRole('button',{name:'ไปหน้างาน '+plate,exact:true}).click();
 await po.waitForURL(/#\/job\//);
 assert.deepEqual(errors,[]);
 console.log('PASS: confirmed PO columns, progress reflects live job update across tabs, job action works, no pageerror');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
