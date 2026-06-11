/* ── Grandure Connect SPA ── */

const PLATFORM_LABELS = { instagram: 'Instagram', threads: 'Threads', youtube: 'YouTube', tiktok: 'TikTok', twitter: 'X' };
const PLATFORM_SHORT  = { instagram: 'IG', threads: 'TH', youtube: 'YT', tiktok: 'TK', twitter: 'X' };

/* ── Auto-update poller ── */
(function startUpdatePoller() {
  let knownEtag = null;

  async function check() {
    try {
      const res = await fetch('js/app.js?_=' + Date.now(), { cache: 'no-store', method: 'HEAD' });
      const etag = res.headers.get('etag') || res.headers.get('last-modified');
      if (!etag) return;
      if (knownEtag === null) { knownEtag = etag; return; }
      if (etag !== knownEtag) window.location.reload();
    } catch (e) {}
  }

  setTimeout(() => { check(); setInterval(check, 20000); }, 5000);
})();

/* ── localStorage persistence for user-added brands ── */
const STORAGE_KEY = 'gc_custom_brands';

function loadCustomBrands() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) JSON.parse(saved).forEach(b => BRANDS.push(b));
  } catch (e) {}
}

function saveCustomBrands() {
  const builtInIds = ['1', '2', '3'];
  const custom = BRANDS.filter(b => !builtInIds.includes(b.id));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(custom)); } catch (e) {}
}

loadCustomBrands();

/* ── Brand overrides (edits to any brand, including built-ins) ── */
const OVERRIDES_KEY = 'gc_brand_overrides';

function loadBrandOverrides() {
  try {
    const saved = localStorage.getItem(OVERRIDES_KEY);
    if (!saved) return;
    const overrides = JSON.parse(saved);
    BRANDS.forEach(b => { if (overrides[b.id]) Object.assign(b, overrides[b.id]); });
  } catch (e) {}
}

function saveBrandOverride(id, patch) {
  try {
    const overrides = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}');
    overrides[id] = { ...overrides[id], ...patch };
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {}
  const brand = BRANDS.find(b => b.id === id);
  if (brand) Object.assign(brand, patch);
}

loadBrandOverrides();

/* ── Router ── */
function navigate(hash) { window.location.hash = hash; }

function parseHash() {
  const h = window.location.hash.replace('#', '') || '/';
  const [path, ...rest] = h.split('?');
  const params = {};
  rest.join('?').split('&').filter(Boolean).forEach(p => {
    const [k, v] = p.split('=');
    params[k] = decodeURIComponent(v || '');
  });
  return { path, params };
}

function getBrand(id) { return BRANDS.find(b => b.id === id); }

window.addEventListener('hashchange', render);
window.addEventListener('load', render);

function render() {
  const { path, params } = parseHash();
  const app = document.getElementById('app');

  // Remove campaign nav + doc picker sheets when leaving campaign context
  if (path !== '/campaign' && path !== '/doc') {
    document.getElementById('campaignBottomNav')?.remove();
    document.getElementById('campMoreSheet')?.remove();
    document.getElementById('aishaSheet')?.remove();
    document.getElementById('campInfoSheet')?.remove();
    document.getElementById('campPlanSheet')?.remove();
  }
  if (path !== '/doc') {
    document.getElementById('docPickerSheet')?.remove();
    document.getElementById('docSectionPicker')?.remove();
  }

  if (path === '/' || path === '') {
    app.innerHTML = pageHome();
    bindHomeDock();
  } else if (path === '/brand') {
    app.innerHTML = pageBrandWorkspace(params.id);
  } else if (path === '/phase') {
    app.innerHTML = pageCurrentPhase(params.id);
  } else if (path === '/overview') {
    app.innerHTML = pageOverview(params.id);
  } else if (path === '/platform') {
    app.innerHTML = pagePlatformStrategy(params.id);
  } else if (path === '/season') {
    app.innerHTML = pageSeason(params.id);
  } else if (path === '/vault') {
    app.innerHTML = pageIdeaVault(params.id);
  } else if (path === '/inspiration') {
    app.innerHTML = pageInspiration(params.id);
  } else if (path === '/campaign') {
    app.innerHTML = pageCampaign(params.brandId, params.id);
  } else if (path === '/doc') {
    app.innerHTML = pageDoc(params.brandId, params.campId, params.type);
  } else {
    app.innerHTML = pageHome();
  }

  const page = app.querySelector('.page');
  if (page) page.scrollTop = 0;

  bindCapture();
  bindNav();
  bindAddBrand();
  if (path === '/brand') { bindEditBrand(params.id); bindDropdowns(params.id); }
  if (path === '/campaign') { bindCampaignPage(params.brandId, params.id); }
  if (path === '/doc') { bindDoc(params.brandId, params.campId, params.type); }
}

/* ── Bind all nav links ── */
function bindNav() {
  document.querySelectorAll('[data-href]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.href);
    });
  });

  document.getElementById('openAddBrand')?.addEventListener('click', () => {
    const overlay = document.getElementById('addBrandOverlay');
    if (overlay) overlay.style.display = 'flex';
  });
}

/* ── Dropdown section cards ── */
function bindDropdowns(brandId) {
  document.querySelectorAll('.dd-card').forEach(card => {
    card.querySelector('.dd-toggle').addEventListener('click', () => {
      const body = card.querySelector('.dd-body');
      const chevron = card.querySelector('.dd-chevron');
      const open = body.style.display === 'none';
      body.style.display = open ? 'block' : 'none';
      chevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
      if (open && card.dataset.dd === 'inspiration') bindInspirationGallery(brandId);
    });
  });
}

function bindInspirationGallery(brandId) {
  const addBtn = document.getElementById('addInspBtn');
  const fileInput = document.getElementById('inspFileInput');
  if (!addBtn || !fileInput || addBtn._bound) return;
  addBtn._bound = true;

  addBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const brand = getBrand(brandId);
        if (!brand) return;
        const item = { id: 'i' + Date.now(), type: 'image', src: ev.target.result };
        brand.inspiration.push(item);
        saveBrandOverride(brandId, { inspiration: [...brand.inspiration] });
        const grid = document.getElementById('inspGrid');
        const addCell = document.getElementById('addInspBtn');
        if (grid && addCell) {
          const cell = document.createElement('div');
          cell.className = 'insp-cell';
          cell.innerHTML = `<img src="${ev.target.result}" loading="lazy">`;
          grid.insertBefore(cell, addCell);
        }
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  });
}

/* ── Bottom Nav ── */
function bottomNavHTML() {
  return `
    <nav class="bottom-nav">
      <button class="nav-btn" id="navHome">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"/>
          <path d="M9 21v-9h6v9"/>
        </svg>
      </button>
      <button class="nav-btn nav-btn-center" id="navCapture">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L4 13h7l-1 9 10-12h-7z"/>
        </svg>
      </button>
      <button class="nav-btn" id="navSettings">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
    </nav>
  `;
}

/* ── Home view state ── */
let _homeView = 'campaigns';
let _campFilter = 'date';

/* ── Aisha AI state ── */
let _aishaCampKey = '';
let _aishaMessages = []; // { role: 'aisha'|'user', text }
let _aishaWizardStep = -1; // -1=idle, 0-6=wizard, 7=done
let _aishaAnswers = {};
let _aishaGenerated = null; // { strategy, contentPlan }

const AISHA_WIZARD_QS = [
  { id: 'goal', q: "What's the main goal of this campaign?", multi: false,
    options: ['Grow awareness', 'Launch something new', 'Build community', 'Drive sales', 'Re-engage audience', 'Educate my audience'] },
  { id: 'audience', q: "Who's the primary audience we're speaking to?", multi: false,
    options: ['Existing followers', 'New audience', 'Warm leads', 'Brand community', 'General public', 'Niche community'] },
  { id: 'message', q: "What's the core message or theme?", multi: false,
    options: ['Inspirational', 'Educational', 'Behind-the-scenes', 'Product launch', 'Community-first', 'Story-driven'] },
  { id: 'platforms', q: "Which platforms will this live on? (tap all that apply)", multi: true,
    options: ['Instagram', 'TikTok', 'YouTube', 'Threads', 'Twitter / X', 'Email', 'LinkedIn'] },
  { id: 'content', q: "What content types are you planning? (tap all that apply)", multi: true,
    options: ['Reels', 'Carousels', 'Stories', 'Static posts', 'Long-form video', 'Email newsletter', 'Threads / tweets'] },
  { id: 'cta', q: "What's the key call to action?", multi: false,
    options: ['Follow / Subscribe', 'Shop now', 'Sign up', 'Share & tag', 'Save for later', 'Visit website', 'DM us'] },
  { id: 'milestones', q: "Any specific timing or milestones?", multi: false,
    options: ['No specific dates', 'Weekly drops', 'Monthly cadence', 'Event-based', 'Launch day', 'Skip for now'] },
];
let _aishaSelectedOpts = [];

/* ── Icon crop state ── */
let _iconCrop = { naturalW:0, naturalH:0, scale:1, minScale:1, offsetX:0, offsetY:0, cropW:0, cropH:0 };

/* ═══════════════════════════════════════
   SETTINGS MODAL
═══════════════════════════════════════ */
const SETTINGS_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok',    label: 'TikTok'    },
  { id: 'youtube',   label: 'YouTube'   },
  { id: 'threads',   label: 'Threads'   },
  { id: 'twitter',   label: 'Twitter / X' },
  { id: 'facebook',  label: 'Facebook'  },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'snapchat',  label: 'Snapchat'  },
  { id: 'email',     label: 'Email Newsletter' },
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'patreon',   label: 'Patreon'   },
];

function openSettings() {
  // Re-use existing overlay if already mounted
  let overlay = document.getElementById('settingsOverlay');
  if (overlay) { overlay.style.display = 'flex'; _populateSettings(); return; }

  const savedLinks  = JSON.parse(localStorage.getItem('gc_social_links') || '{}');
  const savedBanner = localStorage.getItem('gc_profile_banner') || '';

  const socialRows = SETTINGS_PLATFORMS.map(p => `
    <div class="settings-social-row">
      <label class="settings-social-label">${p.label}</label>
      <input class="settings-social-input" data-platform="${p.id}" placeholder="handle or URL" value="${savedLinks[p.id] || ''}">
    </div>`).join('');

  const el = document.createElement('div');
  el.innerHTML = `
    <div class="settings-overlay" id="settingsOverlay">
      <div class="settings-modal">

        <div class="settings-modal-header">
          <div class="settings-modal-title">Settings</div>
          <button class="settings-modal-close" id="settingsClose">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="settings-section">
          <div class="settings-section-label">BANNER IMAGE</div>
          <div class="settings-banner-area" id="settingsBannerArea" style="${savedBanner ? `background-image:url(${savedBanner})` : ''}">
            ${savedBanner ? '' : '<div class="settings-banner-placeholder">Tap to add banner photo</div>'}
          </div>
          <input type="file" id="settingsBannerInput" accept="image/*" style="display:none">
        </div>

        <div class="settings-section">
          <div class="settings-section-label">SOCIAL MEDIA</div>
          ${socialRows}
          <button class="settings-save-btn" id="settingsSaveSocial">Save</button>
        </div>

        <div class="settings-section">
          <div class="settings-section-label">DATA</div>
          <button class="settings-row" id="settingsExport">
            <span>Export All Data</span><span class="settings-row-arrow">›</span>
          </button>
          <button class="settings-row settings-row-danger" id="settingsClearData">
            <span>Clear All Data</span><span class="settings-row-arrow">›</span>
          </button>
        </div>

        <div class="settings-section" style="padding-bottom:20px">
          <div class="settings-section-label">ABOUT</div>
          <div class="settings-row" style="cursor:default">
            <span>Grandure Connect</span><span class="settings-row-val">v2.0</span>
          </div>
        </div>

      </div>
    </div>`;
  document.body.appendChild(el.firstElementChild);
  overlay = document.getElementById('settingsOverlay');

  const close = () => { overlay.style.display = 'none'; };

  document.getElementById('settingsClose')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // Banner image upload
  const bannerArea  = document.getElementById('settingsBannerArea');
  const bannerInput = document.getElementById('settingsBannerInput');
  bannerArea.addEventListener('click', () => bannerInput.click());
  bannerInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      localStorage.setItem('gc_profile_banner', ev.target.result);
      bannerArea.style.backgroundImage = `url(${ev.target.result})`;
      bannerArea.querySelector('.settings-banner-placeholder')?.remove();
    };
    reader.readAsDataURL(file);
  });

  // Social media save
  document.getElementById('settingsSaveSocial')?.addEventListener('click', () => {
    const links = {};
    overlay.querySelectorAll('.settings-social-input').forEach(inp => {
      if (inp.value.trim()) links[inp.dataset.platform] = inp.value.trim();
    });
    localStorage.setItem('gc_social_links', JSON.stringify(links));
    close();
  });

  // Export
  document.getElementById('settingsExport')?.addEventListener('click', () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('gc_')) data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'grandure-connect-backup.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // Clear data
  document.getElementById('settingsClearData')?.addEventListener('click', () => {
    if (!confirm('Clear all data? This cannot be undone.')) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('gc_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    close();
    navigate('/');
  });

  overlay.style.display = 'flex';
}

function _populateSettings() {
  const savedLinks  = JSON.parse(localStorage.getItem('gc_social_links') || '{}');
  const savedBanner = localStorage.getItem('gc_profile_banner') || '';
  document.querySelectorAll('.settings-social-input').forEach(inp => {
    inp.value = savedLinks[inp.dataset.platform] || '';
  });
  const area = document.getElementById('settingsBannerArea');
  if (area) {
    area.style.backgroundImage = savedBanner ? `url(${savedBanner})` : '';
    if (!savedBanner && !area.querySelector('.settings-banner-placeholder')) {
      area.innerHTML = '<div class="settings-banner-placeholder">Tap to add banner photo</div>';
    }
  }
}

/* ── Idea Capture Modal ── */
let captureState = { platform: '', format: '', brandId: '' };

function captureModalHTML() {
  return `
    <div class="capture-overlay" id="captureOverlay" style="display:none">
      <div class="capture-sheet">
        <div class="capture-handle"></div>
        <div class="capture-title">New Idea</div>
        <textarea class="capture-textarea" id="captureText" placeholder="What's the idea?"></textarea>
        <div class="capture-section-label">PLATFORM</div>
        <div class="capture-chips" id="capturePlatformChips">
          ${['instagram','threads','youtube','tiktok'].map(p =>
            `<button class="capture-chip" data-platform="${p}">${PLATFORM_LABELS[p]}</button>`
          ).join('')}
        </div>
        <div class="capture-section-label">FORMAT</div>
        <div class="capture-chips" id="captureFormatChips">
          ${['Reel','Carousel','Thread','Long-form','Short','Live'].map(f =>
            `<button class="capture-chip" data-format="${f}">${f}</button>`
          ).join('')}
        </div>
        <div class="capture-actions">
          <button class="capture-cancel" id="captureCancel">Cancel</button>
          <button class="capture-save" id="captureSave">Save Idea</button>
        </div>
      </div>
    </div>
  `;
}

function pageChrome() {
  return captureModalHTML() + bottomNavHTML();
}

function homeDockHTML() {
  return `
    <nav class="bottom-nav" id="homeDock">
      <button class="nav-btn" id="dockCampaigns">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <button class="nav-btn nav-btn-center" id="dockCapture">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L4 13h7l-1 9 10-12h-7z"/>
        </svg>
      </button>
      <button class="nav-btn" id="dockBrands">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      </button>
    </nav>
  `;
}

function bindCapture() {
  const overlay = document.getElementById('captureOverlay');
  if (!overlay) return;

  const open = () => { overlay.style.display = 'flex'; };
  const close = () => { overlay.style.display = 'none'; };

  document.getElementById('navCapture')?.addEventListener('click', open);
  document.getElementById('dockCapture')?.addEventListener('click', open);
  document.getElementById('captureCancel')?.addEventListener('click', close);

  document.getElementById('navHome')?.addEventListener('click', () => navigate('/'));

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.querySelectorAll('[data-platform]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-platform]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      captureState.platform = btn.dataset.platform;
    });
  });

  document.querySelectorAll('[data-format]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-format]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      captureState.format = btn.dataset.format;
    });
  });

  document.getElementById('captureSave')?.addEventListener('click', () => {
    const text = document.getElementById('captureText')?.value.trim();
    if (text) {
      alert(`Saved: "${text}"`);
      document.getElementById('captureText').value = '';
      close();
    }
  });
}

