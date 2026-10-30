// ═══════════════════════════════════════════════════════════════════════
//  snooker_module.js — Snooker add-on for OBSScore V2.9.5.8
//
//  • Sport Graphics Settings → Active Sport → "Snooker / สนุกเกอร์"
//  • Control card in the Dock: pot buttons (red 1 … black 7) for the player
//    at the table, fouls (+4…+7 to the opponent), break, highest break,
//    reds left, points remaining, frame end, undo.
//  • OBS overlay: snooker_score.html (Browser Source "Snooker_Main_Score").
//
//  Data mapping (re-uses the normal Dock scores, so OBS text sources,
//  jamornz.com sync and the mobile remote keep working):
//    main score  (#scoreA / #scoreB)   → points in the current frame
//    score 2     (#score2A / #score2B) → frames won
//  Everything snooker-specific lives in localStorage keys "sn_*".
// ═══════════════════════════════════════════════════════════════════════

const SN_STATE_KEY = 'sn_state';
const SN_CHANNEL = 'sn_score_channel';
const SN_SOURCE_NAME = 'Snooker_Main_Score';
const BALLS = [
  { v: 1, name: 'แดง', en: 'Red', color: '#dc2626', ink: '#fff' },
  { v: 2, name: 'เหลือง', en: 'Yellow', color: '#facc15', ink: '#1f2937' },
  { v: 3, name: 'เขียว', en: 'Green', color: '#16a34a', ink: '#fff' },
  { v: 4, name: 'น้ำตาล', en: 'Brown', color: '#92400e', ink: '#fff' },
  { v: 5, name: 'น้ำเงิน', en: 'Blue', color: '#2563eb', ink: '#fff' },
  { v: 6, name: 'ชมพู', en: 'Pink', color: '#ec4899', ink: '#fff' },
  { v: 7, name: 'ดำ', en: 'Black', color: '#111827', ink: '#fff' },
];

// Settings (key, default). Colours / display are editable in the Sport Graphics tab.
const SN_DEFAULTS = {
  sn_best_of: '19',
  sn_reds_total: '15',
  sn_auto_switch_foul: 'true',
  sn_show_indicator: 'true',
  sn_show_bestof: 'true',
  sn_show_break: 'true',
  sn_show_remaining: 'false',
  sn_show_frame_no: 'false',
  sn_use_team_colors: 'false',
  sn_bar_width: '1000',
  sn_font_size: '30',
  sn_c_bar: '#1e3a8a',
  sn_c_bar2: '#172554',
  sn_c_name: '#ffffff',
  sn_c_points_bg: '#f1f5f9',
  sn_c_points_txt: '#0f172a',
  sn_c_frames: '#facc15',
  sn_c_bestof: '#e2e8f0',
  sn_c_indicator: '#ef4444',
  sn_c_info_bg: '#0f172a',
  sn_c_info_txt: '#ffffff',
};

const get = (k) => localStorage.getItem(k) ?? SN_DEFAULTS[k] ?? '';
const set = (k, v) => localStorage.setItem(k, String(v));
const getInt = (k, d = 0) => { const n = parseInt(get(k), 10); return Number.isFinite(n) ? n : d; };
const getBool = (k) => get(k) === 'true';
const $ = (id) => document.getElementById(id);

const isActive = () => localStorage.getItem('vb_enabled') !== 'false' && (localStorage.getItem('vb_sport') || 'volleyball') === 'snooker';

