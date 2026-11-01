/* Decorative only. The real project cards, hand interaction and contact actions remain in place. */
const NS='http://www.w3.org/2000/svg';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(hover: hover) and (pointer: fine)');
const states=new Map();
let frame=0;

const spade='<path d="M0-26C-5-18-24-8-24 5A13 13 0 0 0-3 15L-8 28H8L3 15A13 13 0 0 0 24 5C24-8 5-18 0-26Z"/>';
const diamond='<path d="M0-27 20 0 0 27-20 0Z"/>';
function pokerArtwork(){return `<svg xmlns="${NS}" viewBox="0 0 1240 800" preserveAspectRatio="xMidYMid slice" focusable="false">
  <g data-sa-depth style="--sa-depth:.32"><rect class="sa-table-field" x="-94" y="78" width="1450" height="690" rx="345" fill="currentColor"/><rect class="sa-table-rail" x="-58" y="105" width="1378" height="636" rx="318" fill="none" stroke="currentColor" stroke-width="16"/><rect class="sa-table-stitch" x="-38" y="126" width="1338" height="594" rx="297" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="3 9"/><rect class="sa-table-inner" x="2" y="168" width="1258" height="510" rx="255" fill="none" stroke="currentColor" stroke-width="1"/><path class="sa-table-light" d="M50 343C86 221 182 163 328 163H1000C1110 163 1182 217 1218 298" fill="none" stroke="currentColor" stroke-width="2"/></g>
  <g class="sa-back-cards" data-sa-depth style="--sa-depth:1.1">
    <g transform="translate(1002 24) rotate(18 92 126)"><rect class="sa-paper" width="184" height="252" rx="10"/><rect class="sa-card-fold" x="12" y="12" width="160" height="228" rx="5"/><g class="sa-second"><path class="sa-card-rule" d="M28 42H156V210H28Z"/><g class="sa-suit-fill" transform="translate(92 126) scale(1.4)">${spade}</g></g></g>
    <g transform="translate(890 1) rotate(-8 92 126)"><rect class="sa-paper" width="184" height="252" rx="10"/><g class="sa-accent"><g class="sa-suit-fill" transform="translate(34 38) scale(.38)">${diamond}</g><g class="sa-suit-fill" transform="translate(150 214) scale(.38)">${diamond}</g><g class="sa-suit-fill" transform="translate(92 126) scale(1.28)">${diamond}</g></g><path class="sa-card-rule sa-ink" d="M29 73H155M29 179H155"/></g>
  </g></svg>`;}
function conversationArtwork(){return `<svg xmlns="${NS}" viewBox="0 0 1320 640" preserveAspectRatio="xMidYMid slice" focusable="false">
 <g data-sa-depth class="sa-contact-fold sa-third" style="--sa-depth:.5"><path fill="currentColor" d="M954 98 1210 181 1106 306 853 226Z"/><path fill="none" stroke="currentColor" stroke-width="1.2" d="m853 226 202-14 155-31M1055 212l51 94"/></g>
 <g data-sa-depth class="sa-quote-start sa-second" style="--sa-depth:1.1"><path fill="currentColor" d="M90 244c-38 0-67 32-67 83v42h60v-62H53c1-22 16-37 37-43Zm89 0c-38 0-67 32-67 83v42h60v-62h-30c1-22 16-37 37-43Z"/></g>
 <g data-sa-depth class="sa-quote-end sa-accent" style="--sa-depth:.9"><path fill="currentColor" d="M1138 408c38 0 67-32 67-83v-42h-60v62h30c-1 22-16 37-37 43Zm-89 0c38 0 67-32 67-83v-42h-60v62h30c-1 22-16 37-37 43Z"/></g>
 <g data-sa-depth style="--sa-depth:.25"><path class="sa-contact-line sa-second" d="M24 430c161 103 306 118 470 48s315-77 478-9 285 25 364-32"/><path class="sa-contact-line sa-accent" d="M-34 454c186 114 348 116 512 39s328-68 492-4 292 8 368-46"/></g>
 </svg>`;}

function layer(kind,art){const d=document.createElement('div');d.className=`sa-atmosphere sa-${kind}`;d.setAttribute('aria-hidden','true');d.innerHTML=art;return d;}
const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries){const s=states.get(entry.target);if(!s)continue;s.visible=entry.isIntersecting;if(!s.visible){s.tx=0;s.ty=0;s.x=0;s.y=0;s.layer.style.setProperty('--sa-x','0px');s.layer.style.setProperty('--sa-y','0px');}else schedule();}},{rootMargin:'80px 0px',threshold:0}):null;
function schedule(){if(!frame&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(update);}
function update(){frame=0;if(document.hidden||reduced.matches)return;let moving=false;for(const s of states.values()){if(!s.visible||!s.host.isConnected)continue;s.x+=(s.tx-s.x)*.13;s.y+=(s.ty-s.y)*.13;s.layer.style.setProperty('--sa-x',s.x.toFixed(2)+'px');s.layer.style.setProperty('--sa-y',s.y.toFixed(2)+'px');if(Math.abs(s.tx-s.x)+Math.abs(s.ty-s.y)>.06)moving=true;}if(moving)schedule();}
function mount(host,kind,art){if(!host||states.has(host))return;host.classList.add(`sa-${kind==='poker'?'poker':'contact'}-host`);const l=layer(kind,art);host.append(l);const abort=new AbortController();const state={host,layer:l,visible:!observer,x:0,y:0,tx:0,ty:0,abort};states.set(host,state);observer?.observe(host);
 host.addEventListener('pointermove',e=>{if(!state.visible||!fine.matches||reduced.matches)return;const r=host.getBoundingClientRect();state.tx=((e.clientX-r.left)/r.width-.5)*11;state.ty=((e.clientY-r.top)/r.height-.5)*7;schedule();},{passive:true,signal:abort.signal});
 host.addEventListener('pointerleave',()=>{state.tx=0;state.ty=0;schedule();},{passive:true,signal:abort.signal});
 if(kind==='poker')host.addEventListener('click',e=>{if(!e.target.closest('.pk-fan')||reduced.matches)return;host.classList.remove('sa-deal');requestAnimationFrame(()=>host.classList.add('sa-deal'));},{passive:true,signal:abort.signal});
}
function sync(){for(const [host,s]of states){if(!host.isConnected){s.abort.abort();observer?.unobserve(host);states.delete(host);}}mount(document.querySelector('.pgroup-poker'),'poker',pokerArtwork());mount(document.querySelector('#contact'),'correspondence',conversationArtwork());}
function reset(){for(const s of states.values()){s.tx=s.ty=s.x=s.y=0;s.layer.style.setProperty('--sa-x','0px');s.layer.style.setProperty('--sa-y','0px');}if(frame){cancelAnimationFrame(frame);frame=0;}}
function init(){sync();const grid=document.querySelector('#projectGrid');if(grid)new MutationObserver(sync).observe(grid,{childList:true});}
document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
