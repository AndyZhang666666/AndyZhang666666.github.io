import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {integrateSite, captureExtensions, restoreExtensions} from '../scripts/integrate-site.mjs';

test('incremental site integration is idempotent and preserves unrelated data/cards', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rag-integration-'));
  const root = pathToFileURL(dir + '/');
  const unrelated = {id: 'another-agent', name: 'Parallel project', nested: {mustKeep: [1, 2, 3]}};
  const html = '<main>untouched<header>existing</header><div id="projectGrid" class="project-grid"><article id="project-another-agent">KEEP EXACTLY</article></div></main>';
  try {
    await writeFile(new URL('data.json', root), JSON.stringify({about: {keep: true}, projects: [unrelated]}));
    await writeFile(new URL('index.html', root), html);
    await writeFile(new URL('app.js', root), "fetch('data.json?v=old')");
    assert.equal(await integrateSite(root), 2);
    const once = await readFile(new URL('index.html', root), 'utf8');
    const data = JSON.parse(await readFile(new URL('data.json', root), 'utf8'));
    assert.deepEqual(data.projects[0], unrelated); assert.deepEqual(data.about, {keep: true});
    assert.ok(once.includes('<article id="project-another-agent">KEEP EXACTLY</article>'));
    assert.equal(await integrateSite(root), 2);
    assert.equal(await readFile(new URL('index.html', root), 'utf8'), once);
    assert.equal((once.match(/id="project-rag-lab"/g) ?? []).length, 1);
  } finally { await rm(dir, {recursive: true}); }
});

test('a historical generator cannot erase a parallel custom project/card', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rag-extension-'));
  const root = pathToFileURL(dir + '/');
  const entry = {id: 'agent-bench', name: 'Parallel project', custom: {preserve: true}};
  const marker = '<div id="projectGrid" class="project-grid">';
  const card = '<article id="project-agent-bench" class="custom-card"><p>EXACT CUSTOM CONTENT</p></article>';
  try {
    await writeFile(new URL('data.json', root), JSON.stringify({projects: [{id: 'old'}, entry]}));
    await writeFile(new URL('index.html', root), marker + card + '</div>');
    const captured = await captureExtensions(['old'], root);
    await writeFile(new URL('data.json', root), JSON.stringify({projects: [{id: 'old'}]}));
    await writeFile(new URL('index.html', root), marker + '</div>');
    await restoreExtensions(captured, root);
    assert.deepEqual(JSON.parse(await readFile(new URL('data.json', root), 'utf8')).projects[1], entry);
    assert.ok((await readFile(new URL('index.html', root), 'utf8')).includes(card));
  } finally { await rm(dir, {recursive: true}); }
});

test('recorded RAG release preserves its 16 predecessors; later homepage editing is tested separately', async () => {
  const cwd = new URL('../../', import.meta.url).pathname;
  const base = 'b74a5e4db66bb84be23a51cf191dec6e74b58086';
  // This assertion describes that release, not every future authorised portfolio edit.
  const release = 'd5d64cfa7717ce51753285603d097e1f68d7b5d9';
  const previousData = JSON.parse(execFileSync('git', ['show', `${base}:data.json`], {cwd, encoding: 'utf8'}));
  const currentData = JSON.parse(execFileSync('git', ['show', `${release}:data.json`], {cwd, encoding: 'utf8'}));
  assert.deepEqual(currentData.projects.filter(p => p.id !== 'rag-lab'), previousData.projects);
  assert.deepEqual({...currentData, projects: []}, {...previousData, projects: []});
  let currentHTML = execFileSync('git', ['show', `${release}:index.html`], {cwd, encoding: 'utf8'});
  const previousHTML = execFileSync('git', ['show', `${base}:index.html`], {cwd, encoding: 'utf8'});
  currentHTML = currentHTML.replace(/<article id="project-rag-lab"[^]*?<\/article>\n/, '')
    .replaceAll(/查看全部 \d+ 项作品/g, previousHTML.match(/查看全部 \d+ 项作品/)[0])
    .replaceAll(/Explore all \d+ projects/g, previousHTML.match(/Explore all \d+ projects/)[0]);
  currentHTML = currentHTML.replace(/src="app\.js\?v=[^"]*"/, previousHTML.match(/src="app\.js\?v=[^"]*"/)[0]);
  assert.equal(currentHTML, previousHTML);
  const previousApp = execFileSync('git', ['show', `${base}:app.js`], {cwd, encoding: 'utf8'});
  const app = execFileSync('git', ['show', `${release}:app.js`], {cwd, encoding: 'utf8'});
  assert.equal(app.replace(/data\.json\?v=[\w.-]+/g, previousApp.match(/data\.json\?v=[\w.-]+/)[0]), previousApp);
  assert.equal(execFileSync('git', ['diff', base, release, '--', 'agent-bench', '.github/workflows/agent-bench.yml'], {cwd, encoding: 'utf8'}), '', 'Parallel module was unchanged in the recorded RAG release');
  // Preserve the newer bilingual entry docs while protecting the live runtime.
  const protectedAgentPaths = ['agent-bench', '.github/workflows/agent-bench.yml',
    ':(exclude)agent-bench/README.md', ':(exclude)agent-bench/README.en.md'];
  assert.equal(execFileSync('git', ['diff', base, '--', ...protectedAgentPaths], {cwd, encoding: 'utf8'}), '', 'Parallel runtime, fixtures and workflow must remain byte-for-byte unchanged');
});
