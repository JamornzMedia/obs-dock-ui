// fcp_v2_assets/main.js

import { translations } from './languages.js';

// --- DOM ELEMENTS ---
const $ = id => document.getElementById(id);
const elements = [
    "nameA", "nameB", "label1", "label2", "label3", "label4", "label5",
    "logoA", "logoB", "initialsA", "initialsB",
    "scoreA", "scoreB",
    "score2Card", "score2A", "score2B", "score2APlusBtn", "score2AMinusBtn", "score2BPlusBtn", "score2BMinusBtn", "resetScore2Btn",
    "swapCard",
    "score2VisibilityCheck", "swapCardVisibilityCheck", "actionCardVisibilityCheck",
    "actionButtonsCard", "actionButtonsGrid",
    "timerText", "halfText", "announcement-text", "matchID",
    "colorA", "colorB", "colorA2", "colorB2",
    "countdownCheck", "languageSelector", "nameA-input", "nameB-input", "excelBtn", "loadBtn",
    "editBtnA", "okBtnA", "editBtnB", "okBtnB", "swapBtn", "scoreAPlusBtn", "scoreAMinusBtn",
    "scoreBPlusBtn", "scoreBMinusBtn", "resetScoreBtn", "fullResetBtn", "halfBtn", "playBtn", "pauseBtn",
    "resetToStartBtn", "editTimeBtn", "settingsBtn", "copyBtn", "helpBtn", "donateBtn",
    "toast-container", "popupOverlay", "detailsPopup", "helpPopup", "donatePopup", "detailsText",
    "welcomeSponsorPopup", "closeWelcomeBtn",
    "copyShopeeLinkBtn", "copyEasyDonateLinkBtn",
    "saveDetailsBtnTop", "closeDetailsBtnTop", "closeDetailsBtnBottom",
    "closeHelpBtn", "closeDonateBtn", "injuryTimeDisplay",
    "injuryTimePlusBtn", "injuryTimeMinusBtn", "resetToZeroBtn", "timeSettingsPopup",
    "startTimeMinutes", "startTimeSeconds", "saveTimeSettingsBtn", "saveAndUpdateTimeBtn", "closeTimeSettingsBtn",
    "timeSettingsError", "changelogBtn", "changelogPopup", "closeChangelogBtn",
    "logoPathBtn", "logoPathPopup", "currentLogoPath", "logoPathInput", "editLogoPathBtn", "closeLogoPathBtn",
    "sourcesTableHeaders", "sourcesTableBody",
    "keybindsTable", "resetKeybindsBtn", "resetColorsBtn",
    "tagsTable",
    "actionSettingsTable",
    "logoDropZone", "clearLogoCacheBtn", "logoCacheList",
    // NEW ELEMENT ID
    "logoDropZone", "clearLogoCacheBtn", "logoCacheList",
    // NEW ELEMENT ID
    "logoCacheCountLabel", "labelCountInput", "maxHalvesSelect", "colorCountSelect",
    "confirmOverlay", "confirmModal", "confirmYesBtn", "confirmNoBtn",
    // V2.8.1 NEW VISIBILITY INPUTS
    "visibility_plus_minus", "visibility_reset_time", "visibility_reset_start", "visibility_edit_time", "visibility_countdown",
    // Online Count
    "onlineCountVal", "onlineMaxVal",
    // Logic Elements
    "injuryTimeContainer", "resetToZeroBtn", "resetToStartBtn", "editTimeBtn"
].reduce((acc, id) => {
    // Safety check for optional elements
    const el = $(id);
    if (el) acc[id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase())] = el;
    return acc;
}, {});


// --- STATE VARIABLES ---
let sheetData = [];
let timer = 0, interval = null, half = '1st';
let injuryTime = 0;
let isCountdown = false;
let countdownStartTime = 2700;
let currentLang = 'th';
let logoFolderPath = 'C:/OBSAssets/logos';
let logoCache = {};
let dataSourceMode = 'excel';
let googleSheetUrl = '';
let userIdentity = JSON.parse(localStorage.getItem('userIdentity') || 'null');
window.userIdentity = userIdentity;

const thaiProvinces = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
    "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
    "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
    "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์",
    "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
    "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร",
    "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู",
    "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort((a, b) => a.localeCompare(b, 'th'));

let masterTeamA = createDefaultTeam('A');
let masterTeamB = createDefaultTeam('B');

const TEAM_COLORS_KEY = 'teamColorMemory';
const VISIBILITY_KEY = 'cardVisibility';
const KEYBINDS_KEY = 'customKeybinds';
const ACTION_SETTINGS_KEY = 'actionButtonSettings';
const LOGO_CACHE_KEY = 'logoDataCache';
const ACTION_BUTTON_COUNT = 6;
let maxHalves = parseInt(localStorage.getItem('maxHalves') || '2'); // Default 2



function createDefaultTeam(teamId) {
    return {
        name: translations[currentLang][`team${teamId}`],
        logoFile: '',
        color1: '#ffffff',
        color2: '#000000',
        score: 0,
        score2: 0,
    };
}

const defaultActionSettings = Array.from({ length: ACTION_BUTTON_COUNT }, (_, i) => ({
    id: `actionBtn${i + 1}`,
    name: `Action ${i + 1}`,
    backgroundColor: (i % 3 === 0) ? '#22c55e' : (i % 3 === 1 ? '#f97316' : '#3b82f6'),
    height: 35,
    targetSource: '',
    actionType: 'Toggle',
    internalState: false,
}));


function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}


// --- OBS ---
const obs = new OBSWebSocket();
const setText = (source, text) => obs.call('SetInputSettings', { inputName: source, inputSettings: { text: String(text) } }).catch(err => { });
const setImage = (sourceName, filename) => {
    if (!filename) {
        obs.call('SetInputSettings', { inputName: sourceName, inputSettings: { file: "" } }).catch(err => { });
        return;
    };
    const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(filename);
    const filePath = `${logoFolderPath}/${filename}${hasExt ? '' : '.png'}`;
    obs.call('SetInputSettings', { inputName: sourceName, inputSettings: { file: filePath } }).catch(err => { });
};
const setSourceColor = (sourceName, hexColor) => {
    const hexToObsColor = (hex) => {
        const cleanHex = hex.substring(1);
        const r = cleanHex.substring(0, 2);
        const g = cleanHex.substring(2, 4);
        const b = cleanHex.substring(4, 6);
        return parseInt("FF" + b + g + r, 16);
    };
    obs.call('SetInputSettings', { inputName: sourceName, inputSettings: { color: hexToObsColor(hexColor) } }).catch(err => { });
};

const setSourceVisibility = (sourceName, visible) => {
    return obs.call('GetCurrentProgramScene')
        .then(data => {
            const activeSceneName = data.currentProgramSceneName;
            return obs.call('GetSceneItemId', {
                sceneName: activeSceneName,
                sourceName: sourceName
            })
                .then(itemData => {
                    return obs.call('SetSceneItemEnabled', {
                        sceneName: activeSceneName,
                        sceneItemId: itemData.sceneItemId,
                        sceneItemEnabled: visible
                    });
                });
        })
        .catch(err => {
            showToast(`${translations[currentLang].toastActionControlFailed} ${sourceName} (${err.code || err.error})`, 'error');
            throw new Error(err.code || err.error);
        });
};


// --- UI & Language ---
const showToast = (message, type = 'info') => {
    elements.toastContainer.innerHTML = ''; // Clear previous toasts
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
};

// --- V2.9.1: Settings Tab Switching ---
const switchSettingsTab = (tabName) => {
    document.querySelectorAll('.settings-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.settings-tab-btn').forEach(el => el.classList.remove('active'));
    const targetPanel = document.getElementById(tabName);
    if (targetPanel) targetPanel.classList.add('active');
    const targetBtn = document.querySelector(`.settings-tab-btn[data-tab="${tabName}"]`);
    if (targetBtn) targetBtn.classList.add('active');
};

// --- V2.9.1: Confirm Reset Dialog ---
const showConfirmReset = () => {
    if (elements.confirmOverlay) elements.confirmOverlay.style.display = 'block';
    if (elements.confirmModal) elements.confirmModal.style.display = 'block';
};

const hideConfirmReset = () => {
    if (elements.confirmOverlay) elements.confirmOverlay.style.display = 'none';
    if (elements.confirmModal) elements.confirmModal.style.display = 'none';
};

// --- V2.9.1: Color Count ---
const applyColorCount = () => {
    const count = parseInt(localStorage.getItem('colorCount') || '2');
    document.querySelectorAll('.color-picker-2').forEach(el => {
        if (count === 1) el.classList.add('color-picker-hidden');
        else el.classList.remove('color-picker-hidden');
    });
    if (elements.colorCountSelect) elements.colorCountSelect.value = count;
};

// --- V2.9.1: OBS Source Creation ---
const OBS_INPUT_KIND_MAP = {
    'Color Source': 'color_source_v3',
    'Image Source': 'image_source',
    'Text (GDI+)': 'text_gdiplus_v3',
};

