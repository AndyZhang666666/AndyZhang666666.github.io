import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {integrateSite} from '../scripts/integrate-site.mjs';

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

test('actual site addition preserves all 15 original projects and changes only its own card/count', async () => {
  const root = new URL('../../', import.meta.url);
  const cwd = new URL('../../', import.meta.url).pathname;
  const base = '35ea8dab812227a2a68f6c5a793198f773f2ced3';
  const previousData = JSON.parse(execFileSync('git', ['show', `${base}:data.json`], {cwd, encoding: 'utf8'}));
  const currentData = JSON.parse(await readFile(new URL('data.json', root), 'utf8'));
  assert.deepEqual(currentData.projects.filter(p => p.id !== 'rag-lab'), previousData.projects);
  assert.deepEqual({...currentData, projects: []}, {...previousData, projects: []});
  let currentHTML = await readFile(new URL('index.html', root), 'utf8');
  const previousHTML = execFileSync('git', ['show', `${base}:index.html`], {cwd, encoding: 'utf8'});
  currentHTML = currentHTML.replace(/<article id="project-rag-lab"[^]*?<\/article>\n/, '')
    .replaceAll('查看全部 16 项作品', '查看全部 15 项作品').replaceAll('Explore all 16 projects', 'Explore all 15 projects');
  currentHTML = currentHTML.replace(/src="app\.js\?v=[^"]*"/, previousHTML.match(/src="app\.js\?v=[^"]*"/)[0]);
  assert.equal(currentHTML, previousHTML);
  const previousApp = execFileSync('git', ['show', `${base}:app.js`], {cwd, encoding: 'utf8'});
  const app = await readFile(new URL('app.js', root), 'utf8');
  assert.equal(app.replace(/data\.json\?v=[\w.-]+/g, previousApp.match(/data\.json\?v=[\w.-]+/)[0]), previousApp);
});
