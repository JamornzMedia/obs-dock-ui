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
    if (identity.isTemporary || identity.name.startsWith('Guest_')) return;
    if (typeof firebase === 'undefined' || !firebase.database) return;

    try {
        const data = getUsageData();
        
        // Ensure ID exists (fallback to a generated one if somehow missing)
        if (!identity.ID) {
            identity.ID = Math.floor(100000 + Math.random() * 900000).toString();
            try { localStorage.setItem('userIdentity', JSON.stringify(identity)); } catch(e){}
        }

        const userData = {
            name: identity.name.substring(0, 30),
            province: identity.province || 'Unknown',
            totalMinutes: data.totalMinutes || 0,
            ID: identity.ID,
            lastUpdated: new Date().toISOString()
        };

        firebase.database().ref(`${OBS_ID_PATH}/${identity.ID}`).update(userData)
            .then(() => console.log(`Firebase obs_id synced for ID: ${identity.ID} (${userData.name})`))
            .catch(err => console.error('Firebase obs_id sync error:', err));
    } catch (e) {
        console.error('Firebase sync error:', e);
    }
}

// --- Firebase: Fetch existing user data (for duplicate name protection) ---
export async function fetchFirebaseUserData(name, currentID = null) {
    if (!name) return null;
    if (typeof firebase === 'undefined' || !firebase.database) return null;

    try {
        const snapshot = await firebase.database().ref(OBS_ID_PATH).once('value');
        const allUsers = snapshot.val() || {};
        
        let foundUser = null;
        Object.keys(allUsers).forEach(key => {
            const user = allUsers[key];
            if (user && user.name && user.name.toLowerCase() === name.toLowerCase()) {
                // Ignore if it's the current user's ID
                if (!currentID || key !== currentID) {
                    foundUser = user;
                }
            }
        });
        
        // Backward compatibility check
        if (!foundUser) {
            const sanitizedName = name.trim().replace(/[.#$\[\]\/]/g, '').replace(/\s+/g, '_').substring(0, 30);
            if (sanitizedName) {
                const oldSnapshot = await firebase.database().ref(`${OBS_ID_PATH}/${sanitizedName}`).once('value');
                if (oldSnapshot.exists()) {
                    foundUser = oldSnapshot.val();
                }
            }
        }
        
        return foundUser;
    } catch (e) {
        console.error('Firebase fetch error:', e);
        return null;
    }
}

// --- IP Location Fallback & Telemetry to jamornz.com ---
let cachedLocation = null;

async function fetchIpLocation() {
    try {
        const res = await fetch('https://ipinfo.io/json');
        const data = await res.json();
        if (data && data.city) {
            return { city: data.city, province: data.region || data.city, country: data.country || 'TH', gps: data.loc || '' };
        }
    } catch (e) {}
    try {
        const res2 = await fetch('https://ipwho.is/');
        const data2 = await res2.json();
        if (data2 && data2.success) {
            return { city: data2.city, province: data2.region || data2.city, country: data2.country_code || 'TH', gps: `${data2.latitude},${data2.longitude}` };
        }
    } catch (e2) {}
    return { city: 'Bangkok', province: 'Bangkok', country: 'TH', gps: '' };
}

export async function resolveLocationFallback() {
    if (cachedLocation) return cachedLocation;
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            const timer = setTimeout(async () => {
                const ipLoc = await fetchIpLocation();
                cachedLocation = ipLoc;
                resolve(ipLoc);
            }, 3000);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    clearTimeout(timer);
                    cachedLocation = { city: 'GPS', province: 'GPS Location', country: 'TH', gps: `${pos.coords.latitude},${pos.coords.longitude}` };
                    resolve(cachedLocation);
                },
                async () => {
                    clearTimeout(timer);
                    const ipLoc = await fetchIpLocation();
                    cachedLocation = ipLoc;
                    resolve(ipLoc);
                },
                { timeout: 2500 }
            );
        } else {
            fetchIpLocation().then(loc => { cachedLocation = loc; resolve(loc); });
        }
    });
}

export async function sendJamornzTelemetry(identity, minutes = 3) {
    if (!identity) return;
    const loc = await resolveLocationFallback();
    const payload = {
        is_anonymous: true,
        device_id: identity.ID ? `DOCK-${identity.ID}` : `DOCK-${identity.name || 'GUEST'}`,
        machine_name: identity.name || 'OBS Dock User',
        product_id: 'prog-1',
        location: identity.province || loc.province || 'Bangkok, TH',
        gps: loc.gps || '',
        usage_minutes: minutes,
        version: '2.9.5.4'
    };
    try {
        fetch('https://jamornz.com/api/check_auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(e => {});
    } catch (e) {}
}

// --- Start tracking usage ---
export function startUsageTracking(identity) {
    recordUserSession(identity);
    stopUsageTracking();
    minutesSinceLastSync = 0;

    // Send initial jamornz.com telemetry
    sendJamornzTelemetry(identity, 1);

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
            sendJamornzTelemetry(identity, 15);
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

// --- Google Sign-In Handler ---
window.loginWithGoogle = async function() {
    const userEmail = prompt("กรอกอีเมล Google ของคุณเพื่อเข้าสู่ระบบ (Google Sign-In):");
    if (!userEmail || !userEmail.includes('@')) {
        if (userEmail) alert("รูปแบบอีเมลไม่ถูกต้อง");
        return;
    }
    const namePart = userEmail.split('@')[0];
    const loc = await resolveLocationFallback();
    const newIdentity = {
        name: namePart,
        province: loc.province || 'Bangkok',
        ID: Math.floor(100000 + Math.random() * 900000).toString(),
        email: userEmail,
        isGoogleUser: true,
        createdAt: new Date().toISOString()
    };
    try {
        localStorage.setItem('userIdentity', JSON.stringify(newIdentity));
        alert(`เข้าสู่ระบบด้วย Google เรียบร้อยแล้ว! สวัสดีคุณ ${namePart}`);
        window.location.reload();
    } catch(e) {
        alert("ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบได้");
    }
};

// --- Expose to window for remote.js (non-module script) ---
window.fcpGetRankInfo = getRankInfo;
window.resolveLocationFallback = resolveLocationFallback;
