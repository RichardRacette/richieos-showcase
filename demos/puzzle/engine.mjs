import {initialBoard,artworkFor,capacityForBoard,finishedColors} from './puzzles.mjs';

/** v3: selected jewels remain at their physical source until a destination is tapped. */
export const STORAGE_KEY='spectrum-study-v1';
export function newGame(seed=0){return initialBoard(seed);}
export function completedCount(g){return g.gems.reduce((n,c,i)=>n+(c!==null&&c===g.art.targets[i]?1:0),0);}
export function totalCount(g){return g.art.targets.reduce((n,c)=>n+(c===null?0:1),0);}
export function fractionComplete(g){return completedCount(g)/Math.max(1,totalCount(g));}
export function isSolved(g){return completedCount(g)===totalCount(g)&&g.shelf.every(c=>c===null);}
export function holdingCapacity(g){return capacityForBoard(g.art,g.gems);}
export function completedColors(g){return finishedColors(g.art,g.gems);}
export function cloneGame(g){return {...g,art:g.art,gems:g.gems.slice(),shelf:g.shelf.slice(),selection:g.selection?{origin:g.selection.origin,color:g.selection.color,indices:g.selection.indices.slice()}:null};}
const out=(game,message)=>({game,changed:false,action:'blocked',message,count:0,addedSlots:0,unlocked:[]});
const countByColor=arr=>{const o=Object.create(null);for(const v of arr)if(v)o[v]=(o[v]||0)+1;return o;};
function adjacent(i,w,len){const x=i%w,y=Math.floor(i/w),h=Math.ceil(len/w),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h)out.push(ny*w+nx);}return out;}
/** Deterministic eight-neighbor connected paths; already-correct sources and nonempty target slots are barriers. */
export function region(g,index,mode,color){
  const {targets,width}=g.art,values=g.gems,len=targets.length;
  if(!Number.isInteger(index)||index<0||index>=len||targets[index]===null)return [];
  const eligible=i=>mode==='source'
    ?values[i]===color&&values[i]!==targets[i]
    :targets[i]===color&&values[i]===null;
  if(!eligible(index))return [];
  const queue=[index],visited=new Set(queue);
  for(let n=0;n<queue.length;n++)for(const j of adjacent(queue[n],width,len)){if(!visited.has(j)&&eligible(j)){visited.add(j);queue.push(j);}}
  return queue;
}
export function selectionPreview(g,request){
  const selected=g.selection;
  if(!selected)return {legal:false,kind:'none',count:0,indices:[],message:'Select a group first'};
  if(request?.type==='deposit'){
    if(selected.origin!=='board')return {legal:false,count:0,indices:[],message:'Choose an open matching board area'};
    const free=g.shelf.reduce((n,c)=>n+(c===null?1:0),0),count=Math.min(free,selected.indices.length);
    return {legal:count>0,kind:'deposit',count,indices:selected.indices.slice(0,count),total:selected.indices.length,
      message:count?'Store '+count+' jewel'+(count===1?'':'s')+(count<selected.indices.length?' · more selected':''):
        'Tray full — return a stored group to the board'};
  }
  if(request?.type!=='place')return {legal:false,kind:'none',count:0,indices:[],message:'Choose a destination'};
  const i=request.index,color=selected.color;
  if(!Number.isInteger(i)||i<0||i>=g.gems.length||g.art.targets[i]!==color)
    return {legal:false,count:0,indices:[],message:'Choose the matching color in the picture'};
  if(g.gems[i]!==null)
    return {legal:false,count:0,indices:[],message:'Destination occupied — clear these jewels first'};
  const open=region(g,i,'target',color);
  const count=Math.min(selected.indices.length,g.autoMove===false?1:open.length);
  return {legal:count>0,kind:'place',count,indices:open.slice(0,count),total:open.length,
    message:'Move '+count+' jewel'+(count===1?'':'s')+(count<selected.indices.length?' · keep selection':'')};
}
export function previewBoardAction(g,index){
  if(g.selection)return selectionPreview(g,{type:'place',index});
  const color=g.gems[index];if(!color||color===g.art.targets[index])return {legal:false,count:0,indices:[],message:'Choose a misplaced jewel'};
  const indices=region(g,index,'source',color);
  return {legal:indices.length>0,kind:'select',indices,count:indices.length,total:indices.length,color,
    message:'Select '+indices.length+' '+color+' jewels'};
}
export function previewAutoPlace(g){return {legal:false,count:0,indices:[],message:'Auto place removed — select a group and tap its destination'};}
function isSelection(o,g){
  if(o===null)return true;
  if(!o||!['board','tray'].includes(o.origin)||!Object.hasOwn(g.art.palette,o.color)||
    !Array.isArray(o.indices)||!o.indices.length||o.indices.length>g.gems.length+g.shelf.length)return false;
  const set=new Set(o.indices);if(set.size!==o.indices.length)return false;
  return o.indices.every(i=>Number.isInteger(i)&&i>=0&&
    (o.origin==='board'?i<g.gems.length&&g.gems[i]===o.color&&g.gems[i]!==g.art.targets[i]:
      i<g.shelf.length&&g.shelf[i]===o.color));
}
export function isValidSnapshot(g,art,{allowLegacy=false}={}){
  if(!g||!art||!Array.isArray(g.gems)||g.gems.length!==art.targets.length||!Array.isArray(g.shelf))return false;
  const cap=capacityForBoard(art,g.gems);
  // Historic 7-slot and 12/+2 layouts may have fewer EMPTY spaces than the v3 derived capacity.
  // Never permit an overfull legacy shelf; exact per-color inventory still must match.
  if(g.shelf.length!==cap&&!(allowLegacy&&g.shelf.length>=7&&g.shelf.length<=cap))return false;
  const palette=new Set(Object.keys(art.palette));
  if(!g.gems.every((c,i)=>art.targets[i]===null?c===null:c===null||palette.has(c)))return false;
  if(!g.shelf.every(c=>c===null||palette.has(c)))return false;
  if(!Number.isSafeInteger(g.moves)||g.moves<0||g.moves>1000000)return false;
  if(g.selection!==undefined&&!isSelection(g.selection,{...g,art}))return false;
  if(g.selectedSlot!==undefined&&g.selectedSlot!==null&&(!Number.isInteger(g.selectedSlot)||
    g.selectedSlot<0||g.selectedSlot>=g.shelf.length||!g.shelf[g.selectedSlot]))return false;
  const have=countByColor([...g.gems,...g.shelf]),want=countByColor(art.targets);
  return Object.keys(have).every(k=>have[k]===want[k])&&Object.keys(want).every(k=>have[k]===want[k]);
}
export function hydrateGame(g){
  if(!isValidSnapshot(g,g?.art,{allowLegacy:true}))throw new Error('The saved jewel inventory is incomplete or damaged');
  const cap=holdingCapacity(g),shelf=g.shelf.slice();
  if(shelf.length>cap)throw new Error('Saved jewels exceed legal holding capacity');
  while(shelf.length<cap)shelf.push(null);
  let selection=g.selection??null;
  if(!selection&&Number.isInteger(g.selectedSlot)&&g.shelf[g.selectedSlot]){
    const color=g.shelf[g.selectedSlot],indices=[];
    shelf.forEach((v,i)=>{if(v===color)indices.push(i);});
    selection={origin:'tray',color,indices};
  }
  const result={art:g.art,gems:g.gems.slice(),shelf,moves:g.moves,selection,
    autoMove:g.autoMove!==false};
  if(!isValidSnapshot(result,result.art))throw new Error('Saved selection cannot be restored');
  return result;
}
function selectedResult(g,sel){const next=cloneGame(g);next.selection=sel;
  return {game:next,action:'selected',changed:true,count:sel?.indices.length||0,addedSlots:0,unlocked:[]};}
