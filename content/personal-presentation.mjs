// Presentation only. Career, degree, thesis, project and award results remain supplied facts.
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=(tag,cls,zh,en)=>`<${tag} class="${cls}" data-zh="${e(zh)}" data-en="${e(en??zh)}">${e(zh)}</${tag}>`;
export const awardDestinations=[
 ['https://www.bristol.ac.uk/science-engineering/schools/elec-mech/','学院官网','School website'],
 ['https://www.jamesdysonaward.org/en-us/faq/','赛事官网','Award website'],
 ['https://ucle.co/','主办方官网','Organiser website'],
 ['https://portal.bloombergforeducation.com/trading_challenges','赛事官网','Challenge website']
];
export function applyPersonalPresentation(data){
 data.about.facts=[
  {k:'学术训练',kEn:'Academic background',v:'电子电气工程 / 金融工程',vEn:'Electrical engineering / Financial engineering'},
  {k:'我相信',kEn:'What I believe',v:'时间对每个人都是公平的。\n先执行，再思考。',vEn:'Time treats everyone equally.\nAct first, then think.'},
  {k:'工作语言',kEn:'Working languages',v:'中文 / English / 法语（不熟练）',vEn:'Chinese / English / French (not fluent)'},
  {k:'屏幕之外',kEn:'Outside work',v:'汽车、骑行、电子音乐，也打德州扑克',vEn:'Cars, cycling, electronic music and poker'}
 ];
 const tags=[
  [['订单流','日内交易','量化建模','市场微观结构','交易信号研究'],['Order flow','Intraday trading','Quantitative modelling','Market microstructure','Trading signal research']],
  [['可穿戴设备','姿态监测','人体工学','传感数据','机器学习','移动端交互'],['Wearable devices','Posture monitoring','Ergonomics','Sensor data','Machine learning','Mobile interaction']]
 ];
 data.education.forEach((education,i)=>{if(education.thesis&&tags[i]){education.thesis.tags=tags[i][0];education.thesis.tagsEn=tags[i][1]}});
 const names=['Dean’s List','James Dyson Award','UCL Business Game','Bloomberg Global Trading Challenge'];
 data.awards.forEach(a=>{const d=awardDestinations[names.findIndex(name=>a.name.startsWith(name))];if(d){a.url=d[0];a.linkLabel=d[1];a.linkLabelEn=d[2]}});
 return data;
}
export function renderIntro(data){
 const split=(text,en)=>{const at=text.indexOf(en?'. ':'。');return at<0?[text,'']:[text.slice(0,at+1),text.slice(at+(en?2:1)).trim()]};
 const zh=split(data.tagline,false),en=split(data.taglineEn,true);
 return t('strong','hero-role',zh[0],en[0])+t('span','hero-summary',zh[1],en[1]);
}
const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export function renderHonours(awards){return awards.map(a=>`<a class="award-item honour-row" href="${e(a.url)}" target="_blank" rel="noopener"><div>${t('h3','award-name',a.name,a.nameEn)}${t('p','award-meta',a.meta,a.metaEn)}</div><span class="honour-link">${t('span','',a.linkLabel,a.linkLabelEn)}${arrow}</span></a>`).join('')}
const icons={email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',phone:'<path d="M7 3H4v4c0 7 6 13 13 13h3v-4l-5-2-2 2a13 13 0 0 1-5-5l2-2Z"/>',wechat:'<path d="M20 11c0 4-4 7-9 7l-5 3v-5c-2-1-3-3-3-5 0-4 4-7 8-7s9 3 9 7Z"/><path d="M8 10h.01M14 10h.01"/>',github:'<path d="M9 20c-5 1-5-3-7-3m14 5v-4c0-1 .1-2-.5-2.8 4-.4 7-2 7-6a5 5 0 0 0-1.4-3.5c.1-.9.2-2-.2-3.1-2 0-3.3.8-4 1.4a15 15 0 0 0-7.7 0C7.5 3.4 6 2.6 4 2.6c-.5 1-.4 2.3-.2 3.2A5 5 0 0 0 2.5 9c0 4 3 5.8 7 6.2-.6.7-.7 1.8-.7 2.8v4"/>'};
export function renderContacts(c){
 const items=[{id:'email',label:'邮件',en:'Email',value:c.email,href:'mailto:'+c.email},{id:'phone',label:'手机',en:'Phone',value:c.phone,copy:true},{id:'wechat',label:'微信',en:'WeChat',value:c.wechat,copy:true},{id:'github',label:'GitHub',en:'GitHub',value:'@AndyZhang666666',href:c.github}];
 return items.map(it=>{const tag=it.copy?'button':'a',attrs=it.copy?` type="button" data-copy="${e(it.value)}"`:` href="${e(it.href)}"${it.id==='github'?' target="_blank" rel="noopener"':''}`;return `<${tag}${attrs} class="contact-item contact-${it.id}"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[it.id]}</svg></span><span class="contact-text">${t('span','contact-label',it.label,it.en)}<span class="contact-value">${e(it.value)}</span></span>${it.copy?`<span class="contact-action">${t('span','','复制','Copy')}<span class="copy-hint" role="status" aria-live="polite"></span></span>`:arrow}</${tag}>`}).join('');
}
const sideCopy={
 fde:['为企业做 AI 工具','Building AI tools for businesses','从选品、商品问答到生产记录，把反复整理信息的步骤做成工具，保留人工确认。','Turn repetitive research, product questions and production records into tools with human confirmation.'],
 'research-agent':['把投研做成自己的工作流','A personal research workflow','多源资料整理、盘后复盘和量化研究分开推进；重要结论保留原始材料与对照依据。','Keep multi-source research, market review and quantitative studies distinct, with original material behind the conclusions.'],
 content:['做过留学咨询内容业务','A study-abroad content business','围绕目标国家与预算经营内容账号，把选题、咨询和线索跟进连成可复盘的流程。','Connect content, consultations and lead follow-up around destination and budget needs.']
};
export function renderSidePractice(p){const c=sideCopy[p.id]||[p.name,p.nameEn,p.description,p.descriptionEn];return `<article id="project-${e(p.id)}" class="project-card practice-row" data-project-id="${e(p.id)}" data-project-group="cases"><div class="project-card-inner"><div class="practice-summary">${t('h3','project-name',c[0],c[1])}${t('p','project-desc',c[2],c[3])}</div><div class="practice-context">${p.iterationUrl?`<a class="practice-open" href="${e(p.iterationUrl)}">${t('span','','看交付思路','See the approach')}${arrow}</a>`:`<details class="practice-details"><summary>${t('span','','展开背景与做法','Background & approach')}</summary><div>${t('p','',p.context,p.contextEn)}<ul>${(p.approach||[]).map((a,i)=>t('li','',a,p.approachEn?.[i])).join('')}</ul>${t('p','',p.result,p.resultEn)}</div></details>`}</div></div></article>`}
export function transformPersonalHTML(html,data){
 html=html.replace(/^[ \t]*<div class="hero-scroll">[\s\S]*?<\/div>\s*<\/div>\n?/m,'');
 html=html.replace(/<p class="hero-tagline[^>]*>[\s\S]*?<\/p>/,`<p class="hero-tagline reveal">${renderIntro(data)}</p>`);
 html=html.replace('<div id="awardList" class="award-list"></div>',`<div id="awardList" class="award-list">${renderHonours(data.awards)}</div>`);
 html=html.replace('<div id="contactGrid" class="contact-grid"></div>',`<div id="contactGrid" class="contact-grid">${renderContacts(data.contact)}</div>`);
 const themes=[['frost','霜 · 象牙纸','#f5f2eb','#d9481c','#446477'],['copper','夜 · 深海','#10222d','#a0d5d4','#e9b27e'],['mist','陶 · 赤砂','#ead0bf','#823b27','#386251'],['indigo','野 · 苔原','#d9e7d4','#315f45','#a34940']];
 html=html.replace(/<button type="button" class="ps-btn"[^>]*><\/button>/g,()=>{const a=themes.shift();return `<button type="button" class="ps-btn" data-palette="${a[0]}" data-name="${a[1]}" style="--sw-bg:${a[2]};--sw-accent:${a[3]};--sw-third:${a[4]}" aria-label="${a[1]}" aria-pressed="${a[0]==='frost'}"></button>`});
 return html;
}
export function patchPersonalApp(app){
 app=app.replace("b.classList.toggle('active', b.dataset.palette === current())","{ b.classList.toggle('active', b.dataset.palette === current()); b.setAttribute('aria-pressed', String(b.dataset.palette === current())); }");
 app=app.replace(/intro.dataset.zh = data.tagline;[\s\S]*?intro.textContent = data.tagline;/,"intro.innerHTML = window.personalPresentation.renderIntro(data);");
 app=app.replace(/function renderAwards\(\) \{[\s\S]*?\n\}\n\nfunction renderSkills/,"function renderAwards() { document.getElementById('awardList').innerHTML = window.personalPresentation.renderHonours(data.awards); }\n\nfunction renderSkills");
 app=app.replace(/function renderContact\(\) \{[\s\S]*?\n\}\n\n\/\/ ===== EVENTS/,"function renderContact() { document.getElementById('contactGrid').innerHTML = window.personalPresentation.renderContacts(data.contact); }\n\n// ===== EVENTS");
 app=app.replace("        await navigator.clipboard.writeText(el.dataset.copy);", "        await navigator.clipboard.writeText(el.dataset.copy);\n        el.querySelector('.copy-hint').textContent = lang === 'en' ? 'Copied' : '已复制';");
 app=app.replace("      } catch (_) {}\n    });\n  });", "      } catch (_) {\n        el.querySelector('.copy-hint').textContent = lang === 'en' ? 'Select text to copy' : '请选中文字复制';\n        el.classList.add('copied');\n        setTimeout(() => el.classList.remove('copied'), 2400);\n      }\n    });\n  });");
 app=app.replaceAll("setTimeout(() => el.classList.remove('copied'), 1600)", "setTimeout(() => { el.classList.remove('copied'); el.querySelector('.copy-hint').textContent = ''; }, 1600)");
 app=app.replaceAll("setTimeout(() => el.classList.remove('copied'), 2400)", "setTimeout(() => { el.classList.remove('copied'); el.querySelector('.copy-hint').textContent = ''; }, 2400)");
 return app;
}
