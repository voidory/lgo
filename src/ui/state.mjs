// Guided presentation state; no mathematical grading decisions.
export const Coefficient = Object.freeze({unanswered:null,positive:1,negative:-1,zero:0});
export function initialState(){return {step:1,hb:null,flipped:false,axes:true,guides:true};}
export function reduce(state,action){
  switch(action.type){
    case 'next':return {...state,step:Math.min(3,state.step+1)};
    case 'back':return {...state,step:Math.max(1,state.step-1)};
    case 'same':return state.step===3?{...state,hb:1,flipped:false}:state;
    case 'flip':return state.step===3&&state.hb===1?{...state,flipped:!state.flipped}:state;
    case 'reset':return {...state,hb:null,flipped:false};
    case 'axes':return {...state,axes:Boolean(action.value)};
    case 'guides':return {...state,guides:Boolean(action.value)};
    default:return state;
  }
}
export function coefficients(state){const sign=state.flipped?-1:1;return [sign,state.hb===null?null:sign*state.hb];}
