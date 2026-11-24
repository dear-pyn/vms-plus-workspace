import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canRequisition, requisitionsOf, withdrawnParts, requisitionValue, nextRequisitionNo, activeRequisitions, withNewRequisition, withCancelledRequisition, withCancelledLine, lineStatus, activeLines } from '../domains/overhaul/features/job/requisition.ts';

const line = (partId, qty, cat = 'body', price = 100) => ({ partId, name: partId, unit: 'ชิ้น', price, qty, cat });
const req = (no, lines, status = 'pending') => ({ id: `r${no}`, no, at: '23/11/2569 10:00', by: 'กบค.', lines, status });

test('v2 EC-56: requisitions open before any Purchase Order and until "ซ่อมสำเร็จ" (V6), locked after', () => {
  assert.equal(canRequisition(undefined), true);
  for (const c of ['V1', 'V2', 'V3', 'V4.1', 'V5']) assert.equal(canRequisition(c), true, c);
  for (const c of ['V6', 'V7', 'V10.2', 'V11']) assert.equal(canRequisition(c), false, c);
});

test('jobs saved before requisitions existed: none before step 3, one issued legacy slip from step 3 on', () => {
  assert.deepEqual(requisitionsOf(undefined), []);
  assert.deepEqual(requisitionsOf(undefined, 'V2'), []);
  const legacy = requisitionsOf(undefined, 'V10.1');
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].status, 'issued');
  assert.deepEqual(requisitionsOf([], 'V10.1'), []);
});

test('closing table starts from summed withdrawals per part and category; cancelled slips are ignored', () => {
  const reqs = [req(1, [line('a', 2), line('h', 1, 'tools', 5000)]), req(2, [line('a', 3)]), req(3, [line('a', 10)], 'cancelled')];
  const body = withdrawnParts(reqs, 'body');
  assert.equal(body.length, 1);
  assert.equal(body[0].qty, 5);
  assert.equal(body[0].withdrawn, 5);
  assert.equal(withdrawnParts(reqs, 'tools')[0].withdrawn, 1);
  assert.equal(requisitionValue(reqs), 5 * 100 + 5000);
  assert.equal(activeRequisitions(reqs).length, 2);
  assert.equal(nextRequisitionNo(reqs), 4);
});

test('new slips start pending and number on; only pending slips can be cancelled, with a reason', () => {
  const { next, added } = withNewRequisition([req(1, [line('a', 1)], 'issued')], [line('b', 2)], '23/11/2569 16:00', 'กบค.', 'x');
  assert.equal(added.no, 2);
  assert.equal(added.status, 'pending');
  assert.equal(withCancelledRequisition(next, 'r1', 'ผิด', 'now'), null); // issued
  assert.equal(withCancelledRequisition(next, 'x', '  ', 'now'), null); // no reason
  const after = withCancelledRequisition(next, 'x', 'เบิกผิดรุ่น', 'now');
  assert.equal(after.find((r) => r.id === 'x').status, 'cancelled');
  assert.equal(withdrawnParts(after, 'body').length, 1);
});

test('owner 23 Nov: no slip handling — cancel one pending line at a time; totals and closing table skip it', () => {
  const reqs = [req(1, [line('a', 2), line('b', 3)]), req(2, [line('c', 1)], 'issued')];
  const after = withCancelledLine(reqs, 'r1', 'a', 'เบิกผิด', 'now');
  assert.equal(lineStatus(after[0], after[0].lines[0]), 'cancelled');
  assert.equal(lineStatus(after[0], after[0].lines[1]), 'pending');
  assert.equal(activeLines(after).length, 2);
  assert.equal(requisitionValue(after), 3 * 100 + 1 * 100);
  assert.equal(withdrawnParts(after, 'body').some((p) => p.name === 'a'), false);
  assert.equal(withCancelledLine(after, 'r1', 'a', 'ซ้ำ', 'now'), null); // already cancelled
  assert.equal(withCancelledLine(reqs, 'r2', 'c', 'คลังจ่ายแล้ว', 'now'), null); // issued
  assert.equal(withCancelledLine(reqs, 'r1', 'b', ' ', 'now'), null); // reason required
});

test('step 3 table: qty edits change only the pending part, never below what was already issued', async () => {
  const { partQty, withPartQty, withCancelledPart } = await import('../domains/overhaul/features/job/requisition.ts');
  const reqs = [req(1, [line('a', 2)], 'issued'), req(2, [line('a', 3), line('b', 1)])];
  assert.deepEqual(partQty(reqs, 'a', 100), { issued: 2, total: 5, pending: 3 });
  const up = withPartQty(reqs, 'a', 100, 7, 'now', 'กบค.', 'x');
  assert.equal(partQty(up, 'a', 100).total, 7);
  assert.equal(up.length, 2, 'adds onto the latest pending line');
  const down = withPartQty(reqs, 'a', 100, 2, 'now', 'กบค.', 'x');
  assert.equal(partQty(down, 'a', 100).total, 2);
  assert.equal(down[1].lines.length, 1, 'pending line at 0 is removed');
  assert.equal(withPartQty(reqs, 'a', 100, 1, 'now', 'กบค.', 'x'), null, 'below issued');
  const fresh = withPartQty([req(1, [line('a', 2)], 'issued')], 'a', 100, 4, 'now', 'กบค.', 'x');
  assert.equal(fresh.length, 2);
  assert.equal(fresh[1].status, 'pending');
  assert.equal(fresh[1].lines[0].qty, 2);
  const cut = withCancelledPart(reqs, 'a', 100, 'ไม่ใช้แล้ว', 'now');
  assert.deepEqual(partQty(cut, 'a', 100), { issued: 2, total: 2, pending: 0 });
  assert.equal(withCancelledPart(cut, 'a', 100, 'x', 'now'), null);
  assert.equal(withCancelledPart(reqs, 'a', 100, ' ', 'now'), null);
});
