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
  font: 'Barlow Condensed, sans-serif',
  teamWidth: '250px',
  autoServe: true,
  timeoutActive: '',
  setLimit: 25,
  sport: 'volleyball'
};

// ──────────────────────────────────────── RENDER

function getSetLimit() {
  return state.setLimit || 25;
}

// ──────────────────────────────────────── RENDER HISTORY
function renderHistory(history, maxSets) {
  const historyEl = document.getElementById('history-scores');
  if (historyEl) {
    const totalSets = maxSets || 5;
    let headersHtml = '<div style="position:absolute; top:-24px; left:0; width:100%; display:flex; background:#1e293b; border-radius:6px 6px 0 0; overflow:hidden;">';
    let colsHtml = '';
    
    for (let i = 0; i < totalSets; i++) {
      const cls = ((i % 2) === 0) ? 'history-1' : 'history-2';
      const s = history[i];
      const sA = s ? s[0] : '-';
      const sB = s ? s[1] : '-';
      
      headersHtml += `<div style="flex:1; text-align:center; color:#fbbf24; font-size:14px; font-weight:800; line-height:24px;">S${i+1}</div>`;
      
      colsHtml += `
        <div class="score-col ${cls}">
          <div class="score-cell">${sA}</div>
          <div class="score-cell">${sB}</div>
        </div>
      `;
    }
    headersHtml += '</div>';
    
    historyEl.style.position = 'relative';
    historyEl.innerHTML = headersHtml + colsHtml;
  }
}

function injectCustomFont(customFontDataTeam, customFontFamilyTeam, customFontDataScore, customFontFamilyScore) {
  let style = document.getElementById('vb-custom-font-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'vb-custom-font-style';
    document.head.appendChild(style);
  }
  
  let css = '';
  if (customFontDataTeam && customFontFamilyTeam) {
    css += `
      @font-face {
        font-family: '${customFontFamilyTeam}';
        src: url('${customFontDataTeam}');
      }
    `;
  }
  if (customFontDataScore && customFontFamilyScore) {
    css += `
      @font-face {
        font-family: '${customFontFamilyScore}';
        src: url('${customFontDataScore}');
      }
    `;
  }
  style.textContent = css;
}

