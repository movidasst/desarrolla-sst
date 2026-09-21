(() => {
  'use strict';

  const URL = 'https://lfdmbkzghnwvsapxypvt.supabase.co';
  const KEY = 'sb_publishable_bRnkA6PA8-v073nrw9zxiQ_8rVGiOn1';
  const TOKEN = 'desarrolla-ranking-token';
  const LOGO = 'https://www.movidasst.com/logo-oficial-movida-sst-plus.png';
  const BADGE_BASE = 'https://directorio.movidasst.com/assets/badges/';
  const ROUTES = [
    { code: 'negociacion', name: 'Resolución de conflictos y negociación en SST', result: 'desarrolla-negociacion-v1', keys: ['desarrolla-neg-learn-v1', 'desarrolla-neg-role-v1', 'desarrolla-neg-plan-v1', 'desarrolla-neg-final-v2'], badge: 'negociacion.svg' },
    { code: 'comunicacion_asertiva', name: 'Comunicación asertiva', result: 'desarrolla-comunicacion-v1', keys: ['desarrolla-comm-learn-v1', 'desarrolla-comm-role-v1', 'desarrolla-comm-plan-v1', 'desarrolla-comm-final-v2'], badge: 'comunicacion-asertiva.svg' },
    { code: 'liderazgo_preventivo', name: 'Liderazgo preventivo', result: 'desarrolla-liderazgo-v1', keys: ['desarrolla-lead-learn-v1', 'desarrolla-lead-role-v1', 'desarrolla-lead-plan-v1', 'desarrolla-lead-final-v2'], badge: 'liderazgo-preventivo.svg' },
    { code: 'influencia_estrategica', name: 'Influencia estratégica', result: 'desarrolla-influencia-v1', keys: ['desarrolla-inf-learn-v1', 'desarrolla-inf-role-v1', 'desarrolla-inf-plan-v1', 'desarrolla-inf-final-v2'], badge: 'influencia-estrategica.svg' },
    { code: 'pensamiento_critico', name: 'Pensamiento crítico', result: 'desarrolla-pensamiento-v1', keys: ['desarrolla-crit-learn-v1', 'desarrolla-crit-role-v1', 'desarrolla-crit-plan-v1', 'desarrolla-crit-final-v2'], badge: 'pensamiento-critico.svg' },
    { code: 'gestion_emocional', name: 'Gestión emocional', result: 'desarrolla-emocional-v1', keys: ['desarrolla-emo-learn-v1', 'desarrolla-emo-role-v1', 'desarrolla-emo-plan-v1', 'desarrolla-emo-final-v2'], badge: 'gestion-emocional.svg' },
    { code: 'finanzas_sst', name: 'Finanzas y Valor Preventivo en SST', result: 'desarrolla-finanzas-v1', keys: ['desarrolla-fin-learn-v1', 'desarrolla-fin-role-v1', 'desarrolla-fin-plan-v1', 'desarrolla-fin-final-v2'], badge: 'finanzas-valor-preventivo.svg' }
  ];
  const PROGRAMS = {
    negociacion: ['Conflicto, posiciones, intereses y necesidades', 'Preparación: actores, evidencia, límites y alternativas', 'Escucha activa y comunicación proporcional del riesgo', 'Negociación colaborativa y criterios objetivos', 'Conversaciones con trabajadores, sindicatos, dirección, autoridad y comunidad', 'Acuerdos verificables, responsables, plazos y seguimiento'],
    comunicacion_asertiva: ['Estilos de comunicación y respuesta profesional', 'Claridad, firmeza y respeto en mensajes preventivos', 'Escucha activa, preguntas y reformulación', 'Comunicación de riesgos, controles e incertidumbre', 'Retroalimentación y conversaciones difíciles', 'Adaptación del mensaje a públicos y niveles jerárquicos'],
    liderazgo_preventivo: ['Fundamentos del liderazgo preventivo', 'Propósito, ejemplo y coherencia profesional', 'Participación, confianza y seguridad psicológica', 'Movilización de equipos para controlar riesgos', 'Decisiones, responsabilidades y seguimiento', 'Desarrollo de cultura preventiva sostenible'],
    influencia_estrategica: ['Mapeo de actores, poder, interés e impacto', 'Construcción del caso preventivo', 'SST, continuidad operacional y sostenibilidad', 'Argumentación y adaptación del mensaje', 'Coaliciones, patrocinio y gobernanza', 'Seguimiento de compromisos estratégicos'],
    pensamiento_critico: ['Calidad de fuentes, evidencia y trazabilidad', 'Hechos, interpretaciones, supuestos y opiniones', 'Sesgos cognitivos aplicados a decisiones de SST', 'Causalidad, incertidumbre y explicaciones alternativas', 'Preguntas críticas y contraste de información', 'Decisiones proporcionales basadas en evidencia'],
    gestion_emocional: ['Autoconocimiento y reconocimiento de detonantes', 'Regulación emocional bajo presión', 'Empatía sin renunciar al criterio preventivo', 'Manejo de tensión, desacuerdo y confrontación', 'Pausas, recuperación y respuesta consciente', 'Plan personal para conversaciones exigentes'],
    finanzas_sst: ['Lenguaje financiero básico, margen y flujo de caja', 'Presupuesto, partidas, forecast y desviaciones', 'CAPEX, OPEX y costo de implementación', 'Costo económico del riesgo, directos e indirectos', 'ROI, payback, TCO y lectura de VAN/TIR', 'Escenarios, sensibilidad, supuestos y business case ejecutivo']
  };
  const PAYMENT_INFO = {
    transfer: 'Banco de Venezuela · Cuenta corriente 0102-0236-1500-0033-6732 · Ezequiel Linares · C.I. 30.407.087',
    pagoMovil: 'Banco de Venezuela · Ezequiel Linares · C.I. V-30.407.087 · Teléfono 0412-6372223',
    binance: 'USDT · Red BEP20 (BSC) · ID 176067584 · david.linaresb@gmail.com',
    paypal: 'movidasst@gmail.com · Enviar como Amigo/Familiar · https://paypal.me/movidasst'
  };
  const WHATSAPP_PAYMENT = '56968615650';
  const serverEligible = new Map();
  let eligibilityLoading = false;
  let eligibilityLoadedFor = '';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const complete = route => Boolean(localStorage.getItem(route.result)) && route.keys.every(key => {
    const value = localStorage.getItem(key);
    if (!value) return false;
    if (key.includes('-final-v2')) {
      try { return JSON.parse(value)?.passed === true; } catch { return false; }
    }
    return true;
  });

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
    const verificationUrl = `https://desarrolla.movidasst.com/verificar.html?codigo=${encodeURIComponent(data.codigo)}`;
    return `
      <article class="certificate-sheet">
        <div class="certificate-frame">
          ${data.prueba ? '<div class="certificate-watermark">MODO DE PRUEBA</div>' : ''}
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
            <p class="certificate-route">Evalúa · Aprende · Practica · Mejora · Demuestra</p>
            <p class="certificate-date">Otorgado el ${formattedDate(data.completada_at)}</p>
          </main>
          <footer class="certificate-footer">
            <div class="certificate-code"><div class="certificate-qr" data-verification-url="${verificationUrl}" aria-label="QR para verificar el certificado"></div><div><span>Código del certificado</span><a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" title="Verificar certificado ${esc(data.codigo)}"><b>${esc(data.codigo)}</b></a><small>Escanea el QR o haz clic en el código</small></div></div>
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
          <div><b>Tu certificado está listo</b><span>Incluye certificado y contenido programático.</span></div>
          <button type="button" data-certificate-close aria-label="Cerrar">×</button>
        </div>
        <div class="certificate-preview">${certificateMarkup(data, route)}</div>
        <div class="certificate-actions">
          <button class="secondary" type="button" data-certificate-close>Cerrar</button>
          <button class="primary" type="button" id="printCertificate">Descargar PDF</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    renderPreviewQr(modal.querySelector('.certificate-qr'));
    modal.querySelectorAll('[data-certificate-close]').forEach(button => button.onclick = () => modal.remove());
    modal.querySelector('#printCertificate').onclick = event => downloadPdf(data, route, event.currentTarget);
  }

  function loadJsPdf() {
    if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
      script.onload = () => resolve(window.jspdf.jsPDF);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadQrCode() {
    if (window.QRCode) return Promise.resolve(window.QRCode);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-desarrolla-qr]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.QRCode), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.dataset.desarrollaQr = 'true';
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.onload = () => resolve(window.QRCode);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function qrDataUrl(url, size = 512) {
    const QR = await loadQrCode();
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(holder);
    try {
      new QR(holder, { text: url, width: size, height: size, colorDark: '#00205b', colorLight: '#ffffff', correctLevel: QR.CorrectLevel.M });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = holder.querySelector('canvas');
      if (canvas) return canvas.toDataURL('image/png');
      const image = holder.querySelector('img');
      if (image?.src) return image.src;
      throw new Error('No se pudo crear el QR del certificado.');
    } finally { holder.remove(); }
  }

  async function renderPreviewQr(holder) {
    if (!holder) return;
    try {
      const QR = await loadQrCode();
      if (!holder.isConnected || holder.childElementCount) return;
      new QR(holder, { text: holder.dataset.verificationUrl, width: 86, height: 86, colorDark: '#00205b', colorLight: '#ffffff', correctLevel: QR.CorrectLevel.M });
    } catch (error) { console.error('No se pudo mostrar el QR.', error); }
  }

  async function raster(url) {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const objectUrl = window.URL.createObjectURL(await response.blob());
    try {
      const image = new Image(); image.src = objectUrl; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 500; canvas.height = 500;
      const context = canvas.getContext('2d'), ratio = Math.min(500 / image.naturalWidth, 500 / image.naturalHeight);
      const width = image.naturalWidth * ratio, height = image.naturalHeight * ratio;
      context.drawImage(image, (500 - width) / 2, (500 - height) / 2, width, height);
      return canvas.toDataURL('image/png');
    } finally { window.URL.revokeObjectURL(objectUrl); }
  }

  function pageFrame(doc, logo, badge, heading, subheading) {
    doc.setFillColor(248, 250, 252); doc.rect(0, 0, 297, 210, 'F');
    doc.setFillColor(0, 32, 91); doc.rect(0, 0, 297, 8, 'F'); doc.rect(0, 202, 297, 8, 'F');
    doc.setFillColor(0, 123, 133); doc.rect(8, 8, 4, 194, 'F');
    doc.setDrawColor(0, 123, 133); doc.setLineWidth(.8); doc.roundedRect(17, 16, 263, 177, 3, 3, 'S');
    if (logo) doc.addImage(logo, 'PNG', 23, 20, 31, 31);
    if (badge) doc.addImage(badge, 'PNG', 245, 18, 27, 34);
    doc.setTextColor(0, 32, 91); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(heading, 148.5, 28, { align: 'center' });
    doc.setTextColor(0, 123, 133); doc.setFontSize(8); doc.text(subheading, 148.5, 35, { align: 'center', maxWidth: 170 });
  }

  function watermark(doc) {
    doc.setFillColor(255, 241, 242); doc.setDrawColor(225, 29, 72); doc.setLineWidth(.35);
    doc.roundedRect(122, 187, 53, 7, 3.5, 3.5, 'FD');
    doc.setTextColor(190, 18, 60); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.text('CERTIFICADO DE PRUEBA', 148.5, 191.7, { align: 'center' });
  }

  async function downloadPdf(data, route, button) {
    const original = button.textContent; button.disabled = true; button.textContent = 'Generando PDF…';
    try {
      const JsPDF = await loadJsPdf();
      const verificationUrl = `https://desarrolla.movidasst.com/verificar.html?codigo=${encodeURIComponent(data.codigo)}`;
      const [logo, badge, qr] = await Promise.all([
        raster('https://raw.githubusercontent.com/movidasst/geo/main/logo-oficial-movida-sst-plus.png'),
        raster(`https://raw.githubusercontent.com/movidasst/geo/main/assets/badges/${route.badge}`),
        qrDataUrl(verificationUrl)
      ]);
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
      pageFrame(doc, logo, badge, 'LA ACADEMIA MOVIDA DE SST', 'DE LA REACCIÓN A LA PREVENCIÓN');
      doc.setTextColor(0, 123, 133); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('CERTIFICADO DE CULMINACIÓN', 148.5, 52, { align: 'center' });
      doc.setTextColor(71, 85, 105); doc.setFont('times', 'normal'); doc.setFontSize(16); doc.text('Deja constancia de que', 148.5, 64, { align: 'center' });
      doc.setTextColor(0, 32, 91); doc.setFont('times', 'bold'); doc.setFontSize(30); doc.text(data.nombre, 148.5, 80, { align: 'center', maxWidth: 205 });
      doc.setDrawColor(255, 182, 0); doc.setLineWidth(1); doc.line(76, 86, 221, 86);
      doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      if (data.documento) doc.text(`Documento: ${data.documento}`, 148.5, 93, { align: 'center' });
      doc.setTextColor(71, 85, 105); doc.setFontSize(11); doc.text('completó satisfactoriamente la ruta de desarrollo de la competencia', 148.5, 104, { align: 'center' });
      doc.setTextColor(0, 123, 133); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
      const competence = doc.splitTextToSize(data.competencia, 205); doc.text(competence, 148.5, 116, { align: 'center' });
      const end = 116 + (competence.length - 1) * 8;
      doc.setFillColor(237, 248, 248); doc.roundedRect(91, end + 7, 115, 12, 6, 6, 'F');
      doc.setTextColor(0, 32, 91); doc.setFontSize(9); doc.text('EVALÚA  ·  APRENDE  ·  PRACTICA  ·  MEJORA  ·  DEMUESTRA', 148.5, end + 15, { align: 'center' });
      doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(`Otorgado el ${formattedDate(data.completada_at)}`, 148.5, end + 29, { align: 'center' });
      if (qr) doc.addImage(qr, 'PNG', 27, 145, 20, 20, undefined, 'FAST');
      doc.setTextColor(0, 123, 133); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.text('ESCANEA PARA VERIFICAR', 50, 155);
      doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text('CÓDIGO DEL CERTIFICADO', 27, 172); doc.text('OTORGA', 148.5, 172, { align: 'center' });
      doc.setTextColor(0, 32, 91); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.textWithLink(data.codigo, 27, 178, { url: verificationUrl }); doc.text('La Academia Movida de SST', 148.5, 178, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(0, 123, 133); doc.textWithLink('Verificar autenticidad en desarrolla.movidasst.com', 27, 183, { url: verificationUrl });
      doc.setFont('times', 'italic'); doc.setFontSize(16); doc.text('David Linares Brea', 244, 166, { align: 'center' }); doc.setDrawColor(0, 32, 91); doc.line(214, 170, 274, 170);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('David Linares Brea', 244, 176, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text('FIRMA AUTORIZADA', 244, 181, { align: 'center' });
      if (data.prueba) watermark(doc);

      doc.addPage('a4', 'landscape');
      doc.setFillColor(248, 250, 252); doc.rect(0, 0, 297, 210, 'F');
      doc.setFillColor(0, 32, 91); doc.rect(0, 0, 297, 9, 'F'); doc.rect(0, 201, 297, 9, 'F');
      doc.setFillColor(0, 123, 133); doc.rect(0, 9, 5, 192, 'F');
      doc.setDrawColor(0, 123, 133); doc.setLineWidth(.7); doc.roundedRect(16, 17, 265, 175, 3, 3, 'S');
      doc.setTextColor(0, 32, 91); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
      doc.text('CONTENIDO PROGRAMÁTICO', 148.5, 26, { align: 'center' });
      doc.setTextColor(0, 123, 133); doc.setFontSize(9);
      doc.text(data.competencia.toUpperCase(), 148.5, 34, { align: 'center', maxWidth: 220 });
      doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text('Ruta aplicada de desarrollo de competencias para profesionales de Seguridad y Salud en el Trabajo.', 25, 43);
      (PROGRAMS[route.code] || []).forEach((topic, index) => {
        const col = index % 2, row = Math.floor(index / 2), x = 25 + col * 126, y = 50 + row * 28;
        doc.setFillColor(239, 246, 247); doc.roundedRect(x, y, 118, 21, 3, 3, 'F');
        doc.setFillColor(index % 2 ? 112 : 0, index % 2 ? 173 : 123, index % 2 ? 71 : 133); doc.circle(x + 10, y + 10.5, 5, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(String(index + 1), x + 10, y + 13, { align: 'center' });
        doc.setTextColor(0, 32, 91); doc.setFontSize(9); doc.text(doc.splitTextToSize(topic, 91), x + 20, y + 8.5);
      });
      doc.setFillColor(0, 32, 91); doc.roundedRect(25, 137, 244, 19, 3, 3, 'F');
      doc.setTextColor(255, 207, 51); doc.setFontSize(8.5); doc.text('METODOLOGÍA', 34, 144);
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2); doc.text('Autodiagnóstico · Guía interactiva · Role play · Plan de mejora · Evaluación situacional final', 34, 151);
      doc.setFillColor(255, 247, 225); doc.roundedRect(25, 162, 244, 17, 3, 3, 'F');
      doc.setTextColor(100, 85, 45); doc.setFontSize(7.2); doc.text('Este documento deja constancia de la culminación de una ruta de desarrollo. No constituye licencia profesional,', 148.5, 169, { align: 'center' });
      doc.text('acreditación académica formal ni autorización para ejercer.', 148.5, 174, { align: 'center' });
      if (qr) doc.addImage(qr, 'PNG', 25, 180, 12, 12, undefined, 'FAST');
      doc.setTextColor(0, 32, 91); doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.textWithLink(data.codigo, 40, 186, { url: verificationUrl }); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139); doc.text('La Academia Movida de SST · www.movidasst.com', 272, 187, { align: 'right' });
      doc.setTextColor(0, 123, 133); doc.setFontSize(6.5); doc.textWithLink('Escanear QR o verificar certificado', 40, 191, { url: verificationUrl });
      if (data.prueba) watermark(doc);
      doc.setProperties({ title: `Certificado - ${data.nombre}`, author: 'La Academia Movida de SST', creator: 'Desarrolla SST' });
      doc.save(`Certificado-${route.code}-${data.nombre.replace(/[^a-z0-9]+/gi, '-')}.pdf`);
      notice('Certificado de dos páginas descargado.');
    } catch (error) {
      console.error(error); notice('No fue posible generar el PDF. Intenta nuevamente.');
    } finally { button.disabled = false; button.textContent = original; }
  }

  function certificateCss() {
    return `
      .certificate-sheet{font-family:Outfit,Arial,sans-serif;color:#00205b;background:#f8fafc;aspect-ratio:1.414/1;box-shadow:0 20px 55px rgba(0,32,91,.22)}
      .certificate-frame{position:relative;height:100%;padding:4.2%;overflow:hidden;background:radial-gradient(circle at 12% 12%,rgba(0,123,133,.12),transparent 25%),radial-gradient(circle at 88% 85%,rgba(255,182,0,.14),transparent 28%),#fff;border:12px solid #00205b;box-shadow:inset 0 0 0 4px #007b85}
      .certificate-watermark{position:absolute;inset:42% auto auto 50%;transform:translate(-50%,-50%) rotate(-18deg);white-space:nowrap;font-size:70px;font-weight:900;letter-spacing:.12em;color:rgba(190,45,45,.09);pointer-events:none}
      .certificate-topline,.certificate-bottomline{position:absolute;left:4%;right:4%;height:6px;background:linear-gradient(90deg,#00205b,#007b85,#70ad47,#ffb600)}.certificate-topline{top:3.2%}.certificate-bottomline{bottom:3.2%}
      .certificate-header{display:grid;grid-template-columns:110px 1fr 95px;align-items:center;gap:24px}.certificate-logo{width:105px;height:105px;object-fit:contain}.certificate-badge{width:90px;height:105px;object-fit:contain;justify-self:end}.certificate-header div{text-align:center}.certificate-header p{margin:0;font-size:22px;font-weight:900;letter-spacing:.14em}.certificate-header span{font-size:13px;color:#007b85;font-weight:800;letter-spacing:.1em}
      .certificate-main{text-align:center;padding:5px 7% 0}.certificate-overline{margin:0;color:#007b85;font-size:14px;font-weight:900;letter-spacing:.2em}.certificate-main h1{margin:11px 0 3px;font:600 25px Georgia,serif;color:#475569}.certificate-main h2{display:inline-block;margin:4px 0 3px;padding:0 35px 8px;border-bottom:2px solid #ffb600;font:700 42px Georgia,serif;color:#00205b}.certificate-document{margin:5px 0 11px;color:#64748b;font-size:13px}.certificate-copy{margin:5px 0;color:#475569;font-size:17px}.certificate-main h3{margin:9px auto;color:#007b85;font-size:29px;line-height:1.15;max-width:850px}.certificate-route{display:inline-block;margin:6px 0;padding:7px 18px;border-radius:999px;background:#eef8f7;color:#00205b;font-weight:800;letter-spacing:.08em}.certificate-date{margin:12px 0 0;font-size:15px;color:#475569}
      .certificate-footer{position:absolute;left:6%;right:6%;bottom:7%;display:grid;grid-template-columns:1.15fr 1fr 1fr;align-items:end;gap:25px;text-align:center}.certificate-footer span{display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.certificate-footer b{display:block;margin-top:5px;font-size:14px}.certificate-code{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:10px;text-align:left}.certificate-qr{width:64px;height:64px;padding:4px;background:#fff;border:1px solid #cbd5e1;border-radius:7px}.certificate-qr canvas,.certificate-qr img{display:block;width:100%!important;height:100%!important}.certificate-code a{display:inline-block;margin-top:5px;color:#00205b;text-decoration:underline;text-decoration-color:#007b85;text-underline-offset:3px}.certificate-code a b{margin:0}.certificate-code small{display:block;margin-top:4px;color:#007b85;font-size:9px;font-weight:700}.certificate-grant{text-align:center}.certificate-signature{text-align:center}.certificate-signature em{display:block;font:italic 27px 'Brush Script MT','Segoe Script',cursive;color:#00205b}.certificate-signature i{display:block;height:1px;background:#00205b;margin:0 auto 5px;max-width:230px}.certificate-signature b{margin:0}
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

  async function copyPayment(value, button) {
    try {
      await navigator.clipboard.writeText(value);
      const original = button.textContent;
      button.textContent = 'Copiado';
      setTimeout(() => { button.textContent = original; }, 1600);
    } catch {
      notice('Mantén pulsado sobre los datos para copiarlos.');
    }
  }

  async function reportPayment(route, button) {
    const token = sessionStorage.getItem(TOKEN);
    if (!token) { notice('Tu sesión venció. Ingresa nuevamente.'); return; }
    const popup = window.open('', '_blank');
    button.disabled = true;
    button.textContent = 'Preparando reporte…';
    try {
      const response = await fetch(`${URL}/rest/v1/rpc/desarrolla_reportar_pago`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_token: token, p_diagnostico: route.code })
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'No fue posible registrar el reporte.');
      const message = [
        'Hola David, reporto el pago de USD 5 para la emisión de mi certificado.',
        `Competencia: ${data.competencia}`,
        `Participante: ${data.nombre}`,
        `Documento: ${data.documento || 'No indicado'}`,
        'Adjunto el comprobante de pago para su validación.'
      ].join('\n');
      const whatsapp = `https://wa.me/${WHATSAPP_PAYMENT}?text=${encodeURIComponent(message)}`;
      if (popup) popup.location.href = whatsapp;
      else window.location.href = whatsapp;
      document.getElementById('paymentModal')?.remove();
      const state = serverEligible.get(route.code);
      if (state) state.pago_estado = data.estado;
      mountButtons();
      notice('Pago reportado. El certificado se habilitará al ser validado.');
    } catch (error) {
      if (popup) popup.close();
      notice(error.message);
      button.disabled = false;
      button.textContent = 'Reportar pago por WhatsApp';
    }
  }

  function openPaymentModal(route, serverRoute) {
    document.getElementById('paymentModal')?.remove();
    const pending = serverRoute?.pago_estado === 'pendiente';
    const rejected = serverRoute?.pago_estado === 'rechazado';
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.className = 'payment-modal';
    modal.innerHTML = `
      <section class="payment-dialog" role="dialog" aria-modal="true" aria-labelledby="paymentTitle">
        <header><div><span>Emisión del certificado</span><h2 id="paymentTitle">${esc(route.name)}</h2></div><button type="button" data-payment-close aria-label="Cerrar">×</button></header>
        <div class="payment-price"><small>Valor de emisión</small><strong>USD 5</strong><p>Completa el pago y repórtalo por WhatsApp. El certificado se habilitará después de la validación administrativa.</p></div>
        ${pending ? '<p class="payment-state pending">Pago reportado · pendiente de validación</p>' : ''}
        ${rejected ? '<p class="payment-state rejected">El reporte anterior requiere corrección. Revisa los datos y envía nuevamente el comprobante.</p>' : ''}
        <div class="payment-methods">
          <article><h3>Transferencia Venezuela</h3><p>${esc(PAYMENT_INFO.transfer)}</p><button type="button" data-copy="transfer">Copiar datos</button></article>
          <article><h3>Pago Móvil</h3><p>${esc(PAYMENT_INFO.pagoMovil)}</p><button type="button" data-copy="pagoMovil">Copiar datos</button></article>
          <article><h3>Binance USDT</h3><p>${esc(PAYMENT_INFO.binance)}</p><button type="button" data-copy="binance">Copiar datos</button></article>
          <article><h3>PayPal</h3><p>${esc(PAYMENT_INFO.paypal)}</p><button type="button" data-copy="paypal">Copiar datos</button></article>
        </div>
        <div class="payment-actions"><button type="button" class="secondary" data-payment-close>Cerrar</button><button type="button" class="payment-whatsapp">Reportar pago por WhatsApp</button></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-payment-close]').forEach(button => button.onclick = () => modal.remove());
    modal.onclick = event => { if (event.target === modal) modal.remove(); };
    modal.querySelectorAll('[data-copy]').forEach(button => button.onclick = () => copyPayment(PAYMENT_INFO[button.dataset.copy], button));
    modal.querySelector('.payment-whatsapp').onclick = event => reportPayment(route, event.currentTarget);
    modal.querySelector('[data-payment-close]').focus();
  }

  async function loadEligibility() {
    if (eligibilityLoading) return;
    const token = sessionStorage.getItem(TOKEN);
    if (!token || eligibilityLoadedFor === token) return;
    eligibilityLoading = true;
    try {
      const response = await fetch(`${URL}/rest/v1/rpc/desarrolla_rutas_certificables`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_token: token })
      });
      const data = await response.json();
      if (data?.ok && Array.isArray(data.rutas)) {
        serverEligible.clear();
        data.rutas.forEach(route => serverEligible.set(route.codigo, route));
        eligibilityLoadedFor = token;
      }
    } catch (error) {
      console.error('No se pudieron consultar las rutas certificables.', error);
    } finally {
      eligibilityLoading = false;
      mountButtons();
    }
  }

  function mountButtons() {
    const cards = document.querySelectorAll('#globalProgress .competency-progress article');
    cards.forEach((card, index) => {
      const route = ROUTES[index];
      const serverRoute = route ? serverEligible.get(route.code) : null;
      const existingButton = card.querySelector('.certificate-button, .payment-button');
      if (!route || !serverRoute) { existingButton?.remove(); return; }
      if (serverRoute.prueba) {
        card.querySelectorAll('.cp-stages span').forEach(stage => {
          stage.classList.add('done');
          stage.textContent = '✓ ' + stage.textContent.replace(/^[✓○]\s*/, '');
        });
        const detail = card.querySelector('.cp-title small');
        if (detail) detail.textContent = '5/5 etapas · modo de prueba';
      }
      const buttonState = serverRoute.pago_estado === 'validado' ? 'certificate' : `payment-${serverRoute.pago_estado || 'sin_reportar'}`;
      if (existingButton?.dataset.state === buttonState) return;
      existingButton?.remove();
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.state = buttonState;
      if (serverRoute.pago_estado === 'validado') {
        button.className = 'certificate-button';
        button.innerHTML = '<span>▣</span> Descargar certificado';
        button.onclick = () => handle(button, route);
      } else {
        button.className = 'payment-button';
        button.innerHTML = serverRoute.pago_estado === 'pendiente'
          ? '<span>◷</span> Pago reportado · ver estado'
          : serverRoute.pago_estado === 'rechazado'
            ? '<span>!</span> Corregir reporte de pago'
            : '<span>$</span> Reportar pago · USD 5';
        button.onclick = () => openPaymentModal(route, serverRoute);
      }
      card.appendChild(button);
    });
    if (serverEligible.size === ROUTES.length && Array.from(serverEligible.values()).every(route => route.prueba)) {
      const summary = document.querySelector('#globalProgress .progress-summary');
      const title = summary?.querySelector('h2');
      const detail = summary?.querySelector('p:not(.kicker)');
      const ring = summary?.querySelector('.progress-ring');
      const ringText = ring?.querySelector('span');
      if (title) title.textContent = '100% completado · prueba';
      if (detail) detail.textContent = '30 de 30 etapas · certificados sujetos a validación de pago';
      if (ring) ring.style.setProperty('--p', '100');
      if (ringText) ringText.textContent = '100%';
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    ${certificateCss()}
    .certificate-button,.payment-button{width:100%;margin-top:16px;border:0;border-radius:12px;padding:12px 16px;color:#fff;font:800 14px Outfit,Arial,sans-serif;cursor:pointer;box-shadow:0 8px 20px rgba(0,32,91,.18)}.certificate-button{background:linear-gradient(135deg,#00205b,#007b85)}.payment-button{background:linear-gradient(135deg,#007b85,#70ad47)}.certificate-button:disabled,.payment-button:disabled{opacity:.65}
    .payment-modal{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:14px;background:rgba(0,20,48,.8);overflow:auto}.payment-dialog{width:min(760px,100%);max-height:95dvh;overflow:auto;border-radius:24px;background:#f8fafc;box-shadow:0 28px 80px rgba(0,0,0,.4)}.payment-dialog>header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:14px;align-items:center;padding:18px 20px;background:#fff;border-bottom:1px solid #dce5ea}.payment-dialog>header span{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#007b85}.payment-dialog>header h2{margin:3px 0 0;color:#00205b;font-size:18px}.payment-dialog>header button{width:40px;height:40px;border:0;border-radius:50%;background:#e8eef3;color:#00205b;font-size:25px}.payment-price{margin:18px;padding:18px;border-radius:18px;background:linear-gradient(135deg,#00205b,#007b85);color:#fff}.payment-price small{display:block;text-transform:uppercase;letter-spacing:.12em;font-weight:800}.payment-price strong{display:block;margin:4px 0;font-size:32px}.payment-price p{margin:0;font-size:13px;line-height:1.45}.payment-state{margin:0 18px 14px;padding:11px 13px;border-radius:12px;font-weight:800;font-size:12px}.payment-state.pending{background:#fff7db;color:#765700}.payment-state.rejected{background:#fff1f2;color:#be123c}.payment-methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 18px 18px}.payment-methods article{display:flex;flex-direction:column;padding:14px;border:1px solid #dce5ea;border-radius:15px;background:#fff}.payment-methods h3{margin:0 0 6px;color:#00205b;font-size:14px}.payment-methods p{flex:1;margin:0 0 10px;color:#52697a;font-size:11px;line-height:1.45}.payment-methods button{border:1px solid #007b85;border-radius:9px;padding:8px;background:#eef8f7;color:#006a73;font-weight:800}.payment-actions{position:sticky;bottom:0;display:flex;gap:10px;padding:14px 18px;background:#fff;border-top:1px solid #dce5ea}.payment-actions button{min-height:46px;border:0;border-radius:11px;padding:10px 16px;font-weight:900}.payment-actions .secondary{background:#e8eef3;color:#00205b}.payment-whatsapp{flex:1;background:#25d366;color:#073b1b}
    .certificate-modal{position:fixed;inset:0;z-index:10000;background:rgba(0,20,48,.76);display:grid;place-items:center;padding:16px;overflow:auto}.certificate-dialog{width:min(1100px,100%);max-height:96dvh;overflow:auto;background:#f8fafc;border-radius:22px;box-shadow:0 25px 70px rgba(0,0,0,.35)}.certificate-toolbar,.certificate-actions{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:16px 20px}.certificate-toolbar b,.certificate-toolbar span{display:block}.certificate-toolbar span{color:#64748b;font-size:13px;margin-top:3px}.certificate-toolbar button{width:40px;height:40px;border:0;border-radius:50%;font-size:26px;background:#e8eef3;color:#00205b}.certificate-preview{padding:0 20px 10px;overflow:auto}.certificate-preview .certificate-sheet{width:100%;min-width:820px}.certificate-actions{justify-content:flex-end;border-top:1px solid #dce5ea}.certificate-actions button{padding:12px 18px}
    @media(max-width:760px){.payment-methods{grid-template-columns:1fr}.payment-actions{display:grid;grid-template-columns:1fr 1.6fr}.payment-dialog>header h2{font-size:15px}.certificate-preview{padding:0 12px 10px}.certificate-preview .certificate-sheet{min-width:760px}.certificate-toolbar{position:sticky;top:0;z-index:2;background:#f8fafc}.certificate-actions{position:sticky;bottom:0;background:#f8fafc}.certificate-actions button{flex:1}.certificate-toolbar span{display:none}}
    @media print{body>*:not(#certificateModal){display:none!important}.certificate-modal{position:static;padding:0;background:#fff}.certificate-toolbar,.certificate-actions{display:none!important}.certificate-dialog,.certificate-preview{padding:0;max-height:none;overflow:visible;box-shadow:none}.certificate-preview .certificate-sheet{width:297mm;height:210mm;min-width:0;box-shadow:none}}
  `;
  document.head.appendChild(style);

  const progress = document.getElementById('progress');
  if (progress) new MutationObserver(() => setTimeout(() => { mountButtons(); loadEligibility(); }, 50)).observe(progress, { childList: true, subtree: true, attributes: true });
  setTimeout(() => { mountButtons(); loadEligibility(); }, 300);
})();
