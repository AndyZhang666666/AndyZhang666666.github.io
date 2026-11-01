// A local teaching question; the complete exercise and its range live in Poker Lab.
const english=()=>document.documentElement.lang.startsWith('en');
function words(element,zh,en){element.dataset.zh=zh;element.dataset.en=en;element.textContent=english()?en:zh;return element;}
async function init(){
  let scene;
  try{
    const response=await fetch(new URL('./poker-lab-preview.json',import.meta.url));
    if(!response.ok)return;
    scene=await response.json();
    if(scene.position!=='BTN'||scene.hand!=='A2o'||scene.openFrequency!==1)return;
  }catch{return;}
  const mount=()=>{
    const caption=document.querySelector('.pgroup-poker .pk-fan-cap');
    if(!caption)return false;
    if(caption.querySelector('.pk-lab-quick'))return true;
    const box=document.createElement('div');box.className='pk-lab-quick';
    const suits={c:'♣',d:'♦',h:'♥',s:'♠'};
    const cards=scene.cards.map(card=>card[0]+suits[card[1]]).join('');
    const prompt=words(document.createElement('p'),'试一手：按钮位 '+cards+'，前面均弃牌。','Try one: BTN '+cards+', folded to you.');
    const hint=words(document.createElement('small'),'六人桌 · 100bb · 教学参考','6-max · 100bb · Teaching reference');
    const actions=document.createElement('div');actions.className='pk-lab-actions';
    const output=document.createElement('p');output.className='pk-lab-answer';output.setAttribute('role','status');
    const fold=words(document.createElement('button'),'弃牌','Fold');
    const raise=words(document.createElement('button'),'加注开池','Open raise');
    const again=words(document.createElement('button'),'再试一次','Try again');again.hidden=true;
    for(const button of [fold,raise,again])button.type='button';
    const answer=action=>{
      words(output,action==='raise'?'符合本题参考：按钮位范围纳入 A2o。':'这题参考选择加注：按钮位范围纳入 A2o。',
        action==='raise'?'Matches this reference: the BTN chart includes A2o.':'This reference raises: the BTN chart includes A2o.');
      fold.disabled=raise.disabled=true;again.hidden=false;
    };
    fold.addEventListener('click',()=>answer('fold'));raise.addEventListener('click',()=>answer('raise'));
    again.addEventListener('click',()=>{output.textContent='';delete output.dataset.zh;delete output.dataset.en;fold.disabled=raise.disabled=false;again.hidden=true;});
    const link=words(document.createElement('a'),'进入范围训练 →','Continue to range practice →');
    link.href='/poker-ev-calculator/#practice';
    const note=words(document.createElement('small'),'按给定范围练习；参考范围可在完整工具里修改。','Practise a given reference; edit the chart in the full app.');
    actions.append(fold,raise,again,link);box.append(prompt,hint,actions,output,note);caption.append(box);return true;
  };
  if(mount())return;
  const root=document.getElementById('projectGrid');
  if(root){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(root,{childList:true,subtree:true});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
