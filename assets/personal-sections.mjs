import {renderIntro,renderHonours,renderContacts} from '../content/personal-presentation.mjs';
window.personalPresentation={renderIntro,renderHonours,renderContacts};
// A slow moving diagram of experiments, restricted to the product-library introduction.
const section=document.querySelector('#projects');
if(section){const layer=document.createElement('div');layer.className='project-atmosphere';layer.setAttribute('aria-hidden','true');layer.innerHTML='<svg viewBox="0 0 1200 460" fill="none"><g stroke="currentColor" stroke-width="1"><path d="M50 250C230 250 210 90 430 90S610 350 820 350s190-170 340-170"/><path d="M30 310C290 310 220 170 470 170s250 180 520 90"/><rect x="370" y="50" width="170" height="240" rx="14"/><rect x="650" y="140" width="170" height="240" rx="14"/><path d="M401 88h93m-93 30h55m185 65h108m-108 30h73M680 340l25-45 24 17 33-65 29 25"/></g><g fill="currentColor"><circle cx="430" cy="90" r="5"/><circle cx="820" cy="350" r="5"/></g></svg>';section.prepend(layer);}
// motion-governor observes .project-atmosphere itself. The long project section
// no longer keeps this small introductory decoration running while off-screen.