/* ═══════════════════════════════════════
   PAGE: HOME
═══════════════════════════════════════ */
const BRAND_COLORS = [
  { label: 'Ocean',    value: 'linear-gradient(135deg, #5B9BD5, #3A7BC8)' },
  { label: 'Midnight', value: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' },
  { label: 'Cobalt',   value: 'linear-gradient(135deg, #2952CC, #1a3a99)' },
  { label: 'Forest',   value: 'linear-gradient(135deg, #1a4a2e, #2d7a4f)' },
  { label: 'Ember',    value: 'linear-gradient(135deg, #7a2020, #cc4a1a)' },
  { label: 'Plum',     value: 'linear-gradient(135deg, #4a1a7a, #7a2dcc)' },
];

function addBrandSheetHTML() {
  return `
    <div class="capture-overlay" id="addBrandOverlay" style="display:none">
      <div class="capture-sheet">
        <div class="capture-handle"></div>
        <div class="capture-title">New Profile</div>

        <div class="capture-section-label">BRAND NAME</div>
        <input id="addBrandName" type="text" placeholder="e.g. Brand Name"
          style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);
                 border-radius:14px;padding:14px;color:#fff;font-size:15px;
                 font-family:inherit;margin-bottom:20px;outline:none;">

        <div class="capture-actions">
          <button class="capture-cancel" id="addBrandCancel">Cancel</button>
          <button class="capture-save" id="addBrandSave">Add Profile</button>
        </div>
      </div>
    </div>
  `;
}

function bindAddBrand() {
  const overlay = document.getElementById('addBrandOverlay');
  if (!overlay) return;

  document.getElementById('addBrandCancel')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  document.getElementById('addBrandSave')?.addEventListener('click', () => {
    const name = document.getElementById('addBrandName')?.value.trim();
    if (!name) { document.getElementById('addBrandName').focus(); return; }
    const newBrand = {
      id: String(Date.now()),
      name,
      tagline: '',
      banner: BRAND_COLORS[0].value,
      stats: [],
      currentPhase: { name: 'Getting Started', next: 'TBD', progress: 0, postsCompleted: 0, totalPosts: 0, eosDate: '—' },
      overview: { mission: '', positioning: '', audience: '', contentPillars: [], brandVoice: '', keywords: [], offers: [] },
      platformStrategy: {},
      campaigns: [],
      season: { name: '', goal: '', pillars: [], roadmap: [] },
      board: { ideas: [], drafting: [], ready: [], posted: [] },
      inspiration: [],
      ideas: [],
    };
    BRANDS.push(newBrand);
    saveCustomBrands();
    overlay.style.display = 'none';
    document.getElementById('app').innerHTML = pageHome();
    bindHomeDock(); bindCapture(); bindNav(); bindAddBrand();
  });
}

function pageHome() {
  const bannerStyle = b => b.banner.startsWith('data:') || b.banner.startsWith('http')
    ? `background:url('${b.banner}') center/cover no-repeat`
    : `background:${b.banner}`;

  const brandGrid = BRANDS.map(brand => `
    <div class="home-brand-cell" data-href="#/brand?id=${brand.id}">
      <div class="home-brand-img" style="${bannerStyle(brand)}"></div>
      <div class="home-brand-label">${brand.name}</div>
    </div>
  `).join('');

  const allCampaigns = [];
  BRANDS.forEach(brand => {
    (brand.campaigns || []).forEach(c => allCampaigns.push({ campaign: c, brand }));
  });

  const getPct = ({ campaign, brand }) => {
    const isCurrent = campaign.status === 'active' && campaign.name === brand.currentPhase.name;
    return campaign.progress != null ? campaign.progress : (isCurrent ? brand.currentPhase.progress : 0);
  };
  const sorted = [...allCampaigns];
  if (_campFilter === 'brand') sorted.sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  if (_campFilter === 'pct')   sorted.sort((a, b) => getPct(b) - getPct(a));

  const filterLabel = { date: 'Date', brand: 'Brand', pct: '% Complete' }[_campFilter];

  const campCards = sorted.length ? sorted.map(({ campaign, brand }) => {
    const isCurrentPhase = campaign.status === 'active' && campaign.name === brand.currentPhase.name;
    const pct = getPct({ campaign, brand });
    const postsCompleted = isCurrentPhase ? brand.currentPhase.postsCompleted : 0;
    const totalPosts     = isCurrentPhase ? brand.currentPhase.totalPosts : 0;
    const postLabel = totalPosts > 0 ? `${postsCompleted} / ${totalPosts} posts` : '0 posts';
    const upcomingVal = campaign.status === 'active'
      ? (brand.board.ready[0]?.title || brand.board.drafting[0]?.title || '—')
      : `Starts ${campaign.startDate}`;
    const cb = campaign.banner;
    const campBannerStyle = cb
      ? (cb.startsWith('data:') || cb.startsWith('http') ? `background:url('${cb}') center/cover no-repeat` : `background:${cb}`)
      : bannerStyle(brand);
    const iconContent = brand.icon
      ? `<img src="${brand.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : brand.name[0].toUpperCase();
    const iconBg = brand.icon ? 'background:rgba(255,255,255,0.07)'
      : (brand.banner.startsWith('data:') || brand.banner.startsWith('http') ? 'background:rgba(255,255,255,0.15)' : `background:${brand.banner}`);
    return `
      <div class="home-camp-brand-header">
        <div class="home-camp-brand-icon" style="${iconBg}">${iconContent}</div>
        <span class="home-camp-brand-header-name">${brand.name}</span>
      </div>
      <div class="swipe-wrap" data-camp-id="${campaign.id}" data-brand-id="${brand.id}">
        <div class="swipe-row">
          <div class="home-camp-card" data-href="#/campaign?brandId=${brand.id}&id=${campaign.id}">
            <div class="home-camp-banner" style="${campBannerStyle}"></div>
            <div class="home-camp-body">
              <div class="home-camp-top">
                <div class="home-camp-left">
                  <div class="home-camp-name">${campaign.name}</div>
                  <div class="home-camp-dates">${campaign.startDate} – ${campaign.endDate}</div>
                </div>
                <div class="home-camp-right">
                  <div class="home-camp-next-label">NEXT UP</div>
                  <div class="home-camp-next-val">${upcomingVal}</div>
                </div>
              </div>
              <div class="home-camp-prog-track">
                <div class="home-camp-prog-fill" style="width:${pct}%"></div>
              </div>
              <div class="home-camp-bottom">
                <div class="home-camp-count">${postLabel}</div>
                <div class="home-camp-pct">${pct}%</div>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <button class="card-action-btn card-action-edit">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="card-action-btn card-action-delete">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('') : `<div style="color:#333;font-size:13px;padding:20px 0;text-align:center">No campaigns yet</div>`;

  const campViewHTML = `
    <div class="camp-filter-bar">
      <span class="camp-filter-label">Sort by</span>
      <div style="position:relative">
        <button class="camp-filter-toggle" id="campFilterBtn">
          ${filterLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="camp-filter-menu" id="campFilterMenu" style="display:none">
          <button class="camp-filter-opt${_campFilter === 'date' ? ' active' : ''}" data-cf="date">Date</button>
          <button class="camp-filter-opt${_campFilter === 'brand' ? ' active' : ''}" data-cf="brand">Brand</button>
          <button class="camp-filter-opt${_campFilter === 'pct' ? ' active' : ''}" data-cf="pct">% Complete</button>
        </div>
      </div>
    </div>
    ${campCards}
  `;

  return `
    <div class="page" style="padding-bottom:110px">
      <div class="top-header">
        <div class="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </div>
        <div class="logo-wrap">
          <img src="img/grandure-connect.png" alt="Grandure Connect" class="logo-img">
        </div>
        <div style="position:relative">
          <button class="icon-btn" id="openAddMenu" style="font-size:22px;font-weight:200">+</button>
          <div class="add-menu" id="addMenu" style="display:none">
            <button class="add-menu-item" id="menuAddCampaign">Campaign</button>
            <button class="add-menu-item" id="menuAddContent">Content</button>
            <button class="add-menu-item" id="menuAddBrand">Brand</button>
          </div>
        </div>
      </div>
      <div class="home-brand-grid" id="homeBrandsView">${brandGrid}</div>
      <div class="home-camp-list" id="homeCampsView" style="display:none">${campViewHTML}</div>
    </div>
    ${captureModalHTML()}
    ${addBrandSheetHTML()}
    <div id="editPhotoMount"></div>
    ${homeDockHTML()}
  `;
}

/* ── Home Dock ── */
function bindHomeDock() {
  const brandsView = document.getElementById('homeBrandsView');
  const campsView  = document.getElementById('homeCampsView');
  const dockBrands = document.getElementById('dockBrands');
  const dockCamps  = document.getElementById('dockCampaigns');

  function showView(v) {
    _homeView = v;
    if (brandsView) brandsView.style.display = v === 'brands' ? 'grid' : 'none';
    if (campsView)  campsView.style.display  = v === 'campaigns' ? 'block' : 'none';
    dockBrands?.classList.toggle('nav-active', v === 'brands');
    dockCamps?.classList.toggle('nav-active', v === 'campaigns');
  }

  showView(_homeView);

  dockBrands?.addEventListener('click', () => showView('brands'));
  dockCamps?.addEventListener('click', () => showView('campaigns'));

  const openAddMenu = document.getElementById('openAddMenu');
  const addMenu     = document.getElementById('addMenu');

  openAddMenu?.addEventListener('click', e => {
    e.stopPropagation();
    if (addMenu) addMenu.style.display = addMenu.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', function closeMenu() {
    if (addMenu) addMenu.style.display = 'none';
    document.removeEventListener('click', closeMenu);
  });

  document.getElementById('menuAddBrand')?.addEventListener('click', e => {
    e.stopPropagation();
    if (addMenu) addMenu.style.display = 'none';
    const overlay = document.getElementById('addBrandOverlay');
    if (overlay) overlay.style.display = 'flex';
  });

  document.getElementById('menuAddCampaign')?.addEventListener('click', e => {
    e.stopPropagation();
    if (addMenu) addMenu.style.display = 'none';
  });

  document.getElementById('menuAddContent')?.addEventListener('click', e => {
    e.stopPropagation();
    if (addMenu) addMenu.style.display = 'none';
  });

  document.getElementById('campFilterBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    const menu = document.getElementById('campFilterMenu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });

  document.querySelectorAll('[data-cf]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      _campFilter = btn.dataset.cf;
      document.getElementById('app').innerHTML = pageHome();
      bindHomeDock(); bindCapture(); bindNav(); bindAddBrand();
    });
  });

  bindCampSwipe();
}

function bindCampSwipe() {
  const ACTION_W = 148;
  document.querySelectorAll('#homeCampsView .swipe-wrap').forEach(wrap => {
    const row     = wrap.querySelector('.swipe-row');
    const card    = wrap.querySelector('.home-camp-card');
    const campId  = wrap.dataset.campId;
    const brandId = wrap.dataset.brandId;
    const w = wrap.offsetWidth || (document.getElementById('app').offsetWidth - 32);
    card.style.minWidth = w + 'px';

    let startX = 0, startY = 0, curX = 0, isOpen = false, dragging = false;

    row.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dragging = true;
      row.style.transition = 'none';
    }, { passive: true });

    row.addEventListener('touchmove', e => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!isOpen && Math.abs(dy) > Math.abs(dx) + 4) { dragging = false; return; }
      e.preventDefault();
      curX = Math.max(-ACTION_W, Math.min(0, (isOpen ? -ACTION_W : 0) + dx));
      row.style.transform = `translateX(${curX}px)`;
    }, { passive: false });

    row.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      row.style.transition = 'transform 0.26s cubic-bezier(.25,.46,.45,.94)';
      isOpen = curX < -ACTION_W * 0.35;
      row.style.transform = isOpen ? `translateX(-${ACTION_W}px)` : 'translateX(0)';
    });

    card.addEventListener('click', e => {
      if (isOpen) {
        e.stopImmediatePropagation();
        e.preventDefault();
        row.style.transition = 'transform 0.26s cubic-bezier(.25,.46,.45,.94)';
        row.style.transform = 'translateX(0)';
        isOpen = false;
      }
    });

    wrap.querySelector('.card-action-edit').addEventListener('click', () => {
      openEditCampaignPhoto(brandId, campId);
    });

    wrap.querySelector('.card-action-delete').addEventListener('click', () => {
      const brand = getBrand(brandId);
      if (brand) {
        const idx = brand.campaigns.findIndex(c => c.id === campId);
        if (idx !== -1) brand.campaigns.splice(idx, 1);
        saveBrandOverride(brandId, { campaigns: [...brand.campaigns] });
      }
      document.getElementById('app').innerHTML = pageHome();
      bindHomeDock(); bindCapture(); bindNav(); bindAddBrand();
    });
  });
}

function openEditCampaignPhoto(brandId, campId) {
  const mount = document.getElementById('editPhotoMount');
  if (!mount) return;
  mount.innerHTML = editPhotoCropSheetHTML();

  const overlay     = document.getElementById('editPhotoOverlay');
  const cropWin     = document.getElementById('cropWindow');
  const cropImg     = document.getElementById('cropImg');
  const placeholder = document.getElementById('cropPlaceholder');
  const fileInput   = document.getElementById('cropFileInput');

  overlay.style.display = 'flex';
  _cropState.brandId = brandId;

  const brand    = getBrand(brandId);
  const campaign = brand?.campaigns.find(c => c.id === campId);
  if (campaign?.banner && (campaign.banner.startsWith('data:') || campaign.banner.startsWith('http'))) {
    cropImg.src = campaign.banner;
    cropImg.style.display = 'block';
    placeholder.style.display = 'none';
    const setup = () => _initCrop(cropWin.offsetWidth, cropWin.offsetHeight);
    cropImg.complete ? setup() : (cropImg.onload = setup);
  }

  const loadFile = file => {
    const reader = new FileReader();
    reader.onload = ev => {
      cropImg.src = ev.target.result;
      cropImg.style.display = 'block';
      placeholder.style.display = 'none';
      cropImg.onload = () => _initCrop(cropWin.offsetWidth, cropWin.offsetHeight);
    };
    reader.readAsDataURL(file);
  };

  document.getElementById('cropPickBtn').addEventListener('click', () => fileInput.click());
  placeholder.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });
  document.getElementById('editPhotoCancel').addEventListener('click', () => { overlay.style.display = 'none'; });

  document.getElementById('editPhotoSave').addEventListener('click', () => {
    const dataUrl = _exportCrop();
    if (dataUrl && brand) {
      const campaigns = brand.campaigns.map(c => c.id === campId ? { ...c, banner: dataUrl } : c);
      saveBrandOverride(brandId, { campaigns });
      document.getElementById('app').innerHTML = pageHome();
      bindHomeDock(); bindCapture(); bindNav(); bindAddBrand();
    } else {
      overlay.style.display = 'none';
    }
  });

  let lastTouches = null;
  cropWin.addEventListener('touchstart', e => {
    if (e.target.closest('#cropPlaceholder')) return;
    e.preventDefault();
    lastTouches = Array.from(e.touches);
  }, { passive: false });
  cropWin.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = Array.from(e.touches);
    if (t.length === 1 && lastTouches?.length >= 1) {
      _cropState.offsetX += t[0].clientX - lastTouches[0].clientX;
      _cropState.offsetY += t[0].clientY - lastTouches[0].clientY;
    } else if (t.length === 2 && lastTouches?.length >= 2) {
      const prev = Math.hypot(lastTouches[1].clientX - lastTouches[0].clientX, lastTouches[1].clientY - lastTouches[0].clientY);
      const curr = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      _cropState.scale = Math.max(_cropState.minScale, Math.min(8, _cropState.scale * (curr / prev)));
    }
    lastTouches = t;
    _clampCrop(); _applyCrop();
  }, { passive: false });
  cropWin.addEventListener('touchend', e => { lastTouches = Array.from(e.touches); });
}

