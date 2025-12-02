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
    // Note: This regex converts "toggleScore2Visible" to "toggleScore2Visible" (no change)
    // and "nameA-input" to "nameAInput"
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
const SWAP_VISIBILITY_KEY = 'swapVisible'; // NEW V2.7
const ACTION_VISIBILITY_KEY = 'actionVisible'; // NEW V2.7
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

// --- OBS & Utility Functions (Unchanged) ---
const obs = new OBSWebSocket();
// ... (setText, setImage, setSourceColor, showToast, openPopup, closeAllPopups, etc. functions remain the same) ...
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
const showWelcomePopup = () => { /* Logic to show popup (removed from init) */ };
const closeWelcomePopup = () => { /* Logic to close popup */ };
const copyLink = (link) => { /* ... */ };
const copySourceName = (sourceName) => { /* ... */ };
const copyTag = (tagCode) => { /* ... */ };
const populateHelpTable = (lang) => { /* ... */ };
const populateTagsTable = (lang) => { /* ... */ };
const formatKey = (keyString) => { /* ... */ };
const captureKeyInput = (e, inputElement, saveButton) => { /* ... */ };
const toggleKeybindEditMode = (id, enable) => { /* ... */ };
const saveKeybind = (id) => { /* ... */ };
const populateKeybindsTable = (lang) => { /* ... */ };
const populateDynamicLists = (lang) => { /* ... */ };
const getStoredKeybinds = () => { /* ... */ };
const resetKeybinds = () => { /* ... */ };
const resetTeamColors = () => { /* ... */ };
const fetchAnnouncement = async () => { /* ... */ };
const saveTeamColors = (teamName, color1, color2) => { /* ... */ };
const loadTeamColors = (teamName) => { /* ... */ };


// --- CORE UPDATE FUNCTIONS ---

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

const getTeamInitials = (name) => name ? (name.split(' ').filter(Boolean).length >= 2 ? (name.split(' ')[0][0] + name.split(' ')[1][0]) : name.substring(0, 2)).toUpperCase() : '';

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

    // 4. Update Labels (These still write directly as they are not swapped)
    const label1 = get('label1');
    const label2 = get('label2');
    const label3 = get('label3');
    elements.label1.textContent = label1;
    elements.label2.textContent = label2;
    elements.label3.textContent = label3;
    setText('label_1', label1);
    setText('label_2', label2);
    setText('label_3', label3);

    // V2.7: Labels 4 and 5 (Assume same naming convention)
    const label4 = get('label4') || '';
    const label5 = get('label5') || '';
    elements.label4.textContent = label4;
    elements.label5.textContent = label5;
    setText('label_4', label4); // Assume new OBS sources: label_4, label_5
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

const updateTimerDisplay = () => { /* ... */ };
const startTimer = () => { /* ... */ };
const stopTimer = () => { /* ... */ };
const resetToStartTime = () => { /* ... */ };
const resetToZero = () => { /* ... */ };
const openTimeSettings = () => { /* ... */ };
const validateAndGetTime = () => { /* ... */ };
const saveTimeSettings = () => { /* ... */ };
const saveAndUpdateTime = () => { /* ... */ };
const toggleHalf = () => { /* ... */ };
const updateInjuryTimeDisplay = () => { /* ... */ };
const changeInjuryTime = (delta) => { /* ... */ };
const handleExcel = () => { /* ... */ };
const copyDetails = () => { /* ... */ };

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

// V2.7 Visibility Toggles
const updateVisibilityToggleUI = (element, key, defaultValue) => {
    const isVisible = localStorage.getItem(key) === null ? defaultValue : JSON.parse(localStorage.getItem(key));
    element.checked = isVisible;

    // Apply initial state to card
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

const setupEventListeners = () => {
    // ... (All original event listeners remain, but Score/Swap/Edit now use masterTeamA/B) ...

    // ... (All original event listeners) ...

    // Bind Save/Close buttons
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
        updateVisibilityToggleUI(elements.toggleActionVisible, ACTION_VISIBILITY_KEY, false); // Default to Hidden

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
    // ... (Original Key Listener Logic remains the same) ...
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

    setupEventListeners();
    setLanguage(savedLang);

    // V2.7: Load and apply visibility states
    updateVisibilityToggleUI(elements.toggleScore2Visible, SCORE2_VISIBILITY_KEY, true);
    updateVisibilityToggleUI(elements.toggleSwapVisible, SWAP_VISIBILITY_KEY, true);
    updateVisibilityToggleUI(elements.toggleActionVisible, ACTION_VISIBILITY_KEY, false);

    // Initialize Master Data with default values and update UI/OBS
    masterTeamA.name = translations[savedLang].teamA;
    masterTeamB.name = translations[savedLang].teamB;
    updateDisplayUI('A', masterTeamA);
    updateDisplayUI('B', masterTeamB);

    resetToZero();

    obs.connect('ws://localhost:4455').catch(err => showToast(translations[currentLang].toastObsError, 'error'));

    fetchAnnouncement();
    // Re-fetch announcement every hour
    setInterval(fetchAnnouncement, 3600000);

    // *** IMPORTANT: Removed showWelcomePopup() to fix initialization crash ***

    // Make copyTag globally available for onclick events in the Tags table
    window.copyTag = copyTag;

    // Ensure the default tab button is styled correctly after DOM load
    const defaultButton = document.getElementById('defaultOpen');
    if (defaultButton) defaultButton.classList.add('active');
});