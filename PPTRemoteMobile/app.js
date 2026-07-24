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
  gyroSensitivityX: 5.0,
  gyroSensitivityY: 5.0,
  gyroStabilizer: 0.3,
  gyroAxisX: 'alpha',
  gyroInvertX: true,
  gyroAxisY: 'beta',
  gyroInvertY: true,
  showPulseRing: true,
  x: 0.5,
  y: 0.5,
  active: false,
  drawingMode: false,
  joystickCurve: 2.0,
  joystickSpeed: 1.0,
  lockDraw: false,
  fillShape: true,
  drawTool: 'freehand',
  dlssEnabled: true,
  dlssLevel: 5,
  coreDotStyle: 'white',
  fps: 30,
  gyroPositionMode: false,
  lockedButtons: {
    moveGyro: false,
    drawGyro: false,
    movePos: false,
    drawPos: false
  }
};

// Initialize Mobile App
document.addEventListener("DOMContentLoaded", () => {
  initFirebase();
  checkUrlParams();
  initRoomModal();
  initMobileTabs();
  initSwipeTouchpad();
  initLaserTouchpad();
  initCenteringJoystick();
  initGyroAirMouse();
  initUndoClearBtn();
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
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log("Wake Lock active! Screen will not turn off.");
    }
  } catch (err) {
    console.warn("Wake Lock acquisition failed:", err);
  }
}

async function releaseWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
      console.log("Wake Lock released.");
    }
  } catch (err) {}
}

function toggleMobileBrowserFullscreen() {
  const container = document.body;
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
      .then(() => {
        container.classList.add("fullscreen-active");
        requestWakeLock();
      })
      .catch(err => console.log(err));
  } else {
    document.exitFullscreen()
      .then(() => {
        container.classList.remove("fullscreen-active");
        releaseWakeLock();
      })
      .catch(err => console.log(err));
  }
}

document.addEventListener("fullscreenchange", () => {
  const container = document.body;
  if (!document.fullscreenElement) {
    container.classList.remove("fullscreen-active");
    releaseWakeLock();
  } else {
    container.classList.add("fullscreen-active");
    requestWakeLock();
  }
});

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
      ? `<i class="fa-solid fa-power-off"></i> 🔴 เลเซอร์: ON`
      : `<i class="fa-solid fa-power-off"></i> ⚪ เลเซอร์: OFF`;
  }
  sendLaserFirebase();
}

function toggleLaserSettings() {
  const bar = document.getElementById("laserSettingsBar");
  if (bar) {
    if (bar.style.display === "none") {
      bar.style.display = "flex";
    } else {
      bar.style.display = "none";
    }
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
  subscribeFpsSetting();
  initMobileWebRTC();
  closeRoomModal();
}

// WebRTC Direct P2P Connection (Mobile <-> Desktop)
let rtcPeer = null;
let dataChannel = null;
let webrtcConnected = false;

function initMobileWebRTC() {
  if (!db || !activeRoomId) return;

  try {
    if (rtcPeer) {
      try { rtcPeer.close(); } catch(e) {}
    }

    rtcPeer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    dataChannel = rtcPeer.createDataChannel("laserChannel");
    setupDataChannel();

    rtcPeer.onicecandidate = (event) => {
      if (event.candidate) {
        db.ref(`rooms/${activeRoomId}/rtc/mobileCandidates`).push(event.candidate.toJSON());
      }
    };

    // Create Offer to send to Desktop via Firebase
    rtcPeer.createOffer()
      .then(offer => rtcPeer.setLocalDescription(offer))
      .then(() => {
        db.ref(`rooms/${activeRoomId}/rtc/offer`).set(rtcPeer.localDescription.toJSON());
      })
      .catch(err => console.warn("WebRTC Offer error:", err));

    // Listen for Answer from Desktop
    db.ref(`rooms/${activeRoomId}/rtc/answer`).on("value", (snap) => {
      const answer = snap.val();
      if (answer && rtcPeer.signalingState === "have-local-offer") {
        rtcPeer.setRemoteDescription(new RTCSessionDescription(answer)).catch(err => console.warn(err));
      }
    });

    // Listen for ICE Candidates from Desktop
    db.ref(`rooms/${activeRoomId}/rtc/desktopCandidates`).on("child_added", (snap) => {
      const candidate = snap.val();
      if (candidate) {
        rtcPeer.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.warn(err));
      }
    });

  } catch (err) {
    console.error("Mobile WebRTC init error:", err);
  }
}

