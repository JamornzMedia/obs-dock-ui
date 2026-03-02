// This one script will control all pages.
document.addEventListener('DOMContentLoaded', () => {
    const page = document.title;

    // --- MODULE 1: SHARED CONFIGURATION ---
    const Config = {
        palettes: {
            classic: { name: 'Classic', colors: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'] },
            pastel: { name: 'Pastel', colors: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'] },
            neon: { name: 'Neon', colors: ['#f83bff', '#39ff14', '#feff00', '#ff0054', '#00e5ff', '#ff6600', '#8a2be2', '#20f1dd'] },
            corporate: { name: 'Corporate', colors: ['#34495e', '#7f8c8d', '#2c3e50', '#95a5a6', '#bdc3c7', '#596275', '#303952', '#1e272e'] },
            monochrome: { name: 'Monochrome', colors: ['#212121', '#424242', '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0'] },
            ocean: { name: 'Ocean', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#023E8A', '#0096C7', '#48CAE4', '#ADE8F4', '#03045E'] },
            sunset: { name: 'Sunset', colors: ['#FF6B35', '#F7931E', '#FFD23F', '#EE4266', '#C44536', '#FF9F1C', '#E8871E', '#D64045'] },
            forest: { name: 'Forest', colors: ['#228B22', '#2E8B57', '#3CB371', '#90EE90', '#006400', '#32CD32', '#98FB98', '#008000'] },
            candy: { name: 'Candy', colors: ['#FF69B4', '#FF1493', '#FF6EB4', '#FFB6C1', '#FF85A2', '#FFA0B4', '#FF7F9F', '#FF4081'] },
            royal: { name: 'Royal', colors: ['#6B3FA0', '#8E44AD', '#9B59B6', '#663399', '#7D3C98', '#8E4585', '#9932CC', '#6A0DAD'] },
            fire: { name: 'Fire', colors: ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#DC143C', '#CD5C5C', '#B22222', '#8B0000'] },
            ice: { name: 'Ice', colors: ['#00BFFF', '#87CEEB', '#ADD8E6', '#B0E0E6', '#AFEEEE', '#E0FFFF', '#F0FFFF', '#00CED1'] },
        },
        groupPresets: {
            "obs_dark": { name: "OBS Dark (Default)", headerAlign: "center", headerColor: "#ECEFF4", prefixColor: "#D8DEE9", nameColor: "#ECEFF4", cardBgColor: "#2E3440", cardBgOpacity: 80, headerBgColor: "#4C566A", headerBgOpacity: 100, prefixBgColor: "#3B4252", prefixBgOpacity: 100, nameBgColor: "#434C5E", nameBgOpacity: 100 },
            "graphite_gold": { name: "Graphite & Gold", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#F0E68C", nameColor: "#FFFFFF", cardBgColor: "#212121", cardBgOpacity: 95, headerBgColor: "#B8860B", headerBgOpacity: 100, prefixBgColor: "#424242", prefixBgOpacity: 100, nameBgColor: "#303030", nameBgOpacity: 100 },
            "sapphire_carbon": { name: "Sapphire & Carbon", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#87CEFA", nameColor: "#FFFFFF", cardBgColor: "#1a1a1a", cardBgOpacity: 95, headerBgColor: "#003366", headerBgOpacity: 100, prefixBgColor: "#2d2d2d", prefixBgOpacity: 100, nameBgColor: "#222222", nameBgOpacity: 100 },
            "crimson_slate": { name: "Crimson & Slate", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#F8F8FF", nameColor: "#FFFFFF", cardBgColor: "#2F4F4F", cardBgOpacity: 95, headerBgColor: "#DC143C", headerBgOpacity: 100, prefixBgColor: "#556B6B", prefixBgOpacity: 100, nameBgColor: "#3D5A5A", nameBgOpacity: 100 },
            "emerald_onyx": { name: "Emerald & Onyx", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#E0EEE0", nameColor: "#FFFFFF", cardBgColor: "#0a0a0a", cardBgOpacity: 95, headerBgColor: "#009B77", headerBgOpacity: 100, prefixBgColor: "#222222", prefixBgOpacity: 100, nameBgColor: "#111111", nameBgOpacity: 100 },
            "oceanic_deep": { name: "Oceanic Deep", headerAlign: "left", headerColor: "#FFFFFF", prefixColor: "#99D5C9", nameColor: "#FFFFFF", cardBgColor: "#0A2342", cardBgOpacity: 95, headerBgColor: "#2CA58D", headerBgOpacity: 100, prefixBgColor: "#1F476D", prefixBgOpacity: 100, nameBgColor: "#143552", nameBgOpacity: 100 },
            "mint_silver": { name: "Mint & Silver", headerAlign: "left", headerColor: "#FFFFFF", prefixColor: "#000000", nameColor: "#2F4F4F", cardBgColor: "#F5F5F5", cardBgOpacity: 100, headerBgColor: "#3CB371", headerBgOpacity: 100, prefixBgColor: "#E0E0E0", prefixBgOpacity: 100, nameBgColor: "#FFFFFF", nameBgOpacity: 100 },
            "royal_purple": { name: "Royal Purple", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#E6E6FA", nameColor: "#FFFFFF", cardBgColor: "#1a0a2e", cardBgOpacity: 95, headerBgColor: "#6B3FA0", headerBgOpacity: 100, prefixBgColor: "#2d1b4e", prefixBgOpacity: 100, nameBgColor: "#1f1035", nameBgOpacity: 100 },
            "sunset_warm": { name: "Sunset Warm", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#FFE4B5", nameColor: "#FFFFFF", cardBgColor: "#2b1810", cardBgOpacity: 95, headerBgColor: "#FF6B35", headerBgOpacity: 100, prefixBgColor: "#4a2c20", prefixBgOpacity: 100, nameBgColor: "#3a2015", nameBgOpacity: 100 },
            "forest_green": { name: "Forest Green", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#90EE90", nameColor: "#FFFFFF", cardBgColor: "#0d1f0d", cardBgOpacity: 95, headerBgColor: "#228B22", headerBgOpacity: 100, prefixBgColor: "#1a3a1a", prefixBgOpacity: 100, nameBgColor: "#0f2a0f", nameBgOpacity: 100 },
            "cyber_blue": { name: "Cyber Blue", headerAlign: "center", headerColor: "#00FFFF", prefixColor: "#00CED1", nameColor: "#E0FFFF", cardBgColor: "#0a1628", cardBgOpacity: 95, headerBgColor: "#0077B6", headerBgOpacity: 100, prefixBgColor: "#023e8a", prefixBgOpacity: 100, nameBgColor: "#03045e", nameBgOpacity: 100 },
            "midnight_red": { name: "Midnight Red", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#FFB6C1", nameColor: "#FFFFFF", cardBgColor: "#1a0a0a", cardBgOpacity: 95, headerBgColor: "#8B0000", headerBgOpacity: 100, prefixBgColor: "#3d1515", prefixBgOpacity: 100, nameBgColor: "#2d0f0f", nameBgOpacity: 100 },
        },
        hexToRgba: (hex, opacity = 1) => {
            if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;
            let c = hex.substring(1).split('');
            if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
            c = '0x' + c.join('');
            return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity})`;
        },
        // Levenshtein Distance - count character differences between two strings
        levenshteinDistance: (str1, str2) => {
            const m = str1.length, n = str2.length;
            const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
            for (let i = 0; i <= m; i++) dp[i][0] = i;
            for (let j = 0; j <= n; j++) dp[0][j] = j;
            for (let i = 1; i <= m; i++) {
                for (let j = 1; j <= n; j++) {
                    if (str1[i - 1] === str2[j - 1]) {
                        dp[i][j] = dp[i - 1][j - 1];
                    } else {
                        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                    }
                }
            }
            return dp[m][n];
        },
        // Check if two team names are too similar (differ by 1-2 characters)
        areSimilarTeams: (name1, name2) => {
            const distance = Config.levenshteinDistance(name1.trim(), name2.trim());
            return distance > 0 && distance <= 2; // 1-2 characters different = similar
        }
    };

    // --- MODULE 2: STATE MANAGER (localStorage interaction) ---
    const StateManager = {
        save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
        load: (key) => {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        },
        saveText: (key, text) => localStorage.setItem(key, text),
        loadText: (key) => localStorage.getItem(key),
        remove: (key) => localStorage.removeItem(key),
        triggerUpdate: () => localStorage.setItem('updateGraphics', Date.now())
    };

    // --- MODULE 3: CONTROLS PAGE MANAGER ---
    const ControlsManager = {
        inputs: {},

        init() {
            try {
                const allInputs = Array.from(document.querySelectorAll('input, select, textarea, button'));
                this.inputs = Object.fromEntries(allInputs.map(el => [el.id, el]));

                this.initialSetup();
                this.bindEventListeners();
            } catch (error) {
                console.error("Failed to initialize control panel due to possible corrupted data:", error);
                document.body.innerHTML = `
                    <div style="font-family: 'Sarabun', sans-serif; padding: 30px; margin: auto; max-width: 600px; text-align: center; color: #333; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-top: 50px;">
                        <h1 style="color: #e74c3c;">เกิดข้อผิดพลาดในการโหลด</h1>
                        <p style="font-size: 18px;">ตรวจพบข้อมูลเก่าที่เข้ากันไม่ได้กับแอปพลิเคชันเวอร์ชันปัจจุบัน หรือมีข้อผิดพลาดในสคริปต์</p>
                        <p>เพื่อแก้ไขปัญหานี้ กรุณากดปุ่มด้านล่างเพื่อล้างข้อมูลเก่าทั้งหมดและเริ่มการทำงานใหม่</p>
                        <button id="force-reset-btn" style="font-family: 'Sarabun', sans-serif; font-size: 18px; font-weight: 700; padding: 12px 25px; color: white; background-color: #e74c3c; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px;">
                            ล้างข้อมูลและเริ่มต้นใหม่
                        </button>
                    </div>`;
                document.getElementById('force-reset-btn').addEventListener('click', () => {
                    localStorage.clear();
                    window.location.reload();
                });
            }
        },

        bindEventListeners() {
            this.inputs['update-button-1'].addEventListener('click', () => this.updateNames(1));
            this.inputs['update-button-2'].addEventListener('click', () => this.updateNames(2));
            this.inputs['spin-button'].addEventListener('click', this.handleSpinClick.bind(this));
            this.inputs['confirm-winner-btn'].addEventListener('click', () => localStorage.setItem('confirmWinnerCommand', Date.now()));
            this.inputs['respin-btn'].addEventListener('click', this.handleRespinClick.bind(this));
            this.inputs['open-settings-btn'].addEventListener('click', () => this.openSettingsModal());
            this.inputs['close-settings-btn'].addEventListener('click', () => this.closeSettingsModal());
            document.getElementById('settings-modal').addEventListener('click', (e) => {
                if (e.target.id === 'settings-modal') this.closeSettingsModal();
            });
            this.inputs['clear-history-btn'].addEventListener('click', this.clearHistory.bind(this));
            this.inputs['copy-history-btn'].addEventListener('click', this.copyHistory.bind(this));
            this.inputs['reset-all-btn'].addEventListener('click', this.resetAll.bind(this));
            this.inputs['hide-wheels-btn'].addEventListener('click', () => {
                const settings = StateManager.load('wheelSettings') || {};
                const isHidden = settings.wheelsHidden || false;

                // Toggle state
                settings.wheelsHidden = !isHidden;
                StateManager.save('wheelSettings', settings);

                // Update UI immediately (button text)
                this.updateButtonState();

                // Send command
                if (!isHidden) {
                    localStorage.setItem('hideWheelsCommand', Date.now());
                } else {
                    localStorage.setItem('showWheelsCommand', Date.now());
                }

                // Trigger update for persistent state check in graphics
                StateManager.triggerUpdate();
            });
            this.inputs['soft-reset-btn'].addEventListener('click', this.softReset.bind(this));

            // OBS WebSocket
            const obsBtn = this.inputs['create-obs-sources-btn'];
            if (obsBtn) obsBtn.addEventListener('click', this.createOBSSources.bind(this));

            this.inputs['name-list-1'].addEventListener('input', this.updateNameCounts.bind(this));
            this.inputs['name-list-2'].addEventListener('input', this.updateNameCounts.bind(this));
            this.inputs['sort-history'].addEventListener('change', this.renderHistory.bind(this));
            this.inputs['group-preset-select'].addEventListener('change', (e) => this.applyPreset(e.target.value));

            Object.values(this.inputs).forEach(el => {
                if ((el.tagName === 'INPUT' || el.tagName === 'SELECT') && el.type !== 'button' && el.type !== 'submit') {
                    if (el.id !== 'group-preset-select' && el.id !== 'sort-history') {
                        el.addEventListener('input', () => {
                            if (el.id === 'spin-duration-slider') document.getElementById('duration-value').textContent = el.value;
                            if (el.id === 'wheel-spacing') document.getElementById('spacing-value').textContent = el.value;
                            if (el.id === 'transparent-bg') this.inputs['bg-color-picker'].disabled = el.checked;

                            if (el.id === 'palette-select-1' || el.id === 'palette-select-2') {
                                this.regenerateColorMap(el.id === 'palette-select-1' ? 1 : 2);
                            }
                            this.saveAllSettings();
                        });
                    }
                }
            });

            window.addEventListener('storage', (e) => {
                if (e.key === 'updateGraphics') {
                    this.loadDataIntoControls();
                    this.updateButtonState();
                }
            });
        },

        saveAllSettings() {
            // Helper to safely get input values with defaults
            const getValue = (id, defaultValue) => {
                const el = this.inputs[id];
                if (!el) return defaultValue;
                if (el.type === 'checkbox') return el.checked;
                return el.value || defaultValue;
            };

            const getNumValue = (id, defaultValue) => {
                const el = this.inputs[id];
                if (!el) return defaultValue;
                const val = parseFloat(el.value);
                return isNaN(val) ? defaultValue : val;
            };

            const settings = {
                // Wheel Settings
                title1: getValue('title-input-1', ''),
                title2: getValue('title-input-2', ''),
                palette1: getValue('palette-select-1', 'classic'),
                palette2: getValue('palette-select-2', 'classic'),
                spinDuration: getNumValue('spin-duration-slider', 6),
                separatorOn: getValue('separator-toggle', true),
                separatorWidth: getNumValue('separator-width', 2),
                wheelSpacing: getNumValue('wheel-spacing', 30),
                wheelLayout: getValue('wheel-layout', 'horizontal'),
                bgColor: getValue('transparent-bg', false) ? 'transparent' : getValue('bg-color-picker', '#00ff00'),
                transparentBg: getValue('transparent-bg', false),

                // Group Settings
                columns: getNumValue('column-count', 3),
                groupPreset: getValue('group-preset-select', 'obs_dark'),
                groupHeaderAlign: getValue('group-header-align', 'center'),
                groupHeaderColor: getValue('group-header-color', '#ECEFF4'),
                groupPrefixColor: getValue('group-prefix-color', '#D8DEE9'),
                groupNameColor: getValue('group-name-color', '#ECEFF4'),
                cardBgColor: getValue('group-card-bg-color', '#2E3440'),
                cardBgOpacity: getNumValue('group-card-bg-opacity', 80) / 100,
                headerBgColor: getValue('group-header-bg-color', '#4C566A'),
                headerBgOpacity: getNumValue('group-header-bg-opacity', 100) / 100,
                prefixBgColor: getValue('group-prefix-bg-color', '#3B4252'),
                prefixBgOpacity: getNumValue('group-prefix-bg-opacity', 100) / 100,
                nameBgColor: getValue('group-name-bg-color', '#434C5E'),
                nameBgOpacity: getNumValue('group-name-bg-opacity', 100) / 100,

                // Winner Settings
                winnerLine1Color: getValue('winner-line1-color', '#f1c40f'),
                winnerLine2Color: getValue('winner-line2-color', '#e9ecef'),
                winnerBgColor: getValue('winner-bg-color', '#17202a'),
                winnerBgOpacity: getNumValue('winner-bg-opacity', 90) / 100,
            };
            StateManager.save('wheelSettings', settings);
            StateManager.triggerUpdate();
        },

        regenerateColorMap(wheelNum) {
            const isWheel1 = wheelNum === 1;
            const masterListText = StateManager.loadText(isWheel1 ? 'wheel1MasterNames' : 'wheel2MasterNames');
            if (!masterListText) return;

            const masterList = masterListText.split('\n').filter(Boolean);
            const settings = StateManager.load('wheelSettings') || {};
            const paletteKey = isWheel1 ? settings.palette1 : settings.palette2;
            const paletteData = Config.palettes[paletteKey] || Config.palettes['classic'];
            const colors = paletteData.colors || paletteData;

            const colorMap = {};
            masterList.forEach((name, i) => {
                colorMap[name] = colors[i % colors.length];
            });

            StateManager.save(isWheel1 ? 'wheel1ColorMap' : 'wheel2ColorMap', colorMap);
            StateManager.triggerUpdate();
        },

        updateNames(wheelNum) {
            // Clear any pending winner when names are updated to prevent stale data
            StateManager.remove('pendingWinner');

            const isWheel1 = wheelNum === 1;
            const list = (isWheel1 ? this.inputs['name-list-1'].value : this.inputs['name-list-2'].value)
                .split('\n')
                .map(name => name.trim())
                .filter(Boolean);

            const listAsString = list.join('\n');

            if (isWheel1) {
                StateManager.saveText('wheel1Names', listAsString);
                StateManager.saveText('wheel1MasterNames', listAsString);
            } else {
                StateManager.saveText('wheel2Names', listAsString);
                StateManager.saveText('wheel2MasterNames', listAsString);
            }
            this.regenerateColorMap(wheelNum);
            StateManager.triggerUpdate();
        },

        renderHistory() {
            const history = StateManager.load('wheelHistory') || [];
            const historyListEl = document.getElementById('history-list');
            if (!historyListEl) return;
            historyListEl.innerHTML = '';
            if (history.length === 0) { historyListEl.innerHTML = 'ประวัติจะแสดงที่นี่...'; return; }

            const sorted = [...history];
            const sortMethod = this.inputs['sort-history'].value;
            if (sortMethod === 'oldest') sorted.sort((a, b) => a.timestamp - b.timestamp);
            else if (sortMethod === 'az') sorted.sort((a, b) => a.val1.localeCompare(b.val1, 'th') || a.val2.localeCompare(b.val2, 'th'));
            else sorted.sort((a, b) => b.timestamp - a.timestamp);

            sorted.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item-simple';
                div.textContent = `${item.val1} - ${item.val2}`;
                historyListEl.appendChild(div);
            });
        },

        copyHistory() {
            const historyItems = document.getElementById('history-list').querySelectorAll('.history-item-simple');
            const copyBtn = this.inputs['copy-history-btn'];

            if (historyItems.length === 0) { alert("ไม่มีประวัติให้คัดลอก"); return; }

            const textToCopy = Array.from(historyItems).map(item => item.textContent.replace(' - ', '\t')).join('\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'คัดลอกแล้ว!';
                copyBtn.disabled = true;
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy history: ', err);
                alert('ไม่สามารถคัดลอกได้ เกิดข้อผิดพลาดบางอย่าง');
            });
        },

        updateNameCounts() {
            document.getElementById('name-count-1').textContent = (this.inputs['name-list-1'].value.match(/.*\S.*/g) || []).length;
            document.getElementById('name-count-2').textContent = (this.inputs['name-list-2'].value.match(/.*\S.*/g) || []).length;
        },

        applyPreset(presetKey) {
            const preset = Config.groupPresets[presetKey];
            if (!preset) return;
            this.inputs['group-header-align'].value = preset.headerAlign;
            this.inputs['group-header-color'].value = preset.headerColor;
            this.inputs['group-prefix-color'].value = preset.prefixColor;
            this.inputs['group-name-color'].value = preset.nameColor;
            this.inputs['group-card-bg-color'].value = preset.cardBgColor;
            this.inputs['group-card-bg-opacity'].value = preset.cardBgOpacity;
            this.inputs['group-header-bg-color'].value = preset.headerBgColor;
            this.inputs['group-header-bg-opacity'].value = preset.headerBgOpacity;
            this.inputs['group-prefix-bg-color'].value = preset.prefixBgColor;
            this.inputs['group-prefix-bg-opacity'].value = preset.prefixBgOpacity;
            this.inputs['group-name-bg-color'].value = preset.nameBgColor;
            this.inputs['group-name-bg-opacity'].value = preset.nameBgOpacity;
            this.saveAllSettings();
        },

        handleSpinClick() {
            const spinBtn = this.inputs['spin-button'];

            // Check if already spinning
            if (spinBtn.disabled) return;

            const pendingWinner = StateManager.load('pendingWinner') || {};
            if (pendingWinner && pendingWinner.val1) {
                alert('มีผลลัพธ์รอยืนยันอยู่ กรุณากด "อัปเดต" หรือ "สุ่มใหม่" ก่อนครับ');
                return;
            }

            const wheel1List = StateManager.loadText('wheel1Names') || '';
            const wheel2List = StateManager.loadText('wheel2Names') || '';
            if (wheel1List.trim().split('\n').filter(Boolean).length > 0 && wheel2List.trim().split('\n').filter(Boolean).length > 0) {
                // Get spin duration from settings
                const settings = StateManager.load('wheelSettings') || {};
                const duration = parseInt(settings.spinDuration) || 6;

                // Disable button and start countdown
                spinBtn.disabled = true;
                spinBtn.classList.add('spinning');
                const originalText = spinBtn.textContent;
                let countdown = duration;

                spinBtn.textContent = `⏳ กำลังหมุน... ${countdown}`;

                const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                        spinBtn.textContent = `⏳ กำลังหมุน... ${countdown}`;
                    } else {
                        clearInterval(countdownInterval);
                        spinBtn.textContent = originalText;
                        spinBtn.disabled = false;
                        spinBtn.classList.remove('spinning');
                    }
                }, 1000);

                localStorage.setItem('spinCommand', Date.now());
            } else {
                alert('กรุณาใส่รายชื่อให้ครบทั้ง 2 วงล้อ และตรวจสอบว่ารายชื่อไม่ว่างเปล่า');
            }
        },

        handleRespinClick() {
            if (!confirm('ยืนยันที่จะสุ่มใหม่หรือไม่?\n\nผลลัพธ์ปัจจุบันจะถูกยกเลิก')) {
                return;
            }
            StateManager.remove('pendingWinner');
            localStorage.setItem('respinCommand', Date.now());
            this.updateButtonState();
        },

        softReset() {
            if (!confirm('รีเซ็ทการสุ่มทั้งหมด?\n\n• ชื่อในวงล้อจะกลับไปเป็นชื่อต้นฉบับ\n• ประวัติจะถูกล้าง\n• เริ่มสุ่มใหม่ตั้งแต่ต้น\n\n(การตั้งค่าอื่นๆ จะยังคงอยู่)')) {
                return;
            }

            // Copy master names back to wheel names
            const master1 = StateManager.loadText('wheel1MasterNames') || '';
            const master2 = StateManager.loadText('wheel2MasterNames') || '';
            StateManager.saveText('wheel1Names', master1);
            StateManager.saveText('wheel2Names', master2);

            // Reset hidden state
            const settings = StateManager.load('wheelSettings') || {};
            if (settings.wheelsHidden) {
                settings.wheelsHidden = false;
                StateManager.save('wheelSettings', settings);
                localStorage.setItem('showWheelsCommand', Date.now()); // Ensure wheels show up
            }

            // Clear history and pending winner
            StateManager.save('wheelHistory', []);
            StateManager.remove('pendingWinner');

            // Reload UI
            this.loadDataIntoControls();
            this.renderHistory();
            this.updateButtonState();
            this.updateNameCounts();

            // Trigger graphics update
            StateManager.triggerUpdate();

            alert('รีเซ็ทการสุ่มเรียบร้อยแล้ว! พร้อมเริ่มสุ่มใหม่');
        },

        openSettingsModal() {
            document.getElementById('settings-modal').classList.add('show');
        },

        closeSettingsModal() {
            document.getElementById('settings-modal').classList.remove('show');
        },

        updateButtonState() {
            const pendingWinner = StateManager.load('pendingWinner') || {};
            const spinBtn = this.inputs['spin-button'];
            const confirmBtn = this.inputs['confirm-winner-btn'];
            const respinBtn = this.inputs['respin-btn'];
            const hideWheelsBtn = this.inputs['hide-wheels-btn'];
            const warningEl = document.getElementById('similar-warning');

            // Check if all names are spun (both lists empty)
            const names1 = (StateManager.loadText('wheel1Names') || '').trim();
            const names2 = (StateManager.loadText('wheel2Names') || '').trim();
            const allSpun = names1 === '' && names2 === '';

            // Check visibility state
            const settings = StateManager.load('wheelSettings') || {};
            const isHidden = settings.wheelsHidden || false;

            if (pendingWinner && pendingWinner.val1) {
                spinBtn.style.display = 'none';
                confirmBtn.style.display = 'block';
                respinBtn.style.display = 'block';
                if (hideWheelsBtn) hideWheelsBtn.style.display = 'none';

                // Show warning if similar team detected
                if (warningEl) {
                    if (pendingWinner.similarWarning) {
                        warningEl.innerHTML = `⚠️ <strong>คำเตือน:</strong> ทีม "${pendingWinner.val2}" คล้ายกับ "${pendingWinner.similarWarning}" ที่อยู่ในกลุ่มเดียวกัน!<br><small>กรุณากดสุ่มใหม่</small>`;
                        warningEl.style.display = 'block';
                    } else {
                        warningEl.style.display = 'none';
                    }
                }
            } else {
                spinBtn.style.display = allSpun ? 'none' : 'block';
                confirmBtn.style.display = 'none';
                respinBtn.style.display = 'none';

                if (hideWheelsBtn) {
                    hideWheelsBtn.style.display = allSpun ? 'block' : 'none';
                    // Update button text and class based on state
                    if (isHidden) {
                        hideWheelsBtn.textContent = '👁️ โชว์วงล้อ';
                        hideWheelsBtn.classList.add('show-wheels'); // You can style this class if needed
                    } else {
                        hideWheelsBtn.textContent = '👁️ ซ่อนวงล้อ';
                        hideWheelsBtn.classList.remove('show-wheels');
                    }
                }

                if (warningEl) warningEl.style.display = 'none';
            }
        },

        loadDataIntoControls() {
            const settings = StateManager.load('wheelSettings') || {};
            Object.keys(settings).forEach(key => {
                const elId = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                const el = this.inputs[elId];
                if (el) {
                    if (el.type === 'checkbox') el.checked = settings[key];
                    else if (el.id.includes('opacity')) el.value = (settings[key] || 1) * 100;
                    else el.value = settings[key];
                }
            });
            this.inputs['bg-color-picker'].disabled = settings.transparentBg || false;
            this.inputs['name-list-1'].value = StateManager.loadText('wheel1MasterNames') || '';
            this.inputs['name-list-2'].value = StateManager.loadText('wheel2MasterNames') || '';

            document.getElementById('duration-value').textContent = this.inputs['spin-duration-slider'].value;
            document.getElementById('spacing-value').textContent = this.inputs['wheel-spacing'].value;

            this.renderHistory();
            this.updateNameCounts();
        },

        clearHistory() {
            if (confirm('คุณต้องการล้างข้อมูลประวัติทั้งหมดใช่หรือไม่? (รายชื่อในวงล้อจะถูกรีเซ็ตกลับไปเป็นค่าเริ่มต้น)')) {
                const masterList1 = StateManager.loadText('wheel1MasterNames') || '';
                const masterList2 = StateManager.loadText('wheel2MasterNames') || '';
                StateManager.saveText('wheel1Names', masterList1);
                StateManager.saveText('wheel2Names', masterList2);
                StateManager.save('wheelHistory', []);
                StateManager.remove('pendingWinner');
                this.renderHistory();
                StateManager.triggerUpdate();
            }
        },

        resetAll() {
            if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตการตั้งค่าและข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
            localStorage.clear();
            window.location.reload();
        },

        populateSelect(selectElement, options) {
            // *** THE FIX for empty dropdown text ***
            if (!selectElement) return;
            selectElement.innerHTML = '';
            Object.keys(options).forEach(key => {
                let displayName;
                const value = options[key];

                // Handles objects with a 'name' property, like groupPresets
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && value.name) {
                    displayName = value.name;
                } else {
                    // Handles palettes (where value is an array) and other simple cases
                    displayName = key.charAt(0).toUpperCase() + key.slice(1);
                }

                selectElement.add(new Option(displayName, key));
            });
        },

        async createOBSSources() {
            const statusEl = document.getElementById('obs-status');
            const btn = this.inputs['create-obs-sources-btn'];
            if (!statusEl || !btn) return;

            btn.disabled = true;
            statusEl.textContent = '⏳ กำลังเชื่อมต่อ OBS...';
            statusEl.className = 'obs-status connecting';

            try {
                // Check if OBSWebSocket is available
                if (typeof OBSWebSocket === 'undefined') {
                    throw new Error('ไม่พบ obs-websocket-js library กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
                }

                const obs = new OBSWebSocket();
                await obs.connect('ws://127.0.0.1:4455');
                statusEl.textContent = '✅ เชื่อมต่อ OBS สำเร็จ กำลังสร้าง Source...';

                // Get current scene
                const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');

                // Determine base URL for the HTML files
                const baseUrl = window.location.href.replace(/\/[^/]*$/, '');

                const sources = [
                    { name: 'RandomWheel - Wheels', file: 'wheels.html' },
                    { name: 'RandomWheel - Winner', file: 'winner.html' },
                    { name: 'RandomWheel - Groups', file: 'groups.html' },
                ];

                const results = [];
                for (const src of sources) {
                    try {
                        await obs.call('CreateInput', {
                            sceneName: currentProgramSceneName,
                            inputName: src.name,
                            inputKind: 'browser_source',
                            inputSettings: {
                                url: `${baseUrl}/${src.file}`,
                                width: 1920,
                                height: 1080,
                                css: '',
                            },
                            sceneItemEnabled: true
                        });
                        results.push(`✅ ${src.name}`);
                    } catch (err) {
                        if (err.message && err.message.includes('already exists')) {
                            results.push(`⚠️ ${src.name} (มีอยู่แล้ว)`);
                        } else {
                            results.push(`❌ ${src.name}: ${err.message}`);
                        }
                    }
                }

                await obs.disconnect();
                statusEl.innerHTML = results.join('<br>') + `<br><small>Scene: ${currentProgramSceneName}</small>`;
                statusEl.className = 'obs-status success';

            } catch (err) {
                statusEl.textContent = `❌ ${err.message || 'ไม่สามารถเชื่อมต่อ OBS ได้'}`;
                statusEl.className = 'obs-status error';
                console.error('OBS WebSocket Error:', err);
            } finally {
                btn.disabled = false;
            }
        },

        initialSetup(forceReset = false) {
            this.populateSelect(this.inputs['palette-select-1'], Config.palettes);
            this.populateSelect(this.inputs['palette-select-2'], Config.palettes);
            this.populateSelect(this.inputs['group-preset-select'], Config.groupPresets);

            if (!StateManager.load('wheelSettings') || forceReset) {
                this.inputs['wheel-spacing'].value = 120;
                this.inputs['transparent-bg'].checked = true;
                this.inputs['bg-color-picker'].disabled = true;

                this.inputs['title-input-1'].value = 'กลุ่ม';
                this.inputs['title-input-2'].value = 'ทีม';
                this.inputs['palette-select-1'].value = 'classic';
                this.inputs['palette-select-2'].value = 'classic';
                this.inputs['spin-duration-slider'].value = 6;
                this.inputs['separator-toggle'].checked = true;
                this.inputs['separator-width'].value = 1;
                this.inputs['bg-color-picker'].value = '#00ff00';
                this.inputs['name-list-1'].value = "A1\nA2\nA3\nB1\nB2\nB3\nC1\nC2\nC3";
                this.inputs['name-list-2'].value = "สก.ทรัพย์เจริญ X\nมาดามเก๋\nMP SOCCER\nห้างทองแม่อุรัย\nจอมยุทธ ยูไนเต็ด\nสุรินทร์การค้า\nสวย 24 FC\nYAI FC B\nKNP TTS.";
                this.inputs['winner-line1-color'].value = '#f1c40f';
                this.inputs['winner-line2-color'].value = '#e9ecef';
                this.inputs['winner-bg-color'].value = '#17202a';
                this.inputs['winner-bg-opacity'].value = 90;

                this.applyPreset("obs_dark");
                this.updateNames(1);
                this.updateNames(2);
                StateManager.save('wheelHistory', []);
                StateManager.remove('pendingWinner');
                this.saveAllSettings();
            }

            this.loadDataIntoControls();
            this.updateButtonState();
        },
    };

    // --- MODULE 4: GRAPHICS PAGES MANAGER ---
    const GraphicsManager = {
        rotation1: 0,
        rotation2: 0,
        spinTimer: null,

        init() {
            this.syncState();
            window.addEventListener('storage', this.syncState.bind(this));
        },

        syncState(e = null) {
            this.applySettings();
            if (page === 'Wheels Display') this.updateAndDrawWheels();
            if (page === 'Grouping Display') this.renderGroups();
            if (page === 'Winner Display') this.showWinner();

            if (e) {
                switch (e.key) {
                    case 'spinCommand': if (page === 'Wheels Display') this.spinWheels(); break;
                    case 'respinCommand': if (page === 'Wheels Display' || page === 'Winner Display') this.handleRespin(); break;
                    case 'confirmWinnerCommand': this.confirmAndProcessWinner(); break;
                    case 'hideWheelsCommand': if (page === 'Wheels Display') this.hideWheels(); break;
                    case 'showWheelsCommand': if (page === 'Wheels Display') this.showWheels(); break;
                    case 'updateGraphics': this.syncState(); break;
                }
            }
        },

        handleRespin() {
            const overlay = document.getElementById('winner-overlay');
            if (overlay) overlay.classList.remove('show');
            clearTimeout(this.spinTimer);

            if (page === 'Wheels Display') {
                this.spinWheels();
            }
        },

        hideWheels() {
            const container = document.querySelector('.wheels-area') || document.body;
            container.style.transition = 'opacity 2s ease-out';
            container.style.opacity = '0';
        },

        showWheels() {
            const container = document.querySelector('.wheels-area') || document.body;
            container.style.transition = 'opacity 0.5s ease-in';
            container.style.opacity = '1';
        },



        applySettings() {
            const settings = StateManager.load('wheelSettings') || {};
            const root = document.documentElement;
            root.style.setProperty('--wheel-spacing', (settings.wheelSpacing || 30) + 'px');
            document.body.style.backgroundColor = settings.bgColor || 'transparent';

            // Apply Wheel Layout
            const wheelsArea = document.querySelector('.wheels-area');
            if (wheelsArea) {
                if (settings.wheelLayout === 'vertical') {
                    wheelsArea.style.flexDirection = 'column';
                    wheelsArea.style.alignItems = 'center';
                } else {
                    wheelsArea.style.flexDirection = 'row';
                    wheelsArea.style.alignItems = 'flex-start';
                }

                // Handle Visibility based on settings
                if (settings.wheelsHidden) {
                    wheelsArea.style.opacity = '0';
                    wheelsArea.style.pointerEvents = 'none'; // Prevent interaction when hidden
                } else {
                    // Only fade in if it was hidden
                    if (wheelsArea.style.opacity === '0') {
                        wheelsArea.style.transition = 'opacity 0.5s ease-in';
                        wheelsArea.style.opacity = '1';
                        wheelsArea.style.pointerEvents = 'auto';
                    } else {
                        // Ensure it's visible if it wasn't valid 0 (e.g. init)
                        wheelsArea.style.opacity = '1';
                    }
                }
            }

            if (page === 'Winner Display') {
                root.style.setProperty('--winner-l1-color', settings.winnerLine1Color || '#f1c40f');
                root.style.setProperty('--winner-l2-color', settings.winnerLine2Color || '#e9ecef');
                root.style.setProperty('--winner-bg', Config.hexToRgba(settings.winnerBgColor || '#17202a', settings.winnerBgOpacity || 0.9));
            }

            if (page === 'Grouping Display') {
                root.style.setProperty('--num-columns', settings.columns || 3);
                root.style.setProperty('--group-card-bg', Config.hexToRgba(settings.cardBgColor, settings.cardBgOpacity));
                root.style.setProperty('--group-header-bg', Config.hexToRgba(settings.headerBgColor, settings.headerBgOpacity));
                root.style.setProperty('--group-prefix-bg', Config.hexToRgba(settings.prefixBgColor, settings.prefixBgOpacity));
                root.style.setProperty('--group-name-bg', Config.hexToRgba(settings.nameBgColor, settings.nameBgOpacity));
                root.style.setProperty('--group-header-align', settings.groupHeaderAlign || 'center');
                root.style.setProperty('--group-header-color', settings.groupHeaderColor || '#ffffff');
                root.style.setProperty('--group-prefix-color', settings.groupPrefixColor || '#333333');
                root.style.setProperty('--group-name-color', settings.groupNameColor || '#333333');
            }
        },

        drawWheel(ctx, canvas, names, colorMap, settings) {
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
            const radius = centerX - 8;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!names || names.length === 0 || !colorMap) {
                ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.fillStyle = '#ddd'; ctx.fill();
                ctx.strokeStyle = '#34495e'; ctx.lineWidth = 8; ctx.stroke();
                return;
            }
            const segmentAngle = (2 * Math.PI) / names.length;
            names.forEach((name, i) => {
                const startAngle = i * segmentAngle - (Math.PI / 2);
                const endAngle = (i + 1) * segmentAngle - (Math.PI / 2);
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.closePath();
                ctx.fillStyle = colorMap[name] || '#cccccc';
                ctx.fill();
                if (settings.separatorOn) {
                    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = parseInt(settings.separatorWidth, 10) || 1; ctx.stroke();
                }
                ctx.save(); ctx.translate(centerX, centerY); ctx.rotate((startAngle + endAngle) / 2);
                ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 2;
                let fontSize = 20;
                ctx.font = `bold ${fontSize}px Sarabun`;
                while (ctx.measureText(name).width > radius * 0.75 && fontSize > 10) {
                    fontSize--; ctx.font = `bold ${fontSize}px Sarabun`;
                }
                ctx.fillText(name, radius - 20, 0);
                ctx.restore();
            });
            ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.strokeStyle = '#34495e'; ctx.lineWidth = 8; ctx.stroke();
        },

        updateAndDrawWheels() {
            const canvas1 = document.getElementById('wheel-canvas-1'), canvas2 = document.getElementById('wheel-canvas-2');
            if (!canvas1 || !canvas2) return;
            const settings = StateManager.load('wheelSettings') || {};
            const names1 = (StateManager.loadText('wheel1Names') || "").split('\n').filter(Boolean);
            const names2 = (StateManager.loadText('wheel2Names') || "").split('\n').filter(Boolean);
            const colorMap1 = StateManager.load('wheel1ColorMap') || {};
            const colorMap2 = StateManager.load('wheel2ColorMap') || {};

            const wheelTitle1 = document.getElementById('wheel-title-1'), wheelTitle2 = document.getElementById('wheel-title-2');
            if (wheelTitle1) wheelTitle1.textContent = settings.title1 || '';
            if (wheelTitle2) wheelTitle2.textContent = settings.title2 || '';

            const ctx1 = canvas1.getContext('2d'), ctx2 = canvas2.getContext('2d');
            this.drawWheel(ctx1, canvas1, names1, colorMap1, settings);
            this.drawWheel(ctx2, canvas2, names2, colorMap2, settings);
        },

        spinWheels() {
            const canvas1 = document.getElementById('wheel-canvas-1'), canvas2 = document.getElementById('wheel-canvas-2');
            if (!canvas1) return;
            const names1 = (StateManager.loadText('wheel1Names') || "").split('\n').filter(Boolean);
            const names2 = (StateManager.loadText('wheel2Names') || "").split('\n').filter(Boolean);
            if (names1.length === 0 || names2.length === 0) return;

            const settings = StateManager.load('wheelSettings') || {};
            const duration = parseFloat(settings.spinDuration) || 6;

            // Secure random function
            const getSecureRandom = () => {
                if (window.crypto && window.crypto.getRandomValues) {
                    const array = new Uint32Array(1);
                    window.crypto.getRandomValues(array);
                    return array[0] / (0xFFFFFFFF + 1);
                }
                return Math.random();
            };

            // Helper function to check similarity
            const checkSimilarity = (val1, val2) => {
                const groupPrefix = (val1.match(/^[a-zA-Z]+/) || [''])[0].toUpperCase();
                const history = StateManager.load('wheelHistory') || [];
                const teamsInSameGroup = history
                    .filter(item => {
                        const itemPrefix = (item.val1.match(/^[a-zA-Z]+/) || [''])[0].toUpperCase();
                        return itemPrefix === groupPrefix;
                    })
                    .map(item => item.val2);

                for (const existingTeam of teamsInSameGroup) {
                    if (Config.areSimilarTeams(val2, existingTeam)) {
                        return existingTeam;
                    }
                }
                return null;
            };

            // Helper to get winner index from rotation
            const getWinnerIndex = (rotation, itemCount) => {
                const normalizedRotation = ((rotation % 360) + 360) % 360;
                const sliceAngle = 360 / itemCount;
                return Math.floor(((360 - normalizedRotation) % 360) / sliceAngle) % itemCount;
            };

            // First, randomly select the TEAM (wheel 2) - this stays fixed
            const minSpins = 10;
            const maxSpins = 18;
            const spins2 = minSpins + Math.floor(getSecureRandom() * (maxSpins - minSpins + 1));
            const randomOffset2 = getSecureRandom() * 360;
            const finalRotation2 = this.rotation2 + (spins2 * 360) + randomOffset2;
            const teamIndex = getWinnerIndex(finalRotation2, names2.length);
            const selectedTeam = names2[teamIndex];

            // Now try up to 5 times to find a GROUP that doesn't have similar team
            let bestRotation1 = null;
            let bestSimilar = null;

            for (let attempt = 1; attempt <= 5; attempt++) {
                const spins1 = minSpins + Math.floor(getSecureRandom() * (maxSpins - minSpins + 1));
                const randomOffset1 = getSecureRandom() * 360;
                const testRotation1 = this.rotation1 + (spins1 * 360) + randomOffset1;
                const groupIndex = getWinnerIndex(testRotation1, names1.length);

                const similar = checkSimilarity(names1[groupIndex], selectedTeam);

                if (!similar) {
                    bestRotation1 = testRotation1;
                    bestSimilar = null;
                    console.log(`[Spin] ครั้งที่ ${attempt}: กลุ่ม "${names1[groupIndex]}" ไม่มีทีมซ้ำ ✓`);
                    break;
                } else {
                    if (bestRotation1 === null) {
                        bestRotation1 = testRotation1;
                        bestSimilar = similar;
                    }
                    console.log(`[Spin] ครั้งที่ ${attempt}: กลุ่ม "${names1[groupIndex]}" มีทีมคล้าย "${similar}" - ลองกลุ่มอื่น`);
                }
            }

            // Use the best rotation found
            this.rotation1 = bestRotation1;
            this.rotation2 = finalRotation2;

            // Apply smooth animation with natural easing
            canvas1.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.25, 1)`;
            canvas2.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.25, 1)`;

            canvas1.style.transform = `rotate(${this.rotation1}deg)`;
            canvas2.style.transform = `rotate(${this.rotation2}deg)`;

            // After spin completes, determine winner from actual rotation
            clearTimeout(this.spinTimer);
            this.spinTimer = setTimeout(() => {
                const winnerIndex1 = getWinnerIndex(this.rotation1, names1.length);
                const winnerIndex2 = getWinnerIndex(this.rotation2, names2.length);

                // Re-check similarity for the final result (in case of edge cases)
                const finalSimilar = checkSimilarity(names1[winnerIndex1], names2[winnerIndex2]);

                const winners = {
                    val1: names1[winnerIndex1],
                    val2: names2[winnerIndex2],
                    timestamp: Date.now(),
                    similarWarning: finalSimilar
                };

                StateManager.save('pendingWinner', winners);
                StateManager.triggerUpdate();
            }, duration * 1000 + 200);
        },

        showWinner() {
            const overlay = document.getElementById('winner-overlay');
            if (!overlay) return;
            const winnerData = StateManager.load('pendingWinner') || {};
            if (winnerData && winnerData.val1) {
                document.getElementById('winner-part1').textContent = winnerData.val1;
                document.getElementById('winner-part2').textContent = winnerData.val2;
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        },

        renderGroups() {
            const container = document.getElementById('groups-container');
            if (!container) return;
            const masterNames = (StateManager.loadText('wheel1MasterNames') || '').split('\n').filter(Boolean);
            const history = StateManager.load('wheelHistory') || [];
            const pairedResults = new Map(history.map(item => [item.val1, item.val2]));
            container.innerHTML = '';
            if (masterNames.length === 0) { container.innerHTML = '<p class="no-data">ยังไม่มีข้อมูลรายชื่อกลุ่มหลัก</p>'; return; }
            const groups = {};
            masterNames.forEach(name1 => {
                const match = name1.match(/^[a-zA-Z]+/);
                const prefix = match ? match[0].toUpperCase() : 'Misc';
                if (!groups[prefix]) groups[prefix] = [];
                groups[prefix].push({ slotName: name1, pairedName: pairedResults.get(name1) || '...' });
            });
            Object.keys(groups).sort().forEach(key => {
                const groupCard = document.createElement('div');
                groupCard.className = 'group-card';
                const title = document.createElement('h2');
                title.textContent = `กลุ่ม ${key}`;
                groupCard.appendChild(title);
                groups[key].sort((a, b) => a.slotName.localeCompare(b.slotName, undefined, { numeric: true })).forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'group-item';
                    const nameClass = item.pairedName === '...' ? 'group-name placeholder' : 'group-name';
                    itemDiv.innerHTML = `<span class="group-prefix">${item.slotName}</span><span class="${nameClass}">${item.pairedName}</span>`;
                    groupCard.appendChild(itemDiv);
                });
                container.appendChild(groupCard);
            });
        },

        handleRespin() {
            const overlay = document.getElementById('winner-overlay');
            if (overlay) overlay.classList.remove('show');

            if (page === 'Wheels Display') {
                this.spinWheels();
            }
        },

        hideWheels() {
            const container = document.querySelector('.wheels-container') || document.body;
            container.style.transition = 'opacity 2s ease-out';
            container.style.opacity = '0';
        },

        confirmAndProcessWinner() {
            const pendingWinner = StateManager.load('pendingWinner') || {};
            if (!pendingWinner.val1) return;

            let history = StateManager.load('wheelHistory') || [];
            history.push(pendingWinner);
            StateManager.save('wheelHistory', history);

            let names1 = (StateManager.loadText('wheel1Names') || '').split('\n').filter(Boolean);
            let names2 = (StateManager.loadText('wheel2Names') || '').split('\n').filter(Boolean);

            const newNames1 = names1.filter(n => n.trim() !== pendingWinner.val1.trim());
            const newNames2 = names2.filter(n => n.trim() !== pendingWinner.val2.trim());
            StateManager.saveText('wheel1Names', newNames1.join('\n'));
            StateManager.saveText('wheel2Names', newNames2.join('\n'));

            StateManager.remove('pendingWinner');

            // Hide the winner overlay
            const overlay = document.getElementById('winner-overlay');
            if (overlay) overlay.classList.remove('show');

            StateManager.triggerUpdate();
        }
    };

    // --- MAIN ROUTER ---
    if (page === 'Control Panel') {
        ControlsManager.init();
    } else if (['Wheels Display', 'Grouping Display', 'Winner Display'].includes(page)) {
        GraphicsManager.init();
    }
});