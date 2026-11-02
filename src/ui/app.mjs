import {specs} from '../cases/specs.js';
import {initialState,reduce} from './state.mjs';
import {view} from './view.mjs';
import {createAnnouncements} from './announcements.mjs';
const water=specs.find(s=>s.id==='h2o');
const app=document.querySelector('#app');
const announcements=createAnnouncements(app);
let state=initialState();
const openDetails=new Map();
const saveDetails=()=>app.querySelectorAll('details[data-detail]').forEach(d=>openDetails.set(`${state.step}:${d.dataset.detail}`,d.open));
function render(focusId,announce=false){
 const screen=announcements.prepare(view(state,water));
 app.replaceChildren(screen.fragment);
 app.querySelectorAll('details[data-detail]').forEach(d=>{d.open=openDetails.get(`${state.step}:${d.dataset.detail}`)||false;});
 if(focusId)document.getElementById(focusId)?.focus();
 if(announce)announcements.announce(screen.message+(state.step<6&&state.notice?' '+state.notice:''));
}
app.addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]');
 if(!button||button.disabled)return;
 const action=button.dataset.action;
 saveDetails();
 const previousStep=state.step;
 if(action==='restart')openDetails.clear();
 state=reduce(state,{type:action,operation:button.dataset.operation});
 if(previousStep!==state.step){app.replaceChildren();announcements.clear();}
 const focus=previousStep!==state.step?'step-title':['same','opposite'].includes(action)?'flip':action==='reset'?(state.step===4?'opposite':'same'):action==='check-set'?'check-independence':action==='check-independence'?'check-symmetry':action==='check-symmetry'?'set-result':action==='reset-check'?'check-set':['check-h2o','reset-h2o'].includes(action)?'h2o-result':button.id;
 render(focus,['same','opposite','flip','reset','check-set','check-independence','check-symmetry','reset-check','set-operation','check-h2o','reset-h2o'].includes(action));
});
app.addEventListener('change',event=>{
 const input=event.target;
 saveDetails();
 if(input.dataset.h2o){
  const type=input.dataset.h2o;
  const value=input.value===''?null:type==='match'?input.value==='none'?[]:input.value.split(','):type==='reference'?input.value==='true':['level','occupancy','bond-order'].includes(type)?Number(input.value):input.value;
  const previous=state;
  state=reduce(state,{type:'h2o-edit',edit:{type,value,slot:Number(input.dataset.slot),id:input.dataset.key}});
  if(state!==previous)render(input.id,true);
  return;
 }
 const setting=input.dataset.setting;
 if(setting!=='axes'&&setting!=='guides')return;
 state=reduce(state,{type:setting,value:input.checked});
 // View-only changes never repeat a phase or validation announcement.
 render(setting);
});
render();
