const memory=new Map();const demoStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
import { books, findBook } from './story.mjs?v=demo-1';
import { normalizeSettings, isDeliberateTap } from './core.mjs?v=demo-1';
const VOICE_SAMPLE='Narration is not included in this demonstration.';

import { normalizeProgress, openingPage, rememberPage, effectiveSettings } from './library.mjs?v=demo-1';
import { imageAttributes, preloadOrder, applyDeferred } from './images.mjs?v=demo-1';
import { bindSceneImage, discoveryReady } from './scene-image.mjs?v=demo-1';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'cloud-post-demo-pilot-settings-v1';
const PROGRESS_KEY = 'cloud-post-demo-pilot-progress-v1';
let settings;
try { settings = normalizeSettings(JSON.parse(demoStorage.getItem(STORAGE_KEY) || '{}')); }
catch { settings = normalizeSettings({}); }
let progress;
try { progress=normalizeProgress(JSON.parse(demoStorage.getItem(PROGRESS_KEY)||'{}'),books); }
catch { progress=normalizeProgress({},books); }
let selectedBook=null;
let story=[];
const book = $('book');
const cover = $('cover');
const nav = $('story-nav');
let opened = false;
let current = 0;
let holdTimer = 0;
let held = false;
let holdPointer = null;
let gateAnswer = 0;
let scrollTimer = 0;
let toastTimer = 0;
let autoReadTimer = 0;
let manualNavigationUntil = 0;
let lastSurprise = 0;
let sceneEpoch = 0;
let lastNavigation = -1000;
const effectTimers = new Set();
const reactionTimers = new Map();
let sceneImageCleanups = [];
function disposeSceneImages() {
  sceneImageCleanups.forEach(cleanup=>cleanup());
  sceneImageCleanups=[];
}
const reducedOS = window.matchMedia('(prefers-reduced-motion: reduce)');
const noMotion = () => settings.reducedMotion || reducedOS.matches;
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const audioSettings=()=>effectiveSettings(settings);
const musicMode=()=>selectedBook?.music==='bedtime'?'bedtime':'day';
const canPlay=()=>opened && !$('gate').open && !$('settings').open && !document.hidden;

function cancelPending() {
  sceneEpoch++;
  clearTimeout(autoReadTimer); clearTimeout(scrollTimer);
  for(const timer of reactionTimers.values()) clearTimeout(timer);
  for(const timer of effectTimers) clearTimeout(timer);
  reactionTimers.clear(); effectTimers.clear();
  book.querySelectorAll('.effect-layer').forEach(layer=>layer.replaceChildren());
  book.querySelectorAll('.reaction-bubble').forEach(bubble=>bubble.classList.remove('visible'));
  $('announcer').textContent='';
}
function saveProgress(finished=false) {
  if (!selectedBook || !opened) return;
  rememberPage(progress,selectedBook,current,finished);
  try { demoStorage.setItem(PROGRESS_KEY,JSON.stringify(progress)); } catch {}
}
function makeShelf() {
  $('book-grid').innerHTML=books.map(item=>{
    const entry=progress[item.id];
    const resume=entry.page>0 && !entry.finished;
    return `<button class="book-card" type="button" data-book="${item.id}" aria-label="${resume?'Continue':'Read'} ${item.title}" style="--book-color:${item.accent};--book-tint:${item.background}">
      <span class="book-card-picture"><img ${imageAttributes(item.coverSet,{priority:true,sizes:'(min-width: 800px) 300px, 46vw'})} alt="" draggable="false"><span class="book-badge">${icon(item.symbol)}</span></span>
      <span class="book-card-title">${item.shortTitle}</span><span class="book-card-note">${resume?`Continue · page ${entry.page+1}`:item.eyebrow}</span>
      <span class="book-card-play" aria-hidden="true">${icon('sound')}</span></button>`;
  }).join('');
  $('book-grid').querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>startBook(button.dataset.book)));
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3300);
}

