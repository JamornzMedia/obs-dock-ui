// ═══════════════════════════════════════════════════════════════
//  VOLLEYBALL SCORE OVERLAY JS
//  Receives state via BroadcastChannel 'vb_score_channel'
// ═══════════════════════════════════════════════════════════════

const VB_CHANNEL = 'vb_score_channel';
const VB_STATE_KEY = 'vb_state';

let state = {
  scoreA: 0,
  scoreB: 0,
  setsA: 0,
  setsB: 0,
  setHistory: [],
  colorA: '#1e3a8a',
  colorB: '#1e3a8a',
  nameA: 'TEAM A',
  nameB: 'TEAM B',
  logoUrl: '',
  serve: null,
  timeoutsA: 0,
  timeoutsB: 0,
};

// ──────────────────────────────────────── RENDER
function renderTimeouts(containerId, used) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  // Assuming 2 timeouts max per set
  for (let i = 0; i < 2; i++) {
    const d = document.createElement('div');
    d.className = 'timeout-dot' + (i < used ? ' used' : '');
    el.appendChild(d);
  }
}

function renderHistory(history) {
  const container = document.getElementById('history-scores');
  if (!container) return;
  container.innerHTML = '';

  history.forEach((set, idx) => {
    const col = document.createElement('div');
    col.className = 'score-col history-' + ((idx % 2) + 1);
    
    const cellA = document.createElement('div');
    cellA.className = 'score-cell';
    cellA.textContent = set[0];

    const cellB = document.createElement('div');
    cellB.className = 'score-cell';
    cellB.textContent = set[1];

    col.appendChild(cellA);
    col.appendChild(cellB);
    container.appendChild(col);
  });
}

function renderScoreboard(newState, prevState) {
  const { scoreA, scoreB, setsA, setsB, setHistory, colorA, colorB, nameA, nameB, logoUrl, serve, timeoutsA, timeoutsB } = newState;

  // Colors
  const panelA = document.getElementById('panelA');
  const panelB = document.getElementById('panelB');
  if (panelA) panelA.style.background = `linear-gradient(90deg, ${colorA} 0%, rgba(0,0,0,0.5) 100%)`;
  if (panelB) panelB.style.background = `linear-gradient(90deg, ${colorB} 0%, rgba(0,0,0,0.5) 100%)`;

  // Names
  const elNameA = document.getElementById('nameA');
  const elNameB = document.getElementById('nameB');
  if (elNameA) elNameA.textContent = nameA || 'TEAM A';
  if (elNameB) elNameB.textContent = nameB || 'TEAM B';

  // Logo
  const elLogo = document.getElementById('vb-logo');
  if (elLogo) {
    if (logoUrl) {
      elLogo.src = logoUrl;
      elLogo.style.display = 'block';
    } else {
      elLogo.style.display = 'none';
    }
  }

  // Scores
  const elA = document.getElementById('scoreA');
  const elB = document.getElementById('scoreB');
  if (elA) elA.textContent = scoreA;
  if (elB) elB.textContent = scoreB;

  // Sets Won
  const elSetsA = document.getElementById('setsA');
  const elSetsB = document.getElementById('setsB');
  if (elSetsA) elSetsA.textContent = setsA;
  if (elSetsB) elSetsB.textContent = setsB;

  // Serve
  const elServeA = document.getElementById('serveA');
  const elServeB = document.getElementById('serveB');
  if (elServeA) elServeA.className = 'serve-indicator' + (serve === 'A' ? ' active' : '');
  if (elServeB) elServeB.className = 'serve-indicator' + (serve === 'B' ? ' active' : '');

  // Timeouts
  renderTimeouts('timeoutsA', timeoutsA);
  renderTimeouts('timeoutsB', timeoutsB);

  // History
  renderHistory(setHistory);
}

// ──────────────────────────────────────── STATE UPDATE
function applyState(newState, isInitial = false) {
  const prev = isInitial ? null : { ...state };
  state = { ...state, ...newState };
  renderScoreboard(state, prev);
}

// ──────────────────────────────────────── BROADCAST CHANNEL
const channel = new BroadcastChannel(VB_CHANNEL);
channel.onmessage = (e) => {
  if (e.data && e.data.type === 'vb_update') {
    applyState(e.data.payload);
  }
};

// ──────────────────────────────────────── ALSO WATCH LOCALSTORAGE (fallback)
window.addEventListener('storage', (e) => {
  if (e.key === VB_STATE_KEY && e.newValue) {
    try {
      applyState(JSON.parse(e.newValue));
    } catch (_) {}
  }
});

// ──────────────────────────────────────── INITIAL LOAD FROM LOCALSTORAGE
(function init() {
  try {
    const saved = localStorage.getItem(VB_STATE_KEY);
    if (saved) applyState(JSON.parse(saved), true);
    else renderScoreboard(state, null);
  } catch (_) {
    renderScoreboard(state, null);
  }
})();
