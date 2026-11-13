// ═══════════════════════════════════════════════════════════════════════
//  source_catalog.js — every OBS source the Dock can create (OBSScore V2.9.6.0)
//
//  Add a source here and it appears in "สร้าง Source" under its category.
//  kind
//    text | color | image   plain OBS sources filled by the Dock
//    browser                Browser Source showing one of the Dock's HTML pages
//                           (file is relative to the Dock page)
//    playscore              PlayScore graphic (needs the PlayScore plugin)
//    action                 runs a function of the Dock (fn = name on window)
//  soon    true = listed but cannot be created yet (badge "รออัปเดต")
//  sports  sport ids (sports.js) the source is meant for; leave out = every sport
// ═══════════════════════════════════════════════════════════════════════

export const SOURCE_CATEGORIES = [
  { id: 'teams', th: 'ทีมและคะแนน', icon: 'fa-users', note: 'ข้อความชื่อทีมและคะแนน อัปเดตจาก Dock อัตโนมัติ' },
  { id: 'look', th: 'สีและโลโก้', icon: 'fa-palette', note: 'สีเสื้อและโลโก้ทีม' },
  { id: 'time', th: 'เวลา', icon: 'fa-stopwatch', note: 'นาฬิกา ครึ่งเวลา และทดเวลา' },
  { id: 'labels', th: 'ข้อความแมตช์', icon: 'fa-tags', note: 'Label 1–5 และ LabelAll' },
  { id: 'overlays', th: 'กราฟิกสำเร็จรูป (HTML)', icon: 'fa-display', note: 'Browser Source ที่จัดหน้าตาไว้แล้ว ตามกีฬา' },
  { id: 'plugins', th: 'ปลั๊กอิน', icon: 'fa-plug', note: 'ต้องติดตั้งปลั๊กอินใน OBS ก่อน' },
];

const FOOTBALL_FAMILY = ['football', 'football7', 'futsal'];
const TIMED = ['football', 'football7', 'futsal', 'basketball', 'streetball', 'boxing'];

export const SOURCES = [
  // Teams and scores
  { cat: 'teams', name: 'name_team_a', kind: 'text', th: 'ชื่อทีม A' },
  { cat: 'teams', name: 'name_team_b', kind: 'text', th: 'ชื่อทีม B' },
  { cat: 'teams', name: 'score_team_a', kind: 'text', th: 'คะแนนหลักทีม A' },
  { cat: 'teams', name: 'score_team_b', kind: 'text', th: 'คะแนนหลักทีม B' },
  { cat: 'teams', name: 'score2_team_a', kind: 'text', th: 'คะแนนรองทีม A (เซต / เฟรม / ฟาวล์บาส)' },
  { cat: 'teams', name: 'score2_team_b', kind: 'text', th: 'คะแนนรองทีม B (เซต / เฟรม / ฟาวล์บาส)' },
  { cat: 'teams', name: 'fouls_team_a', kind: 'text', th: 'ฟาวล์สะสมทีม A', sports: ['futsal'] },
  { cat: 'teams', name: 'fouls_team_b', kind: 'text', th: 'ฟาวล์สะสมทีม B', sports: ['futsal'] },
  // Colours and logos
  { cat: 'look', name: 'Color_Team_A', kind: 'color', th: 'สีหลักทีม A' },
  { cat: 'look', name: 'Color_Team_B', kind: 'color', th: 'สีหลักทีม B' },
  { cat: 'look', name: 'Color_Team_A_2', kind: 'color', th: 'สีรองทีม A' },
  { cat: 'look', name: 'Color_Team_B_2', kind: 'color', th: 'สีรองทีม B' },
  { cat: 'look', name: 'logo_team_a', kind: 'image', th: 'โลโก้ทีม A (ไฟล์ในเครื่อง)' },
  { cat: 'look', name: 'logo_team_b', kind: 'image', th: 'โลโก้ทีม B (ไฟล์ในเครื่อง)' },
  { cat: 'look', name: 'logo_team_a_web', kind: 'action', fn: 'createWebLogoSources', th: 'โลโก้จากเว็บ A + B (jamornz.com)', checks: ['logo_team_a_web', 'logo_team_b_web'] },
  // Time
  { cat: 'time', name: 'time_counter', kind: 'text', th: 'เวลาแข่ง', sports: TIMED },
  { cat: 'time', name: 'half_text', kind: 'text', th: 'ครึ่ง / ยก / ควอเตอร์' },
  { cat: 'time', name: 'injury_time_text', kind: 'text', th: 'ทดเวลา (+3)', sports: FOOTBALL_FAMILY },
  // Labels
  { cat: 'labels', name: 'label_1', kind: 'text', th: 'Label 1 รอบการแข่งขัน' },
  { cat: 'labels', name: 'label_2', kind: 'text', th: 'Label 2 คู่ที่' },
  { cat: 'labels', name: 'label_3', kind: 'text', th: 'Label 3 สนาม' },
  { cat: 'labels', name: 'label_4', kind: 'text', th: 'Label 4 รุ่น' },
  { cat: 'labels', name: 'label_5', kind: 'text', th: 'Label 5 เวลาแข่ง' },
  { cat: 'labels', name: 'LabelAll', kind: 'text', th: 'LabelAll รวมข้อความตามแพทเทิร์น' },
  // Ready-made HTML graphics
  { cat: 'overlays', name: 'Volleyball_Main_Score', kind: 'browser', file: 'volleyball_score.html', w: 1200, h: 200, th: 'สกอร์บอร์ดกีฬา (วอลเลย์ บาส แบด ฟุตบอล)', sports: ['volleyball', 'takraw', 'basketball', 'streetball', 'badminton', 'tabletennis', 'football', 'football7', 'futsal'] },
  { cat: 'overlays', name: 'Volleyball_History', kind: 'browser', file: 'volleyball_score_history.html', w: 1200, h: 400, th: 'ประวัติเซต', sports: ['volleyball', 'takraw', 'badminton', 'tabletennis'] },
  { cat: 'overlays', name: 'Point_History', kind: 'browser', file: 'point_history.html', w: 1200, h: 500, th: 'ประวัติแต้ม', sports: ['volleyball', 'takraw', 'badminton', 'tabletennis'] },
  { cat: 'overlays', name: 'Boxing_Main_Score', kind: 'browser', file: 'boxing_score.html', w: 1200, h: 200, th: 'แถบมวย', sports: ['boxing'] },
  { cat: 'overlays', name: 'Snooker_Main_Score', kind: 'browser', file: 'snooker_score.html', w: 1280, h: 160, th: 'สกอร์บอร์ดสนุกเกอร์', sports: ['snooker'] },
  { cat: 'overlays', name: 'Half_Indicator_Overlay', kind: 'browser', file: 'half_indicator.html', w: 500, h: 150, th: 'ตัวบอกครึ่งเวลาแบบอนิเมชัน' },
  { cat: 'overlays', name: 'Display_Table_Overlay', kind: 'browser', file: 'display_table.html', w: 1920, h: 1080, th: 'ตารางแข่งขัน / ตารางคะแนน (เต็มจอ)' },
  // Plugins
  // soon: true = no create button yet, shows "รออัปเดต" (PlayScore is not released yet)
  { cat: 'plugins', name: 'PlayScore กราฟิก', kind: 'playscore', th: 'กราฟิก PlayScore (เลือก Preset ใน Dock PlayScore)', soon: true },
];

window.FCP_SOURCE_CATALOG = { SOURCE_CATEGORIES, SOURCES };
