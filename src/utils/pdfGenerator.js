function formatDate(dateIso) {
  try {
    const d = new Date(dateIso || Date.now());
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return '';
  }
}

function safe(val, fallback = '—') {
  return val ?? fallback;
}

function pickPhotoSrc(meta) {
  if (!meta) return null;
  return meta.preview || meta.url || null;
}

function getCoordsTxt(geometry) {
  try {
    if (!geometry || geometry.type !== 'Point') return '—';
    const coords = geometry.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return '—';
    const [lng, lat] = coords;
    if (typeof lat !== 'number' || typeof lng !== 'number') return '—';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return '—';
  }
}

const TYPE_LABEL_FR = {
  DEMOLITION: 'Démolition',
  SIGNALEMENT: 'Signalement',
  NON_DEMOLITION: 'Non démolition',
};

function buildPVHtml(pv) {
  const action = pv.action || {};
  const numero = safe(pv.numero, '');
  const typeCode = safe(pv.type, '');
  const typeFr = TYPE_LABEL_FR[typeCode] || typeCode;

  const dateAction = action?.date ? new Date(action.date) : null;
  const dateActionTxt = dateAction
    ? `${dateAction.toLocaleDateString()} ${String(dateAction.getHours()).padStart(2, '0')}:${String(dateAction.getMinutes()).padStart(2, '0')}`
    : '—';

  const agent = action?.user?.name || action?.user?.nom || '—';
  const localisation = action?.commune ? `${action.commune} — ${action.prefecture || ''}` : '—';
  const coords = getCoordsTxt(action?.geometry);

  const titre = pv?.contenu?.titre || `Procès-verbal — ${typeFr}`;
  const constatations = pv?.contenu?.constatations || '';
  const decisions = pv?.contenu?.decisions || '';

  const beforeSrc = pickPhotoSrc(pv?.contenu?.photos?.before);
  const afterSrc  = pickPhotoSrc(pv?.contenu?.photos?.after);

  const isValide = pv?.statut === 'VALIDE';
  const faitLe = pv?.validatedAt || Date.now();

  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '-10000px';
  wrap.style.top = '0';
  wrap.style.width = '794px';     
  wrap.style.background = '#fff';
  wrap.style.color = '#000';
  wrap.style.fontFamily = 'serif';
  wrap.id = `pv-print-${numero}-${Date.now()}`;

  wrap.innerHTML = `
    <style>
      .pv-root { position: relative; padding: 32px 40px; box-sizing: border-box; }
      .text-center { text-align: center; }
      .muted { color: #555; }
      .title { font-size: 18px; font-weight: 700; margin: 18px 0 8px; }
      .subtitle { font-size: 14px; font-weight: 600; margin: 6px 0; }
      .block { margin: 14px 0 10px; }
      .line { height: 1px; background: #000; opacity: .3; margin: 10px 0 16px; }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .small { font-size: 12px; }
      .arabic { direction: rtl; font-family: "Tahoma", "Arial", sans-serif; }
      .box { border: 1px solid #000; padding: 10px; border-radius: 6px; }
      .pair { display:flex; justify-content: space-between; gap: 12px; }
      .pair > div { width: 48%; }
      .photo { width: 100%; height: auto; border-radius: 6px; border:1px solid #ddd; }
      .kv { font-size: 13px; line-height: 1.6; }
      .kv b { display: inline-block; min-width: 120px; }
      .mb8 { margin-bottom:8px; }
      .badge { display:inline-block; padding:2px 8px; border:1px solid #999; border-radius: 999px; font-size:11px; margin-left:6px; }
      .watermark {
        position: absolute; inset: 0; pointer-events: none;
        display: flex; align-items: center; justify-content: center;
        opacity: 0.095; transform: rotate(-24deg);
        font-size: 120px; font-weight: 800; color: #000;
        letter-spacing: 4px;
      }
    </style>

    <div class="pv-root">
      ${isValide ? '' : `<div class="watermark">BROUILLON</div>`}

      <!-- Entête bilingue -->
      <div class="text-center">
        <div class="arabic" style="font-size:18px; font-weight:700;">المملكة المغربية</div>
        <div class="subtitle">ROYAUME DU MAROC</div>
        <div class="arabic" style="font-size:16px; font-weight:600; margin-top:4px;">وزارة الداخلية</div>
        <div class="small">MINISTÈRE DE L'INTÉRIEUR</div>
      </div>
      <div class="line"></div>

      <!-- Titre -->
      <div class="text-center">
        <div class="title">PROCÈS-VERBAL D'URBANISME</div>
        <div class="arabic">محضر في مجال التعمير</div>
        <div class="small muted">N° ${numero} ${isValide ? '<span class="badge">VALIDÉ</span>' : '<span class="badge">BROUILLON</span>'}</div>
      </div>

      <!-- Infos principales -->
      <div class="block box kv">
        <div class="mb8"><b>Type / النوع:</b> ${typeFr}</div>
        <div class="mb8"><b>Date / التاريخ:</b> ${dateActionTxt}</div>
        <div class="mb8"><b>Agent / العون:</b> ${agent}</div>
        <div class="mb8"><b>Localisation / الموقع:</b> ${localisation}</div>
        <div class="mb8"><b>Coordonnées / الإحداثيات:</b> ${coords}</div>
      </div>

      <!-- Constatations -->
      <div class="block">
        <div class="subtitle">CONSTATATIONS</div>
        <div class="arabic">المعاينات</div>
        <div class="box small" style="white-space:pre-wrap;">${constatations || '—'}</div>
      </div>

      <!-- Décisions -->
      <div class="block">
        <div class="subtitle">DÉCISIONS ET MESURES PRISES</div>
        <div class="arabic">القرارات و الإجراءات المتخذة</div>
        <div class="box small" style="white-space:pre-wrap;">${decisions || '—'}</div>
      </div>

      <!-- Photos -->
      <div class="block">
        <div class="subtitle">DOCUMENTATION PHOTOGRAPHIQUE</div>
        <div class="arabic">توثيق مصوّر</div>
        <div class="grid-2">
          <div>
            <div class="small muted">Photo AVANT / قبل</div>
            ${beforeSrc ? `<img class="photo" src="${beforeSrc}" />` : `<div class="box small">—</div>`}
          </div>
          <div>
            <div class="small muted">Photo APRÈS / بعد</div>
            ${afterSrc ? `<img class="photo" src="${afterSrc}" />` : `<div class="box small">—</div>`}
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="block pair">
        <div class="box small" style="height:90px;">
          <div class="subtitle">Signature de l’agent</div>
          <div class="arabic">توقيع العون</div>
        </div>
        <div class="box small" style="height:90px;">
          <div class="subtitle">Signature du responsable</div>
          <div class="arabic">توقيع الرئيس</div>
        </div>
      </div>

      <div class="block small muted" style="margin-top:10px;">
        Fait à ${action?.commune || '—'}, le ${formatDate(faitLe)} — حرر ب ${action?.commune || '—'} في ${formatDate(faitLe)}
      </div>
    </div>
  `;

  document.body.appendChild(wrap);
  return wrap;
}

