import { srcsetFor, retryUrl, nextRetryDelay } from './images.mjs?v=demo-1';

// Coordinates are relative to the scene's padding box, inside its border.
export function containedRect(width, height, sourceWidth, sourceHeight) {
  if (![width,height,sourceWidth,sourceHeight].every(n=>Number.isFinite(n)&&n>0)) return null;
  const scale=Math.min(width/sourceWidth,height/sourceHeight);
  const w=sourceWidth*scale,h=sourceHeight*scale;
  return {left:(width-w)/2,top:(height-h)/2,width:w,height:h};
}

export function discoveryReady(art, image, button) {
  return !!art?.isConnected && art.dataset.imageState==='ready' &&
    image?.complete && image.naturalWidth>0 && image.naturalHeight>0 && !button.disabled;
}

// One owner for image readiness, geometry, retry and teardown. Deferred pictures
// remain disabled until a successful load; stale events cannot revive a closed book.
export function bindSceneImage({art, image, plane, retryButton, imageSet, onUnavailable}) {
  const buttons=[...art.querySelectorAll('.hotspot')];
  let attempts=0,retryTimer=0,disposed=false;
  const state=value=>{
    art.dataset.imageState=value;
    for(const name of ['loading','missing','ready']) art.classList.toggle('image-'+name,name===value);
    buttons.forEach(button=>{button.disabled=value!=='ready';});
    retryButton.hidden=value!=='missing';
  };
  const layout=()=>{
    // clientWidth rounds fractional CSS pixels; keep those pixels so a rounded-up
    // plane cannot extend past (and clip against) the actual inner border edge.
    const box=art.getBoundingClientRect(),css=getComputedStyle(art);
    const width=box.width-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth);
    const height=box.height-parseFloat(css.borderTopWidth)-parseFloat(css.borderBottomWidth);
    const rect=containedRect(width,height,image.naturalWidth,image.naturalHeight);
    if(rect) for(const [key,value] of Object.entries(rect)) plane.style[key]=value+'px';
  };
  const reload=()=>{
    if(disposed)return;
    clearTimeout(retryTimer);state('loading');
    const stamp=++attempts;
    image.srcset=srcsetFor(imageSet).split(', ').map(part=>{const [url,w]=part.split(' ');return `${retryUrl(url,stamp)} ${w}`;}).join(', ');
    image.src=retryUrl(image.getAttribute('src'),stamp);
  };
  const failed=()=>{
    if(disposed)return;
    state('missing');clearTimeout(retryTimer);
    const delay=nextRetryDelay(attempts);
    if(delay!==null)retryTimer=setTimeout(()=>{if(!image.complete||!image.naturalWidth)reload();},delay);
    else onUnavailable();
  };
  const loaded=()=>{
    if(disposed)return;
    if(!image.complete||!image.naturalWidth||!image.naturalHeight)return;
    clearTimeout(retryTimer);layout();state('ready');
  };
  const retry=event=>{event.stopPropagation();attempts=0;reload();};
  state('loading');
  image.addEventListener('error',failed);image.addEventListener('load',loaded);
  retryButton.addEventListener('click',retry);
  const observer=new ResizeObserver(layout);observer.observe(art);
  if(image.getAttribute('src')&&image.complete){if(image.naturalWidth)loaded();else failed();}
  return ()=>{
    disposed=true;clearTimeout(retryTimer);observer.disconnect();state('loading');
    image.removeEventListener('error',failed);image.removeEventListener('load',loaded);
    retryButton.removeEventListener('click',retry);
  };
}
