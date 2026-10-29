import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCorpus} from '../server/corpus.mjs';
import {retrieveRun, eligibleDocuments, validateInput, checkModelAnswer, inspectCitations} from '../engine.mjs';
const documents = await loadCorpus();
const cases = JSON.parse(await readFile(new URL('./cases.json', import.meta.url)));
const input = {question: '显示器最长能借多久？', date: '2026-10-28', snapshot: 'baseline', generation: 'extractive'};

for (const item of cases) test(`fixed fixture: ${item.id}`, () => {
  const {question, date, snapshot, role} = item;
  const run = retrieveRun(documents, {question, date, snapshot}, role);
  assert.equal(run.status, item.status);
  for (const id of item.evidence) assert.ok(run.retrieved.some(c => c.id === id), `missing ${id}`);
  if (item.fact) assert.ok(run.answer.replace(/\s/g, '').includes(item.fact));
  if (item.status === 'answered' || item.status === 'conflict') {
    assert.deepEqual(new Set(run.citations.map(c => c.id)), new Set(item.evidence));
    assert.ok(inspectCitations(run.citations, run.retrieved));
  }
  if (role === 'employee') assert.ok(run.retrieved.every(c => !c.docId.startsWith('ADM-')));
});

test('half-open effective date boundary and snapshot activation', () => {
  const scope = {role: 'employee', snapshot: 'baseline'};
  const ids = date => eligibleDocuments(documents, {...scope, date}).map(d => d.id);
  assert.ok(ids('2026-06-30').includes('MON-1'));
  assert.ok(!ids('2026-07-01').includes('MON-1'));
  assert.ok(ids('2026-07-01').includes('MON-2'));
  assert.ok(!ids('2026-10-28').includes('MON-3'));
  assert.ok(eligibleDocuments(documents, {...scope, snapshot: 'revised', date: '2026-10-19'}).some(d => d.id === 'MON-2'));
  assert.ok(eligibleDocuments(documents, {...scope, snapshot: 'revised', date: '2026-10-20'}).some(d => d.id === 'MON-3'));
});

test('no applicable date produces no fabricated current rule', () => {
  const run = retrieveRun(documents, {...input, date: '2025-12-31'}, 'employee');
  assert.equal(run.retrieved.length, 0); assert.equal(run.status, 'insufficient');
});

test('stable source binding survives subsequent snapshot run', () => {
  const old = retrieveRun(documents, input, 'employee');
  retrieveRun(documents, {...input, snapshot: 'revised'}, 'employee');
  assert.equal(old.snapshot, 'baseline'); assert.equal(old.citations[0].docId, 'MON-2');
  assert.match(old.citations[0].text, /14 天/);
});

test('input validation rejects impossible dates, object tricks and auth parameters', () => {
  for (const change of [{date: '2026-02-30'}, {snapshot: '__proto__'}, {snapshot: 'constructor'}, {question: 'x'.repeat(301)}, {role: 'admin'}, {generation: 'other'}]) {
    assert.throws(() => validateInput({...input, ...change}));
  }
  assert.throws(() => validateInput(null)); assert.throws(() => validateInput([]));
});

test('citation existence is distinct from fact correctness', () => {
  const run = retrieveRun(documents, input, 'employee');
  const validCitation = {chunkId: 'MON-2:p1', quote: '显示器单次最长借用 14 天'};
  assert.ok(inspectCitations([validCitation], run.retrieved));
  assert.equal(checkModelAnswer({status: 'answered', answer: '可以借 30 天', citations: [validCitation]}, run, run.retrieved).ok, false);
  assert.equal(checkModelAnswer({status: 'answered', answer: '可以借 14 天，押金 99 元', citations: [validCitation]}, run, run.retrieved).ok, false);
  assert.equal(checkModelAnswer({status: 'answered', answer: '可以借 14 天', citations: [{...validCitation, chunkId: 'MON-1:p1'}]}, run, run.retrieved).ok, false);
  assert.equal(checkModelAnswer({status: 'answered', answer: '可以借 14 天', citations: [{...validCitation, quote: '原文不存在'}]}, run, run.retrieved).ok, false);
  assert.equal(checkModelAnswer({status: 'answered', answer: '显示器最长借用 14 天。', citations: [validCitation]}, run, run.retrieved).ok, true);
});

test('publication contains no admin-only metadata or text', async () => {
  const text = await readFile(new URL('../public-corpus.json', import.meta.url), 'utf8');
  assert.ok(!/ADM-|QY-RESERVE-ORCHID|采购审批说明|应急备用机数量为/.test(text));
  const published = JSON.parse(text);
  assert.equal(published.documents.length, 12);
  assert.ok(published.documents.every(d => d.roles.includes('employee')));
});
