import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncateProgress } from '../packages/rules/progress.mjs';
import { sortProgress } from '../domains/overhaul/features/job/progress-sort.mjs';
test('progress display truncates, never promotes unfinished work to 100%', () => {
  for (const [value, expected] of [[99.98,99.9],[99.999,99.9],[100,100],[0,0],[12.39,12.3],[50.05,50]]) assert.equal(truncateProgress(value),expected);
});
test('progress ordering uses B.E. timestamps, stable latest-insertion ties, and does not mutate history', () => {
  const log = [
    {id:'old',at:'31/12/2568 23:59',percent:90},
    {id:'new',at:'01/01/2569 09:00',percent:20},
    {id:'same-minute',at:'01/01/2569 09:00',percent:20},
    {id:'bad',at:'31/02/2569 12:00',percent:10},
  ];
  const ids = rows => rows.map(r=>r.id);
  assert.deepEqual(ids(sortProgress(log)),['same-minute','new','old','bad']);
  assert.deepEqual(ids(sortProgress(log,'at',1)),['old','same-minute','new','bad']);
  assert.deepEqual(ids(sortProgress(log,'percent',-1)),['old','same-minute','new','bad']);
  assert.deepEqual(ids(sortProgress(log,'percent',1)),['bad','same-minute','new','old']);
  assert.equal(log[0].id,'old');
});
