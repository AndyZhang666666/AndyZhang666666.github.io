import {t} from '../studio/ui.mjs';
import {depthAt, bookRows, highestWithdrawal} from './research-model.mjs';

const reference = bookRows(depthAt(0));
const cumulativeMax = Math.ceil(Math.max(reference.at(-1).totalBid, reference.at(-1).totalAsk) / 100) * 100;
const price = n => n.toFixed(2);
const percent = n => (n > 0 ? '+' : '') + (n * 100).toFixed(1) + '%';
const sideName = side => side === 'bid' ? t('买一','Best bid') : t('卖一','Best ask');
const xFor = (side, i) => side === 'bid' ? 247 - i * 22 : 297 + i * 22;
const yFor = (v, cap) => +(236 - 184 * v / cap).toFixed(2);

function trace(rows, side, cumulative) {
  const field = cumulative ? (side === 'bid' ? 'totalBid' : 'totalAsk') : side;
  const cap = cumulative ? cumulativeMax : 200;
  const points = rows.map((r,i) => [xFor(side,i),yFor(r[field],cap)]);
  if (!cumulative) {
    const bars = points.map(([x,y]) => 'M'+(x-7)+' 236V'+y+'h14V236Z').join('');
    return {line:'',fill:bars,points};
  }
  let line = 'M'+points[0][0]+' '+points[0][1];
  for (const [x,y] of points.slice(1)) line += 'H'+x+'V'+y;
  const edge = side === 'bid' ? 40 : 504;
  line += 'H'+edge;
  return {line,fill:line+'V236H'+points[0][0]+'Z',points};
}

export function orderBook(fig) {
  const $ = s => fig.querySelector(s);
  const read = $('.rp-readout');
  read.innerHTML = '<div class="rp-readout-top"><span data-r="balance-label"></span><strong data-r="imbalance"></strong></div><div class="rp-balance" aria-hidden="true"><i></i><b></b></div>'+
    '<div class="rp-compare"><span data-r="compare"></span></div><div class="rp-level-label"><label for="rp-depth-level"></label><select id="rp-depth-level"></select></div>'+
    '<table class="rp-book-table"><thead><tr><th></th><th></th><th></th></tr></thead><tbody><tr class="rp-buy"><th></th><td></td><td></td></tr><tr class="rp-sell"><th></th><td></td><td></td></tr></tbody></table>';
  const levelSelect = $('#rp-depth-level');
  let side = 'bid', cumulative = true, level = 0, amount = 0;
  for(const key of ['bid','ask']){
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    $('[data-fill-'+key+']').append(path);
  }
  function draw() {
    const q=depthAt(amount, side), rows=bookRows(q), before=depthAt(0);
    for(const s of ['bid','ask']){
      const a=trace(rows,s,cumulative), base=trace(reference,s,cumulative);
      $('[data-fill-'+s+'] path').setAttribute('d',a.fill);
      $('[data-path-'+s+']').setAttribute('d',a.line);
      $('[data-base-'+s+']').setAttribute('d',amount && side===s ? (cumulative ? base.line : base.fill.slice(0,base.fill.indexOf('Z')+1)) : '');
      const [x,y]=a.points[level];
      $('[data-dot-'+s+']').setAttribute('cx',x);$('[data-dot-'+s+']').setAttribute('cy',y);
      $('[data-rule-'+s+']').setAttribute('d','M'+x+' 41V235');
    }
    $('[data-bid-label]').textContent=t('买侧','BID');
    $('[data-ask-label]').textContent=t('卖侧','ASK');
    $('[data-spread-label]').textContent=t('价差','SPREAD')+' 0.25';
    $('[data-plot-max]').textContent=(cumulative?cumulativeMax:200)+' '+t('手','lots');
    $('[data-plot-unit]').textContent=cumulative?t('累计挂量','CUMULATIVE DEPTH'):t('单档挂量','RESTING SIZE');
    $('[data-r=balance-label]').textContent=t('最优档不平衡','Top-of-book imbalance');
    $('[data-r=imbalance]').textContent=percent(q.imbalance);
    $('.rp-balance i').style.width=(100*q.bid/(q.bid+q.ask))+'%';
    $('[data-r=compare]').textContent=amount ? t('撤单前 ','Before ')+percent(before.imbalance)+'  →  '+percent(q.imbalance) : t('买量减卖量，除以两侧总量。','Bid minus ask, divided by their sum.');
    $('.rp-level-label label').textContent=t('查看盘口','Inspect level');
    for(let i=0;i<rows.length;i++){
      if(!levelSelect.options[i])levelSelect.add(new Option('',String(i)));
      levelSelect.options[i].textContent=t('第 '+(i+1)+' 档','Level '+(i+1));
    }
    levelSelect.value=String(level);
    const fields=[t('方向','Side'),t('报价','Price'), cumulative?t('累计手数','Total lots'):t('手数','Lots')];
    read.querySelectorAll('thead th').forEach((th,i)=>th.textContent=fields[i]);
    const row=rows[level];
    for(const [s,klass] of [['bid','buy'],['ask','sell']]){
      const cells=read.querySelector('.rp-'+klass).children;
      cells[0].textContent=s==='bid'?t('买','Bid'):t('卖','Ask');
      cells[1].textContent=price(row[s+'Price']);cells[2].textContent=String(cumulative?row[s==='bid'?'totalBid':'totalAsk']:row[s]);
    }
    const selector=key=>'[data-act="'+key+'"]';
    for(const key of ['bid','ask','cumulative','levels']){
      const b=$(selector(key));if(b)b.setAttribute('aria-pressed',String(key===side || key===(cumulative?'cumulative':'levels')));
    }
    return t('买一','Bid')+' 5000.00 × '+q.bid+'　'+t('卖一','Ask')+' 5000.25 × '+q.ask+'　'+t('价差','Spread')+' 0.25';
  }
  levelSelect.onchange=()=>{level=Number(levelSelect.value);draw();};
  const svg=$('.rp-illustration svg');
  svg.addEventListener('click',event=>{
    const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
    const matrix=svg.getScreenCTM();if(!matrix)return;
    const p=point.matrixTransform(matrix.inverse());
    if(p.y<36 || p.y>244 || p.x<31 || p.x>513)return;
    level=Math.min(9,Math.max(0,Math.round((Math.abs(p.x-272)-25)/22)));draw();
  });
  return {
    get max(){return highestWithdrawal(side);},
    get playTo(){return side==='bid'?24:50;},
    get title(){return t('撤单实验','Order cancellation');},
    get label(){return t('撤掉','Withdraw from ')+sideName(side)+(t('挂量',''));},
    get valueLabel(){return amount+' '+t('手','lots');},
    get playLabel(){return t('回放撤单','Replay withdrawal');},
    groups(){return [[['bid',t('撤买单','Bid side')],['ask',t('撤卖单','Ask side')]],[['cumulative',t('累计深度','Cumulative')],['levels',t('逐档挂量','Per level')]]];},
    set(value){amount=value;return draw();},
    action(key){
      if(key==='bid'||key==='ask'){side=key;amount=Math.min(amount,highestWithdrawal(side));}
      else if(key==='cumulative'||key==='levels')cumulative=key==='cumulative';
      else if(key==='reset'){side='bid';cumulative=true;level=0;amount=0;}
      return amount;
    }
  };
}
