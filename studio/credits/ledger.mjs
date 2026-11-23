const integer=(n,min=0,max=1000000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const dateOK=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
export function wallet({paid=90,gift=18,day='2026-11-23',expiry='2026-11-24',caps={director:60,editor:48}}={}){
 if(!integer(paid)||!integer(gift)||!dateOK(day)||!dateOK(expiry)||!Object.values(caps).every(n=>integer(n)))throw Error('invalid');
 return {paid,gift:day>expiry?0:gift,day,expiry,caps:{...caps},expired:day>expiry?gift:0,batches:[],log:[]};
}
export const spentBy=(w,who)=>w.batches.flatMap(b=>b.shots).filter(s=>s.who===who&&['held','done'].includes(s.state)).reduce((n,s)=>n+s.unit,0);
export function quote(w,who,count,unit){
 if(!Object.hasOwn(w.caps,who)||!integer(count,1,50)||!integer(unit,1,10000))throw Error('invalid');
 const total=count*unit,available=w.paid+w.gift,remaining=w.caps[who]-spentBy(w,who);
 return {who,count,unit,total,available,remaining,gift:Math.min(total,w.gift),paid:Math.max(0,total-w.gift),gates:[...(total>available?['funds']:[]),...(total>remaining?['cap']:[])],day:w.day};
}
function hold(w,shot){
 shot.gift=Math.min(w.gift,shot.unit);shot.paid=shot.unit-shot.gift;
 w.gift-=shot.gift;w.paid-=shot.paid;shot.state='held';
}
function event(w,shot,action,amounts={}){
 w.log.push({day:w.day,id:shot.id,attempt:shot.attempt,member:shot.who,action,...amounts});
}
export function reserve(w,who,count,unit){
 const q=quote(w,who,count,unit);if(q.gates.length)throw Error(q.gates.join('+'));
 const copy=structuredClone(w),id=copy.batches.length+1,b={id,quote:q,shots:[]};
 for(let i=1;i<=count;i++){
  const s={id:id+'-'+i,who,unit,state:'',attempt:1};hold(copy,s);event(copy,s,'hold',{gift:s.gift,paid:s.paid});b.shots.push(s);
 }
 copy.batches.push(b);return copy;
}
export function advance(w,day){
 if(!dateOK(day)||day<w.day)throw Error('date');
 const copy=structuredClone(w);copy.day=day;
 if(day>w.expiry){copy.expired+=copy.gift;copy.gift=0;}
 return copy;
}
export function transition(w,id,action){
 const copy=structuredClone(w),s=copy.batches.flatMap(b=>b.shots).find(row=>row.id===id);
 if(!s)throw Error('shot');
 if(action==='retry'){
  if(s.state!=='failed')return w;
  const q=quote(w,s.who,1,s.unit);if(q.gates.length)throw Error(q.gates.join('+'));
  s.attempt++;hold(copy,s);event(copy,s,'hold',{gift:s.gift,paid:s.paid});return copy;
 }
 if(!['done','failed','cancelled'].includes(action))throw Error('action');
 if(s.state!=='held')return w;
 s.state=action;
 if(action==='done'){event(copy,s,action,{charged:s.unit,gift:s.gift,paid:s.paid});}
 else{
  const expired=copy.day>copy.expiry?s.gift:0,returnedGift=s.gift-expired;
  copy.gift+=returnedGift;copy.paid+=s.paid;copy.expired+=expired;
  event(copy,s,action,{returnedGift,returnedPaid:s.paid,expired});
 }
 return copy;
}
export function receipt(w){
 const all=w.batches.flatMap(b=>b.shots);
 return {units:'example credits',day:w.day,available:{paid:w.paid,gift:w.gift},expired:w.expired,held:all.filter(s=>s.state==='held').reduce((n,s)=>n+s.unit,0),charged:all.filter(s=>s.state==='done').reduce((n,s)=>n+s.unit,0),batches:w.batches,events:w.log};
}
