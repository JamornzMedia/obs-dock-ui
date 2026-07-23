// Firebase Configuration provided by user
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

// Global App State
let db = null;
let currentRoomId = "";
let roomRef = null;
let lastProcessedTimestamp = 0;
let isAlwaysOnTop = true;
let isAutoFocusPPT = true;

// Default Preset Key Mappings (Editable by user!)
let presetKeys = JSON.parse(localStorage.getItem("presetKeys")) || {
  next: "right",
  prev: "left",
  start: "f5",
  startCurrent: "shift+f5",
  exit: "escape",
  black: "b",
  white: "w",
  pen: "ctrl+p",
  eraser: "ctrl+e"
};

// Default Mobile URL
let mobileBaseUrl = localStorage.getItem("mobileBaseUrl") || "https://jamornzmedia.github.io/obs-dock-ui/PPTRemoteMobile/index.html";

// Default Custom Hotkeys
let customHotkeys = JSON.parse(localStorage.getItem("customHotkeys")) || [
  { id: 1, label: "ซูมเข้า (Zoom In)", combo: "ctrl+plus", icon: "fa-magnifying-glass" },
  { id: 2, label: "ตัวชี้เลเซอร์ (Laser)", combo: "ctrl+l", icon: "fa-bolt" },
  { id: 3, label: "ไฮไลท์เตอร์ (Highlighter)", combo: "ctrl+i", icon: "fa-pen-to-square" },
  { id: 4, label: "สลับหน้าต่าง (Alt+Tab)", combo: "alt+tab", icon: "fa-desktop" }
];

// Command Activity History Log
let historyLogs = [];

// Initialize Desktop App
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initRoom();
  initFirebase();
  initCustomHotkeys();
  initMobileUrlSetting();
  initOntopToggle();
  initAutoFocusToggle();
  updatePresetKeyHintsUI();
});

// Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPanel = document.getElementById(tab.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      if (tab.dataset.tab === "qrTab") {
        renderQRCode();
      }
    });
  });
}

