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
const measure=s=>[...s].reduce((n,ch)=>n+(/[MW@%&mw]/.test(ch)?1.05:/[A-Z]/.test(ch)?.8:/[\x00-\x7f]/.test(ch)?.66:1),0);
function lines(s,limit,manual){const source=String(s).split(/<br\s*\/?\s*>|\n/i);if(manual||source.length>1)return source;let result=[],line='',size=0;for(const ch of source[0]){const m=measure(ch);if(size+m>limit&&line){result.push(line);line='';size=0;}line+=ch;size+=m;}result.push(line);return result;}
// Each direction owns its composition. Aspect-ratio changes reflow text and media;
// image geometry remains separate from remembered design preferences.
const GEOMETRY={
 swiss:{title:.245,subtitle:.45,scale:1,mediaX:0,mediaW:1},
 deconstructed:{title:.26,subtitle:.47,scale:1.04,mediaX:.09,mediaW:.91},
 editorial:{title:.25,subtitle:.49,scale:.91,mediaX:0,mediaW:.8},
 bauhaus:{title:.52,subtitle:.69,scale:.92,mediaX:0,mediaW:1},
 japanese:{title:.32,subtitle:.55,scale:.78,mediaX:.12,mediaW:.8},
 risograph:{title:.23,subtitle:.46,scale:1.04,mediaX:0,mediaW:1},
};
export function artworkLayout(room,content){
 const art=normalizeArtwork(room.artwork),{width:w,height:h}=ARTBOARDS[art.format],wide=art.format==='landscape',c=room.canvas,id=c.artDirection||'swiss',g=GEOMETRY[id]||GEOMETRY.swiss,manual=room.posterSettings?.lineBreaks==='manual';
 const pad=Math.round(w*({compact:.065,balanced:.08,airy:.1}[c.layoutDensity]||.08));
 const colWidth=wide?w*.44:w-2*pad,usable=colWidth-(id==='japanese'?w*.08:0)-(c.alignment==='asymmetric'?24:0);
 const title=lines(content[1],wide?12:14,manual),subtitle=lines(content[2],wide?25:32,manual);
 const max=(wide?88:Math.min(w*.09,100))*g.scale*(Number(room.posterSettings?.titleScale)||1);
 const size=Math.min(max,...title.map(s=>Math.floor((usable-20)/Math.max(1,measure(s))))),subtitleSize=Math.min(wide?26:27,...subtitle.map(s=>Math.floor(usable/Math.max(1,measure(s)))));
 const titleY=Math.round(h*(wide?(id==='japanese'?.34:id==='bauhaus'?.32:.245):g.title)),titleBottom=titleY+Math.max(0,title.length-1)*size*1.12;
 const subY=Math.max(titleBottom+Math.max(44,size*.6),Math.round(h*(wide?(id==='bauhaus'?.6:.55):g.subtitle))),subBottom=subY+Math.max(0,subtitle.length-1)*(subtitleSize*1.48);
 const detailRows=['when','where','action'].filter(k=>art.details[k]);
 const footerY=h-pad*.7,metaY=footerY-42-detailRows.length*30;
 let media;
 if(wide)media={x:id==='bauhaus'?pad:id==='editorial'?w*.64:id==='japanese'?w*.67:w*.57,y:h*(id==='editorial'?.16:.2),width:w*(id==='editorial'?.29:id==='japanese'?.25:.36),height:h*(id==='japanese'?.48:.57)};
 else if(id==='bauhaus')media={x:pad,y:h*.17,width:w-pad*2,height:h*.26};
 else media={x:pad+(w-pad*2)*g.mediaX,y:subBottom+30,width:(w-pad*2)*g.mediaW,height:metaY-subBottom-64};
 const categorySize=Math.min(23,Math.floor((w-pad*2-160)/Math.max(1,measure(content[0])))),footerSize=Math.min(22,Math.floor((w-pad*2)/Math.max(1,measure(content[3]))));
 const issues=[];
 if(title.length>4)issues.push('标题超过四行，请重新平衡换行');if(subtitle.length>4)issues.push('副文案超过四行，请调整换行或减少文字');if(size<28)issues.push('标题过密，请增加换行或换用更宽版式');if(subtitleSize<14)issues.push('副文案过密，请增加换行或减少文字');if(categorySize<12)issues.push('活动类别过长，请简化类别');if(footerSize<14)issues.push('落款过长，请简化落款');
 if(subBottom+22>metaY)issues.push('副文案已进入活动信息区域，请缩小标题或调整换行');
 if(art.image&&!safeImageUrl(art.image))issues.push('本机图片尚未恢复，请重新选择图片或移除图片');
 if(art.image&&!wide&&media.height<100)issues.push('文字与主图区域重叠，请缩小标题、减少换行或使用横版');
 const detailNames={when:'日期与时间',where:'地点',action:'行动说明'};
 for(const key of detailRows)if(measure(art.details[key])*22>w-pad*2)issues.push(detailNames[key]+'过长，请简化该字段');
 const titleX=wide&&id==='bauhaus'?w*.54:pad;
 return {title,subtitle,pad,size,subtitleSize,categorySize,footerSize,subBottom,issues,ok:!issues.length,w,h,wide,titleY,titleBottom,titleX,subY,metaY,footerY,detailRows,usable,media,art,id};
}

