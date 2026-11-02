import assert from 'node:assert/strict';
import {initialState,reduce,constructionPatterns,coefficients} from '../src/ui/state.mjs';
import {evaluateCompleteSet} from '../src/ui/complete-set.mjs';
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
let s={...initialState(),step:5};
eq(evaluateCompleteSet(s).result.status,'incomplete');eq(constructionPatterns(s),[[1,null],[1,1]]);
for(const a of [false,true])for(const b of [false,true]){
 const state={...s,hb:1,flipped:a,difference:{hb:-1,flipped:b}};const before=JSON.stringify(state);const r=evaluateCompleteSet(state);
 eq(r.result.status,'complete-valid');eq(r.rank,2);eq(r.result.assignment,['A1','B1']);eq(JSON.stringify(state),before);
 for(const operation of ['c2','xz','yz']){
  const q=evaluateCompleteSet({...state,completeSet:{stage:3,operation}});
  eq(q.transformations[0].relation,'unchanged');eq(q.transformations[1].relation,operation==='xz'?'unchanged':'global-reverse');
 }
}
for(const flipped of [false,true]){const r=evaluateCompleteSet({...s,hb:1,difference:{hb:1,flipped}});eq(r.result.status,'invalid');eq(r.rank,1);eq(r.result.issues[0].type,'duplicate-up-to-global-flip');}
eq(reduce(s,{type:'check-symmetry'}),s);
s={...s,hb:1,difference:{hb:-1,flipped:false}};
for(const type of ['check-set','check-independence','check-symmetry'])s=reduce(s,{type});eq(s.completeSet.stage,3);
s=reduce(s,{type:'axes',value:false});s=reduce(s,{type:'guides',value:false});eq(s.completeSet.stage,3);
const before=constructionPatterns(s);const reset=reduce(s,{type:'reset-check'});eq(reset.completeSet.stage,0);eq(constructionPatterns(reset),before);eq(reset.axes,false);eq(reset.guides,false);
s=reduce(s,{type:'edit-sum'});s=reduce(s,{type:'reset'});eq(s.completeSet.stage,0);s=reduce(reduce(s,{type:'next'}),{type:'next'});eq(evaluateCompleteSet(s).result.status,'incomplete');
s=reduce(s,{type:'edit-sum'});s=reduce(s,{type:'same'});s=reduce(s,{type:'next'});s=reduce(s,{type:'reset'});s=reduce(s,{type:'next'});eq(evaluateCompleteSet(s).result.status,'invalid');
assert.throws(()=>coefficients(s),RangeError);count++;
eq(reduce(s,{type:'next'}).step,6);eq(reduce(s,{type:'back'}).step,4);
console.log(JSON.stringify({suite:'step5',assertionsPassed:count}));
