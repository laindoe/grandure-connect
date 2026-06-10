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
  } else {
    app.innerHTML = pageHome();
  }

  const page = app.querySelector('.page');
  if (page) page.scrollTop = 0;

  bindCapture();
  bindNav();
  bindAddBrand();
  if (path === '/brand') { bindEditBrand(params.id); bindDropdowns(params.id); }
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
  document.getElementById('navSettings')?.addEventListener('click', () => navigate('/settings'));

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
  const campCards = allCampaigns.length ? allCampaigns.map(({ campaign, brand }) => {
    const isCurrentPhase = campaign.status === 'active' && campaign.name === brand.currentPhase.name;
    const pct = campaign.progress != null ? campaign.progress
      : (isCurrentPhase ? brand.currentPhase.progress : 0);
    const postsCompleted = isCurrentPhase ? brand.currentPhase.postsCompleted : 0;
    const totalPosts     = isCurrentPhase ? brand.currentPhase.totalPosts : 0;
    const postLabel = totalPosts > 0 ? `${postsCompleted} / ${totalPosts} posts` : '0 posts';
    const upcomingVal = campaign.status === 'active'
      ? (brand.board.ready[0]?.title || brand.board.drafting[0]?.title || '—')
      : `Starts ${campaign.startDate}`;
    return `
      <div class="home-camp-card" data-href="#/brand?id=${brand.id}">
        <div class="home-camp-banner" style="${bannerStyle(brand)}"></div>
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
    `;
  }).join('') : `<div style="color:#333;font-size:13px;padding:20px 0;text-align:center">No campaigns yet</div>`;

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
      <div class="home-camp-list" id="homeCampsView" style="display:none">${campCards}</div>
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
    if (brandsView) brandsView.style.display = v === 'brands' ? 'block' : 'none';
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

  document.getElementById('openEditBrand')?.addEventListener('click', () => {
    overlay.style.display = 'flex';
  });
  document.getElementById('editBrandCancel')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  document.getElementById('editBrandImage')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      pendingBanner = ev.target.result;
      document.getElementById('editImagePreview').style.display = 'block';
      document.getElementById('editImageThumb').src = pendingBanner;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('editBrandSave')?.addEventListener('click', () => {
    const name = document.getElementById('editBrandName')?.value.trim();
    const patch = {};
    if (name) patch.name = name;
    if (pendingBanner) patch.banner = pendingBanner;
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
