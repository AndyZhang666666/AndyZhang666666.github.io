// The original shell stays intact. Scoped showcase/library presentation is generated here.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {identity,projects,studies} from '../content/editorial.mjs';
import {presentationFor} from '../content/project-presentation.mjs';
import {renderProjectCards} from '../assets/project-cards.mjs';
import {renderSelected} from '../content/showcase.mjs';
import {renderProductPrinciples} from '../assets/product-principles.mjs';
const localReview=process.argv.includes('--local');
const releaseVersion='20261028-practice1';
const base='86b16f4';
const original=file=>execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'});
const data=JSON.parse(original('data.json'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
data.tagline=identity.short.zh+' '+identity.intro.zh;
data.taglineEn=identity.short.en+' '+identity.intro.en;
data.about.lead=identity.title.zh;data.about.leadEn=identity.title.en;
data.about.body=data.about.body.split('。').slice(1).join('。');
data.about.bodyEn=data.about.bodyEn.split('. ').slice(1).join('. ');
// Keep the original four AI views, bilingual copy and reference links intact.
// Project-specific observations remain in the separate case-study pages.
for(const p of projects){
 const entry=data.projects[p.index],s=studies.find(s=>s.id===p.caseId);
 entry.id=p.id;entry.category=p.category;
 entry.group=['poker-quiz','bankroll','poker-ev'].includes(p.id)?'poker':!entry.url?'cases':'main';
 entry.name=p.name.zh;entry.nameEn=p.name.en;
 entry.description=s?.project===p.id?s.summary.zh:p.description.zh;
 entry.descriptionEn=s?.project===p.id?s.summary.en:p.description.en;
 if(s){entry.iterationUrl=`/cases/${s.id}/`;entry.caseLabel='设计过程';entry.caseLabelEn='Case study';
  entry.context=s.problem.zh;entry.contextEn=s.problem.en;
  entry.approach=s.decisions.map(d=>`${d.title.zh}：${d.text.zh}`);
  entry.approachEn=s.decisions.map(d=>`${d.title.en}: ${d.text.en}`);
  entry.result=s.proof.zh+' '+s.tradeoff.zh;entry.resultEn=s.proof.en+' '+s.tradeoff.en;
 }
 if(entry.url?.startsWith('https://andyzhang666666.github.io'))entry.url=entry.url.slice('https://andyzhang666666.github.io'.length)||'/';
 if(p.id==='taste')entry.url='/tasteroom/?direction=swiss';
 entry.presentation=presentationFor(entry);
}
fs.writeFileSync('data.json',JSON.stringify(data,null,2)+'\n');
let html=original('index.html');
function words(zh,en,newZh,newEn){html=html.replaceAll(esc(zh),esc(newZh)).replaceAll(esc(en),esc(newEn));}
const old=JSON.parse(original('data.json'));
words(old.tagline,old.taglineEn,data.tagline,data.taglineEn);
html=html.replace('data-zh="工具" data-en="Uses">工具','data-zh="我的工作方式" data-en="How I work">我的工作方式');
words('从需求梳理、原型验证到数据复盘，我怎样把工具用在产品工作里。','How I use tools across requirements, prototyping, AI validation and product analysis.','工具跟着任务走，最后留下可以检查的产物。','Tools follow the task. The output should be something we can inspect.');
words('JD 匹配器','JD Matcher','按岗位找证据','Find the evidence');
words('手上有岗位描述？粘贴进来，即时查看匹配情况','Have a job description? Paste it in to see how well I match','手上有岗位描述？找到值得先读的经历与作品。','Have a role in mind? Find relevant experience and work.');
words('粘贴一段岗位描述，按有直接证据、部分相关、暂无经验三档给出匹配结果。全部计算在浏览器本地完成，不上传、不调用接口。','Paste a job description to get a three-tier match: direct evidence, partially related, no experience yet. Runs entirely in your browser; nothing is uploaded.','关键词辅助检索，只在浏览器本地处理。不上传、不调用模型，不计算通过概率或综合匹配分。','Local keyword-assisted search. No upload, model call, hiring probability or overall match score.');
words('开始匹配','Match','查找相关证据','Find evidence');
html=html.replace('<a href="#contact" class="btn btn-ghost" data-zh="联系我" data-en="Contact">联系我</a>','<a href="/assets/resume.pdf" class="btn btn-ghost" download data-zh="下载简历" data-en="Download CV">下载简历</a>');
words('AI 产品、增长、评测体系，或者德州扑克，都可以聊。','AI products, growth, evaluation — or poker. Happy to talk.','AI 应用、Agent，或一个值得重新想想的产品。','An AI application, an Agent, or a product worth thinking through.');
// The original hero's composition is unchanged; its work link now points to selected work.
html=html.replaceAll('href="#projects"','href="#selected"');
// Read the person first, then try their work. Do not move the other existing sections.
html=html.replace(/(<section id="about"[\s\S]*?<\/section>)/,`$1\n\n${renderSelected(data)}`);
// Section/view indexes are presentation, not ordered process steps or factual numbers.
html=html.replace(/\sdata-num="[^"]*"/g,'').replace(/^[ \t]*<span class="section-num">[^<]*<\/span>\n?/gm,'');
html=html.replace('<div class="principle-grid" id="principleGrid"></div>',`<div class="principle-grid" id="principleGrid" aria-label="产品原则与实践">${renderProductPrinciples(data.about.principles)}</div>`);
html=html.replace('id="projects" class="section"','id="projects" class="section project-library"');
html=html.replace('<div id="projectGrid" class="project-grid"></div>',`<div id="projectGrid" class="project-grid">${renderProjectCards(data.projects)}</div>`);
html=html.replace('</head>',`<link rel="stylesheet" href="assets/demo-showcase.css?v=${releaseVersion}">\n</head>`);
html=html.replace('</head>',`<link rel="stylesheet" href="assets/product-principles.css?v=${releaseVersion}">\n</head>`);
// Small native previews replace whole-app iframes and the old parallel calculators.
html=html.replace(/<script src="embed\.js[^\"]*"><\/script>\n?/,'');
html=html.replace('<script src="app.js',`<script type="module" src="assets/demo-showcase.mjs?v=${releaseVersion}"></script>\n<script src="app.js`);
html=html.replace(/src="railnav\.js\?v=[^"]*"/,`src="railnav.js?v=${releaseVersion}"`);
html=html.replace(/src="projects-split\.js\?v=[^"]*"/,`src="projects-split.js?v=${releaseVersion}"`);
// The public master is indexable; --local is available for a private review build.
if(localReview)html=html.replace('<meta charset="UTF-8">','<meta charset="UTF-8">\n<meta name="robots" content="noindex,nofollow">');
html=html.replace(/src="app\.js\?v=[^"]*"/,`src="app.js?v=${releaseVersion}"`).replace(/src="jd\.js\?v=[^"]*"/,`src="jd.js?v=${releaseVersion}"`);
fs.writeFileSync('index.html',html);
let app=original('app.js');
app=app.replace(/^[ \t]*<div class="(?:principle-num|ai-view-num)">[^\n]*<\/div>\n/gm,'');
app=app.replace(/  const pg = document.getElementById\('principleGrid'\);[\s\S]*?  `\)\.join\(''\);/,"  // Keep the static, evidence-linked principles and their material interactions.\n  if (typeof window.refreshProductPrinciples === 'function') window.refreshProductPrinciples(a.principles || []);");
app=app.replace('data.json?v=20261025-demo-suite-3',`data.json?v=${releaseVersion}`);
app=app.replace('<span data-zh="迭代与校验" data-en="Iterations & validation">迭代与校验</span>','<span data-zh="${esc(p.caseLabel || \'迭代与校验\')}" data-en="${esc(p.caseLabelEn || \'Iterations & validation\')}">${esc(p.caseLabel || \'迭代与校验\')}</span>');
app=app.replace(/function renderProjects\(\) \{[\s\S]*?\n\}\n\nfunction renderAwards/,`function renderProjects() {\n  // Static cards are also present without JavaScript. URLs are bound by project ID.\n  if (typeof window.refreshProjectLibrary === 'function') window.refreshProjectLibrary(data.projects);\n}\n\nfunction renderAwards`);
fs.writeFileSync('app.js',app);

// New reading pages use the original site's CSS and vocabulary, not the fusion skin.
const head=html.slice(html.indexOf('<head>'),html.indexOf('</head>')+7).replace(/href="(?!https?:|\/|#)/g,'href="/');
const nav=html.slice(html.indexOf('<nav id="nav">'),html.indexOf('</nav>')+6).replaceAll('href="#','href="/#');
const pair=(tag,cls,v)=>`<${tag} class="${cls}" data-zh="${esc(v.zh)}" data-en="${esc(v.en)}">${esc(v.zh)}</${tag}>`;
for(const study of studies){
 const section=(id,title,en,body)=>`<section id="${id}" class="section"><div class="section-head">${pair('h2','', {zh:title,en})}</div>${body}</section>`;
 const image=(file,caption)=>`<a href="/assets/work/${file}" target="_blank" rel="noopener"><img src="/assets/work/${file}" width="1440" height="1000" style="max-width:100%;height:auto" alt="${esc(caption)}"></a>`;
 const meta=projects.find(p=>p.id===study.project),p=data.projects[meta.index];
 const body=`<section class="section"><div class="section-head">${pair('h1','',study.title)}</div>${pair('p','about-lead',study.summary)}<div class="project-links"><a class="project-link" href="${esc(p.url)}" data-zh="体验 Demo ↗" data-en="Try the demo ↗">体验 Demo ↗</a><a class="project-link" href="/#projects" data-zh="返回作品集" data-en="Back to work">返回作品集</a></div>${pair('p','case-text',study.status)}${image(study.image,study.caption.zh)}</section>`+
 section('problem','要解决的问题','The problem',pair('p','about-lead',study.question)+pair('p','about-body',study.problem)+pair('p','about-body',study.role))+
 section('approach','方案与取舍','Options and tradeoffs',pair('p','about-lead',study.insight)+`<div class="principle-grid">${study.choices.map(([a,b])=>`<article class="principle-card">${pair('h3','principle-title',a)}${pair('p','principle-desc',b)}</article>`).join('')}</div>`)+
 section('mechanism','把判断变成机制','Making the decision work',`<div class="principle-grid">${study.decisions.map(d=>`<article class="principle-card">${pair('h3','principle-title',d.title)}${pair('p','principle-desc',d.text)}</article>`).join('')}</div>${image(study.secondaryImage,study.artifact.zh)}`)+
 section('evidence','验证、代价与下一步','Evidence, limitations and next steps',pair('p','about-body',study.proof)+pair('p','about-body',study.tradeoff)+pair('p','about-body',study.next));
 fs.mkdirSync(`cases/${study.id}`,{recursive:true});
 fs.writeFileSync(`cases/${study.id}/index.html`,`<!doctype html><html lang="zh-CN" data-palette="frost">${head.replace(/<title>.*?<\/title>/,`<title>${esc(p.name)} · 产品判断</title>`)}<body><div class="grain"></div><div class="glow glow-1"></div><div class="glow glow-2"></div>${nav}<main>${body}</main><footer>© 2026 张千羽 · ${localReview?'本地内容评审':'产品判断与验证'}</footer><script src="/scripts/case-reader.js"></script></body></html>`);
}
console.log('Updated the original shell, four native selected previews, explicit project cards and four case pages.');

// Reapply the isolated RAG addition after the existing generator; preserve its own source.
await (await import('../rag-lab/scripts/integrate-site.mjs')).integrateSite();