const createObsSource = async (sourceName, sourceType, btnEl) => {
    const inputKind = OBS_INPUT_KIND_MAP[sourceType];
    if (!inputKind) {
        showToast(`Unknown source type: ${sourceType}`, 'error');
        return false;
    }
    try {
        const sceneData = await obs.call('GetCurrentProgramScene');
        const sceneName = sceneData.currentProgramSceneName;

        // Settings: If text source, set 'text' to sourceName so it's not empty
        const settings = {};
        if (inputKind === 'text_gdiplus_v3' || inputKind === 'text_gdiplus_v2') {
            settings.text = sourceName;
        }

        const response = await obs.call('CreateInput', {
            sceneName: sceneName,
            inputName: sourceName,
            inputKind: inputKind,
            inputSettings: settings,
            sceneItemEnabled: true
        });

        // V2.9.1: Set Transform to Scale to inner bounds
        // OBS WebSocket v5 returns sceneItemId in response
        if (response && response.sceneItemId) {
            await obs.call('SetSceneItemTransform', {
                sceneName: sceneName,
                sceneItemId: response.sceneItemId,
                sceneItemTransform: {
                    boundsType: 'OBS_BOUNDS_SCALE_INNER',
                    boundsWidth: 400, // Default width
                    boundsHeight: 100 // Default height
                }
            });
        }

        showToast(`✅ Created: ${sourceName}`, 'success');
        if (btnEl) {
            btnEl.innerHTML = '<i class="fas fa-check"></i>';
            btnEl.disabled = true;
            btnEl.classList.remove('btn-success');
            btnEl.classList.add('btn-secondary');
        }
        return true;
    } catch (err) {
        const errMsg = err.message || err.code || String(err);
        if (errMsg.includes('already exists') || (err.code === 601)) {
            showToast(`⚠️ ${sourceName} already exists`, 'info');
            if (btnEl) {
                btnEl.innerHTML = '<i class="fas fa-check"></i>';
                btnEl.disabled = true;
                btnEl.classList.remove('btn-success');
                btnEl.classList.add('btn-secondary');
            }
            return true;
        }
        showToast(`❌ Failed: ${sourceName} (${errMsg})`, 'error');
        return false;
    }
};

const createAllObsSources = async (btnEl) => {
    const trans = translations[currentLang] || translations.en;
    const sources = trans.sourcesList || [];
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    }
    let failed = 0;
    for (const item of sources) {
        const rowBtn = document.getElementById(`create-src-${item.code}`);
        const result = await createObsSource(item.code, item.type, rowBtn);
        if (!result) failed++;
    }
    if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = `<i class="fas fa-plus-circle"></i> <span data-lang="createObsSources">${trans.createObsSources}</span>`;
    }
    if (failed === 0) {
        showToast(trans.toastSourcesCreated, 'success');
    } else {
        showToast(trans.toastSourcesFailed, 'error');
    }
};

const openPopup = (popup) => {
    elements.popupOverlay.style.display = 'block';
    popup.style.display = 'block';
};

const closeAllPopups = () => {
    elements.popupOverlay.style.display = 'none';
    elements.detailsPopup.style.display = 'none';
    elements.helpPopup.style.display = 'none';
    elements.donatePopup.style.display = 'none';
    elements.timeSettingsPopup.style.display = 'none';
    elements.changelogPopup.style.display = 'none';
    elements.logoPathPopup.style.display = 'none';
    elements.timeSettingsError.style.display = 'none';
    elements.welcomeSponsorPopup.style.display = 'none';
    // Online Users popup
    const onlinePopup = document.getElementById('onlineUsersPopup');
    if (onlinePopup) onlinePopup.style.display = 'none';
    // Mobile Control popup
    if (document.getElementById('mobileControlPopup')) document.getElementById('mobileControlPopup').style.display = 'none';
    // V2.9.1 Confirm dialog
    hideConfirmReset();
};

const showWelcomePopup = () => {
    if (elements.welcomeSponsorPopup && elements.popupOverlay) {
        elements.popupOverlay.style.display = 'block';
        elements.welcomeSponsorPopup.style.display = 'block';
        const defaultButton = document.getElementById('defaultOpen');
        if (defaultButton) {
            if (typeof openWelcomeTab === 'function') {
                openWelcomeTab({ currentTarget: defaultButton }, 'ShopeeTab');
            } else {
                defaultButton.click();
                document.getElementById('ShopeeTab').style.display = 'block';
            }
        }
    }
};

const closeWelcomePopup = () => {
    if (elements.welcomeSponsorPopup && elements.popupOverlay) {
        elements.welcomeSponsorPopup.style.display = 'none';
        elements.popupOverlay.style.display = 'none';
    }
};

const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
        showToast(translations[currentLang].toastCopied, 'success');
    }).catch(err => {
        showToast(translations[currentLang].toastCopyFailed, 'error');
    });
}

const copySourceName = (sourceName) => {
    navigator.clipboard.writeText(sourceName.trim()).then(() => {
        showToast(`${translations[currentLang].toastCopiedSourceName} ${sourceName}`, 'info');
    }).catch(err => {
        showToast(translations[currentLang].toastCopyFailed, 'error');
    });
}

const copyTag = (tagCode) => {
    const cleanTag = tagCode.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    navigator.clipboard.writeText(cleanTag).then(() => {
        showToast(`${translations[currentLang].toastCopied} Tag: ${tagCode}`, 'info');
    }).catch(err => {
        showToast(translations[currentLang].toastCopyFailed, 'error');
    });
}

const populateHelpTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const sources = trans.sourcesList || [];
    const headers = trans.sourcesTableHeaders || ["Source Name", "Source Type", "Details"];
    elements.sourcesTableHeaders.innerHTML = `
        <th>${headers[0]}</th>
        <th>${headers[1]}</th>
        <th>${headers[2]}</th>
        <th></th>
    `;
    elements.sourcesTableBody.innerHTML = '';
    sources.forEach(item => {
        const row = elements.sourcesTableBody.insertRow();

        // V2.9.1: Styling for Score vs Score2
        if (item.code.startsWith('score2')) {
            row.style.backgroundColor = 'rgba(255, 99, 71, 0.15)'; // Reddish tint for Secondary
        } else if (item.code.startsWith('score')) {
            row.style.backgroundColor = 'rgba(144, 238, 144, 0.15)'; // Greenish tint for Main
        }

        const nameCell = row.insertCell();
        nameCell.textContent = item.code;
        nameCell.onclick = () => copySourceName(item.code);
        row.insertCell().textContent = item.type;
        row.insertCell().innerHTML = item.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // V2.9.1: Create button per source
        const actionCell = row.insertCell();
        const createBtn = document.createElement('button');
        createBtn.id = `create-src-${item.code}`;
        createBtn.className = 'btn-success btn-create-source';
        createBtn.innerHTML = '<i class="fas fa-plus"></i>';
        createBtn.title = `Create ${item.code}`;
        createBtn.onclick = () => createObsSource(item.code, item.type, createBtn);
        actionCell.appendChild(createBtn);
    });
};

const populateTagsTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const tags = trans.tagsList || [];
    const thead = `<thead><tr><th>Tag</th><th>${trans.detailsTitle}</th></tr></thead>`;
    let tbody = '<tbody>';

    // Filter tags: only TeamA, TeamB, and labels 1-5
    const allowedTags = ['{TeamA}', '{TeamB}', '{label1}', '{label2}', '{label3}', '{label4}', '{label5}'];

    tags.forEach(item => {
        if (allowedTags.includes(item.code)) {
            tbody += `
            <tr>
                <td onclick="copyTag('${item.code}')">${item.code}</td>
                <td>${item.desc}</td>
            </tr>
        `;
        }
    });
    tbody += '</tbody>';
    elements.tagsTable.innerHTML = thead + tbody;
}

// --- KEYBINDS LOGIC ---
const formatKey = (keyString) => {
    if (!keyString) return '';
    return keyString.replace(/CONTROL/g, 'Ctrl').replace(/ALT/g, 'Alt').replace(/SHIFT/g, 'Shift').replace(/ /g, 'SPACE');
};

const captureKeyInput = (e, inputElement, saveButton) => {
    e.preventDefault();
    if (e.repeat) return;
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    let key = e.key.toUpperCase();
    if (key === 'CONTROL' || key === 'ALT' || key === 'SHIFT' || key === 'META') {
        key = '';
    } else if (key.length > 1 && !key.startsWith('F') && key !== 'SPACE') {
        key = key;
    }
    const finalKey = [...modifiers, key].filter(k => k).join('+');
    inputElement.value = finalKey;
    saveButton.style.display = 'inline-flex';
}

const toggleKeybindEditMode = (id, enable) => {
    const inputElement = $(`keybind-input-${id}`);
    const editButton = $(`keybind-edit-${id}`);
    const saveButton = $(`keybind-save-${id}`);
    const clearButton = $(`keybind-clear-${id}`); // NEW

    if (!inputElement || !editButton || !saveButton) return;

    if (enable) {
        inputElement.disabled = false;
        editButton.style.display = 'none';
        if (clearButton) clearButton.style.display = 'none'; // Hide Clear when editing
        saveButton.style.display = 'inline-flex';
        inputElement.focus();
        inputElement.onkeydown = null;
        inputElement.onblur = null;
        inputElement.onkeydown = (e) => captureKeyInput(e, inputElement, saveButton);
        inputElement.onblur = () => {
            setTimeout(() => {
                if (document.activeElement !== saveButton) {
                    if (inputElement.disabled === false) {
                        inputElement.disabled = true;
                        editButton.style.display = 'inline-flex';
                        if (clearButton) clearButton.style.display = 'inline-flex';
                        saveButton.style.display = 'none';
                        inputElement.onkeydown = null;
                        // Revert to saved if cancelled? Optional.
                    }
                }
            }, 50);
        };
    } else {
        inputElement.disabled = true;
        editButton.style.display = 'inline-flex';
        if (clearButton) clearButton.style.display = 'inline-flex';
        saveButton.style.display = 'none';
        inputElement.onkeydown = null;
    }
}

const saveKeybind = (id) => {
    const inputElement = $(`keybind-input-${id}`);
    const keyString = inputElement.value.trim().toUpperCase();
    const rawKeyString = keyString.replace(/CTRL/g, 'CONTROL').replace(/ALT/g, 'ALT').replace(/SHIFT/g, 'SHIFT').replace(/SPACE/g, ' ');

    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    savedKeybinds[id] = rawKeyString;
    localStorage.setItem(KEYBINDS_KEY, JSON.stringify(savedKeybinds));
    showToast(translations[currentLang].toastKeybindsSaved, 'success');
}

// NEW FUNCTION: Clear Keybind
const clearKeybind = (id) => {
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    savedKeybinds[id] = ""; // Save as empty string to override default
    localStorage.setItem(KEYBINDS_KEY, JSON.stringify(savedKeybinds));

    // Update UI
    const inputElement = $(`keybind-input-${id}`);
    if (inputElement) inputElement.value = "";

    showToast(translations[currentLang].toastSaved, 'info');
}

const populateKeybindsTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const filteredKeybindsList = trans.keybindsList.filter(item => !item.id.startsWith('actionBtn'));
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    const tbody = elements.keybindsTable.querySelector('tbody');
    tbody.innerHTML = '';

    filteredKeybindsList.forEach(item => {
        // If saved is "", use "", otherwise use saved or default
        let rawKey;
        if (savedKeybinds[item.id] !== undefined) {
            rawKey = savedKeybinds[item.id];
        } else {
            rawKey = item.default;
        }

        const formattedKey = formatKey(rawKey);

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.label}</td>
            <td>
                <input type="text" id="keybind-input-${item.id}" value="${formattedKey}" disabled>
            </td>
            <td>
                <div class="action-buttons">
                    <button id="keybind-edit-${item.id}" class="btn-secondary" title="${trans.edit}"><i class="fas fa-pencil-alt"></i></button>
                    <button id="keybind-clear-${item.id}" class="btn-danger" title="${trans.clear}"><i class="fas fa-trash"></i></button>
                    <button id="keybind-save-${item.id}" class="btn-success" title="${trans.save}" style="display: none;"><i class="fas fa-save"></i></button>
                </div>
            </td>
        `;
        $(`keybind-edit-${item.id}`).onclick = () => toggleKeybindEditMode(item.id, true);
        $(`keybind-clear-${item.id}`).onclick = () => clearKeybind(item.id); // Attach Clear Event
        $(`keybind-save-${item.id}`).onclick = () => {
            saveKeybind(item.id);
            toggleKeybindEditMode(item.id, false);
        };
    });
}

const toggleActionEditMode = (index, enable) => {
    const id = `actionBtn${index}`;
    const nameInput = $(`action-name-${index}`);
    const heightInput = $(`action-height-${index}`);
    const sourceInput = $(`action-source-input-${index}`);
    const actionSelect = $(`action-type-${index}`);
    const editButton = $(`action-edit-${index}`);
    const saveButton = $(`action-save-${index}`);

    if (enable) {
        nameInput.disabled = false;
        heightInput.disabled = false;
        sourceInput.disabled = false;
        actionSelect.disabled = false;
        editButton.style.display = 'none';
        saveButton.style.display = 'inline-flex';
        nameInput.focus();
    } else {
        nameInput.disabled = true;
        heightInput.disabled = true;
        sourceInput.disabled = true;
        actionSelect.disabled = true;
        editButton.style.display = 'inline-flex';
        saveButton.style.display = 'none';
    }
}

const saveActionSettingsRow = (index) => {
    const settings = loadActionSettings().map((setting, i) => {
        const idx = i + 1;
        const nameInput = $(`action-name-${idx}`);
        const colorInput = $(`action-color-${idx}`);
        const heightInput = $(`action-height-${idx}`);
        const sourceInput = $(`action-source-input-${idx}`);
        const actionSelect = $(`action-type-${idx}`);

        return {
            ...setting,
            name: nameInput.value,
            backgroundColor: colorInput.value,
            height: Math.max(25, Math.min(100, parseInt(heightInput.value) || 35)),
            targetSource: sourceInput.value.trim(),
            actionType: actionSelect.value,
        };
    });
    localStorage.setItem(ACTION_SETTINGS_KEY, JSON.stringify(settings));
    renderActionButtons();
    toggleActionEditMode(index, false);
    showToast(translations[currentLang].toastActionSaved, 'success');
}

const loadActionSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem(ACTION_SETTINGS_KEY));
    if (savedSettings && savedSettings.length === ACTION_BUTTON_COUNT) {
        return savedSettings.map((setting, i) => ({
            ...defaultActionSettings[i],
            ...setting,
            targetSource: setting.targetSource || '',
            actionType: setting.actionType || 'Toggle'
        }));
    }
    return defaultActionSettings;
}

const renderActionButtons = () => {
    const settings = loadActionSettings();

    elements.actionButtonsGrid.innerHTML = '';

    settings.forEach((setting, i) => {
        const button = document.createElement('button');
        button.id = setting.id;
        button.textContent = setting.name;
        button.style.backgroundColor = setting.backgroundColor;
        button.style.height = `${setting.height}px`;

        const targetSource = setting.targetSource;
        const actionType = setting.actionType;

        button.onclick = () => {
            if (!targetSource) {
                return showToast('Source Name is missing.', 'error');
            }
            let newState = null;
            if (actionType === 'Show') {
                newState = true;
            } else if (actionType === 'Hide') {
                newState = false;
            } else if (actionType === 'Toggle') {
                const currentState = settings[i].internalState;
                newState = !currentState;
            }

            if (newState !== null) {
                setSourceVisibility(targetSource, newState)
                    .then(() => {
                        if (actionType === 'Toggle') {
                            settings[i].internalState = newState;
                        }
                        showToast(`Source '${targetSource}' set to ${newState ? 'Show' : 'Hide'}`, 'success');
                    })
                    .catch(() => { });
            }
        };
        elements.actionButtonsGrid.appendChild(button);
    });
}

const populateActionSettingsTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const settings = loadActionSettings();
    const actionTableBody = elements.actionSettingsTable.querySelector('tbody');

    actionTableBody.innerHTML = '';
    settings.forEach((setting, i) => {
        const index = i + 1;
        const row = actionTableBody.insertRow();
        row.innerHTML = `
            <td>#${index}</td>
            <td><input type="text" id="action-name-${index}" value="${setting.name}" disabled></td>
            <td><input type="color" id="action-color-${index}" value="${setting.backgroundColor}"></td>
            <td><input type="number" id="action-height-${index}" value="${setting.height}" min="25" max="100" style="width: 55px;" disabled></td>
            <td><input type="text" id="action-source-input-${index}" value="${setting.targetSource}" disabled></td>
            <td>
                <select id="action-type-${index}" disabled>
                    <option value="Toggle" ${setting.actionType === 'Toggle' ? 'selected' : ''}>Toggle</option>
                    <option value="Show" ${setting.actionType === 'Show' ? 'selected' : ''}>Show</option>
                    <option value="Hide" ${setting.actionType === 'Hide' ? 'selected' : ''}>Hide</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button id="action-edit-${index}" class="btn-secondary" title="${trans.edit}"><i class="fas fa-pencil-alt"></i></button>
                    <button id="action-save-${index}" class="btn-success" title="${trans.save}" style="display: none;"><i class="fas fa-save"></i></button>
                </div>
            </td>
        `;
        $(`action-color-${index}`).onchange = (e) => {
            $(`actionBtn${index}`).style.backgroundColor = e.target.value;
        };
        $(`action-edit-${index}`).onclick = () => toggleActionEditMode(index, true);
        $(`action-save-${index}`).onclick = () => saveActionSettingsRow(index);
    });
    window.toggleActionEditMode = toggleActionEditMode;
    window.saveActionSettingsRow = saveActionSettingsRow;

}

// Welcome Screen Logic
window.enterApp = () => {
    const screen = document.getElementById('welcomeScreen');
    if (screen) {
        screen.style.opacity = '0';
        setTimeout(() => {
            screen.style.display = 'none';
        }, 500);
    }
}
window.createAllObsSources = createAllObsSources;


const loadVisibilitySettings = () => {
    const defaultSettings = {
        score2: true,
        swapCard: true,
        actionButtons: true,
        labelCount: 5,
        // V2.9
        showPlusMinus: true,
        showResetTime: true,
        showResetStart: true,
        showEditTime: true,
        showCountdown: true
    };
    const saved = JSON.parse(localStorage.getItem(VISIBILITY_KEY) || '{}');
    return { ...defaultSettings, ...saved };
}

const applyVisibilitySettings = () => {
    const settings = loadVisibilitySettings();
    elements.score2Card.classList.toggle('hidden', !settings.score2);
    elements.swapCard.classList.toggle('hidden', !settings.swapCard);
    elements.actionButtonsCard.classList.toggle('hidden', !settings.actionButtons);
    if (elements.score2VisibilityCheck) elements.score2VisibilityCheck.checked = settings.score2;
    if (elements.swapCardVisibilityCheck) elements.swapCardVisibilityCheck.checked = settings.swapCard;
    if (elements.actionCardVisibilityCheck) elements.actionCardVisibilityCheck.checked = settings.actionButtons;

    // V2.9 Visibility Logic
    if (elements.visibility_plus_minus) elements.visibility_plus_minus.checked = settings.showPlusMinus;
    // showResetTime removed - always visible
    // showResetTime removed - always visible
    if (elements.visibility_reset_start) elements.visibility_reset_start.checked = settings.showResetStart;
    if (elements.visibility_reset_start) elements.visibility_reset_start.checked = settings.showResetStart;
    if (elements.visibility_edit_time) elements.visibility_edit_time.checked = settings.showEditTime;
    if (elements.visibility_countdown) elements.visibility_countdown.checked = settings.showCountdown;

    // Apply to UI Elements
    if (elements.injuryTimeContainer) elements.injuryTimeContainer.style.display = settings.showPlusMinus ? 'flex' : 'none';

    if (elements.resetToZeroBtn) elements.resetToZeroBtn.style.display = 'inline-flex'; // Always visible
    if (elements.resetToStartBtn) elements.resetToStartBtn.style.display = settings.showResetStart ? 'inline-flex' : 'none';
    if (elements.editTimeBtn) elements.editTimeBtn.style.display = settings.showEditTime ? 'inline-flex' : 'none';

    // Countdown checkbox container
    const countdownLabel = elements.countdownCheck ? elements.countdownCheck.closest('label') : null;
    if (countdownLabel) countdownLabel.style.display = settings.showCountdown ? 'flex' : 'none';


    // Label Visibility Control
    const count = settings.labelCount !== undefined ? settings.labelCount : 5;
    if (elements.labelCountInput) elements.labelCountInput.value = count;

    for (let i = 1; i <= 5; i++) {
        const label = elements[`label${i}`];
        if (label) {
            label.style.display = i <= count ? 'block' : 'none';
        }
    }
}

const saveVisibilitySetting = (key, value) => {
    const settings = loadVisibilitySettings();
    settings[key] = value;
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(settings));
    applyVisibilitySettings();
    showToast(translations[currentLang].toastSaved, 'success');
}

const populateDynamicLists = (lang) => {
    populateTagsTable(lang);
    populateActionSettingsTable(lang);
    populateKeybindsTable(lang);
    populateHelpTable(lang);
};

const setLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem('scoreboardLang', lang);
    elements.languageSelector.value = lang;
    document.documentElement.lang = lang;
    const trans = translations[lang] || translations.en;
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (trans[key]) el.textContent = trans[key];
    });
    document.querySelectorAll('[data-lang-title]').forEach(el => {
        const key = el.getAttribute('data-lang-title');
        if (trans[key]) el.title = trans[key];
    });
    document.querySelectorAll('[data-lang-html]').forEach(el => {
        const key = el.getAttribute('data-lang-html');
        if (trans[key]) el.innerHTML = trans[key];
    });

    const editLogoPathBtnSpan = elements.editLogoPathBtn.querySelector('span');
    if (elements.logoPathInput.disabled) {
        editLogoPathBtnSpan.textContent = trans.edit;
    } else {
        editLogoPathBtnSpan.textContent = trans.save;
    }

    masterTeamA.name = masterTeamA.name === translations.en.teamA || masterTeamA.name === translations.th.teamA ? trans.teamA : masterTeamA.name;
    masterTeamB.name = masterTeamB.name === translations.en.teamB || masterTeamB.name === translations.th.teamB ? trans.teamB : masterTeamB.name;

    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2);

    populateDynamicLists(lang);
    populateLogoCacheList(); // Refresh cache list translation/count
};

const getStoredKeybinds = () => {
    const keybindsList = translations[currentLang].keybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    const activeKeybinds = {};
    const filteredKeybindsList = keybindsList.filter(item => !item.id.startsWith('actionBtn'));

    filteredKeybindsList.forEach(item => {
        let key;
        if (savedKeybinds[item.id] !== undefined) {
            key = savedKeybinds[item.id];
        } else {
            key = item.default;
        }

        // Only set if key is not empty
        if (key) {
            activeKeybinds[item.id] = key.trim().toUpperCase();
        }
    });

    return activeKeybinds;
}

const resetKeybinds = () => {
    localStorage.removeItem(KEYBINDS_KEY);
    populateKeybindsTable(currentLang);
    showToast(translations[currentLang].resetKeybinds, 'info');
}

const resetTeamColors = () => {
    localStorage.removeItem(TEAM_COLORS_KEY);
    showToast(translations[currentLang].toastColorsCleared, 'info');
}

const fetchAnnouncement = async () => {
    const filePath = 'fcp_v2_assets/announcement.txt';
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            elements.announcementText.textContent = `Error loading announcement file: ${response.status}`;
            return;
        }
        const text = await response.text();
        elements.announcementText.textContent = text.trim();
    } catch (error) {
        console.error("Announcement fetch failed:", error);
        elements.announcementText.textContent = "Load Failed (Check fcp_v2_assets/announcement.txt)";
    }
};

const saveTeamColors = (teamName, color1, color2) => {
    const defaultNameA = translations[currentLang].teamA;
    const defaultNameB = translations[currentLang].teamB;
    if (!teamName || teamName.replace(/\s/g, '') === defaultNameA || teamName.replace(/\s/g, '') === defaultNameB) return;
    try {
        const colors = JSON.parse(localStorage.getItem(TEAM_COLORS_KEY) || '{}');
        colors[teamName.replace(/\//g, ' ').trim()] = { color1, color2 };
        localStorage.setItem(TEAM_COLORS_KEY, JSON.stringify(colors));
    } catch (e) {
        console.error("Failed to save team colors:", e);
    }
};

const loadTeamColors = (teamName) => {
    try {
        const colors = JSON.parse(localStorage.getItem(TEAM_COLORS_KEY) || '{}');
        return colors[teamName.replace(/\//g, ' ').trim()];
    } catch (e) {
        console.error("Failed to load team colors:", e);
        return null;
    }
};

const loadLogoCache = () => {
    try {
        logoCache = JSON.parse(localStorage.getItem(LOGO_CACHE_KEY) || '{}');
    } catch (e) {
        console.error("Failed to load logo cache:", e);
        logoCache = {};
    }
}

const saveLogoCache = () => {
    try {
        localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(logoCache));
        populateLogoCacheList();
    } catch (e) {
        showToast(translations[currentLang].toastCacheSaveFailed, 'error');
        console.error("Failed to save logo to cache:", e);
    }
}

const clearLogoCache = () => {
    logoCache = {};
    localStorage.removeItem(LOGO_CACHE_KEY);
    populateLogoCacheList();
    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2);
    showToast(translations[currentLang].toastCacheCleared, 'info');
}

const populateLogoCacheList = () => {
    elements.logoCacheList.innerHTML = '';
    const keys = Object.keys(logoCache);

    // Update Count Label
    if (elements.logoCacheCountLabel) {
        elements.logoCacheCountLabel.textContent = `(${keys.length} ${translations[currentLang].logoCacheTotal})`;
    }

    if (keys.length === 0) {
        elements.logoCacheList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted-color);">${translations[currentLang].logoCacheEmpty}</p>`;
        return;
    }

    keys.forEach(key => {
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 0.9rem; padding: 5px; border-radius: 4px; cursor: pointer; transition: background 0.2s;';
        const img = document.createElement('img');
        img.src = logoCache[key];
        img.alt = key;
        img.style.cssText = 'width: 24px; height: 24px; object-fit: contain; border-radius: 4px;';
        const span = document.createElement('span');
        span.textContent = key;
        li.appendChild(img);
        li.appendChild(span);

        li.onclick = () => {
            Array.from(elements.logoCacheList.children).forEach(c => c.style.backgroundColor = '');
            li.style.backgroundColor = 'var(--accent-color)';
            copySourceName(key); // Copy name on click
        };

        elements.logoCacheList.appendChild(li);
    });
}

