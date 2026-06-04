// Global variables - use var to avoid hoisting issues with onclick handlers
var obs = null;
var obsConnected = false;
var requestId = 0;
var pendingCallbacks = {}; // Map of requestId -> callback function
var dbData = [];
var workbookData = {};
var workbookSheets = [];
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
    var nameWithExt = hasExt ? imageName : imageName + ".png";
    var basePath = imageFolder ? imageFolder + nameWithExt : nameWithExt;

    // Check if it is a Windows absolute path (e.g. C:\path or D:\path)
    if (/^[a-zA-Z]:\\/.test(basePath) || /^[a-zA-Z]:\//.test(basePath)) {
        return "file:///" + basePath.replace(/\\/g, "/");
    }
    return basePath;
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
    loadWorkbookFromStorage();
    loadImageFolder();
    renderCards();
    renderSettingsList();
    setupFileInput();
    setupAddCardButton();
    connectOBS();

    // Restore import source type & URL
    try {
        var savedType = localStorage.getItem('l3_import_source_type');
        if (savedType) {
            var radios = document.getElementsByName('import-source-type');
            for (var i = 0; i < radios.length; i++) {
                if (radios[i].value === savedType) {
                    radios[i].checked = true;
                    toggleImportSource(savedType);
                }
            }
        }
        var savedGSheetUrl = localStorage.getItem('l3_gsheet_url');
        if (savedGSheetUrl) {
            var input = document.getElementById('gsheet-url-input');
            if (input) input.value = savedGSheetUrl;
        }
    } catch(e) {}

    // Set Help Modal Browser Source URL
    var helpUrlInput = document.getElementById('help-graphics-url');
    if (helpUrlInput) {
        helpUrlInput.value = getGraphicsUrl();
    }

    console.log('Init complete, cards:', cards.length);
    setTimeout(broadcastStateUpdate, 1000);
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

            workbookSheets = workbook.SheetNames || [];
            workbookData = {};

            workbookSheets.forEach(function (sheetName) {
                const sheet = workbook.Sheets[sheetName];
                const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                var processed = rawData.map(function (row, index) {
                    function val(key) {
                        var foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
                        return foundKey ? row[foundKey] : undefined;
                    }

                    var rowId = val('id');
                    var nameVal = val('name') || "";
                    var label1Val = val('labelname1') || val('label1') || "";
                    var label2Val = val('labelname2') || val('label2') || "";
                    var label3Val = val('labelname3') || val('label3') || "";
                    var imageVal = val('image') || "";

                    return {
                        id: rowId,
                        name: nameVal,
                        label1: label1Val,
                        label2: label2Val,
                        label3: label3Val,
                        image: imageVal
                    };
                });

                // Filter out empty rows
                processed = processed.filter(function (item) {
                    return (item.id !== undefined && item.id !== "") ||
                        item.name !== "" ||
                        item.label1 !== "" ||
                        item.label2 !== "" ||
                        item.label3 !== "" ||
                        item.image !== "";
                });

                // Assign IDs to rows without ID
                processed.forEach(function (item, index) {
                    if (item.id === undefined || item.id === "") {
                        item.id = index + 1;
                    }
                });

                // Sort by ID
                processed.sort(function (a, b) {
                    var aNum = parseFloat(a.id);
                    var bNum = parseFloat(b.id);
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return aNum - bNum;
                    }
                    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' });
                });

                workbookData[sheetName] = processed;
            });

            // Compatibility fallback
            if (workbookSheets.length > 0) {
                dbData = workbookData[workbookSheets[0]] || [];
            } else {
                dbData = [];
            }

            console.log('Processed workbook data:', workbookData);

            saveWorkbookToStorage();
            updateImportStatus();
            populateDropdowns();

            // Show success in drop zone
            const dropZone = document.getElementById('drop-zone');
            var firstSheetLen = workbookSheets.length > 0 ? workbookData[workbookSheets[0]].length : 0;
            dropZone.innerHTML = '<div class="drop-zone-icon">✅</div><div style="color:#4ade80; font-weight:bold;">โหลดสำเร็จ: ' + firstSheetLen + ' รายการ</div><div style="font-size:9px; color:#888; margin-top:5px;">คลิกเพื่อเลือกไฟล์ใหม่</div>';

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

    var totalRows = 0;
    if (workbookSheets && workbookSheets.length > 0) {
        var firstSheetName = workbookSheets[0];
        if (workbookData[firstSheetName]) {
            totalRows = workbookData[firstSheetName].length;
        }
    }

    if (totalRows > 0) {
        statusEl.textContent = '✓ ' + totalRows + ' รายการ';
        statusEl.classList.remove('empty');
        dataCountEl.textContent = 'Data: ' + totalRows + ' rows (' + workbookSheets.length + ' sheets)';
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
    const autoCloseChecked = card.autoCloseEnabled ? 'checked' : '';
    const autoCloseSec = card.autoCloseSec !== undefined ? card.autoCloseSec : 5;
    return '<div class="control-card single" data-card-index="' + index + '" data-card-id="' + cardId + '">' +
        '<button class="btn-card-settings" onclick="openCardSettings(' + cardId + ', \'single\')" title="ตั้งค่า">⚙️</button>' +
        '<div class="card-header">' +
        '<span class="card-title">👤 ' + card.name + '</span>' +
        '</div>' +
        '<select id="sel_single_' + cardId + '" class="data-select" onchange="applySingleL3(' + cardId + ')"></select>' +
        '<div class="switch-container">' +
        '<span style="font-size:9px; font-weight:bold;">SHOW</span>' +
        '<div style="display:flex; align-items:center; gap:2px; background:#111; padding:2px 4px; border-radius:3px;">' +
        '<label style="display:inline-flex; align-items:center; gap:2px; font-size:8px; margin:0; cursor:pointer; color:#bbb;">' +
        '<input type="checkbox" id="auto_close_chk_' + cardId + '" style="margin:0; width:auto; height:auto; cursor:pointer;" ' + autoCloseChecked + ' onchange="toggleAutoClose(' + cardId + ', this.checked)"> Auto' +
        '</label>' +
        '<input type="number" id="auto_close_sec_' + cardId + '" value="' + autoCloseSec + '" min="1" style="width:28px; padding:0px 2px; font-size:9px; height:12px; text-align:center; background:#000; border:1px solid #444; color:#fff; border-radius:2px; margin-left:3px;" onchange="changeAutoCloseSec(' + cardId + ', this.value)">' +
        '<span style="font-size:8px; color:#888; margin-left:1px;">s</span>' +
        '</div>' +
        '<label class="switch">' +
        '<input type="checkbox" id="vis_single_' + cardId + '" onchange="toggleSingleVisibility(' + cardId + ', this.checked)">' +
        '<span class="slider"></span>' +
        '</label>' +
        '</div>' +
        '</div>';
}

