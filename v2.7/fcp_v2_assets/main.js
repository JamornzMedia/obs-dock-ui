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
    // NEW LOGO CACHE ELEMENTS
    "logoDropZone", "clearLogoCacheBtn", "logoCacheList",
].reduce((acc, id) => {
    acc[id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase())] = $(id);
    return acc;
}, {});


// --- STATE VARIABLES ---
let sheetData = [];
let timer = 0, interval = null, half = '1st';
let injuryTime = 0;
let isCountdown = false;
let countdownStartTime = 2700; // 45 minutes default
let currentLang = 'th';
let logoFolderPath = 'C:/OBSAssets/logos';
let logoCache = {}; // NEW: Store Logo Data URLs here

// NEW: Master Data Objects for Team A and B
let masterTeamA = createDefaultTeam('A');
let masterTeamB = createDefaultTeam('B');

const TEAM_COLORS_KEY = 'teamColorMemory';
const VISIBILITY_KEY = 'cardVisibility';
const KEYBINDS_KEY = 'customKeybinds';
const ACTION_SETTINGS_KEY = 'actionButtonSettings';
const LOGO_CACHE_KEY = 'logoDataCache'; // NEW
const ACTION_BUTTON_COUNT = 6;

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

// NEW: Default Action Button Settings (Using Key Combination for hotkey and display)
const defaultActionSettings = Array.from({ length: ACTION_BUTTON_COUNT }, (_, i) => ({
    id: `actionBtn${i + 1}`,
    name: `Action ${i + 1}`,
    backgroundColor: (i % 3 === 0) ? '#22c55e' : (i % 3 === 1 ? '#f97316' : '#3b82f6'),
    height: 35, // default height in pixels
    hotkey: `CONTROL+F${i + 1}` // Hotkey Combination
}));


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
// NEW: OBS Hotkey Trigger (Pass Key Combination as Hotkey Name)
const triggerObsHotkey = (hotkeyCombination) => {
    // IMPORTANT: Hotkey Combination is used as the Hotkey Name for OBS.
    // This is the correct API call for OBS-WebSocket.
    obs.call('TriggerHotkeyByName', { hotkeyName: hotkeyCombination }).catch(err => {
        showToast(`${translations[currentLang].toastHotkeyFailed} ${hotkeyCombination}`, 'error');
    });
}

// --- UI & Language ---
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
};

