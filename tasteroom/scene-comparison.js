import {BASE, OPTIONS, Room, validChoice} from './engine.js?v=20261027-studio1';
import {normalizeArtwork} from './artwork.js';

const copy=value=>JSON.parse(JSON.stringify(value));
export const COMPARED_SCENES=Object.freeze(['personal','work']);

// A view of authorized rules, not a context switch or a trial on the working Room.
export function authorizedSceneView(room, context) {
  if(!COMPARED_SCENES.includes(context))throw Error('仅对照个人与工作场景。');
  const memories=(room.memories||[]).filter(m=>
    m&&typeof m.id==='string'&&!m.id.startsWith('once_')&&m.status==='active'&&
    m.type==='explicit'&&['global',context].includes(m.context)&&
    validChoice(m.dimension,m.preference)&&Number.isFinite(m.order)&&Number.isFinite(m.confidence)
  );
  // Use the existing precedence rules; do not infer preferences from current trials.
  const rules=Room.prototype.effective.call({memories,context});
  const canvas={...BASE};
  for(const rule of rules)canvas[rule.dimension]=rule.preference;
  return {
    context,canvas,
    posterSettings:copy(room.posterSettings||{titleScale:1,lineBreaks:'auto'}),
    artwork:normalizeArtwork(room.artwork),
    appliedRules:rules.map(({dimension,preference,context})=>({dimension,preference,context})),
    sceneRuleCount:rules.filter(r=>r.context===context).length,
    inheritedRuleCount:rules.filter(r=>r.context==='global').length,
  };
}

export function compareAuthorizedScenes(room, content) {
  if(!Array.isArray(content)||content.length!==4||content.some(v=>typeof v!=='string'))throw Error('请先将完整文案应用到画布。');
  const scenes=COMPARED_SCENES.map(context=>({...authorizedSceneView(room,context),content:[...content]}));
  const origin=(scene,dimension)=>scene.appliedRules.find(r=>r.dimension===dimension)?.context||'default';
  const differences=Object.keys(OPTIONS).filter(d=>scenes[0].canvas[d]!==scenes[1].canvas[d]).map(d=>({
    dimension:d,
    personal:{value:scenes[0].canvas[d],origin:origin(scenes[0],d)},
    work:{value:scenes[1].canvas[d],origin:origin(scenes[1],d)},
  }));
  return {scenes,differences,usesAppliedContent:true,temporaryTrialsIncluded:false};
}

// Two original SVG renderings may define the same clip IDs. Keep their references local.
export function namespaceSceneSvg(svg,prefix) {
  if(typeof svg!=='string'||!/^scene-(personal|work)$/.test(prefix))throw Error('预览标识无效。');
  const ids=new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
  const referenceAttributes=new Set(['clip-path','fill','stroke','filter','mask','marker-start','marker-mid','marker-end','style']);
  // Restrict replacement to owned reference attributes, never visible copy or metadata.
  return svg.replace(/(\s)([A-Za-z][\w:-]*)="([^"]*)"/g,(full,space,attribute,value)=>{
    let next=value;
    if(attribute==='id'&&ids.has(value))next=prefix+'-'+value;
    else if(['href','xlink:href'].includes(attribute)&&value.startsWith('#')&&ids.has(value.slice(1)))next='#'+prefix+'-'+value.slice(1);
    else if(['aria-labelledby','aria-describedby'].includes(attribute))next=value.split(/\s+/).map(id=>ids.has(id)?prefix+'-'+id:id).join(' ');
    else if(referenceAttributes.has(attribute))next=value.replace(/url\(#([^\)]+)\)/g,(token,id)=>ids.has(id)?`url(#${prefix}-${id})`:token);
    return next===value?full:`${space}${attribute}="${next}"`;
  });
}
