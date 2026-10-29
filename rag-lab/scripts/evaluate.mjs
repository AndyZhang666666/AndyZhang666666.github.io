import {readFile, writeFile, mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadCorpus} from '../server/corpus.mjs';
import {retrieveRun, inspectCitations, VERSIONS} from '../engine.mjs';
import {redact} from '../server/server.mjs';

const documents = await loadCorpus();
const cases = JSON.parse(await readFile(new URL('../tests/cases.json', import.meta.url)));
const results = []; const records = [];
for (const fixture of cases) {
  const {question, date, snapshot, role} = fixture;
  const run = retrieveRun(documents, {question, date, snapshot}, role);
  const recalled = fixture.evidence.filter(id => run.retrieved.some(c => c.id === id));
  const factCorrect = fixture.fact === null ? null : run.answer.replace(/\s/g, '').includes(fixture.fact);
  const citationSupport = fixture.evidence.length ? inspectCitations(run.citations, run.retrieved) &&
    run.citations.every(c => fixture.evidence.includes(c.id)) && fixture.evidence.every(id => run.citations.some(c => c.id === id)) : null;
  const unauthorizedSupplied = run.retrieved.filter(c => !c.roles.includes(role)).length;
  results.push({id: fixture.id, role, date, snapshot, expectedStatus: fixture.status, actualStatus: run.status,
    statusCorrect: fixture.status === run.status, relevantEvidence: fixture.evidence.length, recalledEvidence: recalled.length,
    keyFactCorrect: factCorrect, citationSupport, unsupportedAnswer: fixture.status === 'insufficient' && run.status === 'answered',
    overRefusal: fixture.status === 'answered' && run.status !== 'answered', unauthorizedSupplied,
    failed: run.status === 'failed', elapsedMs: run.elapsedMs});
  records.push(redact({...run, fixtureId: fixture.id, recordNotice: 'Actual offline extractive run; no model call. Original synthetic corpus.'}));
}
const sum = key => results.reduce((n, r) => n + Number(r[key]), 0);
const summary = {createdAt: new Date().toISOString(), mode: 'offline-extractive', versions: VERSIONS,
  fixedBusinessDate: '2026-10-28 (historical fixture explicitly 2026-06-30)', sampleCount: cases.length,
  relevantEvidenceDenominator: sum('relevantEvidence'), recalledEvidence: sum('recalledEvidence'),
  retrievalCaseCount: results.filter(r => r.relevantEvidence).length,
  keyFactChecks: results.filter(r => r.keyFactCorrect !== null).length, keyFactsCorrect: sum('keyFactCorrect'),
  citationChecks: results.filter(r => r.citationSupport !== null).length, citationsSupported: sum('citationSupport'),
  noAnswerCases: results.filter(r => r.expectedStatus === 'insufficient').length, unsupportedAnswers: sum('unsupportedAnswer'),
  answerableCases: results.filter(r => r.expectedStatus === 'answered').length, overRefusals: sum('overRefusal'),
  unauthorizedSupplied: sum('unauthorizedSupplied'), runFailures: sum('failed'), statusCorrect: sum('statusCorrect'),
  elapsedMs: {min: Math.min(...results.map(r => r.elapsedMs)), max: Math.max(...results.map(r => r.elapsedMs)),
    mean: Math.round(sum('elapsedMs') / results.length * 100) / 100},
  modelCalls: 0, modelUsage: null, liveModelValidation: 'pending: no project model configuration',
  limitations: ['12 authored fixtures, not production accuracy', 'No semantic LLM grading', 'Permission denominator contains only relevant evidence allowed for this role/date/snapshot', 'Protocol fixtures in unit tests do not count as LLM runs'], results};
await mkdir(new URL('../evidence/', import.meta.url), {recursive: true});
await writeFile(new URL('../evidence/offline-summary.json', import.meta.url), JSON.stringify(summary, null, 2) + '\n');
await writeFile(new URL('../evidence/offline-records.json', import.meta.url), JSON.stringify(records, null, 2) + '\n');
console.log(JSON.stringify({...summary, results: undefined}, null, 2));
assert.equal(summary.statusCorrect, summary.sampleCount);
assert.equal(summary.recalledEvidence, summary.relevantEvidenceDenominator);
assert.equal(summary.keyFactsCorrect, summary.keyFactChecks);
assert.equal(summary.citationsSupported, summary.citationChecks);
assert.equal(summary.unsupportedAnswers + summary.overRefusals + summary.unauthorizedSupplied + summary.runFailures, 0);
