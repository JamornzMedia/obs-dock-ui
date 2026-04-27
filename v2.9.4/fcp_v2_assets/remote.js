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

    const presenceData = {
        name: identity.name.substring(0, 30),
        platform: "PC",
        province: identity.province || "Unknown",
        ID: identity.ID,
        totalMinutes: totalMins
    };

    roomRef.onDisconnect().remove();
    roomRef.set(presenceData);

    console.log(`Created PC presence: ${roomKey} with ID: ${identity.ID}`);

    window.refreshOnlinePresence = () => {
        try {
            if (window.myRoomRef && presenceData) {
                let currentMins = presenceData.totalMinutes;
                try {
                    const usageData = JSON.parse(localStorage.getItem('usageTracker') || '{"totalMinutes":0}');
                    currentMins = usageData.totalMinutes || 0;
                } catch (e) {}
                presenceData.totalMinutes = currentMins;
                window.myRoomRef.set(presenceData);
            }
        } catch(e) { console.warn("Auto-refresh online presence failed", e); }
    };

    if (window.presenceRefreshInterval) clearInterval(window.presenceRefreshInterval);
    window.presenceRefreshInterval = setInterval(window.refreshOnlinePresence, 600000); // 10 mins

    // --- Monitor All Users ---
    const allRoomsRef = firebase.database().ref(ROOMS_PATH);

    allRoomsRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const keys = Object.keys(users);

        let pcCount = 0;
        let phoneCount = 0;
        keys.forEach(key => {
            if (key.startsWith('com_')) {
                pcCount++;
            } else if (key.startsWith('mobile_')) {
                const mobileRoom = users[key];
                if (mobileRoom && mobileRoom.Mobile === 'on') {
                    phoneCount++;
                }
            }
        });

        const countEl = document.getElementById('onlineCountVal');
        if (countEl) countEl.innerText = pcCount;

        const phoneCountEl = document.getElementById('onlinePhoneCountVal');
        if (phoneCountEl) phoneCountEl.innerText = phoneCount;

        window.onlineUsersSnapshot = snapshot;

        const popup = document.getElementById('onlineUsersPopup');
        if (popup && popup.style.display !== 'none') {
            renderOnlineUsersList();
        }
    });

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
    renderOnlineUsersList();
    if (window.renderGlobalRanking) window.renderGlobalRanking();
};