const narrator={stop(){},say(){return false}};
const soundscape={setSpeaking(){},setActive(){},unlock(){},apply(){},effect(){},stopEffects(){},beginBook(){}};
function saveSettings() {
  settings = {...normalizeSettings(settings),quiet:true,narration:false,sound:false,music:false};
  try { demoStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
  catch { /* The story stays usable when private browsing blocks storage. */ }
  document.body.classList.toggle('less-motion', settings.reducedMotion);
  const audio=audioSettings();
  soundscape.apply(audio);
  $('read-again').disabled = !audio.narration;
  $('read-label').textContent = 'Synthetic demo · silent';
  $('read-again').setAttribute('aria-label', audio.narration ? 'Read this page again' : 'Quiet play, narration is off');
  $('shelf-read').setAttribute('aria-pressed',String(!settings.quiet));
  $('shelf-quiet').setAttribute('aria-pressed',String(settings.quiet));
  $('quiet-note').hidden=!settings.quiet;
  document.body.classList.toggle('quiet-mode',settings.quiet);
}

function say(text, override = false) {
  if (canPlay()) soundscape.setActive(true,musicMode());
  soundscape.unlock();
  const available = narrator.say(text, override ? { ...settings, narration: true } : audioSettings());
  if (!available && (audioSettings().narration || override) && !window.speechSynthesis) {
    toast('Narration is omitted from this demonstration.');
  }
  return available;
}

function makeScenes() {
  disposeSceneImages();
  book.innerHTML = story.map((page, index) => `
    <section class="scene${index===story.length-1?' scene-ending':''}" id="scene-${page.id}" aria-label="Page ${index + 1} of ${story.length}: ${page.title}" style="--scene-bg:${page.background};--accent:${page.accent}">
      <div class="scene-copy">
        <div class="scene-kicker">${selectedBook.shortTitle} <span aria-hidden="true">·</span> ${index+1} / ${story.length}</div>
        <h2>${page.title}</h2><p class="scene-sentence">${page.sentence}</p>
        <div class="page-pips" aria-hidden="true">${story.map((_,i) => `<span class="${i === index ? 'active' : ''}"></span>`).join('')}</div>
        <div class="scene-invitation">${icon(index === story.length - 1 ? 'heart' : 'paw')}${index === story.length - 1 ? selectedBook.ending : 'Tap the little sparkles. See what happens.'}</div>
        ${index===story.length-1?`<div class="ending-actions"><button type="button" data-restart>${icon('replay')}Read from the start</button><button type="button" data-finish>${icon('book')}Choose a book</button></div>`:''}
      </div>
      <div class="scene-art">
        <div class="image-plane">
        <img class="page-image" ${imageAttributes(page.image,{priority:index===current})} alt="${page.alt}" draggable="false">
        ${page.hotspots.map(spot => `<button type="button" class="hotspot" disabled data-spot="${spot.id}" aria-label="${spot.label}" style="left:${spot.x}%;top:${spot.y}%;width:${spot.w}%;height:${spot.h}%"></button>`).join('')}
        <div class="effect-layer" aria-hidden="true"></div><div class="reaction-bubble" aria-hidden="true"></div>
        </div>
        <button type="button" class="image-retry" hidden>Try the picture again</button>
      </div>
    </section>`).join('');
  [...book.children].forEach((section,index) => {
    const image = section.querySelector('img');
    const art = section.querySelector('.scene-art'), retryButton = section.querySelector('.image-retry');
    sceneImageCleanups.push(bindSceneImage({art,image,plane:section.querySelector('.image-plane'),retryButton,
      imageSet:story[index].image,onUnavailable:()=>toast('The picture needs a connection. Tap the little button to try again.')}));
    section.querySelectorAll('.hotspot').forEach(button => {
      const spot = story[index].hotspots.find(item => item.id === button.dataset.spot);
      let start = null;
      let startedAt = 0;
      let tappedWithPointer = false;
      button.addEventListener('pointerdown', event => {
        if (!discoveryReady(art,image,button)) return;
        if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
        start = { x:event.clientX, y:event.clientY, id:event.pointerId };
        startedAt = performance.now();
        tappedWithPointer = false;
      });
      button.addEventListener('pointercancel', () => { start = null; });
      button.addEventListener('pointerup', event => {
        if (!start || event.pointerId !== start.id) return;
        tappedWithPointer = isDeliberateTap(start, {x:event.clientX,y:event.clientY}, performance.now()-startedAt);
        start = null;
        if (tappedWithPointer) surprise(index, spot, button);
      });
      button.addEventListener('click', event => {
        if (event.detail === 0) surprise(index,spot,button);
        tappedWithPointer = false;
      });
      button.addEventListener('contextmenu', event => event.preventDefault());
    });
  });
  book.querySelector('[data-restart]').addEventListener('click',()=>startBook(selectedBook.id,true));
  book.querySelector('[data-finish]').addEventListener('click',closeBook);
}

function surprise(index, spot, button) {
  if (!canPlay() || index !== current || performance.now()-lastSurprise < 420) return;
  const art = button.closest('.scene-art');
  if (!discoveryReady(art,art?.querySelector('.page-image'),button)) return;
  lastSurprise = performance.now();
  clearTimeout(autoReadTimer);
  const section = book.children[index];
  const layer = section.querySelector('.effect-layer');
  const bubble = section.querySelector('.reaction-bubble');
  button.classList.add('discovered');
  layer.replaceChildren();
  const count = noMotion() || selectedBook.music==='bedtime' || ['peek','flutter'].includes(spot.effect) ? 1 : 3;
  for (let i=0;i<count;i++) {
    const el = document.createElement('span');
    el.className = `surprise ${spot.effect}${i > 0 ? ' small' : ''}`;
    el.style.left = `${Math.min(86, Math.max(14, spot.x+(i===1 ? -14 : i===2 ? 14 : 0)))}%`;
    el.style.top = `${Math.min(88, Math.max(20, spot.y+(i ? 5 : 0)))}%`;
    el.style.animationDelay = `${i*.08}s`;
    el.innerHTML = icon(spot.symbol);
    layer.append(el);
    const timer=setTimeout(()=>{el.remove();effectTimers.delete(timer);},2800);
    effectTimers.add(timer);
  }
  bubble.textContent = spot.word;
  bubble.classList.add('visible');
  clearTimeout(reactionTimers.get(index));
  reactionTimers.set(index,setTimeout(() => bubble.classList.remove('visible'),2300));
  $('announcer').textContent = spot.word;
  void soundscape.effect(spot.sound);
  say(spot.say);
}

function updatePage(index, read = false) {
  const next = Math.max(0,Math.min(story.length-1,index));
  if (next !== current) { cancelPending(); narrator.stop(); soundscape.stopEffects(); }
  current = next;
  soundscape.setActive(canPlay(),musicMode());
  [...book.children].forEach((page,i) => { page.inert = i !== current; page.classList.toggle('is-active',i===current); });
  document.documentElement.style.setProperty('--page-bg',story[current].background);
  $('previous').disabled = current === 0;
  $('next').hidden = current === story.length-1;
  $('last-page').hidden = current !== story.length-1;
  $('book-position').textContent=`${selectedBook.shortTitle} · ${current+1} of ${story.length}`;
  document.body.classList.toggle('at-ending',current===story.length-1);
  saveProgress();
  warmNeighbors();
  if (read && canPlay()) say(story[current].narration);
}
// Ask the browser to decode the current picture and its neighbours before the swipe, so turns never wait on a download.
const warmed = new Set();
function warmNeighbors() {
  for (const i of preloadOrder(current, story.length)) {
    const image = book.children[i]?.querySelector('img.page-image');
    if (!image || warmed.has(image)) continue;
    warmed.add(image);
    applyDeferred(image);
    image.decode?.().catch(() => {});
  }
}

function moveTo(index) {
  if (!canPlay() || index<0 || index>=story.length || performance.now()-lastNavigation<280) return;
  lastNavigation=performance.now();
  cancelPending();
  manualNavigationUntil = performance.now()+450;
  updatePage(index,true);
  book.scrollTo({top:book.children[index].offsetTop,behavior:noMotion()?'instant':'smooth'});
}

function startBook(id,restart=false) {
  const next=findBook(id);
  if (!next || $('gate').open || $('settings').open) return;
  cancelPending(); narrator.stop(); soundscape.beginBook(next.music==='bedtime'?'bedtime':'day');
  if (opened) saveProgress(current===story.length-1);
  selectedBook=next; story=next.pages;
  current=restart?0:openingPage(progress,next);
  lastNavigation=-1000; lastSurprise=-1000;
  makeScenes();
  opened = true;
  cover.hidden = true;
  book.hidden = false;
  nav.hidden = false;
  $('shelf-home').hidden=false;
  $('book-position').hidden=false;
  document.body.classList.add('book-open');
  document.body.classList.toggle('bedtime-book',selectedBook.music==='bedtime');
  book.scrollTo({top:book.children[current].offsetTop,behavior:'instant'});
  updatePage(current,false);
  soundscape.unlock();
  if (audioSettings().narration) say(story[current].narration);
  $('read-again').focus({preventScroll:true});
  let showHint = true;
  try { showHint = !demoStorage.getItem('cloud-post-demo-pilot-first-page-hint'); } catch {}
  if (showHint) {
    toast('Tap the picture. Swipe up for the next little moment.');
    try { demoStorage.setItem('cloud-post-demo-pilot-first-page-hint','1'); } catch {}
  }
}

function closeBook() {
  if (opened) saveProgress(current===story.length-1);
  cancelPending();
  disposeSceneImages();
  clearTimeout(toastTimer); $('toast').classList.remove('visible'); $('toast').textContent='';
  narrator.stop();
  soundscape.setActive(false);
  clearTimeout(autoReadTimer);
  opened = false;
  book.hidden = true;
  nav.hidden = true;
  $('shelf-home').hidden=true;
  $('book-position').hidden=true;
  cover.hidden = false;
  document.body.classList.remove('book-open','at-ending','bedtime-book');
  document.documentElement.style.setProperty('--page-bg','#fff9ef');
  $('settings').close();
  makeShelf();
  $('book-grid').querySelector(`[data-book="${selectedBook?.id||books[0].id}"]`).focus({preventScroll:true});
}

function cancelHold() {
  clearTimeout(holdTimer);
  $('parent-hold').classList.remove('holding');
  holdPointer = null;
}
function startHold(pointer = null) {
  cancelHold();
  if ($('gate').open || $('settings').open) return;
  held = false;
  holdPointer = pointer;
  $('parent-hold').classList.add('holding');
  holdTimer = setTimeout(() => {
    held = true;
    cancelHold();
    narrator.stop();
    soundscape.setActive(false);
    cancelPending();
    const a = 11+Math.floor(Math.random()*9);
    const b = 3+Math.floor(Math.random()*7);
    gateAnswer = a+b;
    $('gate-question').textContent = `${a} + ${b}`;
    $('gate-answer').value = '';
    $('gate-error').textContent = '';
    $('gate').showModal();
    $('gate-answer').focus();
  },2000);
}

function populateVoices() {
  const select = $('voice-select');
  select.replaceChildren(new Option('Storybook · warm & playful','storybook'),new Option('Device voice · automatic','device:'));
  const voices = [] || [];
  const english = voices.filter(v => /^en\b/i.test(v.lang));
  for (const voice of (english.length ? english : voices)) {
    select.add(new Option(`${voice.name} · ${voice.localService ? 'device' : 'may use internet'}`,`device:${voice.voiceURI}`));
  }
  select.value = settings.voiceSource === 'storybook' ? 'storybook' : `device:${settings.voiceURI}`;
  if (select.selectedIndex === -1) select.value = 'device:';
}

function openSettings() {
  $('narration-toggle').checked = settings.narration;
  $('sound-toggle').checked = settings.sound;
  $('music-toggle').checked = settings.music;
  $('motion-toggle').checked = settings.reducedMotion;
  $('rate').value = settings.rate;
  $('rate-value').textContent = `${(settings.rate/.9).toFixed(2)}×`;
  for (const [id,key] of [['voice-volume','volume'],['effects-volume','effectsVolume'],['music-volume','musicVolume']]) {
    $(id).value = settings[key];
    $(`${id}-value`).textContent = `${Math.round(settings[key]*100)}%`;
  }
  $('voice-status').textContent = '';
  populateVoices();
  $('settings').showModal();
}

function closeSettings() {
  narrator.stop();
  $('settings').close();
  soundscape.apply(audioSettings());
  soundscape.setActive(canPlay(),musicMode());
}

makeShelf();
saveSettings();
$('shelf-read').addEventListener('click',()=>{ settings.quiet=false; settings.narration=true; saveSettings(); });
$('shelf-quiet').addEventListener('click',()=>{ settings.quiet=true; narrator.stop(); soundscape.setActive(false); saveSettings(); });
$('shelf-home').addEventListener('click',closeBook);
$('last-page').addEventListener('click',closeBook);
$('previous').addEventListener('click',() => moveTo(current-1));
$('next').addEventListener('click',() => moveTo(current+1));
$('read-again').addEventListener('click',() => {
  if (!canPlay()) return;
  clearTimeout(autoReadTimer);
  const stamp=Date.now();
  book.querySelectorAll('.image-missing .image-retry').forEach(button=>button.click());
  say(story[current].narration);
});
book.addEventListener('scroll',() => {
  clearTimeout(scrollTimer);
  if (!canPlay()) return;
  const epoch=sceneEpoch;
  scrollTimer = setTimeout(() => {
    if (!canPlay() || epoch!==sceneEpoch) return;
    const top = book.getBoundingClientRect().top;
    const nearest = [...book.children].reduce((best,page,index) => {
      const distance = Math.abs(page.getBoundingClientRect().top-top);
      return distance<best.distance ? {index,distance} : best;
    },{index:current,distance:Infinity}).index;
    if (nearest !== current) {
      clearTimeout(autoReadTimer);
      updatePage(nearest,false);
      const settledEpoch=sceneEpoch;
      autoReadTimer = setTimeout(() => { if(canPlay() && settledEpoch===sceneEpoch && current===nearest) updatePage(nearest,true); },230);
    }
  },Math.max(180,manualNavigationUntil-performance.now()+100));
},{passive:true});

const parent = $('parent-hold');
parent.addEventListener('pointerdown',event => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
  startHold({id:event.pointerId,x:event.clientX,y:event.clientY});
  parent.setPointerCapture?.(event.pointerId);
});
parent.addEventListener('pointermove',event => {
  if (holdPointer && (event.pointerId!==holdPointer.id || Math.hypot(event.clientX-holdPointer.x,event.clientY-holdPointer.y)>16)) cancelHold();
});
parent.addEventListener('pointerup',cancelHold);
parent.addEventListener('pointercancel',cancelHold);
parent.addEventListener('lostpointercapture',cancelHold);
parent.addEventListener('contextmenu',event => event.preventDefault());
parent.addEventListener('click',() => { if (!held) toast('Grown-ups: hold the button for 2 seconds.'); });
parent.addEventListener('keydown',event => { if (['Enter',' '].includes(event.key) && !event.repeat) { event.preventDefault(); startHold(); } });
parent.addEventListener('keyup',event => { if (['Enter',' '].includes(event.key)) { event.preventDefault(); cancelHold(); } });
parent.addEventListener('blur',cancelHold);
$('gate-close').addEventListener('click',() => { $('gate').close(); soundscape.setActive(canPlay(),musicMode()); });
$('gate-form').addEventListener('submit',event => {
  event.preventDefault();
  const answer = $('gate-answer').value.trim();
  if (/^\d+$/.test(answer) && Number(answer)===gateAnswer) {
    $('gate').close();
    openSettings();
  } else { $('gate-error').textContent = 'That’s not quite it. Please try again.'; $('gate-answer').select(); }
});
$('settings-close').addEventListener('click',closeSettings);
$('back-to-book').addEventListener('click',closeSettings);
$('close-book').addEventListener('click',closeBook);
$('settings').addEventListener('close',() => narrator.stop());
['gate','settings'].forEach(id => $(id).addEventListener('cancel',() => { narrator.stop(); soundscape.setActive(false); }));
for (const [id,key] of [['narration-toggle','narration'],['sound-toggle','sound'],['music-toggle','music'],['motion-toggle','reducedMotion']]) {
  $(id).addEventListener('change',event => {
    settings[key] = event.target.checked;
    if (['narration','sound','music'].includes(key) && settings[key]) settings.quiet=false;
    saveSettings();
    if (key==='narration' && !settings.narration) narrator.stop();
    if ((key==='sound' && settings.sound) || (key==='music' && settings.music)) soundscape.unlock();
  });
}
$('voice-select').addEventListener('change',event => {
  narrator.stop();
  settings.voiceSource=event.target.value==='storybook'?'storybook':'device';
  settings.voiceURI=event.target.value==='storybook'?'':event.target.value.slice(7);
  saveSettings();
});
$('rate').addEventListener('input',event => { settings.rate=Number(event.target.value); $('rate-value').textContent=`${(settings.rate/.9).toFixed(2)}×`; saveSettings(); });
for (const [id,key] of [['voice-volume','volume'],['effects-volume','effectsVolume'],['music-volume','musicVolume']]) {
  $(id).addEventListener('input',event => {
    settings[key]=Number(event.target.value);
    $(`${id}-value`).textContent=`${Math.round(settings[key]*100)}%`;
    saveSettings();
  });
}
$('voice-test').addEventListener('click',() => {
  $('voice-status').textContent='Trying the story voice…';
  const didQueue = say(VOICE_SAMPLE,true);
  if (!didQueue) $('voice-status').textContent='Narration is omitted from this demonstration.';
});
$('effects-test').addEventListener('click',() => { narrator.stop(); void soundscape.effect('flutter',{preview:true}); });

