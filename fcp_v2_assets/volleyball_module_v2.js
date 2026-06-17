// ═══════════════════════════════════════════════════════════════════════
//  volleyball_module_v2.js  —  Volleyball Add-on for OBSScore V2.9.x
//
//  USAGE: Add this line at the very end of fcp_v2_assets/main.js:
//    import './volleyball_module_v2.js';
//
//  This module is an ES Module sidecar. It imports nothing from main.js
//  but runs inside the same module scope chain after main.js initialises.
//  It accesses OBS, scores, and score2 via:
//    - DOM element reads  (#scoreA, #scoreB, #score2A, #score2B)
//    - DOM button clicks  (scoreAPlusBtn, resetScoreBtn, etc.)
//    - window.fcpOBS      (exported handle, see bottom of this file)
// ═══════════════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────────────
const VB_STATE_KEY   = 'vb_state';
const VB_HISTORY_KEY = 'vb_set_history';
const VB_LIMIT_KEY   = 'vb_set_limit';
const VB_MAX_SETS_KEY = 'vb_max_sets';
const VB_FINAL_LIMIT_KEY = 'vb_final_limit';
const VB_ENABLED_KEY = 'vb_enabled';
const VB_LOGO_KEY    = 'vb_logo_url';
const VB_SERVE_KEY   = 'vb_serve';
const VB_TIMEOUTSA_KEY = 'vb_timeouts_a';
const VB_TIMEOUTSB_KEY = 'vb_timeouts_b';
const VB_FONT_KEY    = 'vb_font_family';
const VB_TEAM_WIDTH_KEY = 'vb_team_width';
const VB_AUTO_SERVE_KEY = 'vb_auto_serve';
const VB_TIMEOUT_ACTIVE_KEY = 'vb_timeout_active';
const VB_CHANNEL     = 'vb_score_channel';
const TAB_ID         = 'settingsTabVolleyball';
const POLL_MS        = 300;
const VB_SPORT_KEY   = 'vb_sport';

// ── BroadcastChannel ────────────────────────────────────────────────
let bc = null;
try { bc = new BroadcastChannel(VB_CHANNEL); } catch (_) {}

// ── State ────────────────────────────────────────────────────────────
let lastA = -1, lastB = -1, last2A = -1, last2B = -1;
let lastNA = '', lastNB = '', lastCA = '', lastCB = '', lastCA2 = '', lastCB2 = '';
let lastTimer = '', lastHalf = '', lastLabel1 = '';
let autoHiddenThisRound = false;

function getSetLimit()      { return Math.max(1, parseInt(localStorage.getItem(VB_LIMIT_KEY) || '25')); }
function saveSetLimit(v)    { localStorage.setItem(VB_LIMIT_KEY, String(v)); }
function getMaxSets()       { return Math.max(1, parseInt(localStorage.getItem(VB_MAX_SETS_KEY) || '5')); }
function saveMaxSets(v)     { localStorage.setItem(VB_MAX_SETS_KEY, String(v)); }
function getFinalSetLimit() { return Math.max(1, parseInt(localStorage.getItem(VB_FINAL_LIMIT_KEY) || '15')); }
function saveFinalSetLimit(v){ localStorage.setItem(VB_FINAL_LIMIT_KEY, String(v)); }
function loadHistory()      { try { return JSON.parse(localStorage.getItem(VB_HISTORY_KEY) || '[]'); } catch(_){ return []; } }
function saveHistory(h)     { localStorage.setItem(VB_HISTORY_KEY, JSON.stringify(h)); }
function isEnabled()        { return localStorage.getItem(VB_ENABLED_KEY) !== 'false'; }
function getVbState(k, def) { return localStorage.getItem(k) || def; }
function setVbState(k, v)   { localStorage.setItem(k, v); broadcast(); }

// ── DOM Score Readers ────────────────────────────────────────────────
function readScores() {
  const bibOverrideA = document.getElementById('bibOverrideA');
  const bibOverrideB = document.getElementById('bibOverrideB');
  const isBibActiveA = bibOverrideA && bibOverrideA.checked;
  const isBibActiveB = bibOverrideB && bibOverrideB.checked;

  const colorA = isBibActiveA ? (localStorage.getItem('bib_active_color_a') || '#84cc16') : (document.getElementById('colorA')?.value || '#1e3a8a');
  const colorB = isBibActiveB ? (localStorage.getItem('bib_active_color_b') || '#f97316') : (document.getElementById('colorB')?.value || '#7f1d1d');

  return {
    sA:  parseInt(document.getElementById('scoreA')?.textContent  ?? '0') || 0,
    sB:  parseInt(document.getElementById('scoreB')?.textContent  ?? '0') || 0,
    s2A: parseInt(document.getElementById('score2A')?.textContent ?? '0') || 0,
    s2B: parseInt(document.getElementById('score2B')?.textContent ?? '0') || 0,
    cA:  colorA,
    cB:  colorB,
    cA2: document.getElementById('colorA2')?.value || '#000000',
    cB2: document.getElementById('colorB2')?.value || '#000000',
    nA:  document.getElementById('nameA')?.textContent || 'TEAM A',
    nB:  document.getElementById('nameB')?.textContent || 'TEAM B',
  };
}

// ── Broadcast State ──────────────────────────────────────────────────
function broadcast() {
  const { sA, sB, s2A, s2B, cA, cB, cA2, cB2, nA, nB } = readScores();

  // Resolved Fonts
  const fontSrcTeam = localStorage.getItem('vb_font_src_team') || 'preset';
  let fontTeam = "'Kanit', sans-serif";
  if (fontSrcTeam === 'custom_name') {
    fontTeam = localStorage.getItem('vb_font_custom_name_team') || 'Arial, sans-serif';
  } else if (fontSrcTeam === 'upload') {
    fontTeam = localStorage.getItem('vb_font_upload_family_team') || 'CustomFontTeam';
  } else {
    fontTeam = localStorage.getItem('vb_font_preset_team') || "'Kanit', sans-serif";
  }

  const fontSrcScore = localStorage.getItem('vb_font_src_score') || 'preset';
  let fontScore = "'Barlow Condensed', sans-serif";
  if (fontSrcScore === 'custom_name') {
    fontScore = localStorage.getItem('vb_font_custom_name_score') || 'Arial, sans-serif';
  } else if (fontSrcScore === 'upload') {
    fontScore = localStorage.getItem('vb_font_upload_family_score') || 'CustomFontScore';
  } else {
    fontScore = localStorage.getItem('vb_font_preset_score') || "'Barlow Condensed', sans-serif";
  }

  const payload = {
    scoreA: sA, scoreB: sB,
    setsA: s2A, setsB: s2B,
    setHistory: loadHistory(),
    setLimit: getSetLimit(),
    maxSets: getMaxSets(),
    finalSetLimit: getFinalSetLimit(),
    colorA: cA, colorB: cB,
    colorA2: cA2, colorB2: cB2,
    nameA: nA, nameB: nB,
    logoUrl: getVbState(VB_LOGO_KEY, ''),
    serve: getVbState(VB_SERVE_KEY, ''),
    timeoutsA: parseInt(getVbState(VB_TIMEOUTSA_KEY, '0')),
    timeoutsB: parseInt(getVbState(VB_TIMEOUTSB_KEY, '0')),
    
    // Boxing state additions
    timer: document.getElementById('timerText')?.textContent || '00:00',
    half: document.getElementById('halfText')?.textContent || '1st',
    label1: (getVbState('bx_label1_type', 'auto') === 'custom') ? getVbState('bx_label1_custom_text', '') : (document.getElementById('label1')?.textContent || ''),
    logoAUrl: document.getElementById('logoA')?.style.display !== 'none' ? document.getElementById('logoA')?.src : '',
    logoBUrl: document.getElementById('logoB')?.style.display !== 'none' ? document.getElementById('logoB')?.src : '',
    
    // Boxing HUD sizing custom values
    bxLogoSize: parseInt(getVbState('bx_logo_size', '30')),
    bxNameFontSize: parseInt(getVbState('bx_name_font_size', '20')),
    bxNamePanelWidth: parseInt(getVbState('bx_name_panel_width', '350')),
    bxNamePanelHeight: parseInt(getVbState('bx_name_panel_height', '50')),
    bxTimeFontSize: parseInt(getVbState('bx_time_font_size', '35')),
    bxLabel1Width: parseInt(getVbState('bx_label1_width', '165')),
    bxLabel1FontSize: parseInt(getVbState('bx_label1_font_size', '20')),

    // Boxing settings and dash variables
    bxShowTeamLogos: getVbState('bx_show_team_logos', 'true') === 'true',
    bxShowLabel1: getVbState('bx_show_label1', 'true') === 'true',
    bxLabel1Type: getVbState('bx_label1_type', 'auto'),
    bxLabel1CustomText: getVbState('bx_label1_custom_text', ''),
    bxDashWidth: parseInt(getVbState('bx_dash_width', '25')),
    bxDashHeight: parseInt(getVbState('bx_dash_height', '6')),
    
    // Boxing HUD custom color values
    bxColorLeft: getVbState('bx_color_left', '#ef4444'),
    bxColorLeftTxt: getVbState('bx_color_left_txt', '#ffffff'),
    bxColorLeftBg: getVbState('bx_color_left_bg', '#1e293b'),
    bxColorRight: getVbState('bx_color_right', '#3b82f6'),
    bxColorRightTxt: getVbState('bx_color_right_txt', '#ffffff'),
    bxColorRightBg: getVbState('bx_color_right_bg', '#1e293b'),
    bxColorCenterBg: getVbState('bx_color_center_bg', '#ffffff'),
    bxColorTimeTxt: getVbState('bx_color_time_txt', '#020617'),
    bxColorLabel1Bg: getVbState('bx_color_label1_bg', '#020617'),
    bxColorLabel1Txt: getVbState('bx_color_label1_txt', '#e2e8f0'),
    bxColorHeaderBg: getVbState('bx_color_header_bg', '#0f172a'),
    bxColorDashActive: getVbState('bx_color_dash_active', '#fbbf24'),
    bxColorDashInactive: getVbState('bx_color_dash_inactive', '#334155'),
    
    // Split Resolved Fonts
    fontTeam: fontTeam,
    fontScore: fontScore,
    font: fontScore, // fallback legacy
    
    teamWidth: getVbState(VB_TEAM_WIDTH_KEY, '250') + 'px',
    autoServe: getVbState(VB_AUTO_SERVE_KEY, 'true') === 'true',
    timeoutActive: getVbState(VB_TIMEOUT_ACTIVE_KEY, ''),
    sport: getVbState('vb_sport', 'volleyball'),
    showServeBall: getVbState('vb_show_serve_ball', 'true') === 'true',
    colorActiveScore: getVbState('vb_color_active_score', '#0369a1'),
    colorActiveScoreText: getVbState('vb_color_active_score_text', '#ffffff'),
    colorSetsBg: getVbState('vb_color_sets_bg', '#16a34a'),
    colorSetsText: getVbState('vb_color_sets_text', '#ffffff'),
    colorLogoBg: getVbState('vb_color_logo_bg', '#ffffff'),
    colorText: getVbState('vb_color_text', '#ffffff'),
    colorServe: getVbState('vb_color_serve', '#fde047'),
    
    // Split Upload Data
    customFontDataTeam: localStorage.getItem('vb_font_upload_data_team') || '',
    customFontFamilyTeam: localStorage.getItem('vb_font_upload_family_team') || '',
    customFontDataScore: localStorage.getItem('vb_font_upload_data_score') || '',
    customFontFamilyScore: localStorage.getItem('vb_font_upload_family_score') || ''
  };
  try { localStorage.setItem(VB_STATE_KEY, JSON.stringify(payload)); } catch (_) {}
  if (bc) bc.postMessage({ type: 'vb_update', payload });
  updateCardUI(payload);
  updateMainPanelUI(payload);
}

