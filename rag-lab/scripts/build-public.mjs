import {writeFile} from 'node:fs/promises';
import {loadCorpus} from '../server/corpus.mjs';
import {VERSIONS} from '../engine.mjs';

// An explicit employee-publication allowlist, not client-side hiding of admin data.
const documents = (await loadCorpus()).filter(d => d.roles.includes('employee'));
if (documents.some(d => !d.roles.includes('employee'))) throw new Error('Publication scope violated');
await writeFile(new URL('../public-corpus.json', import.meta.url), JSON.stringify({mode: 'original-example', versions: VERSIONS, documents}, null, 2) + '\n');
console.log(`Published ${documents.length} fictional employee documents; admin documents excluded.`);
