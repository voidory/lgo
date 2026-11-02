// Pure H2O workflow adapter. No DOM, stored verdicts, automatic answers or engine changes.
import {specs} from '../cases/specs.js';
import {buildCaseModel} from '../engine/casemodel.js';
import {validateSet} from '../engine/completeset.js';
import {COURSE} from '../course/data.js';
import {gradeMatching,buildCourseSystem,gradeOrdering,gradeFilling,computeBondOrder,centralSymmetry} from '../engine/grading.js';
const model=buildCaseModel(specs.find(s=>s.id==='h2o'));
const course=COURSE.h2o;
const system=buildCourseSystem(model,course);
const aos=['s','px','py','pz'];
const kinds=['bonding','nonbonding','antibonding'];
const ids=system.mos.map(m=>m.id);
const own=(o,k)=>Object.hasOwn(o,k);
const allAnswered=o=>ids.every(id=>own(o,id)&&o[id]!==null&&o[id]!==undefined);
const status=(name,extra={})=>({status:name,...extra});
export const freshH2O=()=>({matches:[null,null],partners:[null,null],neglect:null,products:{},levels:{},reference:null,occupancies:{},bondOrder:null});
// Detached metadata prevents a view from modifying the shared reference system.
export function h2oReference(){return structuredClone({central:centralSymmetry(model),system,claims:course.claims,verify:course.verify,tasks:system.mos.map(m=>({id:m.id,sources:m.from,relation:m.kind==='bonding'?'overlap-reinforcing':m.kind==='antibonding'?'overlap-opposing':'not-interacting-in-course-model'}))});}
const modelFields=w=>({matches:w.matches,partners:w.partners,neglect:w.neglect});
const integer=(n,hi)=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=hi;
export function updateH2O(w,a){
 if(!a||typeof a!=='object')return w;
 switch(a.type){
  case 'match':{
   if(![0,1].includes(a.slot))return w;
   if(a.value!==null&&(!Array.isArray(a.value)||a.value.some(id=>!aos.includes(id))||new Set(a.value).size!==a.value.length))return w;
   const matches=w.matches.map((v,i)=>i===a.slot?(a.value===null?null:[...a.value]):v);
   return {...freshH2O(),matches};
  }
  case 'partner':
   if(![0,1].includes(a.slot)||!(a.value===null||a.value==='none'||aos.includes(a.value)))return w;
   return {...freshH2O(),...modelFields(w),partners:w.partners.map((v,i)=>i===a.slot?a.value:v)};
  case 'neglect':
   if(![null,'energy','symmetry','retain'].includes(a.value))return w;
   return {...freshH2O(),...modelFields(w),neglect:a.value};
  case 'product':
   if(!ids.includes(a.id)||!(a.value===null||kinds.includes(a.value)))return w;
   return {...freshH2O(),...modelFields(w),products:{...w.products,[a.id]:a.value}};
  case 'level':
   if(!ids.includes(a.id)||!(a.value===null||integer(a.value,ids.length-1)))return w;
   return {...w,levels:{...w.levels,[a.id]:a.value},reference:null,occupancies:{},bondOrder:null};
  case 'reference':
   if(![null,false,true].includes(a.value))return w;
   return {...w,reference:a.value,bondOrder:null};
  case 'occupancy':
   if(!ids.includes(a.id)||!(a.value===null||integer(a.value,2)))return w;
   return {...w,occupancies:{...w.occupancies,[a.id]:a.value},bondOrder:null};
  case 'bond-order':
   if(!(a.value===null||[0,0.5,1,1.5,2,2.5,3].includes(a.value)))return w;
   return {...w,bondOrder:a.value};
  case 'reset':return freshH2O();
  default:return w;
 }
}
export function evaluateH2O(w,patterns){
 const ligandSet=validateSet(model,patterns);
 const setOk=ligandSet.status==='complete-valid';
 const matchDetails=setOk?patterns.map((pattern,i)=>w.matches[i]===null?status('unanswered'):gradeMatching(model,course,{pattern,selected:w.matches[i],none:w.matches[i].length===0})):[];
 const matching=!setOk?status('blocked',{reason:'ligand-set',ligandStatus:ligandSet.status}):w.matches.some(v=>v===null)?status('unanswered'):matchDetails.every(r=>r.status==='correct')?status('correct'):status('incorrect');
 matching.details=matchDetails;
 const pairDetails=setOk?patterns.map((pattern,i)=>w.partners[i]===null?status('unanswered'):gradeMatching(model,course,{pattern,selected:w.partners[i]==='none'?[]:[w.partners[i]],none:w.partners[i]==='none'})):[];
 const productsAnswered=allAnswered(w.products);
 const productDetails=system.mos.map(m=>({id:m.id,answer:w.products[m.id]??null,correct:w.products[m.id]===m.kind}));
 const counts=Object.fromEntries(kinds.map(kind=>[kind,productDetails.filter(p=>p.answer===kind).length]));
 const construction=matching.status!=='correct'?status('blocked',{reason:'matching'}):w.partners.some(v=>v===null)||w.neglect===null||!productsAnswered?status('unanswered'):pairDetails.every(r=>r.courseOk)&&w.neglect==='energy'&&productDetails.every(p=>p.correct)?status('correct'):status('incorrect');
 construction.partners=pairDetails;construction.products=productDetails;construction.counts=counts;
 const levelDetails=gradeOrdering(system,w.levels);
 const ordering=construction.status!=='correct'?status('blocked',{reason:'construction'}):!allAnswered(w.levels)?status('unanswered'):status(levelDetails.status==='correct'?'correct':'incorrect');
 ordering.details=levelDetails;
 // Do not pass unanswered UI occupancies to an engine which treats omitted keys as zero.
 const fillDetails=allAnswered(w.occupancies)?gradeFilling(system,w.occupancies):status('unanswered');
 const bond=fillDetails.status==='correct'?computeBondOrder(system,w.occupancies):null;
 const filling=ordering.status!=='correct'?status('blocked',{reason:'ordering'}):w.reference!==true?status('blocked',{reason:'reference-not-acknowledged'}):fillDetails.status==='unanswered'?status('unanswered'):fillDetails.status!=='correct'?status('incorrect'):w.bondOrder===null?status('unanswered'):w.bondOrder===bond.perBond?status('correct'):status('incorrect');
 filling.details=fillDetails;filling.bond=bond;
 return {ligandSet,matching,construction,ordering,filling,complete:[matching,construction,ordering,filling].every(r=>r.status==='correct')};
}
