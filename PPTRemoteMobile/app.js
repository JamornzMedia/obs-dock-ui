// Firebase Config
const firebaseConfig = {
  databaseURL: "https://useridjamornz-default-rtdb.asia-southeast1.firebasedatabase.app"
};

let app, db;
let roomId = getUrlParam('room') || localStorage.getItem('ppt_mobile_room') || 'PPT-8821';

// DOM Elements
const roomDisplay = document.getElementById('roomDisplay');
const firebaseDot = document.getElementById('firebaseDot');
const roomInput = document.getElementById('roomInput');
const roomModal = document.getElementById('roomModal');
const toastEl = document.getElementById('toast');
const mobileCustomKeysEl = document.getElementById('mobileCustomKeys');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupFirebase();
  setupTabs();
  setupTouchpad();
  updateRoomUI();
});

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function setupFirebase() {
  try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    firebaseDot.classList.add('connected');
    listenCustomKeys();
  } catch (e) {
    console.error("Firebase Mobile Init Error:", e);
    firebaseDot.classList.remove('connected');
  }
}

function updateRoomUI() {
  roomDisplay.textContent = `ROOM: ${roomId}`;
  localStorage.setItem('ppt_mobile_room', roomId);
  listenCustomKeys();
}

function toggleRoomModal() {
  roomInput.value = roomId;
  roomModal.classList.toggle('active');
}

function saveRoomCode() {
  const inputVal = roomInput.value.trim().toUpperCase();
  if (inputVal) {
    roomId = inputVal;
    updateRoomUI();
    toggleRoomModal();
    showToast(`เชื่อมต่อห้อง ${roomId} แล้ว`);
  }
}

// Mode Tab Switching
function setupTabs() {
  const tabs = document.querySelectorAll('.mode-tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.mode-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-mode');
      document.getElementById(targetId).classList.add('active');
    });
  });
}

// Trigger Key Command via Firebase
function triggerKey(keyCombo) {
  hapticFeedback();
  showToast(`Sent: ${keyCombo.toUpperCase()}`);

  if (!db || !roomId) {
    console.error("Firebase DB not initialized or missing Room ID");
    return;
  }

  const payload = {
    action: 'press_key',
    keyCombo: keyCombo,
    timestamp: Date.now()
  };

  db.ref(`rooms/${roomId}/command`).set(payload)
    .then(() => console.log('Command sent to Firebase:', payload))
    .catch(err => console.error('Firebase send error:', err));
}

// Haptic Feedback (Vibration)
function hapticFeedback() {
  if (navigator.vibrate) {
    navigator.vibrate(35);
  }
}

// Toast Alert
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 1200);
}

// Touchpad Swipe Gesture Implementation
function setupTouchpad() {
  const touchpad = document.getElementById('touchpadArea');
  const feedback = document.getElementById('swipeFeedback');
  if (!touchpad) return;

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  touchpad.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }
  }, { passive: true });

  touchpad.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const duration = Date.now() - startTime;

      // Check for swipe vs tap
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) && duration < 600) {
        if (deltaX > 0) {
          // Swipe Right -> Previous Slide
          triggerSwipeFeedback('⏮️');
          triggerKey('left');
        } else {
          // Swipe Left -> Next Slide
          triggerSwipeFeedback('⏭️');
          triggerKey('right');
        }
      } else if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
        // Tap -> Next Slide
        triggerSwipeFeedback('⏭️');
        triggerKey('right');
      }
    }
  }, { passive: true });

  function triggerSwipeFeedback(icon) {
    feedback.textContent = icon;
    feedback.classList.add('show');
    setTimeout(() => {
      feedback.classList.remove('show');
    }, 400);
  }
}

// Sync Custom Keys from Desktop Firebase Node
function listenCustomKeys() {
  if (!db || !roomId) return;

  db.ref(`rooms/${roomId}/customKeys`).on('value', (snapshot) => {
    const keys = snapshot.val();
    renderMobileCustomKeys(keys);
  });
}

function renderMobileCustomKeys(keys) {
  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    mobileCustomKeysEl.innerHTML = `<p class="empty-hint">ยังไม่มี Custom Hotkeys (เพิ่มที่โปรแกรม Desktop)</p>`;
    return;
  }

  mobileCustomKeysEl.innerHTML = keys.map(k => `
    <button class="btn-custom-mobile" onclick="triggerKey('${escapeHtml(k.combo)}')">
      <span>${escapeHtml(k.name)}</span>
      <small>${escapeHtml(k.combo)}</small>
    </button>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
