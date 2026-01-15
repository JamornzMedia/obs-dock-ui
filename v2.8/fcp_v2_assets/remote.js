// fcp_v2_assets/remote.js

// ⚠️ ใส่ค่า Config ของ Firebase ของคุณที่นี่ ⚠️
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
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
    linkText: $('mobileLinkText'),
    statusText: $('remoteStatusText')
};

// --- FUNCTIONS ---

function generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function initRemote() {
    if (!els.roomId.value) els.roomId.value = generateRoomId();

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

    if (els.genBtn) {
        els.genBtn.addEventListener('click', () => {
            els.roomId.value = generateRoomId();
        });
    }

    if (els.createBtn) {
        els.createBtn.addEventListener('click', startHosting);
    }
}

function startHosting() {
    const rid = els.roomId.value;
    const rname = els.roomName.value || "Scoreboard";
    currentRoomId = rid;

    // UI Updates
    els.createBtn.disabled = true;
    els.createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';

    // 1. Setup PeerJS
    const myPeerId = `obsscore-host-${rid}`;

    if (peer) peer.destroy();

    peer = new Peer(myPeerId, peerConfig);

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);

        // 2. Register Room in Firebase
        const roomRef = database.ref('obs_rooms/' + rid);
        roomRef.set({
            name: rname,
            hostId: myPeerId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Success
            showConnectionUI(rid);
            els.createBtn.innerHTML = '<i class="fas fa-check"></i> Room Created';
            els.statusText.textContent = "Waiting for mobile...";
            els.statusText.style.color = "#f97316";

            roomRef.onDisconnect().remove();
        });
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
    // URL to Mobile App (Assuming same directory)
    const mobileUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/OBSScorePhone.html?room=' + rid;

    els.linkText.href = mobileUrl;
    els.linkText.textContent = mobileUrl;
    els.qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mobileUrl)}`;
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
            if (cmd.action === 'reset') window.fcpAPI.resetToStartTime();
            break;
        case 'actionBtn':
            const btn = document.getElementById(`actionBtn${cmd.index}`);
            if (btn) btn.click();
            break;
        case 'updateTeam':
            // cmd: { team: 'A', name: '...', color1: '...' }
            if (cmd.team === 'A') {
                window.fcpAPI.updateTeamFromInputs('A', cmd.name, cmd.color1);
            } else {
                window.fcpAPI.updateTeamFromInputs('B', cmd.name, cmd.color1);
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
            color: document.getElementById('colorA').value
        },
        teamB: {
            name: document.getElementById('nameB').innerText,
            score: document.getElementById('scoreB').innerText,
            score2: document.getElementById('score2B').innerText,
            color: document.getElementById('colorB').value
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