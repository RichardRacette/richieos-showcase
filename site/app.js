/* Standalone view: all fixtures are fictional and all state stays in memory. */
'use strict';
const C=globalThis.ShowcaseCore;
const $=id=>document.getElementById(id);
for(const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click',()=>{
  for(const tab of document.querySelectorAll('[data-tab]')) { const selected=tab===button;tab.classList.toggle('active',selected);tab.setAttribute('aria-pressed',String(selected));$(tab.dataset.tab).hidden=!selected; }
});
let task=C.makeTask('Paper Kite');
const steps={READY:['assign','coordinator','Assign bounded work','No work has been assigned.'],ACTIVE:['submit','worker','Submit synthetic evidence','A worker has a bounded assignment.'],VERIFYING:['verify','coordinator','Review automated evidence','A report exists; acceptance has not been granted.'],HUMAN_REQUIRED:['accept','human','Simulate human acceptance','Automated checks passed in this example. A human decision is still required.'],ACCEPTED:['complete','coordinator','Record completion','The fictional reviewer accepted the experience.'],COMPLETE:[null,null,'Walkthrough complete','The coordinator has recorded the accepted result.']};
function renderTask(){ const s=steps[task.status];$('state').textContent=task.status;$('state-description').textContent=s[3];$('advance').textContent=s[2];$('advance').disabled=!s[0]; }
$('advance').addEventListener('click',()=>{ const s=steps[task.status];if(s[0])task=C.transition(task,s[0],s[1]);$('workflow-message').textContent=task.status==='HUMAN_REQUIRED'?'A test pass did not approve the product.':'';renderTask();});
$('self-approve').addEventListener('click',()=>{try{C.transition(task,'complete','worker');}catch{$('workflow-message').textContent='Blocked: a worker cannot approve or complete its own work.';}});
$('reset-task').addEventListener('click',()=>{task=C.makeTask('Paper Kite');$('workflow-message').textContent='Walkthrough reset.';renderTask();});renderTask();
let mosaic=C.makeMosaic(20), selected=0;
const palette=$('palette');
for(let color=0;color<8;color++){const b=document.createElement('button');b.className=`swatch c${color}`;b.textContent=String(color+1);b.setAttribute('aria-label',`Select color ${color+1}`);b.addEventListener('click',()=>{selected=color;renderMosaic();});palette.append(b);}
function renderMosaic(){const fragment=document.createDocumentFragment();for(let i=0;i<mosaic.cells.length;i++){const el=document.createElement('span');el.className=mosaic.filled[i]?`gem filled c${mosaic.cells[i]}`:'gem';fragment.append(el);}$('mosaic-board').replaceChildren(fragment);[...palette.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));const count=mosaic.filled.filter(Boolean).length;const left=mosaic.cells.filter((c,i)=>c===selected&&!mosaic.filled[i]).length;$('mosaic-progress').textContent=`${count} of 400 jewels placed. Color ${selected+1}: ${left} remaining.`;$('place-one').disabled=left===0;$('fill-color').disabled=left===0;}
$('place-one').addEventListener('click',()=>{const i=mosaic.cells.findIndex((c,i)=>c===selected&&!mosaic.filled[i]);if(i>=0)mosaic=C.paintCell(mosaic,i,selected);renderMosaic();});
$('fill-color').addEventListener('click',()=>{for(let i=0;i<mosaic.cells.length;i++)if(mosaic.cells[i]===selected&&!mosaic.filled[i])mosaic=C.paintCell(mosaic,i,selected);renderMosaic();});
$('reset-mosaic').addEventListener('click',()=>{mosaic=C.makeMosaic(20);selected=0;renderMosaic();});renderMosaic();
const pages=[{title:'A light on the hill',text:'A little lantern waited beside the path. The evening was wide, and its light was small.'},{title:'Room for a glow',text:'The moon looked down. “You do not have to light the whole sky,” it said. “Just the next small step.”'},{title:'One step, then another',text:'The lantern glowed beside a stone, then a leaf, then a bend in the path. Small things became easy to see.'},{title:'Enough for tonight',text:'At the end of the path, the lantern rested. The moon kept the sky. The lantern kept its little corner.'}];
let page=0;
function renderReader(){const p=pages[page];$('page-number').textContent=`PAGE ${page+1} OF ${pages.length}`;$('story-title').textContent=p.title;$('story-text').textContent=p.text;$('story-scene').className=`story-scene scene-${page}`;$('previous-page').disabled=page===0;$('next-page').disabled=page===pages.length-1;}
for(const [id,delta] of [['previous-page',-1],['next-page',1]])$(id).addEventListener('click',()=>{page=C.shiftPage(page,delta,pages.length);renderReader();$('reader-status').textContent=`Page ${page+1}: ${pages[page].title}`;});renderReader();
