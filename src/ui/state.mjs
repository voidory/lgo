// Shared Guided state. Verdicts are derived by the existing scientific engine.
import {freshH2O,updateH2O} from './h2o-model.mjs';
export const Coefficient=Object.freeze({unanswered:null,positive:1,negative:-1,zero:0});
const freshCheck=()=>({stage:0,operation:'c2'});
const checks=()=>[false,false,false,false];
const changed=state=>({...state,completeSet:freshCheck(),h2o:freshH2O(),h2oChecks:checks(),notice:'Ligand construction changed. All later H₂O answers and checks were cleared.'});
export function initialState(){return {step:1,hb:null,flipped:false,axes:true,guides:true,difference:{hb:1,flipped:false},completeSet:freshCheck(),h2o:freshH2O(),h2oChecks:checks(),notice:''};}
const phases={match:6,partner:7,neglect:7,product:7,level:8,reference:9,occupancy:9,'bond-order':9};
const notices={match:'Matching changed; course partners, MO outcomes, ordering and filling were cleared.',partner:'Course partner changed; MO outcomes, ordering and filling were cleared.',neglect:'Interaction approximation changed; MO outcomes, ordering and filling were cleared.',product:'MO outcome changed; ordering and filling were cleared.',level:'Level placement changed; reference acknowledgement, filling and bond order were cleared.',reference:'Reference choice changed; your bond-order answer was cleared.',occupancy:'Occupancy changed; your bond-order answer was cleared.','bond-order':'Bond-order answer changed; check the current answers again.'};
export function reduce(state,action){
 if(action.type==='h2o-edit'){
  const edit=action.edit;
  if(!edit||phases[edit.type]!==state.step)return state;
  const h2o=updateH2O(state.h2o,edit);
  if(h2o===state.h2o)return state;
  const from=phases[edit.type]-6;
  return {...state,h2o,h2oChecks:state.h2oChecks.map((v,i)=>i<from?v:false),notice:notices[edit.type]};
 }
 switch(action.type){
  case 'next':return {...state,step:Math.min(9,state.step+1),notice:''};
  case 'back':return {...state,step:Math.max(1,state.step-1),notice:''};
  case 'to-set':return state.step>=6?{...state,step:5,notice:''}:state;
  case 'edit-sum':return state.step===5?{...state,step:3}:state;
  case 'edit-difference':return state.step===5?{...state,step:4}:state;
  case 'same':return state.step===3?changed({...state,hb:1,flipped:false}):state;
  case 'opposite':return state.step===4?changed({...state,difference:{hb:-1,flipped:false}}):state;
  case 'flip':
   if(state.step===4&&state.difference.hb===-1)return changed({...state,difference:{...state.difference,flipped:!state.difference.flipped}});
   return state.step===3&&state.hb===1?changed({...state,flipped:!state.flipped}):state;
  case 'reset':
   if(state.step===4)return changed({...state,difference:{hb:1,flipped:false}});
   return state.step===3?changed({...state,hb:null,flipped:false}):state;
  case 'check-set':return state.step===5?{...state,completeSet:{...state.completeSet,stage:1}}:state;
  case 'check-independence':return state.step===5&&state.completeSet.stage>=1?{...state,completeSet:{...state.completeSet,stage:2}}:state;
  case 'check-symmetry':return state.step===5&&state.completeSet.stage>=2?{...state,completeSet:{...state.completeSet,stage:3}}:state;
  case 'reset-check':return state.step===5?{...state,completeSet:freshCheck()}:state;
  case 'set-operation':return state.step===5&&state.completeSet.stage===3&&['c2','xz','yz'].includes(action.operation)?{...state,completeSet:{...state.completeSet,operation:action.operation}}:state;
  case 'check-h2o':return state.step>=6?{...state,h2oChecks:state.h2oChecks.map((v,i)=>i===state.step-6?true:v),notice:''}:state;
  case 'reset-h2o':return state.step>=6?{...state,h2o:freshH2O(),h2oChecks:checks(),notice:'Later H₂O answers cleared. Ligand constructions and view preferences were preserved.'}:state;
  case 'restart':return initialState();
  case 'axes':return {...state,axes:Boolean(action.value)};
  case 'guides':return {...state,guides:Boolean(action.value)};
  default:return state;
 }
}
const vector=orbital=>{const sign=orbital.flipped?-1:1;return [sign,orbital.hb===null?null:sign*orbital.hb];};
export function constructionPatterns(state){return [vector(state),vector(state.difference)];}
export function coefficients(state){
 if(state.step>=5)throw new RangeError('Steps 5-9 retain both constructions; use constructionPatterns');
 return vector(state.step===4?state.difference:state);
}
