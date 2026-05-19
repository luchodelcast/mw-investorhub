/* ═══════════════════════════════════════════════════════════════════════
   Master Waiters Investor Hub — Layer Header v2
   ═══════════════════════════════════════════════════════════════════════
   v2 changes:
   - Replaced "MW" text logo with logomw.png
   - Added i18n (ES/EN) with auto-refresh when user clicks .lang-btn
   - Centered progress horizontally between brand and actions
   ═══════════════════════════════════════════════════════════════════════ */

(function MWHeader() {
  const I18N = {
    es: {
      tag: "Investor Hub",
      l1_name: "El Salón",        l1_sub: "Hub",
      l2_name: "La Cocina",        l2_sub: "Materiales",
      l3_name: "La Bodega",        l3_sub: "Data Room",
      l4_name: "Mesa del Chef",    l4_sub: "Por invitación",
      access: "Acceso privado",
      proposal: "Mi Propuesta",
      logout: "Salir",
      toast_exclusive: "La Mesa del Chef es por invitación personal. Contacta a luis@superlikers.com"
    },
    en: {
      tag: "Investor Hub",
      l1_name: "The Lounge",       l1_sub: "Hub",
      l2_name: "The Kitchen",      l2_sub: "Materials",
      l3_name: "The Cellar",       l3_sub: "Data Room",
      l4_name: "Chef's Table",     l4_sub: "By invitation",
      access: "Private access",
      proposal: "My Proposal",
      logout: "Sign out",
      toast_exclusive: "The Chef's Table is by personal invitation. Contact luis@superlikers.com"
    }
  };

  function getLang() {
    /* Priority: HTML lang attribute (most reliable) > localStorage > 'es' */
    const docLang = document.documentElement.lang;
    if (docLang === 'en' || docLang === 'es') return docLang;
    try { return localStorage.getItem('mw_lang') || 'es'; } catch (e) { return 'es'; }
  }
  function t(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.es[key] || key;
  }

  function getLayers() {
    return [
      {
        id: 1, icon: "🍽",
        name: t('l1_name'), subtitle: t('l1_sub'),
        url: "index.html",
        requiredTier: null,
        pages: ["", "index.html", "index"]
      },
      {
        id: 2, icon: "🔥",
        name: t('l2_name'), subtitle: t('l2_sub'),
        url: "financial-models.html",
        requiredTier: "materials",
        pages: ["financial-models.html", "super_meseros_interactive_model_v2.html"]
      },
      {
        id: 3, icon: "🍷",
        name: t('l3_name'), subtitle: t('l3_sub'),
        url: "dataroom.html",
        requiredTier: "dataroom",
        pages: ["dataroom.html", "nda.html"]
      },
      {
        id: 4, icon: "✦",
        name: t('l4_name'), subtitle: t('l4_sub'),
        url: null,
        requiredPersonal: true,
        pages: []
      }
    ];
  }

  function detectCurrentLayer() {
    const path = (location.pathname.split('/').pop() || '').toLowerCase();
    const layers = getLayers();
    for (const layer of layers) {
      if (layer.pages.some(p => p.toLowerCase() === path)) return layer.id;
    }
    if (path.startsWith('para-')) return 4;
    return 1;
  }

  function getSession() {
    try { return typeof mwGetSession === 'function' ? mwGetSession() : null; }
    catch (e) { return null; }
  }
  function hasTier(session, requiredTier) {
    if (!session) return false;
    try { return typeof mwHasTier === 'function' ? mwHasTier(session, requiredTier) : false; }
    catch (e) { return false; }
  }

  function getLayerState(layer, currentLayerId, session) {
    if (layer.id === currentLayerId) return 'current';
    if (layer.requiredPersonal) {
      if (session && session.personal) return layer.id < currentLayerId ? 'completed' : 'available';
      return 'locked-exclusive';
    }
    if (layer.requiredTier) {
      if (hasTier(session, layer.requiredTier)) {
        return layer.id < currentLayerId ? 'completed' : 'available';
      }
      return 'locked';
    }
    return layer.id < currentLayerId ? 'completed' : 'available';
  }

  function getLayerUrl(layer, session) {
    if (layer.requiredPersonal && session && session.personal) return session.personal;
    return layer.url;
  }

  function handleLayerClick(layer, state, e) {
    e.preventDefault();
    const session = getSession();
    if (state === 'locked-exclusive') {
      showInfoToast(t('toast_exclusive'));
      return;
    }
    if (state === 'locked') {
      window.location.href = "financial-access.html";
      return;
    }
    const url = getLayerUrl(layer, session);
    if (url) window.location.href = url;
  }

  function showInfoToast(message) {
    const existing = document.querySelector('.mw-header-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'mw-header-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  function logout() {
    if (typeof mwClearSession === 'function') mwClearSession();
    window.location.href = "index.html";
  }

  function injectStyles() {
    if (document.getElementById('mw-header-styles')) return;
    const style = document.createElement('style');
    style.id = 'mw-header-styles';
    style.textContent = `
      .mw-header{
        position:sticky;top:0;left:0;right:0;z-index:1000;
        background:rgba(10,8,6,.92);
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
        border-bottom:0.5px solid rgba(201,164,71,.18);
        font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;
        padding:10px 24px;
        display:grid;
        grid-template-columns:1fr auto 1fr;
        align-items:center;
        gap:18px;
      }
      .mw-header-brand{
        display:flex;align-items:center;gap:10px;
        text-decoration:none;color:#EDE9DF;
        justify-self:start;
      }
      .mw-header-logo-img{
        height:42px;width:auto;display:block;
      }
      .mw-header-tag{
        font-size:9px;letter-spacing:.16em;text-transform:uppercase;
        color:#5C5648;margin-left:4px;
      }
      .mw-progress{
        display:flex;align-items:center;gap:0;
        justify-self:center;
      }
      .mw-step{
        display:flex;align-items:center;gap:8px;
        background:transparent;border:none;
        cursor:pointer;padding:6px 10px;border-radius:8px;
        font-family:inherit;color:inherit;
        transition:background .2s;
      }
      .mw-step:hover{background:rgba(201,164,71,.06);}
      .mw-step-icon{
        width:28px;height:28px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:600;
        border:0.5px solid;transition:all .25s;
        flex-shrink:0;
      }
      .mw-step-text{
        display:flex;flex-direction:column;align-items:flex-start;
        line-height:1.1;
      }
      .mw-step-name{
        font-family:'Cormorant Garamond',serif;
        font-size:14px;font-weight:600;
        white-space:nowrap;
      }
      .mw-step-sub{
        font-size:9px;letter-spacing:.1em;text-transform:uppercase;
        margin-top:1px;
      }
      .mw-step-connector{
        width:32px;height:1px;
        background:rgba(237,233,224,.08);
        margin:0 2px;
      }
      .mw-step-connector.completed{background:rgba(201,164,71,.4);}

      .mw-step.completed .mw-step-icon{
        background:rgba(201,164,71,.18);
        border-color:rgba(201,164,71,.5);
        color:#C9A447;
      }
      .mw-step.completed .mw-step-name{color:#A09880;}
      .mw-step.completed .mw-step-sub{color:#5C5648;}

      .mw-step.current .mw-step-icon{
        background:#C9A447;
        border-color:#C9A447;
        color:#0A0806;
        box-shadow:0 0 0 4px rgba(201,164,71,.18),0 0 24px rgba(201,164,71,.35);
        animation:mwPulse 2.5s ease-in-out infinite;
      }
      .mw-step.current .mw-step-name{color:#EDE9DF;}
      .mw-step.current .mw-step-sub{color:#C9A447;}
      @keyframes mwPulse{
        0%,100%{box-shadow:0 0 0 4px rgba(201,164,71,.18),0 0 24px rgba(201,164,71,.35);}
        50%{box-shadow:0 0 0 6px rgba(201,164,71,.1),0 0 30px rgba(201,164,71,.5);}
      }

      .mw-step.available .mw-step-icon{
        background:transparent;
        border-color:rgba(201,164,71,.4);
        color:#C9A447;
      }
      .mw-step.available .mw-step-name{color:#EDE9DF;}
      .mw-step.available .mw-step-sub{color:#A09880;}

      .mw-step.locked .mw-step-icon,
      .mw-step.locked-exclusive .mw-step-icon{
        background:rgba(237,233,224,.04);
        border-color:rgba(237,233,224,.1);
        color:#5C5648;
      }
      .mw-step.locked-exclusive .mw-step-icon{
        border-style:dashed;
        border-color:rgba(201,164,71,.25);
        color:rgba(201,164,71,.55);
      }
      .mw-step.locked .mw-step-name,
      .mw-step.locked-exclusive .mw-step-name{color:#5C5648;}
      .mw-step.locked .mw-step-sub,
      .mw-step.locked-exclusive .mw-step-sub{color:#3D3829;}
      .mw-step.locked-exclusive .mw-step-sub{color:rgba(201,164,71,.4);}
      .mw-step.locked-exclusive:hover .mw-step-icon{
        border-color:rgba(201,164,71,.5);
        color:#C9A447;
      }

      .mw-header-actions{
        display:flex;align-items:center;gap:8px;
        justify-self:end;
      }
      .mw-header-btn{
        padding:8px 14px;border-radius:8px;
        font-size:12px;font-weight:500;letter-spacing:.02em;
        text-decoration:none;cursor:pointer;
        font-family:inherit;border:0.5px solid;
        transition:all .2s;background:transparent;
        white-space:nowrap;
      }
      .mw-header-btn.primary{
        background:#C9A447;border-color:#C9A447;color:#0A0806;
      }
      .mw-header-btn.primary:hover{background:#E8C96A;}
      .mw-header-btn.secondary{
        border-color:rgba(201,164,71,.35);color:#C9A447;
      }
      .mw-header-btn.secondary:hover{
        background:rgba(201,164,71,.08);border-color:#C9A447;
      }
      .mw-header-btn.ghost{
        border-color:transparent;color:#A09880;
      }
      .mw-header-btn.ghost:hover{color:#EDE9DF;}

      .mw-header-session{
        font-size:11px;color:#5C5648;letter-spacing:.04em;
        padding-right:8px;border-right:0.5px solid rgba(237,233,224,.08);
        margin-right:4px;
      }
      .mw-header-session strong{color:#A09880;font-weight:500;}

      .mw-header-toast{
        position:fixed;bottom:30px;left:50%;
        transform:translateX(-50%) translateY(20px);
        background:#1C1710;
        border:0.5px solid rgba(201,164,71,.22);
        border-radius:10px;
        padding:14px 20px;
        font-family:'Outfit',sans-serif;font-size:13px;
        color:#EDE9DF;
        box-shadow:0 8px 32px rgba(0,0,0,.5);
        opacity:0;transition:opacity .3s,transform .3s;
        z-index:9999;max-width:420px;text-align:center;
      }
      .mw-header-toast.visible{opacity:1;transform:translateX(-50%) translateY(0);}

      
      /* Hide legacy floating lang toggle when header is present */
      #mw-lang-toggle{display:none !important;}

      /* Embedded ES|EN lang toggle inside header */
      .mw-header-lang{
        display:flex;align-items:center;
        font-family:'Outfit',sans-serif;font-size:11px;
        letter-spacing:.12em;cursor:pointer;
        padding:6px 10px;border-radius:100px;
        border:0.5px solid rgba(201,164,71,.22);
        transition:border-color .2s;
        user-select:none;
      }
      .mw-header-lang:hover{border-color:rgba(201,164,71,.55);}
      .mw-header-lang-btn{
        padding:0 4px;color:rgba(180,170,150,.45);
        transition:color .2s;
      }
      .mw-header-lang-btn.active{color:#C9A447;font-weight:600;}
      .mw-header-lang-sep{margin:0 2px;opacity:.25;color:#C9A447;}

      @media(max-width:1100px){
        .mw-header{grid-template-columns:auto 1fr auto;padding:10px 16px;}
        .mw-step-text{display:none;}
        .mw-step{padding:4px;}
        .mw-step-connector{width:18px;}
        .mw-header-tag{display:none;}
      }
      @media(max-width:560px){
        .mw-header-actions .mw-header-btn:not(.primary){display:none;}
        .mw-header-logo-img{height:34px;}
      }
    `;
    document.head.appendChild(style);
  }

  function buildHeader() {
    const session = getSession();
    const currentLayerId = detectCurrentLayer();
    const layers = getLayers();

    const header = document.createElement('div');
    header.className = 'mw-header';
    header.id = 'mw-header-root';

    /* Brand with PNG logo */
    const brand = document.createElement('a');
    brand.className = 'mw-header-brand';
    brand.href = 'index.html';
    brand.innerHTML = `
      <img src="logomw.png" alt="Master Waiters" class="mw-header-logo-img"/>
      <span class="mw-header-tag">${t('tag')}</span>
    `;
    header.appendChild(brand);

    /* Progress (centered) */
    const progress = document.createElement('div');
    progress.className = 'mw-progress';
    layers.forEach((layer, i) => {
      const state = getLayerState(layer, currentLayerId, session);
      const step = document.createElement('button');
      step.className = `mw-step ${state}`;
      step.title = `${layer.name} — ${layer.subtitle}`;
      step.innerHTML = `
        <div class="mw-step-icon">${state === 'completed' ? '✓' : (state === 'locked' || state === 'locked-exclusive') ? '🔒' : layer.icon}</div>
        <div class="mw-step-text">
          <div class="mw-step-name">${layer.name}</div>
          <div class="mw-step-sub">${layer.subtitle}</div>
        </div>
      `;
      step.addEventListener('click', (e) => handleLayerClick(layer, state, e));
      progress.appendChild(step);

      if (i < layers.length - 1) {
        const connector = document.createElement('div');
        const isCompleted = (i + 1) < currentLayerId;
        connector.className = `mw-step-connector${isCompleted ? ' completed' : ''}`;
        progress.appendChild(connector);
      }
    });
    header.appendChild(progress);

    /* Actions */
    const actions = document.createElement('div');
    actions.className = 'mw-header-actions';

    /* Embedded ES|EN language toggle (replaces floating one from lang.js) */
    const currentLang = getLang();
    const langToggle = document.createElement('div');
    langToggle.className = 'mw-header-lang';
    langToggle.innerHTML =
      '<span class="mw-header-lang-btn ' + (currentLang==='es'?'active':'') + '" data-lang="es">ES</span>' +
      '<span class="mw-header-lang-sep">|</span>' +
      '<span class="mw-header-lang-btn ' + (currentLang==='en'?'active':'') + '" data-lang="en">EN</span>';
    langToggle.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      const targetLang = btn.dataset.lang;
      if (typeof window.mwApplyLang === 'function') {
        window.mwApplyLang(targetLang);
      } else {
        /* Fallback: trigger legacy floating toggle if mwApplyLang not yet exposed */
        const legacy = document.getElementById('mw-lang-toggle');
        if (legacy && (currentLang !== targetLang)) legacy.click();
      }
    });
    actions.appendChild(langToggle);

    if (session) {
      const sessionInfo = document.createElement('div');
      sessionInfo.className = 'mw-header-session';
      const firstName = (session.name || '').split(' ')[0] || 'Investor';
      sessionInfo.innerHTML = `<strong>${firstName}</strong>`;
      actions.appendChild(sessionInfo);

      if (session.personal) {
        const propBtn = document.createElement('a');
        propBtn.className = 'mw-header-btn primary';
        propBtn.href = session.personal;
        propBtn.textContent = t('proposal');
        actions.appendChild(propBtn);
      }

      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'mw-header-btn ghost';
      logoutBtn.textContent = t('logout');
      logoutBtn.addEventListener('click', logout);
      actions.appendChild(logoutBtn);
    } else {
      const loginBtn = document.createElement('a');
      loginBtn.className = 'mw-header-btn secondary';
      loginBtn.href = 'financial-access.html';
      loginBtn.textContent = t('access');
      actions.appendChild(loginBtn);
    }
    header.appendChild(actions);
    return header;
  }

  function render() {
    const existing = document.getElementById('mw-header-root');
    const newHeader = buildHeader();
    if (existing) {
      existing.replaceWith(newHeader);
    } else {
      document.body.insertBefore(newHeader, document.body.firstChild);
    }
  }

  function listenForLangChanges() {
    /* Method 1: Click listener on common lang button selectors (works on
       financial-models, simulator, gate which all use these classes). */
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn, .mi-lang-btn, [data-lang-toggle]');
      if (btn) {
        setTimeout(() => render(), 60);
      }
    }, true);

    /* Method 2 (more robust): MutationObserver on <html lang="..."> attribute.
       This catches lang changes regardless of which toggle implementation
       the page uses (index.html has its own custom toggle that doesn't use
       .lang-btn). Standard HTML attribute = single source of truth. */
    try {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'lang') {
            render();
            break;
          }
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch (e) {}

    /* Method 3 (fallback): poll localStorage every 800ms in case some page
       uses a non-standard mechanism. Lightweight, no observable cost. */
    let lastLang = getLang();
    setInterval(() => {
      const current = getLang();
      if (current !== lastLang) {
        lastLang = current;
        render();
      }
    }, 800);
  }

  function init() {
    injectStyles();
    render();
    listenForLangChanges();
    /* Expose for manual refresh from console / other scripts */
    window.mwHeaderRefresh = render;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
