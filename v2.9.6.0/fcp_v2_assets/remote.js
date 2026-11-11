// fcp_v2_assets/remote.js

// ⚠️ Config อยู่ในไฟล์เดิม (ไม่ใช้ import เพื่อรองรับ file:// และ OBS browser) ⚠️
const firebaseConfig = {
    apiKey: "AIzaSyCRpQWN6J1HYE4r5R8YC2od0ZBt_gSm-iQ",
    authDomain: "obscam-p2p.firebaseapp.com",
    databaseURL: "https://obscam-p2p-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "obscam-p2p",
    storageBucket: "obscam-p2p.firebasestorage.app",
    messagingSenderId: "531335072084",
    appId: "1:531335072084:web:dc373db6b66581a63160c1"
};

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase Initialized");
    }
} catch (e) {
    console.error("Firebase Init Error:", e);
}

// --- Helper: Sanitize name for use as Firebase key ---
const sanitizeKey = (name) => {
    return name.trim()
        .replace(/[.#$\[\]\/]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
};

// --- New Room System: obs_rooms_score ---
const ROOMS_PATH = 'obs_rooms_score';

window.initOnlinePresenceSystem = () => {
    let identity = window.userIdentity;
    if (!identity) {
        try { identity = JSON.parse(localStorage.getItem('userIdentity')); } catch (e) { }
    }
    if (!identity || !identity.name || !identity.ID) {
        console.log("No user identity or ID, skipping presence system.");
        return;
    }

    if (identity.isTemporary || identity.name.startsWith('Guest_')) {
        console.log("Temporary user (Guest), skipping presence system.");
        return;
    }

    const sanitizedName = sanitizeKey(identity.name);
    if (!sanitizedName) {
        console.log("Invalid user name for presence key.");
        return;
    }

    const roomKey = `com_${sanitizedName}`;
    const roomRef = firebase.database().ref(`${ROOMS_PATH}/${roomKey}`);

    window.myRoomKey = roomKey;
    window.myRoomRef = roomRef;
    window.myUserID = identity.ID;

    // V2.9.3: Read totalMinutes from localStorage for presence
    let totalMins = 0;
    try {
        const usageData = JSON.parse(localStorage.getItem('usageTracker') || '{"totalMinutes":0}');
        totalMins = usageData.totalMinutes || 0;
    } catch (e) { }

    // Setup server time offset listener
    window.serverTimeOffset = 0;
    firebase.database().ref(".info/serverTimeOffset").on("value", (snap) => {
        window.serverTimeOffset = snap.val() || 0;
    });

    const presenceData = {
        name: identity.name.substring(0, 30),
        platform: "PC",
        province: identity.province || "Unknown",
        ID: identity.ID,
        totalMinutes: totalMins,
        lastActive: firebase.database.ServerValue.TIMESTAMP
    };

    // V2.9.4: Clean up old room if name changed
    if (window.myRoomKey && window.myRoomKey !== roomKey && window.myRoomRef) {
        window.myRoomRef.onDisconnect().cancel();
        window.myRoomRef.remove();
        console.log(`Cleaned old presence room: ${window.myRoomKey}`);
    }

    roomRef.onDisconnect().remove();
    roomRef.set(presenceData);

    console.log(`Created PC presence: ${roomKey} with ID: ${identity.ID}`);

    // Request GPS location silently — with OBS Dock fallback via IP Geolocation
    const updateRoomGps = (gpsStr) => {
        presenceData.gps = gpsStr;
        roomRef.update({ gps: gpsStr })
            .then(() => console.log(`[GPS] Saved location: ${gpsStr}`))
            .catch(e => console.error('[GPS] Error updating presence location:', e));
    };

    const fallbackIpGps = () => {
        fetch('https://ipwho.is/')
            .then(res => res.json())
            .then(data => {
                if (data && data.latitude && data.longitude) {
                    const gpsStr = `${data.latitude},${data.longitude}`;
                    console.log(`[GPS] IP fallback location: ${gpsStr} (city: ${data.city || '?'})`);
                    updateRoomGps(gpsStr);
                } else {
                    console.warn('[GPS] IP fallback returned incomplete data:', data);
                }
            })
            .catch(e => console.warn('[GPS] IP fallback also failed:', e.message));
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const gpsStr = `${position.coords.latitude},${position.coords.longitude}`;
                console.log(`[GPS] Browser location acquired: ${gpsStr}`);
                updateRoomGps(gpsStr);
            },
            (error) => {
                console.warn(`[GPS] Browser location blocked (${error.message}), trying IP fallback…`);
                fallbackIpGps();
            },
            { timeout: 5000, enableHighAccuracy: false }
        );
    } else {
        console.warn('[GPS] Geolocation API unavailable, trying IP fallback…');
        fallbackIpGps();
    }

    window.refreshOnlinePresence = () => {
        try {
            if (window.myRoomRef && presenceData) {
                let currentMins = presenceData.totalMinutes;
                try {
                    const usageData = JSON.parse(localStorage.getItem('usageTracker') || '{"totalMinutes":0}');
                    currentMins = usageData.totalMinutes || 0;
                } catch (e) {}
                presenceData.totalMinutes = currentMins;
                presenceData.lastActive = firebase.database.ServerValue.TIMESTAMP;
                window.myRoomRef.set(presenceData);
            }
        } catch(e) { console.warn("Auto-refresh online presence failed", e); }
    };

    if (window.presenceRefreshInterval) clearInterval(window.presenceRefreshInterval);
    window.presenceRefreshInterval = setInterval(window.refreshOnlinePresence, 30000); // 30 seconds

    // --- Monitor All Users (Polled for Optimization) ---
    const allRoomsRef = firebase.database().ref(ROOMS_PATH);

    let isFetchingPresence = false;
    window.fetchOnlinePresenceData = async () => {
        if (isFetchingPresence) return;
        isFetchingPresence = true;
        try {
            const snapshot = await allRoomsRef.once('value');
            const users = snapshot.val() || {};
            const keys = Object.keys(users);
            const now = Date.now() + (window.serverTimeOffset || 0);

            let pcCount = 0;
            let phoneCount = 0;
            const staleKeys = [];

            keys.forEach(key => {
                if (key.startsWith('com_')) {
                    const user = users[key];
                    if (user) {
                        if (user.lastActive) {
                            const isStale = (now - user.lastActive) > 60000; // 60 seconds (2 * 30s)
                            if (isStale) {
                                staleKeys.push(key);
                                return; // Skip counting
                            }
                        } else {
                            // Legacy/stuck entry without lastActive: set initial timestamp
                            firebase.database().ref(`${ROOMS_PATH}/${key}`).update({
                                lastActive: firebase.database.ServerValue.TIMESTAMP
                            }).catch(() => {});
                        }
                        pcCount++;
                    }
                } else if (key.startsWith('mobile_')) {
                    const mobileRoom = users[key];
                    if (mobileRoom && mobileRoom.Mobile === 'on') {
                        phoneCount++;
                    }
                }
            });

            // Clean up stale users in database
            if (staleKeys.length > 0) {
                staleKeys.forEach(key => {
                    firebase.database().ref(`${ROOMS_PATH}/${key}`).remove().catch(() => {});
                    const mobileKey = key.replace('com_', 'mobile_');
                    firebase.database().ref(`${ROOMS_PATH}/${mobileKey}`).remove().catch(() => {});
                });
            }

            const countEl = document.getElementById('onlineCountVal');
            if (countEl) countEl.innerText = pcCount;

            const phoneCountEl = document.getElementById('onlinePhoneCountVal');
            if (phoneCountEl) phoneCountEl.innerText = phoneCount;

            window.onlineUsersSnapshot = snapshot;

            const popup = document.getElementById('onlineUsersPopup');
            if (popup && popup.style.display !== 'none') {
                renderOnlineUsersList();
            }
        } catch (e) {
            console.warn("Fetch online presence failed", e);
        } finally {
            isFetchingPresence = false;
        }
    };

    // Randomized startup delay (2-5s) to prevent thundering herd when starting up
    setTimeout(() => {
        if (window.fetchOnlinePresenceData) window.fetchOnlinePresenceData();
    }, 2000 + Math.random() * 3000);

    if (window.onlinePresenceInterval) clearInterval(window.onlinePresenceInterval);
    window.onlinePresenceInterval = setInterval(() => {
        if (window.fetchOnlinePresenceData) window.fetchOnlinePresenceData();
    }, 45000); // Poll every 45 seconds

    // --- New User Notification ---
    let initialLoad = true;
    allRoomsRef.limitToLast(1).on('child_added', (snapshot) => {
        if (initialLoad) return;

        const key = snapshot.key;
        if (key === window.myRoomKey) return;

        const val = snapshot.val();
        if (val && val.name) {
            const isPhone = key.startsWith('phone_');
            const platformIcon = isPhone
                ? '<i class="fas fa-mobile-alt"></i>'
                : '<i class="fas fa-desktop"></i>';
            const displayName = key.replace(/^(com_|phone_)/, '').replace(/_/g, ' ');
            const msg = `${platformIcon} ${displayName} เข้ามาแล้ว`;
            if (typeof window.showToast === 'function') {
                window.showToast(msg, 'info', 5000);
            }
        }
    });

    allRoomsRef.once('value', () => { initialLoad = false; });
};

