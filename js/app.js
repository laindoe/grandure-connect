/* ── Grandure Connect SPA ── */

const PLATFORM_LABELS = { instagram: 'Instagram', threads: 'Threads', youtube: 'YouTube', tiktok: 'TikTok', twitter: 'X' };
const PLATFORM_SHORT  = { instagram: 'IG', threads: 'TH', youtube: 'YT', tiktok: 'TK', twitter: 'X' };
const ALL_PLATFORMS   = ['Instagram','TikTok','YouTube','Facebook','X','LinkedIn','Threads','Pinterest','Snapchat','Email','Patreon','Discord'];

/* ── Grandure Brand: Universe chapters ── */
const UNIVERSE_CHAPTERS = [
  { id: 'world', label: 'World' },
  { id: 'belief', label: 'Belief' },
  { id: 'citizens', label: 'Citizens' },
  { id: 'characters', label: 'Characters' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'aesthetic', label: 'Aesthetic' },
  { id: 'invitations', label: 'Invitations' },
];

function isChapterComplete(brand, chapterId) {
  const u = brand.brandUniverse || {};
  switch (chapterId) {
    case 'world': return !!(u.world?.name && u.world?.description);
    case 'belief': return !!(u.belief?.statement);
    case 'citizens': return !!(u.citizens?.name && u.citizens?.who);
    case 'characters': return (brand.characters || []).length > 0;
    case 'symbols': return (u.symbols || []).length > 0;
    case 'aesthetic': return !!((u.aesthetic?.palette || []).length && (u.aesthetic?.moodWords || []).length);
    case 'invitations': return !!(u.invitations?.onRamp);
    default: return false;
  }
}

function universeCompletion(brand) {
  const states = UNIVERSE_CHAPTERS.map(c => isChapterComplete(brand, c.id));
  const doneCount = states.filter(Boolean).length;
  const pct = Math.round((doneCount / UNIVERSE_CHAPTERS.length) * 100);
  let nextIdx = states.findIndex(s => !s);
  if (nextIdx === -1) nextIdx = UNIVERSE_CHAPTERS.length - 1;
  return { pct, states, nextIdx };
}

/* ── Grandure Brand: Universe Wizard — question/field config ── */
const UNIVERSE_CHAPTER_FIELDS = {
  world: [
    { key: 'name', q: "What is the name of your universe?", type: 'text' },
    { key: 'description', q: "Describe your world in a sentence or two — what does it feel, look, and sound like?", type: 'textarea' },
    { key: 'tension', q: "What's the central tension or transformation at the heart of this world?", type: 'textarea' },
    { key: 'setting', q: "What kind of setting is this?", type: 'chips', multi: false, options: ['Digital Realm', 'Physical Movement', 'Mythic Landscape', 'Everyday Magic', 'Other'] },
  ],
  belief: [
    { key: 'statement', q: "What's the one belief at the center of your universe?", type: 'textarea' },
    { key: 'differentiator', q: "What does your brand believe that others don't?", type: 'textarea' },
    { key: 'oldParadigm', q: "What old paradigm or status quo are you rebelling against?", type: 'textarea' },
  ],
  citizens: [
    { key: 'name', q: "What do the citizens of your universe call themselves?", type: 'text' },
    { key: 'who', q: "Who are they? Describe the people who belong here.", type: 'textarea' },
    { key: 'unites', q: "What unites them?", type: 'textarea' },
    { key: 'transformation', q: "What transformation do they go through as citizens of this world?", type: 'textarea' },
  ],
  invitations: [
    { key: 'onRamp', q: "How do people enter your universe — what's the on-ramp?", type: 'textarea' },
    { key: 'cta', q: "What's the call to action that invites people in?", type: 'text' },
    { key: 'reward', q: "What do citizens receive once they join?", type: 'textarea' },
  ],
};
const AESTHETIC_MOOD_WORDS = ['Futuristic', 'Organic', 'Luxury', 'Playful', 'Minimal', 'Maximalist', 'Editorial', 'Raw', 'Ethereal', 'Bold'];
const AESTHETIC_PRESET_COLORS = ['#1a0a2e','#0a1628','#0f1c0f','#1c0a0a','#1c1c0a','#0a1a1c','#1c0a18','#1c1c1e','#d4aaff','#ffffff'];

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

function uid() { return Math.random().toString(36).slice(2, 9); }

function toDateInputVal(str) {
  if (!str) return '';
  const months = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
  const m = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return str.includes('-') ? str : '';
  const mo = String(months[m[1]] || 1).padStart(2,'0');
  return `${m[3]}-${mo}-${String(m[2]).padStart(2,'0')}`;
}

function fromDateInputVal(val) {
  if (!val) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, mo, d] = val.split('-').map(Number);
  if (!y) return val;
  return `${months[mo-1]} ${d}, ${y}`;
}

window.addEventListener('hashchange', render);
window.addEventListener('load', render);

function render() {
  const { path, params } = parseHash();
  const app = document.getElementById('app');
  let _uwChapterIdx = 0; // set when path === '/gb-universe', used by bindUniverseWizard below

  // Remove sheets that belong only to campaign/doc contexts
  if (path !== '/campaign') {
    document.getElementById('campMoreSheet')?.remove();
    document.getElementById('aishaSheet')?.remove();
    document.getElementById('campInfoSheet')?.remove();
    document.getElementById('campPlanSheet')?.remove();
  }
  if (path !== '/doc') {
    document.getElementById('docPickerSheet')?.remove();
    document.getElementById('docSectionPicker')?.remove();
  }
  // Always clear old nav so each page re-injects a fresh one
  document.getElementById('campaignBottomNav')?.remove();
  document.getElementById('brandAppNav')?.remove();
  document.getElementById('mainMenuOverlay')?.remove();

  if (path === '/' || path === '') {
    app.innerHTML = pageHome();
    bindHomeDock();
  } else if (path === '/brand') {
    app.innerHTML = pageBrandWorkspace(params.id);
    injectCampaignNav(params.id, params.campId || null, 'visual');
  } else if (path === '/phase') {
    app.innerHTML = pageCurrentPhase(params.id);
    injectCampaignNav(params.id, params.campId || null, null);
  } else if (path === '/overview') {
    app.innerHTML = pageOverview(params.id);
    injectCampaignNav(params.id, params.campId || null, null);
  } else if (path === '/platform') {
    app.innerHTML = pagePlatformStrategy(params.id);
    injectCampaignNav(params.id, params.campId || null, null);
  } else if (path === '/season') {
    app.innerHTML = pageSeason(params.id);
    injectCampaignNav(params.id, params.campId || null, null);
  } else if (path === '/vault') {
    app.innerHTML = pageIdeaVault(params.id, null, null, null, params.campId || null, null);
    bindVaultPage(params.id);
    injectCampaignNav(params.id, params.campId || null, 'ideas');
  } else if (path === '/analytics') {
    app.innerHTML = pageAnalytics(params.brandId, params.campId, params.platform);
  } else if (path === '/inspiration') {
    app.innerHTML = pageInspiration(params.id);
    injectCampaignNav(params.id, params.campId || null, null);
  } else if (path === '/planner') {
    app.innerHTML = pageVisualPlanner(params.brandId, params.campId || null);
    injectCampaignNav(params.brandId, params.campId || null, 'visual');
  } else if (path === '/calendar') {
    app.innerHTML = pageCalendar(params.brandId, params.campId || null);
    injectCampaignNav(params.brandId, params.campId || null, 'cal');
  } else if (path === '/campaign') {
    app.innerHTML = pageCampaign(params.brandId, params.id);
  } else if (path === '/analytics') {
    app.innerHTML = pageAnalytics(params.brandId, params.campId, params.platform);
    injectCampaignNav(params.brandId, params.campId || null, null);
  } else if (path === '/doc') {
    app.innerHTML = pageDoc(params.brandId, params.campId, params.type);
  } else if (path === '/hub') {
    app.innerHTML = pageHub();
  } else if (path === '/plan') {
    app.innerHTML = pagePlanPlaceholder();
  } else if (path === '/orbit') {
    app.innerHTML = pageOrbit();
    injectOrbitNav('home');
  } else if (path === '/orbit-productions') {
    app.innerHTML = pageOrbitProductions();
    injectOrbitNav('productions');
  } else if (path === '/orbit-agents') {
    app.innerHTML = pageOrbitStub('agents', 'Agents', 'AI agents, human contractors, and team members');
    injectOrbitNav('agents');
  } else if (path === '/orbit-assets') {
    app.innerHTML = pageOrbitStub('assets', 'Assets', 'Images, video, audio, documents, and brand resources');
    injectOrbitNav('assets');
  } else if (path === '/orbit-inbox') {
    app.innerHTML = pageOrbitStub('inbox', 'Inbox', 'Agent messages, approvals, mentions, and requests');
    injectOrbitNav('inbox');
  } else if (path === '/grandure-brand') {
    app.innerHTML = pageGrandureBrandPicker();
  } else if (path === '/gb-home') {
    app.innerHTML = pageGrandureBrandHome(params.id);
    injectBrandAppNav(params.id, 'home');
  } else if (path === '/gb-universe') {
    const _uwBrand = getBrand(params.id);
    _uwChapterIdx = parseInt(params.chapter, 10);
    if (!_uwBrand || isNaN(_uwChapterIdx) || _uwChapterIdx < 0 || _uwChapterIdx >= UNIVERSE_CHAPTERS.length) {
      _uwChapterIdx = _uwBrand ? universeCompletion(_uwBrand).nextIdx : 0;
    }
    app.innerHTML = pageUniverseWizard(params.id, _uwChapterIdx);
    injectBrandAppNav(params.id, 'universe');
  } else if (path === '/gb-characters') {
    app.innerHTML = pageCharacters(params.id);
    injectBrandAppNav(params.id, 'characters');
  } else if (path === '/gb-assets') {
    app.innerHTML = pageAssets(params.id);
    injectBrandAppNav(params.id, 'assets');
  } else if (path === '/gb-bible') {
    app.innerHTML = pageBible(params.id);
    injectBrandAppNav(params.id, 'bible');
  } else {
    app.innerHTML = pageHome();
  }

  const page = app.querySelector('.page');
  if (page) page.scrollTop = 0;

  bindCapture();
  bindNav();
  bindAddBrand();
  if (path === '/brand')    { bindEditBrand(params.id); bindDropdowns(params.id); }
  if (path === '/campaign') { bindCampaignPage(params.brandId, params.id); }
  if (path === '/vault')    { bindVaultPage(params.id, params.campId || null); }
  if (path === '/hub')      { document.getElementById('hubMenuBtn')?.addEventListener('click', openMainMenu); }
  if (path === '/planner')  { bindVisualPlanner(params.brandId, params.campId || null); }
  if (path === '/calendar') { bindCalendar(params.brandId, params.campId || null); }
  if (path === '/doc')      { bindDoc(params.brandId, params.campId, params.type); }
  if (path === '/gb-universe') { bindUniverseWizard(params.id, _uwChapterIdx); }
  if (path === '/gb-characters') { bindCharacters(params.id); }
  if (path === '/gb-assets') { bindAssets(params.id); }
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
let _processAishaInput = null;

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

/* ── Main Menu (slide-in drawer) ── */
function openMainMenu() {
  // Re-use existing overlay if already mounted
  let overlay = document.getElementById('mainMenuOverlay');
  if (overlay) { return; }

  const soonBadge = `<span class="main-menu-badge">SOON</span>`;

  const rows = [
    { href: '#/hub', label: 'Home', icon: `<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"/><path d="M9 21v-9h6v9"/>` },
    { href: '#/grandure-brand', label: 'Grandure Brand', icon: `<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>` },
    { href: '#/plan', label: 'Grandure Plan', icon: `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>`, soon: true },
    { href: '#/', label: 'Grandure Connect', icon: `<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>` },
    { href: '#/orbit', label: 'Grandure Orbit', icon: `<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4"/>` },
  ];

  const rowsHTML = rows.map(r => `
    <button class="main-menu-row" data-href="${r.href}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${r.icon}</svg>
      <span class="main-menu-row-label">${r.label}</span>
      ${r.soon ? soonBadge : ''}
    </button>
  `).join('');

  const el = document.createElement('div');
  el.innerHTML = `
    <div class="main-menu-overlay" id="mainMenuOverlay">
      <div class="main-menu-panel" id="mainMenuPanel">
        <div class="main-menu-header">
          <div class="main-menu-wordmark">GRANDURE</div>
          <button class="main-menu-close" id="mmClose">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="main-menu-rows">${rowsHTML}</div>
      </div>
    </div>`;
  document.body.appendChild(el.firstElementChild);
  overlay = document.getElementById('mainMenuOverlay');
  const panel = document.getElementById('mainMenuPanel');

  const close = () => {
    panel.style.transform = 'translateX(-100%)';
    setTimeout(() => overlay.remove(), 300);
  };

  requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; });

  document.getElementById('mmClose')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelectorAll('.main-menu-row').forEach(btn => {
    btn.addEventListener('click', () => {
      const href = btn.dataset.href;
      overlay.remove();
      navigate(href.replace('#', ''));
    });
  });
}

/* ── Idea Capture Modal ── */
let captureState = { platforms: [], formats: [], brandId: '', campaignId: '' };

const CAPTURE_PLATFORMS = [
  'instagram','tiktok','youtube','threads','twitter','linkedin','facebook','pinterest','podcast','email','patreon'
];
const CAPTURE_PLAT_LABELS = {
  instagram:'Instagram', tiktok:'TikTok', youtube:'YouTube', threads:'Threads',
  twitter:'X', linkedin:'LinkedIn', facebook:'Facebook', pinterest:'Pinterest',
  podcast:'Podcast', email:'Email', patreon:'Patreon',
};

