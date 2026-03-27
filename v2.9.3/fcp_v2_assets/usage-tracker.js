// fcp_v2_assets/usage-tracker.js
// ระบบติดตามเวลาการใช้งาน + ระดับขั้นผู้ใช้ + Firebase Sync

const USAGE_KEY = 'usageTracker';
const USAGE_HISTORY_KEY = 'usageHistory';
const OBS_ID_PATH = 'obs_id'; // Firebase folder

// --- Rank Tiers (ชั่วโมง) — แต่ละระดับมี icon ไม่ซ้ำกัน ---
const RANK_TIERS = [
    { name: 'Trainee',      nameTh: 'เด็กฝึกหัด',           hours: 0,     icon: '🔰', color: '#94a3b8' },
    { name: 'Rookie',       nameTh: 'มือใหม่',              hours: 30,    icon: '⭐', color: '#a3e635' },
    { name: 'Beginner',     nameTh: 'ผู้เริ่มต้น',           hours: 60,    icon: '🌱', color: '#22c55e' },
    { name: 'Junior',       nameTh: 'ระดับต้น',             hours: 95,    icon: '🌟', color: '#14b8a6' },
    { name: 'Senior',       nameTh: 'ระดับสูง',             hours: 135,   icon: '💪', color: '#06b6d4' },
    { name: 'Amateur',      nameTh: 'มือสมัครเล่น',          hours: 180,   icon: '🎯', color: '#3b82f6' },
    { name: 'Semi-Pro',     nameTh: 'กึ่งอาชีพ',            hours: 230,   icon: '💫', color: '#6366f1' },
    { name: 'Pro',          nameTh: 'มืออาชีพ',             hours: 285,   icon: '👑', color: '#8b5cf6' },
    { name: 'National',     nameTh: 'ระดับประเทศ',          hours: 345,   icon: '🏆', color: '#a855f7' },
    { name: 'World Class',  nameTh: 'ระดับโลก',             hours: 410,   icon: '🌍', color: '#d946ef' },
    { name: 'Master',       nameTh: 'ปรมาจารย์',            hours: 480,   icon: '💎', color: '#ec4899' },
    { name: 'Grand Master', nameTh: 'จอมจักรวาล',           hours: 555,   icon: '🐉', color: '#f43f5e' },
    { name: 'Legend',       nameTh: 'ตำนาน',               hours: 635,   icon: '⚡', color: '#fbbf24' },
    { name: 'God',          nameTh: 'เทพ',                 hours: 720,   icon: '🔱', color: '#ff0000' },
];

let trackingInterval = null;
let firebaseSyncInterval = null;
let minutesSinceLastSync = 0;

// --- Get stored usage data ---
export function getUsageData() {
    try {
        return JSON.parse(localStorage.getItem(USAGE_KEY)) || { totalMinutes: 0 };
    } catch (e) {
        return { totalMinutes: 0 };
    }
}

// --- Save usage data ---
function saveUsageData(data) {
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}

// --- Get usage history (all users that have used this) ---
export function getUsageHistory() {
    try {
        return JSON.parse(localStorage.getItem(USAGE_HISTORY_KEY)) || [];
    } catch (e) {
        return [];
    }
}

// --- Record user session in history ---
function recordUserSession(identity) {
    if (!identity || !identity.name) return;
    const history = getUsageHistory();
    const now = new Date().toISOString();

    const existing = history.find(h => h.name === identity.name);
    if (existing) {
        existing.lastSeen = now;
        existing.sessionCount = (existing.sessionCount || 1) + 1;
        existing.province = identity.province || existing.province;
    } else {
        history.push({
            name: identity.name,
            province: identity.province || 'Unknown',
            firstSeen: now,
            lastSeen: now,
            sessionCount: 1
        });
    }

    localStorage.setItem(USAGE_HISTORY_KEY, JSON.stringify(history));
}

// --- Get rank from total minutes ---
export function getRank(totalMinutes) {
    const totalHours = totalMinutes / 60;
    let currentRank = RANK_TIERS[0];

    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (totalHours >= RANK_TIERS[i].hours) {
            currentRank = RANK_TIERS[i];
            break;
        }
    }

    const currentIndex = RANK_TIERS.indexOf(currentRank);
    const nextRank = currentIndex < RANK_TIERS.length - 1 ? RANK_TIERS[currentIndex + 1] : null;
    const hoursToNext = nextRank ? (nextRank.hours * 60 - totalMinutes) / 60 : 0;

    return {
        ...currentRank,
        totalMinutes,
        totalHours: Math.floor(totalHours),
        displayMinutes: totalMinutes % 60,
        nextRank,
        hoursToNext: Math.ceil(hoursToNext)
    };
}