// --- Popup Logic ---
window.openOnlineUsersPopup = () => {
    if (window.refreshOnlinePresence) window.refreshOnlinePresence();
    const popup = document.getElementById('onlineUsersPopup');
    if (popup) popup.style.display = 'flex';
    if (window.fetchOnlinePresenceData) window.fetchOnlinePresenceData();
    renderOnlineUsersList();
    if (window.renderGlobalRanking) window.renderGlobalRanking();
};

// --- V2.9.6.0: Online & Ranking list (one row per person, fits a narrow Dock) ---
const cuEsc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cuMyName = () => {
    try { const id = JSON.parse(localStorage.getItem('userIdentity') || '{}'); return (id && id.name || '').trim(); } catch (e) { return ''; }
};
const cuHours = (minutes) => Math.floor(minutes / 60) + 'h ' + String(minutes % 60).padStart(2, '0') + 'm';
const cuRank = (minutes) => (typeof window.fcpGetRankInfo === 'function'
    ? window.fcpGetRankInfo(minutes || 0)
    : { icon: '🔰', nameTh: 'เด็กฝึกหัด', color: '#94a3b8' });
// Ranked people from obs_id: no guests, one entry per name (the one with the most time), most time first.
const cuRankedUsers = (rawUsers) => {
    const byName = {};
    Object.values(rawUsers || {}).forEach((user) => {
        if (!user || !user.name || user.name.startsWith('Guest_')) return;
        const key = user.name.toLowerCase();
        if (!byName[key] || (user.totalMinutes || 0) > (byName[key].totalMinutes || 0)) byName[key] = user;
    });
    return Object.values(byName).sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
};
const cuOnlineIds = () => {
    const ids = new Set();
    const rooms = window.onlineUsersSnapshot ? (window.onlineUsersSnapshot.val() || {}) : {};
    Object.values(rooms).forEach((room) => { if (room && room.ID) ids.add(room.ID); });
    return ids;
};
const cuMessage = (tbody, text, color = '#94a3b8') => {
    tbody.innerHTML = `<tr><td colspan="5"><div class="cu-empty" style="color:${color}">${text}</div></td></tr>`;
};
// pos: number shown on the left (1–3 get a medal); right: html for the right side
const cuRow = ({ pos, name, rank, province, right, me, online, search, medals = true }) => {
    const medal = medals && pos <= 3 ? ['gold', 'silver', 'bronze'][pos - 1] : '';
    const posHtml = medal
        ? `<span class="cu-pos cu-${medal}" title="อันดับ ${pos}"><i class="fas fa-medal" aria-hidden="true"></i><b>${pos}</b></span>`
        : `<span class="cu-pos">${pos}</span>`;
    return `<tr class="cu-tr${me ? ' is-me' : ''}" data-search="${cuEsc(search.toLowerCase())}"><td colspan="5">
        <div class="cu-row">
            ${posHtml}
            <div class="cu-who">
                <div class="cu-name">${online ? '<i class="cu-online" title="ออนไลน์อยู่"></i>' : ''}${cuEsc(name)}${me ? ' <em class="cu-me">คุณ</em>' : ''}</div>
                <div class="cu-sub"><span style="color:${rank.color}">${rank.icon} ${cuEsc(rank.nameTh)}</span>${province ? ` · ${cuEsc(province)}` : ''}</div>
            </div>
            <div class="cu-right">${right}</div>
        </div></td></tr>`;
};
// Filter rows of the open list by the search box
window.cuFilterLists = () => {
    const q = (document.getElementById('cuSearch')?.value || '').trim().toLowerCase();
    document.querySelectorAll('#onlineUsersPopup tr.cu-tr').forEach((tr) => {
        tr.style.display = !q || tr.dataset.search.includes(q) ? '' : 'none';
    });
};