function captureModalHTML() {
  const brandOptions = BRANDS.map(b =>
    `<option value="${b.id}">${escHtml(b.name)}</option>`
  ).join('');
  return `
    <div class="capture-overlay" id="captureOverlay" style="display:none">
      <div class="capture-sheet" style="padding:0;display:flex;flex-direction:column;max-height:88dvh">
        <div style="padding:20px 24px 12px;flex-shrink:0">
          <div class="capture-title">New Idea</div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:0 24px 8px">
          <textarea class="capture-textarea" id="captureText" placeholder="What's the idea?" style="margin-bottom:16px"></textarea>
          <div class="capture-section-label">BRAND</div>
          <select id="captureBrandSel" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;margin-bottom:14px;outline:none;color-scheme:dark">
            <option value="">— Select brand —</option>
            ${brandOptions}
          </select>
          <div class="capture-section-label">CAMPAIGN</div>
          <select id="captureCampSel" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;margin-bottom:14px;outline:none;color-scheme:dark">
            <option value="">— Select campaign —</option>
          </select>
          <div class="capture-section-label">PLATFORM <span style="color:rgba(255,255,255,0.25);font-size:9px;font-weight:400;letter-spacing:0">select all that apply</span></div>
          <div class="capture-chips" id="capturePlatformChips">
            ${CAPTURE_PLATFORMS.map(p =>
              `<button class="capture-chip" data-platform="${p}">${CAPTURE_PLAT_LABELS[p]}</button>`
            ).join('')}
          </div>
          <div class="capture-section-label">FORMAT <span style="color:rgba(255,255,255,0.25);font-size:9px;font-weight:400;letter-spacing:0">select all that apply</span></div>
          <div class="capture-chips" id="captureFormatChips">
            <span style="color:rgba(255,255,255,0.2);font-size:12px">Pick a platform first</span>
          </div>
        </div>
        <div style="padding:12px 24px;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0">
          <div class="capture-actions" style="margin-top:0">
            <button class="capture-cancel" id="captureCancel">Cancel</button>
            <button class="capture-save" id="captureSave">Save Idea</button>
          </div>
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
      <div style="position:relative;display:flex;align-items:center;justify-content:center">
      <button class="nav-btn nav-btn-center" id="dockCapture">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>
        </button>
      </div>
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

  const reset = () => {
    captureState = { platforms: [], formats: [], brandId: '', campaignId: '' };
    overlay.querySelector('#captureText').value = '';
    overlay.querySelector('#captureBrandSel').value = '';
    overlay.querySelector('#captureCampSel').innerHTML = '<option value="">— Select campaign —</option>';
    overlay.querySelectorAll('.capture-chip').forEach(c => c.classList.remove('active'));
    overlay.querySelector('#captureFormatChips').innerHTML = '<span style="color:rgba(255,255,255,0.2);font-size:12px">Pick a platform first</span>';
  };

  const open = () => {
    const brandSel = overlay.querySelector('#captureBrandSel');
    const currentVal = brandSel.value;
    brandSel.innerHTML = '<option value="">— Select brand —</option>' +
      BRANDS.map(b => `<option value="${b.id}"${b.id===currentVal?' selected':''}>${escHtml(b.name)}</option>`).join('');
    if (!currentVal && BRANDS.length === 1) {
      brandSel.value = BRANDS[0].id;
      brandSel.dispatchEvent(new Event('change'));
    }
    overlay.style.display = 'flex';
  };
  window._openCapture = open;
  const close = () => { overlay.style.display = 'none'; };

  document.getElementById('navCapture')?.addEventListener('click', open);
  document.getElementById('captureCancel')?.addEventListener('click', () => { reset(); close(); });
  document.getElementById('navHome')?.addEventListener('click', () => navigate('/'));
  overlay.addEventListener('click', e => { if (e.target === overlay) { reset(); close(); } });

  // Brand → populate campaign dropdown
  overlay.querySelector('#captureBrandSel')?.addEventListener('change', function() {
    captureState.brandId = this.value;
    captureState.campaignId = '';
    const campSel = overlay.querySelector('#captureCampSel');
    const brand = getBrand(this.value);
    campSel.innerHTML = '<option value="">— Select campaign —</option>' +
      (brand?.campaigns || []).map(c =>
        `<option value="${c.id}">${escHtml(c.name)}</option>`
      ).join('');
  });

  overlay.querySelector('#captureCampSel')?.addEventListener('change', function() {
    captureState.campaignId = this.value;
  });

  // Rebuild format chips from all currently selected platforms
  function rebuildFormats() {
    const fmtChips = overlay.querySelector('#captureFormatChips');
    const plats = captureState.platforms;
    if (!plats.length) {
      fmtChips.innerHTML = '<span style="color:rgba(255,255,255,0.2);font-size:12px">Pick a platform first</span>';
      captureState.formats = [];
      return;
    }
    const seen = new Set();
    const formats = [];
    plats.forEach(p => {
      (PLATFORM_FORMATS[p] || []).forEach(f => {
        if (!seen.has(f)) { seen.add(f); formats.push(f); }
      });
    });
    fmtChips.innerHTML = formats.map(f =>
      `<button class="capture-chip${captureState.formats.includes(f) ? ' active' : ''}" data-format="${f}">${f}</button>`
    ).join('');
    // Re-bind format toggle
    fmtChips.querySelectorAll('[data-format]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const f = btn.dataset.format;
        captureState.formats = btn.classList.contains('active')
          ? [...captureState.formats, f]
          : captureState.formats.filter(x => x !== f);
      });
    });
  }

  // Platform multi-select
  overlay.querySelectorAll('#capturePlatformChips [data-platform]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const p = btn.dataset.platform;
      captureState.platforms = btn.classList.contains('active')
        ? [...captureState.platforms, p]
        : captureState.platforms.filter(x => x !== p);
      rebuildFormats();
    });
  });

  // Save — actually persist to brand ideas
  overlay.querySelector('#captureSave')?.addEventListener('click', () => {
    const text = overlay.querySelector('#captureText')?.value.trim();
    if (!text) { overlay.querySelector('#captureText').focus(); return; }

    const brand = getBrand(captureState.brandId);
    if (brand) {
      const campaign = (brand.campaigns || []).find(c => c.id === captureState.campaignId);
      const idea = {
        id: uid(),
        title: text,
        platform: captureState.platforms[0] || '',
        platforms: captureState.platforms,
        format: captureState.formats[0] || '',
        formats: captureState.formats,
        campaign: campaign?.name || '',
        campaignId: captureState.campaignId || '',
        notes: '', references: '', links: [],
      };
      const updatedIdeas = [...(brand.ideas || []), idea];
      saveBrandOverride(captureState.brandId, { ideas: updatedIdeas });
    }
    const savedBrandId = captureState.brandId;
    reset();
    close();
    if (savedBrandId) {
      if (window.location.hash.includes('/vault')) {
        const params = parseHash();
        window.vaultFilter(savedBrandId, 'all', 'all', 'all', params.campId || null, 'all');
      } else {
        navigate(`/vault?id=${savedBrandId}`);
      }
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
  const getDaysLeft = ({ campaign }) => {
    const iso = toDateInputVal(campaign.endDate);
    if (!iso) return Infinity;
    const [y, mo, d] = iso.split('-').map(Number);
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.ceil((new Date(y, mo - 1, d) - today) / 86400000);
  };
  const sorted = [...allCampaigns];
  if (_campFilter === 'brand')    sorted.sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  if (_campFilter === 'pct')      sorted.sort((a, b) => getPct(b) - getPct(a));
  if (_campFilter === 'daysleft') sorted.sort((a, b) => getDaysLeft(a) - getDaysLeft(b));
  if (_campFilter === 'status') {
    const HOME_STAGE_ORDER = ['Ideation','Planning','Production','Publish','Dormant','Complete'];
    sorted.sort((a, b) => {
      const ai = a.campaign.stage != null ? a.campaign.stage : (a.campaign.status === 'active' ? 2 : 1);
      const bi = b.campaign.stage != null ? b.campaign.stage : (b.campaign.status === 'active' ? 2 : 1);
      return ai - bi;
    });
  }

  const filterLabel = { date: 'Date', brand: 'Brand', pct: '% Complete', daysleft: 'Days Left', status: 'Status' }[_campFilter] || 'Date';

  const campCards = sorted.length ? sorted.map(({ campaign, brand }) => {
    const isCurrentPhase = campaign.status === 'active' && campaign.name === brand.currentPhase.name;
    const pct = getPct({ campaign, brand });
    const postsCompleted = isCurrentPhase ? brand.currentPhase.postsCompleted : 0;
    const totalPosts     = isCurrentPhase ? brand.currentPhase.totalPosts : 0;
    const postLabel = totalPosts > 0 ? `${postsCompleted} / ${totalPosts} posts` : '0 posts';
    const HOME_STAGE_LABELS = ['Ideation', 'Planning', 'Production', 'Publish', 'Dormant', 'Complete'];
    const stageIdx = campaign.stage != null ? campaign.stage : (campaign.status === 'active' ? 2 : campaign.status === 'upcoming' ? 1 : 0);
    const stageLabel = HOME_STAGE_LABELS[stageIdx] || 'Ideation';
    const homeDaysLeft = (() => {
      const iso = toDateInputVal(campaign.endDate);
      if (!iso) return '';
      const [y, mo, d] = iso.split('-').map(Number);
      const today = new Date(); today.setHours(0,0,0,0);
      const days = Math.ceil((new Date(y, mo - 1, d) - today) / 86400000);
      if (days < 0) return { label: 'Ended', cls: 'red' };
      if (days === 0) return { label: 'Last day', cls: 'red' };
      const cls = days > 100 ? 'green' : days > 25 ? 'yellow' : 'red';
      return { label: `${days} days left`, cls };
    })();
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
        ${homeDaysLeft ? `<div class="home-camp-days-pill home-camp-days-${homeDaysLeft.cls}">${homeDaysLeft.label}</div>` : ''}
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
                  <div class="home-camp-stage-badge home-camp-stage-${stageIdx}" data-stage-brand="${brand.id}" data-stage-camp="${campaign.id}" data-stage-idx="${stageIdx}">${stageLabel}</div>
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
          <button class="camp-filter-opt${_campFilter === 'daysleft' ? ' active' : ''}" data-cf="daysleft">Days Left</button>
          <button class="camp-filter-opt${_campFilter === 'status' ? ' active' : ''}" data-cf="status">Status</button>
        </div>
      </div>
    </div>
    ${campCards}
  `;

  return `
    <div class="page" style="padding-bottom:110px">
      <div class="top-header">
        <div class="icon-btn" id="openMainMenu">
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

  document.getElementById('openMainMenu')?.addEventListener('click', openMainMenu);

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

  /* Sparkle / Aisha button */
  document.getElementById('dockCapture')?.addEventListener('click', () => {
    const firstBrand = BRANDS[0];
    const firstCamp  = firstBrand?.campaigns?.[0];
    openAishaSelector(firstBrand?.id, firstCamp?.id);
  });

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

  // Stage badge picker
  const HOME_STAGE_CONFIG = [
    { label: 'Ideation',   color: '#a78bfa' },
    { label: 'Planning',   color: '#60a5fa' },
    { label: 'Production', color: '#fb923c' },
    { label: 'Publish',    color: '#e040c8' },
    { label: 'Dormant',    color: 'rgba(255,255,255,0.35)' },
    { label: 'Complete',   color: '#34c759' },
  ];

  document.querySelectorAll('.home-camp-stage-badge').forEach(badge => {
    badge.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const brandId = badge.dataset.stageBrand;
      const campId  = badge.dataset.stageCamp;
      const current = parseInt(badge.dataset.stageIdx, 10);

      document.getElementById('stagePickerSheet')?.remove();

      const checkSVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      const optsHTML = HOME_STAGE_CONFIG.map((s, i) => `
        <button class="stage-picker-opt${i === current ? ' active' : ''}" data-si="${i}">
          <span class="stage-picker-dot" style="background:${s.color}"></span>
          <span class="stage-picker-opt-label">${s.label}</span>
          ${i === current ? `<span class="stage-picker-check">${checkSVG}</span>` : ''}
        </button>`).join('');

      const sheet = document.createElement('div');
      sheet.className = 'stage-picker-sheet';
      sheet.id = 'stagePickerSheet';
      sheet.innerHTML = `
        <div class="stage-picker-bg" id="stagePickerBg"></div>
        <div class="stage-picker-panel">
          <div class="stage-picker-bar"></div>
          <div class="stage-picker-title">Campaign Status</div>
          <div class="stage-picker-opts">${optsHTML}</div>
        </div>`;
      document.body.appendChild(sheet);

      document.getElementById('stagePickerBg')?.addEventListener('click', () => sheet.remove());

      sheet.querySelectorAll('.stage-picker-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          const newStage = parseInt(opt.dataset.si, 10);
          const brand = getBrand(brandId);
          if (brand) {
            const updated = brand.campaigns.map(c => c.id === campId ? { ...c, stage: newStage } : c);
            saveBrandOverride(brandId, { campaigns: updated });
          }
          sheet.remove();
          document.getElementById('app').innerHTML = pageHome();
          bindHomeDock(); bindCapture(); bindNav(); bindAddBrand();
        });
      });
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

function openEditHeroPhoto(brandId, campId, onClose) {
  // Remove any existing instance
  document.getElementById('editHeroPhotoOverlay')?.remove();

  // Remove the campaign nav from the compositor entirely (visibility:hidden leaves the
  // backdrop-filter layer visible on iOS; display:none is the only reliable fix)
  const campNav = document.getElementById('campaignBottomNav');
  if (campNav) campNav.style.display = 'none';

  // Mount directly on document.body at z-index:500 — above all nav bars and iOS stacking contexts
  const wrapper = document.createElement('div');
  wrapper.id = 'editHeroPhotoOverlay';
  wrapper.style.cssText = 'position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
  wrapper.innerHTML = `
    <div style="background:rgba(18,18,18,0.97);border-radius:20px;width:calc(100% - 32px);max-width:398px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
      <div style="padding:18px 22px 10px">
        <div class="capture-title" style="margin-bottom:4px">Edit Cover Photo</div>
        <div style="color:#555;font-size:12px;letter-spacing:.5px">Drag to position · Pinch to zoom</div>
      </div>
      <div class="crop-window" id="cropWindow" style="aspect-ratio:16/9">
        <img id="cropImg" style="position:absolute;touch-action:none;user-select:none;-webkit-user-select:none;pointer-events:none;display:none">
        <div id="cropPlaceholder" class="crop-placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <span>Tap to choose photo</span>
        </div>
      </div>
      <div style="padding:14px 22px 24px">
        <input type="file" id="cropFileInput" accept="image/*" style="display:none">
        <button id="cropPickBtn" class="capture-cancel" style="width:100%;margin-bottom:10px">Change Image</button>
        <div class="capture-actions">
          <button class="capture-cancel" id="editPhotoCancel">Cancel</button>
          <button class="capture-save" id="editPhotoSave">Save</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrapper);

  const cropWin     = wrapper.querySelector('#cropWindow');
  const cropImg     = wrapper.querySelector('#cropImg');
  const placeholder = wrapper.querySelector('#cropPlaceholder');
  const fileInput   = wrapper.querySelector('#cropFileInput');

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

  wrapper.querySelector('#cropPickBtn').addEventListener('click', () => fileInput.click());
  placeholder.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });

  const closeOverlay = () => {
    wrapper.remove();
    if (campNav) campNav.style.display = '';
    onClose?.();
  };

  wrapper.querySelector('#editPhotoCancel').addEventListener('click', closeOverlay);

  // Tap the dim backdrop (wrapper itself, outside the card) to dismiss
  wrapper.addEventListener('click', e => { if (e.target === wrapper) closeOverlay(); });

  wrapper.querySelector('#editPhotoSave').addEventListener('click', () => {
    const dataUrl = _exportCrop();
    if (dataUrl && brand) {
      const campaigns = brand.campaigns.map(c => c.id === campId ? { ...c, heroImage: dataUrl } : c);
      saveBrandOverride(brandId, { campaigns });
      if (!onClose) {
        closeOverlay();
        document.getElementById('app').innerHTML = pageCampaign(brandId, campId);
        bindCampaignPage(brandId, campId);
      } else {
        // Re-render campaign page first (recreates campMoreSheet), then close overlay
        // which fires onClose to re-show the freshly created settings sheet
        document.getElementById('app').innerHTML = pageCampaign(brandId, campId);
        bindCampaignPage(brandId, campId);
        closeOverlay();
      }
    } else {
      closeOverlay();
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
    <div class="capture-overlay" id="editPhotoOverlay" style="display:none;align-items:center;justify-content:center;z-index:300">
      <div class="capture-sheet" style="padding:0;overflow:hidden;border-radius:20px;width:calc(100% - 32px);max-width:398px;margin:0 16px">
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
    <div class="page" style="padding-bottom:120px">
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
    <div class="page" style="padding-bottom:120px">
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
    <div class="page" style="padding-bottom:120px">
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
    <div class="page" style="padding-bottom:120px">
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
    <div class="page" style="padding-bottom:120px">
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
const FORMAT_TYPE = {
  'Reel':'Video','Short Video':'Video','Long Video':'Video','Long-form':'Video',
  'Short':'Video','Duet':'Video','Stitch':'Video','Series':'Video','Live':'Video',
  'Carousel':'Image','Static Post':'Image','Pin':'Image','Idea Pin':'Image',
  'Image Post':'Image','Photo Mode':'Image','Story':'Image','Guide':'Image',
  'Thread':'Text','Tweet':'Text','Post':'Text','Article':'Text','Newsletter':'Text',
  'Reply':'Text','Quote':'Text','Poll':'Text','Document':'Text',
  'DM Note':'Text','Community Post':'Text','Announcement':'Text',
  'Promotional':'Text','Drip':'Text','Tier Update':'Text','Exclusive':'Text',
  'Episode':'Audio','Podcast':'Audio','Teaser':'Audio','Interview':'Audio',
  'Roundtable':'Audio','Space':'Audio','Board':'Image',
};

function pageIdeaVault(id, filterPlatform, filterFormat, filterType, campId, filterCampaign) {
  const brand = getBrand(id);
  if (!brand) return pageHome();

  const platforms = [...new Set(brand.ideas.map(i => i.platform))];
  const campaigns = [...new Set(brand.ideas.map(i => i.campaign).filter(Boolean))];

  const fp = filterPlatform  || 'all';
  const ft = filterType      || 'all';
  const fc = filterCampaign  || 'all';

  // Format options: use platform definition when a platform is selected, else derive from ideas
  const platformFormats = fp !== 'all'
    ? (PLATFORM_FORMATS[fp.toLowerCase()] || [...new Set(brand.ideas.map(i => i.format))])
    : [...new Set(brand.ideas.map(i => i.format))];
  // Reset format selection if it doesn't exist on the newly selected platform
  const ff = platformFormats.includes(filterFormat) ? filterFormat : 'all';

  const filtered = brand.ideas.filter(i =>
    (fp === 'all' || i.platform === fp) &&
    (ff === 'all' || i.format === ff) &&
    (ft === 'all' || FORMAT_TYPE[i.format] === ft) &&
    (fc === 'all' || i.campaign === fc)
  );

  const calSVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const ideasHTML = filtered.length ? filtered.map(idea => `
    <div class="idea-card" data-idea-id="${idea.id}" data-brand-id="${id}" style="cursor:pointer">
      <div style="display:flex;align-items:flex-start;gap:6px">
        <div style="flex:1;min-width:0">
          <div class="idea-card-meta">
            <span class="chip">${PLATFORM_SHORT[idea.platform] || idea.platform}</span>
            <span class="chip">${idea.format}</span>
            ${idea.campaign ? `<span class="chip" style="color:rgba(255,255,255,0.35)">${escHtml(idea.campaign)}</span>` : ''}
          </div>
          <div class="idea-title">${escHtml(idea.title)}</div>
          ${(idea.links||[]).length ? `<div class="idea-link-count">${idea.links.length} link${idea.links.length===1?'':'s'}</div>` : ''}
        </div>
        <button class="idea-cal-btn" data-idea-id="${idea.id}" style="flex-shrink:0;background:none;border:none;padding:6px 2px;cursor:pointer;color:rgba(255,255,255,0.22);line-height:0;margin-top:1px" title="Schedule">
          ${calSVG}
        </button>
      </div>
    </div>
  `).join('') : '<div class="empty-card" style="margin-top:20px">No ideas match this filter</div>';

  const backHref = campId ? '#/' : `#/brand?id=${id}`;
  const vf = (p,f,t,c) => `vaultFilter('${id}','${p}','${f}','${t}','${campId||''}','${c}')`;

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="${backHref}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">IDEA VAULT</div>
          <div class="back-header-title">${brand.name}</div>
        </div>
        <div style="width:36px;flex-shrink:0"></div>
      </div>
      <div class="filter-section">
        <div style="color:#555;font-size:10px;letter-spacing:2px">PLATFORM</div>
        <div class="filter-chips">
          <button class="filter-chip ${fp==='all'?'active':''}" onclick="${vf('all','all',ft,fc)}">All</button>
          ${platforms.map(p => `
            <button class="filter-chip ${fp===p?'active':''}" onclick="${vf(p,'all',ft,fc)}">${PLATFORM_SHORT[p] || p}</button>
          `).join('')}
        </div>
        <div style="color:#555;font-size:10px;letter-spacing:2px;margin-top:10px">FORMAT</div>
        <div class="filter-chips">
          <button class="filter-chip ${ff==='all'?'active':''}" onclick="${vf(fp,'all',ft,fc)}">All</button>
          ${platformFormats.map(f => `
            <button class="filter-chip ${ff===f?'active':''}" onclick="${vf(fp,f,ft,fc)}">${f}</button>
          `).join('')}
        </div>
        <div style="color:#555;font-size:10px;letter-spacing:2px;margin-top:10px">TYPE</div>
        <div class="filter-chips">
          ${['all','Image','Video','Text','Audio'].map(t => `
            <button class="filter-chip ${ft===t?'active':''}" onclick="${vf(fp,ff,t,fc)}">${t==='all'?'All':t}</button>
          `).join('')}
        </div>
      </div>
      <div style="padding:8px 16px;display:flex;align-items:center;justify-content:space-between">
        ${campaigns.length ? `
        <button id="vaultCampFilterBtn"
          data-fp="${fp}" data-ff="${ff}" data-ft="${ft}" data-fc="${fc}" data-nav-camp="${campId||''}" data-brand-id="${id}"
          style="background:${fc!=='all'?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.07)'};border:none;border-radius:20px;padding:8px 16px 8px 14px;color:${fc!=='all'?'#fff':'rgba(255,255,255,0.5)'};font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18" stroke-width="3"/></svg>
          ${fc==='all' ? 'Campaign' : escHtml(fc.length > 18 ? fc.slice(0,16)+'…' : fc)}
        </button>` : `<div></div>`}
        <button id="vaultAddIdea" type="button" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:30px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">+</button>
      </div>
      <div style="padding:16px">${ideasHTML}</div>
    </div>
    ${captureModalHTML()}
  `;
}

window.vaultFilter = function(id, platform, format, type, campId, filterCamp) {
  const camp = campId || null;
  document.getElementById('app').innerHTML = pageIdeaVault(id, platform, format, type, camp, filterCamp || 'all');
  bindCapture(); bindNav();
  bindVaultPage(id);
  injectCampaignNav(id, camp, 'ideas');
};

const PLATFORM_FORMATS = {
  instagram: ['Reel','Carousel','Story','Static Post','DM Note','Live','Guide'],
  tiktok:    ['Short Video','Duet','Stitch','Series','Live','Photo Mode'],
  youtube:   ['Long Video','Short','Live','Podcast','Community Post'],
  threads:   ['Thread','Reply','Quote','Image Post'],
  twitter:   ['Tweet','Thread','Space','Poll','Image Post'],
  linkedin:  ['Post','Article','Newsletter','Poll','Document'],
  facebook:  ['Post','Reel','Story','Live','Event'],
  pinterest: ['Pin','Idea Pin','Board'],
  podcast:   ['Episode','Teaser','Interview','Roundtable'],
  email:     ['Newsletter','Promotional','Drip','Announcement'],
  patreon:   ['Post','Exclusive','Tier Update','Live'],
};

function buildFormatOptions(platform, current) {
  const fmts = PLATFORM_FORMATS[platform] || [];
  if (!fmts.length) return `<option value="${current||''}">${current||'—'}</option>`;
  return fmts.map(f => `<option value="${f}" ${f===current?'selected':''}>${f}</option>`).join('');
}

function bindVaultPage(brandId) {
  document.querySelectorAll('.idea-cal-btn[data-idea-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idea = (getBrand(brandId)?.ideas || []).find(i => i.id === btn.dataset.ideaId);
      if (!idea) return;
      openScheduleSheet(brandId, idea.campaignId || null, {
        dateOnly: true,
        title: idea.title,
        platform: idea.platform,
        format: idea.format,
      });
    });
  });

  document.querySelectorAll('.idea-card[data-idea-id]').forEach(card => {
    card.addEventListener('click', () => openIdeaDetail(card.dataset.brandId, card.dataset.ideaId));
  });

  document.getElementById('vaultAddIdea')?.addEventListener('click', () => {
    const overlay = document.getElementById('captureOverlay');
    if (!overlay) return;
    const brandSel = overlay.querySelector('#captureBrandSel');
    brandSel.innerHTML = '<option value="">— Select brand —</option>' +
      BRANDS.map(b => `<option value="${b.id}"${b.id===brandId?' selected':''}>${escHtml(b.name)}</option>`).join('');
    brandSel.value = brandId;
    brandSel.dispatchEvent(new Event('change'));
    overlay.style.display = 'flex';
  });

  const campBtn = document.getElementById('vaultCampFilterBtn');
  if (campBtn) {
    campBtn.addEventListener('click', () => {
      const { fp, ff, ft, fc, navCamp } = campBtn.dataset;
      const brand = getBrand(brandId);
      const campaigns = [...new Set((brand?.ideas||[]).map(i => i.campaign).filter(Boolean))];

      document.getElementById('vaultCampSheet')?.remove();
      const sheet = document.createElement('div');
      sheet.id = 'vaultCampSheet';
      sheet.style.cssText = 'position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);padding:24px';

      const rowStyle = (active) =>
        `padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.07);color:${active?'#fff':'rgba(255,255,255,0.6)'};font-size:15px;font-weight:${active?'600':'400'};display:flex;align-items:center;justify-content:space-between;cursor:pointer`;
      const checkSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

      sheet.innerHTML = `
        <div style="background:#1c1c1e;border-radius:20px;padding:20px;width:100%;max-width:360px;max-height:70vh;display:flex;flex-direction:column">
          <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;flex-shrink:0">Filter by Campaign</div>
          <div style="flex:1;overflow-y:auto;overscroll-behavior:contain">
            <div data-camp-val="all" style="${rowStyle(fc==='all')}">
              <span>All Campaigns</span>${fc==='all'?checkSVG:''}
            </div>
            ${campaigns.map(c => `
            <div data-camp-val="${escHtml(c)}" style="${rowStyle(fc===c)}">
              <span>${escHtml(c)}</span>${fc===c?checkSVG:''}
            </div>`).join('')}
          </div>
        </div>`;

      document.body.appendChild(sheet);

      sheet.addEventListener('click', e => {
        if (e.target === sheet) { sheet.remove(); return; }
        const row = e.target.closest('[data-camp-val]');
        if (row) {
          sheet.remove();
          window.vaultFilter(brandId, fp, ff, ft, navCamp || null, row.dataset.campVal);
        }
      });
    });
  }
}

function openIdeaDetail(brandId, ideaId) {
  const brand = getBrand(brandId);
  if (!brand) return;
  const idea = (brand.ideas || []).find(i => i.id === ideaId) || {};
  const platform = idea.platform || '';

  document.getElementById('ideaDetailSheet')?.remove();

  const sheetEl = document.createElement('div');
  sheetEl.id = 'ideaDetailSheet';
  sheetEl.style.cssText = 'position:fixed;inset:0;z-index:250;display:flex;flex-direction:column;justify-content:flex-end;align-items:center';

  const fmtOpts = buildFormatOptions(platform, idea.format);
  const linksHTML = (idea.links || []).map((lk, i) => `
    <div class="idea-link-row" data-link-idx="${i}">
      <input class="notion-input idea-link-label" value="${escHtml(lk.label||'')}" placeholder="Label" style="flex:1;min-width:0">
      <input class="notion-input idea-link-url" value="${escHtml(lk.url||'')}" placeholder="URL" style="flex:2;min-width:0">
      <button type="button" class="idea-link-del" style="flex-shrink:0;background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;padding:0 4px">×</button>
    </div>`).join('');

  const mediaFiles = idea.mediaFiles || [];

  function openImagePreview(src) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center';
    ov.innerHTML = `
      <img src="${escHtml(src)}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px">
      <button style="position:absolute;top:max(20px,env(safe-area-inset-top,20px));right:20px;background:rgba(255,255,255,0.12);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>`;
    ov.addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  const mediaListHTML = mediaFiles.length ? mediaFiles.map((m, i) => {
    const isImg = m.type === 'image' && m.dataUrl;
    if (isImg) {
      return `<div class="idea-media-item idea-media-img" data-media-idx="${i}" style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer">
        <img src="${escHtml(m.dataUrl)}" data-preview="${escHtml(m.dataUrl)}" class="idea-thumb" style="width:100%;height:100%;object-fit:cover;display:block">
        <button type="button" class="idea-media-del" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:22px;height:22px;color:#fff;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
      </div>`;
    }
    return `<div class="idea-media-item idea-media-file" data-media-idx="${i}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:10px;grid-column:1/-1">
      <div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${m.type==='audio'?'♪':m.type==='video'?'▶':'📄'}</div>
      <span class="idea-media-name" style="flex:1;font-size:12px;color:rgba(255,255,255,0.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(m.name||'File')}</span>
      <button type="button" class="idea-media-del" style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;padding:0 4px;cursor:pointer">×</button>
    </div>`;
  }).join('') : '';

  sheetEl.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)" id="ideaDetailBg"></div>
    <div style="position:relative;background:#1c1c1e;border-radius:20px 20px 0 0;width:100%;max-width:430px;max-height:92dvh;display:flex;flex-direction:column">
      <div class="idea-detail-topbar" style="display:flex;align-items:center;padding:16px 20px 12px;gap:10px">
        <button id="ideaDetailClose" style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:18px;flex-shrink:0">×</button>
        <div style="flex:1;font-size:16px;font-weight:700;color:#fff">Idea Details</div>
        <button id="ideaDetailAdd" style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:22px;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1">+</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:0 20px 8px">
        <div class="notion-field">
          <div class="notion-label">TITLE</div>
          <input class="notion-input" id="ideaEditTitle" value="${escHtml(idea.title||'')}" placeholder="Idea title">
        </div>
        <div class="notion-field" style="display:flex;gap:10px">
          <div style="flex:1">
            <div class="notion-label">PLATFORM</div>
            <select class="notion-input" id="ideaEditPlatform" style="color:#fff;background:#2c2c2e">
              <option value="">— Select —</option>
              ${['instagram','tiktok','youtube','threads','twitter','linkedin','facebook','pinterest','podcast','email','patreon'].map(p =>
                `<option value="${p}" ${p===platform?'selected':''}>${PLATFORM_SHORT[p]||p.charAt(0).toUpperCase()+p.slice(1)}</option>`
              ).join('')}
            </select>
          </div>
          <div style="flex:1">
            <div class="notion-label">FORMAT</div>
            <select class="notion-input" id="ideaEditFormat" style="color:#fff;background:#2c2c2e">${fmtOpts}</select>
          </div>
        </div>
        <!-- Media Uploads -->
        <div class="notion-field">
          <div class="notion-label">MEDIA</div>
          <div id="ideaMediaList" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px">${mediaListHTML}</div>
          <div style="display:flex;gap:8px">
            <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 0;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.45);cursor:pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> Image
              <input type="file" accept="image/*" id="ideaUploadImage" style="display:none">
            </label>
            <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 0;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.45);cursor:pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Video
              <input type="file" accept="video/*" id="ideaUploadVideo" style="display:none">
            </label>
            <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 0;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.45);cursor:pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio
              <input type="file" accept="audio/*" id="ideaUploadAudio" style="display:none">
            </label>
          </div>
        </div>
        <div class="notion-field">
          <div class="notion-label">NOTES</div>
          <textarea class="notion-input" id="ideaEditNotes" rows="3" style="resize:none">${escHtml(idea.notes||'')}</textarea>
        </div>
        <div class="notion-field">
          <div class="notion-label">REFERENCES</div>
          <textarea class="notion-input" id="ideaEditRefs" rows="2" style="resize:none">${escHtml(idea.references||'')}</textarea>
        </div>
        <div class="notion-field">
          <div class="notion-label">LINKS</div>
          <div id="ideaLinksList">${linksHTML}</div>
          <button type="button" id="ideaAddLink" style="width:100%;padding:9px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.1);color:rgba(255,255,255,0.35);font-size:12px;font-weight:600;margin-top:6px">+ Add Link</button>
        </div>
      </div>
      <div style="padding:12px 20px;padding-bottom:max(28px,env(safe-area-inset-bottom,0px));border-top:1px solid rgba(255,255,255,0.06)">
        <button id="ideaDetailSave" style="width:100%;padding:13px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:700">Save</button>
      </div>
    </div>`;

  document.body.appendChild(sheetEl);

  const mediaList = sheetEl.querySelector('#ideaMediaList');
  let currentMediaFiles = [...mediaFiles];

  function addMediaItem(file, type, dataUrl) {
    const idx = currentMediaFiles.length;
    currentMediaFiles.push({ name: file.name, type, size: file.size, dataUrl: dataUrl || null });
    const item = document.createElement('div');
    item.className = 'idea-media-item';
    item.dataset.mediaIdx = idx;
    const isImg = type === 'image' && dataUrl;
    if (isImg) {
      item.className += ' idea-media-img';
      item.style.cssText = 'position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer';
      item.innerHTML = `
        <img src="${dataUrl}" class="idea-thumb" style="width:100%;height:100%;object-fit:cover;display:block">
        <button type="button" class="idea-media-del" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:22px;height:22px;color:#fff;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>`;
      item.querySelector('.idea-thumb').addEventListener('click', () => openImagePreview(dataUrl));
    } else {
      item.className += ' idea-media-file';
      item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:10px;grid-column:1/-1';
      item.innerHTML = `
        <div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${type==='audio'?'♪':type==='video'?'▶':'📄'}</div>
        <span style="flex:1;font-size:12px;color:rgba(255,255,255,0.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(file.name)}</span>
        <button type="button" class="idea-media-del" style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;padding:0 4px;cursor:pointer">×</button>`;
    }
    item.querySelector('.idea-media-del').addEventListener('click', () => {
      currentMediaFiles.splice(parseInt(item.dataset.mediaIdx), 1);
      item.remove();
    });
    mediaList.appendChild(item);
  }

  sheetEl.querySelector('#ideaUploadImage').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => addMediaItem(file, 'image', ev.target.result);
    reader.readAsDataURL(file);
  });
  sheetEl.querySelector('#ideaUploadVideo').addEventListener('change', e => { if(e.target.files[0]) addMediaItem(e.target.files[0], 'video'); });
  sheetEl.querySelector('#ideaUploadAudio').addEventListener('change', e => { if(e.target.files[0]) addMediaItem(e.target.files[0], 'audio'); });

  // Existing saved images — thumbnail click to preview
  mediaList.querySelectorAll('.idea-thumb[data-preview]').forEach(img => {
    img.addEventListener('click', () => openImagePreview(img.dataset.preview));
  });

  // Delete existing media items
  mediaList.querySelectorAll('.idea-media-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('.idea-media-item').dataset.mediaIdx);
      currentMediaFiles.splice(idx, 1);
      btn.closest('.idea-media-item').remove();
    });
  });

  // Platform change → repopulate format dropdown
  const platSel = sheetEl.querySelector('#ideaEditPlatform');
  const fmtSel  = sheetEl.querySelector('#ideaEditFormat');
  platSel.addEventListener('change', () => {
    fmtSel.innerHTML = buildFormatOptions(platSel.value, '');
  });

  // Add link row
  const linksList = sheetEl.querySelector('#ideaLinksList');
  sheetEl.querySelector('#ideaAddLink').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'idea-link-row';
    row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;align-items:center';
    row.innerHTML = `
      <input class="notion-input idea-link-label" placeholder="Label" style="flex:1;min-width:0">
      <input class="notion-input idea-link-url" placeholder="URL" style="flex:2;min-width:0">
      <button type="button" class="idea-link-del" style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;padding:0 4px">×</button>`;
    row.querySelector('.idea-link-del').addEventListener('click', () => row.remove());
    linksList.appendChild(row);
  });
  linksList.querySelectorAll('.idea-link-del').forEach(btn => btn.addEventListener('click', () => btn.closest('.idea-link-row').remove()));

  // Close / backdrop
  const closeSheet = () => sheetEl.remove();
  sheetEl.querySelector('#ideaDetailClose').addEventListener('click', closeSheet);
  sheetEl.querySelector('#ideaDetailBg').addEventListener('click', closeSheet);

  // Add to campaign "+" button
  sheetEl.querySelector('#ideaDetailAdd').addEventListener('click', () => {
    const campaigns = (brand.campaigns || []);
    if (!campaigns.length) return;
    const destEl = document.createElement('div');
    destEl.style.cssText = 'position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;justify-content:flex-end;align-items:center';
    destEl.innerHTML = `
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5)" id="ideaDestBg"></div>
      <div style="position:relative;background:#1c1c1e;border-radius:20px 20px 0 0;width:100%;max-width:430px;padding:20px 20px calc(28px + env(safe-area-inset-bottom,0px))">
        <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:14px">Add to Campaign</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${campaigns.map(c => `
            <button type="button" class="idea-dest-camp-btn" data-camp-id="${c.id}" style="text-align:left;padding:13px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;font-weight:600">${escHtml(c.name)}</button>
          `).join('')}
        </div>
      </div>`;
    document.body.appendChild(destEl);
    destEl.querySelector('#ideaDestBg').addEventListener('click', () => destEl.remove());
    destEl.querySelectorAll('.idea-dest-camp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const campId = btn.dataset.campId;
        const campaign = campaigns.find(c => c.id === campId);
        const updatedIdeas = (brand.ideas || []).map(i =>
          i.id === ideaId ? { ...i, campaignId: campId, campaign: campaign?.name || '' } : i
        );
        saveBrandOverride(brandId, { ideas: updatedIdeas });
        destEl.remove();
        closeSheet();
      });
    });
  });

  // Save
  sheetEl.querySelector('#ideaDetailSave').addEventListener('click', () => {
    const links = [];
    sheetEl.querySelectorAll('.idea-link-row').forEach(row => {
      const label = row.querySelector('.idea-link-label')?.value.trim() || '';
      const url   = row.querySelector('.idea-link-url')?.value.trim() || '';
      if (label || url) links.push({ label, url });
    });
    const updated = {
      ...(idea),
      id: ideaId,
      title: sheetEl.querySelector('#ideaEditTitle').value.trim() || idea.title || '',
      platform: platSel.value,
      format: fmtSel.value,
      notes: sheetEl.querySelector('#ideaEditNotes').value,
      references: sheetEl.querySelector('#ideaEditRefs').value,
      links,
      mediaFiles: currentMediaFiles,
    };
    const freshBrand = getBrand(brandId);
    const ideas = (freshBrand.ideas || []).map(i => i.id === ideaId ? updated : i);
    saveBrandOverride(brandId, { ideas });
    closeSheet();
    if (window.location.hash.includes('/vault')) {
      const params = parseHash();
      window.vaultFilter(params.id, 'all', 'all', 'all', params.campId || null, 'all');
    }
  });
}

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
    <div class="aisha-topbar">
      <button class="aisha-back-btn" id="aishaBackBtn" type="button">‹</button>
    </div>
    <div class="aisha-mode-row">
      <button class="aisha-mode-btn aisha-mode-active" id="aishaChatModeBtn" type="button">
        <span class="aisha-mode-icon">✦</span>Ask Aisha
      </button>
      <button class="aisha-mode-btn" id="aishaWizardBtn" type="button">Start Wizard</button>
    </div>
    <div class="aisha-chat" id="aishaChat"></div>
    <div class="aisha-opts-wrap" id="aishaOptsWrap" style="display:none">
      <div class="aisha-opts-grid" id="aishaOptsGrid"></div>
      <button class="aisha-opts-done" id="aishaOptsDone" style="display:none">Done ›</button>
    </div>
    <div class="aisha-input-row">
      <input class="aisha-input" id="aishaInput" type="text" placeholder="Ask Aisha about this campaign…" style="font-size:16px">
      <button class="aisha-send" id="aishaSendBtn" type="button">${sendSVG}</button>
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

          document.getElementById('aishaSheet')?.classList.remove('open');
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
  _processAishaInput = processAishaInput;

  // Restore options if wizard is mid-flow after a re-render
  if (_aishaWizardStep >= 0 && _aishaWizardStep < AISHA_WIZARD_QS.length) {
    showAishaOptions(_aishaWizardStep);
  }

  const setActiveMode = id => {
    ['aishaChatModeBtn','aishaWizardBtn'].forEach(btnId => {
      document.getElementById(btnId)?.classList.toggle('aisha-mode-active', btnId === id);
    });
  };

  document.getElementById('aishaChatModeBtn')?.addEventListener('click', () => {
    setActiveMode('aishaChatModeBtn');
  });

  document.getElementById('aishaWizardBtn')?.addEventListener('click', () => {
    setActiveMode('aishaWizardBtn');
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
   PAGE: VISUAL PLANNER
═══════════════════════════════════════ */
const PLAT_DOT_COLORS = {
  instagram:'#e040c8', tiktok:'#00c8bf', youtube:'#f03030',
  threads:'#5580e0', twitter:'#4488ee', linkedin:'#0a66c2', email:'#74ae00',
};
const PLAT_DISPLAY_NAMES = {
  instagram:'Instagram', tiktok:'TikTok', youtube:'YouTube',
  threads:'Threads', twitter:'X / Twitter', linkedin:'LinkedIn', email:'Email',
};

function pageVisualPlanner(brandId, campId) {
  const brand = getBrand(brandId);
  if (!brand) return pageHome();
  const campaign = campId ? (brand.campaigns||[]).find(c=>c.id===campId) : null;
  const platforms = Object.keys(brand.platformStrategy||{});
  const backHref = '#/';

  if (!platforms.length) return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="${backHref}">‹</button>
        <div class="back-header-center"><div class="back-header-label">CONTENT PLANNER</div><div class="back-header-title">${escHtml(brand.name)}</div></div>
        <div style="width:36px"></div>
      </div>
      <div class="planner-empty" style="margin-top:60px">No platforms configured</div>
    </div>`;

  const activePlatform = platforms[0];

  function plannerIconSVG(p) {
    const icons = {
      instagram:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
      tiktok:`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.38a8.26 8.26 0 004.83 1.55V7.48a4.85 4.85 0 01-1.06-.79z"/></svg>`,
      youtube:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 8.5 16 12 10 15.5" fill="currentColor" stroke="none"/></svg>`,
      threads:`<svg width="24" height="24" viewBox="0 0 192 192" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M141.537 88.988a73.5 73.5 0 00-2.667-.617c-1.598-6.718-5.03-12.505-10.287-17.203C118.786 62.027 106.48 57.5 92 57.5c-18.42 0-30.4 7.12-38.387 21.887l14.84 10.107C74.13 80.127 81.78 75.6 92 75.6c9.247 0 15.44 2.573 18.78 5.953 1.898 1.927 3.254 4.204 4.073 6.674a68.5 68.5 0 00-15.64-.7c-24.28 1.4-39.9 15.587-39.9 35.187 0 11.38 6.013 22.1 16.52 28.207 8.307 4.827 18.74 5.547 27.747 1.893 10.673-4.267 17.247-13.16 19.38-26.587 2.18 1.313 3.993 2.887 5.373 4.693 3.347 4.373 3.26 11.52 3.26 11.52l16.207-.607s.16-9.413-4.293-17.487c-2.387-4.333-5.733-7.72-9.573-10.16zm-33.893 30.94c-3.68 7.427-10.367 11.733-20.107 11.64-8.88-.094-14.607-4.454-14.607-11.127 0-9.267 8.293-14.787 22.48-15.587 4.64-.267 9.14-.067 13.44.547-.5 6.573-1.24 10.813-1.24 14.5z"/></svg>`,
      twitter:`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      linkedin:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="8" y1="10" x2="8" y2="18"/><circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none"/><path d="M12 18v-5c0-1.1.9-2 2-2s2 .9 2 2v5"/><line x1="12" y1="10" x2="12" y2="18"/></svg>`,
      email:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`,
    };
    return icons[p] || `<span style="font-size:14px;font-weight:700">${(p[0]||'').toUpperCase()}</span>`;
  }

  const isStory = f => /stor/i.test(f);
  const isReel  = f => /reel|short video|^short$|long video|long-form/i.test(f);
  const isFeed  = f => !isStory(f) && !isReel(f);

  function sectionHTML(platform) {
    const pData = brand.platformStrategy[platform]||{};
    const formats = pData.formats||[];
    if (!formats.length) return `<div class="planner-empty">No formats set for ${escHtml(PLAT_DISPLAY_NAMES[platform]||platform)}</div>`;
    const items = (brand.scheduledPosts||[]).filter(i => i.platform===platform && (!campId||!i.campaignId||i.campaignId===campId));
    const highlights = (brand.plannerHighlights||{})[platform] || [];
    const chev = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    function thumbs(list, shape) {
      return list.map(it => it.thumbnail
        ? `<div class="planner-thumb ${shape}" style="overflow:hidden"><img src="${escHtml(it.thumbnail)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`
        : `<div class="planner-thumb ${shape}"></div>`
      ).join('');
    }

    let html = '';

    const storyFmts = formats.filter(isStory);
    if (storyFmts.length) {
      const storyItems = items.filter(i=>isStory(i.format));
      const circles = highlights.map(h =>
        `<div class="planner-thumb circle" style="overflow:hidden">${h.cover?`<img src="${escHtml(h.cover)}" style="width:100%;height:100%;object-fit:cover">`:''}</div>`
      ).join('');
      html += `<div class="planner-sec-card" data-section="highlights" data-platform="${platform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">HIGHLIGHTS</div><div class="planner-sec-count">${highlights.length} highlights</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${highlights.length
          ? `<div class="planner-thumb-row">${circles}<div class="planner-thumb circle planner-thumb-add" style="font-size:18px">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add highlights</div>`}
      </div>
      <div class="planner-sec-card" data-section="stories" data-platform="${platform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">STORIES</div><div class="planner-sec-count">${storyItems.length} stories</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${storyItems.length
          ? `<div class="planner-thumb-row">${thumbs(storyItems,'portrait')}<div class="planner-thumb portrait planner-thumb-add">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add stories</div>`}
      </div>`;
    }

    const reelFmts = formats.filter(isReel);
    if (reelFmts.length) {
      const reelItems = items.filter(i=>isReel(i.format));
      html += `<div class="planner-sec-card" data-section="reels" data-platform="${platform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">REELS</div><div class="planner-sec-count">${reelItems.length} clips</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${reelItems.length
          ? `<div class="planner-thumb-row">${thumbs(reelItems,'portrait')}<div class="planner-thumb portrait planner-thumb-add">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add clips</div>`}
      </div>`;
    }

    const feedFmts = formats.filter(isFeed);
    if (feedFmts.length) {
      const feedItems = items.filter(i=>isFeed(i.format));
      html += `<div class="planner-sec-card" data-section="feed" data-platform="${platform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">FEED</div><div class="planner-sec-count">${feedItems.length} posts</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${feedItems.length
          ? `<div class="planner-thumb-row">${thumbs(feedItems,'square')}<div class="planner-thumb square planner-thumb-add">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add posts</div>`}
      </div>`;
    }

    return html || `<div class="planner-empty">No content yet</div>`;
  }

  const tabsHTML = platforms.map(p=>`
    <button class="planner-tab${p===activePlatform?' active':''}" data-platform="${p}" title="${PLAT_DISPLAY_NAMES[p]||p}">${plannerIconSVG(p)}</button>`).join('');

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="${backHref}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">CONTENT PLANNER</div>
          <div class="back-header-title">${escHtml(campaign?campaign.name:brand.name)}</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div class="planner-tabs" id="plannerTabs">${tabsHTML}</div>
      <div class="planner-content" id="plannerContent">
        ${sectionHTML(activePlatform)}
      </div>
      <input type="file" accept="image/*" id="plannerFileInput" style="display:none">
    </div>`;
}

function bindVisualPlanner(brandId, campId) {
  const brand = getBrand(brandId);
  if (!brand) return;
  const platforms = Object.keys(brand.platformStrategy||{});
  let activePlatform = platforms[0]||'';
  const tabs    = document.getElementById('plannerTabs');
  const content = document.getElementById('plannerContent');
  const fileInput = document.getElementById('plannerFileInput');
  let pendingThumbCb = null;

  function plannerIconSVG(p) {
    const icons={instagram:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,tiktok:`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.38a8.26 8.26 0 004.83 1.55V7.48a4.85 4.85 0 01-1.06-.79z"/></svg>`,youtube:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 8.5 16 12 10 15.5" fill="currentColor" stroke="none"/></svg>`,threads:`<svg width="24" height="24" viewBox="0 0 192 192" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M141.537 88.988a73.5 73.5 0 00-2.667-.617c-1.598-6.718-5.03-12.505-10.287-17.203C118.786 62.027 106.48 57.5 92 57.5c-18.42 0-30.4 7.12-38.387 21.887l14.84 10.107C74.13 80.127 81.78 75.6 92 75.6c9.247 0 15.44 2.573 18.78 5.953 1.898 1.927 3.254 4.204 4.073 6.674a68.5 68.5 0 00-15.64-.7c-24.28 1.4-39.9 15.587-39.9 35.187 0 11.38 6.013 22.1 16.52 28.207 8.307 4.827 18.74 5.547 27.747 1.893 10.673-4.267 17.247-13.16 19.38-26.587 2.18 1.313 3.993 2.887 5.373 4.693 3.347 4.373 3.26 11.52 3.26 11.52l16.207-.607s.16-9.413-4.293-17.487c-2.387-4.333-5.733-7.72-9.573-10.16zm-33.893 30.94c-3.68 7.427-10.367 11.733-20.107 11.64-8.88-.094-14.607-4.454-14.607-11.127 0-9.267 8.293-14.787 22.48-15.587 4.64-.267 9.14-.067 13.44.547-.5 6.573-1.24 10.813-1.24 14.5z"/></svg>`,twitter:`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,linkedin:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="8" y1="10" x2="8" y2="18"/><circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none"/><path d="M12 18v-5c0-1.1.9-2 2-2s2 .9 2 2v5"/><line x1="12" y1="10" x2="12" y2="18"/></svg>`,email:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`};
    return icons[p]||`<span style="font-size:10px;font-weight:700">${(p[0]||'').toUpperCase()}</span>`;
  }

  const _isStory = f => /stor/i.test(f);
  const _isReel  = f => /reel|short video|^short$|long video|long-form/i.test(f);
  const _isFeed  = f => !_isStory(f) && !_isReel(f);

  function renderContent() {
    const b = getBrand(brandId);
    if (!b||!content) return;
    const pData = b.platformStrategy[activePlatform]||{};
    const formats = pData.formats||[];
    const items = (b.scheduledPosts||[]).filter(i=>i.platform===activePlatform&&(!campId||!i.campaignId||i.campaignId===campId));
    const highlights = (b.plannerHighlights||{})[activePlatform]||[];
    const chev = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    function thumbs(list, shape) {
      return list.map(it => it.thumbnail
        ? `<div class="planner-thumb ${shape}" style="overflow:hidden"><img src="${escHtml(it.thumbnail)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`
        : `<div class="planner-thumb ${shape}"></div>`
      ).join('');
    }

    let html = '';
    const storyFmts = formats.filter(_isStory);
    if (storyFmts.length) {
      const storyItems = items.filter(i=>_isStory(i.format));
      const circles = highlights.map(h =>
        `<div class="planner-thumb circle" style="overflow:hidden">${h.cover?`<img src="${escHtml(h.cover)}" style="width:100%;height:100%;object-fit:cover">`:''}</div>`
      ).join('');
      html += `<div class="planner-sec-card" data-section="highlights" data-platform="${activePlatform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">HIGHLIGHTS</div><div class="planner-sec-count">${highlights.length} highlights</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${highlights.length
          ? `<div class="planner-thumb-row">${circles}<div class="planner-thumb circle planner-thumb-add" style="font-size:18px">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add highlights</div>`}
      </div>
      <div class="planner-sec-card" data-section="stories" data-platform="${activePlatform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">STORIES</div><div class="planner-sec-count">${storyItems.length} stories</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${storyItems.length
          ? `<div class="planner-thumb-row">${thumbs(storyItems,'portrait')}<div class="planner-thumb portrait planner-thumb-add">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add stories</div>`}
      </div>`;
    }
    const reelFmts = formats.filter(_isReel);
    if (reelFmts.length) {
      const reelItems = items.filter(i=>_isReel(i.format));
      html += `<div class="planner-sec-card" data-section="reels" data-platform="${activePlatform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">REELS</div><div class="planner-sec-count">${reelItems.length} clips</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${reelItems.length
          ? `<div class="planner-thumb-row">${thumbs(reelItems,'portrait')}<div class="planner-thumb portrait planner-thumb-add">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add clips</div>`}
      </div>`;
    }
    const feedFmts = formats.filter(_isFeed);
    if (feedFmts.length) {
      const feedItems = items.filter(i=>_isFeed(i.format));
      html += `<div class="planner-sec-card" data-section="feed" data-platform="${activePlatform}">
        <div class="planner-sec-hd"><div><div class="planner-sec-label">FEED</div><div class="planner-sec-count">${feedItems.length} posts</div></div><div class="planner-sec-chev">${chev}</div></div>
        ${feedItems.length
          ? `<div class="planner-thumb-row">${thumbs(feedItems,'square')}<div class="planner-thumb square planner-thumb-add">+</div></div>`
          : `<div class="planner-sec-empty">Tap to add posts</div>`}
      </div>`;
    }
    content.innerHTML = html || `<div class="planner-empty">No content yet</div>`;
    content.querySelectorAll('.planner-sec-card').forEach(card => {
      card.addEventListener('click', () => openPlannerSectionPage(brandId, campId, card.dataset.platform, card.dataset.section, renderContent));
    });
  }

  function bindFeedToggle() {
    content.querySelectorAll('.planner-feed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.closest('.planner-section');
        const view = btn.dataset.feedView;
        section.querySelectorAll('.planner-feed-btn').forEach(b => b.classList.toggle('active', b === btn));
        section.querySelector('.planner-feed-single').style.display  = view === 'single'   ? '' : 'none';
        section.querySelector('.planner-feed-carousel').style.display = view === 'carousel' ? '' : 'none';
      });
    });

    // Highlight circles
    content.querySelectorAll('.planner-add-highlight').forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        const name = prompt('Highlight name:');
        if (!name?.trim()) return;
        const b = getBrand(brandId);
        const highlights = { ...(b.plannerHighlights||{}) };
        highlights[platform] = [...(highlights[platform]||[]), { id: uid(), name: name.trim(), cover: '', stories: [] }];
        saveBrandOverride(brandId, { plannerHighlights: highlights });
        renderContent();
      });
    });

    content.querySelectorAll('.planner-open-highlight').forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        const hid = btn.dataset.highlightId;
        const b = getBrand(brandId);
        const highlights = (b.plannerHighlights||{})[platform]||[];
        const h = highlights.find(x=>x.id===hid);
        if (!h) return;
        openHighlightSheet(brandId, platform, h);
      });
    });
  }

  function openHighlightSheet(bId, platform, highlight, onDone) {
    document.getElementById('highlightSheet')?.remove();
    const sheet = document.createElement('div');
    sheet.id = 'highlightSheet';
    sheet.style.cssText = 'position:fixed;inset:0;z-index:400;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,0.5)';
    const inner = document.createElement('div');
    inner.style.cssText = 'background:#1c1c1e;border-radius:20px 20px 0 0;padding:20px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));min-height:70vh;max-height:90vh;display:flex;flex-direction:column';
    sheet.appendChild(inner);
    document.body.appendChild(sheet);

    sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

    function closeSheet() { sheet.remove(); (onDone ?? renderContent)(); }

    function getHl() {
      return (getBrand(bId).plannerHighlights||{})[platform]?.find(x=>x.id===highlight.id) || highlight;
    }
    function getStories() { return getHl().stories || []; }
    function saveStories(next) {
      const b = getBrand(bId);
      const hl = { ...(b.plannerHighlights||{}) };
      const list = [...(hl[platform]||[])];
      const i = list.findIndex(x=>x.id===highlight.id);
      if (i<0) return;
      list[i] = { ...list[i], stories: next };
      hl[platform] = list;
      saveBrandOverride(bId, { plannerHighlights: hl });
    }

    function fmtDate(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    }

    /* ── drag-sort state ── */
    let dragIdx = null, dragTargetIdx = null, dragGhost = null;
    let _tmh = null, _teh = null;

    function cleanupDrag() {
      if (_tmh) { document.removeEventListener('touchmove', _tmh); _tmh = null; }
      if (_teh) { document.removeEventListener('touchend', _teh); _teh = null; }
      dragGhost?.remove(); dragGhost = null;
      dragIdx = null; dragTargetIdx = null;
    }

    function bindDrag() {
      cleanupDrag();
      inner.querySelectorAll('.hl-sc').forEach(card => {
        card.style.touchAction = 'none';
        card.addEventListener('touchstart', e => {
          e.preventDefault();
          dragIdx = +card.dataset.idx;
          dragTargetIdx = dragIdx;
          const r = card.getBoundingClientRect();
          dragGhost = card.cloneNode(true);
          dragGhost.style.cssText += `;position:fixed;z-index:500;opacity:0.85;pointer-events:none;width:${r.width}px;height:${r.height}px;left:${r.left}px;top:${r.top}px;box-shadow:0 8px 24px rgba(0,0,0,0.6);transform:scale(1.05);transition:none`;
          document.body.appendChild(dragGhost);
          card.style.opacity = '0.2';
        }, { passive: false });
      });

      _tmh = e => {
        if (dragIdx === null || !dragGhost) return;
        e.preventDefault();
        const t = e.touches[0];
        dragGhost.style.left = (t.clientX - 44) + 'px';
        dragGhost.style.top  = (t.clientY - 78) + 'px';
        const cards = [...inner.querySelectorAll('.hl-sc')];
        let best = dragIdx, minD = Infinity;
        cards.forEach(c => {
          const r = c.getBoundingClientRect();
          const d = Math.hypot(t.clientX - (r.left+r.width/2), t.clientY - (r.top+r.height/2));
          if (d < minD) { minD = d; best = +c.dataset.idx; }
        });
        if (best !== dragTargetIdx) {
          dragTargetIdx = best;
          cards.forEach(c => { c.style.outline = (+c.dataset.idx===dragTargetIdx && dragTargetIdx!==dragIdx) ? '2px solid rgba(180,120,255,0.8)' : 'none'; });
        }
      };
      _teh = () => {
        if (dragIdx === null) return;
        inner.querySelectorAll('.hl-sc').forEach(c => { c.style.opacity=''; c.style.outline=''; });
        const from = dragIdx, to = dragTargetIdx;
        cleanupDrag();
        if (to !== null && to !== from) {
          const next = [...getStories()];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          saveStories(next);
          renderSheet();
          (onDone ?? renderContent)();
        }
      };
      document.addEventListener('touchmove', _tmh, { passive: false });
      document.addEventListener('touchend', _teh);
    }

    function saveHlSchedule(isoOrNull, notes) {
      const b = getBrand(bId);
      const hl = { ...(b.plannerHighlights||{}) };
      const list = [...(hl[platform]||[])];
      const i = list.findIndex(x=>x.id===highlight.id);
      if (i<0) return;
      list[i] = { ...list[i], scheduledDate: isoOrNull, scheduleNotes: notes ?? (list[i].scheduleNotes || '') };
      hl[platform] = list;
      saveBrandOverride(bId, { plannerHighlights: hl });
    }

    function openSchedulePicker() {
      document.getElementById('hlSchedModal')?.remove();
      const hlData = getHl();
      const modal = document.createElement('div');
      modal.id = 'hlSchedModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:500;display:flex;align-items:flex-end;background:rgba(0,0,0,0.6)';
      modal.innerHTML = `
        <div style="background:#1c1c1e;border-radius:20px 20px 0 0;padding:24px;padding-bottom:calc(32px + env(safe-area-inset-bottom,0px));width:100%;box-sizing:border-box">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.35);margin-bottom:6px">SCHEDULE HIGHLIGHT</div>
          <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:20px">${escHtml(hlData.name)}</div>
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:8px">DATE & TIME</div>
          <input type="datetime-local" id="hlSchedDate" value="${escHtml(hlData.scheduledDate ? hlData.scheduledDate.slice(0,16) : '')}" style="width:100%;background:#2c2c2e;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px;color:#fff;font-size:15px;box-sizing:border-box;color-scheme:dark;margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:8px">NOTES</div>
          <textarea id="hlSchedNotes" placeholder="Add any notes…" rows="3" style="width:100%;background:#2c2c2e;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px;color:#fff;font-size:14px;box-sizing:border-box;resize:none;font-family:inherit;line-height:1.5">${escHtml(hlData.scheduleNotes || '')}</textarea>
          <div style="display:flex;gap:10px;margin-top:20px">
            ${hlData.scheduledDate ? `<button id="hlSchedClear" type="button" style="flex:1;background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.2);border-radius:12px;padding:14px;color:#ff6b6b;font-size:14px;cursor:pointer">Clear</button>` : ''}
            <button id="hlSchedCancel" type="button" style="flex:1;background:rgba(255,255,255,0.08);border:none;border-radius:12px;padding:14px;color:rgba(255,255,255,0.55);font-size:14px;cursor:pointer">Cancel</button>
            <button id="hlSchedSave" type="button" style="flex:2;background:rgba(180,120,255,0.22);border:1px solid rgba(180,120,255,0.35);border-radius:12px;padding:14px;color:#d4aaff;font-size:14px;font-weight:700;cursor:pointer">Save</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
      modal.querySelector('#hlSchedCancel')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#hlSchedClear')?.addEventListener('click', () => {
        saveHlSchedule(null, null); modal.remove(); requestAnimationFrame(() => renderSheet());
      });
      modal.querySelector('#hlSchedSave')?.addEventListener('click', () => {
        const val = modal.querySelector('#hlSchedDate').value;
        const notes = modal.querySelector('#hlSchedNotes').value.trim();
        saveHlSchedule(val ? new Date(val).toISOString() : null, notes);
        modal.remove(); requestAnimationFrame(() => renderSheet());
      });
    }

    function renderSheet() {
      const hlData = getHl();
      const stories = hlData.stories || [];
      inner.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:12px">
            <button id="highlightCoverBtn" type="button" style="width:52px;height:52px;border-radius:50%;border:2px dashed rgba(255,255,255,0.25);background:rgba(255,255,255,0.06);overflow:hidden;flex-shrink:0;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:18px">
              ${hlData.cover?`<img src="${escHtml(hlData.cover)}" style="width:100%;height:100%;object-fit:cover" alt="">`:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'}
            </button>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <div style="font-size:16px;font-weight:700;color:#fff">${escHtml(hlData.name)}</div>
              <button id="hlSchedBtn" type="button" style="background:rgba(180,120,255,0.14);border:1px solid rgba(180,120,255,0.28);border-radius:20px;padding:3px 10px;cursor:pointer;font-size:11px;font-weight:600;color:${hlData.scheduledDate?'#d4aaff':'rgba(255,255,255,0.4)'};display:flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${hlData.scheduledDate ? fmtDate(hlData.scheduledDate) : 'Schedule'}
              </button>
            </div>
          </div>
          <button id="highlightClose" type="button" style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;width:30px;height:30px;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
        </div>
        <div style="flex:1;overflow-y:auto;overscroll-behavior:contain">
          <div style="display:flex;gap:8px;flex-wrap:wrap;padding-bottom:8px">
            ${stories.map((s,i)=>`
              <div class="hl-sc" data-idx="${i}" style="width:88px;height:156px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);position:relative;flex-shrink:0">
                ${s.thumbnail?`<img src="${escHtml(s.thumbnail)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" alt="">`:''}
                <button data-story-del="${i}" type="button" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:20px;height:20px;color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">×</button>
              </div>`).join('')}
            <button id="highlightAddStory" type="button" style="width:88px;height:156px;border-radius:10px;border:2px dashed rgba(255,255,255,0.14);background:transparent;color:rgba(255,255,255,0.3);font-size:22px;flex-shrink:0;cursor:pointer">+</button>
          </div>
        </div>`;

      inner.querySelector('#highlightClose')?.addEventListener('click', closeSheet);

      inner.querySelector('#highlightCoverBtn')?.addEventListener('click', () => {
        const fi = document.createElement('input'); fi.type='file'; fi.accept='image/*';
        fi.onchange = () => {
          const file = fi.files[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => {
            const b2 = getBrand(bId);
            const hl2 = { ...(b2.plannerHighlights||{}) };
            const list = [...(hl2[platform]||[])];
            const idx = list.findIndex(x=>x.id===highlight.id);
            if (idx<0) return;
            list[idx] = { ...list[idx], cover: ev.target.result };
            hl2[platform] = list;
            saveBrandOverride(bId, { plannerHighlights: hl2 });
            renderSheet(); (onDone ?? renderContent)();
          };
          reader.readAsDataURL(file);
        };
        fi.click();
      });

      inner.querySelector('#highlightAddStory')?.addEventListener('click', () => {
        const fi = document.createElement('input'); fi.type='file'; fi.accept='image/*'; fi.multiple=true;
        fi.onchange = () => {
          const files = [...fi.files]; if (!files.length) return;
          const results = new Array(files.length); let pending = files.length;
          files.forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = ev => {
              results[i] = ev.target.result;
              if (--pending === 0) {
                saveStories([...getStories(), ...results.map(src => ({ thumbnail: src, scheduledDate: null }))]);
                renderSheet(); (onDone ?? renderContent)();
              }
            };
            reader.readAsDataURL(file);
          });
        };
        fi.click();
      });

      inner.querySelectorAll('[data-story-del]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          saveStories(getStories().filter((_,j) => j !== +btn.dataset.storyDel));
          renderSheet(); (onDone ?? renderContent)();
        });
      });

      inner.querySelector('#hlSchedBtn')?.addEventListener('click', e => {
        e.stopPropagation(); openSchedulePicker();
      });

      bindDrag();
    }

    renderSheet();
  }

  function openPlannerSectionPage(bId, cId, platform, sectionType, onBack) {
    document.getElementById('plannerSectionPage')?.remove();
    const b = getBrand(bId);
    if (!b) return;

    const sectionLabel = { highlights:'HIGHLIGHTS', stories:'STORIES', reels:'REELS', feed:'FEED' }[sectionType] || sectionType.toUpperCase();
    const platName = PLAT_DISPLAY_NAMES[platform] || platform;

    const page = document.createElement('div');
    page.id = 'plannerSectionPage';
    page.style.cssText = 'position:fixed;inset:0;z-index:300;background:#0a0a0a;display:flex;flex-direction:column;overflow:hidden';
    page.innerHTML = `
      <div style="flex-shrink:0;display:flex;align-items:center;gap:12px;padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top,0px));border-bottom:1px solid rgba(255,255,255,0.06)">
        <button id="secPageBack" type="button" style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">‹</button>
        <div>
          <div style="font-size:10px;letter-spacing:1px;color:rgba(255,255,255,0.4)">${escHtml(platName.toUpperCase())}</div>
          <div style="font-size:18px;font-weight:700;color:#fff">${sectionLabel}</div>
        </div>
      </div>
      <div id="secPageBody" style="flex:1;overflow-y:auto;overscroll-behavior:contain;padding:20px"></div>
      <input type="file" accept="image/*" id="secPageFile" style="display:none">
    `;
    document.body.appendChild(page);

    page.querySelector('#secPageBack')?.addEventListener('click', () => {
      page.remove();
      onBack?.();
    });

    const body = page.querySelector('#secPageBody');
    const secFile = page.querySelector('#secPageFile');
    let pendingSecCb = null;

    secFile?.addEventListener('change', () => {
      const file = secFile.files[0];
      if (!file || !pendingSecCb) return;
      const reader = new FileReader();
      reader.onload = ev => { pendingSecCb(ev.target.result); pendingSecCb = null; secFile.value = ''; };
      reader.readAsDataURL(file);
    });

    function pickImage(cb) { pendingSecCb = cb; secFile.click(); }

    const trashSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

    function swipeCard(id, w, h, thumbHtml) {
      const size = h === 'aspect' ? `width:${w};aspect-ratio:4/5` : `width:${w};height:${h}`;
      return `
        <div style="position:relative;${size};flex-shrink:0;border-radius:10px;overflow:hidden">
          <div data-swipe-del="${escHtml(id)}" style="position:absolute;right:0;top:0;bottom:0;width:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            <span style="color:#e53935;font-size:10px;font-weight:700;pointer-events:none">Delete</span>
          </div>
          <div data-swipe-face data-item-id="${escHtml(id)}" style="position:absolute;inset:0;background:#1c1c1e;border:1px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;will-change:transform;cursor:pointer;touch-action:pan-y">
            ${thumbHtml}
          </div>
        </div>`;
    }

    function bindSwipeFaces(onTapId, onDelId) {
      let openFace = null;
      const SNAP = 72;

      function closeFace(face) {
        if (!face) return;
        face.style.transition = 'transform 0.2s ease';
        face.style.transform = 'translateX(0)';
        openFace = null;
      }

      body.querySelectorAll('[data-swipe-face]').forEach(face => {
        let startX = 0, startY = 0, curDx = 0, tracking = false;

        face.addEventListener('touchstart', e => {
          if (openFace && openFace !== face) closeFace(openFace);
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          curDx = 0; tracking = true;
          face.style.transition = 'none';
        }, { passive: true });

        face.addEventListener('touchmove', e => {
          if (!tracking) return;
          const dx = e.touches[0].clientX - startX;
          const dy = e.touches[0].clientY - startY;
          if (Math.abs(dy) > Math.abs(dx) && Math.abs(curDx) < 5) { tracking = false; return; }
          if (dx > 0 && Math.abs(curDx) < 5) return;
          curDx = Math.max(Math.min(dx, 0), -SNAP);
          face.style.transform = `translateX(${curDx}px)`;
        }, { passive: true });

        face.addEventListener('touchend', () => {
          if (!tracking) return;
          tracking = false;
          face.style.transition = 'transform 0.2s ease';
          if (curDx < -30) {
            face.style.transform = `translateX(-${SNAP}px)`;
            openFace = face;
          } else {
            face.style.transform = 'translateX(0)';
            if (openFace === face) openFace = null;
          }
        }, { passive: true });

        face.addEventListener('touchcancel', () => {
          tracking = false;
          face.style.transition = 'transform 0.2s ease';
          face.style.transform = 'translateX(0)';
          if (openFace === face) openFace = null;
        }, { passive: true });

        face.addEventListener('click', () => {
          if (openFace === face) { closeFace(face); return; }
          onTapId(face.dataset.itemId);
        });
      });

      body.querySelectorAll('[data-swipe-del]').forEach(del => {
        del.addEventListener('click', e => {
          e.stopPropagation();
          openFace = null;
          onDelId(del.dataset.swipeDel);
        });
      });
    }

    // ── STORIES ──────────────────────────────────────────
    if (sectionType === 'highlights') {
      function renderHighlights() {
        const b2 = getBrand(bId);
        const highlights = (b2.plannerHighlights||{})[platform]||[];

        body.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
            ${highlights.map(h=>`
              <button class="sec-hl" data-hid="${escHtml(h.id)}" type="button" style="display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;cursor:pointer;padding:0;width:100%">
                <div style="width:100%;aspect-ratio:1/1;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center">
                  ${h.cover?`<img src="${escHtml(h.cover)}" style="width:100%;height:100%;object-fit:cover" alt="">`:'<span style="font-size:24px;color:rgba(255,255,255,0.3)">★</span>'}
                </div>
                <div style="font-size:10px;color:rgba(255,255,255,0.45);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%">${escHtml(h.name)}</div>
              </button>`).join('')}
            <button id="secAddHl" type="button" style="display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;cursor:pointer;padding:0;width:100%">
              <div style="width:100%;aspect-ratio:1/1;border-radius:50%;border:2px dashed rgba(255,255,255,0.2);background:transparent;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:22px">+</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.3)">New</div>
            </button>
          </div>`;

        body.querySelector('#secAddHl')?.addEventListener('click', () => {
          const name = prompt('Highlight name:');
          if (!name?.trim()) return;
          const b3 = getBrand(bId);
          const hl = { ...(b3.plannerHighlights||{}) };
          hl[platform] = [...(hl[platform]||[]), { id:uid(), name:name.trim(), cover:'', stories:[] }];
          saveBrandOverride(bId, { plannerHighlights: hl });
          renderHighlights();
        });

        body.querySelectorAll('.sec-hl').forEach(btn => {
          btn.addEventListener('click', () => {
            const b3 = getBrand(bId);
            const hl = (b3.plannerHighlights||{})[platform]||[];
            const h = hl.find(x=>x.id===btn.dataset.hid);
            if (h) openHighlightSheet(bId, platform, h, renderHighlights);
          });
        });
      }
      renderHighlights();

    } else if (sectionType === 'stories') {
      function renderStories() {
        const b2 = getBrand(bId);
        const storyItems = (b2.scheduledPosts||[]).filter(i=>i.platform===platform && _isStory(i.format) && (!cId||i.campaignId===cId));
        const thumb = s => s.thumbnail
          ? `<img src="${escHtml(s.thumbnail)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" alt="">`
          : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:28px">+</div>`;

        body.innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${storyItems.map(s=>swipeCard(s.id,'88px','156px',thumb(s))).join('')}
            <button id="secAddStory" type="button" style="width:88px;height:156px;border-radius:10px;border:2px dashed rgba(255,255,255,0.14);background:transparent;color:rgba(255,255,255,0.3);font-size:28px;flex-shrink:0;cursor:pointer">+</button>
          </div>`;

        body.querySelector('#secAddStory')?.addEventListener('click', () => {
          pickImage(dataUrl => {
            const b3 = getBrand(bId);
            const fmt = ((b3.platformStrategy[platform]||{}).formats||[]).find(f=>_isStory(f)) || 'Story';
            saveBrandOverride(bId, { scheduledPosts:[...(b3.scheduledPosts||[]), { id:uid(), platform, format:fmt, title:'', thumbnail:dataUrl, scheduledDate:null, campaignId:cId||null, order:(b3.scheduledPosts||[]).length }] });
            renderStories();
          });
        });

        bindSwipeFaces(
          id => pickImage(dataUrl => {
            const b3 = getBrand(bId);
            saveBrandOverride(bId, { scheduledPosts:(b3.scheduledPosts||[]).map(p=>p.id===id?{...p,thumbnail:dataUrl}:p) });
            renderStories();
          }),
          id => {
            const b3 = getBrand(bId);
            saveBrandOverride(bId, { scheduledPosts:(b3.scheduledPosts||[]).filter(p=>p.id!==id) });
            renderStories();
          }
        );
      }
      renderStories();

    // ── REELS ──────────────────────────────────────────
    } else if (sectionType === 'reels') {
      function renderReels() {
        const b2 = getBrand(bId);
        const reelItems = (b2.scheduledPosts||[]).filter(i=>i.platform===platform && _isReel(i.format) && (!cId||i.campaignId===cId));
        const thumb = s => s.thumbnail
          ? `<img src="${escHtml(s.thumbnail)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" alt="">`
          : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:28px">+</div>`;

        body.innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${reelItems.map(s=>swipeCard(s.id,'88px','156px',thumb(s))).join('')}
            <button id="secAddReel" type="button" style="width:88px;height:156px;border-radius:10px;border:2px dashed rgba(255,255,255,0.14);background:transparent;color:rgba(255,255,255,0.3);font-size:28px;flex-shrink:0;cursor:pointer">+</button>
          </div>`;

        body.querySelector('#secAddReel')?.addEventListener('click', () => {
          pickImage(dataUrl => {
            const b3 = getBrand(bId);
            const fmt = ((b3.platformStrategy[platform]||{}).formats||[]).find(f=>_isReel(f)) || 'Reel';
            saveBrandOverride(bId, { scheduledPosts:[...(b3.scheduledPosts||[]), { id:uid(), platform, format:fmt, title:'', thumbnail:dataUrl, scheduledDate:null, campaignId:cId||null, order:(b3.scheduledPosts||[]).length }] });
            renderReels();
          });
        });

        bindSwipeFaces(
          id => pickImage(dataUrl => {
            const b3 = getBrand(bId);
            saveBrandOverride(bId, { scheduledPosts:(b3.scheduledPosts||[]).map(p=>p.id===id?{...p,thumbnail:dataUrl}:p) });
            renderReels();
          }),
          id => {
            const b3 = getBrand(bId);
            saveBrandOverride(bId, { scheduledPosts:(b3.scheduledPosts||[]).filter(p=>p.id!==id) });
            renderReels();
          }
        );
      }
      renderReels();

    // ── FEED ──────────────────────────────────────────
    } else if (sectionType === 'feed') {
      let feedView = 'carousel';

      function openCarouselEditor(postId) {
        const b = getBrand(bId);
        const post = (b.scheduledPosts||[]).find(p=>p.id===postId);
        if (!post) return;
        let slides = [...(post.slides || (post.thumbnail ? [{ dataUrl: post.thumbnail }] : []))];
        let curIdx = 0;

        document.getElementById('carouselEditor')?.remove();
        const ov = document.createElement('div');
        ov.id = 'carouselEditor';
        ov.style.cssText = 'position:fixed;inset:0;z-index:500;background:#000;display:flex;flex-direction:column';

        const ceFile = document.createElement('input');
        ceFile.type = 'file'; ceFile.accept = 'image/*'; ceFile.style.display = 'none';
        ov.appendChild(ceFile);

        function saveSlides() {
          const b3 = getBrand(bId);
          saveBrandOverride(bId, { scheduledPosts:(b3.scheduledPosts||[]).map(p=>
            p.id===postId ? {...p, slides, thumbnail: slides[0]?.dataUrl||null} : p
          )});
          renderFeed();
        }

        function draw() {
          ov.querySelector('#ceBody')?.remove();
          const bd = document.createElement('div');
          bd.id = 'ceBody';
          bd.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0';
          bd.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:max(20px,env(safe-area-inset-top,20px)) 16px 12px;flex-shrink:0">
              <button id="ceClose" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
              <div style="color:rgba(255,255,255,0.6);font-size:14px;font-weight:600">${slides.length ? `${curIdx+1} / ${slides.length}` : 'No images'}</div>
              <button id="ceAdd" style="background:rgba(255,255,255,0.1);border:none;border-radius:20px;padding:8px 16px;color:#fff;font-size:13px;cursor:pointer">+ Add</button>
            </div>
            <div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
              ${slides[curIdx]?.dataUrl
                ? `<img src="${escHtml(slides[curIdx].dataUrl)}" style="max-width:100%;max-height:100%;object-fit:contain;display:block">`
                : `<div style="color:rgba(255,255,255,0.25);font-size:14px;text-align:center">Tap + Add to add images</div>`}
              ${slides.length > 1 ? `
                <button id="cePrev" style="position:absolute;left:12px;background:rgba(0,0,0,0.5);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center">‹</button>
                <button id="ceNext" style="position:absolute;right:12px;background:rgba(0,0,0,0.5);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center">›</button>` : ''}
            </div>
            ${slides.length > 1 ? `
              <div style="display:flex;justify-content:center;gap:6px;padding:10px 0;flex-shrink:0">
                ${slides.map((_,i)=>`<div style="width:6px;height:6px;border-radius:50%;background:${i===curIdx?'#fff':'rgba(255,255,255,0.3)'}"></div>`).join('')}
              </div>` : ''}
            <div style="display:flex;gap:6px;padding:10px 16px;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));overflow-x:auto;flex-shrink:0">
              ${slides.map((s,i)=>`
                <div data-ce-idx="${i}" style="position:relative;width:64px;height:64px;border-radius:8px;overflow:hidden;flex-shrink:0;border:2px solid ${i===curIdx?'#fff':'transparent'};cursor:pointer">
                  <img src="${escHtml(s.dataUrl)}" style="width:100%;height:100%;object-fit:cover;display:block">
                  <button data-ce-del="${i}" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.65);border:none;border-radius:50%;width:18px;height:18px;color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">×</button>
                </div>`).join('')}
            </div>`;

          ov.insertBefore(bd, ceFile);

          bd.querySelector('#ceClose')?.addEventListener('click', () => { saveSlides(); ov.remove(); });
          bd.querySelector('#ceAdd')?.addEventListener('click', () => ceFile.click());
          bd.querySelector('#cePrev')?.addEventListener('click', () => { curIdx = Math.max(0, curIdx-1); draw(); });
          bd.querySelector('#ceNext')?.addEventListener('click', () => { curIdx = Math.min(slides.length-1, curIdx+1); draw(); });
          bd.querySelectorAll('[data-ce-idx]').forEach(el => {
            el.addEventListener('click', e => {
              if (e.target.closest('[data-ce-del]')) return;
              curIdx = parseInt(el.dataset.ceIdx); draw();
            });
          });
          bd.querySelectorAll('[data-ce-del]').forEach(btn => {
            btn.addEventListener('click', e => {
              e.stopPropagation();
              slides.splice(parseInt(btn.dataset.ceDel), 1);
              if (curIdx >= slides.length) curIdx = Math.max(0, slides.length-1);
              draw();
            });
          });
        }

        ceFile.addEventListener('change', e => {
          const file = e.target.files[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => { slides.push({ dataUrl: ev.target.result }); curIdx = slides.length-1; draw(); };
          reader.readAsDataURL(file);
          ceFile.value = '';
        });

        document.body.appendChild(ov);
        draw();
      }

      function renderFeed() {
        const b2 = getBrand(bId);
        const feedItems = (b2.scheduledPosts||[]).filter(i=>i.platform===platform && _isFeed(i.format) && (!cId||i.campaignId===cId));
        const isCarousel = feedView === 'carousel';

        function thumbHTML(s) {
          let bg = '';
          if (s.placeholderColor) {
            bg = `<div style="position:absolute;inset:0;background:${escHtml(s.placeholderColor)};display:flex;align-items:flex-end;padding:8px 7px">
      ${s.title ? `<div style="color:rgba(255,255,255,0.9);font-size:10px;font-weight:700;line-height:1.2;text-shadow:0 1px 3px rgba(0,0,0,0.6);word-break:break-word">${escHtml(s.title)}</div>` : ''}
    </div>`;
          } else if (isCarousel) {
            const sl = s.slides || (s.thumbnail ? [{ dataUrl: s.thumbnail }] : []);
            const first = sl[0]?.dataUrl;
            bg = `${first ? `<img src="${escHtml(first)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" alt="">` : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:28px">+</div>`}
      ${sl.length > 1 ? `<div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.55);border-radius:4px;padding:2px 5px;font-size:10px;color:#fff;font-weight:700;pointer-events:none">${sl.length}</div>` : ''}`;
          } else {
            bg = s.thumbnail
              ? `<img src="${escHtml(s.thumbnail)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" alt="">`
              : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:28px">+</div>`;
          }
          return bg;
        }

        body.innerHTML = `
          <div style="display:flex;gap:6px;margin-bottom:16px">
            <button data-fv="carousel" type="button" style="padding:6px 18px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:${isCarousel?'rgba(255,255,255,0.1)':'transparent'};color:${isCarousel?'#fff':'rgba(255,255,255,0.4)'};font-size:13px;cursor:pointer">Carousel</button>
            <button data-fv="single" type="button" style="padding:6px 18px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:${!isCarousel?'rgba(255,255,255,0.1)':'transparent'};color:${!isCarousel?'#fff':'rgba(255,255,255,0.4)'};font-size:13px;cursor:pointer">Single Post</button>
          </div>
          ${isCarousel ? `
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px">
              ${feedItems.map(s=>swipeCard(s.id,'140px','aspect',thumbHTML(s))).join('')}
              <button id="secAddFeed" type="button" style="width:140px;aspect-ratio:4/5;border-radius:10px;border:2px dashed rgba(255,255,255,0.14);background:transparent;color:rgba(255,255,255,0.3);font-size:28px;flex-shrink:0;cursor:pointer">+</button>
            </div>` : `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
              ${feedItems.map(s=>swipeCard(s.id,'100%','aspect',thumbHTML(s))).join('')}
              <button id="secAddFeed" type="button" style="width:100%;aspect-ratio:4/5;border-radius:10px;border:2px dashed rgba(255,255,255,0.14);background:transparent;color:rgba(255,255,255,0.3);font-size:28px;cursor:pointer">+</button>
            </div>`}`;

        body.querySelectorAll('[data-fv]').forEach(btn => {
          btn.addEventListener('click', () => { feedView = btn.dataset.fv; renderFeed(); });
        });

        body.querySelector('#secAddFeed')?.addEventListener('click', () => {
          openThumbnailMenu(null, bId, cId, platform, isCarousel, renderFeed);
        });

        bindSwipeFaces(
          id => {
            const b3 = getBrand(bId);
            const post = (b3.scheduledPosts||[]).find(p => p.id === id);
            if (!post) return;
            const hasThumbnail = isCarousel ? (post.slides?.length > 0 || !!post.thumbnail) : !!post.thumbnail;
            if (hasThumbnail) {
              if (isCarousel) {
                openCarouselView(id, bId, cId, platform, renderFeed);
              } else {
                openPostDetailView(id, bId);
              }
            } else {
              openThumbnailMenu(id, bId, cId, platform, isCarousel, renderFeed);
            }
          },
          id => {
            const b3 = getBrand(bId);
            saveBrandOverride(bId, { scheduledPosts:(b3.scheduledPosts||[]).filter(p=>p.id!==id) });
            renderFeed();
          }
        );

      }
      renderFeed();
    }
  }

  // Bind initial static cards (rendered by sectionHTML on page load)
  content?.querySelectorAll('.planner-sec-card').forEach(card => {
    card.addEventListener('click', () => openPlannerSectionPage(brandId, campId, card.dataset.platform, card.dataset.section, renderContent));
  });

  // Platform tabs
  tabs?.addEventListener('click', e => {
    const tab = e.target.closest('.planner-tab');
    if (!tab) return;
    activePlatform = tab.dataset.platform;
    tabs.querySelectorAll('.planner-tab').forEach(t=>t.classList.toggle('active', t.dataset.platform===activePlatform));
    renderContent();
  });

  // Add item
  content?.addEventListener('click', e => {
    const btn = e.target.closest('.planner-add-item');
    if (!btn) return;
    const platform = btn.dataset.platform;
    const fmts = JSON.parse(btn.dataset.formats||'[]');
    showAddSheet(platform, fmts);
  });

  function showAddSheet(platform, fmts) {
    document.getElementById('plannerAddSheet')?.remove();
    let selFmt = fmts[0]||'Post';
    const overlay = document.createElement('div');
    overlay.id = 'plannerAddSheet';
    overlay.className = 'add-post-overlay';
    overlay.innerHTML = `
      <div class="add-post-sheet">
        <div class="add-post-title">Add to ${escHtml(PLAT_DISPLAY_NAMES[platform]||platform)}</div>
        <input class="notion-input" id="addItemTitle" placeholder="Post title (optional)" style="margin-bottom:14px">
        ${fmts.length>1?`
          <div class="planner-section-label" style="margin-bottom:8px">FORMAT</div>
          <div class="add-post-format-row" id="addFmtPicker">
            ${fmts.map((f,i)=>`<button class="add-post-fmt-btn${i===0?' active':''}" data-fmt="${escHtml(f)}">${escHtml(f)}</button>`).join('')}
          </div>`:''}
        <button class="add-post-save" id="addWithThumb">Add with Thumbnail</button>
        <button class="add-post-save" id="addNoThumb" style="background:rgba(255,255,255,0.08);color:#fff;margin-top:8px">Add Placeholder</button>
        <button class="add-post-cancel" id="addCancel">Cancel</button>
      </div>`;
    document.getElementById('app').appendChild(overlay);

    overlay.querySelectorAll('.add-post-fmt-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        overlay.querySelectorAll('.add-post-fmt-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        selFmt = btn.dataset.fmt;
      });
    });

    function doAdd(thumbnail) {
      const b = getBrand(brandId);
      if (!b) return;
      const title = document.getElementById('addItemTitle')?.value.trim()||'';
      const newItem = { id:uid(), platform, format:selFmt, title, thumbnail:thumbnail||null, scheduledDate:null, campaignId:campId||null, order:(b.scheduledPosts||[]).filter(i=>i.platform===platform).length };
      saveBrandOverride(brandId, { scheduledPosts:[...(b.scheduledPosts||[]), newItem] });
      overlay.remove();
      renderContent();
    }

    document.getElementById('addWithThumb')?.addEventListener('click',()=>{
      pendingThumbCb = doAdd;
      fileInput?.click();
    });
    document.getElementById('addNoThumb')?.addEventListener('click',()=>doAdd(null));
    document.getElementById('addCancel')?.addEventListener('click',()=>overlay.remove());
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  }

  fileInput?.addEventListener('change',()=>{
    const file = fileInput.files[0];
    if (!file||!pendingThumbCb) return;
    const reader = new FileReader();
    reader.onload = ev => { pendingThumbCb(ev.target.result); pendingThumbCb=null; fileInput.value=''; };
    reader.readAsDataURL(file);
  });

  // Touch drag-and-drop
  function bindDragDrop() {
    if (!content) return;
    let drag=null, ghost=null;

    function startDrag(item, x, y) {
      const rect = item.getBoundingClientRect();
      ghost = item.cloneNode(true);
      Object.assign(ghost.style, { position:'fixed', left:rect.left+'px', top:rect.top+'px', width:rect.width+'px', height:rect.height+'px', zIndex:'9999', opacity:'0.88', pointerEvents:'none', borderRadius:'6px', boxShadow:'0 10px 30px rgba(0,0,0,0.6)', transition:'none' });
      document.body.appendChild(ghost);
      item.style.opacity='0.2';
      drag = { item, startX:x, startY:y, dropTarget:null };
    }

    function moveDrag(x, y) {
      if (!drag||!ghost) return;
      ghost.style.transform = `translate(${x-drag.startX}px,${y-drag.startY}px)`;
      ghost.style.display='none';
      const el = document.elementFromPoint(x,y);
      ghost.style.display='';
      const target = el?.closest('[data-id]');
      content.querySelectorAll('.planner-drop-over').forEach(e=>e.classList.remove('planner-drop-over'));
      if (target&&target!==drag.item&&target.dataset.id) { target.classList.add('planner-drop-over'); drag.dropTarget=target; }
      else drag.dropTarget=null;
    }

    function endDrag() {
      if (!drag) return;
      content.querySelectorAll('.planner-drop-over').forEach(e=>e.classList.remove('planner-drop-over'));
      ghost?.remove(); ghost=null;
      drag.item.style.opacity='';
      if (drag.dropTarget?.dataset.id) {
        const b = getBrand(brandId);
        if (b) {
          const posts = [...(b.scheduledPosts||[])];
          const fi = posts.findIndex(p=>p.id===drag.item.dataset.id);
          const ti = posts.findIndex(p=>p.id===drag.dropTarget.dataset.id);
          if (fi!==-1&&ti!==-1&&fi!==ti) {
            const tmp=posts[fi]; posts[fi]=posts[ti]; posts[ti]=tmp;
            saveBrandOverride(brandId,{scheduledPosts:posts});
            renderContent(); drag=null; return;
          }
        }
      }
      drag=null;
    }

    let dragTimer=null;
    content.addEventListener('touchstart',e=>{
      const item=e.target.closest('[data-id]');
      if(!item) return;
      const t=e.touches[0];
      dragTimer=setTimeout(()=>startDrag(item,t.clientX,t.clientY),250);
    },{passive:true});
    content.addEventListener('touchmove',e=>{
      if(!drag){clearTimeout(dragTimer);return;}
      e.preventDefault();
      moveDrag(e.touches[0].clientX,e.touches[0].clientY);
    },{passive:false});
    content.addEventListener('touchend',()=>{clearTimeout(dragTimer);endDrag();},{passive:true});
    content.addEventListener('touchcancel',()=>{clearTimeout(dragTimer);ghost?.remove();ghost=null;if(drag){drag.item.style.opacity='';drag=null;}},{passive:true});
  }

  bindDragDrop();
}

