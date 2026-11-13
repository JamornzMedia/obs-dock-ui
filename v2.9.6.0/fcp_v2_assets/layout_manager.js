// ═══════════════════════════════════════════════════════════════════════
//  layout_manager.js — main page groups per sport (OBSScore V2.9.6.0)
//
//  • Each sport has its own order of groups and its own hidden groups
//    (PROFILES below). Picking a sport switches the page to it.
//  • "จัดหน้า" mode: every group gets ▲ ▼ and show / hide. Changes are saved
//    for the current sport (localStorage "fcp_layout_v3") and can be reset.
//  • "ปรับหน้าตาตามกีฬา" off = one layout for every sport ("*").
//  Groups that a module turns off itself (futsal fouls, snooker, sport
//  graphics, display table) stay off when they do not apply.
// ═══════════════════════════════════════════════════════════════════════

import { currentSport } from './sports.js?v=2.9.6.0d';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d = '') { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* storage blocked */ } },
};

// Groups on the main page: id, name, how to find the element
export const GROUPS = [
  { id: 'info', th: 'ออนไลน์และอันดับ', find: () => document.querySelector('[data-panel-id="panelTopBar"]'), fixed: true },
  { id: 'data', th: 'ข้อมูลแมตช์', find: () => document.querySelector('[data-panel-id="panelExcelLoad"]') },
  { id: 'teams', th: 'ทีมและคะแนน', find: () => document.querySelector('[data-panel-id="panelTeamEditor"]') },
  { id: 'swap', th: 'สลับฝั่ง', find: () => document.querySelector('[data-panel-id="panelSwap"]') },
  { id: 'timer', th: 'เวลา', find: () => document.querySelector('[data-panel-id="panelTimer"]') },
  { id: 'fouls', th: 'ฟาวล์สะสม (ฟุตซอล)', find: () => $('futsalFoulsCard') },
  { id: 'snooker', th: 'สนุกเกอร์', find: () => $('snookerControlCard') },
  { id: 'score2', th: 'คะแนนรอง', find: () => $('score2Card') },
  { id: 'actions', th: 'ปุ่ม Action', find: () => document.querySelector('[data-panel-id="panelActionButtons"]') },
  { id: 'sportgfx', th: 'ควบคุมกราฟิกกีฬา (HTML)', find: () => $('vb-main-actions') },
  { id: 'table', th: 'ตารางแข่งขัน', find: () => $('dt-main-control-card') },
  { id: 'tools', th: 'เครื่องมือ (ตั้งค่า จุดโทษ มือถือ)', find: () => $('settingsBtn')?.closest('.card') },
];
const byId = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
const ALL = GROUPS.filter((g) => !g.fixed).map((g) => g.id);

// Ready-made layout per sport: order (missing ids go to the end) and hidden groups
const PROFILES = {
  '*': { order: ['data', 'teams', 'swap', 'timer', 'actions', 'score2', 'fouls', 'snooker', 'sportgfx', 'table', 'tools'], hidden: [] },
  football: { order: ['data', 'teams', 'swap', 'timer', 'actions', 'sportgfx', 'table', 'tools'], hidden: ['score2'] },
  football7: { order: ['data', 'teams', 'swap', 'timer', 'actions', 'sportgfx', 'table', 'tools'], hidden: ['score2'] },
  futsal: { order: ['data', 'teams', 'fouls', 'timer', 'swap', 'actions', 'sportgfx', 'table', 'tools'], hidden: ['score2'] },
  basketball: { order: ['data', 'teams', 'score2', 'timer', 'swap', 'actions', 'sportgfx', 'table', 'tools'], hidden: [] },
  streetball: { order: ['data', 'teams', 'score2', 'timer', 'swap', 'actions', 'sportgfx', 'table', 'tools'], hidden: [] },
  volleyball: { order: ['data', 'teams', 'score2', 'sportgfx', 'swap', 'actions', 'table', 'tools'], hidden: ['timer'] },
  takraw: { order: ['data', 'teams', 'score2', 'sportgfx', 'swap', 'actions', 'table', 'tools'], hidden: ['timer'] },
  badminton: { order: ['data', 'teams', 'score2', 'sportgfx', 'swap', 'actions', 'table', 'tools'], hidden: ['timer'] },
  tabletennis: { order: ['data', 'teams', 'score2', 'sportgfx', 'swap', 'actions', 'table', 'tools'], hidden: ['timer'] },
  boxing: { order: ['data', 'teams', 'timer', 'sportgfx', 'actions', 'swap', 'table', 'tools'], hidden: ['score2'] },
  snooker: { order: ['data', 'teams', 'snooker', 'score2', 'swap', 'actions', 'table', 'tools'], hidden: ['timer'] },
};