window.renderGlobalRanking = async () => {
    const tbody = document.getElementById('globalRankingTableBody');
    if (!tbody) return;

    if (typeof firebase === 'undefined' || !firebase.database) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 15px; color:#ef4444">Firebase is offline</td></tr>';
        return;
    }

    try {
        const snapshot = await firebase.database().ref('obs_id').once('value');
        const rawUsers = snapshot.val() || {};
        
        let usersMap = {};
        Object.keys(rawUsers).forEach(key => {
            const user = rawUsers[key];
            if (!user || !user.name || user.name.startsWith('Guest_')) return;
            
            const lowerName = user.name.toLowerCase();
            // Deduplicate by name, keep the one with higher totalMinutes
            if (!usersMap[lowerName] || (user.totalMinutes || 0) > (usersMap[lowerName].totalMinutes || 0)) {
                usersMap[lowerName] = user;
            }
        });
        let usersArray = Object.values(usersMap);

        // Sort descending by totalMinutes
        usersArray.sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));

        let currentUserName = '';
        try {
            const identity = JSON.parse(localStorage.getItem('userIdentity') || '{}');
            if (identity && identity.name) currentUserName = identity.name.trim();
        } catch(e){}

        tbody.innerHTML = '';

        if (usersArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 15px; color:#94a3b8">No ranking data found</td></tr>';
            return;
        }

        usersArray.forEach((user, index) => {
            const rankNum = index + 1;
            const minutes = user.totalMinutes || 0;
            const hoursDisplay = Math.floor(minutes/60) + 'h ' + String(minutes%60).padStart(2, '0') + 'm';
            
            let rankInfo = { icon: '🔰', nameTh: 'เด็กฝึกหัด', color: '#94a3b8' };
            if (typeof window.fcpGetRankInfo === 'function') {
                rankInfo = window.fcpGetRankInfo(minutes);
            }

            const isMe = (user.name === currentUserName);

            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #334155';
            
            if (isMe) {
                row.style.background = 'rgba(59, 130, 246, 0.2)';
            }

            // Medal emojis
            let medal = rankNum;
            let numColor = '#94a3b8';
            if (rankNum === 1) { medal = '🥇'; numColor = '#fbbf24'; row.style.background = isMe ? 'rgba(59, 130, 246, 0.3)' : 'rgba(251, 191, 36, 0.1)'; }
            else if (rankNum === 2) { medal = '🥈'; numColor = '#cbd5e1';  row.style.background = isMe ? 'rgba(59, 130, 246, 0.3)' : 'rgba(203, 213, 225, 0.05)'; }
            else if (rankNum === 3) { medal = '🥉'; numColor = '#b45309';  row.style.background = isMe ? 'rgba(59, 130, 246, 0.3)' : 'rgba(180, 83, 9, 0.05)'; }

            const cellNum = document.createElement('td');
            cellNum.style.padding = '8px 6px';
            cellNum.style.textAlign = 'center';
            cellNum.style.color = numColor;
            cellNum.style.fontWeight = 'bold';
            cellNum.style.fontSize = (rankNum <= 3) ? '1.1rem' : '0.9rem';
            cellNum.textContent = medal;
            row.appendChild(cellNum);

            const cellPlayer = document.createElement('td');
            cellPlayer.style.padding = '8px 6px';
            
            const pName = document.createElement('div');
            pName.textContent = user.name || 'Unknown';
            if (isMe) {
                pName.style.color = '#fff';
                pName.style.fontWeight = 'bold';
            }
            
            const pRank = document.createElement('div');
            pRank.style.fontSize = '0.75rem';
            pRank.innerHTML = `<span style="color:${rankInfo.color}">${rankInfo.icon} ${rankInfo.nameTh}</span> <span style="color:#64748b; margin-left:5px;">(${user.province || 'Unknown'})</span>`;
            
            cellPlayer.appendChild(pName);
            cellPlayer.appendChild(pRank);
            row.appendChild(cellPlayer);

            const cellTime = document.createElement('td');
            cellTime.style.padding = '8px 6px';
            cellTime.style.textAlign = 'right';
            cellTime.style.color = isMe ? '#93c5fd' : '#cbd5e1';
            cellTime.style.fontFamily = 'monospace';
            cellTime.style.whiteSpace = 'nowrap';
            if (isMe) cellTime.style.fontWeight = 'bold';
            cellTime.textContent = hoursDisplay;
            row.appendChild(cellTime);

            tbody.appendChild(row);

            if (isMe) {
                row.style.borderLeft = '3px solid #3b82f6';
                row.style.borderRight = '3px solid #3b82f6';
            }
        });

    } catch(err) {
        console.error('Error fetching global ranking:', err);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 15px; color:#ef4444">Failed to load ranking</td></tr>';
    }
};

