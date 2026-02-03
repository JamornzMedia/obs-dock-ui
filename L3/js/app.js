// Global variables - use var to avoid hoisting issues with onclick handlers
var obs = null;
var obsConnected = false;
var requestId = 0;
var pendingCallbacks = {}; // Map of requestId -> callback function
var dbData = [];
var cards = [];
var MAX_CARDS = 10;
var OBS_URL = "ws://localhost:4455";
var imageFolder = ""; // Base folder for images

// ============ IMAGE PATH HELPER ============
// Build full image path: folder + filename + extension (auto-detect .png/.jpg)
function buildImagePath(imageName) {
    if (!imageName) return "";

    // If already has extension, use as-is
    var hasExt = /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(imageName);
    if (hasExt) {
        // If has folder, combine; otherwise use as-is
        if (imageFolder) {
            return imageFolder + imageName;
        }
        return imageName;
    }

    // No extension - need to add one
    // Try .png first (most common for avatars)
    var basePath = imageFolder ? imageFolder + imageName : imageName;
    // We'll send .png to OBS - if file doesn't exist, OBS will just not show it
    // User should use consistent extensions in their folder
    return basePath + ".png";
}

// Save/Load image folder setting
function saveImageFolder(value) {
    imageFolder = value || "";
    // Ensure trailing slash
    if (imageFolder && !imageFolder.endsWith("\\") && !imageFolder.endsWith("/")) {
        imageFolder += "\\";
    }
    try {
        localStorage.setItem('l3_image_folder', imageFolder);
    } catch (e) { }
    console.log('Image folder saved:', imageFolder);
}

function loadImageFolder() {
    try {
        var saved = localStorage.getItem('l3_image_folder');
        if (saved) {
            imageFolder = saved;
        }
        // Try to set input value (might be called before or after DOM ready)
        var input = document.getElementById('image-folder-input');
        if (input) {
            input.value = imageFolder || '';
        }
    } catch (e) {
        console.warn('loadImageFolder error:', e);
    }
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Loaded - L3 Control Center');

    // Prevent default drag behavior on body
    document.body.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
    document.body.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
    });

    loadCardsFromStorage();
    loadImageFolder();
    renderCards();
    renderSettingsList();
    setupFileInput();
    setupAddCardButton();
    connectOBS();

    console.log('Init complete, cards:', cards.length);
});

// ============ FILE INPUT SETUP ============
function setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('drop-zone');

    if (!fileInput || !dropZone) {
        console.error('File input elements not found');
        return;
    }

    // Remove any existing listeners by cloning
    const newDropZone = dropZone.cloneNode(true);
    dropZone.parentNode.replaceChild(newDropZone, dropZone);

    // Get the new reference
    const dz = document.getElementById('drop-zone');

    // Click to select file - use mousedown for better compatibility
    dz.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Drop zone clicked');
        fileInput.click();
    });

    // File selected via input
    fileInput.addEventListener('change', function (e) {
        console.log('File input change event');
        if (e.target.files && e.target.files[0]) {
            console.log('File selected:', e.target.files[0].name);
            processFile(e.target.files[0]);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    });

    // Drag and drop
    dz.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.add('dragover');
    });

    dz.addEventListener('dragenter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.add('dragover');
    });

    dz.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove('dragover');
    });

    dz.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove('dragover');
        console.log('File dropped');

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            console.log('Dropped file:', files[0].name);
            processFile(files[0]);
        }
    });

    console.log('File input setup complete');
}

// ============ ADD CARD BUTTON SETUP ============
function setupAddCardButton() {
    const btn = document.getElementById('btn-add-card');
    if (btn) {
        // Remove old listener by replacing element
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        // Add new listener
        document.getElementById('btn-add-card').addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Add card button clicked');
            addCard();
        });
    }
}

// ============ PROCESS EXCEL FILE ============
function processFile(file) {
    console.log('Processing file:', file.name);

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

            console.log('Raw data:', rawData);

            dbData = rawData.map(function (row, index) {
                return {
                    id: row.ID || index,
                    name: row.name || "",
                    label1: row.LabelName1 || "",
                    label2: row.LabelName2 || "",
                    label3: row.LabelName3 || "",
                    image: row.image || ""
                };
            });

            console.log('Processed data:', dbData);

            // Update UI
            updateImportStatus();
            populateDropdowns();

            // Show success in drop zone
            const dropZone = document.getElementById('drop-zone');
            dropZone.innerHTML = '<div class="drop-zone-icon">✅</div><div style="color:#4ade80; font-weight:bold;">โหลดสำเร็จ: ' + dbData.length + ' รายการ</div><div style="font-size:9px; color:#888; margin-top:5px;">คลิกเพื่อเลือกไฟล์ใหม่</div>';

        } catch (err) {
            console.error('Error processing file:', err);
            alert('ไม่สามารถอ่านไฟล์ได้: ' + err.message);
        }
    };

    reader.onerror = function (err) {
        console.error('FileReader error:', err);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
    };

    reader.readAsArrayBuffer(file);
}

