import assert from 'node:assert/strict';
import {specs} from '../src/cases/specs.js';
import {initialState,coefficients} from '../src/ui/state.mjs';
import {molecule} from '../src/ui/view.mjs';
const water=specs.find(s=>s.id==='h2o');let count=0;
const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
for(const step of [3,4])for(const flipped of [false,true]){
 const state={...initialState(),step,hb:0,flipped,difference:{hb:0,flipped}};
 const html=molecule(state,water);eq(coefficients(state)[1]===0,true);
 eq(html.includes('data-site="1"'),false);eq(html.includes('data-zero-site="1"'),true);
 eq(html.includes('Hᵦ zero coefficient (no lobe)'),true);eq(html.includes('Opposite relative phase'),false);
 eq((html.match(/class="phase-disc /g)||[]).length,1);
 const unanswered={...state,hb:null,difference:{hb:null,flipped}};
 eq(molecule(unanswered,water).includes('phase-unanswered'),true);
 eq(molecule(unanswered,water).includes('Hᵦ unanswered (not zero)'),true);
 eq(molecule(unanswered,water).includes('data-zero-site'),false);
}
console.log(JSON.stringify({suite:'ui-zero',assertionsPassed:count}));