// ── Dock score access ────────────────────────────────────────────────
function readDock() {
  const num = (id) => parseInt($(id)?.textContent ?? '0', 10) || 0;
  const bibA = $('bibOverrideA')?.checked, bibB = $('bibOverrideB')?.checked;
  return {
    pointsA: num('scoreA'), pointsB: num('scoreB'),
    framesA: num('score2A'), framesB: num('score2B'),
    nameA: ($('nameA')?.textContent || 'PLAYER A').trim(),
    nameB: ($('nameB')?.textContent || 'PLAYER B').trim(),
    colorA: bibA ? (localStorage.getItem('bib_active_color_a') || '#84cc16') : ($('colorA')?.value || '#1e3a8a'),
    colorB: bibB ? (localStorage.getItem('bib_active_color_b') || '#f97316') : ($('colorB')?.value || '#7f1d1d'),
  };
}
function addPoints(team, delta) {
  if (!delta) return;
  if (typeof window.fcpChangeScore === 'function') window.fcpChangeScore(team, delta);
  else {
    const btn = $(`score${team}${delta > 0 ? 'Plus' : 'Minus'}Btn`);
    for (let i = 0; i < Math.abs(delta); i++) btn?.click();
  }
}
function addFrames(team, delta) {
  if (typeof window.fcpChangeScore2 === 'function') window.fcpChangeScore2(team, delta);
  else $(`score2${team}${delta > 0 ? 'Plus' : 'Minus'}Btn`)?.click();
}
const other = (team) => (team === 'A' ? 'B' : 'A');
function toast(msg, type = 'info') {
  if (typeof window.showToast === 'function') return window.showToast(msg, type);
  console.log('[Snooker]', msg);
}

// ── Snooker rules ────────────────────────────────────────────────────
// Points still on the table. While reds remain: each red (1) can be followed by
// the black (7) → 8 per red, plus the colours 2+3+4+5+6+7 = 27. After the last red
// a free colour (up to 7) is due before the colours are taken in order.
function remainingPoints() {
  const reds = getInt('sn_reds_left', 15);
  const pending = getBool('sn_colour_pending');
  if (reds > 0) return reds * 8 + 27 + (pending ? 7 : 0);
  if (pending) return 7 + 27;
  let sum = 0;
  for (let v = Math.max(2, getInt('sn_next_colour', 2)); v <= 7; v++) sum += v;
  return sum;
}
function frameNumber(d) { return d.framesA + d.framesB + 1; }
function framesToWin() { return Math.floor(Math.max(1, getInt('sn_best_of', 19)) / 2) + 1; }

const undoStack = [];
function snapshot(extra) {
  return {
    atTable: get('sn_at_table') || 'A',
    brk: getInt('sn_break'),
    reds: getInt('sn_reds_left', getInt('sn_reds_total', 15)),
    pending: get('sn_colour_pending'),
    next: getInt('sn_next_colour', 2),
    highA: getInt('sn_high_a'), highB: getInt('sn_high_b'),
    ...extra,
  };
}
function restore(s) {
  set('sn_at_table', s.atTable); set('sn_break', s.brk); set('sn_reds_left', s.reds);
  set('sn_colour_pending', s.pending); set('sn_next_colour', s.next);
  set('sn_high_a', s.highA); set('sn_high_b', s.highB);
}

function pot(value) {
  const team = get('sn_at_table') || 'A';
  undoStack.push(snapshot({ kind: 'pot', team, points: value }));
  const reds = getInt('sn_reds_left', 15);
  if (value === 1) {
    if (reds <= 0) { undoStack.pop(); return toast('ไม่มีลูกแดงเหลือแล้ว — ใช้ปุ่ม −/+ ที่ "แดงเหลือ" เพื่อแก้จำนวน', 'error'); }
    set('sn_reds_left', reds - 1);
    set('sn_colour_pending', 'true');
  } else if (getBool('sn_colour_pending')) {
    set('sn_colour_pending', 'false'); // colour after a red (re-spotted)
  } else if (reds <= 0) {
    // Clearing the colours in order (yellow → black); tolerate a manual mismatch.
    const next = getInt('sn_next_colour', 2);
    if (value >= next) set('sn_next_colour', Math.min(8, value + 1));
  }
  addPoints(team, value);
  const brk = getInt('sn_break') + value;
  set('sn_break', brk);
  const hk = team === 'A' ? 'sn_high_a' : 'sn_high_b';
  if (brk > getInt(hk)) set(hk, brk);
  publish();
}

