import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {enhancePresentationHTML,presentationCases,withPresentationQuery,withoutPresentationQuery} from '../content/presentation-mode.mjs';

const base = 'b3c192c8d9dc163024168cfdf913aff1d43df0bf';
const original = file => execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'});

test('normal page is the approved main plus only the presentation launcher, hidden toolbar and resources',() => {
  assert.equal(fs.readFileSync('index.html','utf8'),enhancePresentationHTML(original('index.html')));
  assert.equal(fs.readFileSync('data.json','utf8'),original('data.json'));
  for (const file of ['assets/demo-showcase.mjs','assets/demo-showcase.css','projects-split.js','app.js','tasteroom/index.html','tasteroom/app.js']) assert.equal(fs.readFileSync(file,'utf8'),original(file),file);
  assert.equal(execFileSync('git',['hash-object','assets/resume.pdf'],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',`${base}:assets/resume.pdf`],{encoding:'utf8'}).trim());
});
test('all four high points are existing case anchors, not invented tool features',() => {
  assert.deepEqual(Object.keys(presentationCases),['trust','taste','bundles','commute']);
  for (const href of Object.values(presentationCases)) {
    const url = new URL(href,'https://andyzhang666666.github.io');
    const html = fs.readFileSync('.'+url.pathname+'index.html','utf8');
    assert.ok(html.includes(`id="${url.hash.slice(1)}"`),href);
  }
});
test('mode links preserve unrelated query values and anchors',() => {
  for (const href of ['https://example.test/?utm_source=hr&topic=AI%20PM#selected','https://example.test/?empty=&topic=a&topic=b#about','https://example.test/#projects']) {
    const before = new URL(href);
    const entered = new URL(withPresentationQuery(href));
    const exited = new URL(withoutPresentationQuery(entered.href));
    assert.equal(entered.searchParams.get('present'),'1');
    assert.deepEqual([...exited.searchParams],[...before.searchParams]);
    assert.equal(exited.hash,before.hash);
    assert.equal(exited.pathname,before.pathname);
  }
});
test('enhancement is idempotent and fails closed on an incompatible template',() => {
  const once = enhancePresentationHTML(original('index.html'));
  assert.equal(enhancePresentationHTML(once),once);
  assert.throws(() => enhancePresentationHTML('<main></main>'),/requires the original/);
  assert.ok(!once.includes('showcaseDirectionNote'));
});
