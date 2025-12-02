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
    "actionButtonsCard", "actionBtn1", "actionBtn2", "actionBtn3", "actionBtn4", "actionBtn5", "actionBtn6", // NEW Action Buttons (6)
    "resetActionKeybindsBtn",
    "maxPeriods", // NEW Max Periods Input
    "toggleScore2Visible", "toggleSwapVisible", "toggleActionVisible", // NEW Visibility Checkboxes
].reduce((acc, id) => {
    acc[id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase())] = $(id);
    return acc;
}, {});


// --- STATE VARIABLES ---
let sheetData = [];
let scoreA = 0, scoreB = 0;
let score2A = 0, score2B = 0;
let timer = 0, interval = null;
let currentPeriod = 1; // Current Period/Half (1st, 2nd, etc.)
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
const MAX_PERIODS_KEY = 'maxPeriods'; // NEW Periods Key

// Master Data (Hold permanent info for Team A and Team B, regardless of current display slot)
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
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
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

    // Disable all keybind/action inputs when closing
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

    elements.sourcesTableHeaders.innerHTML = `<th>${headers[0]}</th><th>${headers[1]}</th><th>${headers[2]}</th>`;

    elements.sourcesTableBody.innerHTML = '';
    sources.forEach(item => {
        const row = elements.sourcesTableBody.insertRow();
        const nameCell = row.insertCell();
        nameCell.textContent = item.code;
        nameCell.onclick = () => copySourceName(item.code);
        row.insertCell().textContent = item.type;
        row.insertCell().innerHTML = item.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    });
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

    elements.tagsTable.innerHTML = thead + tbody;
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
    saveButton.style.display = 'inline-flex';
    editButton.style.display = 'none';
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