// --- UPDATED LOGO CACHE HANDLERS (BATCH PROCESSING) ---
const handleFileDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.logoDropZone.style.backgroundColor = 'var(--card-bg-color)';

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    let successCount = 0;
    let failCount = 0;
    const trans = translations[currentLang];

    // Show processing toast (optional, but good UX)
    showToast("Processing logos...", "info");

    const promises = files.map(file => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                failCount++;
                resolve();
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const fileName = file.name.replace(/\.(png|jpe?g|gif|webp)$/i, '');
                const logoKey = fileName.replace(/\s/g, '').toLowerCase();
                logoCache[logoKey] = event.target.result;
                successCount++;
                resolve();
            };
            reader.onerror = () => {
                failCount++;
                resolve();
            };
            reader.readAsDataURL(file);
        });
    });

    await Promise.all(promises);

    if (successCount > 0) {
        saveLogoCache();
    }

    // Summary Toast
    const summaryMsg = `${trans.logoCacheSummary} ${trans.logoCacheSuccess} ${successCount}, ${trans.logoCacheFailed} ${failCount}`;
    showToast(summaryMsg, successCount > 0 ? 'success' : 'error');
}

const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.logoDropZone.style.backgroundColor = '#4a4a4a';
}

const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.logoDropZone.style.backgroundColor = 'var(--card-bg-color)';
}
// --- END LOGO CACHE LOGIC ---


// --- Scoreboard Logic ---
const getTeamInitials = (name) => name ? (name.split(' ').filter(Boolean).length >= 2 ? (name.split(' ')[0][0] + name.split(' ')[1][0]) : name.substring(0, 2)).toUpperCase() : '';

