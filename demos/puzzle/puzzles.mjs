export const SHELF_START = 12;
export const SHELF_REWARD = 12; // Reference-inspired, historical JP player report; current versions vary.
/** A color is finished only when ALL its target cells have the right jewel. */
export function finishedColors(art,gems){
  const candidates=new Set(art.targets.filter(Boolean));
  art.targets.forEach((color,i)=>{if(color&&gems[i]!==color)candidates.delete(color);});
  return [...candidates];
}
export function capacityForBoard(art,gems){
  return SHELF_START+SHELF_REWARD*finishedColors(art,gems).length;
}

export const SIZE=20;
const palette={'0':'#243c56','1':'#5b4f87','2':'#9b5276','3':'#ce8468','4':'#eac768','5':'#a9c6a0','6':'#4f8b7d','7':'#6fa5b7'};
export function artworkFor(seed=42){
 const targets=Array.from({length:400},(_,i)=>{const x=i%20,y=Math.floor(i/20);return String(Math.min(7,Math.floor((Math.abs(x-9.5)+Math.abs(y-9.5))/2.5)))});
 return {id:'spectrum-study',name:'Spectrum Study',title:'Spectrum Study',kind:'synthetic',seed,width:20,height:20,targets,palette};
}
function rngFor(seed){let n=((seed>>>0)^0x9E3779B9)>>>0;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
function around(i,width,length){
  const x=i%width,y=Math.floor(i/width),height=Math.ceil(length/width),result=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(dx===0&&dy===0)continue;
    const nx=x+dx,ny=y+dy;
    if(nx>=0&&nx<width&&ny>=0&&ny<height)result.push(ny*width+nx);
  }
  return result;
}
function components(art,used){
  const seen=new Set(),result=[],targets=art.targets;
  for(let i=0;i<targets.length;i++){
    const color=targets[i];
    if(!color||used.has(i)||seen.has(i))continue;
    const list=[i];seen.add(i);
    for(let pos=0;pos<list.length;pos++){
      for(const j of around(list[pos],art.width,targets.length)){
        if(!seen.has(j)&&!used.has(j)&&targets[j]===color){seen.add(j);list.push(j);}
      }
    }
    result.push({color,indices:list});
  }
  return result;
}
export function buildRegionScramble(art,seed=42){
  const random=rngFor(seed+29123),gems=art.targets.slice(),used=new Set(),pairs=[];
  const colors=[...new Set(art.targets.filter(Boolean))];
  const counts=Object.fromEntries(colors.map(c=>[c,art.targets.filter(x=>x===c).length]));
  const touched=new Set(),area=art.targets.filter(Boolean).length;
  const goal=Math.max(colors.length,Math.min(48,Math.ceil(area/32)));
  for(let step=0;step<goal;step++){
    const pieces=components(art,used);
    const byColor=new Map();
    for(const piece of pieces){
      const cur=byColor.get(piece.color);
      if(!cur||piece.indices.length>cur.indices.length)byColor.set(piece.color,piece);
    }
    const options=[...byColor.values()];
    if(options.length<2)break;
    const unprocessed=options.filter(x=>!touched.has(x.color));
    // Prioritize movable, connected clusters; singletons only where unavoidable.
    const freshClusters=unprocessed.filter(x=>x.indices.length>=2);
    const anyClusters=options.filter(x=>x.indices.length>=2);
    const candidates=freshClusters.length>=2?freshClusters:anyClusters.length>=2?anyClusters:
      unprocessed.length?unprocessed:options;
    candidates.sort((a,b)=>(unprocessed.length?counts[a.color]-counts[b.color]:b.indices.length-a.indices.length)
      ||b.indices.length-a.indices.length||a.color.localeCompare(b.color));
    const first=candidates[Math.min(candidates.length-1,Math.floor(random()*Math.min(3,candidates.length)))];
    let others=options.filter(x=>x.color!==first.color&&x.indices.length>=Math.min(2,first.indices.length));
    if(!others.length)others=options.filter(x=>x.color!==first.color);
    others.sort((a,b)=>b.indices.length-a.indices.length||a.color.localeCompare(b.color));
    const partner=others[Math.min(others.length-1,Math.floor(random()*Math.min(3,others.length)))];
    if(!partner)break;
    const amount=Math.min(12,first.indices.length,partner.indices.length);
    if(amount<=0)break;
    const a=first.indices.slice(0,amount),b=partner.indices.slice(0,amount);
    for(let i=0;i<amount;i++){gems[a[i]]=partner.color;gems[b[i]]=first.color;used.add(a[i]);used.add(b[i]);}
    touched.add(first.color);touched.add(partner.color);
    pairs.push({a,b,colorA:first.color,colorB:partner.color,size:amount});
  }
  // Ensure every palette color begins with something to restore.
  // Otherwise it would be accidentally "completed" at level start and award
  // +12 without a move. Tiny rare-color areas may need one single transfer.
  for(const color of colors){
    if(touched.has(color))continue;
    const i=art.targets.findIndex((c,j)=>c===color&&!used.has(j));
    const j=art.targets.findIndex((c,n)=>c&&c!==color&&!used.has(n));
    if(i<0||j<0)continue;
    const other=art.targets[j];
    gems[i]=other;gems[j]=color;used.add(i);used.add(j);
    pairs.push({a:[i],b:[j],colorA:color,colorB:other,size:1});
    touched.add(color);touched.add(other);
  }
  // A very small, fragmented source still receives a deterministic fallback.
  if(!pairs.length&&colors.length>1){
    const a=art.targets.findIndex(c=>c===colors[0]),b=art.targets.findIndex(c=>c===colors[1]);
    if(a>=0&&b>=0){gems[a]=colors[1];gems[b]=colors[0];
      pairs.push({a:[a],b:[b],colorA:colors[0],colorB:colors[1],size:1});}
  }
  return {gems,pairs};
}
export function scrambleDiagnostics(art,gems){
  const seen=new Set(),sizes=[];
  for(let i=0;i<gems.length;i++){
    if(seen.has(i)||!gems[i]||gems[i]===art.targets[i])continue;
    const color=gems[i],group=[i];seen.add(i);
    for(let p=0;p<group.length;p++)for(const j of around(group[p],art.width,gems.length)){
      if(!seen.has(j)&&gems[j]===color&&gems[j]!==art.targets[j]){seen.add(j);group.push(j);}
    }
    sizes.push(group.length);
  }
  const wrong=sizes.reduce((s,n)=>s+n,0);
  return {misplaced:wrong,groups:sizes.length,meanGroup:wrong/Math.max(1,sizes.length),
    singletonShare:sizes.filter(n=>n===1).length/Math.max(1,sizes.length),largest:Math.max(0,...sizes)};
}
export function initialBoardForArt(art,seed=42){
  const {gems}=buildRegionScramble(art,seed);
  return {art,gems,shelf:Array(capacityForBoard(art,gems)).fill(null),
    selection:null,autoMove:true,moves:0};
}
export function initialBoard(seed){return initialBoardForArt(artworkFor(seed),seed);}