// ── Volleyball Logic ─────────────────────────────────────────────────
function finishSet() {
  const { sA, sB } = readScores();
  const history = loadHistory();
  history.push([sA, sB]);
  saveHistory(history);

  // Award winner via existing score2 buttons (routes through main.js changeScore2)
  if (sA > sB)      document.getElementById('score2APlusBtn')?.click();
  else if (sB > sA) document.getElementById('score2BPlusBtn')?.click();

  // Reset current set score via existing resetScoreBtn
  document.getElementById('resetScoreBtn')?.click();

  // Clear timeouts
  localStorage.setItem(VB_TIMEOUTSA_KEY, '0');
  localStorage.setItem(VB_TIMEOUTSB_KEY, '0');

  setTimeout(broadcast, 150);
  vbToast('🏁 Set finished & archived!', 'success');
}

function resetMatch() {
  if (!confirm('Reset ALL volleyball sets, match score, and history?')) return;
  saveHistory([]);
  localStorage.setItem(VB_TIMEOUTSA_KEY, '0');
  localStorage.setItem(VB_TIMEOUTSB_KEY, '0');
  localStorage.setItem(VB_SERVE_KEY, '');
  document.getElementById('resetScore2Btn')?.click();
  document.getElementById('resetScoreBtn')?.click();
  setTimeout(broadcast, 150);
  vbToast('🔄 Match reset.', 'info');
}

// ── OBS Source Creator ────────────────────────────────────────────────
async function createVBSource(btn, type) {
  const obs = window.fcpOBS; // exposed by main.js (see export block below)
  if (!obs) {
    vbToast('❌ OBS not connected — start OBS WebSocket first.', 'error');
    return;
  }
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'; }

    const scene = await obs.call('GetCurrentProgramScene');
    const sceneName = scene.currentProgramSceneName;

    const isMain = type === 'main';
    const isHist = type === 'history';
    const isPointHist = type === 'pointhist';
    const isBoxing = type === 'boxing';
    
    let inputName = '';
    let htmlFile = '';
    let height = 200;
    
    if (isMain) {
      inputName = 'Volleyball_Main_Score';
      htmlFile = 'volleyball_score.html';
      height = 200;
    } else if (isHist) {
      inputName = 'Volleyball_History';
      htmlFile = 'volleyball_score_history.html';
      height = 400;
    } else if (isPointHist) {
      inputName = 'Point_History';
      htmlFile = 'point_history.html';
      height = 500;
    } else if (isBoxing) {
      inputName = 'Boxing_Main_Score';
      htmlFile = 'boxing_score.html';
      height = 200;
    }

    // Absolute path to the overlay HTML (local file)
    const absPath = window.location.href.replace(/\/[^/]*$/, '') + '/' + htmlFile;

    await obs.call('CreateInput', {
      sceneName,
      inputName:    inputName,
      inputKind:    'browser_source',
      inputSettings: {
        url:    absPath,
        width:  1200,
        height: height,
        css:    'body { background: transparent !important; }',
        shutdown: false,
        reroute_audio: false,
      },
      sceneItemEnabled: true,
    });

    vbToast(`✅ ${inputName} source created in OBS!`, 'success');
    if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Created!'; }
  } catch (err) {
    const msg = err?.message || err?.error || String(err);
    if (msg.includes('already exists') || err?.code === 601) {
      const existingName = type === 'main' ? 'Volleyball_Main_Score' : (type === 'pointhist' ? 'Point_History' : (type === 'boxing' ? 'Boxing_Main_Score' : 'Volleyball_History'));
      vbToast(`⚠️ ${existingName} already exists.`, 'info');
      if (btn) btn.innerHTML = '<i class="fas fa-check"></i> Already exists';
    } else {
      vbToast('❌ OBS Error: ' + msg, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = type === 'main' ? '🎬 Main Score' : (type === 'pointhist' ? '🎬 Point History' : (type === 'boxing' ? '🥊 Boxing Score' : '🎬 History')); }
    }
  }
}

async function toggleVbSource(sourceName, btnElement) {
  const obs = window.fcpOBS;
  if(!obs) {
    vbToast('❌ OBS not connected', 'error');
    return;
  }
  try {
    const scene = await obs.call('GetCurrentProgramScene');
    const sceneName = scene.currentProgramSceneName;
    const item = await obs.call('GetSceneItemId', { sceneName, sourceName });
    const { sceneItemEnabled } = await obs.call('GetSceneItemEnabled', { sceneName, sceneItemId: item.sceneItemId });
    await obs.call('SetSceneItemEnabled', { sceneName, sceneItemId: item.sceneItemId, sceneItemEnabled: !sceneItemEnabled });
    
    const isNowEnabled = !sceneItemEnabled;
    const label = sourceName === 'Boxing_Main_Score' ? 'Boxing HUD' : (sourceName.includes('Main') ? 'Main Score' : (sourceName.includes('Point') ? 'Point History' : 'History'));
    btnElement.innerHTML = isNowEnabled ? `<i class="fas fa-eye"></i> ${label}` : `<i class="fas fa-eye-slash"></i> ${label}`;
    btnElement.className = isNowEnabled ? 'btn-primary' : 'btn-secondary';
    btnElement.style.background = isNowEnabled ? '#3b82f6' : '';
    vbToast(`${sourceName} is now ${isNowEnabled ? 'Visible' : 'Hidden'}`, 'success');
  } catch(e) {
    vbToast(`❌ OBS Error: Source '${sourceName}' not found.`, 'error');
  }
}

async function setOBSInputEnabled(sourceName, enabled) {
  const obs = window.fcpOBS;
  if (!obs) return;
  try {
    const scene = await obs.call('GetCurrentProgramScene');
    const sceneName = scene.currentProgramSceneName;
    let itemId;
    try {
      const item = await obs.call('GetSceneItemId', { sceneName, sourceName });
      itemId = item.sceneItemId;
    } catch (_) {
      return; // Source not found in current scene
    }
    
    await obs.call('SetSceneItemEnabled', { sceneName, sceneItemId: itemId, sceneItemEnabled: enabled });
    
    // Update button styling in main panel
    const btn = document.getElementById('vb-toggle-main');
    if (btn && sourceName === 'Boxing_Main_Score') {
      btn.innerHTML = enabled ? `<i class="fas fa-eye"></i> Boxing HUD` : `<i class="fas fa-eye-slash"></i> Boxing HUD`;
      btn.className = enabled ? 'btn-primary' : 'btn-secondary';
      btn.style.background = enabled ? '#3b82f6' : '';
    }
  } catch (err) {
    console.error('[VB OBS]', err);
  }
}

