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
  mode: 'joystick', // 'joystick', 'absolute', or 'gyro'
  size: 24,
  trailLength: 12,
  color: '#ef4444',
  gyroSensitivity: 5.0,
  gyroStabilizer: 0.3,
  gyroAxisX: 'alpha',
  gyroInvertX: false,
  gyroAxisY: 'beta',
  gyroInvertY: false,
  showPulseRing: true,
  x: 0.5,
  y: 0.5,
  active: true
};

// Initialize Mobile App
document.addEventListener("DOMContentLoaded", () => {
  initFirebase();
  checkUrlParams();
  initRoomModal();
  initMobileTabs();
  initSwipeTouchpad();
  initLaserTouchpad();
  initGyroAirMouse();
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
      switchMobileTab(tab.dataset.tab);
    });
  });
}

function switchMobileTab(tabId) {
  document.querySelectorAll(".mobile-tab-btn").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-pane-mobile").forEach(p => {
    p.classList.toggle("active", p.id === tabId);
  });
}

function toggleLaserActive() {
  laserState.active = !laserState.active;
  const btn = document.getElementById("laserActiveToggleBtn");
  if (btn) {
    btn.classList.toggle("active", laserState.active);
    btn.classList.toggle("off", !laserState.active);
    btn.innerHTML = laserState.active
      ? `<i class="fa-solid fa-power-off"></i> 🔴 จุด Laser: ON`
      : `<i class="fa-solid fa-power-off"></i> ⚪ จุด Laser: OFF`;
  }
  sendLaserFirebase();
}

function toggleLaserSettings() {
  const bar = document.getElementById("laserSettingsBar");
  if (bar) {
    bar.classList.toggle("hidden");
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
    const input = document.getElementById("roomCodeInput").value.trim();
    if (input) {
      joinRoom(input);
      closeRoomModal();
    } else {
      alert("กรุณากรอก Room Code 6 หลัก");
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
  let formatted = roomId.toString().trim().replace(/\D/g, "");
  if (formatted.length > 6) {
    formatted = formatted.substring(0, 6);
  }

  if (!formatted) {
    openRoomModal();
    return;
  }

  activeRoomId = formatted;
  localStorage.setItem("mobileActiveRoom", activeRoomId);
  document.getElementById("activeRoomCode").innerText = activeRoomId;

  // Auto-remove Room ID from Firebase when Mobile disconnects/closes
  if (db && activeRoomId) {
    const roomRoot = db.ref(`rooms/${activeRoomId}`);
    roomRoot.onDisconnect().remove().catch(err => console.warn(err));
  }

  // Update Status
  const statusContainer = document.getElementById("mobileStatus");
  if (statusContainer) {
    statusContainer.querySelector(".dot").className = "dot connected";
    statusContainer.querySelector(".status-label").innerText = "Connected";
  }

  subscribeCustomKeys();
  closeRoomModal();
}

// Clean up Room ID from Firebase when closing mobile browser tab
window.addEventListener("beforeunload", () => {
  if (db && activeRoomId) {
    db.ref(`rooms/${activeRoomId}`).remove();
  }
});

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
  document.getElementById("modeGyroBtn").classList.toggle("active", mode === "gyro");

  const touchWrapper = document.getElementById("touchSurfaceWrapper");
  const gyroWrapper = document.getElementById("gyroControlArea");
  const gyroSetting = document.getElementById("gyroSettingItem");

  if (mode === "gyro") {
    if (touchWrapper) touchWrapper.style.display = "none";
    if (gyroWrapper) gyroWrapper.style.display = "flex";
    if (gyroSetting) gyroSetting.style.display = "flex";
    
    // Check iOS permission button requirement
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permBtn = document.getElementById("gyroPermissionBtn");
      if (permBtn) permBtn.style.display = "block";
    }
  } else {
    if (touchWrapper) touchWrapper.style.display = "flex";
    if (gyroWrapper) gyroWrapper.style.display = "none";
    if (gyroSetting) gyroSetting.style.display = "none";
  }

  const hint = document.getElementById("laserModeHint");
  if (hint) {
    if (mode === "joystick") {
      hint.innerText = "🕹️ โหมด Joystick: ลากนิ้วโยกตำแหน่งเพื่อเลื่อนจุดแดงบนจออย่างนุ่มนวล";
    } else if (mode === "absolute") {
      hint.innerText = "🎯 โหมด Absolute: แตะตำแหน่งไหน จุดเลเซอร์จะไปปรากฏตรงพิกัดนั้นเป๊ะๆ";
    } else {
      hint.innerText = "📱 โหมด Gyro: กดปุ่มด้านล่างค้างไว้ แล้วเอียงมือถือในอากาศเพื่อขยับจุดเลเซอร์";
    }
  }
}