function openEditHeroPhoto(brandId, campId) {
  const mount = document.getElementById('editPhotoMount');
  if (!mount) return;
  mount.innerHTML = editPhotoCropSheetHTML();

  const overlay     = document.getElementById('editPhotoOverlay');
  const cropWin     = document.getElementById('cropWindow');
  const cropImg     = document.getElementById('cropImg');
  const placeholder = document.getElementById('cropPlaceholder');
  const fileInput   = document.getElementById('cropFileInput');

  // Use landscape crop ratio for the hero card
  if (cropWin) cropWin.style.aspectRatio = '16/9';

  overlay.style.display = 'flex';

  const brand    = getBrand(brandId);
  const campaign = brand?.campaigns.find(c => c.id === campId);
  if (campaign?.heroImage && (campaign.heroImage.startsWith('data:') || campaign.heroImage.startsWith('http'))) {
    cropImg.src = campaign.heroImage;
    cropImg.style.display = 'block';
    placeholder.style.display = 'none';
    const setup = () => _initCrop(cropWin.offsetWidth, cropWin.offsetHeight);
    cropImg.complete ? setup() : (cropImg.onload = setup);
  }

  const loadFile = file => {
    const reader = new FileReader();
    reader.onload = ev => {
      cropImg.src = ev.target.result;
      cropImg.style.display = 'block';
      placeholder.style.display = 'none';
      cropImg.onload = () => _initCrop(cropWin.offsetWidth, cropWin.offsetHeight);
    };
    reader.readAsDataURL(file);
  };

  document.getElementById('cropPickBtn').addEventListener('click', () => fileInput.click());
  placeholder.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });
  document.getElementById('editPhotoCancel').addEventListener('click', () => { overlay.style.display = 'none'; });

  document.getElementById('editPhotoSave').addEventListener('click', () => {
    const dataUrl = _exportCrop();
    if (dataUrl && brand) {
      const campaigns = brand.campaigns.map(c => c.id === campId ? { ...c, heroImage: dataUrl } : c);
      saveBrandOverride(brandId, { campaigns });
      document.getElementById('app').innerHTML = pageCampaign(brandId, campId);
      bindCampaignPage(brandId, campId);
    } else {
      overlay.style.display = 'none';
    }
  });

  let lastTouches = null;
  cropWin.addEventListener('touchstart', e => {
    if (e.target.closest('#cropPlaceholder')) return;
    e.preventDefault();
    lastTouches = Array.from(e.touches);
  }, { passive: false });
  cropWin.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = Array.from(e.touches);
    if (t.length === 1 && lastTouches?.length >= 1) {
      _cropState.offsetX += t[0].clientX - lastTouches[0].clientX;
      _cropState.offsetY += t[0].clientY - lastTouches[0].clientY;
    } else if (t.length === 2 && lastTouches?.length >= 2) {
      const prev = Math.hypot(lastTouches[1].clientX - lastTouches[0].clientX, lastTouches[1].clientY - lastTouches[0].clientY);
      const curr = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      _cropState.scale = Math.max(_cropState.minScale, Math.min(8, _cropState.scale * (curr / prev)));
    }
    lastTouches = t;
    _clampCrop(); _applyCrop();
  }, { passive: false });
  cropWin.addEventListener('touchend', e => { lastTouches = Array.from(e.touches); });
}

/* ── Icon Crop Sheet ── */
function editIconCropSheetHTML() {
  return `
    <div class="capture-overlay" id="iconCropOverlay" style="display:none">
      <div class="capture-sheet" style="padding:0;overflow:hidden;border-radius:28px 28px 0 0">
        <div style="padding:20px 24px 12px">
          <div class="capture-handle"></div>
          <div class="capture-title" style="margin-bottom:4px">Crop Icon</div>
          <div style="color:#555;font-size:12px;letter-spacing:.5px">Drag to position · Pinch to zoom</div>
        </div>
        <div id="iconCropWindow" style="position:relative;width:100%;aspect-ratio:1;overflow:hidden;background:#0d0d0d;touch-action:none;display:flex;align-items:center;justify-content:center">
          <img id="iconCropImg" style="position:absolute;touch-action:none;user-select:none;-webkit-user-select:none;pointer-events:none;display:none">
          <div id="iconCropPlaceholder" style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#3a3a3a;font-size:13px;cursor:pointer">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <span>Tap to choose photo</span>
          </div>
        </div>
        <div style="padding:16px 24px 36px">
          <input type="file" id="iconCropFileInput" accept="image/*" style="display:none">
          <button id="iconCropPickBtn" class="capture-cancel" style="width:100%;margin-bottom:12px">Change Image</button>
          <div class="capture-actions">
            <button class="capture-cancel" id="iconCropCancel">Cancel</button>
            <button class="capture-save" id="iconCropSave">Save Icon</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openEditIconPhoto(sourceDataUrl, onSave) {
  let mount = document.getElementById('iconCropMount');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'iconCropMount';
    (document.getElementById('app') || document.body).appendChild(mount);
  }
  mount.innerHTML = editIconCropSheetHTML();

  const overlay     = document.getElementById('iconCropOverlay');
  const cropWin     = document.getElementById('iconCropWindow');
  const cropImg     = document.getElementById('iconCropImg');
  const placeholder = document.getElementById('iconCropPlaceholder');
  const fileInput   = document.getElementById('iconCropFileInput');

  overlay.style.display = 'flex';

  function initCrop() {
    const sz = cropWin.offsetWidth;
    _iconCrop.cropW = sz; _iconCrop.cropH = sz;
    _iconCrop.naturalW = cropImg.naturalWidth; _iconCrop.naturalH = cropImg.naturalHeight;
    const min = Math.max(sz / cropImg.naturalWidth, sz / cropImg.naturalHeight);
    _iconCrop.minScale = min; _iconCrop.scale = min;
    _iconCrop.offsetX = 0; _iconCrop.offsetY = 0;
    applyCrop();
  }

  function applyCrop() {
    const { naturalW, naturalH, scale, offsetX, offsetY, cropW, cropH } = _iconCrop;
    const dw = naturalW * scale, dh = naturalH * scale;
    cropImg.style.width  = dw + 'px';
    cropImg.style.height = dh + 'px';
    cropImg.style.left   = ((cropW - dw) / 2 + offsetX) + 'px';
    cropImg.style.top    = ((cropH - dh) / 2 + offsetY) + 'px';
  }

  function clampCrop() {
    const { naturalW, naturalH, scale, cropW, cropH } = _iconCrop;
    const dw = naturalW * scale, dh = naturalH * scale;
    const maxX = Math.max(0, (dw - cropW) / 2);
    const maxY = Math.max(0, (dh - cropH) / 2);
    _iconCrop.offsetX = Math.max(-maxX, Math.min(maxX, _iconCrop.offsetX));
    _iconCrop.offsetY = Math.max(-maxY, Math.min(maxY, _iconCrop.offsetY));
  }

  function exportCrop() {
    if (cropImg.style.display === 'none') return null;
    const { naturalW, naturalH, scale, offsetX, offsetY, cropW, cropH } = _iconCrop;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const canvas = document.createElement('canvas');
    canvas.width = cropW * dpr; canvas.height = cropH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const dw = naturalW * scale, dh = naturalH * scale;
    ctx.drawImage(cropImg, (cropW - dw) / 2 + offsetX, (cropH - dh) / 2 + offsetY, dw, dh);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  const loadSrc = src => {
    cropImg.src = src;
    cropImg.style.display = 'block';
    placeholder.style.display = 'none';
    cropImg.onload = () => initCrop();
  };

  if (sourceDataUrl) loadSrc(sourceDataUrl);

  document.getElementById('iconCropPickBtn').addEventListener('click', () => fileInput.click());
  placeholder.addEventListener('click', () => fileInput.click());
  placeholder.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener('change', e => { if (e.target.files[0]) { const r = new FileReader(); r.onload = ev => loadSrc(ev.target.result); r.readAsDataURL(e.target.files[0]); } });

  document.getElementById('iconCropCancel').addEventListener('click', () => { overlay.style.display = 'none'; });

  document.getElementById('iconCropSave').addEventListener('click', () => {
    const dataUrl = exportCrop();
    overlay.style.display = 'none';
    if (dataUrl) onSave(dataUrl);
  });

  let lastTouches = null;
  cropWin.addEventListener('touchstart', e => {
    if (e.target.closest('#iconCropPlaceholder')) return;
    e.preventDefault();
    lastTouches = Array.from(e.touches);
  }, { passive: false });

  cropWin.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = Array.from(e.touches);
    if (t.length === 1 && lastTouches?.length >= 1) {
      _iconCrop.offsetX += t[0].clientX - lastTouches[0].clientX;
      _iconCrop.offsetY += t[0].clientY - lastTouches[0].clientY;
    } else if (t.length === 2 && lastTouches?.length >= 2) {
      const prev = Math.hypot(lastTouches[1].clientX - lastTouches[0].clientX, lastTouches[1].clientY - lastTouches[0].clientY);
      const curr = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      _iconCrop.scale = Math.max(_iconCrop.minScale, Math.min(8, _iconCrop.scale * (curr / prev)));
    }
    lastTouches = t;
    clampCrop(); applyCrop();
  }, { passive: false });

  cropWin.addEventListener('touchend', e => { lastTouches = Array.from(e.touches); });
}

/* ── Edit Photo / Crop Sheet ── */
function editPhotoCropSheetHTML() {
  return `
    <div class="capture-overlay" id="editPhotoOverlay" style="display:none">
      <div class="capture-sheet" style="padding:0;overflow:hidden;border-radius:28px 28px 0 0">
        <div style="padding:20px 24px 12px">
          <div class="capture-handle"></div>
          <div class="capture-title" style="margin-bottom:4px">Edit Photo</div>
          <div style="color:#555;font-size:12px;letter-spacing:.5px">Drag to position · Pinch to zoom</div>
        </div>
        <div class="crop-window" id="cropWindow">
          <img id="cropImg" style="position:absolute;touch-action:none;user-select:none;-webkit-user-select:none;pointer-events:none;display:none">
          <div id="cropPlaceholder" class="crop-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <span>Tap to choose photo</span>
          </div>
        </div>
        <div style="padding:16px 24px 36px">
          <input type="file" id="cropFileInput" accept="image/*" style="display:none">
          <button id="cropPickBtn" class="capture-cancel" style="width:100%;margin-bottom:12px">Change Image</button>
          <div class="capture-actions">
            <button class="capture-cancel" id="editPhotoCancel">Cancel</button>
            <button class="capture-save" id="editPhotoSave">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

let _cropState = { brandId: null, naturalW: 0, naturalH: 0, scale: 1, minScale: 1, offsetX: 0, offsetY: 0, cropW: 0, cropH: 0 };

function _initCrop(cropW, cropH) {
  const img = document.getElementById('cropImg');
  _cropState.naturalW = img.naturalWidth;
  _cropState.naturalH = img.naturalHeight;
  _cropState.cropW = cropW;
  _cropState.cropH = cropH;
  const minScale = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
  _cropState.minScale = minScale;
  _cropState.scale = minScale;
  _cropState.offsetX = 0;
  _cropState.offsetY = 0;
  _applyCrop();
}

function _clampCrop() {
  const { naturalW, naturalH, scale, cropW, cropH } = _cropState;
  const dw = naturalW * scale, dh = naturalH * scale;
  const maxX = Math.max(0, (dw - cropW) / 2);
  const maxY = Math.max(0, (dh - cropH) / 2);
  _cropState.offsetX = Math.max(-maxX, Math.min(maxX, _cropState.offsetX));
  _cropState.offsetY = Math.max(-maxY, Math.min(maxY, _cropState.offsetY));
}

function _applyCrop() {
  const img = document.getElementById('cropImg');
  if (!img) return;
  const { naturalW, naturalH, scale, offsetX, offsetY, cropW, cropH } = _cropState;
  const dw = naturalW * scale, dh = naturalH * scale;
  img.style.width  = dw + 'px';
  img.style.height = dh + 'px';
  img.style.left   = ((cropW - dw) / 2 + offsetX) + 'px';
  img.style.top    = ((cropH - dh) / 2 + offsetY) + 'px';
}

function _exportCrop() {
  const img = document.getElementById('cropImg');
  if (!img || !img.src || img.style.display === 'none') return null;
  const { naturalW, naturalH, scale, offsetX, offsetY, cropW, cropH } = _cropState;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const canvas = document.createElement('canvas');
  canvas.width  = cropW * dpr;
  canvas.height = cropH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const dw = naturalW * scale, dh = naturalH * scale;
  ctx.drawImage(img, (cropW - dw) / 2 + offsetX, (cropH - dh) / 2 + offsetY, dw, dh);
  return canvas.toDataURL('image/jpeg', 0.88);
}

function openEditPhoto(brandId) {
  const mount = document.getElementById('editPhotoMount');
  if (!mount) return;
  mount.innerHTML = editPhotoCropSheetHTML();

  const overlay  = document.getElementById('editPhotoOverlay');
  const cropWin  = document.getElementById('cropWindow');
  const cropImg  = document.getElementById('cropImg');
  const placeholder = document.getElementById('cropPlaceholder');
  const fileInput = document.getElementById('cropFileInput');

  overlay.style.display = 'flex';
  _cropState.brandId = brandId;

  const brand = getBrand(brandId);
  if (brand && (brand.banner.startsWith('data:') || brand.banner.startsWith('http'))) {
    cropImg.src = brand.banner;
    cropImg.style.display = 'block';
    placeholder.style.display = 'none';
    const setup = () => _initCrop(cropWin.offsetWidth, cropWin.offsetHeight);
    cropImg.complete ? setup() : (cropImg.onload = setup);
  }

  const loadFile = file => {
    const reader = new FileReader();
    reader.onload = ev => {
      cropImg.src = ev.target.result;
      cropImg.style.display = 'block';
      placeholder.style.display = 'none';
      cropImg.onload = () => _initCrop(cropWin.offsetWidth, cropWin.offsetHeight);
    };
    reader.readAsDataURL(file);
  };

  document.getElementById('cropPickBtn').addEventListener('click', () => fileInput.click());
  placeholder.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });

  document.getElementById('editPhotoCancel').addEventListener('click', () => { overlay.style.display = 'none'; });

  document.getElementById('editPhotoSave').addEventListener('click', () => {
    const dataUrl = _exportCrop();
    if (dataUrl) {
      saveBrandOverride(brandId, { banner: dataUrl });
      document.getElementById('app').innerHTML = pageHome();
      bindHomeDock(); bindCapture(); bindNav(); bindAddBrand();
    } else {
      overlay.style.display = 'none';
    }
  });

  // Touch pan + pinch
  let lastTouches = null;
  cropWin.addEventListener('touchstart', e => {
    if (e.target.closest('#cropPlaceholder')) return;
    e.preventDefault();
    lastTouches = Array.from(e.touches);
  }, { passive: false });

  cropWin.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = Array.from(e.touches);
    if (t.length === 1 && lastTouches?.length >= 1) {
      _cropState.offsetX += t[0].clientX - lastTouches[0].clientX;
      _cropState.offsetY += t[0].clientY - lastTouches[0].clientY;
    } else if (t.length === 2 && lastTouches?.length >= 2) {
      const prev = Math.hypot(lastTouches[1].clientX - lastTouches[0].clientX, lastTouches[1].clientY - lastTouches[0].clientY);
      const curr = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      _cropState.scale = Math.max(_cropState.minScale, Math.min(8, _cropState.scale * (curr / prev)));
    }
    lastTouches = t;
    _clampCrop();
    _applyCrop();
  }, { passive: false });

  cropWin.addEventListener('touchend', e => { lastTouches = Array.from(e.touches); });
}

/* ── Swipe-to-reveal cards ── */
function bindSwipeCards() {
  const ACTION_W = 148;
  document.querySelectorAll('.swipe-wrap').forEach(wrap => {
    const row   = wrap.querySelector('.swipe-row');
    const card  = wrap.querySelector('.brand-card');
    const brandId = wrap.dataset.brandId;
    card.style.minWidth = wrap.offsetWidth + 'px';

    let startX = 0, startY = 0, curX = 0, isOpen = false, dragging = false;

    row.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dragging = true;
      row.style.transition = 'none';
    }, { passive: true });

    row.addEventListener('touchmove', e => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!isOpen && Math.abs(dy) > Math.abs(dx) + 4) { dragging = false; return; }
      e.preventDefault();
      curX = Math.max(-ACTION_W, Math.min(0, (isOpen ? -ACTION_W : 0) + dx));
      row.style.transform = `translateX(${curX}px)`;
    }, { passive: false });

    row.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      row.style.transition = 'transform 0.26s cubic-bezier(.25,.46,.45,.94)';
      isOpen = curX < -ACTION_W * 0.35;
      row.style.transform = isOpen ? `translateX(-${ACTION_W}px)` : 'translateX(0)';
    });

    card.addEventListener('click', e => {
      if (isOpen) {
        e.stopImmediatePropagation();
        e.preventDefault();
        row.style.transition = 'transform 0.26s cubic-bezier(.25,.46,.45,.94)';
        row.style.transform = 'translateX(0)';
        isOpen = false;
      }
    });

    wrap.querySelector('.card-action-edit').addEventListener('click', () => openEditPhoto(brandId));

    wrap.querySelector('.card-action-delete').addEventListener('click', () => {
      const idx = BRANDS.findIndex(b => b.id === brandId);
      if (idx !== -1) BRANDS.splice(idx, 1);
      saveCustomBrands();
      try {
        const ov = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}');
        delete ov[brandId];
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(ov));
      } catch(e) {}
      document.getElementById('app').innerHTML = pageHome();
      bindHomeDock(); bindCapture(); bindNav(); bindAddBrand();
    });
  });
}