/* ═══════════════════════════════════════
   PLANNER POST ACTION MENU
═══════════════════════════════════════ */
function openPostMenu(postId, brandId, campId, onRefresh) {
  document.getElementById('postMenu')?.remove();
  const b = getBrand(brandId);
  const post = (b?.scheduledPosts || []).find(p => p.id === postId);
  if (!post) return;

  const calSVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const editSVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

  const dateLabel = post.scheduledDate
    ? new Date(post.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const sheet = document.createElement('div');
  sheet.id = 'postMenu';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:450;background:rgba(0,0,0,0.5);display:flex;flex-direction:column;justify-content:flex-end';
  sheet.innerHTML = `
    <div style="background:#1c1c1e;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">
      <div style="padding:14px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.07)">
        <div style="font-size:14px;font-weight:600;color:#fff">${escHtml(post.title || post.format || 'Post')}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px">${PLAT_DISPLAY_NAMES[post.platform] || post.platform} · ${escHtml(post.format)}${dateLabel ? ' · ' + dateLabel : ''}</div>
      </div>
      <button id="postMenuSchedule" style="width:100%;padding:16px 20px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:15px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:14px">
        ${calSVG} Schedule
      </button>
      <button id="postMenuDetails" style="width:100%;padding:16px 20px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:15px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:14px">
        ${editSVG} Add Details
      </button>
      <button id="postMenuCancel" style="width:100%;padding:15px 20px;background:none;border:none;color:rgba(255,255,255,0.35);font-size:14px;cursor:pointer">Cancel</button>
    </div>`;

  document.body.appendChild(sheet);

  sheet.querySelector('#postMenuSchedule')?.addEventListener('click', () => {
    sheet.remove();
    openScheduleSheet(brandId, campId, { existingPostId: post.id, date: post.scheduledDate || '' }, onRefresh);
  });
  sheet.querySelector('#postMenuDetails')?.addEventListener('click', () => {
    sheet.remove();
    openPostDetails(postId, brandId, onRefresh);
  });
  sheet.querySelector('#postMenuCancel')?.addEventListener('click', () => sheet.remove());
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
}

function openPostDetails(postId, brandId, onSave) {
  document.getElementById('postDetails')?.remove();
  const b = getBrand(brandId);
  const post = (b?.scheduledPosts || []).find(p => p.id === postId);
  if (!post) return;

  const linkedIdea = post.ideaId ? (b.ideas || []).find(i => i.id === post.ideaId) : null;

  const sheet = document.createElement('div');
  sheet.id = 'postDetails';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:450;background:rgba(0,0,0,0.5);display:flex;flex-direction:column;justify-content:flex-end';
  sheet.innerHTML = `
    <div style="background:#1c1c1e;border-radius:20px 20px 0 0;max-height:75vh;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,0px)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
        <div style="font-size:16px;font-weight:700;color:#fff">Post Details</div>
        <button id="postDetailsSave" style="background:rgba(255,255,255,0.1);border:none;border-radius:20px;padding:7px 18px;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Save</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:20px;overscroll-behavior:contain;display:flex;flex-direction:column;gap:16px">
        <button id="pdFromIdeas" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${linkedIdea ? '#c8a0ff' : 'rgba(255,255,255,0.4)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26A7.003 7.003 0 0112 2z"/></svg>
          <span style="flex:1;font-size:13px;font-weight:500;color:${linkedIdea ? '#c8a0ff' : 'rgba(255,255,255,0.45)'}">${linkedIdea ? escHtml(linkedIdea.title) : 'Choose from Ideas'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">TITLE</div>
          <input id="postDetailsTitle" type="text" value="${escHtml(post.title || '')}" placeholder="Add a title…" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;-webkit-appearance:none">
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">NOTES</div>
          <textarea id="postDetailsNotes" placeholder="Add notes…" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;resize:none;min-height:100px;box-sizing:border-box;-webkit-appearance:none">${escHtml(post.notes || '')}</textarea>
        </div>
      </div>
    </div>`;

  document.body.appendChild(sheet);

  let linkedIdeaId = post.ideaId || null;

  sheet.querySelector('#pdFromIdeas')?.addEventListener('click', () => {
    openIdeaPicker(brandId, idea => {
      linkedIdeaId = idea.id;
      sheet.querySelector('#postDetailsTitle').value = idea.title || '';
      sheet.querySelector('#postDetailsNotes').value = idea.notes || idea.references || '';
      const btn = sheet.querySelector('#pdFromIdeas');
      btn.querySelector('span').textContent = idea.title;
      btn.querySelector('span').style.color = '#c8a0ff';
      btn.querySelector('svg:first-child').setAttribute('stroke', '#c8a0ff');
    });
  });

  sheet.querySelector('#postDetailsSave')?.addEventListener('click', () => {
    const title = sheet.querySelector('#postDetailsTitle')?.value.trim();
    const notes = sheet.querySelector('#postDetailsNotes')?.value.trim();
    const b2 = getBrand(brandId);
    if (!b2) return;
    const posts = (b2.scheduledPosts || []).map(p => p.id === postId ? { ...p, title, notes, ideaId: linkedIdeaId || p.ideaId || null } : p);
    saveBrandOverride(brandId, { scheduledPosts: posts });
    sheet.remove();
    if (onSave) onSave();
  });
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
}

function pickImage(cb) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', () => {
    const file = input.files[0];
    input.remove();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => cb(ev.target.result);
    reader.readAsDataURL(file);
  });
  input.click();
}

