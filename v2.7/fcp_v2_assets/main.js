// fcp_v2_assets/main.js

// 1. นำเข้าข้อมูลภาษาจากไฟล์ languages.js
import { translations } from './languages.js';

// --- DOM ELEMENTS ---
const $ = id => document.getElementById(id);
const elements = [
    "nameA", "nameB", "label1", "label2", "label3", "label4", "label5",
    "logoA", "logoB", "initialsA", "initialsB",
    "scoreA", "scoreB",
    "score2Card", "score2A", "score2B", "score2APlusBtn", "score2AMinusBtn", "score2BPlusBtn", "score2BMinusBtn", "resetScore2Btn",
    "timerText", "halfText", "announcement-text", "matchID",
    "colorA", "colorB", "colorA2", "colorB2",
    "countdownCheck", "languageSelector", "nameA-input", "nameB-input", "excelBtn", "loadBtn",
    "editBtnA", "okBtnA", "editBtnB", "okBtnB", "swapBtn", "scoreAPlusBtn", "scoreAMinusBtn",
    "scoreBPlusBtn", "scoreBMinusBtn", "resetScoreBtn", "fullResetBtn", "halfBtn", "playBtn", "pauseBtn",
    "resetToStartBtn", "editTimeBtn", "settingsBtn", "copyBtn", "helpBtn", "donateBtn",
    "toast-container", "popupOverlay", "detailsPopup", "helpPopup", "donatePopup", "detailsText",
    "welcomeSponsorPopup", "closeWelcomeBtn",
    "copyShopeeLinkBtn", "copyEasyDonateLinkBtn",
    "saveDetailsBtn", "closeDetailsBtn",
    "saveDetailsBtnTop", "closeDetailsBtnTop", "closeDetailsBtnBottom",
    "closeHelpBtn", "closeDonateBtn", "injuryTimeDisplay",
    "injuryTimePlusBtn", "injuryTimeMinusBtn", "resetToZeroBtn", "timeSettingsPopup",
    "startTimeMinutes", "startTimeSeconds", "saveTimeSettingsBtn", "saveAndUpdateTimeBtn", "closeTimeSettingsBtn",
    "timeSettingsError", "changelogBtn", "changelogPopup", "closeChangelogBtn",
    "logoPathBtn", "logoPathPopup", "currentLogoPath", "logoPathInput", "editLogoPathBtn", "closeLogoPathBtn",
    "sourcesTableHeaders", "sourcesTableBody",
    "keybindsTable", "resetKeybindsBtn", "resetColorsBtn",
    "tagsTable", "actionConfigTable",
    "actionButtonsCard", "actionBtn1", "actionBtn2", "actionBtn3", "actionBtn4", "actionBtn5", "actionBtn6",
    "resetActionKeybindsBtn",
    "maxPeriods",
    "toggleScore2Visible", "toggleSwapVisible", "toggleActionVisible",
].reduce((acc, id) => {
    // แก้ไข: เพิ่มการตรวจสอบ Element ว่ามีอยู่จริงหรือไม่
    const element = $(id);
    if (element) {
        acc[id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase())] = element;
    }
    return acc;
}, {});


// --- STATE VARIABLES ---
let sheetData = [];
let scoreA = 0, scoreB = 0;
let score2A = 0, score2B = 0;
let timer = 0, interval = null;
let currentPeriod = 1;
let injuryTime = 0;
let isCountdown = false;
let countdownStartTime = 2700;
let currentLang = 'th';
let logoFolderPath = 'C:/OBSAssets/logos';
const TEAM_COLORS_KEY = 'teamColorMemory';
const SCORE2_VISIBILITY_KEY = 'score2Visible';
const SWAP_VISIBILITY_KEY = 'swapVisible';
const ACTION_VISIBILITY_KEY = 'actionVisible';
const KEYBINDS_KEY = 'customKeybinds';
const ACTION_CONFIG_KEY = 'actionButtonConfig';
const MAX_PERIODS_KEY = 'maxPeriods';

// Master Data
let masterTeamA = { name: '', logo: '', color1: '#ffffff', color2: '#000000' };
let masterTeamB = { name: '', logo: '', color1: '#ffffff', color2: '#000000' };

// Default Action Button Configuration (6 Buttons)
const defaultActionConfig = [
    { id: 1, label: 'Action 1', color: '#eab308', output: 'action_output_1' },
    { id: 2, label: 'Action 2', color: '#06b6d4', output: 'action_output_2' },
    { id: 3, label: 'Action 3', color: '#84cc16', output: 'action_output_3' },
    { id: 4, label: 'Action 4', color: '#a855f7', output: 'action_output_4' },
    { id: 5, label: 'Action 5', color: '#fb923c', output: 'action_output_5' },
    { id: 6, label: 'Action 6', color: '#f472b6', output: 'action_output_6' },
];
let actionButtonConfig = JSON.parse(localStorage.getItem(ACTION_CONFIG_KEY) || JSON.stringify(defaultActionConfig));
let maxPeriods = parseInt(localStorage.getItem(MAX_PERIODS_KEY) || 2, 10);


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