function updateImportStatus() {
    const statusEl = document.getElementById('import-status');
    const dataCountEl = document.getElementById('data-count');

    if (dbData.length > 0) {
        statusEl.textContent = '✓ ' + dbData.length + ' รายการ';
        statusEl.classList.remove('empty');
        dataCountEl.textContent = 'Data: ' + dbData.length + ' rows';
        dataCountEl.style.color = '#4ade80';
    } else {
        statusEl.textContent = 'ยังไม่มีข้อมูล';
        statusEl.classList.add('empty');
        dataCountEl.textContent = 'No Data';
        dataCountEl.style.color = '#666';
    }
}

function toggleImportBar() {
    const bar = document.getElementById('import-bar');
    bar.classList.toggle('expanded');
}

// ============ OBS CONNECTION (Native WebSocket) ============
function connectOBS() {
    console.log("🟡 Connecting to OBS...");
    obs = new WebSocket(OBS_URL);

    obs.onopen = function () {
        console.log("🟡 WebSocket opened, waiting for authentication...");
    };

    obs.onmessage = function (event) {
        const message = JSON.parse(event.data);

        // op 0 = Hello (server greeting)
        if (message.op === 0) {
            console.log("Received Hello from OBS, sending Identify...");
            const identifyRequest = {
                op: 1, // Identify
                d: {
                    rpcVersion: 1
                }
            };
            obs.send(JSON.stringify(identifyRequest));
        }

        // op 2 = Identified (authentication successful)
        else if (message.op === 2) {
            console.log("✅ Connected to OBS WebSocket!");
            obsConnected = true;
            document.getElementById('obs-status-dot').classList.add('status-connected');
            document.getElementById('obs-status-dot').classList.remove('status-error');
            document.getElementById('obs-status-text').innerText = "Connected";
            document.getElementById('obs-status-text').style.color = "#00ff00";
        }

        // op 7 = RequestResponse (response to our requests)
        else if (message.op === 7) {
            var reqId = message.d.requestId;
            var responseData = message.d.responseData || {};
            var status = message.d.requestStatus;

            // Check if there's a pending callback for this request
            if (pendingCallbacks[reqId]) {
                if (status && status.result) {
                    pendingCallbacks[reqId](null, responseData);
                } else {
                    pendingCallbacks[reqId](status, null);
                }
                delete pendingCallbacks[reqId];
            }

            if (status && !status.result) {
                console.warn('OBS Request failed:', message.d);
            }
        }
    };

    obs.onerror = function (err) {
        console.error("❌ OBS WebSocket error:", err);
        obsConnected = false;
    };

    obs.onclose = function () {
        console.log("❌ OBS WebSocket disconnected. Reconnecting in 5 seconds...");
        obsConnected = false;
        document.getElementById('obs-status-dot').classList.remove('status-connected');
        document.getElementById('obs-status-dot').classList.add('status-error');
        document.getElementById('obs-status-text').innerText = "Disconnected";
        document.getElementById('obs-status-text').style.color = "#ff6b6b";
        setTimeout(connectOBS, 5000);
    };
}

// Send a request to OBS
function sendOBSRequest(requestType, requestData) {
    if (!obs || obs.readyState !== 1 || !obsConnected) {
        console.warn('OBS not connected, cannot send request');
        return null;
    }

    requestId++;
    var reqIdStr = 'req_' + requestId;
    var request = {
        op: 6, // Request
        d: {
            requestType: requestType,
            requestId: reqIdStr,
            requestData: requestData || {}
        }
    };
    obs.send(JSON.stringify(request));
    return reqIdStr;
}

// Send a request to OBS with callback
function sendOBSRequestWithCallback(requestType, requestData, callback) {
    var reqIdStr = sendOBSRequest(requestType, requestData);
    if (reqIdStr && callback) {
        pendingCallbacks[reqIdStr] = callback;
    }
}