function openThumbnailMenu(postId, bId, cId, platform, isCarousel, onDone) {
  document.getElementById('thumbMenu')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'thumbMenu';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0.55);display:flex;flex-direction:column;justify-content:flex-end';

  function getOrCreatePost() {
    if (postId) return postId;
    const b3 = getBrand(bId);
    const fmt = ((b3.platformStrategy[platform]||{}).formats||[]).find(f => _isFeed(f)) || 'Post';
    const newId = uid();
    saveBrandOverride(bId, { scheduledPosts:[...(b3.scheduledPosts||[]), { id:newId, platform, format:fmt, title:'', thumbnail:null, slides:[], scheduledDate:null, campaignId:cId||null }] });
    postId = newId;
    return newId;
  }

  const chev = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  function row(id, iconBg, iconStroke, iconPath, label, sub) {
    return `<button id="${id}" type="button" style="display:flex;align-items:center;gap:14px;padding:15px 20px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;background:none;border:none;width:100%;text-align:left">
      <div style="width:40px;height:40px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
      </div>
      <div style="flex:1"><div style="font-weight:700;font-size:15px;color:#fff">${label}</div><div style="font-size:12px;color:rgba(255,255,255,0.38);margin-top:2px">${sub}</div></div>
      ${chev}
    </button>`;
  }

  overlay.innerHTML = `
    <div style="background:#1c1c1e;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">
      <div style="color:#fff;font-size:16px;font-weight:700;padding:16px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.07)">Add Post</div>
      ${row('tmPlaceholder','rgba(124,58,173,0.15)','#c8a0ff','<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>','Add Placeholder','Choose a colour and add your post title')}
      ${row('tmPhoto','rgba(99,102,241,0.15)','#818cf8','<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>','Upload Photo','Add an image from your library')}
      ${row('tmSchedule','rgba(34,197,94,0.12)','#4ade80','<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>','Schedule','Pick a date — saves directly to calendar')}
      ${row('tmDetails','rgba(255,255,255,0.07)','rgba(255,255,255,0.65)','<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>','Add Details','Photos, videos, links and notes')}
      <button id="tmCancel" type="button" style="width:100%;background:none;border:none;color:rgba(255,255,255,0.38);font-size:15px;padding:16px;cursor:pointer">Cancel</button>
    </div>`;

  document.body.appendChild(overlay);

  overlay.querySelector('#tmPlaceholder').addEventListener('click', () => {
    overlay.remove();
    const pid = getOrCreatePost();
    openPlaceholderCreator(pid, bId, onDone);
  });

  overlay.querySelector('#tmPhoto').addEventListener('click', () => {
    overlay.remove();
    const pid = getOrCreatePost();
    if (isCarousel) {
      openCarouselView(pid, bId, cId, platform, onDone);
    } else {
      pickImage(dataUrl => {
        const b3 = getBrand(bId);
        saveBrandOverride(bId, { scheduledPosts:(b3.scheduledPosts||[]).map(p=>p.id===pid?{...p,thumbnail:dataUrl,placeholderColor:null}:p) });
        if (onDone) onDone();
      });
    }
  });

  overlay.querySelector('#tmSchedule').addEventListener('click', () => {
    overlay.remove();
    const pid = getOrCreatePost();
    const b3 = getBrand(bId);
    const post = (b3.scheduledPosts||[]).find(p=>p.id===pid);
    openScheduleSheet(bId, cId, { existingPostId: pid, date: post?.scheduledDate||'' }, onDone);
  });

  overlay.querySelector('#tmDetails').addEventListener('click', () => {
    overlay.remove();
    const pid = getOrCreatePost();
    openPostDetailsPage(pid, bId, onDone);
  });

  overlay.querySelector('#tmCancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function openCarouselView(postId, bId, cId, platform, onDone) {
  document.getElementById('carouselView')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'carouselView';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:450;background:#0a0a0f;display:flex;flex-direction:column;overflow:hidden';

  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
  overlay.appendChild(fileInput);

  function getSlides() {
    const b = getBrand(bId);
    const post = (b?.scheduledPosts||[]).find(p=>p.id===postId);
    if (!post) return [];
    return post.slides?.length ? [...post.slides] : (post.thumbnail ? [{dataUrl: post.thumbnail}] : []);
  }

  function saveSlides(slides) {
    const b = getBrand(bId);
    saveBrandOverride(bId, { scheduledPosts:(b.scheduledPosts||[]).map(p=>
      p.id===postId ? {...p, slides, thumbnail: slides[0]?.dataUrl||null} : p
    )});
  }

  function draw() {
    const slides = getSlides();
    overlay.querySelector('#cvBody')?.remove();
    const bd = document.createElement('div');
    bd.id = 'cvBody';
    bd.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0';
    bd.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:max(20px,env(safe-area-inset-top,20px)) 16px 12px;flex-shrink:0">
        <button id="cvBack" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
        <div style="color:#fff;font-size:16px;font-weight:700">Carousel <span style="color:rgba(255,255,255,0.4);font-size:13px;font-weight:400">${slides.length} slide${slides.length!==1?'s':''}</span></div>
        <div style="width:36px"></div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:0 16px 32px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${slides.map((s,i)=>`
            <div data-cv-idx="${i}" style="aspect-ratio:4/5;border-radius:10px;overflow:hidden;position:relative;cursor:pointer;background:#1c1c1e">
              <img src="${escHtml(s.dataUrl)}" style="width:100%;height:100%;object-fit:cover;display:block" alt="">
              <div style="position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.55);border-radius:4px;padding:2px 5px;font-size:10px;color:#fff;font-weight:700;pointer-events:none">${i+1}</div>
            </div>`).join('')}
          <div id="cvAddSlide" style="aspect-ratio:4/5;border-radius:10px;border:2px dashed rgba(255,255,255,0.14);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:28px;cursor:pointer">+</div>
        </div>
      </div>`;
    overlay.insertBefore(bd, fileInput);

    bd.querySelector('#cvBack').addEventListener('click', () => { overlay.remove(); if(onDone) onDone(); });
    bd.querySelector('#cvAddSlide').addEventListener('click', () => fileInput.click());
    bd.querySelectorAll('[data-cv-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.cvIdx);
        overlay.remove();
        openSlideView(postId, idx, bId, cId, platform, () => openCarouselView(postId, bId, cId, platform, onDone));
      });
    });
  }

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const slides = getSlides();
      slides.push({ dataUrl: ev.target.result });
      saveSlides(slides);
      fileInput.value = '';
      draw();
    };
    reader.readAsDataURL(file);
  });

  document.body.appendChild(overlay);
  draw();
}

function openSlideView(postId, slideIdx, bId, cId, platform, refreshFn) {
  document.getElementById('slideView')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'slideView';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:460;background:#000;display:flex;flex-direction:column;overflow:hidden';

  function getPostData() {
    const b = getBrand(bId);
    const post = (b?.scheduledPosts||[]).find(p=>p.id===postId);
    if (!post) return { slide: null, total: 0, post: null };
    const slides = post.slides?.length ? post.slides : (post.thumbnail ? [{dataUrl: post.thumbnail}] : []);
    return { slide: slides[slideIdx], total: slides.length, post };
  }

  function draw() {
    const { slide, total, post } = getPostData();
    overlay.querySelector('#svBody')?.remove();
    const bd = document.createElement('div');
    bd.id = 'svBody';
    bd.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0';
    bd.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:max(20px,env(safe-area-inset-top,20px)) 16px 12px;flex-shrink:0">
        <button id="svBack" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center">‹</button>
        <div style="color:rgba(255,255,255,0.6);font-size:14px;font-weight:600">${slideIdx+1} / ${total}</div>
        <button id="svSettings" style="background:rgba(255,255,255,0.1);border:none;border-radius:20px;padding:8px 14px;color:#fff;font-size:13px;cursor:pointer;font-weight:600">Settings</button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:0 16px;min-height:0">
        ${slide?.dataUrl
          ? `<img src="${escHtml(slide.dataUrl)}" style="max-width:100%;max-height:100%;object-fit:contain;display:block;border-radius:8px">`
          : `<div style="color:rgba(255,255,255,0.25);font-size:14px;text-align:center">No image</div>`}
      </div>
      <div style="padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px));flex-shrink:0">
        ${post?.title ? `<div style="color:#fff;font-size:15px;font-weight:700;margin-bottom:4px">${escHtml(post.title)}</div>` : ''}
        ${post?.scheduledDate ? `<div style="color:rgba(255,255,255,0.4);font-size:13px">${post.scheduledDate}</div>` : ''}
      </div>`;
    overlay.appendChild(bd);

    bd.querySelector('#svBack').addEventListener('click', () => { overlay.remove(); if(refreshFn) refreshFn(); });
    bd.querySelector('#svSettings').addEventListener('click', () => {
      openSlideSettingsMenu(postId, slideIdx, bId, cId, platform, () => {
        overlay.remove();
        if (refreshFn) refreshFn();
      });
    });
  }

  document.body.appendChild(overlay);
  draw();
}

function openSlideSettingsMenu(postId, slideIdx, bId, cId, platform, onDone) {
  document.getElementById('slideSettingsMenu')?.remove();
  const sheet = document.createElement('div');
  sheet.id = 'slideSettingsMenu';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:470;background:rgba(0,0,0,0.55);display:flex;flex-direction:column;justify-content:flex-end';

  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
  sheet.appendChild(fileInput);

  const chev = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;
  function ssRow(id, iconBg, iconStroke, iconPath, label, sub) {
    return `<button id="${id}" type="button" style="display:flex;align-items:center;gap:14px;padding:15px 20px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;background:none;border:none;width:100%;text-align:left">
      <div style="width:40px;height:40px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
      </div>
      <div style="flex:1"><div style="font-weight:700;font-size:15px;color:#fff">${label}</div><div style="font-size:12px;color:rgba(255,255,255,0.38);margin-top:2px">${sub}</div></div>
      ${chev}
    </button>`;
  }

  const menuDiv = document.createElement('div');
  menuDiv.style.cssText = 'background:#1c1c1e;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)';
  menuDiv.innerHTML = `
    <div style="color:#fff;font-size:16px;font-weight:700;padding:16px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.07)">Slide Options</div>
    ${ssRow('ssReplace','rgba(99,102,241,0.15)','#818cf8','<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>','Replace Image','Swap this slide with a new photo')}
    ${ssRow('ssRemove','rgba(239,68,68,0.12)','#f87171','<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>','Remove Slide','Delete this slide from the carousel')}
    ${ssRow('ssSchedule','rgba(34,197,94,0.12)','#4ade80','<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>','Schedule','Pick a date — saves directly to calendar')}
    ${ssRow('ssDetails','rgba(255,255,255,0.07)','rgba(255,255,255,0.65)','<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>','Add Details','Photos, videos, links and notes')}
    <button id="ssCancel" type="button" style="width:100%;background:none;border:none;color:rgba(255,255,255,0.38);font-size:15px;padding:16px;cursor:pointer">Cancel</button>`;
  sheet.appendChild(menuDiv);
  document.body.appendChild(sheet);

  function getAndSaveSlides(transform) {
    const b = getBrand(bId);
    const post = (b?.scheduledPosts||[]).find(p=>p.id===postId);
    if (!post) return;
    const slides = post.slides?.length ? [...post.slides] : (post.thumbnail ? [{dataUrl: post.thumbnail}] : []);
    const next = transform(slides);
    saveBrandOverride(bId, { scheduledPosts:(b.scheduledPosts||[]).map(p=>
      p.id===postId ? {...p, slides: next, thumbnail: next[0]?.dataUrl||null} : p
    )});
  }

  sheet.querySelector('#ssReplace').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      getAndSaveSlides(slides => { slides[slideIdx] = { dataUrl: ev.target.result }; return slides; });
      fileInput.value = '';
      sheet.remove();
      if (onDone) onDone();
    };
    reader.readAsDataURL(file);
  });

  sheet.querySelector('#ssRemove').addEventListener('click', () => {
    getAndSaveSlides(slides => { slides.splice(slideIdx, 1); return slides; });
    sheet.remove();
    if (onDone) onDone();
  });

  sheet.querySelector('#ssSchedule').addEventListener('click', () => {
    sheet.remove();
    const b = getBrand(bId);
    const post = (b?.scheduledPosts||[]).find(p=>p.id===postId);
    openScheduleSheet(bId, cId, { existingPostId: postId, date: post?.scheduledDate||'' }, onDone);
  });

  sheet.querySelector('#ssDetails').addEventListener('click', () => {
    sheet.remove();
    openPostDetailsPage(postId, bId, onDone);
  });

  sheet.querySelector('#ssCancel').addEventListener('click', () => sheet.remove());
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
}

function openPlaceholderCreator(postId, brandId, onDone) {
  document.getElementById('placeholderCreator')?.remove();
  const b = getBrand(brandId);
  const post = (b?.scheduledPosts||[]).find(p=>p.id===postId);
  if (!post) return;

  const COLORS = [
    { hex: '#1a0a2e', label: 'Purple' },
    { hex: '#0a1628', label: 'Navy' },
    { hex: '#0f1c0f', label: 'Forest' },
    { hex: '#1c0a0a', label: 'Crimson' },
    { hex: '#1c1c0a', label: 'Gold' },
    { hex: '#0a1a1c', label: 'Teal' },
    { hex: '#1c0a18', label: 'Rose' },
    { hex: '#1c1c1e', label: 'Charcoal' },
  ];

  let selColor = post.placeholderColor || COLORS[0].hex;

  const sheet = document.createElement('div');
  sheet.id = 'placeholderCreator';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:410;background:rgba(0,0,0,0.55);display:flex;flex-direction:column;justify-content:flex-end';

  function renderSheet() {
    sheet.innerHTML = `
      <div style="background:#1c1c1e;border-radius:20px 20px 0 0;padding:20px 20px calc(28px + env(safe-area-inset-bottom,0px))">
        <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px">Add Placeholder</div>
        <div style="width:100%;aspect-ratio:4/5;border-radius:12px;background:${selColor};margin-bottom:16px;display:flex;align-items:flex-end;padding:12px;box-sizing:border-box">
          <div id="pcPreviewTitle" style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.6);word-break:break-word;min-height:20px">${escHtml(post.title||'')}</div>
        </div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:10px">POST TITLE</div>
        <input id="pcTitle" type="text" value="${escHtml(post.title||'')}" placeholder="Add a title…" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;color:#fff;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;-webkit-appearance:none;margin-bottom:16px">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:10px">COLOUR</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
          ${COLORS.map(c => `<button class="pc-color" data-hex="${c.hex}" style="width:40px;height:40px;border-radius:10px;background:${c.hex};border:${selColor===c.hex?'3px solid #fff':'2px solid rgba(255,255,255,0.15)'};cursor:pointer;flex-shrink:0" title="${c.label}"></button>`).join('')}
        </div>
        <button id="pcSave" style="width:100%;background:#fff;color:#000;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px">Save Placeholder</button>
        <button id="pcCancel" style="width:100%;background:none;border:none;color:rgba(255,255,255,0.38);font-size:15px;cursor:pointer;padding:6px">Cancel</button>
      </div>`;

    sheet.querySelectorAll('.pc-color').forEach(btn => {
      btn.addEventListener('click', () => {
        selColor = btn.dataset.hex;
        renderSheet();
        setTimeout(() => {
          const inp = sheet.querySelector('#pcTitle');
          if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        }, 50);
      });
    });

    sheet.querySelector('#pcTitle')?.addEventListener('input', e => {
      const preview = sheet.querySelector('#pcPreviewTitle');
      if (preview) preview.textContent = e.target.value;
    });

    sheet.querySelector('#pcSave')?.addEventListener('click', () => {
      const title = sheet.querySelector('#pcTitle')?.value.trim() || '';
      const b2 = getBrand(brandId);
      if (!b2) return;
      const posts = (b2.scheduledPosts||[]).map(p => p.id===postId ? {...p, title, placeholderColor: selColor, thumbnail: null} : p);
      saveBrandOverride(brandId, { scheduledPosts: posts });
      sheet.remove();
      if (onDone) onDone();
    });

    sheet.querySelector('#pcCancel')?.addEventListener('click', () => sheet.remove());
  }

  renderSheet();
  document.body.appendChild(sheet);
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
}

function openPostDetailsPage(postId, brandId, onSave) {
  document.getElementById('postDetailsPage')?.remove();
  const b = getBrand(brandId);
  const post = (b?.scheduledPosts||[]).find(p=>p.id===postId);
  if (!post) return;

  const overlay = document.createElement('div');
  overlay.id = 'postDetailsPage';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:420;background:#0a0a0f;display:flex;flex-direction:column;overflow:hidden';

  const existingLinks = post.links || [];
  const existingVideoLinks = post.videoLinks || [];
  let photos = post.detailPhotos ? [...post.detailPhotos] : [];

  function photoGrid() {
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
      ${photos.map((p,i) => `<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;flex-shrink:0">
        <img src="${escHtml(p)}" style="width:100%;height:100%;object-fit:cover" alt="">
        <button data-idx="${i}" class="pdp-del-photo" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:13px;line-height:1;cursor:pointer">×</button>
      </div>`).join('')}
      <button id="pdpAddPhoto" style="width:80px;height:80px;border-radius:8px;border:2px dashed rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:24px;cursor:pointer;flex-shrink:0">+</button>
    </div>`;
  }

  overlay.innerHTML = `
    <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0;padding-top:calc(14px + env(safe-area-inset-top,0px))">
      <button id="pdpBack" type="button" style="background:none;border:none;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0 12px 0 0">‹</button>
      <div style="flex:1;font-size:16px;font-weight:700;color:#fff">Add Details</div>
      <button id="pdpSave" style="background:rgba(255,255,255,0.1);border:none;border-radius:20px;padding:7px 18px;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Save</button>
    </div>
    <div id="pdpBody" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:20px;overscroll-behavior:contain">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">TITLE</div>
        <input id="pdpTitle" type="text" value="${escHtml(post.title||'')}" placeholder="Post title…" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;-webkit-appearance:none">
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">PHOTOS</div>
        <div id="pdpPhotoGrid">${photoGrid()}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">VIDEOS</div>
        <div id="pdpVideoList">
          ${existingVideoLinks.map((l,i) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><input class="pdp-video-input" type="url" value="${escHtml(l)}" placeholder="Paste video link…" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;color:#fff;font-size:14px;font-family:inherit;outline:none;-webkit-appearance:none"><button data-vidx="${i}" class="pdp-del-video" style="background:none;border:none;color:rgba(255,100,100,0.7);font-size:18px;cursor:pointer">×</button></div>`).join('')}
        </div>
        <button id="pdpAddVideo" style="background:none;border:1px dashed rgba(255,255,255,0.18);border-radius:10px;padding:10px 16px;color:rgba(255,255,255,0.38);font-size:13px;width:100%;cursor:pointer">+ Add video link</button>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">LINKS</div>
        <div id="pdpLinkList">
          ${existingLinks.map((l,i) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><input class="pdp-link-input" type="url" value="${escHtml(l)}" placeholder="Paste link…" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;color:#fff;font-size:14px;font-family:inherit;outline:none;-webkit-appearance:none"><button data-lidx="${i}" class="pdp-del-link" style="background:none;border:none;color:rgba(255,100,100,0.7);font-size:18px;cursor:pointer">×</button></div>`).join('')}
        </div>
        <button id="pdpAddLink" style="background:none;border:1px dashed rgba(255,255,255,0.18);border-radius:10px;padding:10px 16px;color:rgba(255,255,255,0.38);font-size:13px;width:100%;cursor:pointer">+ Add link</button>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">NOTES</div>
        <textarea id="pdpNotes" placeholder="Add notes…" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;resize:none;min-height:120px;box-sizing:border-box;-webkit-appearance:none">${escHtml(post.notes||'')}</textarea>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  function rebindPhotoGrid() {
    const grid = overlay.querySelector('#pdpPhotoGrid');
    if (grid) grid.innerHTML = photoGrid();
    grid?.querySelector('#pdpAddPhoto')?.addEventListener('click', () => {
      pickImage(dataUrl => { photos.push(dataUrl); rebindPhotoGrid(); });
    });
    grid?.querySelectorAll('.pdp-del-photo').forEach(btn => {
      btn.addEventListener('click', () => { photos.splice(Number(btn.dataset.idx), 1); rebindPhotoGrid(); });
    });
  }
  rebindPhotoGrid();

  overlay.querySelector('#pdpAddVideo')?.addEventListener('click', () => {
    const list = overlay.querySelector('#pdpVideoList');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
    row.innerHTML = `<input class="pdp-video-input" type="url" placeholder="Paste video link…" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;color:#fff;font-size:14px;font-family:inherit;outline:none;-webkit-appearance:none"><button class="pdp-del-video-row" style="background:none;border:none;color:rgba(255,100,100,0.7);font-size:18px;cursor:pointer">×</button>`;
    row.querySelector('.pdp-del-video-row').addEventListener('click', () => row.remove());
    list.appendChild(row);
    row.querySelector('input')?.focus();
  });

  overlay.querySelector('#pdpAddLink')?.addEventListener('click', () => {
    const list = overlay.querySelector('#pdpLinkList');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
    row.innerHTML = `<input class="pdp-link-input" type="url" placeholder="Paste link…" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;color:#fff;font-size:14px;font-family:inherit;outline:none;-webkit-appearance:none"><button class="pdp-del-link-row" style="background:none;border:none;color:rgba(255,100,100,0.7);font-size:18px;cursor:pointer">×</button>`;
    row.querySelector('.pdp-del-link-row').addEventListener('click', () => row.remove());
    list.appendChild(row);
    row.querySelector('input')?.focus();
  });

  overlay.querySelectorAll('.pdp-del-video').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('div').remove());
  });
  overlay.querySelectorAll('.pdp-del-link').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('div').remove());
  });

  function doSave() {
    const title = overlay.querySelector('#pdpTitle')?.value.trim() || '';
    const notes = overlay.querySelector('#pdpNotes')?.value.trim() || '';
    const videoLinks = [...overlay.querySelectorAll('.pdp-video-input')].map(i=>i.value.trim()).filter(Boolean);
    const links = [...overlay.querySelectorAll('.pdp-link-input')].map(i=>i.value.trim()).filter(Boolean);
    const b2 = getBrand(brandId);
    if (!b2) return;
    const posts = (b2.scheduledPosts||[]).map(p => p.id===postId ? {...p, title, notes, links, videoLinks, detailPhotos: photos} : p);
    saveBrandOverride(brandId, { scheduledPosts: posts });
    overlay.remove();
    if (onSave) onSave();
  }

  overlay.querySelector('#pdpSave')?.addEventListener('click', doSave);
  overlay.querySelector('#pdpBack')?.addEventListener('click', () => overlay.remove());
}

function openPostDetailView(postId, brandId) {
  const b = getBrand(brandId);
  if (!b) return;
  const post = (b.scheduledPosts||[]).find(p=>p.id===postId);
  if (!post) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:380;background:#0a0a0f;display:flex;flex-direction:column;overflow-y:auto';

  const fmtDate = d => {
    if (!d) return 'Not scheduled';
    try { return new Date(d).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); } catch(e) { return d; }
  };

  const idea = post.ideaId ? (b.ideas||[]).find(i=>i.id===post.ideaId) : null;

  const heroHTML = post.thumbnail
    ? `<img src="${escHtml(post.thumbnail)}" style="width:100%;max-height:320px;object-fit:cover;display:block" alt="">`
    : post.placeholderColor
      ? `<div style="background:${escHtml(post.placeholderColor)};height:200px;display:flex;align-items:flex-end;padding:16px"><div style="color:rgba(255,255,255,0.9);font-size:16px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.6)">${escHtml(post.title||'')}</div></div>`
      : `<div style="background:rgba(255,255,255,0.05);height:200px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:14px">No image yet</div>`;

  const chipStyle = 'display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);margin-right:6px';
  const chipsHTML = `
    <div style="padding:12px 16px 4px;display:flex;flex-wrap:wrap;gap:6px">
      ${post.platform ? `<span style="${chipStyle}">${escHtml(post.platform)}</span>` : ''}
      ${post.format ? `<span style="${chipStyle}">${escHtml(post.format)}</span>` : ''}
      <span style="${chipStyle}">${fmtDate(post.scheduledDate)}</span>
    </div>`;

  const titleHTML = post.title ? `
    <div style="padding:16px 16px 8px">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:6px">TITLE</div>
      <div style="font-size:16px;color:#fff;font-weight:600">${escHtml(post.title)}</div>
    </div>` : '';

  const notesHTML = post.notes ? `
    <div style="padding:16px 16px 8px">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:6px">NOTES</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.8);white-space:pre-wrap">${escHtml(post.notes)}</div>
    </div>` : '';

  let ideaHTML = '';
  if (idea) {
    const refsHTML = idea.references ? `
      <div style="margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:4px">REFERENCES</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);white-space:pre-wrap">${escHtml(idea.references)}</div>
      </div>` : (idea.notes ? `
      <div style="margin-top:8px">
        <div style="font-size:13px;color:rgba(255,255,255,0.6);white-space:pre-wrap">${escHtml(idea.notes)}</div>
      </div>` : '');
    ideaHTML = `
      <div style="padding:16px 16px 8px">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:6px">IDEA</div>
        <div style="font-size:15px;color:#fff;font-weight:600">${escHtml(idea.title||'')}</div>
        ${refsHTML}
      </div>`;
  }

  const slides = post.slides||[];
  const galleryHTML = slides.length > 1 ? `
    <div style="padding:16px 16px 8px">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:10px">GALLERY</div>
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">
        ${slides.map(sl=>`<img src="${escHtml(sl.dataUrl||'')}" style="width:60px;height:80px;border-radius:6px;object-fit:cover;flex-shrink:0" alt="">`).join('')}
      </div>
    </div>` : '';

  const detailPhotosHTML = (post.detailPhotos||[]).length ? `
  <div style="padding:16px 16px 8px">
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:10px">PHOTOS</div>
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">
      ${(post.detailPhotos||[]).map(p=>`<img src="${escHtml(p)}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;flex-shrink:0" alt="">`).join('')}
    </div>
  </div>` : '';

  const videoLinksHTML = (post.videoLinks||[]).length ? `
  <div style="padding:16px 16px 8px">
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:8px">VIDEOS</div>
    ${(post.videoLinks||[]).map(l=>`<a href="${escHtml(l)}" target="_blank" style="display:block;color:#818cf8;font-size:13px;margin-bottom:6px;word-break:break-all;text-decoration:none">${escHtml(l)}</a>`).join('')}
  </div>` : '';

  const linksHTML = (post.links||[]).length ? `
  <div style="padding:16px 16px 8px">
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:8px">LINKS</div>
    ${(post.links||[]).map(l=>`<a href="${escHtml(l)}" target="_blank" style="display:block;color:#818cf8;font-size:13px;margin-bottom:6px;word-break:break-all;text-decoration:none">${escHtml(l)}</a>`).join('')}
  </div>` : '';

  overlay.innerHTML = `
    <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
      <button id="pdvBack" type="button" style="background:none;border:none;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0 12px 0 0">‹</button>
      <div style="flex:1;text-align:center;font-size:16px;font-weight:700;color:#fff">${escHtml(post.title||'Post Details')}</div>
      <button id="pdvDots" type="button" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 0 0 12px;letter-spacing:1px;font-weight:900">···</button>
    </div>
    <div style="flex:1">
      ${heroHTML}
      ${chipsHTML}
      ${titleHTML}
      ${notesHTML}
      ${ideaHTML}
      ${galleryHTML}
      ${detailPhotosHTML}${videoLinksHTML}${linksHTML}
      <div style="padding:24px 16px;text-align:center;font-size:12px;color:rgba(255,255,255,0.25)">Tap ··· to edit</div>
    </div>`;

  document.body.appendChild(overlay);

  overlay.querySelector('#pdvBack').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#pdvDots').addEventListener('click', () => {
    openPostMenu(postId, brandId, null, () => { overlay.remove(); openPostDetailView(postId, brandId); });
  });
}

function openIdeaPicker(brandId, onPick) {
  document.getElementById('ideaPicker')?.remove();
  const b = getBrand(brandId);
  if (!b) return;

  const ideas = b.ideas || [];
  const platforms = [...new Set(ideas.map(i => i.platform).filter(Boolean))];
  let selPlat = 'all';

  function filtered() {
    return ideas.filter(i => selPlat === 'all' || i.platform === selPlat);
  }

  function listHTML() {
    const list = filtered();
    if (!list.length) return `<div style="color:rgba(255,255,255,0.25);font-size:13px;text-align:center;padding:40px 0">No ideas match</div>`;
    return list.map(i => `
      <button class="ip-idea" data-idea-id="${escHtml(i.id)}" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 14px;margin-bottom:8px;text-align:left;cursor:pointer">
        <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">
          ${i.platform ? `<span style="background:rgba(255,255,255,0.08);border-radius:20px;padding:2px 8px;font-size:10px;color:rgba(255,255,255,0.5);font-weight:600">${PLATFORM_SHORT[i.platform] || i.platform}</span>` : ''}
          ${i.format ? `<span style="background:rgba(255,255,255,0.08);border-radius:20px;padding:2px 8px;font-size:10px;color:rgba(255,255,255,0.5);font-weight:600">${escHtml(i.format)}</span>` : ''}
          ${i.campaign ? `<span style="background:rgba(255,255,255,0.05);border-radius:20px;padding:2px 8px;font-size:10px;color:rgba(255,255,255,0.3)">${escHtml(i.campaign)}</span>` : ''}
        </div>
        <div style="font-size:14px;font-weight:500;color:#fff;line-height:1.4">${escHtml(i.title)}</div>
        ${i.notes ? `<div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:4px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escHtml(i.notes)}</div>` : ''}
      </button>`).join('');
  }

  const picker = document.createElement('div');
  picker.id = 'ideaPicker';
  picker.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.55);display:flex;flex-direction:column;justify-content:flex-end';
  picker.innerHTML = `
    <div style="background:#1c1c1e;border-radius:20px 20px 0 0;max-height:80vh;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,0px)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
        <div style="font-size:16px;font-weight:700;color:#fff">Choose from Ideas</div>
        <button id="ipClose" style="background:none;border:none;color:rgba(255,255,255,0.45);font-size:24px;line-height:1;cursor:pointer;padding:0">×</button>
      </div>
      ${platforms.length > 1 ? `<div style="display:flex;gap:6px;padding:12px 20px 0;overflow-x:auto;-webkit-overflow-scrolling:touch;flex-shrink:0">
        ${['all',...platforms].map(p=>`<button class="ip-plat" data-plat="${p}" style="flex-shrink:0;padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:${selPlat===p?'rgba(255,255,255,0.12)':'transparent'};color:${selPlat===p?'#fff':'rgba(255,255,255,0.4)'};font-size:12px;font-weight:600;cursor:pointer">${p==='all'?'All':PLATFORM_SHORT[p]||p}</button>`).join('')}
      </div>` : ''}
      <div id="ipBody" style="flex:1;overflow-y:auto;padding:12px 20px;overscroll-behavior:contain"></div>
    </div>`;

  document.body.appendChild(picker);

  function rerender() {
    picker.querySelector('#ipBody').innerHTML = listHTML();
    picker.querySelectorAll('.ip-idea').forEach(btn => {
      btn.addEventListener('click', () => {
        const idea = (getBrand(brandId)?.ideas || []).find(i => i.id === btn.dataset.ideaId);
        if (!idea) return;
        picker.remove();
        onPick(idea);
      });
    });
  }
  rerender();

  picker.querySelectorAll('.ip-plat').forEach(btn => {
    btn.addEventListener('click', () => {
      selPlat = btn.dataset.plat;
      picker.querySelectorAll('.ip-plat').forEach(b => {
        b.style.background = b.dataset.plat === selPlat ? 'rgba(255,255,255,0.12)' : 'transparent';
        b.style.color = b.dataset.plat === selPlat ? '#fff' : 'rgba(255,255,255,0.4)';
      });
      rerender();
    });
  });

  picker.querySelector('#ipClose')?.addEventListener('click', () => picker.remove());
  picker.addEventListener('click', e => { if (e.target === picker) picker.remove(); });
}

/* ═══════════════════════════════════════
   SCHEDULE SHEET (global — called from calendar, vault, planner)
═══════════════════════════════════════ */
function openScheduleSheet(brandId, campId, opts, onDone) {
  opts = opts || {};
  document.getElementById('schedSheet')?.remove();
  const b = getBrand(brandId);
  if (!b) return;

  const platforms = Object.keys(b.platformStrategy || {});
  let selPlat = (opts.platform && platforms.includes(opts.platform)) ? opts.platform : (platforms[0] || 'instagram');
  function fmtsForPlat(p) { return b.platformStrategy[p]?.formats || []; }
  const initFmts = fmtsForPlat(selPlat);
  let selFmt = (opts.format && initFmts.includes(opts.format)) ? opts.format : (initFmts[0] || 'Post');
  const isUpdate = !!opts.existingPostId;
  const dateOnly = !!opts.dateOnly;
  const showFull = !isUpdate && !dateOnly;

  const overlay = document.createElement('div');
  overlay.id = 'schedSheet';
  overlay.className = 'add-post-overlay';
  overlay.innerHTML = `
    <div class="sched-sheet">
      <div class="sched-title">${isUpdate || dateOnly ? 'Set Date' : 'Schedule Post'}</div>
      ${showFull ? `<div class="notion-field"><div class="notion-label">TITLE</div><input class="notion-input" id="schedTitle" placeholder="Post title" value="${escHtml(opts.title || '')}"></div>` : ''}
      <div class="notion-field"><div class="notion-label">DATE</div><input type="date" class="notion-input notion-date" id="schedDate" value="${opts.date || ''}"></div>
      ${showFull ? `
      <div class="notion-field">
        <div class="notion-label">PLATFORM</div>
        <div class="add-post-format-row" id="schedPlatRow">
          ${platforms.map(p => `<button class="add-post-fmt-btn${p===selPlat?' active':''}" data-plat="${p}">${PLAT_DISPLAY_NAMES[p]||p}</button>`).join('')}
        </div>
      </div>
      <div class="notion-field">
        <div class="notion-label">FORMAT</div>
        <div class="add-post-format-row" id="schedFmtRow">
          ${initFmts.map(f => `<button class="add-post-fmt-btn${f===selFmt?' active':''}" data-fmt="${escHtml(f)}">${escHtml(f)}</button>`).join('')}
        </div>
      </div>` : ''}
      ${!dateOnly ? `<button class="sched-save" id="schedSave">Schedule</button>` : ''}
      <button class="add-post-cancel" id="schedCancel">Cancel</button>
      ${showFull ? `<button id="schedFromPlanner" style="width:100%;margin-top:6px;background:none;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;color:rgba(255,255,255,0.45);font-size:13px;font-weight:600;cursor:pointer;letter-spacing:0.3px">Pick from Planner ›</button>` : ''}
    </div>`;
  document.getElementById('app').appendChild(overlay);

  function rebindFmts() {
    overlay.querySelectorAll('#schedFmtRow .add-post-fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('#schedFmtRow .add-post-fmt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); selFmt = btn.dataset.fmt;
      });
    });
  }
  if (!isUpdate) {
    rebindFmts();
    overlay.querySelectorAll('#schedPlatRow .add-post-fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('#schedPlatRow .add-post-fmt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); selPlat = btn.dataset.plat;
        const fmts = fmtsForPlat(selPlat);
        selFmt = fmts[0] || 'Post';
        const fmtRow = overlay.querySelector('#schedFmtRow');
        if (fmtRow) {
          fmtRow.innerHTML = fmts.map((f,i) => `<button class="add-post-fmt-btn${i===0?' active':''}" data-fmt="${escHtml(f)}">${escHtml(f)}</button>`).join('');
          rebindFmts();
        }
      });
    });
  }

  function doSave() {
    const dateVal = document.getElementById('schedDate')?.value;
    if (!dateVal) { document.getElementById('schedDate').style.borderBottomColor = 'rgba(255,100,100,0.6)'; return; }
    const b2 = getBrand(brandId);
    if (!b2) return;
    if (isUpdate) {
      const posts = (b2.scheduledPosts || []).map(p => p.id === opts.existingPostId ? { ...p, scheduledDate: dateVal } : p);
      saveBrandOverride(brandId, { scheduledPosts: posts });
    } else {
      const title = dateOnly ? (opts.title || '') : (document.getElementById('schedTitle')?.value.trim() || '');
      const platform = dateOnly ? (opts.platform || selPlat) : selPlat;
      const format   = dateOnly ? (opts.format  || selFmt)   : selFmt;
      const newPost = { id: uid(), title, platform, format, scheduledDate: dateVal, campaignId: campId || null, thumbnail: opts.thumbnail || null };
      saveBrandOverride(brandId, { scheduledPosts: [...(b2.scheduledPosts || []), newPost] });
    }
    overlay.remove();
    if (onDone) onDone();
  }

  if (isUpdate || dateOnly) {
    document.getElementById('schedDate')?.addEventListener('change', doSave);
  }
  document.getElementById('schedSave')?.addEventListener('click', doSave);
  if (!isUpdate) {
    document.getElementById('schedFromPlanner')?.addEventListener('click', () => {
      const prefilledDate = document.getElementById('schedDate')?.value;
      overlay.remove();
      openPlannerPicker(brandId, campId, post => {
        if (prefilledDate) {
          const b2 = getBrand(brandId);
          if (!b2) return;
          const posts = (b2.scheduledPosts || []).map(p => p.id === post.id ? { ...p, scheduledDate: prefilledDate } : p);
          saveBrandOverride(brandId, { scheduledPosts: posts });
          if (onDone) onDone();
        } else {
          openScheduleSheet(brandId, campId, { existingPostId: post.id, date: post.scheduledDate || '' }, onDone);
        }
      });
    });
  }
  document.getElementById('schedCancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function openPlannerPicker(brandId, campId, onPick, onManual) {
  document.getElementById('plannerPicker')?.remove();
  const b = getBrand(brandId);
  if (!b) return;

  const allPosts = (b.scheduledPosts || []).filter(p => !campId || p.campaignId === campId);
  const platforms = [...new Set(allPosts.map(p => p.platform))];
  let selPlat = 'all';
  let selFmt  = 'all';

  function filteredPosts() {
    return allPosts.filter(p =>
      (selPlat === 'all' || p.platform === selPlat) &&
      (selFmt  === 'all' || p.format  === selFmt)
    );
  }
  function availFmts() {
    const base = selPlat === 'all' ? allPosts : allPosts.filter(p => p.platform === selPlat);
    return [...new Set(base.map(p => p.format).filter(Boolean))];
  }

  function postThumb(p) {
    const src = p.thumbnail || p.slides?.[0]?.dataUrl;
    return src
      ? `<img src="${escHtml(src)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" alt="">`
      : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.15);font-size:22px">+</div>`;
  }

  function bodyHTML() {
    const posts = filteredPosts();
    const fmts  = availFmts();
    return `
      <div style="display:flex;gap:6px;padding-bottom:10px;overflow-x:auto;-webkit-overflow-scrolling:touch">
        ${['all',...platforms].map(p=>`<button class="pp-plat" data-plat="${p}" style="flex-shrink:0;padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:${selPlat===p?'rgba(255,255,255,0.12)':'transparent'};color:${selPlat===p?'#fff':'rgba(255,255,255,0.4)'};font-size:12px;font-weight:600;cursor:pointer">${p==='all'?'All':PLAT_DISPLAY_NAMES[p]||p}</button>`).join('')}
      </div>
      ${fmts.length > 1 ? `<div style="display:flex;gap:6px;padding-bottom:12px;flex-wrap:wrap">
        ${['all',...fmts].map(f=>`<button class="pp-fmt" data-fmt="${escHtml(f)}" style="padding:4px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:${selFmt===f?'rgba(255,255,255,0.1)':'transparent'};color:${selFmt===f?'#fff':'rgba(255,255,255,0.35)'};font-size:11px;font-weight:600;cursor:pointer">${f==='all'?'All formats':escHtml(f)}</button>`).join('')}
      </div>` : ''}
      ${posts.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${posts.map(p=>`
          <button class="pp-post" data-post-id="${escHtml(p.id)}" style="position:relative;aspect-ratio:4/5;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);overflow:hidden;cursor:pointer;padding:0">
            ${postThumb(p)}
            ${p.format?`<div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.6);border-radius:4px;padding:2px 5px;font-size:8px;color:rgba(255,255,255,0.7);font-weight:600">${escHtml(p.format)}</div>`:''}
            ${p.title?`<div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:linear-gradient(transparent,rgba(0,0,0,0.75));font-size:9px;color:rgba(255,255,255,0.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left">${escHtml(p.title)}</div>`:''}
          </button>`).join('')}
      </div>` : `<div style="color:rgba(255,255,255,0.25);font-size:13px;text-align:center;padding:40px 0">No posts match this filter</div>`}`;
  }

  const sheet = document.createElement('div');
  sheet.id = 'plannerPicker';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.6);display:flex;flex-direction:column;justify-content:flex-end';
  sheet.innerHTML = `
    <div style="background:#1c1c1e;border-radius:20px 20px 0 0;max-height:82vh;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,0px)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
        <div style="font-size:16px;font-weight:700;color:#fff">Pick from Planner</div>
        <button id="ppClose" style="background:none;border:none;color:rgba(255,255,255,0.45);font-size:24px;line-height:1;cursor:pointer;padding:0">×</button>
      </div>
      <div id="ppBody" style="flex:1;overflow-y:auto;padding:14px 20px 0;overscroll-behavior:contain"></div>
      ${onManual ? `<div style="padding:10px 20px 14px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0">
        <button id="ppManual" style="width:100%;background:none;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:11px;color:rgba(255,255,255,0.38);font-size:13px;font-weight:500;cursor:pointer">+ Enter manually</button>
      </div>` : ''}
    </div>`;

  document.body.appendChild(sheet);

  function rerender() {
    sheet.querySelector('#ppBody').innerHTML = bodyHTML();
    sheet.querySelectorAll('.pp-plat').forEach(btn => {
      btn.addEventListener('click', () => { selPlat = btn.dataset.plat; selFmt = 'all'; rerender(); });
    });
    sheet.querySelectorAll('.pp-fmt').forEach(btn => {
      btn.addEventListener('click', () => { selFmt = btn.dataset.fmt; rerender(); });
    });
    sheet.querySelectorAll('.pp-post').forEach(btn => {
      btn.addEventListener('click', () => {
        const post = (getBrand(brandId)?.scheduledPosts || []).find(p => p.id === btn.dataset.postId);
        if (!post) return;
        sheet.remove();
        onPick(post);
      });
    });
  }
  rerender();

  sheet.querySelector('#ppClose')?.addEventListener('click', () => sheet.remove());
  sheet.querySelector('#ppManual')?.addEventListener('click', () => { sheet.remove(); if (onManual) onManual(); });
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
}

/* ═══════════════════════════════════════
   PAGE: CALENDAR
═══════════════════════════════════════ */
function pageCalendar(brandId, campId) {
  const brand = getBrand(brandId);
  if (!brand) return pageHome();
  const campaign = campId?(brand.campaigns||[]).find(c=>c.id===campId):null;
  const backHref = '#/';
  const today = new Date();

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="${backHref}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">CALENDAR</div>
          <div class="back-header-title">${escHtml(campaign?campaign.name:brand.name)}</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div class="cal-view-switcher">
        <button class="cal-view-btn active" data-view="list">List</button>
        <button class="cal-view-btn" data-view="week">Week</button>
        <button class="cal-view-btn" data-view="month">Month</button>
      </div>
      <div id="calStatusFilter" class="cal-sf-wrap" style="display:flex">
        <button class="cal-sf-btn active" data-sf="all">All</button>
        <button class="cal-sf-btn" data-sf="Production">Production</button>
        <button class="cal-sf-btn" data-sf="Scheduled">Scheduled</button>
        <button class="cal-sf-btn" data-sf="Posted">Posted</button>
      </div>
      <div id="calBody" class="cal-body">
        ${calListHTML(brand, campId, 'all')}
      </div>
    </div>`;
}

