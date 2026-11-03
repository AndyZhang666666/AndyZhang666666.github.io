const owner='demo-help:taste';
const dialog=document.createElement('dialog');
dialog.className='demo-help';dialog.setAttribute('aria-labelledby','demo-help-title');
dialog.innerHTML=`<div class="demo-help-heading"><div><p>TasteRoom · 偏爱实验室</p><h2 id="demo-help-title"></h2></div><button type="button" class="demo-help-close" autofocus aria-label="关闭使用帮助">关闭 ×</button></div><div id="demo-help-content"></div><p class="demo-help-foot">Esc 或浏览器返回均可关闭；关闭说明不改变当前作品。</p>`;
document.body.append(dialog);
const content=dialog.querySelector('#demo-help-content');
let opener=null,closing=false;
const projects=[['Eval Lab','核对评分、评语和证据','/llm-output-eval/'],['偏爱实验室','当前作品',''],['Bundle Lab','算清新增贡献与让利','/bundle-lab/simulate/'],['通勤比较器','对照时间、费用与条件','/commute-compare/']];
function render(panel){
 dialog.querySelector('h2').textContent=panel==='nav'?'继续看一件作品':panel==='guide'?'完成一张作品，决定记住什么':'为什么这样做';
 if(panel==='nav')content.innerHTML=`<nav class="demo-project-links" aria-label="四个主推 Demo">${projects.map(([name,description,href])=>href?`<a href="${href}"><strong>${name} ↗</strong><span>${description}</span></a>`:`<div aria-current="page"><strong>${name}</strong><span>${description}</span></div>`).join('')}</nav>`;
 if(panel==='guide')content.innerHTML=`<p class="demo-help-intro">不必按顺序完成。定位不会更改文案、替你选风格或授权记忆。</p><ol class="demo-guide"><li><span>01</span><div><h3>同一内容，比较构图</h3><p>从“探索我的偏爱”选两套构图，控制内容相同；整体喜欢不归因到所有参数。</p><button type="button" data-jump="compare">定位比较入口 →</button></div></li><li><span>02</span><div><h3>先临时试用</h3><p>生成对照后点试用 A/B，检查当前作品；不保存偏好也可导出。定位只聚焦这一步可用的入口。</p><button type="button" data-jump="trial">定位临时试用 →</button></div></li><li><span>03</span><div><h3>确认场景与撤销</h3><p>授权时核对维度和范围；工作与个人场景分开。撤销规则保留当前作品。</p><button type="button" data-jump="memory">查看授权与撤销 →</button></div></li></ol>`;
 if(panel==='about')content.innerHTML=`<div class="demo-about"><section><h3>解决什么问题</h3><p>“我喜欢这种感觉”难以直接变成可复用的设计条件。用自己的短文案比较具体构图，先完成作品，再决定保留什么。</p></section><section><h3>产品取舍</h3><p>六套构图共用同一内容；整体与单变量比较分开。内容编辑、临时参数和场景授权是三层状态，试用或导出不代表同意长期记忆。</p></section><section><h3>当前边界</h3><p>公开版本使用本地规则与确定性 SVG 排版，没有默认模型调用，不是通用自然语言设计师。不理解反馈时只提供手动起点；可选服务端模型只解析，仍需明确授权保存。</p></section><section><h3>投入真实使用前还需验证</h3><p>需验证首次访问者能否完成海报、能否正确理解记忆范围，以及换内容后偏好是否仍适用。六风格、规则调用或一次 A/B 不证明学会了用户的全部审美。</p></section></div>`;
}
function close(){if(closing)return;dialog.close();if(history.state?.demoHelp?.owner===owner){closing=true;history.back();}opener?.focus({preventScroll:true});}
function sync(){closing=false;const state=history.state?.demoHelp;if(state?.owner===owner&&['nav','guide','about'].includes(state.panel)){render(state.panel);if(!dialog.open)dialog.showModal();}else if(dialog.open)dialog.close();}
document.querySelectorAll('[data-help]').forEach(button=>button.addEventListener('click',()=>{if(dialog.open||closing)return;opener=document.activeElement;history.pushState({...history.state,demoHelp:{owner,panel:button.dataset.help}},'',location.href);render(button.dataset.help);dialog.showModal();}));
dialog.querySelector('.demo-help-close').onclick=close;
dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
dialog.addEventListener('click',e=>{
 if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}
 const step=e.target.closest('[data-jump]');if(!step)return;
 const visible=selector=>{const node=document.querySelector(selector);return node&&node.getClientRects().length?node:null;};
 let target;
 if(step.dataset.jump==='memory'){document.querySelector('#showBrain').click();target=document.querySelector('#authorizedScenes');}
 else{document.querySelector('#showCanvas').click();target=step.dataset.jump==='compare'?document.querySelector('#startExplore'):visible('#comparisonVariants [data-comparison-side]')||visible('[data-comparison-scope="once"]')||visible('#startComparison')||document.querySelector('#startExplore');}
 close();requestAnimationFrame(()=>{if(!target.matches('a,button,input,select,textarea,[tabindex]'))target.tabIndex=-1;target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});target.focus({preventScroll:true});});
});
window.addEventListener('popstate',sync);sync();
