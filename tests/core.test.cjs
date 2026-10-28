const test = require('node:test');
const assert = require('node:assert/strict');
let core = {};
try { core = require('../site/core.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }

test('model API exists', () => assert.equal(typeof core.makeTask, 'function'));
test('new tasks are fictional and awaiting assignment', () => { const s=core.makeTask('Paper Kite'); assert.equal(s.status,'READY'); assert.equal(s.humanAccepted,false); });
test('only coordinator assigns', () => { assert.throws(()=>core.transition(core.makeTask('Paper Kite'),'assign','worker')); });
test('worker cannot complete or accept', () => { const s=core.transition(core.makeTask('Paper Kite'),'assign','coordinator'); assert.throws(()=>core.transition(s,'accept','worker')); assert.throws(()=>core.transition(s,'complete','worker')); });
test('verification leaves human acceptance pending', () => { let s=core.makeTask('Paper Kite'); s=core.transition(s,'assign','coordinator'); s=core.transition(s,'submit','worker'); s=core.transition(s,'verify','coordinator'); assert.equal(s.status,'HUMAN_REQUIRED'); assert.equal(s.humanAccepted,false); assert.throws(()=>core.transition(s,'complete','coordinator')); });
test('human acceptance and coordinator completion are distinct', () => { let s=core.makeTask('Paper Kite'); for(const [e,a] of [['assign','coordinator'],['submit','worker'],['verify','coordinator'],['accept','human'],['complete','coordinator']]) s=core.transition(s,e,a); assert.equal(s.status,'COMPLETE'); assert.equal(s.humanAccepted,true); });
test('transitions do not mutate prior state', () => { const s=core.makeTask('Paper Kite'); const n=core.transition(s,'assign','coordinator'); assert.equal(s.status,'READY'); assert.equal(n.status,'ACTIVE'); });
test('reject malformed state, project, event and role', () => { assert.throws(()=>core.makeTask('')); assert.throws(()=>core.transition({},'assign','coordinator')); assert.throws(()=>core.transition(core.makeTask('Paper Kite'),'launch','coordinator')); assert.throws(()=>core.transition(core.makeTask('Paper Kite'),'assign','admin')); });
test('mosaic is deterministic and uses 8 numbered colors', () => { const a=core.makeMosaic(20), b=core.makeMosaic(20); assert.equal(a.cells.length,400); assert.deepEqual(a,b); assert.equal(new Set(a.cells).size,8); assert.ok(a.cells.every(x=>x>=0&&x<8)); });
test('reject pathological mosaic sizes', () => { for (const n of [0,1,-1,1.2,NaN,101,'20']) assert.throws(()=>core.makeMosaic(n)); });
test('painting is correct-only and immutable', () => { const s=core.makeMosaic(8), c=s.cells[0]; assert.throws(()=>core.paintCell(s,-1,c)); const wrong=core.paintCell(s,0,(c+1)%8); assert.deepEqual(wrong.filled,s.filled); const right=core.paintCell(s,0,c); assert.equal(right.filled[0],true); assert.equal(s.filled[0],false); });
test('paint rejects malformed color and index', () => {const s=core.makeMosaic(8); for (const c of [-1,8,NaN,'1']) assert.throws(()=>core.paintCell(s,0,c)); for (const i of [64,0.5,NaN,'0']) assert.throws(()=>core.paintCell(s,i,0)); });
test('reader clamps page navigation', () => { assert.equal(core.shiftPage(0,-1,4),0); assert.equal(core.shiftPage(3,1,4),3); assert.equal(core.shiftPage(1,1,4),2); });
test('reader rejects invalid input', () => { assert.throws(()=>core.shiftPage(0,1,0)); assert.throws(()=>core.shiftPage(-1,1,4)); assert.throws(()=>core.shiftPage(4,1,4)); assert.throws(()=>core.shiftPage(0,NaN,4)); });