// ── Toast Helper ─────────────────────────────────────────────────────
function vbToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) { console.log('[VB]', msg); return; }
  const t = document.createElement('div');
  t.className = `toast ${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Card UI updater ──────────────────────────────────────────────────
function updateMainPanelUI(state) {
  if (!isEnabled()) {
    const p = document.getElementById('vb-main-actions');
    if (p) p.style.display = 'none';
    return;
  }
  let panel = document.getElementById('vb-main-actions');
  if (!panel) {
    const s2Card = document.getElementById('score2Card');
    if (!s2Card) return;
    panel = document.createElement('div');
    panel.id = 'vb-main-actions';
    panel.className = 'card';
    panel.style.border = '1px solid #f59e0b';
    panel.innerHTML = `
      <div style="font-size:0.75rem;font-weight:700;color:#f59e0b;text-transform:uppercase;margin-bottom:8px;text-align:center;">🎨 ควบคุมกราฟิกกีฬา / Sport Graphics Control</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <!-- Team A controls -->
        <div style="display:flex;flex-direction:column;gap:5px;align-items:center;">
          <button id="vb-serve-a" class="btn-secondary" style="width:100%;font-size:0.8rem;padding:6px;">🏐 Serve A</button>
          <div style="display:flex;gap:5px;width:100%;">
            <button id="vb-to-a-toggle" class="btn-warning" style="flex:1;font-size:0.8rem;padding:6px;">⏱️ TO A BANNER</button>
            <button id="vb-to-a" class="btn-secondary" style="width:30px;font-size:0.8rem;padding:6px;"><span id="vb-to-a-val">0</span></button>
          </div>
        </div>
        <!-- Team B controls -->
        <div style="display:flex;flex-direction:column;gap:5px;align-items:center;">
          <button id="vb-serve-b" class="btn-secondary" style="width:100%;font-size:0.8rem;padding:6px;">🏐 Serve B</button>
          <div style="display:flex;gap:5px;width:100%;">
            <button id="vb-to-b-toggle" class="btn-warning" style="flex:1;font-size:0.8rem;padding:6px;">⏱️ TO B BANNER</button>
            <button id="vb-to-b" class="btn-secondary" style="width:30px;font-size:0.8rem;padding:6px;"><span id="vb-to-b-val">0</span></button>
          </div>
        </div>
      </div>
      <div id="vb-main-set-actions-wrapper" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button id="vb-main-finish-set" class="btn-success" style="font-size:0.85rem;padding:8px;"><i class="fas fa-flag-checkered"></i> Finish Set</button>
        <button id="vb-main-reset-match" class="btn-danger" style="font-size:0.85rem;padding:8px;"><i class="fas fa-undo"></i> Reset Match</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
        <button id="vb-toggle-main" class="btn-secondary" style="font-size:0.8rem;padding:6px;" title="Toggle Main Score"><i class="fas fa-eye-slash"></i> Main Score</button>
        <button id="vb-toggle-hist" class="btn-secondary" style="font-size:0.8rem;padding:6px;" title="Toggle History"><i class="fas fa-eye-slash"></i> History</button>
      </div>
    `;
    s2Card.insertAdjacentElement('afterend', panel);
    
    // Wire events
    document.getElementById('vb-serve-a').onclick = () => setVbState(VB_SERVE_KEY, getVbState(VB_SERVE_KEY,'')==='A'?'':'A');
    document.getElementById('vb-serve-b').onclick = () => setVbState(VB_SERVE_KEY, getVbState(VB_SERVE_KEY,'')==='B'?'':'B');
    document.getElementById('vb-to-a').onclick = () => setVbState(VB_TIMEOUTSA_KEY, (parseInt(getVbState(VB_TIMEOUTSA_KEY,'0'))+1)%3);
    document.getElementById('vb-to-b').onclick = () => setVbState(VB_TIMEOUTSB_KEY, (parseInt(getVbState(VB_TIMEOUTSB_KEY,'0'))+1)%3);
    document.getElementById('vb-to-a-toggle').onclick = () => setVbState(VB_TIMEOUT_ACTIVE_KEY, getVbState(VB_TIMEOUT_ACTIVE_KEY,'')==='A'?'':'A');
    document.getElementById('vb-to-b-toggle').onclick = () => setVbState(VB_TIMEOUT_ACTIVE_KEY, getVbState(VB_TIMEOUT_ACTIVE_KEY,'')==='B'?'':'B');
    document.getElementById('vb-main-finish-set').onclick = finishSet;
    document.getElementById('vb-main-reset-match').onclick = resetMatch;
    
    // Wire OBS Toggle
    document.getElementById('vb-toggle-main').onclick = function() { toggleVbSource('Volleyball_Main_Score', this); };
    document.getElementById('vb-toggle-hist').onclick = function() { toggleVbSource('Volleyball_History', this); };
  }
  
  panel.style.display = 'block';

  const sport = state.sport || 'volleyball';
  const showServeBall = (state.showServeBall !== false);
  const serveSupport = showServeBall && (sport !== 'boxing');
  const timeoutSupport = (sport !== 'badminton') && (sport !== 'boxing');

  const serveA = document.getElementById('vb-serve-a');
  const serveB = document.getElementById('vb-serve-b');
  const toAToggle = document.getElementById('vb-to-a-toggle');
  const toBToggle = document.getElementById('vb-to-b-toggle');
  const toA = toAToggle ? toAToggle.parentElement : null;
  const toB = toBToggle ? toBToggle.parentElement : null;

  const emoji = getSportEmoji(sport);

  if (serveA) {
    serveA.innerHTML = `${emoji} Serve A`;
    serveA.style.display = serveSupport ? 'block' : 'none';
  }
  if (serveB) {
    serveB.innerHTML = `${emoji} Serve B`;
    serveB.style.display = serveSupport ? 'block' : 'none';
  }
  if (toA) toA.style.display = timeoutSupport ? 'flex' : 'none';
  if (toB) toB.style.display = timeoutSupport ? 'flex' : 'none';

  if (serveSupport) {
    if (serveA) {
      serveA.style.background = state.serve === 'A' ? '#f59e0b' : '';
      serveA.style.color = state.serve === 'A' ? '#fff' : '';
      serveA.style.borderColor = state.serve === 'A' ? '#f59e0b' : '';
    }
    if (serveB) {
      serveB.style.background = state.serve === 'B' ? '#f59e0b' : '';
      serveB.style.color = state.serve === 'B' ? '#fff' : '';
      serveB.style.borderColor = state.serve === 'B' ? '#f59e0b' : '';
    }
  }

  if (timeoutSupport) {
    const toActive = state.timeoutActive;
    if (toAToggle) {
      toAToggle.style.background = toActive === 'A' ? '#ef4444' : '';
      toAToggle.style.borderColor = toActive === 'A' ? '#ef4444' : '';
      toAToggle.style.color = toActive === 'A' ? '#fff' : '';
    }
    if (toBToggle) {
      toBToggle.style.background = toActive === 'B' ? '#ef4444' : '';
      toBToggle.style.borderColor = toActive === 'B' ? '#ef4444' : '';
      toBToggle.style.color = toActive === 'B' ? '#fff' : '';
    }
    const valA = document.getElementById('vb-to-a-val');
    const valB = document.getElementById('vb-to-b-val');
    if (valA) valA.textContent = state.timeoutsA;
    if (valB) valB.textContent = state.timeoutsB;
  }

  // Hide/Show Volleyball set actions when boxing
  const setActions = document.getElementById('vb-main-set-actions-wrapper');
  if (setActions) {
    setActions.style.display = sport === 'boxing' ? 'none' : 'grid';
  }

  // Adjust OBS main panel toggle buttons
  const toggleMain = document.getElementById('vb-toggle-main');
  const toggleHist = document.getElementById('vb-toggle-hist');
  if (toggleMain) {
    toggleMain.innerHTML = sport === 'boxing' 
      ? `<i class="fas fa-eye-slash"></i> Boxing HUD` 
      : `<i class="fas fa-eye-slash"></i> Main Score`;
    toggleMain.onclick = function() { 
      toggleVbSource(sport === 'boxing' ? 'Boxing_Main_Score' : 'Volleyball_Main_Score', this); 
    };
  }
  if (toggleHist) {
    toggleHist.style.display = sport === 'boxing' ? 'none' : 'block';
  }
}

function updateCardUI(state) {
  const $ = id => document.getElementById(id);
  if ($('vb2-score-a'))   $('vb2-score-a').textContent  = state.scoreA;
  if ($('vb2-score-b'))   $('vb2-score-b').textContent  = state.scoreB;
  if ($('vb2-sets-a'))    $('vb2-sets-a').textContent   = state.setsA;
  if ($('vb2-sets-b'))    $('vb2-sets-b').textContent   = state.setsB;
  if ($('vb2-set-label')) $('vb2-set-label').textContent = `SET ${state.setHistory.length + 1}`;
  const prev = $('vb2-history-prev');
  if (prev) {
    if (!state.setHistory.length) {
      prev.innerHTML = '<span style="color:rgba(255,255,255,0.3);font-size:11px">No finished sets yet</span>';
    } else {
      prev.innerHTML = state.setHistory.map((s, i) => {
        const cls = s[0] > s[1] ? 'vb2-win-a' : s[1] > s[0] ? 'vb2-win-b' : 'vb2-tie';
        return `<span class="vb2-badge ${cls}">S${i+1}: ${s[0]}–${s[1]}</span>`;
      }).join('');
    }
  }
}

// ── Settings Tab Injection ───────────────────────────────────────────
function updateFontFieldsVisibility() {
  const teamSrc = localStorage.getItem('vb_font_src_team') || 'preset';
  const scoreSrc = localStorage.getItem('vb_font_src_score') || 'preset';
  
  const pTeam = document.getElementById('vb2-font-preset-team-container');
  const cTeam = document.getElementById('vb2-font-custom-team-container');
  const uTeam = document.getElementById('vb2-font-upload-team-container');
  
  if (pTeam) pTeam.style.display = teamSrc === 'preset' ? 'block' : 'none';
  if (cTeam) cTeam.style.display = teamSrc === 'custom_name' ? 'block' : 'none';
  if (uTeam) uTeam.style.display = teamSrc === 'upload' ? 'block' : 'none';
  
  const pScore = document.getElementById('vb2-font-preset-score-container');
  const cScore = document.getElementById('vb2-font-custom-score-container');
  const uScore = document.getElementById('vb2-font-upload-score-container');
  
  if (pScore) pScore.style.display = scoreSrc === 'preset' ? 'block' : 'none';
  if (cScore) cScore.style.display = scoreSrc === 'custom_name' ? 'block' : 'none';
  if (uScore) uScore.style.display = scoreSrc === 'upload' ? 'block' : 'none';
}

function injectCustomFont() {
  let style = document.getElementById('vb-custom-font-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'vb-custom-font-style';
    document.head.appendChild(style);
  }
  
  let css = '';
  const teamSrc = localStorage.getItem('vb_font_src_team') || 'preset';
  const teamData = localStorage.getItem('vb_font_upload_data_team');
  if (teamSrc === 'upload' && teamData) {
    css += `
      @font-face {
        font-family: 'CustomFontTeam';
        src: url('${teamData}');
      }
    `;
  }
  
  const scoreSrc = localStorage.getItem('vb_font_src_score') || 'preset';
  const scoreData = localStorage.getItem('vb_font_upload_data_score');
  if (scoreSrc === 'upload' && scoreData) {
    css += `
      @font-face {
        font-family: 'CustomFontScore';
        src: url('${scoreData}');
      }
    `;
  }
  style.textContent = css;
}

function updatePointHistoryList() {
  const container = document.getElementById('vb2-point-history-list');
  if (!container) return;
  
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('score_action_history') || '[]');
  } catch(_) {}
  
  if (!history.length) {
    container.innerHTML = '<div style="color:rgba(255,255,255,0.3);text-align:center;padding:10px 0;">No score history yet</div>';
    return;
  }
  
  const html = history.slice().reverse().map((entry) => {
    let text = '';
    let time = new Date(entry.timestamp).toLocaleTimeString();
    
    if (entry.type === 'reset') {
      text = `<span style="color:#ef4444;font-weight:bold;">[RESET]</span> Score reset to ${entry.scoreA}-${entry.scoreB}`;
    } else if (entry.type === 'score') {
      const delta = entry.delta || 0;
      const isA = entry.team === 'A';
      const action = delta > 0 ? `+${delta}` : `${delta}`;
      const teamName = isA ? 'Team A' : 'Team B';
      const scoreStr = isA ? `${entry.scoreA + delta} - ${entry.scoreB}` : `${entry.scoreA} - ${entry.scoreB + delta}`;
      text = `<span style="color:${isA ? '#3b82f6' : '#ef4444'};font-weight:bold;">${teamName}</span> ${action} (${scoreStr})`;
    } else if (entry.type === 'score2') {
      const delta = entry.delta || 0;
      const isA = entry.team === 'A';
      const action = delta > 0 ? `+${delta}` : `${delta}`;
      const teamName = isA ? 'Team A' : 'Team B';
      const scoreStr = isA ? `${entry.score2A + delta} - ${entry.score2B}` : `${entry.score2A} - ${entry.score2B + delta}`;
      text = `<span style="color:${isA ? '#10b981' : '#f59e0b'};font-weight:bold;">${teamName} Foul/Set</span> ${action} (${scoreStr})`;
    }
    
    return `
      <div style="display:flex;justify-content:space-between;padding:4px 6px;background:rgba(255,255,255,0.03);border-radius:4px;border-left:2px solid #f59e0b;">
        <span>${text}</span>
        <span style="color:#64748b;font-size:10px;">${time}</span>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}