function setupDataChannel() {
  if (!dataChannel) return;

  dataChannel.onopen = () => {
    webrtcConnected = true;
    console.log("⚡ WebRTC Direct DataChannel Connected!");
  };

  dataChannel.onclose = () => {
    webrtcConnected = false;
  };
}

// Clean up Room ID from Firebase when closing mobile browser tab
window.addEventListener("beforeunload", () => {
  if (db && activeRoomId) {
    db.ref(`rooms/${activeRoomId}`).remove();
  }
});

// Send Remote Key Command
function sendRemoteKey(keyCombo) {
  if (!activeRoomId) {
    openRoomModal();
    return;
  }

  // Haptic feedback (Vibration)
  if (navigator.vibrate) {
    try { navigator.vibrate(30); } catch (e) {}
  }

  const timestamp = Date.now();

  // 1. Direct WebRTC P2P DataChannel if open (for near 0ms execution)
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify({
      type: "command",
      key: keyCombo,
      timestamp: timestamp
    }));
  }

  // 2. ALWAYS write command to Firebase (ensures reliable logging and delivery fallback)
  if (db) {
    db.ref(`rooms/${activeRoomId}/command`).set({
      key: keyCombo,
      timestamp: timestamp
    }).catch(err => console.warn("Firebase command sync warning:", err));
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

// 16:9 Laser Touch Surface Logic (Absolute Mode)
function initLaserTouchpad() {
  const touchBox = document.getElementById("laserTouchBox");
  if (!touchBox) return;

  let isTouching = false;

  function handleTouch(e) {
    if (!isTouching || !e.touches || e.touches.length === 0) return;

    const rect = touchBox.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    laserState.x = Math.max(0, Math.min(1, touchX / rect.width));
    laserState.y = Math.max(0, Math.min(1, touchY / rect.height));
    laserState.active = true;

    updateTouchIndicatorPosition(rect);

    if (laserState.drawingMode) {
      sendDrawEvent("draw");
    } else {
      sendLaserFirebase();
    }
  }

  touchBox.addEventListener("touchstart", (e) => {
    isTouching = true;
    const rect = touchBox.getBoundingClientRect();
    
    if (navigator.vibrate) try { navigator.vibrate(20); } catch(err) {}
    
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    laserState.x = Math.max(0, Math.min(1, touchX / rect.width));
    laserState.y = Math.max(0, Math.min(1, touchY / rect.height));
    laserState.active = true;

    updateTouchIndicatorPosition(rect);

    if (laserState.drawingMode) {
      sendDrawEvent("start");
    } else {
      sendLaserFirebase();
    }
  }, { passive: true });

  touchBox.addEventListener("touchmove", handleTouch, { passive: true });

  touchBox.addEventListener("touchend", () => {
    if (!isTouching) return;
    isTouching = false;
    
    if (laserState.drawingMode) {
      sendDrawEvent("end");
    }

    setTimeout(() => {
      if (!isTouching && !joystickActive && !isGyroHolding) {
        laserState.active = false;
        sendLaserFirebase();
      }
    }, 1000);
  }, { passive: true });
}

function updateTouchIndicatorPosition(rect) {
  const indicator = document.getElementById("touchIndicator");
  if (!indicator) return;
  if (!rect) rect = document.getElementById("laserTouchBox")?.getBoundingClientRect();
  if (!rect) return;

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
  const joystickWrapper = document.getElementById("joystickControlArea");
  const gyroWrapper = document.getElementById("gyroControlArea");
  
  const joystickSetting = document.getElementById("joystickSettingItem");
  const gyroSetting = document.getElementById("gyroSettingItem");

  if (mode === "joystick") {
    if (touchWrapper) touchWrapper.style.display = "none";
    if (joystickWrapper) joystickWrapper.style.display = "flex";
    if (gyroWrapper) gyroWrapper.style.display = "none";
    if (joystickSetting) joystickSetting.style.display = "flex";
    if (gyroSetting) gyroSetting.style.display = "none";
  } else if (mode === "absolute") {
    if (touchWrapper) touchWrapper.style.display = "flex";
    if (joystickWrapper) joystickWrapper.style.display = "none";
    if (gyroWrapper) gyroWrapper.style.display = "none";
    if (joystickSetting) joystickSetting.style.display = "none";
    if (gyroSetting) gyroSetting.style.display = "none";
  } else if (mode === "gyro") {
    if (touchWrapper) touchWrapper.style.display = "none";
    if (joystickWrapper) joystickWrapper.style.display = "none";
    if (gyroWrapper) gyroWrapper.style.display = "flex";
    if (joystickSetting) joystickSetting.style.display = "none";
    if (gyroSetting) gyroSetting.style.display = "flex";
    
    // Check iOS permission button requirement
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permBtn = document.getElementById("gyroPermissionBtn");
      if (permBtn) permBtn.style.display = "block";
    }
  }

  const hint = document.getElementById("laserModeHint");
  if (hint) {
    if (mode === "joystick") {
      hint.innerText = "🕹️ โหมด Joystick: โยกตำแหน่งคันโยกเพื่อเลื่อนจุดเลเซอร์และลากเส้นวาดเขียน";
    } else if (mode === "absolute") {
      hint.innerText = "🎯 โหมด 16:9 ตรง: แตะและลากนิ้วบนจอนี้ จุดเลเซอร์จะย้ายตามและเขียนเส้นทันที";
    } else {
      hint.innerText = "📱 โหมด Gyro: กดปุ่มด้านล่างค้างไว้ แล้วเอียงมือถือในอากาศเพื่อควบคุมจุดเลเซอร์";
    }
  }
}

