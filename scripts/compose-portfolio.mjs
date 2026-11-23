import fs from 'node:fs';
import {work,tasks,methods} from '../content/task-portfolio.mjs';

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
 let html=fs.readFileSync('index.html','utf8');
 html=html.replace(/<title>.*?<\/title>/,'<title>张千羽 Andy Zhang · 产品作品集</title>')
 .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="张千羽的产品作品集。操作模型评测、设计和定价工具，了解从用户问题到产品验证的过程。">')
 .replace(/<p class="hero-tagline[^>]*>[\s\S]*?<\/p>/,`<p class="hero-tagline reveal">${text('产品经理','Product manager','strong','hero-role')}${text('我从用户遇到的具体问题出发，做出可以试用的产品，再用反馈和数据决定下一步。','I start with a problem people actually face, build something they can try, then use feedback and data to decide what comes next.','span','hero-summary')}${text('在这里，你可以复核一条模型评语，给同一段文字换一种构图，或算一笔套餐折扣的账。','Here you can review a model’s verdict, try a different layout with the same words, or work out what a bundle discount costs.','span','hero-example')}</p>`)
 .replace(/<div class="hero-cta reveal">[\s\S]*?<\/div>(?:\s*<a href="#jd" class="hero-jd-link[\s\S]*?<\/a>)?/,`<div class="hero-cta reveal"><a href="#selected" class="btn btn-primary">${text('体验精选作品','Try selected work')} <span aria-hidden="true">↗</span></a><a href="#jd" class="btn btn-ghost">${text('按任务找作品','Find work by task')}</a><a href="https://github.com/AndyZhang666666" class="portfolio-git" target="_blank" rel="noopener">GitHub ↗</a></div>`)
 .replace(/<section class="stats">[\s\S]*?<\/section>/,'')
 .replace(/<section id="skills"[^>]*>[\s\S]*?<\/section>/,'');
 html=extend(html,'work',head('工作经历','Experience')+`<dl class="work-notes">${work.map(([id,zh,en,skill,skillEn])=>`<div id="work-${id}">${text(zh,en,'dt')}${text(skill,skillEn,'dd')}</div>`).join('')}</dl>`);
 html=extend(html,'uses',`<div id="skills">${head('我的工作方式','How I work')}</div><div class="method-list">${methods.map(([zh,en,action,actionEn,output,outputEn,name,nameEn,url,tools,toolsEn])=>`<article>${text(zh,en,'h3')}<div>${text(action,actionEn,'p')}${text(tools,toolsEn,'small')}</div><a href="${url}">${text(output+' · '+name,outputEn+' · '+nameEn)} ↗</a></article>`).join('')}</div>`);
 html=extend(html,'jd',head('按任务找作品与证据','Find work by task')+
 `<div class="task-desk"><div class="task-examples"><h3>${text('选一个问题','Choose a question')}</h3>${tasks.slice(0,4).map(x=>`<button type="button" class="jd-sample" data-task="${x.id}" aria-pressed="false">${text(...x.title)}<span aria-hidden="true">↗</span></button>`).join('')}</div>
 <form id="taskForm"><label for="jdInput">${text('或写下你关心的任务','Or describe your task')}</label>
 <textarea id="jdInput" rows="3" maxlength="12000" aria-describedby="taskHint"></textarea>
 ${text('可以粘贴一段岗位要求。输入仅在当前浏览器处理。','You can paste job requirements here. Your text stays in this browser.','small','task-hint').replace('<small ','<small id="taskHint" ')}
 <div class="jd-actions"><button class="jd-btn-run" id="jdRun" disabled>${text('查找材料','Find evidence')}</button><button type="button" class="jd-btn-clear" id="jdClear">${text('清空','Clear')}</button></div></form></div>
 <p id="taskAnnouncement" class="showcase-sr" role="status"></p><div id="jdResult" hidden></div><noscript><a href="#projects">浏览完整作品库 / Browse all work →</a></noscript>`);
 html=menu(html).replace(/<script src="jd-graph\.js[^"]*"><\/script>\s*/,'').replace(/<script (?:type="module" )?src="jd\.js[^"]*">/,'<script type="module" src="jd.js?v=task1">')
 .replace(/(src="(?:app|railnav)\.js|href="(?:jd|assets\/hero-paper)\.css)\?v=[^"]+/g,'$1?v=task1');
 fs.writeFileSync('index.html',html);
 for(const name of fs.readdirSync('cases')){const p='cases/'+name+'/index.html';if(fs.existsSync(p)){const prev=fs.readFileSync(p,'utf8'),next=menu(prev);if(next!==prev)fs.writeFileSync(p,next);}}
 // These sections now ship as bilingual HTML, including without JavaScript.
 let app=fs.readFileSync('app.js','utf8');
 for (const name of ['renderTimeline','renderSkills','renderUses']) {
   app=app.replace('  '+name+'();\n','').replace(new RegExp('function '+name+'\\(\\) \\{[\\s\\S]*?\\n\\}\\n'),'');
 }
 app=app.replace(/  const intro = document.querySelector\('\.hero-tagline'\);[\s\S]*?\n  \}\n/,'')
 .replace(/    if \(typeof applyResumeEvidence[^\n]*\n/,'');
 fs.writeFileSync('app.js',app);
}
compose();
