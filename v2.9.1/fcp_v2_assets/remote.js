// fcp_v2_assets/remote.js

// ⚠️ ใส่ค่า Config ของ Firebase ของคุณที่นี่ ⚠️
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
    // Remove characters not allowed in Firebase keys: . $ # [ ] /
    // Also trim and replace spaces with underscores for cleaner keys
    return name.trim()
        .replace(/[.#$\[\]\/]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
};

// --- New Room System: obs_rooms_score ---
const ROOMS_PATH = 'obs_rooms_score';

window.initOnlinePresenceSystem = () => {
    // Get user identity
    let identity = window.userIdentity;
    if (!identity) {
        try { identity = JSON.parse(localStorage.getItem('userIdentity')); } catch (e) { }
    }
    if (!identity || !identity.name) {
        console.log("No user identity yet, skipping presence system.");
        return;
    }

    const sanitizedName = sanitizeKey(identity.name);
    if (!sanitizedName) {
        console.log("Invalid user name for presence key.");
        return;
    }

    // Build room key: com_{name} for PC
    const roomKey = `com_${sanitizedName}`;
    const roomRef = firebase.database().ref(`${ROOMS_PATH}/${roomKey}`);

    // Store ref globally for identification
    window.myRoomKey = roomKey;
    window.myRoomRef = roomRef;

    const presenceData = {
        name: identity.name.substring(0, 30),
        province: identity.province || "Unknown",
        platform: "PC",
        roomId: window.currentRoomId || "000000", // Add roomId for mobile lookup
        hostPeerId: window.myPeerId || `fcp-v2-host-${window.currentRoomId || '000000'}`, // Add hostPeerId for mobile connection
        last_seen: firebase.database.ServerValue.TIMESTAMP
    };

    // Set onDisconnect first, then write data
    roomRef.onDisconnect().remove();
    roomRef.set(presenceData);

    // Update function (called when identity changes)
    window.updateOnlineStatus = () => {
        let id = window.userIdentity;
        if (!id) {
            try { id = JSON.parse(localStorage.getItem('userIdentity')); } catch (e) { }
        }
        if (!id || !id.name) return;

        // If name changed, we need to remove old key and create new one
        const newKey = `com_${sanitizeKey(id.name)}`;
        if (newKey !== window.myRoomKey) {
            // Remove old
            if (window.myRoomRef) window.myRoomRef.remove();
            // Create new
            window.myRoomKey = newKey;
            window.myRoomRef = firebase.database().ref(`${ROOMS_PATH}/${newKey}`);
            window.myRoomRef.onDisconnect().remove();
        }

        window.myRoomRef.set({
            name: id.name.substring(0, 30),
            province: id.province || "Unknown",
            platform: "PC",
            roomId: window.currentRoomId || "000000",
            hostPeerId: window.myPeerId || `fcp-v2-host-${window.currentRoomId || '000000'}`,
            last_seen: firebase.database.ServerValue.TIMESTAMP
        });
    };

    // --- Monitor All Users in obs_rooms_score ---
    const allRoomsRef = firebase.database().ref(ROOMS_PATH);

    allRoomsRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const keys = Object.keys(users);

        // Count by prefix
        let pcCount = 0;
        let phoneCount = 0;
        keys.forEach(key => {
            if (key.startsWith('com_')) pcCount++;
            else if (key.startsWith('phone_') || key.startsWith('mobile_')) phoneCount++;
        });

        // Update UI counts
        const countEl = document.getElementById('onlineCountVal');
        if (countEl) countEl.innerText = pcCount;

        const phoneCountEl = document.getElementById('onlinePhoneCountVal');
        if (phoneCountEl) phoneCountEl.innerText = phoneCount;

        // Store snapshot for popup
        window.onlineUsersSnapshot = snapshot;

        // Update popup if open
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
        if (key === window.myRoomKey) return; // Ignore self

        const val = snapshot.val();
        if (val && val.name) {
            // Determine type from key prefix
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

    // Disable initial load flag after first sync
    allRoomsRef.once('value', () => { initialLoad = false; });
};

// --- Popup Logic ---
window.openOnlineUsersPopup = () => {
    const popup = document.getElementById('onlineUsersPopup');
    if (popup) popup.style.display = 'flex';
    renderOnlineUsersList();
};

window.renderOnlineUsersList = () => {
    const tbody = document.getElementById('onlineUsersTableBody');
    if (!tbody || !window.onlineUsersSnapshot) return;

    tbody.innerHTML = '';
    const rawUsers = window.onlineUsersSnapshot.val() || {};

    // Group users by Name
    const groupedUsers = {};

    Object.keys(rawUsers).forEach(key => {
        const isPC = key.startsWith('com_');
        const isMobile = key.startsWith('mobile_') || key.startsWith('phone_');
        const name = key.replace(/^(com_|mobile_|phone_)/, '').replace(/_/g, ' ');

        if (!groupedUsers[name]) {
            groupedUsers[name] = {
                name: name,
                province: rawUsers[key].province || '-',
                hasPC: false,
                hasMobile: false,
                isMe: false
            };
        }

        if (isPC) groupedUsers[name].hasPC = true;
        if (isMobile) groupedUsers[name].hasMobile = true;

        // Check if "Me" (matches my sanitized name)
        // We know myRoomKey is usually com_Name or mobile_Name
        if (window.myRoomKey && window.myRoomKey.includes(key)) {
            groupedUsers[name].isMe = true;
        }
        // Also check if I am the host of this name
        if (window.userIdentity && window.userIdentity.name === name) {
            groupedUsers[name].isMe = true;
        }
    });

    let index = 1;
    // Sort? Maybe by Name or IsMe first
    const sortedNames = Object.keys(groupedUsers).sort((a, b) => {
        if (groupedUsers[a].isMe) return -1;
        if (groupedUsers[b].isMe) return 1;
        return a.localeCompare(b);
    });

    sortedNames.forEach(name => {
        const u = groupedUsers[name];

        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid rgba(255,255,255,0.07)';
        if (u.isMe) row.style.background = 'rgba(74, 222, 128, 0.1)';

        let icons = '';
        if (u.hasPC) icons += '<i class="fas fa-desktop" style="color:#4ade80; margin-right:6px;" title="PC"></i>';
        if (u.hasMobile) icons += '<i class="fas fa-mobile-alt" style="color:#60a5fa;" title="Mobile"></i>';

        row.innerHTML = `
            <td style="padding: 6px;">${index++}</td>
            <td style="padding: 6px; font-weight: bold; color: ${u.isMe ? '#4ade80' : 'white'};">
                ${u.name} ${u.isMe ? '(You)' : ''}
            </td>
            <td style="padding: 6px; color: #94a3b8;">${u.province}</td>
            <td style="padding: 6px; text-align: center;">${icons}</td>
        `;
        tbody.appendChild(row);
    });
};

// --- Start System ---
// Wait for identity to be ready before initializing
if (document.readyState === 'complete') {
    setTimeout(() => { if (window.initOnlinePresenceSystem) window.initOnlinePresenceSystem(); }, 500);
} else {
    window.addEventListener('load', () => {
        setTimeout(() => { if (window.initOnlinePresenceSystem) window.initOnlinePresenceSystem(); }, 500);
    });
}