// ═══════════════════════════════════════════════════════════════════════
//  dock_shell.js — OBSScore V2.9.6.0 app bar, sport picker and source manager
//
//  Adds on top of the existing Dock (nothing old is removed):
//   • a sticky bar: current sport, "Source" and settings
//   • "เลือกกีฬา": sports grouped by type (sports.js)
//   • "สร้าง Source": every source by category, shows what OBS already has,
//     creates one or all missing in a category (source_catalog.js)
//  The old controls (settings tab select, help table, module buttons) keep working.
// ═══════════════════════════════════════════════════════════════════════

import { SPORTS, SPORT_GROUPS, getSport, currentSport, sportGfxOn } from './sports.js?v=2.9.6.1';
import { SOURCE_CATEGORIES, SOURCES } from './source_catalog.js?v=2.9.6.0d';
import { apply as applyLayout, startEdit, isGroupHidden, setGroupHidden } from './layout_manager.js?v=2.9.6.1b';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (msg, type = 'info') => (window.showToast ? window.showToast(msg, type) : console.log(msg));
const store = {
  get(k, d = '') { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* storage blocked */ } },
};

// ── Sport ───────────────────────────────────────────────────────────
function selectSport(id) {
  const sport = getSport(id);
  if (!sport) return;
  store.set('fcp_sport', sport.id);
  store.set('vb_sport', sport.engine);
  // V2.9.6.1: Sport Graphics on/off follows the sport (remembered per sport)
  store.set('vb_enabled', sportGfxOn(sport.id) ? 'true' : 'false');
  // Settings > Sport Graphics (select, toggle, sections) and the score buttons follow
  if (typeof window.vbSyncSettings === 'function') window.vbSyncSettings();
  else if (window.updateSportUI) window.updateSportUI();
  if (window.futsalModule) window.futsalModule.refresh();
  if (window.snookerModule) window.snookerModule.refresh();
  if (typeof window.vbRefreshPanel === 'function') window.vbRefreshPanel(); // Sport Graphics card follows the sport
  if (typeof window.pushPlayScore === 'function') window.pushPlayScore({ sport: sport.id });
  renderBar();
  applyLayout(); // this sport's order of groups and its scoring controls
  toast(`กีฬา: ${sport.th}`, 'success');
}

// The Sport Graphics settings tab picks the sport through here too.
window.fcpSelectSport = selectSport;

// Sport Graphics on/off always comes from the sport in use (its default, or what was set for it)
store.set('vb_enabled', sportGfxOn(currentSport().id) ? 'true' : 'false');

// ── App bar ─────────────────────────────────────────────────────────
function buildBar() {
  if ($('fcpAppBar')) return;
  const bar = document.createElement('header');
  bar.id = 'fcpAppBar';
  bar.className = 'fcp-appbar';
  bar.innerHTML = `
    <button type="button" class="fcp-sport-btn" id="fcpSportBtn" aria-haspopup="dialog" title="เลือกประเภทกีฬา">
      <i class="fas fa-futbol" id="fcpSportIcon" aria-hidden="true"></i>
      <span class="fcp-sport-text"><small>กีฬา</small><b id="fcpSportName">-</b></span>
      <i class="fas fa-chevron-down fcp-caret" aria-hidden="true"></i>
    </button>
    <div class="fcp-appbar-actions">
      <button type="button" class="fcp-icon-btn" id="fcpLayoutBtn" title="จัดหน้า: เลื่อนกลุ่มขึ้นลง ซ่อนหรือแสดง" aria-label="จัดหน้า">
        <i class="fas fa-up-down" aria-hidden="true"></i>
      </button>
      <button type="button" class="fcp-icon-btn" id="fcpSourcesBtn" title="สร้าง Source ใน OBS" aria-label="สร้าง Source ใน OBS">
        <i class="fas fa-layer-group" aria-hidden="true"></i><span>Source</span>
      </button>
      <button type="button" class="fcp-icon-btn" id="fcpSettingsBtn" title="ตั้งค่า" aria-label="ตั้งค่า">
        <i class="fas fa-cog" aria-hidden="true"></i>
      </button>
    </div>`;
  const anchor = $('mainPanelContainer');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(bar, anchor);
  else document.body.prepend(bar);
  $('fcpSportBtn').addEventListener('click', openSportSheet);
  $('fcpSourcesBtn').addEventListener('click', openSourceSheet);
  $('fcpLayoutBtn').addEventListener('click', startEdit);
  $('fcpSettingsBtn').addEventListener('click', () => $('settingsBtn')?.click());
  renderBar();
}

function renderBar() {
  const s = currentSport();
  const name = $('fcpSportName');
  if (!name) return;
  name.textContent = s.th;
  $('fcpSportIcon').className = `fas ${s.icon}`;
  document.documentElement.dataset.sport = s.id;
}