function foul(value) {
  const offender = get('sn_at_table') || 'A';
  const receiver = other(offender);
  undoStack.push(snapshot({ kind: 'foul', team: receiver, points: value }));
  addPoints(receiver, value);
  set('sn_break', 0);
  set('sn_colour_pending', 'false');
  if (getBool('sn_auto_switch_foul')) set('sn_at_table', receiver);
  toast(`ฟาวล์ +${value} ให้ ${receiver === 'A' ? readDock().nameA : readDock().nameB}`, 'info');
  publish();
}

function switchPlayer(team) {
  undoStack.push(snapshot({ kind: 'switch', points: 0 }));
  set('sn_at_table', team || other(get('sn_at_table') || 'A'));
  set('sn_break', 0);
  set('sn_colour_pending', 'false');
  publish();
}

function undo() {
  const last = undoStack.pop();
  if (!last) return toast('ไม่มีรายการให้ย้อนกลับ', 'info');
  if (last.points && last.team) addPoints(last.team, -last.points);
  restore(last);
  publish();
}

function resetFrameState() {
  set('sn_reds_left', getInt('sn_reds_total', 15));
  set('sn_break', 0);
  set('sn_colour_pending', 'false');
  set('sn_next_colour', 2);
  undoStack.length = 0;
}

function endFrame() {
  const d = readDock();
  if (d.pointsA === d.pointsB) return toast('คะแนนเท่ากัน — ยังจบเฟรมไม่ได้ (เล่นลูกดำตัดสิน)', 'error');
  const winner = d.pointsA > d.pointsB ? 'A' : 'B';
  if (!confirm(`จบเฟรมที่ ${frameNumber(d)}: ${winner === 'A' ? d.nameA : d.nameB} ชนะ ${Math.max(d.pointsA, d.pointsB)}–${Math.min(d.pointsA, d.pointsB)} ?`)) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem('sn_frames') || '[]'); } catch (_) {}
  history.push([d.pointsA, d.pointsB]);
  set('sn_frames', JSON.stringify(history));
  addFrames(winner, 1);
  addPoints('A', -d.pointsA);
  addPoints('B', -d.pointsB);
  resetFrameState();
  // The other player breaks off the next frame.
  const breaker = get('sn_breaker') || 'A';
  set('sn_breaker', other(breaker));
  set('sn_at_table', other(breaker));
  const after = readDock();
  const need = framesToWin();
  const wonFrames = winner === 'A' ? after.framesA : after.framesB;
  if (wonFrames >= need) toast(`🏆 ${winner === 'A' ? after.nameA : after.nameB} ชนะแมตช์ ${after.framesA}–${after.framesB}`, 'success');
  else toast(`จบเฟรมแล้ว — สกอร์เฟรม ${after.framesA}–${after.framesB}`, 'success');
  publish();
}

function newMatch() {
  if (!confirm('เริ่มแมตช์ใหม่? (ล้างแต้ม เฟรม เบรกสูงสุด และประวัติเฟรม)')) return;
  const d = readDock();
  addPoints('A', -d.pointsA); addPoints('B', -d.pointsB);
  addFrames('A', -d.framesA); addFrames('B', -d.framesB);
  set('sn_frames', '[]'); set('sn_high_a', 0); set('sn_high_b', 0);
  set('sn_breaker', 'A'); set('sn_at_table', 'A');
  resetFrameState();
  publish();
}

function adjustReds(delta) {
  const total = Math.max(1, getInt('sn_reds_total', 15));
  set('sn_reds_left', Math.max(0, Math.min(total, getInt('sn_reds_left', total) + delta)));
  publish();
}