async function nodeToPDF(node, filename = 'document.pdf') {
  const [jsPdfModule, h2cModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const JsPDF = jsPdfModule.jsPDF || jsPdfModule.default || jsPdfModule;
  const html2canvas = h2cModule.default || h2cModule;

  const A4_WIDTH = 595.28; 
  const A4_HEIGHT = 841.89; 

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new JsPDF('p', 'pt', 'a4');

  try {
    pdf.setProperties({
      title: filename,
      subject: 'Procès-verbal d’urbanisme',
      author: 'Plateforme de suivi',
      keywords: 'PV, urbanisme, démolition, signalement',
      creator: 'App',
    });
  } catch { /* noop */ }

  const imgWidth = A4_WIDTH;
  const pageHeight = A4_HEIGHT;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  let pageIndex = 1;
  const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  try {
    pdf.setFontSize(9);
    pdf.text(`${pageIndex}/${totalPages}`, A4_WIDTH / 2, A4_HEIGHT - 12, { align: 'center' });
  } catch { /* noop */ }

  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    pageIndex += 1;
    try {
      pdf.setFontSize(9);
      pdf.text(`${pageIndex}/${totalPages}`, A4_WIDTH / 2, A4_HEIGHT - 12, { align: 'center' });
    } catch { /* noop */ }
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export async function generatePVPDF(pv) {
  const numero = pv?.numero || `PV${Date.now()}`;
  const fileName = `PV_${String(numero).replace(/\s+/g, '_')}_${formatDate(Date.now())}.pdf`;
  const node = buildPVHtml(pv);
  try {
    await nodeToPDF(node, fileName);
  } finally {
    try {
      if (node && typeof node.remove === 'function') {
        node.remove(); 
      } else if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    } catch {
    }
  }
}

const pdfGenerator = { generatePVPDF };
export default pdfGenerator;