// Generate Room ID (6-digit random code)
function generateRoomCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PPT-${num}`;
}

function initRoom() {
  currentRoomId = localStorage.getItem("pptRoomCode") || generateRoomCode();
  localStorage.setItem("pptRoomCode", currentRoomId);
  updateRoomDisplay();

  document.getElementById("copyRoomBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(currentRoomId);
    showLog(`คัดลอก Room Code (${currentRoomId}) แล้ว`);
  });

  document.getElementById("newRoomBtn").addEventListener("click", () => {
    currentRoomId = generateRoomCode();
    localStorage.setItem("pptRoomCode", currentRoomId);
    updateRoomDisplay();
    subscribeRoomFirebase();
    renderQRCode();
    showLog(`สร้าง Room Code ใหม่: ${currentRoomId}`);
  });
}

function updateRoomDisplay() {
  document.getElementById("roomCodeDisplay").innerText = currentRoomId;
}

// Firebase Integration
function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    
    // Monitor Connection State
    const connectedRef = db.ref(".info/connected");
    connectedRef.on("value", (snap) => {
      const statusBadge = document.getElementById("firebaseStatus");
      const statusDot = statusBadge.querySelector(".status-dot");
      const statusText = statusBadge.querySelector(".status-text");

      if (snap.val() === true) {
        statusDot.className = "status-dot connected";
        statusText.innerText = "Connected";
        showLog("เชื่อมต่อ Firebase Realtime DB สำเร็จ");
      } else {
        statusDot.className = "status-dot disconnected";
        statusText.innerText = "Offline";
      }
    });

    subscribeRoomFirebase();
  } catch (err) {
    console.error("Firebase init error:", err);
    showLog("เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase");
  }
}

function subscribeRoomFirebase() {
  if (!db || !currentRoomId) return;

  if (roomRef) {
    roomRef.off();
  }

  roomRef = db.ref(`rooms/${currentRoomId}/command`);
  roomRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.timestamp && data.timestamp > lastProcessedTimestamp) {
      lastProcessedTimestamp = data.timestamp;
      const keyOrAction = data.key || data.keys;
      if (keyOrAction) {
        if (presetKeys[keyOrAction]) {
          triggerPreset(keyOrAction, true);
        } else {
          triggerKey(keyOrAction, true);
        }
      }
    }
  });
}

// Trigger Preset Actions (Next, Prev, Start, etc.)
function triggerPreset(presetName, isFromRemote = false) {
  const combo = presetKeys[presetName] || presetName;
  const readableNames = {
    next: "สไลด์ถัดไป (Next)",
    prev: "ย้อนกลับ (Prev)",
    start: "เริ่มโชว์ (F5)",
    startCurrent: "หน้าปัจจุบัน (Shift+F5)",
    exit: "จบโชว์ (Esc)",
    black: "จอดำ (B)",
    white: "จอขาว (W)",
    pen: "ปากกา (Ctrl+P)",
    eraser: "ยางลบ (Ctrl+E)"
  };

  const actionTitle = readableNames[presetName] || presetName.toUpperCase();
  triggerKeyWithDetails(actionTitle, combo, isFromRemote);
}

// Trigger Key via Python PyWebView Bridge
function triggerKey(keyCombo, isFromRemote = false) {
  triggerKeyWithDetails(`คีย์ลัด (${keyCombo.toUpperCase()})`, keyCombo, isFromRemote);
}

function triggerKeyWithDetails(title, combo, isFromRemote = false) {
  const sourceText = isFromRemote ? "mobile" : "desktop";
  
  // 1. Update Toast Banner Notification on Desktop UI
  showActionToast(title, combo, sourceText);

  // 2. Call Python Backend API
  if (window.pywebview && window.pywebview.api) {
    window.pywebview.api.press_key(combo).then((res) => {
      console.log("Python press_key response:", res);
      const pptFocused = res && res.ppt_focused ? "พบ PowerPoint (Focused)" : "ส่งเข้า Active Window";
      addHistoryLog(sourceText, `${title} [${combo.toUpperCase()}]`, pptFocused);
    }).catch((err) => {
      console.error("Python API Error:", err);
      addHistoryLog(sourceText, `${title} [${combo.toUpperCase()}]`, "API Error");
    });
  } else {
    console.warn("pywebview API not loaded. Browser simulation.");
    addHistoryLog(sourceText, `${title} [${combo.toUpperCase()}]`, "Browser Simulation");
  }

  showLog(`${isFromRemote ? '📱 [Mobile]' : '💻 [Desktop]'} ${title} (${combo.toUpperCase()})`);
}

// Prominent Action Toast Banner Update
function showActionToast(title, combo, source) {
  const banner = document.getElementById("actionToastBanner");
  const labelEl = document.getElementById("toastActionLabel");
  const subEl = document.getElementById("toastActionSub");
  const badgeEl = document.getElementById("toastSourceBadge");

  labelEl.innerText = title;
  subEl.innerText = `ส่งคำสั่งคีย์ลัด: ${combo.toUpperCase()}`;
  badgeEl.innerText = source.toUpperCase();
  badgeEl.className = `source-badge ${source}`;

  // Flash animation effect
  banner.classList.remove("flash");
  void banner.offsetWidth; // trigger reflow
  banner.classList.add("flash");
}

// Command Activity History Log Table
function addHistoryLog(source, command, status) {
  const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  historyLogs.unshift({
    time: timeStr,
    source: source.toUpperCase(),
    command: command,
    status: status
  });

  if (historyLogs.length > 50) {
    historyLogs.pop();
  }

  renderHistoryLogs();
}

function renderHistoryLogs() {
  const tbody = document.getElementById("historyLogBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  historyLogs.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.time}</td>
      <td><span class="source-badge ${log.source.toLowerCase()}">${log.source}</span></td>
      <td><strong>${escapeHtml(log.command)}</strong></td>
      <td><small style="color: #60a5fa;">${log.status}</small></td>
    `;
    tbody.appendChild(tr);
  });
}

