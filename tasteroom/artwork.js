// Artwork belongs to a document, not to the preference engine. No rule is written here.
export const ARTBOARDS = Object.freeze({portrait:{name:'竖版海报',width:900,height:1200},square:{name:'方形分享',width:1080,height:1080},landscape:{name:'横版展示',width:1600,height:900}});
export const artworkDefault = () => ({version:1,format:'portrait',details:{when:'',where:'',action:''},image:null,imageFit:'fill',imageX:50,imageY:50});
export function validArtwork(a){return !!a&&a.version===1&&Object.hasOwn(ARTBOARDS,a.format)&&a.details&&['when','where','action'].every(k=>typeof a.details[k]==='string'&&a.details[k].length<=100)&&['fit','fill'].includes(a.imageFit)&&Number.isFinite(a.imageX)&&a.imageX>=0&&a.imageX<=100&&Number.isFinite(a.imageY)&&a.imageY>=0&&a.imageY<=100&&(!a.image||(typeof a.image.id==='string'&&a.image.id.length<=100&&['image/png','image/jpeg','image/webp'].includes(a.image.type)&&Number.isFinite(a.image.width)&&a.image.width>0&&Number.isFinite(a.image.height)&&a.image.height>0));}
export function normalizeArtwork(a){return validArtwork(a)?structuredClone(a):artworkDefault();}
export function packedArtwork(a){const copy=normalizeArtwork(a);if(copy.image)delete copy.image.dataUrl;return copy;}
export const artworkSignature=a=>JSON.stringify(packedArtwork(a));
export function safeImageUrl(image){return image&&typeof image.dataUrl==='string'&&image.dataUrl.length<=7*1024*1024&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image.dataUrl)?image.dataUrl:null;}
export function canvasProvenance(room,shown=room){
 const effective=room.effective().filter(m=>m.type==='explicit'&&!m.id.startsWith('once_'));
 const scene=effective.find(m=>m.dimension==='artDirection'&&m.context===room.context),inherited=effective.find(m=>m.dimension==='artDirection');
 const direction=shown.canvas.artDirection;
 const temporary=effective.some(m=>shown.canvas[m.dimension]!==m.preference)||Object.keys(shown.canvas).some(d=>d!=='artDirection'&&shown.canvas[d]!==((room.effective().find(m=>m.dimension===d))?.preference??room.base[d]))||Object.keys(shown.canvas).some(d=>{const latest=(room.history||[]).filter(h=>h.active&&h.dimension===d).at(-1);return latest?.value===shown.canvas[d]&&String(latest?.memory||'').startsWith('once_');})||Number(room.posterSettings?.titleScale||1)!==1||room.posterSettings?.lineBreaks==='manual';
 return {direction,sceneDirection:scene?.preference||null,remembered:scene?.preference===direction,inherited:!scene&&inherited?.preference===direction,temporary,canRestore:!!scene&&scene.preference!==direction};
}
export function restoreSceneDirection(room){const before=JSON.stringify(room.memories);const rule=room.effective().find(m=>m.dimension==='artDirection'&&m.type==='explicit'&&m.context===room.context&&!m.id.startsWith('once_'));if(!rule)return false;room.update('artDirection',rule.preference,rule.id);if(JSON.stringify(room.memories)!==before)throw Error('恢复方向不应修改记忆');return true;}
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const measure=s=>[...s].reduce((n,ch)=>n+(/[MW@%&mw]/.test(ch)?1.05:/[A-Z]/.test(ch)?.8:/[\x00-\x7f]/.test(ch)?.62:1),0);
function lines(value,limit,manual){
 const source=String(value).split(/<br\s*\/?\s*>|\n/i);if(manual||source.length>1)return source;
 const result=[];let line='',width=0;for(const ch of source[0]){const next=measure(ch);if(width+next>limit&&line){result.push(line.trim());line='';width=0;}line+=ch;width+=next;}result.push(line.trim());return result;
}
// These are composition rules, not remembered preferences. Each aspect ratio has
// its own working regions; changing format never scales a portrait composition.
const COMPOSITIONS={
 swiss:{title:.225,sub:.405,size:1.08,mediaX:0,mediaW:1,mark:'01 / FORM & FUNCTION'},
 deconstructed:{title:.25,sub:.445,size:1.08,mediaX:.07,mediaW:.88,mark:'02 / FORM IN MOTION'},
 editorial:{title:.225,sub:.43,size:.98,mediaX:.35,mediaW:.65,mark:'03 / AN OPEN EDITION'},
 bauhaus:{title:.515,sub:.715,size:.95,mediaX:0,mediaW:1,mark:'04 / COLOUR & FORM'},
 japanese:{title:.30,sub:.51,size:.85,mediaX:.17,mediaW:.73,mark:'05 / SPACE TO NOTICE'},
 risograph:{title:.235,sub:.43,size:1.08,mediaX:.04,mediaW:.92,mark:'06 / TWO INKS, ONE IDEA'},
};
export function artworkLayout(room,content){
 const art=normalizeArtwork(room.artwork),{width:w,height:h}=ARTBOARDS[art.format],wide=art.format==='landscape',square=art.format==='square',c=room.canvas,id=Object.hasOwn(COMPOSITIONS,c.artDirection)?c.artDirection:'swiss',g=COMPOSITIONS[id],manual=room.posterSettings?.lineBreaks==='manual';
 const pad=Math.round(w*({compact:.065,balanced:.08,airy:.10}[c.layoutDensity]||.08)),asym=c.alignment==='asymmetric'?Math.round(w*.022):0;
 const titleX=wide?(id==='bauhaus'?w*.53:id==='japanese'?w*.12:pad):id==='japanese'?pad+w*.035:pad;
 const usable=wide?(id==='bauhaus'?w*.39:id==='japanese'?w*.43:w*.455):w-pad*2-(id==='japanese'?w*.10:0)-asym;
 const titleMax=(wide?104:square?104:100)*g.size*(Number(room.posterSettings?.titleScale)||1),title=lines(content[1],Math.max(6,Math.floor(usable/titleMax)),manual),subtitle=lines(content[2],Math.max(15,Math.floor(usable/(wide?27:26))),manual);
 const wantedSize=Math.min(titleMax,...title.map(s=>Math.floor((usable-12)/Math.max(1,measure(s))))),size=Math.max(28,wantedSize),wantedSubSize=Math.min(wide?27:26,...subtitle.map(s=>Math.floor(usable/Math.max(1,measure(s))))),subtitleSize=Math.max(16,wantedSubSize);
 const titleY=Math.round(h*(wide?(id==='japanese'?.34:id==='bauhaus'?.33:.28):g.title)),titleBottom=titleY+Math.max(0,title.length-1)*size*1.12;
 const subY=Math.max(titleBottom+Math.max(55,size*.7),Math.round(h*(wide?.58:g.sub))),subBottom=subY+Math.max(0,subtitle.length-1)*subtitleSize*1.48;
 const detailRows=['when','where','action'].filter(k=>art.details[k]),detailFont=wide?21:20,detailWidth=wide?(w-2*pad)/Math.max(1,detailRows.length)-30:w-2*pad-80;
 const detailLines=Object.fromEntries(detailRows.map(k=>[k,lines(art.details[k],Math.max(16,Math.floor(detailWidth/detailFont)),false)]));
 const detailHeight=wide?(detailRows.length?Math.max(...detailRows.map(k=>detailLines[k].length))*29+28:0):detailRows.reduce((n,k)=>n+Math.max(1,detailLines[k].length)*28+11,0);
 const footerY=h-pad*.58,metaY=footerY-38-detailHeight;
 let media;
 if(wide){media={x:id==='bauhaus'?pad:id==='japanese'?w*.65:w*.585,y:h*(id==='japanese'?.23:.185),width:id==='bauhaus'?w*.395:id==='japanese'?w*.27:w*.34,height:Math.max(80,metaY-h*(id==='japanese'?.23:.185)-34)};}
 else if(id==='bauhaus'){media={x:pad,y:h*.155,width:w-pad*2,height:h*(square?.26:.25)};}
 else {const y=Math.max(subBottom+46,h*(id==='japanese'?.65:id==='editorial'?.62:.56));media={x:pad+(w-pad*2)*g.mediaX,y,width:(w-pad*2)*g.mediaW,height:Math.max(0,metaY-y-34)};}
 const categoryWanted=Math.min(23,Math.floor((w-pad*2-(wide?330:220))/Math.max(1,measure(content[0])))),footerWanted=Math.min(21,Math.floor((w-pad*2-120)/Math.max(1,measure(content[3]))));
 const categorySize=Math.max(14,categoryWanted),footerSize=Math.max(14,footerWanted),issues=[];
 if(title.length>4)issues.push('标题超过四行，请重新平衡换行');if(subtitle.length>4)issues.push('副文案超过四行，请调整换行或减少文字');if(wantedSize<28)issues.push('标题过密，已保留可读字号，请增加换行或换用更宽版式');if(wantedSubSize<16)issues.push('副文案过密，请增加换行或减少文字');if(categoryWanted<14)issues.push('活动类别过长，请简化类别');if(footerWanted<14)issues.push('落款过长，请简化落款');
 if(subBottom+26>metaY)issues.push('副文案已进入活动信息区域，请缩小标题或调整换行');
 if(art.image&&!safeImageUrl(art.image))issues.push('本机图片尚未恢复，请重新选择图片或移除图片');
 if(art.image&&!wide&&id!=='bauhaus'&&media.height<110)issues.push('文字与主图区域重叠，请缩小标题、减少换行或使用横版');
 const detailNames={when:'日期与时间',where:'地点',action:'行动说明'};for(const key of detailRows)if(detailLines[key].length>2)issues.push(detailNames[key]+'超过两行，请简化该字段');
 return {title,subtitle,pad,size,subtitleSize,categorySize,footerSize,subBottom,issues,ok:!issues.length,w,h,wide,square,titleY,titleBottom,titleX,subY,metaY,footerY,detailRows,detailLines,detailFont,detailWidth,usable,media,art,id,mark:g.mark,asym};
}
function imageSvg(l){const a=l.art,url=safeImageUrl(a.image);if(!url)return '';const r=l.media,height=Math.max(1,r.height),img=a.image;const scale=a.imageFit==='fit'?Math.min(r.width/img.width,height/img.height):Math.max(r.width/img.width,height/img.height),iw=img.width*scale,ih=img.height*scale,ix=(r.width-iw)*a.imageX/100,iy=(height-ih)*a.imageY/100;
 return `<svg x="${r.x}" y="${r.y}" width="${r.width}" height="${height}" viewBox="0 0 ${r.width} ${height}" overflow="hidden"><image x="${ix}" y="${iy}" width="${iw}" height="${ih}" href="${url}"/></svg>`;
}
export function artworkSvg(room,content,d){
 const l=artworkLayout(room,content),{w,h,pad:p,size,subtitleSize:ss,art,id,wide}=l,c=room.canvas;
 const [paper,ink,accent]=c.colorMood==='monochrome'?[d.paper,d.ink,d.ink]:c.colorMood==='high_contrast'?['#fff',d.ink,d.accent]:[d.paper,d.ink,d.accent];
 const sans="Arial,Helvetica,'PingFang SC',sans-serif",serif="Georgia,'Songti SC',serif",mono="'Courier New',monospace",family=c.typography==='editorial_serif'?serif:c.typography==='mono_tech'?mono:sans;
 const text=(s,x,y,fs,attrs='')=>`<text x="${x}" y="${y}" font-size="${fs}" ${attrs}>${xml(s)}</text>`;
 const center=c.alignment==='centered',tx=center?l.titleX+l.usable/2:l.titleX+l.asym,anchor=center?'middle':'start';
 const title=l.title.map((s,i)=>text(s,tx,l.titleY+i*size*1.12,size,`text-anchor="${anchor}" font-weight="${['editorial','japanese'].includes(id)?400:800}" letter-spacing="${id==='japanese'?2:-1.8}"`)).join('');
 const sub=l.subtitle.map((s,i)=>text(s,tx,l.subY+i*ss*1.48,ss,`text-anchor="${anchor}" opacity=".9"`)).join('');
 const rule=(x1,y,x2,color=ink,width=1)=>`<path d="M${x1} ${y}H${x2}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
 const r=l.media,hasArt=c.decorElements!=='none',bold=c.decorElements==='bold_shapes',rw=r.width,rh=Math.max(0,r.height);
 let ornament='',underlay='',titleMarkup=title;
 if(hasArt&&!art.image&&rh>55){
  if(id==='swiss'){const cell=Math.min(rw*.45,rh*.9);ornament=`<g fill="${accent}"><rect x="${r.x}" y="${r.y}" width="${cell}" height="${cell}"/><path d="M${r.x+cell+18} ${r.y+cell}V${r.y}A${cell} ${cell} 0 0 1 ${r.x+cell*2+18} ${r.y+cell}Z"/></g>`+rule(r.x,r.y+cell+18,r.x+Math.min(rw,cell*2+18),ink,1);if(!bold)ornament=`<path d="M${r.x} ${r.y}H${r.x+rw}M${r.x} ${r.y+rh*.45}H${r.x+rw}M${r.x} ${r.y+rh*.9}H${r.x+rw}" stroke="${accent}" stroke-width="2"/>`;}
  if(id==='deconstructed'){const cy=r.y+rh*.5;ornament=`<g transform="rotate(-7 ${r.x+rw*.5} ${cy})"><rect x="${r.x+rw*.03}" y="${r.y+rh*.25}" width="${rw*.89}" height="${rh*.5}" fill="${ink}"/><path d="M${r.x+rw*.20} ${r.y+rh*.08}L${r.x+rw*.58} ${r.y+rh*.91}" stroke="${accent}" stroke-width="${Math.max(14,rw*.08)}"/>${text('FORM',r.x+rw*.12,cy+16,Math.min(rw*.16,rh*.32),`fill="${paper}" font-weight="800" letter-spacing="-3"`)}</g>`;}
  if(id==='editorial'){const fs=Math.min(rh*.82,rw*.58);ornament=rule(r.x,r.y,r.x+rw,accent)+text('Aa',r.x,r.y+fs*.94,fs,`font-family="${serif}" font-style="italic" fill="${accent}"`)+`<path d="M${r.x+rw*.68} ${r.y+18}V${r.y+Math.min(rh,fs)}" stroke="${accent}"/>`+text('A NOTE',r.x+rw*.73,r.y+Math.min(rh*.4,60),13,`font-family="${mono}" letter-spacing="1"`)+text('ON SEEING',r.x+rw*.73,r.y+Math.min(rh*.4,60)+21,13,`font-family="${mono}"`);}
  if(id==='bauhaus'){const side=Math.min(rw*.54,rh);ornament=`<path d="M${r.x} ${r.y+side}V${r.y}L${r.x+side} ${r.y+side}Z" fill="${c.colorMood==='monochrome'?ink:'#c79938'}"/><circle cx="${r.x+rw-side*.50}" cy="${r.y+side*.5}" r="${side*.5}" fill="${accent}"/><rect x="${r.x+side*.70}" y="${r.y+side*.75}" width="${Math.min(side*.75,rw*.35)}" height="${side*.24}" fill="${ink}"/>`;if(!bold)ornament=ornament.replaceAll('fill="'+accent+'"','fill="none" stroke="'+accent+'" stroke-width="3"');}
  if(id==='japanese'){const cy=r.y+rh*.54;ornament=`<circle cx="${r.x+rw*.78}" cy="${cy}" r="${Math.min(34,rh*.2)}" fill="${accent}"/>`+rule(r.x,r.y+rh*.82,r.x+rw*.19,ink)+text('間',r.x+rw*.72,Math.min(r.y+rh,cy+84),19,`opacity=".7"`);}
  if(id==='risograph'){const radius=Math.min(rh*.44,rw*.31),cy=r.y+rh*.48,cx=r.x+rw*.42;ornament=`<g opacity=".92"><circle cx="${cx}" cy="${cy}" r="${radius}" fill="${ink}"/><circle cx="${cx+radius*.95}" cy="${cy+3}" r="${radius}" fill="${accent}" opacity=".82"/></g>`+(bold?Array.from({length:12},(_,i)=>rule(cx-radius-5,cy-radius+14+i*(radius*2-28)/11,cx+radius*1.95,paper,1.5)).join(''):'');}
 }
 if(id==='deconstructed'){titleMarkup=`<g transform="rotate(-2 ${tx} ${l.titleY})">${title}</g>`;underlay=`<path d="M${w-p*.55} ${h*.15}V${h*.55}" stroke="${accent}" stroke-width="6"/>`;}
 if(id==='risograph')titleMarkup=`<g fill="${accent}" transform="translate(2.5 1.8)" opacity=".5">${title}</g>${title}`;
 const category=text(content[0],p,h*.077,l.categorySize,`font-weight="500" letter-spacing=".5"`),mark=text(l.mark,w-p,h*.077,wide?15:12,`text-anchor="end" font-family="${mono}" letter-spacing=".7"`);
 let topRule=id==='japanese'?rule(p,h*.13,p+42,accent,3):['swiss','editorial','risograph'].includes(id)?rule(p,h*.112,w-p,ink,id==='swiss'?2:1):'';
 if(id==='editorial')underlay+=text('ED.',wide?w*.84:w*.78,h*.16,wide?33:28,`font-family="${serif}" font-style="italic" fill="${accent}"`);
 const labels={when:'WHEN',where:'WHERE',action:'JOIN'};let cursor=l.metaY,details='';
 if(l.detailRows.length){details+=rule(p,l.metaY-21,w-p,ink,.7);for(const [index,key]of l.detailRows.entries()){const x=wide?p+index*(w-2*p)/l.detailRows.length:p,y=wide?l.metaY:cursor;details+=text(labels[key],x,y,11,`font-family="${mono}" letter-spacing="1" opacity=".7"`);l.detailLines[key].forEach((line,i)=>{details+=text(line,wide?x:x+77,y+23+i*28,l.detailFont,`font-weight="${key==='action'?550:400}"`);});if(!wide)cursor+=l.detailLines[key].length*28+11;}}
 const footer=text(content[3],p,l.footerY,l.footerSize,`font-weight="450"`)+text('T / R',w-p,l.footerY,13,`font-family="${mono}" text-anchor="end" opacity=".6"`);
 const metadata={format:'tasteroom-artwork-v2',canvas:c,content,artwork:packedArtwork(art),posterSettings:room.posterSettings||{}};
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${xml(d.name+'：'+l.title.join(' '))}"><title>${xml(l.title.join(' '))}</title><desc>${xml(d.name)}原创构图；当前作品与图片由本机排版，不调用模型。</desc><metadata>${xml(JSON.stringify(metadata))}</metadata><rect width="${w}" height="${h}" fill="${paper}"/><g fill="${ink}" font-family="${family}">${category}${mark}${topRule}${underlay}${ornament}${imageSvg(l)}${titleMarkup}${sub}${details}${footer}</g></svg>`;
}
