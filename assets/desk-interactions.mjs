import {isEnglish,download} from '../studio/ui.mjs';
import {initialMenu,menuSheet,initialBill,billSheet,sampleTicket} from './desk-samples.mjs';

export function mountSample(node) {
  const menu=node.dataset.sample==='menu';
  let state=menu?initialMenu():initialBill();
  const render=()=>{node.innerHTML=menu?menuSheet(state,isEnglish()):billSheet(state,isEnglish());};
  function update(patch,focus) {
    state={...state,...patch};render();
    if(focus)node.querySelector(focus)?.focus({preventScroll:true});
  }
  node.dataset.enhanced='true';
  node.addEventListener('submit',event=>{
    if(!event.target.matches('[data-menu-form]'))return;
    event.preventDefault();
    const query=event.target.elements.query.value.trim();
    if(query)update({query,used:true,example:0},'[name=query]');
  });
  node.addEventListener('change',event=>{
    if(event.target.matches('[data-bill-shot]'))update({shot:Number(event.target.value)},'[data-bill-shot]');
    if(event.target.matches('[data-bill-day]'))update({late:event.target.value==='late'},'[data-bill-day]');
  });
  node.addEventListener('click',event=>{
    const trigger=event.target.closest('button[data-desk-act]');if(!trigger)return;
    const action=trigger.dataset.deskAct;
    if(action==='ticket'){
      const en=isEnglish();
      const filename=menu?(en?'menu-ticket':'搜索票根'):(en?'credit-ticket':'积分票根');
      download(filename+'.html',sampleTicket(menu?'menu':'credits',state,en),'text/html;charset=utf-8');return;
    }
    let focus='[data-desk-act="'+action+'"]';
    if(menu){
      if(action==='next-example')update({example:state.example+1},focus);
      else if(['literal','alias','wide'].includes(action)){
        const query=node.querySelector('[name=query]').value.trim()||state.query;
        update({rule:action,query,example:0,used:true},focus);
      }
    }else if(action==='reserve')update({step:1},'[data-bill-shot]');
    else if(action==='settle')update({step:2,selected:state.shot},'[data-desk-act="shot-'+state.shot+'"]');
    else if(action==='reset-bill')update(initialBill(),'[data-desk-act="reserve"]');
    else if(/^shot-[123]$/.test(action))update({selected:Number(action.slice(-1))},focus);
  });
  render();
  return ()=>{const draft=node.querySelector('[name=query]')?.value;render();if(draft!==undefined)node.querySelector('[name=query]').value=draft;};
}
