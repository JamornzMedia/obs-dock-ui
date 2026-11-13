// ═══════════════════════════════════════════════════════════════════════
//  sports.js — the list of sports (OBSScore V2.9.6.0)
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
// ═══════════════════════════════════════════════════════════════════════

export const SPORT_GROUPS = [
  { id: 'football', th: 'ฟุตบอล', en: 'Football' },
  { id: 'court', th: 'บาสเกตบอล', en: 'Basketball' },
  { id: 'net', th: 'ข้ามตาข่าย', en: 'Net sports' },
  { id: 'combat', th: 'ต่อสู้', en: 'Combat' },
  { id: 'cue', th: 'คิว', en: 'Cue sports' },
];

export const SPORTS = [
  { id: 'football', engine: 'football', group: 'football', th: 'ฟุตบอล 11 คน', en: 'Football 11', icon: 'fa-futbol', preset: 'Football Pro', features: ['เวลา + ทดเวลา', 'ประตูขึ้นกราฟิกเอง'] },
  { id: 'football7', engine: 'football7', group: 'football', th: 'ฟุตบอล 7 คน', en: 'Football 7', icon: 'fa-futbol', preset: 'Football 7', features: ['เวลา + ทดเวลา'] },
  { id: 'futsal', engine: 'futsal', group: 'football', th: 'ฟุตซอล', en: 'Futsal', icon: 'fa-futbol', preset: 'Futsal Pro', features: ['ฟาวล์สะสม 2 ทีม', 'DFK ฟาวล์ที่ 6'] },
  { id: 'basketball', engine: 'basketball', group: 'court', th: 'บาสเกตบอล', en: 'Basketball', icon: 'fa-basketball', preset: 'Basketball Pro', features: ['ปุ่ม +2 / +3', 'ฟาวล์ = คะแนนรอง'] },
  { id: 'streetball', engine: 'streetball', group: 'court', th: 'บาส 3x3', en: 'Streetball 3x3', icon: 'fa-basketball', preset: 'Streetball 3x3', features: ['ปุ่ม +2', 'ถึง 21 แต้ม'] },
  { id: 'volleyball', engine: 'volleyball', group: 'net', th: 'วอลเลย์บอล', en: 'Volleyball', icon: 'fa-volleyball', preset: 'Volleyball Pro', features: ['เซต + แต้ม', 'ประวัติแต้ม'] },
  { id: 'takraw', engine: 'volleyball', group: 'net', th: 'เซปักตะกร้อ', en: 'Sepak takraw', icon: 'fa-volleyball', preset: 'Volleyball Pro', features: ['เซต + แต้ม (ระบบวอลเลย์)'], beta: true },
  { id: 'badminton', engine: 'badminton', group: 'net', th: 'แบดมินตัน', en: 'Badminton', icon: 'fa-feather-pointed', preset: 'Badminton Pro', features: ['เกม + แต้ม'] },
  { id: 'tabletennis', engine: 'badminton', group: 'net', th: 'เทเบิลเทนนิส', en: 'Table tennis', icon: 'fa-table-tennis-paddle-ball', preset: 'Badminton Pro', features: ['เกม + แต้ม (ระบบแบด)'], beta: true },
  { id: 'boxing', engine: 'boxing', group: 'combat', th: 'มวย', en: 'Boxing', icon: 'fa-hand-fist', preset: 'Boxing Pro', features: ['ยก + เวลานับถอยหลัง'] },
  { id: 'snooker', engine: 'snooker', group: 'cue', th: 'สนุกเกอร์', en: 'Snooker', icon: 'fa-circle-dot', preset: 'Snooker Pro', features: ['ลูก 1–7, ฟาวล์, เบรก'] },
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

window.FCP_SPORTS = { SPORTS, SPORT_GROUPS, getSport, currentSport };