const updateTeamUI = (team, name, logoFile, color1, color2, score, score2) => {
    const isA = team === 'A';
    const masterTeam = isA ? masterTeamA : masterTeamB;
    masterTeam.name = name;
    masterTeam.logoFile = logoFile;
    masterTeam.color1 = color1;
    masterTeam.color2 = color2;
    masterTeam.score = score !== undefined ? score : masterTeam.score;
    masterTeam.score2 = score2 !== undefined ? score2 : masterTeam.score2;

    const obsNameSource = isA ? 'name_team_a' : 'name_team_b';
    const obsLogoSource = isA ? 'logo_team_a' : 'logo_team_b';
    const obsColorSource1 = isA ? 'Color_Team_A' : 'Color_Team_B';
    const obsColorSource2 = isA ? 'Color_Team_A_2' : 'Color_Team_B_2';
    const obsScoreSource = isA ? 'score_team_a' : 'score_team_b';
    const obsScore2Source = isA ? 'score2_team_a' : 'score2_team_b';

    const nameEl = isA ? elements.nameA : elements.nameB;
    const logoEl = isA ? elements.logoA : elements.logoB;
    const initialsEl = isA ? elements.initialsA : elements.initialsB;
    const colorEl1 = isA ? elements.colorA : elements.colorB;
    const colorEl2 = isA ? elements.colorA2 : elements.colorB2;
    const scoreEl = isA ? elements.scoreA : elements.scoreB;
    const score2El = isA ? elements.score2A : elements.score2B;

    nameEl.innerHTML = masterTeam.name.replace(/\//g, '<br>');
    colorEl1.value = masterTeam.color1;
    colorEl2.value = masterTeam.color2;
    initialsEl.textContent = getTeamInitials(masterTeam.name.replace(/\//g, ' '));
    scoreEl.textContent = masterTeam.score;
    score2El.textContent = masterTeam.score2;

    if (masterTeam.logoFile) {
        const logoNameClean = masterTeam.logoFile.replace(/\s/g, '').toLowerCase().replace(/\.(png|jpe?g|gif|webp)$/i, '');

        let foundKey = null;
        if (logoCache[logoNameClean]) {
            foundKey = logoNameClean;
        } else {
            // Prefix Match Strategy
            const keys = Object.keys(logoCache);
            foundKey = keys.find(k => k.startsWith(logoNameClean + '.') || k === logoNameClean);
        }

        if (foundKey && logoCache[foundKey]) {
            logoEl.src = logoCache[foundKey];
            logoEl.style.display = 'block';
            initialsEl.style.display = 'none';
        } else {
            const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(masterTeam.logoFile);
            logoEl.src = `file:///${logoFolderPath}/${masterTeam.logoFile}${hasExt ? '' : '.png'}`;
            logoEl.style.display = 'block';
            initialsEl.style.display = 'none';
        }
    } else {
        logoEl.src = '';
        logoEl.style.display = 'none';
        initialsEl.style.display = 'block';
    }

    setText(obsNameSource, masterTeam.name.replace(/\//g, '\n'));
    setImage(obsLogoSource, masterTeam.logoFile);
    setSourceColor(obsColorSource1, masterTeam.color1);
    setSourceColor(obsColorSource2, masterTeam.color2);
    setText(obsScoreSource, masterTeam.score);
    setText(obsScore2Source, masterTeam.score2);
    saveTeamColors(masterTeam.name, masterTeam.color1, masterTeam.color2);
};

const applyMatch = () => {
    if (!sheetData.length) return showToast(translations[currentLang].toastLoadFileFirst, 'error');
    const id = parseInt(elements.matchID.value);
    const header = sheetData[0];
    const match = sheetData.slice(1).find(r => parseInt(r[0]) === id);
    if (!match) return showToast(`${translations[currentLang].toastMatchNotFound} ${id}`, 'error');
    const get = key => match[header.indexOf(key)] || '';
    let teamAName = get('TeamA') || translations[currentLang].teamA;
    let teamBName = get('TeamB') || translations[currentLang].teamB;
    let colorA1 = get('ColorA') || '#ffffff';
    let colorB1 = get('ColorB') || '#ffffff';
    let colorA2 = get('ColorA2') || '#000000';
    let colorB2 = get('ColorB2') || '#000000';
    let logoAFile = get('LogoA');
    let logoBFile = get('LogoB');
    const savedColorA = loadTeamColors(teamAName);
    if (savedColorA) { colorA1 = savedColorA.color1; colorA2 = savedColorA.color2; }
    const savedColorB = loadTeamColors(teamBName);
    if (savedColorB) { colorB1 = savedColorB.color1; colorB2 = savedColorB.color2; }
    updateTeamUI('A', teamAName, logoAFile, colorA1, colorA2, masterTeamA.score, masterTeamA.score2);
    updateTeamUI('B', teamBName, logoBFile, colorB1, colorB2, masterTeamB.score, masterTeamB.score2);
    elements.label1.textContent = get('label1');
    elements.label2.textContent = get('label2');
    elements.label3.textContent = get('label3');
    elements.label4.textContent = get('label4');
    elements.label5.textContent = get('label5');
    setText('label_1', get('label1'));
    setText('label_2', get('label2'));
    setText('label_3', get('label3'));
    setText('label_4', get('label4'));
    setText('label_5', get('label5'));
    showToast(`${translations[currentLang].toastLoaded} ${id}`, 'success');
};

const swapTeams = () => {
    [masterTeamA, masterTeamB] = [masterTeamB, masterTeamA];
    const tempA = { ...masterTeamA };
    const tempB = { ...masterTeamB };
    updateTeamUI('A', tempA.name, tempA.logoFile, tempA.color1, tempA.color2, tempA.score, tempA.score2);
    updateTeamUI('B', tempB.name, tempB.logoFile, tempB.color1, tempB.color2, tempB.score, tempB.score2);
    showToast(translations[currentLang].toastSwapped, 'info');
};

const changeScore = (team, delta) => {
    const masterTeam = team === 'A' ? masterTeamA : masterTeamB;
    masterTeam.score = Math.max(0, masterTeam.score + delta);
    updateTeamUI(team, masterTeam.name, masterTeam.logoFile, masterTeam.color1, masterTeam.color2, masterTeam.score, masterTeam.score2);
};

const changeScore2 = (team, delta) => {
    const masterTeam = team === 'A' ? masterTeamA : masterTeamB;
    masterTeam.score2 = Math.max(0, masterTeam.score2 + delta);
    updateTeamUI(team, masterTeam.name, masterTeam.logoFile, masterTeam.color1, masterTeam.color2, masterTeam.score, masterTeam.score2);
};

const resetScore = () => {
    masterTeamA.score = masterTeamB.score = 0;
    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2, 0, masterTeamA.score2);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2, 0, masterTeamB.score2);
    showToast(translations[currentLang].toastScoreReset, 'info');
};

const resetScore2 = () => {
    masterTeamA.score2 = masterTeamB.score2 = 0;
    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2, masterTeamA.score, 0);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2, masterTeamB.score, 0);
    showToast(translations[currentLang].toastScore2Reset, 'info');
};

const fullReset = () => {
    masterTeamA.score = masterTeamB.score = 0;
    masterTeamA.score2 = masterTeamB.score2 = 0;
    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2, 0, 0);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2, 0, 0);
    stopTimer();
    timer = 0;
    half = '1st';
    injuryTime = 0;
    updateTimerDisplay();
    updateInjuryTimeDisplay();
    elements.halfText.textContent = half;
    setText('half_text', half);
    showToast(translations[currentLang].toastFullReset, 'info');
};

const updateTimerDisplay = () => {
    const m = String(Math.floor(timer / 60)).padStart(2, '0');
    const s = String(timer % 60).padStart(2, '0');
    const timeString = `${m}:${s}`;
    elements.timerText.textContent = timeString;
    setText('time_counter', timeString);
};

const startTimer = () => {
    if (interval) return;
    // V2.9.1: Timer state color
    elements.timerText.classList.add('timer-running');
    elements.timerText.classList.remove('timer-paused');
    interval = setInterval(() => {
        if (isCountdown) {
            if (timer > 0) timer--;
            else stopTimer();
        } else {
            timer++;
        }
        updateTimerDisplay();
    }, 1000);
};

const stopTimer = () => {
    clearInterval(interval);
    interval = null;
    // V2.9.1: Timer state color
    elements.timerText.classList.remove('timer-running');
    elements.timerText.classList.add('timer-paused');
};

const resetToStartTime = () => {
    stopTimer();
    timer = countdownStartTime;
    injuryTime = 0;
    updateTimerDisplay();
    updateInjuryTimeDisplay();
};

const resetToZero = () => {
    stopTimer();
    timer = 0;
    injuryTime = 0;
    updateTimerDisplay();
    updateInjuryTimeDisplay();
}

const openTimeSettings = () => {
    const minutes = Math.floor(countdownStartTime / 60);
    const seconds = countdownStartTime % 60;
    elements.startTimeMinutes.value = minutes;
    elements.startTimeSeconds.value = seconds;
    openPopup(elements.timeSettingsPopup);
};

const validateAndGetTime = () => {
    const trans = translations[currentLang] || translations.en;
    const minutes = parseInt(elements.startTimeMinutes.value, 10);
    const seconds = parseInt(elements.startTimeSeconds.value, 10);
    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds > 59) {
        elements.timeSettingsError.textContent = trans.toastInvalidTime;
        elements.timeSettingsError.style.display = 'block';
        return null;
    }
    return (minutes * 60) + seconds;
}

const saveTimeSettings = () => {
    const newTime = validateAndGetTime();
    if (newTime === null) return;
    countdownStartTime = newTime;
    localStorage.setItem('countdownStartTime', countdownStartTime);
    closeAllPopups();
    showToast(translations[currentLang].toastSaved, 'success');
};

const saveAndUpdateTime = () => {
    const newTime = validateAndGetTime();
    if (newTime === null) return;
    countdownStartTime = newTime;
    localStorage.setItem('countdownStartTime', countdownStartTime);
    timer = newTime;
    updateTimerDisplay();
    closeAllPopups();
    showToast(translations[currentLang].toastTimeSet, 'success');
}

const toggleHalf = () => {
    const halves = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    // Limit halves array based on maxHalves
    // V2.9.1: Fix slice logic if maxHalves is undefined or logic slightly off
    const limit = maxHalves || 2;
    const activeHalves = halves.slice(0, limit);

    let currentIndex = activeHalves.indexOf(half);
    if (currentIndex === -1) currentIndex = 0;

    let nextIndex = (currentIndex + 1) % activeHalves.length;
    half = activeHalves[nextIndex];

    // V2.9.1: Styled Half Text
    // "1st" -> 1st <span class="half-label">Half</span>
    const ordinal = half;
    const html = `<span class="half-ordinal">${ordinal}</span><span class="half-label">Half</span>`;

    elements.halfText.innerHTML = html;
    setText('half_text', half);
};

const updateInjuryTimeDisplay = () => {
    const displayString = injuryTime > 0 ? `+${injuryTime}` : '+0';
    elements.injuryTimeDisplay.textContent = displayString;
    setText('injury_time_text', displayString);
};

const changeInjuryTime = (delta) => {
    injuryTime = Math.max(0, injuryTime + delta);
    updateInjuryTimeDisplay();
};

const handleExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                showToast(translations[currentLang].toastSuccess, 'success');
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
};