// Send batch of requests to OBS
function sendOBSBatch(requests) {
    if (!obs || obs.readyState !== 1 || !obsConnected) {
        console.warn('OBS not connected, cannot send batch');
        return;
    }

    requestId++;
    const batch = {
        op: 8, // RequestBatch
        d: {
            requestId: 'batch_' + requestId,
            requests: requests.map((req, idx) => ({
                requestType: req.requestType,
                requestId: 'batch_' + requestId + '_' + idx,
                requestData: req.requestData || {}
            }))
        }
    };
    obs.send(JSON.stringify(batch));
}

// ============ LOCAL STORAGE (with fallback for OBS Dock) ============
function saveCardsToStorage() {
    try {
        localStorage.setItem('l3_cards', JSON.stringify(cards));
    } catch (e) {
        console.warn('localStorage not available:', e);
    }
}

function loadCardsFromStorage() {
    try {
        const saved = localStorage.getItem('l3_cards');
        if (saved) {
            cards = JSON.parse(saved);
            console.log('Loaded cards from storage:', cards.length);
        } else {
            cards = getDefaultCards();
            console.log('Using default cards');
        }
    } catch (e) {
        console.warn('localStorage read failed:', e);
        cards = getDefaultCards();
    }
    saveCardsToStorage();
}

function getDefaultCards() {
    return [
        { id: 1, name: 'Player Info', type: 'single' },
        { id: 2, name: 'Versus Match', type: 'double' }
    ];
}

// ============ CARD MANAGEMENT ============
function addCard() {
    console.log('addCard called');

    if (cards.length >= MAX_CARDS) {
        alert('ไม่สามารถเพิ่มได้เกิน ' + MAX_CARDS + ' Cards');
        return;
    }

    const nameInput = document.getElementById('new-card-name');
    const typeSelect = document.getElementById('new-card-type');

    const name = (nameInput.value || '').trim() || 'Card ' + (cards.length + 1);
    const type = typeSelect.value || 'single';

    console.log('Adding card:', name, type);

    // Find next available ID
    const usedIds = cards.map(function (c) { return c.id; });
    let newId = 1;
    while (usedIds.indexOf(newId) !== -1) newId++;

    cards.push({
        id: newId,
        name: name,
        type: type
    });

    saveCardsToStorage();
    renderCards();
    renderSettingsList();

    // Clear form
    nameInput.value = '';

    console.log('Card added, total:', cards.length);
}

function deleteCard(index) {
    if (confirm('ต้องการลบ Card "' + cards[index].name + '" หรือไม่?')) {
        cards.splice(index, 1);
        saveCardsToStorage();
        renderCards();
        renderSettingsList();
    }
}

function openEditCard(index) {
    const card = cards[index];
    document.getElementById('edit-card-index').value = index;
    document.getElementById('edit-card-name').value = card.name;
    document.getElementById('edit-card-type').value = card.type;
    openModal('modal-edit');
}

function saveCardEdit() {
    const index = parseInt(document.getElementById('edit-card-index').value);
    const nameInput = document.getElementById('edit-card-name');
    const typeSelect = document.getElementById('edit-card-type');

    cards[index].name = (nameInput.value || '').trim() || 'Card ' + cards[index].id;
    cards[index].type = typeSelect.value;

    saveCardsToStorage();
    renderCards();
    renderSettingsList();
    closeModal(null, 'modal-edit');
}

// ============ RENDER FUNCTIONS ============
function renderSettingsList() {
    const container = document.getElementById('settings-list');
    const addBtn = document.getElementById('btn-add-card');

    if (!container) {
        console.error('Settings container not found');
        return;
    }

    if (cards.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div>ยังไม่มี Card<br>เพิ่ม Card ด้านล่าง</div>';
    } else {
        let html = '';
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            html += '<div class="settings-item">' +
                '<div class="settings-item-info">' +
                '<div class="settings-item-name">' +
                (card.type === 'single' ? '👤' : '👥') + ' ' +
                card.name +
                ' <span class="card-type-badge ' + card.type + '">' + card.type.toUpperCase() + '</span>' +
                '</div>' +
                '<div class="settings-item-type">Card #' + card.id + '</div>' +
                '</div>' +
                '<div class="settings-item-actions">' +
                '<button class="btn-icon" onclick="openEditCard(' + i + ')" title="แก้ไข">✏️</button>' +
                '<button class="btn-icon delete" onclick="deleteCard(' + i + ')" title="ลบ">🗑️</button>' +
                '</div>' +
                '</div>';
        }
        container.innerHTML = html;
    }

    // Update add button state
    if (addBtn) {
        addBtn.disabled = cards.length >= MAX_CARDS;
        addBtn.textContent = cards.length >= MAX_CARDS ? '⚠️ เต็มแล้ว (10/10)' : '➕ เพิ่ม Card';
    }

    // Re-bind add button event after render
    setupAddCardButton();
}

function renderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    if (cards.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div>ยังไม่มี Card<br>กดปุ่ม "ตั้งค่า Cards" เพื่อเพิ่ม</div>';
        return;
    }

    let html = '';
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (card.type === 'single') {
            html += renderSingleCard(card, i);
        } else {
            html += renderDoubleCard(card, i);
        }
    }
    container.innerHTML = html;

    populateDropdowns();
}

function renderSingleCard(card, index) {
    const cardId = card.id;
    return '<div class="control-card single" data-card-index="' + index + '" data-card-id="' + cardId + '">' +
        '<button class="btn-card-settings" onclick="openCardSettings(' + cardId + ', \'single\')" title="ตั้งค่า">⚙️</button>' +
        '<div class="card-header">' +
        '<span class="card-title">👤 ' + card.name + '</span>' +
        '</div>' +
        '<select id="sel_single_' + cardId + '" class="data-select" onchange="applySingleL3(' + cardId + ')"></select>' +
        '<div class="switch-container">' +
        '<span style="font-size:9px; font-weight:bold;">SHOW</span>' +
        '<label class="switch">' +
        '<input type="checkbox" id="vis_single_' + cardId + '" onchange="toggleSingleVisibility(' + cardId + ', this.checked)">' +
        '<span class="slider"></span>' +
        '</label>' +
        '</div>' +
        '</div>';
}

function renderDoubleCard(card, index) {
    const cardId = card.id;
    return '<div class="control-card double" data-card-index="' + index + '" data-card-id="' + cardId + '">' +
        '<button class="btn-card-settings" onclick="openCardSettings(' + cardId + ', \'double\')" title="ตั้งค่า">⚙️</button>' +
        '<div class="card-header">' +
        '<span class="card-title">👥 ' + card.name + '</span>' +
        '</div>' +
        '<div class="side-section home">' +
        '<span class="side-label home">🏠</span>' +
        '<select id="sel_home_' + cardId + '" class="data-select" style="flex:1;" onchange="applyDoubleL3(' + cardId + ')"></select>' +
        '</div>' +
        '<div class="side-section away">' +
        '<span class="side-label away">✈️</span>' +
        '<select id="sel_away_' + cardId + '" class="data-select" style="flex:1;" onchange="applyDoubleL3(' + cardId + ')"></select>' +
        '</div>' +
        '<div class="switch-container">' +
        '<span style="font-size:9px; font-weight:bold;">SHOW</span>' +
        '<label class="switch">' +
        '<input type="checkbox" id="vis_double_' + cardId + '" onchange="toggleDoubleVisibility(' + cardId + ', this.checked)">' +
        '<span class="slider"></span>' +
        '</label>' +
        '</div>' +
        '</div>';
}

function renderSourceRow(sourceName, label) {
    return '<div class="source-row">' +
        '<span style="color:#666;">' + label + ':</span>' +
        '<span class="source-name">' + sourceName + '</span>' +
        '<button class="btn-copy" onclick="copySource(\'' + sourceName + '\', this)">📋</button>' +
        '</div>';
}

function copySource(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
        btn.classList.add('copied');
        btn.textContent = '✓';
        setTimeout(function () {
            btn.classList.remove('copied');
            btn.textContent = '📋';
        }, 1500);
    });
}

// ============ POPULATE DROPDOWNS ============
// Helper function to pad string to fixed width
function padStr(str, len) {
    str = String(str || '');
    if (str.length >= len) return str.substring(0, len);
    return str + ' '.repeat(len - str.length);
}