window.updatePointHistoryList = updatePointHistoryList;

function getSportEmoji(sport) {
  switch (sport) {
    case 'basketball':
    case 'streetball':
      return '🏀';
    case 'football':
      return '⚽';
    case 'badminton':
      return '🏸';
    case 'volleyball':
    default:
      return '🏐';
  }
}

function updateSportUI() {
  const sport = localStorage.getItem('vb_sport') || 'volleyball';
  const vbEnabled = localStorage.getItem('vb_enabled') !== 'false';
  const btnsA = document.getElementById('basketballBtnsA');
  const btnsB = document.getElementById('basketballBtnsB');
  
  if (vbEnabled && (sport === 'basketball' || sport === 'streetball')) {
    if (btnsA) btnsA.style.display = 'flex';
    if (btnsB) btnsB.style.display = 'flex';
  } else {
    if (btnsA) btnsA.style.display = 'none';
    if (btnsB) btnsB.style.display = 'none';
  }
  
  const bxSettings = document.getElementById('vb2-boxing-settings-container');
  const vLimit = document.getElementById('vb2-volleyball-limit-wrapper');
  const vfLimit = document.getElementById('vb2-volleyball-finallimit-wrapper');
  const vHist = document.getElementById('vb2-volleyball-history-wrapper');
  const vActions = document.getElementById('vb2-volleyball-actions-wrapper');
  const maxSetsLabel = document.getElementById('vb2-maxsets-label');
  
  // Volleyball / general settings wrappers to hide when boxing is active
  const vbShowServe = document.getElementById('vb2-volleyball-showserve-container');
  const vbFonts = document.getElementById('vb2-volleyball-fonts-container');
  const vbWidthServe = document.getElementById('vb2-volleyball-width-serve-container');
  const vbColors = document.getElementById('vb2-volleyball-colors-container');
  const vbObs = document.getElementById('vb2-volleyball-obs-container');
  const bxObs = document.getElementById('vb2-boxing-obs-container');
  
  const isBoxing = vbEnabled && sport === 'boxing';
  
  if (bxSettings) bxSettings.style.display = isBoxing ? 'block' : 'none';
  
  if (vLimit) vLimit.style.display = isBoxing ? 'none' : 'block';
  if (vfLimit) vfLimit.style.display = isBoxing ? 'none' : 'flex';
  if (vHist) vHist.style.display = isBoxing ? 'none' : 'block';
  if (vActions) vActions.style.display = isBoxing ? 'none' : 'grid';
  
  if (vbShowServe) vbShowServe.style.display = isBoxing ? 'none' : 'flex';
  if (vbFonts) vbFonts.style.display = vbEnabled ? 'block' : 'none';
  if (vbWidthServe) vbWidthServe.style.display = isBoxing ? 'none' : 'block';
  if (vbColors) vbColors.style.display = isBoxing ? 'none' : 'block';
  if (vbObs) vbObs.style.display = isBoxing ? 'none' : 'grid';
  if (bxObs) bxObs.style.display = isBoxing ? 'block' : 'none';
  
  if (maxSetsLabel) {
    maxSetsLabel.textContent = isBoxing ? '🎯 จำนวนยก / Max Rounds' : '🎯 Max Sets';
  }
}
window.updateSportUI = updateSportUI;