function renderDoubleCard(card, index) {
    const cardId = card.id;
    const autoCloseChecked = card.autoCloseEnabled ? 'checked' : '';
    const autoCloseSec = card.autoCloseSec !== undefined ? card.autoCloseSec : 5;
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
        '<div style="display:flex; align-items:center; gap:2px; background:#111; padding:2px 4px; border-radius:3px;">' +
        '<label style="display:inline-flex; align-items:center; gap:2px; font-size:8px; margin:0; cursor:pointer; color:#bbb;">' +
        '<input type="checkbox" id="auto_close_chk_' + cardId + '" style="margin:0; width:auto; height:auto; cursor:pointer;" ' + autoCloseChecked + ' onchange="toggleAutoClose(' + cardId + ', this.checked)"> Auto' +
        '</label>' +
        '<input type="number" id="auto_close_sec_' + cardId + '" value="' + autoCloseSec + '" min="1" style="width:28px; padding:0px 2px; font-size:9px; height:12px; text-align:center; background:#000; border:1px solid #444; color:#fff; border-radius:2px; margin-left:3px;" onchange="changeAutoCloseSec(' + cardId + ', this.value)">' +
        '<span style="font-size:8px; color:#888; margin-left:1px;">s</span>' +
        '</div>' +
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
    cards.forEach(function (card) {
        var cardData = getCardData(card);

        // First, calculate max width for each column
        var maxId = 4, maxName = 8, maxLabel1 = 6, maxLabel2 = 6, maxLabel3 = 6;
        cardData.forEach(function (item) {
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

            var currentVal = sel.value;

            sel.innerHTML = '<option value="">-- เลือก --</option>';
            for (let i = 0; i < cardData.length; i++) {
                const item = cardData[i];
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

            if (currentVal !== "" && currentVal < cardData.length) {
                sel.value = currentVal;
            }
        });
    });
}

// ============ CONTROL LOGIC: SINGLE ============
async function applySingleL3(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const cardData = getCardData(card);
    const sel = document.getElementById('sel_single_' + cardId);
    const idx = sel ? sel.value : null;
    if (idx === null || idx === "" || !cardData[idx]) {
        return;
    }

    const item = cardData[idx];
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
    broadcastStateUpdate();
}

// ============ CONTROL LOGIC: DOUBLE ============
async function applyDoubleL3(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const cardData = getCardData(card);
    const selHome = document.getElementById('sel_home_' + cardId);
    const selAway = document.getElementById('sel_away_' + cardId);
    const idxHome = selHome ? selHome.value : null;
    const idxAway = selAway ? selAway.value : null;

    const batch = [];

    // Home Side
    if (idxHome !== null && idxHome !== "" && cardData[idxHome]) {
        const item = cardData[idxHome];
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Name_Home_' + cardId, inputSettings: { text: String(item.name) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label1_Home_' + cardId, inputSettings: { text: String(item.label1) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label2_Home_' + cardId, inputSettings: { text: String(item.label2) } } });
        batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'T_Label3_Home_' + cardId, inputSettings: { text: String(item.label3) } } });
        if (item.image) {
            batch.push({ requestType: 'SetInputSettings', requestData: { inputName: 'I_Avatar_Home_' + cardId, inputSettings: { file: buildImagePath(item.image) } } });
        }
    }

    // Away Side
    if (idxAway !== null && idxAway !== "" && cardData[idxAway]) {
        const item = cardData[idxAway];
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
    broadcastStateUpdate();
}