// ── Fonts (same settings as the other sport overlays) ────────────────
function resolveFonts() {
  const pick = (kind, fallback) => {
    const src = localStorage.getItem(`vb_font_src_${kind}`) || 'preset';
    if (src === 'custom_name') return localStorage.getItem(`vb_font_custom_name_${kind}`) || fallback;
    if (src === 'upload') return localStorage.getItem(`vb_font_upload_family_${kind}`) || fallback;
    return localStorage.getItem(`vb_font_preset_${kind}`) || fallback;
  };
  return {
    fontTeam: pick('team', "'Kanit', sans-serif"),
    fontScore: pick('score', "'Barlow Condensed', sans-serif"),
    customFontDataTeam: localStorage.getItem('vb_font_upload_data_team') || '',
    customFontFamilyTeam: localStorage.getItem('vb_font_upload_family_team') || '',
    customFontDataScore: localStorage.getItem('vb_font_upload_data_score') || '',
    customFontFamilyScore: localStorage.getItem('vb_font_upload_family_score') || '',
  };
}

// ── Publish to overlay ───────────────────────────────────────────────
let bc = null;
try { bc = new BroadcastChannel(SN_CHANNEL); } catch (_) {}
let lastPayloadJson = '';

function buildPayload() {
  const d = readDock();
  const settings = {};
  Object.keys(SN_DEFAULTS).forEach(k => { settings[k] = get(k); });
  return {
    ...d,
    atTable: get('sn_at_table') || 'A',
    break: getInt('sn_break'),
    highA: getInt('sn_high_a'), highB: getInt('sn_high_b'),
    redsLeft: getInt('sn_reds_left', getInt('sn_reds_total', 15)),
    remaining: remainingPoints(),
    frameNo: frameNumber(d),
    bestOf: getInt('sn_best_of', 19),
    settings,
    ...resolveFonts(),
  };
}

function publish(force = false) {
  const payload = buildPayload();
  // PlayScore plugin graphics (snooker-pack) read these keys.
  if (typeof window.pushPlayScore === 'function' && isActive()) {
    window.pushPlayScore({
      'snooker.bestOf': payload.bestOf, 'snooker.frameNo': payload.frameNo, 'snooker.atTable': payload.atTable,
      'snooker.break': payload.break, 'snooker.breakA': payload.atTable === 'A' ? payload.break : 0,
      'snooker.breakB': payload.atTable === 'B' ? payload.break : 0, 'snooker.remaining': payload.remaining,
      'snooker.redsLeft': payload.redsLeft, 'snooker.highA': payload.highA, 'snooker.highB': payload.highB,
    });
  }
  const json = JSON.stringify(payload);
  if (force || json !== lastPayloadJson) {
    lastPayloadJson = json;
    try { localStorage.setItem(SN_STATE_KEY, json); } catch (_) {}
    if (bc) bc.postMessage({ type: 'sn_update', payload });
  }
  renderCard(payload);
}