const toggleActionEditMode = (id, enable) => {
    const nameInput = $(`action-name-input-${id}`);
    const colorInput = $(`action-color-input-${id}`);
    const keyInput = $(`action-key-input-${id}`);
    const editBtn = $(`action-edit-config-${id}`);
    const saveBtn = $(`action-save-config-${id}`);

    if (!nameInput || !editBtn) return;

    if (enable) {
        nameInput.disabled = false;
        colorInput.disabled = false;
        keyInput.disabled = false;
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-flex';
        nameInput.focus();

        // Key capture logic is moved to action-key-input
        keyInput.onkeydown = null;
        keyInput.onblur = null;

        keyInput.onkeydown = (e) => captureKeyInput(e, keyInput, saveBtn, editBtn);
        keyInput.onblur = () => {
            setTimeout(() => {
                if (document.activeElement !== saveBtn && document.activeElement !== editBtn) {
                    // Only exit if the input is still enabled (i.e. not saved yet)
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
        const rawKey = savedKeybinds[configId] !== undefined ? savedKeybinds[configId] : defaultAction ? defaultAction.default : '';
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

const updateActionButtonsUI = () => {
    actionButtonConfig.forEach(config => {
        const btn = elements[`actionBtn${config.id}`];
        if (btn) {
            btn.textContent = config.label;
            btn.style.backgroundColor = config.color;
        }
    });
}

const handleActionButtonClick = (id) => {
    const config = actionButtonConfig.find(c => c.id === id);
    if (!config) return;

    // Send the button label as the output text to the specified output source
    const outputText = config.label;
    const targetSource = config.output || `action_output_${id}`;

    setText(targetSource, outputText);
    showToast(`${config.label}: Sent command to ${targetSource}`, 'info');
}

const resetActionKeybinds = () => {
    const actionKeybinds = translations[currentLang].actionKeybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');

    // Remove only action button keybinds
    actionKeybinds.forEach(item => delete savedKeybinds[item.id]);

    localStorage.setItem(KEYBINDS_KEY, JSON.stringify(savedKeybinds));

    // Re-populate the table to reflect default keybinds
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
    elements.score2Card.classList.toggle('hidden', !isVisible);
}

const updateSwapToggleUI = (isVisible) => {
    if (elements.swapCard) {
        elements.swapCard.classList.toggle('hidden', !isVisible);
    }
}

const updateActionButtonsToggleUI = (isVisible) => {
    if (elements.actionButtonsCard) {
        elements.actionButtonsCard.classList.toggle('hidden', !isVisible);
    }
}

const saveVisibilityStates = () => {
    const isScore2Visible = elements.toggleScore2Visible.checked;
    const isSwapVisible = elements.toggleSwapVisible.checked;
    const isActionVisible = elements.toggleActionVisible.checked;

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
    if (elements.logoPathInput && elements.logoPathInput.disabled) {
        editLogoPathBtnSpan.textContent = trans.edit;
    } else if (elements.logoPathInput) {
        editLogoPathBtnSpan.textContent = trans.save;
    }

    populateDynamicLists(lang);
    updateHalfText();
};


// --- HALF/PERIODS LOGIC ---
const updateHalfText = () => {
    const suffix = ["st", "nd", "rd", "th"][currentPeriod - 1] || "th";
    const text = (currentPeriod <= 3) ? `${currentPeriod}${suffix}` : `${currentPeriod}th`;
    elements.halfText.textContent = text;
    setText('half_text', text);
}

const toggleHalf = () => {
    currentPeriod = (currentPeriod % maxPeriods) + 1; // Cycle from 1 to maxPeriods
    updateHalfText();
};

const saveMaxPeriods = () => {
    const newMaxPeriods = parseInt(elements.maxPeriods.value, 10);
    if (isNaN(newMaxPeriods) || newMaxPeriods < 1 || newMaxPeriods > 9) {
        elements.maxPeriods.value = maxPeriods; // Revert to current maxPeriods
        return showToast(translations[currentLang].toastInvalidTime, 'error'); // Reuse invalid time format for simplicity
    }
    maxPeriods = newMaxPeriods;
    localStorage.setItem(MAX_PERIODS_KEY, maxPeriods);

    // Ensure current period is valid after change
    if (currentPeriod > maxPeriods) {
        currentPeriod = 1;
        updateHalfText();
    }
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
    // Update display based on current assignment (Master A -> Display A, Master B -> Display B)
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

    // Update UI elements
    nameEl.innerHTML = teamData.name.replace(/\//g, '<br>');
    colorEl1.value = teamData.color1;
    colorEl2.value = teamData.color2;
    initialsEl.textContent = getTeamInitials(teamData.name.replace(/\//g, ' '));

    if (teamData.logo) {
        const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(teamData.logo);
        logoEl.src = `file:///${logoFolderPath}/${teamData.logo}${hasExt ? '' : '.png'}`;
        logoEl.style.display = 'block';
        initialsEl.style.display = 'none';
    } else {
        logoEl.src = '';
        logoEl.style.display = 'none';
        initialsEl.style.display = 'block';
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
    // Swap the Master Data assignments
    [masterTeamA, masterTeamB] = [masterTeamB, masterTeamA];

    // Swap the scores only on the display/control side
    [scoreA, scoreB] = [scoreB, scoreA];
    [score2A, score2B] = [score2B, score2A];

    // Re-apply master data to display slots
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

    // Update Scores
    elements.scoreA.textContent = scoreA;
    setText('score_team_a', scoreA);
    elements.scoreB.textContent = scoreB;
    setText('score_team_b', scoreB);

    elements.score2A.textContent = score2A;
    setText('score2_team_a', score2A);
    elements.score2B.textContent = score2B;
    setText('score2_team_b', score2B);

    showToast(translations[currentLang].toastSwapped, 'info');
};


const setupEventListeners = () => {
    // Bind Save buttons to the same logic
    const saveHandler = () => {
        localStorage.setItem('detailsText', elements.detailsText.value);
        closeAllPopups();
        showToast(translations[currentLang].toastSaved, 'success');
    };
    elements.saveDetailsBtnTop.addEventListener('click', saveHandler);

    // Bind Close buttons
    const closeHandler = () => {
        closeAllPopups();
    };

    elements.closeDetailsBtnTop.addEventListener('click', closeHandler);
    elements.closeDetailsBtnBottom.addEventListener('click', closeHandler);

    elements.languageSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    elements.excelBtn.addEventListener('click', handleExcel);
    elements.loadBtn.addEventListener('click', applyMatch);
    elements.fullResetBtn.addEventListener('click', fullReset);
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

    // NEW: Action Button Clicks (6 buttons)
    for (let i = 1; i <= 6; i++) {
        elements[`actionBtn${i}`].addEventListener('click', () => handleActionButtonClick(i));
    }

    // NEW: Visibility Checkbox Listener
    elements.toggleScore2Visible.addEventListener('change', saveVisibilityStates);
    elements.toggleSwapVisible.addEventListener('change', saveVisibilityStates);
    elements.toggleActionVisible.addEventListener('change', saveVisibilityStates);

    // Keybinds Control
    elements.resetKeybindsBtn.addEventListener('click', resetKeybinds);
    elements.resetActionKeybindsBtn.addEventListener('click', resetActionKeybinds);

    // Team Color Reset
    elements.resetColorsBtn.addEventListener('click', resetTeamColors);

    elements.halfBtn.addEventListener('click', toggleHalf);
    elements.playBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', stopTimer);
    elements.resetToStartBtn.addEventListener('click', resetToStartTime);
    elements.resetToZeroBtn.addEventListener('click', resetToZero);
    elements.editTimeBtn.addEventListener('click', openTimeSettings);
    elements.countdownCheck.addEventListener('change', () => { isCountdown = elements.countdownCheck.checked; });
    elements.settingsBtn.addEventListener('click', () => {
        elements.detailsText.value = localStorage.getItem('detailsText') || '';
        elements.maxPeriods.value = maxPeriods;
        // Set Checkbox states
        elements.toggleScore2Visible.checked = JSON.parse(localStorage.getItem(SCORE2_VISIBILITY_KEY) || 'true');
        elements.toggleSwapVisible.checked = JSON.parse(localStorage.getItem(SWAP_VISIBILITY_KEY) || 'true');
        elements.toggleActionVisible.checked = JSON.parse(localStorage.getItem(ACTION_VISIBILITY_KEY) || 'true');

        populateDynamicLists(currentLang);
        openPopup(elements.detailsPopup);
    });
    elements.copyBtn.addEventListener('click', copyDetails);
    elements.helpBtn.addEventListener('click', () => openPopup(elements.helpPopup));
    elements.donateBtn.addEventListener('click', () => openPopup(elements.donatePopup));
    elements.changelogBtn.addEventListener('click', () => openPopup(elements.changelogPopup));
    elements.popupOverlay.addEventListener('click', closeAllPopups);

    // Other Popups Close Buttons
    elements.closeHelpBtn.addEventListener('click', closeAllPopups);
    elements.closeDonateBtn.addEventListener('click', closeAllPopups);
    elements.closeChangelogBtn.addEventListener('click', closeAllPopups);
    elements.closeTimeSettingsBtn.addEventListener('click', closeAllPopups);
    elements.closeLogoPathBtn.addEventListener('click', closeAllPopups);

    // Time Settings
    elements.saveTimeSettingsBtn.addEventListener('click', saveTimeSettings);
    elements.saveAndUpdateTimeBtn.addEventListener('click', saveAndUpdateTime);
    // NEW: Save Max Periods
    elements.maxPeriods.addEventListener('change', saveMaxPeriods);


    // Edit Name
    const handleNameEdit = (team) => {
        // Exit edit mode for the opposite team if active
        if (team === 'A' && elements.nameBInput.style.display !== 'none') exitEditMode('B', false);
        if (team === 'B' && elements.nameAInput.style.display !== 'none') exitEditMode('A', false);
        enterEditMode(team);
    };

    elements.editBtnA.addEventListener('click', () => handleNameEdit('A'));
    elements.okBtnA.addEventListener('click', () => exitEditMode('A', true));
    elements.editBtnB.addEventListener('click', () => handleNameEdit('B'));
    elements.okBtnB.addEventListener('click', () => exitEditMode('B', true));

    const exitEditMode = (team, applyChanges) => {
        const isA = team === 'A';
        const nameDiv = isA ? elements.nameA : elements.nameB;
        const nameInput = isA ? elements.nameAInput : elements.nameBInput;
        const editBtn = isA ? elements.editBtnA : elements.editBtnB;
        const okBtn = isA ? elements.okBtnA : elements.okBtnB;

        if (applyChanges) {
            const newName = nameInput.value;
            const currentMaster = isA ? masterTeamA : masterTeamB;

            // Update Master Data
            const newMaster = {
                ...currentMaster,
                name: newName,
                color1: isA ? elements.colorA.value : elements.colorB.value,
                color2: isA ? elements.colorA2.value : elements.colorB2.value,
            };
            if (isA) masterTeamA = newMaster;
            else masterTeamB = newMaster;

            // Re-apply to the current display slot (A or B)
            updateDisplayUI(team, newMaster);

            // Save team colors after manual edit
            saveTeamColors(newName, newMaster.color1, newMaster.color2);
        }
        nameDiv.style.display = 'block';
        editBtn.style.display = 'inline-flex';
        nameInput.style.display = 'none';
        okBtn.style.display = 'none';
    };


    // Colors (Added Team Color Memory Save on change) - MUST update master data and re-apply display
    elements.colorA.addEventListener('input', (e) => {
        masterTeamA.color1 = e.target.value;
        updateDisplayUI('A', masterTeamA);
        saveTeamColors(masterTeamA.name, masterTeamA.color1, masterTeamA.color2);
    });
    elements.colorA2.addEventListener('input', (e) => {
        masterTeamA.color2 = e.target.value;
        updateDisplayUI('A', masterTeamA);
        saveTeamColors(masterTeamA.name, masterTeamA.color1, masterTeamA.color2);
    });
    elements.colorB.addEventListener('input', (e) => {
        masterTeamB.color1 = e.target.value;
        updateDisplayUI('B', masterTeamB);
        saveTeamColors(masterTeamB.name, masterTeamB.color1, masterTeamB.color2);
    });
    elements.colorB2.addEventListener('input', (e) => {
        masterTeamB.color2 = e.target.value;
        updateDisplayUI('B', masterTeamB);
        saveTeamColors(masterTeamB.name, masterTeamB.color1, masterTeamB.color2);
    });

    // Injury Time
    elements.injuryTimePlusBtn.addEventListener('click', () => changeInjuryTime(1));
    elements.injuryTimeMinusBtn.addEventListener('click', () => changeInjuryTime(-1));

    // Logo Path Settings
    elements.logoPathBtn.addEventListener('click', () => openPopup(elements.logoPathPopup));
    elements.editLogoPathBtn.addEventListener('click', () => {
        const trans = translations[currentLang] || translations.en;
        const btnSpan = elements.editLogoPathBtn.querySelector('span');

        if (elements.logoPathInput.disabled) { // Enter edit mode
            elements.logoPathInput.disabled = false;
            elements.logoPathInput.focus();
            btnSpan.textContent = trans.save;
        } else { // Save changes
            const newPath = elements.logoPathInput.value.trim();
            logoFolderPath = newPath;
            localStorage.setItem('logoFolderPath', newPath);
            elements.currentLogoPath.textContent = newPath;
            elements.logoPathInput.disabled = true;
            btnSpan.textContent = trans.edit;
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
                // NEW Action Button Keybinds (6 buttons)
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
    // Load saved settings from localStorage
    const savedLang = localStorage.getItem('scoreboardLang') || 'th';
    const savedTime = localStorage.getItem('countdownStartTime');
    if (savedTime) {
        countdownStartTime = parseInt(savedTime, 10);
    }
    const savedPath = localStorage.getItem('logoFolderPath');
    if (savedPath) {
        logoFolderPath = savedPath;
    }

    // Load Master Data Default if none is present (to avoid errors on first load)
    const trans = translations[savedLang];
    masterTeamA.name = trans.teamA;
    masterTeamB.name = trans.teamB;

    // Load initial visibility states (default to true)
    const isScore2Visible = localStorage.getItem(SCORE2_VISIBILITY_KEY);
    const isSwapVisible = localStorage.getItem(SWAP_VISIBILITY_KEY);
    const isActionVisible = localStorage.getItem(ACTION_VISIBILITY_KEY);

    // Load Max Periods
    maxPeriods = parseInt(localStorage.getItem(MAX_PERIODS_KEY) || 2, 10);

    elements.logoPathInput.value = logoFolderPath;
    elements.currentLogoPath.textContent = logoFolderPath;

    setupEventListeners();
    setLanguage(savedLang); // This calls populateDynamicLists

    // Apply initial visibility states (using direct update for DCL)
    updateScore2ToggleUI(isScore2Visible === null ? true : JSON.parse(isScore2Visible));
    updateSwapToggleUI(isSwapVisible === null ? true : JSON.parse(isSwapVisible));
    updateActionButtonsToggleUI(isActionVisible === null ? true : JSON.parse(isActionVisible));

    // Apply action button labels/colors
    updateActionButtonsUI();

    resetToZero();
    updateHalfText(); // Set initial 1st/Period 1

    // Send initial Score 2 data to OBS as well
    setText('score2_team_a', score2A);
    setText('score2_team_b', score2B);

    // Ensure OBS connection is attempted
    obs.connect('ws://localhost:4455').catch(err => showToast(translations[currentLang].toastObsError, 'error'));

    fetchAnnouncement();
    setInterval(fetchAnnouncement, 3600000);

    // Initial welcome popup display
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

    // Make copyTag globally available for onclick events in the Tags table
    window.copyTag = copyTag;

    const defaultButton = document.getElementById('defaultOpen');
    if (defaultButton) defaultButton.classList.add('active');
});