// --- Pop-up Welcome Functions ---
const showWelcomePopup = () => {
    if (elements.welcomeSponsorPopup && elements.popupOverlay) {
        elements.popupOverlay.style.display = 'block';
        elements.welcomeSponsorPopup.style.display = 'block';

        // Open default tab (ShopeeTab)
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

// Function to handle copying link
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

// Function to handle copying Tags
const copyTag = (tagCode) => {
    // Remove HTML code entities like &lt; and &gt;
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

    // Set Headers
    elements.sourcesTableHeaders.innerHTML = `
        <th>${headers[0]}</th>
        <th>${headers[1]}</th>
        <th>${headers[2]}</th>
    `;

    // Set Body
    elements.sourcesTableBody.innerHTML = '';
    sources.forEach(item => {
        const row = elements.sourcesTableBody.insertRow();
        const nameCell = row.insertCell();
        nameCell.textContent = item.code;
        // Make the text content of the name cell clickable for copying
        nameCell.onclick = () => copySourceName(item.code);
        row.insertCell().textContent = item.type;
        row.insertCell().innerHTML = item.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    });
};

// Function to populate Tags table
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

// Keybind Helper Functions (Modified to support modifier keys and separate buttons)
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

    if (!inputElement || !editButton || !saveButton) return;

    if (enable) {
        inputElement.disabled = false;
        editButton.style.display = 'none';
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

// NEW: Action Button Specific Edit Toggle
const toggleActionEditMode = (index, enable) => {
    const trans = translations[currentLang];
    const id = `actionBtn${index}`;
    const nameInput = $(`action-name-${index}`);
    const heightInput = $(`action-height-${index}`);
    const keybindInput = $(`action-keybind-input-${index}`);
    const editButton = $(`action-keybind-edit-${index}`);
    const saveButton = $(`action-keybind-save-${index}`);

    if (enable) {
        // Enable inputs
        nameInput.disabled = false;
        heightInput.disabled = false;
        keybindInput.disabled = false;

        editButton.style.display = 'none';
        saveButton.style.display = 'inline-flex';
        nameInput.focus();

        // Clear existing listener and set new one for key capture
        keybindInput.onkeydown = null;
        keybindInput.onkeydown = (e) => captureKeyInput(e, keybindInput, saveButton);

        // Blur handler for keybind input
        keybindInput.onblur = () => {
            setTimeout(() => {
                // If focus moves away from keybind input and save button, revert to disabled state
                if (document.activeElement !== saveButton && document.activeElement !== keybindInput) {
                    toggleActionEditMode(index, false);
                }
            }, 50);
        };

    } else {
        // Disable inputs
        nameInput.disabled = true;
        heightInput.disabled = true;
        keybindInput.disabled = true;

        editButton.style.display = 'inline-flex';
        saveButton.style.display = 'none';
        keybindInput.onkeydown = null;
    }
}

// NEW: Action Button Specific Save Function
const saveActionSettingsRow = (index) => {
    // 1. Save all settings globally
    const settings = loadActionSettings().map((setting, i) => {
        const idx = i + 1;
        const nameInput = $(`action-name-${idx}`);
        const colorInput = $(`action-color-${idx}`);
        const heightInput = $(`action-height-${idx}`);
        const keybindInput = $(`action-keybind-input-${idx}`);

        // Convert formatted key (Ctrl+F1) back to raw key (CONTROL+F1)
        const rawKeybind = keybindInput.value
            .trim().toUpperCase()
            .replace(/CTRL/g, 'CONTROL')
            .replace(/ALT/g, 'ALT')
            .replace(/SHIFT/g, 'SHIFT')
            .replace(/SPACE/g, ' ');

        return {
            ...setting,
            name: nameInput.value,
            backgroundColor: colorInput.value,
            height: Math.max(25, Math.min(100, parseInt(heightInput.value) || 35)),
            hotkey: rawKeybind
        };
    });
    localStorage.setItem(ACTION_SETTINGS_KEY, JSON.stringify(settings));

    // 2. Re-render Action Buttons (only the UI buttons need update)
    renderActionButtons();

    // 3. Disable edit mode for this row
    toggleActionEditMode(index, false);

    showToast(translations[currentLang].toastActionSaved, 'success');
}


const saveKeybind = (id) => {
    const inputElement = $(`keybind-input-${id}`);
    const keyString = inputElement.value.trim().toUpperCase();

    // Revert formatting for saving (Ctrl+Alt+S -> CONTROL+ALT+S)
    const rawKeyString = keyString.replace(/CTRL/g, 'CONTROL').replace(/ALT/g, 'ALT').replace(/SHIFT/g, 'SHIFT').replace(/SPACE/g, ' ');

    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    savedKeybinds[id] = rawKeyString;
    localStorage.setItem(KEYBINDS_KEY, JSON.stringify(savedKeybinds));
    showToast(translations[currentLang].toastKeybindsSaved, 'success');
}

const populateKeybindsTable = (lang) => {
    const trans = translations[lang] || translations.en;
    // Filter out action button keybinds
    const filteredKeybindsList = trans.keybindsList.filter(item => !item.id.startsWith('actionBtn'));
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');

    // Use headers from HTML definition
    const tbody = elements.keybindsTable.querySelector('tbody');
    tbody.innerHTML = '';

    filteredKeybindsList.forEach(item => {
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

// NEW: Action Buttons Setup and Logic
const loadActionSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem(ACTION_SETTINGS_KEY));
    if (savedSettings && savedSettings.length === ACTION_BUTTON_COUNT) {
        // Ensure new properties (like keybind input value) are handled on first load after update
        return savedSettings.map((setting, i) => ({
            ...defaultActionSettings[i], // default structure
            ...setting, // override with saved values
            hotkey: setting.hotkey || defaultActionSettings[i].hotkey // Ensure hotkey is present
        }));
    }
    return defaultActionSettings;
}

const renderActionButtons = () => {
    const settings = loadActionSettings();
    elements.actionButtonsGrid.innerHTML = ''; // Clear previous buttons

    settings.forEach((setting, i) => {
        const button = document.createElement('button');
        button.id = setting.id;
        button.textContent = setting.name;
        button.style.backgroundColor = setting.backgroundColor;
        button.style.height = `${setting.height}px`;

        // Use the saved hotkey combination to trigger OBS (TriggerHotkeyByName)
        const hotkeyCombination = setting.hotkey;

        button.onclick = () => {
            if (hotkeyCombination) {
                // IMPORTANT: The hotkey combination itself is used as the Hotkey Name for OBS
                triggerObsHotkey(hotkeyCombination);
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
        const formattedKey = formatKey(setting.hotkey);

        const row = actionTableBody.insertRow();
        row.innerHTML = `
            <td>#${index}</td>
            <td><input type="text" id="action-name-${index}" value="${setting.name}" disabled></td>
            <td><input type="color" id="action-color-${index}" value="${setting.backgroundColor}"></td>
            <td><input type="number" id="action-height-${index}" value="${setting.height}" min="25" max="100" style="width: 55px;" disabled></td>
            <td>
                <input type="text" id="action-keybind-input-${index}" value="${formattedKey}" disabled>
            </td>
            <td>
                <div class="action-buttons">
                    <button id="action-keybind-edit-${index}" class="btn-secondary" title="${trans.edit}" onclick="toggleActionEditMode(${index}, true)"><i class="fas fa-pencil-alt"></i></button>
                    <button id="action-keybind-save-${index}" class="btn-success" title="${trans.save}" style="display: none;" onclick="saveActionSettingsRow(${index})"><i class="fas fa-save"></i></button>
                </div>
            </td>
        `;

        // Set colors to inputs that are not the primary focus of edit toggle
        $(`action-color-${index}`).onchange = () => {
            // Update color in button preview and then rely on Save button
            $(`actionBtn${index}`).style.backgroundColor = $(`action-color-${index}`).value;
        };
    });

    // Make utility functions available globally for onclick from the table rows
    window.toggleActionEditMode = toggleActionEditMode;
    window.saveActionSettingsRow = saveActionSettingsRow;
}

// NEW: Visibility Controls Logic
const loadVisibilitySettings = () => {
    const defaultSettings = {
        score2: true,
        swapCard: true,
        actionButtons: true,
    };
    const saved = JSON.parse(localStorage.getItem(VISIBILITY_KEY) || '{}');
    return { ...defaultSettings, ...saved };
}

const applyVisibilitySettings = () => {
    const settings = loadVisibilitySettings();

    // Apply to UI cards
    elements.score2Card.classList.toggle('hidden', !settings.score2);
    elements.swapCard.classList.toggle('hidden', !settings.swapCard);
    elements.actionButtonsCard.classList.toggle('hidden', !settings.actionButtons);

    // Apply to checkboxes in settings popup
    if (elements.score2VisibilityCheck) elements.score2VisibilityCheck.checked = settings.score2;
    if (elements.swapCardVisibilityCheck) elements.swapCardVisibilityCheck.checked = settings.swapCard;
    if (elements.actionCardVisibilityCheck) elements.actionCardVisibilityCheck.checked = settings.actionButtons;
}

const saveVisibilitySetting = (key, value) => {
    const settings = loadVisibilitySettings();
    settings[key] = value;
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(settings));
    applyVisibilitySettings();
    showToast(translations[currentLang].toastSaved, 'success');
}
// END NEW: Visibility Controls Logic

const populateDynamicLists = (lang) => {
    const trans = translations[lang] || translations.en;
    // Details Popup
    populateTagsTable(lang);

    // Action Settings Table
    populateActionSettingsTable(lang);

    // Keybinds Table
    populateKeybindsTable(lang);

    // Help Popup - Use new table function
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

    // Update specific buttons that change text
    const editLogoPathBtnSpan = elements.editLogoPathBtn.querySelector('span');
    if (elements.logoPathInput.disabled) {
        editLogoPathBtnSpan.textContent = trans.edit;
    } else {
        editLogoPathBtnSpan.textContent = trans.save;
    }

    // Update master team names from new language
    masterTeamA.name = masterTeamA.name === translations.en.teamA || masterTeamA.name === translations.th.teamA ? trans.teamA : masterTeamA.name;
    masterTeamB.name = masterTeamB.name === translations.en.teamB || masterTeamB.name === translations.th.teamB ? trans.teamB : masterTeamB.name;

    // Re-render team UI to update default names and initials
    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2);

    populateDynamicLists(lang);
};


const getStoredKeybinds = () => {
    const keybindsList = translations[currentLang].keybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    const activeKeybinds = {};

    // Filter to only include non-action button keybinds for global use
    const filteredKeybindsList = keybindsList.filter(item => !item.id.startsWith('actionBtn'));

    filteredKeybindsList.forEach(item => {
        const key = savedKeybinds[item.id] !== undefined ? savedKeybinds[item.id] : item.default;
        activeKeybinds[item.id] = key.trim().toUpperCase(); // Normalize key
    });

    return activeKeybinds;
}

const resetKeybinds = () => {
    // Note: Action buttons now save their keybinds in ACTION_SETTINGS_KEY
    localStorage.removeItem(KEYBINDS_KEY);
    populateKeybindsTable(currentLang);
    showToast(translations[currentLang].resetKeybinds, 'info');
}

const resetTeamColors = () => {
    localStorage.removeItem(TEAM_COLORS_KEY);
    showToast(translations[currentLang].toastColorsCleared, 'info');
}

// --- Announcement (Updated to read local TXT file) ---
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

// --- Team Color Memory Functions ---
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

// Uses Master Data's team name
const loadTeamColors = (teamName) => {
    try {
        const colors = JSON.parse(localStorage.getItem(TEAM_COLORS_KEY) || '{}');
        return colors[teamName.replace(/\//g, ' ').trim()];
    } catch (e) {
        console.error("Failed to load team colors:", e);
        return null;
    }
};

// --- LOGO CACHE LOGIC (NEW) ---
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
        showToast(translations[currentLang].toastSaved, 'success');
    } catch (e) {
        showToast(translations[currentLang].toastCacheSaveFailed, 'error');
        console.error("Failed to save logo to cache:", e);
    }
}

const clearLogoCache = () => {
    logoCache = {};
    localStorage.removeItem(LOGO_CACHE_KEY);
    populateLogoCacheList();
    // Force UI refresh in case logos were showing from cache
    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2);
    showToast(translations[currentLang].toastCacheCleared, 'info');
}

const populateLogoCacheList = () => {
    elements.logoCacheList.innerHTML = '';
    const keys = Object.keys(logoCache);
    if (keys.length === 0) {
        elements.logoCacheList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted-color);">${translations[currentLang].logoCacheEmpty}</p>`;
        return;
    }

    keys.forEach(key => {
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 0.9rem;';

        const img = document.createElement('img');
        img.src = logoCache[key];
        img.alt = key;
        img.style.cssText = 'width: 24px; height: 24px; object-fit: contain; border-radius: 4px;';

        const span = document.createElement('span');
        span.textContent = key;

        li.appendChild(img);
        li.appendChild(span);
        elements.logoCacheList.appendChild(li);
    });
}

// NEW: Logo Drop Zone Handlers
const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.logoDropZone.style.backgroundColor = 'var(--card-bg-color)';

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const fileName = file.name.replace(/\.(png|jpe?g|gif|webp)$/i, '');
            const logoKey = fileName.replace(/\s/g, '').toLowerCase();

            logoCache[logoKey] = event.target.result;
            saveLogoCache(); // Save cache to localStorage
            showToast(`${translations[currentLang].logoCacheSaved} ${fileName}`, 'success');
        };
        reader.readAsDataURL(file);
    });
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

