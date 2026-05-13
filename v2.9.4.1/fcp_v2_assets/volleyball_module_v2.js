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
const VB_ENABLED_KEY = 'vb_enabled';
const VB_CHANNEL     = 'vb_score_channel';
const TAB_ID         = 'settingsTabVolleyball';
const OVERLAY_PATH   = 'fcp_v2_assets/volleyball_score.html';
const POLL_MS        = 300;

// ── BroadcastChannel ────────────────────────────────────────────────
let bc = null;
try { bc = new BroadcastChannel(VB_CHANNEL); } catch (_) {}

// ── State ────────────────────────────────────────────────────────────
let lastA = -1, lastB = -1, last2A = -1, last2B = -1;

function getSetLimit()      { return Math.max(1, parseInt(localStorage.getItem(VB_LIMIT_KEY) || '25')); }
function saveSetLimit(v)    { localStorage.setItem(VB_LIMIT_KEY, String(v)); }
function loadHistory()      { try { return JSON.parse(localStorage.getItem(VB_HISTORY_KEY) || '[]'); } catch(_){ return []; } }
function saveHistory(h)     { localStorage.setItem(VB_HISTORY_KEY, JSON.stringify(h)); }
function isEnabled()        { return localStorage.getItem(VB_ENABLED_KEY) !== 'false'; }

// ── DOM Score Readers ────────────────────────────────────────────────
function readScores() {
  return {
    sA:  parseInt(document.getElementById('scoreA')?.textContent  ?? '0') || 0,
    sB:  parseInt(document.getElementById('scoreB')?.textContent  ?? '0') || 0,
    s2A: parseInt(document.getElementById('score2A')?.textContent ?? '0') || 0,
    s2B: parseInt(document.getElementById('score2B')?.textContent ?? '0') || 0,
    cA:  document.getElementById('colorA')?.value || '#1e3a8a',
    cB:  document.getElementById('colorB')?.value || '#7f1d1d',
  };
}

// ── Broadcast State ──────────────────────────────────────────────────
function broadcast() {
  const { sA, sB, s2A, s2B, cA, cB } = readScores();
  const payload = {
    scoreA: sA, scoreB: sB,
    setsA: s2A, setsB: s2B,
    setHistory: loadHistory(),
    setLimit: getSetLimit(),
    colorA: cA, colorB: cB,
  };
  try { localStorage.setItem(VB_STATE_KEY, JSON.stringify(payload)); } catch (_) {}
  if (bc) bc.postMessage({ type: 'vb_update', payload });
  updateCardUI(payload);
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

  setTimeout(broadcast, 150);
  vbToast('🏁 Set finished & archived!', 'success');
}

function resetMatch() {
  if (!confirm('Reset ALL volleyball sets, match score, and history?')) return;
  saveHistory([]);
  document.getElementById('resetScore2Btn')?.click();
  document.getElementById('resetScoreBtn')?.click();
  setTimeout(broadcast, 150);
  vbToast('🔄 Match reset.', 'info');
}

