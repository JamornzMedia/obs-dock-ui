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
    // Get user identity with 8-digit ID
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

    // Build room key: com_{nameID}
    const roomKey = `com_${sanitizedName}`;
    const roomRef = firebase.database().ref(`${ROOMS_PATH}/${roomKey}`);

    // Store ref globally
    window.myRoomKey = roomKey;
    window.myRoomRef = roomRef;
    window.myUserID = identity.ID; // Store 8-digit ID globally

    const presenceData = {
        name: identity.name.substring(0, 30),
        platform: "PC",
        province: identity.province || "Unknown",
        ID: identity.ID // 8-digit ID
    };

    // Set onDisconnect and write data
    roomRef.onDisconnect().remove();
    roomRef.set(presenceData);

    console.log(`Created PC presence: ${roomKey} with ID: ${identity.ID}`);

    // --- Monitor All Users in obs_rooms_score ---
    const allRoomsRef = firebase.database().ref(ROOMS_PATH);

    allRoomsRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const keys = Object.keys(users);

        // Count by prefix and mobile status
        let pcCount = 0;
        let phoneCount = 0;
        keys.forEach(key => {
            if (key.startsWith('com_')) {
                pcCount++;
            } else if (key.startsWith('mobile_')) {
                // Only count if Mobile status is "on"
                const mobileRoom = users[key];
                if (mobileRoom && mobileRoom.Mobile === 'on') {
                    phoneCount++;
                }
            }
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

    // Separate com_ and mobile_ rooms
    const comRooms = {};
    const mobileRooms = {};

    Object.keys(rawUsers).forEach(key => {
        if (key.startsWith('com_')) {
            comRooms[key] = rawUsers[key];
        } else if (key.startsWith('mobile_')) {
            mobileRooms[key] = rawUsers[key];
        }
    });

    // Display com_ users and match with mobile_
    let index = 1;
    Object.keys(comRooms).forEach(key => {
        const user = comRooms[key];

        // Find matching mobile room by ID
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

        // Type (PC icon + Mobile icon if connected)
        const cellType = document.createElement('td');
        cellType.style.padding = '8px 6px';

        // PC icon
        const pcIcon = document.createElement('i');
        pcIcon.className = 'fas fa-desktop';
        pcIcon.style.color = '#60a5fa';
        pcIcon.style.marginRight = '6px';
        cellType.appendChild(pcIcon);

        // Mobile icon (only if Mobile: "on")
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
        cell.colSpan = 4;
        cell.style.padding = '12px';
        cell.style.textAlign = 'center';
        cell.style.color = '#64748b';
        cell.textContent = 'No users online';
        row.appendChild(cell);
        tbody.appendChild(row);
    }
};

// --- Stale Entry Cleanup ---
// On refresh/reload, check if old com_ and mobile_ entries exist and remove them
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

    // Remove stale com_ entry
    firebase.database().ref(`${ROOMS_PATH}/${comKey}`).remove()
        .then(() => console.log(`Cleaned up stale entry: ${comKey}`))
        .catch(() => { });

    // Remove stale mobile_ entry
    firebase.database().ref(`${ROOMS_PATH}/${mobileKey}`).remove()
        .then(() => console.log(`Cleaned up stale entry: ${mobileKey}`))
        .catch(() => { });
};

// --- NO auto-init on load ---
// Firebase presence is ONLY created when user presses Start button
// Cleanup stale entries on page load instead
if (document.readyState === 'complete') {
    setTimeout(() => { if (window.cleanupStaleEntries) window.cleanupStaleEntries(); }, 500);
} else {
    window.addEventListener('load', () => {
        setTimeout(() => { if (window.cleanupStaleEntries) window.cleanupStaleEntries(); }, 500);
    });
}