document.addEventListener('visibilitychange',() => { if (document.hidden) { narrator.stop(); soundscape.setActive(false); cancelPending(); cancelHold(); saveProgress(); } });
window.addEventListener('pagehide',() => { narrator.stop(); soundscape.setActive(false); cancelPending(); cancelHold(); saveProgress(); });
// Resume only with a deliberate interaction after returning to the book.
book.addEventListener('pointerdown',() => { if (canPlay()) { soundscape.setActive(true,musicMode()); soundscape.unlock(); } },{passive:true});
$('read-again').addEventListener('pointerdown',() => soundscape.setActive(canPlay(),musicMode()),{passive:true});
window.addEventListener('resize',() => {
  if (!opened) return;
  cancelPending();
  manualNavigationUntil=performance.now()+850;
  requestAnimationFrame(() => book.scrollTo({top:book.children[current].offsetTop,behavior:'instant'}));
});
document.addEventListener('keydown',event => {
  if (!opened || $('gate').open || $('settings').open || event.target===parent) return;
  if (['ArrowDown','ArrowRight','PageDown'].includes(event.key)) { event.preventDefault(); moveTo(current+1); }
  if (['ArrowUp','ArrowLeft','PageUp'].includes(event.key)) { event.preventDefault(); moveTo(current-1); }
});
