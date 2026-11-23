import fs from 'node:fs';
import {objects,studioURL,studioCard} from '../content/studio-objects.mjs';
import {escapeHtml,renderProjectCards} from '../assets/project-cards.mjs';
const e=escapeHtml, bi=(z,n)=>'<span data-zh="'+e(z)+'" data-en="'+e(n)+'">'+e(z)+'</span>';
function desk(){
 return '<div class="workdesk" aria-label="作品桌 / Work desk">'+objects.map(o=>'<details class="paper-file paper-'+o.folder+'"><summary><small aria-hidden="true">'+o.art+'</small>'+bi(...o.paper)+'</summary><div class="paper-insert"><strong>'+bi(...o.name)+'</strong><p>'+bi(...o.question)+'</p><a href="'+studioURL(o)+'">'+bi('动手试试','Try it')+' ↗</a><a href="#evidence-'+o.evidence+'">'+bi('看工作案例','See work evidence')+' →</a><a href="/assets/cv/'+o.cv+'.pdf" target="_blank" rel="noopener">'+bi(...o.cvName)+' PDF ↗</a></div></details>').join('')+'</div>';
}
const data=JSON.parse(fs.readFileSync('data.json','utf8')),ids=new Set(objects.map(o=>o.id)),cards=objects.map(studioCard);
data.projects=[...data.projects.filter(p=>!ids.has(p.id)),...cards];
let html=fs.readFileSync('index.html','utf8').replace(/\n?<!--studio-desk-->[\s\S]*?<!--\/studio-desk-->\n*/g,'\n');
const portrait=/(<img class="portrait-img portrait-img-light"[^>]+>\s*<\/div>)/;
if(!portrait.test(html))throw Error('Missing portrait insertion point');
html=html.replace(portrait,'$1\n<!--studio-desk-->'+desk()+'<!--/studio-desk-->');
for(const id of ids) html=html.replace(new RegExp('<article id="project-'+id+'"[^]*?</article>\\s*','g'),'');
const grid=/(<div\b[^>]*\bid="projectGrid"[^>]*>)/;
if(!grid.test(html))throw Error('Missing collection');
html=html.replace(grid,'$1'+renderProjectCards(cards)+'\n')
 .replace(/查看全部 \d+ 项作品/g,'查看全部 '+data.projects.length+' 项作品').replace(/Explore all \d+ projects/g,'Explore all '+data.projects.length+' projects');
for(const [needle,markup] of [['</head>','<link rel="stylesheet" href="assets/studio-home.css">'],['</body>','<script type="module" src="assets/studio-home.mjs"></script>']]){
 if(!html.includes(markup))html=html.replace(needle,markup+'\n'+needle);
}
fs.writeFileSync('index.html',html);fs.writeFileSync('data.json',JSON.stringify(data,null,2)+'\n');
