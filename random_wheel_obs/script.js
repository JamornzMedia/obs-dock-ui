// This one script will control all pages.
document.addEventListener('DOMContentLoaded', () => {
    const page = document.title;

    // --- MODULE 1: SHARED CONFIGURATION ---
    const Config = {
        palettes: {
            classic: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'],
            pastel: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'],
            neon: ['#f83bff', '#39ff14', '#feff00', '#ff0054', '#00e5ff', '#ff6600', '#8a2be2', '#20f1dd'],
            corporate: ['#34495e', '#7f8c8d', '#2c3e50', '#95a5a6', '#bdc3c7', '#596275', '#303952', '#1e272e'],
            monochrome: ['#212121', '#424242', '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0'],
        },
        groupPresets: {
            "obs_dark": { name: "OBS Dark (Default)", headerAlign: "center", headerColor: "#ECEFF4", prefixColor: "#D8DEE9", nameColor: "#ECEFF4", cardBgColor: "#2E3440", cardBgOpacity: 80, headerBgColor: "#4C566A", headerBgOpacity: 100, prefixBgColor: "#3B4252", prefixBgOpacity: 100, nameBgColor: "#434C5E", nameBgOpacity: 100 },
            "graphite_gold": { name: "Graphite & Gold", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#F0E68C", nameColor: "#FFFFFF", cardBgColor: "#212121", cardBgOpacity: 95, headerBgColor: "#B8860B", headerBgOpacity: 100, prefixBgColor: "#424242", prefixBgOpacity: 100, nameBgColor: "#303030", nameBgOpacity: 100 },
            "sapphire_carbon": { name: "Sapphire & Carbon", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#87CEFA", nameColor: "#FFFFFF", cardBgColor: "#1a1a1a", cardBgOpacity: 95, headerBgColor: "#003366", headerBgOpacity: 100, prefixBgColor: "#2d2d2d", prefixBgOpacity: 100, nameBgColor: "#222222", nameBgOpacity: 100 },
            "crimson_slate": { name: "Crimson & Slate", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#F8F8FF", nameColor: "#FFFFFF", cardBgColor: "#2F4F4F", cardBgOpacity: 95, headerBgColor: "#DC143C", headerBgOpacity: 100, prefixBgColor: "#556B6B", prefixBgOpacity: 100, nameBgColor: "#3D5A5A", nameBgOpacity: 100 },
            "emerald_onyx": { name: "Emerald & Onyx", headerAlign: "center", headerColor: "#FFFFFF", prefixColor: "#E0EEE0", nameColor: "#FFFFFF", cardBgColor: "#0a0a0a", cardBgOpacity: 95, headerBgColor: "#009B77", headerBgOpacity: 100, prefixBgColor: "#222222", prefixBgOpacity: 100, nameBgColor: "#111111", nameBgOpacity: 100 },
            "oceanic_deep": { name: "Oceanic Deep", headerAlign: "left", headerColor: "#FFFFFF", prefixColor: "#99D5C9", nameColor: "#FFFFFF", cardBgColor: "#0A2342", cardBgOpacity: 95, headerBgColor: "#2CA58D", headerBgOpacity: 100, prefixBgColor: "#1F476D", prefixBgOpacity: 100, nameBgColor: "#143552", nameBgOpacity: 100 },
            "mint_silver": { name: "Mint & Silver", headerAlign: "left", headerColor: "#FFFFFF", prefixColor: "#000000", nameColor: "#2F4F4F", cardBgColor: "#F5F5F5", cardBgOpacity: 100, headerBgColor: "#3CB371", headerBgOpacity: 100, prefixBgColor: "#E0E0E0", prefixBgOpacity: 100, nameBgColor: "#FFFFFF", nameBgOpacity: 100 },
        },
        hexToRgba: (hex, opacity = 1) => {
            if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;
            let c = hex.substring(1).split('');
            if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
            c = '0x' + c.join('');
            return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity})`;
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
            this.inputs['clear-history-btn'].addEventListener('click', this.clearHistory.bind(this));
            this.inputs['copy-history-btn'].addEventListener('click', this.copyHistory.bind(this));
            this.inputs['reset-all-btn'].addEventListener('click', this.resetAll.bind(this));
            
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
            const settings = {
                title1: this.inputs['title-input-1'].value,
                title2: this.inputs['title-input-2'].value,
                palette1: this.inputs['palette-select-1'].value,
                palette2: this.inputs['palette-select-2'].value,
                spinDuration: this.inputs['spin-duration-slider'].value,
                separatorOn: this.inputs['separator-toggle'].checked,
                separatorWidth: this.inputs['separator-width'].value,
                wheelSpacing: this.inputs['wheel-spacing'].value,
                bgColor: this.inputs['transparent-bg'].checked ? 'transparent' : this.inputs['bg-color-picker'].value,
                transparentBg: this.inputs['transparent-bg'].checked,
                columns: document.getElementById('column-count').value,
                groupPreset: this.inputs['group-preset-select'].value,
                winnerLine1Color: this.inputs['winner-line1-color'].value,
                winnerLine2Color: this.inputs['winner-line2-color'].value,
                winnerBgColor: this.inputs['winner-bg-color'].value,
                winnerBgOpacity: this.inputs['winner-bg-opacity'].value / 100,
                groupHeaderAlign: this.inputs['group-header-align'].value,
                groupHeaderColor: this.inputs['group-header-color'].value,
                groupPrefixColor: this.inputs['group-prefix-color'].value,
                groupNameColor: this.inputs['group-name-color'].value,
                cardBgColor: this.inputs['group-card-bg-color'].value,
                cardBgOpacity: this.inputs['group-card-bg-opacity'].value / 100,
                headerBgColor: this.inputs['group-header-bg-color'].value,
                headerBgOpacity: this.inputs['group-header-bg-opacity'].value / 100,
                prefixBgColor: this.inputs['group-prefix-bg-color'].value,
                prefixBgOpacity: this.inputs['group-prefix-bg-opacity'].value / 100,
                nameBgColor: this.inputs['group-name-bg-color'].value,
                nameBgOpacity: this.inputs['group-name-bg-opacity'].value / 100,
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
            const palette = Config.palettes[paletteKey] || Config.palettes['classic'];

            const colorMap = {};
            masterList.forEach((name, i) => {
                colorMap[name] = palette[i % palette.length];
            });

            StateManager.save(isWheel1 ? 'wheel1ColorMap' : 'wheel2ColorMap', colorMap);
            StateManager.triggerUpdate();
        },

        updateNames(wheelNum) {
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
            if (sortMethod === 'oldest') sorted.sort((a,b) => a.timestamp - b.timestamp);
            else if (sortMethod === 'az') sorted.sort((a, b) => a.val1.localeCompare(b.val1, 'th') || a.val2.localeCompare(b.val2, 'th'));
            else sorted.sort((a,b) => b.timestamp - a.timestamp);

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
            const pendingWinner = StateManager.load('pendingWinner') || {};
            if (pendingWinner && pendingWinner.val1) {
                alert('กรุณากด "อัปเดตคู่ล่าสุด" เพื่อยืนยันผลก่อนทำการสุ่มใหม่ครับ');
                return;
            }
            
            const wheel1List = StateManager.loadText('wheel1Names') || '';
            const wheel2List = StateManager.loadText('wheel2Names') || '';
            if (wheel1List.trim().split('\n').filter(Boolean).length > 0 && wheel2List.trim().split('\n').filter(Boolean).length > 0) {
                localStorage.setItem('spinCommand', Date.now());
            } else {
                alert('กรุณาใส่รายชื่อให้ครบทั้ง 2 วงล้อ และตรวจสอบว่ารายชื่อไม่ว่างเปล่า');
            }
        },
        
        updateButtonState() {
            const pendingWinner = StateManager.load('pendingWinner') || {};
            if (pendingWinner && pendingWinner.val1) {
                this.inputs['confirm-winner-btn'].style.display = 'block';
                this.inputs['spin-button'].classList.remove('full-width');
            } else {
                this.inputs['confirm-winner-btn'].style.display = 'none';
                this.inputs['spin-button'].classList.add('full-width');
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

        init() {
            this.syncState();
            window.addEventListener('storage', this.syncState.bind(this));
        },
        
        syncState(e = null) {
            this.applySettings();
            if (page === 'Wheels Display') this.updateAndDrawWheels();
            if (page === 'Grouping Display') this.renderGroups();
            if (page === 'Winner Display') this.showWinner();
            
            if(e) {
                switch(e.key) {
                    case 'spinCommand': if (page === 'Wheels Display') this.spinWheels(); break;
                    case 'confirmWinnerCommand': this.confirmAndProcessWinner(); break;
                    case 'updateGraphics': this.syncState(); break;
                }
            }
        },

        applySettings() {
            const settings = StateManager.load('wheelSettings') || {};
            const root = document.documentElement;
            root.style.setProperty('--wheel-spacing', (settings.wheelSpacing || 30) + 'px');
            document.body.style.backgroundColor = settings.bgColor || 'transparent';

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
            if(wheelTitle1) wheelTitle1.textContent = settings.title1 || '';
            if(wheelTitle2) wheelTitle2.textContent = settings.title2 || '';
            
            const ctx1 = canvas1.getContext('2d'), ctx2 = canvas2.getContext('2d');
            this.drawWheel(ctx1, canvas1, names1, colorMap1, settings);
            this.drawWheel(ctx2, canvas2, names2, colorMap2, settings);
        },

        spinWheels() {
            const canvas1 = document.getElementById('wheel-canvas-1'), canvas2 = document.getElementById('wheel-canvas-2');
            if(!canvas1) return;
            const names1 = (StateManager.loadText('wheel1Names') || "").split('\n').filter(Boolean);
            const names2 = (StateManager.loadText('wheel2Names') || "").split('\n').filter(Boolean);
            if(names1.length === 0 || names2.length === 0) return;
            const settings = StateManager.load('wheelSettings') || {};
            const duration = settings.spinDuration || 6;
            this.rotation1 += (8 * 360) + Math.floor(Math.random() * 360);
            this.rotation2 += (8 * 360) + Math.floor(Math.random() * 360);
            [canvas1, canvas2].forEach(c => { c.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1)`; });
            canvas1.style.transform = `rotate(${this.rotation1}deg)`;
            canvas2.style.transform = `rotate(${this.rotation2}deg)`;
            setTimeout(() => {
                const winnerIndex1 = Math.floor(((360 - (this.rotation1 % 360)) % 360) / (360 / names1.length));
                const winnerIndex2 = Math.floor(((360 - (this.rotation2 % 360)) % 360) / (360 / names2.length));
                const winners = { val1: names1[winnerIndex1], val2: names2[winnerIndex2], timestamp: Date.now() };
                
                StateManager.save('pendingWinner', winners);
                StateManager.triggerUpdate();
            }, duration * 1000 + 200);
        },
        
        showWinner() {
             const overlay = document.getElementById('winner-overlay');
             if(!overlay) return;
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
             if(!container) return;
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
                 groups[key].sort((a, b) => a.slotName.localeCompare(b.slotName, undefined, {numeric: true})).forEach(item => {
                     const itemDiv = document.createElement('div');
                     itemDiv.className = 'group-item';
                     const nameClass = item.pairedName === '...' ? 'group-name placeholder' : 'group-name';
                     itemDiv.innerHTML = `<span class="group-prefix">${item.slotName}</span><span class="${nameClass}">${item.pairedName}</span>`;
                     groupCard.appendChild(itemDiv);
                 });
                 container.appendChild(groupCard);
             });
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