// --- UTILITY & LANGUAGE ---
const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    if (elements.toastContainer) elements.toastContainer.appendChild(toast);
    setTimeout(() => { if (toast && toast.remove) toast.remove(); }, 5000);
};

const openPopup = (popup) => {
    if (elements.popupOverlay && popup) elements.popupOverlay.style.display = 'block';
    if (popup) popup.style.display = 'block';
};

const closeAllPopups = () => {
    if (elements.popupOverlay) elements.popupOverlay.style.display = 'none';
    if (elements.detailsPopup) elements.detailsPopup.style.display = 'none';
    if (elements.helpPopup) elements.helpPopup.style.display = 'none';
    if (elements.donatePopup) elements.donatePopup.style.display = 'none';
    if (elements.timeSettingsPopup) elements.timeSettingsPopup.style.display = 'none';
    if (elements.changelogPopup) elements.changelogPopup.style.display = 'none';
    if (elements.logoPathPopup) elements.logoPathPopup.style.display = 'none';
    if (elements.timeSettingsError) elements.timeSettingsError.style.display = 'none';
    if (elements.welcomeSponsorPopup) elements.welcomeSponsorPopup.style.display = 'none';

    const keybindsList = (translations[currentLang].keybindsList || []).concat(translations[currentLang].actionKeybindsList || []);
    keybindsList.forEach(item => {
        toggleKeybindEditMode(item.id, false);
        toggleActionEditMode(item.id, false);
    });
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

// --- UI POPULATION FUNCTIONS ---
const populateHelpTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const sources = trans.sourcesList || [];
    const headers = trans.sourcesTableHeaders || ["Source Name", "Source Type", "Details"];

    if (elements.sourcesTableHeaders) elements.sourcesTableHeaders.innerHTML = `<th>${headers[0]}</th><th>${headers[1]}</th><th>${headers[2]}</th>`;

    if (elements.sourcesTableBody) {
        elements.sourcesTableBody.innerHTML = '';
        sources.forEach(item => {
            const row = elements.sourcesTableBody.insertRow();
            const nameCell = row.insertCell();
            nameCell.textContent = item.code;
            nameCell.onclick = () => copySourceName(item.code);
            row.insertCell().textContent = item.type;
            row.insertCell().innerHTML = item.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        });
    }
};

const populateTagsTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const tags = trans.tagsList || [];

    const thead = `<thead><tr><th>Tag</th><th>${trans.detailsTitle}</th></tr></thead>`;
    let tbody = '<tbody>';

    tags.forEach(item => {
        tbody += `
            <tr>
                <td onclick="copyTag('${item.code}')">${item.code}</td>
                <td>${item.desc}</td>
            </tr>
        `;
    });
    tbody += '</tbody>';

    if (elements.tagsTable) elements.tagsTable.innerHTML = thead + tbody;
}

// --- KEYBIND/ACTION CONFIG FUNCTIONS ---

const formatKey = (keyString) => {
    if (!keyString) return '';
    return keyString.replace(/CONTROL/g, 'Ctrl').replace(/ALT/g, 'Alt').replace(/SHIFT/g, 'Shift').replace(/ /g, 'SPACE');
};

const captureKeyInput = (e, inputElement, saveButton, editButton) => {
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
    if (saveButton) saveButton.style.display = 'inline-flex';
    if (editButton) editButton.style.display = 'none';
}

const toggleKeybindEditMode = (id, enable) => {
    const inputElement = $(`keybind-input-${id}`);
    const editButton = $(`keybind-edit-${id}`);
    const saveButton = $(`keybind-save-${id}`);

    if (!inputElement || !editButton || !saveButton) return;

    if (enable) {
        inputElement.disabled = false;
        editButton.style.display = 'none';
        saveButton.style.display = 'inline-flex';
        inputElement.focus();

        inputElement.onkeydown = null;
        inputElement.onblur = null;

        inputElement.onkeydown = (e) => captureKeyInput(e, inputElement, saveButton, editButton);

        inputElement.onblur = () => {
            setTimeout(() => {
                if (document.activeElement !== saveButton && document.activeElement !== editButton) {
                    if (inputElement.disabled === false) {
                        inputElement.disabled = true;
                        editButton.style.display = 'inline-flex';
                        saveButton.style.display = 'none';
                        inputElement.onkeydown = null;
                    }
                }
            }, 50);
        };
    } else {
        inputElement.disabled = true;
        editButton.style.display = 'inline-flex';
        saveButton.style.display = 'none';
        inputElement.onkeydown = null;
    }
}

const saveKeybind = (id) => {
    const inputElement = $(`keybind-input-${id}`);
    if (!inputElement) return;
    const keyString = inputElement.value.trim().toUpperCase();

    const rawKeyString = keyString.replace(/CTRL/g, 'CONTROL').replace(/ALT/g, 'ALT').replace(/SHIFT/g, 'SHIFT').replace(/SPACE/g, ' ');

    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    savedKeybinds[id] = rawKeyString;
    localStorage.setItem(KEYBINDS_KEY, JSON.stringify(savedKeybinds));
    showToast(translations[currentLang].toastKeybindsSaved, 'success');
}

const populateKeybindsTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const keybindsList = trans.keybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');

    if (elements.keybindsTable) {
        elements.keybindsTable.innerHTML = `<thead>
            <tr><th>${trans.keybindsTitle}</th><th style="width: 110px;">${trans.edit}</th><th>${trans.save}</th></tr>
        </thead><tbody></tbody>`;
        const tbody = elements.keybindsTable.querySelector('tbody');

        keybindsList.forEach(item => {
            const rawKey = savedKeybinds[item.id] !== undefined ? savedKeybinds[item.id] : item.default;
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
                        <button id="keybind-save-${item.id}" class="btn-success" title="${trans.save}" style="display: none;"><i class="fas fa-save"></i></button>
                    </div>
                </td>
            `;
            // Attach event listeners for each button
            $(`keybind-edit-${item.id}`).onclick = () => toggleKeybindEditMode(item.id, true);
            $(`keybind-save-${item.id}`).onclick = () => {
                saveKeybind(item.id);
                toggleKeybindEditMode(item.id, false);
            };
        });
    }
}

const toggleActionEditMode = (id, enable) => {
    const nameInput = $(`action-name-input-${id}`);
    const colorInput = $(`action-color-input-${id}`);
    const keyInput = $(`action-key-input-${id}`);
    const editBtn = $(`action-edit-config-${id}`);
    const saveBtn = $(`action-save-config-${id}`);

    if (!nameInput || !editBtn || !colorInput || !keyInput || !saveBtn) return;

    if (enable) {
        nameInput.disabled = false;
        colorInput.disabled = false;
        keyInput.disabled = false;
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-flex';
        nameInput.focus();

        keyInput.onkeydown = null;
        keyInput.onblur = null;

        keyInput.onkeydown = (e) => captureKeyInput(e, keyInput, saveBtn, editBtn);
        keyInput.onblur = () => {
            setTimeout(() => {
                if (document.activeElement !== saveBtn && document.activeElement !== editBtn) {
                    if (nameInput.disabled === false) {
                        nameInput.disabled = true;
                        colorInput.disabled = true;
                        keyInput.disabled = true;
                        editBtn.style.display = 'inline-flex';
                        saveBtn.style.display = 'none';
                        keyInput.onkeydown = null;
                    }
                }
            }, 50);
        };
    } else {
        nameInput.disabled = true;
        colorInput.disabled = true;
        keyInput.disabled = true;
        editBtn.style.display = 'inline-flex';
        saveBtn.style.display = 'none';
        keyInput.onkeydown = null;
    }
}

const saveActionButtonConfig = (id) => {
    const configId = `action_btn_${id}`;
    const keyInput = $(`action-key-input-${id}`);
    if (!keyInput) return;

    // 1. Save Config (Name/Color)
    const newConfig = actionButtonConfig.map(config => {
        if (config.id === id) {
            return {
                ...config,
                label: $(`action-name-input-${id}`).value,
                color: $(`action-color-input-${id}`).value,
            };
        }
        return config;
    });

    actionButtonConfig = newConfig;
    localStorage.setItem(ACTION_CONFIG_KEY, JSON.stringify(actionButtonConfig));
    updateActionButtonsUI();

    // 2. Save Keybind
    const keyString = keyInput.value.trim().toUpperCase();
    const rawKeyString = keyString.replace(/CTRL/g, 'CONTROL').replace(/ALT/g, 'ALT').replace(/SHIFT/g, 'SHIFT').replace(/SPACE/g, ' ');

    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    savedKeybinds[configId] = rawKeyString;
    localStorage.setItem(KEYBINDS_KEY, JSON.stringify(savedKeybinds));

    // 3. Exit Edit Mode & Notify
    toggleActionEditMode(id, false);
    showToast(translations[currentLang].toastSaved, 'success');
}

const populateActionConfigTable = (lang) => {
    const trans = translations[lang] || translations.en;
    const actionList = translations[lang].actionKeybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');

    if (elements.actionConfigTable) {
        elements.actionConfigTable.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th style="width: 120px;">${trans.actionName}</th>
                    <th>${trans.actionColor}</th>
                    <th style="width: 120px;">${trans.keybindsTitle}</th>
                    <th>${trans.edit}/${trans.save}</th>
                </tr>
            </thead>
            <tbody></tbody>`;
        const tbody = elements.actionConfigTable.querySelector('tbody');

        actionButtonConfig.forEach((item) => {
            const configId = `action_btn_${item.id}`;
            const defaultAction = actionList.find(a => a.id === configId);
            const rawKey = savedKeybinds[configId] !== undefined ? savedKeybinds[configId] : (defaultAction ? defaultAction.default : '');
            const formattedKey = formatKey(rawKey);

            const row = tbody.insertRow();
            row.id = `action-config-row-${item.id}`;
            row.innerHTML = `
                <td>${item.id}</td>
                <td>
                    <input type="text" id="action-name-input-${item.id}" class="action-name-input" value="${item.label}" disabled>
                </td>
                <td>
                    <input type="color" id="action-color-input-${item.id}" class="color-picker" value="${item.color}" disabled>
                </td>
                <td>
                    <input type="text" id="action-key-input-${item.id}" value="${formattedKey}" disabled class="keybind-input">
                </td>
                <td>
                    <div class="key-action-buttons">
                        <button id="action-edit-config-${item.id}" class="btn-secondary" title="${trans.edit}"><i class="fas fa-pencil-alt"></i></button>
                        <button id="action-save-config-${item.id}" class="btn-success" title="${trans.save}" style="display: none;"><i class="fas fa-save"></i></button>
                    </div>
                </td>
            `;

            $(`action-edit-config-${item.id}`).onclick = () => toggleActionEditMode(item.id, true);
            $(`action-save-config-${item.id}`).onclick = () => saveActionButtonConfig(item.id);
        });
    }
}

const updateActionButtonsUI = () => {
    actionButtonConfig.forEach(config => {
        const btn = elements[`actionBtn${config.id}`];
        if (btn) {
            btn.textContent = config.label;
            btn.style.backgroundColor = config.color;
            // Ensure text is readable against the custom background
            // Simple color contrast check (luminosity)
            const hex = config.color.substring(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            btn.style.color = luminance > 0.5 ? '#1f2937' : '#ffffff';
        }
    });
}

const handleActionButtonClick = (id) => {
    const config = actionButtonConfig.find(c => c.id === id);
    if (!config) return;

    const outputText = config.label;
    const targetSource = config.output || `action_output_${id}`;

    setText(targetSource, outputText);
    showToast(`${config.label}: Sent command to ${targetSource}`, 'info');
}

const resetActionKeybinds = () => {
    const actionKeybinds = translations[currentLang].actionKeybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');

    actionKeybinds.forEach(item => delete savedKeybinds[item.id]);

    localStorage.setItem(KEYBINDS_KEY, JSON.stringify(savedKeybinds));

    populateActionConfigTable(currentLang);
    showToast(translations[currentLang].resetActionKeybinds, 'info');
}

const populateDynamicLists = (lang) => {
    populateTagsTable(lang);
    populateKeybindsTable(lang);
    populateActionConfigTable(lang);
    populateHelpTable(lang);
};


// --- VISIBILITY TOGGLES (Simplified UI) ---
const updateScore2ToggleUI = (isVisible) => {
    if (elements.score2Card) elements.score2Card.classList.toggle('hidden', !isVisible);
}

const updateSwapToggleUI = (isVisible) => {
    if (elements.swapCard) elements.swapCard.classList.toggle('hidden', !isVisible);
}

const updateActionButtonsToggleUI = (isVisible) => {
    if (elements.actionButtonsCard) elements.actionButtonsCard.classList.toggle('hidden', !isVisible);
}

const saveVisibilityStates = () => {
    // แก้ไข: ตรวจสอบ Element ก่อนใช้
    const isScore2Visible = elements.toggleScore2Visible ? elements.toggleScore2Visible.checked : true;
    const isSwapVisible = elements.toggleSwapVisible ? elements.toggleSwapVisible.checked : true;
    const isActionVisible = elements.toggleActionVisible ? elements.toggleActionVisible.checked : true;

    updateScore2ToggleUI(isScore2Visible);
    updateSwapToggleUI(isSwapVisible);
    updateActionButtonsToggleUI(isActionVisible);

    localStorage.setItem(SCORE2_VISIBILITY_KEY, isScore2Visible);
    localStorage.setItem(SWAP_VISIBILITY_KEY, isSwapVisible);
    localStorage.setItem(ACTION_VISIBILITY_KEY, isActionVisible);

    showToast(translations[currentLang].toastSaved, 'success');
}


const setLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem('scoreboardLang', lang);
    if (elements.languageSelector) elements.languageSelector.value = lang;
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

    const editLogoPathBtnSpan = elements.editLogoPathBtn ? elements.editLogoPathBtn.querySelector('span') : null;
    if (editLogoPathBtnSpan) {
        if (elements.logoPathInput && elements.logoPathInput.disabled) {
            editLogoPathBtnSpan.textContent = trans.edit;
        } else if (elements.logoPathInput) {
            editLogoPathBtnSpan.textContent = trans.save;
        }
    }

    populateDynamicLists(lang);
    updateHalfText();
};


// --- HALF/PERIODS LOGIC ---
const getPeriodText = (period, max) => {
    const suffix = ["st", "nd", "rd", "th"][period - 1] || "th";
    return (period <= 3 && period <= max) ? `${period}${suffix}` : `${period}th`;
}

const updateHalfText = () => {
    const text = getPeriodText(currentPeriod, maxPeriods);
    if (elements.halfText) elements.halfText.textContent = text;
    setText('half_text', text);
}

const toggleHalf = () => {
    currentPeriod = (currentPeriod % maxPeriods) + 1;
    updateHalfText();
};

const saveMaxPeriods = () => {
    if (!elements.maxPeriods) return;
    const newMaxPeriods = parseInt(elements.maxPeriods.value, 10);
    if (isNaN(newMaxPeriods) || newMaxPeriods < 1 || newMaxPeriods > 9) {
        elements.maxPeriods.value = maxPeriods;
        return showToast(translations[currentLang].toastInvalidTime, 'error');
    }
    maxPeriods = newMaxPeriods;
    localStorage.setItem(MAX_PERIODS_KEY, maxPeriods);

    if (currentPeriod > maxPeriods) {
        currentPeriod = 1;
    }
    updateHalfText();
    showToast(`${translations[currentLang].toastMaxPeriodsSet} ${maxPeriods}`, 'success');
}


// --- SWAP LOGIC (Master Data Implementation) ---

// Helper function to load data from Master or apply team A/B display
const applyMasterData = (team, name, logo, color1, color2) => {
    if (team === 'A') {
        masterTeamA = { name, logo, color1, color2 };
    } else {
        masterTeamB = { name, logo, color1, color2 };
    }
    // Update display based on current assignment
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);
}