const fetchGoogleSheet = async () => {
    if (!googleSheetUrl) return showToast(translations[currentLang].toastGoogleSheetError, 'error');

    // Extract ID (basic regex for standard URLs)
    const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return showToast(translations[currentLang].toastGoogleSheetError, 'error');
    const docId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;

    try {
        const loadingToast = document.createElement('div');
        loadingToast.className = 'toast info';
        loadingToast.textContent = "Fetching Google Sheet...";
        elements.toastContainer.appendChild(loadingToast);

        const response = await fetch(exportUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const csvText = await response.text();

        // Remove loading toast
        loadingToast.remove();

        const workbook = XLSX.read(csvText, { type: 'string', raw: true });
        const sheetName = workbook.SheetNames[0];
        sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        showToast(translations[currentLang].toastGoogleSheetSuccess, 'success');
        // Auto-refresh match data if ID matches
        const currentId = parseInt(elements.matchID.value);
        if (sheetData.length > 1) {
            // Optional: could auto-apply match here
        }

    } catch (e) {
        console.error(e);
        showToast(translations[currentLang].toastGoogleSheetError, 'error');
    }
}

const handleDataSourceAction = () => {
    if (dataSourceMode === 'gsheet') {
        fetchGoogleSheet();
    } else {
        handleExcel();
    }
};

const setDataSourceMode = (mode) => {
    dataSourceMode = mode;
    localStorage.setItem('dataSourceMode', mode);

    const isGSheet = mode === 'gsheet';
    const gsheetSettings = document.getElementById('gsheetSettings');
    const excelSettings = document.getElementById('excelSettings'); // V2.9.1

    if (gsheetSettings) gsheetSettings.style.display = isGSheet ? 'block' : 'none';
    if (excelSettings) excelSettings.style.display = isGSheet ? 'none' : 'block'; // V2.9.1

    const btnSpan = elements.excelBtn.querySelector('span');
    const trans = translations[currentLang];

    if (isGSheet) {
        // btnSpan.textContent = trans.loadFromGoogleSheet || "Fetch GS";
        btnSpan.setAttribute('data-lang', 'loadFromGoogleSheet');
        elements.excelBtn.innerHTML = `<i class="fas fa-cloud-download-alt"></i> <span data-lang="loadFromGoogleSheet">${trans.loadFromGoogleSheet || "Fetch GS"}</span>`;
    } else {
        // btnSpan.textContent = trans.excel;
        btnSpan.setAttribute('data-lang', 'excel');
        elements.excelBtn.innerHTML = `<i class="fas fa-file-excel"></i> <span data-lang="excel">${trans.excel}</span>`;
    }
};

// V2.9.1: Copy Excel Column List
window.copyExcelColumns = () => {
    const list = document.getElementById('excelColumnList');
    if (list) {
        list.select();
        list.setSelectionRange(0, 99999);
        // Replace ", " with "\t" for Excel column pasting
        const textToCopy = list.value.replace(/, /g, '\t');
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast(translations[currentLang].toastCopied, 'success');
        });
    }
};

const copyDetails = () => {
    const template = localStorage.getItem('detailsText') || '';
    if (!template.trim()) return showToast(translations[currentLang].toastNoTextToCopy, 'error');
    let teamAName = masterTeamA.name.replace(/\//g, ' ');
    let teamBName = masterTeamB.name.replace(/\//g, ' ');
    const filled = template
        .replace(/<TeamA>/gi, teamAName)
        .replace(/<TeamB>/gi, teamBName)
        .replace(/<label1>/gi, elements.label1.textContent)
        .replace(/<label2>/gi, elements.label2.textContent)
        .replace(/<label3>/gi, elements.label3.textContent)
        .replace(/<label4>/gi, elements.label4.textContent)
        .replace(/<label5>/gi, elements.label5.textContent)
        .replace(/<score_team_a>/gi, masterTeamA.score)
        .replace(/<score_team_b>/gi, masterTeamB.score)
        .replace(/<score2_team_a>/gi, masterTeamA.score2)
        .replace(/<score2_team_b>/gi, masterTeamB.score2)
        .replace(/<time_counter>/gi, elements.timerText.textContent)
        .replace(/<half_text>/gi, elements.halfText.textContent);
    navigator.clipboard.writeText(filled).then(() => showToast(translations[currentLang].toastCopied, 'info')).catch(err => showToast(translations[currentLang].toastCopyFailed, 'error'));
};

const enterEditMode = (team) => {
    const isA = team === 'A';
    const masterTeam = isA ? masterTeamA : masterTeamB;
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;
    nameDiv.style.display = 'none';
    editBtn.style.display = 'none';
    nameInput.value = masterTeam.name.replace(/\//g, '/');
    nameInput.style.display = 'block';
    okBtn.style.display = 'inline-flex';
    nameInput.focus();
    // V2.9.1: Enter/Escape key support
    nameInput.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); exitEditMode(team, true); }
        else if (e.key === 'Escape') { e.preventDefault(); exitEditMode(team, false); }
    };
};

const exitEditMode = (team, applyChanges) => {
    const isA = team === 'A';
    const masterTeam = isA ? masterTeamA : masterTeamB;
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;
    if (applyChanges) {
        const newName = nameInput.value.trim() || masterTeam.name;
        updateTeamUI(team, newName, masterTeam.logoFile, masterTeam.color1, masterTeam.color2);
    }
    nameDiv.style.display = 'block';
    editBtn.style.display = 'inline-flex';
    nameInput.style.display = 'none';
    okBtn.style.display = 'none';
};

