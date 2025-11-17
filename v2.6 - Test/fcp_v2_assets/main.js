// fcp_v2_assets/main.js

// 1. นำเข้าข้อมูลภาษาจากไฟล์ languages.js
import { translations } from './languages.js';

// --- DOM ELEMENTS ---
const $ = id => document.getElementById(id);
const elements = [
    "nameA", "nameB", "label1", "label2", "label3", "logoA", "logoB", "initialsA", "initialsB",
    "scoreA", "scoreB", 
    "score2Card", "score2A", "score2B", "score2APlusBtn", "score2AMinusBtn", "score2BPlusBtn", "score2BMinusBtn", "resetScore2Btn",
    "showScore2Btn", "hideScore2Btn", // Visibility buttons
    "timerText", "halfText", "announcement-text", "matchID", 
    "colorA", "colorB", "colorA2", "colorB2",
    "countdownCheck", "languageSelector", "nameA-input", "nameB-input", "excelBtn", "loadBtn",
    "editBtnA", "okBtnA", "editBtnB", "okBtnB", "swapBtn", "scoreAPlusBtn", "scoreAMinusBtn",
    "scoreBPlusBtn", "scoreBMinusBtn", "resetScoreBtn", "fullResetBtn", "halfBtn", "playBtn", "pauseBtn",
    "resetToStartBtn", "editTimeBtn", "settingsBtn", "copyBtn", "helpBtn", "donateBtn",
    "toast-container", "popupOverlay", "detailsPopup", "helpPopup", "donatePopup", "detailsText",
    "welcomeSponsorPopup", "closeWelcomeBtn", // Pop-up Welcome Elements
    "copyShopeeLinkBtn", "copyEasyDonateLinkBtn", // Copy Link Buttons
    "saveDetailsBtn", "closeDetailsBtn", // kept for compatibility in some browsers
    "saveDetailsBtnTop", "closeDetailsBtnTop", "closeDetailsBtnBottom", // Updated buttons
    "closeHelpBtn", "closeDonateBtn", "injuryTimeDisplay",
    "injuryTimePlusBtn", "injuryTimeMinusBtn", "resetToZeroBtn", "timeSettingsPopup",
    "startTimeMinutes", "startTimeSeconds", "saveTimeSettingsBtn", "saveAndUpdateTimeBtn", "closeTimeSettingsBtn",
    "timeSettingsError", "changelogBtn", "changelogPopup", "closeChangelogBtn",
    "logoPathBtn", "logoPathPopup", "currentLogoPath", "logoPathInput", "editLogoPathBtn", "closeLogoPathBtn",
    "sourcesTableHeaders", "sourcesTableBody",
    "keybindsTable", "resetKeybindsBtn", "resetColorsBtn",
    "tagsTable", // NEW: Tags table element
].reduce((acc, id) => {
    acc[id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase())] = $(id);
    return acc;
}, {});


// --- STATE VARIABLES ---
let sheetData = [];
let currentLogoA = '', currentLogoB = '';
let scoreA = 0, scoreB = 0;
let score2A = 0, score2B = 0;
let timer = 0, interval = null, half = '1st';
let injuryTime = 0;
let isCountdown = false;
let countdownStartTime = 2700; // 45 minutes default
let currentLang = 'th';
let logoFolderPath = 'C:/OBSAssets/logos';
const TEAM_COLORS_KEY = 'teamColorMemory';
const SCORE2_VISIBILITY_KEY = 'score2Visible';
const KEYBINDS_KEY = 'customKeybinds';

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
    elements.welcomeSponsorPopup.style.display = 'none'; 
};