function updateLaserSettings() {
  laserState.size = parseInt(document.getElementById("dotSizeSlider").value) || 24;
  laserState.trailLength = parseInt(document.getElementById("trailLenSlider").value) || 12;

  const curveSlider = document.getElementById("joystickCurveSlider");
  if (curveSlider) {
    laserState.joystickCurve = parseFloat(curveSlider.value) || 2.0;
    const curveVal = document.getElementById("joystickCurveVal");
    if (curveVal) curveVal.innerText = laserState.joystickCurve.toFixed(1);
  }

  const speedSlider = document.getElementById("joystickSpeedSlider");
  if (speedSlider) {
    laserState.joystickSpeed = parseFloat(speedSlider.value) || 1.0;
    const speedVal = document.getElementById("joystickSpeedVal");
    if (speedVal) speedVal.innerText = laserState.joystickSpeed.toFixed(1);
  }

  const gyroSensXSlider = document.getElementById("gyroSensXSlider");
  if (gyroSensXSlider) {
    laserState.gyroSensitivityX = parseFloat(gyroSensXSlider.value) || 5.0;
    const gyroSensXVal = document.getElementById("gyroSensXVal");
    if (gyroSensXVal) gyroSensXVal.innerText = laserState.gyroSensitivityX.toFixed(1);
  }

  const gyroSensYSlider = document.getElementById("gyroSensYSlider");
  if (gyroSensYSlider) {
    laserState.gyroSensitivityY = parseFloat(gyroSensYSlider.value) || 5.0;
    const gyroSensYVal = document.getElementById("gyroSensYVal");
    if (gyroSensYVal) gyroSensYVal.innerText = laserState.gyroSensitivityY.toFixed(1);
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

  const dlssCheck = document.getElementById("dlssEnabledCheck");
  if (dlssCheck) laserState.dlssEnabled = dlssCheck.checked;

  const dlssLevelSlider = document.getElementById("dlssLevelSlider");
  if (dlssLevelSlider) {
    laserState.dlssLevel = parseInt(dlssLevelSlider.value) || 5;
    const dlssLevelVal = document.getElementById("dlssLevelVal");
    if (dlssLevelVal) dlssLevelVal.innerText = laserState.dlssLevel;
  }

  const coreSelect = document.getElementById("coreDotStyleSelect");
  if (coreSelect) laserState.coreDotStyle = coreSelect.value;

  document.getElementById("dotSizeVal").innerText = laserState.size;
  document.getElementById("trailLenVal").innerText = laserState.trailLength;

  sendLaserFirebase();
}

// Gyro Air-Mouse Sensor Controller
let isGyroHolding = false;
let lastRawX = null;
let lastRawY = null;
let smoothedDiffX = 0;
let smoothedDiffY = 0;

let gyroHoldingType = null; // 'draw' or 'move'
let activePositionBtn = null; // button element currently being touched/dragged

function initGyroAirMouse() {
  const buttonsConfig = [
    { id: "gyroHoldBtn", type: "moveGyro", draw: false, position: false },
    { id: "gyroDrawTop", type: "drawGyro", draw: true, position: false },
    { id: "gyroMoveTop", type: "moveGyro", draw: false, position: false },
    { id: "gyroDrawBottom", type: "drawPos", draw: true, position: true },
    { id: "gyroMoveBottom", type: "movePos", draw: false, position: true }
  ];

  buttonsConfig.forEach(cfg => {
    const btn = document.getElementById(cfg.id);
    if (!btn) return;

    let pressStart = 0;
    let isPressActive = false;

    function handlePressStart(e) {
      if (e.cancelable) e.preventDefault();
      pressStart = Date.now();
      isPressActive = true;
      btn.classList.add("holding");

      // Normal Press Down
      laserState.active = true;
      laserState.drawingMode = cfg.draw;

      if (cfg.draw) {
        sendDrawEvent("start");
      }

      if (cfg.position) {
        activePositionBtn = btn;
        handlePositionTouch(e, btn, cfg.draw);
      } else {
        isGyroHolding = true;
        gyroHoldingType = cfg.draw ? "draw" : "move";
        lastRawX = null;
        lastRawY = null;
        smoothedDiffX = 0;
        smoothedDiffY = 0;
        sendLaserFirebase(true);
      }

      if (navigator.vibrate) try { navigator.vibrate(30); } catch(err) {}
    }

    function handlePressEnd(e) {
      if (!isPressActive) return;
      isPressActive = false;
      btn.classList.remove("holding");
      const duration = Date.now() - pressStart;

      // Bypassing Lock Hold for now to test if this is the issue
      if (laserState.lockedButtons[cfg.type]) {
        laserState.lockedButtons[cfg.type] = false;
        btn.classList.remove("locked");
      }
      releaseState();
    }

    function releaseState() {
      if (cfg.position) {
        activePositionBtn = null;
      } else {
        isGyroHolding = false;
        gyroHoldingType = null;
      }

      if (cfg.draw) {
        sendDrawEvent("end");
      }

      setTimeout(() => {
        // Verify if any other button is active or locked
        const anyActive = isGyroHolding || activePositionBtn || 
                          laserState.lockedButtons.moveGyro || 
                          laserState.lockedButtons.drawGyro || 
                          laserState.lockedButtons.movePos || 
                          laserState.lockedButtons.drawPos;
        if (!anyActive) {
          laserState.active = false;
          sendLaserFirebase();
        }
      }, 500);
    }

    // Touch events
    btn.addEventListener("touchstart", handlePressStart, { passive: false });
    btn.addEventListener("touchend", handlePressEnd, { passive: true });
    btn.addEventListener("touchcancel", handlePressEnd, { passive: true });
    btn.addEventListener("touchmove", (e) => {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    // Pointer/Mouse events
    btn.addEventListener("pointerdown", handlePressStart);
    btn.addEventListener("pointerup", handlePressEnd);
    btn.addEventListener("pointercancel", handlePressEnd);
  });

  // Track position drag movements
  window.addEventListener("touchmove", (e) => {
    if (activePositionBtn) {
      const cfg = buttonsConfig.find(c => c.id === activePositionBtn.id);
      if (cfg) {
        handlePositionTouch(e, activePositionBtn, cfg.draw);
      }
    }
  }, { passive: false });

  window.addEventListener("deviceorientation", handleGyroOrientation, true);
}

function handlePositionTouch(e, btn, isDrawing) {
  const rect = btn.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  if (!touch) return;

  const tx = touch.clientX - rect.left;
  const ty = touch.clientY - rect.top;

  const nx = Math.max(0, Math.min(1, tx / rect.width));
  const ny = Math.max(0, Math.min(1, ty / rect.height));

  laserState.x = nx;
  laserState.y = ny;
  laserState.active = true;
  laserState.drawingMode = isDrawing;

  if (isDrawing) {
    sendDrawEvent("draw");
  } else {
    sendLaserFirebase(true);
  }
}

function handleGyroOrientation(e) {
  const anyGyroActive = isGyroHolding || laserState.lockedButtons.moveGyro || laserState.lockedButtons.drawGyro;
  if (!anyGyroActive || laserState.mode !== "gyro") return;

  const activeDraw = (isGyroHolding && gyroHoldingType === 'draw') || laserState.lockedButtons.drawGyro;
  laserState.drawingMode = activeDraw;
  laserState.active = true;

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

    const stabFactor = laserState.gyroStabilizer || 0.3;
    smoothedDiffX = smoothedDiffX + (diffX - smoothedDiffX) * stabFactor;
    smoothedDiffY = smoothedDiffY + (diffY - smoothedDiffY) * stabFactor;

    const sensX = laserState.gyroSensitivityX || 5.0;
    const sensY = laserState.gyroSensitivityY || 5.0;

    const deltaX = smoothedDiffX * sensX * 0.0018;
    const deltaY = smoothedDiffY * sensY * 0.0018;

    laserState.x = Math.max(0, Math.min(1, laserState.x + deltaX));
    laserState.y = Math.max(0, Math.min(1, laserState.y + deltaY));

    if (activeDraw) {
      sendDrawEvent("draw");
    } else {
      sendLaserFirebase();
    }
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

let lastLaserSendTime = 0;
let lastActiveState = null;
let fpsRef = null;

function subscribeFpsSetting() {
  if (!db || !activeRoomId) return;
  if (fpsRef) {
    fpsRef.off();
  }
  fpsRef = db.ref(`rooms/${activeRoomId}/config/fps`);
  fpsRef.on("value", (snap) => {
    const val = snap.val();
    if (val) {
      laserState.fps = parseInt(val) || 30;
      console.log(`[Config] Sync FPS from desktop: ${laserState.fps}`);
    }
  });
}

function sendLaserFirebase(force = false) {
  if (!activeRoomId) return;

  const now = Date.now();
  const fps = laserState.fps || 30; // default to 30 FPS
  const interval = 1000 / fps;

  // Force sending if active status changed (so dot shows/hides immediately)
  const isCurrentlyActive = laserState.lockDraw ? true : laserState.active;
  const activeChanged = isCurrentlyActive !== lastActiveState;
  if (!force && !activeChanged && (now - lastLaserSendTime < interval)) {
    return;
  }

  const payload = {
    type: "laser",
    active: isCurrentlyActive,
    x: laserState.x,
    y: laserState.y,
    size: laserState.size,
    trailLength: laserState.trailLength,
    color: laserState.color,
    showPulseRing: laserState.showPulseRing,
    dlssEnabled: laserState.dlssEnabled,
    dlssLevel: laserState.dlssLevel,
    coreDotStyle: laserState.coreDotStyle,
    timestamp: now
  };

  // Direct WebRTC P2P ONLY. Never write laser coordinates to Firebase!
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify(payload));
    lastLaserSendTime = now;
    lastActiveState = isCurrentlyActive;
  }
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

/* ==========================================
   REVAMPED JOYSTICK & DRAWING STROKES LOGIC
   ========================================== */

let joystickActive = false;
let joystickLoopId = null;
let joystickX = 0; // -1.0 to 1.0
let joystickY = 0; // -1.0 to 1.0

function initCenteringJoystick() {
  const pad = document.getElementById("joystickPad");
  const knob = document.getElementById("joystickKnob");
  if (!pad || !knob) return;

  const R = 65; // Max travel radius in px

  function updateKnobPosition(px, py) {
    knob.style.transform = `translate(${px}px, ${py}px)`;
  }

  function handleJoystickTouch(e) {
    if (!joystickActive) return;
    const rect = pad.getBoundingClientRect();
    const touch = e.touches[0];
    
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > R) {
      dx = (dx / dist) * R;
      dy = (dy / dist) * R;
      joystickX = dx / R;
      joystickY = dy / R;
    } else {
      joystickX = dx / R;
      joystickY = dy / R;
    }
    
    updateKnobPosition(dx, dy);
    laserState.active = true;
  }

  pad.addEventListener("touchstart", (e) => {
    joystickActive = true;
    handleJoystickTouch(e);
    
    if (laserState.drawingMode && !laserState.lockDraw) {
      sendDrawEvent("start");
    }
    
    startJoystickLoop();
    if (navigator.vibrate) try { navigator.vibrate(20); } catch(err) {}
  }, { passive: true });

  pad.addEventListener("touchmove", handleJoystickTouch, { passive: true });

  function releaseJoystick() {
    if (!joystickActive) return;
    joystickActive = false;
    joystickX = 0;
    joystickY = 0;
    updateKnobPosition(0, 0);
    stopJoystickLoop();

    if (laserState.drawingMode && !laserState.lockDraw) {
      sendDrawEvent("end");
    }
    
    setTimeout(() => {
      if (!joystickActive && !isGyroHolding && !laserState.lockDraw) {
        laserState.active = false;
        sendLaserFirebase();
      }
    }, 1000);
  }

  pad.addEventListener("touchend", releaseJoystick, { passive: true });
  pad.addEventListener("touchcancel", releaseJoystick, { passive: true });
}

function startJoystickLoop() {
  if (joystickLoopId) return;
  
  function step() {
    if (!joystickActive) return;
    
    const dist = Math.sqrt(joystickX * joystickX + joystickY * joystickY);
    if (dist > 0.05) {
      const exponent = parseFloat(document.getElementById("joystickCurveSlider")?.value || 2.0);
      const curvedDist = Math.pow(dist, exponent);
      
      const nx = joystickX / dist;
      const ny = joystickY / dist;
      
      const speedMultiplier = parseFloat(document.getElementById("joystickSpeedSlider")?.value || 1.0);
      const speed = 0.015 * speedMultiplier;
      
      laserState.x = Math.max(0, Math.min(1, laserState.x + nx * curvedDist * speed));
      laserState.y = Math.max(0, Math.min(1, laserState.y + ny * curvedDist * speed));
      
      if (laserState.drawingMode) {
        sendDrawEvent("draw");
      } else {
        sendLaserFirebase(true);
      }
    }
    
    joystickLoopId = requestAnimationFrame(step);
  }
  
  joystickLoopId = requestAnimationFrame(step);
}

function stopJoystickLoop() {
  if (joystickLoopId) {
    cancelAnimationFrame(joystickLoopId);
    joystickLoopId = null;
  }
}

function toggleDrawingModeBtn() {
  laserState.drawingMode = !laserState.drawingMode;
  const btn = document.getElementById("drawingModeToggleBtn");
  if (btn) {
    btn.classList.toggle("active", laserState.drawingMode);
    btn.innerHTML = laserState.drawingMode
      ? `<i class="fa-solid fa-pen-nib"></i> 🎨 วาดรูป: ON`
      : `<i class="fa-solid fa-pen-nib"></i> 🎨 วาดรูป: OFF`;
  }
  
  const toolbar = document.getElementById("drawingToolbar");
  if (toolbar) {
    toolbar.style.display = laserState.drawingMode ? "flex" : "none";
  }

  syncGyroControls();

  // Force sending laser status
  sendLaserFirebase(true);
}

function syncGyroControls() {
  const gyroPositionMode = document.getElementById("enableTouchPositionCheck")?.checked || false;
  laserState.gyroPositionMode = gyroPositionMode;
  
  const standardArea = document.getElementById("gyroStandardArea");
  const splitArea = document.getElementById("gyroSplitArea");
  
  const drawBottom = document.getElementById("gyroDrawBottom");
  const moveBottom = document.getElementById("gyroMoveBottom");
  
  if (laserState.drawingMode) {
    if (standardArea) standardArea.style.display = "none";
    if (splitArea) {
      splitArea.style.display = "flex";
      if (gyroPositionMode) {
        if (drawBottom) drawBottom.style.display = "flex";
        if (moveBottom) moveBottom.style.display = "flex";
      } else {
        if (drawBottom) drawBottom.style.display = "none";
        if (moveBottom) moveBottom.style.display = "none";
      }
    }
  } else {
    if (standardArea) standardArea.style.display = "block";
    if (splitArea) splitArea.style.display = "none";
  }
}

function toggleFillShape() {
  laserState.fillShape = !laserState.fillShape;
  const btn = document.getElementById("fillShapeToggleBtn");
  if (btn) {
    btn.classList.toggle("active", laserState.fillShape);
    btn.innerHTML = laserState.fillShape
      ? `🎨 เติมสีพื้นหลัง: ON`
      : `🎨 เติมสีพื้นหลัง: OFF`;
  }
  updateDrawSettings();
}

function setDrawTool(tool) {
  laserState.drawTool = tool;
  document.querySelectorAll(".draw-tool-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`tool${tool.charAt(0).toUpperCase() + tool.slice(1)}Btn`);
  if (activeBtn) activeBtn.classList.add("active");
}

function updateDrawSettings() {
  const sizeVal = document.getElementById("drawSizeVal");
  const sizeSlider = document.getElementById("drawSizeSlider");
  if (sizeVal && sizeSlider) {
    sizeVal.innerText = sizeSlider.value;
  }

  const opacityVal = document.getElementById("drawOpacityVal");
  const opacitySlider = document.getElementById("drawOpacitySlider");
  if (opacityVal && opacitySlider) {
    opacityVal.innerText = opacitySlider.value;
  }
}

function clearDrawings() {
  sendDrawEvent("clear");
  if (navigator.vibrate) try { navigator.vibrate(40); } catch(err) {}
}

function initUndoClearBtn() {
  const btn = document.getElementById("undoClearBtn");
  if (!btn) return;
  
  let holdTimer = null;
  let isLongPress = false;
  
  btn.addEventListener("touchstart", (e) => {
    isLongPress = false;
    holdTimer = setTimeout(() => {
      isLongPress = true;
      clearDrawings();
    }, 800);
  });
  
  btn.addEventListener("touchend", (e) => {
    if (holdTimer) clearTimeout(holdTimer);
    if (!isLongPress) {
      sendDrawEvent("undo");
    }
  });
  
  btn.addEventListener("mousedown", (e) => {
    isLongPress = false;
    holdTimer = setTimeout(() => {
      isLongPress = true;
      clearDrawings();
    }, 800);
  });
  
  btn.addEventListener("mouseup", (e) => {
    if (holdTimer) clearTimeout(holdTimer);
    if (!isLongPress) {
      sendDrawEvent("undo");
    }
  });
}

function sendDrawEvent(action) {
  if (!activeRoomId) return;
  
  const payload = {
    type: "draw",
    action: action,
    tool: laserState.drawTool || "freehand",
    x: laserState.x,
    y: laserState.y,
    color: laserState.color || "#ef4444",
    size: parseInt(document.getElementById("drawSizeSlider")?.value || 5),
    opacity: parseFloat((document.getElementById("drawOpacitySlider")?.value || 100) / 100),
    fill: !!laserState.fillShape,
    timestamp: Date.now()
  };
  
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify(payload));
  }
}