// Function to update the team's master data and UI/OBS sources
const updateTeamUI = (team, name, logoFile, color1, color2, score, score2) => {
    const isA = team === 'A';
    const masterTeam = isA ? masterTeamA : masterTeamB;

    // Update Master Data
    masterTeam.name = name;
    masterTeam.logoFile = logoFile;
    masterTeam.color1 = color1;
    masterTeam.color2 = color2;
    // Only update score if provided, otherwise retain current value
    masterTeam.score = score !== undefined ? score : masterTeam.score;
    masterTeam.score2 = score2 !== undefined ? score2 : masterTeam.score2;

    // OBS Source Names
    const obsNameSource = isA ? 'name_team_a' : 'name_team_b';
    const obsLogoSource = isA ? 'logo_team_a' : 'logo_team_b';
    const obsColorSource1 = isA ? 'Color_Team_A' : 'Color_Team_B';
    const obsColorSource2 = isA ? 'Color_Team_A_2' : 'Color_Team_B_2';
    const obsScoreSource = isA ? 'score_team_a' : 'score_team_b';
    const obsScore2Source = isA ? 'score2_team_a' : 'score2_team_b';

    // UI Elements
    const nameEl = isA ? elements.nameA : elements.nameB;
    const logoEl = isA ? elements.logoA : elements.logoB;
    const initialsEl = isA ? elements.initialsA : elements.initialsB;
    const colorEl1 = isA ? elements.colorA : elements.colorB;
    const colorEl2 = isA ? elements.colorA2 : elements.colorB2;
    const scoreEl = isA ? elements.scoreA : elements.scoreB;
    const score2El = isA ? elements.score2A : elements.score2B;

    // Update UI elements
    nameEl.innerHTML = masterTeam.name.replace(/\//g, '<br>');
    colorEl1.value = masterTeam.color1;
    colorEl2.value = masterTeam.color2;
    initialsEl.textContent = getTeamInitials(masterTeam.name.replace(/\//g, ' '));
    scoreEl.textContent = masterTeam.score;
    score2El.textContent = masterTeam.score2;

    // Show/Hide logo based on file
    if (masterTeam.logoFile) {
        const logoKey = masterTeam.logoFile.replace(/\s/g, '').toLowerCase().replace(/\.(png|jpe?g|gif|webp)$/i, '');

        if (logoCache[logoKey]) {
            // NEW: Show Logo from Cache (Base64 Data URL) on Dock UI
            logoEl.src = logoCache[logoKey];
            logoEl.style.display = 'block';
            initialsEl.style.display = 'none';
        } else {
            // Use File URL for OBS source (LogoFolderPath) and for preview if no cache
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

    // Update OBS (Always use the OBS logic, which needs logoFile and logoFolderPath)
    setText(obsNameSource, masterTeam.name.replace(/\//g, '\n'));
    setImage(obsLogoSource, masterTeam.logoFile);
    setSourceColor(obsColorSource1, masterTeam.color1);
    setSourceColor(obsColorSource2, masterTeam.color2);
    setText(obsScoreSource, masterTeam.score);
    setText(obsScore2Source, masterTeam.score2);

    // Save colors to memory
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

    // Update Master Data and UI for A
    updateTeamUI('A', teamAName, logoAFile, colorA1, colorA2, masterTeamA.score, masterTeamA.score2);
    // Update Master Data and UI for B
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
    // NEW LOGIC: Swap the entire master objects
    [masterTeamA, masterTeamB] = [masterTeamB, masterTeamA];

    // Re-render UI and update OBS based on the swapped master objects
    // Use an object destructuring trick to update all properties in one call
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
    // Reset Scores
    masterTeamA.score = masterTeamB.score = 0;
    masterTeamA.score2 = masterTeamB.score2 = 0;
    updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, masterTeamA.color2, 0, 0);
    updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, masterTeamB.color2, 0, 0);

    // Reset Timer & Half
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

const stopTimer = () => { clearInterval(interval); interval = null; };

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
    half = half === '1st' ? '2nd' : '1st';
    elements.halfText.textContent = half;
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

// NEW LOGIC: Use Master Data
const enterEditMode = (team) => {
    const isA = team === 'A';
    const masterTeam = isA ? masterTeamA : masterTeamB;
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;
    nameDiv.style.display = 'none';
    editBtn.style.display = 'none';
    nameInput.value = masterTeam.name.replace(/\//g, '/'); // Use current master name
    nameInput.style.display = 'block';
    okBtn.style.display = 'inline-flex';
    nameInput.focus();
};

// NEW LOGIC: Use Master Data
const exitEditMode = (team, applyChanges) => {
    const isA = team === 'A';
    const masterTeam = isA ? masterTeamA : masterTeamB;
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;

    if (applyChanges) {
        const newName = nameInput.value.trim() || masterTeam.name;

        // Update Master Data and then the UI/OBS
        updateTeamUI(team, newName, masterTeam.logoFile, masterTeam.color1, masterTeam.color2);

        // Color saving is already handled in updateTeamUI
    }

    nameDiv.style.display = 'block';
    editBtn.style.display = 'inline-flex';
    nameInput.style.display = 'none';
    okBtn.style.display = 'none';
};

const setupEventListeners = () => {
    // Bind Save buttons to the same logic
    const saveHandler = () => {
        localStorage.setItem('detailsText', elements.detailsText.value);
        // We only save action settings here, not keybinds (they are saved individually)
        // Note: Global save is disabled since action settings save independently by row
        closeAllPopups();
        showToast(translations[currentLang].toastSaved, 'success');
    };
    elements.saveDetailsBtnTop.addEventListener('click', saveHandler);

    // Bind Close buttons
    const closeHandler = () => {
        // Ensure all keybind inputs are disabled before closing
        const keybindsList = translations[currentLang].keybindsList || [];
        keybindsList.forEach(item => toggleKeybindEditMode(item.id, false));
        // Ensure all Action keybind inputs are disabled before closing
        loadActionSettings().forEach((_, i) => toggleActionEditMode(i + 1, false));

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

    // NEW: Visibility Checkboxes
    elements.score2VisibilityCheck.addEventListener('change', (e) => saveVisibilitySetting('score2', e.target.checked));
    elements.swapCardVisibilityCheck.addEventListener('change', (e) => saveVisibilitySetting('swapCard', e.target.checked));
    elements.actionCardVisibilityCheck.addEventListener('change', (e) => saveVisibilitySetting('actionButtons', e.target.checked));


    // Keybinds Control
    elements.resetKeybindsBtn.addEventListener('click', resetKeybinds);

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
        // Re-populate all dynamic tables on open to load latest saved/default values
        populateActionSettingsTable(currentLang);
        populateKeybindsTable(currentLang);
        applyVisibilitySettings(); // Load visibility settings to checkboxes
        openPopup(elements.detailsPopup);
    });
    // --- MOVED AND RECOLORED BUTTON ---
    elements.copyBtn.addEventListener('click', copyDetails);
    // -----------------------------------
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
    elements.closeWelcomeBtn.addEventListener('click', closeWelcomePopup);

    // Copy Link Buttons for Welcome Popup
    elements.copyShopeeLinkBtn.addEventListener('click', () => copyLink(elements.copyShopeeLinkBtn.getAttribute('data-link')));
    elements.copyEasyDonateLinkBtn.addEventListener('click', () => copyLink(elements.copyEasyDonateLinkBtn.getAttribute('data-link')));


    // Time Settings
    elements.saveTimeSettingsBtn.addEventListener('click', saveTimeSettings);
    elements.saveAndUpdateTimeBtn.addEventListener('click', saveAndUpdateTime);

    // Edit Name
    elements.editBtnA.addEventListener('click', () => enterEditMode('A'));
    elements.okBtnA.addEventListener('click', () => exitEditMode('A', true));
    elements.editBtnB.addEventListener('click', () => enterEditMode('B'));
    elements.okBtnB.addEventListener('click', () => exitEditMode('B', true));

    // Colors (Added Team Color Memory Save on change)
    elements.colorA.addEventListener('input', (e) => {
        updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, e.target.value, masterTeamA.color2);
    });
    elements.colorA2.addEventListener('input', (e) => {
        updateTeamUI('A', masterTeamA.name, masterTeamA.logoFile, masterTeamA.color1, e.target.value);
    });
    elements.colorB.addEventListener('input', (e) => {
        updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, e.target.value, masterTeamB.color2);
    });
    elements.colorB2.addEventListener('input', (e) => {
        updateTeamUI('B', masterTeamB.name, masterTeamB.logoFile, masterTeamB.color1, e.target.value);
    });

    // Injury Time
    elements.injuryTimePlusBtn.addEventListener('click', () => changeInjuryTime(1));
    elements.injuryTimeMinusBtn.addEventListener('click', () => changeInjuryTime(-1));

    // Logo Path Settings
    elements.logoPathBtn.addEventListener('click', () => {
        populateLogoCacheList();
        openPopup(elements.logoPathPopup);
    });
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

    // NEW: Logo Cache Handlers
    elements.clearLogoCacheBtn.addEventListener('click', clearLogoCache);
    elements.logoDropZone.addEventListener('dragover', handleDragOver);
    elements.logoDropZone.addEventListener('dragleave', handleDragLeave);
    elements.logoDropZone.addEventListener('drop', handleFileDrop);


    // Global Key Listener for OBS Pass-through
    document.addEventListener('keydown', (e) => {
        // Only trigger keybinds if user is not typing in a general input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.getAttribute('id')?.startsWith('keybind-input') || e.target.getAttribute('id')?.startsWith('action-keybind-input')) return;

        const keybinds = getStoredKeybinds();
        const actionSettings = loadActionSettings(); // Load action hotkeys

        // Build combination string (e.g., CONTROL+ALT+F1)
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('CONTROL');
        if (e.altKey) modifiers.push('ALT');
        if (e.shiftKey) modifiers.push('SHIFT');

        let key = e.key.toUpperCase();
        // Exclude modifier key itself from the key part if it was the only one pressed
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
                default: return;
            }
        }

        // NEW: Check for Action Button hotkeys separately
        for (let i = 0; i < actionSettings.length; i++) {
            if (actionSettings[i].hotkey === keyCombination) {
                e.preventDefault();
                triggerObsHotkey(actionSettings[i].hotkey);
                return;
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

    loadLogoCache(); // NEW: Load logo cache

    // Initialize Master Data before setting language (to use default values)
    masterTeamA = createDefaultTeam('A');
    masterTeamB = createDefaultTeam('B');

    elements.logoPathInput.value = logoFolderPath;
    elements.currentLogoPath.textContent = logoFolderPath;

    setupEventListeners();
    setLanguage(savedLang); // This will update the UI with masterTeam data

    applyVisibilitySettings(); // Apply initial visibility state
    renderActionButtons(); // Render action buttons with saved/default settings

    resetToZero(); // Set timer to 00:00, update OBS

    // Make copyTag and the new action functions globally available for onclick from HTML/tables
    window.copyTag = copyTag;

    obs.connect('ws://localhost:4455').catch(err => showToast(translations[currentLang].toastObsError, 'error'));

    fetchAnnouncement();
    // Re-fetch announcement every hour
    setInterval(fetchAnnouncement, 3600000);

    // Ensure the default tab button is styled correctly after DOM load
    const defaultButton = document.getElementById('defaultOpen');
    if (defaultButton) defaultButton.classList.add('active');

    // REMOVED: showWelcomePopup();
});