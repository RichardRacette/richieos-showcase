/* Clean-room synthetic examples. No private product code or connections. */
(function (root) {
  'use strict';
  const STATES = ['READY','ACTIVE','VERIFYING','HUMAN_REQUIRED','ACCEPTED','COMPLETE'];
  function makeTask(project) {
    if (typeof project !== 'string' || !project.trim() || project.length > 80) throw new TypeError('A short project name is required.');
    return {project, status:'READY', humanAccepted:false, evidence:[]};
  }
  function transition(task,event,actor) {
    if (!task || !STATES.includes(task.status) || typeof task.humanAccepted !== 'boolean' || !Array.isArray(task.evidence)) throw new TypeError('Invalid work item.');
    const rules = {assign:['READY','coordinator','ACTIVE'], submit:['ACTIVE','worker','VERIFYING'], verify:['VERIFYING','coordinator','HUMAN_REQUIRED'], accept:['HUMAN_REQUIRED','human','ACCEPTED'], complete:['ACCEPTED','coordinator','COMPLETE']};
    const rule=rules[event];
    if (!rule || rule[0] !== task.status || rule[1] !== actor) throw new Error('This role cannot perform that transition.');
    if (event === 'complete' && !task.humanAccepted) throw new Error('Human acceptance is required.');
    return {...task, status:rule[2], humanAccepted:task.humanAccepted || event==='accept', evidence:event==='submit' ? [...task.evidence, 'Synthetic check report'] : [...task.evidence]};
  }
  function makeMosaic(size) {
    if (!Number.isInteger(size) || size<4 || size>40) throw new RangeError('Choose an integer size from 4 to 40.');
    const cells=Array.from({length:size*size}, (_,i)=> {
      const x=i%size, y=Math.floor(i/size), d=Math.abs(x-(size-1)/2)+Math.abs(y-(size-1)/2);
      return Math.floor(d)%8;
    });
    return {size,cells,filled:Array(size*size).fill(false)};
  }
  function paintCell(state,index,color) {
    if (!state || !Array.isArray(state.cells) || !Array.isArray(state.filled) || state.cells.length!==state.filled.length) throw new TypeError('Invalid mosaic.');
    if (!Number.isInteger(index) || index<0 || index>=state.cells.length) throw new RangeError('Invalid cell.');
    if (!Number.isInteger(color) || color<0 || color>7) throw new RangeError('Invalid color.');
    const filled=[...state.filled];
    if(state.cells[index]===color) filled[index]=true;
    return {...state,cells:[...state.cells],filled};
  }
  function shiftPage(index,delta,total) {
    if (![index,delta,total].every(Number.isInteger) || total<1 || index<0 || index>=total) throw new RangeError('Invalid page navigation.');
    return Math.max(0,Math.min(total-1,index+delta));
  }
  const api={makeTask,transition,makeMosaic,paintCell,shiftPage};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.ShowcaseCore=api;
})(globalThis);