// Function to update the actual UI display and OBS sources
const updateDisplayUI = (displaySlot, teamData) => {
    const isA = displaySlot === 'A';
    const nameEl = isA ? elements.nameA : elements.nameB;
    const logoEl = isA ? elements.logoA : elements.logoB;
    const initialsEl = isA ? elements.initialsA : elements.initialsB;
    const colorEl1 = isA ? elements.colorA : elements.colorB;
    const colorEl2 = isA ? elements.colorA2 : elements.colorB2;

    const obsNameSource = isA ? 'name_team_a' : 'name_team_b';
    const obsLogoSource = isA ? 'logo_team_a' : 'logo_team_b';
    const obsColorSource1 = isA ? 'Color_Team_A' : 'Color_Team_B';
    const obsColorSource2 = isA ? 'Color_Team_A_2' : 'Color_Team_B_2';

    if (!nameEl) return; // Escape if DOM is not ready/incomplete

    // Update UI elements
    nameEl.innerHTML = teamData.name.replace(/\//g, '<br>');
    if (colorEl1) colorEl1.value = teamData.color1;
    if (colorEl2) colorEl2.value = teamData.color2;
    if (initialsEl) initialsEl.textContent = getTeamInitials(teamData.name.replace(/\//g, ' '));

    if (logoEl) {
        if (teamData.logo) {
            const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(teamData.logo);
            logoEl.src = `file:///${logoFolderPath}/${teamData.logo}${hasExt ? '' : '.png'}`;
            logoEl.style.display = 'block';
            if (initialsEl) initialsEl.style.display = 'none';
        } else {
            logoEl.src = '';
            logoEl.style.display = 'none';
            if (initialsEl) initialsEl.style.display = 'block';
        }
    }


    // Update OBS
    setText(obsNameSource, teamData.name.replace(/\//g, '\n'));
    setImage(obsLogoSource, teamData.logo);
    setSourceColor(obsColorSource1, teamData.color1);
    setSourceColor(obsColorSource2, teamData.color2);
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
    let logoA = get('LogoA');
    let logoB = get('LogoB');

    let colorA1 = get('ColorA') || '#ffffff';
    let colorB1 = get('ColorB') || '#ffffff';
    let colorA2 = get('ColorA2') || '#000000';
    let colorB2 = get('ColorB2') || '#000000';

    // Load saved colors
    const savedColorA = loadTeamColors(teamAName);
    if (savedColorA) {
        colorA1 = savedColorA.color1;
        colorA2 = savedColorA.color2;
    }
    const savedColorB = loadTeamColors(teamBName);
    if (savedColorB) {
        colorB1 = savedColorB.color1;
        colorB2 = savedColorB.color2;
    }

    // Load master data (Team A is assigned to slot A, Team B to slot B initially)
    masterTeamA = { name: teamAName, logo: logoA, color1: colorA1, color2: colorA2 };
    masterTeamB = { name: teamBName, logo: logoB, color1: colorB1, color2: colorB2 };

    // Apply initial display (Master A -> Display A, Master B -> Display B)
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

    // Save initial team colors after loading
    saveTeamColors(teamAName, colorA1, colorA2);
    saveTeamColors(teamBName, colorB1, colorB2);

    if (elements.label1) elements.label1.textContent = get('label1');
    if (elements.label2) elements.label2.textContent = get('label2');
    if (elements.label3) elements.label3.textContent = get('label3');
    if (elements.label4) elements.label4.textContent = get('label4');
    if (elements.label5) elements.label5.textContent = get('label5');

    setText('label_1', get('label1'));
    setText('label_2', get('label2'));
    setText('label_3', get('label3'));
    setText('label_4', get('label4'));
    setText('label_5', get('label5'));

    showToast(`${translations[currentLang].toastLoaded} ${id}`, 'success');
};

const swapTeams = () => {
    // Swap the Master Data assignments
    [masterTeamA, masterTeamB] = [masterTeamB, masterTeamA];

    // Swap the scores only on the display/control side
    [scoreA, scoreB] = [scoreB, scoreA];
    [score2A, score2B] = [score2B, score2A];

    // Re-apply master data to display slots
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

    // Update Scores
    if (elements.scoreA) elements.scoreA.textContent = scoreA;
    setText('score_team_a', scoreA);
    if (elements.scoreB) elements.scoreB.textContent = scoreB;
    setText('score_team_b', scoreB);

    if (elements.score2A) elements.score2A.textContent = score2A;
    setText('score2_team_a', score2A);
    if (elements.score2B) elements.score2B.textContent = score2B;
    setText('score2_team_b', score2B);

    showToast(translations[currentLang].toastSwapped, 'info');
};


const setupEventListeners = () => {
    // Bind Save buttons to the same logic
    const saveHandler = () => {
        if (elements.detailsText) localStorage.setItem('detailsText', elements.detailsText.value);
        closeAllPopups();
        showToast(translations[currentLang].toastSaved, 'success');
    };
    if (elements.saveDetailsBtnTop) elements.saveDetailsBtnTop.addEventListener('click', saveHandler);

    const closeHandler = () => {
        closeAllPopups();
    };

    if (elements.closeDetailsBtnTop) elements.closeDetailsBtnTop.addEventListener('click', closeHandler);
    if (elements.closeDetailsBtnBottom) elements.closeDetailsBtnBottom.addEventListener('click', closeHandler);

    if (elements.languageSelector) elements.languageSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    if (elements.excelBtn) elements.excelBtn.addEventListener('click', handleExcel);
    if (elements.loadBtn) elements.loadBtn.addEventListener('click', applyMatch);
    if (elements.fullResetBtn) elements.fullResetBtn.addEventListener('click', fullReset);
    if (elements.swapBtn) elements.swapBtn.addEventListener('click', swapTeams);
    if (elements.scoreAPlusBtn) elements.scoreAPlusBtn.addEventListener('click', () => changeScore('A', 1));
    if (elements.scoreAMinusBtn) elements.scoreAMinusBtn.addEventListener('click', () => changeScore('A', -1));
    if (elements.scoreBPlusBtn) elements.scoreBPlusBtn.addEventListener('click', () => changeScore('B', 1));
    if (elements.scoreBMinusBtn) elements.scoreBMinusBtn.addEventListener('click', () => changeScore('B', -1));
    if (elements.resetScoreBtn) elements.resetScoreBtn.addEventListener('click', resetScore);

    if (elements.score2APlusBtn) elements.score2APlusBtn.addEventListener('click', () => changeScore2('A', 1));
    if (elements.score2AMinusBtn) elements.score2AMinusBtn.addEventListener('click', () => changeScore2('A', -1));
    if (elements.score2BPlusBtn) elements.score2BPlusBtn.addEventListener('click', () => changeScore2('B', 1));
    if (elements.score2BMinusBtn) elements.score2BMinusBtn.addEventListener('click', () => changeScore2('B', -1));
    if (elements.resetScore2Btn) elements.resetScore2Btn.addEventListener('click', resetScore2);

    // Action Button Clicks (6 buttons)
    for (let i = 1; i <= 6; i++) {
        if (elements[`actionBtn${i}`]) elements[`actionBtn${i}`].addEventListener('click', () => handleActionButtonClick(i));
    }

    // Visibility Checkbox Listener
    if (elements.toggleScore2Visible) elements.toggleScore2Visible.addEventListener('change', saveVisibilityStates);
    if (elements.toggleSwapVisible) elements.toggleSwapVisible.addEventListener('change', saveVisibilityStates);
    if (elements.toggleActionVisible) elements.toggleActionVisible.addEventListener('change', saveVisibilityStates);

    // Keybinds Control
    if (elements.resetKeybindsBtn) elements.resetKeybindsBtn.addEventListener('click', resetKeybinds);
    if (elements.resetActionKeybindsBtn) elements.resetActionKeybindsBtn.addEventListener('click', resetActionKeybinds);

    // Team Color Reset
    if (elements.resetColorsBtn) elements.resetColorsBtn.addEventListener('click', resetTeamColors);

    if (elements.halfBtn) elements.halfBtn.addEventListener('click', toggleHalf);
    if (elements.playBtn) elements.playBtn.addEventListener('click', startTimer);
    if (elements.pauseBtn) elements.pauseBtn.addEventListener('click', stopTimer);
    if (elements.resetToStartBtn) elements.resetToStartBtn.addEventListener('click', resetToStartTime);
    if (elements.resetToZeroBtn) elements.resetToZeroBtn.addEventListener('click', resetToZero);
    if (elements.editTimeBtn) elements.editTimeBtn.addEventListener('click', () => openPopup(elements.timeSettingsPopup));
    if (elements.countdownCheck) elements.countdownCheck.addEventListener('change', () => { isCountdown = elements.countdownCheck.checked; });
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', () => {
        if (elements.detailsText) elements.detailsText.value = localStorage.getItem('detailsText') || '';
        if (elements.maxPeriods) elements.maxPeriods.value = maxPeriods;

        // Set Checkbox states (must check if elements exist)
        if (elements.toggleScore2Visible) elements.toggleScore2Visible.checked = JSON.parse(localStorage.getItem(SCORE2_VISIBILITY_KEY) || 'true');
        if (elements.toggleSwapVisible) elements.toggleSwapVisible.checked = JSON.parse(localStorage.getItem(SWAP_VISIBILITY_KEY) || 'true');
        if (elements.toggleActionVisible) elements.toggleActionVisible.checked = JSON.parse(localStorage.getItem(ACTION_VISIBILITY_KEY) || 'true');

        populateDynamicLists(currentLang);
        openPopup(elements.detailsPopup);
    });
    if (elements.copyBtn) elements.copyBtn.addEventListener('click', copyDetails);
    if (elements.helpBtn) elements.helpBtn.addEventListener('click', () => openPopup(elements.helpPopup));
    if (elements.donateBtn) elements.donateBtn.addEventListener('click', () => openPopup(elements.donatePopup));
    if (elements.changelogBtn) elements.changelogBtn.addEventListener('click', () => openPopup(elements.changelogPopup));
    if (elements.popupOverlay) elements.popupOverlay.addEventListener('click', closeHandler);

    if (elements.closeHelpBtn) elements.closeHelpBtn.addEventListener('click', closeHandler);
    if (elements.closeDonateBtn) elements.closeDonateBtn.addEventListener('click', closeHandler);
    if (elements.closeChangelogBtn) elements.closeChangelogBtn.addEventListener('click', closeHandler);
    if (elements.closeTimeSettingsBtn) elements.closeTimeSettingsBtn.addEventListener('click', closeHandler);
    if (elements.closeLogoPathBtn) elements.closeLogoPathBtn.addEventListener('click', closeHandler);

    // Time Settings
    if (elements.saveTimeSettingsBtn) elements.saveTimeSettingsBtn.addEventListener('click', saveTimeSettings);
    if (elements.saveAndUpdateTimeBtn) elements.saveAndUpdateTimeBtn.addEventListener('click', saveAndUpdateTime);
    if (elements.maxPeriods) elements.maxPeriods.addEventListener('change', saveMaxPeriods);


    // Edit Name
    const handleNameEdit = (team) => {
        // Exit edit mode for the opposite team if active
        if (team === 'A' && elements.nameBInput && elements.nameBInput.style.display !== 'none') exitEditMode('B', false);
        if (team === 'B' && elements.nameAInput && elements.nameAInput.style.display !== 'none') exitEditMode('A', false);
        enterEditMode(team);
    };

    if (elements.editBtnA) elements.editBtnA.addEventListener('click', () => handleNameEdit('A'));
    if (elements.okBtnA) elements.okBtnA.addEventListener('click', () => exitEditMode('A', true));
    if (elements.editBtnB) elements.editBtnB.addEventListener('click', () => handleNameEdit('B'));
    if (elements.okBtnB) elements.okBtnB.addEventListener('click', () => exitEditMode('B', true));

    const enterEditMode = (team) => {
        const isA = team === 'A';
        const nameDiv = isA ? elements.nameA : elements.nameB;
        const nameInput = isA ? elements.nameAInput : elements.nameBInput;
        const editBtn = isA ? elements.editBtnA : elements.editBtnB;
        const okBtn = isA ? elements.okBtnA : elements.okBtnB;
        if (!nameDiv) return;
        const currentMaster = isA ? masterTeamA : masterTeamB;

        nameDiv.style.display = 'none';
        if (editBtn) editBtn.style.display = 'none';
        if (nameInput) nameInput.value = currentMaster.name.replace(/\//g, '/');
        if (nameInput) nameInput.style.display = 'block';
        if (okBtn) okBtn.style.display = 'inline-flex';
        if (nameInput) nameInput.focus();
    };

    const exitEditMode = (team, applyChanges) => {
        const isA = team === 'A';
        const nameDiv = isA ? elements.nameA : elements.nameB;
        const nameInput = isA ? elements.nameAInput : elements.nameBInput;
        const editBtn = isA ? elements.editBtnA : elements.editBtnB;
        const okBtn = isA ? elements.okBtnA : elements.okBtnB;
        if (!nameDiv) return;

        let currentMaster = isA ? masterTeamA : masterTeamB;

        if (applyChanges) {
            const newName = nameInput ? nameInput.value : currentMaster.name;

            const newMaster = {
                ...currentMaster,
                name: newName,
                color1: isA ? elements.colorA.value : elements.colorB.value,
                color2: isA ? elements.colorA2.value : elements.colorB2.value,
            };
            if (isA) masterTeamA = newMaster;
            else masterTeamB = newMaster;

            updateDisplayUI(team, newMaster);

            saveTeamColors(newName, newMaster.color1, newMaster.color2);
        }
        nameDiv.style.display = 'block';
        if (editBtn) editBtn.style.display = 'inline-flex';
        if (nameInput) nameInput.style.display = 'none';
        if (okBtn) okBtn.style.display = 'none';
    };


    // Colors (Must update master data and re-apply display)
    if (elements.colorA) elements.colorA.addEventListener('input', (e) => {
        masterTeamA.color1 = e.target.value;
        updateDisplayUI('A', masterTeamA);
        saveTeamColors(masterTeamA.name, masterTeamA.color1, masterTeamA.color2);
    });
    if (elements.colorA2) elements.colorA2.addEventListener('input', (e) => {
        masterTeamA.color2 = e.target.value;
        updateDisplayUI('A', masterTeamA);
        saveTeamColors(masterTeamA.name, masterTeamA.color1, masterTeamA.color2);
    });
    if (elements.colorB) elements.colorB.addEventListener('input', (e) => {
        masterTeamB.color1 = e.target.value;
        updateDisplayUI('B', masterTeamB);
        saveTeamColors(masterTeamB.name, masterTeamB.color1, masterTeamB.color2);
    });
    if (elements.colorB2) elements.colorB2.addEventListener('input', (e) => {
        masterTeamB.color2 = e.target.value;
        updateDisplayUI('B', masterTeamB);
        saveTeamColors(masterTeamB.name, masterTeamB.color1, masterTeamB.color2);
    });

    // Injury Time
    if (elements.injuryTimePlusBtn) elements.injuryTimePlusBtn.addEventListener('click', () => changeInjuryTime(1));
    if (elements.injuryTimeMinusBtn) elements.injuryTimeMinusBtn.addEventListener('click', () => changeInjuryTime(-1));

    // Logo Path Settings
    if (elements.logoPathBtn) elements.logoPathBtn.addEventListener('click', () => openPopup(elements.logoPathPopup));
    if (elements.editLogoPathBtn) elements.editLogoPathBtn.addEventListener('click', () => {
        const trans = translations[currentLang] || translations.en;
        const btnSpan = elements.editLogoPathBtn.querySelector('span');
        if (!elements.logoPathInput) return;

        if (elements.logoPathInput.disabled) {
            elements.logoPathInput.disabled = false;
            elements.logoPathInput.focus();
            if (btnSpan) btnSpan.textContent = trans.save;
        } else {
            const newPath = elements.logoPathInput.value.trim();
            logoFolderPath = newPath;
            localStorage.setItem('logoFolderPath', newPath);
            if (elements.currentLogoPath) elements.currentLogoPath.textContent = newPath;
            elements.logoPathInput.disabled = true;
            if (btnSpan) btnSpan.textContent = trans.edit;
            showToast(trans.toastSaved, 'success');
        }
    });

    // Global Key Listener for OBS Pass-through
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.getAttribute('id')?.startsWith('keybind-input') || e.target.getAttribute('id')?.startsWith('action-key-input')) return;

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
                case 'full_reset': fullReset(); break;
                case 'action_btn_1': handleActionButtonClick(1); break;
                case 'action_btn_2': handleActionButtonClick(2); break;
                case 'action_btn_3': handleActionButtonClick(3); break;
                case 'action_btn_4': handleActionButtonClick(4); break;
                case 'action_btn_5': handleActionButtonClick(5); break;
                case 'action_btn_6': handleActionButtonClick(6); break;
                default: return;
            }
        }
    });
};