function injectSettingsTab() {
  if (document.getElementById(TAB_ID)) return; // Already injected

  // ── 1. Tab button ─────────────────────────────────────────────
  const tabsContainer = document.getElementById('settingsTabs');
  if (!tabsContainer) { console.warn('[VB] #settingsTabs not found — retrying in 1s'); setTimeout(injectSettingsTab, 1000); return; }

  const tabBtn = document.createElement('button');
  tabBtn.className = 'settings-tab-btn';
  tabBtn.setAttribute('data-tab', TAB_ID);
  tabBtn.innerHTML = '🎨 กราฟิกกีฬา / Sport Graphics';
  tabBtn.style.color = '#f59e0b';
  tabsContainer.appendChild(tabBtn);

  // Wire into existing switchSettingsTab (exposed on window by main.js)
  tabBtn.addEventListener('click', () => {
    if (window.switchSettingsTab) window.switchSettingsTab(TAB_ID);
  });

  // ── 2. Tab content panel ──────────────────────────────────────
  const enabled = isEnabled();
  const limit   = getSetLimit();
  const maxSets = getMaxSets();
  const finalLimit = getFinalSetLimit();

  const panel = document.createElement('div');
  panel.className = 'settings-tab-content';
  panel.id = TAB_ID;
  panel.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <h4 style="margin:0;font-size:1rem;display:flex;align-items:center;gap:8px;">
        <span>🎨</span> ตั้งค่ากราฟิกกีฬา / Sport Graphics Settings
      </h4>
      <span id="vb2-set-label" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);color:#f59e0b;border-radius:20px;padding:2px 12px;font-size:11px;font-weight:700;letter-spacing:.08em;">SET 1</span>
    </div>

    <!-- Enable Toggle -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;margin-bottom:14px;border:1px solid rgba(255,255,255,0.06);">
      <div>
        <div style="font-size:.9rem;font-weight:600;color:#e2e8f0;">เปิดใช้งานกราฟิกกีฬา / Enable Sport Graphics</div>
        <div style="font-size:.75rem;color:#64748b;margin-top:2px;">เปิดใช้งานระบบซิงค์แต้มและกราฟิกถ่ายทอดสด</div>
      </div>
      <label class="container-toggle" style="display:flex;align-items:center;cursor:pointer;margin:0;">
        <div class="toggle-switch">
          <input type="checkbox" id="vb2-enabled-toggle" ${enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </div>
      </label>
    </div>

    <!-- Show Serve Ball Toggle -->
    <div id="vb2-volleyball-showserve-container" style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;margin-bottom:14px;border:1px solid rgba(255,255,255,0.06);">
      <div>
        <div style="font-size:.9rem;font-weight:600;color:#e2e8f0;">แสดงตัวระบุครองบอล/เสิร์ฟ / Show Serve/Possession Ball</div>
        <div style="font-size:.75rem;color:#64748b;margin-top:2px;">แสดงสัญลักษณ์ลูกบอลแสดงสิทธิ์เสิร์ฟหรือครองบอลบนหน้าจอควบคุมและโอเวอร์เลย์</div>
      </div>
      <label class="container-toggle" style="display:flex;align-items:center;cursor:pointer;margin:0;">
        <div class="toggle-switch">
          <input type="checkbox" id="vb2-show-serve-ball-toggle" ${getVbState('vb_show_serve_ball', 'true') === 'true' ? 'checked' : ''}>
          <span class="slider"></span>
        </div>
      </label>
    </div>

    <!-- Active Sport selector -->
    <div style="margin-bottom: 14px; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
      <div style="font-size: .85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 8px;">🏆 Active Sport / เลือกประเภทกีฬา</div>
      <select id="vb2-sport-select" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: #fff; font-size: 14px; appearance: auto;">
        <option value="volleyball"${getVbState('vb_sport', 'volleyball') === 'volleyball' ? ' selected' : ''}>Volleyball / วอลเลย์บอล</option>
        <option value="basketball"${getVbState('vb_sport', 'volleyball') === 'basketball' ? ' selected' : ''}>Basketball / บาสเกตบอล</option>
        <option value="football"${getVbState('vb_sport', 'volleyball') === 'football' ? ' selected' : ''}>Football / ฟุตบอล</option>
        <option value="streetball"${getVbState('vb_sport', 'volleyball') === 'streetball' ? ' selected' : ''}>Streetball / สตรีทบอล</option>
        <option value="badminton"${getVbState('vb_sport', 'volleyball') === 'badminton' ? ' selected' : ''}>Badminton / แบดมินตัน</option>
        <option value="boxing"${getVbState('vb_sport', 'volleyball') === 'boxing' ? ' selected' : ''}>Boxing / มวย</option>
      </select>
    </div>

    <!-- Boxing Graphic Settings Grouped by Component -->
    <div id="vb2-boxing-settings-container" style="margin-bottom: 14px; display: none;">
      
      <!-- 1. Left Boxer Name Panel -->
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px;">
        <div style="font-size: .8rem; font-weight: 700; color: #ef4444; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid rgba(239,68,68,0.2); padding-bottom: 4px;">🥊 ฝั่งซ้าย (Left Boxer Panel)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1;">
          <div>
            <span style="display:block;margin-bottom:2px;">สีแถบฝั่งซ้าย (Accent Color)</span>
            <input type="color" id="vb2-bx-color-left" value="${getVbState('bx_color_left', '#ef4444')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สีตัวอักษรชื่อ (Text Color)</span>
            <input type="color" id="vb2-bx-color-left-txt" value="${getVbState('bx_color_left_txt', '#ffffff')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div style="grid-column: span 2;">
            <span style="display:block;margin-bottom:2px;">สีพื้นหลังป้ายฝั่งซ้าย (Panel BG)</span>
            <input type="color" id="vb2-bx-color-left-bg" value="${getVbState('bx_color_left_bg', '#1e293b')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
        </div>
      </div>

      <!-- 2. Right Boxer Name Panel -->
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px;">
        <div style="font-size: .8rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid rgba(59,130,246,0.2); padding-bottom: 4px;">🥊 ฝั่งขวา (Right Boxer Panel)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1;">
          <div>
            <span style="display:block;margin-bottom:2px;">สีแถบฝั่งขวา (Accent Color)</span>
            <input type="color" id="vb2-bx-color-right" value="${getVbState('bx_color_right', '#3b82f6')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สีตัวอักษรชื่อ (Text Color)</span>
            <input type="color" id="vb2-bx-color-right-txt" value="${getVbState('bx_color_right_txt', '#ffffff')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div style="grid-column: span 2;">
            <span style="display:block;margin-bottom:2px;">สีพื้นหลังป้ายฝั่งขวา (Panel BG)</span>
            <input type="color" id="vb2-bx-color-right-bg" value="${getVbState('bx_color_right_bg', '#1e293b')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
        </div>
      </div>

      <!-- 3. Boxer HUD & Logos Shared Sizing -->
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px;">
        <div style="font-size: .8rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">📐 ขนาดป้ายนักมวย & โลโก้ทีม (HUD Size & Flags)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1;">
          <div>
            <span style="display:block;margin-bottom:2px;">ความกว้างช่องชื่อ (Width px)</span>
            <input type="number" id="vb2-bx-name-panel-width" value="${getVbState('bx_name_panel_width', '350')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">ความสูง HUD (Height px)</span>
            <input type="number" id="vb2-bx-name-panel-height" value="${getVbState('bx_name_panel_height', '50')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div style="grid-column: span 2;">
            <span style="display:block;margin-bottom:2px;">ขนาดตัวอักษรชื่อทีม (Font Size px)</span>
            <input type="number" id="vb2-bx-name-font-size" value="${getVbState('bx_name_font_size', '20')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between; margin-top: 4px; background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 4px;">
            <span>แสดงโลโก้/ธงทีม A และ B</span>
            <label class="container-toggle" style="margin: 0; cursor: pointer;">
              <div class="toggle-switch">
                <input type="checkbox" id="vb2-bx-show-team-logos" ${getVbState('bx_show_team_logos', 'true') === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- 4. Center Timer Panel -->
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px;">
        <div style="font-size: .8rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid rgba(251,191,36,0.2); padding-bottom: 4px;">⏱️ บอร์ดเวลาหลัก (Timer Panel)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1;">
          <div>
            <span style="display:block;margin-bottom:2px;">สีพื้นหลังเวลา (Center BG)</span>
            <input type="color" id="vb2-bx-color-center-bg" value="${getVbState('bx_color_center_bg', '#ffffff')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สีตัวเลขเวลา (Timer Text)</span>
            <input type="color" id="vb2-bx-color-time-txt" value="${getVbState('bx_color_time_txt', '#020617')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div style="grid-column: span 2;">
            <span style="display:block;margin-bottom:2px;">ขนาดตัวอักษรเวลาหลัก (Font Size px)</span>
            <input type="number" id="vb2-bx-time-font-size" value="${getVbState('bx_time_font_size', '35')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
        </div>
      </div>

      <!-- 5. Bottom Detail Panel (Label 1) -->
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px;">
        <div style="font-size: .8rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">🏷️ ป้ายข้อมูลด้านล่าง (Label 1)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1;">
          <div style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 4px; margin-bottom: 4px;">
            <span>แสดงป้ายรายละเอียด Label 1</span>
            <label class="container-toggle" style="margin: 0; cursor: pointer;">
              <div class="toggle-switch">
                <input type="checkbox" id="vb2-bx-show-label1" ${getVbState('bx_show_label1', 'true') === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
              </div>
            </label>
          </div>
          
          <div style="grid-column: span 2;">
            <span style="display:block;margin-bottom:2px;">แหล่งข้อมูลของป้าย 1</span>
            <select id="vb2-bx-label1-type" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: #fff; font-size: 12px;">
              <option value="auto" ${getVbState('bx_label1_type', 'auto') === 'auto' ? 'selected' : ''}>ดึงข้อมูลอัตโนมัติ (Auto-Pull)</option>
              <option value="custom" ${getVbState('bx_label1_type', 'auto') === 'custom' ? 'selected' : ''}>พิมพ์ข้อความเอง (Custom Input)</option>
            </select>
          </div>
          
          <div id="vb2-bx-label1-custom-text-wrapper" style="grid-column: span 2; display: none;">
            <span style="display:block;margin-bottom:2px;">พิมพ์ข้อความที่ต้องการแสดง</span>
            <input type="text" id="vb2-bx-label1-custom-text" value="${getVbState('bx_label1_custom_text', '')}" placeholder="เช่น MUAY THAI, 125 LBS" style="width: 100%; padding: 6px 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: #fff; font-size: 12px;">
          </div>
          
          <div>
            <span style="display:block;margin-bottom:2px;">ความกว้างป้าย 1 (Width px)</span>
            <input type="number" id="vb2-bx-label1-width" value="${getVbState('bx_label1_width', '165')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">ขนาดตัวอักษร (Font Size px)</span>
            <input type="number" id="vb2-bx-label1-font-size" value="${getVbState('bx_label1_font_size', '20')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สีพื้นหลังป้าย 1 (BG Color)</span>
            <input type="color" id="vb2-bx-color-label1-bg" value="${getVbState('bx_color_label1_bg', '#020617')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สีข้อความป้าย 1 (Text Color)</span>
            <input type="color" id="vb2-bx-color-label1-txt" value="${getVbState('bx_color_label1_txt', '#e2e8f0')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
        </div>
      </div>

      <!-- 6. Rounds & Event Logo Header Settings -->
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px;">
        <div style="font-size: .8rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">🏆 จุดนับยก & โลโก้รายการ (Rounds & Logo Header)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1;">
          <div>
            <span style="display:block;margin-bottom:2px;">ความสูงโลโก้รายการ (Height px)</span>
            <input type="number" id="vb2-bx-logo-size" value="${getVbState('bx_logo_size', '30')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สีพื้นหลังยก/โลโก้ (Header BG)</span>
            <input type="color" id="vb2-bx-color-header-bg" value="${getVbState('bx_color_header_bg', '#0f172a')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">ความกว้างขีดยก (Dash Width px)</span>
            <input type="number" id="vb2-bx-dash-width" value="${getVbState('bx_dash_width', '25')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">ความสูงขีดยก (Dash Height px)</span>
            <input type="number" id="vb2-bx-dash-height" value="${getVbState('bx_dash_height', '6')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สียกปัจจุบัน (Active Dash)</span>
            <input type="color" id="vb2-bx-color-dash-active" value="${getVbState('bx_color_dash_active', '#fbbf24')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
          <div>
            <span style="display:block;margin-bottom:2px;">สียกทั่วไป (Inactive Dash)</span>
            <input type="color" id="vb2-bx-color-dash-inactive" value="${getVbState('bx_color_dash_inactive', '#334155')}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;">
          </div>
        </div>
      </div>

      <!-- 7. Auto Hide Boxing HUD Settings -->
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px;">
        <div style="font-size: .8rem; font-weight: 700; color: #f43f5e; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid rgba(244,63,94,0.2); padding-bottom: 4px;">⏱️ ซ่อนอัตโนมัติ (Auto Hide Boxing HUD)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1;">
          <div style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 4px;">
            <span>เปิดใช้งาน Auto Hide เมื่อเวลาใกล้หมด</span>
            <label class="container-toggle" style="margin: 0; cursor: pointer;">
              <div class="toggle-switch">
                <input type="checkbox" id="vb2-bx-auto-hide-enabled" ${getVbState('bx_auto_hide_enabled', 'false') === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
              </div>
            </label>
          </div>
          <div id="vb2-bx-auto-hide-seconds-wrapper" style="grid-column: span 2; display: none;">
            <span style="display:block;margin-bottom:2px;">ซ่อนเมื่อเวลาเหลือน้อยกว่าหรือเท่ากับ (วินาที / Seconds)</span>
            <input type="number" id="vb2-bx-auto-hide-seconds" value="${getVbState('bx_auto_hide_seconds', '30')}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;">
          </div>
        </div>
      </div>

    </div>

    <!-- Custom Colors -->
    <div id="vb2-volleyball-colors-container" style="margin-bottom: 14px; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
      <div style="font-size: .85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 8px;">🎨 Custom Overlay Colors / ปรับแต่งสีกราฟิก</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #cbd5e1;">
        <div>
          <span style="display:block;margin-bottom:2px;">Active Score BG</span>
          <input type="color" id="vb2-color-active-bg" value="${getVbState('vb_color_active_score', '#0369a1')}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Active Score Text</span>
          <input type="color" id="vb2-color-active-txt" value="${getVbState('vb_color_active_score_text', '#ffffff')}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Sets/Fouls BG</span>
          <input type="color" id="vb2-color-sets-bg" value="${getVbState('vb_color_sets_bg', '#16a34a')}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Sets/Fouls Text</span>
          <input type="color" id="vb2-color-sets-txt" value="${getVbState('vb_color_sets_text', '#ffffff')}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Logo Area BG</span>
          <input type="color" id="vb2-color-logo-bg" value="${getVbState('vb_color_logo_bg', '#ffffff')}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">General Text</span>
          <input type="color" id="vb2-color-text" value="${getVbState('vb_color_text', '#ffffff')}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div style="grid-column: span 2;">
          <span style="display:block;margin-bottom:2px;">Serve Indicator</span>
          <input type="color" id="vb2-color-serve" value="${getVbState('vb_color_serve', '#fde047')}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
      </div>
    </div>

    <!-- Event Logo & Settings -->
    <div style="margin-bottom:14px;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:.85rem;font-weight:600;color:#cbd5e1;margin-bottom:6px;">🖼️ Event Logo (Local File)</div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <input type="file" id="vb2-logo-file" accept="image/*" style="font-size:0.75rem;width:100%;color:#fff;">
        <button id="vb2-logo-clear" class="btn-danger" style="padding:4px 8px;font-size:0.75rem;border-radius:6px;">Clear</button>
      </div>
      <img id="vb2-logo-preview" src="${getVbState(VB_LOGO_KEY, '')}" style="max-height:50px;display:${getVbState(VB_LOGO_KEY, '') ? 'block' : 'none'};margin-bottom:10px;border-radius:4px;">
      
      <!-- Custom Fonts Split (Team & Score) -->
      <div id="vb2-volleyball-fonts-container" style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: .85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 8px;">✍️ Custom Fonts / จัดการแบบอักษร</div>
        
        <!-- Section 1: Team Names Font -->
        <div style="background: rgba(0,0,0,0.15); padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.03);">
          <div style="font-size: 12px; font-weight: bold; color: #f59e0b; margin-bottom: 6px;">ฟอนต์ชื่อทีม / Team Names Font</div>
          
          <div style="margin-bottom: 8px;">
            <span style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:3px;">แหล่งที่มา / Font Source:</span>
            <select id="vb2-font-src-team" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:12px; appearance:auto;">
              <option value="preset" ${localStorage.getItem('vb_font_src_team') === 'preset' ? 'selected' : ''}>Preset Font / ฟอนต์ระบบแนะนำ</option>
              <option value="custom_name" ${localStorage.getItem('vb_font_src_team') === 'custom_name' ? 'selected' : ''}>Type Local Font Name / ชื่อฟอนต์ในเครื่อง</option>
              <option value="upload" ${localStorage.getItem('vb_font_src_team') === 'upload' ? 'selected' : ''}>Upload Font File / อัปโหลดไฟล์ฟอนต์</option>
            </select>
          </div>
          
          <!-- Team Preset -->
          <div id="vb2-font-preset-team-container" style="margin-bottom: 6px;">
            <span style="font-size:11px; color:#94a3b8; display:block; margin-bottom:3px;">Select Preset:</span>
            <select id="vb2-font-preset-team" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:12px; appearance:auto;">
              <option value="'Kanit', sans-serif" ${localStorage.getItem('vb_font_preset_team') === "'Kanit', sans-serif" ? 'selected' : ''}>Kanit (Thai)</option>
              <option value="'Prompt', sans-serif" ${localStorage.getItem('vb_font_preset_team') === "'Prompt', sans-serif" ? 'selected' : ''}>Prompt (Thai)</option>
              <option value="'Sarabun', sans-serif" ${localStorage.getItem('vb_font_preset_team') === "'Sarabun', sans-serif" ? 'selected' : ''}>Sarabun (Thai)</option>
              <option value="'Barlow Condensed', sans-serif" ${localStorage.getItem('vb_font_preset_team') === "'Barlow Condensed', sans-serif" ? 'selected' : ''}>Barlow Condensed</option>
              <option value="'Roboto Condensed', sans-serif" ${localStorage.getItem('vb_font_preset_team') === "'Roboto Condensed', sans-serif" ? 'selected' : ''}>Roboto Condensed</option>
              <option value="'Oswald', sans-serif" ${localStorage.getItem('vb_font_preset_team') === "'Oswald', sans-serif" ? 'selected' : ''}>Oswald</option>
              <option value="Arial, sans-serif" ${localStorage.getItem('vb_font_preset_team') === "Arial, sans-serif" ? 'selected' : ''}>Arial</option>
              <option value="Tahoma, sans-serif" ${localStorage.getItem('vb_font_preset_team') === "Tahoma, sans-serif" ? 'selected' : ''}>Tahoma</option>
              <option value="Impact, sans-serif" ${localStorage.getItem('vb_font_preset_team') === "Impact, sans-serif" ? 'selected' : ''}>Impact</option>
            </select>
          </div>
          
          <!-- Team Custom Name -->
          <div id="vb2-font-custom-team-container" style="margin-bottom: 6px; display:none;">
            <span style="font-size:11px; color:#94a3b8; display:block; margin-bottom:3px;">Custom Font Family Name (installed in PC):</span>
            <input type="text" id="vb2-font-custom-name-team" value="${localStorage.getItem('vb_font_custom_name_team') || ''}" placeholder="e.g. Angsana New, CordiaUPC" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: #fff; font-size: 12px;">
          </div>
          
          <!-- Team Upload -->
          <div id="vb2-font-upload-team-container" style="margin-bottom: 6px; display:none;">
            <span style="font-size:11px; color:#94a3b8; display:block; margin-bottom:3px;">Upload Font file (.ttf, .otf, .woff, .woff2):</span>
            <input type="file" id="vb2-font-file-team" accept=".ttf,.otf,.woff,.woff2" style="font-size: 0.75rem; width: 100%; color: #fff;">
            <div id="vb2-font-status-team" style="font-size: 11px; color: #22c55e; margin-top: 4px;">${localStorage.getItem('vb_font_upload_data_team') ? '✓ Font cached' : ''}</div>
          </div>
        </div>

        <!-- Section 2: Scores & Numbers Font -->
        <div style="background: rgba(0,0,0,0.15); padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.03);">
          <div style="font-size: 12px; font-weight: bold; color: #f59e0b; margin-bottom: 6px;">ฟอนต์ตัวเลขคะแนน / Scores & Numbers Font</div>
          
          <div style="margin-bottom: 8px;">
            <span style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:3px;">แหล่งที่มา / Font Source:</span>
            <select id="vb2-font-src-score" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:12px; appearance:auto;">
              <option value="preset" ${localStorage.getItem('vb_font_src_score') === 'preset' ? 'selected' : ''}>Preset Font / ฟอนต์ระบบแนะนำ</option>
              <option value="custom_name" ${localStorage.getItem('vb_font_src_score') === 'custom_name' ? 'selected' : ''}>Type Local Font Name / ชื่อฟอนต์ในเครื่อง</option>
              <option value="upload" ${localStorage.getItem('vb_font_src_score') === 'upload' ? 'selected' : ''}>Upload Font File / อัปโหลดไฟล์ฟอนต์</option>
            </select>
          </div>
          
          <!-- Score Preset -->
          <div id="vb2-font-preset-score-container" style="margin-bottom: 6px;">
            <span style="font-size:11px; color:#94a3b8; display:block; margin-bottom:3px;">Select Preset:</span>
            <select id="vb2-font-preset-score" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:12px; appearance:auto;">
              <option value="'Barlow Condensed', sans-serif" ${localStorage.getItem('vb_font_preset_score') === "'Barlow Condensed', sans-serif" ? 'selected' : ''}>Barlow Condensed</option>
              <option value="'Roboto Condensed', sans-serif" ${localStorage.getItem('vb_font_preset_score') === "'Roboto Condensed', sans-serif" ? 'selected' : ''}>Roboto Condensed</option>
              <option value="'Oswald', sans-serif" ${localStorage.getItem('vb_font_preset_score') === "'Oswald', sans-serif" ? 'selected' : ''}>Oswald</option>
              <option value="'Kanit', sans-serif" ${localStorage.getItem('vb_font_preset_score') === "'Kanit', sans-serif" ? 'selected' : ''}>Kanit (Thai)</option>
              <option value="'Prompt', sans-serif" ${localStorage.getItem('vb_font_preset_score') === "'Prompt', sans-serif" ? 'selected' : ''}>Prompt (Thai)</option>
              <option value="Arial, sans-serif" ${localStorage.getItem('vb_font_preset_score') === "Arial, sans-serif" ? 'selected' : ''}>Arial</option>
              <option value="Tahoma, sans-serif" ${localStorage.getItem('vb_font_preset_score') === "Tahoma, sans-serif" ? 'selected' : ''}>Tahoma</option>
              <option value="Impact, sans-serif" ${localStorage.getItem('vb_font_preset_score') === "Impact, sans-serif" ? 'selected' : ''}>Impact</option>
            </select>
          </div>
          
          <!-- Score Custom Name -->
          <div id="vb2-font-custom-score-container" style="margin-bottom: 6px; display:none;">
            <span style="font-size:11px; color:#94a3b8; display:block; margin-bottom:3px;">Custom Font Family Name (installed in PC):</span>
            <input type="text" id="vb2-font-custom-name-score" value="${localStorage.getItem('vb_font_custom_name_score') || ''}" placeholder="e.g. Barlow Condensed, Arial" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: #fff; font-size: 12px;">
          </div>
          
          <!-- Score Upload -->
          <div id="vb2-font-upload-score-container" style="margin-bottom: 6px; display:none;">
            <span style="font-size:11px; color:#94a3b8; display:block; margin-bottom:3px;">Upload Font file (.ttf, .otf, .woff, .woff2):</span>
            <input type="file" id="vb2-font-file-score" accept=".ttf,.otf,.woff,.woff2" style="font-size: 0.75rem; width: 100%; color: #fff;">
            <div id="vb2-font-status-score" style="font-size: 11px; color: #22c55e; margin-top: 4px;">${localStorage.getItem('vb_font_upload_data_score') ? '✓ Font cached' : ''}</div>
          </div>
        </div>

        <!-- Volleyball Specific Sizing & Serve Toggles -->
        <div id="vb2-volleyball-width-serve-container">
          <!-- Team width setting -->
          <div style="margin-bottom:6px;">
            <div style="font-size:.75rem;color:#cbd5e1;margin-bottom:4px;">Team Name Width (px)</div>
            <input type="number" id="vb2-team-width" value="${parseInt(getVbState(VB_TEAM_WIDTH_KEY, '250'))}" style="width:100%;padding:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:12px;">
          </div>
          
          <label class="container-toggle" style="display:flex;align-items:center;cursor:pointer;margin-top:10px;">
            <div class="toggle-switch">
              <input type="checkbox" id="vb2-auto-serve" ${getVbState(VB_AUTO_SERVE_KEY, 'true')==='true'?'checked':''}>
              <span class="slider"></span>
            </div>
            <span style="font-size:0.8rem;color:#cbd5e1;">Auto-Serve on Point</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Point History Section Removed -->
    <div id="vb2-scores-section" style="${enabled ? '' : 'opacity:.4;pointer-events:none;'}">

      <!-- Match Settings: Sets & Limits -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <!-- Number of Sets -->
        <div>
          <label id="vb2-maxsets-label" style="font-size:.75rem;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">🎯 Max Sets</label>
          <div style="display:flex;align-items:center;gap:5px;">
            <button id="vb2-maxsets-minus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">−</button>
            <input id="vb2-maxsets" type="number" min="1" max="12" value="${maxSets}"
              style="width:100%;text-align:center;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:14px;font-weight:700;padding:4px 0;">
            <button id="vb2-maxsets-plus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">+</button>
          </div>
        </div>
        <!-- Set Point Limit -->
        <div id="vb2-volleyball-limit-wrapper">
          <label style="font-size:.75rem;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">🎯 Set Point</label>
          <div style="display:flex;align-items:center;gap:5px;">
            <button id="vb2-limit-minus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">−</button>
            <input id="vb2-limit" type="number" min="1" max="99" value="${limit}"
              style="width:100%;text-align:center;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:14px;font-weight:700;padding:4px 0;">
            <button id="vb2-limit-plus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">+</button>
          </div>
        </div>
      </div>
      
      <!-- Final Set Point Limit -->
      <div id="vb2-volleyball-finallimit-wrapper" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <label style="font-size:.85rem;font-weight:600;color:#cbd5e1;">🎯 Final Set Point Limit</label>
        <div style="display:flex;align-items:center;gap:5px;">
          <button id="vb2-finallimit-minus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">−</button>
          <input id="vb2-finallimit" type="number" min="1" max="99" value="${finalLimit}"
            style="width:54px;text-align:center;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:14px;font-weight:700;padding:4px 0;">
          <button id="vb2-finallimit-plus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">+</button>
        </div>
      </div>

      <!-- Set History Preview -->
      <div id="vb2-volleyball-history-wrapper" style="margin-bottom:14px;">
        <div style="font-size:.7rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">📋 Set History</div>
        <div id="vb2-history-prev" style="display:flex;flex-wrap:wrap;gap:5px;min-height:22px;">
          <span style="color:rgba(255,255,255,0.3);font-size:11px">No finished sets yet</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div id="vb2-volleyball-actions-wrapper" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <button id="vb2-finish-btn"
          style="display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border:none;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#1a0e00;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
          🏁 Finish Set
        </button>
        <button id="vb2-reset-btn"
          style="display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border:1px solid rgba(239,68,68,0.35);border-radius:8px;background:rgba(239,68,68,0.12);color:#fca5a5;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;">
          🔄 Reset Match
        </button>
      </div>

      <!-- OBS Source Creator -->
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
        <div style="font-size:.7rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;">🎬 OBS Integration</div>
        <div id="vb2-volleyball-obs-container" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <button id="vb2-create-main-btn"
            style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px solid rgba(34,197,94,0.3);border-radius:8px;background:rgba(34,197,94,0.1);color:#4ade80;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s;">
            🎬 Main Score
          </button>
          <button id="vb2-create-hist-btn"
            style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px solid rgba(34,197,94,0.3);border-radius:8px;background:rgba(34,197,94,0.1);color:#4ade80;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s;">
            🎬 History
          </button>
<!-- Point History OBS Button Removed -->
        </div>
        <div id="vb2-boxing-obs-container" style="display:grid;grid-template-columns:1fr;gap:8px;">
          <button id="vb2-create-boxing-btn"
            style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px solid rgba(220,38,38,0.3);border-radius:8px;background:rgba(220,38,38,0.12);color:#fca5a5;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s;">
            🥊 Boxing Score Overlay
          </button>
        </div>
        <p style="font-size:.7rem;color:#475569;margin-top:6px;line-height:1.4;">
          Adds Browser Sources to OBS pointing to overlays.
        </p>
      </div>
    </div>
  `;

  // Append panel after the last existing tab-content inside detailsPopup
  const detailsPopup = document.getElementById('detailsPopup');
  if (detailsPopup) {
    const lastTab = [...detailsPopup.querySelectorAll('.settings-tab-content')].pop();
    if (lastTab) lastTab.insertAdjacentElement('afterend', panel);
    else detailsPopup.appendChild(panel);
  }

  // ── 3. Inject CSS ─────────────────────────────────────────────
  if (!document.getElementById('vb2-styles')) {
    const s = document.createElement('style');
    s.id = 'vb2-styles';
    s.textContent = `
      .vb2-badge{font-size:12px;font-weight:600;padding:2px 8px;border-radius:12px;border:1px solid transparent;}
      .vb2-win-a{background:rgba(147,197,253,.12);border-color:rgba(147,197,253,.3);color:#93c5fd;}
      .vb2-win-b{background:rgba(252,165,165,.12);border-color:rgba(252,165,165,.3);color:#fca5a5;}
      .vb2-tie  {background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.4);}
      #vb2-finish-btn:hover{transform:scale(1.03);box-shadow:0 6px 20px rgba(245,158,11,0.45);}
      #vb2-reset-btn:hover{background:rgba(239,68,68,0.22);}
      #vb2-create-main-btn:hover, #vb2-create-hist-btn:hover, #vb2-create-pointhist-btn:hover, #vb2-create-boxing-btn:hover {background:rgba(34,197,94,0.2);}
      #vb2-create-boxing-btn:hover {background:rgba(239,68,68,0.2) !important;}
      #vb2-limit::-webkit-inner-spin-button{display:none;}
    `;
    document.head.appendChild(s);
  }

  // ── 4. Wire events ─────────────────────────────────────────────
  // Enable toggle
  document.getElementById('vb2-enabled-toggle').addEventListener('change', e => {
    localStorage.setItem(VB_ENABLED_KEY, e.target.checked ? 'true' : 'false');
    document.getElementById('vb2-scores-section').style.opacity     = e.target.checked ? '1' : '0.4';
    document.getElementById('vb2-scores-section').style.pointerEvents = e.target.checked ? '' : 'none';
    updateMainPanelUI(readScores());
    if (window.updateSportUI) window.updateSportUI();
  });

  // Show Serve Ball toggle
  document.getElementById('vb2-show-serve-ball-toggle').addEventListener('change', e => {
    localStorage.setItem('vb_show_serve_ball', e.target.checked ? 'true' : 'false');
    broadcast();
  });
  
  // Sport select
  document.getElementById('vb2-sport-select').addEventListener('change', e => {
    localStorage.setItem('vb_sport', e.target.value);
    updateSportUI();
    broadcast();
  });

  // Custom Colors
  const colorKeys = [
    { id: 'vb2-color-active-bg', key: 'vb_color_active_score' },
    { id: 'vb2-color-active-txt', key: 'vb_color_active_score_text' },
    { id: 'vb2-color-sets-bg', key: 'vb_color_sets_bg' },
    { id: 'vb2-color-sets-txt', key: 'vb_color_sets_text' },
    { id: 'vb2-color-logo-bg', key: 'vb_color_logo_bg' },
    { id: 'vb2-color-text', key: 'vb_color_text' },
    { id: 'vb2-color-serve', key: 'vb_color_serve' }
  ];
  colorKeys.forEach(({ id, key }) => {
    document.getElementById(id).addEventListener('change', e => {
      localStorage.setItem(key, e.target.value);
      broadcast();
    });
  });

  // Split Fonts Listeners - Team Font
  document.getElementById('vb2-font-src-team').addEventListener('change', e => {
    localStorage.setItem('vb_font_src_team', e.target.value);
    updateFontFieldsVisibility();
    injectCustomFont();
    broadcast();
  });
  document.getElementById('vb2-font-preset-team').addEventListener('change', e => {
    localStorage.setItem('vb_font_preset_team', e.target.value);
    broadcast();
  });
  document.getElementById('vb2-font-custom-name-team').addEventListener('change', e => {
    localStorage.setItem('vb_font_custom_name_team', e.target.value);
    broadcast();
  });
  document.getElementById('vb2-font-file-team').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      localStorage.setItem('vb_font_upload_data_team', ev.target.result);
      localStorage.setItem('vb_font_upload_family_team', 'CustomFontTeam');
      document.getElementById('vb2-font-status-team').textContent = '✓ Font cached';
      injectCustomFont();
      broadcast();
    };
    reader.readAsDataURL(file);
  });

  // Split Fonts Listeners - Score Font
  document.getElementById('vb2-font-src-score').addEventListener('change', e => {
    localStorage.setItem('vb_font_src_score', e.target.value);
    updateFontFieldsVisibility();
    injectCustomFont();
    broadcast();
  });
  document.getElementById('vb2-font-preset-score').addEventListener('change', e => {
    localStorage.setItem('vb_font_preset_score', e.target.value);
    broadcast();
  });
  document.getElementById('vb2-font-custom-name-score').addEventListener('change', e => {
    localStorage.setItem('vb_font_custom_name_score', e.target.value);
    broadcast();
  });
  document.getElementById('vb2-font-file-score').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      localStorage.setItem('vb_font_upload_data_score', ev.target.result);
      localStorage.setItem('vb_font_upload_family_score', 'CustomFontScore');
      document.getElementById('vb2-font-status-score').textContent = '✓ Font cached';
      injectCustomFont();
      broadcast();
    };
    reader.readAsDataURL(file);
  });

  // Initial Visibility Setup
  updateFontFieldsVisibility();
  
  // Logo Local File
  document.getElementById('vb2-logo-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setVbState(VB_LOGO_KEY, ev.target.result);
      document.getElementById('vb2-logo-preview').src = ev.target.result;
      document.getElementById('vb2-logo-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
  
  document.getElementById('vb2-logo-clear').addEventListener('click', () => {
    setVbState(VB_LOGO_KEY, '');
    document.getElementById('vb2-logo-preview').style.display = 'none';
    document.getElementById('vb2-logo-preview').src = '';
    document.getElementById('vb2-logo-file').value = '';
  });

  // Preset font select
  // Preset font listener removed
  document.getElementById('vb2-team-width').addEventListener('change', e => setVbState(VB_TEAM_WIDTH_KEY, e.target.value));
  document.getElementById('vb2-auto-serve').addEventListener('change', e => setVbState(VB_AUTO_SERVE_KEY, e.target.checked ? 'true' : 'false'));

  // Boxing Custom Sizes Listeners
  const bxSizeKeys = [
    { id: 'vb2-bx-logo-size', key: 'bx_logo_size' },
    { id: 'vb2-bx-name-font-size', key: 'bx_name_font_size' },
    { id: 'vb2-bx-name-panel-width', key: 'bx_name_panel_width' },
    { id: 'vb2-bx-name-panel-height', key: 'bx_name_panel_height' },
    { id: 'vb2-bx-time-font-size', key: 'bx_time_font_size' },
    { id: 'vb2-bx-label1-width', key: 'bx_label1_width' },
    { id: 'vb2-bx-label1-font-size', key: 'bx_label1_font_size' },
    { id: 'vb2-bx-dash-width', key: 'bx_dash_width' },
    { id: 'vb2-bx-dash-height', key: 'bx_dash_height' }
  ];
  bxSizeKeys.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      const handler = e => {
        localStorage.setItem(key, e.target.value);
        broadcast();
      };
      el.addEventListener('change', handler);
      el.addEventListener('input', handler);
    }
  });

  // Checkboxes
  const logoToggle = document.getElementById('vb2-bx-show-team-logos');
  if (logoToggle) {
    logoToggle.addEventListener('change', e => {
      localStorage.setItem('bx_show_team_logos', e.target.checked ? 'true' : 'false');
      broadcast();
    });
  }

  const label1Toggle = document.getElementById('vb2-bx-show-label1');
  if (label1Toggle) {
    label1Toggle.addEventListener('change', e => {
      localStorage.setItem('bx_show_label1', e.target.checked ? 'true' : 'false');
      broadcast();
    });
  }

  // Label 1 Select and manual input text
  const label1TypeSel = document.getElementById('vb2-bx-label1-type');
  const label1CustomTextWrapper = document.getElementById('vb2-bx-label1-custom-text-wrapper');
  const label1CustomInput = document.getElementById('vb2-bx-label1-custom-text');

  const updateLabel1Visibility = () => {
    if (label1TypeSel && label1CustomTextWrapper) {
      if (label1TypeSel.value === 'custom') {
        label1CustomTextWrapper.style.display = 'block';
      } else {
        label1CustomTextWrapper.style.display = 'none';
      }
    }
  };

  if (label1TypeSel) {
    label1TypeSel.addEventListener('change', e => {
      localStorage.setItem('bx_label1_type', e.target.value);
      updateLabel1Visibility();
      broadcast();
    });
  }

  if (label1CustomInput) {
    label1CustomInput.addEventListener('input', e => {
      localStorage.setItem('bx_label1_custom_text', e.target.value);
      broadcast();
    });
  }

  updateLabel1Visibility(); // Run on init

  // Auto Hide Listeners
  const autoHideToggle = document.getElementById('vb2-bx-auto-hide-enabled');
  const autoHideSecsWrapper = document.getElementById('vb2-bx-auto-hide-seconds-wrapper');
  const autoHideSecsInput = document.getElementById('vb2-bx-auto-hide-seconds');

  const updateAutoHideVisibility = () => {
    if (autoHideToggle && autoHideSecsWrapper) {
      autoHideSecsWrapper.style.display = autoHideToggle.checked ? 'block' : 'none';
    }
  };

  if (autoHideToggle) {
    autoHideToggle.addEventListener('change', e => {
      localStorage.setItem('bx_auto_hide_enabled', e.target.checked ? 'true' : 'false');
      updateAutoHideVisibility();
      broadcast();
    });
  }

  if (autoHideSecsInput) {
    const handler = e => {
      localStorage.setItem('bx_auto_hide_seconds', e.target.value);
      broadcast();
    };
    autoHideSecsInput.addEventListener('change', handler);
    autoHideSecsInput.addEventListener('input', handler);
  }

  updateAutoHideVisibility(); // Run on init

  // Boxing Custom Colors Listeners
  const bxColorKeys = [
    { id: 'vb2-bx-color-left', key: 'bx_color_left' },
    { id: 'vb2-bx-color-left-txt', key: 'bx_color_left_txt' },
    { id: 'vb2-bx-color-left-bg', key: 'bx_color_left_bg' },
    { id: 'vb2-bx-color-right', key: 'bx_color_right' },
    { id: 'vb2-bx-color-right-txt', key: 'bx_color_right_txt' },
    { id: 'vb2-bx-color-right-bg', key: 'bx_color_right_bg' },
    { id: 'vb2-bx-color-center-bg', key: 'bx_color_center_bg' },
    { id: 'vb2-bx-color-time-txt', key: 'bx_color_time_txt' },
    { id: 'vb2-bx-color-label1-bg', key: 'bx_color_label1_bg' },
    { id: 'vb2-bx-color-label1-txt', key: 'bx_color_label1_txt' },
    { id: 'vb2-bx-color-header-bg', key: 'bx_color_header_bg' },
    { id: 'vb2-bx-color-dash-active', key: 'bx_color_dash_active' },
    { id: 'vb2-bx-color-dash-inactive', key: 'bx_color_dash_inactive' }
  ];
  bxColorKeys.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      const handler = e => {
        localStorage.setItem(key, e.target.value);
        broadcast();
      };
      el.addEventListener('change', handler);
      el.addEventListener('input', handler);
    }
  });

  // Limit input
  const limitInput = document.getElementById('vb2-limit');
  const applyLimit = () => {
    const v = Math.max(1, Math.min(99, parseInt(limitInput.value) || 25));
    limitInput.value = v;
    saveSetLimit(v);
    broadcast();
  };
  limitInput.addEventListener('change', applyLimit);
  document.getElementById('vb2-limit-minus').addEventListener('click', () => { limitInput.value = Math.max(1, parseInt(limitInput.value) - 1); applyLimit(); });
  document.getElementById('vb2-limit-plus').addEventListener('click',  () => { limitInput.value = Math.min(99, parseInt(limitInput.value) + 1); applyLimit(); });

  // Max Sets input
  const maxSetsInput = document.getElementById('vb2-maxsets');
  const applyMaxSets = () => {
    const v = Math.max(1, Math.min(12, parseInt(maxSetsInput.value) || 5));
    maxSetsInput.value = v;
    saveMaxSets(v);
    
    // Sync with main panel's max halves
    localStorage.setItem('maxHalves', v);
    const mainSelect = document.getElementById('maxHalvesSelect');
    if (mainSelect) {
      mainSelect.value = v;
      mainSelect.dispatchEvent(new Event('change'));
    }
    
    broadcast();
  };
  maxSetsInput.addEventListener('change', applyMaxSets);
  maxSetsInput.addEventListener('input', applyMaxSets);
  document.getElementById('vb2-maxsets-minus').addEventListener('click', () => { maxSetsInput.value = Math.max(1, parseInt(maxSetsInput.value) - 1); applyMaxSets(); });
  document.getElementById('vb2-maxsets-plus').addEventListener('click',  () => { maxSetsInput.value = Math.min(12, parseInt(maxSetsInput.value) + 1); applyMaxSets(); });

  // Final Limit input
  const finalLimitInput = document.getElementById('vb2-finallimit');
  const applyFinalLimit = () => {
    const v = Math.max(1, Math.min(99, parseInt(finalLimitInput.value) || 15));
    finalLimitInput.value = v;
    saveFinalSetLimit(v);
    broadcast();
  };
  finalLimitInput.addEventListener('change', applyFinalLimit);
  document.getElementById('vb2-finallimit-minus').addEventListener('click', () => { finalLimitInput.value = Math.max(1, parseInt(finalLimitInput.value) - 1); applyFinalLimit(); });
  document.getElementById('vb2-finallimit-plus').addEventListener('click',  () => { finalLimitInput.value = Math.min(99, parseInt(finalLimitInput.value) + 1); applyFinalLimit(); });

  // Action buttons
  document.getElementById('vb2-finish-btn').addEventListener('click', finishSet);
  document.getElementById('vb2-reset-btn').addEventListener('click', resetMatch);
  document.getElementById('vb2-create-main-btn').addEventListener('click', function() { createVBSource(this, 'main'); });
  document.getElementById('vb2-create-hist-btn').addEventListener('click', function() { createVBSource(this, 'history'); });
  const pHistBtn = document.getElementById('vb2-create-pointhist-btn'); if (pHistBtn) pHistBtn.addEventListener('click', function() { createVBSource(this, 'pointhist'); });
  const boxingBtn = document.getElementById('vb2-create-boxing-btn'); if (boxingBtn) boxingBtn.addEventListener('click', function() { createVBSource(this, 'boxing'); });
  const clearHistBtn = document.getElementById('vb2-clear-history'); if (clearHistBtn) clearHistBtn.addEventListener('click', () => {
    if (confirm('Clear point history?')) {
      localStorage.setItem('score_action_history', '[]');
      updatePointHistoryList();
    }
  });

  updatePointHistoryList();
  updateSportUI();
}

function parseTimeToSeconds(tStr) {
  if (!tStr) return 0;
  const parts = tStr.trim().split(':');
  if (parts.length === 2) {
    const min = parseInt(parts[0]) || 0;
    const sec = parseInt(parts[1]) || 0;
    return min * 60 + sec;
  } else if (parts.length === 1) {
    return parseInt(parts[0]) || 0;
  }
  return 0;
}

// ── Poll loop ────────────────────────────────────────────────────────
function poll() {
  if (!isEnabled()) return;
  const { sA, sB, s2A, s2B, nA, nB, cA, cB, cA2, cB2 } = readScores();
  const timerText = document.getElementById('timerText')?.textContent || '00:00';
  const halfText = document.getElementById('halfText')?.textContent || '1st';
  const label1Text = document.getElementById('label1')?.textContent || '';
  const sport = localStorage.getItem('vb_sport') || 'volleyball';
  
  if (halfText !== lastHalf) {
    autoHiddenThisRound = false;
  }
  
  // Sync max rounds if boxing is active
  if (sport === 'boxing') {
    const currentMaxHalves = parseInt(localStorage.getItem('maxHalves') || '2');
    if (getMaxSets() !== currentMaxHalves) {
      saveMaxSets(currentMaxHalves);
      const maxSetsInput = document.getElementById('vb2-maxsets');
      if (maxSetsInput) maxSetsInput.value = currentMaxHalves;
    }
    
    // Auto Hide Boxing HUD logic
    const autoHideEnabled = getVbState('bx_auto_hide_enabled', 'false') === 'true';
    if (autoHideEnabled) {
      const autoHideSecs = parseInt(getVbState('bx_auto_hide_seconds', '30')) || 30;
      const secs = parseTimeToSeconds(timerText);
      if (secs <= autoHideSecs) {
        if (!autoHiddenThisRound && secs > 0) {
          setOBSInputEnabled('Boxing_Main_Score', false);
          autoHiddenThisRound = true;
        }
      } else {
        autoHiddenThisRound = false;
      }
    } else {
      autoHiddenThisRound = false;
    }
  }
  
  const changed = sA !== lastA || sB !== lastB || s2A !== last2A || s2B !== last2B || 
                  nA !== lastNA || nB !== lastNB || cA !== lastCA || cB !== lastCB ||
                  cA2 !== lastCA2 || cB2 !== lastCB2 ||
                  timerText !== lastTimer || halfText !== lastHalf || label1Text !== lastLabel1;
                  
  if (changed) {
    if (getVbState(VB_AUTO_SERVE_KEY, 'true') === 'true') {
      if (sA > lastA && lastA !== -1) setVbState(VB_SERVE_KEY, 'A');
      else if (sB > lastB && lastB !== -1) setVbState(VB_SERVE_KEY, 'B');
    }
    lastA = sA; lastB = sB; last2A = s2A; last2B = s2B;
    lastNA = nA; lastNB = nB; lastCA = cA; lastCB = cB;
    lastCA2 = cA2; lastCB2 = cB2;
    lastTimer = timerText; lastHalf = halfText; lastLabel1 = label1Text;
    broadcast();
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────
function boot() {
  injectCustomFont();
  injectSettingsTab();
  updateSportUI();
  updatePointHistoryList();
  broadcast(); // push initial state
  setInterval(poll, POLL_MS);
  console.log('[VB Module v2] Loaded ✅');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  // main.js DOMContentLoaded already fired; wait one tick for switchSettingsTab to be on window
  setTimeout(boot, 0);
}

// ── Public API ───────────────────────────────────────────────────────
window.vbModule = { finishSet, resetMatch, getState: () => JSON.parse(localStorage.getItem(VB_STATE_KEY) || '{}'), getHistory: loadHistory };
