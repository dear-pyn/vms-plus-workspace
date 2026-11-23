import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyChecks, BATTERY, validateIntakeForSign, intakeLocked, checkIntakeDate} from '../domains/overhaul/features/job/intake.ts';
const valid = () => ({date:'01/11/2569',mileage:'182,400',hours:'',checks:emptyChecks().map(c=>({...c,has:false})),delivererId:'600201',receiverId:'500101'});
test('signing requires mileage, all checklist answers and both signers; optional fields remain optional',()=>{
 assert.deepEqual(validateIntakeForSign(valid()),{});
 const missing={...valid(),date:'',mileage:'',delivererId:'',receiverId:'',checks:emptyChecks()};
 assert.deepEqual(Object.keys(validateIntakeForSign(missing)).sort(),['checks','date','delivererId','mileage','receiverId']);
 assert.ok(validateIntakeForSign({...valid(),checks:[]}).checks);
 assert.ok(validateIntakeForSign({...valid(),mileage:'12a'}).mileage);
 assert.ok(validateIntakeForSign({...valid(),mileage:'10000000'}).mileage);
 assert.ok(validateIntakeForSign({...valid(),hours:'2.5'}).hours);
 assert.deepEqual(validateIntakeForSign({...valid(),mileage:'0',hours:'999,999'}),{});
});
test('v2: inspection date is required, valid B.E. and not in the future; back-dated is allowed',()=>{
 assert.equal(checkIntakeDate('',new Date(2026,10,23)),'กรุณาเลือกวันที่ตรวจรับรถ');
 assert.ok(checkIntakeDate('31/02/2569',new Date(2026,10,23)));
 assert.ok(checkIntakeDate('2569-11-01',new Date(2026,10,23)));
 assert.equal(checkIntakeDate('24/11/2569',new Date(2026,10,23)),'วันที่ตรวจรับรถต้องไม่หลังวันนี้');
 assert.equal(checkIntakeDate('23/11/2569',new Date(2026,10,23)),'');
 assert.equal(checkIntakeDate('01/01/2568',new Date(2026,10,23)),'');
});
test('battery details are required only when the checklist says the battery is present',()=>{
 const draft=valid(); draft.checks=draft.checks.map(c=>c.item===BATTERY?{...c,has:true}:c);
 assert.ok(validateIntakeForSign(draft).batteryBrand);
 assert.ok(validateIntakeForSign(draft).batteryCount);
 draft.checks=draft.checks.map(c=>c.item===BATTERY?{...c,brand:'ตัวอย่าง',count:'2'}:c);
 assert.deepEqual(validateIntakeForSign(draft),{});
});

test('intake locks immediately on a sent request, before acknowledgement',()=>{
 assert.equal(intakeLocked(),false);
 assert.equal(intakeLocked({approvals:[]}),false);
 assert.equal(intakeLocked({approvals:[{side:'หน่วยงาน',staffId:'600201'}]}),false);
 assert.equal(intakeLocked({approvals:[{side:'หน่วยงาน',staffId:'600201',sentAt:'18/11/2569 09:00'}]}),true);
 assert.equal(intakeLocked({approvals:[{side:'กบค.',staffId:'500101',result:'approved'}]}),true);
});
