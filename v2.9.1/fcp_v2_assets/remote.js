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
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized");
} catch (e) {
    console.error("Firebase Init Error:", e);
}

// --- Simplified Online Presence System ---
const initOnlinePresenceSystem = () => {
    const onlineRef = firebase.database().ref('fcp_online_users');

    // Create reference for this session
    window.myOnlineUserRef = onlineRef.push();

    // Prepare Data
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const getPresenceData = () => ({
        name: (userIdentity && userIdentity.name) ? userIdentity.name.substring(0, 30) : "Guest",
        province: (userIdentity && userIdentity.province) ? userIdentity.province : "Unknown",
        country: (userIdentity && userIdentity.country) ? userIdentity.country : "Thailand",
        platform: isMobile ? "Mobile" : "PC",
        last_seen: firebase.database.ServerValue.TIMESTAMP
    });

    // Set Data and OnDisconnect
    window.myOnlineUserRef.onDisconnect().remove();
    window.myOnlineUserRef.set(getPresenceData());

    // Update data function (global)
    window.updateOnlineStatus = () => {
        if (window.myOnlineUserRef) {
            window.myOnlineUserRef.set(getPresenceData());
        }
    };

    // Monitor Online Users
    onlineRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const count = Object.keys(users).length;

        // Update UI Count
        const countEl = document.getElementById('onlineCountVal');
        if (countEl) countEl.innerText = count;

        // Store snapshot for Popup
        window.onlineUsersSnapshot = snapshot;

        // Update Popup if open
        if (document.getElementById('onlineUsersPopup').style.display !== 'none') {
            renderOnlineUsersList();
        }
    });

    // New User Notification (Child Added)
    let initialLoad = true;
    onlineRef.limitToLast(1).on('child_added', (snapshot) => {
        if (initialLoad) return;

        const key = snapshot.key;
        if (key === window.myOnlineUserRef.key) return; // Ignore self

        const val = snapshot.val();
        if (val && val.name) {
            const platformIcon = val.platform === 'Mobile' ? '<i class="fas fa-mobile-alt"></i>' : '<i class="fas fa-desktop"></i>';
            const msg = `${platformIcon} ผู้ใช้ ${val.name} (${val.province}) เข้ามาแล้ว`;
            if (typeof showToast === 'function') showToast(msg, 'info', 5000);
        }
    });

    // Disable initial load flag after data sync
    onlineRef.once('value', () => { initialLoad = false; });
};

// --- Popup Logic ---
window.openOnlineUsersPopup = () => {
    const popup = document.getElementById('onlineUsersPopup');
    const overlay = document.getElementById('popupOverlay');
    if (popup) popup.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
    renderOnlineUsersList();
};

window.renderOnlineUsersList = () => {
    const tbody = document.getElementById('onlineUsersTableBody');
    if (!tbody || !window.onlineUsersSnapshot) return;

    tbody.innerHTML = '';
    const users = window.onlineUsersSnapshot.val() || {};
    let index = 1;

    Object.keys(users).forEach(key => {
        const u = users[key];
        const isMe = (window.myOnlineUserRef && key === window.myOnlineUserRef.key);
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        if (isMe) row.style.background = 'rgba(74, 222, 128, 0.1)';

        const platformIcon = u.platform === 'Mobile' ? '<i class="fas fa-mobile-alt" title="Mobile"></i>' : '<i class="fas fa-desktop" title="PC"></i>';

        row.innerHTML = `
            <td style="padding: 10px;">${index++}</td>
            <td style="padding: 10px; font-weight: bold; color: ${isMe ? '#4ade80' : 'white'};">
                ${u.name} ${isMe ? '(You)' : ''}
            </td>
            <td style="padding: 10px;">${u.province}</td>
            <td style="padding: 10px;">${u.country}</td>
            <td style="padding: 10px;">${platformIcon} Online</td>
        `;
        tbody.appendChild(row);
    });
};

// Start System
initOnlinePresenceSystem();