// ============ VISIBILITY TOGGLE ============
function toggleSingleVisibility(cardId, isVisible) {
    const groupName = 'G_LowerThird_' + cardId;
    toggleSourceVisibility(groupName, isVisible);
    broadcastStateUpdate();
    handleAutoCloseTrigger(cardId, isVisible);
}

function toggleDoubleVisibility(cardId, isVisible) {
    const groupHome = 'G_LowerThird_Home_' + cardId;
    const groupAway = 'G_LowerThird_Away_' + cardId;
    toggleSourceVisibility(groupHome, isVisible);
    toggleSourceVisibility(groupAway, isVisible);
    broadcastStateUpdate();
    handleAutoCloseTrigger(cardId, isVisible);
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
var graphicsCollapsed = true;

function openCardSettings(cardId, cardType) {
    currentSettingsCardId = cardId;
    currentSettingsCardType = cardType;

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const titleEl = document.getElementById('card-settings-title');
    const contentEl = document.getElementById('card-settings-content');
    const togglesEl = document.getElementById('column-visibility-toggles');
    const sheetSelectorContainer = document.getElementById('card-sheet-selector-container');
    const graphicsSettingsContainer = document.getElementById('card-graphics-settings-container');

    titleEl.textContent = '⚙️ ' + card.name;

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

    // Generate Sheet Selector
    if (sheetSelectorContainer) {
        if (workbookSheets && workbookSheets.length > 0) {
            let sheetHtml = '<label style="font-size:10px; color:#888; margin-bottom:4px; display:block;">📄 เลือกชีทใน Excel:</label>';
            sheetHtml += '<select id="card-sheet-select" style="width:100%; font-size:11px;" onchange="changeCardSheet(' + cardId + ', this.value)">';
            workbookSheets.forEach(sheetName => {
                const selected = (card.sheetName === sheetName || (!card.sheetName && sheetName === workbookSheets[0])) ? 'selected' : '';
                sheetHtml += '<option value="' + sheetName + '" ' + selected + '>' + sheetName + '</option>';
            });
            sheetHtml += '</select>';
            sheetSelectorContainer.innerHTML = sheetHtml;
        } else {
            sheetSelectorContainer.innerHTML = '<label style="font-size:10px; color:#888;">📄 เลือกชีทใน Excel:</label><div style="font-size:9px; color:#666; margin-top:2px;">(ยังไม่ได้โหลดไฟล์ Excel)</div>';
        }
    }

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

    // Generate Graphics Settings Panel
    if (graphicsSettingsContainer) {
        const gs = getCardGraphicsSettings(card);
        const gEnabledChecked = gs.enabled ? 'checked' : '';
        const trans = gs.transition || 'slide';
        const mode = gs.mode || 'standard';

        let gHtml = '<div style="margin-top:12px; border-top:1px solid #333; padding-top:10px;">';
        gHtml += '<div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="toggleGraphicsCollapse()">';
        gHtml += '<div style="font-size:10px; font-weight:bold; color:#00aaff;">🎨 กราฟิก Browser Source Settings <span id="graphics-collapse-arrow">' + (graphicsCollapsed ? '▼' : '▲') + '</span></div>';
        gHtml += '</div>';

        gHtml += '<div id="graphics-settings-panel" style="display:' + (graphicsCollapsed ? 'none' : 'block') + '; margin-top:8px; background:#1e1e1e; padding:8px; border-radius:4px; border:1px solid #333;">';

        // Enable checkbox
        gHtml += '<div style="display:flex; align-items:center; gap:5px; margin-bottom:8px;">' +
            '<input type="checkbox" id="g-enabled" ' + gEnabledChecked + ' onchange="updateGraphicsSetting(' + cardId + ', \'enabled\', this.checked)" style="width:auto; margin:0; cursor:pointer;">' +
            '<label for="g-enabled" style="font-size:10px; font-weight:bold; color:#fff; cursor:pointer; margin:0;">เปิดใช้งานกราฟิกสำหรับ Card นี้</label>' +
            '</div>';

        // Settings grid
        gHtml += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">';

        // BG Color & Opacity
        gHtml += '<div>' +
            '<label>สีพื้นหลัง</label>' +
            '<div style="display:flex; gap:3px;">' +
            '<input type="color" id="g-bgcolor" value="' + (gs.bgColor || '#141414') + '" onchange="updateGraphicsSetting(' + cardId + ', \'bgColor\', this.value)" style="padding:0; height:20px; width:30px; border:none; cursor:pointer;">' +
            '<input type="number" id="g-bgopacity" value="' + (gs.bgOpacity !== undefined ? gs.bgOpacity : 0.85) + '" min="0" max="1" step="0.1" onchange="updateGraphicsSetting(' + cardId + ', \'bgOpacity\', parseFloat(this.value))" style="flex:1; height:20px; font-size:9px; padding:2px;" title="ความโปร่งใส 0-1">' +
            '</div>' +
            '</div>';

        // Theme Color
        gHtml += '<div>' +
            '<label>สีธีมหลัก (เส้น/ไอคอน)</label>' +
            '<input type="color" id="g-themecolor" value="' + (gs.themeColor || '#00aaff') + '" onchange="updateGraphicsSetting(' + cardId + ', \'themeColor\', this.value)" style="padding:0; height:20px; width:100%; border:none; cursor:pointer;">' +
            '</div>';

        // Border Radius & Transition
        gHtml += '<div>' +
            '<label>ความโค้งมุม (px)</label>' +
            '<input type="number" id="g-borderradius" value="' + (gs.borderRadius !== undefined ? gs.borderRadius : 6) + '" min="0" onchange="updateGraphicsSetting(' + cardId + ', \'borderRadius\', parseInt(this.value))" style="height:20px; font-size:10px; padding:2px;">' +
            '</div>';

        gHtml += '<div>' +
            '<label>แอนิเมชันเปิด/ปิด</label>' +
            '<select id="g-transition" onchange="updateGraphicsSetting(' + cardId + ', \'transition\', this.value)" style="height:20px; font-size:10px; padding:2px; width:100%;">' +
            '<option value="slide" ' + (trans === 'slide' ? 'selected' : '') + '>Slide (เลื่อน)</option>' +
            '<option value="fade" ' + (trans === 'fade' ? 'selected' : '') + '>Fade (เลือนหาย)</option>' +
            '<option value="zoom" ' + (trans === 'zoom' ? 'selected' : '') + '>Zoom (ย่อขยาย)</option>' +
            '</select>' +
            '</div>';

        gHtml += '</div>'; // end grid

        // Mode selection for Double Cards
        if (cardType === 'double') {
            gHtml += '<div style="margin-bottom:8px; border-top:1px dashed #333; padding-top:6px;">' +
                '<label style="font-weight:bold; color:#fbbf24;">รูปแบบกราฟิก (โหมดพิเศษ)</label>' +
                '<select id="g-mode" onchange="updateGraphicsSetting(' + cardId + ', \'mode\', this.value)" style="height:22px; font-size:10px; padding:2px; width:100%; background:#111; border-color:#fbbf24;">' +
                '<option value="standard" ' + (mode === 'standard' ? 'selected' : '') + '>Standard Side-by-Side (คู่ ซ้าย-ขวา)</option>' +
                '<option value="sports" ' + (mode === 'sports' ? 'selected' : '') + '>⚽ Sports Substitution (เปลี่ยนตัวนักกีฬา)</option>' +
                '</select>' +
                '</div>';
        }

        // Fields settings table
        gHtml += '<div style="border-top:1px dashed #333; padding-top:6px;">' +
            '<div style="font-size:9px; font-weight:bold; color:#ccc; margin-bottom:4px;">จัดเรียงและตั้งค่าฟิลด์:</div>';

        gHtml += '<table style="width:100%; border-collapse:collapse; font-size:9px;">' +
            '<thead>' +
            '<tr style="color:#666; border-bottom:1px solid #333; text-align:left;">' +
            '<th style="padding:2px;">ฟิลด์</th>' +
            '<th style="padding:2px; text-align:center;">โชว์</th>' +
            '<th style="padding:2px; text-align:center; width:30px;">ลำดับ</th>' +
            '<th style="padding:2px; text-align:center; width:40px;">กว้าง(px)</th>' +
            '<th style="padding:2px; text-align:center;">สี</th>' +
            '<th style="padding:2px; text-align:center; width:35px;">ขนาด(px)</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>';

        const fieldsList = ['id', 'image', 'name', 'label1', 'label2', 'label3'];
        const fieldLabels = { id: 'ID', image: 'รูปภาพ', name: 'ชื่อ', label1: 'L1', label2: 'L2', label3: 'L3' };

        fieldsList.forEach(f => {
            const fConfig = gs.fields[f] || { show: true, order: 1, width: 100, color: '#ffffff', size: 14 };
            const fShowChecked = fConfig.show ? 'checked' : '';
            const isImage = f === 'image';

            gHtml += '<tr style="border-bottom:1px solid #222;">' +
                '<td style="padding:2px; font-weight:bold; color:#bbb;">' + fieldLabels[f] + '</td>' +
                '<td style="padding:2px; text-align:center;"><input type="checkbox" onchange="updateGraphicsFieldSetting(' + cardId + ', \'' + f + '\', \'show\', this.checked)" ' + fShowChecked + ' style="width:auto; margin:0; cursor:pointer;"></td>' +
                '<td style="padding:2px;"><input type="number" value="' + fConfig.order + '" min="1" onchange="updateGraphicsFieldSetting(' + cardId + ', \'' + f + '\', \'order\', parseInt(this.value))" style="padding:1px; height:16px; font-size:8px; text-align:center; width:100%;"></td>' +
                '<td style="padding:2px;"><input type="number" value="' + fConfig.width + '" min="0" onchange="updateGraphicsFieldSetting(' + cardId + ', \'' + f + '\', \'width\', parseInt(this.value))" style="padding:1px; height:16px; font-size:8px; text-align:center; width:100%;"></td>' +
                '<td style="padding:2px; text-align:center;">' + (isImage ? '-' : '<input type="color" value="' + (fConfig.color || '#ffffff') + '" onchange="updateGraphicsFieldSetting(' + cardId + ', \'' + f + '\', \'color\', this.value)" style="padding:0; height:14px; width:20px; border:none; cursor:pointer;">') + '</td>' +
                '<td style="padding:2px;"><input type="number" value="' + (isImage ? 0 : fConfig.size || 12) + '" min="6" onchange="updateGraphicsFieldSetting(' + cardId + ', \'' + f + '\', \'size\', parseInt(this.value))" style="padding:1px; height:16px; font-size:8px; text-align:center; width:100%;" ' + (isImage ? 'disabled' : '') + '></td>' +
                '</tr>';
        });

        gHtml += '</tbody></table>';
        gHtml += '</div>';

        gHtml += '<div style="margin-top:10px; border-top:1px solid #333; padding-top:6px; font-size:8px; color:#888; line-height:1.2;">' +
            '📌 <b>วิธีใช้งานใน OBS:</b><br>' +
            '1. เพิ่ม Browser Source ใน OBS<br>' +
            '2. เลือก Local file และชี้ไปที่ไฟล์ <code style="color:#00aaff;">graphicsl3.html</code> หรือใส่ URL ด้านล่างนี้:<br>' +
            '<div style="display:flex; gap:3px; margin-top:3px; margin-bottom:4px;">' +
            '<input type="text" readonly value="' + getGraphicsUrl() + '" style="font-size:8px; height:18px; padding:2px 4px; background:#111; border:1px solid #444; color:#00aaff; flex:1; box-sizing:border-box;">' +
            '<button class="btn-copy" onclick="copyGraphicsUrl(this)" style="font-size:8px; padding:2px 4px; height:18px; line-height:1; width:auto; flex:0;">คัดลอก</button>' +
            '</div>' +
            '3. ตั้งค่าขนาดกว้าง 1920 สูง 1080' +
            '</div>';

        gHtml += '</div>'; // end panel
        gHtml += '</div>'; // end outer container
        graphicsSettingsContainer.innerHTML = gHtml;
    }

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
    broadcastStateUpdate();
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

    // Fetch current program scene dynamically
    sendOBSRequestWithCallback('GetCurrentProgramScene', {}, function (err, response) {
        if (err || !response) {
            console.error('Failed to get current scene:', err);
            alert('ไม่สามารถดึงข้อมูล Scene ปัจจุบันได้');
            return;
        }

        var sceneName = response.currentProgramSceneName;
        if (!sceneName) {
            alert('ไม่พบชื่อ Scene ปัจจุบัน');
            return;
        }

        var cardId = pendingSourceCreation.cardId;
        var side = pendingSourceCreation.side;
        var prefix = side.includes('home') ? '_Home_' : (side.includes('away') ? '_Away_' : '_');
        var groupName = pendingSourceCreation.groupName;

        // Create Group with all Sources inside in the current active scene
        createGroupWithSources(sceneName, groupName, cardId, prefix);

        pendingSourceCreation = null;
        closeModal(null, 'modal-confirm-create');
    });
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

        // Create all sources in the specified scene with Fit bounds automatically!
        setTimeout(function () { createInputWithFitBounds(sceneName, sourceNames[0], textKind, { text: 'Name' }); }, delay); delay += delayIncrement;
        setTimeout(function () { createInputWithFitBounds(sceneName, sourceNames[1], textKind, { text: 'Label1' }); }, delay); delay += delayIncrement;
        setTimeout(function () { createInputWithFitBounds(sceneName, sourceNames[2], textKind, { text: 'Label2' }); }, delay); delay += delayIncrement;
        setTimeout(function () { createInputWithFitBounds(sceneName, sourceNames[3], textKind, { text: 'Label3' }); }, delay); delay += delayIncrement;
        setTimeout(function () { createInputWithFitBounds(sceneName, sourceNames[4], imageKind, { file: '' }); }, delay); delay += delayIncrement;

        // Show success message with instructions
        setTimeout(function () {
            alert('✅ สร้าง Sources สำเร็จ และตั้งค่า Bounds เป็น Fit เรียบร้อย!\n\n' +
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

// ============ NEW HELPERS FOR SHEET SELECTION, GRAPHICS, AUTO CLOSE & FIT BOUNDS ============

function getCardData(card) {
    if (!workbookSheets || workbookSheets.length === 0) return [];
    var sheetName = card.sheetName || workbookSheets[0];
    return workbookData[sheetName] || [];
}

function saveWorkbookToStorage() {
    try {
        localStorage.setItem('l3_workbook_data', JSON.stringify(workbookData));
        localStorage.setItem('l3_workbook_sheets', JSON.stringify(workbookSheets));
    } catch (e) {
        console.warn('Failed to save workbook:', e);
    }
}

function loadWorkbookFromStorage() {
    try {
        var savedData = localStorage.getItem('l3_workbook_data');
        var savedSheets = localStorage.getItem('l3_workbook_sheets');
        if (savedData && savedSheets) {
            workbookData = JSON.parse(savedData);
            workbookSheets = JSON.parse(savedSheets);
            console.log('Loaded workbook from storage:', workbookSheets);
            if (workbookSheets.length > 0) {
                dbData = workbookData[workbookSheets[0]] || [];
            }
            updateImportStatus();
        }
    } catch (e) {
        console.warn('Failed to load workbook:', e);
    }
}

function toggleAutoClose(cardId, checked) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    card.autoCloseEnabled = checked;
    saveCardsToStorage();
}

function changeAutoCloseSec(cardId, value) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    card.autoCloseSec = parseInt(value) || 5;
    saveCardsToStorage();
}

var autoCloseTimeouts = {};
function handleAutoCloseTrigger(cardId, isVisible) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    if (autoCloseTimeouts[cardId]) {
        clearTimeout(autoCloseTimeouts[cardId]);
        delete autoCloseTimeouts[cardId];
    }

    if (isVisible && card.autoCloseEnabled) {
        var sec = card.autoCloseSec !== undefined ? card.autoCloseSec : 5;
        console.log('Scheduling auto-close for card', cardId, 'in', sec, 'seconds');
        autoCloseTimeouts[cardId] = setTimeout(function () {
            console.log('Auto-closing card', cardId);
            const chkId = card.type === 'single' ? 'vis_single_' + cardId : 'vis_double_' + cardId;
            const chk = document.getElementById(chkId);
            if (chk && chk.checked) {
                chk.checked = false;
                if (card.type === 'single') {
                    toggleSingleVisibility(cardId, false);
                } else {
                    toggleDoubleVisibility(cardId, false);
                }
            }
        }, sec * 1000);
    }
}

function createInputWithFitBounds(sceneName, inputName, inputKind, inputSettings) {
    sendOBSRequestWithCallback('CreateInput', {
        sceneName: sceneName,
        inputName: inputName,
        inputKind: inputKind,
        inputSettings: inputSettings
    }, function (err, response) {
        if (err || !response) {
            console.error('Failed to create input:', inputName, err);
            return;
        }
        const sceneItemId = response.sceneItemId;
        console.log('Created input:', inputName, 'sceneItemId:', sceneItemId);

        // Set bounds to Fit to Screen
        sendOBSRequest('SetSceneItemTransform', {
            sceneName: sceneName,
            sceneItemId: sceneItemId,
            sceneItemTransform: {
                boundsType: 'OBS_BOUNDS_SCALE_INNER',
                boundsWidth: 1920,
                boundsHeight: 1080
            }
        });
        console.log('Set bounds to Fit for:', inputName);
    });
}

// Broadcast Channel
const bc = new BroadcastChannel('l3_graphics_channel');

bc.onmessage = function (event) {
    if (event.data && event.data.type === 'REQUEST_STATE') {
        broadcastStateUpdate();
    }
};

function broadcastStateUpdate() {
    const payload = cards.map(function (card) {
        const cardData = getCardData(card);
        let selectedItem = null;
        let selectedItemHome = null;
        let selectedItemAway = null;
        let isVisible = false;

        if (card.type === 'single') {
            const sel = document.getElementById('sel_single_' + card.id);
            const idx = sel ? sel.value : null;
            if (idx !== null && idx !== "" && cardData[idx]) {
                selectedItem = cardData[idx];
            }
            const visChk = document.getElementById('vis_single_' + card.id);
            isVisible = visChk ? visChk.checked : false;
        } else {
            const selHome = document.getElementById('sel_home_' + card.id);
            const selAway = document.getElementById('sel_away_' + card.id);
            const idxHome = selHome ? selHome.value : null;
            const idxAway = selAway ? selAway.value : null;
            if (idxHome !== null && idxHome !== "" && cardData[idxHome]) {
                selectedItemHome = cardData[idxHome];
            }
            if (idxAway !== null && idxAway !== "" && cardData[idxAway]) {
                selectedItemAway = cardData[idxAway];
            }
            const visChk = document.getElementById('vis_double_' + card.id);
            isVisible = visChk ? visChk.checked : false;
        }

        return {
            id: card.id,
            name: card.name,
            type: card.type,
            sheetName: card.sheetName || (workbookSheets[0] || ""),
            graphicsSettings: getCardGraphicsSettings(card),
            isVisible: isVisible,
            selectedItem: selectedItem,
            selectedItemHome: selectedItemHome,
            selectedItemAway: selectedItemAway
        };
    });

    bc.postMessage({
        type: 'STATE_UPDATE',
        cards: payload
    });
}

function toggleGraphicsCollapse() {
    graphicsCollapsed = !graphicsCollapsed;
    const panel = document.getElementById('graphics-settings-panel');
    const arrow = document.getElementById('graphics-collapse-arrow');
    if (panel) panel.style.display = graphicsCollapsed ? 'none' : 'block';
    if (arrow) arrow.textContent = graphicsCollapsed ? '▼' : '▲';
}

function changeCardSheet(cardId, sheetName) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    card.sheetName = sheetName;
    saveCardsToStorage();
    populateDropdowns();
    broadcastStateUpdate();
}

function getCardGraphicsSettings(card) {
    if (!card.graphicsSettings) {
        card.graphicsSettings = {
            enabled: false,
            mode: 'standard',
            bgColor: '#141414',
            bgOpacity: 0.85,
            themeColor: card.type === 'single' ? '#4ade80' : '#fbbf24',
            borderRadius: 6,
            transition: 'slide',
            textColor: '#ffffff',
            fields: {
                id: { show: card.type === 'single', order: 1, width: 40, color: '#888888', size: 12 },
                image: { show: true, order: 2, width: 50, color: '', size: 0 },
                name: { show: true, order: 3, width: 150, color: '#ffffff', size: 16 },
                label1: { show: true, order: 4, width: 120, color: '#aaaaaa', size: 12 },
                label2: { show: false, order: 5, width: 100, color: '#aaaaaa', size: 12 },
                label3: { show: false, order: 6, width: 100, color: '#aaaaaa', size: 12 }
            }
        };
    }
    return card.graphicsSettings;
}

function updateGraphicsSetting(cardId, key, value) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const gs = getCardGraphicsSettings(card);
    gs[key] = value;
    saveCardsToStorage();
    broadcastStateUpdate();
}

