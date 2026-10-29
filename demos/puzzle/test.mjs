import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,act,isSolved,isValidSnapshot,completedCount,holdingCapacity} from './engine.mjs';
import {solveBySelections} from './solver-test-helper.mjs';
test('20x20 eight-color fixture has valid conserved inventory',()=>{const g=newGame(42);assert.equal(g.gems.length,400);assert.equal(new Set(g.art.targets).size,8);assert(isValidSnapshot(g,g.art));assert(!isSolved(g));assert.equal(holdingCapacity(g),12)});
test('selection keeps jewels in place; occupied destinations block',()=>{const g=newGame(42),i=g.gems.findIndex((c,i)=>c!==g.art.targets[i]);const s=act(g,{type:'select-board',index:i});assert(s.changed);assert.deepEqual(s.game.gems,g.gems);assert.equal(act(s.game,{type:'place',index:i}).changed,false);const d=act(s.game,{type:'deposit'});assert(d.changed);assert(isValidSnapshot(d.game,d.game.art));});
test('100 deterministic fixtures solve with legal selection and transfer actions',()=>{for(let seed=0;seed<100;seed++){const r=solveBySelections(newGame(seed));assert(r.solved,`seed ${seed}`);assert.equal(completedCount(r.game),400);assert.equal(holdingCapacity(r.game),108)}});