function movement(g,type,indices){
  const sel=g.selection,oldColors=new Set(completedColors(g)),next=cloneGame(g);
  const moving=Math.min(indices.length,sel.indices.length);
  if(type==='deposit'){
    const free=[];next.shelf.forEach((v,i)=>{if(v===null&&free.length<moving)free.push(i);});
    for(let n=0;n<moving;n++){const i=sel.indices[n];next.gems[i]=null;next.shelf[free[n]]=sel.color;}
  }else{
    for(let n=0;n<moving;n++){
      const source=sel.indices[n],dest=indices[n];
      if(sel.origin==='board')next.gems[source]=null;else next.shelf[source]=null;
      next.gems[dest]=sel.color;
    }
  }
  const remaining=sel.indices.slice(moving);
  next.selection=remaining.length?{origin:sel.origin,color:sel.color,indices:remaining}:null;
  const completed=completedColors(next),unlocked=completed.filter(c=>!oldColors.has(c));
  const newCap=holdingCapacity(next),addedSlots=newCap-g.shelf.length;
  while(next.shelf.length<newCap)next.shelf.push(null);
  next.moves++;
  if(!isValidSnapshot(next,next.art))throw new Error('Invariant breach: jewel transfer rejected');
  return {game:next,action:isSolved(next)?'finished':type==='deposit'?'deposited':'transferred',
    changed:true,count:moving,addedSlots,unlocked,destinations:type==='deposit'?[]:indices.slice(0,moving)};
}
export function act(game,request){
  if(!request||typeof request.type!=='string')return out(game,'Unknown action');
  if(request.type==='cancel')return game.selection?selectedResult(game,null):out(game,'Nothing selected');
  if(request.type==='toggle-auto'){const next=cloneGame(game);next.autoMove=!next.autoMove;
    return {game:next,action:'setting',changed:true,count:0,addedSlots:0,unlocked:[]};}
  if(request.type==='select-board'){
    const index=request.index,color=game.gems[index];
    if(!color||color===game.art.targets[index])return out(game,'Select a misplaced jewel');
    if(game.selection?.origin==='board'&&game.selection.indices.includes(index))return selectedResult(game,null);
    const indices=region(game,index,'source',color);
    return selectedResult(game,{origin:'board',color,indices});
  }
  if(request.type==='select-tray'){
    const slot=request.slot,color=game.shelf[slot];
    if(!color)return out(game,'Select a stored jewel');
    if(game.selection?.origin==='tray'&&game.selection.indices.includes(slot))return selectedResult(game,null);
    const indices=[];game.shelf.forEach((v,i)=>{if(v===color)indices.push(i);});
    return selectedResult(game,{origin:'tray',color,indices});
  }
  if(request.type==='deposit'||request.type==='place'){
    const p=selectionPreview(game,request);
    if(!p.legal)return out(game,p.message);
    return movement(game,p.kind,p.indices);
  }
  // Explicitly disable old tray-first implicit swaps and target-choosing Auto place.
  return out(game,'Select a group and then choose where it goes');
}
export function hintFor(g){
  if(!g.selection){
    const index=g.gems.findIndex((c,i)=>c!==null&&c!==g.art.targets[i]);
    return {type:'board',index,message:'Select this movable color group'};
  }
  const c=g.selection.color;
  const index=g.art.targets.findIndex((v,i)=>v===c&&g.gems[i]===null);
  if(index>=0)return {type:'board',index,message:'Tap this open target to place the selected group'};
  if(g.selection.origin==='board')return {type:'deposit',index:-1,message:'Park the selected group in the broad tray area'};
  return {type:'board',index:-1,message:'Clear matching target space using a board group'};
}
export function serializeSave(g,completed=[],sound=false){
  if(!isValidSnapshot(g,g.art))throw new Error('Cannot save an inconsistent jewel inventory');
  const seed=g.art.seed;
  return JSON.stringify({schema:3,seed,gems:g.gems,shelf:g.shelf,selection:g.selection,
    autoMove:g.autoMove,moves:g.moves,
    completed:[...new Set(completed)].filter(s=>Number.isSafeInteger(s)&&s>=0&&s<=999999999).slice(-5000),sound:!!sound});
}
export function parseSave(raw){
  const data=JSON.parse(raw);
  if(![1,2,3].includes(data?.schema)||!Number.isSafeInteger(data.seed)||data.seed<0||data.seed>999999999)
    throw new Error('This is not a Spectrum Study save');
  const art=artworkFor(data.seed);
  if(!isValidSnapshot(data,art,{allowLegacy:data.schema!==3}))throw new Error('Jewel save damaged');
  if(!Array.isArray(data.completed)||data.completed.length>5000||!data.completed.every(x=>Number.isSafeInteger(x)&&x>=0&&x<=999999999))
    throw new Error('Completion history damaged');
  const game=hydrateGame({art,...data});
  return {game,completed:data.completed.slice(),sound:!!data.sound};
}
