import {orbitalRep} from './symmetry.js';
import {decompose} from './irreps.js';
import {fb} from './feedback.js';
export function inspectSetInput(model,patterns){
 const incomplete=()=>({status:'incomplete',issues:[{type:'count',detail:`need ${model.n} fully specified patterns`}]});
 const invalid=()=>({status:'invalid',issues:[{type:'malformed-pattern'}]});
 if(!Array.isArray(patterns))return invalid();
 let missing=patterns.length!==model.n;
 for(const p of Array.from(patterns)){
  if(p===null||p===undefined){missing=true;continue;}
  if(!Array.isArray(p))return invalid();
  if(p.length!==model.n)missing=true;
  for(const x of Array.from(p)){if(x===null||x===undefined)missing=true;else if(![-1,0,1].includes(x))return invalid();}
 }
 return missing?incomplete():null;
}
export function validateOccupancies(system,occ){
 const issues=[],values=Object.create(null);
 if(occ===null||typeof occ!=='object'||Array.isArray(occ)||![Object.prototype,null].includes(Object.getPrototypeOf(occ)))return {ok:false,issues:[{type:'occupancy-map'}],values};
 const known=new Set(system.mos.map(m=>m.id));
 for(const key of Reflect.ownKeys(occ)){
  if(typeof key!=='string'||!known.has(key)){issues.push({type:'unknown-orbital',orbital:String(key)});continue;}
  const d=Object.getOwnPropertyDescriptor(occ,key);
  if(!Object.hasOwn(d,'value')){issues.push({type:'invalid-occupancy',orbital:key});continue;}
  const n=d.value;
  if(typeof n!=='number'||!Number.isFinite(n)||!Number.isInteger(n)||n<0)issues.push({type:'invalid-occupancy',orbital:key});
  else if(n>2)issues.push({type:'overfull',orbital:key});else values[key]=n;
 }
 for(const id of known)if(!Object.hasOwn(values,id))values[id]=0;
 return {ok:issues.length===0,issues,values};
}
export function guardFilling(system,occ,grade){
 const r=validateOccupancies(system,occ);
 if(r.ok)return grade(system,r.values);
 const invalid=r.issues.some(i=>i.type!=='overfull');
 return {status:invalid?'invalid-input':'overfull',issues:r.issues,messages:[invalid?fb('F5',{issues:r.issues}):fb('F2',{orbitals:r.issues.map(i=>i.orbital)})]};
}
export function deriveCentral(model,sampled){
 const out={},axes={px:[1,0,0],py:[0,1,0],pz:[0,0,1]};
 for(const c of model.central){
  let irrep=sampled[c.id],source=irrep?'ligand-coupling':'unresolved';const dir=axes[c.id];
  const preserved=dir&&model.group.elements.every(R=>{const v=R.map(row=>row.reduce((s,x,i)=>s+x*dir[i],0));return [1,-1].some(sign=>v.every((x,i)=>Math.abs(x-sign*dir[i])<1e-9));});
  if(c.id==='s'||preserved){const [d]=decompose(model.group,orbitalRep(model.group,[{pos:[0,0,0],dir:dir||null}]),model.spec.labelRules);if(model.spec.labelRules.some(r=>r.name===d.name)){irrep=d.name;source='ao-transformation';}}
  out[c.id]={irrep,sampledIrrep:c.irrep,zeroLigandCoupling:c.vec.every(x=>Math.abs(x)<1e-9),source};
 }
 const co=model.spec.centralOrbital;if(co)out[co.id]={irrep:sampled[co.id],sampledIrrep:null,zeroLigandCoupling:null,source:sampled[co.id]?'ao-transformation':'unresolved'};
 return out;
}
export function guardMatching(model,course,input,grade,key){
 const blocked=reason=>({status:'blocked',reason,courseOk:false,messages:[]});
 if(!input||typeof input!=='object'||Array.isArray(input))return blocked('invalid matching input');
 if(input.selected!==undefined&&(!Array.isArray(input.selected)||Array.from(input.selected).some(id=>typeof id!=='string')))return blocked('invalid central selection');
 if(input.none!==undefined&&typeof input.none!=='boolean')return blocked('invalid nonbonding selection');
 if(input.none&&input.selected?.length)return blocked('conflicting selections');
 if(input.lgoId!==undefined){
  if(input.pattern!==undefined)return blocked('choose lgoId or pattern, not both');
  if(!course.lgos.some(l=>l.id===input.lgoId))return blocked('unknown course LGO');
 }else{
  if(!Array.isArray(input.pattern)||input.pattern.length!==model.n||Array.from(input.pattern).some(x=>![-1,0,1].includes(x)))return blocked('invalid or incomplete sign pattern');
  if(!course.lgos.some(l=>key(l.pattern)===key(input.pattern)))return {...blocked('noncanonical sign-only matching requires coefficient-level support'),messages:[fb('X3')]};
 }
 return grade(model,course,input);
}
export function guardConstruction(model,course,patterns,grade){
 const r=inspectSetInput(model,patterns);
 return r?{status:r.status,set:r,perSlot:[],courseMatchedCount:0,courseTotal:course.lgos.length,courseAligned:false,messages:[fb(r.status==='incomplete'?'S1':'S4')]}:grade(model,course,patterns);
}
