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
    }
} catch (e) {
    console.error("Firebase Init Error: Please check firebaseConfig in remote.js", e);
}

const database = firebase.database();

// --- VARIABLES ---
let peer = null;
let conn = null;
let currentRoomId = null;

// PeerJS Config (Google STUN)
const peerConfig = {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }
};

// --- DOM ELEMENTS ---
const $ = id => document.getElementById(id);
const els = {
    btn: $('mobileControlBtn'),
    popup: $('mobileControlPopup'),
    closeBtn: $('closeMobilePopupBtn'),
    createBtn: $('createRoomBtn'),
    genBtn: $('genRoomIdBtn'),
    roomName: $('remoteRoomName'),
    roomId: $('remoteRoomId'),
    connectionUI: $('remoteConnectionUI'),
    qrCode: $('remoteQrCode'),
    linkText: $('mobileLinkInput'), // Changed ID
    copyLinkBtn: $('copyMobileLinkBtn'), // New Button
    statusText: $('remoteStatusText'),
    closeRoomBtn: $('closeRoomBtn'), // New Button
    roomIdContainer: $('remoteRoomIdContainer') // New Container
};

// --- FUNCTIONS ---

function generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function initRemote() {
    // Clear ID initially
    if (els.roomId) els.roomId.value = "";

    if (els.btn) {
        els.btn.addEventListener('click', () => {
            document.getElementById('popupOverlay').style.display = 'block';
            els.popup.style.display = 'block';
        });
    }

    if (els.closeBtn) {
        els.closeBtn.addEventListener('click', () => {
            document.getElementById('popupOverlay').style.display = 'none';
            els.popup.style.display = 'none';
        });
    }

    // Hide Gen Button as we generate on create
    if (els.genBtn) {
        els.genBtn.style.display = 'none';
    }

    if (els.createBtn) {
        els.createBtn.addEventListener('click', startHosting);
    }

    if (els.closeRoomBtn) {
        els.closeRoomBtn.addEventListener('click', closeRoom);
    }

    if (els.copyLinkBtn) {
        els.copyLinkBtn.addEventListener('click', copyLink);
    }

    // Load persisted name
    const savedName = localStorage.getItem('remoteRoomName');
    if (savedName && els.roomName) {
        els.roomName.value = savedName;
    }
}

function startHosting() {
    // 0. Config Check
    if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.apiKey.includes("YOUR_")) {
        alert("⚠️ Firebase Config is missing!\nPlease configure 'fcp_v2_assets/remote.js' and 'OBSScorePhone.html'.");
        return;
    }

    // 1. Validation
    const rname = els.roomName.value.trim();
    if (!rname) {
        alert("Please enter a Room Name (max 50 chars).");
        els.roomName.focus();
        return;
    }

    // 2. Generate ID
    const rid = generateRoomId();
    els.roomId.value = rid;
    currentRoomId = rid;

    // UI Updates
    els.createBtn.disabled = true;
    els.createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';

    // Save Name
    localStorage.setItem('remoteRoomName', rname);

    // 4. Setup PeerJS
    const myPeerId = `obsscore-host-${rid}`;

    if (peer) peer.destroy();

    peer = new Peer(myPeerId, peerConfig);

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);

        // 4. Register Room in Firebase
        const roomRef = database.ref('obs_rooms/' + rid);
        roomRef.set({
            name: rname,
            hostId: myPeerId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Success
            showConnectionUI(rid);
            els.createBtn.style.display = 'none'; // Hide Create
            els.closeRoomBtn.style.display = 'inline-block'; // Show Close
            els.roomIdContainer.style.display = 'flex'; // Show ID Row

            els.statusText.textContent = "Waiting for mobile...";
            els.statusText.style.color = "#f97316";

            roomRef.onDisconnect().remove();
        }).catch(err => {
            console.error("Firebase Error:", err);
            alert("Firebase Error: " + err.message);
            els.createBtn.disabled = false;
            els.createBtn.innerHTML = '<i class="fas fa-broadcast-tower"></i> Create Room';
        });

        // 5. Setup Presence (Online Count)
        setupPresence(rid);

    });

    peer.on('connection', (connection) => {
        conn = connection;
        handleConnection();
    });

    peer.on('error', (err) => {
        console.error(err);
        alert("PeerJS Error: " + err.type);
        els.createBtn.disabled = false;
        els.createBtn.innerHTML = '<i class="fas fa-broadcast-tower"></i> Create Room';
    });
}