const setupEventListeners = () => {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.getAttribute('id')?.startsWith('keybind-input') || e.target.getAttribute('id')?.startsWith('action-source-input')) return;

        const keybinds = getStoredKeybinds();
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('CONTROL');
        if (e.altKey) modifiers.push('ALT');
        if (e.shiftKey) modifiers.push('SHIFT');

        let key = e.key.toUpperCase();
        if (key === 'CONTROL' || key === 'ALT' || key === 'SHIFT') {
            key = '';
        } else if (key.length > 1 && !key.startsWith('F') && key !== 'SPACE') {
            if (key === ' ') key = 'SPACE';
        }

        if (!key && modifiers.length === 0) return;

        const keyCombination = [...modifiers, key].filter(k => k).join('+');

        let action = null;
        for (const [id, storedCombination] of Object.entries(keybinds)) {
            if (storedCombination === keyCombination) {
                action = id;
                break;
            }
        }

        if (action) {
            e.preventDefault();
            switch (action) {
                case 'scoreA_plus': changeScore('A', 1); break;
                case 'scoreA_minus': changeScore('A', -1); break;
                case 'scoreB_plus': changeScore('B', 1); break;
                case 'scoreB_minus': changeScore('B', -1); break;
                case 'score2A_plus': changeScore2('A', 1); break;
                case 'score2A_minus': changeScore2('A', -1); break;
                case 'score2B_plus': changeScore2('B', 1); break;
                case 'score2B_minus': changeScore2('B', -1); break;
                case 'timer_playpause': if (interval) { stopTimer(); } else { startTimer(); }; break;
                case 'timer_resetstart': resetToStartTime(); break;
                case 'timer_togglehalf': toggleHalf(); break;
                case 'full_reset': showConfirmReset(); break;
                default: return;
            }
        }
    });

    const saveHandler = () => {
        localStorage.setItem('detailsText', elements.detailsText.value);
        const actionSettings = loadActionSettings().map((setting, i) => {
            const idx = i + 1;
            const nameInput = $(`action-name-${idx}`);
            const colorInput = $(`action-color-${idx}`);
            const heightInput = $(`action-height-${idx}`);
            const sourceInput = $(`action-source-input-${idx}`);
            const actionSelect = $(`action-type-${idx}`);
            return {
                ...setting,
                name: nameInput.value,
                backgroundColor: colorInput.value,
                height: Math.max(25, Math.min(100, parseInt(heightInput.value) || 35)),
                targetSource: sourceInput.value.trim(),
                actionType: actionSelect.value,
            };
        });
        localStorage.setItem(ACTION_SETTINGS_KEY, JSON.stringify(actionSettings));
        renderActionButtons();
        closeAllPopups();
        showToast(translations[currentLang].toastSaved, 'success');
    };
    elements.saveDetailsBtnTop.addEventListener('click', saveHandler);

    const closeHandler = () => {
        const keybindsList = translations[currentLang].keybindsList || [];
        keybindsList.forEach(item => toggleKeybindEditMode(item.id, false));
        loadActionSettings().forEach((_, i) => toggleActionEditMode(i + 1, false));
        closeAllPopups();
    };
    if (elements.closeDetailsBtnTop) elements.closeDetailsBtnTop.addEventListener('click', closeHandler);
    if (elements.closeDetailsBtnBottom) elements.closeDetailsBtnBottom.addEventListener('click', closeHandler);

    elements.languageSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    elements.excelBtn.addEventListener('click', handleDataSourceAction);

    // NEW LISTENERS FOR DATA SOURCE
    document.querySelectorAll('input[name="dataSource"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            setDataSourceMode(e.target.value);
        });
    });

    const saveGSheetBtn = document.getElementById('saveGSheetBtn');
    if (saveGSheetBtn) {
        saveGSheetBtn.addEventListener('click', () => {
            const input = document.getElementById('gsheetUrlInput');
            if (input) {
                const url = input.value.trim();
                if (url) {
                    googleSheetUrl = url;
                    localStorage.setItem('googleSheetUrl', url);
                    showToast(translations[currentLang].toastSaved, 'success');
                }
            }
        });
    }
    elements.loadBtn.addEventListener('click', applyMatch);
    elements.fullResetBtn.addEventListener('click', showConfirmReset);
    // V2.9.1: Confirm dialog buttons
    if (elements.confirmYesBtn) elements.confirmYesBtn.addEventListener('click', () => { fullReset(); hideConfirmReset(); });
    if (elements.confirmNoBtn) elements.confirmNoBtn.addEventListener('click', hideConfirmReset);
    if (elements.confirmOverlay) elements.confirmOverlay.addEventListener('click', hideConfirmReset);
    elements.swapBtn.addEventListener('click', swapTeams);
    elements.scoreAPlusBtn.addEventListener('click', () => changeScore('A', 1));
    elements.scoreAMinusBtn.addEventListener('click', () => changeScore('A', -1));
    elements.scoreBPlusBtn.addEventListener('click', () => changeScore('B', 1));
    elements.scoreBMinusBtn.addEventListener('click', () => changeScore('B', -1));
    elements.resetScoreBtn.addEventListener('click', resetScore);

    elements.score2APlusBtn.addEventListener('click', () => changeScore2('A', 1));
    elements.score2AMinusBtn.addEventListener('click', () => changeScore2('A', -1));
    elements.score2BPlusBtn.addEventListener('click', () => changeScore2('B', 1));
    elements.score2BMinusBtn.addEventListener('click', () => changeScore2('B', -1));
    elements.resetScore2Btn.addEventListener('click', resetScore2);

    elements.score2VisibilityCheck.addEventListener('change', (e) => saveVisibilitySetting('score2', e.target.checked));
    elements.swapCardVisibilityCheck.addEventListener('change', (e) => saveVisibilitySetting('swapCard', e.target.checked));
    elements.actionCardVisibilityCheck.addEventListener('change', (e) => saveVisibilitySetting('actionButtons', e.target.checked));

    // V2.8.1 Listeners
    if (elements.visibility_plus_minus) elements.visibility_plus_minus.addEventListener('change', (e) => saveVisibilitySetting('showPlusMinus', e.target.checked));
    if (elements.visibility_reset_time) elements.visibility_reset_time.addEventListener('change', (e) => saveVisibilitySetting('showResetTime', e.target.checked));
    if (elements.visibility_reset_start) elements.visibility_reset_start.addEventListener('change', (e) => saveVisibilitySetting('showResetStart', e.target.checked));
    if (elements.visibility_edit_time) elements.visibility_edit_time.addEventListener('change', (e) => saveVisibilitySetting('showEditTime', e.target.checked));
    if (elements.visibility_countdown) elements.visibility_countdown.addEventListener('change', (e) => saveVisibilitySetting('showCountdown', e.target.checked));

    if (elements.labelCountInput) {
        elements.labelCountInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (val < 0) val = 0;
            if (val > 5) val = 5; // Enforce max
            saveVisibilitySetting('labelCount', val);
        });
    }

    elements.resetKeybindsBtn.addEventListener('click', resetKeybinds);
    elements.resetColorsBtn.addEventListener('click', resetTeamColors);

    elements.halfBtn.addEventListener('click', toggleHalf);
    elements.playBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', stopTimer);
    elements.resetToStartBtn.addEventListener('click', resetToStartTime);
    elements.resetToZeroBtn.addEventListener('click', resetToZero);
    elements.editTimeBtn.addEventListener('click', openTimeSettings);
    elements.countdownCheck.addEventListener('change', () => { isCountdown = elements.countdownCheck.checked; });
    // V2.9.1: Settings Tab click handlers
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSettingsTab(btn.getAttribute('data-tab')));
    });
    // V2.9.1: Color Count listener
    if (elements.colorCountSelect) {
        elements.colorCountSelect.addEventListener('change', (e) => {
            localStorage.setItem('colorCount', e.target.value);
            applyColorCount();
        });
    }
    elements.settingsBtn.addEventListener('click', () => {
        elements.detailsText.value = localStorage.getItem('detailsText') || '';
        if (elements.maxHalvesSelect) elements.maxHalvesSelect.value = maxHalves; // NEW: Set value
        populateActionSettingsTable(currentLang);
        populateKeybindsTable(currentLang);
        applyVisibilitySettings();
        applyColorCount();
        openPopup(elements.detailsPopup);
    });
    elements.copyBtn.addEventListener('click', copyDetails);
    elements.helpBtn.addEventListener('click', () => openPopup(elements.helpPopup));
    elements.donateBtn.addEventListener('click', () => openPopup(elements.donatePopup));
    elements.changelogBtn.addEventListener('click', () => openPopup(elements.changelogPopup));
    elements.popupOverlay.addEventListener('click', closeAllPopups);

    elements.closeHelpBtn.addEventListener('click', closeAllPopups);
    elements.closeDonateBtn.addEventListener('click', closeAllPopups);
    elements.closeChangelogBtn.addEventListener('click', closeAllPopups);
    elements.closeTimeSettingsBtn.addEventListener('click', closeAllPopups);
    elements.closeLogoPathBtn.addEventListener('click', closeAllPopups);
    elements.closeWelcomeBtn.addEventListener('click', closeWelcomePopup);

    elements.copyShopeeLinkBtn.addEventListener('click', () => copyLink(elements.copyShopeeLinkBtn.getAttribute('data-link')));
    elements.copyEasyDonateLinkBtn.addEventListener('click', () => copyLink(elements.copyEasyDonateLinkBtn.getAttribute('data-link')));

    elements.saveTimeSettingsBtn.addEventListener('click', saveTimeSettings);
    elements.saveAndUpdateTimeBtn.addEventListener('click', saveAndUpdateTime);

    elements.editBtnA.addEventListener('click', () => enterEditMode('A'));
    elements.okBtnA.addEventListener('click', () => exitEditMode('A', true));
    elements.editBtnB.addEventListener('click', () => enterEditMode('B'));
    elements.okBtnB.addEventListener('click', () => exitEditMode('B', true));

    elements.colorA.addEventListener('input', debounce((e) => {
        updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, e.target.value, masterTeamA.color2);
    }, 300)); // Debounce 300ms
    elements.colorA2.addEventListener('input', debounce((e) => {
        updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, e.target.value);
    }, 300));
    elements.colorB.addEventListener('input', debounce((e) => {
        updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, e.target.value, masterTeamB.color2);
    }, 300));
    elements.colorB2.addEventListener('input', debounce((e) => {
        updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, e.target.value);
    }, 300));

    elements.injuryTimePlusBtn.addEventListener('click', () => changeInjuryTime(1));
    elements.injuryTimeMinusBtn.addEventListener('click', () => changeInjuryTime(-1));

    elements.logoPathBtn.addEventListener('click', () => {
        populateLogoCacheList();
        openPopup(elements.logoPathPopup);
    });
    elements.editLogoPathBtn.addEventListener('click', () => {
        const trans = translations[currentLang] || translations.en;
        const btnSpan = elements.editLogoPathBtn.querySelector('span');
        if (elements.logoPathInput.disabled) {
            elements.logoPathInput.disabled = false;
            elements.logoPathInput.focus();
            btnSpan.textContent = trans.save;
        } else {
            const newPath = elements.logoPathInput.value.trim();
            logoFolderPath = newPath;
            localStorage.setItem('logoFolderPath', newPath);
            elements.currentLogoPath.textContent = newPath;
            elements.logoPathInput.disabled = true;
            btnSpan.textContent = trans.edit;
            showToast(trans.toastSaved, 'success');
        }
    });

    elements.clearLogoCacheBtn.addEventListener('click', clearLogoCache);

    // LOGO DROP ONE CLICK & DRAG
    elements.logoDropZone.addEventListener('dragover', handleDragOver);
    elements.logoDropZone.addEventListener('dragleave', handleDragLeave);
    elements.logoDropZone.addEventListener('drop', handleFileDrop);
    elements.logoDropZone.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
            // Mock drag event structure for reuse of handleFileDrop logic or call simpler handler
            const files = Array.from(e.target.files);
            if (files.length > 0) processFiles(files);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });

    // NEW: Max Halves Change Listener
    if (elements.maxHalvesSelect) {
        elements.maxHalvesSelect.addEventListener('change', (e) => {
            maxHalves = parseInt(e.target.value);
            localStorage.setItem('maxHalves', maxHalves);
        });
    }
};

