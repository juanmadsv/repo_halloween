(() => {
  let csrf = '';
  let currentUser = null;
  let sessionReady = Promise.resolve();
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
    const photo = document.createElement('div'); photo.className = 'costume-photo';
    if (item.foto_url) { const img = document.createElement('img'); img.src = item.foto_url; img.alt = `Foto del disfraz ${item.nombre}`; img.onerror = () => { photo.replaceChildren(); const placeholder = document.createElement('span'); placeholder.className = 'photo-placeholder'; placeholder.textContent = '🎭'; photo.append(placeholder); }; photo.append(img); }
    else { const placeholder = document.createElement('span'); placeholder.className = 'photo-placeholder'; placeholder.textContent = '🎭'; photo.append(placeholder); }
    const content = document.createElement('div'); content.className = 'costume-content';
    const title = document.createElement('h3'); title.textContent = item.nombre;
    const description = document.createElement('p'); description.textContent = item.descripcion;
    const bottom = document.createElement('div'); bottom.className = 'card-bottom';
    const count = document.createElement('span'); count.className = 'vote-count'; count.textContent = `🧡 ${item.votos} ${item.votos === 1 ? 'voto' : 'votos'}`;
    const button = document.createElement('button'); button.type = 'button'; button.className = `button ${item.ya_voto ? 'button-voted' : 'button-primary'}`;
    button.textContent = item.ya_voto ? 'Ya votaste' : 'Votar'; button.disabled = !!item.ya_voto;
    button.addEventListener('click', async () => {
      if (!currentUser) { location.href = 'login.html'; return; }
      button.disabled = true; button.textContent = 'Enviando…';
      try { await request('api/votos.php', { method: 'POST', body: JSON.stringify({ id_disfraz: item.id }) }); await loadCostumes(); showNotice('¡Listo! Tu voto quedó registrado.'); }
      catch (e) { showNotice(e.message, true); button.disabled = false; button.textContent = 'Votar'; }
    });
    bottom.append(count, button); content.append(title, description, bottom); article.append(photo, content); return article;
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