const KEY = 'fcp_layout_v3';
const OLD_INLINE = ['info', 'data', 'teams', 'swap', 'timer', 'actions'];
// A module that does not apply to this sport sets display:none on its card
const inUse = (el) => !!el && el.style.display !== 'none';
const autoOn = () => store.get('fcp_auto_layout', '1') !== '0';
const layoutKey = () => (autoOn() ? currentSport().id : '*');
const saved = () => { try { return JSON.parse(store.get(KEY, '{}')) || {}; } catch (e) { return {}; } };

function complete(layout) {
  const order = (layout.order || []).filter((id) => ALL.includes(id));
  ALL.forEach((id) => { if (!order.includes(id)) order.push(id); });
  return { order, hidden: (layout.hidden || []).filter((id) => byId[id] && !byId[id].fixed) };
}
export function getLayout(key = layoutKey()) {
  const mine = saved()[key];
  return complete(mine || PROFILES[key] || PROFILES['*']);
}
function setLayout(layout, key = layoutKey()) {
  const all = saved();
  all[key] = complete(layout);
  store.set(KEY, JSON.stringify(all));
}
function resetLayout(key = layoutKey()) {
  const all = saved();
  delete all[key];
  store.set(KEY, JSON.stringify(all));
}

// Show / hide one group for a sport (used by the sport picker's "เวลา" switch).
// With "ปรับหน้าตาตามกีฬา" off every sport shares the "*" layout.
const keyFor = (sportId) => (autoOn() ? sportId : '*');
export function isGroupHidden(groupId, sportId) {
  return getLayout(keyFor(sportId)).hidden.includes(groupId);
}
export function setGroupHidden(groupId, hide, sportId) {
  const key = keyFor(sportId);
  const layout = getLayout(key);
  layout.hidden = layout.hidden.filter((x) => x !== groupId);
  if (hide) layout.hidden.push(groupId);
  setLayout(layout, key);
  apply();
}

// ── Apply ───────────────────────────────────────────────────────────
let applying = false;
export function apply() {
  if (applying) return;
  applying = true;
  try {
    const { order, hidden } = getLayout();
    document.documentElement.classList.toggle('fcp-auto', autoOn());
    // Order: move the groups that share a parent, starting where the first one is
    const els = order.map((id) => byId[id].find()).filter(Boolean);
    if (els.length) {
      const parent = els[0].parentNode;
      const group = els.filter((el) => el.parentNode === parent);
      const current = [...parent.children].filter((el) => group.includes(el));
      if (current.some((el, i) => el !== group[i])) {
        const marker = document.createComment('fcp-groups');
        parent.insertBefore(marker, current[0]);
        let ref = marker;
        group.forEach((el) => { parent.insertBefore(el, ref.nextSibling); ref = el; });
        marker.remove();
      }
      // Online & Ranking is fixed: always shown, always above the movable groups
      const info = byId.info.find();
      if (info && info.parentNode === parent && info.compareDocumentPosition(group[0]) & Node.DOCUMENT_POSITION_PRECEDING) {
        parent.insertBefore(info, group[0]);
      }
    }
    GROUPS.forEach((g) => {
      const el = g.find();
      if (!el) return;
      // The older layout editor hid these with an inline style; this mode replaces it.
      if (OLD_INLINE.includes(g.id) && el.style.display === 'none') el.style.display = '';
      el.classList.toggle('fcp-hidden', hidden.includes(g.id));
    });
    if (editing) decorate();
  } finally {
    applying = false;
  }
}

