// fcp_v2_assets/main.js

// 1. นำเข้าข้อมูลภาษาจากไฟล์ languages.js
import { translations } from './languages.js';

// --- DOM ELEMENTS ---
const $ = id => document.getElementById(id);
const elements = [
    "nameA", "nameB", "label1", "label2", "label3", "label4", "label5", // V2.7 Labels
    "logoA", "logoB", "initialsA", "initialsB", "scoreA", "scoreB",
    "score2Card", "score2A", "score2B", "score2APlusBtn", "score2AMinusBtn", "score2BPlusBtn", "score2BMinusBtn", "resetScore2Btn",
    "swapCard", "swapBtn", // V2.7 Swap Card
    "actionButtonsCard", "actionBtn1", "actionBtn2", "actionBtn3", "actionBtn4", "actionBtn5", "actionBtn6", // V2.7 Actions
    "toggleScore2Visible", "toggleSwapVisible", "toggleActionVisible", // V2.7 Visibility Controls
    "timerText", "halfText", "announcement-text", "matchID",
    "colorA", "colorB", "colorA2", "colorB2",
    "countdownCheck", "languageSelector", "nameA-input", "nameB-input", "excelBtn", "loadBtn",
    "editBtnA", "okBtnA", "editBtnB", "okBtnB", "scoreAPlusBtn", "scoreAMinusBtn",
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
    "sourcesTableHeaders", "sourcesTableBody", "keybindsTable", "resetKeybindsBtn", "resetColorsBtn", "tagsTable",
].reduce((acc, id) => {
    // Converts hyphenated IDs to camelCase (e.g., nameA-input to nameAInput)
    const camelCaseId = id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
    acc[camelCaseId] = $(id);
    return acc;
}, {});

// --- MASTER STATE VARIABLES ---
let sheetData = [];
let timer = 0, interval = null, half = '1st';
let injuryTime = 0;
let isCountdown = false;
let countdownStartTime = 2700; // 45 minutes default
let currentLang = 'th';
let logoFolderPath = 'C:/OBSAssets/logos';
const TEAM_COLORS_KEY = 'teamColorMemory';
const SCORE2_VISIBILITY_KEY = 'score2Visible';
const SWAP_VISIBILITY_KEY = 'swapVisible';
const ACTION_VISIBILITY_KEY = 'actionVisible';
const KEYBINDS_KEY = 'customKeybinds';

// Master Data structure for Team A and B
let masterTeamA = {
    name: translations['th'].teamA, score: 0, score2: 0,
    logo: '', color1: '#ffffff', color2: '#000000'
};
let masterTeamB = {
    name: translations['th'].teamB, score: 0, score2: 0,
    logo: '', color1: '#ffffff', color2: '#000000'
};

