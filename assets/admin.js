(() => {
  const list = document.getElementById('admin-list'); if (!list) return;
  const app = window.HalloweenApp; const dialog=document.getElementById('costume-dialog'); const form=document.getElementById('costume-form');
  const notice=(text,error=false)=>app.showNotice(text,error,'notice');
  function adminRow(item) {
    const row=document.createElement('article'); row.className='admin-row'+(item.eliminado?' is-deleted':'');
    const thumb=document.createElement('div'); thumb.className='admin-thumb';
    if(item.foto_url){const img=document.createElement('img'); img.src=item.foto_url; img.alt=''; img.onerror=()=>{thumb.textContent='🎭';}; thumb.append(img);} else thumb.textContent='🎭';
    const info=document.createElement('div'); info.className='admin-info'; const title=document.createElement('h2'); title.textContent=item.nombre; const desc=document.createElement('p'); desc.textContent=item.descripcion; const votes=document.createElement('span'); votes.className='vote-count'; votes.textContent=`${item.votos} ${item.votos===1?'voto':'votos'}`; info.append(title,desc,votes);
    const actions=document.createElement('div'); actions.className='admin-actions';
    if(!item.eliminado){const edit=document.createElement('button'); edit.className='small-button'; edit.textContent='Editar'; edit.addEventListener('click',()=>openEditor(item)); const remove=document.createElement('button'); remove.className='small-button danger'; remove.textContent='Eliminar'; remove.addEventListener('click',()=>removeItem(item)); actions.append(edit,remove);}
    row.append(thumb,info,actions); return row;
  }
  async function load() {
    list.replaceChildren(); const loading=document.createElement('div'); loading.className='loading-card'; loading.textContent='Cargando disfraces…'; list.append(loading);
    try { const data=await app.request('api/admin/disfraces.php'); list.replaceChildren(); if(!data.disfraces.length){const empty=document.createElement('div'); empty.className='empty-state'; empty.textContent='Todavía no cargaste disfraces.'; list.append(empty); return;} data.disfraces.forEach(item=>list.append(adminRow(item))); }
    catch(e){ if(e.message.includes('iniciar sesión')){location.href='login.html';return;} if(e.message.includes('permisos')){location.href='index.html';return;} list.replaceChildren(); const err=document.createElement('div'); err.className='empty-state'; err.textContent=e.message; list.append(err); }
  }
  function openEditor(item=null){form.reset(); form.elements.id.value=item?.id||''; form.elements.nombre.value=item?.nombre||''; form.elements.descripcion.value=item?.descripcion||''; document.getElementById('dialog-title').textContent=item?'Editar disfraz':'Nuevo disfraz'; const msg=document.getElementById('dialog-message'); msg.classList.add('hidden'); dialog.showModal();}
  async function removeItem(item){if(!confirm(`¿Eliminar el disfraz “${item.nombre}” de la votación?`))return; try{await app.request('api/admin/disfraces.php',{method:'DELETE',body:JSON.stringify({id:item.id})});notice('Disfraz eliminado.');await load();}catch(e){notice(e.message,true);}}
  form.addEventListener('submit',async event=>{event.preventDefault();const id=form.elements.id.value;const payload={nombre:form.elements.nombre.value.trim(),descripcion:form.elements.descripcion.value.trim()};const button=form.querySelector('[type="submit"]');button.disabled=true;
    try { let result;
      if(id){result=await app.request('api/admin/disfraces.php',{method:'PATCH',body:JSON.stringify({id:Number(id),...payload})});}
      else{result=await app.request('api/admin/disfraces.php',{method:'POST',body:JSON.stringify(payload)});}
      const file=form.elements.foto.files[0]; const targetId=id||result.id;
      if(file){const body=new FormData();body.append('foto',file);await app.request(`api/admin/foto.php?id=${encodeURIComponent(targetId)}`,{method:'POST',body});}
      dialog.close();notice(id?'Cambios guardados.':'Disfraz creado.');await load();
    }catch(e){const box=document.getElementById('dialog-message');box.textContent=e.message;box.classList.remove('hidden');box.classList.add('error');}
    finally{button.disabled=false;}
  });
  document.getElementById('new-costume').addEventListener('click',()=>openEditor());
  document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());
  document.getElementById('cancel-dialog').addEventListener('click',()=>dialog.close());
  load();
})();