// ── Dock control card ────────────────────────────────────────────────
function ensureCard() {
  let card = $('snookerControlCard');
  if (card) return card;
  const anchor = $('score2Card');
  if (!anchor) return null;
  card = document.createElement('div');
  card.id = 'snookerControlCard';
  card.className = 'card';
  card.style.cssText = 'border:1px solid #16a34a;display:none;';
  card.innerHTML = `
    <style>
      #snookerControlCard .sn-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.75rem;font-weight:800;color:#4ade80;text-transform:uppercase;letter-spacing:.5px}
      #snookerControlCard .sn-players{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
      #snookerControlCard .sn-player{min-height:0;padding:8px 6px;border-radius:8px;border:2px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:#e2e8f0;font-weight:800;font-size:.85rem;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #snookerControlCard .sn-player.is-on{border-color:#ef4444;background:rgba(239,68,68,.18);color:#fff}
      #snookerControlCard .sn-player small{display:block;font-size:.65rem;font-weight:600;color:#94a3b8}
      #snookerControlCard .sn-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;text-align:center}
      #snookerControlCard .sn-stat{background:rgba(0,0,0,.3);border-radius:8px;padding:6px 2px}
      #snookerControlCard .sn-stat b{display:block;font-size:1.3rem;color:#fff;line-height:1.1}
      #snookerControlCard .sn-stat span{font-size:.62rem;color:#94a3b8;font-weight:700}
      #snookerControlCard .sn-reds-adj{display:flex;justify-content:center;gap:4px;margin-top:3px}
      #snookerControlCard .sn-reds-adj button{min-height:0;width:22px;height:20px;padding:0;font-size:.7rem;border-radius:4px}
      #snookerControlCard .sn-balls{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:8px}
      #snookerControlCard .sn-ball{min-height:0;aspect-ratio:1/1;border-radius:50%;border:2px solid rgba(255,255,255,.35);font-weight:900;font-size:1.05rem;cursor:pointer;box-shadow:inset -3px -4px 8px rgba(0,0,0,.35),0 2px 4px rgba(0,0,0,.4);padding:0}
      #snookerControlCard .sn-ball:active{transform:scale(.93)}
      #snookerControlCard .sn-fouls{display:grid;grid-template-columns:auto repeat(4,1fr);gap:5px;align-items:center;margin-bottom:8px}
      #snookerControlCard .sn-fouls span{font-size:.7rem;font-weight:800;color:#fca5a5}
      #snookerControlCard .sn-fouls button{min-height:0;padding:7px 0;font-weight:800;font-size:.8rem;border-radius:6px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.45);color:#fecaca;cursor:pointer}
      #snookerControlCard .sn-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
      #snookerControlCard .sn-actions button{min-height:0;padding:8px 2px;font-size:.72rem;font-weight:700;border-radius:6px}
      #snookerControlCard .sn-note{font-size:.68rem;color:#fbbf24;text-align:center;margin-top:6px;min-height:1em}
    </style>
    <div class="sn-head"><span>🎱 Snooker</span><span id="snFrameInfo">Frame 1 • Best of 19</span></div>
    <div class="sn-players">
      <button type="button" class="sn-player" id="snAtTableA">▶ A<small>กดเพื่อให้ผู้เล่นนี้อยู่ที่โต๊ะ</small></button>
      <button type="button" class="sn-player" id="snAtTableB">B ◀<small>กดเพื่อให้ผู้เล่นนี้อยู่ที่โต๊ะ</small></button>
    </div>
    <div class="sn-stats">
      <div class="sn-stat"><b id="snBreak">0</b><span>BREAK</span></div>
      <div class="sn-stat"><b id="snRemaining">147</b><span>เหลือบนโต๊ะ</span></div>
      <div class="sn-stat"><b id="snReds">15</b><span>แดงเหลือ</span>
        <div class="sn-reds-adj"><button type="button" class="btn-secondary" id="snRedsMinus">−</button><button type="button" class="btn-secondary" id="snRedsPlus">+</button></div></div>
    </div>
    <div class="sn-balls">${BALLS.map(b => `<button type="button" class="sn-ball" data-v="${b.v}" title="${b.name} / ${b.en} (${b.v})" style="background:${b.color};color:${b.ink}">${b.v}</button>`).join('')}</div>
    <div class="sn-fouls"><span>ฟาวล์ →<br>คู่แข่ง</span>${[4, 5, 6, 7].map(v => `<button type="button" data-foul="${v}">+${v}</button>`).join('')}</div>
    <div class="sn-actions">
      <button type="button" class="btn-secondary" id="snSwitch" title="จบเบรก เปลี่ยนผู้เล่น (Miss / Safety)">🔁 สลับผู้เล่น</button>
      <button type="button" class="btn-secondary" id="snUndo" title="ย้อนการกดครั้งล่าสุดของสนุกเกอร์">↶ ย้อน</button>
      <button type="button" class="btn-success" id="snEndFrame">🏁 จบเฟรม</button>
      <button type="button" class="btn-danger" id="snNewMatch">🔄 แมตช์ใหม่</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px">
      <button type="button" class="btn-secondary" id="snCreateSource" style="min-height:0;padding:6px;font-size:.72rem">🎬 สร้าง Source กราฟิก</button>
      <button type="button" class="btn-secondary" id="snToggleSource" style="min-height:0;padding:6px;font-size:.72rem">👁 แสดง/ซ่อนกราฟิก</button>
    </div>
    <div class="sn-note" id="snNote"></div>`;
  anchor.insertAdjacentElement('afterend', card);
  card.querySelectorAll('.sn-ball').forEach(b => b.addEventListener('click', () => pot(parseInt(b.dataset.v, 10))));
  card.querySelectorAll('[data-foul]').forEach(b => b.addEventListener('click', () => foul(parseInt(b.dataset.foul, 10))));
  $('snAtTableA').addEventListener('click', () => switchPlayer('A'));
  $('snAtTableB').addEventListener('click', () => switchPlayer('B'));
  $('snSwitch').addEventListener('click', () => switchPlayer());
  $('snUndo').addEventListener('click', undo);
  $('snEndFrame').addEventListener('click', endFrame);
  $('snNewMatch').addEventListener('click', newMatch);
  $('snRedsMinus').addEventListener('click', () => adjustReds(-1));
  $('snRedsPlus').addEventListener('click', () => adjustReds(1));
  $('snCreateSource').addEventListener('click', function () { createSource(this); });
  $('snToggleSource').addEventListener('click', toggleSource);
  return card;
}