// --- OBS & Utility Functions ---
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
const showWelcomePopup = () => {
    if (elements.welcomeSponsorPopup && elements.popupOverlay) {
        elements.popupOverlay.style.display = 'block';
        elements.welcomeSponsorPopup.style.display = 'block';

        const defaultButton = document.getElementById('defaultOpen');
        if (defaultButton && typeof openWelcomeTab === 'function') {
            openWelcomeTab({ currentTarget: defaultButton }, 'ShopeeTab');
        } else if (defaultButton) {
            defaultButton.click();
            document.getElementById('ShopeeTab').style.display = 'block';
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
        $(`keybind-edit-${item.id}`).onclick = () => toggleKeybindEditMode(item.id, true);
        $(`keybind-save-${item.id}`).onclick = () => {
            saveKeybind(item.id);
            toggleKeybindEditMode(item.id, false);
        };
    });
}
const populateDynamicLists = (lang) => {
    const trans = translations[lang] || translations.en;
    populateTagsTable(lang);
    populateKeybindsTable(lang);
    populateHelpTable(lang);
};
const updateVisibilityToggleUI = (element, key, defaultValue) => {
    const isVisible = localStorage.getItem(key) === null ? defaultValue : JSON.parse(localStorage.getItem(key));
    element.checked = isVisible;

    const card = element.id === 'toggleScore2Visible' ? elements.score2Card :
        element.id === 'toggleSwapVisible' ? elements.swapCard :
            elements.actionButtonsCard;
    if (card) {
        if (isVisible) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    }
}
const toggleCardVisibility = (element, key) => {
    const isVisible = element.checked;
    localStorage.setItem(key, isVisible);

    const card = element.id === 'toggleScore2Visible' ? elements.score2Card :
        element.id === 'toggleSwapVisible' ? elements.swapCard :
            elements.actionButtonsCard;
    if (card) {
        if (isVisible) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    }
    showToast(isVisible ? translations[currentLang].show : translations[currentLang].hide, 'info');
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
    if (elements.logoPathInput.disabled) {
        editLogoPathBtnSpan.textContent = trans.edit;
    } else {
        editLogoPathBtnSpan.textContent = trans.save;
    }

    populateDynamicLists(lang);
};
const getStoredKeybinds = () => {
    const keybindsList = translations[currentLang].keybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    const activeKeybinds = {};

    keybindsList.forEach(item => {
        const key = savedKeybinds[item.id] !== undefined ? savedKeybinds[item.id] : item.default;
        activeKeybinds[item.id] = key.trim().toUpperCase();
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

// --- CORE UPDATE FUNCTIONS ---
const getTeamInitials = (name) => name ? (name.split(' ').filter(Boolean).length >= 2 ? (name.split(' ')[0][0] + name.split(' ')[1][0]) : name.substring(0, 2)).toUpperCase() : '';

/**
 * Updates the UI and OBS for a specific team (A or B) based on its Master Data.
 * @param {string} team 'A' or 'B'
 * @param {object} teamData Master data object (masterTeamA or masterTeamB)
 */
const updateDisplayUI = (team, teamData) => {
    const isA = team === 'A';
    const data = teamData;

    // UI Elements
    const nameEl = isA ? elements.nameA : elements.nameB;
    const logoEl = isA ? elements.logoA : elements.logoB;
    const initialsEl = isA ? elements.initialsA : elements.initialsB;
    const colorEl1 = isA ? elements.colorA : elements.colorB;
    const colorEl2 = isA ? elements.colorA2 : elements.colorB2;
    const scoreEl = isA ? elements.scoreA : elements.scoreB;
    const score2El = isA ? elements.score2A : elements.score2B;

    // OBS Sources
    const obsNameSource = isA ? 'name_team_a' : 'name_team_b';
    const obsLogoSource = isA ? 'logo_team_a' : 'logo_team_b';
    const obsColorSource1 = isA ? 'Color_Team_A' : 'Color_Team_B';
    const obsColorSource2 = isA ? 'Color_Team_A_2' : 'Color_Team_B_2';
    const obsScoreSource = isA ? 'score_team_a' : 'score_team_b';
    const obsScore2Source = isA ? 'score2_team_a' : 'score2_team_b';

    // 1. Update Team Name, Logo, Colors
    const displayColor1 = data.color1 || '#ffffff';
    const displayColor2 = data.color2 || '#000000';
    const displayName = data.name || (isA ? translations[currentLang].teamA : translations[currentLang].teamB);

    nameEl.innerHTML = displayName.replace(/\//g, '<br>');
    colorEl1.value = displayColor1;
    colorEl2.value = displayColor2;
    initialsEl.textContent = getTeamInitials(displayName.replace(/\//g, ' '));

    if (data.logo) {
        const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(data.logo);
        logoEl.src = `file:///${logoFolderPath}/${data.logo}${hasExt ? '' : '.png'}`;
        logoEl.style.display = 'block';
        initialsEl.style.display = 'none';
    } else {
        logoEl.src = '';
        logoEl.style.display = 'none';
        initialsEl.style.display = 'block';
    }

    // 2. Update Scores
    scoreEl.textContent = data.score;
    score2El.textContent = data.score2;

    // 3. Update OBS
    setText(obsNameSource, displayName.replace(/\//g, '\n'));
    setImage(obsLogoSource, data.logo);
    setSourceColor(obsColorSource1, displayColor1);
    setSourceColor(obsColorSource2, displayColor2);
    setText(obsScoreSource, data.score);
    setText(obsScore2Source, data.score2);

    // 4. Save colors to memory (based on name)
    saveTeamColors(displayName, displayColor1, displayColor2);
};


// --- Scoreboard Logic (Updated) ---
const applyMatch = () => {
    if (!sheetData.length) return showToast(translations[currentLang].toastLoadFileFirst, 'error');
    const id = parseInt(elements.matchID.value);
    const header = sheetData[0];
    const match = sheetData.slice(1).find(r => parseInt(r[0]) === id);
    if (!match) return showToast(`${translations[currentLang].toastMatchNotFound} ${id}`, 'error');

    const get = key => match[header.indexOf(key)] || '';

    // 1. Prepare Master Data for A
    let teamAName = get('TeamA') || translations[currentLang].teamA;
    let teamAColor1 = get('ColorA') || '#ffffff';
    let teamAColor2 = get('ColorA2') || '#000000';
    const savedColorA = loadTeamColors(teamAName);
    if (savedColorA) { teamAColor1 = savedColorA.color1; teamAColor2 = savedColorA.color2; }

    masterTeamA = {
        name: teamAName, score: 0, score2: 0,
        logo: get('LogoA'), color1: teamAColor1, color2: teamAColor2
    };

    // 2. Prepare Master Data for B
    let teamBName = get('TeamB') || translations[currentLang].teamB;
    let teamBColor1 = get('ColorB') || '#ffffff';
    let teamBColor2 = get('ColorB2') || '#000000';
    const savedColorB = loadTeamColors(teamBName);
    if (savedColorB) { teamBColor1 = savedColorB.color1; teamBColor2 = savedColorB.color2; }

    masterTeamB = {
        name: teamBName, score: 0, score2: 0,
        logo: get('LogoB'), color1: teamBColor1, color2: teamBColor2
    };

    // 3. Update UI/OBS
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

    // 4. Update Labels 1-5 (These still write directly as they are not swapped)
    const label1 = get('label1');
    const label2 = get('label2');
    const label3 = get('label3');
    elements.label1.textContent = label1;
    elements.label2.textContent = label2;
    elements.label3.textContent = label3;
    setText('label_1', label1);
    setText('label_2', label2);
    setText('label_3', label3);

    // V2.7: Labels 4 and 5
    const label4 = get('label4') || '';
    const label5 = get('label5') || '';
    elements.label4.textContent = label4;
    elements.label5.textContent = label5;
    setText('label_4', label4);
    setText('label_5', label5);

    showToast(`${translations[currentLang].toastLoaded} ${id}`, 'success');
};

/**
 * NEW: Swap Master Data and Update UI
 */
const swapTeams = () => {
    // Swap Master Data (Swaps all properties including scores)
    [masterTeamA, masterTeamB] = [masterTeamB, masterTeamA];

    // Update UI/OBS based on new master data arrangement
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

    showToast(translations[currentLang].toastSwapped, 'info');
};

const changeScore = (team, delta) => {
    const teamData = team === 'A' ? masterTeamA : masterTeamB;
    const teamEl = team === 'A' ? elements.scoreA : elements.scoreB;
    const obsSource = team === 'A' ? 'score_team_a' : 'score_team_b';

    teamData.score = Math.max(0, teamData.score + delta);
    teamEl.textContent = teamData.score;
    setText(obsSource, teamData.score);
};

const changeScore2 = (team, delta) => {
    const teamData = team === 'A' ? masterTeamA : masterTeamB;
    const teamEl = team === 'A' ? elements.score2A : elements.score2B;
    const obsSource = team === 'A' ? 'score2_team_a' : 'score2_team_b';

    teamData.score2 = Math.max(0, teamData.score2 + delta);
    teamEl.textContent = teamData.score2;
    setText(obsSource, teamData.score2);
};

const resetScore = () => {
    masterTeamA.score = masterTeamB.score = 0;
    elements.scoreA.textContent = '0';
    elements.scoreB.textContent = '0';
    setText('score_team_a', '0');
    setText('score_team_b', '0');
    showToast(translations[currentLang].toastScoreReset, 'info');
};

const resetScore2 = () => {
    masterTeamA.score2 = masterTeamB.score2 = 0;
    elements.score2A.textContent = '0';
    elements.score2B.textContent = '0';
    setText('score2_team_a', '0');
    setText('score2_team_b', '0');
    showToast(translations[currentLang].toastScore2Reset, 'info');
};

const fullReset = () => {
    // Reset Master Data Scores
    masterTeamA.score = masterTeamB.score = 0;
    masterTeamA.score2 = masterTeamB.score2 = 0;
    // Update UI/OBS
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

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
    const teamData = isA ? masterTeamA : masterTeamB;
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;

    nameDiv.style.display = 'none';
    editBtn.style.display = 'none';
    nameInput.value = teamData.name.replace(/\//g, '/'); // Use master data name
    nameInput.style.display = 'block';
    okBtn.style.display = 'inline-flex';
    nameInput.focus();
};

const exitEditMode = (team, applyChanges) => {
    const isA = team === 'A';
    const teamData = isA ? masterTeamA : masterTeamB; // Reference master data
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;

    if (applyChanges) {
        const newName = nameInput.value;

        // Update Master Data
        teamData.name = newName;

        // Update UI/OBS (uses the existing colors and logo from master data)
        updateDisplayUI(team, teamData);

        // Save colors to memory (done inside updateDisplayUI but good to re-call)
        saveTeamColors(newName, teamData.color1, teamData.color2);
    }

    nameDiv.style.display = 'block';
    editBtn.style.display = 'inline-flex';
    nameInput.style.display = 'none';
    okBtn.style.display = 'none';
};

const setupEventListeners = () => {
    const saveHandler = () => {
        localStorage.setItem('detailsText', elements.detailsText.value);
        closeAllPopups();
        showToast(translations[currentLang].toastSaved, 'success');
    };
    elements.saveDetailsBtnTop.addEventListener('click', saveHandler);

    const closeHandler = () => {
        const keybindsList = translations[currentLang].keybindsList || [];
        keybindsList.forEach(item => toggleKeybindEditMode(item.id, false));
        closeAllPopups();
    };

    elements.closeDetailsBtnTop.addEventListener('click', closeHandler);
    elements.closeDetailsBtnBottom.addEventListener('click', closeHandler);

    // Main Controls
    elements.languageSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    elements.excelBtn.addEventListener('click', handleExcel);
    elements.loadBtn.addEventListener('click', applyMatch);
    elements.fullResetBtn.addEventListener('click', fullReset);
    elements.swapBtn.addEventListener('click', swapTeams);

    // Score 1 Controls (Uses masterTeamA/B)
    elements.scoreAPlusBtn.addEventListener('click', () => changeScore('A', 1));
    elements.scoreAMinusBtn.addEventListener('click', () => changeScore('A', -1));
    elements.scoreBPlusBtn.addEventListener('click', () => changeScore('B', 1));
    elements.scoreBMinusBtn.addEventListener('click', () => changeScore('B', -1));
    elements.resetScoreBtn.addEventListener('click', resetScore);

    // Score 2 Controls (Uses masterTeamA/B)
    elements.score2APlusBtn.addEventListener('click', () => changeScore2('A', 1));
    elements.score2AMinusBtn.addEventListener('click', () => changeScore2('A', -1));
    elements.score2BPlusBtn.addEventListener('click', () => changeScore2('B', 1));
    elements.score2BMinusBtn.addEventListener('click', () => changeScore2('B', -1));
    elements.resetScore2Btn.addEventListener('click', resetScore2);

    // V2.7 Visibility Toggles (in Settings)
    elements.toggleScore2Visible.addEventListener('change', () => toggleCardVisibility(elements.toggleScore2Visible, SCORE2_VISIBILITY_KEY));
    elements.toggleSwapVisible.addEventListener('change', () => toggleCardVisibility(elements.toggleSwapVisible, SWAP_VISIBILITY_KEY));
    elements.toggleActionVisible.addEventListener('change', () => toggleCardVisibility(elements.toggleActionVisible, ACTION_VISIBILITY_KEY));

    // Keybinds Control & Color Reset
    elements.resetKeybindsBtn.addEventListener('click', resetKeybinds);
    elements.resetColorsBtn.addEventListener('click', resetTeamColors);

    // Timer Controls
    elements.halfBtn.addEventListener('click', toggleHalf);
    elements.playBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', stopTimer);
    elements.resetToStartBtn.addEventListener('click', resetToStartTime);
    elements.resetToZeroBtn.addEventListener('click', resetToZero);
    elements.editTimeBtn.addEventListener('click', openTimeSettings);
    elements.countdownCheck.addEventListener('change', () => { isCountdown = elements.countdownCheck.checked; });
    elements.settingsBtn.addEventListener('click', () => {
        elements.detailsText.value = localStorage.getItem('detailsText') || '';
        populateKeybindsTable(currentLang);

        // V2.7: Update Visibility Checkboxes on open
        updateVisibilityToggleUI(elements.toggleScore2Visible, SCORE2_VISIBILITY_KEY, true);
        updateVisibilityToggleUI(elements.toggleSwapVisible, SWAP_VISIBILITY_KEY, true);
        updateVisibilityToggleUI(elements.toggleActionVisible, ACTION_VISIBILITY_KEY, false);

        openPopup(elements.detailsPopup);
    });

    // Info/Help Popups
    elements.copyBtn.addEventListener('click', copyDetails);
    elements.helpBtn.addEventListener('click', () => openPopup(elements.helpPopup));
    elements.donateBtn.addEventListener('click', () => openPopup(elements.donatePopup));
    elements.changelogBtn.addEventListener('click', () => openPopup(elements.changelogPopup));
    elements.popupOverlay.addEventListener('click', closeAllPopups);

    // Popups Close Buttons
    elements.closeHelpBtn.addEventListener('click', closeAllPopups);
    elements.closeDonateBtn.addEventListener('click', closeAllPopups);
    elements.closeChangelogBtn.addEventListener('click', closeAllPopups);
    elements.closeTimeSettingsBtn.addEventListener('click', closeAllPopups);
    elements.closeLogoPathBtn.addEventListener('click', closeAllPopups);
    elements.closeWelcomeBtn.addEventListener('click', closeWelcomePopup);

    elements.copyShopeeLinkBtn.addEventListener('click', () => copyLink(elements.copyShopeeLinkBtn.getAttribute('data-link')));
    elements.copyEasyDonateLinkBtn.addEventListener('click', () => copyLink(elements.copyEasyDonateLinkBtn.getAttribute('data-link')));

    // Time Settings
    elements.saveTimeSettingsBtn.addEventListener('click', saveTimeSettings);
    elements.saveAndUpdateTimeBtn.addEventListener('click', saveAndUpdateTime);

    // Edit Name (Uses masterTeamA/B)
    elements.editBtnA.addEventListener('click', () => enterEditMode('A'));
    elements.okBtnA.addEventListener('click', () => exitEditMode('A', true));
    elements.editBtnB.addEventListener('click', () => enterEditMode('B'));
    elements.okBtnB.addEventListener('click', () => exitEditMode('B', true));

    // Colors (Added Team Color Memory Save on change, uses masterTeamA/B)
    elements.colorA.addEventListener('input', (e) => {
        masterTeamA.color1 = e.target.value;
        setSourceColor('Color_Team_A', e.target.value);
        saveTeamColors(masterTeamA.name, masterTeamA.color1, masterTeamA.color2);
    });
    elements.colorA2.addEventListener('input', (e) => {
        masterTeamA.color2 = e.target.value;
        setSourceColor('Color_Team_A_2', e.target.value);
        saveTeamColors(masterTeamA.name, masterTeamA.color1, masterTeamA.color2);
    });
    elements.colorB.addEventListener('input', (e) => {
        masterTeamB.color1 = e.target.value;
        setSourceColor('Color_Team_B', e.target.value);
        saveTeamColors(masterTeamB.name, masterTeamB.color1, masterTeamB.color2);
    });
    elements.colorB2.addEventListener('input', (e) => {
        masterTeamB.color2 = e.target.value;
        setSourceColor('Color_Team_B_2', e.target.value);
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.getAttribute('id')?.startsWith('keybind-input')) return;

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

    elements.logoPathInput.value = logoFolderPath;
    elements.currentLogoPath.textContent = logoFolderPath;

    // 1. Setup Event Listeners
    setupEventListeners();

    // 2. Set Language (Must be done before initializing Master Data names)
    setLanguage(savedLang);

    // 3. Initialize Master Data with correct language defaults
    masterTeamA.name = translations[currentLang].teamA;
    masterTeamB.name = translations[currentLang].teamB;

    // 4. Load and apply visibility states
    updateVisibilityToggleUI(elements.toggleScore2Visible, SCORE2_VISIBILITY_KEY, true);
    updateVisibilityToggleUI(elements.toggleSwapVisible, SWAP_VISIBILITY_KEY, true);
    updateVisibilityToggleUI(elements.toggleActionVisible, ACTION_VISIBILITY_KEY, false);

    // 5. Apply initial state to UI/OBS (Crucial step for V2.7 Master Data)
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

    resetToZero();

    obs.connect('ws://localhost:4455').catch(err => showToast(translations[currentLang].toastObsError, 'error'));

    fetchAnnouncement();
    // Re-fetch announcement every hour
    setInterval(fetchAnnouncement, 3600000);

    // Make copyTag globally available for onclick events in the Tags table
    window.copyTag = copyTag;

    // Ensure the default tab button is styled correctly after DOM load
    const defaultButton = document.getElementById('defaultOpen');
    if (defaultButton) defaultButton.classList.add('active');
});