function calMonthHTML(brand, campId, year, month) {
  const posts = (brand.scheduledPosts||[]).filter(p=>p.scheduledDate&&(!campId||!p.campaignId||p.campaignId===campId));
  const firstDay = new Date(year,month,1);
  const lastDay  = new Date(year,month+1,0);
  const startDow = (firstDay.getDay()+6)%7;
  const today = new Date(); today.setHours(0,0,0,0);
  const monthLabel = firstDay.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const dayHdrs = ['M','T','W','T','F','S','S'].map(d=>`<div class="cal-grid-hdr">${d}</div>`).join('');

  let cells = '';
  for(let i=0;i<startDow;i++){
    const d=new Date(year,month,1-startDow+i);
    cells+=`<div class="cal-day-cell other-month"><div class="cal-day-num">${d.getDate()}</div></div>`;
  }
  for(let d=1;d<=lastDay.getDate();d++){
    const iso=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dp=posts.filter(p=>p.scheduledDate===iso);
    const isToday=new Date(year,month,d).getTime()===today.getTime();
    const dots=dp.slice(0,4).map(p=>`<div class="cal-post-dot" style="background:${PLAT_DOT_COLORS[p.platform]||'#888'}"></div>`).join('');
    cells+=`<div class="cal-day-cell${isToday?' today':''}${dp.length?' has-post':''}" data-date="${iso}"><div class="cal-day-num">${d}</div><div class="cal-day-dots">${dots}</div></div>`;
  }
  const total=startDow+lastDay.getDate();
  for(let i=1;i<=(7-(total%7))%7;i++) cells+=`<div class="cal-day-cell other-month"><div class="cal-day-num">${i}</div></div>`;

  return `
    <div class="cal-month-nav">
      <button class="cal-nav-btn" id="calPrev">‹</button>
      <div class="cal-month-label">${escHtml(monthLabel)}</div>
      <button class="cal-nav-btn" id="calNext">›</button>
    </div>
    <div class="cal-grid">${dayHdrs}${cells}</div>
    <button class="cal-add-btn" id="calAddPost">+ Schedule Post</button>`;
}

function calWeekHTML(brand, campId, weekStart) {
  const posts = (brand.scheduledPosts||[]).filter(p=>p.scheduledDate&&(!campId||!p.campaignId||p.campaignId===campId));
  const today = new Date(); today.setHours(0,0,0,0);
  const days=[];
  for(let i=0;i<7;i++){const d=new Date(weekStart);d.setDate(d.getDate()+i);days.push(d);}
  const label=`${days[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${days[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  const cols=days.map(d=>{
    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dp=posts.filter(p=>p.scheduledDate===iso);
    const isTd=d.getTime()===today.getTime();
    return `<div>
      <div class="cal-week-day-hdr">${d.toLocaleDateString('en-US',{weekday:'narrow'})}</div>
      <div class="cal-week-day-num${isTd?' today':''}">${d.getDate()}</div>
      ${dp.map(p=>`<div class="cal-week-post-card" style="border-left:2px solid ${PLAT_DOT_COLORS[p.platform]||'#888'}">${escHtml(p.title||p.format)}</div>`).join('')}
      ${!dp.length?'<div class="cal-week-empty"></div>':''}
    </div>`;
  }).join('');
  return `
    <div class="cal-month-nav">
      <button class="cal-nav-btn" id="calPrev">‹</button>
      <div class="cal-month-label" style="font-size:13px">${escHtml(label)}</div>
      <button class="cal-nav-btn" id="calNext">›</button>
    </div>
    <div class="cal-week-cols">${cols}</div>
    <button class="cal-add-btn" id="calAddPost">+ Schedule Post</button>`;
}

function calListHTML(brand, campId, statusFilter) {
  const posts = (brand.scheduledPosts||[])
    .filter(p=>{
      if(!p.scheduledDate) return false;
      if(campId&&p.campaignId&&p.campaignId!==campId) return false;
      if(statusFilter&&statusFilter!=='all'&&(p.postStatus||'Production')!==statusFilter) return false;
      return true;
    })
    .sort((a,b)=>a.scheduledDate.localeCompare(b.scheduledDate));

  const addBtn = `<button class="cal-add-btn" id="calAddPost">+ Schedule Post</button>`;
  if (!posts.length) return `<div class="cal-empty-msg">No scheduled posts yet</div>${addBtn}`;

  function statusPills(p) {
    const cur = p.postStatus || 'Production';
    return ['Production','Scheduled','Posted'].map(s => {
      const on = cur === s;
      let col;
      if (s === 'Production') col = on ? 'background:rgba(251,146,60,0.2);border-color:rgba(251,146,60,0.5);color:#fb923c' : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)';
      else if (s === 'Scheduled') col = on ? 'background:rgba(124,58,173,0.25);border-color:rgba(180,120,255,0.4);color:#c8a0ff' : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)';
      else col = on ? 'background:rgba(34,197,94,0.18);border-color:rgba(34,197,94,0.45);color:#4ade80' : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)';
      return `<button class="cal-status-pill" data-post-id="${escHtml(p.id)}" data-status="${s}" style="${col};border-style:solid;border-width:1px;border-radius:100px;padding:4px 11px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">${s}</button>`;
    }).join('');
  }

  const byDate={};
  posts.forEach(p=>{ if(!byDate[p.scheduledDate])byDate[p.scheduledDate]=[]; byDate[p.scheduledDate].push(p); });
  const rows=Object.entries(byDate).map(([date,ps])=>{
    const [y,m,d]=date.split('-').map(Number);
    const lbl=new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
    return `
      <div class="cal-list-date-hdr">${escHtml(lbl)}</div>
      ${ps.map(p=>`<div class="cal-list-item" data-post-id="${escHtml(p.id)}" style="cursor:pointer"><div class="cal-list-platform-dot" style="background:${PLAT_DOT_COLORS[p.platform]||'#888'}"></div><div style="flex:1"><div class="cal-list-title">${escHtml(p.title||'Untitled')}</div><div class="cal-list-fmt">${escHtml(p.format)}</div><div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${statusPills(p)}</div></div>${p.notes?`<div style="font-size:16px;opacity:0.45;flex-shrink:0;align-self:flex-start;margin-top:2px">📝</div>`:''}</div>`).join('')}`;
  }).join('');
  return `${rows}${addBtn}`;
}

function openCalPostModal(brandId, postId, onClose) {
  document.getElementById('calPostModal')?.remove();
  const b = getBrand(brandId);
  const p = (b.scheduledPosts||[]).find(x=>x.id===postId);
  if (!p) return;
  const platName = PLAT_DISPLAY_NAMES[p.platform] || p.platform || '';
  const dateStr = p.scheduledDate
    ? new Date(p.scheduledDate + 'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})
    : 'Unscheduled';
  const modal = document.createElement('div');
  modal.id = 'calPostModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:400;display:flex;align-items:flex-end;background:rgba(0,0,0,0.6)';
  modal.innerHTML = `
    <div style="background:#1c1c1e;border-radius:20px 20px 0 0;padding:24px;padding-bottom:calc(32px + env(safe-area-inset-bottom,0px));width:100%;box-sizing:border-box;max-height:85vh;overflow-y:auto;overscroll-behavior:contain">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:rgba(255,255,255,0.35);margin-bottom:5px">${escHtml(platName.toUpperCase())} · ${escHtml(p.format||'')}</div>
          <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:4px">${escHtml(p.title||'Untitled')}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.35)">${escHtml(dateStr)}</div>
        </div>
        <button id="calPostClose" type="button" style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;width:30px;height:30px;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:12px">×</button>
      </div>
      ${p.thumbnail?`<img src="${escHtml(p.thumbnail)}" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;margin-bottom:20px" alt="">` : ''}
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:8px">NOTES</div>
      <textarea id="calPostNotes" placeholder="Add notes…" rows="4" style="width:100%;background:#2c2c2e;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px;color:#fff;font-size:14px;box-sizing:border-box;resize:none;font-family:inherit;line-height:1.5">${escHtml(p.notes||'')}</textarea>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button id="calPostCancel" type="button" style="flex:1;background:rgba(255,255,255,0.08);border:none;border-radius:12px;padding:14px;color:rgba(255,255,255,0.55);font-size:14px;cursor:pointer">Cancel</button>
        <button id="calPostSave" type="button" style="flex:2;background:rgba(180,120,255,0.22);border:1px solid rgba(180,120,255,0.35);border-radius:12px;padding:14px;color:#d4aaff;font-size:14px;font-weight:700;cursor:pointer">Save Notes</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close = () => { modal.remove(); requestAnimationFrame(() => onClose?.()); };
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#calPostClose')?.addEventListener('click', close);
  modal.querySelector('#calPostCancel')?.addEventListener('click', () => modal.remove());
  modal.querySelector('#calPostSave')?.addEventListener('click', () => {
    const notes = modal.querySelector('#calPostNotes').value.trim();
    const b2 = getBrand(brandId);
    saveBrandOverride(brandId, { scheduledPosts: (b2.scheduledPosts||[]).map(x=>x.id===postId?{...x,notes}:x) });
    close();
  });
}

function bindCalendar(brandId, campId) {
  const brand = getBrand(brandId);
  if (!brand) return;
  let view='list';
  let statusFilter='all';
  const now=new Date();
  let year=now.getFullYear(), month=now.getMonth();
  const dow=now.getDay();
  let weekStart=new Date(now); weekStart.setDate(now.getDate()-((dow+6)%7)); weekStart.setHours(0,0,0,0);
  const body=document.getElementById('calBody');
  const sfWrap=document.getElementById('calStatusFilter');

  function rerender() {
    const b=getBrand(brandId);
    if(!b||!body) return;
    if(view==='month') body.innerHTML=calMonthHTML(b,campId,year,month);
    else if(view==='week') body.innerHTML=calWeekHTML(b,campId,weekStart);
    else body.innerHTML=calListHTML(b,campId,statusFilter);
    bindBodyClicks();
  }

  // Status filter pill bindings (static — these don't re-render)
  sfWrap?.querySelectorAll('.cal-sf-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      statusFilter=btn.dataset.sf;
      sfWrap.querySelectorAll('.cal-sf-btn').forEach(b=>b.classList.toggle('active',b.dataset.sf===statusFilter));
      rerender();
    });
  });

  function bindBodyClicks() {
    document.getElementById('calPrev')?.addEventListener('click',()=>{
      if(view==='month'){month--;if(month<0){month=11;year--;}}
      else if(view==='week'){weekStart=new Date(weekStart);weekStart.setDate(weekStart.getDate()-7);}
      rerender();
    });
    document.getElementById('calNext')?.addEventListener('click',()=>{
      if(view==='month'){month++;if(month>11){month=0;year++;}}
      else if(view==='week'){weekStart=new Date(weekStart);weekStart.setDate(weekStart.getDate()+7);}
      rerender();
    });
    document.getElementById('calAddPost')?.addEventListener('click',()=>showSchedSheet(null));
    body?.querySelectorAll('.cal-status-pill').forEach(btn=>{
      btn.addEventListener('click',e=>{
        e.stopPropagation();
        const b=getBrand(brandId);
        if(!b) return;
        const posts=(b.scheduledPosts||[]).map(p=>p.id===btn.dataset.postId?{...p,postStatus:btn.dataset.status}:p);
        saveBrandOverride(brandId,{scheduledPosts:posts});
        rerender();
      });
    });
    body?.querySelectorAll('.cal-list-item[data-post-id]').forEach(item=>{
      item.addEventListener('click',e=>{
        if(e.target.closest('.cal-status-pill')) return;
        openCalPostModal(brandId, item.dataset.postId, rerender);
      });
    });
    body?.addEventListener('click',e=>{
      const cell=e.target.closest('.cal-day-cell[data-date]');
      if(cell&&!e.target.closest('#calAddPost')) showSchedSheet(cell.dataset.date);
    });
  }

  document.querySelectorAll('.cal-view-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      view=btn.dataset.view;
      document.querySelectorAll('.cal-view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
      if(sfWrap) sfWrap.style.display=view==='list'?'flex':'none';
      rerender();
    });
  });

  function showSchedSheet(date) {
    openPlannerPicker(
      brandId, campId,
      post => {
        if (date) {
          const b2 = getBrand(brandId);
          if (!b2) return;
          const posts = (b2.scheduledPosts || []).map(p => p.id === post.id ? { ...p, scheduledDate: date } : p);
          saveBrandOverride(brandId, { scheduledPosts: posts });
          rerender();
        } else {
          openScheduleSheet(brandId, campId, { existingPostId: post.id, date: post.scheduledDate || '' }, rerender);
        }
      },
      () => openScheduleSheet(brandId, campId, { date: date || '' }, rerender)
    );
  }

  bindBodyClicks();
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
  wrap.className = 'campaign-dock';
  wrap.innerHTML = `
    <nav class="bottom-nav campaign-nav">
      <button class="nav-btn${activeTab === 'doc'    ? ' nav-active' : ''}" id="campNavDoc">${docSVG}</button>
      <button class="nav-btn${activeTab === 'ideas'  ? ' nav-active' : ''}" id="campNavIdeas">${ideaSVG}</button>
      <button class="nav-btn nav-btn-center" id="campNavAisha">${aishaSVG}</button>
      <button class="nav-btn${activeTab === 'visual' ? ' nav-active' : ''}" id="campNavVisual">${visualSVG}</button>
      <button class="nav-btn${activeTab === 'cal'    ? ' nav-active' : ''}" id="campNavCal">${calSVG}</button>
    </nav>`;
  document.getElementById('app').appendChild(wrap);

  const docHref    = campId ? `#/campaign?brandId=${brandId}&id=${campId}` : '#/';
  const ideasHref  = campId ? `#/vault?id=${brandId}&campId=${campId}` : `#/vault?id=${brandId}`;
  const visualHref = campId ? `#/planner?brandId=${brandId}&campId=${campId}` : `#/planner?brandId=${brandId}`;
  const calHref    = campId ? `#/calendar?brandId=${brandId}&campId=${campId}` : `#/calendar?brandId=${brandId}`;

  document.getElementById('campNavDoc')?.addEventListener('click',    () => navigate(docHref));
  document.getElementById('campNavIdeas')?.addEventListener('click',  () => navigate(ideasHref));
  document.getElementById('campNavVisual')?.addEventListener('click', () => navigate(visualHref));
  document.getElementById('campNavCal')?.addEventListener('click',    () => navigate(calHref));
  document.getElementById('campNavAisha')?.addEventListener('click',  () => {
    openAishaSelector(brandId, campId);
  });
}

/* ── Grandure Brand app bottom nav ── */
function injectBrandAppNav(brandId, activeTab) {
  document.getElementById('brandAppNav')?.remove();

  const universeSVG   = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7l1.8 4.2L18 13l-4.2 1.8L12 19l-1.8-4.2L6 13l4.2-1.8z"/></svg>`;
  const charactersSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.3"/><path d="M14.5 13.2c.7-.3 1.6-.5 2.5-.5 3.3 0 6 2.7 6 6"/></svg>`;
  const homeSVG       = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>`;
  const assetsSVG      = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 14l-5-5-4 4-3-3-4 4"/></svg>`;
  const bibleSVG       = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`;

  const wrap = document.createElement('div');
  wrap.id = 'brandAppNav';
  wrap.className = 'campaign-dock';
  wrap.innerHTML = `
    <nav class="bottom-nav campaign-nav">
      <button class="nav-btn${activeTab === 'universe'   ? ' nav-active' : ''}" id="gbNavUniverse">${universeSVG}</button>
      <button class="nav-btn${activeTab === 'characters' ? ' nav-active' : ''}" id="gbNavCharacters">${charactersSVG}</button>
      <button class="nav-btn nav-btn-center" id="gbNavHome">${homeSVG}</button>
      <button class="nav-btn${activeTab === 'assets'      ? ' nav-active' : ''}" id="gbNavAssets">${assetsSVG}</button>
      <button class="nav-btn${activeTab === 'bible'       ? ' nav-active' : ''}" id="gbNavBible">${bibleSVG}</button>
    </nav>`;
  document.getElementById('app').appendChild(wrap);

  document.getElementById('gbNavUniverse')?.addEventListener('click',   () => navigate('/gb-universe?id=' + brandId));
  document.getElementById('gbNavCharacters')?.addEventListener('click', () => navigate('/gb-characters?id=' + brandId));
  document.getElementById('gbNavHome')?.addEventListener('click',       () => navigate('/gb-home?id=' + brandId));
  document.getElementById('gbNavAssets')?.addEventListener('click',     () => navigate('/gb-assets?id=' + brandId));
  document.getElementById('gbNavBible')?.addEventListener('click',      () => navigate('/gb-bible?id=' + brandId));
}

/* ── Grandure Brand: Picker ── */
function pageGrandureBrandPicker() {
  const cards = BRANDS.map(brand => {
    const { pct } = universeCompletion(brand);
    return `
      <div class="brand-card" data-href="#/gb-home?id=${brand.id}" style="padding:18px 18px 16px;cursor:pointer">
        <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:3px">${escHtml(brand.name)}</div>
        <div style="font-size:12px;color:#888;margin-bottom:14px">${escHtml(brand.tagline || '')}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:10px;letter-spacing:1.5px;color:#666">UNIVERSE</span>
          <span style="font-size:12px;font-weight:700;color:#d4aaff">${pct}% complete</span>
        </div>
        <div style="height:5px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aad,#d4aaff);border-radius:3px"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page" style="padding-bottom:40px">
      <div class="back-header">
        <button class="back-btn" data-href="#/hub">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">GRANDURE BRAND</div>
          <div class="back-header-title">Select a Universe</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div style="padding:4px 16px 16px">${cards}</div>
    </div>
  `;
}

/* ── Grandure Brand: Home (mockup screen) ── */
function pageGrandureBrandHome(brandId) {
  const brand = getBrand(brandId);
  if (!brand) return `<div class="page"><div class="back-header"><button class="back-btn" data-href="#/grandure-brand">‹</button></div></div>`;

  const { pct, states, nextIdx } = universeCompletion(brand);

  const ctaLabel = pct === 0 ? 'Begin World Building' : pct === 100 ? 'Revisit Your Universe' : 'Continue World Building';

  const dotsHTML = UNIVERSE_CHAPTERS.map((c, i) => {
    const isDone = states[i];
    const isNext = i === nextIdx && !isDone;
    let dotCls = 'gb-dot';
    if (isDone) dotCls += ' gb-dot-done';
    else if (isNext) dotCls += ' gb-dot-next';
    else dotCls += ' gb-dot-upcoming';
    return `
      <div class="gb-dot-col">
        <div class="${dotCls}"></div>
        <div class="gb-dot-label">${escHtml(c.label)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="#/grandure-brand">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">GRANDURE BRAND</div>
          <div class="back-header-title">BRAND UNIVERSE WIZARD</div>
        </div>
        <div style="width:36px"></div>
      </div>

      <div class="gb-hero">
        <div class="gb-avatar-ring">
          <img src="img/aisha.jpeg" class="gb-avatar-img" alt="AI'SHA">
          <svg class="gb-sparkle gb-sparkle-1" width="16" height="16" viewBox="0 0 24 24" fill="#d4aaff"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>
          <svg class="gb-sparkle gb-sparkle-2" width="11" height="11" viewBox="0 0 24 24" fill="#c8a0ff"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>
        </div>
        <div class="gb-aisha-name">AI'SHA</div>
        <div class="gb-aisha-sub">CREATIVE DIRECTOR AI</div>
      </div>

      <div class="gb-progress-block">
        <div class="gb-progress-label">BRAND UNIVERSE</div>
        <div class="gb-progress-pct">${pct}%</div>
        <div class="gb-progress-complete">COMPLETE</div>
      </div>

      <div class="gb-constellation">
        <div class="gb-constellation-line"></div>
        <div class="gb-constellation-row">${dotsHTML}</div>
      </div>

      <div style="padding:8px 20px 0">
        <button class="gb-cta-btn" data-href="#/gb-universe?id=${brand.id}">
          <span class="gb-cta-top">
            <span class="gb-cta-label">${ctaLabel}</span>
            <span class="gb-cta-chevron">›</span>
          </span>
          <span class="gb-cta-sub">AI'SHA will guide you step by step</span>
        </button>
      </div>
    </div>
  `;
}

/* ── Grandure Brand: Universe Wizard ── */
function pageUniverseWizard(brandId, chapterIdx) {
  const brand = getBrand(brandId);
  if (!brand) return `<div class="page"><div class="back-header"><button class="back-btn" data-href="#/grandure-brand">‹</button></div></div>`;

  let idx = parseInt(chapterIdx, 10);
  if (isNaN(idx) || idx < 0 || idx >= UNIVERSE_CHAPTERS.length) {
    idx = universeCompletion(brand).nextIdx;
  }

  const { states } = universeCompletion(brand);
  const chapter = UNIVERSE_CHAPTERS[idx];

  const dotsHTML = UNIVERSE_CHAPTERS.map((c, i) => {
    const isDone = states[i];
    const isCurrent = i === idx;
    let dotCls = 'gb-dot';
    if (isDone) dotCls += ' gb-dot-done';
    else if (isCurrent) dotCls += ' gb-dot-next';
    else dotCls += ' gb-dot-upcoming';
    // A done chapter that's also the one being viewed still gets the glow treatment.
    const glowStyle = isCurrent && isDone ? ' style="box-shadow:0 0 0 4px rgba(124,58,173,0.4), 0 0 16px rgba(180,120,255,0.9)"' : '';
    return `
      <button type="button" class="gb-dot-col uw-dot-col" data-href="#/gb-universe?id=${brandId}&chapter=${i}">
        <div class="${dotCls}"${glowStyle}></div>
        <div class="gb-dot-label">${escHtml(c.label)}</div>
      </button>
    `;
  }).join('');

  return `
    <div class="page" style="padding-bottom:130px">
      <div class="back-header">
        <button class="back-btn" data-href="#/gb-home?id=${brandId}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">CHAPTER ${idx + 1} OF 7</div>
          <div class="back-header-title">${escHtml(chapter.label)}</div>
        </div>
        <div style="width:36px"></div>
      </div>

      <div class="uw-constellation-strip">
        <div class="gb-constellation" style="margin-bottom:0">
          <div class="gb-constellation-line"></div>
          <div class="gb-constellation-row">${dotsHTML}</div>
        </div>
      </div>

      <div id="uwChat" class="aisha-chat"></div>
      <div id="uwBody"></div>
      <div id="uwOptsWrap" class="aisha-opts-wrap" style="display:none">
        <div id="uwOptsGrid" class="aisha-opts-grid"></div>
        <button id="uwOptsDone" class="aisha-opts-done" style="display:none">Done ›</button>
      </div>
      <div id="uwInputRow" class="aisha-input-row" style="display:none">
        <input id="uwInput" class="aisha-input" type="text" placeholder="Type your answer…" style="font-size:16px">
        <button id="uwSendBtn" class="aisha-send" type="button">${UW_SEND_SVG}</button>
      </div>
    </div>
  `;
}

const UW_SEND_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

/* ── Universe Wizard: interaction state ── */
let _uwMessages = [];      // { role: 'aisha'|'user', text }
let _uwKey = '';           // `${brandId}:${chapterIdx}` — resets state on chapter/brand change
let _uwFieldPos = 0;       // index into the unanswered-fields queue for q&a chapters
let _uwSelectedChips = [];

function uwGoToChapter(brandId, nextIdx) {
  navigate(`/gb-universe?id=${brandId}&chapter=${nextIdx}`);
}

function uwContinueCTA(brandId, chapterIdx) {
  if (chapterIdx < UNIVERSE_CHAPTERS.length - 1) {
    const nextChapter = UNIVERSE_CHAPTERS[chapterIdx + 1];
    return `<button id="uwContinueBtn" class="gb-cta-btn" type="button" style="width:100%">
      <span class="gb-cta-top">
        <span class="gb-cta-label">Continue to ${escHtml(nextChapter.label)}</span>
        <span class="gb-cta-chevron">›</span>
      </span>
    </button>`;
  }
  return `<button id="uwContinueBtn" class="gb-cta-btn" type="button" style="width:100%">
    <span class="gb-cta-top">
      <span class="gb-cta-label">Return to Your Universe</span>
      <span class="gb-cta-chevron">›</span>
    </span>
  </button>`;
}

function uwBindContinue(brandId, chapterIdx) {
  document.getElementById('uwContinueBtn')?.addEventListener('click', () => {
    if (chapterIdx < UNIVERSE_CHAPTERS.length - 1) {
      uwGoToChapter(brandId, chapterIdx + 1);
    } else {
      navigate('/gb-home?id=' + brandId);
    }
  });
}

function bindUniverseWizard(brandId, chapterIdx) {
  const brand = getBrand(brandId);
  if (!brand) return;

  let idx = parseInt(chapterIdx, 10);
  if (isNaN(idx) || idx < 0 || idx >= UNIVERSE_CHAPTERS.length) {
    idx = universeCompletion(brand).nextIdx;
  }
  const chapterId = UNIVERSE_CHAPTERS[idx].id;
  const key = `${brandId}:${idx}`;

  if (_uwKey !== key) {
    _uwKey = key;
    _uwMessages = [];
    _uwFieldPos = 0;
    _uwSelectedChips = [];
  }

  const chat = document.getElementById('uwChat');
  const body = document.getElementById('uwBody');
  const optsWrap = document.getElementById('uwOptsWrap');
  const optsGrid = document.getElementById('uwOptsGrid');
  const optsDone = document.getElementById('uwOptsDone');
  const inputRow = document.getElementById('uwInputRow');
  if (!chat || !body) return;

  // Reassigned per-chapter-mode below; showTextInput()/showChips() call through these.
  let onTextSubmit = () => {};
  let onChipSubmit = () => {};

  function renderChat() {
    chat.innerHTML = _uwMessages.map(m =>
      `<div class="aisha-msg ${m.role === 'aisha' ? 'from-aisha' : 'from-user'}">${escHtml(m.text).replace(/\n/g, '<br>')}</div>`
    ).join('');
    chat.scrollTop = chat.scrollHeight;
  }

  function hideOpts() {
    if (optsWrap) optsWrap.style.display = 'none';
    _uwSelectedChips = [];
  }

  function hideInputRow() {
    if (inputRow) inputRow.style.display = 'none';
  }

  function showTextInput(placeholder, isTextarea) {
    hideOpts();
    if (!inputRow) return;
    inputRow.style.display = 'flex';
    inputRow.innerHTML = isTextarea
      ? `<textarea id="uwInput" class="uw-textarea" placeholder="${escHtml(placeholder || 'Type your answer…')}" rows="1"></textarea><button id="uwSendBtn" class="aisha-send" type="button">${UW_SEND_SVG}</button>`
      : `<input id="uwInput" class="aisha-input" type="text" placeholder="${escHtml(placeholder || 'Type your answer…')}" style="font-size:16px"><button id="uwSendBtn" class="aisha-send" type="button">${UW_SEND_SVG}</button>`;
    const liveInput = document.getElementById('uwInput');
    const liveSend = document.getElementById('uwSendBtn');
    const submit = () => {
      const text = (liveInput.value || '').trim();
      if (!text) return;
      liveInput.value = '';
      onTextSubmit(text);
    };
    liveSend?.addEventListener('click', submit);
    liveInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !isTextarea) { e.preventDefault(); submit(); }
    });
    setTimeout(() => liveInput?.focus(), 50);
  }

  function showChips(options, multi) {
    hideInputRow();
    if (!optsWrap || !optsGrid || !optsDone) return;
    _uwSelectedChips = [];
    optsGrid.innerHTML = options.map(opt => `<button type="button" class="aisha-opt" data-opt="${escHtml(opt)}">${escHtml(opt)}</button>`).join('');
    optsDone.style.display = multi ? 'block' : 'none';
    optsWrap.style.display = 'block';
    optsGrid.querySelectorAll('.aisha-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (multi) {
          btn.classList.toggle('selected');
          const val = btn.dataset.opt;
          _uwSelectedChips = _uwSelectedChips.includes(val)
            ? _uwSelectedChips.filter(o => o !== val)
            : [..._uwSelectedChips, val];
        } else {
          onChipSubmit(btn.dataset.opt);
        }
      });
    });
    optsDone.onclick = () => {
      if (_uwSelectedChips.length) onChipSubmit(_uwSelectedChips.join(', '));
    };
  }

  function hideAllInputUI() {
    hideOpts();
    hideInputRow();
  }

  /* ── Q&A driven chapters: world / belief / citizens / invitations ── */
  function saveField(field, value) {
    const b = getBrand(brandId);
    const u = b.brandUniverse || {};
    saveBrandOverride(brandId, {
      brandUniverse: { ...u, [chapterId]: { ...(u[chapterId] || {}), [field.key]: value } },
    });
  }

  function renderQAComplete() {
    hideAllInputUI();
    body.innerHTML = `<div class="uw-continue-wrap">${uwContinueCTA(brandId, idx)}</div>`;
    uwBindContinue(brandId, idx);
  }

  function askField(field) {
    hideAllInputUI();
    body.innerHTML = '';
    onChipSubmit = handleFieldAnswer;
    onTextSubmit = handleFieldAnswer;
    _uwMessages.push({ role: 'aisha', text: field.q });
    renderChat();
    if (field.type === 'chips') {
      showChips(field.options, false);
    } else {
      showTextInput('Type your answer…', field.type === 'textarea');
    }
  }

  function handleFieldAnswer(value) {
    const fields = UNIVERSE_CHAPTER_FIELDS[chapterId];
    const field = fields[_uwFieldPos];
    if (!field) return;
    hideAllInputUI();
    _uwMessages.push({ role: 'user', text: value });
    renderChat();
    saveField(field, value);
    // refresh local brand reference's chapter object so subsequent reads see the save
    advanceQA();
  }

  function advanceQA() {
    const fields = UNIVERSE_CHAPTER_FIELDS[chapterId];
    _uwFieldPos++;
    if (_uwFieldPos < fields.length) {
      askField(fields[_uwFieldPos]);
    } else {
      _uwMessages.push({ role: 'aisha', text: "This chapter is complete." });
      renderChat();
      renderQAComplete();
    }
  }

  function initQAChapter() {
    const fields = UNIVERSE_CHAPTER_FIELDS[chapterId];
    const b = getBrand(brandId);
    const saved = (b.brandUniverse && b.brandUniverse[chapterId]) || {};

    _uwMessages = [];
    let firstUnanswered = -1;
    fields.forEach((f, i) => {
      const val = saved[f.key];
      if (val) {
        _uwMessages.push({ role: 'aisha', text: f.q });
        _uwMessages.push({ role: 'user', text: val });
      } else if (firstUnanswered === -1) {
        firstUnanswered = i;
      }
    });

    renderChat();

    if (firstUnanswered === -1) {
      _uwFieldPos = fields.length;
      _uwMessages.push({ role: 'aisha', text: "This chapter is complete." });
      renderChat();
      renderQAComplete();
    } else {
      _uwFieldPos = firstUnanswered;
      askField(fields[firstUnanswered]);
    }
  }

  /* ── Characters chapter: link-out ── */
  function initCharactersChapter() {
    hideAllInputUI();
    const b = getBrand(brandId);
    const count = (b.characters || []).length;
    _uwMessages = [
      { role: 'aisha', text: "Characters are managed in their own space — that's where you'll create and develop the cast of your universe." },
      { role: 'aisha', text: `You have ${count} character${count === 1 ? '' : 's'} so far.` },
    ];
    renderChat();
    body.innerHTML = `
      <div class="uw-continue-wrap">
        <button id="uwOpenCharactersBtn" class="gb-cta-btn" type="button" style="width:100%;margin-bottom:10px">
          <span class="gb-cta-top">
            <span class="gb-cta-label">Open Characters</span>
            <span class="gb-cta-chevron">›</span>
          </span>
        </button>
      </div>
    `;
    document.getElementById('uwOpenCharactersBtn')?.addEventListener('click', () => {
      navigate('/gb-characters?id=' + brandId);
    });
  }

  /* ── Symbols chapter ── */
  function renderSymbolsBody() {
    const b = getBrand(brandId);
    const symbols = (b.brandUniverse && b.brandUniverse.symbols) || [];
    const chipsHTML = symbols.map(s => `
      <span class="uw-symbol-chip" data-id="${escHtml(s.id)}">
        ${escHtml(s.name)}
        <button type="button" class="uw-symbol-remove" data-remove="${escHtml(s.id)}">×</button>
      </span>
    `).join('');
    const continueHTML = symbols.length >= 1 ? uwContinueCTA(brandId, idx) : '';
    body.innerHTML = `
      <div class="uw-section" style="padding-top:0">
        ${chipsHTML ? `<div class="uw-swatch-row" style="margin-bottom:16px">${chipsHTML}</div>` : ''}
        ${continueHTML ? `<div class="uw-continue-wrap" style="padding:0 0 4px">${continueHTML}</div>` : ''}
      </div>
    `;
    body.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bb = getBrand(brandId);
        const u = bb.brandUniverse || {};
        const next = (u.symbols || []).filter(s => s.id !== btn.dataset.remove);
        saveBrandOverride(brandId, { brandUniverse: { ...u, symbols: next } });
        renderSymbolsBody();
      });
    });
    uwBindContinue(brandId, idx);
  }

  function initSymbolsChapter() {
    _uwMessages = [
      { role: 'aisha', text: "What symbols represent your universe? Objects, icons, or motifs that carry meaning." },
    ];
    renderChat();
    onTextSubmit = onSymbolSubmit;
    showTextInput('Add a symbol…', false);
    renderSymbolsBody();
  }

  function onSymbolSubmit(value) {
    const b = getBrand(brandId);
    const u = b.brandUniverse || {};
    const next = [...(u.symbols || []), { id: uid(), name: value }];
    saveBrandOverride(brandId, { brandUniverse: { ...u, symbols: next } });
    renderSymbolsBody();
    onTextSubmit = onSymbolSubmit;
    showTextInput('Add a symbol…', false);
  }

  /* ── Aesthetic chapter ── */
  function renderAestheticBody() {
    hideAllInputUI();
    const b = getBrand(brandId);
    const aesthetic = (b.brandUniverse && b.brandUniverse.aesthetic) || { palette: [], typography: '', moodWords: [], moodboard: [] };
    const palette = aesthetic.palette || [];
    const moodWords = aesthetic.moodWords || [];
    const moodboard = aesthetic.moodboard || [];

    const presetSwatches = AESTHETIC_PRESET_COLORS.map(hex => {
      const selected = palette.includes(hex);
      return `<button type="button" class="uw-swatch${selected ? ' selected' : ''}" data-hex="${escHtml(hex)}" style="background:${escHtml(hex)}" title="${escHtml(hex)}"></button>`;
    }).join('');

    const moodChips = AESTHETIC_MOOD_WORDS.map(word => {
      const selected = moodWords.includes(word);
      return `<button type="button" class="aisha-opt${selected ? ' selected' : ''}" data-mood="${escHtml(word)}">${escHtml(word)}</button>`;
    }).join('');

    const moodboardThumbs = moodboard.map((src, i) =>
      `<img class="uw-moodboard-thumb" src="${src}" data-mb-idx="${i}" alt="Moodboard image">`
    ).join('');

    const canContinue = palette.length >= 1 && moodWords.length >= 1;

    body.innerHTML = `
      <div class="uw-section" style="padding-top:0">
        <div class="uw-section-label">COLOR PALETTE</div>
        <div class="uw-swatch-row">
          ${presetSwatches}
          <label class="uw-swatch-custom" title="Pick a custom color">
            <input type="color" id="uwCustomColor">
            <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:18px;pointer-events:none">+</span>
          </label>
        </div>
      </div>

      <div class="uw-section">
        <div class="uw-section-label">TYPOGRAPHY</div>
        <input type="text" id="uwTypographyInput" class="uw-text-input" placeholder="e.g. Bold serif headlines, clean sans body" value="${escHtml(aesthetic.typography || '')}">
      </div>

      <div class="uw-section">
        <div class="uw-section-label">MOOD</div>
        <div class="aisha-opts-grid">${moodChips}</div>
      </div>

      <div class="uw-section">
        <div class="uw-section-label">MOODBOARD</div>
        <div class="uw-moodboard-row">
          ${moodboardThumbs}
          <button type="button" class="uw-moodboard-add" id="uwMoodboardAdd">+</button>
        </div>
      </div>

      ${canContinue ? `<div class="uw-continue-wrap">${uwContinueCTA(brandId, idx)}</div>` : ''}
    `;

    body.querySelectorAll('.uw-swatch[data-hex]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.dataset.hex;
        const bb = getBrand(brandId);
        const u = bb.brandUniverse || {};
        const a = u.aesthetic || {};
        const cur = a.palette || [];
        const nextPalette = cur.includes(hex) ? cur.filter(c => c !== hex) : [...cur, hex];
        saveBrandOverride(brandId, { brandUniverse: { ...u, aesthetic: { ...a, palette: nextPalette } } });
        renderAestheticBody();
      });
    });

    document.getElementById('uwCustomColor')?.addEventListener('change', e => {
      const hex = e.target.value;
      const bb = getBrand(brandId);
      const u = bb.brandUniverse || {};
      const a = u.aesthetic || {};
      const cur = a.palette || [];
      if (!cur.includes(hex)) {
        saveBrandOverride(brandId, { brandUniverse: { ...u, aesthetic: { ...a, palette: [...cur, hex] } } });
        renderAestheticBody();
      }
    });

    const typographyInput = document.getElementById('uwTypographyInput');
    typographyInput?.addEventListener('change', () => {
      const bb = getBrand(brandId);
      const u = bb.brandUniverse || {};
      const a = u.aesthetic || {};
      saveBrandOverride(brandId, { brandUniverse: { ...u, aesthetic: { ...a, typography: typographyInput.value } } });
    });

    body.querySelectorAll('.aisha-opt[data-mood]').forEach(btn => {
      btn.addEventListener('click', () => {
        const word = btn.dataset.mood;
        const bb = getBrand(brandId);
        const u = bb.brandUniverse || {};
        const a = u.aesthetic || {};
        const cur = a.moodWords || [];
        const nextWords = cur.includes(word) ? cur.filter(w => w !== word) : [...cur, word];
        saveBrandOverride(brandId, { brandUniverse: { ...u, aesthetic: { ...a, moodWords: nextWords } } });
        renderAestheticBody();
      });
    });

    document.getElementById('uwMoodboardAdd')?.addEventListener('click', () => {
      pickImage(dataUrl => {
        const bb = getBrand(brandId);
        const u = bb.brandUniverse || {};
        const a = u.aesthetic || {};
        const nextBoard = [...(a.moodboard || []), dataUrl];
        saveBrandOverride(brandId, { brandUniverse: { ...u, aesthetic: { ...a, moodboard: nextBoard } } });
        renderAestheticBody();
      });
    });

    uwBindContinue(brandId, idx);
  }

  function initAestheticChapter() {
    chat.innerHTML = '';
    renderAestheticBody();
  }

  /* ── Dispatch by chapter type ── */
  if (chapterId === 'characters') {
    initCharactersChapter();
  } else if (chapterId === 'symbols') {
    initSymbolsChapter();
  } else if (chapterId === 'aesthetic') {
    initAestheticChapter();
  } else {
    initQAChapter();
  }
}

/* ── Grandure Brand: Characters ── */
function pageCharacters(brandId) {
  const brand = getBrand(brandId);
  const characters = (brand && brand.characters) || [];

  const cardsHtml = characters.map(ch => {
    const thumb = (ch.visualRefs && ch.visualRefs[0])
      ? `<img src="${escHtml(ch.visualRefs[0])}" alt="" style="width:100%;height:100%;object-fit:cover">`
      : `<div class="ch-avatar-fallback">${escHtml((ch.name || '?').trim().charAt(0).toUpperCase() || '?')}</div>`;
    return `
      <div class="section-card ch-card" data-id="${escHtml(ch.id)}" style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px 18px">
        <div class="ch-avatar">${thumb}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(ch.name || 'Untitled Character')}</div>
          ${ch.role ? `<div style="font-size:12px;color:#888;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(ch.role)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const emptyHtml = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:40vh;padding:0 32px">
      <p style="text-align:center;color:#666;font-size:14px;line-height:1.7">No characters yet. Every universe needs its citizens.</p>
    </div>
  `;

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="#/gb-home?id=${brandId}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">GRANDURE BRAND</div>
          <div class="back-header-title">Characters</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div style="padding:0 16px">
        ${characters.length ? cardsHtml : emptyHtml}
        <button id="chAddBtn" style="background:none;border:1px dashed rgba(255,255,255,0.18);border-radius:10px;padding:10px 16px;color:rgba(255,255,255,0.38);font-size:13px;width:100%;cursor:pointer">+ Add Character</button>
      </div>
    </div>
  `;
}

function bindCharacters(brandId) {
  document.querySelectorAll('.ch-card').forEach(card => {
    card.addEventListener('click', () => {
      openCharacterEditor(brandId, card.dataset.id, () => render());
    });
  });

  document.getElementById('chAddBtn')?.addEventListener('click', () => {
    openCharacterEditor(brandId, null, () => render());
  });
}

function openCharacterEditor(brandId, characterId, onSave) {
  document.getElementById('characterEditorPage')?.remove();
  const brand = getBrand(brandId);
  if (!brand) return;

  const isNew = !characterId;
  let character;
  if (isNew) {
    character = { id: null, name: '', role: '', description: '', personality: '', purpose: '', visualRefs: [], products: [], campaigns: [] };
  } else {
    character = (brand.characters || []).find(c => c.id === characterId);
    if (!character) return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'characterEditorPage';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:420;background:#0a0a0f;display:flex;flex-direction:column;overflow:hidden';

  let visualRefs = [...(character.visualRefs || [])];
  let selectedProducts = [...(character.products || [])];
  let selectedCampaigns = [...(character.campaigns || [])];

  const offers = (brand.overview && brand.overview.offers) || [];
  const campaignOptions = (brand.campaigns || []).map(c => ({ id: c.id, name: c.name }));

  function photoGrid() {
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
      ${visualRefs.map((p,i) => `<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;flex-shrink:0">
        <img src="${escHtml(p)}" style="width:100%;height:100%;object-fit:cover" alt="">
        <button data-idx="${i}" class="ce-del-photo" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:13px;line-height:1;cursor:pointer">×</button>
      </div>`).join('')}
      <button id="ceAddPhoto" style="width:80px;height:80px;border-radius:8px;border:2px dashed rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:24px;cursor:pointer;flex-shrink:0">+</button>
    </div>`;
  }

  function chipsHtml(options, selected, dataAttr) {
    if (!options.length) return `<div style="font-size:13px;color:#666">No offers defined yet</div>`;
    return `<div class="aisha-opts-grid">${options.map(opt => {
      const isSel = selected.includes(opt);
      return `<button type="button" class="aisha-opt${isSel ? ' selected' : ''}" data-${dataAttr}="${escHtml(opt)}">${escHtml(opt)}</button>`;
    }).join('')}</div>`;
  }

  function campaignChipsHtml() {
    if (!campaignOptions.length) return `<div style="font-size:13px;color:#666">No campaigns defined yet</div>`;
    return `<div class="aisha-opts-grid">${campaignOptions.map(opt => {
      const isSel = selectedCampaigns.includes(opt.id);
      return `<button type="button" class="aisha-opt${isSel ? ' selected' : ''}" data-camp-id="${escHtml(opt.id)}">${escHtml(opt.name)}</button>`;
    }).join('')}</div>`;
  }

  overlay.innerHTML = `
    <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0;padding-top:calc(14px + env(safe-area-inset-top,0px))">
      <button id="ceBack" type="button" style="background:none;border:none;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0 12px 0 0">‹</button>
      <div style="flex:1;font-size:16px;font-weight:700;color:#fff">${isNew ? 'New Character' : 'Edit Character'}</div>
      <button id="ceSave" style="background:rgba(255,255,255,0.1);border:none;border-radius:20px;padding:7px 18px;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Save</button>
    </div>
    <div id="ceBody" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:20px;overscroll-behavior:contain">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">NAME</div>
        <input id="ceName" type="text" value="${escHtml(character.name||'')}" placeholder="Character name…" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;-webkit-appearance:none">
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">ROLE</div>
        <input id="ceRole" type="text" value="${escHtml(character.role||'')}" placeholder="e.g. The Mentor, The Rebel" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;-webkit-appearance:none">
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">DESCRIPTION</div>
        <textarea id="ceDescription" placeholder="Describe this character…" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;resize:none;min-height:90px;box-sizing:border-box;-webkit-appearance:none">${escHtml(character.description||'')}</textarea>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">PERSONALITY</div>
        <textarea id="cePersonality" placeholder="What makes them who they are?" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;resize:none;min-height:90px;box-sizing:border-box;-webkit-appearance:none">${escHtml(character.personality||'')}</textarea>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">PURPOSE</div>
        <textarea id="cePurpose" placeholder="What role do they play in the brand's story?" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;resize:none;min-height:90px;box-sizing:border-box;-webkit-appearance:none">${escHtml(character.purpose||'')}</textarea>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">VISUAL REFERENCES</div>
        <div id="cePhotoGrid">${photoGrid()}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">ASSOCIATED PRODUCTS</div>
        <div id="ceProductChips">${chipsHtml(offers, selectedProducts, 'product')}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">ASSOCIATED CAMPAIGNS</div>
        <div id="ceCampaignChips">${campaignChipsHtml()}</div>
      </div>
      ${!isNew ? `<button id="ceDelete" style="background:none;border:1px solid rgba(255,69,58,0.4);border-radius:12px;padding:12px 14px;color:#ff453a;font-size:14px;font-weight:600;cursor:pointer;width:100%">Delete Character</button>` : ''}
    </div>`;

  document.body.appendChild(overlay);

  function rebindPhotoGrid() {
    const grid = overlay.querySelector('#cePhotoGrid');
    if (grid) grid.innerHTML = photoGrid();
    grid?.querySelector('#ceAddPhoto')?.addEventListener('click', () => {
      pickImage(dataUrl => { visualRefs.push(dataUrl); rebindPhotoGrid(); });
    });
    grid?.querySelectorAll('.ce-del-photo').forEach(btn => {
      btn.addEventListener('click', () => { visualRefs.splice(Number(btn.dataset.idx), 1); rebindPhotoGrid(); });
    });
  }
  rebindPhotoGrid();

  function rebindProductChips() {
    const wrap = overlay.querySelector('#ceProductChips');
    if (wrap) wrap.innerHTML = chipsHtml(offers, selectedProducts, 'product');
    wrap?.querySelectorAll('.aisha-opt[data-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.product;
        selectedProducts = selectedProducts.includes(val) ? selectedProducts.filter(p => p !== val) : [...selectedProducts, val];
        rebindProductChips();
      });
    });
  }
  rebindProductChips();

  function rebindCampaignChips() {
    const wrap = overlay.querySelector('#ceCampaignChips');
    if (wrap) wrap.innerHTML = campaignChipsHtml();
    wrap?.querySelectorAll('.aisha-opt[data-camp-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.campId;
        selectedCampaigns = selectedCampaigns.includes(val) ? selectedCampaigns.filter(c => c !== val) : [...selectedCampaigns, val];
        rebindCampaignChips();
      });
    });
  }
  rebindCampaignChips();

  function doSave() {
    const name = overlay.querySelector('#ceName')?.value.trim() || '';
    const role = overlay.querySelector('#ceRole')?.value.trim() || '';
    const description = overlay.querySelector('#ceDescription')?.value.trim() || '';
    const personality = overlay.querySelector('#cePersonality')?.value.trim() || '';
    const purpose = overlay.querySelector('#cePurpose')?.value.trim() || '';
    const b2 = getBrand(brandId);
    if (!b2) return;
    const existing = b2.characters || [];
    const savedChar = {
      id: character.id || uid(),
      name, role, description, personality, purpose,
      visualRefs: [...visualRefs],
      products: [...selectedProducts],
      campaigns: [...selectedCampaigns],
    };
    const nextCharacters = isNew
      ? [...existing, savedChar]
      : existing.map(c => c.id === savedChar.id ? savedChar : c);
    saveBrandOverride(brandId, { characters: nextCharacters });
    overlay.remove();
    if (onSave) onSave();
  }

  overlay.querySelector('#ceSave')?.addEventListener('click', doSave);
  overlay.querySelector('#ceBack')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#ceDelete')?.addEventListener('click', () => {
    if (!confirm('Delete this character?')) return;
    const b2 = getBrand(brandId);
    if (!b2) return;
    const nextCharacters = (b2.characters || []).filter(c => c.id !== character.id);
    saveBrandOverride(brandId, { characters: nextCharacters });
    overlay.remove();
    if (onSave) onSave();
  });
}