function updateGraphicsFieldSetting(cardId, field, key, value) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const gs = getCardGraphicsSettings(card);
    if (!gs.fields[field]) {
        gs.fields[field] = { show: true, order: 1, width: 100, color: '#ffffff', size: 12 };
    }
    gs.fields[field][key] = value;
    saveCardsToStorage();
    broadcastStateUpdate();
}

function toggleImportSource(type) {
    const localContainer = document.getElementById('local-file-container');
    const gsheetContainer = document.getElementById('gsheet-container');
    if (type === 'gsheet') {
        if (localContainer) localContainer.style.display = 'none';
        if (gsheetContainer) gsheetContainer.style.display = 'block';
    } else {
        if (localContainer) localContainer.style.display = 'block';
        if (gsheetContainer) gsheetContainer.style.display = 'none';
    }
    try {
        localStorage.setItem('l3_import_source_type', type);
    } catch (e) {}
}

function loadGoogleSheet() {
    const input = document.getElementById('gsheet-url-input');
    const url = input ? (input.value || '').trim() : '';
    if (!url) {
        alert("กรุณาใส่ลิงก์ Google Sheets");
        return;
    }
    importGoogleSheet(url);
}

function importGoogleSheet(url) {
    const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!matches) {
        alert("ลิงก์ Google Sheets ไม่ถูกต้อง กรุณาใช้ลิงก์ในรูปแบบ https://docs.google.com/spreadsheets/d/.../edit");
        return;
    }
    const spreadsheetId = matches[1];
    
    // Construct export URL
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
    
    console.log("Fetching Google Sheet from:", exportUrl);
    
    // Show loading state in Drop Zone element
    const dropZone = document.getElementById('drop-zone');
    const oldHtml = dropZone ? dropZone.innerHTML : '';
    const statusEl = document.getElementById('import-status');
    
    if (statusEl) {
        statusEl.textContent = 'กำลังโหลด...';
        statusEl.className = 'import-status empty';
    }

    fetch(exportUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("ไม่สามารถโหลดไฟล์ได้ (กรุณาเปิดแชร์ลิงก์เป็นสาธารณะ / Anyone with the link can view)");
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            const data = new Uint8Array(buffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            workbookSheets = workbook.SheetNames || [];
            workbookData = {};

            workbookSheets.forEach(function (sheetName) {
                const sheet = workbook.Sheets[sheetName];
                const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                var processed = rawData.map(function (row, index) {
                    function val(key) {
                        var foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
                        return foundKey ? row[foundKey] : undefined;
                    }

                    var rowId = val('id');
                    var nameVal = val('name') || "";
                    var label1Val = val('labelname1') || val('label1') || "";
                    var label2Val = val('labelname2') || val('label2') || "";
                    var label3Val = val('labelname3') || val('label3') || "";
                    var imageVal = val('image') || "";

                    return {
                        id: rowId,
                        name: nameVal,
                        label1: label1Val,
                        label2: label2Val,
                        label3: label3Val,
                        image: imageVal
                    };
                });

                // Filter out empty rows
                processed = processed.filter(function (item) {
                    return (item.id !== undefined && item.id !== "") ||
                        item.name !== "" ||
                        item.label1 !== "" ||
                        item.label2 !== "" ||
                        item.label3 !== "" ||
                        item.image !== "";
                });

                // Assign IDs to rows without ID
                processed.forEach(function (item, index) {
                    if (item.id === undefined || item.id === "") {
                        item.id = index + 1;
                    }
                });

                // Sort by ID
                processed.sort(function (a, b) {
                    var aNum = parseFloat(a.id);
                    var bNum = parseFloat(b.id);
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return aNum - bNum;
                    }
                    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' });
                });

                workbookData[sheetName] = processed;
            });

            // Compatibility fallback
            if (workbookSheets.length > 0) {
                dbData = workbookData[workbookSheets[0]] || [];
            } else {
                dbData = [];
            }

            console.log('Processed Google Sheets data:', workbookData);

            saveWorkbookToStorage();
            
            try {
                localStorage.setItem('l3_gsheet_url', url);
            } catch (e) {}

            updateImportStatus();
            populateDropdowns();
            broadcastStateUpdate();

            var firstSheetLen = workbookSheets.length > 0 ? workbookData[workbookSheets[0]].length : 0;
            if (dropZone) {
                dropZone.innerHTML = '<div class="drop-zone-icon">✅</div><div style="color:#4ade80; font-weight:bold;">โหลดสำเร็จ: ' + firstSheetLen + ' รายการ</div><div style="font-size:9px; color:#888; margin-top:5px;">คลิกเพื่อเลือกไฟล์ใหม่</div>';
            }
            alert("✅ นำเข้าข้อมูลจาก Google Sheets สำเร็จ!");
        })
        .catch(err => {
            console.error(err);
            alert("เกิดข้อผิดพลาด: " + err.message + "\n\nคำแนะนำ:\n1. ตรวจสอบให้แน่ใจว่าได้ตั้งค่าการแชร์ Google Sheet เป็น 'ทุกคนที่มีลิงก์มีสิทธิ์อ่าน' (Anyone with the link can view)\n2. หรือไปที่ File -> Share -> Publish to web และแชร์แบบ Microsoft Excel (.xlsx) แล้วนำลิงก์นั้นมาวาง");
            updateImportStatus();
        });
}