function renderCard(p) {
  const card = ensureCard();
  if (!card) return;
  const active = isActive();
  card.style.display = active ? 'block' : 'none';
  if (!active) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('snFrameInfo').textContent = `Frame ${p.frameNo} • Best of ${p.bestOf} • ${p.framesA}–${p.framesB}`;
  $('snAtTableA').innerHTML = `▶ ${esc(p.nameA)}<small>เบรกสูงสุด ${p.highA}</small>`;
  $('snAtTableB').innerHTML = `${esc(p.nameB)} ◀<small>เบรกสูงสุด ${p.highB}</small>`;
  $('snAtTableA').classList.toggle('is-on', p.atTable === 'A');
  $('snAtTableB').classList.toggle('is-on', p.atTable === 'B');
  $('snBreak').textContent = p.break;
  $('snRemaining').textContent = p.remaining;
  $('snReds').textContent = p.redsLeft;
  const lead = Math.abs(p.pointsA - p.pointsB);
  const behind = p.pointsA === p.pointsB ? '' : (p.pointsA < p.pointsB ? p.nameA : p.nameB);
  $('snNote').textContent = behind && lead > p.remaining
    ? `${behind} ตามอยู่ ${lead} แต้ม (เหลือ ${p.remaining}) — ต้องการสนุ๊กเกอร์`
    : (getBool('sn_colour_pending') ? 'ลงแดงแล้ว → ต่อด้วยลูกสี' : '');
}

// ── OBS source helpers ───────────────────────────────────────────────
async function createSource(btn) {
  const obs = window.fcpOBS;
  if (!obs) return toast('❌ ยังไม่ได้เชื่อมต่อ OBS', 'error');
  try {
    if (btn) btn.disabled = true;
    const scene = await obs.call('GetCurrentProgramScene');
    const url = window.location.href.replace(/[?#].*$/, '').replace(/\/[^/]*$/, '') + '/snooker_score.html';
    await obs.call('CreateInput', {
      sceneName: scene.currentProgramSceneName,
      inputName: SN_SOURCE_NAME,
      inputKind: 'browser_source',
      inputSettings: { url, width: 1280, height: 160, css: 'body { background: transparent !important; }', shutdown: false, reroute_audio: false },
      sceneItemEnabled: true,
    });
    toast(`✅ สร้าง ${SN_SOURCE_NAME} แล้ว`, 'success');
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('already exists') || err?.code === 601) toast(`⚠️ มี ${SN_SOURCE_NAME} อยู่แล้ว`, 'info');
    else toast('❌ OBS Error: ' + msg, 'error');
  } finally {
    if (btn) btn.disabled = false;
    publish(true);
  }
}

async function toggleSource() {
  const obs = window.fcpOBS;
  if (!obs) return toast('❌ ยังไม่ได้เชื่อมต่อ OBS', 'error');
  try {
    const scene = await obs.call('GetCurrentProgramScene');
    const sceneName = scene.currentProgramSceneName;
    const { sceneItemId } = await obs.call('GetSceneItemId', { sceneName, sourceName: SN_SOURCE_NAME });
    const { sceneItemEnabled } = await obs.call('GetSceneItemEnabled', { sceneName, sceneItemId });
    await obs.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: !sceneItemEnabled });
    toast(sceneItemEnabled ? 'ซ่อนกราฟิกสนุกเกอร์' : 'แสดงกราฟิกสนุกเกอร์', 'info');
  } catch (err) {
    toast(`ไม่พบ ${SN_SOURCE_NAME} ในซีนปัจจุบัน — กด "สร้าง Source กราฟิก" ก่อน`, 'error');
  }
}

