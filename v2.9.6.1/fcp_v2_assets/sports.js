// ═══════════════════════════════════════════════════════════════════════
//  sports.js — the list of sports (OBSScore V2.9.6.1)
//
//  One place to add a sport. Each sport says which existing "engine" runs it
//  (the value the older modules read from localStorage "vb_sport"), so a new
//  sport can reuse the volleyball / badminton / football logic without
//  touching those modules.
//
//  Fields
//    id       saved in localStorage "fcp_sport", sent to PlayScore as {sport}
//    engine   value written to "vb_sport" (volleyball, basketball, football,
//             football7, futsal, streetball, badminton, boxing, snooker)
//    group    section in the sport picker (SPORT_GROUPS)
//    icon     Font Awesome 6 icon class
//    preset   matching PlayScore preset (shown as a hint)
//    features short Thai notes shown on the sport card
//    beta     true = new, uses another sport's engine
//    gfx      Sport Graphics (HTML) on by default when this sport is picked
//             (the user's own on/off is remembered per sport, see sportGfxOn)
//    steps    extra score buttons on the team cards besides +1 (basketball +2 +3)
// ═══════════════════════════════════════════════════════════════════════

export const SPORT_GROUPS = [
  { id: 'football', th: 'ฟุตบอล', en: 'Football' },
  { id: 'court', th: 'บาสเกตบอล', en: 'Basketball' },
  { id: 'net', th: 'ข้ามตาข่าย', en: 'Net sports' },
  { id: 'combat', th: 'ต่อสู้', en: 'Combat' },
  { id: 'cue', th: 'คิว', en: 'Cue sports' },
];

export const SPORTS = [
  { id: 'football', engine: 'football', group: 'football', th: 'ฟุตบอล 11 คน', en: 'Football 11', icon: 'fa-futbol', preset: 'Football Pro', features: ['เวลา + ทดเวลา', 'ประตูขึ้นกราฟิกเอง'], gfx: false, steps: [] },
  { id: 'football7', engine: 'football7', group: 'football', th: 'ฟุตบอล 7 คน', en: 'Football 7', icon: 'fa-futbol', preset: 'Football 7', features: ['เวลา + ทดเวลา'], gfx: false, steps: [] },
  { id: 'futsal', engine: 'futsal', group: 'football', th: 'ฟุตซอล', en: 'Futsal', icon: 'fa-futbol', preset: 'Futsal Pro', features: ['ฟาวล์สะสม 2 ทีม', 'DFK ฟาวล์ที่ 6'], gfx: false, steps: [] },
  { id: 'basketball', engine: 'basketball', group: 'court', th: 'บาสเกตบอล', en: 'Basketball', icon: 'fa-basketball', preset: 'Basketball Pro', features: ['ปุ่ม +2 / +3', 'ฟาวล์ = คะแนนรอง'], gfx: true, steps: [2, 3] },
  { id: 'streetball', engine: 'streetball', group: 'court', th: 'บาส 3x3', en: 'Streetball 3x3', icon: 'fa-basketball', preset: 'Streetball 3x3', features: ['ปุ่ม +2', 'ถึง 21 แต้ม'], gfx: true, steps: [2] },
  { id: 'volleyball', engine: 'volleyball', group: 'net', th: 'วอลเลย์บอล', en: 'Volleyball', icon: 'fa-volleyball', preset: 'Volleyball Pro', features: ['เซต + แต้ม', 'ประวัติแต้ม'], gfx: true, steps: [] },
  { id: 'takraw', engine: 'volleyball', group: 'net', th: 'เซปักตะกร้อ', en: 'Sepak takraw', icon: 'fa-volleyball', preset: 'Volleyball Pro', features: ['เซต + แต้ม (ระบบวอลเลย์)'], beta: true, gfx: true, steps: [] },
  { id: 'badminton', engine: 'badminton', group: 'net', th: 'แบดมินตัน', en: 'Badminton', icon: 'fa-feather-pointed', preset: 'Badminton Pro', features: ['เกม + แต้ม'], gfx: true, steps: [] },
  { id: 'tabletennis', engine: 'badminton', group: 'net', th: 'เทเบิลเทนนิส', en: 'Table tennis', icon: 'fa-table-tennis-paddle-ball', preset: 'Badminton Pro', features: ['เกม + แต้ม (ระบบแบด)'], beta: true, gfx: true, steps: [] },
  { id: 'boxing', engine: 'boxing', group: 'combat', th: 'มวย', en: 'Boxing', icon: 'fa-hand-fist', preset: 'Boxing Pro', features: ['ยก + เวลานับถอยหลัง'], gfx: true, steps: [] },
  { id: 'snooker', engine: 'snooker', group: 'cue', th: 'สนุกเกอร์', en: 'Snooker', icon: 'fa-circle-dot', preset: 'Snooker Pro', features: ['ลูก 1–7, ฟาวล์, เบรก'], gfx: true, steps: [] },
];

export const getSport = (id) => SPORTS.find((s) => s.id === id) || null;

// The sport chosen in the Dock. Older saves only have "vb_sport": use the first sport on that engine.
export function currentSport() {
  let id = '';
  try { id = localStorage.getItem('fcp_sport') || ''; } catch (e) { /* storage blocked */ }
  let engine = 'volleyball';
  try { engine = localStorage.getItem('vb_sport') || 'volleyball'; } catch (e) { /* storage blocked */ }
  const chosen = getSport(id);
  if (chosen && chosen.engine === engine) return chosen;
  return SPORTS.find((s) => s.engine === engine) || SPORTS[0];
}

// Sport Graphics on/off, remembered per sport (localStorage "fcp_gfx_by_sport").
const GFX_KEY = 'fcp_gfx_by_sport';
const gfxMap = () => { try { return JSON.parse(localStorage.getItem(GFX_KEY) || '{}') || {}; } catch (e) { return {}; } };
export function sportGfxOn(id) {
  const m = gfxMap();
  if (Object.prototype.hasOwnProperty.call(m, id)) return !!m[id];
  const s = getSport(id);
  return s ? s.gfx !== false : true;
}
export function setSportGfxOn(id, on) {
  const m = gfxMap();
  m[id] = !!on;
  try { localStorage.setItem(GFX_KEY, JSON.stringify(m)); } catch (e) { /* storage blocked */ }
}

window.FCP_SPORTS = { SPORTS, SPORT_GROUPS, getSport, currentSport, sportGfxOn, setSportGfxOn };
