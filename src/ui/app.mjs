import {specs} from '../cases/specs.js';
import {initialState,reduce} from './state.mjs';
import {view} from './view.mjs';
import {createAnnouncements} from './announcements.mjs';
const water=specs.find(s=>s.id==='h2o');
const app=document.querySelector('#app');
const announcements=createAnnouncements(app);
let state=initialState();
const openDetails=new Map();
function render(focusId,announce=false){
  app.querySelectorAll('details[data-detail]').forEach(d=>openDetails.set(`${state.step}:${d.dataset.detail}`,d.open));
  const screen=announcements.prepare(view(state,water));
  app.replaceChildren(screen.fragment);
  app.querySelectorAll('details[data-detail]').forEach(d=>{d.open=openDetails.get(`${state.step}:${d.dataset.detail}`)||false;});
  if(focusId)document.getElementById(focusId)?.focus();
  if(announce)announcements.announce(screen.message);
}
app.addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]');
 if(!button||button.disabled)return;
 const action=button.dataset.action;
 // Capture disclosure state under the old step before changing screens.
 app.querySelectorAll('details[data-detail]').forEach(d=>openDetails.set(`${state.step}:${d.dataset.detail}`,d.open));
 const previousStep=state.step;
 state=reduce(state,{type:action,operation:button.dataset.operation});
 if(previousStep!==state.step){
   app.replaceChildren();
   announcements.clear();
 }
 const focus=previousStep!==state.step?'step-title':['same','opposite'].includes(action)?'flip':action==='reset'?(state.step===4?'opposite':'same'):action==='check-set'?'check-independence':action==='check-independence'?'check-symmetry':action==='check-symmetry'?'set-result':action==='reset-check'?'check-set':button.id;
 render(focus,['same','opposite','flip','reset','check-set','check-independence','check-symmetry','reset-check','set-operation'].includes(action));
});
app.addEventListener('change',event=>{
 const setting=event.target.dataset.setting;
 if(setting!=='axes'&&setting!=='guides')return;
 state=reduce(state,{type:setting,value:event.target.checked});
 // Visual settings must not repeat the phase announcement.
 render(setting);
});
render();
