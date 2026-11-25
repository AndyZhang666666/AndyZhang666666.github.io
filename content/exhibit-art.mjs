import fs from 'node:fs';
import {escapeHtml as escape} from '../assets/project-cards.mjs';
import {bundleFixture} from './preview-markup.mjs';
import {breakEvenAdoption, simulateOne} from '../assets/demo-preview/bundle-model.mjs';
import {ragDefault} from './new-work-previews.mjs';
import {createTastePreview, posterContent} from '../assets/demo-preview/taste-session.mjs';
import {directionSvg} from '../tasteroom/directions.js';

const sample = JSON.parse(fs.readFileSync(new URL('../assets/demo-preview/eval-sample.json', import.meta.url)));
const label = (zh, en) => `<span data-zh="${escape(zh)}" data-en="${escape(en)}">${escape(zh)}</span>`;
const actions = {
  trust: ['核对这句评语', 'Review the citation'],
  taste: ['试排这张海报', 'Try a composition'],
  bundles: ['调一次采纳率', 'Try an adoption rate'],
  rag: ['换个日期查条款', 'Try another date']
};

function proofSheet() {
  const excerpt = sample.text.split('\n').slice(1, 4);
  return `<span class="print-proof"><span class="proof-manuscript"><small>${label('病历悬念 · 截断稿', 'Medical file · excerpt')}<b>${escape(sample.sampleId)}</b></small><span class="proof-lines" lang="zh-CN">${excerpt.map(line=>`<span>${escape(line)}</span>`).join('')}</span><mark lang="zh-CN">${escape(sample.dimension.evidence[0])}</mark></span><span class="proof-score"><small>${label('结构评分', 'Structure')}</small><b>${sample.dimension.score}<i>/5</i></b></span></span>`;
}
function posterPair() {
  const make = direction => directionSvg(createTastePreview(direction).room, posterContent);
  return `<span class="print-pair"><span>${make('deconstructed')}</span><span>${make('swiss')}</span></span>`;
}
function receipt() {
  const c = bundleFixture.candidate, threshold = breakEvenAdoption(c).rate, rate = .05;
  const result = simulateOne({...c, adoption:rate});
  return `<span class="print-receipt"><small>${label('可乐 ＋ 鸡腿饭', 'Cola + chicken rice')}<b>¥${c.bundleP.toFixed(2)}</b></small><strong>${(threshold*100).toFixed(1)}<i>%</i></strong><span class="paper-caption">${label('模型平衡采纳率', 'Break-even adoption')}</span><span class="paper-total"><span>${label('采纳率 5% · 净增毛利 / 单', 'At 5% adoption · net per order')}</span><b>−¥${Math.abs(result.marginLift).toFixed(3)}</b></span></span>`;
}
function policyFile() {
  const citation = ragDefault.citations[0], value = ragDefault.facts[0].value;
  return `<span class="print-file"><i></i><span class="policy-sheet"><small>${label('显示器借用规则', 'Monitor loan policy')}<b>v${escape(citation.version)}</b></small><strong>${escape(value.match(/\d+/)[0])}<em>${label('天', 'days')}</em></strong><span class="paper-caption">${label('单次最长借用', 'Maximum loan period')}</span><span class="paper-source">${escape(citation.id)} <span>${escape(citation.effectiveFrom)}</span></span></span></span>`;
}
const artwork = {trust:proofSheet,taste:posterPair,bundles:receipt,rag:policyFile};

export function exhibitSheet(item, panel) {
  const id=escape(item.id);
  return `<details class="print-sheet" id="print-${id}" data-sheet="${id}"><summary class="print-cover">
    <span class="print-copy"><span class="print-folio"></span><strong class="print-name">${label(item.label.zh,item.label.en)}</strong><span class="print-question">${label(item.question.zh,item.question.en)}</span><span class="print-action"><span class="when-folded">${label(...actions[id])}</span><span class="when-open">${label('收起试玩','Close preview')}</span><b aria-hidden="true"></b></span></span>
    <span class="print-art" aria-hidden="true">${artwork[id]()}</span></summary>${panel}</details>`;
}
