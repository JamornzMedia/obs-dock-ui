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
        
        let usersArray = [];
        Object.keys(rawUsers).forEach(key => {
            usersArray.push(rawUsers[key]);
        });

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

// --- NO auto-init on load ---
if (document.readyState === 'complete') {
    setTimeout(() => { if (window.cleanupStaleEntries) window.cleanupStaleEntries(); }, 500);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => { if (window.cleanupStaleEntries) window.cleanupStaleEntries(); }, 500);
    });
}