function renderScoreboard(newState, prevState) {
  const { 
    scoreA, scoreB, setsA, setsB, setHistory, 
    colorA, colorB, colorA2, colorB2, nameA, nameB, 
    logoUrl, serve, timeoutActive, fontTeam, fontScore, font, teamWidth, 
    maxSets, setLimit, finalSetLimit, timeoutsA, timeoutsB,
    sport, colorActiveScore, colorActiveScoreText, colorSetsBg,
    colorSetsText, colorLogoBg, colorText, colorServe,
    customFontDataTeam, customFontFamilyTeam, customFontDataScore, customFontFamilyScore
  } = newState;

  // Custom CSS properties
  const root = document.documentElement;
  
  // Split Fonts overrides
  const activeFontTeam = customFontFamilyTeam ? `'${customFontFamilyTeam}'` : (fontTeam || "'Kanit', sans-serif");
  root.style.setProperty('--vb-font-team', activeFontTeam);

  const activeFontScore = customFontFamilyScore ? `'${customFontFamilyScore}'` : (fontScore || "'Barlow Condensed', sans-serif");
  root.style.setProperty('--vb-font-score', activeFontScore);
  root.style.setProperty('--vb-font', activeFontScore); // legacy fallback
  
  if (teamWidth) root.style.setProperty('--team-name-width', teamWidth);

  // Apply custom styling variables if provided
  if (colorActiveScore) root.style.setProperty('--active-score-bg', colorActiveScore);
  if (colorServe) root.style.setProperty('--serve-color', colorServe);
  if (colorSetsBg) {
    root.style.setProperty('--sets-bg-top', colorSetsBg);
    root.style.setProperty('--sets-bg-bottom', colorSetsBg);
  }
  if (colorText) root.style.setProperty('--text-light', colorText);

  // Inject custom font stylesheet
  injectCustomFont(customFontDataTeam, customFontFamilyTeam, customFontDataScore, customFontFamilyScore);

  // Colors
  const panelA = document.getElementById('panelA');
  const panelB = document.getElementById('panelB');
  if (panelA) panelA.style.background = `linear-gradient(90deg, ${colorA} 0%, ${colorA2 || 'rgba(0,0,0,0.5)'} 100%)`;
  if (panelB) panelB.style.background = `linear-gradient(90deg, ${colorB} 0%, ${colorB2 || 'rgba(0,0,0,0.5)'} 100%)`;

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
  const logoArea = document.querySelector('.logo-area');
  if (logoArea && colorLogoBg) {
    logoArea.style.backgroundColor = colorLogoBg;
  }

  // Scores
  const elA = document.getElementById('scoreA');
  const elB = document.getElementById('scoreB');
  if (elA) elA.textContent = scoreA;
  if (elB) elB.textContent = scoreB;

  // Active score cell styling text color
  const activeScoreCell = document.querySelector('.score-col.active');
  if (activeScoreCell && colorActiveScoreText) {
    activeScoreCell.style.color = colorActiveScoreText;
  }

  // Sets Won (Fouls/Sets)
  const elSetsA = document.getElementById('setsA');
  const elSetsB = document.getElementById('setsB');
  if (elSetsA) {
    elSetsA.textContent = setsA;
    if (colorSetsText) elSetsA.style.color = colorSetsText;
  }
  if (elSetsB) {
    elSetsB.textContent = setsB;
    if (colorSetsText) elSetsB.style.color = colorSetsText;
  }

  // Sport support variables
  const activeSport = sport || 'volleyball';
  const serveSupport = (activeSport === 'volleyball' || activeSport === 'badminton');
  const timeoutSupport = (activeSport !== 'badminton');

  // Serve
  const elServeA = document.getElementById('serveA');
  const elServeB = document.getElementById('serveB');
  if (elServeA) {
    elServeA.style.display = serveSupport ? 'block' : 'none';
    if (serveSupport) {
      elServeA.className = 'serve-indicator' + (serve === 'A' ? ' active' : '');
      elServeA.textContent = '🏐';
    }
  }
  if (elServeB) {
    elServeB.style.display = serveSupport ? 'block' : 'none';
    if (serveSupport) {
      elServeB.className = 'serve-indicator' + (serve === 'B' ? ' active' : '');
      elServeB.textContent = '🏐';
    }
  }

  // Timeouts (dots indicator)
  const elTimeoutsA = document.getElementById('timeoutsA');
  const elTimeoutsB = document.getElementById('timeoutsB');
  if (elTimeoutsA) {
    elTimeoutsA.style.display = timeoutSupport ? 'flex' : 'none';
    if (timeoutSupport) {
      elTimeoutsA.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        const dot = document.createElement('div');
        dot.className = 'timeout-dot' + (i < timeoutsA ? ' active' : '');
        elTimeoutsA.appendChild(dot);
      }
    }
  }
  if (elTimeoutsB) {
    elTimeoutsB.style.display = timeoutSupport ? 'flex' : 'none';
    if (timeoutSupport) {
      elTimeoutsB.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        const dot = document.createElement('div');
        dot.className = 'timeout-dot' + (i < timeoutsB ? ' active' : '');
        elTimeoutsB.appendChild(dot);
      }
    }
  }

  // Calculate Set Point
  const isFinalSet = setHistory && (setHistory.length === (maxSets || 5) - 1);
  const currentLimit = isFinalSet ? (finalSetLimit || 15) : (setLimit || 25);
  const isSetPointA = (scoreA === Math.max(currentLimit, scoreB + 2) - 1);
  const isSetPointB = (scoreB === Math.max(currentLimit, scoreA + 2) - 1);

  const statusA = document.getElementById('statusA');
  const statusB = document.getElementById('statusB');
  const txtA = document.getElementById('statusTextA');
  const txtB = document.getElementById('statusTextB');

  const anyTimeout = (timeoutActive === 'A' || timeoutActive === 'B');

  if (statusA && txtA) {
    if (timeoutActive === 'A') {
      statusA.className = 'status-cell timeout';
      txtA.textContent = 'TIMEOUT';
    } else if (isSetPointA && !anyTimeout && activeSport === 'volleyball') {
      statusA.className = 'status-cell setpoint';
      txtA.textContent = 'SET POINT';
    } else {
      statusA.className = 'status-cell';
      txtA.textContent = '';
    }
  }

  if (statusB && txtB) {
    if (timeoutActive === 'B') {
      statusB.className = 'status-cell timeout';
      txtB.textContent = 'TIMEOUT';
    } else if (isSetPointB && !anyTimeout && activeSport === 'volleyball') {
      statusB.className = 'status-cell setpoint';
      txtB.textContent = 'SET POINT';
    } else {
      statusB.className = 'status-cell';
      txtB.textContent = '';
    }
  }

  // History
  renderHistory(setHistory, maxSets);
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