/* ── Grandure Brand: Assets ── */
const ASSET_GALLERY_SECTIONS = [
  { key: 'logos', label: 'LOGOS', gridId: 'assetLogosGrid', addId: 'assetLogosAdd' },
  { key: 'moodboards', label: 'MOODBOARDS', gridId: 'assetMoodboardsGrid', addId: 'assetMoodboardsAdd' },
  { key: 'visualRefs', label: 'VISUAL REFERENCES', gridId: 'assetVisualRefsGrid', addId: 'assetVisualRefsAdd' },
  { key: 'imagery', label: 'IMAGERY', gridId: 'assetImageryGrid', addId: 'assetImageryAdd' },
  { key: 'icons', label: 'ICONS', gridId: 'assetIconsGrid', addId: 'assetIconsAdd' },
];

function assetPhotoGridHtml(images, gridId, addId) {
  return `<div id="${gridId}" style="display:flex;flex-wrap:wrap;gap:8px">
    ${images.map((src, i) => `<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;flex-shrink:0">
      <img src="${escHtml(src)}" style="width:100%;height:100%;object-fit:cover" alt="">
      <button data-idx="${i}" class="as-del-photo" data-grid="${gridId}" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:13px;line-height:1;cursor:pointer">×</button>
    </div>`).join('')}
    <button id="${addId}" style="width:80px;height:80px;border-radius:8px;border:2px dashed rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:24px;cursor:pointer;flex-shrink:0">+</button>
  </div>`;
}

function assetSectionLabel(text) {
  return `<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:8px">${escHtml(text)}</div>`;
}

function pageAssets(brandId) {
  const brand = getBrand(brandId);
  const assets = (brand && brand.brandAssets) || { logos: [], colors: [], typography: [], moodboards: [], visualRefs: [], imagery: [], icons: [] };

  const gallerySectionsHtml = ASSET_GALLERY_SECTIONS.map(sec => `
    <div class="as-section">
      ${assetSectionLabel(sec.label)}
      ${assetPhotoGridHtml(assets[sec.key] || [], sec.gridId, sec.addId)}
    </div>
  `);

  const presetSwatches = AESTHETIC_PRESET_COLORS.map(hex => {
    const selected = (assets.colors || []).includes(hex);
    return `<button type="button" class="uw-swatch${selected ? ' selected' : ''}" data-hex="${escHtml(hex)}" style="background:${escHtml(hex)}" title="${escHtml(hex)}"></button>`;
  }).join('');

  const colorSectionHtml = `
    <div class="as-section">
      ${assetSectionLabel('COLOR PALETTE')}
      <div class="uw-swatch-row" id="assetColorSwatchRow">
        ${presetSwatches}
        <label class="uw-swatch-custom" title="Pick a custom color">
          <input type="color" id="assetCustomColor">
          <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:18px;pointer-events:none">+</span>
        </label>
      </div>
    </div>
  `;

  const typographyChipsHtml = (assets.typography || []).map((t, i) => `
    <span class="uw-symbol-chip" data-idx="${i}">
      ${escHtml(t)}
      <button type="button" class="uw-symbol-remove" data-remove-idx="${i}">×</button>
    </span>
  `).join('');

  const typographySectionHtml = `
    <div class="as-section">
      ${assetSectionLabel('TYPOGRAPHY')}
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input type="text" id="assetTypographyInput" class="uw-text-input" placeholder="e.g. Headline: Canela Bold / Body: Inter Regular">
        <button id="assetTypographyAdd" type="button" style="background:rgba(255,255,255,0.1);border:1px solid rgba(180,120,255,0.3);border-radius:12px;padding:0 18px;color:#d4aaff;font-size:18px;font-weight:600;cursor:pointer;flex-shrink:0">+</button>
      </div>
      <div class="uw-swatch-row" id="assetTypographyChips">${typographyChipsHtml}</div>
    </div>
  `;

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="#/gb-home?id=${brandId}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">GRANDURE BRAND</div>
          <div class="back-header-title">Assets</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div style="padding:0 16px">
        ${gallerySectionsHtml[0]}
        ${colorSectionHtml}
        ${typographySectionHtml}
        ${gallerySectionsHtml[1]}
        ${gallerySectionsHtml[2]}
        ${gallerySectionsHtml[3]}
        ${gallerySectionsHtml[4]}
      </div>
    </div>
  `;
}

function bindAssets(brandId) {
  /* ── Image gallery sections (logos, moodboards, visualRefs, imagery, icons) ── */
  function rebindGallery(sec) {
    const grid = document.getElementById(sec.gridId);
    if (!grid) return;
    const brand = getBrand(brandId);
    const images = (brand.brandAssets && brand.brandAssets[sec.key]) || [];
    grid.outerHTML = assetPhotoGridHtml(images, sec.gridId, sec.addId);
    bindGallerySection(sec);
  }

  function bindGallerySection(sec) {
    document.getElementById(sec.addId)?.addEventListener('click', () => {
      pickImage(dataUrl => {
        const brand = getBrand(brandId);
        const assets = brand.brandAssets || {};
        const next = [...(assets[sec.key] || []), dataUrl];
        saveBrandOverride(brandId, { brandAssets: { ...assets, [sec.key]: next } });
        rebindGallery(sec);
      });
    });
    document.getElementById(sec.gridId)?.querySelectorAll('.as-del-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        const brand = getBrand(brandId);
        const assets = brand.brandAssets || {};
        const next = (assets[sec.key] || []).filter((_, i) => i !== idx);
        saveBrandOverride(brandId, { brandAssets: { ...assets, [sec.key]: next } });
        rebindGallery(sec);
      });
    });
  }

  ASSET_GALLERY_SECTIONS.forEach(bindGallerySection);

  /* ── Color palette ── */
  function rebindColors() {
    const row = document.getElementById('assetColorSwatchRow');
    if (!row) return;
    const brand = getBrand(brandId);
    const colors = (brand.brandAssets && brand.brandAssets.colors) || [];
    const presetSwatches = AESTHETIC_PRESET_COLORS.map(hex => {
      const selected = colors.includes(hex);
      return `<button type="button" class="uw-swatch${selected ? ' selected' : ''}" data-hex="${escHtml(hex)}" style="background:${escHtml(hex)}" title="${escHtml(hex)}"></button>`;
    }).join('');
    row.innerHTML = `
      ${presetSwatches}
      <label class="uw-swatch-custom" title="Pick a custom color">
        <input type="color" id="assetCustomColor">
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:18px;pointer-events:none">+</span>
      </label>
    `;
    bindColorSwatches();
  }

  function bindColorSwatches() {
    document.querySelectorAll('#assetColorSwatchRow .uw-swatch[data-hex]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.dataset.hex;
        const brand = getBrand(brandId);
        const assets = brand.brandAssets || {};
        const cur = assets.colors || [];
        const next = cur.includes(hex) ? cur.filter(c => c !== hex) : [...cur, hex];
        saveBrandOverride(brandId, { brandAssets: { ...assets, colors: next } });
        rebindColors();
      });
    });
    document.getElementById('assetCustomColor')?.addEventListener('change', e => {
      const hex = e.target.value;
      const brand = getBrand(brandId);
      const assets = brand.brandAssets || {};
      const cur = assets.colors || [];
      if (!cur.includes(hex)) {
        saveBrandOverride(brandId, { brandAssets: { ...assets, colors: [...cur, hex] } });
        rebindColors();
      }
    });
  }
  bindColorSwatches();

  /* ── Typography ── */
  function rebindTypography() {
    const wrap = document.getElementById('assetTypographyChips');
    if (!wrap) return;
    const brand = getBrand(brandId);
    const typography = (brand.brandAssets && brand.brandAssets.typography) || [];
    wrap.innerHTML = typography.map((t, i) => `
      <span class="uw-symbol-chip" data-idx="${i}">
        ${escHtml(t)}
        <button type="button" class="uw-symbol-remove" data-remove-idx="${i}">×</button>
      </span>
    `).join('');
    bindTypographyChips();
  }

  function bindTypographyChips() {
    document.getElementById('assetTypographyChips')?.querySelectorAll('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.removeIdx);
        const brand = getBrand(brandId);
        const assets = brand.brandAssets || {};
        const next = (assets.typography || []).filter((_, i) => i !== idx);
        saveBrandOverride(brandId, { brandAssets: { ...assets, typography: next } });
        rebindTypography();
      });
    });
  }
  bindTypographyChips();

  function submitTypography() {
    const input = document.getElementById('assetTypographyInput');
    if (!input) return;
    const value = input.value.trim();
    if (!value) return;
    const brand = getBrand(brandId);
    const assets = brand.brandAssets || {};
    const next = [...(assets.typography || []), value];
    saveBrandOverride(brandId, { brandAssets: { ...assets, typography: next } });
    input.value = '';
    rebindTypography();
  }

  document.getElementById('assetTypographyAdd')?.addEventListener('click', submitTypography);
  document.getElementById('assetTypographyInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitTypography(); }
  });
}

/* ── Grandure Brand: Bible (read-only auto-generated document) ── */
function bibFieldLine(label, value) {
  if (!value) return '';
  return `<div style="font-size:13px;color:#999;line-height:1.6;margin-bottom:6px"><span style="color:#666">${escHtml(label)}:</span> ${escHtml(value)}</div>`;
}

function bibEmptyState(brandId, chapter, chapterIdx) {
  const href = chapter.id === 'characters'
    ? `#/gb-characters?id=${brandId}`
    : `#/gb-universe?id=${brandId}&chapter=${chapterIdx}`;
  return `
    <div style="font-size:13px;color:#666;margin-bottom:12px">Not yet defined.</div>
    <button data-href="${href}" style="background:none;border:1px dashed rgba(255,255,255,0.18);border-radius:10px;padding:10px 16px;color:rgba(255,255,255,0.38);font-size:13px;cursor:pointer">Continue in the wizard ›</button>
  `;
}

