// The judgment set describes this original menu, not production traffic.
export const dishes = [
  ['cw','鸡肉沙威玛卷','Chicken shawarma wrap','شاورما دجاج ساندويتش','wrap','chicken',74],
  ['cp','鸡肉沙威玛拼盘','Chicken shawarma plate','صحن شاورما دجاج','plate','chicken',83],
  ['bw','牛肉沙威玛卷','Beef shawarma wrap','ساندويتش شاورما لحم','wrap','beef',65],
  ['fw','鹰嘴豆饼卷','Falafel wrap','ساندويتش فلافل','wrap','falafel',97],
  ['fp','鹰嘴豆饼拼盘','Falafel plate','صحن فلافل','plate','falafel',61],
  ['ck','鸡肉卡布萨饭','Chicken kabsa rice','كبسة دجاج','rice','chicken',80],
  ['lk','羊肉卡布萨饭','Lamb kabsa rice','كبسة لحم غنم','rice','lamb',66],
  ['fr','薯条','French fries','بطاطس مقلية','side','',88],
  ['hu','鹰嘴豆泥','Hummus','حمص','side','',71],
  ['ls','扁豆汤','Lentil soup','شوربة عدس','soup','',55],
  ['tk','鸡肉烤串','Chicken kebab','كباب دجاج','grill','chicken',70],
  ['mt','薄荷茶','Mint tea','شاي بالنعناع','drink','',60]
].map(([id,zh,en,ar,form,ingredient,orders])=>({id,zh,en,ar,form,ingredient,orders,aliases:[]}));

export const originalQueries = [
 ['shawerma chicken wrap','cw'],['chicken shawarma wrap','cw'],['chicken shawarma plate','cp'],
 ['shawurma beef wrap','bw'],['beef shawarma wrap','bw'],['falafel wrap','fw'],['falafel plate','fp'],
 ['شاورما دجاج ساندويتش','cw'],['صحن شاورما دجاج','cp'],['ساندويتش فلافل','fw'],
 ['kabsah chicken','ck'],['kabsa lamb','lk'],['French fries','fr'],['hummus','hu'],
 ['lentil soup','ls'],['mint tea','mt'],['chicken kebab','tk'],['chicken kabsa rice','ck']
].map(([q,id])=>({q,id}));
export const modes=['literal','alias','wide'];
const translations=new Map(Object.entries({shawerma:'shawarma',shawurma:'shawarma',kabsah:'kabsa',houmous:'hummus'}));
export const rules={literal:'match-all',alias:'match-all + spelling aliases',wide:'alias + wrap category fallback, then popularity'};
const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/gu,'').replace(/[أإآ]/gu,'ا').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function search(menu,query,mode='literal'){
 if(!modes.includes(mode))throw Error('Unknown search rule');
 const q=clean(query);
 if(!q)return [];
 const words=q.split(' ').map(w=>mode==='literal'?w:translations.get(w)||w);
 return menu.map(d=>{
  const names=[d.zh,d.en,d.ar,...(mode==='literal'?[]:d.aliases)].map(clean);
  const tokens=new Set(names.flatMap(s=>s.split(' ')));
  const matched=words.every(w=>tokens.has(w));
  const broad=mode==='wide' && words.includes('wrap') && d.form==='wrap';
  if(!matched&&!broad)return null;
  const exact=names.includes(words.join(' '));
  return {dish:d,reason:matched?(exact?'name':'terms'):'category',priority:mode==='wide'&&broad?1000+d.orders:(exact?400:200)+d.orders};
 }).filter(Boolean).sort((a,b)=>b.priority-a.priority||a.dish.id.localeCompare(b.dish.id));
}
export function compare(menu,queries,baseline,candidate){
 return queries.map(({q,id})=>{
  const old=search(menu,q,baseline).map(row=>row.dish.id),next=search(menu,q,candidate).map(row=>row.dish.id);
  const status=old[0]===id && next[0]!==id?'lost':old[0]!==id && next[0]===id?'won':'same';
  return {q,expected:id,before:old,after:next,status};
 });
}
export function parseMenu(text){
 const lines=text.split(/\r?\n/).filter(s=>s.trim());
 if(!lines.length||lines.length>100)throw Error('rows');
 const keys=new Map(dishes.flatMap(d=>[d.zh,d.en,d.ar].map(name=>[clean(name),d])));
 const seen=new Set(),targets=new Map(originalQueries.map(r=>[clean(r.q),r.id]));
 return lines.map((line,i)=>{
  const parts=line.split('|').map(s=>s.trim()),[name,raw]=parts;
  const key=clean(name||'');
  if(parts.length!==2||!key||name.length>100||!raw||raw.length>240)throw Error(String(i+1));
  const previous=keys.get(key),id=previous?.id||'user-'+i;
  if(seen.has(id))throw Error(String(i+1));
  seen.add(id);
  const aliases=[...new Set(raw.split(/[,，]/).map(s=>s.trim()).filter(Boolean))];
  if(!aliases.length||aliases.some(a=>!clean(a)))throw Error(String(i+1));
  for(const alias of aliases){
   const k=clean(alias);
   if(targets.has(k)&&targets.get(k)!==id)throw Error(String(i+1));
   targets.set(k,id);
  }
  return {id,zh:previous?.zh||name,en:previous?.en||name,ar:previous?.ar||'',ingredient:previous?.ingredient||'',form:previous?.form||'custom',orders:previous?.orders||0,aliases};
 });
}
export function withMenuEdits(custom){
 const full=new Map(dishes.map(d=>[d.id,d]));
 for(const d of custom){
  const old=full.get(d.id);
  full.set(d.id,old?{...old,aliases:[...new Set([...old.aliases,...d.aliases])]}:d);
 }
 return [...full.values()];
}
export function withQueryEdits(custom){
 const all=new Map(originalQueries.map(row=>[clean(row.q),row]));
 for(const d of custom)for(const q of d.aliases)if(!all.has(clean(q)))all.set(clean(q),{q,id:d.id});
 return [...all.values()];
}