/* ── Edit Brand Sheet ── */
function editBrandSheetHTML(brand) {
  const iconPreview = brand.icon
    ? `<img src="${brand.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : `<span style="font-size:16px;font-weight:800;color:#fff">${brand.name[0].toUpperCase()}</span>`;
  const logoPreviewStyle = brand.logo ? 'display:block' : 'display:none';
  return `
    <div class="capture-overlay" id="editBrandOverlay" style="display:none">
      <div class="capture-sheet">
        <div class="capture-handle"></div>
        <div class="capture-title">Edit Profile</div>

        <div class="capture-section-label">BRAND NAME</div>
        <input id="editBrandName" type="text" value="${brand.name}"
          style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);
                 border-radius:14px;padding:14px;color:#fff;font-size:15px;
                 font-family:inherit;margin-bottom:20px;outline:none;">

        <div class="capture-section-label">BRAND ICON</div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
          <div id="editIconCircle" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
            ${iconPreview}
          </div>
          <label style="flex:1;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:13px 14px;cursor:pointer">
            <div>
              <div style="font-size:14px;font-weight:600">Upload Icon</div>
              <div style="color:#555;font-size:12px;margin-top:2px">Square image</div>
            </div>
            <div style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:15px">&#8679;</div>
            <input type="file" id="editBrandIcon" accept="image/*" style="display:none">
          </label>
        </div>

        <div class="capture-section-label">FULL LOGO</div>
        <label style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.04);
                      border:1px solid rgba(255,255,255,0.08);border-radius:14px;
                      padding:14px;cursor:pointer;margin-bottom:10px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.08);
                      display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
            &#8679;
          </div>
          <div>
            <div style="font-size:14px;font-weight:600">Upload Logo</div>
            <div style="color:#555;font-size:12px;margin-top:2px">JPG or PNG</div>
          </div>
          <input type="file" id="editBrandLogo" accept="image/*" style="display:none">
        </label>
        <div id="editLogoPreview" style="${logoPreviewStyle};margin-bottom:20px">
          <img id="editLogoThumb" src="${brand.logo || ''}" style="width:100%;height:56px;object-fit:contain;border-radius:12px;background:rgba(255,255,255,0.04);padding:6px">
        </div>

        <div class="capture-section-label">CARD IMAGE</div>
        <label style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.04);
                      border:1px solid rgba(255,255,255,0.08);border-radius:14px;
                      padding:14px;cursor:pointer;margin-bottom:12px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.08);
                      display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
            &#8679;
          </div>
          <div>
            <div style="font-size:14px;font-weight:600">Upload Image</div>
            <div style="color:#555;font-size:12px;margin-top:2px">JPG or PNG</div>
          </div>
          <input type="file" id="editBrandImage" accept="image/*" style="display:none">
        </label>
        <div id="editImagePreview" style="display:none;margin-bottom:12px">
          <img id="editImageThumb" style="width:100%;height:100px;object-fit:cover;border-radius:12px;">
        </div>

        <div class="capture-actions">
          <button class="capture-cancel" id="editBrandCancel">Cancel</button>
          <button class="capture-save" id="editBrandSave">Save</button>
        </div>
      </div>
    </div>
  `;
}

function bindEditBrand(id) {
  const overlay = document.getElementById('editBrandOverlay');
  if (!overlay) return;

  let pendingBanner = null;
  let pendingIcon   = null;
  let pendingLogo   = null;

  document.getElementById('openEditBrand')?.addEventListener('click', () => {
    overlay.style.display = 'flex';
  });
  document.getElementById('editBrandCancel')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  const readFile = (inputId, onLoad) => {
    document.getElementById(inputId)?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => onLoad(ev.target.result);
      reader.readAsDataURL(file);
    });
  };

  readFile('editBrandIcon', dataUrl => {
    openEditIconPhoto(dataUrl, croppedUrl => {
      pendingIcon = croppedUrl;
      const circle = document.getElementById('editIconCircle');
      if (circle) circle.innerHTML = `<img src="${croppedUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    });
  });

  readFile('editBrandLogo', dataUrl => {
    pendingLogo = dataUrl;
    document.getElementById('editLogoPreview').style.display = 'block';
    document.getElementById('editLogoThumb').src = dataUrl;
  });

  readFile('editBrandImage', dataUrl => {
    pendingBanner = dataUrl;
    document.getElementById('editImagePreview').style.display = 'block';
    document.getElementById('editImageThumb').src = dataUrl;
  });

  document.getElementById('editBrandSave')?.addEventListener('click', () => {
    const name = document.getElementById('editBrandName')?.value.trim();
    const patch = {};
    if (name)          patch.name   = name;
    if (pendingBanner) patch.banner = pendingBanner;
    if (pendingIcon)   patch.icon   = pendingIcon;
    if (pendingLogo)   patch.logo   = pendingLogo;
    saveBrandOverride(id, patch);
    saveCustomBrands();
    overlay.style.display = 'none';
    document.getElementById('app').innerHTML = pageBrandWorkspace(id);
    bindCapture(); bindNav(); bindAddBrand(); bindEditBrand(id);
  });
}

