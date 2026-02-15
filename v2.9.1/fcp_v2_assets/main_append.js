
// --- Welcome Screen Logic ---
const initWelcomeScreen = () => {
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
        // "เก็บข้อมูลไว้ในแครชเครื่องด้วย" - usually implies "Remember Me".
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

    // Notify Online System (will be handled by remote.js invoking main.js or accessing identity)
    if (window.updateOnlineStatus) window.updateOnlineStatus();
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
    initWelcomeScreen();
    updateUserIdentityUI();
});
