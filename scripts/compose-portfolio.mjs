import fs from 'node:fs';
import {methods} from '../content/task-portfolio.mjs';

import {hero,aboutStrategy} from '../content/resume-profile.mjs';
import {experienceHTML,resumeLinks,resultPrompts,correctFacts,syncProfile} from './compose-resumes.mjs';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const text=(zh,en,tag='span',cls='')=>`<${tag}${cls?' class="'+cls+'"':''} data-zh="${esc(zh)}" data-en="${esc(en)}">${esc(zh)}</${tag}>`;
const section=(id,body)=>`<section id="${id}" class="section${id==='jd'?' jd-matcher':''}">${body}</section>`;
const head=(zh,en)=>`<div class="section-head">${text(zh,en,'h2')}</div>`;
const extend=(html,id,body)=>html.replace(new RegExp('<section id="'+id+'"[^>]*>[\\s\\S]*?</section>'),section(id,body));

function menu(html) {
 return html.replace(/<a href="\/?#skills"><span data-zh="能力"[^]*?<\/a>/g,'')
 .replaceAll('data-zh="工具" data-en="Toolkit">工具','data-zh="工作方式" data-en="How I work">工作方式')
 .replaceAll('data-zh="按岗位找证据" data-en="Role evidence">按岗位找证据','data-zh="按任务找作品" data-en="Find work by task">按任务找作品');
}
export function compose(){
 let html=fs.readFileSync('index.html','utf8').replace(/<details class="resume-picker"[^]*?<\/details>/,'');
 html=html.replace(/<title>.*?<\/title>/,'<title>张千羽 Andy Zhang · 产品作品集</title>')
 .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="张千羽的产品作品集。操作模型评测、设计和定价工具，了解从用户问题到产品验证的过程。">')
 .replace(/<p class="hero-tagline[^>]*>[\s\S]*?<\/p>/,`<p class="hero-tagline reveal">${text('产品经理','Product manager','strong','hero-role')}${text(...hero[0],'span','hero-summary')}${text(...hero[1],'span','hero-example')}</p>`)
 .replace(/<div class="hero-cta reveal">[\s\S]*?<\/div>(?:\s*<a href="#jd" class="hero-jd-link[\s\S]*?<\/a>)?/,`<div class="hero-cta reveal"><a href="#selected" class="btn btn-primary">${text('体验精选作品','Try selected work')} <span aria-hidden="true">↗</span></a><a href="#jd" class="btn btn-ghost">${text('按任务找作品','Find work by task')}</a><a href="https://github.com/AndyZhang666666" class="portfolio-git" target="_blank" rel="noopener">GitHub ↗</a></div>${resumeLinks()}`)
 .replace(/<section class="stats">[\s\S]*?<\/section>/,'')
 .replace(/<section id="skills"[^>]*>[\s\S]*?<\/section>/,'');
 html=extend(html,'work',head('工作经历','Experience')+experienceHTML());
 html=extend(html,'uses',`<div id="skills">${head('我的工作方式','How I work')}</div><div class="method-list">${methods.map(([zh,en,action,actionEn,output,outputEn,name,nameEn,url,tools,toolsEn])=>`<article>${text(zh,en,'h3')}<div>${text(action,actionEn,'p')}${text(tools,toolsEn,'small')}</div><a href="${url}">${text(output+' · '+name,outputEn+' · '+nameEn)} ↗</a></article>`).join('')}</div>`);
 html=extend(html,'jd',head('按任务找作品与证据','Find work by task')+
 `<div class="task-desk"><div class="task-examples"><h3>${text('选一个问题','Choose a question')}</h3>${resultPrompts()}</div>
 <form id="taskForm"><label for="jdInput">${text('或写下你关心的任务','Or describe your task')}</label>
 <textarea id="jdInput" rows="3" maxlength="12000" aria-describedby="taskHint"></textarea>
 ${text('可以粘贴一段岗位要求。输入仅在当前浏览器处理。','You can paste job requirements here. Your text stays in this browser.','small','task-hint').replace('<small ','<small id="taskHint" ')}
 <div class="jd-actions"><button class="jd-btn-run" id="jdRun" disabled>${text('查找材料','Find evidence')}</button><button type="button" class="jd-btn-clear" id="jdClear">${text('清空','Clear')}</button></div></form></div>
 <p id="taskAnnouncement" class="showcase-sr" role="status"></p><div id="jdResult" hidden></div><noscript><a href="#projects">浏览完整作品库 / Browse all work →</a></noscript>`);
 html=menu(html).replace(/<script src="jd-graph\.js[^"]*"><\/script>\s*/,'').replace(/<script (?:type="module" )?src="jd\.js[^"]*">/,'<script type="module" src="jd.js?v=task1">')
 .replace(/(src="(?:app|railnav)\.js|href="(?:jd|assets\/hero-paper)\.css)\?v=[^"]+/g,'$1?v=task1');
 const description='张千羽的产品作品集。查看 AI 应用、海外增长与商业化、策略产品简历，按具体任务找到工作案例和可操作作品。';
 html=html.replace(/<meta (?:property="og:description"|name="twitter:description")[^>]*>\s*/g,'').replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${description}">\n<meta property="og:description" content="${description}">\n<meta name="twitter:description" content="${description}">`);
 let paragraph=0;
 html=html.replace(/<section id="about"[^]*?<\/section>/,region=>region.replace(/<p class="about-body"[^>]*>[^]*?<\/p>/g,match=>++paragraph===3?text(...aboutStrategy,'p','about-body'):match));
 html=html.replaceAll('?v=task1','?v=cv1');
 const data=syncProfile(JSON.parse(fs.readFileSync('data.json','utf8')));
 fs.writeFileSync('data.json',JSON.stringify(data,null,2)+'\n');
 for(const locale of ['zh','en']){
   const file='content/evidence-'+locale+'.json';
   fs.writeFileSync(file,correctFacts(fs.readFileSync(file,'utf8')));
 }
 fs.writeFileSync('index.html',html);
 for(const name of fs.readdirSync('cases')){const p='cases/'+name+'/index.html';if(fs.existsSync(p)){const prev=fs.readFileSync(p,'utf8'),next=menu(prev);if(next!==prev)fs.writeFileSync(p,next);}}
 // These sections now ship as bilingual HTML, including without JavaScript.
 let app=fs.readFileSync('app.js','utf8');
 for (const name of ['renderTimeline','renderSkills','renderUses']) {
   app=app.replace('  '+name+'();\n','').replace(new RegExp('function '+name+'\\(\\) \\{[\\s\\S]*?\\n\\}\\n'),'');
 }
 app=app.replace(/  const intro = document.querySelector\('\.hero-tagline'\);[\s\S]*?\n  \}\n/,'')
 .replace(/    if \(typeof applyResumeEvidence[^\n]*\n/,'');
 app=app.replace(/data\.json\?v=[\w.-]+/,'data.json?v=cv1')
   .replace('${year(e.period)} · ${e.role}',"${[year(e.period),e.role].filter(Boolean).join(' · ')}")
   .replace('${year(e.period)} · ${e.roleEn || e.role}',"${[year(e.period),e.roleEn || e.role].filter(Boolean).join(' · ')}");
 fs.writeFileSync('app.js',app);
}
compose();
await import("./compose-studio.mjs");
