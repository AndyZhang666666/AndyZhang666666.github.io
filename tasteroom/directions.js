// Original compositions. Each direction owns its geometry; previews and exports share this renderer.
export const DIRECTIONS = {
 swiss:{name:'瑞士现代主义',detail:'清晰层级 / 理性网格',capacity:'标题 2–3 行 · 信息清楚时最有力量',use:'分享会、公开招募',paper:'#f4f2e9',ink:'#191d1c',accent:'#c43c29'},
 deconstructed:{name:'解构主义',detail:'错位叠压 / 有意打破秩序',capacity:'短标题更好 · 构图张力优先',use:'音乐、创意活动',paper:'#eee9df',ink:'#202320',accent:'#b93a27'},
 editorial:{name:'编辑杂志',detail:'刊物标题 / 分栏阅读',capacity:'标题 2–4 行 · 适合较多说明',use:'文化分享、读书会',paper:'#f3efe6',ink:'#292d29',accent:'#6f4937'},
 bauhaus:{name:'包豪斯几何',detail:'原色形体 / 非对称平衡',capacity:'短标题 · 留出几何主视觉',use:'设计展、创作工作坊',paper:'#f0e6cf',ink:'#252720',accent:'#b93729'},
 japanese:{name:'日式留白',detail:'小字距 / 大面积呼吸',capacity:'标题 2–3 行 · 少量文字更合适',use:'散步、茶会、生活活动',paper:'#f4f3eb',ink:'#343c35',accent:'#7d4537'},
 risograph:{name:'双色印刷',detail:'套印叠色 / 手作质感',capacity:'标题 2–3 行 · 适合鲜明短句',use:'市集、独立出版、展映',paper:'#f1e7cc',ink:'#173d5d',accent:'#d04c43'},
};
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const measure=s=>[...s].reduce((n,ch)=>n+(/[MW@%&mw]/.test(ch)?1.05:/[A-Z]/.test(ch)?.8:/[\x00-\x7f]/.test(ch)?.66:1),0);
export const fit=(value,maximum,width)=>Math.min(maximum,Math.floor(width/Math.max(1,measure(value))));
export function balancedLines(value,limit,maxLines=2){
 const source=String(value).split(/<br\s*\/?\s*>|\n/i);
 if(source.length>1||measure(source[0])<=limit)return source;
 const count=Math.min(maxLines,Math.ceil(measure(source[0])/limit)),target=measure(source[0])/count;
 const rows=[];let row='',width=0;for(const ch of [...source[0]]){if(width>=target&&rows.length<count-1){rows.push(row.trim());row='';width=0}row+=ch;width+=measure(ch)}if(row)rows.push(row.trim());return rows;
}
export function layoutStatus(room,content){
 const settings=room.posterSettings||{},manual=settings.lineBreaks==='manual';
 const title=manual?String(content[1]).split(/<br\s*\/?\s*>|\n/i):balancedLines(content[1],12,4);
 const subtitle=manual?String(content[2]).split(/<br\s*\/?\s*>|\n/i):balancedLines(content[2],29,4);
 const density=room.canvas.layoutDensity,pad={compact:68,balanced:86,airy:108}[density]||86;
 const usable=(room.canvas.artDirection==='japanese'?570:900-pad*2)-(room.canvas.alignment==='asymmetric'?35:0);
 const scale=Math.min(1.3,Math.max(.65,Number(settings.titleScale)||1));
 const max={swiss:100,deconstructed:100,editorial:94,bauhaus:93,japanese:79,risograph:105}[room.canvas.artDirection]||90;
 const size=Math.min(max*scale,...title.map(s=>fit(s,max*scale,usable)));
 const subtitleSize=Math.min(25,...subtitle.map(s=>fit(s,25,900-pad*2)));
 const issues=[];if(title.length>4)issues.push('标题超过四行，请减少换行或启用自动换行');if(subtitle.length>4)issues.push('副文案超过四行');if(size<28)issues.push('标题过密，字号低于可读下限，请减少文字或增加换行');if(subtitleSize<14)issues.push('副文案过密，请减少文字或增加换行');
 const top={swiss:278,deconstructed:290,editorial:300,bauhaus:715,japanese:420,risograph:282}[room.canvas.artDirection]||320;
 const lower={swiss:570,deconstructed:600,editorial:650,bauhaus:960,japanese:800,risograph:600}[room.canvas.artDirection]||590;
 const gap={swiss:85,deconstructed:95,editorial:130,bauhaus:55,japanese:135,risograph:100}[room.canvas.artDirection]||80;
 const subBottom=Math.max(lower,top+(title.length-1)*size*1.12+gap)+(subtitle.length-1)*36;
 if(subBottom>1085)issues.push('内容已接近落款区域，请缩小字号、减少文字或换一种构图');
 if(room.canvas.artDirection==='bauhaus' && title.length>3)issues.push('这套几何构图最多适合三行标题，请换成编辑杂志或缩短文字');
 return {title,subtitle,pad,size,subtitleSize,subBottom,issues,ok:issues.length===0};
}
export function directionSvg(room,content){
 const c=room.canvas,id=Object.hasOwn(DIRECTIONS,c.artDirection)?c.artDirection:'swiss',d=DIRECTIONS[id],l=layoutStatus(room,content);
 const [paper,ink,accent]=c.colorMood==='monochrome'?[d.paper,d.ink,d.ink]:c.colorMood==='high_contrast'?[id==='risograph'?'#ffe8b0':'#fff',d.ink,d.accent]:[d.paper,d.ink,d.accent];
 const sans="Arial,Helvetica,'PingFang SC',sans-serif",serif="Georgia,'Songti SC',serif",mono="'Courier New',monospace";
 const family=c.typography==='editorial_serif'?serif:c.typography==='mono_tech'?mono:sans;
 const text=(s,x,y,fs,attrs='')=>`<text x="${x}" y="${y}" font-size="${fs}" ${attrs}>${xml(s)}</text>`;
 const {pad:p,size,subtitleSize:ss}=l,center=c.alignment==='centered',x=center?450:c.alignment==='asymmetric'?p+35:p,anchor=center?'middle':'start';
 const title=(y,attrs='')=>l.title.map((s,i)=>text(s,x,y+i*size*1.12,size,`text-anchor="${anchor}" ${attrs}`)).join('');
 const sub=(y,attrs='')=>l.subtitle.map((s,i)=>text(s,x,y+i*36,ss,`text-anchor="${anchor}" ${attrs}`)).join('');
 const line=(y,color=ink)=>`<path d="M${p} ${y}H${900-p}" stroke="${color}" stroke-width="1"/>`;
 const category=text(content[0],p,87,fit(content[0],22,900-p*2-140));
 const footer=text(content[3],p,1123,fit(content[3],22,900-p*2));
 const decor=c.decorElements!=='none',bold=c.decorElements==='bold_shapes';
 const safeTitleBottom=y=>y+Math.max(0,l.title.length-1)*size*1.12;
 let body='';
 if(id==='swiss')body=category+text('TasteRoom / 01',900-p,87,17,'text-anchor="end"')+line(121)+title(278,'font-weight="700" letter-spacing="-2.5"')+sub(Math.max(570,safeTitleBottom(278)+85))+(decor&&l.subBottom<785?(bold?`<g fill="${accent}"><rect x="${p}" y="810" width="315" height="245"/><path d="M${p+340} 1055V810A245 245 0 0 1 ${p+585} 1055Z"/></g><circle cx="${p+157}" cy="933" r="84" fill="${paper}"/>`:line(826,accent)+line(920,accent)+line(1010,accent)):'')+footer;
 if(id==='deconstructed')body=text('FORM / FRAGMENT',p,82,19)+text(content[0],900-p,150,fit(content[0],21,560),'text-anchor="end"')+`<g transform="rotate(-5 450 290)">${title(290,'font-weight="700" letter-spacing="-3"')}</g>`+sub(Math.max(600,safeTitleBottom(290)+95))+(decor&&l.subBottom<780?`<g transform="rotate(-11 450 922)">${bold?`<rect x="35" y="820" width="805" height="175" fill="${ink}"/><circle cx="640" cy="901" r="134" fill="${accent}"/><path d="M120 780L350 1050M165 760L395 1030" stroke="${paper}" stroke-width="21"/>`:`<path d="M40 840H850M40 916H850M40 990H850" stroke="${accent}" stroke-width="3"/>`}</g>`:'')+footer;
 if(id==='editorial')body=text('THE WEEKEND JOURNAL',p,85,18,'letter-spacing="3"')+line(120)+text(content[0],p,174,fit(content[0],22,900-p*2))+title(300,'font-weight="400" letter-spacing="-2"')+line(Math.max(570,safeTitleBottom(300)+55),accent)+sub(Math.max(650,safeTitleBottom(300)+130))+(decor&&l.subBottom<820?`<path d="M450 845V1052" stroke="${accent}"/><text x="${p}" y="1020" font-size="${bold?145:86}" fill="${accent}" font-style="italic">Aa</text><text x="505" y="975" font-size="20" letter-spacing="4">READ / THINK</text><path d="M505 1000H${900-p}" stroke="${ink}"/>`:'')+footer;
 if(id==='bauhaus')body=category+(decor?`<g>${bold?`<circle cx="635" cy="295" r="178" fill="${accent}"/><path d="M${p} 520V180L${p+320} 520Z" fill="#c99a29"/><rect x="450" y="480" width="285" height="95" fill="${ink}"/>`:`<circle cx="635" cy="295" r="178" stroke="${accent}" fill="none" stroke-width="3"/><path d="M${p} 520V180L${p+320} 520Z" stroke="${ink}" fill="none" stroke-width="3"/>`}</g>`:'')+title(715,'font-weight="700" letter-spacing="-2"')+sub(Math.max(960,safeTitleBottom(715)+55))+footer;
 if(id==='japanese')body=text('余白 / Y O H A K U',p,88,17,'letter-spacing="2"')+`<path d="M${p} 135H${p+36}" stroke="${accent}" stroke-width="3"/>`+text(content[0],p,218,fit(content[0],21,900-p*2))+title(420,'font-weight="400" letter-spacing="4"')+sub(Math.max(800,safeTitleBottom(420)+135))+(decor?(bold?`<circle cx="${900-p-50}" cy="1000" r="37" fill="${accent}"/><path d="M${p} 1000H${p+125}" stroke="${ink}"/>`:line(1008,accent)):'')+footer;
 if(id==='risograph')body=text(content[0],p,90,fit(content[0],22,900-p*2))+`<g fill="${accent}" transform="translate(5 4)" opacity=".65">${title(282,'font-weight="900" letter-spacing="-2"')}</g>`+title(282,'font-weight="900" letter-spacing="-2"')+sub(Math.max(600,safeTitleBottom(282)+100))+(decor&&l.subBottom<750?`<g opacity=".9"><circle cx="345" cy="906" r="148" fill="${ink}"/><circle cx="525" cy="910" r="148" fill="${accent}"/>${bold?Array.from({length:16},(_,i)=>`<path d="M175 ${792+i*14}H695" stroke="${paper}" stroke-width="2"/>`).join(''):''}</g>`:'')+footer+text('PRINT / TWO INKS',900-p,1166,16,'text-anchor="end"');
 const metadata={format:'tasteroom-direction-poster-v1',canvas:c,content,posterSettings:room.posterSettings||{},kind:'original event poster'};
 return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${xml(d.name+'：'+l.title.join(' '))}"><title>${xml(l.title.join(' '))}</title><desc>${xml(d.name)}原创构图；由本地参数排版，不是模型生成图片。</desc><metadata>${xml(JSON.stringify(metadata))}</metadata><rect width="900" height="1200" fill="${paper}"/><g fill="${ink}" font-family="${family}">${body}</g></svg>`;
}
