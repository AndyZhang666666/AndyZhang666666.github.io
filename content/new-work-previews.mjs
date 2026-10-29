import fs from 'node:fs';
import {escapeHtml as e} from '../assets/project-cards.mjs';
import {retrieveRun} from '../rag-lab/engine.mjs';

const text=(tag,cls,zh,en)=>`<${tag} class="${cls}" data-zh="${e(zh)}" data-en="${e(en)}">${e(zh)}</${tag}>`;
const json=(id,value)=>`<script type="application/json" id="${id}">${JSON.stringify(value).replace(/</g,'\\u003c')}</script>`;
const path=steps=>`<ol class="preview-path">${steps.map(([zh,en])=>`<li>${text('span','',zh,en)}</li>`).join('')}</ol>`;
const source=JSON.parse(fs.readFileSync(new URL('../agent-bench/samples/examples.json',import.meta.url)));
// A projection of existing program-run records, never a fabricated run or a new tool call.
export const executionFixture=source.pairs.timeout.map(record=>({
 policy:record.run.policy,state:record.run.state,case:record.run.case,operationId:record.run.operation_id,
 reply:record.run.reply,ticket:record.ticket,initial:record.initial,versions:record.run.versions,
 events:record.events.filter(event=>['submit_change','operation_status'].includes(event.name)),
 operations:record.operations,checks:record.evaluation.checks,
}));
const recovered=executionFixture.find(record=>record.policy==='hardened');
const base=executionFixture.find(record=>record.policy==='baseline');
const status=recovered.events.find(event=>event.name==='operation_status');
export function execution(){
 return `${path([['提交后超时','Timeout after submission'],['查原操作','Look up the same operation'],['核对最终状态','Check final state']])}
 <div class="preview-execution"><div class="execution-task">${text('span','preview-record','工单 T102 · 已人工批准的变更','Ticket T102 · Change approved by a person')}${text('p','',recovered.case.task,'Move T102 to after-sales, add one follow-up note, and keep the ticket open.')}</div>
 <div class="execution-response"><code>submit_change → TIMEOUT</code>${text('p','','没有收到提交回执；结果需查询原操作。','No submission receipt. The original operation needs checking.')}</div>
 <div class="execution-fork"><div>${text('span','preview-record','基础策略 · 到此停止','Baseline · Stops here')}<strong>unknown</strong>${text('p','','回复未知，不等于写入失败。','An unknown result does not mean the write failed.')}</div><div>${text('span','preview-record','恢复策略 · 已保存的执行记录','Recovery · Saved execution record')}<button type="button" data-agent-check disabled aria-expanded="false" aria-controls="executionRecovery">${text('span','','展开原操作的核对结果','Inspect the original operation')}</button></div></div>
 <div id="executionRecovery" class="execution-recovery" data-agent-result hidden><div class="execution-commit"><code>operation_status → ${e(status.result.status)}</code>${text('span','','同一操作标识，没有再次提交','Same operation ID. No second submission.')}</div><dl class="execution-final"><div>${text('dt','','业务提交','Committed operations')}<dd>${recovered.operations.length}</dd></div><div>${text('dt','','新增记录','Added notes')}<dd>${recovered.ticket.notes.length}</dd></div><div>${text('dt','','工单状态','Ticket state')}<dd>${e(recovered.ticket.status)}</dd></div></dl>${text('p','',recovered.reply.summary,'Moved to after-sales, one note added, ticket left open.')}<details><summary>${text('span','','展开记录依据','Inspect record evidence')}</summary><p><code>${e(recovered.operationId)}</code></p>${text('p','',`基础策略的最终数据库也已有 ${base.ticket.notes.length} 条记录；它只是没有完成结果核对。`,'The baseline database also contains one note. Its result reconciliation was incomplete.')}<p>${e(recovered.checks.find(check=>check.label==='没有重复业务效果').detail)}</p><a href="/agent-bench/samples/timeout-hardened.json" target="_blank" rel="noopener" data-zh="查看完整程序记录 ↗" data-en="Open the complete program record ↗">查看完整程序记录 ↗</a></details></div></div>
 <p class="preview-outcome" data-agent-status role="status">${text('span','','先看回执，再查真实状态。这里展开已有记录，不会执行工具或写入工单。','A receipt is only one signal. Inspect the saved state; this preview executes no tools and writes no tickets.')}</p>${json('executionPreviewRecord',executionFixture)}`;
}

const publicCorpus=JSON.parse(fs.readFileSync(new URL('../rag-lab/public-corpus.json',import.meta.url)));
const initial=retrieveRun(publicCorpus.documents,{question:'显示器可以借多久？',date:'2026-10-28',snapshot:'baseline',generation:'extractive'},'employee','original-example');
// Only stable answer fields are rendered. Random run IDs/timings never enter generated HTML.
export const ragDefault={date:initial.date,snapshot:initial.snapshot,answer:initial.answer,citations:initial.citations,facts:initial.facts};
export function rag(){
 const cite=initial.citations[0];
 return `${path([['确定适用条件','Set the scope'],['重新检索','Search again'],['核对原文','Inspect the source']])}
 <div class="preview-rag"><p class="rag-question" data-zh="显示器可以借多久？" data-en="How long may I borrow a monitor?">显示器可以借多久？</p><div class="preview-segment rag-conditions" role="group" aria-label="选择检索条件">${[['present','现行示例','Current example'],['historic','历史日期','Historical date'],['revised','修订快照','Revised snapshot']].map(([id,zh,en],i)=>`<button type="button" data-rag-scope="${id}" aria-pressed="${i===0}" disabled>${text('span','',zh,en)}</button>`).join('')}</div>
 <div class="rag-search-row">${text('p','','选择条件后，点击重新查找；旧答案不会冒充新结果。','Choose a scope, then search again. An old answer is not a new result.')}<button type="button" data-rag-run disabled>${text('span','','按新条件重新查找','Search with the new scope')}</button></div>
 <div class="rag-answer" data-rag-answer data-stale="false"><p class="rag-answer-scope" data-rag-result-scope>2026-10-28 · baseline · employee</p><div class="rag-answer-head"><strong data-rag-days>14<span data-zh="天" data-en=" days">天</span></strong>${text('span','','单次借用上限','Maximum loan period')}</div><p data-rag-answer-text>${e(initial.answer)}</p><details class="rag-evidence" data-rag-evidence><summary><span data-zh="核对依据" data-en="Inspect evidence">核对依据</span><code data-rag-citation>${e(cite.id)} · v${e(cite.version)}</code></summary><blockquote data-rag-quote>${e(cite.text)}</blockquote><p data-rag-effective>v${e(cite.version)} · ${e(cite.effectiveFrom)} 起生效</p></details></div></div>
 <p class="preview-outcome" data-rag-status role="status">${text('span','','当前示例：2026-10-28 / 原始资料快照。浏览器执行 BM25 检索与规则摘录，无模型调用。','Example scope: 2026-10-28 / baseline snapshot. Browser BM25 retrieval and rule extraction; no model call.')}</p>`;
}
