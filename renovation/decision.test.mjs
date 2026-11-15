import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const setup=source.slice(0,source.indexOf('function render('));

function model(stored=null){
  const context=vm.createContext({localStorage:{getItem:()=>stored}});
  vm.runInContext(setup,context);
  return expression=>vm.runInContext(expression,context);
}
test('Unknown, zero and confirmed fees are distinct',()=>{
  const run=model();
  assert.match(run("decision(rooms.sofa,state.sofa).cost"),/总价待定/);
  run("state.sofa.space='240';state.sofa.fees[0]='0'");
  assert.match(run("decision(rooms.sofa,state.sofa).cost"),/到家 ¥3680/);
  assert.match(run("decision(rooms.sofa,state.sofa).fit"),/余量 0 厘米/);
  run("state.sofa.fees[0]='220';state.sofa.space='239.9'");
  assert.match(run("decision(rooms.sofa,state.sofa).title"),/超出/);
  assert.match(run("decision(rooms.sofa,state.sofa).cost"),/到家 ¥3900/);
});
test('Saved handoff stays fixed; switching candidates retains only their own fee',()=>{
  const run=model();
  run("state.sofa.space='246';state.sofa.fees[0]='220';state.sofa.saved=decision(rooms.sofa,state.sofa).text;state.sofa.pick=1");
  assert.match(run("decision(rooms.sofa,state.sofa).cost"),/待定/);
  assert.match(run("state.sofa.saved"),/到家 ¥3900/);
  const next=model(run('JSON.stringify(state)'));
  assert.equal(next('state.sofa.pick'),1);
  assert.equal(next('state.table.space'),'');
  assert.match(next('state.sofa.saved'),/云棉/);
});
test('Invalid drafts and unsupported precision do not produce totals',()=>{
  const run=model('broken');
  assert.equal(run('state.room'),'sofa');
  for(const entry of ['-2','1.111','100000',''])assert.equal(run('numeric('+JSON.stringify(entry)+',0,99999,100)'),null);
});