window.renderGlobalRanking = async () => {
    const tbody = document.getElementById('globalRankingTableBody');
    if (!tbody) return;
    if (typeof firebase === 'undefined' || !firebase.database) return cuMessage(tbody, 'ยังเชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (Firebase offline)', '#f87171');
    try {
        const snapshot = await firebase.database().ref('obs_id').once('value');
        const users = cuRankedUsers(snapshot.val());
        window.allRegisteredUsersArray = users;
        if (!users.length) return cuMessage(tbody, 'ยังไม่มีข้อมูลอันดับ');
        const myName = cuMyName();
        const online = cuOnlineIds();
        tbody.innerHTML = users.map((user, i) => cuRow({
            pos: i + 1, name: user.name || 'Unknown', rank: cuRank(user.totalMinutes), province: user.province || '',
            right: `<span class="cu-time">${cuHours(user.totalMinutes || 0)}</span>`,
            me: user.name === myName, online: online.has(user.ID), search: `${user.name} ${user.province || ''}`,
        })).join('');
        const meIndex = users.findIndex((u) => u.name === myName);
        const card = document.getElementById('cuMyRank');
        if (card) {
            if (meIndex >= 0) {
                const me = users[meIndex];
                const r = cuRank(me.totalMinutes);
                card.innerHTML = `<span class="cu-my-pos">#${meIndex + 1}</span><span class="cu-my-text"><b>อันดับของคุณ</b><small>${r.icon} ${cuEsc(r.nameTh)} · ใช้งาน ${cuHours(me.totalMinutes || 0)} · จาก ${users.length} คน</small></span>`;
                card.style.display = 'flex';
            } else {
                card.innerHTML = '<span class="cu-my-text"><b>ยังไม่มีอันดับ</b><small>เข้าแบบ Guest จะไม่ถูกนับอันดับ ใส่ชื่อตอนเข้าใช้งานเพื่อเริ่มสะสมเวลา</small></span>';
                card.style.display = 'flex';
            }
        }
        window.cuFilterLists();
    } catch (err) {
        console.error('Error fetching global ranking:', err);
        cuMessage(tbody, 'โหลดอันดับไม่สำเร็จ ลองใหม่อีกครั้ง', '#f87171');
    }
};

