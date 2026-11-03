// Narrow local hints, offered as explicit choices. No natural-language execution
// or memory authorization happens in this helper.
export function feedbackSuggestions(text) {
  if (/书店|书籍|邀请|展览|展映|市集/.test(text)) return {
    note:'只根据“书店／邀请／展览”等词提供几个手动起点，尚未理解整句话。选择只改本张作品，不保存偏好。',
    choices:[
      {label:'更简洁：去掉装饰',dimension:'decorElements',value:'none'},
      {label:'更多呼吸：大留白',dimension:'layoutDensity',value:'airy'},
      {label:'突出标题：字号增加10%',setting:'titleScale',delta:.1},
    ],
  };
  if (/汇报|工作|数据|演示|科技/.test(text)) return {
    note:'这里只按工作展示相关词给出选项，未替你解释全部意图。点击只试用，不保存到工作场景。',
    choices:[
      {label:'试试清晰无衬线',dimension:'typography',value:'rational_sans'},
      {label:'试试网格对齐',dimension:'alignment',value:'strict_grid'},
      {label:'试试克制单色',dimension:'colorMood',value:'monochrome'},
    ],
  };
  return {note:'还没有匹配到相关方向。你可以选择一个明确参数，或打开同文构图比较；不会自动记住。',choices:[
    {label:'试试大留白',dimension:'layoutDensity',value:'airy'},
    {label:'试试去掉装饰',dimension:'decorElements',value:'none'},
    {label:'试试编辑杂志构图',dimension:'artDirection',value:'editorial'},
  ]};
}

export function revokePreference(room,id) {
  const memory=room.memories.find(m=>m.id===id&&m.status==='active');
  if(!memory)return false;
  memory.status='overridden';memory.updatedAt=new Date().toISOString();memory.revokedAt=memory.updatedAt;
  room.log('revoke_preference',{memory_id:id,scope:memory.context,canvas_preserved:true});
  return true;
}

// Undo an authorization without rolling the person's current artwork back.
export function restorePreferenceSnapshot(room,raw) {
  const snapshot=JSON.parse(raw);
  if(!Array.isArray(snapshot.memories))throw Error('上次记忆快照无法读取，未修改作品。');
  const prior=snapshot.memories.filter(m=>!m.id.startsWith('once_'));
  const ids=new Set(prior.map(m=>m.id)),at=new Date().toISOString();
  const later=room.memories.filter(m=>!ids.has(m.id)).map(m=>m.id.startsWith('once_')?m:{...m,status:'overridden',revokedAt:at,updatedAt:at});
  room.memories=JSON.parse(JSON.stringify([...prior,...later]));
  room.seq=Math.max(room.seq,snapshot.seq||0);
  room.log('undo_memory',{canvas_preserved:true,content_preserved:true});
}

export function memoryTime(memory) {
  const value=memory.updatedAt||memory.createdAt;
  if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return '旧规则 · 时间未保存';
  return `本机操作时间 ${new Date(value).toLocaleString('zh-CN',{hour12:false})}`;
}