// Always On Top & Auto Focus Toggles
function initOntopToggle() {
  const btn = document.getElementById("toggleOntopBtn");
  btn.addEventListener("click", () => {
    isAlwaysOnTop = !isAlwaysOnTop;
    btn.classList.toggle("active", isAlwaysOnTop);

    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.toggle_ontop(isAlwaysOnTop).then(res => {
        showLog(`Always-On-Top: ${isAlwaysOnTop ? 'เปิด' : 'ปิด'}`);
      });
    }
  });
}

function initAutoFocusToggle() {
  const btn = document.getElementById("toggleAutoFocusBtn");
  btn.addEventListener("click", () => {
    isAutoFocusPPT = !isAutoFocusPPT;
    btn.classList.toggle("active", isAutoFocusPPT);

    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.set_auto_focus(isAutoFocusPPT).then(res => {
        showLog(`Auto-Focus PPT: ${isAutoFocusPPT ? 'เปิด' : 'ปิด'}`);
      });
    }
  });
}

// Edit Main Presets Key Mappings
function openEditPresetsModal() {
  document.getElementById("editKey_next").value = presetKeys.next;
  document.getElementById("editKey_prev").value = presetKeys.prev;
  document.getElementById("editKey_start").value = presetKeys.start;
  document.getElementById("editKey_startCurrent").value = presetKeys.startCurrent;
  document.getElementById("editKey_exit").value = presetKeys.exit;
  document.getElementById("editKey_black").value = presetKeys.black;
  document.getElementById("editKey_white").value = presetKeys.white;
  document.getElementById("editKey_pen").value = presetKeys.pen;
  document.getElementById("editKey_eraser").value = presetKeys.eraser;

  document.getElementById("editPresetsModal").classList.add("active");
}

function closeEditPresetsModal() {
  document.getElementById("editPresetsModal").classList.remove("active");
}

function savePresetKeyMappings() {
  presetKeys.next = document.getElementById("editKey_next").value.trim().toLowerCase() || "right";
  presetKeys.prev = document.getElementById("editKey_prev").value.trim().toLowerCase() || "left";
  presetKeys.start = document.getElementById("editKey_start").value.trim().toLowerCase() || "f5";
  presetKeys.startCurrent = document.getElementById("editKey_startCurrent").value.trim().toLowerCase() || "shift+f5";
  presetKeys.exit = document.getElementById("editKey_exit").value.trim().toLowerCase() || "escape";
  presetKeys.black = document.getElementById("editKey_black").value.trim().toLowerCase() || "b";
  presetKeys.white = document.getElementById("editKey_white").value.trim().toLowerCase() || "w";
  presetKeys.pen = document.getElementById("editKey_pen").value.trim().toLowerCase() || "ctrl+p";
  presetKeys.eraser = document.getElementById("editKey_eraser").value.trim().toLowerCase() || "ctrl+e";

  localStorage.setItem("presetKeys", JSON.stringify(presetKeys));
  updatePresetKeyHintsUI();
  closeEditPresetsModal();
  showLog("บันทึกการตั้งค่าคีย์ลัดปุ่มหลักเรียบร้อยแล้ว");
}

function updatePresetKeyHintsUI() {
  document.getElementById("hint_next").innerText = presetKeys.next.toUpperCase();
  document.getElementById("hint_prev").innerText = presetKeys.prev.toUpperCase();
  document.getElementById("hint_start").innerText = presetKeys.start.toUpperCase();
  document.getElementById("hint_startCurrent").innerText = presetKeys.startCurrent.toUpperCase();
  document.getElementById("hint_exit").innerText = presetKeys.exit.toUpperCase();
  document.getElementById("hint_black").innerText = presetKeys.black.toUpperCase();
  document.getElementById("hint_white").innerText = presetKeys.white.toUpperCase();
  document.getElementById("hint_pen").innerText = presetKeys.pen.toUpperCase();
  document.getElementById("hint_eraser").innerText = presetKeys.eraser.toUpperCase();
}