// --- INITIALIZATION ---
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

    const trans = translations[savedLang];
    masterTeamA.name = trans.teamA;
    masterTeamB.name = trans.teamB;

    const isScore2Visible = localStorage.getItem(SCORE2_VISIBILITY_KEY);
    const isSwapVisible = localStorage.getItem(SWAP_VISIBILITY_KEY);
    const isActionVisible = localStorage.getItem(ACTION_VISIBILITY_KEY);

    maxPeriods = parseInt(localStorage.getItem(MAX_PERIODS_KEY) || 2, 10);

    if (elements.logoPathInput) elements.logoPathInput.value = logoFolderPath;
    if (elements.currentLogoPath) elements.currentLogoPath.textContent = logoFolderPath;

    setupEventListeners();
    setLanguage(savedLang);

    // Apply initial visibility states (using direct update for DCL)
    updateScore2ToggleUI(isScore2Visible === null ? true : JSON.parse(isScore2Visible));
    updateSwapToggleUI(isSwapVisible === null ? true : JSON.parse(isSwapVisible));
    updateActionButtonsToggleUI(isActionVisible === null ? true : JSON.parse(isActionVisible));

    updateActionButtonsUI();

    resetToZero();
    updateHalfText();

    setText('score2_team_a', score2A);
    setText('score2_team_b', score2B);

    obs.connect('ws://localhost:4455').catch(err => showToast(translations[currentLang].toastObsError, 'error'));

    fetchAnnouncement();
    setInterval(fetchAnnouncement, 3600000);

    const welcomeSponsorPopup = document.getElementById('welcomeSponsorPopup');
    const popupOverlay = document.getElementById('popupOverlay');
    if (welcomeSponsorPopup && popupOverlay) {
        popupOverlay.style.display = 'block';
        welcomeSponsorPopup.style.display = 'block';
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

    window.copyTag = copyTag;

    const defaultButton = document.getElementById('defaultOpen');
    if (defaultButton) defaultButton.classList.add('active');
});