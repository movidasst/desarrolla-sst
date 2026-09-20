(() => {
  'use strict';

  const URL = 'https://lfdmbkzghnwvsapxypvt.supabase.co';
  const KEY = 'sb_publishable_bRnkA6PA8-v073nrw9zxiQ_8rVGiOn1';
  const TOKEN = 'desarrolla-ranking-token';
  const LOGO = 'https://www.movidasst.com/logo-oficial-movida-sst-plus.png';
  const BADGE_BASE = 'https://directorio.movidasst.com/assets/badges/';
  const ROUTES = [
    { code: 'negociacion', name: 'Resolución de conflictos y negociación en SST', result: 'desarrolla-negociacion-v1', keys: ['desarrolla-neg-learn-v1', 'desarrolla-neg-role-v1', 'desarrolla-neg-plan-v1'], badge: 'negociacion.svg' },
    { code: 'comunicacion_asertiva', name: 'Comunicación asertiva', result: 'desarrolla-comunicacion-v1', keys: ['desarrolla-comm-learn-v1', 'desarrolla-comm-role-v1', 'desarrolla-comm-plan-v1'], badge: 'comunicacion-asertiva.svg' },
    { code: 'liderazgo_preventivo', name: 'Liderazgo preventivo', result: 'desarrolla-liderazgo-v1', keys: ['desarrolla-lead-learn-v1', 'desarrolla-lead-role-v1', 'desarrolla-lead-plan-v1'], badge: 'liderazgo-preventivo.svg' },
    { code: 'influencia_estrategica', name: 'Influencia estratégica', result: 'desarrolla-influencia-v1', keys: ['desarrolla-inf-learn-v1', 'desarrolla-inf-role-v1', 'desarrolla-inf-plan-v1'], badge: 'influencia-estrategica.svg' },
    { code: 'pensamiento_critico', name: 'Pensamiento crítico', result: 'desarrolla-pensamiento-v1', keys: ['desarrolla-crit-learn-v1', 'desarrolla-crit-role-v1', 'desarrolla-crit-plan-v1'], badge: 'pensamiento-critico.svg' },
    { code: 'gestion_emocional', name: 'Gestión emocional', result: 'desarrolla-emocional-v1', keys: ['desarrolla-emo-learn-v1', 'desarrolla-emo-role-v1', 'desarrolla-emo-plan-v1'], badge: 'gestion-emocional.svg' }
  ];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const complete = route => Boolean(localStorage.getItem(route.result)) &&
    route.keys.every(key => Boolean(localStorage.getItem(key)));

  function notice(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  }

  async function issue(route) {
    const token = sessionStorage.getItem(TOKEN);
    if (!token) throw new Error('Tu sesión venció. Sal e ingresa nuevamente para generar el certificado.');
    const response = await fetch(`${URL}/rest/v1/rpc/desarrolla_generar_certificado`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: token, p_diagnostico: route.code })
    });
    if (!response.ok) throw new Error('No fue posible validar la ruta completada.');
    const data = await response.json();
    if (!data?.ok) throw new Error(data?.message || 'La ruta todavía no aparece completa.');
    return data;
  }

  function formattedDate(value) {
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
  }

  function certificateMarkup(data, route) {
    const documentLine = data.documento ? `Documento: ${esc(data.documento)}` : '';
    return `
      <article class="certificate-sheet">
        <div class="certificate-frame">
          <div class="certificate-topline"></div>
          <header class="certificate-header">
            <img class="certificate-logo" src="${LOGO}" alt="La Movida de SST+">
            <div><p>LA ACADEMIA MOVIDA DE SST</p><span>De la Reacción a la Prevención</span></div>
            <img class="certificate-badge" src="${BADGE_BASE}${route.badge}?v=20260920-sin-texto-v3" alt="Insignia ${esc(route.name)}">
          </header>
          <main class="certificate-main">
            <p class="certificate-overline">CERTIFICADO DE CULMINACIÓN</p>
            <h1>Certifica que</h1>
            <h2>${esc(data.nombre)}</h2>
            <p class="certificate-document">${documentLine}</p>
            <p class="certificate-copy">completó satisfactoriamente la ruta de desarrollo de la competencia</p>
            <h3>${esc(data.competencia)}</h3>
            <p class="certificate-route">Evalúa · Aprende · Practica · Mejora</p>
            <p class="certificate-date">Otorgado el ${formattedDate(data.completada_at)}</p>
          </main>
          <footer class="certificate-footer">
            <div class="certificate-code"><span>Código del certificado</span><b>${esc(data.codigo)}</b></div>
            <div class="certificate-grant"><span>Otorga</span><b>La Academia Movida de SST</b></div>
            <div class="certificate-signature"><em>David Linares Brea</em><i></i><b>David Linares Brea</b><span>Firma autorizada</span></div>
          </footer>
          <div class="certificate-bottomline"></div>
        </div>
      </article>`;
  }

  function openCertificate(data, route) {
    document.getElementById('certificateModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'certificateModal';
    modal.className = 'certificate-modal';
    modal.innerHTML = `
      <div class="certificate-dialog">
        <div class="certificate-toolbar">
          <div><b>Tu certificado está listo</b><span>Descárgalo como PDF desde la opción de impresión.</span></div>
          <button type="button" data-certificate-close aria-label="Cerrar">×</button>
        </div>
        <div class="certificate-preview">${certificateMarkup(data, route)}</div>
        <div class="certificate-actions">
          <button class="secondary" type="button" data-certificate-close>Cerrar</button>
          <button class="primary" type="button" id="printCertificate">Descargar / imprimir PDF</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-certificate-close]').forEach(button => button.onclick = () => modal.remove());
    modal.querySelector('#printCertificate').onclick = () => printCertificate(data, route);
  }

  function printCertificate(data, route) {
    const popup = window.open('', '_blank');
    if (!popup) {
      notice('Permite ventanas emergentes para descargar el certificado.');
      return;
    }
    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificado - ${esc(data.nombre)}</title><style>${certificateCss()}@page{size:A4 landscape;margin:0}html,body{margin:0;background:#fff}.certificate-sheet{width:297mm;height:210mm;margin:0;box-shadow:none}.certificate-frame{height:100%;box-sizing:border-box}</style></head><body>${certificateMarkup(data, route)}<script>Promise.all(Array.from(document.images).map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=i.onerror=r}))).then(()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
    popup.document.close();
    try { popup.opener = null; } catch (_) {}
  }

  function certificateCss() {
    return `
      .certificate-sheet{font-family:Outfit,Arial,sans-serif;color:#00205b;background:#f8fafc;aspect-ratio:1.414/1;box-shadow:0 20px 55px rgba(0,32,91,.22)}
      .certificate-frame{position:relative;height:100%;padding:4.2%;overflow:hidden;background:radial-gradient(circle at 12% 12%,rgba(0,123,133,.12),transparent 25%),radial-gradient(circle at 88% 85%,rgba(255,182,0,.14),transparent 28%),#fff;border:12px solid #00205b;box-shadow:inset 0 0 0 4px #007b85}
      .certificate-topline,.certificate-bottomline{position:absolute;left:4%;right:4%;height:6px;background:linear-gradient(90deg,#00205b,#007b85,#70ad47,#ffb600)}.certificate-topline{top:3.2%}.certificate-bottomline{bottom:3.2%}
      .certificate-header{display:grid;grid-template-columns:110px 1fr 95px;align-items:center;gap:24px}.certificate-logo{width:105px;height:105px;object-fit:contain}.certificate-badge{width:90px;height:105px;object-fit:contain;justify-self:end}.certificate-header div{text-align:center}.certificate-header p{margin:0;font-size:22px;font-weight:900;letter-spacing:.14em}.certificate-header span{font-size:13px;color:#007b85;font-weight:800;letter-spacing:.1em}
      .certificate-main{text-align:center;padding:5px 7% 0}.certificate-overline{margin:0;color:#007b85;font-size:14px;font-weight:900;letter-spacing:.2em}.certificate-main h1{margin:11px 0 3px;font:600 25px Georgia,serif;color:#475569}.certificate-main h2{display:inline-block;margin:4px 0 3px;padding:0 35px 8px;border-bottom:2px solid #ffb600;font:700 42px Georgia,serif;color:#00205b}.certificate-document{margin:5px 0 11px;color:#64748b;font-size:13px}.certificate-copy{margin:5px 0;color:#475569;font-size:17px}.certificate-main h3{margin:9px auto;color:#007b85;font-size:29px;line-height:1.15;max-width:850px}.certificate-route{display:inline-block;margin:6px 0;padding:7px 18px;border-radius:999px;background:#eef8f7;color:#00205b;font-weight:800;letter-spacing:.08em}.certificate-date{margin:12px 0 0;font-size:15px;color:#475569}
      .certificate-footer{position:absolute;left:6%;right:6%;bottom:7%;display:grid;grid-template-columns:1fr 1fr 1fr;align-items:end;gap:25px;text-align:center}.certificate-footer span{display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.certificate-footer b{display:block;margin-top:5px;font-size:14px}.certificate-code{text-align:left}.certificate-grant{text-align:center}.certificate-signature{text-align:center}.certificate-signature em{display:block;font:italic 27px 'Brush Script MT','Segoe Script',cursive;color:#00205b}.certificate-signature i{display:block;height:1px;background:#00205b;margin:0 auto 5px;max-width:230px}.certificate-signature b{margin:0}
    `;
  }

  async function handle(button, route) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Validando…';
    try {
      openCertificate(await issue(route), route);
    } catch (error) {
      notice(error.message);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function mountButtons() {
    const cards = document.querySelectorAll('#globalProgress .competency-progress article');
    cards.forEach((card, index) => {
      const route = ROUTES[index];
      if (!route || !complete(route) || card.querySelector('.certificate-button')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'certificate-button';
      button.innerHTML = '<span>▣</span> Generar certificado';
      button.onclick = () => handle(button, route);
      card.appendChild(button);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    ${certificateCss()}
    .certificate-button{width:100%;margin-top:16px;border:0;border-radius:12px;padding:12px 16px;background:linear-gradient(135deg,#00205b,#007b85);color:#fff;font:800 14px Outfit,Arial,sans-serif;cursor:pointer;box-shadow:0 8px 20px rgba(0,32,91,.18)}.certificate-button:disabled{opacity:.65}
    .certificate-modal{position:fixed;inset:0;z-index:10000;background:rgba(0,20,48,.76);display:grid;place-items:center;padding:16px;overflow:auto}.certificate-dialog{width:min(1100px,100%);max-height:96dvh;overflow:auto;background:#f8fafc;border-radius:22px;box-shadow:0 25px 70px rgba(0,0,0,.35)}.certificate-toolbar,.certificate-actions{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:16px 20px}.certificate-toolbar b,.certificate-toolbar span{display:block}.certificate-toolbar span{color:#64748b;font-size:13px;margin-top:3px}.certificate-toolbar button{width:40px;height:40px;border:0;border-radius:50%;font-size:26px;background:#e8eef3;color:#00205b}.certificate-preview{padding:0 20px 10px;overflow:auto}.certificate-preview .certificate-sheet{width:100%;min-width:820px}.certificate-actions{justify-content:flex-end;border-top:1px solid #dce5ea}.certificate-actions button{padding:12px 18px}
    @media(max-width:760px){.certificate-preview{padding:0 12px 10px}.certificate-preview .certificate-sheet{min-width:760px}.certificate-toolbar{position:sticky;top:0;z-index:2;background:#f8fafc}.certificate-actions{position:sticky;bottom:0;background:#f8fafc}.certificate-actions button{flex:1}.certificate-toolbar span{display:none}}
    @media print{body>*:not(#certificateModal){display:none!important}.certificate-modal{position:static;padding:0;background:#fff}.certificate-toolbar,.certificate-actions{display:none!important}.certificate-dialog,.certificate-preview{padding:0;max-height:none;overflow:visible;box-shadow:none}.certificate-preview .certificate-sheet{width:297mm;height:210mm;min-width:0;box-shadow:none}}
  `;
  document.head.appendChild(style);

  const progress = document.getElementById('progress');
  if (progress) new MutationObserver(() => setTimeout(mountButtons, 50)).observe(progress, { childList: true, subtree: true, attributes: true });
  setTimeout(mountButtons, 300);
})();
