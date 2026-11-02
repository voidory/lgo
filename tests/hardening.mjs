import assert from 'node:assert/strict';
import {specs} from '../src/cases/specs.js';
import {COURSE} from '../src/course/data.js';
import {buildCaseModel} from '../src/engine/casemodel.js';
import {validateSet} from '../src/engine/completeset.js';
import {centralIrreps,centralSymmetry,buildCourseSystem,computeFill,gradeFilling,gradeMatching,gradeConstruction} from '../src/engine/grading.js';
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
const M=Object.fromEntries(specs.map(s=>[s.id,buildCaseModel(s)]));
const h=M.h2o,C=COURSE.h2o,system=buildCourseSystem(h,C),good=computeFill(system);
eq(centralIrreps(h),{s:'A1',px:'B1',py:'B2',pz:'A1'});
eq(centralSymmetry(h).py,{irrep:'B2',sampledIrrep:null,zeroLigandCoupling:true,source:'ao-transformation'});
for(const m of Object.values(M)){
 const before=JSON.stringify(m.central),ir=centralIrreps(m);
 for(const c of m.central)if(c.irrep)eq(ir[c.id],c.irrep);
 eq(JSON.stringify(m.central),before);
}
eq(gradeFilling(system,good).status,'correct');
eq(gradeFilling(system,Object.fromEntries(Object.entries(good).filter(([,v])=>v))).status,'correct');
eq(gradeFilling(system,Object.assign(Object.create(null),good)).status,'correct');
for(const bad of [null,undefined,[],1,'',true,()=>{},new Date(),new Map()])eq(gradeFilling(system,bad).status,'invalid-input');
const first=system.mos[0].id;
for(const value of [-1,-0.5,0.5,1.5,NaN,Infinity,-Infinity,'2',true,null,undefined,{},[],2n]){
 const r=gradeFilling(system,{...good,[first]:value});eq(r.status,'invalid-input');eq(r.messages[0].code,'F5');
}
eq(gradeFilling(system,{...good,ghost:0}).status,'invalid-input');
eq(gradeFilling(system,{...good,[first]:3}).status,'overfull');
eq(gradeFilling(system,{...good,[Symbol('ghost')]:0}).status,'invalid-input');
let read=false;const accessor={...good};Object.defineProperty(accessor,first,{get(){read=true;throw Error();}});
eq(gradeFilling(system,accessor).status,'invalid-input');eq(read,false);
// Small synthetic degenerate system isolates the former fractional-Hund false positive.
const deg={mos:[{id:'a',kind:'bonding'},{id:'b',kind:'bonding'}],ladder:[['a','b']],electrons:1,bonds:1};
eq(gradeFilling(deg,{a:0.5,b:0.5}).status,'invalid-input');
for(let code=0;code<3**system.mos.length;code++){
 let k=code;const o={};for(const m of system.mos){o[m.id]=k%3;k=Math.floor(k/3);}
 const before=JSON.stringify(o),total=Object.values(o).reduce((a,b)=>a+b,0);
 eq(gradeFilling(system,o).status,total!==system.electrons?'wrong-count':system.mos.every(m=>o[m.id]===good[m.id])?'correct':'differs');
 eq(JSON.stringify(o),before);
}
for(const selected of [[],['px'],['py'],['px','py'],['px','py','pz'],['ghost']]){
 const r=gradeMatching(M.sf6,COURSE.sf6,{pattern:[1,-1,1,-1,0,0],selected});
 eq(r.status,'blocked');eq(r.messages.map(m=>m.code),['X3']);eq('missed' in r,false);
}
for(const input of [null,[],{}, {lgoId:'unknown'},{lgoId:'LGO1',selected:'pz'},{lgoId:'LGO1',selected:new Array(1)},{pattern:[1,,]},{pattern:[2,1]},{lgoId:'LGO1',none:true,selected:['pz']}])eq(gradeMatching(h,C,input).status,'blocked');
for(const pattern of [[1,1],[-1,-1]])eq(gradeMatching(h,C,{pattern,selected:['s','pz']}).status,'correct');
for(const pattern of [[1,-1],[-1,1]])eq(gradeMatching(h,C,{pattern,selected:['px']}).status,'correct');
for(const value of [null,{},'x',1]){eq(validateSet(h,value).status,'invalid');eq(gradeConstruction(h,C,value).status,'invalid');}
for(const value of [[null,[1,-1]],new Array(2),[[1,,],[1,-1]],[[1],[1,-1]]]){eq(validateSet(h,value).status,'incomplete');eq(gradeConstruction(h,C,value).status,'incomplete');}
for(const x of ['1',true,NaN,Infinity,2,{},[]]){eq(validateSet(h,[[1,x],[1,-1]]).status,'invalid');eq(gradeConstruction(h,C,[[1,x],[1,-1]]).messages[0].code,'S4');}
for(const a of [[1,1],[-1,-1]])for(const b of [[1,-1],[-1,1]])eq(validateSet(h,[a,b]).status,'complete-valid');
eq(validateSet(h,[[1,1],[1,1]]).status,'invalid');eq(validateSet(h,[[1,1],[-1,-1]]).status,'invalid');
const edited=[[1,1],[1,-1]];eq(validateSet(h,edited).status,'complete-valid');edited[1]=[1,1];eq(validateSet(h,edited).status,'invalid');
console.log(JSON.stringify({suite:'hardening',assertionsPassed:count}));