function updateLaserSettings() {
  laserState.size = parseInt(document.getElementById("dotSizeSlider").value) || 24;
  laserState.trailLength = parseInt(document.getElementById("trailLenSlider").value) || 12;

  const gyroSensInput = document.getElementById("gyroSensSlider");
  if (gyroSensInput) {
    laserState.gyroSensitivity = parseFloat(gyroSensInput.value) || 5.0;
    const gyroSensVal = document.getElementById("gyroSensVal");
    if (gyroSensVal) gyroSensVal.innerText = laserState.gyroSensitivity.toFixed(1);
  }

  const gyroStabInput = document.getElementById("gyroStabSlider");
  if (gyroStabInput) {
    laserState.gyroStabilizer = parseFloat(gyroStabInput.value) || 0.3;
    const gyroStabVal = document.getElementById("gyroStabVal");
    if (gyroStabVal) gyroStabVal.innerText = laserState.gyroStabilizer.toFixed(2);
  }

  const axisXSelect = document.getElementById("gyroAxisXSelect");
  if (axisXSelect) laserState.gyroAxisX = axisXSelect.value;

  const invertXCheck = document.getElementById("gyroInvertXCheck");
  if (invertXCheck) laserState.gyroInvertX = invertXCheck.checked;

  const axisYSelect = document.getElementById("gyroAxisYSelect");
  if (axisYSelect) laserState.gyroAxisY = axisYSelect.value;

  const invertYCheck = document.getElementById("gyroInvertYCheck");
  if (invertYCheck) laserState.gyroInvertY = invertYCheck.checked;

  const pulseCheck = document.getElementById("pulseRingCheck");
  if (pulseCheck) {
    laserState.showPulseRing = pulseCheck.checked;
    const touchPulse = document.getElementById("touchRingPulse");
    if (touchPulse) touchPulse.style.display = laserState.showPulseRing ? "block" : "none";
  }

  document.getElementById("dotSizeVal").innerText = laserState.size;
  document.getElementById("trailLenVal").innerText = laserState.trailLength;

  sendLaserFirebase();
}

// Gyro Air-Mouse Sensor Controller
let isGyroHolding = false;
let lastRawX = null;
let lastRawY = null;

function initGyroAirMouse() {
  const btn = document.getElementById("gyroHoldBtn");
  if (!btn) return;

  function startGyroHold(e) {
    isGyroHolding = true;
    btn.classList.add("holding");
    if (navigator.vibrate) try { navigator.vibrate(30); } catch(err) {}
    lastRawX = null;
    lastRawY = null;
    laserState.active = true;
    sendLaserFirebase();
  }

  function stopGyroHold(e) {
    isGyroHolding = false;
    btn.classList.remove("holding");
    lastRawX = null;
    lastRawY = null;
  }

  btn.addEventListener("pointerdown", startGyroHold);
  btn.addEventListener("pointerup", stopGyroHold);
  btn.addEventListener("pointercancel", stopGyroHold);

  btn.addEventListener("touchstart", (e) => { e.preventDefault(); startGyroHold(e); }, { passive: false });
  btn.addEventListener("touchend", stopGyroHold, { passive: true });

  window.addEventListener("deviceorientation", handleGyroOrientation, true);
}

function handleGyroOrientation(e) {
  if (!isGyroHolding || laserState.mode !== "gyro") return;

  const angles = {
    alpha: e.alpha !== null ? e.alpha : 0,
    beta: e.beta !== null ? e.beta : 0,
    gamma: e.gamma !== null ? e.gamma : 0
  };

  const rawX = angles[laserState.gyroAxisX] || 0;
  const rawY = angles[laserState.gyroAxisY] || 0;

  if (lastRawX !== null && lastRawY !== null) {
    let diffX = rawX - lastRawX;
    let diffY = rawY - lastRawY;

    if (laserState.gyroAxisX === 'alpha') {
      if (diffX > 180) diffX -= 360;
      if (diffX < -180) diffX += 360;
    } else if (Math.abs(diffX) > 90) diffX = 0;

    if (laserState.gyroAxisY === 'alpha') {
      if (diffY > 180) diffY -= 360;
      if (diffY < -180) diffY += 360;
    } else if (Math.abs(diffY) > 90) diffY = 0;

    if (laserState.gyroInvertX) diffX = -diffX;
    if (laserState.gyroInvertY) diffY = -diffY;

    const sens = laserState.gyroSensitivity || 5.0;
    const deltaX = diffX * sens * 0.003;
    const deltaY = diffY * sens * 0.003;

    const stabFactor = laserState.gyroStabilizer || 0.3;
    const targetX = Math.max(0, Math.min(1, laserState.x + deltaX));
    const targetY = Math.max(0, Math.min(1, laserState.y + deltaY));

    laserState.x = laserState.x + (targetX - laserState.x) * stabFactor;
    laserState.y = laserState.y + (targetY - laserState.y) * stabFactor;

    sendLaserFirebase();
  }

  lastRawX = rawX;
  lastRawY = rawY;
}

function requestGyroPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          alert("🔑 ปลดล็อก Gyroscope Sensor เรียบร้อยแล้ว! สามารถกดปุ่มค้างเพื่อยิงเลเซอร์ได้เลย");
          const permBtn = document.getElementById("gyroPermissionBtn");
          if (permBtn) permBtn.style.display = "none";
        } else {
          alert("การเปิดใช้งาน Gyro Sensor โดนปฏิเสธ");
        }
      })
      .catch(console.error);
  }
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
    showPulseRing: laserState.showPulseRing,
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
