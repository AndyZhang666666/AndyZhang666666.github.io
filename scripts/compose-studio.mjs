import fs from 'node:fs';
import {objects,studioCard} from '../content/studio-objects.mjs';
import {renderProjectCards} from '../assets/project-cards.mjs';
import {renderWorkdesk,printCover} from '../content/print-cover.mjs';
const data=JSON.parse(fs.readFileSync('data.json','utf8')),ids=new Set(objects.map(o=>o.id)),cards=objects.map(studioCard);
data.projects=[...data.projects.filter(p=>!ids.has(p.id)),...cards];
let html=fs.readFileSync('index.html','utf8').replace(/\n?<!--studio-desk-->[\s\S]*?<!--\/studio-desk-->\n*/g,'\n');
const portrait=/(<img class="portrait-img portrait-img-light"[^>]+>\s*<\/div>)/;
if(!portrait.test(html))throw Error('Missing portrait insertion point');
html=printCover(html.replace(portrait,'$1\n<!--studio-desk-->'+renderWorkdesk()+'<!--/studio-desk-->'));
for(const id of ids) html=html.replace(new RegExp('<article id="project-'+id+'"[^]*?</article>\\s*','g'),'');
const grid=/(<div\b[^>]*\bid="projectGrid"[^>]*>)/;
if(!grid.test(html))throw Error('Missing collection');
html=html.replace(grid,'$1'+renderProjectCards(cards)+'\n')
 .replace(/查看全部 \d+ 项作品/g,'查看全部 '+data.projects.length+' 项作品').replace(/Explore all \d+ projects/g,'Explore all '+data.projects.length+' projects');
for(const [needle,markup] of [['</head>','<link rel="stylesheet" href="assets/studio-home.css">'],['</body>','<script type="module" src="assets/studio-home.mjs"></script>']]){
 if(!html.includes(markup))html=html.replace(needle,markup+'\n'+needle);
}
fs.writeFileSync('index.html',html);fs.writeFileSync('data.json',JSON.stringify(data,null,2)+'\n');
