import {enhanceHeroV2} from './hero-v2.mjs';
import {enhanceMobileNavigation} from './mobile-navigation.mjs';

export const portfolioV2Version='20261109-v2';
const changedResources=['interactions.css','assets/section-atmospheres.css','assets/squid-lab-preview.css','assets/personal-art-direction.css','assets/demo-showcase.mjs','projects-split.js','poker-showcase.js','app.js','motion.js','bg-layers.css','railnav.js','academic-art.js','assets/personal-sections.mjs','assets/section-atmospheres.mjs'];
// One final pass after existing integrations, so regeneration keeps every V2 change.
export function enhancePortfolioV2(html,{casePage=false,paletteMarkup=''}={}){
 if(!html.includes('id="motionPolicyBootstrap"'))html=html.replace('<head>','<head>\n<script id="motionPolicyBootstrap">(()=>{let reduce=false;try{reduce=localStorage.getItem("portfolio-motion-preference")==="reduce"}catch{}reduce=reduce||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);document.documentElement.dataset.motion=reduce?"reduce":"full";document.documentElement.dataset.pageVisible=String(!document.hidden)})();</script>');
 if(!casePage)html=enhanceHeroV2(html);
 if(casePage&&paletteMarkup&&!html.includes('id="paletteSwitch"'))html=html.replace('</body>',paletteMarkup+'\n</body>');
 html=enhanceMobileNavigation(html,{casePage});
 html=html.replace(/src="\/scripts\/case-reader\.js(?:\?v=[^"]*)?"/g,`src="/scripts/case-reader.js?v=${portfolioV2Version}`);
 for(const file of changedResources){
  const escaped=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  html=html.replace(new RegExp(`((?:href|src)="/?${escaped}\\?v=)[^"\\s]+`,'g'),`$1${portfolioV2Version}`);
 }
 if(!html.includes('assets/motion-governor.css'))html=html.replace('</head>',`<link rel="stylesheet" href="/assets/motion-governor.css?v=${portfolioV2Version}">\n</head>`);
 if(!html.includes('src="/assets/motion-governor.mjs?'))html=html.replace('</body>',`<script type="module" src="/assets/motion-governor.mjs?v=${portfolioV2Version}"></script>\n</body>`);
 return html;
}