/* ═══════════════════════════════════════
   PAGE: BRAND WORKSPACE
═══════════════════════════════════════ */
function pageBrandWorkspace(id) {
  const brand = getBrand(id);
  if (!brand) return pageHome();

  const { currentPhase: cp } = brand;

  function dropdownBody(key) {
    const ov = brand.overview;
    const se = brand.season;
    if (key === 'overview') {
      const divider = `<div style="height:1px;background:rgba(255,255,255,0.07);margin:14px 0"></div>`;
      const col2 = `<div style="width:1px;background:rgba(255,255,255,0.07);margin:0 14px;flex-shrink:0"></div>`;
      return `
        <div style="display:flex;align-items:flex-start">
          <div style="flex:1">
            <div class="phase-label" style="margin-bottom:5px">MISSION</div>
            <div class="body-text">${ov.mission || '—'}</div>
          </div>
          ${col2}
          <div style="flex:1">
            <div class="phase-label" style="margin-bottom:5px">POSITIONING</div>
            <div class="body-text">${ov.positioning || '—'}</div>
          </div>
        </div>
        ${divider}
        <div style="display:flex;align-items:flex-start">
          <div style="flex:1">
            <div class="phase-label" style="margin-bottom:5px">AUDIENCE</div>
            <div class="body-text">${ov.audience || '—'}</div>
          </div>
          ${col2}
          <div style="flex:1">
            <div class="phase-label" style="margin-bottom:5px">OFFERS</div>
            ${ov.offers.length ? ov.offers.map(o=>`<div class="body-text">· ${o}</div>`).join('') : '<div class="body-text">—</div>'}
          </div>
        </div>
        ${ov.contentPillars.length ? `
          ${divider}
          <div>
            <div class="phase-label" style="margin-bottom:6px">CONTENT PILLARS</div>
            <div style="color:#ccc;font-size:14px;line-height:1.6">${ov.contentPillars.join(' · ')}</div>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <span data-href="#/overview?id=${id}" style="display:flex;align-items:center;gap:5px;color:#666;font-size:13px;cursor:pointer">
            View More
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </div>
      `;
    }
    if (key === 'platform') {
      return Object.entries(brand.platformStrategy).map(([p, d]) => `
        <div class="dd-row">
          <div class="phase-label" style="margin-bottom:4px">${PLATFORM_LABELS[p]||p}</div>
          ${d.objective ? `<div class="body-text" style="margin-bottom:6px">${d.objective}</div>` : ''}
          ${(d.formats||[]).length ? `<div class="pills">${d.formats.map(f=>`<span class="pill">${f}</span>`).join('')}</div>` : ''}
        </div>
      `).join('') || '<div class="body-text">No platforms set up yet.</div>';
    }
    if (key === 'season') {
      return `
        ${se.name ? `<div class="dd-row"><div class="phase-label" style="margin-bottom:4px">SEASON</div><div class="body-text">${se.name}</div></div>` : ''}
        ${se.goal ? `<div class="dd-row"><div class="phase-label" style="margin-bottom:4px">GOAL</div><div class="body-text">${se.goal}</div></div>` : ''}
        ${se.pillars.length ? `<div class="dd-row"><div class="phase-label" style="margin-bottom:6px">PILLARS</div><div class="pills">${se.pillars.map(p=>`<span class="pill">${p}</span>`).join('')}</div></div>` : ''}
      `;
    }
    if (key === 'vault') {
      return brand.ideas.length
        ? brand.ideas.map(i => `<div class="dd-idea"><div style="font-size:13px;font-weight:600;color:#fff">${i.title}</div><div class="chips" style="margin-top:6px"><span class="chip">${PLATFORM_SHORT[i.platform]||i.platform}</span><span class="chip">${i.format}</span></div></div>`).join('')
        : '<div class="body-text">No ideas yet.</div>';
    }
    if (key === 'inspiration') {
      const cells = brand.inspiration.map(i =>
        i.src
          ? `<div class="insp-cell"><img src="${i.src}" loading="lazy"></div>`
          : `<div class="insp-cell insp-text-cell"><div>${i.content}</div></div>`
      ).join('');
      return `
        <div class="insp-grid" id="inspGrid">
          ${cells}
          <div class="insp-cell insp-add-cell" id="addInspBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <input type="file" id="inspFileInput" accept="image/*" multiple style="display:none">
      `;
    }
    return '';
  }

  const phaseCard = `
    <div class="section-card" data-href="#/phase?id=${id}">
      <div class="section-card-header">
        <div class="section-card-title">CURRENT PHASE</div>
        <div class="section-card-right"><span>${cp.name}</span><span style="font-size:16px">›</span></div>
      </div>
      <div style="margin-top:4px">
        <div class="progress-row" style="margin-bottom:6px">
          <div class="progress-track"><div class="progress-fill" style="width:${cp.progress}%"></div></div>
          <span class="progress-pct">${cp.progress}%</span>
        </div>
        <div class="body-text" style="font-size:12px">${cp.postsCompleted}/${cp.totalPosts} posts · Ends ${cp.eosDate}</div>
      </div>
    </div>
  `;

  const dropdownCards = [
    { key: 'overview',    label: 'BRAND OVERVIEW'    },
    { key: 'platform',    label: 'PLATFORM STRATEGY' },
    { key: 'season',      label: 'SEASON'            },
    { key: 'vault',       label: 'IDEA VAULT'        },
    { key: 'inspiration', label: 'INSPIRATION'       },
  ].map(s => `
    <div class="section-card dd-card" data-dd="${s.key}" style="cursor:pointer">
      <div class="section-card-header dd-toggle">
        <div class="section-card-title">${s.label}</div>
        <svg class="dd-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .22s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="dd-body" style="display:none;padding-top:12px">
        ${dropdownBody(s.key)}
      </div>
    </div>
  `).join('');

  const sectionCards = phaseCard + dropdownCards;

  return `
    <div class="page">
      <div class="back-header">
        <button class="back-btn" data-href="#/">‹</button>
        <div class="back-header-center">
          <div class="back-header-title">${brand.name}</div>
          ${brand.tagline ? `<div class="back-header-label">${brand.tagline}</div>` : ''}
        </div>
        <button class="back-btn" id="openEditBrand"
          style="font-size:11px;letter-spacing:1px;font-weight:600;width:auto;padding:0 14px;border-radius:20px">
          EDIT
        </button>
      </div>
      <div style="padding:0 16px 4px">
        <div class="brand-banner" style="${brand.banner.startsWith('data:')||brand.banner.startsWith('http') ? `background:url('${brand.banner}') center/cover no-repeat` : `background:${brand.banner}`};border-radius:20px"></div>
      </div>
      <div style="padding:16px">
        ${sectionCards}
      </div>
    </div>
    ${pageChrome()}
    ${editBrandSheetHTML(brand)}
  `;
}

/* ═══════════════════════════════════════
   PAGE: CURRENT PHASE (tabs: Timeline / Board / Calendar)
═══════════════════════════════════════ */
function pageCurrentPhase(id, tab) {
  const brand = getBrand(id);
  if (!brand) return pageHome();
  const activeTab = tab || 'timeline';
  const { currentPhase: cp, campaigns } = brand;

  function tabContent() {
    if (activeTab === 'timeline') {
      const camps = campaigns.map(c => {
        const isActive = c.status === 'active';
        const colors = { active: '#fff', upcoming: '#555', planned: '#333' };
        return `
          <div class="campaign-card ${isActive ? 'active-camp' : ''}">
            ${isActive ? '<div class="active-badge">ACTIVE</div>' : ''}
            <div class="campaign-name">${c.name}</div>
            <div class="campaign-dates">${c.startDate} — ${c.endDate}</div>
            <span class="status-badge" style="background:${colors[c.status]}20;color:${colors[c.status]}">${c.phase}</span>
          </div>
        `;
      }).join('');
      return `
        <div class="tab-content">
          <div class="progress-row">
            <div class="progress-track"><div class="progress-fill" style="width:${cp.progress}%"></div></div>
            <span class="progress-pct">${cp.progress}%</span>
          </div>
          <div class="body-text" style="margin-bottom:20px">${cp.postsCompleted} of ${cp.totalPosts} posts complete · Ends ${cp.eosDate}</div>
          <div class="section-label">CAMPAIGNS</div>
          ${camps}
        </div>
      `;
    }

    if (activeTab === 'board') {
      const cols = [
        { key: 'ideas',    label: 'Ideas',    color: '#555' },
        { key: 'drafting', label: 'Drafting', color: '#5B9BD5' },
        { key: 'ready',    label: 'Ready',    color: '#4CAF50' },
        { key: 'posted',   label: 'Posted',   color: '#888' },
      ];
      return `<div class="tab-content">${cols.map(col => {
        const items = (brand.board[col.key] || []);
        return `
          <div class="board-col">
            <div class="board-col-header">
              <div style="width:8px;height:8px;border-radius:50%;background:${col.color};flex-shrink:0"></div>
              <span style="font-weight:700;font-size:14px">${col.label}</span>
              <div class="board-count">${items.length}</div>
            </div>
            ${items.length ? items.map(item => `
              <div class="board-card">
                <div class="board-card-title">${item.title}</div>
                <div class="chips">
                  <span class="chip">${PLATFORM_SHORT[item.platform] || item.platform}</span>
                  <span class="chip">${item.format}</span>
                </div>
              </div>
            `).join('') : '<div class="empty-card">Nothing here yet</div>'}
          </div>
        `;
      }).join('')}</div>`;
    }

    if (activeTab === 'calendar') {
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      return `
        <div class="tab-content">
          <div class="day-selector">
            ${days.map((d,i) => `<button class="day-btn ${i===0?'active':''}">${d}</button>`).join('')}
          </div>
          <div class="calendar-empty">
            <span style="color:#333;font-size:13px">No posts scheduled for this day</span>
          </div>
        </div>
      `;
    }
  }

  const tabs = ['timeline','board','calendar'];
  const tabLabels = { timeline: 'Timeline', board: 'Board', calendar: 'Calendar' };

  return `
    <div class="page">
      <div class="gradient-header" style="background:${brand.banner}">
        <div class="gradient-header-top">
          <button class="gradient-back" data-href="#/brand?id=${id}">‹</button>
          <div class="gradient-header-label">CURRENT PHASE</div>
          <div style="width:36px"></div>
        </div>
        <div style="font-size:22px;font-weight:800">${cp.name}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px">Next: ${cp.next}</div>
      </div>
      <div class="tabs">
        ${tabs.map(t => `
          <button class="tab-btn ${t===activeTab?'active':''}" onclick="switchPhaseTab('${id}','${t}')">${tabLabels[t]}</button>
        `).join('')}
      </div>
      ${tabContent()}
    </div>
    ${pageChrome()}
  `;
}

window.switchPhaseTab = function(id, tab) {
  document.getElementById('app').innerHTML = pageCurrentPhase(id, tab);
  bindCapture(); bindNav();
};

/* ═══════════════════════════════════════
   PAGE: OVERVIEW / BRAND PLAYBOOK
═══════════════════════════════════════ */
function pageOverview(id) {
  const brand = getBrand(id);
  if (!brand) return pageHome();
  const { overview: o } = brand;

  const playSection = (title, content) => `
    <div class="playbook-section">
      <div class="playbook-section-header">
        <span style="font-size:10px;letter-spacing:2px;color:#555;font-weight:600">${title}</span>
      </div>
      <div class="playbook-section-body">${content}</div>
    </div>
  `;

  const pillarsHTML = o.contentPillars.map((p,i) => `
    <div class="pillar-row">
      <div class="pillar-num">${i+1}</div>
      <span class="body-text">${p}</span>
    </div>
  `).join('');

  const keywordsHTML = `<div class="tags">${o.keywords.map(k=>`<span class="tag">${k}</span>`).join('')}</div>`;
  const offersHTML = o.offers.map(off => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
      <span style="color:#555;font-size:16px">&#8594;</span>
      <span class="body-text">${off}</span>
    </div>
  `).join('');

  return `
    <div class="page">
      <div class="back-header">
        <button class="back-btn" data-href="#/brand?id=${id}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">BRAND OVERVIEW</div>
          <div class="back-header-title">${brand.name}</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div style="padding:16px">
        ${playSection('MISSION',          `<p class="body-text">${o.mission}</p>`)}
        ${playSection('POSITIONING',      `<p class="body-text">${o.positioning}</p>`)}
        ${playSection('AUDIENCE',         `<p class="body-text">${o.audience}</p>`)}
        ${playSection('BRAND VOICE',      `<p class="body-text">${o.brandVoice}</p>`)}
        ${playSection('CONTENT PILLARS',  pillarsHTML)}
        ${playSection('KEYWORDS',         keywordsHTML)}
        ${playSection('OFFERS',           offersHTML)}
      </div>
    </div>
    ${pageChrome()}
  `;
}

/* ═══════════════════════════════════════
   PAGE: PLATFORM STRATEGY
═══════════════════════════════════════ */
function pagePlatformStrategy(id, activePlatform) {
  const brand = getBrand(id);
  if (!brand) return pageHome();
  const platforms = Object.keys(brand.platformStrategy);
  const active = activePlatform || platforms[0];
  const strat = brand.platformStrategy[active];

  const themesHTML  = strat.themes.map(t => `<span class="tag">${t}</span>`).join('');
  const formatsHTML = strat.formats.map(f => `<span class="tag">${f}</span>`).join('');
  const goalsHTML   = strat.goals.map(g => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
      <span style="color:#4CAF50;font-size:14px">&#10003;</span>
      <span class="body-text">${g}</span>
    </div>
  `).join('');

  const stratSection = (title, content) => `
    <div class="playbook-section">
      <div class="playbook-section-header">
        <span style="font-size:10px;letter-spacing:2px;color:#555;font-weight:600">${title}</span>
      </div>
      <div class="playbook-section-body">${content}</div>
    </div>
  `;

  return `
    <div class="page">
      <div class="back-header">
        <button class="back-btn" data-href="#/brand?id=${id}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">PLATFORM STRATEGY</div>
          <div class="back-header-title">${brand.name}</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div class="platform-tabs">
        ${platforms.map(p => `
          <button class="platform-tab ${p===active?'active':''}" onclick="switchPlatform('${id}','${p}')">
            ${PLATFORM_LABELS[p] || p}
          </button>
        `).join('')}
      </div>
      <div style="padding:16px">
        ${stratSection('OBJECTIVE',      `<p class="body-text">${strat.objective}</p>`)}
        ${stratSection('CONTENT THEMES', `<div class="tags">${themesHTML}</div>`)}
        ${stratSection('FORMATS',        `<div class="tags">${formatsHTML}</div>`)}
        ${stratSection('GOALS',          goalsHTML)}
      </div>
    </div>
    ${pageChrome()}
  `;
}

window.switchPlatform = function(id, platform) {
  document.getElementById('app').innerHTML = pagePlatformStrategy(id, platform);
  bindCapture(); bindNav();
};

/* ═══════════════════════════════════════
   PAGE: SEASON
═══════════════════════════════════════ */
function pageSeason(id) {
  const brand = getBrand(id);
  if (!brand) return pageHome();
  const { season, campaigns } = brand;

  const activeCamp = campaigns.find(c => c.status === 'active')?.name || '';

  const pillarsHTML = season.pillars.map((p,i) => `
    <div class="season-pillar-card">
      <div class="season-pillar-num">0${i+1}</div>
      <div style="color:#ccc;font-size:13px;font-weight:600">${p}</div>
    </div>
  `).join('');

  const roadmapHTML = season.roadmap.map((r, i) => {
    const isActive = r === activeCamp;
    const isLast = i === season.roadmap.length - 1;
    return `
      <div class="roadmap-item">
        <div class="roadmap-left">
          <div class="roadmap-node ${isActive ? 'active-node' : ''}"></div>
          ${!isLast ? '<div class="roadmap-connector"></div>' : ''}
        </div>
        <div class="roadmap-card ${isActive ? 'active-roadmap' : ''}" style="margin-bottom:${isLast?'0':'10px'}">
          ${isActive ? '<div class="active-badge" style="margin-bottom:6px">ACTIVE</div>' : ''}
          <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px">${r}</div>
          <span class="roadmap-phase-tag">Phase ${i+1}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page">
      <div class="gradient-header" style="background:${brand.banner}">
        <div class="gradient-header-top">
          <button class="gradient-back" data-href="#/brand?id=${id}">‹</button>
          <div class="gradient-header-label">SEASON</div>
          <div style="width:36px"></div>
        </div>
        <div style="font-size:22px;font-weight:800">${season.name}</div>
      </div>
      <div style="padding:16px">
        <div class="playbook-section">
          <div class="playbook-section-header">
            <span style="font-size:10px;letter-spacing:2px;color:#555;font-weight:600">SEASON GOAL</span>
          </div>
          <div class="playbook-section-body"><p class="body-text">${season.goal}</p></div>
        </div>
        <div class="section-label">PILLARS</div>
        <div class="season-pillars-grid" style="margin-bottom:24px">${pillarsHTML}</div>
        <div class="section-label">ROADMAP</div>
        ${roadmapHTML}
      </div>
    </div>
    ${pageChrome()}
  `;
}

/* ═══════════════════════════════════════
   PAGE: IDEA VAULT
═══════════════════════════════════════ */
function pageIdeaVault(id, filterPlatform, filterFormat) {
  const brand = getBrand(id);
  if (!brand) return pageHome();

  const platforms = [...new Set(brand.ideas.map(i => i.platform))];
  const formats   = [...new Set(brand.ideas.map(i => i.format))];

  const fp = filterPlatform || 'all';
  const ff = filterFormat   || 'all';

  const filtered = brand.ideas.filter(i =>
    (fp === 'all' || i.platform === fp) &&
    (ff === 'all' || i.format === ff)
  );

  const ideasHTML = filtered.length ? filtered.map(idea => `
    <div class="idea-card">
      <div class="idea-card-meta">
        <span class="chip">${PLATFORM_SHORT[idea.platform] || idea.platform}</span>
        <span class="chip">${idea.format}</span>
      </div>
      <div class="idea-title">${idea.title}</div>
      ${idea.campaign ? `<div class="idea-campaign">${idea.campaign}</div>` : ''}
    </div>
  `).join('') : '<div class="empty-card" style="margin-top:20px">No ideas match this filter</div>';

  return `
    <div class="page">
      <div class="back-header">
        <button class="back-btn" data-href="#/brand?id=${id}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">IDEA VAULT</div>
          <div class="back-header-title">${brand.name}</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div class="filter-section">
        <div style="color:#555;font-size:10px;letter-spacing:2px">PLATFORM</div>
        <div class="filter-chips">
          <button class="filter-chip ${fp==='all'?'active':''}" onclick="vaultFilter('${id}','all','${ff}')">All</button>
          ${platforms.map(p => `
            <button class="filter-chip ${fp===p?'active':''}" onclick="vaultFilter('${id}','${p}','${ff}')">${PLATFORM_SHORT[p] || p}</button>
          `).join('')}
        </div>
        <div style="color:#555;font-size:10px;letter-spacing:2px;margin-top:10px">FORMAT</div>
        <div class="filter-chips">
          <button class="filter-chip ${ff==='all'?'active':''}" onclick="vaultFilter('${id}','${fp}','all')">All</button>
          ${formats.map(f => `
            <button class="filter-chip ${ff===f?'active':''}" onclick="vaultFilter('${id}','${fp}','${f}')">${f}</button>
          `).join('')}
        </div>
      </div>
      <div style="padding:16px">${ideasHTML}</div>
    </div>
    ${pageChrome()}
  `;
}

window.vaultFilter = function(id, platform, format) {
  document.getElementById('app').innerHTML = pageIdeaVault(id, platform, format);
  bindCapture(); bindNav();
};

/* ═══════════════════════════════════════
   AISHA: GENERATE
═══════════════════════════════════════ */
function aishaGenerate(brand, campaign, answers) {
  const ov = brand.overview || {};
  const mission  = ov.mission || '';
  const audience = ov.audience || '';
  const pillars  = (ov.contentPillars || []).join(', ');
  const voice    = ov.brandVoice || '';
  const platforms = Object.keys(brand.platformStrategy || {}).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');

  const a = answers;

  const strategy =
`CAMPAIGN: ${campaign.name}
${campaign.startDate} – ${campaign.endDate}

OBJECTIVE
${a.goal || `Drive meaningful engagement aligned with ${brand.name}'s mission`}

TARGET AUDIENCE
${a.audience || audience || 'Core brand community'}

CORE MESSAGE
${a.message || `Authentic content that reflects ${brand.name}'s values`}

PLATFORMS
${a.platforms || platforms || 'Primary social channels'}

CALL TO ACTION
${a.cta || 'Engage, share, and connect'}

BRAND CONTEXT
Mission: ${mission || `${brand.name} brand mission`}
Voice: ${voice || 'Authentic and engaging'}
Pillars: ${pillars || 'Core content areas'}

PHASE STRATEGY
1. Awareness — establish the campaign narrative and hook
2. Engagement — deepen connection with interactive content
3. Conversion — clear CTAs that reflect ${brand.name}'s values
${a.milestones && a.milestones.toLowerCase() !== 'skip' ? `\nKEY DATES\n${a.milestones}` : ''}`.trim();

  const contentPlan =
`CONTENT PLAN: ${campaign.name}

CONTENT TYPES
${a.content || 'Reels · Carousels · Stories'}

WEEKLY BREAKDOWN
Week 1 — Awareness: Introduce the campaign theme with hero content
Week 2 — Engagement: Behind-the-scenes and community-first posts
Week 3 — Depth: Value-driven content on ${(ov.contentPillars || ['core topics'])[0]}
Week 4 — Conversion: CTA-focused content driving "${a.cta || 'action'}"

PLATFORM DISTRIBUTION
${a.platforms || platforms || 'Adapt format per platform — prioritize native formats'}

CONTENT MIX
· 40% Educational / value-driven
· 30% Storytelling / behind the scenes
· 20% Community engagement
· 10% Promotional / offer-forward

TONE
${voice || 'Authentic, grounded, on-brand'}`.trim();

  return { strategy, contentPlan };
}

/* ═══════════════════════════════════════
   AISHA: CHAT HTML
═══════════════════════════════════════ */
function aishaBlockHTML() {
  const sendSVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  return `
    <div class="aisha-block">
      <div class="aisha-header">
        <div class="aisha-avatar">✦</div>
        <div class="aisha-info">
          <div class="aisha-name">Ask Aisha</div>
          <div class="aisha-role">Campaign Strategist · AI</div>
        </div>
        <button class="aisha-wizard-btn" id="aishaWizardBtn">Start Wizard</button>
      </div>
      <div class="aisha-chat" id="aishaChat"></div>
      <div class="aisha-opts-wrap" id="aishaOptsWrap" style="display:none">
        <div class="aisha-opts-grid" id="aishaOptsGrid"></div>
        <button class="aisha-opts-done" id="aishaOptsDone" style="display:none">Done ›</button>
      </div>
      <div class="aisha-input-row">
        <input class="aisha-input" id="aishaInput" type="text" placeholder="Ask Aisha about this campaign…">
        <button class="aisha-send" id="aishaSendBtn">${sendSVG}</button>
      </div>
    </div>
  `;
}

function renderAishaChat() {
  const chat = document.getElementById('aishaChat');
  if (!chat) return;
  chat.innerHTML = _aishaMessages.map(m =>
    `<div class="aisha-msg ${m.role === 'aisha' ? 'from-aisha' : 'from-user'}">${m.text.replace(/\n/g, '<br>')}</div>`
  ).join('');
  chat.scrollTop = chat.scrollHeight;
}

/* ═══════════════════════════════════════
   AISHA: BIND
═══════════════════════════════════════ */
function bindAisha(brand, campaign, brandId, campId) {
  const campKey = `${brandId}:${campId}`;

  if (_aishaCampKey !== campKey) {
    _aishaCampKey = campKey;
    _aishaMessages = [];
    _aishaWizardStep = -1;
    _aishaAnswers = {};
    _aishaGenerated = null;
    _aishaMessages.push({ role: 'aisha', text: `Hi, I'm Aisha — your campaign strategist. I already have ${brand.name}'s brand context loaded in. Tap "Start Wizard" and I'll walk you through a few questions to build out the strategy for ${campaign.name}. Or just ask me anything.` });
  }

  renderAishaChat();

  // Show option chips for a wizard step
  function showAishaOptions(step) {
    const q = AISHA_WIZARD_QS[step];
    const wrap = document.getElementById('aishaOptsWrap');
    const grid = document.getElementById('aishaOptsGrid');
    const doneBtn = document.getElementById('aishaOptsDone');
    if (!wrap || !grid || !q?.options) return;
    _aishaSelectedOpts = [];
    grid.innerHTML = q.options.map(opt =>
      `<button class="aisha-opt" data-opt="${opt}">${opt}</button>`
    ).join('');
    doneBtn.style.display = q.multi ? 'block' : 'none';
    wrap.style.display = 'block';
    grid.querySelectorAll('.aisha-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (q.multi) {
          btn.classList.toggle('selected');
          const val = btn.dataset.opt;
          _aishaSelectedOpts = _aishaSelectedOpts.includes(val)
            ? _aishaSelectedOpts.filter(o => o !== val)
            : [..._aishaSelectedOpts, val];
        } else {
          processAishaInput(btn.dataset.opt);
        }
      });
    });
    doneBtn.onclick = () => {
      if (_aishaSelectedOpts.length) processAishaInput(_aishaSelectedOpts.join(', '));
    };
  }

  function hideAishaOptions() {
    const wrap = document.getElementById('aishaOptsWrap');
    if (wrap) wrap.style.display = 'none';
    _aishaSelectedOpts = [];
  }

  const acks = ['Got it.', 'Perfect.', 'Love that.', 'Nice.', 'Great, noted.'];

  function processAishaInput(text) {
    hideAishaOptions();
    _aishaMessages.push({ role: 'user', text });

    if (_aishaWizardStep >= 0 && _aishaWizardStep < AISHA_WIZARD_QS.length) {
      _aishaAnswers[AISHA_WIZARD_QS[_aishaWizardStep].id] = text;
      _aishaWizardStep++;

      if (_aishaWizardStep < AISHA_WIZARD_QS.length) {
        const ack = acks[(_aishaWizardStep - 1) % acks.length];
        _aishaMessages.push({ role: 'aisha', text: `${ack}\n\n${AISHA_WIZARD_QS[_aishaWizardStep].q}` });
        renderAishaChat();
        showAishaOptions(_aishaWizardStep);
      } else {
        _aishaMessages.push({ role: 'aisha', text: `That's everything I need. Give me a second to put this together…` });
        renderAishaChat();
        setTimeout(() => {
          _aishaGenerated = aishaGenerate(brand, campaign, _aishaAnswers);
          const a = _aishaAnswers;
          const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

          // Populate Campaign Overview from wizard answers
          setVal('ov_objective', a.goal);
          setVal('ov_audience',  a.audience);
          setVal('ov_message',   a.message);
          setVal('ov_platforms', a.platforms);
          setVal('ov_cta',       a.cta);
          setVal('ov_timeline',  a.milestones !== 'Skip for now' ? a.milestones : '');

          document.getElementById('campInfoSheet')?.classList.add('open');

          _aishaMessages.push({ role: 'aisha', text: `I've filled in your Campaign Overview for ${campaign.name} — it's open now. Review, edit, and hit Save.\n\nNow building your Content Plan…` });
          renderAishaChat();
          setTimeout(() => {
            // Populate Content Plan from wizard answers
            setVal('cp_formats', a.content);
            setVal('cp_mix', '40% Educational / value-driven\n30% Storytelling / behind the scenes\n20% Community engagement\n10% Promotional / offer-forward');

            _aishaMessages.push({ role: 'aisha', text: `Content Plan is ready too. Close this sheet, tap Content Plan to review and save it. ✦` });
            renderAishaChat();
          }, 1200);
        }, 1000);
      }
    } else {
      const q = text.toLowerCase();
      let reply;
      if (q.includes('content') || q.includes('plan') || q.includes('post') || q.includes('schedule')) {
        reply = `Here's a content plan for ${campaign.name}:\n\n${aishaGenerate(brand, campaign, _aishaAnswers).contentPlan}`;
      } else if (q.includes('audience') || q.includes('who') || q.includes('target')) {
        reply = `For ${campaign.name}, we're speaking to:\n\n${brand.overview?.audience || 'Your core brand community'}\n\nSpeak to them with ${brand.overview?.brandVoice || 'an authentic voice that reflects your brand'}.`;
      } else if (q.includes('voice') || q.includes('tone')) {
        reply = `${brand.name}'s brand voice: ${brand.overview?.brandVoice || 'Authentic and engaging.'}\n\nFor ${campaign.name}, keep that voice consistent across every piece of content.`;
      } else {
        reply = aishaGenerate(brand, campaign, _aishaAnswers).strategy;
      }
      _aishaMessages.push({ role: 'aisha', text: reply });
      renderAishaChat();
    }
  }

  // Restore options if wizard is mid-flow after a re-render
  if (_aishaWizardStep >= 0 && _aishaWizardStep < AISHA_WIZARD_QS.length) {
    showAishaOptions(_aishaWizardStep);
  }

  document.getElementById('aishaWizardBtn')?.addEventListener('click', () => {
    _aishaWizardStep = 0;
    _aishaAnswers = {};
    _aishaGenerated = null;
    _aishaMessages.push({ role: 'aisha', text: `Let's build this out! Brand context from ${brand.name} is already loaded in.\n\n${AISHA_WIZARD_QS[0].q}` });
    renderAishaChat();
    showAishaOptions(0);
  });

  const sendMsg = () => {
    const input = document.getElementById('aishaInput');
    const text = input?.value.trim();
    if (!text) return;
    if (input) input.value = '';
    processAishaInput(text);
  };

  document.getElementById('aishaSendBtn')?.addEventListener('click', sendMsg);
  document.getElementById('aishaInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

}

/* ═══════════════════════════════════════
   CAMPAIGN PAGE: NAV HTML
═══════════════════════════════════════ */
function injectCampaignNav(brandId, campId, activeTab, onAisha) {
  document.getElementById('campaignBottomNav')?.remove();

  const docSVG    = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>`;
  const ideaSVG   = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26A7.003 7.003 0 0112 2z"/></svg>`;
  const aishaSVG  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>`;
  const visualSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
  const calSVG    = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

  const wrap = document.createElement('div');
  wrap.id = 'campaignBottomNav';
  wrap.innerHTML = `
    <nav class="bottom-nav">
      <button class="nav-btn${activeTab === 'doc'    ? ' nav-active' : ''}" id="campNavDoc">${docSVG}</button>
      <button class="nav-btn${activeTab === 'ideas'  ? ' nav-active' : ''}" id="campNavIdeas">${ideaSVG}</button>
      <button class="nav-btn nav-btn-center" id="campNavAisha">${aishaSVG}</button>
      <button class="nav-btn${activeTab === 'visual' ? ' nav-active' : ''}" id="campNavVisual">${visualSVG}</button>
      <button class="nav-btn${activeTab === 'cal'    ? ' nav-active' : ''}" id="campNavCal">${calSVG}</button>
    </nav>`;
  document.body.appendChild(wrap);

  document.getElementById('campNavDoc')?.addEventListener('click',    () => navigate(`#/campaign?brandId=${brandId}&id=${campId}`));
  document.getElementById('campNavIdeas')?.addEventListener('click',  () => navigate(`#/vault?id=${brandId}&campId=${campId}`));
  document.getElementById('campNavVisual')?.addEventListener('click', () => navigate(`#/brand?id=${brandId}`));
  document.getElementById('campNavCal')?.addEventListener('click',    () => {}); // future: campaign calendar
  document.getElementById('campNavAisha')?.addEventListener('click',  () => { if (onAisha) onAisha(); });
}

function campaignNavHTML(brandId, campId) {
  const docSVG    = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>`;
  const ideaSVG   = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26A7.003 7.003 0 0112 2z"/></svg>`;
  const aishaSVG  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>`;
  const visualSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
  const calSVG    = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  return `
    <nav class="bottom-nav">
      <button class="nav-btn nav-active" id="campNavDoc">${docSVG}</button>
      <button class="nav-btn" id="campNavIdeas">${ideaSVG}</button>
      <button class="nav-btn nav-btn-center" id="campNavAisha">${aishaSVG}</button>
      <button class="nav-btn" id="campNavVisual">${visualSVG}</button>
      <button class="nav-btn" id="campNavCal">${calSVG}</button>
    </nav>
  `;
}

/* ═══════════════════════════════════════
   PAGE: CAMPAIGN DETAIL
═══════════════════════════════════════ */
function pageCampaign(brandId, campId) {
  const brand = getBrand(brandId);
  if (!brand) return pageHome();
  const campaign = (brand.campaigns || []).find(c => c.id === campId);
  if (!campaign) return pageHome();

  // Stage
  let stageIndex = campaign.stage != null ? campaign.stage : (
    campaign.status === 'active' ? 2 : campaign.status === 'upcoming' ? 1 : 0
  );
  const stages = ['Ideation', 'Planning Phase', 'Production', 'Distribution'];
  const STAGE_META = [
    { label: 'Ideation',   icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.4-1.2 4.5-3 5.7V17H9v-2.3A7 7 0 0112 2z"/></svg>` },
    { label: 'Planning',   icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
    { label: 'Production', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>` },
    { label: 'Publish',    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>` },
  ];
  const stageTrackerHTML = stages.map((_, i) => {
    let cls = 'camp-stage-seg';
    if (i < stageIndex) cls += ' completed';
    else if (i === stageIndex) cls += ' current';
    return `<div class="${cls}" data-stage="${i}">${STAGE_META[i].icon}<span>${STAGE_META[i].label}</span></div>`;
  }).join('');

  // Progress data
  const isCurrentPhase = campaign.status === 'active' && campaign.name === brand.currentPhase?.name;
  const pct = campaign.progress != null ? campaign.progress : (isCurrentPhase ? brand.currentPhase?.progress || 0 : 0);
  const postsCompleted = isCurrentPhase ? brand.currentPhase?.postsCompleted || 0 : 0;
  const totalPosts     = isCurrentPhase ? brand.currentPhase?.totalPosts || 0 : 0;
  const postLabel = totalPosts > 0 ? `${postsCompleted} / ${totalPosts} posts` : '0 posts';
  const upcomingVal = campaign.status === 'active'
    ? (brand.board?.ready?.[0]?.title || brand.board?.drafting?.[0]?.title || '—')
    : `Starts ${campaign.startDate}`;
  const stageName = stages[stageIndex] || 'Ideation';

  // Brand icon
  const iconContent = brand.icon
    ? `<img src="${brand.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : brand.name[0].toUpperCase();
  const iconBg = brand.icon ? 'background:rgba(255,255,255,0.07)'
    : (brand.banner && (brand.banner.startsWith('data:') || brand.banner.startsWith('http'))
      ? 'background:rgba(255,255,255,0.15)'
      : `background:${brand.banner}`);

  // Analytics bar
  const MOCK_ANALYTICS = {
    instagram: { count: '2.8K', delta: +127 },
    youtube:   { count: '1.2K', delta: +89  },
    tiktok:    { count: '8.9K', delta: -12  },
    threads:   { count: '456',  delta: +67  },
    twitter:   { count: '1.1K', delta: +34  },
    email:     { count: '892',  delta: +45  },
    linkedin:  { count: '234',  delta: +11  },
    patreon:   { count: '78',   delta: +3   },
  };
  const PLATFORM_ICONS = {
    instagram: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
    tiktok:    `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.38a8.26 8.26 0 004.83 1.55V7.48a4.85 4.85 0 01-1.06-.79z"/></svg>`,
    youtube:   `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 8.5 16 12 10 15.5" fill="currentColor" stroke="none"/></svg>`,
    threads:   `<svg width="26" height="26" viewBox="0 0 192 192" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M141.537 88.988a73.5 73.5 0 00-2.667-.617c-1.598-6.718-5.03-12.505-10.287-17.203C118.786 62.027 106.48 57.5 92 57.5c-18.42 0-30.4 7.12-38.387 21.887l14.84 10.107C74.13 80.127 81.78 75.6 92 75.6c9.247 0 15.44 2.573 18.78 5.953 1.898 1.927 3.254 4.204 4.073 6.674a68.5 68.5 0 00-15.64-.7c-24.28 1.4-39.9 15.587-39.9 35.187 0 11.38 6.013 22.1 16.52 28.207 8.307 4.827 18.74 5.547 27.747 1.893 10.673-4.267 17.247-13.16 19.38-26.587 2.18 1.313 3.993 2.887 5.373 4.693 3.347 4.373 3.26 11.52 3.26 11.52l16.207-.607s.16-9.413-4.293-17.487c-2.387-4.333-5.733-7.72-9.573-10.16zm-33.893 30.94c-3.68 7.427-10.367 11.733-20.107 11.64-8.88-.094-14.607-4.454-14.607-11.127 0-9.267 8.293-14.787 22.48-15.587 4.64-.267 9.14-.067 13.44.547-.5 6.573-1.24 10.813-1.24 14.5z"/></svg>`,
    twitter:   `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    email:     `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`,
    linkedin:  `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="8" y1="10" x2="8" y2="18"/><circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none"/><path d="M12 18v-5c0-1.1.9-2 2-2s2 .9 2 2v5"/><line x1="12" y1="10" x2="12" y2="18"/></svg>`,
    patreon:   `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="14.5" cy="10" r="6"/><line x1="5" y1="2" x2="5" y2="22"/></svg>`,
  };
  const PLATFORM_COLORS = {
    instagram: 'rgba(197,0,96,0.28)',
    tiktok:    'rgba(0,155,149,0.28)',
    youtube:   'rgba(204,0,0,0.28)',
    threads:   'rgba(0,80,208,0.28)',
    twitter:   'rgba(0,68,187,0.28)',
    email:     'rgba(116,174,0,0.28)',
    linkedin:  'rgba(0,61,181,0.28)',
    patreon:   'rgba(224,48,0,0.28)',
  };
  const PLATFORM_METRIC = {
    instagram: 'FOLLOWERS',
    tiktok:    'FOLLOWERS',
    youtube:   'SUBSCRIBERS',
    threads:   'FOLLOWERS',
    twitter:   'FOLLOWERS',
    email:     'CONTACTS',
    linkedin:  'CONNECTIONS',
    patreon:   'PATRONS',
  };
  const activePlatforms = Object.keys(brand.platformStrategy || {});
  const analyticsItemsHTML = activePlatforms.length ? activePlatforms.map(p => {
    const m    = MOCK_ANALYTICS[p] || { count:'—', delta:0 };
    const icon = PLATFORM_ICONS[p] || `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/></svg>`;
    const bg   = PLATFORM_COLORS[p] || '#2a2a2a';
    const sign = m.delta > 0 ? '+' : '';
    const dCls = m.delta > 0 ? 'pos' : m.delta < 0 ? 'neg' : '';
    return `
      <div class="camp-analytics-item" style="background:${bg}">
        <div class="camp-analytics-icon">${icon}</div>
        <div class="camp-analytics-count">${m.count}</div>
        <div class="camp-analytics-delta ${dCls}">${m.delta ? sign + m.delta : ''}</div>
      </div>`;
  }).join('') : `<div style="color:#333;font-size:12px;padding:8px 0">Set platforms in Brand settings</div>`;

  // Brand overview for snapshot
  const ov = brand.overview || {};
  const pillarsHTML = (ov.contentPillars || []).map(p => `<span class="notion-pillar">${p}</span>`).join('');

  const heroImgStyle = campaign.heroImage ? `background-image:url(${campaign.heroImage})` : '';

  return `
    <div class="page" style="padding-bottom:110px">

      <!-- Back header -->
      <div class="back-header">
        <button class="back-btn" data-href="#/">‹</button>
        <div style="display:flex;align-items:center;gap:10px;flex:1;justify-content:center">
          <div class="camp-header-icon" style="${iconBg}">${iconContent}</div>
          <span class="camp-header-brand">${brand.name}</span>
        </div>
        <button class="back-btn" id="campMoreBtn" style="font-size:18px;font-weight:400;letter-spacing:1px">···</button>
      </div>

      <!-- Campaign hero card: full-width -->
      <div class="camp-hero-card" id="campHeroCard" style="${heroImgStyle}">
        <div class="camp-hero-top">
          <div class="camp-hero-dates">${campaign.startDate} – ${campaign.endDate}</div>
        </div>
        <div class="camp-hero-name">${campaign.name}</div>
        <div class="camp-hero-next">
          <div class="camp-hero-next-label">NEXT UP</div>
          <div class="camp-hero-next-val">${upcomingVal}</div>
        </div>
        <div class="camp-hero-prog-wrap">
          <div class="camp-hero-prog-track">
            <div class="camp-hero-prog-fill" style="width:${pct}%"></div>
          </div>
          <div class="camp-hero-pct">${pct}%</div>
        </div>
        <div class="camp-hero-posts">${postLabel}</div>
        <div class="camp-hero-stages" id="campStageTracker">
          ${stageTrackerHTML}
        </div>
      </div>

      <div style="padding:0 16px;padding-top:14px">

        <!-- Analytics bar -->
        <div class="camp-analytics">
          <div class="camp-analytics-header">
            <span class="camp-analytics-title">ANALYTICS</span>
            <button class="camp-analytics-more" id="campAnalyticsMore">View More ›</button>
          </div>
          <div class="camp-analytics-row">${analyticsItemsHTML}</div>
        </div>

        <!-- CAMPAIGN OVERVIEW -->
        <div class="section-card" id="campInfoCard" style="cursor:pointer;margin-bottom:10px">
          <div class="section-card-header" style="display:flex;align-items:center;gap:8px">
            <div class="section-card-title" style="flex:1">CAMPAIGN OVERVIEW</div>
            <button class="doc-open-btn" id="campInfoDocBtn">Open Doc</button>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <!-- CONTENT PLAN -->
        <div class="section-card" id="campPlanCard" style="cursor:pointer;margin-bottom:10px">
          <div class="section-card-header" style="display:flex;align-items:center;gap:8px">
            <div class="section-card-title" style="flex:1">CONTENT PLAN</div>
            <button class="doc-open-btn" id="campPlanDocBtn">Open Doc</button>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <!-- BRAND SNAPSHOT -->
        <div class="section-card dd-card" id="campSnapCard" style="cursor:pointer;margin-bottom:10px">
          <div class="section-card-header" id="campSnapToggle" style="display:flex;align-items:center;gap:8px">
            <div class="section-card-title" style="flex:1">BRAND SNAPSHOT</div>
            <svg class="dd-chevron" id="campSnapChevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .22s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="dd-body" id="campSnapBody" style="display:none;padding-top:14px">
            ${ov.mission ? `<div class="notion-label" style="margin-bottom:6px">MISSION</div><div class="body-text" style="margin-bottom:16px">${ov.mission}</div>` : ''}
            ${ov.audience ? `<div class="notion-label" style="margin-bottom:6px">AUDIENCE</div><div class="body-text" style="margin-bottom:16px">${ov.audience}</div>` : ''}
            ${(ov.contentPillars || []).length ? `<div class="notion-label" style="margin-bottom:8px">CONTENT PILLARS</div><div style="margin-bottom:16px">${pillarsHTML}</div>` : ''}
            ${ov.brandVoice ? `<div class="notion-label" style="margin-bottom:6px">BRAND VOICE</div><div class="body-text">${ov.brandVoice}</div>` : ''}
          </div>
        </div>

      </div>
    </div>

    ${captureModalHTML()}
    <div id="editPhotoMount"></div>
  `;
}

