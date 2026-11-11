// ═══════════════════════════════════════════════════════════════════════
//  futsal_module.js — Futsal accumulated fouls for OBSScore V2.9.6.0
//
//  • Sport Graphics Settings → Active Sport → "Futsal / ฟุตซอล"
//  • Dock card under Score 2: fouls of team A and team B (+ / −, reset).
//    From the 6th foul every foul is a direct free kick, so 5+ turns red.
//  • Fouls go back to 0 when the half changes (can be turned off on the card).
//  • Sent to PlayScore as teamA.fouls / teamB.fouls and to the OBS text
//    sources "fouls_team_a" / "fouls_team_b" when they exist.
//  State lives in localStorage "fs_fouls_a", "fs_fouls_b", "fs_reset_half".
// ═══════════════════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);
const getInt = (k) => { const n = parseInt(localStorage.getItem(k) || '0', 10); return Number.isFinite(n) && n > 0 ? n : 0; };
// Fouls are a control, not an HTML graphic, so the card shows whenever futsal is the sport.
const isActive = () => (localStorage.getItem('vb_sport') || 'volleyball') === 'futsal';
const resetOnHalf = () => localStorage.getItem('fs_reset_half') !== 'false';
const DFK_FROM = 6; // 6th accumulated foul onwards = direct free kick

let lastHalf = null;
let lastSent = '';

function publish(force = false) {
  const a = getInt('fs_fouls_a'), b = getInt('fs_fouls_b');
  const key = `${a}|${b}`;
  if (!force && key === lastSent) return;
  lastSent = key;
  if (typeof window.pushPlayScore === 'function') window.pushPlayScore({ 'teamA.fouls': a, 'teamB.fouls': b });
  const obs = window.fcpOBS;
  if (obs && typeof obs.call === 'function') {
    // Optional text sources; a missing source is not an error.
    obs.call('SetInputSettings', { inputName: 'fouls_team_a', inputSettings: { text: String(a) } }).catch(() => {});
    obs.call('SetInputSettings', { inputName: 'fouls_team_b', inputSettings: { text: String(b) } }).catch(() => {});
  }
}

function change(team, delta) {
  const k = team === 'A' ? 'fs_fouls_a' : 'fs_fouls_b';
  localStorage.setItem(k, String(Math.max(0, getInt(k) + delta)));
  render();
  publish();
}

function reset() {
  localStorage.setItem('fs_fouls_a', '0');
  localStorage.setItem('fs_fouls_b', '0');
  render();
  publish();
}

