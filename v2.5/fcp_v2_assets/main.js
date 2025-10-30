// fcp_v2_assets/main.js

// 1. นำเข้าข้อมูลภาษาจากไฟล์ languages.js
import { translations } from './languages.js';

// --- DOM ELEMENTS ---
const $ = id => document.getElementById(id);
const elements = [
    "nameA", "nameB", "label1", "label2", "label3", "logoA", "logoB", "initialsA", "initialsB",
    "scoreA", "scoreB", "timerText", "halfText", "announcement-text", "matchID", 
    "colorA", "colorB", "colorA2", "colorB2",
    "countdownCheck", "languageSelector", "nameA-input", "nameB-input", "excelBtn", "loadBtn",
    "editBtnA", "okBtnA", "editBtnB", "okBtnB", "swapBtn", "scoreAPlusBtn", "scoreAMinusBtn",
    "scoreBPlusBtn", "scoreBMinusBtn", "resetScoreBtn", "halfBtn", "playBtn", "pauseBtn",
    "resetToStartBtn", "editTimeBtn", "settingsBtn", "copyBtn", "helpBtn", "donateBtn",
    "toast-container", "popupOverlay", "detailsPopup", "helpPopup", "donatePopup", "detailsText",
    "saveDetailsBtn", "closeDetailsBtn", "closeHelpBtn", "closeDonateBtn", "injuryTimeDisplay",
    "injuryTimePlusBtn", "injuryTimeMinusBtn", "resetToZeroBtn", "timeSettingsPopup",
    "startTimeMinutes", "startTimeSeconds", "saveTimeSettingsBtn", "saveAndUpdateTimeBtn", "closeTimeSettingsBtn",
    "timeSettingsError", "changelogBtn", "changelogPopup", "closeChangelogBtn",
    "logoPathBtn", "logoPathPopup", "currentLogoPath", "logoPathInput", "editLogoPathBtn", "closeLogoPathBtn"
].reduce((acc, id) => {
    acc[id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase())] = $(id);
    return acc;
}, {});


// --- STATE VARIABLES ---
let sheetData = [];
let currentLogoA = '', currentLogoB = '';
let scoreA = 0, scoreB = 0;
let timer = 0, interval = null, half = '1st';
let injuryTime = 0;
let isCountdown = false;
let countdownStartTime = 2700; // 45 minutes default
let currentLang = 'th';
let logoFolderPath = 'C:/OBSAssets/logos';

// --- OBS ---
const obs = new OBSWebSocket();
const setText = (source, text) => obs.call('SetInputSettings', { inputName: source, inputSettings: { text: String(text) } }).catch(err => {});
const setImage = (sourceName, filename) => {
    if (!filename) {
        obs.call('SetInputSettings', { inputName: sourceName, inputSettings: { file: "" } }).catch(err => {});
        return;
    };
    const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(filename);
    const filePath = `${logoFolderPath}/${filename}${hasExt ? '' : '.png'}`;
    obs.call('SetInputSettings', { inputName: sourceName, inputSettings: { file: filePath } }).catch(err => {});
};
const setSourceColor = (sourceName, hexColor) => {
    const hexToObsColor = (hex) => {
        const cleanHex = hex.substring(1);
        const r = cleanHex.substring(0, 2);
        const g = cleanHex.substring(2, 4);
        const b = cleanHex.substring(4, 6);
        return parseInt("FF" + b + g + r, 16);
    };
    obs.call('SetInputSettings', { inputName: sourceName, inputSettings: { color: hexToObsColor(hexColor) } }).catch(err => {});
};

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
};

