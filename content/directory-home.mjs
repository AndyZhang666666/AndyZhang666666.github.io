import {sectionRange} from './section-range.mjs';
import {text} from './work-directory.mjs';
export function directoryHome(html, projects){
  const {start,end}=sectionRange(html,'projects');
  const n=projects.filter(p=>p.group==='poker').length;
  const section=`<section id="projects" class="section project-library home-table" data-exhibit-view="table"><div id="pokerStage"><div class="pgroup pgroup-poker" id="poker-table" data-pgroup="poker"><div class="pgroup-head"><h2 class="pgroup-title">${text('德州牌桌','At the poker table')}</h2></div><div class="pgroup-grid"><a class="table-archive" href="/works/?topic=poker">${text('查看 '+n+' 个德州工具','Explore '+n+' poker tools')} <span aria-hidden="true">→</span></a></div></div></div></section>`;
  html=(html.slice(0,start)+section+html.slice(end)).replaceAll('href="#projects"','href="/works/"')
    .replace(/<script src="projects-split\.js[^"]*" defer><\/script>\n?/,'');
  if(!html.includes('href="#poker-table"'))html=html.replace(/(<a href="\/works\/"><span data-zh="完整作品库"[^]*?<\/a>)/,'$1<a href="#poker-table">'+text('德州牌桌','Poker table')+'<span aria-hidden="true">↗</span></a>');
  const script='<script src="/assets/work-nav.js"></script>';
  if(!html.includes(script)) html=html.replace('</head>',script+'\n</head>');
  return html;
}