// ── Sheet (full-height panel) ───────────────────────────────────────
let lastFocus = null;
function sheet(id, title, icon) {
  let el = $(id);
  if (el) return el;
  el = document.createElement('div');
  el.id = id;
  el.className = 'fcp-sheet';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', title);
  el.innerHTML = `
    <div class="fcp-sheet-head">
      <h2><i class="fas ${icon}" aria-hidden="true"></i> ${esc(title)}</h2>
      <button type="button" class="fcp-icon-btn fcp-sheet-close" title="ปิด (Esc)" aria-label="ปิด"><i class="fas fa-times" aria-hidden="true"></i></button>
    </div>
    <div class="fcp-sheet-body"></div>`;
  el.querySelector('.fcp-sheet-close').addEventListener('click', () => closeSheet(el));
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeSheet(el); } });
  document.body.appendChild(el);
  return el;
}
function openSheetEl(el) {
  lastFocus = document.activeElement;
  el.classList.add('is-open');
  document.body.classList.add('fcp-sheet-open');
  setTimeout(() => el.querySelector('.fcp-sheet-close')?.focus(), 30);
}
function closeSheet(el) {
  el.classList.remove('is-open');
  if (!document.querySelector('.fcp-sheet.is-open')) document.body.classList.remove('fcp-sheet-open');
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

// ── Sport picker ────────────────────────────────────────────────────
function openSportSheet() {
  const el = sheet('fcpSportSheet', 'เลือกประเภทกีฬา', 'fa-trophy');
  const now = currentSport().id;
  const body = el.querySelector('.fcp-sheet-body');
  body.innerHTML = SPORT_GROUPS.map((g) => {
    const items = SPORTS.filter((s) => s.group === g.id);
    if (!items.length) return '';
    return `<section class="fcp-group"><h3>${esc(g.th)}</h3><div class="fcp-sport-grid">${items.map((s) => {
      const timerOn = !isGroupHidden('timer', s.id);
      return `
      <div class="fcp-sport-item">
        <button type="button" class="fcp-sport-card${s.id === now ? ' is-on' : ''}" data-sport="${s.id}" aria-pressed="${s.id === now}">
          <span class="fcp-sport-ico"><i class="fas ${s.icon}" aria-hidden="true"></i></span>
          <span class="fcp-sport-info">
            <b>${esc(s.th)}${s.beta ? ' <em class="fcp-badge">ใหม่</em>' : ''}</b>
            <small>${esc(s.features.join(' • '))}</small>
            <small class="fcp-dim">PlayScore: ${esc(s.preset)}</small>
          </span>
          ${s.id === now ? '<span class="fcp-check"><i class="fas fa-check" aria-hidden="true"></i> ใช้อยู่</span>' : ''}
        </button>
        <button type="button" class="fcp-timer-chip${timerOn ? ' is-on' : ''}" data-timer="${s.id}" role="switch" aria-checked="${timerOn}"
          title="แสดงหรือซ่อนแผงเวลาเมื่อใช้${esc(s.th)}" aria-label="แผงเวลาของ${esc(s.th)}">
          <i class="fas ${timerOn ? 'fa-stopwatch' : 'fa-eye-slash'}" aria-hidden="true"></i> เวลา: ${timerOn ? 'แสดง' : 'ซ่อน'}
        </button>
      </div>`;
    }).join('')}</div></section>`;
  }).join('') + `<p class="fcp-note"><i class="fas fa-circle-info" aria-hidden="true"></i> ปุ่ม "เวลา" ใต้การ์ด = แสดง/ซ่อนแผงเวลาของกีฬานั้น (จำแยกตามกีฬา) • กีฬาที่มีป้าย "ใหม่" ใช้ระบบนับของกีฬาใกล้เคียง (ตะกร้อใช้ระบบวอลเลย์ เทเบิลเทนนิสใช้ระบบแบด) • ตั้งค่ากราฟิก HTML ของแต่ละกีฬาอยู่ที่ ตั้งค่า → กราฟิกกีฬา</p>`;
  body.querySelectorAll('[data-sport]').forEach((b) => b.addEventListener('click', () => { selectSport(b.dataset.sport); closeSheet(el); }));
  // With "ปรับหน้าตาตามกีฬา" off all sports share one layout, so refresh every switch.
  const paintChips = () => body.querySelectorAll('[data-timer]').forEach((c) => {
    const on = !isGroupHidden('timer', c.dataset.timer);
    c.classList.toggle('is-on', on);
    c.setAttribute('aria-checked', String(on));
    c.innerHTML = `<i class="fas ${on ? 'fa-stopwatch' : 'fa-eye-slash'}" aria-hidden="true"></i> เวลา: ${on ? 'แสดง' : 'ซ่อน'}`;
  });
  body.querySelectorAll('[data-timer]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.timer;
    const show = isGroupHidden('timer', id);
    setGroupHidden('timer', !show, id);
    paintChips();
    toast(`${getSport(id)?.th || ''}: ${show ? 'แสดง' : 'ซ่อน'}แผงเวลา`, 'info');
  }));
  openSheetEl(el);
}