function populateDropdowns() {
    // First, calculate max width for each column
    var maxId = 4, maxName = 8, maxLabel1 = 6, maxLabel2 = 6, maxLabel3 = 6;

    dbData.forEach(function (item) {
        var idStr = String(item.id || '');
        var nameStr = String(item.name || '');
        var l1Str = String(item.label1 || '');
        var l2Str = String(item.label2 || '');
        var l3Str = String(item.label3 || '');

        if (idStr.length > maxId) maxId = Math.min(idStr.length, 6);
        if (nameStr.length > maxName) maxName = Math.min(nameStr.length, 20);
        if (l1Str.length > maxLabel1) maxLabel1 = Math.min(l1Str.length, 15);
        if (l2Str.length > maxLabel2) maxLabel2 = Math.min(l2Str.length, 15);
        if (l3Str.length > maxLabel3) maxLabel3 = Math.min(l3Str.length, 15);
    });

    // For each card, populate its dropdowns with visible columns
    cards.forEach(function (card) {
        const visibility = card.columnVisibility || { id: true, name: true, label1: true, label2: false, label3: false };

        // Get dropdowns for this card
        var selectors = [];
        if (card.type === 'single') {
            selectors.push(document.getElementById('sel_single_' + card.id));
        } else {
            selectors.push(document.getElementById('sel_home_' + card.id));
            selectors.push(document.getElementById('sel_away_' + card.id));
        }

        selectors.forEach(function (sel) {
            if (!sel) return;

            sel.innerHTML = '<option value="">-- เลือก --</option>';
            for (let i = 0; i < dbData.length; i++) {
                const item = dbData[i];
                const opt = document.createElement('option');
                opt.value = i;

                // Build display text with padded columns
                var text = '';
                var hasContent = false;

                if (visibility.id !== false) { // ID shows by default
                    text += padStr(item.id, maxId);
                    hasContent = true;
                }
                if (visibility.name) {
                    if (hasContent) text += ' │ ';
                    text += padStr(item.name, maxName);
                    hasContent = true;
                }
                if (visibility.label1) {
                    if (hasContent) text += ' │ ';
                    text += padStr(item.label1, maxLabel1);
                    hasContent = true;
                }
                if (visibility.label2) {
                    if (hasContent) text += ' │ ';
                    text += padStr(item.label2, maxLabel2);
                    hasContent = true;
                }
                if (visibility.label3) {
                    if (hasContent) text += ' │ ';
                    text += padStr(item.label3, maxLabel3);
                }

                opt.text = text || '(ไม่มีข้อมูล)';
                sel.add(opt);
            }
        });
    });
}

// ============ CONTROL LOGIC: SINGLE ============
async function applySingleL3(cardId) {
    const sel = document.getElementById('sel_single_' + cardId);
    const idx = sel ? sel.value : null;
    if (!idx || !dbData[idx]) {
        // Silent return for auto-update
        return;
    }

    const item = dbData[idx];
    const batch = [];

    batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Name_' + cardId, inputSettings: { text: String(item.name) } } });
    batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label1_' + cardId, inputSettings: { text: String(item.label1) } } });
    batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label2_' + cardId, inputSettings: { text: String(item.label2) } } });
    batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label3_' + cardId, inputSettings: { text: String(item.label3) } } });

    if (item.image) {
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'I_Avatar_' + cardId, inputSettings: { file: buildImagePath(item.image) } } });
    }

    sendOBSBatch(batch);
    console.log('Single L3 updated for card', cardId);
}

// ============ CONTROL LOGIC: DOUBLE ============
async function applyDoubleL3(cardId) {
    const selHome = document.getElementById('sel_home_' + cardId);
    const selAway = document.getElementById('sel_away_' + cardId);
    const idxHome = selHome ? selHome.value : null;
    const idxAway = selAway ? selAway.value : null;

    const batch = [];

    // Home Side
    if (dbData[idxHome]) {
        const item = dbData[idxHome];
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Name_Home_' + cardId, inputSettings: { text: String(item.name) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label1_Home_' + cardId, inputSettings: { text: String(item.label1) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label2_Home_' + cardId, inputSettings: { text: String(item.label2) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label3_Home_' + cardId, inputSettings: { text: String(item.label3) } } });
        if (item.image) {
            batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'I_Avatar_Home_' + cardId, inputSettings: { file: buildImagePath(item.image) } } });
        }
    }

    // Away Side
    if (dbData[idxAway]) {
        const item = dbData[idxAway];
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Name_Away_' + cardId, inputSettings: { text: String(item.name) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label1_Away_' + cardId, inputSettings: { text: String(item.label1) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label2_Away_' + cardId, inputSettings: { text: String(item.label2) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label3_Away_' + cardId, inputSettings: { text: String(item.label3) } } });
        if (item.image) {
            batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'I_Avatar_Away_' + cardId, inputSettings: { file: buildImagePath(item.image) } } });
        }
    }

    if (batch.length > 0) {
        sendOBSBatch(batch);
        console.log('Double L3 updated for card', cardId);
    }
}

// ============ VISIBILITY TOGGLE ============
function toggleSingleVisibility(cardId, isVisible) {
    const groupName = 'G_LowerThird_' + cardId;
    toggleSourceVisibility(groupName, isVisible);
}

function toggleDoubleVisibility(cardId, isVisible) {
    const groupHome = 'G_LowerThird_Home_' + cardId;
    const groupAway = 'G_LowerThird_Away_' + cardId;
    toggleSourceVisibility(groupHome, isVisible);
    toggleSourceVisibility(groupAway, isVisible);
}