// ── OBS Source Creator ────────────────────────────────────────────────
async function createVBOverlaySource(btn) {
  const obs = window.fcpOBS; // exposed by main.js (see export block below)
  if (!obs) {
    vbToast('❌ OBS not connected — start OBS WebSocket first.', 'error');
    return;
  }
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'; }

    const scene = await obs.call('GetCurrentProgramScene');
    const sceneName = scene.currentProgramSceneName;

    // Absolute path to the overlay HTML (local file)
    const absPath = window.location.href.replace(/\/[^/]*$/, '') + '/' + OVERLAY_PATH;

    await obs.call('CreateInput', {
      sceneName,
      inputName:    'Volleyball_Overlay',
      inputKind:    'browser_source',
      inputSettings: {
        url:    absPath,
        width:  600,
        height: 200,
        css:    'body { background: transparent !important; }',
        shutdown: false,
        reroute_audio: false,
      },
      sceneItemEnabled: true,
    });

    vbToast('✅ Volleyball_Overlay source created in OBS!', 'success');
    if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Created!'; }
  } catch (err) {
    const msg = err?.message || err?.error || String(err);
    if (msg.includes('already exists') || err?.code === 601) {
      vbToast('⚠️ Volleyball_Overlay already exists.', 'info');
      if (btn) btn.innerHTML = '<i class="fas fa-check"></i> Already exists';
    } else {
      vbToast('❌ OBS Error: ' + msg, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '🎬 Create VB Overlay in OBS'; }
    }
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
function injectSettingsTab() {
  if (document.getElementById(TAB_ID)) return; // Already injected

  // ── 1. Tab button ─────────────────────────────────────────────
  const tabsContainer = document.getElementById('settingsTabs');
  if (!tabsContainer) { console.warn('[VB] #settingsTabs not found — retrying in 1s'); setTimeout(injectSettingsTab, 1000); return; }

  const tabBtn = document.createElement('button');
  tabBtn.className = 'settings-tab-btn';
  tabBtn.setAttribute('data-tab', TAB_ID);
  tabBtn.innerHTML = '🏐 Volleyball';
  tabBtn.style.color = '#f59e0b';
  tabsContainer.appendChild(tabBtn);

  // Wire into existing switchSettingsTab (exposed on window by main.js)
  tabBtn.addEventListener('click', () => {
    if (window.switchSettingsTab) window.switchSettingsTab(TAB_ID);
  });

  // ── 2. Tab content panel ──────────────────────────────────────
  const enabled = isEnabled();
  const limit   = getSetLimit();

  const panel = document.createElement('div');
  panel.className = 'settings-tab-content';
  panel.id = TAB_ID;
  panel.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <h4 style="margin:0;font-size:1rem;display:flex;align-items:center;gap:8px;">
        <span>🏐</span> Volleyball Settings
      </h4>
      <span id="vb2-set-label" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);color:#f59e0b;border-radius:20px;padding:2px 12px;font-size:11px;font-weight:700;letter-spacing:.08em;">SET 1</span>
    </div>

    <!-- Enable Toggle -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;margin-bottom:14px;border:1px solid rgba(255,255,255,0.06);">
      <div>
        <div style="font-size:.9rem;font-weight:600;color:#e2e8f0;">Enable Volleyball Mode</div>
        <div style="font-size:.75rem;color:#64748b;margin-top:2px;">Activates score sync & overlay broadcasting</div>
      </div>
      <label class="container-toggle" style="display:flex;align-items:center;cursor:pointer;margin:0;">
        <div class="toggle-switch">
          <input type="checkbox" id="vb2-enabled-toggle" ${enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </div>
      </label>
    </div>

    <!-- Live Score Mirror -->
    <div id="vb2-scores-section" style="${enabled ? '' : 'opacity:.4;pointer-events:none;'}">
      <div style="display:grid;grid-template-columns:1fr 24px 1fr;align-items:center;background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.05);">
        <div style="text-align:center;">
          <div id="vb2-score-a" style="font-size:2.8rem;font-weight:800;line-height:1;color:#fff;">0</div>
          <div style="font-size:.7rem;color:#64748b;margin-top:2px;">TEAM A PTS</div>
          <div style="margin-top:4px;font-size:.75rem;color:#93c5fd;">Sets: <strong id="vb2-sets-a" style="color:#93c5fd;">0</strong></div>
        </div>
        <div style="text-align:center;color:rgba(255,255,255,0.2);font-weight:700;">:</div>
        <div style="text-align:center;">
          <div id="vb2-score-b" style="font-size:2.8rem;font-weight:800;line-height:1;color:#fff;">0</div>
          <div style="font-size:.7rem;color:#64748b;margin-top:2px;">TEAM B PTS</div>
          <div style="margin-top:4px;font-size:.75rem;color:#fca5a5;">Sets: <strong id="vb2-sets-b" style="color:#fca5a5;">0</strong></div>
        </div>
      </div>

      <!-- Set Point Limit -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <label style="font-size:.85rem;font-weight:600;color:#cbd5e1;">🎯 Set Point Limit</label>
        <div style="display:flex;align-items:center;gap:5px;">
          <button id="vb2-limit-minus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">−</button>
          <input id="vb2-limit" type="number" min="1" max="99" value="${limit}"
            style="width:54px;text-align:center;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:14px;font-weight:700;padding:4px 0;">
          <button id="vb2-limit-plus" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">+</button>
        </div>
      </div>

      <!-- Set History Preview -->
      <div style="margin-bottom:14px;">
        <div style="font-size:.7rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">📋 Set History</div>
        <div id="vb2-history-prev" style="display:flex;flex-wrap:wrap;gap:5px;min-height:22px;">
          <span style="color:rgba(255,255,255,0.3);font-size:11px">No finished sets yet</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
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
        <button id="vb2-create-src-btn"
          style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px solid rgba(34,197,94,0.3);border-radius:8px;background:rgba(34,197,94,0.1);color:#4ade80;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s;">
          🎬 Create VB Overlay in OBS
        </button>
        <p style="font-size:.7rem;color:#475569;margin-top:6px;line-height:1.4;">
          Adds a Browser Source named <code style="color:#f59e0b;font-size:.65rem;">Volleyball_Overlay</code> to your current OBS scene pointing to <code style="color:#f59e0b;font-size:.65rem;">fcp_v2_assets/volleyball_score.html</code>.
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
      #vb2-create-src-btn:hover{background:rgba(34,197,94,0.2);}
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

  // Action buttons
  document.getElementById('vb2-finish-btn').addEventListener('click', finishSet);
  document.getElementById('vb2-reset-btn').addEventListener('click', resetMatch);
  document.getElementById('vb2-create-src-btn').addEventListener('click', function() { createVBOverlaySource(this); });
}

// ── Poll loop ────────────────────────────────────────────────────────
function poll() {
  if (!isEnabled()) return;
  const { sA, sB, s2A, s2B } = readScores();
  if (sA !== lastA || sB !== lastB || s2A !== last2A || s2B !== last2B) {
    lastA = sA; lastB = sB; last2A = s2A; last2B = s2B;
    broadcast();
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────
function boot() {
  injectSettingsTab();
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
