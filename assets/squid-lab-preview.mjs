const english=()=>document.documentElement.lang.startsWith('en');
const words=(el,zh,en)=>{el.dataset.zh=zh;el.dataset.en=en;el.textContent=english()?en:zh;return el;};
function languageLinks(){for(const a of document.querySelectorAll('a[href^="/poker-squid-lab/"]')){const url=new URL(a.href);url.searchParams.set('lang',english()?'en':'zh');a.href=url.pathname+url.search+url.hash;}}
async function start(){languageLinks();new MutationObserver(languageLinks).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 let data;try{const r=await fetch(new URL('./squid-lab-preview.json',import.meta.url));if(!r.ok)return;data=await r.json();if(data.version!==1||data.players!==6||data.unit!==5||!data.question?.options.includes(data.question.answer))return;}catch{return;}
 const mount=()=>{const card=document.querySelector('#project-squid-lab .project-card-inner');if(!card)return false;if(card.querySelector('.squid-quick'))return true;
 const box=document.createElement('div');box.className='squid-quick';box.append(words(document.createElement('p'),'试一题：六人有限鱿鱼，每份 5BB。你最后没标记，一共付多少？','Try one: six-player finite squid, 5BB per recipient. As the last unmarked player, what do you pay?'));
 const actions=document.createElement('div'),output=document.createElement('p');actions.className='squid-quick-actions';output.className='squid-quick-answer';output.setAttribute('role','status');
 for(const value of data.question.options){const button=document.createElement('button');button.type='button';button.textContent=value+'BB';button.addEventListener('click',()=>{words(output,value===data.question.answer?'对，向其余五人各付 5BB，共 25BB。':'向其余五人各付 5BB，共 25BB。再到完整工具看看无限模式。',value===data.question.answer?'Yes: 5BB to each of the other five, 25BB total.':'Pay each of the other five 5BB, 25BB total. Explore infinite mode in the full app.');for(const b of actions.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));});actions.append(button);}
 box.append(actions,output);const links=card.querySelector('.project-links');card.insertBefore(box,links);return true;};
 if(!mount()){const root=document.getElementById('projectGrid');if(root){const observer=new MutationObserver(()=>{if(mount()){observer.disconnect();languageLinks();}});observer.observe(root,{childList:true,subtree:true});}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
