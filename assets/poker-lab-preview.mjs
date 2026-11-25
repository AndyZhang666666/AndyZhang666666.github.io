// A local teaching question; the complete exercise and its range live in Poker Lab.
const english=()=>document.documentElement.lang.startsWith('en');
function words(element,zh,en){element.dataset.zh=zh;element.dataset.en=en;element.textContent=english()?en:zh;return element;}
async function init(){
  let deals;
  try{
    const response=await fetch(new URL('./poker-deals.json',import.meta.url));
    if(!response.ok)return;
    deals=(await response.json()).records;if(!deals?.length)return;
  }catch{return;}
  const mount=()=>{
    const caption=document.querySelector('.pgroup-poker .pk-fan-cap');
    if(!caption)return false;
    const group=caption.closest('.pgroup-poker');group.id='poker-table';
    if(location.hash==='#poker-table')requestAnimationFrame(()=>group.scrollIntoView({block:'start',behavior:'instant'}));
    if(caption.querySelector('.pk-lab-quick'))return true;
    const box=document.createElement('div');box.className='pk-lab-quick';
    const suits={c:'♣',d:'♦',h:'♥',s:'♠'};
    const prompt=document.createElement('p'),fan=caption.closest('.pk-fan-wrap');
    const positions={BTN:'按钮位',UTG:'枪口位',CO:'关煞位'};
    let index=0,scene=deals[0];
    const hint=words(document.createElement('small'),'六人桌 · 100bb · 教学参考','6-max · 100bb · Teaching reference');
    const actions=document.createElement('div');actions.className='pk-lab-actions';
    const output=document.createElement('p');output.className='pk-lab-answer';output.setAttribute('role','status');
    const fold=words(document.createElement('button'),'弃牌','Fold');
    const raise=words(document.createElement('button'),'加注开池','Open raise');
    const again=words(document.createElement('button'),'再试一次','Try again');again.hidden=true;
    for(const button of [fold,raise,again])button.type='button';
    const answer=action=>{
      const yes=scene[action],word=scene.raise?'加注':'弃牌',eng=scene.raise?'raise':'fold';
      words(output,(yes?'选对了。':'本题参考为'+word+'。')+positions[scene.position]+'的给定范围'+(scene.raise?'纳入 ':'未纳入 ')+scene.hand+'。',
        (yes?'Matches this reference. ':'The reference would '+eng+'. ')+scene.position+(scene.raise?' opens ':' folds ')+scene.hand+'.');
      fold.disabled=raise.disabled=true;again.hidden=false;
    };
    fold.addEventListener('click',()=>answer('fold'));raise.addEventListener('click',()=>answer('raise'));
    again.addEventListener('click',()=>{output.textContent='';delete output.dataset.zh;delete output.dataset.en;fold.disabled=raise.disabled=false;again.hidden=true;});
    function deal(){
      scene=deals[index];const pretty=scene.cards.map(c=>c[0]+suits[c[1]]);
      words(prompt,'试一手：'+positions[scene.position]+' '+pretty.join('')+'，前面均弃牌。','Try one: '+scene.position+' '+pretty.join('')+', folded to you.');
      const cards=[...fan.querySelectorAll('.pk-card-face')];
      cards.forEach((c,i)=>{
        c.classList.toggle('cover-card-back',i<3);
        if(i<3)return;
        const card=scene.cards[i-3],suit=suits[card[1]],rank=card[0];
        c.classList.toggle('red',suit==='♥'||suit==='♦');
        c.innerHTML='<span class="pk-rank">'+rank+'<small>'+suit+'</small></span><span class="pk-pip">'+suit+'</span><span class="pk-rank flip">'+rank+'<small>'+suit+'</small></span>';
      });
      const dealer=fan.querySelector('.pk-fan');dealer.setAttribute('aria-label','换一手训练牌 / Deal another practice hand');
      words(fan.querySelector('.pk-fan-line'),positions[scene.position]+'，轮到你行动。',scene.position+' · Your action.');
      fan.dataset.hand=scene.hand;output.replaceChildren();delete output.dataset.zh;delete output.dataset.en;fold.disabled=raise.disabled=false;again.hidden=true;
    }
    const next=words(document.createElement('span'),'换一手牌 ↻','Deal another hand ↻');next.className='pk-deal-caption';fan.querySelector('.pk-fan').append(next);
    fan.addEventListener('portfolio:deal',e=>{e.preventDefault();index=(index+1)%deals.length;deal();});deal();
    const link=words(document.createElement('a'),'进入范围训练 →','Continue to range practice →');
    link.href='/poker-ev-calculator/#practice';
    const note=words(document.createElement('small'),'按给定范围练习；参考范围可在完整工具里修改。','Practise a given reference; edit the chart in the full app.');
    actions.append(fold,raise,again,link);box.append(prompt,hint,actions,output,note);caption.append(box);return true;
  };
  if(mount())return;
  const root=(document.getElementById('pokerStage') || document.getElementById('projectGrid'));
  if(root){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(root,{childList:true,subtree:true});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
