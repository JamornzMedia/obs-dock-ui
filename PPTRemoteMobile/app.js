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
let laserState = {
  mode: 'joystick', // 'joystick' or 'absolute'
  size: 24,
  trailLength: 12,
  color: '#ef4444',
  x: 0.5,
  y: 0.5,
  active: false
};

// Initialize Mobile App
document.addEventListener("DOMContentLoaded", () => {
  initFirebase();
  checkUrlParams();
  initRoomModal();
  initMobileTabs();
  initSwipeTouchpad();
  initLaserTouchpad();
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

      if (snap.val() === true) {
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

// Fullscreen Browser Toggle
function toggleMobileBrowserFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.log(err));
  } else {
    document.exitFullscreen().catch(err => console.log(err));
  }
}

// Mobile Tab Switcher
function initMobileTabs() {
  const tabs = document.querySelectorAll(".mobile-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mobile-tab-btn").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane-mobile").forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) {
        targetPane.classList.add("active");
      }
    });
  });
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

  subscribeCustomKeys();
  closeRoomModal();
}

// Send Remote Key Command to Firebase
function sendRemoteKey(keyCombo) {
  if (!activeRoomId) {
    openRoomModal();
    return;
  }

  // Haptic feedback (Vibration)
  if (navigator.vibrate) {
    try { navigator.vibrate(30); } catch (e) {}
  }

  if (db) {
    db.ref(`rooms/${activeRoomId}/command`).set({
      key: keyCombo,
      timestamp: Date.now()
    });
  }
}

// Touchpad Swipe Handler
function initSwipeTouchpad() {
  const area = document.getElementById("swipeArea");
  if (!area) return;

  let startX = 0;
  let startY = 0;

  area.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  area.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        sendRemoteKey("next"); // Swipe left -> Next
      } else {
        sendRemoteKey("prev"); // Swipe right -> Prev
      }
    } else if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
      sendRemoteKey("next"); // Tap -> Next
    }
  }, { passive: true });
}

// 16:9 Laser Touch Surface Logic (Joystick & Absolute Mode)
function initLaserTouchpad() {
  const touchBox = document.getElementById("laserTouchBox");
  const indicator = document.getElementById("touchIndicator");
  if (!touchBox) return;

  let isTouching = false;
  let joystickStartX = 0;
  let joystickStartY = 0;

  function handleTouch(e) {
    if (!isTouching || !e.touches || e.touches.length === 0) return;

    const rect = touchBox.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    if (laserState.mode === 'absolute') {
      // Absolute Mode: Normalize 0.0 to 1.0 based on 16:9 box dimensions
      laserState.x = Math.max(0, Math.min(1, touchX / rect.width));
      laserState.y = Math.max(0, Math.min(1, touchY / rect.height));
    } else {
      // Joystick Mode: Relative offset from touch start
      const deltaX = (touchX - joystickStartX) / rect.width;
      const deltaY = (touchY - joystickStartY) / rect.height;

      laserState.x = Math.max(0, Math.min(1, laserState.x + deltaX * 0.25));
      laserState.y = Math.max(0, Math.min(1, laserState.y + deltaY * 0.25));

      joystickStartX = touchX;
      joystickStartY = touchY;
    }

    laserState.active = true;
    updateTouchIndicatorPosition(rect);
    sendLaserFirebase();
  }

  touchBox.addEventListener("touchstart", (e) => {
    isTouching = true;
    const rect = touchBox.getBoundingClientRect();
    const touch = e.touches[0];
    joystickStartX = touch.clientX - rect.left;
    joystickStartY = touch.clientY - rect.top;

    if (navigator.vibrate) try { navigator.vibrate(20); } catch(err) {}
    handleTouch(e);
  }, { passive: true });

  touchBox.addEventListener("touchmove", handleTouch, { passive: true });

  touchBox.addEventListener("touchend", () => {
    isTouching = false;
    // Release active dot after 1.5s or keep position
    setTimeout(() => {
      if (!isTouching) {
        laserState.active = false;
        sendLaserFirebase();
      }
    }, 1500);
  }, { passive: true });
}

function updateTouchIndicatorPosition(rect) {
  const indicator = document.getElementById("touchIndicator");
  if (!indicator || !rect) return;

  const posX = laserState.x * rect.width;
  const posY = laserState.y * rect.height;

  indicator.style.left = `${posX}px`;
  indicator.style.top = `${posY}px`;
  indicator.style.opacity = laserState.active ? "1" : "0.3";
}

function setLaserMode(mode) {
  laserState.mode = mode;
  document.getElementById("modeJoystickBtn").classList.toggle("active", mode === "joystick");
  document.getElementById("modeAbsoluteBtn").classList.toggle("active", mode === "absolute");

  const hint = document.getElementById("laserModeHint");
  if (hint) {
    hint.innerText = mode === "joystick"
      ? "🕹️ โหมด Joystick: ลากนิ้วโยกตำแหน่งเพื่อเลื่อนจุดแดงบนจออย่างนุ่มนวล"
      : "🎯 โหมด Absolute: แตะตำแหน่งไหน จุดเลเซอร์จะไปปรากฏตรงพิกัดนั้นเป๊ะๆ";
  }
}

function updateLaserSettings() {
  laserState.size = parseInt(document.getElementById("dotSizeSlider").value) || 24;
  laserState.trailLength = parseInt(document.getElementById("trailLenSlider").value) || 12;

  document.getElementById("dotSizeVal").innerText = laserState.size;
  document.getElementById("trailLenVal").innerText = laserState.trailLength;

  sendLaserFirebase();
}

function setLaserColor(hex, el) {
  laserState.color = hex;
  document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
  if (el) el.classList.add("active");

  const coreDot = document.querySelector(".core-dot");
  if (coreDot) coreDot.style.background = hex;

  sendLaserFirebase();
}

function sendLaserFirebase() {
  if (!db || !activeRoomId) return;

  db.ref(`rooms/${activeRoomId}/laser`).set({
    active: laserState.active,
    x: laserState.x,
    y: laserState.y,
    size: laserState.size,
    trailLength: laserState.trailLength,
    color: laserState.color,
    timestamp: Date.now()
  });
}

// Sync Custom Keys from Desktop Firebase Node
function subscribeCustomKeys() {
  if (!db || !activeRoomId) return;

  db.ref(`rooms/${activeRoomId}/customKeys`).on("value", (snap) => {
    const data = snap.val();
    if (data && Array.isArray(data)) {
      renderMobileCustomKeys(data);
    }
  });
}

function renderMobileCustomKeys(keys = []) {
  const container = document.getElementById("mobileCustomGrid");
  if (!container) return;

  container.innerHTML = "";
  if (keys.length === 0) {
    container.innerHTML = `<small style="color:#64748b;">ไม่มีคีย์ลัด Custom (สามารถเพิ่มได้ที่เครื่องคอม)</small>`;
    return;
  }

  keys.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "mobile-custom-btn";
    btn.onclick = () => sendRemoteKey(item.combo);
    btn.innerHTML = `<i class="fa-solid ${item.icon || 'fa-bolt'}"></i> <span>${escapeHtml(item.label)}</span>`;
    container.appendChild(btn);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