function ensureCard() {
  let card = $('futsalFoulsCard');
  if (card) return card;
  const anchor = $('score2Card');
  if (!anchor) return null;
  card = document.createElement('div');
  card.id = 'futsalFoulsCard';
  card.className = 'card';
  card.style.cssText = 'border:1px solid #f59e0b;display:none;padding:8px;';
  card.innerHTML = `
    <style>
      #futsalFoulsCard .fs-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:.72rem;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:.5px}
      #futsalFoulsCard .fs-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}
      #futsalFoulsCard .fs-team{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
      #futsalFoulsCard .fs-name{font-size:.7rem;font-weight:700;color:#cbd5e1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #futsalFoulsCard .fs-count{font-size:1.9rem;font-weight:900;line-height:1;color:#fff}
      #futsalFoulsCard .fs-team.is-dfk .fs-count{color:#f87171}
      #futsalFoulsCard .fs-dots{display:flex;gap:3px}
      #futsalFoulsCard .fs-dots i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.15)}
      #futsalFoulsCard .fs-dots i.on{background:#fbbf24}
      #futsalFoulsCard .fs-team.is-dfk .fs-dots i.on{background:#ef4444}
      #futsalFoulsCard .fs-btns{display:flex;gap:4px;width:100%}
      #futsalFoulsCard .fs-btns button{flex:1;min-height:0;padding:7px 0;font-weight:800;border-radius:6px}
      #futsalFoulsCard .fs-dfk{font-size:.6rem;font-weight:800;color:#fecaca;background:rgba(239,68,68,.25);border-radius:4px;padding:1px 5px;visibility:hidden}
      #futsalFoulsCard .fs-team.is-dfk .fs-dfk{visibility:visible}
      #futsalFoulsCard .fs-foot{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:.66rem;color:#94a3b8;gap:6px}
      #futsalFoulsCard .fs-foot label{display:flex;align-items:center;gap:4px;cursor:pointer}
    </style>
    <div class="fs-head"><span><i class="fas fa-futbol" aria-hidden="true"></i> ฟาวล์สะสม (ฟุตซอล)</span><span title="ตั้งแต่ฟาวล์ที่ 6 เป็นต้นไป = ฟรีคิกโดยตรง">DFK ≥ ${DFK_FROM}</span></div>
    <div class="fs-grid">
      <div class="fs-team" id="fsTeamA">
        <div class="fs-name" id="fsNameA">A</div>
        <div class="fs-count" id="fsCountA">0</div>
        <div class="fs-dots" id="fsDotsA"></div>
        <span class="fs-dfk">DIRECT FREE KICK</span>
        <div class="fs-btns"><button type="button" class="btn-secondary" id="fsMinusA" title="ฟาวล์ทีม A −1">−</button><button type="button" class="btn-warning" id="fsPlusA" title="ฟาวล์ทีม A +1">+</button></div>
      </div>
      <button type="button" class="btn-secondary" id="fsReset" title="รีเซ็ตฟาวล์ทั้งสองทีม" style="min-height:0;width:34px;height:34px;padding:0;border-radius:50%"><i class="fas fa-redo"></i></button>
      <div class="fs-team" id="fsTeamB">
        <div class="fs-name" id="fsNameB">B</div>
        <div class="fs-count" id="fsCountB">0</div>
        <div class="fs-dots" id="fsDotsB"></div>
        <span class="fs-dfk">DIRECT FREE KICK</span>
        <div class="fs-btns"><button type="button" class="btn-secondary" id="fsMinusB" title="ฟาวล์ทีม B −1">−</button><button type="button" class="btn-warning" id="fsPlusB" title="ฟาวล์ทีม B +1">+</button></div>
      </div>
    </div>
    <div class="fs-foot">
      <label title="ฟาวล์สะสมเริ่มนับใหม่ทุกครึ่ง"><input type="checkbox" id="fsResetHalf"> รีเซ็ตเมื่อเปลี่ยนครึ่ง</label>
    </div>`;
  anchor.insertAdjacentElement('afterend', card);
  $('fsPlusA').addEventListener('click', () => change('A', 1));
  $('fsMinusA').addEventListener('click', () => change('A', -1));
  $('fsPlusB').addEventListener('click', () => change('B', 1));
  $('fsMinusB').addEventListener('click', () => change('B', -1));
  $('fsReset').addEventListener('click', reset);
  const halfBox = $('fsResetHalf');
  halfBox.checked = resetOnHalf();
  halfBox.addEventListener('change', () => localStorage.setItem('fs_reset_half', halfBox.checked ? 'true' : 'false'));
  return card;
}

function render() {
  const card = ensureCard();
  if (!card) return;
  const active = isActive();
  card.style.display = active ? 'block' : 'none';
  if (!active) return;
  for (const team of ['A', 'B']) {
    const n = getInt(team === 'A' ? 'fs_fouls_a' : 'fs_fouls_b');
    $('fsCount' + team).textContent = n;
    $('fsName' + team).textContent = ($('name' + team)?.textContent || team).trim();
    $('fsDots' + team).innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    const box = $('fsTeam' + team);
    box.classList.toggle('is-dfk', n >= DFK_FROM - 1);
    box.querySelector('.fs-dfk').textContent = n >= DFK_FROM ? 'DIRECT FREE KICK' : 'ฟาวล์ถัดไป = DFK';
  }
}

function watchHalf() {
  const half = ($('halfText')?.textContent || '').trim();
  if (lastHalf === null) { lastHalf = half; return; }
  if (half !== lastHalf) {
    lastHalf = half;
    if (isActive() && resetOnHalf()) reset();
  }
}

function refresh() {
  render();
  publish(true);
}

function boot() {
  refresh();
  setInterval(() => { watchHalf(); render(); publish(); }, 500);
}

window.futsalModule = { refresh, change, reset };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 60));
else setTimeout(boot, 60);
