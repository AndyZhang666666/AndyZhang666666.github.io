export const examples={
 zh:['清晨的门房\n阿禾从架子上取下一封没有署名的信。','离站之前\n她把信塞进外套，车窗上映着身后的站台。','空车厢\n【知情】阿禾：寄信的人是林岚。','那通电话\n【知情】阿禾：林岚为什么要把信寄给我？','夜班末站\n阿禾独自坐在候车室。'],
 en:['The mailroom\nAhe takes an unsigned letter from the shelf.','Before departure\nShe slips it into her coat as the train doors close.','The empty carriage\n【知情】Ahe: Lin Lan sent this letter.','The phone call\n【知情】Ahe: Why did Lin Lan send it to me?','The last stop\nAhe sits alone in the waiting room.']
};
export const marker='【知情】';
export function parseScenes(text){
 const blocks=text.trim().split(/\n\s*\n/);
 if(blocks.length<2||blocks.length>30||text.length>35000)throw Error('scenes');
 return blocks.map((block,i)=>{
  const [title,...body]=block.trim().split(/\r?\n/);
  if(!title.trim()||!body.some(s=>s.trim()))throw Error(String(i+1));
  return {title,lines:body.map(line=>({text:line.replace(marker,'').trim(),requires:line.includes(marker)}))};
 });
}
export function createStory(text,reveal,character,fact){
 const scenes=parseScenes(text);
 if(!character.trim()||!fact.trim())throw Error('fact');
 if(!Number.isInteger(reveal)||reveal<1||reveal>scenes.length)throw Error('reveal');
 return {scenes,reveal,character,fact,edits:{}};
}
export function rows(story){
 const output=[];
 for(const [s,scene] of story.scenes.entries()){
  for(const [l,line] of scene.lines.entries()){
   const key=s+'-'+l,edit=story.edits[key];
   output.push({key,scene:s+1,...line,conflict:line.requires && s+1<story.reveal && !edit,edit});
  }
 }
 return output;
}
export function revise(story,key,type,wording){
 const item=rows(story).find(r=>r.key===key);
 if(!item?.requires||!['omit','doubt','clue'].includes(type))throw Error('line');
 if(type!=='omit'&&!wording.trim())throw Error('wording');
 return {...story,edits:{...story.edits,[key]:{type,wording:wording.trim()}}};
}
export function scriptText(story,en=false){
 const list=rows(story),edits=list.filter(item=>item.edit),pending=list.filter(item=>item.conflict);
 return ['# '+(en?'Revision draft':'修订剧本'),story.character+' · '+story.fact,
  (en?'Reveal in scene ':'揭晓场次 ')+story.reveal,
  (en?'Open marked lines: ':'仍待处理的标记对白 ')+pending.length,'',
  ...story.scenes.flatMap((scene,i)=>['## '+(i+1)+' · '+scene.title,...list.filter(r=>r.scene===i+1).flatMap(r=>{
   if(r.edit?.type==='omit')return [];
   if(r.edit?.type==='clue')return ['['+r.edit.wording+']',r.text];
   return [r.edit?.wording??r.text];
  }), '']),
  '## '+(en?'Revision notes':'改动清单'),
  ...edits.map(r=>'– '+r.scene+' · '+r.text+' → '+({omit:en?'Omitted':'删句',doubt:en?'Uncertain dialogue':'改为猜测',clue:en?'Added clue':'提前补线索'}[r.edit.type])+(r.edit.wording?' / '+r.edit.wording:'')),
  ...pending.map(r=>'– '+(en?'Pending':'待确认')+' · '+r.scene+' · '+r.text)].join('\n');
}