// ── Edit mode ───────────────────────────────────────────────────────
let editing = false;
function decorate() {
  const { order, hidden } = getLayout();
  document.querySelectorAll('.fcp-ptool').forEach((t) => t.remove());
  const shown = order.filter((id) => inUse(byId[id].find()));
  GROUPS.forEach((g) => {
    const el = g.find();
    if (g.fixed || !inUse(el)) return; // fixed groups get no tools: they cannot move or hide
    const i = shown.indexOf(g.id);
    const off = hidden.includes(g.id);
    const tool = document.createElement('div');
    tool.className = 'fcp-ptool';
    tool.innerHTML = `
      <span class="fcp-ptool-name">${g.th}${off ? ' <em>(ซ่อน)</em>' : ''}</span>
      ${g.fixed ? '' : `<button type="button" data-move="-1" ${i <= 0 ? 'disabled' : ''} title="เลื่อนขึ้น" aria-label="เลื่อน ${g.th} ขึ้น"><i class="fas fa-arrow-up" aria-hidden="true"></i></button>
      <button type="button" data-move="1" ${i >= shown.length - 1 ? 'disabled' : ''} title="เลื่อนลง" aria-label="เลื่อน ${g.th} ลง"><i class="fas fa-arrow-down" aria-hidden="true"></i></button>`}
      <button type="button" data-eye class="${off ? 'is-off' : ''}" title="${off ? 'แสดง' : 'ซ่อน'}" aria-label="${off ? 'แสดง' : 'ซ่อน'} ${g.th}" aria-pressed="${!off}"><i class="fas ${off ? 'fa-eye-slash' : 'fa-eye'}" aria-hidden="true"></i></button>`;
    tool.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const layout = getLayout();
      const vis = layout.order.filter((id) => inUse(byId[id].find()));
      const from = vis.indexOf(g.id), to = from + Number(b.dataset.move);
      if (to < 0 || to >= vis.length) return;
      const a = layout.order.indexOf(vis[from]), c = layout.order.indexOf(vis[to]);
      [layout.order[a], layout.order[c]] = [layout.order[c], layout.order[a]];
      setLayout(layout);
      apply();
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }));
    tool.querySelector('[data-eye]').addEventListener('click', (e) => {
      e.stopPropagation();
      const layout = getLayout();
      layout.hidden = off ? layout.hidden.filter((x) => x !== g.id) : [...layout.hidden, g.id];
      setLayout(layout);
      apply();
    });
    el.prepend(tool);
  });
  const bar = $('fcpEditBar');
  if (bar) bar.querySelector('#fcpEditWhat').textContent = autoOn() ? `กำลังจัดหน้าของ ${currentSport().th}` : 'กำลังจัดหน้า (ใช้กับทุกกีฬา)';
}

export function startEdit() {
  editing = true;
  document.body.classList.add('fcp-editing');
  if (!$('fcpEditBar')) {
    const bar = document.createElement('div');
    bar.id = 'fcpEditBar';
    bar.className = 'fcp-editbar';
    bar.setAttribute('role', 'toolbar');
    bar.innerHTML = `
      <span id="fcpEditWhat"></span>
      <label class="fcp-edit-auto" title="ปิด = ใช้หน้าเดียวกันทุกกีฬา"><input type="checkbox" id="fcpAutoLayout"> ปรับหน้าตาตามกีฬา</label>
      <div class="fcp-editbar-btns">
        <button type="button" id="fcpEditReset"><i class="fas fa-rotate-left" aria-hidden="true"></i> ค่าเริ่มต้น</button>
        <button type="button" id="fcpEditDone" class="is-main"><i class="fas fa-check" aria-hidden="true"></i> เสร็จ</button>
      </div>`;
    document.body.appendChild(bar);
    $('fcpEditDone').addEventListener('click', stopEdit);
    $('fcpEditReset').addEventListener('click', () => {
      if (!confirm('คืนลำดับและการซ่อนของหน้านี้เป็นค่าเริ่มต้น?')) return;
      resetLayout();
      apply();
    });
    $('fcpAutoLayout').addEventListener('change', (e) => {
      store.set('fcp_auto_layout', e.target.checked ? '1' : '0');
      apply();
    });
  }
  $('fcpAutoLayout').checked = autoOn();
  $('fcpEditBar').style.display = 'flex';
  decorate();
  setTimeout(() => $('fcpEditDone')?.focus(), 30);
}

export function stopEdit() {
  editing = false;
  document.body.classList.remove('fcp-editing');
  document.querySelectorAll('.fcp-ptool').forEach((t) => t.remove());
  const bar = $('fcpEditBar');
  if (bar) bar.style.display = 'none';
  window.showToast?.('บันทึกการจัดหน้าแล้ว', 'success');
}

// ── Boot ────────────────────────────────────────────────────────────
function boot() {
  apply();
  // Cards made later by the sport modules (futsal, snooker, sport graphics) take their place too.
  let timer = null;
  new MutationObserver(() => {
    if (applying) return;
    clearTimeout(timer);
    timer = setTimeout(apply, 120);
  }).observe(document.body, { childList: true });
  document.addEventListener('keydown', (e) => { if (editing && e.key === 'Escape') stopEdit(); });
  // The older "Customize Layout" overlay now opens this mode.
  window.openLayoutEditor = startEdit;
}

window.fcpLayout = { apply, startEdit, stopEdit, getLayout, isGroupHidden, setGroupHidden, GROUPS };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 120));
else setTimeout(boot, 120);
