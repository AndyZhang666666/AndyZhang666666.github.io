import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {findEvidence} from '../assets/evidence-core.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
// These historical job descriptions remain regression inputs after the preset UI changed.
const growth = "岗位职责：负责 App 的用户增长与商业化变现，包括订阅付费转化、ARPU 提升、会员权益设计；通过埋点数据分析做转化漏斗归因，设计并执行 A/B 实验；与运营、算法协同优化推荐与触达策略。任职要求：有 C 端增长或商业化经验，熟悉 SQL，有金融或支付业务理解优先。";
const strategy = [null, "优化商品推荐与用户触达策略；用 A/B 实验观察转化和留存；与算法团队协作验证搜索排序模型。", "Improve product recommendations and user outreach; use A/B tests to assess conversion and retention; collaborate with the algorithms team to validate search ranking models."];
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
