const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Replay = require('../replay.js');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/examples.json')));

test('timeout does not reveal the archived final ticket at the missing receipt', () => {
  for (const r of catalog.pairs.timeout) {
    const view = Replay.observed(r, 5);
    assert.equal(view.ticket.notes.length, 0);
    assert.equal(view.ticket.version, 1);
    assert.equal(view.uncertain, true);
    assert.equal(Replay.receipt(r, 5).tone, 'warning');
    assert.equal(r.ticket.notes.length, 1);
  }
  const recovery = Replay.observed(catalog.pairs.timeout[1], 6);
  assert.equal(recovery.ticket.notes.length, 1);
  assert.equal(recovery.evidence, 6);
  assert.equal(recovery.uncertain, false);
});
test('seeking uses only visited snapshots, including query responses after concurrent changes', () => {
  const r = catalog.pairs.conflict[1];
  assert.equal(Replay.observed(r, 6).ticket.version, 1);
  assert.equal(Replay.observed(r, 6).uncertain, true);
  assert.equal(Replay.observed(r, 7).ticket.version, 2);
  assert.equal(Replay.observed(r, 7).uncertain, false);
  assert.equal(Replay.observed(r, 10).ticket.version, 3);
  assert.equal(Replay.observed(r, 2).ticket.version, 1);
});
test('ten cases preserve recorded order, final grades, and data through every seek', () => {
  const before = JSON.stringify(catalog);
  assert.equal(catalog.cases.length, 10);
  for (const pair of Object.values(catalog.pairs)) {
    for (let step = Replay.maxSteps(pair); step >= 0; step--) {
      Replay.checkpoint(pair, step);
      for (const r of pair) {
        const view = Replay.observed(r, step);
        assert.ok(view.evidence <= Replay.countAt(r, step));
        Replay.receipt(r, step);
        assert.deepEqual(Replay.recap(r).checks, r.evaluation.checks);
      }
    }
  }
  assert.equal(JSON.stringify(catalog), before);
});
test('safe refusal passes without a business write; duplicate delivery is not another note', () => {
  for (const r of catalog.pairs.permission) {
    assert.equal(Replay.recap(r).passed, true);
    assert.equal(Replay.recap(r).state, 'denied');
    assert.equal(r.ticket.notes.length, 0);
  }
  for (const r of catalog.pairs.duplicate) {
    assert.equal(Replay.receipt(r, 6).title, '返回原操作回执');
    assert.equal(Replay.observed(r, 6).ticket.notes.length, 1);
  }
});