// ── Settings (inside the Sport Graphics tab) ─────────────────────────
function injectSettings() {
  if ($('sn-settings-container')) return true;
  const anchor = $('vb2-football-settings-container');
  if (!anchor) return false;
  const color = (key, label) => `<label style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#cbd5e1">${label}<input type="color" data-sn-key="${key}" value="${get(key)}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer"></label>`;
  const num = (key, label, min, max) => `<label style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#cbd5e1">${label}<input type="number" min="${min}" max="${max}" data-sn-key="${key}" value="${get(key)}" style="width:100%;padding:4px 8px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.12);border-radius:4px;color:#fff"></label>`;
  const toggle = (key, label) => `<label style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:rgba(255,255,255,.03);border-radius:4px;font-size:11px;color:#cbd5e1;cursor:pointer">${label}<input type="checkbox" data-sn-key="${key}" ${getBool(key) ? 'checked' : ''} style="width:16px;height:16px"></label>`;
  const box = (title, body) => `<div style="background:rgba(0,0,0,.2);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,.06);margin-bottom:12px"><div style="font-size:.8rem;font-weight:700;color:#4ade80;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid rgba(74,222,128,.2);padding-bottom:4px">${title}</div>${body}</div>`;
  const wrap = document.createElement('div');
  wrap.id = 'sn-settings-container';
  wrap.style.cssText = 'margin-bottom:14px;display:none';
  wrap.innerHTML =
    box('🎱 กติกาสนุกเกอร์ (Snooker Rules)', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        ${num('sn_best_of', 'แข่งกี่เฟรม (Best of)', 1, 99)}
        <label style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#cbd5e1">จำนวนลูกแดง
          <select data-sn-key="sn_reds_total" style="width:100%;padding:5px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.12);border-radius:4px;color:#fff">
            ${[15, 10, 6].map(n => `<option value="${n}" ${getInt('sn_reds_total', 15) === n ? 'selected' : ''}>${n} แดง${n === 15 ? ' (มาตรฐาน)' : n === 6 ? ' (6-Red)' : ''}</option>`).join('')}
          </select></label>
      </div>
      ${toggle('sn_auto_switch_foul', 'ฟาวล์แล้วสลับให้คู่แข่งอยู่ที่โต๊ะอัตโนมัติ')}
      <div style="font-size:10px;color:#64748b;margin-top:6px">แต้มในเฟรม = คะแนนหลัก, เฟรมที่ชนะ = คะแนนรอง (Score 2) • ลูกแดง 1, เหลือง 2, เขียว 3, น้ำตาล 4, น้ำเงิน 5, ชมพู 6, ดำ 7 • ฟาวล์ขั้นต่ำ 4</div>`) +
    box('🖥️ การแสดงผล (Display)', `
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
        ${toggle('sn_show_indicator', 'แสดงลูกศร ▶ ผู้เล่นที่อยู่ที่โต๊ะ')}
        ${toggle('sn_show_bestof', 'แสดง (Best of) ตรงกลาง')}
        ${toggle('sn_show_frame_no', 'แสดงเฟรมที่กำลังแข่ง (Frame X) แทน Best of')}
        ${toggle('sn_show_break', 'แสดงแถบ BREAK ใต้ผู้เล่นที่อยู่ที่โต๊ะ')}
        ${toggle('sn_show_remaining', 'แสดงแต้มที่เหลือบนโต๊ะ (Remaining)')}
        ${toggle('sn_use_team_colors', 'ใช้สีทีม/ผู้เล่น (สีหลัก) เป็นพื้นหลังชื่อ')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${num('sn_bar_width', 'ความกว้างแถบ (px)', 600, 1260)}
        ${num('sn_font_size', 'ขนาดตัวอักษร (px)', 16, 60)}
      </div>`) +
    box('🎨 สีกราฟิก (Colors)', `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        ${color('sn_c_bar', 'พื้นแถบ')}
        ${color('sn_c_bar2', 'พื้นแถบ (ไล่สี)')}
        ${color('sn_c_name', 'ตัวอักษรชื่อ')}
        ${color('sn_c_points_bg', 'กล่องแต้ม')}
        ${color('sn_c_points_txt', 'ตัวเลขแต้ม')}
        ${color('sn_c_frames', 'ตัวเลขเฟรม')}
        ${color('sn_c_bestof', 'ข้อความ (Best of)')}
        ${color('sn_c_indicator', 'ลูกศร ▶')}
        ${color('sn_c_info_bg', 'พื้นแถบ Break')}
        ${color('sn_c_info_txt', 'ตัวอักษร Break')}
      </div>
      <button type="button" id="snResetColors" class="btn-secondary" style="width:100%;margin-top:8px;min-height:0;padding:6px;font-size:.75rem">คืนค่าสีเริ่มต้น</button>`) +
    box('🎬 OBS', `<button type="button" id="snCreateSourceSettings" style="width:100%;padding:10px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);border-radius:6px;color:#4ade80;font-weight:700;cursor:pointer">🎱 สร้าง Browser Source: ${SN_SOURCE_NAME}</button>
      <div style="font-size:10px;color:#64748b;margin-top:6px">ไฟล์ snooker_score.html ขนาด 1280×160 วางชิดล่างของจอ</div>`);
  anchor.insertAdjacentElement('afterend', wrap);

  wrap.querySelectorAll('[data-sn-key]').forEach(el => {
    const handler = () => {
      const key = el.dataset.snKey;
      const value = el.type === 'checkbox' ? (el.checked ? 'true' : 'false') : el.value;
      set(key, value);
      if (key === 'sn_reds_total') {
        const total = getInt('sn_reds_total', 15);
        if (getInt('sn_reds_left', total) > total) set('sn_reds_left', total);
      }
      if (key === 'sn_show_frame_no' && value === 'true') set('sn_show_bestof', 'true');
      publish();
    };
    el.addEventListener(el.type === 'color' || el.type === 'number' ? 'input' : 'change', handler);
  });
  $('snResetColors').addEventListener('click', () => {
    Object.keys(SN_DEFAULTS).filter(k => k.startsWith('sn_c_')).forEach(k => {
      localStorage.removeItem(k);
      const el = wrap.querySelector(`[data-sn-key="${k}"]`);
      if (el) el.value = SN_DEFAULTS[k];
    });
    publish();
  });
  $('snCreateSourceSettings').addEventListener('click', function () { createSource(this); });
  return true;
}

function refresh() {
  injectSettings();
  const box = $('sn-settings-container');
  if (box) box.style.display = isActive() ? 'block' : 'none';
  publish();
}

function boot() {
  if (localStorage.getItem('sn_reds_left') === null) set('sn_reds_left', getInt('sn_reds_total', 15));
  if (!localStorage.getItem('sn_at_table')) set('sn_at_table', 'A');
  refresh();
  // Settings tab is injected by the sport module; retry until it exists.
  let tries = 0;
  const t = setInterval(() => { if (injectSettings() || ++tries > 30) { clearInterval(t); refresh(); } }, 500);
  // Follow manual score edits, name/colour changes, sport switches.
  setInterval(() => { if (isActive() || $('snookerControlCard')?.style.display === 'block') publish(); }, 400);
}

window.snookerModule = { refresh, pot, foul, switchPlayer, undo, endFrame, newMatch, remainingPoints, getState: buildPayload };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50));
else setTimeout(boot, 50);
