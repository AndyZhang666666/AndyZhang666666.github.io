// Two original, parameterised compositions. Geometry is the poster's editable content.
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const lines=v=>String(v).split(/<br\s*\/?\s*>|\n/i).slice(0,2);
const measure=s=>[...s].reduce((n,ch)=>n+(/[MW@%&mw]/.test(ch)?1.05:/[A-Z]/.test(ch)?.8:/[\x00-\x7f]/.test(ch)?.66:1),0);
// Balance a long single line before fitting type; explicit line breaks remain the author's choice.
export function balancedLines(value,limit){const rows=lines(value);if(rows.length>1||measure(rows[0])<=limit)return rows;const chars=[...rows[0]],half=measure(rows[0])/2;let width=0,cut=1;for(let i=0;i<chars.length-1;i++){width+=measure(chars[i]);if(width>=half){cut=i+1;break}}return[chars.slice(0,cut).join('').trim(),chars.slice(cut).join('').trim()]}
export const fit=(value,maximum,width)=>Math.min(maximum,Math.floor(width/Math.max(1,measure(value))));
export function directionSvg(room,content){
 const c=room.canvas,swiss=c.artDirection==='swiss',title=balancedLines(content[1],14),subtitle=balancedLines(content[2],28);
 const pal=c.colorMood==='monochrome'?['#fafaf7','#171918','#171918']:c.colorMood==='high_contrast'?(swiss?['#fff','#111','#d52a20']:['#f5ebbb','#142a46','#1748b5']):(swiss?['#f7f6ef','#171918','#bf2c22']:['#eee8dd','#1b1c1b','#b53520']);
 const [paper,ink,accent]=pal,pad={compact:76,balanced:94,airy:116}[c.layoutDensity],size=Math.min(100,Math.floor((900-2*pad)/Math.max(1,...title.map(measure))));
 const family=c.typography==='editorial_serif'?"Georgia,'Songti SC',serif":c.typography==='mono_tech'?"'Courier New',monospace":"Arial,Helvetica,'PingFang SC',sans-serif";
 const titleX=c.alignment==='centered'?450:c.alignment==='asymmetric'?pad+40:pad,anchor=c.alignment==='centered'?'middle':'start';
 const metadata={format:'tasteroom-direction-poster-v1',canvas:c,context:room.context,content:content,kind:'original fictional event poster'};
 const text=(s,x,y,fs,attrs='')=>`<text x="${x}" y="${y}" font-size="${fs}" ${attrs}>${xml(s)}</text>`;
 const titleText=title.map((s,i)=>text(s,titleX,(swiss?315:300)+i*(size*1.15),size,`text-anchor="${anchor}" font-weight="${swiss?700:600}" letter-spacing="-3"`)).join('');
 const subSize=Math.min(25,...subtitle.map(s=>fit(s,25,900-2*pad)));
 const subText=subtitle.map((s,i)=>text(s,pad,565+i*39,subSize)).join('');
 let art='';
 if(c.decorElements!=='none'){
  if(swiss)art=c.decorElements==='minimal_lines'?`<g stroke="${accent}" stroke-width="2"><path d="M${pad} 720H${900-pad}M${pad} 820H${900-pad}M${pad} 920H${900-pad}"/></g>`:`<g fill="${accent}"><rect x="${pad}" y="710" width="350" height="330"/><path d="M${pad+375} 1040V710A330 330 0 0 1 ${pad+705} 1040Z"/></g><circle cx="${pad+175}" cy="875" r="112" fill="${paper}"/>`;
  else art=c.decorElements==='minimal_lines'?`<g stroke="${accent}" stroke-width="3" transform="rotate(-12 450 860)"><path d="M50 755H850M50 812H850M50 870H850"/></g>`:`<g transform="rotate(-12 450 870)"><rect x="20" y="735" width="850" height="220" fill="${ink}"/><circle cx="618" cy="830" r="172" fill="${accent}"/><path d="M100 660L390 1060M150 640L440 1040" stroke="${paper}" stroke-width="24"/><rect x="390" y="720" width="24" height="300" fill="${paper}"/></g>`;
 }
 const top=swiss?text(content[0],pad,92,fit(content[0],23,900-2*pad-245))+text('TasteRoom / Studio',900-pad,92,20,'text-anchor="end"')+`<path d="M${pad} 126H${900-pad}" stroke="${ink}" stroke-width="1"/>`:text('TasteRoom — 原创构图',pad,90,22)+text(content[0],810,180,fit(content[0],22,490),'transform="rotate(90 810 180)"');
 const titles=swiss?titleText:`<g transform="rotate(-6 ${titleX} 300)">${titleText}</g><path d="M${pad} 470L${900-pad} 430" stroke="${accent}" stroke-width="8"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${xml((swiss?'瑞士现代主义':'解构主义')+'：'+title.join(' '))}"><title>${xml(title.join(' '))}</title><desc>原创虚构活动；当前构图、字体、留白、对齐、色彩与装饰均由画布参数决定。不是模型生成的图片。</desc><metadata>${xml(JSON.stringify(metadata))}</metadata><rect width="900" height="1200" fill="${paper}"/><g fill="${ink}" font-family="${family}">${top}${titles}${subText}${art}${text(content[3],pad,1125,fit(content[3],22,900-2*pad))}${text(swiss?'International / Grid':'Form / Fragment',900-pad,1160,18,'text-anchor="end"')}</g></svg>`;
}
