(() => {
  const form = document.getElementById('auth-form');
  if (!form) return;
  const app = window.HalloweenApp;
  const message = (text, error = true) => { const box=document.getElementById('form-message'); box.textContent=text; box.classList.remove('hidden','error'); if(error) box.classList.add('error'); };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = new FormData(form); const action = form.dataset.action;
    const nombre = String(fields.get('nombre') || '').trim(); const clave = String(fields.get('clave') || '');
    if (action === 'registro' && clave !== String(fields.get('confirmar') || '')) return message('Las contraseñas no coinciden.');
    const button = form.querySelector('button[type="submit"]'); const original = button.textContent; button.disabled=true; button.textContent='Un momento…';
    try {
      await app.request(`api/auth/${action}.php`, { method:'POST', body:JSON.stringify({nombre,clave}) });
      location.href = action === 'login' && app.getUser()?.rol === 'admin' ? 'admin.html' : 'index.html';
    } catch (e) { message(e.message); button.disabled=false; button.textContent=original; }
  });
})();
