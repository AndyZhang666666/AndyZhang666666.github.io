import { OPTIONS, validChoice } from './engine.js?v=20261024-v2';
import { directionSvg, balancedLines, fit } from './directions.js';
export const DIMENSIONS = { artDirection:'设计方向',layoutDensity:'留白',typography:'字体',alignment:'对齐',colorMood:'色彩',decorElements:'装饰' };
const copy=x=>JSON.parse(JSON.stringify(x));
const fingerprint=room=>JSON.stringify({context:room.context,content:room.content,draftContent:room.draftContent,canvas:room.canvas,memories:room.memories});
export const comparisonIsCurrent=(room,comparison)=>!!comparison && !room.pending && comparison.fingerprint===fingerprint(room);

export function createComparison(room, dimension) {
  if (!Object.hasOwn(OPTIONS,dimension) || room.pending || room.round!==2) throw Error('请先完成直觉选择，并处理当前冲突。');
  const values=Object.keys(OPTIONS[dimension]), current=room.canvas[dimension];
  const alternate=dimension==='artDirection'&&current!=='free'?values.find(v=>v!==current&&v!=='free'):values.find(v=>v!==current);
  const a=copy(room.canvas),b={...a,[dimension]:alternate};
  return {dimension,context:room.context,content:room.content, fingerprint:fingerprint(room), variants:[a,b],
    question:`同一内容、同一其余参数，只比较${DIMENSIONS[dimension]}。`};
}

export function applyComparison(room, comparison, side, scope) {
  if(!comparisonIsCurrent(room,comparison)) throw Error('画布或记忆已变化，请重新生成对照，未写入偏好。');
  const expected=createComparison(room,comparison.dimension);
  if(comparison.context!==expected.context || comparison.content!==expected.content || JSON.stringify(comparison.variants)!==JSON.stringify(expected.variants))throw Error('对照参数已变化，请重新生成单变量对照。');
  if(side==='skip'){room.log('skip_comparison',{dimension:comparison.dimension,reason:'两张都不选，不推断偏好'});return null;}
  if(!['a','b'].includes(side)||!['once','current','global'].includes(scope))throw Error('请选择有效对照和适用范围。');
  if(scope==='current'&&room.context==='global')throw Error('请先切到日常或工作场景，或明确选择全局规则。');
  const dimension=comparison.dimension,value=comparison.variants[side==='a'?0:1][dimension];
  if(!validChoice(dimension,value))throw Error('对照参数无效。');
  // One chosen dimension only; an A/B click does not license inference about the others.
  const reason=`单变量对照：只改变${DIMENSIONS[dimension]}，同一内容第 ${comparison.content+1} 组；由本人明确选择${scope==='once'?'仅本次':scope==='current'?'当前场景':'全局'}范围。`;
  let memory;
  if(scope==='once'){
    memory={id:'once_'+ ++room.seq,dimension,preference:value,type:'explicit',context:room.context,
      confidence:1,sourceReason:reason,status:'overridden',order:room.seq};
    room.memories.push(memory);
  }else{
    if(scope==='global')room.memories.filter(m=>m.dimension===dimension&&m.status==='active').forEach(m=>m.status='overridden');
    memory=room.upsert(dimension,value,'explicit',scope==='global'?'global':room.context,reason);
  }
  memory.evidence={method:'single-variable',dimension,context:comparison.context,content:comparison.content,
    variants:copy(comparison.variants),chosen:side};
  room.update(dimension,value,memory.id);
  room.log('confirm_comparison',{dimension,value,scope,memory_id:memory.id});
  return memory;
}

export function styleBrief(room) {
  return {format:'tasteroom-style-brief-v1', context:room.context, canvas:copy(room.canvas),
    content:room.content,draftContent:copy(room.draftContent), exportedAt:new Date().toISOString(),
    rules:room.memories.filter(m=>m.status==='active'&&!m.id.startsWith('once_')).map(m=>({
      dimension:m.dimension,value:m.preference,scope:m.context,status:m.type==='explicit'?'本人明确规则':'待验证线索',
      reason:m.sourceReason,evidence:m.evidence||null})),
    boundary:'本地交互 Demo；不是人格判断、统计学习结论或模型准确率。当前画布可能含仅本次例外；持久规则与当前画布分别导出。'};
}

export function briefMarkdown(room) {
  const brief=styleBrief(room),names={global:'全局',personal:'日常审美',work:'工作汇报'};
  return ['# 我的偏好说明书',`当前场景：${names[brief.context]}`,'',
    '## 这张画布',...Object.entries(brief.canvas).map(([d,v])=>`- ${DIMENSIONS[d]}：${OPTIONS[d][v]}`),'',
    '## 我允许保留的规则与线索',...brief.rules.map(r=>`- [${names[r.scope]} / ${r.status}] ${DIMENSIONS[r.dimension]}：${OPTIONS[r.dimension][r.value]}。依据：${r.reason}`),'',
    '## 使用边界',brief.boundary,'明确规则优先；同级别中场景规则优先。不要将一个场景的偏爱直接复制到全部场景。'].join('\n');
}

const xml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function posterSvg(room, content) {
  content=room.draftContent||content;
  if(room.canvas.artDirection && room.canvas.artDirection!=='free')return directionSvg(room,content);
  const c=room.canvas,pad={compact:76,balanced:100,airy:128}[c.layoutDensity];
  const palette={monochrome:['#f4f3ed','#25332b'],muted_warm:['#eadfd0','#3a3e32'],high_contrast:['#1f42cb','#eeff88']}[c.colorMood];
  const family={rational_sans:'sans-serif',editorial_serif:'serif',mono_tech:'monospace'}[c.typography];
  const center=c.alignment==='centered',x=center?450:c.alignment==='asymmetric'?pad+100:pad,anchor=center?'middle':'start';
  const lines=balancedLines(content[1],14),sub=balancedLines(content[2],28),available=center?900-2*pad:900-pad-x;
  const titleSize=Math.min(82,...lines.map(s=>fit(s,82,available))),subSize=Math.min(27,...sub.map(s=>fit(s,27,available)));
  const shapes=c.decorElements==='none'?'':c.decorElements==='minimal_lines'
    ? '<path d="M600 800v160 M640 800v160 M680 800v160" fill="none" stroke="currentColor" stroke-width="3"/>'
    : '<path d="M570 800h90l65 160h-90z M680 800h45l65 160h-45z" fill="currentColor" opacity=".75"/>';
  const metadata={format:'tasteroom-poster-v1',context:room.context,canvas:room.canvas,content:room.content};
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img"><title>${xml(lines.join(' '))}</title><desc>偏爱实验室根据当前画布参数排版的矢量海报；原创虚构活动，不含外部资源。</desc><metadata>${xml(JSON.stringify(metadata))}</metadata><rect width="900" height="1200" fill="${palette[0]}"/><g fill="${palette[1]}" color="${palette[1]}" font-family="${family}"><text x="${pad}" y="100" font-size="${fit(content[0],24,900-2*pad-150)}">${xml(content[0])}</text><text x="${900-pad}" y="100" text-anchor="end" font-size="20">TasteRoom</text>${lines.map((line,i)=>`<text x="${x}" y="${320+i*105}" text-anchor="${anchor}" font-size="${titleSize}">${xml(line)}</text>`).join('')}${sub.map((line,i)=>`<text x="${x}" y="${590+i*42}" text-anchor="${anchor}" font-size="${subSize}">${xml(line)}</text>`).join('')}${shapes}<text x="${pad}" y="${1200-pad}" font-size="${fit(content[3],22,900-2*pad)}">${xml(content[3])}</text></g></svg>`;
}