/* ═══════════════════════════════════════
   CAMPAIGN PAGE: BIND
═══════════════════════════════════════ */
function bindCampaignPage(brandId, campId) {
  const brand = getBrand(brandId);
  if (!brand) return;
  const campaign = (brand.campaigns || []).find(c => c.id === campId);
  if (!campaign) return;

  const getVal = id => document.getElementById(id)?.value || '';

  // ── Body-level sheets (avoid iOS fixed-inside-scroll bug) ──────────────
  // Remove any sheets left over from a previous campaign page visit
  document.getElementById('campMoreSheet')?.remove();
  document.getElementById('aishaSheet')?.remove();
  document.getElementById('campInfoSheet')?.remove();
  document.getElementById('campPlanSheet')?.remove();

  // Inject ··· more sheet
  const moreEl = document.createElement('div');
  moreEl.className = 'camp-more-sheet';
  moreEl.id = 'campMoreSheet';
  moreEl.style.display = 'none';
  moreEl.innerHTML = `
    <div class="camp-more-sheet-bg" id="campMoreSheetBg"></div>
    <div class="camp-more-sheet-panel">
      <div class="camp-more-sheet-bar"></div>
      <button class="camp-more-item" id="campMoreChangeCover">Change Cover Photo</button>
    </div>`;
  document.body.appendChild(moreEl);

  // Inject Aisha sheet
  const aishaEl = document.createElement('div');
  aishaEl.className = 'aisha-sheet';
  aishaEl.id = 'aishaSheet';
  aishaEl.style.display = 'none';
  aishaEl.innerHTML = `
    <div class="aisha-sheet-bg" id="aishaSheetBg"></div>
    <div class="aisha-sheet-panel">
      <div class="aisha-sheet-bar"></div>
      ${aishaBlockHTML()}
    </div>`;
  document.body.appendChild(aishaEl);

  // ··· sheet bindings
  document.getElementById('campMoreBtn')?.addEventListener('click', () => {
    moreEl.style.display = 'flex';
  });
  document.getElementById('campMoreSheetBg')?.addEventListener('click', () => {
    moreEl.style.display = 'none';
  });
  document.getElementById('campMoreChangeCover')?.addEventListener('click', () => {
    moreEl.style.display = 'none';
    openEditHeroPhoto(brandId, campId);
  });

  // Campaign nav (body-level so position:fixed works correctly on iOS)
  injectCampaignNav(brandId, campId, 'doc', () => { aishaEl.style.display = 'flex'; });

  // Aisha sheet close via backdrop
  document.getElementById('aishaSheetBg')?.addEventListener('click', () => {
    aishaEl.style.display = 'none';
  });

  // Stage tracker
  document.querySelectorAll('#campStageTracker .camp-stage-seg').forEach(dot => {
    dot.addEventListener('click', () => {
      const newStage = parseInt(dot.dataset.stage, 10);
      const updatedCampaigns = brand.campaigns.map(c =>
        c.id === campId ? { ...c, stage: newStage } : c
      );
      saveBrandOverride(brandId, { campaigns: updatedCampaigns });
      document.getElementById('app').innerHTML = pageCampaign(brandId, campId);
      bindCampaignPage(brandId, campId);
    });
  });

  // Clean up doc picker sheets left from a previous doc page visit
  document.getElementById('docPickerSheet')?.remove();
  document.getElementById('docSectionPicker')?.remove();

  // ── Inject full-screen form sheets (body-level avoids iOS scroll bug) ──

  document.getElementById('campInfoSheet')?.remove();
  document.getElementById('campPlanSheet')?.remove();

  const infoSheet = document.createElement('div');
  infoSheet.className = 'camp-form-sheet';
  infoSheet.id = 'campInfoSheet';
  infoSheet.innerHTML = `
    <div class="camp-form-picker" id="campInfoPicker" style="display:none">
      <div class="camp-form-picker-bg" id="campInfoPickerBg"></div>
      <div class="camp-form-picker-panel">
        <div class="camp-form-picker-handle"></div>
        <button class="camp-form-picker-item" id="campInfoAishaBtn">
          <div class="camp-form-picker-icon">✦</div>
          <div>Ask Aisha to help fill this in</div>
        </button>
      </div>
    </div>
    <div class="camp-form-sheet-topbar">
      <button class="camp-form-sheet-back" id="campInfoSheetClose">‹</button>
      <div class="camp-form-sheet-title">Campaign Overview</div>
      <button class="camp-form-sheet-doc" id="campInfoSheetDoc">Open Doc</button>
    </div>
    <div class="camp-form-sheet-body">
      <div class="notion-field">
        <div class="notion-label">CAMPAIGN NAME</div>
        <input class="notion-input" id="campEditName" value="${campaign.name}" placeholder="Campaign name">
      </div>
      <div class="notion-field">
        <div class="notion-label">DATES</div>
        <div style="display:flex;gap:10px">
          <input class="notion-input" id="campEditStart" value="${campaign.startDate}" placeholder="Start" style="flex:1">
          <input class="notion-input" id="campEditEnd" value="${campaign.endDate}" placeholder="End" style="flex:1">
        </div>
      </div>
      <div class="notion-field">
        <div class="notion-label">OBJECTIVE</div>
        <textarea class="notion-textarea" id="ov_objective" placeholder="What's the goal of this campaign?">${campaign.ov_objective || ''}</textarea>
      </div>
      <div class="notion-field">
        <div class="notion-label">TARGET AUDIENCE</div>
        <textarea class="notion-textarea" id="ov_audience" placeholder="Who are we speaking to?">${campaign.ov_audience || ''}</textarea>
      </div>
      <div class="notion-field">
        <div class="notion-label">CORE MESSAGE</div>
        <textarea class="notion-textarea" id="ov_message" placeholder="Main theme or hook">${campaign.ov_message || ''}</textarea>
      </div>
      <div class="notion-field">
        <div class="notion-label">PLATFORMS</div>
        <input type="hidden" id="ov_platforms" value="${campaign.ov_platforms || ''}">
        <div class="platform-pills" id="ovPlatformPills">
          ${['Instagram','TikTok','Facebook','YouTube','X','LinkedIn','Pinterest','Threads','Snapchat','Email'].map(p =>
            `<button type="button" class="platform-pill${(campaign.ov_platforms||'').split(',').map(s=>s.trim()).includes(p) ? ' active' : ''}" data-platform="${p}">${p}</button>`
          ).join('')}
        </div>
      </div>
      <div class="notion-field">
        <div class="notion-label">CALL TO ACTION</div>
        <input class="notion-input" id="ov_cta" value="${campaign.ov_cta || ''}" placeholder="What do you want people to do?">
      </div>
      <div class="notion-field">
        <div class="notion-label">TIMELINE & MILESTONES</div>
        <textarea class="notion-textarea" id="ov_timeline" placeholder="Key dates, launch moments, deadlines">${campaign.ov_timeline || ''}</textarea>
      </div>
      <div class="notion-field" style="margin-bottom:20px">
        <div class="notion-label">NOTES</div>
        <textarea class="notion-textarea" id="ov_notes" placeholder="Anything else…">${campaign.ov_notes || ''}</textarea>
      </div>
    </div>
    <div class="camp-form-sheet-footer">
      <button class="camp-save-btn" style="flex:1" id="campInfoSheetSave">Save Overview</button>
      <button class="camp-form-fab" id="campInfoSheetPlus">+</button>
    </div>`;
  document.body.appendChild(infoSheet);

  const planSheet = document.createElement('div');
  planSheet.className = 'camp-form-sheet';
  planSheet.id = 'campPlanSheet';
  planSheet.innerHTML = `
    <div class="camp-form-picker" id="campPlanPicker" style="display:none">
      <div class="camp-form-picker-bg" id="campPlanPickerBg"></div>
      <div class="camp-form-picker-panel">
        <div class="camp-form-picker-handle"></div>
        <button class="camp-form-picker-item" id="campPlanAishaBtn">
          <div class="camp-form-picker-icon">✦</div>
          <div>Ask Aisha to help fill this in</div>
        </button>
      </div>
    </div>
    <div class="camp-form-sheet-topbar">
      <button class="camp-form-sheet-back" id="campPlanSheetClose">‹</button>
      <div class="camp-form-sheet-title">Content Plan</div>
      <button class="camp-form-sheet-doc" id="campPlanSheetDoc">Open Doc</button>
    </div>
    <div class="camp-form-sheet-body">
      <div class="notion-field">
        <div class="notion-label">CONTENT FORMATS</div>
        <input class="notion-input" id="cp_formats" value="${campaign.cp_formats || ''}" placeholder="Reels, Carousels, Stories, Email…">
      </div>
      <div class="notion-field">
        <div class="notion-label">POSTING CADENCE</div>
        <textarea class="notion-textarea" id="cp_cadence" placeholder="How often, which days, which platforms">${campaign.cp_cadence || ''}</textarea>
      </div>
      <div class="notion-field">
        <div class="notion-label">CONTENT PILLARS</div>
        <textarea class="notion-textarea" id="cp_pillars" placeholder="Main themes to hit across this campaign">${campaign.cp_pillars || ''}</textarea>
      </div>
      <div class="notion-field">
        <div class="notion-label">CONTENT MIX</div>
        <textarea class="notion-textarea" id="cp_mix" placeholder="% breakdown — educational, storytelling, promotional…">${campaign.cp_mix || ''}</textarea>
      </div>
      <div class="notion-field">
        <div class="notion-label">REPURPOSING STRATEGY</div>
        <textarea class="notion-textarea" id="cp_repurposing" placeholder="How will content be reused across formats/platforms">${campaign.cp_repurposing || ''}</textarea>
      </div>
      <div class="notion-field" style="margin-bottom:20px">
        <div class="notion-label">NOTES</div>
        <textarea class="notion-textarea" id="cp_notes" placeholder="Anything else…">${campaign.cp_notes || ''}</textarea>
      </div>
    </div>
    <div class="camp-form-sheet-footer">
      <button class="camp-save-btn" style="flex:1" id="campPlanSheetSave">Save Content Plan</button>
      <button class="camp-form-fab" id="campPlanSheetPlus">+</button>
    </div>`;
  document.body.appendChild(planSheet);

  // Auto-resize all textareas in both sheets
  const autoResize = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  [infoSheet, planSheet].forEach(sheet => {
    sheet.querySelectorAll('textarea').forEach(ta => {
      autoResize(ta);
      ta.addEventListener('input', () => autoResize(ta));
    });
  });

  // Platform pill toggles — keep hidden input in sync so getVal() still works
  infoSheet.querySelectorAll('#ovPlatformPills .platform-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      const selected = Array.from(infoSheet.querySelectorAll('#ovPlatformPills .platform-pill.active'))
        .map(p => p.dataset.platform).join(', ');
      document.getElementById('ov_platforms').value = selected;
    });
  });

  // Open sheets when tapping cards
  document.getElementById('campInfoCard')?.addEventListener('click', e => {
    if (e.target.closest('#campInfoDocBtn')) return;
    requestAnimationFrame(() => infoSheet.classList.add('open'));
  });
  document.getElementById('campPlanCard')?.addEventListener('click', e => {
    if (e.target.closest('#campPlanDocBtn')) return;
    requestAnimationFrame(() => planSheet.classList.add('open'));
  });

  // Open Doc buttons on cards (navigate without saving)
  document.getElementById('campInfoDocBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    navigate(`#/doc?brandId=${brandId}&campId=${campId}&type=overview`);
  });
  document.getElementById('campPlanDocBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    navigate(`#/doc?brandId=${brandId}&campId=${campId}&type=plan`);
  });

  // Close buttons
  document.getElementById('campInfoSheetClose')?.addEventListener('click', () => {
    infoSheet.classList.remove('open');
  });
  document.getElementById('campPlanSheetClose')?.addEventListener('click', () => {
    planSheet.classList.remove('open');
  });

  // + FAB → show picker
  document.getElementById('campInfoSheetPlus')?.addEventListener('click', () => {
    document.getElementById('campInfoPicker').style.display = 'flex';
  });
  document.getElementById('campPlanSheetPlus')?.addEventListener('click', () => {
    document.getElementById('campPlanPicker').style.display = 'flex';
  });

  // Picker bg → dismiss
  document.getElementById('campInfoPickerBg')?.addEventListener('click', () => {
    document.getElementById('campInfoPicker').style.display = 'none';
  });
  document.getElementById('campPlanPickerBg')?.addEventListener('click', () => {
    document.getElementById('campPlanPicker').style.display = 'none';
  });

  // Ask Aisha → close picker, close form sheet, open Aisha sheet
  document.getElementById('campInfoAishaBtn')?.addEventListener('click', () => {
    document.getElementById('campInfoPicker').style.display = 'none';
    infoSheet.classList.remove('open');
    document.getElementById('aishaSheet').style.display = 'flex';
  });
  document.getElementById('campPlanAishaBtn')?.addEventListener('click', () => {
    document.getElementById('campPlanPicker').style.display = 'none';
    planSheet.classList.remove('open');
    document.getElementById('aishaSheet').style.display = 'flex';
  });

  // Open Doc from inside sheets (auto-save first)
  document.getElementById('campInfoSheetDoc')?.addEventListener('click', () => {
    const upd = brand.campaigns.map(c => c.id === campId ? { ...c,
      name: getVal('campEditName') || c.name,
      startDate: getVal('campEditStart') || c.startDate,
      endDate: getVal('campEditEnd') || c.endDate,
      ov_objective: getVal('ov_objective'),
      ov_audience:  getVal('ov_audience'),
      ov_message:   getVal('ov_message'),
      ov_platforms: getVal('ov_platforms'),
      ov_cta:       getVal('ov_cta'),
      ov_timeline:  getVal('ov_timeline'),
      ov_notes:     getVal('ov_notes'),
    } : c);
    saveBrandOverride(brandId, { campaigns: upd });
    navigate(`#/doc?brandId=${brandId}&campId=${campId}&type=overview`);
  });
  document.getElementById('campPlanSheetDoc')?.addEventListener('click', () => {
    const upd = brand.campaigns.map(c => c.id === campId ? { ...c,
      cp_formats:     getVal('cp_formats'),
      cp_cadence:     getVal('cp_cadence'),
      cp_pillars:     getVal('cp_pillars'),
      cp_mix:         getVal('cp_mix'),
      cp_repurposing: getVal('cp_repurposing'),
      cp_notes:       getVal('cp_notes'),
    } : c);
    saveBrandOverride(brandId, { campaigns: upd });
    navigate(`#/doc?brandId=${brandId}&campId=${campId}&type=plan`);
  });

  // Save buttons inside sheets
  document.getElementById('campInfoSheetSave')?.addEventListener('click', () => {
    const patch = {
      name:         getVal('campEditName') || campaign.name,
      startDate:    getVal('campEditStart') || campaign.startDate,
      endDate:      getVal('campEditEnd')   || campaign.endDate,
      ov_objective: getVal('ov_objective'),
      ov_audience:  getVal('ov_audience'),
      ov_message:   getVal('ov_message'),
      ov_platforms: getVal('ov_platforms'),
      ov_cta:       getVal('ov_cta'),
      ov_timeline:  getVal('ov_timeline'),
      ov_notes:     getVal('ov_notes'),
    };
    const updatedCampaigns = brand.campaigns.map(c => c.id === campId ? { ...c, ...patch } : c);
    saveBrandOverride(brandId, { campaigns: updatedCampaigns });
    infoSheet.classList.remove('open');
  });
  document.getElementById('campPlanSheetSave')?.addEventListener('click', () => {
    const patch = {
      cp_formats:     getVal('cp_formats'),
      cp_cadence:     getVal('cp_cadence'),
      cp_pillars:     getVal('cp_pillars'),
      cp_mix:         getVal('cp_mix'),
      cp_repurposing: getVal('cp_repurposing'),
      cp_notes:       getVal('cp_notes'),
      contentPlan:    [getVal('cp_formats'), getVal('cp_cadence'), getVal('cp_pillars')].filter(Boolean).join('\n\n'),
    };
    const updatedCampaigns = brand.campaigns.map(c => c.id === campId ? { ...c, ...patch } : c);
    saveBrandOverride(brandId, { campaigns: updatedCampaigns });
    planSheet.classList.remove('open');
  });

  // BRAND SNAPSHOT toggle
  const campSnapToggle  = document.getElementById('campSnapToggle');
  const campSnapBody    = document.getElementById('campSnapBody');
  const campSnapChevron = document.getElementById('campSnapChevron');
  campSnapToggle?.addEventListener('click', () => {
    const open = campSnapBody.style.display === 'none';
    campSnapBody.style.display = open ? 'block' : 'none';
    campSnapChevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  bindCapture();
}

/* ═══════════════════════════════════════
   PAGE: INSPIRATION
═══════════════════════════════════════ */
function pageInspiration(id) {
  const brand = getBrand(id);
  if (!brand) return pageHome();

  const itemsHTML = brand.inspiration.map(item => `
    <div class="inspiration-card">
      <div class="inspiration-type">${item.type.toUpperCase()}</div>
      <div class="inspiration-content">${item.content}</div>
    </div>
  `).join('');

  return `
    <div class="page">
      <div class="back-header">
        <button class="back-btn" data-href="#/brand?id=${id}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">INSPIRATION</div>
          <div class="back-header-title">${brand.name}</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div class="inspiration-grid">
        ${itemsHTML}
        <div class="inspiration-add">
          <span style="font-size:24px;font-weight:200">+</span>
          <span style="font-size:12px">Add inspiration</span>
        </div>
      </div>
    </div>
    ${pageChrome()}
  `;
}

/* ═══════════════════════════════════════
   DOC PAGE: HELPERS
═══════════════════════════════════════ */
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function placeCursorAtEnd(el) {
  try {
    const r = document.createRange(), s = window.getSelection();
    r.selectNodeContents(el); r.collapse(false);
    s.removeAllRanges(); s.addRange(r);
  } catch(e) {}
}

function getDefaultOvBlocks(campaign) {
  const uid = () => 'b' + Math.random().toString(36).slice(2,8);
  const blocks = [{ id: uid(), type: 'h1', text: campaign.name || 'Campaign Overview', generated: true }];
  [['ov_objective','Objective'],['ov_audience','Target Audience'],['ov_message','Core Message'],
   ['ov_platforms','Platforms'],['ov_cta','Call to Action'],['ov_timeline','Timeline'],['ov_notes','Notes']
  ].forEach(([k,l]) => {
    blocks.push({ id: uid(), type: 'h2', text: l, generated: true });
    blocks.push({ id: uid(), type: 'text', text: campaign[k] || '', generated: true });
  });
  return blocks;
}

function getDefaultCpBlocks(campaign) {
  const uid = () => 'b' + Math.random().toString(36).slice(2,8);
  const blocks = [{ id: uid(), type: 'h1', text: 'Content Plan', generated: true }];
  [['cp_formats','Content Formats'],['cp_cadence','Posting Cadence'],['cp_pillars','Content Pillars'],
   ['cp_mix','Content Mix'],['cp_repurposing','Repurposing Strategy'],['cp_notes','Notes']
  ].forEach(([k,l]) => {
    blocks.push({ id: uid(), type: 'h2', text: l, generated: true });
    blocks.push({ id: uid(), type: 'text', text: campaign[k] || '', generated: true });
  });
  return blocks;
}

function renderDocBlocks(blocks) {
  if (!blocks || !blocks.length) return `<div class="doc-empty">Tap + to add your first block</div>`;

  const delBtn  = id => `<button class="doc-block-del" data-id="${id}" aria-label="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  const linkSVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`;
  const imgSVG  = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>`;
  const vidSVG  = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

  return blocks.map(({ id, type, text='', src='', caption='', url='', label='', generated=false }) => {
    if (['h1','h2','h3','text'].includes(type)) {
      if (generated) {
        // Read-only generated content — styled as a proper document
        const safeText = escHtml(text).replace(/"/g, '&quot;');
        if (type === 'h1') {
          return `<div class="doc-block doc-block-gen-h1" data-id="${id}" data-type="${type}" data-gen="true" data-stored="${safeText}">
            <div class="doc-gen-h1">${escHtml(text)}</div>
          </div>`;
        }
        if (type === 'h2') {
          return `<div class="doc-block doc-block-gen-h2" data-id="${id}" data-type="${type}" data-gen="true" data-stored="${safeText}">
            <div class="doc-gen-h2">${escHtml(text)}</div>
          </div>`;
        }
        // generated text block
        return `<div class="doc-block doc-block-gen-text" data-id="${id}" data-type="${type}" data-gen="true" data-stored="${safeText}">
          <div class="doc-gen-text">${text ? escHtml(text).replace(/\n/g,'<br>') : '<span class="doc-gen-empty">—</span>'}</div>
        </div>`;
      }
      // user-added editable block
      const tag = { h1:'H1', h2:'H2', h3:'H3', text:'¶' }[type];
      const ph  = { h1:'Heading', h2:'Subheading', h3:'Small heading', text:'Start typing…' }[type];
      return `<div class="doc-block doc-block-${type}" data-id="${id}" data-type="${type}">
        <div class="doc-block-inner">
          <div class="doc-block-content" contenteditable="true" data-placeholder="${ph}">${escHtml(text)}</div>
          <div class="doc-block-actions"><span class="doc-block-tag">${tag}</span></div>
        </div>
        </div>`;
    }
    if (type === 'image') return `<div class="doc-block doc-block-media" data-id="${id}" data-type="image">
        <div class="doc-media-tap" data-id="${id}">${src ? `<img class="doc-block-img" src="${src}">` : `<div class="doc-media-placeholder">${imgSVG}<span>Tap to add image</span></div>`}</div>
        <div class="doc-block-caption" contenteditable="true" data-placeholder="Add caption…">${escHtml(caption)}</div>
        </div>`;
    if (type === 'video') return `<div class="doc-block doc-block-media" data-id="${id}" data-type="video">
        <div class="doc-media-tap" data-id="${id}">${src ? `<video class="doc-block-vid" src="${src}" controls playsinline></video>` : `<div class="doc-media-placeholder">${vidSVG}<span>Tap to add video</span></div>`}</div>
        </div>`;
    if (type === 'link') return `<div class="doc-block doc-block-link" data-id="${id}" data-type="link">
        <div class="doc-link-icon">${linkSVG}</div>
        <div class="doc-link-fields">
          <input class="doc-link-label" value="${escHtml(label)}" placeholder="Label" style="font-size:16px">
          <input class="doc-link-url" value="${escHtml(url)}" placeholder="https://…" type="url" style="font-size:16px">
        </div>
        </div>`;
    if (type === 'divider') return `<div class="doc-block doc-block-divider" data-id="${id}" data-type="divider">
        <hr class="doc-divider"></div>`;
    return '';
  }).join('');
}

/* ═══════════════════════════════════════
   DOC PAGE: RENDER
═══════════════════════════════════════ */
function pageDoc(brandId, campId, docType) {
  const brand = getBrand(brandId);
  if (!brand) return `<div class="page"></div>${pageChrome()}`;
  const campaign = (brand.campaigns || []).find(c => c.id === campId);
  if (!campaign) return `<div class="page"></div>${pageChrome()}`;

  const docKey = docType === 'overview' ? 'ov_doc' : 'cp_doc';
  const title  = docType === 'overview' ? 'Campaign Overview' : 'Content Plan';
  const blocks = campaign[docKey]?.blocks
    || (docType === 'overview' ? getDefaultOvBlocks(campaign) : getDefaultCpBlocks(campaign));

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="#/campaign?brandId=${brandId}&id=${campId}">‹</button>
        <div style="flex:1;text-align:center;min-width:0">
          <div style="font-size:9px;letter-spacing:1px;color:#3a3a3a;text-transform:uppercase">${escHtml(campaign.name)}</div>
          <div style="font-size:14px;font-weight:600;color:#fff">${title}</div>
        </div>
        <span class="doc-save-status" id="docSaveStatus"></span>
      </div>

      <div class="doc-container" id="docContainer">
        ${renderDocBlocks(blocks)}
      </div>

      <button class="doc-add-fab" id="docAddBtn" aria-label="Add block">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
    ${captureModalHTML()}`;
}

/* ═══════════════════════════════════════
   DOC PAGE: BIND
═══════════════════════════════════════ */
function bindDoc(brandId, campId, docType) {
  const brand = getBrand(brandId);
  if (!brand) return;
  const campaign = (brand.campaigns || []).find(c => c.id === campId);
  if (!campaign) return;

  const docKey = docType === 'overview' ? 'ov_doc' : 'cp_doc';
  let blocks = campaign[docKey]?.blocks
    || (docType === 'overview' ? getDefaultOvBlocks(campaign) : getDefaultCpBlocks(campaign));

  const statusEl = () => document.getElementById('docSaveStatus');
  let saveTimer  = null;

  function schedSave() {
    clearTimeout(saveTimer);
    const el = statusEl(); if (el) el.textContent = '…';
    saveTimer = setTimeout(() => {
      blocks = collectDocBlocks();
      const upd = brand.campaigns.map(c => c.id === campId ? { ...c, [docKey]: { blocks } } : c);
      saveBrandOverride(brandId, { campaigns: upd });
      const el2 = statusEl(); if (el2) { el2.textContent = 'Saved'; setTimeout(() => { if (statusEl()) statusEl().textContent = ''; }, 2000); }
    }, 800);
  }

  function collectDocBlocks() {
    return Array.from(document.querySelectorAll('#docContainer .doc-block[data-id]')).map(el => {
      const id = el.dataset.id, type = el.dataset.type;
      // Generated (read-only) blocks — text stored in data-stored attribute
      if (el.dataset.gen === 'true') return { id, type, text: el.dataset.stored || '', generated: true };
      if (type === 'image' || type === 'video') {
        const s = el.querySelector('.doc-block-img')?.src || el.querySelector('.doc-block-vid')?.src || '';
        return { id, type, src: s.startsWith('blob:') ? '' : s, caption: el.querySelector('.doc-block-caption')?.innerText || '' };
      }
      if (type === 'link') return { id, type, label: el.querySelector('.doc-link-label')?.value || '', url: el.querySelector('.doc-link-url')?.value || '' };
      if (type === 'divider') return { id, type };
      return { id, type, text: el.querySelector('.doc-block-content')?.innerText || '' };
    });
  }

  function reRender(newBlocks) {
    blocks = newBlocks;
    document.getElementById('docContainer').innerHTML = renderDocBlocks(blocks);
    bindBlockEvents();
  }

  function insertBlock(type, afterId, extra) {
    const uid = 'b' + Date.now();
    const nb  = { id: uid, type, text: '', src: '', caption: '', url: '', label: '', ...extra };
    const arr = [...blocks];
    const idx = afterId ? arr.findIndex(b => b.id === afterId) : arr.length - 1;
    arr.splice(idx + 1, 0, nb);
    reRender(arr);
    schedSave();
    if (['h1','h2','h3','text'].includes(type)) {
      const ce = document.querySelector(`#docContainer .doc-block[data-id="${uid}"] .doc-block-content`);
      if (ce) { ce.focus(); placeCursorAtEnd(ce); }
    }
  }

  function deleteBlock(id) { reRender(blocks.filter(b => b.id !== id)); schedSave(); }

  function handleMediaTap(blockId) {
    const block = blocks.find(b => b.id === blockId); if (!block) return;
    const fi = document.createElement('input');
    fi.type = 'file'; fi.accept = block.type === 'image' ? 'image/*' : 'video/*'; fi.style.display = 'none';
    document.body.appendChild(fi); fi.click();
    fi.addEventListener('change', () => {
      const file = fi.files[0]; fi.remove(); if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { blocks = blocks.map(b => b.id === blockId ? { ...b, src: ev.target.result } : b); reRender(blocks); schedSave(); };
      reader.readAsDataURL(file);
    });
  }

  function bindBlockEvents() {
    document.querySelectorAll('#docContainer .doc-block-content').forEach(el => el.addEventListener('input', schedSave));
    document.querySelectorAll('#docContainer .doc-media-tap').forEach(el => el.addEventListener('click', () => handleMediaTap(el.dataset.id)));
    document.querySelectorAll('#docContainer .doc-link-label, #docContainer .doc-link-url').forEach(inp => inp.addEventListener('input', schedSave));
    document.querySelectorAll('#docContainer .doc-block-caption').forEach(el => el.addEventListener('input', schedSave));
  }

  // Block type picker sheet (step 2)
  document.getElementById('docPickerSheet')?.remove();
  const pickerEl = document.createElement('div');
  pickerEl.id = 'docPickerSheet'; pickerEl.className = 'doc-picker-sheet'; pickerEl.style.display = 'none';
  const pickerTypes = [
    { type:'image',   label:'Image',      icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>` },
    { type:'video',   label:'Video',      icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>` },
    { type:'link',    label:'Link',       icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>` },
    { type:'text',    label:'Text Note',  icon:'¶'  },
    { type:'divider', label:'Divider',    icon:'—'  },
  ];
  pickerEl.innerHTML = `
    <div class="doc-picker-bg" id="docPickerBg"></div>
    <div class="doc-picker-panel">
      <div class="doc-picker-bar"></div>
      <div class="doc-picker-title">ADD BLOCK</div>
      <div class="doc-picker-grid">${pickerTypes.map(t => `
        <button class="doc-picker-item" data-type="${t.type}">
          <span class="doc-picker-icon">${t.icon}</span>
          <span class="doc-picker-label">${t.label}</span>
        </button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(pickerEl);

  // Section picker sheet (step 1)
  document.getElementById('docSectionPicker')?.remove();
  const sectionPickerEl = document.createElement('div');
  sectionPickerEl.id = 'docSectionPicker'; sectionPickerEl.className = 'doc-section-picker'; sectionPickerEl.style.display = 'none';
  sectionPickerEl.innerHTML = `
    <div class="doc-section-picker-bg" id="docSectionPickerBg"></div>
    <div class="doc-section-picker-panel">
      <div class="doc-picker-bar"></div>
      <div class="doc-picker-title">INSERT AFTER</div>
      <div id="docSectionList"></div>
    </div>`;
  document.body.appendChild(sectionPickerEl);

  let insertAfterBlockId = null;
  function showPicker(afterId) { insertAfterBlockId = afterId; pickerEl.style.display = 'flex'; }

  function getLastIdInSection(sectionId) {
    const idx = blocks.findIndex(b => b.id === sectionId);
    if (idx === -1) return blocks[blocks.length - 1]?.id || null;
    for (let i = idx + 1; i < blocks.length; i++) {
      if (['h1','h2'].includes(blocks[i].type)) return blocks[i - 1].id;
    }
    return blocks[blocks.length - 1]?.id || sectionId;
  }

  function showSectionPicker() {
    const list = document.getElementById('docSectionList');
    if (!list) return;
    const headers = blocks.filter(b => ['h1','h2'].includes(b.type));
    list.innerHTML = headers.map(b =>
      `<button class="doc-section-item" data-id="${b.id}">
        <span class="doc-section-dot doc-section-dot-${b.type}"></span>
        <span class="doc-section-label">${escHtml(b.text || 'Untitled')}</span>
      </button>`
    ).join('') +
    `<button class="doc-section-item doc-section-end" data-id="__end__">
      <span class="doc-section-dot" style="background:rgba(255,255,255,0.15)"></span>
      <span class="doc-section-label" style="color:#555">End of document</span>
    </button>`;
    list.querySelectorAll('.doc-section-item').forEach(item => {
      item.addEventListener('click', () => {
        sectionPickerEl.style.display = 'none';
        const sid = item.dataset.id;
        const afterId = sid === '__end__' ? (blocks[blocks.length - 1]?.id || null) : getLastIdInSection(sid);
        showPicker(afterId);
      });
    });
    sectionPickerEl.style.display = 'flex';
  }

  document.getElementById('docSectionPickerBg')?.addEventListener('click', () => { sectionPickerEl.style.display = 'none'; });
  document.getElementById('docPickerBg')?.addEventListener('click', () => { pickerEl.style.display = 'none'; });

  pickerEl.querySelectorAll('.doc-picker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      pickerEl.style.display = 'none';
      const type = btn.dataset.type;
      if (type === 'image' || type === 'video') {
        const fi = document.createElement('input');
        fi.type = 'file'; fi.accept = type === 'image' ? 'image/*' : 'video/*'; fi.style.display = 'none';
        document.body.appendChild(fi); fi.click();
        fi.addEventListener('change', () => {
          const file = fi.files[0]; fi.remove(); if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => insertBlock(type, insertAfterBlockId, { src: ev.target.result });
          reader.readAsDataURL(file);
        });
      } else {
        insertBlock(type, insertAfterBlockId);
      }
    });
  });

  bindBlockEvents();
  document.getElementById('docAddBtn')?.addEventListener('click', showSectionPicker);

  // Same campaign nav as the campaign page (Aisha opens campaign page on doc page)
  injectCampaignNav(brandId, campId, 'doc', () => navigate(`#/campaign?brandId=${brandId}&id=${campId}`));
}

/* ── Global settings button delegation (runs once on load) ── */
document.addEventListener('click', e => {
  if (e.target.closest('#navSettings')) openSettings();
});

/* ── iOS zoom-out reset on input/contenteditable blur ── */
document.addEventListener('focusout', () => {
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) return;
  const orig = vp.content;
  vp.content = 'width=device-width,initial-scale=1.0,maximum-scale=1.0';
  setTimeout(() => { vp.content = orig; }, 100);
});