function bibChapterBody(brand, brandId, chapter, chapterIdx) {
  const u = brand.brandUniverse || {};

  if (chapter.id === 'world') {
    const w = u.world || {};
    return `
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px">${escHtml(w.name || '')}</div>
      <div style="font-size:14px;color:#ccc;line-height:1.7;margin-bottom:10px">${escHtml(w.description || '')}</div>
      ${bibFieldLine('Tension', w.tension)}
      ${bibFieldLine('Setting', w.setting)}
    `;
  }

  if (chapter.id === 'belief') {
    const b = u.belief || {};
    return `
      <div style="border-left:2px solid rgba(180,120,255,0.4);padding-left:14px;margin-bottom:10px;font-size:15px;color:#d4aaff;line-height:1.7;font-style:italic">${escHtml(b.statement || '')}</div>
      ${bibFieldLine('Differentiator', b.differentiator)}
      ${bibFieldLine('Old paradigm', b.oldParadigm)}
    `;
  }

  if (chapter.id === 'citizens') {
    const c = u.citizens || {};
    return `
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px">${escHtml(c.name || '')}</div>
      ${bibFieldLine('Who', c.who)}
      ${bibFieldLine('Unites', c.unites)}
      ${bibFieldLine('Transformation', c.transformation)}
    `;
  }

  if (chapter.id === 'characters') {
    const characters = brand.characters || [];
    return characters.map(ch => {
      const thumb = (ch.visualRefs && ch.visualRefs[0])
        ? `<img src="${escHtml(ch.visualRefs[0])}" alt="" style="width:100%;height:100%;object-fit:cover">`
        : `<div class="ch-avatar-fallback">${escHtml((ch.name || '?').trim().charAt(0).toUpperCase() || '?')}</div>`;
      return `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
          <div class="ch-avatar">${thumb}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700;color:#fff">${escHtml(ch.name || 'Untitled Character')}</div>
            ${ch.role ? `<div style="font-size:12px;color:#888;margin-top:1px">${escHtml(ch.role)}</div>` : ''}
            ${ch.description ? `<div style="font-size:12px;color:#999;margin-top:4px;line-height:1.5">${escHtml(ch.description)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  if (chapter.id === 'symbols') {
    const symbols = u.symbols || [];
    return `<div class="uw-swatch-row">${symbols.map(s => `
      <span class="uw-symbol-chip">${escHtml(s.name)}</span>
    `).join('')}</div>`;
  }

  if (chapter.id === 'aesthetic') {
    const a = u.aesthetic || {};
    const palette = a.palette || [];
    const moodWords = a.moodWords || [];
    const moodboard = a.moodboard || [];
    const swatches = palette.map(hex => `<div class="uw-swatch" style="background:${escHtml(hex)};cursor:default" title="${escHtml(hex)}"></div>`).join('');
    const moodChips = moodWords.map(w => `<span class="aisha-opt selected" style="cursor:default">${escHtml(w)}</span>`).join('');
    const moodboardThumbs = moodboard.map(src => `<img class="uw-moodboard-thumb" src="${src}" alt="Moodboard image">`).join('');
    return `
      ${palette.length ? `<div class="uw-section-label" style="margin-bottom:8px">COLOR PALETTE</div><div class="uw-swatch-row" style="margin-bottom:16px">${swatches}</div>` : ''}
      ${bibFieldLine('Typography', a.typography)}
      ${moodWords.length ? `<div class="uw-section-label" style="margin:14px 0 8px">MOOD WORDS</div><div class="aisha-opts-grid" style="margin-bottom:16px">${moodChips}</div>` : ''}
      ${moodboard.length ? `<div class="uw-section-label" style="margin:14px 0 8px">MOODBOARD</div><div style="display:flex;flex-wrap:wrap;gap:8px">${moodboardThumbs}</div>` : ''}
    `;
  }

  if (chapter.id === 'invitations') {
    const inv = u.invitations || {};
    return `
      ${bibFieldLine('On-ramp', inv.onRamp)}
      ${bibFieldLine('CTA', inv.cta)}
      ${bibFieldLine('Reward', inv.reward)}
    `;
  }

  return '';
}

function pageBible(brandId) {
  const brand = getBrand(brandId);
  if (!brand) return `<div class="page"><div class="back-header"><button class="back-btn" data-href="#/grandure-brand">‹</button></div></div>`;

  const sectionsHtml = UNIVERSE_CHAPTERS.map((chapter, i) => {
    const complete = isChapterComplete(brand, chapter.id);
    const body = complete ? bibChapterBody(brand, brandId, chapter, i) : bibEmptyState(brandId, chapter, i);
    return `
      <div class="section-card bib-section" style="cursor:default">
        <div class="section-label" style="margin-bottom:6px">CHAPTER ${i + 1}</div>
        <div style="font-size:19px;font-weight:700;color:#fff;margin-bottom:14px">${escHtml(chapter.label)}</div>
        ${body}
      </div>
    `;
  }).join('');

  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="#/gb-home?id=${brandId}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">GRANDURE BRAND</div>
          <div class="back-header-title">Brand Bible</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div style="padding:0 16px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;color:#666;margin-bottom:16px">${escHtml(brand.name || '')} — AS DEFINED SO FAR</div>
        ${sectionsHtml}
      </div>
    </div>
  `;
}

/* ── Grandure Brand: temporary stub pages for deeper tabs ── */
function pageGrandureBrandStub(brandId, tabId, label) {
  return `
    <div class="page" style="padding-bottom:120px">
      <div class="back-header">
        <button class="back-btn" data-href="#/gb-home?id=${brandId}">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">GRANDURE BRAND</div>
          <div class="back-header-title">${escHtml(label)}</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;min-height:50vh;padding:0 32px">
        <p style="text-align:center;color:#666;font-size:14px;line-height:1.7">${escHtml(label)} — coming soon in the next update.</p>
      </div>
    </div>
  `;
}

/* ── Grandure Hub ── */
function pageHub() {
  const ecosystemTiles = [
    { href: '#/grandure-brand', name: 'Grandure Brand', desc: 'Define your universe', icon: `<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>` },
    { href: '#/plan', name: 'Grandure Plan', desc: 'Establish your roadmap', icon: `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>`, soon: true },
    { href: '#/', name: 'Grandure Connect', desc: 'Run your campaigns', icon: `<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>` },
    { href: '#/orbit', name: 'Grandure Orbit', desc: 'Execute production', icon: `<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4"/>` },
  ].map(t => `
    <div class="hub-tile" data-href="${t.href}">
      <div class="hub-tile-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
      </div>
      <div class="hub-tile-name">${t.name}</div>
      ${t.soon ? `<span class="main-menu-badge">SOON</span>` : `<div class="hub-tile-desc">${t.desc}</div>`}
    </div>
  `).join('');

  const brandRows = BRANDS.map(brand => {
    const { pct } = universeCompletion(brand);
    return `
      <div class="section-card" data-href="#/gb-home?id=${brand.id}" style="cursor:pointer">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:15px;font-weight:700;color:#fff">${escHtml(brand.name)}</div>
            <div style="font-size:12px;color:#888;margin-top:2px">${escHtml(brand.currentPhase?.name || '')}</div>
          </div>
          <div style="font-size:13px;font-weight:700;color:#d4aaff">${pct}%</div>
        </div>
        <div style="height:5px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aad,#d4aaff);border-radius:3px"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page" style="padding-bottom:40px">
      <div class="top-header">
        <div class="icon-btn" id="hubMenuBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </div>
        <div class="logo-wrap">
          <div style="font-size:15px;font-weight:800;letter-spacing:2px;color:#fff">GRANDURE</div>
        </div>
        <div style="width:44px"></div>
      </div>
      <div style="padding:0 16px">
        <div class="section-label">ECOSYSTEM</div>
        <div class="hub-tile-grid">${ecosystemTiles}</div>

        <div class="section-label" style="margin-top:8px">YOUR BRANDS</div>
        ${brandRows}
      </div>
    </div>
  `;
}

/* ── Grandure Plan / Orbit placeholders ── */
function pagePlanPlaceholder() {
  return `
    <div class="page" style="padding-bottom:40px">
      <div class="back-header">
        <button class="back-btn" data-href="#/hub">‹</button>
        <div class="back-header-center">
          <div class="back-header-label">GRANDURE</div>
          <div class="back-header-title">Grandure Plan</div>
        </div>
        <div style="width:36px"></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:55vh;padding:0 32px;text-align:center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="color:#555;margin-bottom:18px"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        <div style="font-size:19px;font-weight:700;color:#fff;margin-bottom:8px">Grandure Plan</div>
        <p style="font-size:14px;color:#888;line-height:1.6;margin-bottom:4px">Establishes the roadmap.</p>
        <p style="font-size:13px;color:#555;margin-bottom:26px">Coming soon.</p>
        <button class="gb-cta-btn" style="max-width:240px" data-href="#/hub">
          <span class="gb-cta-top"><span class="gb-cta-label">Back to Hub</span></span>
        </button>
      </div>
    </div>
  `;
}

/* ── Grandure Orbit ── */
const ORBIT_DEFAULT = {
  productions: [
    { id: 'op1', name: 'homieOStasis MVP', agents: 4, activeTasks: 12, waiting: 2, lastSignalMins: 5 },
    { id: 'op2', name: 'Grandure Connect', agents: 3, activeTasks: 8, waiting: 1, lastSignalMins: 12 },
    { id: 'op3', name: 'Founding Homies', agents: 2, activeTasks: 5, waiting: 0, lastSignalMins: 35 },
    { id: 'op4', name: 'Grandure Orbit', agents: 1, activeTasks: 3, waiting: 1, lastSignalMins: 60 },
    { id: 'op5', name: 'Ten Grand Website', agents: 2, activeTasks: 6, waiting: 0, lastSignalMins: 120 },
  ],
  queue: {
    attention: [
      { id: 'qa1', title: 'Approve Prize Categories', production: 'homieOStasis MVP', priority: 'High' },
      { id: 'qa2', title: 'Approve Puzzle Artwork', production: 'homieOStasis MVP', priority: 'Medium' },
    ],
    waiting: [
      { id: 'qw1', title: 'Assign Bubble Gum Game', production: 'homieOStasis MVP', priority: 'Medium' },
      { id: 'qw2', title: 'Review Sound Effects', production: 'homieOStasis MVP', priority: 'Low' },
    ]
  },
  signals: [
    { id: 'sg1', agent: 'Claude Code', action: 'completed', item: 'Puzzle Difficulty Screen', production: 'homieOStasis MVP', mins: 5 },
    { id: 'sg2', agent: 'Design Agent', action: 'uploaded', item: 'Prize Center Mockup', production: 'homieOStasis MVP', mins: 14 },
    { id: 'sg3', agent: 'Lain', action: 'approved', item: 'Fruit Snack Frenzy Layout', production: 'homieOStasis MVP', mins: 22 },
    { id: 'sg4', agent: 'QA Agent', action: 'reported', item: 'Collision Issue', production: 'homieOStasis MVP', mins: 60 },
  ]
};

function getOrbitData() {
  try {
    const s = localStorage.getItem('gc_orbit');
    if (s) { const p = JSON.parse(s); return { ...ORBIT_DEFAULT, ...p, productions: p.productions || ORBIT_DEFAULT.productions, queue: p.queue || ORBIT_DEFAULT.queue, signals: p.signals || ORBIT_DEFAULT.signals }; }
  } catch {}
  return { ...ORBIT_DEFAULT };
}

function saveOrbitData(patch) {
  try { localStorage.setItem('gc_orbit', JSON.stringify({ ...getOrbitData(), ...patch })); } catch {}
}

function orbitRelTime(mins) {
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function orbitSunSmall() {
  return `<div style="width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 38% 32%, #fef9c3, #fbbf24 28%, #f59e0b 45%, #92400e 68%, #1a0800 100%);box-shadow:0 0 20px rgba(245,158,11,0.6),0 0 40px rgba(245,158,11,0.25);flex-shrink:0"></div>`;
}

function orbitSunLarge() {
  return `<div style="width:72px;height:72px;border-radius:50%;background:radial-gradient(circle at 38% 32%, #fef9c3, #fbbf24 28%, #f59e0b 45%, #92400e 68%, #1a0800 100%);box-shadow:0 0 28px rgba(245,158,11,0.65),0 0 55px rgba(245,158,11,0.3),0 0 90px rgba(245,158,11,0.1);margin-bottom:12px"></div>`;
}

function pageOrbit() {
  const data = getOrbitData();
  const prods = data.productions || [];
  const queue = data.queue || { attention: [], waiting: [] };
  const signals = data.signals || [];

  function priColor(p) { return p === 'High' ? '#f87171' : p === 'Medium' ? '#fb923c' : '#6ee7b7'; }

  function queueItems(items) {
    if (!items.length) return `<div style="font-size:11px;color:rgba(255,245,230,0.2);text-align:center;padding:8px 0">All clear</div>`;
    return items.map(item => `
      <div class="orbit-qi">
        <div style="display:flex;align-items:flex-start;gap:6px">
          <div style="width:3px;min-height:30px;border-radius:2px;background:${priColor(item.priority)};flex-shrink:0;margin-top:2px"></div>
          <div style="min-width:0">
            <div class="orbit-qi-title">${escHtml(item.title)}</div>
            <div class="orbit-qi-sub">${escHtml(item.production)}</div>
          </div>
        </div>
      </div>`).join('');
  }

  const signalsHtml = signals.map(s => `
    <div class="orbit-signal-chip">
      <div style="width:26px;height:26px;border-radius:50%;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.22);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#f59e0b;margin-bottom:7px">${escHtml(s.agent.trim().charAt(0).toUpperCase())}</div>
      <div style="font-size:11px;font-weight:600;color:rgba(255,245,230,0.75);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(s.agent)}</div>
      <div style="font-size:10px;color:rgba(255,245,230,0.35);line-height:1.4">${escHtml(s.action)}<br><span style="color:rgba(255,245,230,0.55)">${escHtml(s.item)}</span></div>
      <div style="font-size:9px;color:rgba(245,158,11,0.4);margin-top:7px">${orbitRelTime(s.mins)}</div>
    </div>`).join('');

  const prodCards = prods.slice(0, 4).map(p => `
    <div class="orbit-prod-card" data-href="#/orbit-production?id=${escHtml(p.id)}">
      ${orbitSunLarge()}
      <div style="font-size:12px;font-weight:700;color:rgba(255,245,230,0.9);text-align:center;margin-bottom:10px;line-height:1.3">${escHtml(p.name)}</div>
      <div style="display:flex;gap:10px;justify-content:center;margin-bottom:8px">
        <div style="text-align:center"><div style="font-size:14px;font-weight:700;color:#fbbf24">${p.agents}</div><div style="font-size:8px;color:rgba(255,245,230,0.3);letter-spacing:0.5px">AGENTS</div></div>
        <div style="width:1px;background:rgba(255,255,255,0.06)"></div>
        <div style="text-align:center"><div style="font-size:14px;font-weight:700;color:#fbbf24">${p.activeTasks}</div><div style="font-size:8px;color:rgba(255,245,230,0.3);letter-spacing:0.5px">TASKS</div></div>
        ${p.waiting ? `<div style="width:1px;background:rgba(255,255,255,0.06)"></div><div style="text-align:center"><div style="font-size:14px;font-weight:700;color:#f87171">${p.waiting}</div><div style="font-size:8px;color:rgba(255,245,230,0.3);letter-spacing:0.5px">WAITING</div></div>` : ''}
      </div>
      <div style="font-size:9px;color:rgba(245,158,11,0.35)">Last signal ${orbitRelTime(p.lastSignalMins)}</div>
    </div>`).join('');

  const newProdCard = `
    <div class="orbit-prod-card" data-href="#/orbit-productions" style="border-style:dashed;border-color:rgba(245,158,11,0.15);justify-content:center;min-height:160px">
      <div style="width:40px;height:40px;border-radius:50%;border:1.5px dashed rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;color:rgba(245,158,11,0.3);font-size:22px;margin-bottom:8px">+</div>
      <div style="font-size:11px;color:rgba(245,158,11,0.35);font-weight:600">New Production</div>
    </div>`;

  const aishaSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>`;

  return `
    <div class="orbit-page" style="padding-bottom:90px;overflow-y:auto;-webkit-overflow-scrolling:touch">
      <div style="padding:calc(20px + env(safe-area-inset-top,0px)) 20px 0;display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/></svg>
            <div style="font-size:13px;font-weight:800;letter-spacing:2px;color:#f59e0b">GRANDURE ORBIT</div>
          </div>
          <div style="font-size:9px;letter-spacing:1.5px;color:rgba(255,245,230,0.2);margin-bottom:14px">WHERE IDEAS BECOME REALITIES</div>
          <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);border-radius:20px;padding:4px 10px">
            <div style="width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 6px rgba(245,158,11,0.8)"></div>
            <div style="font-size:10px;font-weight:700;color:rgba(245,158,11,0.8);letter-spacing:0.5px">${prods.length} ACTIVE PRODUCTIONS</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:4px">
          <button style="background:none;border:none;cursor:pointer;color:rgba(255,245,230,0.25);padding:4px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
          <div style="width:32px;height:32px;border-radius:50%;background:rgba(245,158,11,0.15);border:1.5px solid rgba(245,158,11,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#f59e0b">L</div>
        </div>
      </div>

      <div style="padding:24px 16px 0">
        <div class="orbit-section-row">
          <div class="orbit-section-label">MY QUEUE</div>
          <button style="background:none;border:none;cursor:pointer;font-size:11px;color:rgba(245,158,11,0.4);padding:0">View all my tasks ›</button>
        </div>
        <div style="display:flex;gap:10px">
          <div class="orbit-queue-card">
            <div class="orbit-queue-card-hdr">NEEDS MY ATTENTION</div>
            ${queueItems(queue.attention)}
          </div>
          <div class="orbit-queue-card">
            <div class="orbit-queue-card-hdr">WAITING ON ME</div>
            ${queueItems(queue.waiting)}
          </div>
        </div>
      </div>

      <div style="padding:24px 16px 0">
        <div class="orbit-section-row">
          <div class="orbit-section-label">SIGNALS</div>
          <button style="background:none;border:none;cursor:pointer;font-size:11px;color:rgba(245,158,11,0.4);padding:0">View all signals ›</button>
        </div>
        <div class="orbit-signal-row">${signalsHtml}</div>
      </div>

      <div style="padding:24px 16px 0">
        <div class="orbit-section-row">
          <div class="orbit-section-label">PRODUCTIONS</div>
          <button class="orbit-section-link" data-href="#/orbit-productions" style="background:none;border:none;cursor:pointer;font-size:11px;color:rgba(245,158,11,0.4);padding:0">View all productions ›</button>
        </div>
        <div class="orbit-prod-grid">
          ${prodCards}
          ${newProdCard}
        </div>
      </div>
    </div>`;
}

function pageOrbitProductions() {
  const data = getOrbitData();
  const prods = data.productions || [];
  const cards = prods.map(p => `
    <div class="orbit-prod-list-card" data-href="#/orbit-production?id=${escHtml(p.id)}">
      ${orbitSunSmall()}
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;color:rgba(255,245,230,0.9);margin-bottom:6px">${escHtml(p.name)}</div>
        <div style="display:flex;gap:12px">
          <div><span style="font-size:13px;font-weight:700;color:#fbbf24">${p.agents}</span><span style="font-size:9px;color:rgba(255,245,230,0.3);margin-left:3px">Agents</span></div>
          <div><span style="font-size:13px;font-weight:700;color:#fbbf24">${p.activeTasks}</span><span style="font-size:9px;color:rgba(255,245,230,0.3);margin-left:3px">Tasks</span></div>
          ${p.waiting ? `<div><span style="font-size:13px;font-weight:700;color:#f87171">${p.waiting}</span><span style="font-size:9px;color:rgba(255,245,230,0.3);margin-left:3px">Waiting</span></div>` : ''}
        </div>
      </div>
      <div style="font-size:9px;color:rgba(245,158,11,0.35);text-align:right;flex-shrink:0">${orbitRelTime(p.lastSignalMins)}</div>
    </div>`).join('');

  return `
    <div class="orbit-page" style="padding-bottom:90px;overflow-y:auto;-webkit-overflow-scrolling:touch">
      <div style="padding:calc(20px + env(safe-area-inset-top,0px)) 16px 20px;display:flex;align-items:center;gap:12px">
        <button class="back-btn" data-href="#/orbit" style="background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.2);color:#f59e0b">‹</button>
        <div>
          <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:rgba(245,158,11,0.6)">GRANDURE ORBIT</div>
          <div style="font-size:18px;font-weight:700;color:rgba(255,245,230,0.9)">Productions</div>
        </div>
      </div>
      <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
        ${cards}
        <div class="orbit-prod-list-card" data-href="#/orbit-new-production" style="border-style:dashed;border-color:rgba(245,158,11,0.15)">
          <div style="width:52px;height:52px;border-radius:50%;border:1.5px dashed rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;color:rgba(245,158,11,0.3);font-size:22px;flex-shrink:0">+</div>
          <div style="font-size:13px;font-weight:600;color:rgba(245,158,11,0.4)">New Production</div>
        </div>
      </div>
    </div>`;
}

function pageOrbitStub(tab, title, desc) {
  return `
    <div class="orbit-page" style="padding-bottom:90px">
      <div style="padding:calc(20px + env(safe-area-inset-top,0px)) 16px 20px;display:flex;align-items:center;gap:12px">
        <button class="back-btn" data-href="#/orbit" style="background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.2);color:#f59e0b">‹</button>
        <div>
          <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:rgba(245,158,11,0.6)">GRANDURE ORBIT</div>
          <div style="font-size:18px;font-weight:700;color:rgba(255,245,230,0.9)">${escHtml(title)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;padding:0 32px;text-align:center">
        <div style="font-size:14px;color:rgba(255,245,230,0.2);margin-bottom:6px">${escHtml(desc || 'Coming soon')}</div>
        <div style="font-size:11px;color:rgba(245,158,11,0.3)">${escHtml(title)} · Grandure Orbit</div>
      </div>
    </div>`;
}

function injectOrbitNav(active) {
  document.getElementById('orbitNav')?.remove();
  const nav = document.createElement('nav');
  nav.id = 'orbitNav';
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:200;background:rgba(8,6,4,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:space-around;padding:10px 0;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))';

  const homeSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  const prodSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/></svg>`;
  const assetSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
  const inboxSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
  const aishaSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-1.74z"/></svg>`;

  function tabBtn(label, href, svg, key) {
    const on = active === key;
    return `<button class="orbit-nav-btn${on ? ' active' : ''}" data-href="${href}">${svg}${label}</button>`;
  }

  nav.innerHTML = `
    ${tabBtn('HOME', '#/orbit', homeSVG, 'home')}
    ${tabBtn('PRODUCTIONS', '#/orbit-productions', prodSVG, 'productions')}
    <button id="orbitAgentsBtn" style="background:radial-gradient(circle at 40% 35%,#fde68a,#f59e0b 40%,#b45309 80%);box-shadow:0 0 20px rgba(245,158,11,0.65),0 0 40px rgba(245,158,11,0.25);border:none;border-radius:50%;width:52px;height:52px;display:flex;align-items:center;justify-content:center;color:#1a0800;cursor:pointer;margin-top:-18px;flex-shrink:0">${aishaSVG}</button>
    ${tabBtn('ASSETS', '#/orbit-assets', assetSVG, 'assets')}
    ${tabBtn('INBOX', '#/orbit-inbox', inboxSVG, 'inbox')}
  `;
  document.getElementById('app').appendChild(nav);
  nav.querySelector('#orbitAgentsBtn')?.addEventListener('click', () => navigate('#/orbit-agents'));
}

function pageOrbitPlaceholder() {
  return pageOrbit();
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
   AISHA MINI POPUP
═══════════════════════════════════════ */
function openPlatformSetupSheet(brandId, parentEl) {
  document.getElementById('platSetupSheet')?.remove();
  const b = getBrand(brandId);
  const accounts = b?.socialAccounts || {};
  const sendSVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  const sheet = document.createElement('div');
  sheet.id = 'platSetupSheet';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:500;background:#0a0a0a;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0)';

  const platformRows = ALL_PLATFORMS.map(p => {
    const key = p.toLowerCase();
    const acct = accounts[key] || {};
    return `
      <div style="border-bottom:1px solid rgba(255,255,255,0.05);padding:16px 0" data-plat-key="${key}">
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:10px">${p}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <input class="notion-input plat-handle-input" data-plat="${key}" placeholder="@handle" value="${escHtml(acct.handle||'')}" style="font-size:14px">
          <input class="notion-input plat-url-input" data-plat="${key}" type="url" placeholder="Profile URL" value="${escHtml(acct.url||'')}" style="font-size:14px">
          <input class="notion-input plat-apikey-input" data-plat="${key}" type="password" placeholder="API key / token (optional)" value="${escHtml(acct.apiKey||'')}" style="font-size:14px">
        </div>
      </div>`;
  }).join('');

  sheet.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
      <button id="platSetupBack" type="button" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:16px;padding:0;cursor:pointer">Cancel</button>
      <div style="font-size:16px;font-weight:700;color:#fff">Platform Setup</div>
      <button id="platSetupSave" type="button" style="background:none;border:none;color:#fff;font-size:16px;font-weight:700;padding:0;cursor:pointer">Save</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:0 20px;overscroll-behavior:contain;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))">
      <div style="font-size:12px;color:rgba(255,255,255,0.3);padding:14px 0 6px;line-height:1.5">Add your handles, profile URLs, and API tokens for each platform you use. API tokens enable analytics and scheduling integrations.</div>
      ${platformRows}
    </div>
  `;

  document.body.appendChild(sheet);

  sheet.querySelector('#platSetupBack')?.addEventListener('click', () => sheet.remove());
  sheet.querySelector('#platSetupSave')?.addEventListener('click', () => {
    const updatedAccounts = { ...(getBrand(brandId)?.socialAccounts || {}) };
    sheet.querySelectorAll('[data-plat-key]').forEach(row => {
      const key = row.dataset.platKey;
      updatedAccounts[key] = {
        handle: row.querySelector('.plat-handle-input')?.value.trim() || '',
        url:    row.querySelector('.plat-url-input')?.value.trim() || '',
        apiKey: row.querySelector('.plat-apikey-input')?.value.trim() || '',
      };
    });
    saveBrandOverride(brandId, { socialAccounts: updatedAccounts });
    sheet.remove();
  });
}

function ensureAishaSheet(brandId, campId) {
  document.getElementById('aishaSheet')?.remove();
  const brand = getBrand(brandId);
  const campaign = (brand?.campaigns || []).find(c => c.id === campId);
  if (!brand || !campaign) return null;
  const el = document.createElement('div');
  el.className = 'aisha-sheet';
  el.id = 'aishaSheet';
  el.innerHTML = aishaBlockHTML();
  document.body.appendChild(el);
  bindAisha(brand, campaign, brandId, campId);
  document.getElementById('aishaBackBtn')?.addEventListener('click', () => el.classList.remove('open'));
  return el;
}

function openAishaMini(aishaEl) {
  document.getElementById('aishaMiniSheet')?.remove();

  const sendSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

  const backdrop = document.createElement('div');
  backdrop.id = 'aishaMiniSheet';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:240;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,0.45)';

  backdrop.innerHTML = `
    <div id="aishaMiniInner" style="background:#1c1c1e;border-radius:20px 20px 0 0;display:flex;flex-direction:column;max-height:55vh;padding-bottom:env(safe-area-inset-bottom,0px)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.07)">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:#c8a0ff;font-size:18px">✦</span>
          <span style="color:#fff;font-size:16px;font-weight:700">Aisha</span>
        </div>
        <button id="aishaMiniExpand" type="button" style="background:rgba(124,58,173,0.25);border:1px solid rgba(180,120,255,0.3);border-radius:100px;padding:7px 16px;color:#c8a0ff;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.3px">Start Wizard ›</button>
      </div>
      <div id="aishaMiniChat" style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px;overscroll-behavior:contain;min-height:80px"></div>
      <div style="display:flex;gap:8px;align-items:center;padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,0.07);flex-shrink:0">
        <input id="aishaMiniInput" type="text" placeholder="Ask Aisha…" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 13px;color:#fff;font-size:16px;font-family:inherit;outline:none">
        <button id="aishaMiniSend" type="button" style="width:36px;height:36px;border-radius:50%;background:rgba(124,58,173,0.3);border:1px solid rgba(180,120,255,0.2);display:flex;align-items:center;justify-content:center;color:#c8a0ff;flex-shrink:0;cursor:pointer">${sendSVG}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  function renderMiniChat() {
    const chatEl = document.getElementById('aishaMiniChat');
    if (!chatEl) return;
    chatEl.innerHTML = _aishaMessages.map(m =>
      `<div style="max-width:90%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.55;word-break:break-word;${m.role==='aisha'
        ? 'background:rgba(124,58,173,0.15);border:1px solid rgba(124,58,173,0.2);align-self:flex-start;border-bottom-left-radius:4px;color:#ddd'
        : 'background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);align-self:flex-end;border-bottom-right-radius:4px;color:#fff'
      }">${m.text.replace(/\n/g,'<br>')}</div>`
    ).join('');
    chatEl.scrollTop = chatEl.scrollHeight;
  }
  renderMiniChat();

  setTimeout(() => {
    backdrop.addEventListener('click', e => {
      if (!document.getElementById('aishaMiniInner')?.contains(e.target)) {
        backdrop.remove();
      }
    });
  }, 350);

  document.getElementById('aishaMiniExpand')?.addEventListener('click', () => {
    backdrop.remove();
    aishaEl.classList.add('open');
    setTimeout(() => document.getElementById('aishaWizardBtn')?.click(), 150);
  });

  function sendMini() {
    const input = document.getElementById('aishaMiniInput');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    if (_processAishaInput) {
      _processAishaInput(text);
      setTimeout(renderMiniChat, 100);
    }
  }

  document.getElementById('aishaMiniSend')?.addEventListener('click', sendMini);
  document.getElementById('aishaMiniInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMini(); });
}

/* ═══════════════════════════════════════
   AISHA: MODE SELECTOR
═══════════════════════════════════════ */
function openAishaSelector(brandId, campId) {
  document.getElementById('aishaSelector')?.remove();
  document.getElementById('aishaSheet')?.remove(); // avoid duplicate IDs in DOM

  const rBrandId = brandId || BRANDS[0]?.id;
  const rCampId  = campId  || getBrand(rBrandId)?.campaigns?.[0]?.id;

  const overlay = document.createElement('div');
  overlay.id = 'aishaSelector';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:300;background:#0a0a0f;display:flex;flex-direction:column;overflow:hidden';

  const sendSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

  overlay.innerHTML = `
    <div id="aishaImgWrap" style="position:relative;flex:1;min-height:0;background-color:#1a0a2e;background-image:url('img/aisha.jpeg');background-size:cover;background-position:center top;transition:flex .3s ease">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,transparent 25%,rgba(10,10,15,0.6) 65%,#0a0a0f 100%)"></div>
      <button id="aishaSelectorClose" style="position:absolute;top:calc(16px + env(safe-area-inset-top,0px));right:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
      <div id="aishaTitleWrap" style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px 16px;text-align:center;transition:opacity .2s">
        <div style="font-size:54px;font-weight:900;font-style:italic;background:linear-gradient(135deg,#c8a0ff 0%,#9055e5 60%,#6c28d9 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-1px;line-height:1">Ai'SHA</div>
        <div style="color:rgba(255,255,255,0.45);font-size:10px;font-weight:700;letter-spacing:3.5px;margin-top:5px">CREATIVE DIRECTOR AI</div>
      </div>
    </div>

    <div id="aishaModePanel" style="padding:16px 20px calc(32px + env(safe-area-inset-bottom,0px));background:#0a0a0f;display:flex;flex-direction:column;gap:10px">
      <button id="aishaVoiceBtn" style="width:100%;background:rgba(124,58,173,0.15);border:1px solid rgba(180,120,255,0.2);border-radius:16px;padding:16px 18px;display:flex;align-items:center;gap:14px;cursor:pointer;text-align:left">
        <div style="width:44px;height:44px;border-radius:12px;background:rgba(124,58,173,0.25);border:1px solid rgba(180,120,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </div>
        <div style="flex:1">
          <div style="color:#fff;font-size:15px;font-weight:700">Chat with Aisha</div>
          <div style="color:rgba(255,255,255,0.35);font-size:12px;margin-top:2px">Voice conversation</div>
        </div>
        <div style="background:rgba(124,58,173,0.3);border:1px solid rgba(180,120,255,0.25);border-radius:100px;padding:4px 10px;color:#c8a0ff;font-size:10px;font-weight:700;letter-spacing:0.5px;flex-shrink:0">SOON</div>
      </button>
      <button id="aishaTextBtn" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px 18px;display:flex;align-items:center;gap:14px;cursor:pointer;text-align:left">
        <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div style="flex:1">
          <div style="color:#fff;font-size:15px;font-weight:700">Ask Aisha</div>
          <div style="color:rgba(255,255,255,0.35);font-size:12px;margin-top:2px">Text chat</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <div id="aishaChatPanel" style="display:none;flex-direction:column;background:#0a0a0f;flex:0 0 62%">
      <div style="display:flex;align-items:center;padding:10px 16px 8px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0">
        <button id="aishaBackToModes" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:15px;cursor:pointer;padding:4px 12px 4px 0;display:flex;align-items:center;gap:4px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style="flex:1;text-align:center;color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:2px;margin-right:52px">ASK AISHA</div>
      </div>
      <div id="aishaChat" class="aisha-chat"></div>
      <div id="aishaOptsWrap" class="aisha-opts-wrap" style="display:none">
        <div id="aishaOptsGrid" class="aisha-opts-grid"></div>
        <button id="aishaOptsDone" class="aisha-opts-done" style="display:none">Done ›</button>
      </div>
      <div class="aisha-input-row">
        <input id="aishaInput" class="aisha-input" type="text" placeholder="Ask Aisha about this campaign…" style="font-size:16px">
        <button id="aishaSendBtn" class="aisha-send" type="button">${sendSVG}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const imgWrap   = overlay.querySelector('#aishaImgWrap');
  const titleWrap = overlay.querySelector('#aishaTitleWrap');
  const modePanel = overlay.querySelector('#aishaModePanel');
  const chatPanel = overlay.querySelector('#aishaChatPanel');
  let chatBound = false;

  function showChat() {
    imgWrap.style.flex = '0 0 36%';
    titleWrap.style.opacity = '0';
    modePanel.style.display = 'none';
    chatPanel.style.display = 'flex';
    if (!chatBound) {
      chatBound = true;
      if (rBrandId && rCampId) {
        const b = getBrand(rBrandId);
        const c = (b?.campaigns || []).find(x => x.id === rCampId);
        if (b && c) bindAisha(b, c, rBrandId, rCampId);
      }
    }
    setTimeout(() => overlay.querySelector('#aishaInput')?.focus(), 150);
  }

  function showModes() {
    imgWrap.style.flex = '1';
    titleWrap.style.opacity = '';
    modePanel.style.display = 'flex';
    chatPanel.style.display = 'none';
  }

  overlay.querySelector('#aishaSelectorClose')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#aishaVoiceBtn')?.addEventListener('click', () => { overlay.remove(); openAishaVoice(); });
  overlay.querySelector('#aishaTextBtn')?.addEventListener('click', showChat);
  overlay.querySelector('#aishaBackToModes')?.addEventListener('click', showModes);
}

function openAishaVoice() {
  document.getElementById('aishaVoice')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'aishaVoice';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:310;background:#0a0a0f;display:flex;flex-direction:column';

  const bars = Array.from({ length: 22 }, (_, i) => {
    const h = 8 + Math.abs(Math.sin(i * 0.7 + 1) * 18);
    return `<div style="width:3px;border-radius:2px;background:rgba(124,58,173,${0.25 + (i % 4) * 0.12});height:${h}px"></div>`;
  }).join('');

  overlay.innerHTML = `
    <div style="position:relative;flex:1;min-height:0;background-color:#1a0a2e;background-image:url('img/aisha.jpeg');background-size:cover;background-position:center top">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.25) 0%,transparent 30%,rgba(10,10,15,0.75) 70%,#0a0a0f 100%)"></div>
      <button id="aishaVoiceBack" style="position:absolute;top:calc(16px + env(safe-area-inset-top,0px));left:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center">‹</button>
    </div>
    <div style="padding:20px 24px calc(48px + env(safe-area-inset-bottom,0px));background:#0a0a0f;display:flex;flex-direction:column;align-items:center;gap:18px">
      <div style="color:rgba(255,255,255,0.35);font-size:12px;letter-spacing:1px">Aisha is listening…</div>
      <div style="display:flex;align-items:center;gap:3px;height:36px">${bars}</div>
      <button disabled style="width:68px;height:68px;border-radius:50%;background:rgba(124,58,173,0.2);border:2px solid rgba(180,120,255,0.2);display:flex;align-items:center;justify-content:center;cursor:not-allowed;opacity:0.45">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c8a0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      </button>
      <div style="color:rgba(200,160,255,0.45);font-size:11px;font-weight:600;letter-spacing:1px">COMING SOON</div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#aishaVoiceBack')?.addEventListener('click', () => overlay.remove());
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
  const nextMarker  = (campaign.mileMarkers || []).filter(m => !m.done).sort((a,b) => (a.date||'9') < (b.date||'9') ? -1 : 1)[0];
  const upcomingVal = stageIndex <= 1
    ? 'Waiting for plan'
    : (brand.board?.ready?.[0]?.title || brand.board?.drafting?.[0]?.title || 'No posts queued');
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
    instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
    tiktok:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.38a8.26 8.26 0 004.83 1.55V7.48a4.85 4.85 0 01-1.06-.79z"/></svg>`,
    youtube:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 8.5 16 12 10 15.5" fill="currentColor" stroke="none"/></svg>`,
    threads:   `<svg width="20" height="20" viewBox="0 0 192 192" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M141.537 88.988a73.5 73.5 0 00-2.667-.617c-1.598-6.718-5.03-12.505-10.287-17.203C118.786 62.027 106.48 57.5 92 57.5c-18.42 0-30.4 7.12-38.387 21.887l14.84 10.107C74.13 80.127 81.78 75.6 92 75.6c9.247 0 15.44 2.573 18.78 5.953 1.898 1.927 3.254 4.204 4.073 6.674a68.5 68.5 0 00-15.64-.7c-24.28 1.4-39.9 15.587-39.9 35.187 0 11.38 6.013 22.1 16.52 28.207 8.307 4.827 18.74 5.547 27.747 1.893 10.673-4.267 17.247-13.16 19.38-26.587 2.18 1.313 3.993 2.887 5.373 4.693 3.347 4.373 3.26 11.52 3.26 11.52l16.207-.607s.16-9.413-4.293-17.487c-2.387-4.333-5.733-7.72-9.573-10.16zm-33.893 30.94c-3.68 7.427-10.367 11.733-20.107 11.64-8.88-.094-14.607-4.454-14.607-11.127 0-9.267 8.293-14.787 22.48-15.587 4.64-.267 9.14-.067 13.44.547-.5 6.573-1.24 10.813-1.24 14.5z"/></svg>`,
    twitter:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    email:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`,
    linkedin:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="8" y1="10" x2="8" y2="18"/><circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none"/><path d="M12 18v-5c0-1.1.9-2 2-2s2 .9 2 2v5"/><line x1="12" y1="10" x2="12" y2="18"/></svg>`,
    patreon:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="14.5" cy="10" r="6"/><line x1="5" y1="2" x2="5" y2="22"/></svg>`,
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
  const campPlatformStr = (campaign.ov_platforms || '').trim();
  const activePlatforms = campPlatformStr
    ? campPlatformStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : Object.keys(brand.platformStrategy || {});
  const globeSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`;
  const allCard = `
    <div class="camp-analytics-item" id="campAnalyticsAllBtn" style="cursor:pointer">
      <div class="camp-analytics-icon">${globeSVG}</div>
      <div class="camp-analytics-count" style="font-size:11px;letter-spacing:0.5px">ALL</div>
    </div>`;
  const analyticsItemsHTML = activePlatforms.length ? activePlatforms.map(p => {
    const m    = MOCK_ANALYTICS[p] || { count:'—', delta:0 };
    const icon = PLATFORM_ICONS[p] || `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/></svg>`;
    const sign = m.delta > 0 ? '+' : '';
    const dCls = m.delta > 0 ? 'pos' : m.delta < 0 ? 'neg' : '';
    return `
      <div class="camp-analytics-item" data-href="#/analytics?brandId=${brandId}&campId=${campId}&platform=${p}" style="cursor:pointer">
        <div class="camp-analytics-icon">${icon}</div>
        <div class="camp-analytics-count">${m.count}</div>
        <div class="camp-analytics-delta ${dCls}">${m.delta ? sign + m.delta : ''}</div>
      </div>`;
  }).join('') + allCard : `<div style="color:#333;font-size:12px;padding:8px 0">Set platforms in Brand settings</div>`;


  // Brand overview for snapshot
  const ov = brand.overview || {};
  const pillarsHTML = (ov.contentPillars || []).map(p => `<span class="notion-pillar">${p}</span>`).join('');

  // Campaign Overview card: brand keyword pills
  const kwPillsHTML = (ov.keywords || []).map(k => `<span class="camp-kw-pill">${escHtml(k)}</span>`).join('');

  // Marketing Snapshot: per-platform expandable rows
  const MKTG_PLAT_NAMES = {
    instagram:'Instagram', tiktok:'TikTok', youtube:'YouTube',
    threads:'Threads', twitter:'X / Twitter', linkedin:'LinkedIn', email:'Email',
  };
  const mktgChevSVG = `<svg class="camp-mktg-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>`;
  const FORMAT_MEDIA = {
    'reels':        'video',
    'carousels':    'image',
    'stories':      'image / video',
    'text posts':   'text',
    'quote threads':'text',
    'polls':        'interactive',
    'threads':      'text',
    'long-form':    'video',
    'shorts':       'video',
    'live streams': 'video',
    'lives':        'video',
    'mini-docs':    'video',
    'vlogs':        'video',
    'interviews':   'video',
    'talking head': 'video · voiceover',
    'animation':    'animation',
    'voiceover':    'video · voiceover',
    'pov':          'video · voiceover',
  };

  const mktgPlatformRows = Object.entries(brand.platformStrategy || {}).map(([pKey, pData]) => {
    const icon = (PLATFORM_ICONS[pKey] || '').replace(/width="20" height="20"/g, 'width="18" height="18"');
    const name = MKTG_PLAT_NAMES[pKey] || (pKey.charAt(0).toUpperCase() + pKey.slice(1));
    const themes = pData.themes || [];
    const formatsHTML = (pData.formats || []).map((f, i) => {
      const media = FORMAT_MEDIA[f.toLowerCase()] || '';
      return `<button class="camp-mktg-fmt" type="button" data-fmt-idx="${i}" data-media="${escHtml(media)}">${escHtml(f)}</button>`;
    }).join('');
    return `
      <div class="camp-mktg-row" data-themes="${escHtml(JSON.stringify(themes))}">
        <div class="camp-mktg-row-hd">
          <div class="camp-mktg-row-left">
            <div class="camp-mktg-row-icon">${icon}</div>
            <span class="camp-mktg-row-name">${escHtml(name)}</span>
          </div>
          ${mktgChevSVG}
        </div>
        <div class="camp-mktg-row-body" style="display:none">
          ${formatsHTML ? `<div class="camp-mktg-fmts">${formatsHTML}</div>` : ''}
          <div class="camp-mktg-theme-preview" style="display:none"></div>
        </div>
      </div>`;
  }).join('');
  const MKTG_EMAIL_ICON  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`;
  const MKTG_EVENTS_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const mktgExtraRows = [
    { key:'email',  icon: MKTG_EMAIL_ICON,  name:'Email' },
    { key:'events', icon: MKTG_EVENTS_ICON, name:'Events & Meetups' },
  ].map(({ icon, name }) => `
    <div class="camp-mktg-row">
      <div class="camp-mktg-row-hd">
        <div class="camp-mktg-row-left">
          <div class="camp-mktg-row-icon" style="color:rgba(255,255,255,0.35)">${icon}</div>
          <span class="camp-mktg-row-name">${name}</span>
        </div>
        ${mktgChevSVG}
      </div>
      <div class="camp-mktg-row-body" style="display:none">
        <div class="camp-mktg-empty-hint">No strategy added yet</div>
      </div>
    </div>`).join('');
  const mktgSnapshotHTML = mktgPlatformRows + mktgExtraRows;

  const heroImgStyle = campaign.heroImage ? `background-image:url(${campaign.heroImage})` : '';

  const daysLeftLabel = (() => {
    const iso = toDateInputVal(campaign.endDate);
    if (!iso) return null;
    const [y, mo, d] = iso.split('-').map(Number);
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.ceil((new Date(y, mo - 1, d) - today) / 86400000);
    if (diff < 0) return { label: 'Campaign ended', cls: 'red' };
    if (diff === 0) return { label: 'Last day', cls: 'red' };
    const cls = diff > 100 ? 'green' : diff > 25 ? 'yellow' : 'red';
    return { label: `${diff} day${diff === 1 ? '' : 's'} left`, cls };
  })();

  return `
    <div class="page" style="padding-bottom:120px">

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
          ${daysLeftLabel ? `<div class="camp-hero-days-pill camp-hero-days-${daysLeftLabel.cls}">${daysLeftLabel.label}</div>` : ''}
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
        <div class="camp-hero-next" style="margin-bottom:6px">
          <div class="camp-hero-next-label">STAGE</div>
        </div>
        <div class="camp-hero-stages" id="campStageTracker">
          ${stageTrackerHTML}
        </div>
        ${(() => {
          const markers = campaign.mileMarkers || [];
          if (!markers.length) return '';
          const checkSVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          // Color matches the campaign days-left pill so both indicators stay in sync
          const _cls = daysLeftLabel?.cls || 'green';
          const cardBg     = _cls === 'green'  ? '#009B48'              : _cls === 'yellow' ? 'rgba(255,204,0,0.88)' : 'rgba(255,69,58,0.9)';
          const cardBorder = _cls === 'green'  ? '#00c860'              : _cls === 'yellow' ? 'rgba(255,204,0,1)'    : 'rgba(255,69,58,1)';
          const undone = markers.filter(m => !m.done).sort((a,b) => (a.date||'9') < (b.date||'9') ? -1 : 1);
          const done   = markers.filter(m =>  m.done);
          const sorted = [...undone, ...done];
          return `
            <div style="padding-top:12px">
              <div class="camp-hero-next-label" style="margin-bottom:6px">MILE MARKERS</div>
              <div class="camp-mile-next" style="background:${cardBg};border-color:${cardBorder};padding:0;overflow:hidden">
                ${sorted.map((m, i) => `
                  <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;${i < sorted.length-1 ? 'border-bottom:1px solid rgba(255,255,255,0.12);' : ''}${m.done ? 'opacity:0.4;' : ''}">
                    <button type="button" class="campHeroCheckBtn" data-marker-id="${m.id}"
                      style="width:22px;height:22px;border-radius:100px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)">
                      ${m.done ? checkSVG : ''}
                    </button>
                    <div style="flex:1;min-width:0">
                      <div class="camp-mile-next-text"${m.done ? ' style="text-decoration:line-through"' : ''}>${escHtml(m.text)}</div>
                      ${m.date ? `<div class="camp-mile-next-eta">ETA ${fromDateInputVal(m.date)}</div>` : ''}
                    </div>
                  </div>`).join('')}
              </div>
            </div>`;
        })()}
        })()}
      </div>

      <div style="padding:0 16px;padding-top:14px">

        <!-- Analytics bar -->
        <div class="camp-analytics">
          <div class="camp-analytics-row">${analyticsItemsHTML}</div>
        </div>

        <!-- CAMPAIGN OVERVIEW -->
        <div class="section-card" style="margin-bottom:10px">
          <div class="camp-card-label">CAMPAIGN OVERVIEW</div>
          ${(campaign.startDate || campaign.endDate) ? `<div class="camp-ov-dates">${escHtml(campaign.startDate || '')}${campaign.startDate && campaign.endDate ? ' – ' : ''}${escHtml(campaign.endDate || '')}</div>` : ''}
          <div class="camp-ov-body${campaign.ov_objective ? '' : ' camp-ov-empty'}">${escHtml(campaign.ov_objective || 'No objective set yet. Tap Edit Document to fill in the details.')}</div>
          ${(campaign.ov_offers || []).length ? `<div class="camp-ov-offer-row"><span class="camp-ov-offer-label">OFFERS</span><div class="camp-ov-offer-list">${(campaign.ov_offers || []).map(o => `<div class="camp-ov-offer-item">${escHtml(o)}</div>`).join('')}</div></div>` : ''}
          ${campaign.ov_cta ? `<div class="camp-ov-cta-row"><span class="camp-ov-cta-label">CTA</span><span class="camp-ov-cta-val">${escHtml(campaign.ov_cta)}</span></div>` : ''}
          <div class="camp-ov-btns">
            <button class="camp-ov-btn-out" id="campInfoDocBtn">Open Document</button>
            <button class="camp-ov-btn-solid" id="campEditDocBtn">Edit Document</button>
          </div>
        </div>

        <!-- MARKETING SNAPSHOT -->
        <div class="section-card" style="margin-bottom:10px">
          <div class="camp-card-label">MARKETING SNAPSHOT</div>
          <div id="campMktgPlatforms">${mktgSnapshotHTML}</div>
        </div>


        <!-- BRAND SNAPSHOT -->
        <div class="section-card" style="margin-bottom:10px">
          <div class="camp-card-label">BRAND SNAPSHOT</div>
          ${ov.mission ? `<div class="camp-brand-snap-text">${escHtml(ov.mission)}</div>` : ''}
          ${(ov.keywords || []).length ? `<div class="camp-kw-pills">${(ov.keywords || []).map(k => `<span class="camp-kw-pill">${escHtml(k)}</span>`).join('')}</div>` : ''}
          <button class="camp-view-details-btn" id="campBrandViewDetails">View Details ›</button>
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

  // ── All-platforms grid overlay ──────────────────────────────────────────
  document.getElementById('campAnalyticsAllBtn')?.addEventListener('click', () => {
    document.getElementById('analyticsAllOverlay')?.remove();

    const PLAT_ICONS = {
      instagram: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
      tiktok:    `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.38a8.26 8.26 0 004.83 1.55V7.48a4.85 4.85 0 01-1.06-.79z"/></svg>`,
      youtube:   `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 8.5 16 12 10 15.5" fill="currentColor" stroke="none"/></svg>`,
      threads:   `<svg width="28" height="28" viewBox="0 0 192 192" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M141.537 88.988a73.5 73.5 0 00-2.667-.617c-1.598-6.718-5.03-12.505-10.287-17.203C118.786 62.027 106.48 57.5 92 57.5c-18.42 0-30.4 7.12-38.387 21.887l14.84 10.107C74.13 80.127 81.78 75.6 92 75.6c9.247 0 15.44 2.573 18.78 5.953 1.898 1.927 3.254 4.204 4.073 6.674a68.5 68.5 0 00-15.64-.7c-24.28 1.4-39.9 15.587-39.9 35.187 0 11.38 6.013 22.1 16.52 28.207 8.307 4.827 18.74 5.547 27.747 1.893 10.673-4.267 17.247-13.16 19.38-26.587 2.18 1.313 3.993 2.887 5.373 4.693 3.347 4.373 3.26 11.52 3.26 11.52l16.207-.607s.16-9.413-4.293-17.487c-2.387-4.333-5.733-7.72-9.573-10.16zm-33.893 30.94c-3.68 7.427-10.367 11.733-20.107 11.64-8.88-.094-14.607-4.454-14.607-11.127 0-9.267 8.293-14.787 22.48-15.587 4.64-.267 9.14-.067 13.44.547-.5 6.573-1.24 10.813-1.24 14.5z"/></svg>`,
      twitter:   `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      email:     `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`,
      linkedin:  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="8" y1="10" x2="8" y2="18"/><circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none"/><path d="M12 18v-5c0-1.1.9-2 2-2s2 .9 2 2v5"/><line x1="12" y1="10" x2="12" y2="18"/></svg>`,
      patreon:   `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="14.5" cy="10" r="6"/><line x1="5" y1="2" x2="5" y2="22"/></svg>`,
    };
    const PLAT_COLORS = {
      instagram: 'rgba(197,0,96,0.28)',  tiktok: 'rgba(0,155,149,0.28)',
      youtube:   'rgba(204,0,0,0.28)',   threads: 'rgba(0,80,208,0.28)',
      twitter:   'rgba(0,68,187,0.28)',  email:   'rgba(116,174,0,0.28)',
      linkedin:  'rgba(0,61,181,0.28)',  patreon: 'rgba(224,48,0,0.28)',
    };
    const PLAT_NAMES = {
      instagram:'Instagram', tiktok:'TikTok', youtube:'YouTube',
      threads:'Threads', twitter:'X / Twitter', linkedin:'LinkedIn',
      email:'Email', patreon:'Patreon',
    };
    const MOCK = {
      instagram:{ count:'2.8K', delta:+127 }, tiktok:{ count:'8.9K', delta:-12 },
      youtube:  { count:'1.2K', delta:+89  }, threads:{ count:'456',  delta:+67 },
      twitter:  { count:'1.1K', delta:+34  }, email:  { count:'892',  delta:+45 },
      linkedin: { count:'234',  delta:+11  }, patreon:{ count:'78',   delta:+3  },
    };

    const campPlatStr = (campaign.ov_platforms || '').trim();
    const platList = campPlatStr
      ? campPlatStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : Object.keys(brand.platformStrategy || {});

    const gridCards = platList.map(p => {
      const m = MOCK[p] || { count:'—', delta:0 };
      const icon = PLAT_ICONS[p] || `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/></svg>`;
      const bg = PLAT_COLORS[p] || 'rgba(255,255,255,0.06)';
      const name = PLAT_NAMES[p] || p;
      const sign = m.delta > 0 ? '+' : '';
      const dColor = m.delta > 0 ? '#34c759' : m.delta < 0 ? '#ff3b30' : 'rgba(255,255,255,0.3)';
      return `
        <div style="aspect-ratio:1;border-radius:18px;background:${bg};border:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:12px">
          <div style="color:rgba(255,255,255,0.75)">${icon}</div>
          <div style="font-size:22px;font-weight:700;color:#fff;line-height:1">${m.count}</div>
          <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.8px;text-transform:uppercase;text-align:center">${name}</div>
          ${m.delta ? `<div style="font-size:11px;font-weight:700;color:${dColor}">${sign}${m.delta}</div>` : ''}
        </div>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'analyticsAllOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:350;background:#000;display:flex;flex-direction:column';
    overlay.innerHTML = `
      <div style="display:flex;align-items:center;padding:calc(env(safe-area-inset-top,0px) + 14px) 20px 14px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0">
        <button id="analyticsAllBack" style="background:none;border:none;color:rgba(255,255,255,0.7);font-size:28px;line-height:1;padding:0;margin-right:16px;cursor:pointer">‹</button>
        <div style="font-size:17px;font-weight:700;color:#fff">All Platforms</div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:16px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${gridCards}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#analyticsAllBack').addEventListener('click', () => overlay.remove());
  });

  // ── Body-level sheets (avoid iOS fixed-inside-scroll bug) ──────────────
  // Remove any sheets left over from a previous campaign page visit
  document.getElementById('campMoreSheet')?.remove();
  document.getElementById('aishaSheet')?.remove();
  document.getElementById('campInfoSheet')?.remove();
  document.getElementById('campPlanSheet')?.remove();

  // Inject settings full-screen page
  const moreEl = document.createElement('div');
  moreEl.id = 'campMoreSheet';
  moreEl.style.cssText = 'position:fixed;inset:0;z-index:300;background:#000;display:none;flex-direction:column';

  // ALL_PLATFORMS is defined at module scope
  const activePlats = (campaign.ov_platforms || '').split(',').map(s => s.trim()).filter(Boolean);

  const existingMarkers = campaign.mileMarkers || [];
  const mileRowsHTML = existingMarkers.map(m => `
    <div class="settings-mile-row" data-marker-id="${m.id}" data-text="${escHtml(m.text||'')}" data-date="${m.date||''}">
      <div class="mile-swipe-actions">
        <button type="button" class="mile-edit-btn" aria-label="Edit"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button type="button" class="mile-del-btn" aria-label="Delete"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
      </div>
      <div class="mile-swipe-content">
        <span class="settings-mile-name">${escHtml(m.text||'')}</span>
        <span class="settings-mile-eta">${m.date ? fromDateInputVal(m.date) : '—'}</span>
      </div>
    </div>`).join('');

  moreEl.innerHTML = `
    <!-- Top nav bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:calc(env(safe-area-inset-top,0px) + 14px) 20px 14px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0">
      <button id="campSettingsCancel" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:16px;font-weight:500;padding:0;min-width:64px;text-align:left">Cancel</button>
      <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:-0.3px">Settings</div>
      <button id="campSettingsSave" style="background:none;border:none;color:#fff;font-size:16px;font-weight:700;padding:0;min-width:64px;text-align:right">Done</button>
    </div>

    <!-- Scrollable content -->
    <div style="flex:1;overflow-y:auto;overscroll-behavior:contain;padding:0 20px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))">

      <!-- COVER PHOTO -->
      <div style="padding:20px 0 16px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.4px;color:rgba(255,255,255,0.3);margin-bottom:12px">COVER PHOTO</div>
        <button id="campMoreChangeCover" style="width:100%;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.06);border:none;color:#fff;font-size:15px;font-weight:500;text-align:left">Change Cover Photo</button>
      </div>

      <!-- SOCIAL MEDIA -->
      <div style="padding:20px 0 16px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.4px;color:rgba(255,255,255,0.3);margin-bottom:12px">SOCIAL MEDIA</div>
        <input type="hidden" id="settingsPlatforms" value="${campaign.ov_platforms||''}">
        <div id="settingsPlatformPills" style="display:flex;flex-wrap:wrap;gap:8px">
          ${ALL_PLATFORMS.map(p => `
            <button type="button" class="platform-pill${activePlats.includes(p)?' active':''}" data-platform="${p}">${p}</button>
          `).join('')}
        </div>
        <button id="campSettingsSetupLink" type="button" style="margin-top:14px;background:none;border:none;padding:0;color:rgba(255,255,255,0.35);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 4.93A10 10 0 0 1 4.93 19.07"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
          Set up platform accounts
        </button>
      </div>

      <!-- MILE MARKERS -->
      <div style="padding:20px 0 16px">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.4px;color:rgba(255,255,255,0.3);margin-bottom:12px">MILE MARKERS</div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:2px">
          <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.22);letter-spacing:0.8px">NAME</span>
          <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.22);letter-spacing:0.8px">ETA</span>
        </div>
        <div id="settingsMileList">${mileRowsHTML}</div>
        <button type="button" id="settingsMileAddBtn" style="width:100%;padding:12px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.1);color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin-top:10px;cursor:pointer">+ Add Marker</button>
      </div>

    </div>`;
  document.body.appendChild(moreEl);

  // ── Settings sheet bindings ──
  const settingsMileList   = moreEl.querySelector('#settingsMileList');
  const settingsAddBtn     = moreEl.querySelector('#settingsMileAddBtn');
  const settingsSaveBtn    = moreEl.querySelector('#campSettingsSave');
  const settingsPlatHidden = moreEl.querySelector('#settingsPlatforms');

  function openMileModal(prefillName, prefillDate, onSave) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
    modal.innerHTML = `
      <div style="background:#1c1c1e;border-radius:20px;width:calc(100% - 48px);max-width:360px;padding:24px;border:1px solid rgba(255,255,255,0.1)">
        <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:20px">Enter Mile Marker</div>
        <div style="margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.8px;margin-bottom:6px">NAME</div>
          <input id="mileModalName" type="text" placeholder="Milestone name" class="notion-input" style="width:100%;font-size:15px;box-sizing:border-box" value="${escHtml(prefillName||'')}">
        </div>
        <div style="margin-bottom:20px">
          <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.8px;margin-bottom:6px">ETA</div>
          <input id="mileModalDate" type="date" class="notion-input notion-date" style="width:100%;color-scheme:dark;box-sizing:border-box" value="${prefillDate||''}">
        </div>
        <div style="display:flex;gap:10px">
          <button id="mileModalCancel" style="flex:1;padding:12px;border-radius:12px;background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);font-size:15px;font-weight:600;cursor:pointer">Cancel</button>
          <button id="mileModalSave" style="flex:1;padding:12px;border-radius:12px;background:#fff;border:none;color:#000;font-size:15px;font-weight:700;cursor:pointer">Save</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    setTimeout(() => modal.querySelector('#mileModalName').focus(), 50);
    modal.querySelector('#mileModalCancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#mileModalSave').addEventListener('click', () => {
      const name = modal.querySelector('#mileModalName').value.trim();
      const date = modal.querySelector('#mileModalDate').value;
      if (!name) return;
      modal.remove();
      onSave(name, date);
    });
  }

  function buildMileRow(id, name, date) {
    const row = document.createElement('div');
    row.className = 'settings-mile-row';
    row.dataset.markerId = id;
    row.dataset.text = name;
    row.dataset.date = date;
    row.innerHTML = `
      <div class="mile-swipe-actions">
        <button type="button" class="mile-edit-btn" aria-label="Edit"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button type="button" class="mile-del-btn" aria-label="Delete"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
      </div>
      <div class="mile-swipe-content">
        <span class="settings-mile-name">${escHtml(name)}</span>
        <span class="settings-mile-eta">${date ? fromDateInputVal(date) : '—'}</span>
      </div>`;
    bindMileSwipe(row);
    return row;
  }

  function bindMileSwipe(row) {
    const content = row.querySelector('.mile-swipe-content');
    const ACTIONS_W = 90;
    let startX = 0, startY = 0, revealed = false, dragging = false;

    content.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dragging = true;
      content.style.transition = 'none';
    }, { passive: true });

    content.addEventListener('touchmove', e => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!revealed && Math.abs(dy) > Math.abs(dx)) return;
      const base = revealed ? -ACTIONS_W : 0;
      const offset = Math.min(0, Math.max(-ACTIONS_W, base + dx));
      content.style.transform = `translateX(${offset}px)`;
    }, { passive: true });

    content.addEventListener('touchend', e => {
      if (!dragging) return;
      dragging = false;
      content.style.transition = 'transform 0.22s ease';
      const dx = e.changedTouches[0].clientX - startX;
      if (!revealed && dx < -50) {
        content.style.transform = `translateX(-${ACTIONS_W}px)`;
        revealed = true;
      } else if (revealed && dx > 50) {
        content.style.transform = 'translateX(0)';
        revealed = false;
      } else {
        content.style.transform = revealed ? `translateX(-${ACTIONS_W}px)` : 'translateX(0)';
      }
    }, { passive: true });

    row.querySelector('.mile-edit-btn')?.addEventListener('click', () => {
      content.style.transition = 'transform 0.22s ease';
      content.style.transform = 'translateX(0)';
      revealed = false;
      openMileModal(row.dataset.text, row.dataset.date, (name, date) => {
        row.dataset.text = name;
        row.dataset.date = date;
        row.querySelector('.settings-mile-name').textContent = name;
        row.querySelector('.settings-mile-eta').textContent = date ? fromDateInputVal(date) : '—';
      });
    });

    row.querySelector('.mile-del-btn')?.addEventListener('click', () => row.remove());
  }

  settingsMileList.querySelectorAll('.settings-mile-row').forEach(row => bindMileSwipe(row));

  settingsAddBtn.addEventListener('click', () => {
    openMileModal('', '', (name, date) => {
      settingsMileList.appendChild(buildMileRow(uid(), name, date));
    });
  });

  // Platform pill → open account info modal
  const updatePlatHidden = () => {
    settingsPlatHidden.value = Array.from(moreEl.querySelectorAll('#settingsPlatformPills .platform-pill.active'))
      .map(p => p.dataset.platform).join(', ');
  };

  moreEl.querySelectorAll('#settingsPlatformPills .platform-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      updatePlatHidden();
    });
  });

  moreEl.querySelector('#campSettingsSetupLink')?.addEventListener('click', () => {
    openPlatformSetupSheet(brandId, moreEl);
  });

  // Save settings
  settingsSaveBtn.addEventListener('click', () => {
    const newPlatforms = settingsPlatHidden.value;
    const freshBrand = getBrand(brandId);
    const liveMarkers = (freshBrand?.campaigns||[]).find(c => c.id === campId)?.mileMarkers || [];
    const newMarkers = Array.from(settingsMileList.querySelectorAll('.settings-mile-row')).map(row => {
      const live = liveMarkers.find(m => m.id === row.dataset.markerId);
      return {
        id:   row.dataset.markerId || uid(),
        text: row.dataset.text || '',
        date: row.dataset.date || '',
        done: live?.done || false,
      };
    }).filter(m => m.text);

    const updatedCampaigns = (freshBrand?.campaigns||[]).map(c =>
      c.id === campId ? { ...c, ov_platforms: newPlatforms, mileMarkers: newMarkers } : c
    );
    saveBrandOverride(brandId, { campaigns: updatedCampaigns });
    moreEl.remove();
    document.getElementById('app').innerHTML = pageCampaign(brandId, campId);
    bindCampaignPage(brandId, campId);
  });

  // Inject Aisha sheet
  const aishaEl = document.createElement('div');
  aishaEl.className = 'aisha-sheet';
  aishaEl.id = 'aishaSheet';
  aishaEl.innerHTML = aishaBlockHTML();
  document.body.appendChild(aishaEl);
  bindAisha(brand, campaign, brandId, campId);

  // Settings page open / close
  document.getElementById('campMoreBtn')?.addEventListener('click', () => {
    moreEl.style.display = 'flex';
  });
  moreEl.querySelector('#campSettingsCancel')?.addEventListener('click', () => {
    moreEl.style.display = 'none';
  });
  moreEl.querySelector('#campMoreChangeCover')?.addEventListener('click', () => {
    moreEl.style.display = 'none';
    openEditHeroPhoto(brandId, campId, () => {
      document.getElementById('campMoreSheet')?.style.setProperty('display', 'flex');
    });
  });

  // Campaign nav (body-level so position:fixed works correctly on iOS)
  injectCampaignNav(brandId, campId, 'doc');

  // Aisha back button
  document.getElementById('aishaBackBtn')?.addEventListener('click', () => {
    aishaEl.classList.remove('open');
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

  // Mile Markers — checkpoint check-off
  function saveMileMarkers(markers) {
    const updated = brand.campaigns.map(c => c.id === campId ? { ...c, mileMarkers: markers } : c);
    saveBrandOverride(brandId, { campaigns: updated });
  }

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
          <input type="date" class="notion-input notion-date" id="campEditStart" value="${toDateInputVal(campaign.startDate)}" style="flex:1">
          <input type="date" class="notion-input notion-date" id="campEditEnd" value="${toDateInputVal(campaign.endDate)}" style="flex:1">
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
        <div class="notion-label">OFFERS</div>
        <div id="ovOffersContainer">
          ${(campaign.ov_offers || []).map(o => `
            <div class="offer-input-row">
              <input class="notion-input offer-input" value="${escHtml(o)}" placeholder="Offer name" style="font-size:16px">
              <button type="button" class="offer-remove-btn">×</button>
            </div>`).join('')}
        </div>
        <button type="button" class="offer-add-btn" id="addOfferBtn">+ Add Offer</button>
      </div>
      <div class="notion-field">
        <div class="notion-label">CALL TO ACTION</div>
        <input class="notion-input" id="ov_cta" value="${campaign.ov_cta || ''}" placeholder="What do you want people to do?">
      </div>
      <div class="notion-field">
        <div class="notion-label">TIMELINE & MILESTONES</div>
        <textarea class="notion-textarea" id="ov_timeline" placeholder="Key dates, launch moments, deadlines">${campaign.ov_timeline || ''}</textarea>
      </div>
      <div class="notion-field">
        <div class="notion-label">NOTES</div>
        <textarea class="notion-textarea" id="ov_notes" placeholder="Anything else…">${campaign.ov_notes || ''}</textarea>
      </div>
      <div class="notion-field" style="margin-bottom:20px">
        <div class="notion-label">MILE MARKERS</div>
        <div id="infoMileList">
          ${(campaign.mileMarkers || []).map(m => `
            <div class="info-mile-row" data-marker-id="${m.id}">
              <div class="info-mile-fields">
                <input class="notion-input info-mile-text" value="${escHtml(m.text)}" placeholder="Milestone name" style="font-size:15px">
                <div class="info-mile-arrival-wrap">
                  <span class="info-mile-arrival-label">Arrival Time</span>
                  <input type="date" class="notion-input notion-date info-mile-date" value="${m.date || ''}">
                </div>
              </div>
              <button type="button" class="info-mile-del">×</button>
            </div>`).join('')}
        </div>
        <button type="button" class="offer-add-btn" id="infoMileAddBtn">+ Add Marker</button>
      </div>
    </div>
    <div class="camp-form-sheet-footer">
      <button class="camp-save-btn" style="flex:1" id="campInfoSheetSave">Save Overview</button>
      <button class="camp-form-fab" id="campInfoSheetPlus" title="Ask Aisha">✦</button>
    </div>`;
  document.body.appendChild(infoSheet);

  const planSheet = document.createElement('div');
  planSheet.className = 'camp-form-sheet';
  planSheet.id = 'campPlanSheet';
  planSheet.innerHTML = `
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
      <button class="camp-form-fab" id="campPlanSheetPlus" title="Ask Aisha">✦</button>
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

  // Offers — add / remove rows
  function addOfferRow(value = '') {
    const row = document.createElement('div');
    row.className = 'offer-input-row';
    row.innerHTML = `<input class="notion-input offer-input" value="${escHtml(value)}" placeholder="Offer name" style="font-size:16px"><button type="button" class="offer-remove-btn">×</button>`;
    row.querySelector('.offer-remove-btn').addEventListener('click', () => row.remove());
    document.getElementById('ovOffersContainer')?.appendChild(row);
  }
  infoSheet.querySelectorAll('.offer-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.offer-input-row').remove());
  });
  document.getElementById('addOfferBtn')?.addEventListener('click', () => addOfferRow());

  // Mile Markers — add / remove rows
  function addMileRow(marker = null) {
    const row = document.createElement('div');
    row.className = 'info-mile-row';
    row.dataset.markerId = marker?.id || uid();
    row.innerHTML = `
      <div class="info-mile-fields">
        <input class="notion-input info-mile-text" value="${marker ? escHtml(marker.text) : ''}" placeholder="Milestone name" style="font-size:15px">
        <div class="info-mile-arrival-wrap">
          <span class="info-mile-arrival-label">Arrival Time</span>
          <input type="date" class="notion-input notion-date info-mile-date" value="${marker?.date || ''}">
        </div>
      </div>
      <button type="button" class="info-mile-del">×</button>`;
    row.querySelector('.info-mile-del').addEventListener('click', () => row.remove());
    document.getElementById('infoMileList')?.appendChild(row);
  }
  infoSheet.querySelectorAll('.info-mile-del').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.info-mile-row').remove());
  });
  document.getElementById('infoMileAddBtn')?.addEventListener('click', () => addMileRow());

  // Campaign Overview card buttons
  document.getElementById('campEditDocBtn')?.addEventListener('click', () => {
    requestAnimationFrame(() => infoSheet.classList.add('open'));
  });
  document.getElementById('campInfoDocBtn')?.addEventListener('click', () => {
    navigate(`#/doc?brandId=${brandId}&campId=${campId}&type=overview`);
  });

  // Marketing Snapshot — expand/collapse platform rows
  document.querySelectorAll('#campMktgPlatforms .camp-mktg-row').forEach(row => {
    const hd      = row.querySelector('.camp-mktg-row-hd');
    const body    = row.querySelector('.camp-mktg-row-body');
    const chev    = row.querySelector('.camp-mktg-chev');
    const preview = row.querySelector('.camp-mktg-theme-preview');
    const themes  = JSON.parse(row.dataset.themes || '[]');

    hd?.addEventListener('click', () => {
      const isOpen = body?.style.display !== 'none';
      if (body) body.style.display = isOpen ? 'none' : 'block';
      if (chev) chev.style.transform = isOpen ? '' : 'rotate(180deg)';
    });

    row.querySelectorAll('.camp-mktg-fmt').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.fmtIdx, 10);
        const media = btn.dataset.media || '';
        const wasActive = btn.classList.contains('active');
        row.querySelectorAll('.camp-mktg-fmt').forEach(b => b.classList.remove('active'));
        if (!wasActive) {
          btn.classList.add('active');
          if (preview) {
            const theme = themes[idx] || '';
            preview.innerHTML = theme
              ? `<span class="camp-mktg-preview-theme">· ${escHtml(theme)}</span>${media ? `<span class="camp-mktg-preview-media">${escHtml(media)}</span>` : ''}`
              : '';
            preview.style.display = theme ? 'flex' : 'none';
          }
        } else {
          if (preview) preview.style.display = 'none';
        }
      });
    });
  });

  // Mile marker check-off (all markers)
  document.querySelectorAll('.campHeroCheckBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mid = btn.dataset.markerId;
      const b = getBrand(brandId);
      const markers = ((b?.campaigns||[]).find(c=>c.id===campId)?.mileMarkers||[])
        .map(m => m.id === mid ? { ...m, done: !m.done } : m);
      saveMileMarkers(markers);
      document.getElementById('app').innerHTML = pageCampaign(brandId, campId);
      bindCampaignPage(brandId, campId);
    });
  });

  // Brand Snapshot "View Details" → brand page
  document.getElementById('campBrandViewDetails')?.addEventListener('click', () => {
    navigate(`#/brand?id=${brandId}`);
  });

  // Close buttons
  document.getElementById('campInfoSheetClose')?.addEventListener('click', () => {
    infoSheet.classList.remove('open');
  });
  document.getElementById('campPlanSheetClose')?.addEventListener('click', () => {
    planSheet.classList.remove('open');
  });

  // + FAB → show picker
  // ✦ button → open Aisha full-screen modal, remember which sheet to return to
  document.getElementById('campInfoSheetPlus')?.addEventListener('click', () => {
    openAishaSelector(brandId, campId);
  });
  document.getElementById('campPlanSheetPlus')?.addEventListener('click', () => {
    openAishaSelector(brandId, campId);
  });

  // Open Doc from inside sheets (auto-save first)
  document.getElementById('campInfoSheetDoc')?.addEventListener('click', () => {
    try {
      saveBrandOverride(brandId, { campaigns: brand.campaigns.map(c => c.id === campId ? { ...c,
        name: getVal('campEditName') || c.name,
        startDate: fromDateInputVal(getVal('campEditStart')) || c.startDate,
        endDate: fromDateInputVal(getVal('campEditEnd')) || c.endDate,
        ov_objective: getVal('ov_objective'),
        ov_audience:  getVal('ov_audience'),
        ov_message:   getVal('ov_message'),
        ov_platforms: getVal('ov_platforms'),
        ov_offers:    Array.from(infoSheet.querySelectorAll('.offer-input')).map(i => i.value.trim()).filter(Boolean),
        ov_cta:       getVal('ov_cta'),
        ov_timeline:  getVal('ov_timeline'),
        ov_notes:     getVal('ov_notes'),
      } : c) });
    } catch(e) {}
    document.activeElement?.blur();
    navigate(`#/doc?brandId=${brandId}&campId=${campId}&type=overview`);
  });
  document.getElementById('campPlanSheetDoc')?.addEventListener('click', () => {
    try {
      saveBrandOverride(brandId, { campaigns: brand.campaigns.map(c => c.id === campId ? { ...c,
        cp_formats:     getVal('cp_formats'),
        cp_cadence:     getVal('cp_cadence'),
        cp_pillars:     getVal('cp_pillars'),
        cp_mix:         getVal('cp_mix'),
        cp_repurposing: getVal('cp_repurposing'),
        cp_notes:       getVal('cp_notes'),
      } : c) });
    } catch(e) {}
    document.activeElement?.blur();
    navigate(`#/doc?brandId=${brandId}&campId=${campId}&type=plan`);
  });

  // Save buttons inside sheets
  document.getElementById('campInfoSheetSave')?.addEventListener('click', () => {
    const existingMarkers = (getBrand(brandId)?.campaigns||[]).find(c=>c.id===campId)?.mileMarkers || [];
    const mileMarkers = Array.from(infoSheet.querySelectorAll('.info-mile-row')).map(row => {
      const id = row.dataset.markerId;
      const existing = existingMarkers.find(m => m.id === id);
      return {
        id,
        text: row.querySelector('.info-mile-text')?.value.trim() || '',
        date: row.querySelector('.info-mile-date')?.value || '',
        done: existing?.done || false,
      };
    }).filter(m => m.text);
    const patch = {
      name:         getVal('campEditName') || campaign.name,
      startDate:    fromDateInputVal(getVal('campEditStart')) || campaign.startDate,
      endDate:      fromDateInputVal(getVal('campEditEnd'))   || campaign.endDate,
      ov_objective: getVal('ov_objective'),
      ov_audience:  getVal('ov_audience'),
      ov_message:   getVal('ov_message'),
      ov_platforms: getVal('ov_platforms'),
      ov_offers:    Array.from(infoSheet.querySelectorAll('.offer-input')).map(i => i.value.trim()).filter(Boolean),
      ov_cta:       getVal('ov_cta'),
      ov_timeline:  getVal('ov_timeline'),
      ov_notes:     getVal('ov_notes'),
      mileMarkers,
    };
    const updatedCampaigns = brand.campaigns.map(c => c.id === campId ? { ...c, ...patch } : c);
    saveBrandOverride(brandId, { campaigns: updatedCampaigns });
    infoSheet.classList.remove('open');
    document.getElementById('app').innerHTML = pageCampaign(brandId, campId);
    bindCampaignPage(brandId, campId);
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
    <div class="page" style="padding-bottom:120px">
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

// "Jun 20, 2026" → "2026-06-20"  (returns '' if unparseable)
function toDateInputVal(str) {
  if (!str) return '';
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const m = String(str).match(/([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (!m) return '';
  const mo = months.indexOf(m[1].toLowerCase().slice(0, 3));
  if (mo === -1) return '';
  const dd = String(m[2]).padStart(2, '0');
  const mm = String(mo + 1).padStart(2, '0');
  return `${m[3]}-${mm}-${dd}`;
}

// "2026-06-20" → "Jun 20, 2026"  (returns '' if empty)
function fromDateInputVal(val) {
  if (!val) return '';
  const [y, mo, d] = val.split('-').map(Number);
  if (!y || !mo || !d) return '';
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  blocks.push({ id: uid(), type: 'h2', text: 'Offers', generated: true });
  blocks.push({ id: uid(), type: 'text', text: (campaign.ov_offers || []).map(o => `• ${o}`).join('\n') || '', generated: true });
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
        <div class="doc-link-edit-row">
          <div class="doc-link-icon">${linkSVG}</div>
          <div class="doc-link-fields">
            <input class="doc-link-label" value="${escHtml(label)}" placeholder="Label" style="font-size:16px">
            <input class="doc-link-url" value="${escHtml(url)}" placeholder="https://…" type="url" style="font-size:16px">
          </div>
        </div>
        <div class="doc-link-preview-wrap"${url ? ` data-preview-url="${escHtml(url)}"` : ''}></div>
        </div>`;
    if (type === 'divider') return `<div class="doc-block doc-block-divider" data-id="${id}" data-type="divider">
        <hr class="doc-divider"></div>`;
    return '';
  }).join('');
}

/* ═══════════════════════════════════════
   ANALYTICS PAGE
═══════════════════════════════════════ */
function pageAnalytics(brandId, campId, platform) {
  const brand    = getBrand(brandId);
  if (!brand) return pageHome();
  const campaign = campId ? (brand.campaigns||[]).find(c=>c.id===campId) : null;
  const backHref = campId ? '#/' : `#/brand?id=${brandId}`;

  const PLAT_ICONS = {
    instagram: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
    tiktok:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
    youtube:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><polygon points="10 9 15 12 10 15" fill="currentColor" stroke="none"/></svg>`,
    threads:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c2 0 4-.6 5.5-1.7M12 7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5"/><path d="M17 7c1.1 1.2 1.7 2.8 1.7 4.5"/></svg>`,
    twitter:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M4 20L20 4"/></svg>`,
    linkedin:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="8" y1="11" x2="8" y2="17"/><line x1="8" y1="7" x2="8" y2="8"/><path d="M12 17v-4c0-1.1.9-2 2-2s2 .9 2 2v4"/></svg>`,
  };
  const PLAT_COLORS = {
    instagram:'#e040c8', tiktok:'#00c8bf', youtube:'#f03030',
    threads:'#5580e0',   twitter:'#4488ee', linkedin:'#0a66c2',
  };
  const PLAT_NAMES = {
    instagram:'Instagram', tiktok:'TikTok', youtube:'YouTube',
    threads:'Threads',     twitter:'X / Twitter', linkedin:'LinkedIn',
  };

  const MOCK = {
    instagram: { followers:'2.8K', followerDelta:'+127', engRate:'4.2%', reach:'11.4K', impressions:'28K', clicks:'342', posts:[
      { title:'Energy intro reel',     likes:'1.2K', comments:'48', shares:'91' },
      { title:'Founding homie CTA',    likes:'834',  comments:'29', shares:'44' },
      { title:'BTS playground setup',  likes:'611',  comments:'17', shares:'23' },
    ]},
    tiktok:    { followers:'8.9K', followerDelta:'-12',  engRate:'6.8%', reach:'34K',  impressions:'89K', clicks:'203', posts:[
      { title:'Playground tour',        likes:'3.1K', comments:'124', shares:'890' },
      { title:'What is a homie?',       likes:'2.4K', comments:'96',  shares:'441' },
      { title:'Beta lab preview',       likes:'1.8K', comments:'71',  shares:'330' },
    ]},
    youtube:   { followers:'1.2K', followerDelta:'+89',  engRate:'3.1%', reach:'5.6K', impressions:'12K', clicks:'189', posts:[
      { title:'Full intro to the playground', likes:'312', comments:'34', shares:'18' },
      { title:'Founding homie Q&A',           likes:'198', comments:'21', shares:'9'  },
    ]},
    threads:   { followers:'456',  followerDelta:'+67',  engRate:'2.9%', reach:'2.1K', impressions:'4.8K', clicks:'87', posts:[
      { title:'Daily homie dispatch',   likes:'98',  comments:'14', shares:'7'  },
      { title:'Playground philosophy',  likes:'74',  comments:'9',  shares:'4'  },
    ]},
    twitter:   { followers:'1.1K', followerDelta:'+34',  engRate:'1.8%', reach:'3.2K', impressions:'7.1K', clicks:'112', posts:[] },
    linkedin:  { followers:'890',  followerDelta:'+22',  engRate:'3.4%', reach:'4.4K', impressions:'9.2K', clicks:'228', posts:[] },
  };

  const globeSVG22 = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`;

  const isAll = platform === 'all';
  const data  = isAll ? null : (MOCK[platform] || { followers:'—', followerDelta:'', engRate:'—', reach:'—', impressions:'—', clicks:'—', posts:[] });
  const color = isAll ? '#aaa' : (PLAT_COLORS[platform] || '#fff');
  const icon  = isAll ? globeSVG22 : (PLAT_ICONS[platform] || '');
  const name  = isAll ? 'All Platforms' : (PLAT_NAMES[platform] || platform);

  // All-platforms combined view
  const allPlatformRowsHTML = isAll ? Object.entries(MOCK).map(([p, d]) => `
    <div class="analytics-all-row" data-href="#/analytics?brandId=${brandId}&campId=${campId}&platform=${p}" style="cursor:pointer">
      <div class="analytics-all-icon" style="color:${PLAT_COLORS[p]||'#aaa'}">${PLAT_ICONS[p]||''}</div>
      <div class="analytics-all-info">
        <div class="analytics-all-name">${PLAT_NAMES[p]||p}</div>
        <div class="analytics-all-stats">${d.followers} followers · ${d.engRate} eng · ${d.reach} reach</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`).join('') : '';

  const statCards = isAll ? '' : [
    { label:'Engagement Rate', value: data.engRate },
    { label:'Reach',           value: data.reach   },
    { label:'Impressions',     value: data.impressions },
    { label:'Link Clicks',     value: data.clicks  },
  ].map(s => `
    <div class="analytics-stat-card">
      <div class="analytics-stat-value">${s.value}</div>
      <div class="analytics-stat-label">${s.label}</div>
    </div>`).join('');

  const postsHTML = isAll ? '' : (data.posts.length ? data.posts.map(p => `
    <div class="analytics-post-row">
      <div class="analytics-post-title">${escHtml(p.title)}</div>
      <div class="analytics-post-stats">
        <span class="analytics-post-stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>${p.likes}</span>
        <span class="analytics-post-stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>${p.comments}</span>
        <span class="analytics-post-stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>${p.shares}</span>
      </div>
    </div>`).join('') : `<div style="color:#333;font-size:13px;padding:16px 0;text-align:center">No posts yet</div>`);

  return `
    <div class="page" style="padding-bottom:110px">
      <div class="top-header">
        <button class="icon-btn" data-href="${backHref}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top-header-title">${name}</div>
        <div style="width:36px"></div>
      </div>

      <div style="padding:20px 16px 0">
        ${isAll ? `
        <!-- All platforms list -->
        <div class="analytics-section-label" style="margin-bottom:12px">PLATFORMS</div>
        <div class="analytics-all-list">${allPlatformRowsHTML}</div>
        ` : `
        <!-- Hero metric -->
        <div class="analytics-hero" style="border-color:${color}22">
          <div class="analytics-hero-icon" style="color:${color};background:${color}18">${icon}</div>
          <div class="analytics-hero-right">
            <div class="analytics-hero-count">${data.followers}</div>
            <div class="analytics-hero-label">Followers</div>
            ${data.followerDelta ? `<div class="analytics-hero-delta${data.followerDelta.startsWith('+') ? ' pos' : ' neg'}">${data.followerDelta} this month</div>` : ''}
          </div>
        </div>
        <!-- Stat grid -->
        <div class="analytics-stat-grid">${statCards}</div>
        <!-- Post performance -->
        <div class="analytics-section-label">POST PERFORMANCE</div>
        <div class="analytics-posts">${postsHTML}</div>`}
      </div>
    </div>`;
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
    loadLinkPreviews();
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

  async function fetchAndRenderPreview(url, wrap) {
    if (!url) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = '<div class="doc-link-preview-loading">Loading preview…</div>';
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.status === 'success') {
        const d = data.data;
        const imgSrc = d.image?.url;
        let domain = '';
        try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch(e) { domain = d.publisher || ''; }
        wrap.innerHTML = `<div class="doc-link-preview-card">
          ${imgSrc ? `<img class="doc-link-preview-img" src="${escHtml(imgSrc)}" alt="" loading="lazy">` : ''}
          <div class="doc-link-preview-info">
            ${domain ? `<div class="doc-link-preview-domain">${escHtml(domain)}</div>` : ''}
            ${d.title ? `<div class="doc-link-preview-title">${escHtml(d.title)}</div>` : ''}
            ${d.description ? `<div class="doc-link-preview-desc">${escHtml(d.description)}</div>` : ''}
          </div>
        </div>`;
      } else { wrap.innerHTML = ''; }
    } catch(e) { wrap.innerHTML = ''; }
  }

  async function loadLinkPreviews() {
    document.querySelectorAll('#docContainer .doc-link-preview-wrap[data-preview-url]').forEach(wrap => {
      fetchAndRenderPreview(wrap.dataset.previewUrl, wrap);
    });
  }

  function bindBlockEvents() {
    document.querySelectorAll('#docContainer .doc-block-content').forEach(el => el.addEventListener('input', schedSave));
    document.querySelectorAll('#docContainer .doc-media-tap').forEach(el => el.addEventListener('click', () => handleMediaTap(el.dataset.id)));
    document.querySelectorAll('#docContainer .doc-link-label, #docContainer .doc-link-url').forEach(inp => inp.addEventListener('input', schedSave));
    document.querySelectorAll('#docContainer .doc-block-caption').forEach(el => el.addEventListener('input', schedSave));
    document.querySelectorAll('#docContainer .doc-link-url').forEach(inp => {
      inp.addEventListener('blur', () => {
        const wrap = inp.closest('.doc-block-link')?.querySelector('.doc-link-preview-wrap');
        if (wrap) { wrap.dataset.previewUrl = inp.value.trim(); fetchAndRenderPreview(inp.value.trim(), wrap); }
      });
    });
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
  loadLinkPreviews();
  document.getElementById('docAddBtn')?.addEventListener('click', showSectionPicker);
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