function showConnectionUI(rid) {
    els.connectionUI.style.display = 'block';
    // URL to Mobile App
    // const mobileUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/OBSScorePhone.html?room=' + rid;
    const mobileUrl = 'https://jamornzmedia.github.io/obs-dock-ui/OBSScorePhone.html?room=' + rid;

    els.linkText.value = mobileUrl; // Use value for input
    els.qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mobileUrl)}`;
}

function closeRoom() {
    if (peer) {
        peer.destroy();
        peer = null;
    }

    if (currentRoomId) {
        database.ref('obs_rooms/' + currentRoomId).remove().catch(e => console.error(e));
        currentRoomId = null;
    }

    // Reset UI
    els.connectionUI.style.display = 'none';
    els.createBtn.style.display = 'inline-block';
    els.createBtn.disabled = false;
    els.createBtn.innerHTML = '<i class="fas fa-broadcast-tower"></i> Create Room';

    els.closeRoomBtn.style.display = 'none';
    els.roomIdContainer.style.display = 'none';
    els.roomId.value = "";

    els.statusText.textContent = "Waiting...";
    els.statusText.style.color = "var(--warning-color)";
}

function copyLink() {
    if (!els.linkText.value) return;
    els.linkText.select();
    document.execCommand('copy');
    // Using simple alert or if main.js showToast is available (it is not directly imported here but available in global scope if loaded)
    if (typeof showToast === 'function') {
        showToast("Link Copied!", "success");
    } else {
        alert("Link Copied!");
    }
}

function handleConnection() {
    if (!conn) return;

    conn.on('open', () => {
        els.statusText.textContent = "Connected!";
        els.statusText.style.color = "#22c55e";

        // Send Initial State to Mobile
        sendFullState();
    });

    conn.on('data', (data) => {
        console.log("Received from mobile:", data);
        processCommand(data);
    });

    conn.on('close', () => {
        els.statusText.textContent = "Mobile Disconnected";
        els.statusText.style.color = "#ef4444";
        conn = null;
    });
}

// --- COMMAND PROCESSING ---
function processCommand(cmd) {
    if (!window.fcpAPI) return;

    switch (cmd.type) {
        case 'loadMatch':
            const matchIdInput = document.getElementById('matchID');
            if (matchIdInput) {
                matchIdInput.value = cmd.val;
                window.fcpAPI.applyMatch();
            }
            break;
        case 'score':
            if (cmd.isSub) {
                window.fcpAPI.changeScore2(cmd.team, cmd.delta);
            } else {
                window.fcpAPI.changeScore(cmd.team, cmd.delta);
            }
            break;
        case 'timer':
            if (cmd.action === 'playpause') document.getElementById('playBtn').click();
            if (cmd.action === 'stop') window.fcpAPI.stopTimer();
            if (cmd.action === 'reset') window.fcpAPI.resetToStartTime();
            if (cmd.action === 'half') window.fcpAPI.toggleHalf(); // Handle Half Toggle
            break;
        case 'obs': // New OBS Command Handler
            if (cmd.action === 'saveReplay') window.fcpAPI.obs_saveReplay();
            if (cmd.action === 'scene') window.fcpAPI.obs_setCurrentScene(cmd.name);
            break;
        case 'actionBtn':
            const btn = document.getElementById(`actionBtn${cmd.index}`);
            if (btn) btn.click();
            break;
        case 'updateTeam':
            if (cmd.team === 'A') {
                window.fcpAPI.updateTeamFromInputs('A', cmd.name, cmd.color1, cmd.color2);
            } else {
                window.fcpAPI.updateTeamFromInputs('B', cmd.name, cmd.color1, cmd.color2);
            }
            break;
        case 'requestState':
            sendFullState();
            break;
    }
}

// --- STATE SYNC (TO MOBILE) ---
function sendFullState() {
    if (!conn || !conn.open) return;

    const state = {
        type: 'stateUpdate',
        teamA: {
            name: document.getElementById('nameA').innerText,
            score: document.getElementById('scoreA').innerText,
            score2: document.getElementById('score2A').innerText,
            color: document.getElementById('colorA').value,
            color2: document.getElementById('colorA2').value
        },
        teamB: {
            name: document.getElementById('nameB').innerText,
            score: document.getElementById('scoreB').innerText,
            score2: document.getElementById('score2B').innerText,
            color: document.getElementById('colorB').value,
            color2: document.getElementById('colorB2').value
        },
        timer: document.getElementById('timerText').innerText,
        half: document.getElementById('halfText').innerText,
        matchId: document.getElementById('matchID').value,
        actions: []
    };

    for (let i = 1; i <= 6; i++) {
        const btn = document.getElementById(`actionBtn${i}`);
        state.actions.push({
            index: i,
            name: btn ? btn.innerText : `Action ${i}`
        });
    }

    conn.send(state);
}

// --- LISTENER FOR DOM CHANGES ---
const observer = new MutationObserver((mutations) => {
    sendFullState();
});

const observeTargets = [
    'scoreA', 'scoreB', 'score2A', 'score2B', 'timerText', 'halfText', 'nameA', 'nameB'
];

// Initialize when DOM is ready (called via main.js import, so window load is safe)
window.addEventListener('load', () => {
    initRemote();

    observeTargets.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
});

// --- ONLINE PRESENCE SYSTEM (SEPARATED) ---
const ONLINE_ROOM_KEY = "obs_online_room_id";

function initOnlinePresenceSystem() {
    // 1. Auto-Create "Online Room" on Load
    // Fixed Room ID as per request to aggregate all users.
    const onlineRoomId = "UserCounter";

    // 2. Connect to Firebase Presence for THIS room
    const presenceRef = database.ref(`obs_rooms_presence/${onlineRoomId}`);

    // Self-register (I am online)
    const myRef = presenceRef.push();
    myRef.onDisconnect().remove();
    myRef.set({
        type: 'host',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    // Listen for count
    presenceRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const count = Object.keys(users).length;
        if (document.getElementById('onlineCountVal')) {
            document.getElementById('onlineCountVal').innerText = count;
        }
    });

    // We do NOT couple this with the Mobile Remote PeerJS anymore.
    // This is purely Firebase Realtime Database presence.
    console.log("Online Presence Started:", onlineRoomId);
}
// Import logic (ensure this runs on load)
window.addEventListener('load', () => {
    initOnlinePresenceSystem();
});