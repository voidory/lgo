// Guided presentation state; no mathematical grading decisions.
export const Coefficient = Object.freeze({unanswered:null,positive:1,negative:-1,zero:0});
export function initialState(){return {step:1,hb:null,flipped:false,axes:true,guides:true,difference:{hb:1,flipped:false}};}
export function reduce(state,action){
  switch(action.type){
    case 'next':return {...state,step:Math.min(4,state.step+1)};
    case 'back':return {...state,step:Math.max(1,state.step-1)};
    case 'same':return state.step===3?{...state,hb:1,flipped:false}:state;
    case 'opposite':return state.step===4?{...state,difference:{hb:-1,flipped:false}}:state;
    case 'flip':
      if(state.step===4&&state.difference.hb===-1)return {...state,difference:{...state.difference,flipped:!state.difference.flipped}};
      return state.step===3&&state.hb===1?{...state,flipped:!state.flipped}:state;
    case 'reset':
      if(state.step===4)return {...state,difference:{hb:1,flipped:false}};
      return state.step===3?{...state,hb:null,flipped:false}:state;
    case 'axes':return {...state,axes:Boolean(action.value)};
    case 'guides':return {...state,guides:Boolean(action.value)};
    default:return state;
  }
}
export function coefficients(state){
  const orbital=state.step===4?state.difference:state;
  const sign=orbital.flipped?-1:1;
  return [sign,orbital.hb===null?null:sign*orbital.hb];
}
