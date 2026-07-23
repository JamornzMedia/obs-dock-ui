// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnHuf1jYqKfjSx11jKfuzz-1g_hhg94EU",
  authDomain: "useridjamornz.firebaseapp.com",
  databaseURL: "https://useridjamornz-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "useridjamornz",
  storageBucket: "useridjamornz.firebasestorage.app",
  messagingSenderId: "508161736494",
  appId: "1:508161736494:web:5246fa4bd66f43cffa84bf",
  measurementId: "G-2MNHEGDYZ3"
};

// Global Mobile State
let db = null;
let activeRoomId = "";

// Initialize Mobile App
document.addEventListener("DOMContentLoaded", () => {
  initFirebase();
  checkUrlParams();
  initRoomModal();
  initSwipeTouchpad();
  renderMobileCustomKeys();
});

// Firebase Init
function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();

    // Connection monitor
    const connectedRef = db.ref(".info/connected");
    connectedRef.on("value", (snap) => {
      const statusContainer = document.getElementById("mobileStatus");
      const dot = statusContainer.querySelector(".dot");
      const label = statusContainer.querySelector(".status-label");

      if (snap.val() === true && activeRoomId) {
        dot.className = "dot connected";
        label.innerText = "Connected";
      } else {
        dot.className = "dot disconnected";
        label.innerText = "Offline";
      }
    });
  } catch (err) {
    console.error("Firebase init failed:", err);
  }
}

// URL Params & Room Joining
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get("room");
  const savedRoom = localStorage.getItem("mobileActiveRoom");

  if (roomParam) {
    joinRoom(roomParam);
  } else if (savedRoom) {
    joinRoom(savedRoom);
  } else {
    openRoomModal();
  }
}

function initRoomModal() {
  document.getElementById("changeRoomBtn").addEventListener("click", () => {
    openRoomModal();
  });

  document.getElementById("joinRoomBtn").addEventListener("click", () => {
    const input = document.getElementById("roomCodeInput").value.trim().toUpperCase();
    if (input) {
      joinRoom(input);
      closeRoomModal();
    } else {
      alert("กรุณากรอก Room Code");
    }
  });
}

function openRoomModal() {
  document.getElementById("roomModal").classList.add("active");
  if (activeRoomId) {
    document.getElementById("roomCodeInput").value = activeRoomId;
  }
}

function closeRoomModal() {
  document.getElementById("roomModal").classList.remove("active");
}

function joinRoom(roomId) {
  let formatted = roomId.trim().toUpperCase();
  if (!formatted.startsWith("PPT-")) {
    formatted = `PPT-${formatted}`;
  }

  activeRoomId = formatted;
  localStorage.setItem("mobileActiveRoom", activeRoomId);
  document.getElementById("activeRoomCode").innerText = activeRoomId;

  // Update Status
  const statusContainer = document.getElementById("mobileStatus");
  statusContainer.querySelector(".dot").className = "dot connected";
  statusContainer.querySelector(".status-label").innerText = "Connected";

  closeRoomModal();
}

// Send Remote Key to Firebase Realtime Database
function sendRemoteKey(keyCombo) {
  if (!activeRoomId) {
    openRoomModal();
    return;
  }

  // Haptic feedback (Vibration)
  if (navigator.vibrate) {
    try {
      navigator.vibrate(30);
    } catch (e) {
      // ignore
    }
  }

  if (db) {
    const commandRef = db.ref(`rooms/${activeRoomId}/command`);
    commandRef.set({
      key: keyCombo,
      timestamp: Date.now(),
      source: "mobile"
    }).then(() => {
      console.log(`Sent command [${keyCombo}] to room [${activeRoomId}]`);
    }).catch((err) => {
      console.error("Failed to send command to Firebase:", err);
    });
  }
}

// Touchpad Swipe Detection
function initSwipeTouchpad() {
  const swipeArea = document.getElementById("swipeArea");
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  swipeArea.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTime = Date.now();
  }, { passive: true });

  swipeArea.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const duration = Date.now() - touchStartTime;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffY) > Math.abs(diffX)) return;

    if (Math.abs(diffX) > 40 && duration < 500) {
      if (diffX < 0) {
        sendRemoteKey("next");
      } else {
        sendRemoteKey("prev");
      }
    } else if (Math.abs(diffX) < 10 && duration < 300) {
      sendRemoteKey("next");
    }
  }, { passive: true });
}

// Render Custom Hotkeys Bar on Mobile
function renderMobileCustomKeys() {
  const container = document.getElementById("mobileCustomGrid");
  container.innerHTML = "";

  const defaultKeys = [
    { label: "ซูมเข้า", combo: "ctrl+plus", icon: "fa-magnifying-glass" },
    { label: "สลับหน้าต่าง", combo: "alt+tab", icon: "fa-desktop" }
  ];

  defaultKeys.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "mobile-custom-btn";
    btn.onclick = () => sendRemoteKey(item.combo);
    btn.innerHTML = `
      <i class="fa-solid ${item.icon}"></i>
      <span>${item.label}</span>
    `;
    container.appendChild(btn);
  });
}
