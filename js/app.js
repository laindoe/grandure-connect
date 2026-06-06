/* ── Grandure Connect SPA ── */

const PLATFORM_ICONS = { instagram: '📸', threads: '🧵', youtube: '▶️', tiktok: '🎵', twitter: '𝕏' };

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

  bindCapture();
  bindNav();
  bindAddBrand();
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

/* ── Idea Capture Bar + Modal ── */
let captureState = { platform: '', format: '', brandId: '' };

function captureBarHTML(brandId) {
  return `
    <div class="capture-bar">
      <div class="capture-input" id="captureOpen">💡 Capture an idea…</div>
      <button class="icon-btn" id="captureOpen2">✏️</button>
    </div>
    <div class="capture-overlay" id="captureOverlay" style="display:none">
      <div class="capture-sheet">
        <div class="capture-handle"></div>
        <div class="capture-title">New Idea</div>
        <textarea class="capture-textarea" id="captureText" placeholder="What's the idea?"></textarea>
        <div class="capture-section-label">PLATFORM</div>
        <div class="capture-chips" id="capturePlatformChips">
          ${['instagram','threads','youtube','tiktok'].map(p =>
            `<button class="capture-chip" data-platform="${p}">${PLATFORM_ICONS[p] || ''} ${p}</button>`
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

function bindCapture() {
  const overlay = document.getElementById('captureOverlay');
  if (!overlay) return;

  const open = () => { overlay.style.display = 'flex'; };
  const close = () => { overlay.style.display = 'none'; };

  document.getElementById('captureOpen')?.addEventListener('click', open);
  document.getElementById('captureOpen2')?.addEventListener('click', open);
  document.getElementById('captureCancel')?.addEventListener('click', close);

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
  { label: 'Ocean',   value: 'linear-gradient(135deg, #5B9BD5, #3A7BC8)' },
  { label: 'Midnight', value: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' },
  { label: 'Cobalt',  value: 'linear-gradient(135deg, #2952CC, #1a3a99)' },
  { label: 'Forest',  value: 'linear-gradient(135deg, #1a4a2e, #2d7a4f)' },
  { label: 'Ember',   value: 'linear-gradient(135deg, #7a2020, #cc4a1a)' },
  { label: 'Plum',    value: 'linear-gradient(135deg, #4a1a7a, #7a2dcc)' },
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
                 font-family:inherit;margin-bottom:16px;outline:none;">

        <div class="capture-section-label">TAGLINE (optional)</div>
        <input id="addBrandTagline" type="text" placeholder="A short description"
          style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);
                 border-radius:14px;padding:14px;color:#fff;font-size:15px;
                 font-family:inherit;margin-bottom:16px;outline:none;">

        <div class="capture-section-label">COLOR</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
          ${BRAND_COLORS.map((c, i) => `
            <button class="add-brand-color ${i===0?'active':''}" data-color="${c.value}"
              style="width:40px;height:40px;border-radius:12px;background:${c.value};
                     border:2px solid ${i===0?'#fff':'transparent'};flex-shrink:0;">
            </button>
          `).join('')}
        </div>

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

  let selectedColor = BRAND_COLORS[0].value;

  document.getElementById('addBrandCancel')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  document.querySelectorAll('.add-brand-color').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.add-brand-color').forEach(b => b.style.border = '2px solid transparent');
      btn.style.border = '2px solid #fff';
      selectedColor = btn.dataset.color;
    });
  });

  document.getElementById('addBrandSave')?.addEventListener('click', () => {
    const name = document.getElementById('addBrandName')?.value.trim();
    if (!name) { document.getElementById('addBrandName').focus(); return; }
    const tagline = document.getElementById('addBrandTagline')?.value.trim();
    const newBrand = {
      id: String(Date.now()),
      name,
      tagline,
      banner: selectedColor,
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
    bindCapture(); bindNav(); bindAddBrand();
  });
}

function pageHome() {
  const cards = BRANDS.map(brand => {
    const statsHTML = brand.stats.map((s, i) => `
      ${i > 0 ? '<div class="stat-divider"></div>' : ''}
      <div class="stat">
        <span class="stat-icon">${PLATFORM_ICONS[s.platform] || '●'}</span>
        <span class="stat-count">${s.count}</span>
      </div>
    `).join('');

    return `
      <div class="brand-card" data-href="#/brand?id=${brand.id}">
        <div class="brand-banner" style="background:${brand.banner}">
          <div class="brand-banner-name">${brand.name}</div>
          ${brand.tagline ? `<div class="brand-banner-tagline">${brand.tagline}</div>` : ''}
        </div>
        <div class="card-bottom">
          <div class="stats-row">${statsHTML || '<span style="color:#444;font-size:12px">No platforms yet</span>'}</div>
          ${brand.stats.length ? `
          <div class="phase-divider"></div>
          <div class="phase-section">
            <div>
              <div class="phase-label">CURRENT PHASE</div>
              <div class="phase-name-small">${brand.currentPhase.name}</div>
              <div class="phase-next-small">Next: ${brand.currentPhase.next}</div>
            </div>
            <span style="color:#555;font-size:18px">›</span>
          </div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page">
      <div class="top-header">
        <div class="icon-btn">☰</div>
        <div class="logo-wrap">
          <img src="img/grandure-connect.png" alt="Grandure Connect" class="logo-img">
        </div>
        <button class="icon-btn" id="openAddBrand" style="font-size:20px;font-weight:300">＋</button>
      </div>
      <div style="padding:0 16px 20px">
        <div class="section-label">PROFILES</div>
        ${cards}
      </div>
    </div>
    ${captureBarHTML('')}
    ${addBrandSheetHTML()}
  `;
}

/* ═══════════════════════════════════════
   PAGE: BRAND WORKSPACE
═══════════════════════════════════════ */
function pageBrandWorkspace(id) {
  const brand = getBrand(id);
  if (!brand) return pageHome();

  const { currentPhase: cp } = brand;

  const sections = [
    { key: 'phase',       icon: '🎯', label: 'CURRENT PHASE',     sub: cp.name,             href: `#/phase?id=${id}` },
    { key: 'overview',    icon: '📋', label: 'BRAND OVERVIEW',    sub: 'Playbook & strategy', href: `#/overview?id=${id}` },
    { key: 'platform',    icon: '📱', label: 'PLATFORM STRATEGY', sub: brand.stats.map(s=>s.platform).join(' · '), href: `#/platform?id=${id}` },
    { key: 'season',      icon: '🌊', label: 'SEASON',            sub: brand.season.name,    href: `#/season?id=${id}` },
    { key: 'vault',       icon: '💡', label: 'IDEA VAULT',        sub: `${brand.ideas.length} ideas`,  href: `#/vault?id=${id}` },
    { key: 'inspiration', icon: '✨', label: 'INSPIRATION',       sub: `${brand.inspiration.length} saved`, href: `#/inspiration?id=${id}` },
  ];

  const sectionCards = sections.map(s => `
    <div class="section-card" data-href="${s.href}">
      <div class="section-card-header">
        <div class="section-card-title">${s.label}</div>
        <div class="section-card-right"><span>${s.sub}</span><span style="font-size:16px">›</span></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:28px">${s.icon}</span>
        ${s.key === 'phase' ? `
          <div style="flex:1">
            <div class="progress-row" style="margin-bottom:6px">
              <div class="progress-track"><div class="progress-fill" style="width:${cp.progress}%"></div></div>
              <span class="progress-pct">${cp.progress}%</span>
            </div>
            <div class="body-text" style="font-size:12px">${cp.postsCompleted}/${cp.totalPosts} posts · Ends ${cp.eosDate}</div>
          </div>
        ` : `<span class="body-text" style="font-size:13px">${s.sub}</span>`}
      </div>
    </div>
  `).join('');

  return `
    <div class="page">
      <div class="workspace-banner" style="background:${brand.banner}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <button class="gradient-back" data-href="#/">‹</button>
          <div style="text-align:center">
            <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.7)">WORKSPACE</div>
          </div>
          <div style="width:36px"></div>
        </div>
        <div style="font-size:28px;font-weight:800">${brand.name}</div>
        ${brand.tagline ? `<div style="color:rgba(255,255,255,0.8);margin-top:4px">${brand.tagline}</div>` : ''}
        <div class="workspace-banner-stats">
          ${brand.stats.map((s,i) => `
            ${i > 0 ? '<div style="width:1px;height:24px;background:rgba(255,255,255,0.2)"></div>' : ''}
            <div class="stat">
              <span class="stat-icon">${PLATFORM_ICONS[s.platform] || '●'}</span>
              <span class="stat-count">${s.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="padding:16px">
        ${sectionCards}
      </div>
    </div>
    ${captureBarHTML(id)}
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
        { key: 'ideas',    label: 'Ideas',    color: '#444', emoji: '💡' },
        { key: 'drafting', label: 'Drafting', color: '#5B9BD5', emoji: '✏️' },
        { key: 'ready',    label: 'Ready',    color: '#4CAF50', emoji: '✅' },
        { key: 'posted',   label: 'Posted',   color: '#888', emoji: '🚀' },
      ];
      return `<div class="tab-content">${cols.map(col => {
        const items = (brand.board[col.key] || []);
        return `
          <div class="board-col">
            <div class="board-col-header">
              <div class="board-dot-wrap" style="background:${col.color}22">
                <span>${col.emoji}</span>
              </div>
              <span style="font-weight:700;font-size:14px">${col.label}</span>
              <div class="board-count">${items.length}</div>
            </div>
            ${items.length ? items.map(item => `
              <div class="board-card">
                <div class="board-card-title">${item.title}</div>
                <div class="chips">
                  <span class="chip">${PLATFORM_ICONS[item.platform] || ''} ${item.platform}</span>
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
            <span style="font-size:40px">📅</span>
            <span style="color:#555;font-size:14px">No posts scheduled for this day</span>
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
    ${captureBarHTML(id)}
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

  const playSection = (icon, title, content) => `
    <div class="playbook-section">
      <div class="playbook-section-header">
        <span style="font-size:20px">${icon}</span>
        <span style="font-size:10px;letter-spacing:2px;color:#666;font-weight:600">${title}</span>
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
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1e1e1e">
      <span style="font-size:16px">→</span>
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
        ${playSection('🎯','MISSION', `<p class="body-text">${o.mission}</p>`)}
        ${playSection('📌','POSITIONING', `<p class="body-text">${o.positioning}</p>`)}
        ${playSection('👥','AUDIENCE', `<p class="body-text">${o.audience}</p>`)}
        ${playSection('🗣️','BRAND VOICE', `<p class="body-text">${o.brandVoice}</p>`)}
        ${playSection('🏛️','CONTENT PILLARS', pillarsHTML)}
        ${playSection('🔑','KEYWORDS', keywordsHTML)}
        ${playSection('💼','OFFERS', offersHTML)}
      </div>
    </div>
    ${captureBarHTML(id)}
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

  const themesHTML = strat.themes.map(t => `<span class="tag">${t}</span>`).join('');
  const formatsHTML = strat.formats.map(f => `<span class="tag">${f}</span>`).join('');
  const goalsHTML = strat.goals.map(g => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1e1e1e">
      <span style="color:#4CAF50;font-size:14px">✓</span>
      <span class="body-text">${g}</span>
    </div>
  `).join('');

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
            ${PLATFORM_ICONS[p] || ''} ${p}
          </button>
        `).join('')}
      </div>
      <div style="padding:16px">
        <div class="playbook-section">
          <div class="playbook-section-header">
            <span style="font-size:20px">🎯</span>
            <span style="font-size:10px;letter-spacing:2px;color:#666;font-weight:600">OBJECTIVE</span>
          </div>
          <div class="playbook-section-body"><p class="body-text">${strat.objective}</p></div>
        </div>
        <div class="playbook-section">
          <div class="playbook-section-header">
            <span style="font-size:20px">🎨</span>
            <span style="font-size:10px;letter-spacing:2px;color:#666;font-weight:600">CONTENT THEMES</span>
          </div>
          <div class="playbook-section-body"><div class="tags">${themesHTML}</div></div>
        </div>
        <div class="playbook-section">
          <div class="playbook-section-header">
            <span style="font-size:20px">📐</span>
            <span style="font-size:10px;letter-spacing:2px;color:#666;font-weight:600">FORMATS</span>
          </div>
          <div class="playbook-section-body"><div class="tags">${formatsHTML}</div></div>
        </div>
        <div class="playbook-section">
          <div class="playbook-section-header">
            <span style="font-size:20px">🏆</span>
            <span style="font-size:10px;letter-spacing:2px;color:#666;font-weight:600">GOALS</span>
          </div>
          <div class="playbook-section-body">${goalsHTML}</div>
        </div>
      </div>
    </div>
    ${captureBarHTML(id)}
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
    const isDone = campaigns.find(c => c.name === r)?.status === 'posted';
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
            <span style="font-size:20px">🎯</span>
            <span style="font-size:10px;letter-spacing:2px;color:#666;font-weight:600">SEASON GOAL</span>
          </div>
          <div class="playbook-section-body"><p class="body-text">${season.goal}</p></div>
        </div>
        <div class="section-label">PILLARS</div>
        <div class="season-pillars-grid" style="margin-bottom:24px">${pillarsHTML}</div>
        <div class="section-label">ROADMAP</div>
        ${roadmapHTML}
      </div>
    </div>
    ${captureBarHTML(id)}
  `;
}

/* ═══════════════════════════════════════
   PAGE: IDEA VAULT
═══════════════════════════════════════ */
function pageIdeaVault(id, filterPlatform, filterFormat) {
  const brand = getBrand(id);
  if (!brand) return pageHome();

  const platforms = [...new Set(brand.ideas.map(i => i.platform))];
  const formats = [...new Set(brand.ideas.map(i => i.format))];

  const fp = filterPlatform || 'all';
  const ff = filterFormat || 'all';

  const filtered = brand.ideas.filter(i =>
    (fp === 'all' || i.platform === fp) &&
    (ff === 'all' || i.format === ff)
  );

  const ideasHTML = filtered.length ? filtered.map(idea => `
    <div class="idea-card">
      <div class="idea-card-meta">
        <span class="chip">${PLATFORM_ICONS[idea.platform] || ''} ${idea.platform}</span>
        <span class="chip">${idea.format}</span>
      </div>
      <div class="idea-title">${idea.title}</div>
      ${idea.campaign ? `<div class="idea-campaign">📌 ${idea.campaign}</div>` : ''}
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
        <div style="color:#666;font-size:10px;letter-spacing:2px">PLATFORM</div>
        <div class="filter-chips">
          <button class="filter-chip ${fp==='all'?'active':''}" onclick="vaultFilter('${id}','all','${ff}')">All</button>
          ${platforms.map(p => `
            <button class="filter-chip ${fp===p?'active':''}" onclick="vaultFilter('${id}','${p}','${ff}')">${PLATFORM_ICONS[p] || ''} ${p}</button>
          `).join('')}
        </div>
        <div style="color:#666;font-size:10px;letter-spacing:2px;margin-top:10px">FORMAT</div>
        <div class="filter-chips">
          <button class="filter-chip ${ff==='all'?'active':''}" onclick="vaultFilter('${id}','${fp}','all')">All</button>
          ${formats.map(f => `
            <button class="filter-chip ${ff===f?'active':''}" onclick="vaultFilter('${id}','${fp}','${f}')">${f}</button>
          `).join('')}
        </div>
      </div>
      <div style="padding:16px">${ideasHTML}</div>
    </div>
    ${captureBarHTML(id)}
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
      <div class="inspiration-icon" style="background:#1e1e1e">
        ${item.type === 'note' ? '📝' : item.type === 'image' ? '🖼️' : '🔗'}
      </div>
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
          <span style="font-size:28px">＋</span>
          <span style="font-size:12px">Add inspiration</span>
        </div>
      </div>
    </div>
    ${captureBarHTML(id)}
  `;
}