// ── Source manager ──────────────────────────────────────────────────
const KIND_LABEL = { text: 'ข้อความ', color: 'สี', image: 'รูป', browser: 'Browser', playscore: 'PlayScore', action: 'Browser' };
const OLD_TYPE = { text: 'Text (GDI+)', color: 'Color Source', image: 'Image Source' };
let existing = new Set();
let obsOnline = false;
let showAll = store.get('fcp_sources_all') === '1';

async function loadExisting() {
  const obs = window.fcpOBS;
  try {
    const { inputs } = await obs.call('GetInputList');
    existing = new Set((inputs || []).map((i) => i.inputName));
    obsOnline = true;
  } catch (e) {
    obsOnline = false;
  }
}

const pageUrl = (file) => window.location.href.replace(/[?#].*$/, '').replace(/\/[^/]*$/, '') + '/' + file;

async function createOne(item, btn) {
  const obs = window.fcpOBS;
  if (item.kind === 'action') {
    if (typeof window[item.fn] !== 'function') return toast('คำสั่งนี้ยังไม่พร้อม', 'error'), false;
    await window[item.fn]();
    return true;
  }
  if (OLD_TYPE[item.kind]) {
    if (typeof window.fcpCreateObsSource !== 'function') return toast('ยังไม่พร้อม ลองใหม่อีกครั้ง', 'error'), false;
    return window.fcpCreateObsSource(item.name, OLD_TYPE[item.kind], null);
  }
  try {
    const { currentProgramSceneName: sceneName } = await obs.call('GetCurrentProgramScene');
    const input = item.kind === 'browser'
      ? { inputKind: 'browser_source', inputSettings: { url: pageUrl(item.file), width: item.w, height: item.h, css: 'body { background: transparent !important; }', shutdown: false, reroute_audio: false } }
      : { inputKind: 'playscore_graphic', inputSettings: {} };
    await obs.call('CreateInput', { sceneName, inputName: item.name, sceneItemEnabled: true, ...input });
    toast(`สร้าง ${item.name} แล้ว`, 'success');
    return true;
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('already exists') || err?.code === 601) { toast(`${item.name} มีอยู่แล้ว`, 'info'); return true; }
    if (item.kind === 'playscore') toast('สร้างไม่ได้ ตรวจสอบว่าติดตั้งปลั๊กอิน PlayScore แล้ว', 'error');
    else toast(`สร้าง ${item.name} ไม่ได้: ${msg}`, 'error');
    return false;
  }
}

const isThere = (item) => (item.checks || [item.name]).every((n) => existing.has(n));
// "soon" sources are listed but cannot be created yet: they never count as missing
const isMissing = (item) => !item.soon && !isThere(item);

function visibleSources() {
  const sport = currentSport().id;
  return SOURCES.filter((s) => showAll || !s.sports || s.sports.includes(sport));
}

function renderSources(el) {
  const body = el.querySelector('.fcp-sheet-body');
  const list = visibleSources();
  const missingAll = list.filter(isMissing).length;
  const countable = list.filter((s) => !s.soon).length;
  const open = new Set([...body.querySelectorAll('details[open]')].map((d) => d.dataset.cat));
  const first = !body.dataset.ready;
  body.dataset.ready = '1';
  body.innerHTML = `
    <div class="fcp-src-top">
      <div class="fcp-status ${obsOnline ? 'is-ok' : 'is-off'}" role="status">
        <i class="fas ${obsOnline ? 'fa-circle-check' : 'fa-plug-circle-xmark'}" aria-hidden="true"></i>
        ${obsOnline ? `เชื่อมต่อ OBS แล้ว • ขาด ${missingAll} จาก ${countable}` : 'ยังไม่ได้เชื่อมต่อ OBS (ดูได้ แต่สร้างไม่ได้)'}
      </div>
      <div class="fcp-seg" role="group" aria-label="ตัวกรอง">
        <button type="button" data-all="0" aria-pressed="${!showAll}">เฉพาะ ${esc(currentSport().th)}</button>
        <button type="button" data-all="1" aria-pressed="${showAll}">ทั้งหมด</button>
      </div>
      <button type="button" class="fcp-icon-btn" id="fcpSrcRefresh" title="ตรวจสอบใหม่" aria-label="ตรวจสอบใหม่"><i class="fas fa-rotate" aria-hidden="true"></i></button>
    </div>
    <p class="fcp-note">สร้างใน Scene ที่กำลังออกอากาศ (Program) • กดชื่อเพื่อคัดลอก</p>
    ${SOURCE_CATEGORIES.map((c) => {
      const items = list.filter((s) => s.cat === c.id);
      if (!items.length) return '';
      const real = items.filter((s) => !s.soon);
      const have = real.filter(isThere).length;
      const missing = real.length - have;
      const isOpen = first ? missing > 0 : open.has(c.id);
      return `<details class="fcp-cat" data-cat="${c.id}"${isOpen ? ' open' : ''}>
        <summary>
          <i class="fas ${c.icon}" aria-hidden="true"></i>
          <span class="fcp-cat-name">${esc(c.th)}<small>${esc(c.note)}</small></span>
          ${real.length
            ? `<span class="fcp-count ${missing === 0 ? 'is-full' : ''}">${have}/${real.length}</span>`
            : '<span class="fcp-count is-soon">รออัปเดต</span>'}
        </summary>
        <div class="fcp-src-list">
          ${items.map((s) => `
            <div class="fcp-src-row">
              <div class="fcp-src-text">
                <button type="button" class="fcp-src-name" data-copy="${esc(s.name)}" title="คัดลอกชื่อ">${esc(s.name)}</button>
                <small>${esc(s.th)}</small>
              </div>
              <span class="fcp-kind">${KIND_LABEL[s.kind] || s.kind}</span>
              ${s.soon
                ? '<span class="fcp-soon"><i class="fas fa-hourglass-half" aria-hidden="true"></i> รออัปเดต</span>'
                : isThere(s)
                  ? '<span class="fcp-have"><i class="fas fa-check" aria-hidden="true"></i> มีแล้ว</span>'
                  : `<button type="button" class="fcp-create" data-create="${esc(s.name)}" ${obsOnline ? '' : 'disabled'}><i class="fas fa-plus" aria-hidden="true"></i> สร้าง</button>`}
            </div>`).join('')}
          ${missing > 0 ? `<button type="button" class="fcp-create-all" data-create-cat="${c.id}" ${obsOnline ? '' : 'disabled'}><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> สร้างที่ขาดในหมวดนี้ (${missing})</button>` : ''}
        </div>
      </details>`;
    }).join('')}`;

  body.querySelectorAll('[data-all]').forEach((b) => b.addEventListener('click', () => {
    showAll = b.dataset.all === '1';
    store.set('fcp_sources_all', showAll ? '1' : '0');
    renderSources(el);
  }));
  body.querySelector('#fcpSrcRefresh').addEventListener('click', async () => { await loadExisting(); renderSources(el); });
  body.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => {
    navigator.clipboard?.writeText(b.dataset.copy).then(() => toast(`คัดลอก ${b.dataset.copy}`, 'success'), () => {});
  }));
  body.querySelectorAll('[data-create]').forEach((b) => b.addEventListener('click', async () => {
    const item = SOURCES.find((s) => s.name === b.dataset.create);
    b.disabled = true;
    b.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
    await createOne(item, b);
    await loadExisting();
    renderSources(el);
  }));
  body.querySelectorAll('[data-create-cat]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    const items = visibleSources().filter((s) => s.cat === b.dataset.createCat && isMissing(s));
    let ok = 0;
    for (const item of items) {
      b.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ${esc(item.name)}`;
      if (await createOne(item, null)) ok++;
    }
    await loadExisting();
    renderSources(el);
    toast(`สร้างแล้ว ${ok}/${items.length}`, ok === items.length ? 'success' : 'error');
  }));
}

async function openSourceSheet() {
  const el = sheet('fcpSourceSheet', 'สร้าง Source ใน OBS', 'fa-layer-group');
  el.querySelector('.fcp-sheet-body').dataset.ready = '';
  await loadExisting();
  renderSources(el);
  openSheetEl(el);
}

// ── Boot ────────────────────────────────────────────────────────────
function boot() {
  buildBar();
  // A sport changed in the settings tab shows up in the bar.
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'vb2-sport-select') {
      const s = currentSport();
      if (s.engine !== e.target.value) store.set('fcp_sport', (SPORTS.find((x) => x.engine === e.target.value) || s).id);
      renderBar();
      applyLayout();
    }
  });
  if (typeof window.pushPlayScore === 'function') window.pushPlayScore({ sport: currentSport().id });
}

window.fcpShell = { selectSport, openSportSheet, openSourceSheet, renderBar };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 40));
else setTimeout(boot, 40);
