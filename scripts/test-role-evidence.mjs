import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {findEvidence} from '../assets/evidence-core.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('index.html');
const growth = html.match(/data-jd="([^"]+)">增长 \/ 商业化 PM/)[1];
const strategy = html.match(/data-en="Search \/ Strategy PM" data-jd="([^"]+)" data-jd-en="([^"]+)"/);

for (const [lang, sample] of [['zh', strategy[1]], ['en', strategy[2]]]) {
  const {dims} = JSON.parse(read('content/evidence-' + lang + '.json'));
  const lookup = text => findEvidence(text, dims);
  const sources = (result, id) => result.matched.find(dim => dim.id === id)?.evidence.map(e => e.key);
  for (const [name, input] of [['growth preset', growth], ['strategy preset', sample]]) {
    test(lang + ' ' + name + ' separates the two documented actions from algorithm-team collaboration', () => {
      const result = lookup(input);
      assert.deepEqual(sources(result, 'product-recommendations'), ['family']);
      assert.deepEqual(sources(result, 'user-outreach'), ['exposure']);
      assert.ok(result.unrecognised.some(clause => /算法|algorithms team/i.test(clause)));
      assert.ok(!result.unrecognised.some(clause => /推荐与触达|product recommendations/i.test(clause)));
    });
  }
  test(lang + ' does not substitute outreach for recommendations or search-model work', () => {
    assert.equal(sources(lookup('主动触达'), 'product-recommendations'), undefined);
    assert.equal(sources(lookup('商品推荐'), 'user-outreach'), undefined);
    for (const input of ['搜索排序模型训练', '召回模型调优', 'search ranking models']) {
      assert.deepEqual(lookup(input).unrecognised, [input]);
    }
  });
}
