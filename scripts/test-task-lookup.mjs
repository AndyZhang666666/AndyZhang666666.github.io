import assert from 'node:assert/strict';
import {tasks} from '../content/task-portfolio.mjs';
import {lookup} from '../assets/task-search.mjs';
for(const task of tasks.slice(0,4)){
  for(const example of task.title)assert.equal(lookup(example).items[0].task.id,task.id);
}
const mixed=lookup('模型评测；套餐毛利；线上搜索排序实验；海底种植');
assert.deepEqual(mixed.items.map(item=>item.task.id).sort(),['bundle','eval','rag']);
assert.deepEqual(mixed.limitations,['线上搜索排序实验']);
assert.deepEqual(mixed.missing,['海底种植']);
assert.deepEqual(lookup('online search ranking experiments').items.map(item=>item.task.id),['rag']);
assert.equal(lookup('商品推荐；触达').items.length,2);
assert.equal(lookup('核对财报').items[0].task.id,'filing');
assert.equal(lookup('evaluate a transaction in Prague').items.length,0);
console.log('Task evidence checks passed');
