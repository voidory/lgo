// Guided presentation state; mathematical verdicts are computed by the engine.
export const Coefficient=Object.freeze({unanswered:null,positive:1,negative:-1,zero:0});
const freshCheck=()=>({stage:0,operation:'c2'});
const changed=state=>({...state,completeSet:freshCheck()});
export function initialState(){return {step:1,hb:null,flipped:false,axes:true,guides:true,difference:{hb:1,flipped:false},completeSet:freshCheck()};}
export function reduce(state,action){
 switch(action.type){
  case 'next':return {...state,step:Math.min(5,state.step+1)};
  case 'back':return {...state,step:Math.max(1,state.step-1)};
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
  case 'axes':return {...state,axes:Boolean(action.value)};
  case 'guides':return {...state,guides:Boolean(action.value)};
  default:return state;
 }
}
const vector=orbital=>{const sign=orbital.flipped?-1:1;return [sign,orbital.hb===null?null:sign*orbital.hb];};
export function constructionPatterns(state){return [vector(state),vector(state.difference)];}
export function coefficients(state){
 if(state.step===5)throw new RangeError('Step 5 displays both constructions; use constructionPatterns');
 return vector(state.step===4?state.difference:state);
}
