// ═══════════════════════════════════════════════════════════════════════════
//  VOLLEYBALL MODULE  —  volleyball_module.js  (v1.0)
//  Standalone add-on for OBSScore Control Panel V2.9.x
//
//  Data Mapping:
//    masterTeamA.score  → Current Set Points for Team A
//    masterTeamB.score  → Current Set Points for Team B
//    masterTeamA.score2 → Sets Won by Team A
//    masterTeamB.score2 → Sets Won by Team B
//
//  Communication:
//    - Reads/writes via BroadcastChannel 'vb_score_channel'
//    - Mirrors state to localStorage key 'vb_state' (fallback for overlay)
//    - Hooks into window.changeScore / window.changeScore2 via polling proxy
//    - Does NOT modify main.js, does NOT use window.obs directly
// ═══════════════════════════════════════════════════════════════════════════

(function VBModule() {
  'use strict';

  // ──────────────────────────── CONSTANTS
  const VB_CHANNEL    = 'vb_score_channel';
  const VB_STATE_KEY  = 'vb_state';
  const VB_HISTORY_KEY = 'vb_set_history';
  const VB_LIMIT_KEY  = 'vb_set_limit';
  const CARD_ID       = 'vb-manager-card';
  const POLL_INTERVAL = 300; // ms — how often to poll masterTeamA/B for changes

  // ──────────────────────────── BROADCAST CHANNEL
  let channel;
  try {
    channel = new BroadcastChannel(VB_CHANNEL);
  } catch (e) {
    channel = null;
    console.warn('[VB] BroadcastChannel not available, falling back to localStorage only.');
  }

  // ──────────────────────────── STATE
  let vbState = {
    scoreA   : 0,
    scoreB   : 0,
    setsA    : 0,
    setsB    : 0,
    setHistory: [],
    setLimit : parseInt(localStorage.getItem(VB_LIMIT_KEY) || '25'),
    colorA   : '#1e3a8a',
    colorB   : '#7f1d1d',
  };

  let lastPolledA = -1;
  let lastPolledB = -1;
  let lastSets2A  = -1;
  let lastSets2B  = -1;

  // ──────────────────────────── HELPERS
  function getMasterTeams() {
    // masterTeamA / masterTeamB are module-level vars in main.js.
    // They are NOT on window — BUT main.js calls window.broadcastToMobile()
    // and also calls the functions on window. We reach them through the injected
    // UI which reflects their values, OR through score element text, OR via
    // window.vbGetState if we expose it from main.js.
    // Safe approach: read from the score display elements in the DOM.
    const sA = parseInt(document.getElementById('scoreA')?.textContent ?? '0') || 0;
    const sB = parseInt(document.getElementById('scoreB')?.textContent ?? '0') || 0;
    const s2A = parseInt(document.getElementById('score2A')?.textContent ?? '0') || 0;
    const s2B = parseInt(document.getElementById('score2B')?.textContent ?? '0') || 0;

    // Colors from the color picker inputs
    const cA = document.getElementById('colorA')?.value || '#1e3a8a';
    const cB = document.getElementById('colorB')?.value || '#7f1d1d';

    return { sA, sB, s2A, s2B, cA, cB };
  }

  function broadcastState() {
    const payload = { ...vbState };
    // Save to localStorage (overlay fallback)
    try { localStorage.setItem(VB_STATE_KEY, JSON.stringify(payload)); } catch (_) {}
    // BroadcastChannel (live update)
    if (channel) {
      channel.postMessage({ type: 'vb_update', payload });
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(VB_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function saveHistory(history) {
    localStorage.setItem(VB_HISTORY_KEY, JSON.stringify(history));
  }

  function getSetLimit() {
    return parseInt(localStorage.getItem(VB_LIMIT_KEY) || '25');
  }

  function saveSetLimit(val) {
    localStorage.setItem(VB_LIMIT_KEY, String(val));
  }

  // ──────────────────────────── UI HELPERS (uses changeScore via main.js buttons)
  function clickChangeScore(team, delta) {
    // Since changeScore is module-scoped, we drive it via the existing UI buttons.
    // This is the cleanest non-invasive approach.
    if (delta > 0) {
      const btn = document.getElementById(team === 'A' ? 'scoreAPlusBtn' : 'scoreBPlusBtn');
      for (let i = 0; i < Math.abs(delta); i++) btn?.click();
    } else if (delta < 0) {
      const btn = document.getElementById(team === 'A' ? 'scoreAMinusBtn' : 'scoreBMinusBtn');
      for (let i = 0; i < Math.abs(delta); i++) btn?.click();
    }
  }

  function clickChangeScore2(team, delta) {
    if (delta > 0) {
      const btn = document.getElementById(team === 'A' ? 'score2APlusBtn' : 'score2BPlusBtn');
      for (let i = 0; i < Math.abs(delta); i++) btn?.click();
    } else if (delta < 0) {
      const btn = document.getElementById(team === 'A' ? 'score2AMinusBtn' : 'score2BMinusBtn');
      for (let i = 0; i < Math.abs(delta); i++) btn?.click();
    }
  }

  function clickResetScore() {
    document.getElementById('resetScoreBtn')?.click();
  }

  function clickResetScore2() {
    document.getElementById('resetScore2Btn')?.click();
  }

  // ──────────────────────────── CORE VOLLEYBALL ACTIONS

  /**
   * finishSet()
   * 1. Archive current scores to setHistory
   * 2. Increment score2 (sets won) for the winner
   * 3. Reset score (current set points) to 0
   */
  function finishSet() {
    const { sA, sB, s2A, s2B, cA, cB } = getMasterTeams();

    if (sA === 0 && sB === 0) {
      showVBToast('⚠️ Both scores are 0. Are you sure?', 'warn');
    }

    // Archive
    const history = loadHistory();
    history.push([sA, sB]);
    saveHistory(history);

    // Determine winner and increment score2
    if (sA > sB) {
      clickChangeScore2('A', 1);
    } else if (sB > sA) {
      clickChangeScore2('B', 1);
    }
    // Tie: no sets awarded

    // Reset current set scores
    clickResetScore();

    // Update local state and broadcast immediately
    setTimeout(() => syncFromDOM(true), 100);

    showVBToast('✅ Set archived! Scores reset.', 'success');
  }

  /**
   * resetAllSets()
   * Clears set history, resets score2 (sets won), resets score (current)
   */
  function resetAllSets() {
    if (!confirm('Reset ALL sets (history + match score)? This cannot be undone.')) return;

    saveHistory([]);
    clickResetScore2();
    clickResetScore();

    vbState.setHistory = [];
    vbState.setsA = 0;
    vbState.setsB = 0;
    vbState.scoreA = 0;
    vbState.scoreB = 0;
    broadcastState();

    showVBToast('🔄 All sets reset.', 'info');
  }

  // ──────────────────────────── POLLING (sync from DOM)
  function syncFromDOM(force = false) {
    const { sA, sB, s2A, s2B, cA, cB } = getMasterTeams();
    const history = loadHistory();
    const limit   = getSetLimit();

    const changed = force
      || sA !== lastPolledA || sB !== lastPolledB
      || s2A !== lastSets2A || s2B !== lastSets2B;

    if (changed) {
      lastPolledA = sA;
      lastPolledB = sB;
      lastSets2A  = s2A;
      lastSets2B  = s2B;

      vbState = {
        scoreA: sA,
        scoreB: sB,
        setsA: s2A,
        setsB: s2B,
        setHistory: history,
        setLimit: limit,
        colorA: cA,
        colorB: cB,
      };
      broadcastState();
      updateCardUI();
    }
  }

  // ──────────────────────────── CARD UI UPDATE
  function updateCardUI() {
    const el = (id) => document.getElementById(id);

    // Live score mirror
    if (el('vb-live-a')) el('vb-live-a').textContent = vbState.scoreA;
    if (el('vb-live-b')) el('vb-live-b').textContent = vbState.scoreB;

    // Sets won
    if (el('vb-sets-a')) el('vb-sets-a').textContent = vbState.setsA;
    if (el('vb-sets-b')) el('vb-sets-b').textContent = vbState.setsB;

    // Current set number
    const setNum = vbState.setHistory.length + 1;
    if (el('vb-current-set')) el('vb-current-set').textContent = setNum;

    // History preview
    const histPrev = el('vb-history-preview');
    if (histPrev) {
      if (vbState.setHistory.length === 0) {
        histPrev.innerHTML = '<span style="color:rgba(255,255,255,0.35);font-size:12px;">No sets finished yet</span>';
      } else {
        histPrev.innerHTML = vbState.setHistory.map((s, i) =>
          `<span class="vb-hist-badge ${s[0] > s[1] ? 'vb-win-a' : s[1] > s[0] ? 'vb-win-b' : 'vb-tie'}"
          >S${i+1}: <b>${s[0]}</b>–<b>${s[1]}</b></span>`
        ).join('');
      }
    }
  }

  // ──────────────────────────── TOAST
  function showVBToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) { console.log('[VB]', msg); return; }
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'success' : type === 'warn' ? 'error' : 'info'}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ──────────────────────────── INJECT CARD HTML
  function injectCard() {
    if (document.getElementById(CARD_ID)) return; // Already injected

    const card = document.createElement('div');
    card.id = CARD_ID;
    card.className = 'card'; // uses existing FCP card styling
    card.innerHTML = `
      <div class="vb-card-header">
        <span class="vb-card-icon">🏐</span>
        <h3 class="vb-card-title">Volleyball Manager</h3>
        <span id="vb-current-set" class="vb-set-badge">SET 1</span>
      </div>

      <!-- Live Score Mirror -->
      <div class="vb-scoreline">
        <div class="vb-score-col">
          <div class="vb-score-val" id="vb-live-a">0</div>
          <div class="vb-score-label">Team A — Pts</div>
        </div>
        <div class="vb-score-sep">:</div>
        <div class="vb-score-col">
          <div class="vb-score-val" id="vb-live-b">0</div>
          <div class="vb-score-label">Team B — Pts</div>
        </div>
      </div>

      <!-- Sets Won -->
      <div class="vb-sets-row">
        <div class="vb-sets-item vb-sets-a">
          <span class="vb-sets-num" id="vb-sets-a">0</span>
          <span class="vb-sets-label">Sets A</span>
        </div>
        <div class="vb-sets-sep">vs</div>
        <div class="vb-sets-item vb-sets-b">
          <span class="vb-sets-num" id="vb-sets-b">0</span>
          <span class="vb-sets-label">Sets B</span>
        </div>
      </div>

      <!-- Set Limit Input -->
      <div class="vb-setting-row">
        <label class="vb-label" for="vb-limit-input">🎯 Set Point Limit</label>
        <div class="vb-limit-controls">
          <button class="vb-limit-btn" id="vb-limit-minus">−</button>
          <input type="number" id="vb-limit-input" class="vb-limit-input" value="${getSetLimit()}" min="1" max="99">
          <button class="vb-limit-btn" id="vb-limit-plus">+</button>
        </div>
      </div>

      <!-- History Preview -->
      <div class="vb-history-wrap">
        <div class="vb-history-label">📋 Set History</div>
        <div id="vb-history-preview" class="vb-history-badges">
          <span style="color:rgba(255,255,255,0.35);font-size:12px;">No sets finished yet</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="vb-actions">
        <button id="vb-finish-set-btn" class="vb-btn vb-btn-primary">
          <span>🏁</span> Finish Set
        </button>
        <button id="vb-reset-all-btn" class="vb-btn vb-btn-danger">
          <span>🔄</span> Reset All Sets
        </button>
      </div>

      <div class="vb-footer-note">
        Synced to OBS via BroadcastChannel → <code>volleyball_score.html</code>
      </div>
    `;

    // Find a good insertion point: after the score2 card or the swapCard
    const anchor =
      document.getElementById('swapCard') ||
      document.getElementById('score2Card') ||
      document.querySelector('.card');

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(card, anchor.nextSibling);
    } else {
      document.body.appendChild(card);
    }

    // ── Inject CSS
    injectCardStyles();

    // ── Wire up buttons
    document.getElementById('vb-finish-set-btn').addEventListener('click', finishSet);
    document.getElementById('vb-reset-all-btn').addEventListener('click', resetAllSets);

    // Limit input
    const limitInput = document.getElementById('vb-limit-input');
    const updateLimit = () => {
      const val = Math.max(1, Math.min(99, parseInt(limitInput.value) || 25));
      limitInput.value = val;
      saveSetLimit(val);
      vbState.setLimit = val;
      broadcastState();
    };
    limitInput.addEventListener('change', updateLimit);
    document.getElementById('vb-limit-minus').addEventListener('click', () => {
      limitInput.value = Math.max(1, parseInt(limitInput.value) - 1);
      updateLimit();
    });
    document.getElementById('vb-limit-plus').addEventListener('click', () => {
      limitInput.value = Math.min(99, parseInt(limitInput.value) + 1);
      updateLimit();
    });
  }

  // ──────────────────────────── INJECT CARD STYLES
  function injectCardStyles() {
    if (document.getElementById('vb-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'vb-module-styles';
    style.textContent = `
      /* ── Volleyball Manager Card ───────────────────────────── */
      #vb-manager-card {
        border-top: 2px solid #f59e0b;
        padding: 14px 14px 10px;
      }
      .vb-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .vb-card-icon { font-size: 18px; }
      .vb-card-title {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.04em;
        flex: 1;
        margin: 0;
      }
      .vb-set-badge {
        background: rgba(245,158,11,0.18);
        border: 1px solid rgba(245,158,11,0.45);
        color: #f59e0b;
        border-radius: 20px;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      /* Score mirror */
      .vb-scoreline {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
        padding: 8px 0;
        margin-bottom: 10px;
      }
      .vb-score-col { text-align: center; flex: 1; }
      .vb-score-val {
        font-size: 36px;
        font-weight: 900;
        line-height: 1;
        color: #fff;
        font-family: 'Barlow Condensed', monospace;
      }
      .vb-score-label {
        font-size: 10px;
        color: rgba(255,255,255,0.45);
        margin-top: 2px;
        letter-spacing: 0.06em;
      }
      .vb-score-sep {
        font-size: 20px;
        font-weight: 700;
        color: rgba(255,255,255,0.3);
      }

      /* Sets won */
      .vb-sets-row {
        display: flex;
        align-items: center;
        justify-content: space-around;
        margin-bottom: 12px;
        padding: 6px 0;
        border-top: 1px solid rgba(255,255,255,0.06);
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .vb-sets-item { text-align: center; }
      .vb-sets-num {
        display: block;
        font-size: 22px;
        font-weight: 900;
        line-height: 1;
      }
      .vb-sets-a .vb-sets-num { color: #93c5fd; }
      .vb-sets-b .vb-sets-num { color: #fca5a5; }
      .vb-sets-label {
        font-size: 10px;
        color: rgba(255,255,255,0.4);
        letter-spacing: 0.06em;
      }
      .vb-sets-sep {
        font-size: 11px;
        color: rgba(255,255,255,0.25);
        font-weight: 700;
        letter-spacing: 0.1em;
      }

      /* Set limit */
      .vb-setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
      }
      .vb-label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255,255,255,0.7);
      }
      .vb-limit-controls { display: flex; align-items: center; gap: 4px; }
      .vb-limit-btn {
        width: 26px; height: 26px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.07);
        color: #fff;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
        display: flex; align-items: center; justify-content: center;
        padding: 0;
      }
      .vb-limit-btn:hover { background: rgba(245,158,11,0.25); }
      .vb-limit-input {
        width: 52px;
        text-align: center;
        background: rgba(0,0,0,0.25);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        padding: 3px 0;
      }
      .vb-limit-input::-webkit-inner-spin-button { display: none; }

      /* History */
      .vb-history-wrap { margin-bottom: 12px; }
      .vb-history-label {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.45);
        letter-spacing: 0.08em;
        margin-bottom: 6px;
      }
      .vb-history-badges { display: flex; flex-wrap: wrap; gap: 5px; min-height: 22px; }
      .vb-hist-badge {
        font-size: 12px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid transparent;
      }
      .vb-win-a {
        background: rgba(147,197,253,0.12);
        border-color: rgba(147,197,253,0.3);
        color: #93c5fd;
      }
      .vb-win-b {
        background: rgba(252,165,165,0.12);
        border-color: rgba(252,165,165,0.3);
        color: #fca5a5;
      }
      .vb-tie {
        background: rgba(255,255,255,0.06);
        border-color: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.5);
      }

      /* Action buttons */
      .vb-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 10px;
      }
      .vb-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 10px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        letter-spacing: 0.03em;
      }
      .vb-btn:active { transform: scale(0.96); }
      .vb-btn-primary {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #1a0f00;
        box-shadow: 0 4px 12px rgba(245,158,11,0.35);
      }
      .vb-btn-primary:hover {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        box-shadow: 0 4px 20px rgba(245,158,11,0.5);
      }
      .vb-btn-danger {
        background: rgba(239,68,68,0.15);
        border: 1px solid rgba(239,68,68,0.35);
        color: #fca5a5;
      }
      .vb-btn-danger:hover {
        background: rgba(239,68,68,0.28);
      }

      /* Footer note */
      .vb-footer-note {
        font-size: 10px;
        color: rgba(255,255,255,0.2);
        text-align: center;
        letter-spacing: 0.04em;
      }
      .vb-footer-note code {
        color: rgba(245,158,11,0.5);
        font-size: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  // ──────────────────────────── BOOT
  function boot() {
    // Restore history from localStorage
    vbState.setHistory = loadHistory();
    vbState.setLimit   = getSetLimit();

    // Inject the card into the FCP HTML
    injectCard();

    // Initial sync
    setTimeout(() => syncFromDOM(true), 500);

    // Poll for DOM score changes
    setInterval(() => syncFromDOM(), POLL_INTERVAL);

    console.log('[VB] Volleyball Module v1.0 loaded ✅');
  }

  // ──────────────────────────── EXPOSE FOR DEBUGGING
  window.vbModule = {
    finishSet,
    resetAllSets,
    getState: () => ({ ...vbState }),
    getHistory: loadHistory,
  };

  // Boot after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
