import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {squidProject} from '../content/squid-lab.mjs';
import {renderProjectCards,escapeHtml as e} from '../assets/project-cards.mjs';
const version='20261107-squid1';
const pair=(tag,cls,zh,en)=>`<${tag}${cls?` class="${cls}"`:''} data-zh="${e(zh)}" data-en="${e(en)}">${e(zh)}</${tag}>`;
export function integrateSquidLab(){
 const data=JSON.parse(fs.readFileSync('data.json','utf8'));
 const index=data.projects.findIndex(p=>p.id===squidProject.id);
 if(index<0)data.projects.push(structuredClone(squidProject));else data.projects[index]=structuredClone(squidProject);
 fs.writeFileSync('data.json',JSON.stringify(data,null,2)+'\n');
 let html=fs.readFileSync('index.html','utf8');
 html=html.replace(/<article id="project-squid-lab"[^]*?<\/article>\n?/g,'');
 const card=renderProjectCards([squidProject]);
 html=html.replace(/(<article id="project-poker-ev"[^]*?<\/article>)/,`$1\n${card}`);
 html=html.replaceAll(/查看全部 \d+ 项作品/g,`查看全部 ${data.projects.length} 项作品`).replaceAll(/Explore all \d+ projects/g,`Explore all ${data.projects.length} projects`);
 if(!html.includes('assets/squid-lab-preview.css'))html=html.replace('</head>',`<link rel="stylesheet" href="assets/squid-lab-preview.css?v=${version}">\n</head>`);
 if(!html.includes('assets/squid-lab-preview.mjs'))html=html.replace('</body>',`<script type="module" src="assets/squid-lab-preview.mjs?v=${version}"></script>\n</body>`);
 html=html.replace(/src="app\.js\?v=[^"]*"/,`src="app.js?v=${version}"`);
 fs.writeFileSync('index.html',html);
 let app=fs.readFileSync('app.js','utf8');app=app.replace(/data\.json\?v=[\w.-]+/g,`data.json?v=${version}`);fs.writeFileSync('app.js',app);
 const head=html.slice(html.indexOf('<head>'),html.indexOf('</head>')+7).replace(/href="(?!https?:|\/|#)/g,'href="/').replace(/<title>.*?<\/title>/,'<title>鱿鱼博弈实验室 · 产品判断与验证</title>').replace('</head>',`<link rel="stylesheet" href="/assets/case-studies.css?v=${version}"></head>`);
 const nav=html.slice(html.indexOf('<nav id="nav">'),html.indexOf('</nav>')+6).replaceAll('href="#','href="/#');
 const section=(id,title,en,body)=>`<section id="${id}" class="section"><div class="section-head">${pair('h2','',title,en)}</div>${body}</section>`;
 const body=`<section class="section case-intro"><div class="section-head">${pair('h1','','同样一手牌，规则改变了什么？','The same hand. What did the rules change?')}</div>${pair('p','case-summary',squidProject.description,squidProject.descriptionEn)}<div class="project-links"><a class="project-link" href="/poker-squid-lab/" data-zh="打开完整实验室 ↗" data-en="Open the complete lab ↗">打开完整实验室 ↗</a><a class="project-link" href="/#projects" data-zh="返回作品集" data-en="Back to work">返回作品集</a></div></section>`+
 section('problem','从一笔漏算的结算开始','Start with the missing side ledger',pair('p','about-lead',squidProject.context,squidProject.contextEn))+
 section('approach','让人先判断，再看到差异','Choose before revealing the difference',`<ol class="case-mechanism">${squidProject.approach.map((t,i)=>`<li>${pair('p','principle-desc',t,squidProject.approachEn[i])}</li>`).join('')}</ol>`)+
 section('mechanism','每个结果都能回到事件','Trace each result to its events',pair('p','about-body','有限与无限共用同一段赢家历史，分别发放标记。三标翻倍作用于全部持标；每位无标者独立支付，所有转移相加为零。修改基础奖励会重放历史，改变人数则开启新一轮。','Both modes receive the same winner history. Three-marker doubling applies to the whole holding; unmarked players pay independently and total transfers sum to zero. Reward changes replay the history; lineup changes start a new round.'))+
 section('evidence','验证与适用条件','Verification and applicability',pair('p','about-body','首屏固定样例的三种跟注差额为 −3.75、＋3.75、＋11.25BB，来自明确的牌面、范围和结算条件。规则边界、回放、模拟及导入校验通过后发布，实际结果记录在独立仓库。','The opening sample produces call-minus-fold values of −3.75, +3.75 and +11.25BB from explicit cards, ranges and settlement conditions. The standalone repository records executed rule, replay, simulation and import checks.')+pair('p','about-body','这些是构造场景与固定假设的验证，不是用户盈利、真实行为预测或完整策略求解。','These are authored scenarios and fixed-assumption checks, not measured user profits, behavioral predictions or complete strategy solves.')+`<div class="project-links"><a class="project-link" href="https://github.com/AndyZhang666666/poker-squid-lab/blob/main/docs/VALIDATION.md" data-zh="查看实际验证记录 ↗" data-en="Executed validation ↗">查看实际验证记录 ↗</a><a class="project-link" href="https://github.com/AndyZhang666666/poker-squid-lab/blob/main/docs/METHODS.md" data-zh="规则、公式与来源 ↗" data-en="Rules, methods and sources ↗">规则、公式与来源 ↗</a></div>`);
 fs.mkdirSync('cases/squid',{recursive:true});
 fs.writeFileSync('cases/squid/index.html',`<!doctype html><html lang="zh-CN" data-palette="frost">${head}<body class="case-page"><div class="grain"></div>${nav}<main>${body}</main><footer>© 2026 张千羽 · 产品判断与验证</footer><script src="/scripts/case-reader.js"></script><script type="module" src="/assets/squid-lab-preview.mjs?v=${version}"></script></body></html>\n`);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])integrateSquidLab();