window.renderOnlineUsersList = () => {
    const tbody = document.getElementById('onlineUsersTableBody');
    if (!tbody || !window.onlineUsersSnapshot) return;
    const rawUsers = window.onlineUsersSnapshot.val() || {};
    const now = Date.now() + (window.serverTimeOffset || 0);
    const pcs = [];
    const phones = {};
    Object.keys(rawUsers).forEach((key) => {
        const room = rawUsers[key];
        if (!room) return;
        if (key.startsWith('mobile_')) { if (room.ID) phones[room.ID] = room; return; }
        if (!key.startsWith('com_')) return;
        if (room.lastActive && now - room.lastActive > 60000) return; // stale
        pcs.push(room);
    });
    pcs.sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
    const phoneCount = pcs.filter((u) => phones[u.ID] && phones[u.ID].Mobile === 'on').length;
    const summary = document.getElementById('cuSummary');
    if (summary) summary.innerHTML = `<span><i class="fas fa-desktop" aria-hidden="true"></i> ออนไลน์ ${pcs.length} คน</span><span><i class="fas fa-mobile-alt" aria-hidden="true"></i> ใช้มือถือคุม ${phoneCount}</span>`;
    if (!pcs.length) return cuMessage(tbody, 'ตอนนี้ยังไม่มีใครออนไลน์');
    const myName = cuMyName();
    tbody.innerHTML = pcs.map((user, i) => {
        const phone = phones[user.ID] && phones[user.ID].Mobile === 'on';
        return cuRow({
            pos: i + 1, name: user.name || 'Unknown', rank: cuRank(user.totalMinutes), province: user.province || '',
            right: `<span class="cu-dev" title="คอมพิวเตอร์"><i class="fas fa-desktop" aria-hidden="true"></i></span>${phone ? '<span class="cu-dev is-phone" title="ต่อมือถืออยู่"><i class="fas fa-mobile-alt" aria-hidden="true"></i></span>' : ''}`,
            me: user.name === myName, online: true, medals: false, search: `${user.name} ${user.province || ''}`,
        });
    }).join('');
    window.cuFilterLists();
};

