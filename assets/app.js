(() => {
  let csrf = '';
  let currentUser = null;
  let sessionReady = Promise.resolve();
  let pendingVote = null;
  const escapeText = (value) => String(value ?? '');

  async function request(path, options = {}) {
    if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase()) && !csrf) await sessionReady;
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase()) && csrf) headers.set('X-CSRF-Token', csrf);
    const response = await fetch(path, { credentials: 'same-origin', ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (data.csrf) csrf = data.csrf;
    if (Object.hasOwn(data, 'usuario')) currentUser = data.usuario;
    if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
    return data;
  }

  async function initialize() {
    sessionReady = request('api/auth/me.php').catch(() => { currentUser = null; });
    await sessionReady;
    renderNavigation();
    if (document.getElementById('costumes')) loadCostumes();
    if (document.getElementById('costume-detail')) loadCostumeDetail();
    setupVoteDialog();
  }

  function renderNavigation() {
    const nav = document.getElementById('navigation');
    if (!nav) return;
    nav.replaceChildren();
    const link = (label, href) => { const a = document.createElement('a'); a.href = href; a.textContent = label; nav.append(a); };
    link('Inicio', 'index.html');
    if (!currentUser) { link('Iniciar sesión', 'login.html'); link('Registrarse', 'registro.html'); return; }
    const greeting = document.createElement('span'); greeting.className = 'nav-user'; greeting.textContent = `Hola, ${escapeText(currentUser.nombre)}`; nav.append(greeting);
    if (currentUser.rol === 'admin') link('Administración', 'admin.html');
    const logout = document.createElement('button'); logout.className = 'small-button'; logout.textContent = 'Salir'; logout.type = 'button';
    logout.addEventListener('click', async () => { try { await request('api/auth/logout.php', { method: 'POST', body: '{}' }); location.href = 'index.html'; } catch (e) { showNotice(e.message, true); } });
    nav.append(logout);
  }

  function showNotice(message, error = false, elementId = 'notice') {
    const box = document.getElementById(elementId); if (!box) return;
    box.textContent = message; box.classList.remove('hidden', 'error'); if (error) box.classList.add('error');
  }

  function makeCard(item) {
    const article = document.createElement('article'); article.className = 'costume-card';
    const detailUrl = `disfraz.html?id=${encodeURIComponent(item.id)}`;
    article.addEventListener('click', event => { if (event.target.closest('a, button')) return; location.href = detailUrl; });
    const mainLink = document.createElement('a'); mainLink.className = 'card-main-link'; mainLink.href = detailUrl; mainLink.setAttribute('aria-label', `Ver el disfraz ${item.nombre} completo`);
    const photo = document.createElement('div'); photo.className = 'costume-photo';
    if (item.foto_url) { const img = document.createElement('img'); img.src = item.foto_url; img.alt = `Foto del disfraz ${item.nombre}`; img.onerror = () => { photo.replaceChildren(); const placeholder = document.createElement('span'); placeholder.className = 'photo-placeholder'; placeholder.textContent = '🎭'; photo.append(placeholder); }; photo.append(img); }
    else { const placeholder = document.createElement('span'); placeholder.className = 'photo-placeholder'; placeholder.textContent = '🎭'; photo.append(placeholder); }
    const content = document.createElement('div'); content.className = 'costume-content';
    const title = document.createElement('h3'); title.textContent = item.nombre;
    const description = document.createElement('p'); description.textContent = item.descripcion;
    const details = document.createElement('span'); details.className='details-link'; details.textContent='Ver imagen y descripción completas →';
    const bottom = document.createElement('div'); bottom.className = 'card-bottom';
    const count = document.createElement('span'); count.className = 'vote-count'; count.textContent = `🧡 ${item.votos} ${item.votos === 1 ? 'voto' : 'votos'}`;
    const button = document.createElement('button'); button.type = 'button'; button.className = `button ${item.ya_voto ? 'button-voted' : 'button-primary'}`;
    button.textContent = item.ya_voto ? 'Ya votaste' : 'Votar'; button.disabled = !!item.ya_voto;
    button.addEventListener('click', () => askForVote(item));
    bottom.append(count, button); content.append(title, description, details); mainLink.append(photo, content); article.append(mainLink, bottom); return article;
  }

  function setupVoteDialog() {
    const dialog=document.getElementById('vote-dialog'); if(!dialog) return;
    dialog.querySelectorAll('[data-close-vote]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    document.getElementById('confirm-vote')?.addEventListener('click',submitVote);
  }

  function askForVote(item) {
    if(!currentUser){location.href='login.html';return;}
    const dialog=document.getElementById('vote-dialog');
    if(!dialog){showNotice('No se pudo abrir la confirmación del voto.',true);return;}
    pendingVote=item;
    document.getElementById('vote-dialog-copy').textContent=`¿Está seguro que quiere votar por "${item.nombre}"?`;
    const message=document.getElementById('vote-dialog-message'); message.textContent=''; message.classList.add('hidden');
    dialog.showModal();
  }

  async function submitVote() {
    if(!pendingVote) return;
    const button=document.getElementById('confirm-vote'); button.disabled=true; button.textContent='Registrando…';
    try {
      await request('api/votos.php',{method:'POST',body:JSON.stringify({id_disfraz:pendingVote.id})});
      document.getElementById('vote-dialog').close(); pendingVote=null;
      if(document.getElementById('costumes')) await loadCostumes();
      if(document.getElementById('costume-detail')) await loadCostumeDetail();
      showNotice('¡Listo! Tu voto quedó registrado.');
    } catch(e) {
      const message=document.getElementById('vote-dialog-message'); message.textContent=e.message; message.classList.remove('hidden'); message.classList.add('error');
    } finally { button.disabled=false; button.textContent='Sí, votar'; }
  }

  async function loadCostumeDetail() {
    const container=document.getElementById('costume-detail'); if(!container) return;
    const id=new URLSearchParams(location.search).get('id');
    if(!id||!/^\d+$/.test(id)){renderMissingCostume(container);return;}
    container.replaceChildren(); const loading=document.createElement('div'); loading.className='loading-card'; loading.textContent='Cargando disfraz…'; container.append(loading);
    try {
      const data=await request('api/disfraces.php'); currentUser=data.usuario; renderNavigation();
      const item=(data.disfraces||[]).find(disfraz=>String(disfraz.id)===id);
      if(!item){renderMissingCostume(container);return;}
      container.replaceChildren(); const article=document.createElement('article'); article.className='detail-card';
      const visual=document.createElement('div'); visual.className='detail-image';
      if(item.foto_url){const img=document.createElement('img');img.src=item.foto_url;img.alt=`Foto del disfraz ${item.nombre}`;img.onerror=()=>{visual.replaceChildren();const fallback=document.createElement('span');fallback.className='photo-placeholder';fallback.textContent='🎭';visual.append(fallback);};visual.append(img);}else{const fallback=document.createElement('span');fallback.className='photo-placeholder';fallback.textContent='🎭';visual.append(fallback);}
      const content=document.createElement('div');content.className='detail-copy';const label=document.createElement('span');label.className='eyebrow';label.textContent='Disfraz participante';const title=document.createElement('h1');title.textContent=item.nombre;const description=document.createElement('p');description.className='detail-description';description.textContent=item.descripcion;const count=document.createElement('div');count.className='detail-votes';count.textContent=`🧡 ${item.votos} ${item.votos===1?'voto':'votos'}`;const button=document.createElement('button');button.type='button';button.className=`button ${item.ya_voto?'button-voted':'button-primary'} detail-vote-button`;button.disabled=!!item.ya_voto;button.textContent=item.ya_voto?'Ya votaste por este disfraz':'Votar por este disfraz';button.addEventListener('click',()=>askForVote(item));content.append(label,title,description,count,button);article.append(visual,content);container.append(article);
    } catch(e) { container.replaceChildren(); const error=document.createElement('div'); error.className='empty-state'; const title=document.createElement('strong'); title.textContent='No pudimos cargar el disfraz'; const text=document.createElement('span'); text.className='muted'; text.textContent=e.message; error.append(title,text); container.append(error); }
  }

  function renderMissingCostume(container) {
    container.replaceChildren(); const empty=document.createElement('div'); empty.className='empty-state'; const title=document.createElement('strong'); title.textContent='No encontramos ese disfraz'; const link=document.createElement('a'); link.className='details-link'; link.href='index.html'; link.textContent='Volver a la lista'; empty.append(title,link); container.append(empty);
  }

  async function loadCostumes() {
    const container = document.getElementById('costumes'); if (!container) return;
    container.replaceChildren(); const loading = document.createElement('div'); loading.className='loading-card'; loading.textContent='Cargando disfraces…'; container.append(loading);
    try {
      const data = await request('api/disfraces.php'); currentUser = data.usuario; renderNavigation();
      const items = data.disfraces || []; container.replaceChildren();
      const count = document.getElementById('costume-count'); if (count) count.textContent = `${items.length} ${items.length === 1 ? 'disfraz' : 'disfraces'}`;
      if (!items.length) { const empty=document.createElement('div'); empty.className='empty-state'; empty.innerHTML='<strong>Todavía no hay disfraces</strong><span class="muted">Cuando se agreguen, van a aparecer acá.</span>'; container.append(empty); return; }
      items.forEach(item => container.append(makeCard(item)));
    } catch (e) { container.replaceChildren(); const err=document.createElement('div'); err.className='empty-state'; const title=document.createElement('strong'); title.textContent='No pudimos cargar los disfraces'; const msg=document.createElement('span'); msg.className='muted'; msg.textContent=`${e.message} Revisá que Apache y MySQL estén iniciados.`; const retry=document.createElement('button'); retry.className='button button-secondary'; retry.textContent='Reintentar'; retry.addEventListener('click',loadCostumes); err.append(title,msg,retry); container.append(err); }
  }

  window.HalloweenApp = { request, showNotice, renderNavigation, getUser:()=>currentUser, getCsrf:()=>csrf, initialize };
  initialize();
})();