const populateDynamicLists = (lang) => {
    const trans = translations[lang] || translations.en;
    // Details Popup
    const detailsListContainer = elements.detailsPopup.querySelector('.item-list');
    detailsListContainer.querySelectorAll('.item-list-item').forEach(item => item.remove());
    if (trans.tagsList) {
        trans.tagsList.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'item-list-item';
            listItem.innerHTML = `<code>${item.code}</code> <span>${item.desc}</span>`;
            detailsListContainer.appendChild(listItem);
        });
    }
    // Help Popup
    const helpListContainer = elements.helpPopup.querySelector('.item-list');
    helpListContainer.querySelectorAll('.item-list-item').forEach(item => item.remove());
    if (trans.sourcesList) {
        trans.sourcesList.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'item-list-item';
            listItem.innerHTML = `<code>${item.code}</code> <span>${item.desc}</span>`;
            helpListContainer.appendChild(listItem);
        });
    }
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
    
    populateDynamicLists(lang);
};

// --- Announcement ---
const fetchAnnouncement = async () => {
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJSdeDl1kOIOD8OWpKQV2G-N01esBbbUcJjTle5Dxlyv0wrZiLezHuCyuvuDTw3iK78IGCyZTPrs0Y/pubhtml?gid=0&single=true';
    try {
        const response = await fetch(`${googleSheetUrl}&t=${new Date().getTime()}`);
        if (!response.ok) {
            elements.announcementText.textContent = `Error: ${response.status}`;
            return;
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const firstCell = doc.querySelector('tbody td');
        elements.announcementText.textContent = firstCell ? firstCell.textContent.trim() : "";
    } catch (error) {
        console.error("Announcement fetch failed:", error);
        elements.announcementText.textContent = "Load Failed";
    }
};

// --- Scoreboard Logic ---
const getTeamInitials = (name) => name ? (name.split(' ').filter(Boolean).length >= 2 ? (name.split(' ')[0][0] + name.split(' ')[1][0]) : name.substring(0, 2)).toUpperCase() : '';

const updateTeamUI = (team, name, logoFile, color1, color2) => {
    const isA = team === 'A';
    const nameEl = isA ? elements.nameA : elements.nameB;
    const logoEl = isA ? elements.logoA : elements.logoB;
    const initialsEl = isA ? elements.initialsA : elements.initialsB;
    const colorEl1 = isA ? elements.colorA : elements.colorB;
    const colorEl2 = isA ? elements.colorA2 : elements.colorB2;

    const obsNameSource = isA ? 'name_team_a' : 'name_team_b';
    const obsLogoSource = isA ? 'logo_team_a' : 'logo_team_b';
    const obsColorSource1 = isA ? 'Color_Team_A' : 'Color_Team_B';
    const obsColorSource2 = isA ? 'Color_Team_A_2' : 'Color_Team_B_2';
    
    nameEl.innerHTML = name.replace(/\//g, '<br>');
    colorEl1.value = color1;
    colorEl2.value = color2;
    initialsEl.textContent = getTeamInitials(name);
    logoEl.style.display = 'none';
    initialsEl.style.display = 'block';

    if (logoFile) {
        const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(logoFile);
        logoEl.src = `file:///${logoFolderPath}/${logoFile}${hasExt ? '' : '.png'}`;
    }
    
    setText(obsNameSource, name.replace(/\//g, '\n'));
    setImage(obsLogoSource, logoFile);
    setSourceColor(obsColorSource1, color1);
    setSourceColor(obsColorSource2, color2);
};

const applyMatch = () => {
    if (!sheetData.length) return showToast(translations[currentLang].toastLoadFileFirst, 'error');
    const id = parseInt(elements.matchID.value);
    const header = sheetData[0];
    const match = sheetData.slice(1).find(r => parseInt(r[0]) === id);
    if (!match) return showToast(`${translations[currentLang].toastMatchNotFound} ${id}`, 'error');
    
    const get = key => match[header.indexOf(key)] || '';
    
    const teamAName = get('TeamA') || translations[currentLang].teamA;
    const teamBName = get('TeamB') || translations[currentLang].teamB;
    const colorA1 = get('ColorA') || '#ffffff';
    const colorB1 = get('ColorB') || '#ffffff';
    const colorA2 = get('ColorA2') || '#000000';
    const colorB2 = get('ColorB2') || '#000000';

    currentLogoA = get('LogoA');
    currentLogoB = get('LogoB');

    elements.label1.textContent = get('label1');
    elements.label2.textContent = get('label2');
    elements.label3.textContent = get('label3');
    
    updateTeamUI('A', teamAName, currentLogoA, colorA1, colorA2);
    updateTeamUI('B', teamBName, currentLogoB, colorB1, colorB2);
    
    setText('label_1', get('label1'));
    setText('label_2', get('label2'));
    setText('label_3', get('label3'));
    
    showToast(`${translations[currentLang].toastLoaded} ${id}`, 'success');
};

const swapTeams = () => {
    const [nameA, nameB] = [elements.nameA.innerHTML.replace(/<br\s*\/?>/gi, '/'), elements.nameB.innerHTML.replace(/<br\s*\/?>/gi, '/')];
    const [colorA1, colorB1] = [elements.colorA.value, elements.colorB.value];
    const [colorA2, colorB2] = [elements.colorA2.value, elements.colorB2.value];
    
    [scoreA, scoreB] = [scoreB, scoreA];
    [currentLogoA, currentLogoB] = [currentLogoB, currentLogoA];

    updateTeamUI('A', nameB, currentLogoA, colorB1, colorB2);
    updateTeamUI('B', nameA, currentLogoB, colorA1, colorA2);
    
    elements.scoreA.textContent = scoreA;
    setText('score_team_a', scoreA);
    elements.scoreB.textContent = scoreB;
    setText('score_team_b', scoreB);
    
    showToast(translations[currentLang].toastSwapped, 'info');
};

const changeScore = (team, delta) => {
    if (team === 'A') {
        scoreA = Math.max(0, scoreA + delta);
        elements.scoreA.textContent = scoreA;
        setText('score_team_a', scoreA);
    } else {
        scoreB = Math.max(0, scoreB + delta);
        elements.scoreB.textContent = scoreB;
        setText('score_team_b', scoreB);
    }
};

const resetScore = () => {
    scoreA = scoreB = 0;
    elements.scoreA.textContent = '0';
    elements.scoreB.textContent = '0';
    setText('score_team_a', '0');
    setText('score_team_b', '0');
    showToast(translations[currentLang].toastScoreReset, 'info');
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

    let teamAName = elements.nameA.innerHTML.replace(/<br\s*\/?>/gi, ' ');
    let teamBName = elements.nameB.innerHTML.replace(/<br\s*\/?>/gi, ' ');

    const filled = template
        .replace(/<TeamA>/gi, teamAName)
        .replace(/<TeamB>/gi, teamBName)
        .replace(/<label1>/gi, elements.label1.textContent)
        .replace(/<label2>/gi, elements.label2.textContent)
        .replace(/<label3>/gi, elements.label3.textContent)
        .replace(/<score_team_a>/gi, scoreA)
        .replace(/<score_team_b>/gi, scoreB)
        .replace(/<time_counter>/gi, elements.timerText.textContent)
        .replace(/<half_text>/gi, elements.halfText.textContent);
        
    navigator.clipboard.writeText(filled).then(()=>showToast(translations[currentLang].toastCopied,'info')).catch(err=>showToast(translations[currentLang].toastCopyFailed,'error'));
};

const enterEditMode = (team) => {
    const isA = team === 'A';
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;
    nameDiv.style.display = 'none';
    editBtn.style.display = 'none';
    nameInput.value = nameDiv.innerHTML.replace(/<br\s*\/?>/gi, '/');
    nameInput.style.display = 'block';
    okBtn.style.display = 'inline-flex';
    nameInput.focus();
};

const exitEditMode = (team, applyChanges) => {
    const isA = team === 'A';
    const nameDiv = isA ? elements.nameA : elements.nameB;
    const nameInput = isA ? elements.nameAInput : elements.nameBInput;
    const editBtn = isA ? elements.editBtnA : elements.editBtnB;
    const okBtn = isA ? elements.okBtnA : elements.okBtnB;
    if (applyChanges) {
        const newName = nameInput.value;
        const obsSourceName = isA ? 'name_team_a' : 'name_team_b';
        nameDiv.innerHTML = newName.replace(/\//g, '<br>');
        setText(obsSourceName, newName.replace(/\//g, '\n'));
        const initialsEl = isA ? elements.initialsA : elements.initialsB;
        initialsEl.textContent = getTeamInitials(newName.replace(/\//g, ' '));
    }
    nameDiv.style.display = 'block';
    editBtn.style.display = 'inline-flex';
    nameInput.style.display = 'none';
    okBtn.style.display = 'none';
};

const setupEventListeners = () => {
    elements.languageSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    elements.excelBtn.addEventListener('click', handleExcel);
    elements.loadBtn.addEventListener('click', applyMatch);
    elements.swapBtn.addEventListener('click', swapTeams);
    elements.scoreAPlusBtn.addEventListener('click', () => changeScore('A', 1));
    elements.scoreAMinusBtn.addEventListener('click', () => changeScore('A', -1));
    elements.scoreBPlusBtn.addEventListener('click', () => changeScore('B', 1));
    elements.scoreBMinusBtn.addEventListener('click', () => changeScore('B', -1));
    elements.resetScoreBtn.addEventListener('click', resetScore);
    elements.halfBtn.addEventListener('click', toggleHalf);
    elements.playBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', stopTimer);
    elements.resetToStartBtn.addEventListener('click', resetToStartTime); 
    elements.resetToZeroBtn.addEventListener('click', resetToZero);     
    elements.editTimeBtn.addEventListener('click', openTimeSettings);
    elements.countdownCheck.addEventListener('change', () => { isCountdown = elements.countdownCheck.checked; });
    elements.settingsBtn.addEventListener('click', () => { elements.detailsText.value = localStorage.getItem('detailsText') || ''; openPopup(elements.detailsPopup); });
    elements.copyBtn.addEventListener('click', copyDetails);
    elements.helpBtn.addEventListener('click', () => openPopup(elements.helpPopup));
    elements.donateBtn.addEventListener('click', () => openPopup(elements.donatePopup));
    elements.changelogBtn.addEventListener('click', () => openPopup(elements.changelogPopup));
    elements.popupOverlay.addEventListener('click', closeAllPopups);
    
    // Details Popup
    elements.saveDetailsBtn.addEventListener('click', () => { localStorage.setItem('detailsText', elements.detailsText.value); closeAllPopups(); showToast(translations[currentLang].toastSaved, 'success'); });
    elements.closeDetailsBtn.addEventListener('click', closeAllPopups);
    
    // Other Popups Close Buttons
    elements.closeHelpBtn.addEventListener('click', closeAllPopups);
    elements.closeDonateBtn.addEventListener('click', closeAllPopups);
    elements.closeChangelogBtn.addEventListener('click', closeAllPopups);
    elements.closeTimeSettingsBtn.addEventListener('click', closeAllPopups);
    elements.closeLogoPathBtn.addEventListener('click', closeAllPopups);
    
    // Time Settings
    elements.saveTimeSettingsBtn.addEventListener('click', saveTimeSettings);
    elements.saveAndUpdateTimeBtn.addEventListener('click', saveAndUpdateTime);

    // Edit Name
    elements.editBtnA.addEventListener('click', () => enterEditMode('A'));
    elements.okBtnA.addEventListener('click', () => exitEditMode('A', true));
    elements.editBtnB.addEventListener('click', () => enterEditMode('B'));
    elements.okBtnB.addEventListener('click', () => exitEditMode('B', true));
    
    // Colors
    elements.colorA.addEventListener('input', (e) => setSourceColor('Color_Team_A', e.target.value));
    elements.colorA2.addEventListener('input', (e) => setSourceColor('Color_Team_A_2', e.target.value));
    elements.colorB.addEventListener('input', (e) => setSourceColor('Color_Team_B', e.target.value));
    elements.colorB2.addEventListener('input', (e) => setSourceColor('Color_Team_B_2', e.target.value));
    
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
    resetToZero(); 
    updateInjuryTimeDisplay();
    obs.connect('ws://localhost:4455').catch(err => showToast(translations[currentLang].toastObsError, 'error'));
    
    fetchAnnouncement();
    setInterval(fetchAnnouncement, 3600000);
});