// --- Stale Entry Cleanup ---
window.cleanupStaleEntries = () => {
    let identity = window.userIdentity;
    if (!identity) {
        try { identity = JSON.parse(localStorage.getItem('userIdentity')); } catch (e) { }
    }
    if (!identity || !identity.name) return;

    const sanitizedName = sanitizeKey(identity.name);
    if (!sanitizedName) return;

    const comKey = `com_${sanitizedName}`;
    const mobileKey = `mobile_${sanitizedName}`;

    firebase.database().ref(`${ROOMS_PATH}/${comKey}`).remove()
        .then(() => console.log(`Cleaned up stale entry: ${comKey}`))
        .catch(() => { });

    firebase.database().ref(`${ROOMS_PATH}/${mobileKey}`).remove()
        .then(() => console.log(`Cleaned up stale entry: ${mobileKey}`))
        .catch(() => { });
};

// --- Map Filter Logic ---
const thaiRegions = {
    'เหนือ': ['เชียงใหม่', 'เชียงราย', 'แม่ฮ่องสอน', 'พะเยา', 'น่าน', 'ลำพูน', 'ลำปาง', 'แพร่', 'อุตรดิตถ์', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร', 'กำแพงเพชร', 'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'],
    'อีสาน': ['นครราชสีมา', 'ชัยภูมิ', 'บุรีรัมย์', 'สุรินทร์', 'ขอนแก่น', 'กาฬสินธุ์', 'มหาสารคาม', 'ร้อยเอ็ด', 'ยโสธร', 'อำนาจเจริญ', 'อุบลราชธานี', 'ศรีสะเกษ', 'หนองบัวลำภู', 'อุดรธานี', 'สกลนคร', 'นครพนม', 'มุกดาหาร', 'หนองคาย', 'บึงกาฬ', 'เลย'],
    'กลาง': ['กรุงเทพมหานคร', 'สมุทรปราการ', 'นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา', 'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี', 'นครนายก', 'ปราจีนบุรี', 'ฉะเชิงเทรา', 'สระแก้ว', 'สุพรรณบุรี', 'นครปฐม', 'สมุทรสาคร', 'สมุทรสงคราม'],
    'ตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด'],
    'ตะวันตก': ['ตาก', 'กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์'],
    'ใต้': ['ชุมพร', 'ระนอง', 'สุราษฎร์ธานี', 'พังงา', 'นครศรีธรรมราช', 'ภูเก็ต', 'กระบี่', 'ตรัง', 'พัทลุง', 'สตูล', 'สงขลา', 'ปัตตานี', 'ยะลา', 'นราธิวาส']
};

// Province map (thailand_map.js) is loaded the first time the Map tab opens.
let cuMapView = null;
let cuMapLoadedAt = 0;
let cuMapMod = null;

const cuMapUsers = () => window.allRegisteredUsersArray || [];

const cuMapEnsure = async () => {
    const host = document.getElementById('thaiMapContainer');
    if (!host) return null;
    if (!cuMapMod) cuMapMod = await import('./thailand_map.js?v=2.9.6.0b');
    if (!cuMapView || !host.querySelector('.thm-svg')) {
        cuMapView = cuMapMod.mountMap(host, { onProvince: (province) => window.filterOnlineUsersByProvince(province) });
    }
    return cuMapView;
};

