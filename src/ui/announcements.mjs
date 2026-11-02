// Keep this node connected while the screen content is replaced.
export function createAnnouncements(app){
  const live=document.createElement('p');
  live.id='guided-announcements';
  live.setAttribute('role','status');
  live.setAttribute('aria-live','polite');
  live.setAttribute('aria-atomic','true');
  live.style.cssText='position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;';
  app.insertAdjacentElement('afterend',live);
  return {
    prepare(markup){
      const template=document.createElement('template');
      template.innerHTML=markup;
      const status=template.content.querySelector('[role="status"]');
      const message=status?.textContent.trim()||'';
      // Strip the transient live semantics before inserting the visible text.
      if(status){
        status.removeAttribute('role');
        status.removeAttribute('aria-live');
        status.removeAttribute('aria-atomic');
      }
      return {fragment:template.content,message};
    },
    announce(message){
      if(live.textContent!==message)live.textContent=message;
    },
    clear(){
      if(live.textContent)live.textContent='';
    }
  };
}
