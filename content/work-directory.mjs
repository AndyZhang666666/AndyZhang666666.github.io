import {renderSelected, selected} from './showcase.mjs';
import {workRow} from './work-drawers.mjs';
import {escapeHtml as e} from '../assets/project-cards.mjs';

// Optional editorial captions. Membership, names, destinations and evidence come from data.json.
const actions = {
  eval: ['核对一句引用，复核模型的评分。','Check a cited sentence and review a model score.'],
  taste: ['用同一份文案试排海报，带走喜欢的版本。','Try the same copy in different layouts and export a poster.'],
  bundle: ['调采纳率，算出套餐从哪一刻开始多赚。','Change adoption and find when a bundle earns more.'],
  'rag-lab': ['换一个生效日期，查出能引用的条款。','Change the effective date and check which clause applies.'],
  'scene-revision': ['推迟揭晓，找出台词里提前泄露的信息。','Delay a reveal and catch lines that give it away.'],
  'menu-search': ['试搜一道菜的别名，比较找回和错配。','Search for a dish by an alias and compare hits with mismatches.'],
  'generation-quote': ['让一个镜头生成失败，查清实际扣了多少积分。','Fail a shot and reconcile the credits actually charged.'],
  'agent-bench': ['复核一笔超时操作，再决定是否重试。','Inspect a timed-out action before deciding to retry.'],
  renovation: ['比较家具的尺寸和费用，留一份采购交接单。','Compare furniture measurements and fees to prepare a handover.'],
  suibianju: ['改一人的预算，找出全组都能接受的选项。','Change one budget and find options everyone can accept.'],
  grounded: ['拿自己的约束，对照几份互相矛盾的经验。','Compare conflicting accounts against your own constraints.'],
  filing: ['回到财报原文，检查摘要里的断言和遗漏。','Check a filing summary for unsupported and missing claims.'],
  commute: ['比较路线的费用、耗时和波动，留下自己的选择。','Compare fares, duration and variability before choosing a route.'],
  growth: ['对照实验收益和护栏，决定是否扩大流量。','Weigh experiment gains and guardrails before a rollout.'],
  pricing: ['换一种付费机制，比较留存、成本和回本。','Compare retention, costs and payback across pricing models.'],
  fde: ['看选品与知识问答流程怎样保留人工核验。','See where human checks fit into sourcing and support workflows.'],
  'research-agent': ['沿一份投研结论回查材料和样本外验证。','Trace a research conclusion back to sources and out-of-sample checks.'],
  content: ['沿一次咨询回看选题、获客和跟进。','Follow a consultation back to its content and acquisition channel.'],
  'squid-lab': ['换一套鱿鱼规则，回放同一局面的选择。','Replay a position under a different squid rule.'],
  'poker-ev': ['按位置练一手牌，核对范围和胜率。','Practise a hand by position and check its range and equity.'],
  bankroll: ['比较筹码路径，分清曾经达标与最终达标。','Simulate a bankroll and compare hitting a target with finishing there.'],
  'poker-quiz': ['答十道牌桌情境题，看自己的打法倾向。','Answer ten table scenarios to explore your playing style.']
};
export function taskFor(p) {
  return actions[p.id] || [p.presentation?.question?.zh || p.subtitle || p.name, p.presentation?.question?.en || p.subtitleEn || p.nameEn || p.name];
}
export const topics = {
  all:['全部作品','All work'], ai:['AI 与评测','AI & evaluation'], strategy:['搜索策略','Search strategy'],
  life:['生活决策','Everyday decisions'], growth:['增长与商业化','Growth & pricing'],
  practice:['实践案例','Case studies'], poker:['德州工具','Poker tools']
};
export function topicFor(p) {
  if(p.group === 'poker') return 'poker';
  if(p.group === 'cases') return 'practice';
  return p.category === 'personal' ? 'life' : (Object.hasOwn(topics,p.category) ? p.category : 'other');
}
export function orderedProjects(projects) {
  const first=selected.map(item=>item.project), poker=['squid-lab','poker-ev','bankroll','poker-quiz'];
  const rank=p=>first.includes(p.id)?first.indexOf(p.id):p.group==='poker'?100+(poker.includes(p.id)?poker.indexOf(p.id):poker.length):p.group==='cases'?80:20;
  return [...projects].sort((a,b)=>rank(a)-rank(b));
}
export const text=(zh,en,tag='span')=>`<${tag} data-zh="${e(zh)}" data-en="${e(en||zh)}">${e(zh)}</${tag}>`;
function details(p) {
  const entries = [
    ['问题','Problem',p.context||p.description,p.contextEn||p.descriptionEn],
    ...(p.approach||[]).map((v,i)=>['做法','Approach',v,p.approachEn?.[i]]),
    ['结果与边界','Results & limits',p.result,p.resultEn],
    ['项目记录','Project notes',p.metrics?.join(' · '),p.metricsEn?.join(' · ')],
    ['负责范围','Role',p.role,p.roleEn],['时间','Period',p.period,p.periodEn||p.period]
  ].filter(([, ,v])=>v);
  return entries.map(([zh,en,v,ve])=>`<div>${text(zh,en,'dt')}${text(v,ve,'dd')}</div>`).join('');
}
export function directoryPage(projects) {
  const ordered=orderedProjects(projects), counts=new Map();
  for(const p of projects){const k=topicFor(p);counts.set(k,1+(counts.get(k)||0));}
  const choices={...topics,...(counts.has('other')?{other:['其他工具','More tools']}:{})};
  const stats=['main','cases','poker'].map(key=>projects.filter(p=>p.group===key).length);
  const filterLinks=Object.entries(choices).map(([key,name])=>`<a href="/works/${key==='all'?'':'?topic='+key}#catalog" data-filter="${key}">${text(...name)}</a>`).join('');
  const filterOptions=Object.entries(choices).map(([key,[zh,en]])=>`<option value="${key}" data-zh="${e(zh)}" data-en="${e(en)}">${e(zh)}</option>`).join('');
  return `<!doctype html><html lang="zh-CN" data-palette="frost"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>作品集 · 张千羽 / Andy Zhang</title><meta name="description" content="体验四个精选产品，按任务查阅张千羽的产品实验、实践案例与德州工具。"><link rel="icon" href="data:,"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/assets/personal-art-direction.css"><link rel="stylesheet" href="/assets/demo-showcase.css"><link rel="stylesheet" href="/assets/exhibition.css"><link rel="stylesheet" href="/assets/works.css"><link rel="stylesheet" href="/assets/print-exhibits.css"><script src="/assets/work-preferences.js"></script></head>
  <body class="work-page"><a class="work-skip" href="#catalog">${text('跳至全部作品','Skip to all works')}</a><header class="work-bar"><a class="work-signature" href="/">${text('张千羽','Andy Zhang')}</a><a href="/#jd">${text('按任务找作品','Find by task')}</a><label class="palette-field">${text('配色','Palette')}<select id="workPalette" aria-label="配色 / Palette"><option value="frost">象牙纸</option><option value="copper">深海</option><option value="mist">赤砂</option><option value="indigo">苔原</option></select></label><button id="workLanguage" type="button" aria-label="切换语言 / Switch language">EN</button></header>
  <main class="work-index">${renderSelected({projects},{directory:true})}<section id="catalog" aria-labelledby="catalogTitle"><header class="catalog-heading"><div><h2 id="catalogTitle">${text('全部作品','All work')}</h2><p>${text(`${stats[0]} 件产品实验 · ${stats[1]} 篇实践案例 · ${stats[2]} 件德州工具`,`${stats[0]} product experiments · ${stats[1]} case studies · ${stats[2]} poker tools`)}</p></div><a href="#selected">${text('回到四个精选','Back to featured work')} ↑</a></header>
  <nav class="work-filters" aria-label="作品分类 / Filter work"><label for="topicChoice">${text('分类','Topic')}</label><select id="topicChoice">${filterOptions}</select><div class="topic-links">${filterLinks}</div><output id="workCount" aria-live="polite">${projects.length}</output></nav>
  <div id="work-list">${ordered.map((p,i)=>workRow(p,i,{text,taskFor,topicFor,details,topicName:choices[topicFor(p)]})).join('\n')}</div></section><noscript><style>.work-filters{display:none}</style></noscript></main>
  <dialog id="full-proof" aria-label="界面原图 / Full image"><form method="dialog"><button autofocus>${text('关闭原图','Close image')} ×</button></form><img alt=""><p class="zoom-error" hidden>${text('原图暂未载入','Image unavailable')}</p></dialog><script type="module" src="/assets/demo-showcase.mjs"></script><script type="module" src="/assets/work-directory.mjs"></script></body></html>`;
}