function toggleSourceVisibility(sourceName, isVisible) {
    if (!obsConnected) {
        console.warn('OBS not connected, cannot toggle visibility');
        return;
    }

    console.log('Toggling visibility:', sourceName, '->', isVisible);

    // Step 1: Get current scene
    sendOBSRequestWithCallback('GetCurrentProgramScene', {}, function (err, response) {
        if (err || !response) {
            console.error('Failed to get current scene:', err);
            return;
        }

        var sceneName = response.currentProgramSceneName;
        console.log('Current scene:', sceneName);

        // Step 2: Get scene item ID
        sendOBSRequestWithCallback('GetSceneItemId', {
            sceneName: sceneName,
            sourceName: sourceName
        }, function (err2, response2) {
            if (err2 || !response2) {
                console.error('Failed to get scene item ID for', sourceName, ':', err2);
                return;
            }

            var sceneItemId = response2.sceneItemId;
            console.log('Scene item ID:', sceneItemId);

            // Step 3: Set visibility
            sendOBSRequest('SetSceneItemEnabled', {
                sceneName: sceneName,
                sceneItemId: sceneItemId,
                sceneItemEnabled: isVisible
            });
            console.log('Visibility set for', sourceName, ':', isVisible);
        });
    });
}

// ============ UI UTILS ============
function flashButton(btn) {
    if (!btn) return;
    const oldBg = btn.style.background;
    const oldText = btn.innerText;
    btn.style.background = "#2d4a3e";
    btn.innerText = "✓ UPDATED!";
    setTimeout(function () {
        btn.style.background = oldBg;
        btn.innerText = oldText;
    }, 1200);
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(e, id) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById(id).classList.remove('open');
}

// ============ CARD SETTINGS MODAL ============
var currentSettingsCardId = null;
var currentSettingsCardType = null;

