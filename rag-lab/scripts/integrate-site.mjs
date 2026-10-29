import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {renderProjectCards} from '../../assets/project-cards.mjs';
import {project} from '../project.mjs';

export async function integrateSite(root = new URL('../../', import.meta.url)) {
  const dataPath = new URL('data.json', root), htmlPath = new URL('index.html', root);
  const originalData = await readFile(dataPath, 'utf8');
  const data = JSON.parse(originalData);
  if (!data.projects.some(p => p.id === project.id)) {
    data.projects.push(project);
    await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n');
  }
  let html = await readFile(htmlPath, 'utf8');
  if (!html.includes('id="project-rag-lab"')) {
    const marker = '<div id="projectGrid" class="project-grid">';
    if (!html.includes(marker)) throw new Error('Site entry changed; inspect the latest HTML before integrating.');
    html = html.replace(marker, `${marker}${renderProjectCards([project])}\n`);
  }
  const count = data.projects.length;
  html = html.replaceAll(/查看全部 \d+ 项作品/g, `查看全部 ${count} 项作品`).replaceAll(/Explore all \d+ projects/g, `Explore all ${count} projects`);
  // Both HTML and data must move together: an old cached data.json would otherwise remove the new card.
  const revision = `rag-${createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 12)}`;
  html = html.replace(/src="app\.js\?v=[^"]*"/, `src="app.js?v=${revision}"`);
  const appPath = new URL('app.js', root);
  const originalApp = await readFile(appPath, 'utf8');
  const app = originalApp.replace(/data\.json\?v=[\w.-]+/g, `data.json?v=${revision}`);
  if (app !== originalApp) await writeFile(appPath, app);
  const previous = await readFile(htmlPath, 'utf8');
  if (previous !== html) await writeFile(htmlPath, html);
  return count;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(`RAG Lab added incrementally; ${await integrateSite()} total projects.`);