// ============ GRAPHICS URL DYNAMIC RESOLUTION ============
function getGraphicsUrl() {
    var loc = window.location.href;
    var idx = loc.lastIndexOf('/');
    if (idx !== -1) {
        return loc.substring(0, idx) + '/graphicsl3.html';
    }
    return 'graphicsl3.html';
}

function copyGraphicsUrl(btn) {
    var url = getGraphicsUrl();
    navigator.clipboard.writeText(url).then(function () {
        btn.classList.add('copied');
        var oldText = btn.textContent;
        btn.textContent = '✓';
        setTimeout(function () {
            btn.classList.remove('copied');
            btn.textContent = oldText;
        }, 1500);
    }).catch(function (err) {
        console.error("Failed to copy URL:", err);
    });
}

function copyHelpGraphicsUrl(btn) {
    var url = getGraphicsUrl();
    navigator.clipboard.writeText(url).then(function () {
        var oldText = btn.innerHTML;
        btn.innerHTML = '✓ สำเร็จ';
        btn.style.background = '#2d4a3e';
        btn.style.color = '#4ade80';
        setTimeout(function () {
            btn.innerHTML = oldText;
            btn.style.background = '';
            btn.style.color = '';
        }, 1500);
    }).catch(function (err) {
        console.error("Failed to copy URL:", err);
    });
}