// NEW HELPER LOOP FOR FILES
const processFiles = async (files) => {
    let successCount = 0;
    showToast("Processing logos...", "info");
    const promises = files.map(file => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) { resolve(); return; }
            const reader = new FileReader();
            reader.onload = (event) => {
                const fileName = file.name.replace(/\.(png|jpe?g|gif|webp)$/i, '');
                const logoKey = fileName.replace(/\s/g, '').toLowerCase();
                logoCache[logoKey] = event.target.result;
                successCount++;
                resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(file);
        });
    });
    await Promise.all(promises);
    if (successCount > 0) {
        saveLogoCache();
        showToast(`Added ${successCount} logos to cache.`, "success");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('scoreboardLang') || 'th';
    const savedTime = localStorage.getItem('countdownStartTime');
    if (savedTime) {
        countdownStartTime = parseInt(savedTime, 10);
    }
    const savedPath = localStorage.getItem('logoFolderPath');
    if (savedPath) {
        logoFolderPath = savedPath;
    }

    // LOAD DATA SOURCE SETTINGS
    const savedDSMode = localStorage.getItem('dataSourceMode');
    if (savedDSMode) {
        dataSourceMode = savedDSMode;
        // Update Radio
        const radio = document.querySelector(`input[name="dataSource"][value="${savedDSMode}"]`);
        if (radio) radio.checked = true;
    }

    const savedGSUrl = localStorage.getItem('googleSheetUrl');
    if (savedGSUrl) {
        googleSheetUrl = savedGSUrl;
        const input = document.getElementById('gsheetUrlInput');
        if (input) input.value = savedGSUrl;
    }

    setDataSourceMode(dataSourceMode);

    loadLogoCache();
    masterTeamA = createDefaultTeam('A');
    masterTeamB = createDefaultTeam('B');

    elements.logoPathInput.value = logoFolderPath;
    elements.currentLogoPath.textContent = logoFolderPath;

    setupEventListeners();
    setLanguage(savedLang);

    applyVisibilitySettings();
    applyColorCount();
    renderActionButtons();
    resetToZero();

    window.copyTag = copyTag;

    // V2.9.1: Mobile Room Logic
    const setupMobileRoomLogic = () => {
        const createRoomBtn = document.getElementById('createRoomBtn');
        const closeRoomBtn = document.getElementById('closeRoomBtn');
        const roomNameInput = document.getElementById('remoteRoomName');
        const roomIdInput = document.getElementById('remoteRoomId');
        const remoteQrCode = document.getElementById('remoteQrCode');
        const mobileLinkInput = document.getElementById('mobileLinkInput');
        const remoteRoomIdContainer = document.getElementById('remoteRoomIdContainer');
        const remoteConnectionUI = document.getElementById('remoteConnectionUI');
        const remoteStatusText = document.getElementById('remoteStatusText');

        let currentRoomRef = null;

        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                const roomName = (roomNameInput && roomNameInput.value.trim()) || "My Scoreboard";
                const newRoomRef = firebase.database().ref('obs_rooms_score').push();
                const roomId = newRoomRef.key;

                // Create initial room data
                newRoomRef.set({
                    name: roomName,
                    created: firebase.database.ServerValue.TIMESTAMP,
                    host_identity: window.userIdentity || { name: 'Host' }
                });

                currentRoomRef = newRoomRef;

                // Update UI
                if (roomIdInput) roomIdInput.value = roomId;
                createRoomBtn.style.display = 'none';
                if (closeRoomBtn) closeRoomBtn.style.display = 'block';
                if (roomNameInput) roomNameInput.disabled = true;
                if (remoteRoomIdContainer) remoteRoomIdContainer.style.display = 'flex';
                if (remoteConnectionUI) remoteConnectionUI.style.display = 'block';

                // Generate Link
                // Assuming OBSScorePhone.html is in the same directory
                let baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/OBSScorePhone.html';
                // Hande if ending with slash or filename
                if (window.location.href.endsWith('/')) baseUrl = window.location.href + 'OBSScorePhone.html';

                // If running locally as file://, QR code api might not be able to link effectively for others, 
                // but for local testing on same network it might work if they can access the file path (unlikely).
                // Usually users use a web server.
                // We will use the generated URL.

                const fullUrl = `${baseUrl}?room=${roomId}`;

                if (mobileLinkInput) mobileLinkInput.value = fullUrl;
                if (remoteQrCode) remoteQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}`;

                if (remoteStatusText) {
                    remoteStatusText.textContent = "Room Created. Waiting for connection...";
                    remoteStatusText.style.color = "var(--success-color)";
                }
            });
        }

        if (closeRoomBtn) {
            closeRoomBtn.addEventListener('click', () => {
                if (currentRoomRef) {
                    currentRoomRef.remove();
                    currentRoomRef = null;
                }
                if (createRoomBtn) createRoomBtn.style.display = 'block';
                closeRoomBtn.style.display = 'none';
                if (roomNameInput) roomNameInput.disabled = false;
                if (remoteRoomIdContainer) remoteRoomIdContainer.style.display = 'none';
                if (remoteConnectionUI) remoteConnectionUI.style.display = 'none';

                if (remoteStatusText) remoteStatusText.textContent = "Waiting...";
            });
        }

        // Copy Mobile Link
        const copyMobileLinkBtn = document.getElementById('copyMobileLinkBtn');
        if (copyMobileLinkBtn && mobileLinkInput) {
            copyMobileLinkBtn.addEventListener('click', () => {
                mobileLinkInput.select();
                document.execCommand('copy'); // Fallback
                if (navigator.clipboard) navigator.clipboard.writeText(mobileLinkInput.value);
                showToast("Link Copied", "success");
            });
        }
    };

    // --- V2.9.1: Loading State & Initialization ---
    const initApp = async () => {
        const startBtn = document.getElementById('closeWelcomeBtn');

        // 1. Try OBS Connect (Wait max 2 seconds to not block UI too long if offline)
        try {
            const obsPromise = obs.connect('ws://localhost:4455');
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000));
            await Promise.race([obsPromise, timeoutPromise]);
            // Connected
        } catch (err) {
            if (err !== 'timeout') {
                showToast(translations[currentLang].toastObsError, 'error');
            } else {
                console.log('OBS Connection timed out (continuing offline)');
            }
        }

        // 2. Fetch Announcement
        fetchAnnouncement();
        setInterval(fetchAnnouncement, 3600000);

        // 3. Enable Start Button
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
            const trans = translations[currentLang] || translations.en;
            startBtn.innerHTML = `<i class="fas fa-times"></i> ${trans.close || 'Close'}`;
        }
    };

    // 4. Set Initial Half Display Style
    if (elements.halfText) {
        elements.halfText.innerHTML = `<span class="half-ordinal">${half}</span><span class="half-label">Half</span>`;
    }

    initApp();
    setupMobileRoomLogic();

    // Global function for HTML onclick
    window.openMobileControlPopup = () => {
        const popup = document.getElementById('mobileControlPopup');
        const overlay = document.getElementById('popupOverlay');
        if (popup) {
            popup.style.display = 'block';
            setTimeout(() => popup.classList.add('active'), 10);
        }
        if (overlay) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.classList.add('active'), 10);
        }
    };

    const defaultButton = document.getElementById('defaultOpen');
    if (defaultButton) defaultButton.classList.add('active');
});

// --- EXPOSE API FOR REMOTE CONTROL (V2.8) ---
window.fcpAPI = {
    applyMatch: applyMatch,
    changeScore: changeScore,
    changeScore2: changeScore2,
    resetToStartTime: resetToStartTime,
    updateTeamFromInputs: (team, name, color1, color2) => {
        const master = team === 'A' ? masterTeamA : masterTeamB;
        const newName = name || master.name;
        const newColor = color1 || master.color1;
        const newColor2 = color2 || master.color2;
        updateTeamUI(team, newName, master.logoFile, newColor, newColor2);

        // Sync input fields
        if (team === 'A') {
            elements.nameAInput.value = newName;
            elements.colorA.value = newColor;
            elements.colorA2.value = newColor2;
        } else {
            elements.nameBInput.value = newName;
            elements.colorB.value = newColor;
            elements.colorB2.value = newColor2;
        }
    },
    toggleHalf: toggleHalf,
    stopTimer: stopTimer,
    obs_saveReplay: () => {
        obs.call('SaveReplayBuffer').then(() => showToast("Replay Saved", "success")).catch(err => showToast("Save Replay Failed: " + err.error, "error"));
    },
    obs_setCurrentScene: (sceneName) => {
        obs.call('SetCurrentProgramScene', { sceneName: sceneName }).then(() => showToast("Switched to " + sceneName, "success")).catch(err => showToast("Switch Scene Failed: " + err.error, "error"));
    }
};

// Import Remote Logic
import './remote.js';

// --- Welcome Screen Logic ---
window.initWelcomeScreen = () => {
    const screen = $('welcomeScreen');
    const provinceSelect = $('visitorProvince');
    const nameInput = $('visitorName');

    // Populate Provinces
    if (provinceSelect) {
        thaiProvinces.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            provinceSelect.appendChild(opt);
        });
        provinceSelect.value = "กรุงเทพมหานคร"; // Default
    }

    if (userIdentity && userIdentity.name) {
        // User exists, skip welcome or pre-fill
        if (nameInput) nameInput.value = userIdentity.name;
        if (provinceSelect) provinceSelect.value = userIdentity.province || "กรุงเทพมหานคร";
        // Auto-enter if desired, but user might want to edit.
        // For now, let's just pre-fill and require click.
        // Actually, if identity exists, we can hide welcome screen immediately?
        // "เก็บข้อมูลไว้ในเครื่องด้วย" - usually implies "Remember Me".
        // Let's check if we should auto-enter.
        // For now, let's show the screen but pre-filled.
    }
};

window.saveAndEnterApp = () => {
    const nameInput = $('visitorName');
    const provinceSelect = $('visitorProvince');
    const countryInput = $('visitorCountry');

    const name = nameInput.value.trim();
    if (!name) {
        alert("Please enter your name / กรุณากรอกชื่อ");
        return;
    }

    userIdentity = {
        name: name,
        province: provinceSelect.value,
        country: countryInput.value
    };

    localStorage.setItem('userIdentity', JSON.stringify(userIdentity));
    updateUserIdentityUI();

    // Animate out
    const screen = $('welcomeScreen');
    if (screen) {
        screen.style.opacity = '0';
        setTimeout(() => {
            screen.style.display = 'none';
        }, 500);
    }

    // Create room in Firebase with new identity
    if (window.initOnlinePresenceSystem) window.initOnlinePresenceSystem();
};

const updateUserIdentityUI = () => {
    if (!userIdentity) return;
    const nameDisplay = $('visitorNameDisplay');
    const locationDisplay = $('visitorLocationDisplay');
    if (nameDisplay) nameDisplay.textContent = userIdentity.name;
    if (locationDisplay) locationDisplay.textContent = `${userIdentity.province}, ${userIdentity.country}`;
};

// --- Quick Tag Logic ---
window.insertTag = (tagCode) => {
    const textarea = $('detailsText');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    textarea.value = before + tagCode + after;
    textarea.selectionStart = textarea.selectionEnd = start + tagCode.length;
    textarea.focus();

    // Trigger save
    localStorage.setItem('detailsText', textarea.value);
};

// Update copyDetails to include new tags
const originalCopyDetails = copyDetails; // Backup if needed, but we will overwrite
window.copyDetails = () => {
    const template = localStorage.getItem('detailsText') || '';
    if (!template.trim()) return showToast(translations[currentLang].toastNoTextToCopy, 'error');

    let teamAName = masterTeamA.name.replace(/\//g, ' ');
    let teamBName = masterTeamB.name.replace(/\//g, ' ');

    const filled = template
        .replace(/<TeamA>/gi, teamAName)
        .replace(/<TeamB>/gi, teamBName)
        .replace(/<label1>/gi, elements.label1.textContent)
        .replace(/<label2>/gi, elements.label2.textContent)
        .replace(/<label3>/gi, elements.label3.textContent)
        .replace(/<label4>/gi, elements.label4.textContent)
        .replace(/<label5>/gi, elements.label5.textContent)
        .replace(/<score_team_a>/gi, masterTeamA.score)
        .replace(/<score_team_b>/gi, masterTeamB.score)
        .replace(/<score2_team_a>/gi, masterTeamA.score2)
        .replace(/<score2_team_b>/gi, masterTeamB.score2)
        .replace(/<time_counter>/gi, elements.timerText.textContent)
        // Remove half_text logic or keep it but it's not in the list
        .replace(/<half_text>/gi, elements.halfText.textContent);

    navigator.clipboard.writeText(filled).then(() => showToast(translations[currentLang].toastCopied, 'info')).catch(err => showToast(translations[currentLang].toastCopyFailed, 'error'));
};

// Call init on load
window.addEventListener('load', () => {
    if (window.initWelcomeScreen) window.initWelcomeScreen();
    if (window.updateUserIdentityUI) window.updateUserIdentityUI();
});
