import {specs} from '../cases/specs.js';
import {initialState,reduce} from './state.mjs';
import {view} from './view.mjs';
const water=specs.find(s=>s.id==='h2o');
const app=document.querySelector('#app');
let state=initialState();
const openDetails=new Map();
function render(focusId){
  app.querySelectorAll('details[data-detail]').forEach(d=>openDetails.set(`${state.step}:${d.dataset.detail}`,d.open));
  app.innerHTML=view(state,water);
  app.querySelectorAll('details[data-detail]').forEach(d=>{d.open=openDetails.get(`${state.step}:${d.dataset.detail}`)||false;});
  if(focusId)document.getElementById(focusId)?.focus();
}
app.addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]');
 if(!button||button.disabled)return;
 const action=button.dataset.action;
 // Capture disclosure state under the old step before changing screens.
 app.querySelectorAll('details[data-detail]').forEach(d=>openDetails.set(`${state.step}:${d.dataset.detail}`,d.open));
 const previousStep=state.step;
 state=reduce(state,{type:action});
 // Clear the old DOM before render so it cannot be recorded under the new step.
 if(previousStep!==state.step)app.innerHTML='';
 render(action==='same'?'flip':action==='reset'?'same':previousStep!==state.step?'step-title':button.id);
});
app.addEventListener('change',event=>{
 const setting=event.target.dataset.setting;
 if(setting!=='axes'&&setting!=='guides')return;
 state=reduce(state,{type:setting,value:event.target.checked});
 render(setting);
});
render();
