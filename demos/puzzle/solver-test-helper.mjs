/** Test-only constructive solution search; never imported by product/runtime. */
import {act,isSolved,holdingCapacity,isValidSnapshot} from './engine.mjs';

export function solveBySelections(initial,limit=20000){
  let game=initial,transfers=0,deposits=0,direct=0,largest=0,steps=0;
  for(;steps<limit&&!isSolved(game);steps++){
    if(game.selection){
      const cancel=act(game,{type:'cancel'});
      if(!cancel.changed)throw Error('Cannot clear selection');
      game=cancel.game;
    }
    // First, use any open target reachable directly from a misplaced board group.
    let acted=false;
    for(let i=0;i<game.gems.length;i++){
      const color=game.gems[i];
      if(!color||color===game.art.targets[i])continue;
      const target=game.art.targets.findIndex((x,j)=>x===color&&game.gems[j]===null);
      if(target<0)continue;
      const selected=act(game,{type:'select-board',index:i});
      const moved=act(selected.game,{type:'place',index:target});
      if(!moved.changed)continue;
      game=moved.game;direct++;transfers++;largest=Math.max(largest,moved.count);acted=true;break;
    }
    if(acted)continue;
    // Then return any stored jewels with an open, matching destination.
    for(let slot=0;slot<game.shelf.length;slot++){
      const color=game.shelf[slot];if(!color)continue;
      const target=game.art.targets.findIndex((x,j)=>x===color&&game.gems[j]===null);
      if(target<0)continue;
      const selected=act(game,{type:'select-tray',slot});
      const moved=act(selected.game,{type:'place',index:target});
      if(!moved.changed)continue;
      game=moved.game;transfers++;largest=Math.max(largest,moved.count);acted=true;break;
    }
    if(acted)continue;
    // Only when no direct/return placement exists do we park a blocking group.
    if(game.shelf.some(c=>c===null)){
      for(let i=0;i<game.gems.length;i++){
        const color=game.gems[i];if(!color||color===game.art.targets[i])continue;
        const selected=act(game,{type:'select-board',index:i});
        const deposited=act(selected.game,{type:'deposit'});
        if(!deposited.changed)continue;
        game=deposited.game;deposits++;largest=Math.max(largest,deposited.count);acted=true;break;
      }
    }
    if(!acted)break;
    if(!isValidSnapshot(game,game.art))throw Error('Invalid conservation after '+steps);
    if(game.shelf.length!==holdingCapacity(game))throw Error('Invalid capacity after '+steps);
  }
  return {game,solved:isSolved(game),steps,transfers,deposits,direct,largest};
}