function imageSvg(l){const a=l.art,url=safeImageUrl(a.image);if(!url)return '';const r=l.media,height=Math.max(1,r.height),img=a.image;let x=r.x,y=r.y,w=r.width,h=height;
 const scale=a.imageFit==='fit'?Math.min(w/img.width,h/img.height):Math.max(w/img.width,h/img.height);
 const iw=img.width*scale,ih=img.height*scale,ix=x+(w-iw)*a.imageX/100,iy=y+(h-ih)*a.imageY/100;
 return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden"><image x="${ix-x}" y="${iy-y}" width="${iw}" height="${ih}" href="${url}"/></svg>`;
}
export function artworkSvg(room,content,d){
 const l=artworkLayout(room,content),{w,h,pad:p,size,subtitleSize:ss,art,id,wide}=l,c=room.canvas;
 const [paper,ink,accent]=c.colorMood==='monochrome'?[d.paper,d.ink,d.ink]:c.colorMood==='high_contrast'?['#fff',d.ink,d.accent]:[d.paper,d.ink,d.accent];
 const sans="Arial,Helvetica,'PingFang SC',sans-serif",serif="Georgia,'Songti SC',serif",mono="'Courier New',monospace",family=c.typography==='editorial_serif'?serif:c.typography==='mono_tech'?mono:sans;
 const text=(s,x,y,fs,attrs='')=>`<text x="${x}" y="${y}" font-size="${fs}" ${attrs}>${xml(s)}</text>`;
 const center=c.alignment==='centered',tx=center?(wide?l.titleX+l.usable/2:w/2):l.titleX+(c.alignment==='asymmetric'?24:0),anchor=center?'middle':'start';
 const title=l.title.map((s,i)=>text(s,tx,l.titleY+i*size*1.12,size,`text-anchor="${anchor}" font-weight="${['editorial','japanese'].includes(id)?400:700}" letter-spacing="${id==='japanese'?2:-1}"`)).join('');
 const sub=l.subtitle.map((s,i)=>text(s,tx,l.subY+i*ss*1.48,ss,`text-anchor="${anchor}"`)).join('');
 const hr=y=>`<path d="M${p} ${y}H${w-p}" stroke="${ink}" stroke-width="1"/>`;
 let ornaments='',titleMarkup=title;
 if(c.decorElements!=='none'&&!art.image){const r=l.media,aw=wide?r.width:Math.min(r.width,480),ah=Math.max(0,r.height);if(ah>70){
  if(id==='swiss')ornaments=`<rect x="${r.x}" y="${r.y}" width="${aw*.56}" height="${Math.min(ah,aw*.4)}" fill="${accent}"/><circle cx="${r.x+aw*.82}" cy="${r.y+Math.min(ah,aw*.4)/2}" r="${Math.min(ah,aw*.4)/2}" fill="${ink}"/>`;
  if(id==='deconstructed')ornaments=`<g transform="rotate(-8 ${r.x+aw/2} ${r.y+ah/2})"><rect x="${r.x}" y="${r.y+ah*.22}" width="${aw}" height="${ah*.48}" fill="${ink}"/><path d="M${r.x+aw*.1} ${r.y}L${r.x+aw*.6} ${r.y+ah}" stroke="${accent}" stroke-width="30"/></g>`;
  if(id==='editorial')ornaments=`<path d="M${r.x+aw*.55} ${r.y}V${r.y+Math.min(ah,160)}" stroke="${accent}"/>`+text('Aa',r.x,r.y+Math.min(ah*.8,130),Math.min(ah*.8,140),`font-family="${serif}" font-style="italic" fill="${accent}"`)+text('READ / THINK',r.x+aw*.62,r.y+Math.min(ah*.6,90),17);
  if(id==='bauhaus')ornaments=`<circle cx="${r.x+aw*.72}" cy="${r.y+Math.min(ah*.5,aw*.25)}" r="${Math.min(ah*.45,aw*.25)}" fill="${accent}"/><path d="M${r.x} ${r.y+Math.min(ah,aw*.5)}V${r.y}L${r.x+aw*.5} ${r.y+Math.min(ah,aw*.5)}Z" fill="${c.colorMood==='monochrome'?ink:'#c4a03c'}"/>`;
  if(id==='japanese')ornaments=`<circle cx="${r.x+aw*.8}" cy="${r.y+ah*.6}" r="${Math.min(30,ah*.2)}" fill="${accent}"/>`;
  if(id==='risograph')ornaments=`<circle cx="${r.x+aw*.4}" cy="${r.y+ah*.5}" r="${Math.min(ah*.42,aw*.29)}" fill="${ink}"/><circle cx="${r.x+aw*.68}" cy="${r.y+ah*.51}" r="${Math.min(ah*.42,aw*.29)}" fill="${accent}" opacity=".8"/>`;
 }}
 if(id==='deconstructed')titleMarkup=`<g transform="rotate(-3 ${w/2} ${l.titleY})">${title}</g>`;
 if(id==='risograph')titleMarkup=`<g fill="${accent}" transform="translate(4 3)" opacity=".6">${title}</g>${title}`;
 let details=l.detailRows.map((key,i)=>text(art.details[key],p,l.metaY+30*i,22,`font-weight="${key==='action'?600:400}"`)).join('');
 const mark=id==='japanese'?'余白 / Y O H A K U':id==='risograph'?'PRINT / TWO INKS':id==='deconstructed'?'FORM / FRAGMENT':'TasteRoom / Studio';
 const top=text(content[0],p,h*.085,l.categorySize)+text(mark,w-p,h*.085,16,'text-anchor="end"');
 const line=['swiss','editorial'].includes(id)?hr(h*.12):id==='japanese'?`<path d="M${p} ${h*.13}H${p+35}" stroke="${accent}" stroke-width="3"/>`:id==='deconstructed'?`<path d="M${w-p} ${h*.16}V${h*.64}" stroke="${accent}" stroke-width="5"/>`:'';
 const metadata={format:'tasteroom-artwork-v2',canvas:c,content,artwork:packedArtwork(art),posterSettings:room.posterSettings||{}};
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${xml(d.name+'：'+l.title.join(' '))}"><title>${xml(l.title.join(' '))}</title><desc>${xml(d.name)}原创构图；当前作品与图片由本机排版，不调用模型。</desc><metadata>${xml(JSON.stringify(metadata))}</metadata><rect width="${w}" height="${h}" fill="${paper}"/><g fill="${ink}" font-family="${family}">${top}${line}${titleMarkup}${sub}${imageSvg(l)}${ornaments}${details}${text(content[3],p,l.footerY,l.footerSize)}</g></svg>`;
}