// --- Get rank from total minutes (for external use, returns just name+icon) ---
export function getRankInfo(totalMinutes) {
    return getRank(totalMinutes);
}

// --- Format time display ---
export function formatUsageTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

// --- Firebase: Sync user data to obs_id folder ---
function syncToFirebase(identity) {
    if (!identity || !identity.name) return;
    if (typeof firebase === 'undefined' || !firebase.database) return;

    try {
        const sanitizedName = identity.name.trim()
            .replace(/[.#$\[\]\/]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
        if (!sanitizedName) return;

        const data = getUsageData();

        const userData = {
            name: identity.name.substring(0, 30),
            province: identity.province || 'Unknown',
            totalMinutes: data.totalMinutes || 0,
            lastUpdated: new Date().toISOString()
        };

        firebase.database().ref(`${OBS_ID_PATH}/${sanitizedName}`).update(userData)
            .then(() => console.log(`Firebase obs_id synced: ${sanitizedName}`))
            .catch(err => console.error('Firebase obs_id sync error:', err));
    } catch (e) {
        console.error('Firebase sync error:', e);
    }
}

// --- Firebase: Fetch existing user data (for duplicate name protection) ---
export async function fetchFirebaseUserData(name) {
    if (!name) return null;
    if (typeof firebase === 'undefined' || !firebase.database) return null;

    try {
        const sanitizedName = name.trim()
            .replace(/[.#$\[\]\/]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
        if (!sanitizedName) return null;

        const snapshot = await firebase.database().ref(`${OBS_ID_PATH}/${sanitizedName}`).once('value');
        return snapshot.val();
    } catch (e) {
        console.error('Firebase fetch error:', e);
        return null;
    }
}

// --- Start tracking usage ---
export function startUsageTracking(identity) {
    recordUserSession(identity);
    stopUsageTracking();
    minutesSinceLastSync = 0;

    // Increment every minute
    trackingInterval = setInterval(() => {
        const data = getUsageData();
        data.totalMinutes = (data.totalMinutes || 0) + 1;
        data.lastUpdated = new Date().toISOString();
        saveUsageData(data);

        // Update UI
        updateRankDisplay();

        // Sync to Firebase every 15 minutes
        minutesSinceLastSync++;
        if (minutesSinceLastSync >= 15) {
            minutesSinceLastSync = 0;
            syncToFirebase(identity);
        }
    }, 60000); // Every 1 minute

    // Initial sync to Firebase
    syncToFirebase(identity);

    // Initial UI update
    updateRankDisplay();
}

// --- Stop tracking ---
export function stopUsageTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
}

// --- Update rank display in the top bar (Name + Thai Rank) ---
export function updateRankDisplay() {
    const data = getUsageData();
    const rank = getRank(data.totalMinutes || 0);
    const timeStr = formatUsageTime(data.totalMinutes || 0);

    // Get user name
    let userName = '';
    try {
        const identity = JSON.parse(localStorage.getItem('userIdentity') || 'null');
        if (identity && identity.name) userName = identity.name;
    } catch (e) { }

    const rankEl = document.getElementById('userRankDisplay');
    if (rankEl) {
        const nameHtml = userName ? `<span id="rankUserName" style="color: #e2e8f0; font-weight: 600;">${userName}</span> ` : '';
        rankEl.innerHTML = `${rank.icon} ${nameHtml}<span class="rank-name" style="color: ${rank.color}">${rank.nameTh}</span> <span class="rank-time">${timeStr}</span>`;
        rankEl.title = `${userName ? userName + ' — ' : ''}${rank.nameTh} (${rank.name}) — ${timeStr}\n${rank.nextRank ? `ถัดไป: ${rank.nextRank.icon} ${rank.nextRank.nameTh} (อีก ${rank.hoursToNext} ชม.)` : '🔱 ระดับสูงสุดแล้ว!'}`;
    }
}

// --- Get all rank tiers (for display) ---
export function getAllRanks() {
    return RANK_TIERS;
}

// --- Expose to window for remote.js (non-module script) ---
window.fcpGetRankInfo = getRankInfo;
