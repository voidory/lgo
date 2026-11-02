import assert from 'node:assert/strict';
import fs from 'node:fs';
import {specs} from '../src/cases/specs.js';
import {initialState,reduce,coefficients,Coefficient} from '../src/ui/state.mjs';
import {view,molecule} from '../src/ui/view.mjs';
const water=specs.find(s=>s.id==='h2o');
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
let s=initialState();
eq(reduce(s,{type:'back'}).step,1);
eq(reduce({...s,step:5},{type:'next'}).step,5);
eq(reduce(s,{type:'opposite'}),s);
eq(reduce(s,{type:'same'}),s);
eq(coefficients(s),[1,null]);eq(new Set(Object.values(Coefficient)).size,4);
s=reduce(reduce(s,{type:'next'}),{type:'next'});
s=reduce(s,{type:'same'});s=reduce(s,{type:'flip'});eq(coefficients(s),[-1,-1]);
s=reduce(s,{type:'next'});eq(coefficients(s),[1,1]);
eq(reduce(s,{type:'flip'}),s);
s=reduce(s,{type:'opposite'});eq(coefficients(s),[1,-1]);
s=reduce(s,{type:'flip'});eq(coefficients(s),[-1,1]);
s=reduce(s,{type:'back'});eq(coefficients(s),[-1,-1]);
s=reduce(s,{type:'reset'});eq(coefficients(s),[1,null]);
s=reduce(s,{type:'next'});eq(coefficients(s),[-1,1]);
s=reduce(s,{type:'axes',value:false});s=reduce(s,{type:'guides',value:false});
s=reduce(s,{type:'reset'});eq(coefficients(s),[1,1]);eq(s.axes,false);eq(s.guides,false);
eq(s.hb,null);eq(s.flipped,false);
const rendered=[];
for(const step of [1,2,3,4,5])for(const axes of [true,false])for(const guides of [true,false])for(const phase of ['initial','built','flipped']){
 const state={...initialState(),step,axes,guides,hb:phase==='initial'?null:1,flipped:phase==='flipped',difference:{hb:phase==='initial'?1:-1,flipped:phase==='flipped'}};
 const html=view(state,water);rendered.push(html);
 eq(html.includes('Step 0'+step+' of 09'),true);
 eq(html.includes('data-action="next"'),step<5);
 eq(html.includes('id="back" data-action="back" disabled'),step===1);
 eq(html.includes('data-setting="guides"'),step>1);
 if(step<5)eq(molecule(state,water).includes('M220 226V32'),axes);
 if(step===5){eq(html.includes('data-action="check-set"'),true);eq(html.includes('id="set-sum-mol-title"'),true);eq(html.includes('id="set-difference-mol-title"'),true);}
 if(step===4){eq(html.includes('data-action="opposite"'),true);eq((html.match(/class="phase-disc phase-minus"/g)||[]).length,phase==='initial'?0:1);eq(html.includes('Step 5 will use the engine'),true);}
 if(step===3)eq(html.includes('phase-unanswered'),phase==='initial');
}
for(const file of ['src/ui/app.mjs','src/ui/announcements.mjs','src/ui/step4.mjs','src/ui/guided.css','src/cases/specs.js'])eq(fs.existsSync(file),true);
console.log(JSON.stringify({assertionsPassed:count,renderedStates:rendered.length}));
if(process.env.UI_RENDER_DUMP)fs.writeFileSync(process.env.UI_RENDER_DUMP,JSON.stringify(rendered));