function openCardSettings(cardId, cardType) {
    currentSettingsCardId = cardId;
    currentSettingsCardType = cardType;

    const card = cards.find(c => c.id === cardId);
    const titleEl = document.getElementById('card-settings-title');
    const contentEl = document.getElementById('card-settings-content');
    const togglesEl = document.getElementById('column-visibility-toggles');

    titleEl.textContent = '⚙️ ' + (card ? card.name : 'Card ' + cardId);

    // Build source names HTML
    let html = '<div class="source-mapping" style="margin:0;">';

    if (cardType === 'single') {
        html += '<div style="font-size:9px; color:#888; margin-bottom:5px;">📍 OBS Source Names:</div>';
        html += renderSourceRowWithCreate('G_LowerThird_' + cardId, 'Group', 'group', cardId, cardType);
        html += renderSourceRowWithCreate('T_Name_' + cardId, 'Name', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label1_' + cardId, 'Label1', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label2_' + cardId, 'Label2', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label3_' + cardId, 'Label3', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('I_Avatar_' + cardId, 'Image', 'image', cardId, cardType);
    } else {
        html += '<div style="font-size:9px; color:#888; margin-bottom:5px;">📍 Home Sources:</div>';
        html += renderSourceRowWithCreate('G_LowerThird_Home_' + cardId, 'Group', 'group', cardId, cardType + '_home');
        html += renderSourceRowWithCreate('T_Name_Home_' + cardId, 'Name', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label1_Home_' + cardId, 'Label1', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label2_Home_' + cardId, 'Label2', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label3_Home_' + cardId, 'Label3', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('I_Avatar_Home_' + cardId, 'Image', 'image', cardId, cardType);

        html += '<div style="font-size:9px; color:#888; margin:8px 0 5px 0; border-top:1px dashed #333; padding-top:6px;">📍 Away Sources:</div>';
        html += renderSourceRowWithCreate('G_LowerThird_Away_' + cardId, 'Group', 'group', cardId, cardType + '_away');
        html += renderSourceRowWithCreate('T_Name_Away_' + cardId, 'Name', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label1_Away_' + cardId, 'Label1', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label2_Away_' + cardId, 'Label2', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('T_Label3_Away_' + cardId, 'Label3', 'text', cardId, cardType);
        html += renderSourceRowWithCreate('I_Avatar_Away_' + cardId, 'Image', 'image', cardId, cardType);
    }

    html += '</div>';
    contentEl.innerHTML = html;

    // Column visibility toggles
    const columns = ['id', 'name', 'label1', 'label2', 'label3'];
    const columnLabels = { id: 'ID', name: 'ชื่อ', label1: 'Label1', label2: 'Label2', label3: 'Label3' };
    const savedVisibility = card.columnVisibility || { id: true, name: true, label1: true, label2: false, label3: false };

    let togglesHtml = '';
    columns.forEach(col => {
        const checked = savedVisibility[col] ? 'checked' : '';
        togglesHtml += '<label style="display:flex; align-items:center; gap:3px; font-size:10px; cursor:pointer;">' +
            '<input type="checkbox" ' + checked + ' onchange="toggleColumnVisibility(' + cardId + ', \'' + col + '\', this.checked)">' +
            columnLabels[col] + '</label>';
    });
    togglesEl.innerHTML = togglesHtml;

    openModal('modal-card-settings');
}

function renderSourceRowWithCreate(sourceName, label, sourceType, cardId, side) {
    // Only Group can be clicked to create, other sources are for reference only
    if (sourceType === 'group') {
        return '<div class="source-row">' +
            '<span style="color:#666; width:45px;">' + label + ':</span>' +
            '<span class="source-name" style="flex:1; cursor:pointer; color:#4ade80;" onclick="promptCreateSource(\'' + sourceName + '\', \'' + sourceType + '\', ' + cardId + ', \'' + side + '\')" title="คลิกเพื่อสร้าง Group พร้อม Sources">' + sourceName + ' ➕</span>' +
            '<button class="btn-copy" onclick="copySource(\'' + sourceName + '\', this)">📋</button>' +
            '</div>';
    } else {
        // Non-group sources: display only, no create button
        return '<div class="source-row">' +
            '<span style="color:#666; width:45px;">' + label + ':</span>' +
            '<span class="source-name" style="flex:1; color:#888;">' + sourceName + '</span>' +
            '<button class="btn-copy" onclick="copySource(\'' + sourceName + '\', this)">📋</button>' +
            '</div>';
    }
}

function toggleColumnVisibility(cardId, column, isVisible) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    if (!card.columnVisibility) {
        card.columnVisibility = { id: true, name: true, label1: true, label2: false, label3: false };
    }
    card.columnVisibility[column] = isVisible;
    saveCardsToStorage();
    populateDropdowns();
}

// ============ OBS SOURCE CREATION ============
var pendingSourceCreation = null;

function promptCreateSource(sourceName, sourceType, cardId, side) {
    const contentEl = document.getElementById('confirm-create-content');

    if (sourceType === 'group') {
        // Create entire group with children
        contentEl.innerHTML = '<div style="margin-bottom:8px;">สร้าง <b style="color:#4ade80;">' + sourceName + '</b></div>' +
            '<div style="font-size:10px; color:#888;">จะสร้าง Group พร้อม Sources ทั้งหมดใน Scene ปัจจุบัน</div>';

        pendingSourceCreation = { type: 'group', groupName: sourceName, cardId: cardId, side: side };
    } else {
        contentEl.innerHTML = '<div style="margin-bottom:8px;">สร้าง <b style="color:#4ade80;">' + sourceName + '</b></div>' +
            '<div style="font-size:10px; color:#888;">จะสร้างใน Scene ปัจจุบัน</div>';

        pendingSourceCreation = { type: sourceType, sourceName: sourceName };
    }

    // Bind confirm button
    document.getElementById('btn-confirm-create').onclick = confirmCreateSource;

    openModal('modal-confirm-create');
}

function confirmCreateSource() {
    if (!pendingSourceCreation || !obsConnected) {
        alert('ไม่สามารถสร้างได้ (OBS ไม่เชื่อมต่อ)');
        return;
    }

    // Only group creation is supported now
    if (pendingSourceCreation.type !== 'group') {
        alert('รองรับเฉพาะการสร้าง Group เท่านั้น');
        return;
    }

    // Prompt user for scene name
    var sceneName = prompt('ใส่ชื่อ Scene ที่ต้องการสร้าง Group:', 'Scene');
    if (!sceneName) {
        return;
    }

    var cardId = pendingSourceCreation.cardId;
    var side = pendingSourceCreation.side;
    var prefix = side.includes('home') ? '_Home_' : (side.includes('away') ? '_Away_' : '_');
    var groupName = pendingSourceCreation.groupName;

    // Create Group with all Sources inside
    createGroupWithSources(sceneName, groupName, cardId, prefix);

    pendingSourceCreation = null;
    closeModal(null, 'modal-confirm-create');
}

// Create Group and Sources in the same scene, user drags sources into group
function createGroupWithSources(sceneName, groupName, cardId, prefix) {
    console.log('Creating group and sources:', groupName, 'in scene:', sceneName);

    var sourceNames = [
        'T_Name' + prefix + cardId,
        'T_Label1' + prefix + cardId,
        'T_Label2' + prefix + cardId,
        'T_Label3' + prefix + cardId,
        'I_Avatar' + prefix + cardId
    ];

    // Get available input kinds first, then create sources
    sendOBSRequestWithCallback('GetInputKindList', {}, function (err, response) {
        if (err) {
            console.error('Failed to get input kinds:', err);
            alert('ไม่สามารถดึงรายการ Input Types ได้');
            return;
        }

        var inputKinds = response.inputKinds || [];
        console.log('Available input kinds:', inputKinds);

        // Detect correct text input kind
        var textKind = null;
        var textKindsToTry = ['text_gdiplus_v3', 'text_gdiplus_v2', 'text_gdiplus', 'text_ft2_source_v2', 'text_ft2_source'];
        for (var i = 0; i < textKindsToTry.length; i++) {
            if (inputKinds.indexOf(textKindsToTry[i]) !== -1) {
                textKind = textKindsToTry[i];
                break;
            }
        }

        // Detect correct image input kind
        var imageKind = null;
        var imageKindsToTry = ['image_source', 'ffmpeg_source'];
        for (var i = 0; i < imageKindsToTry.length; i++) {
            if (inputKinds.indexOf(imageKindsToTry[i]) !== -1) {
                imageKind = imageKindsToTry[i];
                break;
            }
        }

        console.log('Using text kind:', textKind);
        console.log('Using image kind:', imageKind);

        if (!textKind) {
            alert('OBS ไม่พบ Text Source type ที่รองรับ\n\nAvailable kinds:\n' + inputKinds.join('\n'));
            return;
        }

        if (!imageKind) {
            alert('OBS ไม่พบ Image Source type ที่รองรับ');
            return;
        }

        var delay = 0;
        var delayIncrement = 250;

        // Create all sources in the specified scene
        setTimeout(function () {
            console.log('Creating:', sourceNames[0], 'in scene:', sceneName);
            sendOBSRequest('CreateInput', {
                sceneName: sceneName,
                inputName: sourceNames[0],
                inputKind: textKind,
                inputSettings: { text: 'Name' }
            });
        }, delay);
        delay += delayIncrement;

        setTimeout(function () {
            console.log('Creating:', sourceNames[1], 'in scene:', sceneName);
            sendOBSRequest('CreateInput', {
                sceneName: sceneName,
                inputName: sourceNames[1],
                inputKind: textKind,
                inputSettings: { text: 'Label1' }
            });
        }, delay);
        delay += delayIncrement;

        setTimeout(function () {
            console.log('Creating:', sourceNames[2], 'in scene:', sceneName);
            sendOBSRequest('CreateInput', {
                sceneName: sceneName,
                inputName: sourceNames[2],
                inputKind: textKind,
                inputSettings: { text: 'Label2' }
            });
        }, delay);
        delay += delayIncrement;

        setTimeout(function () {
            console.log('Creating:', sourceNames[3], 'in scene:', sceneName);
            sendOBSRequest('CreateInput', {
                sceneName: sceneName,
                inputName: sourceNames[3],
                inputKind: textKind,
                inputSettings: { text: 'Label3' }
            });
        }, delay);
        delay += delayIncrement;

        setTimeout(function () {
            console.log('Creating:', sourceNames[4], 'in scene:', sceneName);
            sendOBSRequest('CreateInput', {
                sceneName: sceneName,
                inputName: sourceNames[4],
                inputKind: imageKind,
                inputSettings: { file: '' }
            });
        }, delay);
        delay += delayIncrement;

        // Show success message with instructions
        setTimeout(function () {
            alert('✅ สร้าง Sources สำเร็จ!\n\n' +
                'Sources ที่สร้าง:\n' +
                '• ' + sourceNames.join('\n• ') + '\n\n' +
                '📌 ขั้นตอนถัดไป:\n' +
                '1. เลือก Sources ทั้ง 5 ตัว (กด Ctrl ค้าง)\n' +
                '2. คลิกขวา → Group Selected Items\n' +
                '3. ตั้งชื่อ Group: ' + groupName);
        }, delay + 300);
    });
}

function createTextSource(sceneName, inputName) {
    sendOBSRequest('CreateInput', {
        sceneName: sceneName,
        inputName: inputName,
        inputKind: 'text_gdiplus_v2',
        inputSettings: { text: '' }
    });
    console.log('Sent create text source:', inputName);
}

function createImageSource(sceneName, inputName) {
    sendOBSRequest('CreateInput', {
        sceneName: sceneName,
        inputName: inputName,
        inputKind: 'image_source',
        inputSettings: { file: '' }
    });
    console.log('Sent create image source:', inputName);
}