window.renderOnlineUsersList = () => {
    const tbody = document.getElementById('onlineUsersTableBody');
    if (!tbody || !window.onlineUsersSnapshot) return;

    tbody.innerHTML = '';
    const rawUsers = window.onlineUsersSnapshot.val() || {};

    const comRooms = {};
    const mobileRooms = {};

    Object.keys(rawUsers).forEach(key => {
        if (key.startsWith('com_')) {
            comRooms[key] = rawUsers[key];
        } else if (key.startsWith('mobile_')) {
            mobileRooms[key] = rawUsers[key];
        }
    });

    let index = 1;
    Object.keys(comRooms).forEach(key => {
        const user = comRooms[key];

        let matchedMobile = null;
        Object.keys(mobileRooms).forEach(mKey => {
            const mRoom = mobileRooms[mKey];
            if (mRoom.ID === user.ID) {
                matchedMobile = mRoom;
            }
        });

        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #334155';

        // Index
        const cellIndex = document.createElement('td');
        cellIndex.style.padding = '8px 6px';
        cellIndex.textContent = index++;
        row.appendChild(cellIndex);

        // Name
        const cellName = document.createElement('td');
        cellName.style.padding = '8px 6px';
        cellName.textContent = user.name || 'Unknown';
        row.appendChild(cellName);

        // Province
        const cellProvince = document.createElement('td');
        cellProvince.style.padding = '8px 6px';
        cellProvince.textContent = user.province || '-';
        row.appendChild(cellProvince);

        // V2.9.3: Rank column (calculated from totalMinutes)
        const cellRank = document.createElement('td');
        cellRank.style.padding = '8px 6px';
        cellRank.style.whiteSpace = 'nowrap';
        let rankColor = '#94a3b8';
        let rankDisplay = '🔰 เด็กฝึกหัด';
        if (typeof window.fcpGetRankInfo === 'function') {
            const ri = window.fcpGetRankInfo(user.totalMinutes || 0);
            rankColor = ri.color;
            rankDisplay = `${ri.icon} ${ri.nameTh}`;
        }
        cellRank.innerHTML = `<span style="color: ${rankColor}">${rankDisplay}</span>`;
        row.appendChild(cellRank);

        // Type (PC icon + Mobile icon if connected)
        const cellType = document.createElement('td');
        cellType.style.padding = '8px 6px';

        const pcIcon = document.createElement('i');
        pcIcon.className = 'fas fa-desktop';
        pcIcon.style.color = '#60a5fa';
        pcIcon.style.marginRight = '6px';
        cellType.appendChild(pcIcon);

        if (matchedMobile && matchedMobile.Mobile === 'on') {
            const mobileIcon = document.createElement('i');
            mobileIcon.className = 'fas fa-mobile-alt';
            mobileIcon.style.color = '#4ade80';
            cellType.appendChild(mobileIcon);
        }

        row.appendChild(cellType);
        tbody.appendChild(row);
    });

    if (Object.keys(comRooms).length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.style.padding = '12px';
        cell.style.textAlign = 'center';
        cell.style.color = '#64748b';
        cell.textContent = 'No users online';
        row.appendChild(cell);
        tbody.appendChild(row);
    }
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

window.loadMapData = async () => {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    
    try {
        const snapshot = await firebase.database().ref('obs_id').once('value');
        const rawUsers = snapshot.val() || {};
        
        let usersMap = {};
        Object.keys(rawUsers).forEach(key => {
            const user = rawUsers[key];
            if (!user || !user.name || user.name.startsWith('Guest_')) return;
            const lowerName = user.name.toLowerCase();
            if (!usersMap[lowerName] || (user.totalMinutes || 0) > (usersMap[lowerName].totalMinutes || 0)) {
                usersMap[lowerName] = user;
            }
        });
        
        window.allRegisteredUsersArray = Object.values(usersMap);
        
        // Count users per region
        const counts = { 'เหนือ': 0, 'อีสาน': 0, 'กลาง': 0, 'ตะวันออก': 0, 'ตะวันตก': 0, 'ใต้': 0 };
        
        window.allRegisteredUsersArray.forEach(user => {
            if (!user.province) return;
            for (const region in thaiRegions) {
                if (thaiRegions[region].some(p => user.province.includes(p))) {
                    counts[region]++;
                    break;
                }
            }
        });
        
        // Update SVG text elements
        for (const region in counts) {
            const el = document.getElementById(`count-${region}`);
            if (el) el.textContent = counts[region];
        }
    } catch (e) {
        console.error("Failed to load map data", e);
    }
};

window.filterOnlineUsersByRegion = (region) => {
    document.getElementById('thaiMapContainer').style.display = 'none';
    document.getElementById('mapUsersContainer').style.display = 'flex';
    document.getElementById('selectedRegionTitle').textContent = `ผู้ใช้งานภาค${region}`;
    
    const tbody = document.getElementById('mapUsersTableBody');
    if (!tbody || !window.allRegisteredUsersArray) return;
    
    tbody.innerHTML = '';
    
    const regionProvinces = thaiRegions[region] || [];
    let count = 0;

    window.allRegisteredUsersArray.forEach(user => {
        if (!user.province) return;
        
        const isMatch = regionProvinces.some(p => user.province.includes(p));
        if (!isMatch) return;

        count++;
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #334155';

        const cellName = document.createElement('td');
        cellName.style.padding = '8px 6px';
        cellName.textContent = user.name || 'Unknown';
        row.appendChild(cellName);

        const cellProvince = document.createElement('td');
        cellProvince.style.padding = '8px 6px';
        cellProvince.textContent = user.province;
        row.appendChild(cellProvince);

        const cellType = document.createElement('td');
        cellType.style.padding = '8px 6px';
        cellType.style.textAlign = 'right';
        
        let isOnline = false;
        if (window.onlineUsersSnapshot) {
            const activeRooms = window.onlineUsersSnapshot.val() || {};
            Object.values(activeRooms).forEach(room => {
                if (room.ID === user.ID) isOnline = true;
            });
        }

        if (isOnline) {
            const onlineDot = document.createElement('span');
            onlineDot.style.color = '#4ade80';
            onlineDot.innerHTML = '● ';
            onlineDot.title = 'Online Now';
            cellType.appendChild(onlineDot);
        }

        const icon = document.createElement('i');
        icon.className = 'fas fa-user';
        icon.style.color = isOnline ? '#60a5fa' : '#64748b';
        cellType.appendChild(icon);

        row.appendChild(cellType);
        tbody.appendChild(row);
    });

    if (count === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 15px; color:#64748b;">ไม่มีผู้ใช้งานในภาคนี้</td></tr>';
    }
};

window.backToMapRegions = () => {
    document.getElementById('thaiMapContainer').style.display = 'flex';
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