// Custom Hotkeys Management
function initCustomHotkeys() {
  renderCustomHotkeys();
}

function renderCustomHotkeys() {
  const container = document.getElementById("customHotkeysList");
  container.innerHTML = "";

  customHotkeys.forEach(item => {
    const card = document.createElement("div");
    card.className = "custom-card";
    card.innerHTML = `
      <div class="custom-card-top">
        <span class="custom-card-title">
          <i class="fa-solid ${item.icon}"></i> ${escapeHtml(item.label)}
        </span>
        <button class="delete-btn" onclick="deleteCustomHotkey(${item.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <button class="remote-btn btn-dark" onclick="triggerKey('${item.combo}')">
        <span>กดใช้งาน</span>
        <small class="key-hint">${item.combo.toUpperCase()}</small>
      </button>
    `;
    container.appendChild(card);
  });
}

function openAddHotkeyModal() {
  document.getElementById("addHotkeyModal").classList.add("active");
}

function closeAddHotkeyModal() {
  document.getElementById("addHotkeyModal").classList.remove("active");
  document.getElementById("hotkeyLabel").value = "";
  document.getElementById("hotkeyCombo").value = "";
}

function saveCustomHotkey() {
  const label = document.getElementById("hotkeyLabel").value.trim();
  const combo = document.getElementById("hotkeyCombo").value.trim().toLowerCase();
  const icon = document.getElementById("hotkeyIcon").value;

  if (!label || !combo) {
    alert("กรุณากรอกชื่อปุ่มและคีย์ลัดให้ครบถ้วน");
    return;
  }

  const newItem = {
    id: Date.now(),
    label: label,
    combo: combo,
    icon: icon
  };

  customHotkeys.push(newItem);
  localStorage.setItem("customHotkeys", JSON.stringify(customHotkeys));
  renderCustomHotkeys();
  closeAddHotkeyModal();
  showLog(`เพิ่มคีย์ลัดใหม่: ${label} (${combo})`);
}

function deleteCustomHotkey(id) {
  customHotkeys = customHotkeys.filter(item => item.id !== id);
  localStorage.setItem("customHotkeys", JSON.stringify(customHotkeys));
  renderCustomHotkeys();
  showLog("ลบปุ่มคีย์ลัดเรียบร้อย");
}

// QR Code & Mobile URL Settings
function initMobileUrlSetting() {
  const urlInput = document.getElementById("mobileUrlInput");
  urlInput.value = mobileBaseUrl;

  document.getElementById("saveUrlBtn").addEventListener("click", () => {
    mobileBaseUrl = urlInput.value.trim();
    localStorage.setItem("mobileBaseUrl", mobileBaseUrl);
    renderQRCode();
    showLog("บันทึก URL มือถือแล้ว");
  });
}

function renderQRCode() {
  const qrContainer = document.getElementById("qrcode");
  qrContainer.innerHTML = "";

  let fullUrl = mobileBaseUrl;
  if (!fullUrl.includes("?")) {
    fullUrl += `?room=${currentRoomId}`;
  } else {
    fullUrl += `&room=${currentRoomId}`;
  }

  try {
    new QRCode(qrContainer, {
      text: fullUrl,
      width: 180,
      height: 180,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch (err) {
    console.error("QR Code Error:", err);
    qrContainer.innerHTML = `<p style="color:red; font-size:12px;">ไม่สามารถสร้าง QR Code ได้</p>`;
  }
}

// Helper Utils
function showLog(message) {
  const el = document.getElementById("lastActionText");
  if (el) {
    el.innerText = message;
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
