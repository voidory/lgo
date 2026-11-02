import assert from 'node:assert/strict';
import {freshH2O,updateH2O,evaluateH2O,h2oReference} from '../src/ui/h2o-model.mjs';
let count=0;
const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
const patterns=[[1,1],[1,-1]];
const {system,central}=h2oReference();
const apply=(w,type,value,extra={})=>updateH2O(w,{type,value,...extra});
function matched(){let w=freshH2O();w=apply(w,'match',['s','pz'],{slot:0});return apply(w,'match',['px'],{slot:1});}
function constructed(){let w=matched();w=apply(w,'partner','pz',{slot:0});w=apply(w,'partner','px',{slot:1});w=apply(w,'neglect','energy');for(const m of system.mos)w=apply(w,'product',m.kind,{id:m.id});return w;}
function ordered(){let w=constructed();for(const m of system.mos)w=apply(w,'level',m.kind==='antibonding'?5:0,{id:m.id});return w;}
function filled(){let w=ordered();w=apply(w,'reference',true);for(const m of system.mos)w=apply(w,'occupancy',m.kind==='antibonding'?0:2,{id:m.id});return apply(w,'bond-order',1);}
let w=freshH2O();
eq(w.matches,[null,null]);eq(evaluateH2O(w,patterns).matching.status,'unanswered');eq(evaluateH2O(w,[[1,null],[1,1]]).matching.status,'blocked');eq(evaluateH2O(w,[[1,1],[-1,-1]]).matching.status,'blocked');
eq(central.py.irrep,'B2');eq(central.py.zeroLigandCoupling,true);
for(const a of [1,-1])for(const b of [1,-1]){
 const p=[patterns[0].map(x=>a*x),patterns[1].map(x=>b*x)];
 eq(evaluateH2O(filled(),p).complete,true);
}
w=matched();let r=evaluateH2O(w,patterns);eq(r.matching.status,'correct');eq(r.construction.status,'unanswered');
w=apply(w,'match',['pz'],{slot:0});r=evaluateH2O(w,patterns);eq(r.matching.status,'incorrect');eq(r.matching.details[0].courseOk,true);
w=apply(matched(),'match',[],{slot:1});eq(evaluateH2O(w,patterns).matching.status,'incorrect');
w=constructed();eq(evaluateH2O(w,patterns).construction.status,'correct');
w=apply(w,'neglect','symmetry');eq(evaluateH2O(w,patterns).construction.status,'unanswered');
for(const m of system.mos)w=apply(w,'product',m.kind,{id:m.id});eq(evaluateH2O(w,patterns).construction.status,'incorrect');
w=constructed();
// Equal aggregate counts do not establish correct individual MO outcomes.
w=apply(w,'product','antibonding',{id:'b:LGO1+pz'});w=apply(w,'product','bonding',{id:'a:LGO1+pz'});
r=evaluateH2O(w,patterns);eq(r.construction.counts,{bonding:2,nonbonding:2,antibonding:2});eq(r.construction.status,'incorrect');
w=ordered();eq(evaluateH2O(w,patterns).ordering.status,'correct');
w=apply(w,'level',0,{id:'a:LGO1+pz'});eq(evaluateH2O(w,patterns).ordering.status,'incorrect');
w=apply(ordered(),'level',null,{id:'n:s'});eq(evaluateH2O(w,patterns).ordering.status,'unanswered');
w=ordered();eq(evaluateH2O(w,patterns).filling.reason,'reference-not-acknowledged');w=apply(w,'reference',true);
for(const m of system.mos)if(m.id!=='a:LGO2+px')w=apply(w,'occupancy',m.kind==='antibonding'?0:2,{id:m.id});
eq(evaluateH2O(w,patterns).filling.details.status,'unanswered');
w=apply(w,'occupancy',0,{id:'a:LGO2+px'});eq(evaluateH2O(w,patterns).filling.status,'unanswered');w=apply(w,'bond-order',1);eq(evaluateH2O(w,patterns).complete,true);
eq(evaluateH2O(w,patterns).filling.bond.total,2);
w=apply(w,'occupancy',1,{id:'n:s'});eq(evaluateH2O(w,patterns).filling.status,'incorrect');eq(evaluateH2O(w,patterns).filling.bond,null);
for(const bad of [-1,3,0.5,Infinity,NaN,'2',undefined])eq(apply(w,'occupancy',bad,{id:'n:s'}),w);
eq(apply(w,'occupancy',1,{id:'unknown'}),w);
eq(apply(w,'match',['pz','pz'],{slot:0}),w);eq(apply(w,'match',['unknown'],{slot:0}),w);
const complete=filled();const before=JSON.stringify(complete);const pb=JSON.stringify(patterns);evaluateH2O(complete,patterns);eq(JSON.stringify(complete),before);eq(JSON.stringify(patterns),pb);
const edited=apply(complete,'level',1,{id:'n:s'});eq(edited.occupancies,{});eq(edited.bondOrder,null);eq(edited.reference,null);eq(complete.occupancies['n:s'],2);
const rematch=apply(complete,'match',['s','pz'],{slot:0});eq(rematch.products,{});eq(rematch.levels,{});eq(rematch.occupancies,{});
eq(apply(complete,'reset',null),freshH2O());
const detached=h2oReference();detached.system.mos[0].kind='broken';eq(h2oReference().system.mos[0].kind,'bonding');
const selected=['s','pz'];const copied=apply(freshH2O(),'match',selected,{slot:0});selected.pop();eq(copied.matches[0],['s','pz']);
console.log(JSON.stringify({suite:'h2o-model',assertionsPassed:count}));
