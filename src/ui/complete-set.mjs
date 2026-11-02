// Existing mathematical engine is the sole source of the set verdict.
import {specs} from '../cases/specs.js';
import {buildCaseModel} from '../engine/casemodel.js';
import {validateSet} from '../engine/completeset.js';
import {rankOf,mulv} from '../engine/linalg.js';
import {elementIndex} from '../engine/symmetry.js';
import {constructionPatterns} from './state.mjs';
const water=specs.find(s=>s.id==='h2o');
const model=buildCaseModel(water);
export const operations=Object.freeze([
 {id:'c2',name:'C₂ about z',description:'Rotate 180° about the z bisector. The H sites exchange.',matrix:[[-1,0,0],[0,-1,0],[0,0,1]]},
 {id:'xz',name:'Reflection in xz',description:'Reflect in the molecular plane. Each H site remains in place.',matrix:[[1,0,0],[0,-1,0],[0,0,1]]},
 {id:'yz',name:'Reflection in yz',description:'Reflect in the plane perpendicular to the molecule through z. The H sites exchange.',matrix:[[-1,0,0],[0,1,0],[0,0,1]]}
]);
export function evaluateCompleteSet(state){
 const patterns=constructionPatterns(state);
 const defined=p=>p.every(x=>x!==null&&x!==undefined);
 const result=validateSet(model,patterns);
 const specified=patterns.filter(defined).length;
 // Rank is an explanatory engine diagnostic, not an alternative acceptance rule.
 const rank=specified===2?rankOf(patterns):null;
 const operation=operations.find(o=>o.id===state.completeSet.operation)||operations[0];
 const D=model.Ds[elementIndex(model.group,operation.matrix)];
 const transformations=patterns.map(p=>{
  if(!defined(p))return {pattern:p,transformed:null,relation:'unanswered'};
  const transformed=mulv(D,p);
  const relation=transformed.every((x,i)=>x===p[i])?'unchanged':transformed.every((x,i)=>x===-p[i])?'global-reverse':'mixed';
  return {pattern:p,transformed,relation};
 });
 return {patterns,result,specified,rank,operation,transformations};
}
export function verdictText(check){
 if(check.result.status==='complete-valid')return 'Engine verdict: complete valid set. Two independent, symmetry-compatible LGOs are retained.';
 if(check.result.status==='incomplete')return 'Engine verdict: incomplete. Return to the constructions and supply the unanswered phases; no signs have been filled in for you.';
 if(check.result.issues.some(i=>i.type==='duplicate-up-to-global-flip'))return 'Engine verdict: not a complete set. The two slots repeat the same LGO up to global phase.';
 return 'Engine verdict: invalid set. The retained patterns do not form the required independent, symmetry-compatible set.';
}