window.loadMapData = async () => {
    try {
        const view = await cuMapEnsure();
        if (typeof firebase === 'undefined' || !firebase.database) return;
        // Users change slowly: read the list at most once a minute.
        if (Date.now() - cuMapLoadedAt > 60000 || !window.allRegisteredUsersArray) {
            const snapshot = await firebase.database().ref('obs_id').once('value');
            const rawUsers = snapshot.val() || {};
            const usersMap = {};
            Object.keys(rawUsers).forEach(key => {
                const user = rawUsers[key];
                if (!user || !user.name || user.name.startsWith('Guest_')) return;
                const lowerName = user.name.toLowerCase();
                if (!usersMap[lowerName] || (user.totalMinutes || 0) > (usersMap[lowerName].totalMinutes || 0)) {
                    usersMap[lowerName] = user;
                }
            });
            window.allRegisteredUsersArray = Object.values(usersMap);
            cuMapLoadedAt = Date.now();
        }
        const counts = {};
        cuMapUsers().forEach(user => {
            const p = cuMapMod ? cuMapMod.provinceOf(user.province) : '';
            if (p) counts[p] = (counts[p] || 0) + 1;
        });
        if (view) view.setCounts(counts);
    } catch (e) {
        console.error("Failed to load map data", e);
    }
};

const cuMapShowList = (title, users, emptyText) => {
    document.getElementById('thaiMapContainer').style.display = 'none';
    document.getElementById('mapUsersContainer').style.display = 'flex';
    document.getElementById('selectedRegionTitle').textContent = title;
    const tbody = document.getElementById('mapUsersTableBody');
    if (!tbody) return;
    users = users.slice().sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
    if (!users.length) return cuMessage(tbody, emptyText);
    const myName = cuMyName();
    const online = cuOnlineIds();
    tbody.innerHTML = users.map((user, i) => cuRow({
        pos: i + 1, name: user.name || 'Unknown', rank: cuRank(user.totalMinutes), province: user.province || '',
        right: `<span class="cu-time">${cuHours(user.totalMinutes || 0)}</span>`,
        me: user.name === myName, online: online.has(user.ID), search: `${user.name} ${user.province || ''}`,
    })).join('');
};

window.filterOnlineUsersByProvince = (province) => {
    const users = cuMapUsers().filter((u) => cuMapMod && cuMapMod.provinceOf(u.province) === province);
    cuMapShowList(`จ.${province}`, users, 'ยังไม่มีผู้ใช้งานในจังหวัดนี้');
};

window.filterOnlineUsersByRegion = (region) => {
    const provinces = thaiRegions[region] || [];
    const users = cuMapUsers().filter((user) => user.province && provinces.some((p) => user.province.includes(p)));
    cuMapShowList(`อันดับภาค${region}`, users, 'ไม่มีผู้ใช้งานในภาคนี้');
};

window.backToMapRegions = () => {
    document.getElementById('thaiMapContainer').style.display = '';
    document.getElementById('mapUsersContainer').style.display = 'none';
};

// --- Custom Visitor Counter Logic ---
window.initVisitorCounter = () => {
    if (typeof firebase === 'undefined' || !firebase.database) return;

    const counterRef = firebase.database().ref('global_stats/visitor_count');
    const displayEl = document.getElementById('visitorCounterDisplay');

    // Fetch and display immediately
    counterRef.on('value', (snapshot) => {
        let count = snapshot.val();
        if (count === null) count = 35463; // Initial offset
        
        if (displayEl) {
            displayEl.textContent = count.toString().padStart(6, '0');
        }
    });
};

window.incrementVisitorCounter = () => {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    const counterRef = firebase.database().ref('global_stats/visitor_count');
    
    // Increment if not already done in this session
    // V2.9.4: Increment every time start is clicked, as requested, but maybe we should still use sessionStorage? 
    // The user explicitly requested: "ทุกครั้งที่กดปุ่ม Start เข้ามาให้เพิ่ม count +1 ไปเรื่อยๆเลยครับ" 
    // So we remove the sessionStorage check entirely!
    counterRef.transaction((currentCount) => {
        return (currentCount || 35463) + 1;
    });
};

// --- NO auto-init on load ---
if (document.readyState === 'complete') {
    setTimeout(() => { 
        if (window.cleanupStaleEntries) window.cleanupStaleEntries(); 
        if (window.initVisitorCounter) window.initVisitorCounter();
    }, 500);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => { 
            if (window.cleanupStaleEntries) window.cleanupStaleEntries(); 
            if (window.initVisitorCounter) window.initVisitorCounter();
        }, 500);
    });
}