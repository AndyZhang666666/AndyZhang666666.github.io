import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCorpus} from '../server/corpus.mjs';
import {retrieveRun} from '../engine.mjs';
const docs=await loadCorpus();
const ask=(question,role='employee')=>retrieveRun(docs,{question,date:'2026-10-28',snapshot:'baseline'},role);
for(const [q,id,value] of [
 ['显示器丢了多久内要报告？','LOSS-1:p1','24小时'],
 ['笔记本弄丢了几小时内报告？','LOSS-1:p1','24小时'],
 ['显示器续借能有几次，多久申请？','REN-1:p1','1次'],
 ['设备归还地点在哪里？','RET-1:p1','青屿工作室一楼设备台'],
 ['耳机归还前怎么清理擦拭？','HYG-1:p1','清洁耳罩'],
 ['显示器借用按自然日还是工作日算？','MON-2:p2','自然日'],
 ['显示器能借多长时间？','MON-2:p1','14天'],
 ['设备采购审批上限多少钱？','ADM-BUD-1:p1','3000元'],
]) test(`specific rule: ${q}`,()=>{const r=ask(q,q.includes('采购')?'admin':'employee'); assert.equal(r.status,'answered');assert.ok(r.citations.some(c=>c.id===id));assert.ok(r.facts.some(f=>f.value===value));});
test('exclusion explanation is scoped and distinguishes unused evidence',()=>{
 const r=ask('显示器最长能借多久？');
 assert.ok(r.excluded.some(e=>e.id==='MON-1'&&e.reason==='已过期失效'));
 assert.ok(r.excluded.some(e=>e.id==='MON-3'&&e.reason==='非当前快照'));
 assert.ok(r.excluded.some(e=>e.id==='INJ-1:p1'&&e.kind==='evidence'));
 assert.ok(!JSON.stringify(r).includes('ADM-'));
 assert.ok(r.excluded.every(e=>!r.citations.some(c=>c.id===e.id)));
});
