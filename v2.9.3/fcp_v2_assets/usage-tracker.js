// fcp_v2_assets/usage-tracker.js
// ระบบติดตามเวลาการใช้งาน + ระดับขั้นผู้ใช้

const USAGE_KEY = 'usageTracker';
const USAGE_HISTORY_KEY = 'usageHistory';

// --- Rank Tiers (ชั่วโมง) ---
const RANK_TIERS = [
    { name: 'Trainee',      nameTh: 'เด็กฝึกหัด',           hours: 0,     icon: '🔰', color: '#94a3b8' },
    { name: 'Rookie',       nameTh: 'มือใหม่',              hours: 80,    icon: '⭐', color: '#a3e635' },
    { name: 'Beginner',     nameTh: 'ผู้เริ่มต้น',           hours: 200,   icon: '⭐', color: '#22c55e' },
    { name: 'Junior',       nameTh: 'ระดับต้น',             hours: 400,   icon: '🌟', color: '#14b8a6' },
    { name: 'Senior',       nameTh: 'ระดับสูง',             hours: 700,   icon: '🌟', color: '#06b6d4' },
    { name: 'Amateur',      nameTh: 'มือสมัครเล่น',          hours: 1100,  icon: '💫', color: '#3b82f6' },
    { name: 'Semi-Pro',     nameTh: 'กึ่งอาชีพ',            hours: 1600,  icon: '💫', color: '#6366f1' },
    { name: 'Pro',          nameTh: 'มืออาชีพ',             hours: 2200,  icon: '👑', color: '#8b5cf6' },
    { name: 'National',     nameTh: 'ระดับประเทศ',          hours: 3000,  icon: '👑', color: '#a855f7' },
    { name: 'World Class',  nameTh: 'ระดับโลก',             hours: 4000,  icon: '🏆', color: '#d946ef' },
    { name: 'Master',       nameTh: 'ปรมาจารย์',            hours: 5200,  icon: '🏆', color: '#ec4899' },
    { name: 'Grand Master', nameTh: 'ปรมาจารย์ขั้นสูงสุด',   hours: 6700,  icon: '💎', color: '#f43f5e' },
    { name: 'Legend',       nameTh: 'ระดับตำนาน',           hours: 8500,  icon: '🔥', color: '#ef4444' },
];

let trackingInterval = null;

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

    // Find existing user entry
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

    // Next rank info
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

// --- Format time display ---
export function formatUsageTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

// --- Start tracking usage ---
export function startUsageTracking(identity) {
    // Record this session
    recordUserSession(identity);

    // Stop existing tracking if any
    stopUsageTracking();

    // Increment every minute
    trackingInterval = setInterval(() => {
        const data = getUsageData();
        data.totalMinutes = (data.totalMinutes || 0) + 1;
        data.lastUpdated = new Date().toISOString();
        saveUsageData(data);

        // Update UI
        updateRankDisplay();
    }, 60000); // Every 1 minute

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

// --- Update rank display in the top bar ---
export function updateRankDisplay() {
    const data = getUsageData();
    const rank = getRank(data.totalMinutes || 0);
    const timeStr = formatUsageTime(data.totalMinutes || 0);

    const rankEl = document.getElementById('userRankDisplay');
    if (rankEl) {
        rankEl.innerHTML = `${rank.icon} <span class="rank-name" style="color: ${rank.color}">${rank.name}</span> <span class="rank-time">${timeStr}</span>`;
        rankEl.title = `${rank.nameTh} (${rank.name}) — ${timeStr}\n${rank.nextRank ? `ถัดไป: ${rank.nextRank.name} (อีก ${rank.hoursToNext} ชม.)` : '🏆 ระดับสูงสุด!'}`;
    }
}

// --- Get all rank tiers (for display) ---
export function getAllRanks() {
    return RANK_TIERS;
}