// --- Pop-up Welcome Functions ---
const showWelcomePopup = () => {
    if (elements.welcomeSponsorPopup && elements.popupOverlay) {
        elements.popupOverlay.style.display = 'block';
        elements.welcomeSponsorPopup.style.display = 'block';
        
        // เปิด Tab Shopee เป็นค่าเริ่มต้น (ใช้ ID ของ Tab ที่ต้องการเปิด)
        const defaultButton = document.getElementById('defaultOpen');
        if (defaultButton) {
            // เรียกฟังก์ชัน openWelcomeTab ที่อยู่ใน HTML
            if (typeof openWelcomeTab === 'function') {
                 openWelcomeTab({ currentTarget: defaultButton }, 'ShopeeTab');
            } else {
                // Fallback (ถ้าฟังก์ชันยังไม่ได้ถูกโหลด) - คลิกเองโดยตรง
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

// NEW: Function to handle copying link
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

// NEW: Function to handle copying Tags
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

// NEW: Function to populate Tags table
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
    
    if (enable) {
        inputElement.disabled = false;
        editButton.style.display = 'none';
        saveButton.style.display = 'inline-flex';
        inputElement.focus();
        
        // Remove previous listeners just in case
        inputElement.onkeydown = null;
        inputElement.onblur = null;
        
        // Add event listener to capture keyboard input
        inputElement.onkeydown = (e) => captureKeyInput(e, inputElement, saveButton);
        
        // Use a slight delay for blur check to ensure keydown fires
        inputElement.onblur = () => { 
            setTimeout(() => {
                // Only exit if the save button is not the next element focused (or if focused element is outside)
                if (document.activeElement !== saveButton) {
                    if (inputElement.disabled === false) {
                        // Re-disable input to exit edit mode visual state if user clicks outside
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

    // Revert formatting for saving (Ctrl+Alt+S -> CONTROL+ALT+S)
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

const populateDynamicLists = (lang) => {
    const trans = translations[lang] || translations.en;
    // Details Popup
    // Populate Tags Table
    populateTagsTable(lang); 

    // Keybinds Table
    populateKeybindsTable(lang);
    // Help Popup - Use new table function
    populateHelpTable(lang);
};

const updateScore2ToggleUI = (isVisible) => {
    if (isVisible) {
        elements.score2Card.classList.remove('hidden');
    } else {
        elements.score2Card.classList.add('hidden');
    }
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

    // Update specific buttons that change text
    const editLogoPathBtnSpan = elements.editLogoPathBtn.querySelector('span');
    if (elements.logoPathInput.disabled) {
        editLogoPathBtnSpan.textContent = trans.edit;
    } else {
        editLogoPathBtnSpan.textContent = trans.save;
    }
    
    populateDynamicLists(lang);
};

const toggleScore2Visibility = (show) => {
    const isVisible = show;
    updateScore2ToggleUI(isVisible);
    localStorage.setItem(SCORE2_VISIBILITY_KEY, isVisible); // Save new state
    showToast(isVisible ? translations[currentLang].show : translations[currentLang].hide, 'info');
}

const getStoredKeybinds = () => {
    const keybindsList = translations[currentLang].keybindsList || [];
    const savedKeybinds = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || '{}');
    const activeKeybinds = {};
    
    keybindsList.forEach(item => {
        const key = savedKeybinds[item.id] !== undefined ? savedKeybinds[item.id] : item.default;
        activeKeybinds[item.id] = key.trim().toUpperCase(); // Normalize key
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

const loadTeamColors = (teamName) => {
    try {
        const colors = JSON.parse(localStorage.getItem(TEAM_COLORS_KEY) || '{}');
        return colors[teamName.replace(/\//g, ' ').trim()];
    } catch (e) {
        console.error("Failed to load team colors:", e);
        return null;
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
    
    // Update UI elements
    nameEl.innerHTML = name.replace(/\//g, '<br>');
    colorEl1.value = color1;
    colorEl2.value = color2;
    initialsEl.textContent = getTeamInitials(name.replace(/\//g, ' '));
    
    // Show/Hide logo based on file
    if (logoFile) {
        const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(logoFile);
        logoEl.src = `file:///${logoFolderPath}/${logoFile}${hasExt ? '' : '.png'}`;
        logoEl.style.display = 'block';
        initialsEl.style.display = 'none';
    } else {
        logoEl.src = '';
        logoEl.style.display = 'none';
        initialsEl.style.display = 'block';
    }

    // Update OBS
    setText(obsNameSource, name.replace(/\//g, '\n'));
    setImage(obsLogoSource, logoFile);
    setSourceColor(obsColorSource1, color1);
    setSourceColor(obsColorSource2, color2);

    // Save colors
    saveTeamColors(name, color1, color2);
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

    currentLogoA = get('LogoA');
    currentLogoB = get('LogoB');

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
    [score2A, score2B] = [score2B, score2A];
    [currentLogoA, currentLogoB] = [currentLogoB, currentLogoA];

    updateTeamUI('A', nameB, currentLogoB, colorB1, colorB2); 
    updateTeamUI('B', nameA, currentLogoA, colorA1, colorA2);
    
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

const changeScore2 = (team, delta) => {
    if (team === 'A') {
        score2A = Math.max(0, score2A + delta);
        elements.score2A.textContent = score2A;
        setText('score2_team_a', score2A);
    } else {
        score2B = Math.max(0, score2B + delta);
        elements.score2B.textContent = score2B;
        setText('score2_team_b', score2B);
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

const resetScore2 = () => {
    score2A = score2B = 0;
    elements.score2A.textContent = '0';
    elements.score2B.textContent = '0';
    setText('score2_team_a', '0');
    setText('score2_team_b', '0');
    showToast(translations[currentLang].toastScore2Reset, 'info');
};

const fullReset = () => {
    // Reset Score 1
    scoreA = scoreB = 0;
    elements.scoreA.textContent = '0';
    elements.scoreB.textContent = '0';
    setText('score_team_a', '0');
    setText('score_team_b', '0');
    
    // Reset Score 2
    score2A = score2B = 0;
    elements.score2A.textContent = '0';
    elements.score2B.textContent = '0';
    setText('score2_team_a', '0');
    setText('score2_team_b', '0');

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
        .replace(/<score2_team_a>/gi, score2A)
        .replace(/<score2_team_b>/gi, score2B)
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

        // Save team colors after manual edit
        const color1 = isA ? elements.colorA.value : elements.colorB.value;
        const color2 = isA ? elements.colorA2.value : elements.colorB2.value;
        saveTeamColors(newName, color1, color2);
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
        // Save only the currently edited/confirmed keybinds. This saves ALL keybinds states (disabled/enabled)
        // Note: The actual keybind value is saved when the individual save button is pressed.
        // We only save the TEXTAREA here.
        closeAllPopups(); 
        showToast(translations[currentLang].toastSaved, 'success'); 
    };
    elements.saveDetailsBtnTop.addEventListener('click', saveHandler);
    
    // Bind Close buttons
    const closeHandler = () => {
        // Ensure all inputs are disabled before closing
        const keybindsList = translations[currentLang].keybindsList || [];
        keybindsList.forEach(item => toggleKeybindEditMode(item.id, false));
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
    
    // Visibility buttons in Details Popup
    elements.showScore2Btn.addEventListener('click', () => toggleScore2Visibility(true));
    elements.hideScore2Btn.addEventListener('click', () => toggleScore2Visibility(false));

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
        // Re-populate keybinds table on open to load latest saved/default values
        populateKeybindsTable(currentLang); 
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
    elements.closeWelcomeBtn.addEventListener('click', closeWelcomePopup); 
    
    // NEW: Copy Link Buttons for Welcome Popup
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
        setSourceColor('Color_Team_A', e.target.value);
        saveTeamColors(elements.nameA.textContent.replace(/<br\s*\/?>/gi, ' '), e.target.value, elements.colorA2.value);
    });
    elements.colorA2.addEventListener('input', (e) => {
        setSourceColor('Color_Team_A_2', e.target.value);
        saveTeamColors(elements.nameA.textContent.replace(/<br\s*\/?>/gi, ' '), elements.colorA.value, e.target.value);
    });
    elements.colorB.addEventListener('input', (e) => {
        setSourceColor('Color_Team_B', e.target.value);
        saveTeamColors(elements.nameB.textContent.replace(/<br\s*\/?>/gi, ' '), e.target.value, elements.colorB2.value);
    });
    elements.colorB2.addEventListener('input', (e) => {
        setSourceColor('Color_Team_B_2', e.target.value);
        saveTeamColors(elements.nameB.textContent.replace(/<br\s*\/?>/gi, ' '), elements.colorB.value, e.target.value);
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
        // Only trigger keybinds if user is not typing in a general input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.getAttribute('id')?.startsWith('keybind-input')) return;

        const keybinds = getStoredKeybinds();
        
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
    // Load initial visibility state for Score 2
    const isScore2Visible = localStorage.getItem(SCORE2_VISIBILITY_KEY);
    // If null (first time), default to visible (true). Otherwise, use saved boolean value.
    const initialVisibility = isScore2Visible === null ? true : JSON.parse(isScore2Visible); 
    
    elements.logoPathInput.value = logoFolderPath;
    elements.currentLogoPath.textContent = logoFolderPath;

    setupEventListeners();
    setLanguage(savedLang);

    // Apply initial visibility state for Score 2
    updateScore2ToggleUI(initialVisibility);

    resetToZero(); 
    
    // Send initial Score 2 data to OBS as well
    setText('score2_team_a', score2A);
    setText('score2_team_b', score2B);

    obs.connect('ws://localhost:4455').catch(err => showToast(translations[currentLang].toastObsError, 'error'));
    
    fetchAnnouncement();
    // Re-fetch announcement every hour
    setInterval(fetchAnnouncement, 3600000);

    // **********************************************
    // ******* สั่งให้ Pop-up Welcome แสดงทันที *******
    // **********************************************
    showWelcomePopup();
    
    // Make copyTag globally available for onclick events in the Tags table
    window.copyTag = copyTag;
    
    // Ensure the default tab button is styled correctly after DOM load
    const defaultButton = document.getElementById('defaultOpen');
    if (defaultButton) defaultButton.classList.add('active');
});
