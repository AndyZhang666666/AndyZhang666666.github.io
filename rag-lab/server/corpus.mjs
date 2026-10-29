import {readdir, readFile} from 'node:fs/promises';
import {parseDocument} from '../engine.mjs';

export async function loadCorpus(directory = new URL('../corpus/', import.meta.url)) {
  const files = (await readdir(directory)).filter(f => f.endsWith('.md')).sort();
  const documents = await Promise.all(files.map(async file => parseDocument(await readFile(new URL(file, directory), 'utf8'))));
  if (new Set(documents.map(d => d.id)).size !== documents.length) throw new Error('Duplicate document ID');
  return documents;
}
