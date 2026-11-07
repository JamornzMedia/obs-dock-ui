// This one script will control all pages.
document.addEventListener('DOMContentLoaded', () => {
    // groups.html?view=tournament shows the match table (keeps the web version at 7 files)
    const viewParam = new URLSearchParams(window.location.search).get('view');
    const page = (document.title === 'Grouping Display' && viewParam === 'tournament') ? 'Tournament Display' : document.title;
    if (page === 'Tournament Display') document.body.classList.add('view-tournament');

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
        // Display themes. 'classic' is the original look and stays the default.
        wheelThemes: {
            classic: { name: 'คลาสสิก (เดิม)', margin: 8, ring: '#34495e', ringWidth: 8, separator: '#FFFFFF', empty: '#dddddd', pointer: '#e74c3c' },
            gold:    { name: 'Gold Show (ขอบทอง + ไฟ)', margin: 12, ringGradient: ['#f7e08a', '#b8860b', '#fff1b8', '#a8740a'], ringWidth: 16, separator: '#fff3c4', empty: '#3a2f12', bulbs: true, hub: '#1c1608', hubSize: 26, hubBorder: '#e8c35a', pointer: '#e8c35a' },
            neon:    { name: 'Neon (เรืองแสง)', margin: 22, ring: '#22d3ee', ringWidth: 6, separator: '#0b1020', empty: '#0f172a', glow: '#22d3ee', hub: '#0b1020', hubSize: 22, hubBorder: '#22d3ee', pointer: '#f0abfc' },
            minimal: { name: 'Minimal (เรียบ)', margin: 6, ring: null, ringWidth: 0, separator: 'rgba(255,255,255,0.85)', empty: '#e5e7eb', hub: '#ffffff', hubSize: 18, hubBorder: '#1f2937', pointer: '#f8fafc' },
            stadium: { name: 'Stadium (สนามกีฬา)', margin: 10, ring: '#111111', ringWidth: 14, innerRing: '#ffffff', separator: '#ffffff', empty: '#374151', ticks: '#ffffff', hub: '#111111', hubSize: 24, hubBorder: '#ffffff', pointer: '#ef4444' },
        },
        winnerThemes: {
            classic:   { name: 'คลาสสิก (เดิม)' },
            broadcast: { name: 'Broadcast (แถบข่าวกีฬา)' },
            gold:      { name: 'Gold Award (ประกาศรางวัล)' },
            neon:      { name: 'Neon (เรืองแสง)' },
            clean:     { name: 'Clean Light (พื้นขาว)' },
        },
        tableThemes: {
            classic:   { name: 'คลาสสิก (ใช้สีจากการตั้งค่า)' },
            broadcast: { name: 'Broadcast (กรมท่า + แดง)' },
            gold:      { name: 'Gold (ดำ-ทอง)' },
            neon:      { name: 'Neon (เรืองแสง)' },
            clean:     { name: 'Clean Light (พื้นขาว)' },
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
        },
        // Check if a group is allowed for a team based on constraints
        // Group locks only count in the "วางสายเอง" (lock) mode
        isGroupAllowedForTeam: (groupSlotName, teamName) => {
            if (DrawRules.loadSettings().mode !== 'lock') return true;
            const constraints = DrawRules.loadConstraints();
            const constraint = constraints.find(c => c.team.trim().toLowerCase() === teamName.trim().toLowerCase());
            if (!constraint) return true; // No constraints for this team
            
            const match = groupSlotName.match(/^[a-zA-Z]+/);
            const prefix = match ? match[0].toUpperCase() : 'Misc';
            
            return constraint.groups.some(g => {
                const cleanG = g.trim().toUpperCase();
                return cleanG === prefix || cleanG === groupSlotName.trim().toUpperCase();
            });
        },
        // Escape text before putting it into innerHTML
        esc: (value) => String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
        // Group prefix of a slot name: "A1" -> "A"
        groupPrefix: (slotName) => {
            const match = String(slotName || '').trim().match(/^[a-zA-Z]+/);
            return match ? match[0].toUpperCase() : 'Misc';
        },
        // Relative luminance (0..1) of a hex colour
        luminance: (hex) => {
            if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex || '')) return 0;
            let c = hex.substring(1);
            if (c.length === 3) c = c.split('').map(x => x + x).join('');
            const ch = [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16) / 255)
                .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
            return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
        }
    };

    // --- MODULE 1B: DRAW RULES (same-club teams, constraints, solver) ---
    // Teams of the same club (e.g. "YAI FC A" / "YAI FC B") must not land in the same group.
    const DrawRules = {
        defaults: () => ({ mode: 'auto', enabled: true, ignored: [], links: [] }),

        // Draw modes:
        //  auto  = normal random draw, same-club teams never share a group (default)
        //  first = same-club teams are drawn before the others
        //  lock  = operator puts chosen teams in a group; the draw still looks normal
        //  off   = no rules
        modes: ['auto', 'first', 'lock', 'off'],
        _cache: { raw: undefined, rawC: undefined, settings: null, constraints: [] },

        loadConstraints() {
            const raw = localStorage.getItem('teamConstraints');
            if (raw !== this._cache.rawC) {
                let list = [];
                try { list = JSON.parse(raw) || []; } catch (e) { list = []; }
                this._cache.rawC = raw;
                this._cache.constraints = Array.isArray(list) ? list.filter(c => c && c.team && Array.isArray(c.groups)) : [];
            }
            return this._cache.constraints;
        },

        loadSettings() {
            const raw = localStorage.getItem('siblingSettings') + '|' + localStorage.getItem('teamConstraints');
            if (raw === this._cache.raw && this._cache.settings) return this._cache.settings;
            let s = null;
            try { s = JSON.parse(localStorage.getItem('siblingSettings')); } catch (e) { s = null; }
            const out = this.defaults();
            if (s && typeof s === 'object') {
                out.ignored = Array.isArray(s.ignored) ? s.ignored : [];
                out.links = Array.isArray(s.links) ? s.links.filter(l => Array.isArray(l) && l.length === 2) : [];
            }
            if (s && this.modes.includes(s.mode)) out.mode = s.mode;
            else if (s && s.enabled === false) out.mode = 'off';
            // Older versions always applied group constraints: keep them working
            else out.mode = this.loadConstraints().length > 0 ? 'lock' : 'auto';
            out.enabled = out.mode !== 'off';
            this._cache.raw = raw;
            this._cache.settings = out;
            return out;
        },

        saveSettings(s) {
            const mode = this.modes.includes(s.mode) ? s.mode : 'auto';
            localStorage.setItem('siblingSettings', JSON.stringify({ mode, enabled: mode !== 'off', ignored: s.ignored || [], links: s.links || [] }));
        },

        norm: (name) => String(name || '').trim().replace(/\s+/g, ' ').toLowerCase(),

        // Club key of a team name: strips a trailing one-letter / one-digit team marker.
        // "YAI FC B" -> "yai fc", "ทีมบ้านนา (ก)" -> "ทีมบ้านนา", "Lion 2" -> "lion", "YAI FC" -> "yai fc"
        clubKey(name) {
            const n = this.norm(name);
            const withSep = n.match(/^(.+?)(?:\s*[-_.]\s*|\s+|\s*[(\[]\s*)(?:ทีม\s*)?([a-z]|[ก-ฮ]|\d{1,2})\s*[)\]]?\.?$/i);
            if (withSep && withSep[1].trim().length >= 2) return withSep[1].trim();
            const digits = n.match(/^(.+?\D)(\d{1,2})$/);
            if (digits && digits[1].trim().length >= 2) return digits[1].trim();
            return n;
        },

        // Groups of 2+ teams detected automatically from their names
        autoGroups(teams) {
            const byKey = new Map();
            teams.forEach(t => {
                const k = this.clubKey(t);
                if (!byKey.has(k)) byKey.set(k, []);
                if (!byKey.get(k).includes(t)) byKey.get(k).push(t);
            });
            return Array.from(byKey.entries())
                .filter(([, list]) => list.length >= 2)
                .map(([key, list]) => ({ key, teams: list }));
        },

        // Map team(norm) -> Set of norm names of the same club (auto + manual, transitive)
        buildSiblingMap(teams, settings = this.loadSettings()) {
            const parent = new Map();
            const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
            const union = (a, b) => { if (!parent.has(a)) parent.set(a, a); if (!parent.has(b)) parent.set(b, b); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
            teams.forEach(t => parent.set(this.norm(t), this.norm(t)));

            if (settings.enabled) {
                this.autoGroups(teams).forEach(g => {
                    if (settings.ignored.includes(g.key)) return;
                    for (let i = 1; i < g.teams.length; i++) union(this.norm(g.teams[0]), this.norm(g.teams[i]));
                });
                settings.links.forEach(([a, b]) => union(this.norm(a), this.norm(b)));
            }

            const clusters = new Map();
            Array.from(parent.keys()).forEach(k => {
                const r = find(k);
                if (!clusters.has(r)) clusters.set(r, new Set());
                clusters.get(r).add(k);
            });
            const map = new Map();
            clusters.forEach(set => {
                if (set.size < 2) return;
                set.forEach(k => map.set(k, new Set([...set].filter(x => x !== k))));
            });
            return map;
        },

        // Teams already placed in each group prefix (from confirmed history)
        placedByGroup(history) {
            const placed = {};
            (history || []).forEach(item => {
                const p = Config.groupPrefix(item.val1);
                if (!placed[p]) placed[p] = [];
                placed[p].push(item.val2);
            });
            return placed;
        },

        // Hard rules: allowed-group constraint + no same-club team already in that group
        canPlace(team, slot, placed, siblingMap) {
            if (!Config.isGroupAllowedForTeam(slot, team)) return false;
            const sibs = siblingMap.get(this.norm(team));
            if (!sibs) return true;
            const inGroup = placed[Config.groupPrefix(slot)] || [];
            return !inGroup.some(t => sibs.has(this.norm(t)));
        },

        sameClubIn(team, slot, placed, siblingMap) {
            const sibs = siblingMap.get(this.norm(team));
            if (!sibs) return null;
            const inGroup = placed[Config.groupPrefix(slot)] || [];
            return inGroup.find(t => sibs.has(this.norm(t))) || null;
        },

        // Can the remaining slots/teams still be completed without breaking a hard rule?
        // Returns true, false, or null when the search was too large to finish.
        isCompletable(slots, teams, placed, siblingMap, budget = 40000) {
            const mustTeams = teams.length <= slots.length;
            const placedCopy = {};
            Object.keys(placed).forEach(k => { placedCopy[k] = placed[k].slice(); });
            let nodes = 0;
            const usedSlots = new Array(slots.length).fill(false);
            const usedTeams = new Array(teams.length).fill(false);

            const dfs = (left) => {
                if (left === 0) return true;
                if (++nodes > budget) return null;
                // Pick the open item with the fewest options (most constrained first)
                let best = -1, bestOpts = null;
                const items = mustTeams ? teams : slots;
                const used = mustTeams ? usedTeams : usedSlots;
                for (let i = 0; i < items.length; i++) {
                    if (used[i]) continue;
                    const opts = [];
                    if (mustTeams) {
                        for (let s = 0; s < slots.length; s++) if (!usedSlots[s] && this.canPlace(teams[i], slots[s], placedCopy, siblingMap)) opts.push(s);
                    } else {
                        for (let t = 0; t < teams.length; t++) if (!usedTeams[t] && this.canPlace(teams[t], slots[i], placedCopy, siblingMap)) opts.push(t);
                    }
                    if (opts.length === 0) return false;
                    if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; }
                }
                for (const o of bestOpts) {
                    const ti = mustTeams ? best : o;
                    const si = mustTeams ? o : best;
                    const p = Config.groupPrefix(slots[si]);
                    usedTeams[ti] = true; usedSlots[si] = true;
                    (placedCopy[p] = placedCopy[p] || []).push(teams[ti]);
                    const r = dfs(left - 1);
                    placedCopy[p].pop();
                    usedTeams[ti] = false; usedSlots[si] = false;
                    if (r !== false) return r;
                }
                return false;
            };
            return dfs(Math.min(slots.length, teams.length));
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
        dirty: { 1: false, 2: false },
        spinTimers: [],

        init() {
            try {
                const allInputs = Array.from(document.querySelectorAll('input, select, textarea, button'));
                this.inputs = Object.fromEntries(allInputs.map(el => [el.id, el]));

                this.initialSetup();
                this.bindEventListeners();
                this.bindLayout();
                this.bindSiblingUI();
                this.bindLogoManager();
                this.bindScaleControls();
                this.renderObsLinks();
                this.buildThemeGrids();
                this.populateSiblingUI();
                this.updateButtonState();
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
            this.inputs['confirm-winner-btn'].addEventListener('click', () => this.confirmWinner());
            this.inputs['respin-btn'].addEventListener('click', this.handleRespinClick.bind(this));

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

            const greenBtn = this.inputs['greenscreen-btn'];
            if (greenBtn) greenBtn.addEventListener('click', () => {
                this.inputs['transparent-bg'].checked = false;
                this.inputs['bg-color-picker'].disabled = false;
                this.inputs['bg-color-picker'].value = '#00ff00';
                this.saveAllSettings();
            });

            // OBS WebSocket
            const obsBtn = this.inputs['create-obs-sources-btn'];
            if (obsBtn) obsBtn.addEventListener('click', this.createOBSSources.bind(this));

            [1, 2].forEach(n => {
                this.inputs['name-list-' + n].addEventListener('input', () => {
                    this.dirty[n] = true;
                    this.updateNameCounts();
                    this.updateDirtyBadges();
                });
            });
            this.inputs['sort-history'].addEventListener('change', this.renderHistory.bind(this));
            this.inputs['group-preset-select'].addEventListener('change', (e) => this.applyPreset(e.target.value));

            Object.values(this.inputs).forEach(el => {
                if ((el.tagName === 'INPUT' || el.tagName === 'SELECT') && el.type !== 'button' && el.type !== 'submit') {
                    const ownHandlers = ['group-preset-select', 'sort-history', 'sibling-rule-toggle', 'link-team-a', 'link-team-b',
                        'constraint-team-select', 'constraint-team-custom', 'constraint-groups-input', 'name-list-1', 'name-list-2'];
                    if (!ownHandlers.includes(el.id) && !el.classList.contains('group-checkbox') && !el.classList.contains('scale-num')) {
                        const handleValueChange = () => {
                            if (el.id === 'spin-duration-slider') document.getElementById('duration-value').textContent = el.value;
                            if (el.id === 'wheel-spacing') document.getElementById('spacing-value').textContent = el.value;
                            if (el.id === 'transparent-bg') this.inputs['bg-color-picker'].disabled = el.checked;

                            this.saveAllSettings();
                            // Save first: the colour map must be built from the newly chosen palette
                            if (el.id === 'palette-select-1' || el.id === 'palette-select-2') {
                                this.regenerateColorMap(el.id === 'palette-select-1' ? 1 : 2);
                                this.syncThemeGrids();
                                this.drawWheelPreviews();
                            }
                        };
                        el.addEventListener('input', handleValueChange);
                        el.addEventListener('change', handleValueChange);
                    }
                }
            });

            // Add/delete constraints event listeners
            const addConstraintBtn = document.getElementById('add-constraint-btn');
            if (addConstraintBtn) {
                addConstraintBtn.addEventListener('click', () => {
                    let teamName = document.getElementById('constraint-team-select').value;
                    const customTeamName = document.getElementById('constraint-team-custom').value.trim();
                    if (customTeamName) {
                        teamName = customTeamName;
                    }
                    if (!teamName) {
                        this.toast('กรุณาเลือกทีมหรือพิมพ์ชื่อทีม', 'warn');
                        return;
                    }

                    const allowedGroups = [];
                    const checkedBoxes = document.querySelectorAll('.group-checkbox:checked');
                    checkedBoxes.forEach(cb => allowedGroups.push(cb.value));

                    const customGroupsText = document.getElementById('constraint-groups-input').value.trim();
                    if (customGroupsText) {
                        customGroupsText.split(',').forEach(g => {
                            const cleanG = g.trim().toUpperCase();
                            if (cleanG && !allowedGroups.includes(cleanG)) {
                                allowedGroups.push(cleanG);
                            }
                        });
                    }

                    if (allowedGroups.length === 0) {
                        this.toast('เลือกสายที่ทีมนี้ลงได้อย่างน้อย 1 สาย', 'warn');
                        return;
                    }

                    const constraints = StateManager.load('teamConstraints') || [];
                    const existingIndex = constraints.findIndex(c => c.team.toLowerCase() === teamName.toLowerCase());
                    if (existingIndex !== -1) {
                        if (confirm(`ทีม "${teamName}" มีเงื่อนไขอยู่แล้ว ต้องการอัปเดตใหม่ใช่หรือไม่?`)) {
                            constraints[existingIndex].groups = allowedGroups;
                        } else {
                            return;
                        }
                    } else {
                        constraints.push({ team: teamName, groups: allowedGroups });
                    }
                    StateManager.save('teamConstraints', constraints);

                    // Reset inputs
                    document.getElementById('constraint-team-custom').value = '';
                    document.getElementById('constraint-groups-input').value = '';
                    document.querySelectorAll('.group-checkbox').forEach(cb => cb.checked = false);

                    this.populateConstraintsUI();
                    StateManager.triggerUpdate();
                });
            }

            const constraintsListBody = document.getElementById('constraints-list-body');
            if (constraintsListBody) {
                constraintsListBody.addEventListener('click', (e) => {
                    if (e.target.classList.contains('remove')) {
                        const index = parseInt(e.target.getAttribute('data-index'), 10);
                        const constraints = StateManager.load('teamConstraints') || [];
                        constraints.splice(index, 1);
                        StateManager.save('teamConstraints', constraints);
                        this.populateConstraintsUI();
                        StateManager.triggerUpdate();
                    }
                });
            }

            // OBS Links Window binding
            const obsLinksBtn = document.getElementById('obs-links-btn');
            if (obsLinksBtn) {
                obsLinksBtn.addEventListener('click', () => {
                    if (window.electronAPI && window.electronAPI.openObsLinksWindow) {
                        window.electronAPI.openObsLinksWindow();
                    } else {
                        this.switchTab('settings');
                        const card = document.getElementById('obs-links-card');
                        if (card) {
                            // Scroll so the card sits just under the sticky menu and draw bar
                            const header = (document.querySelector('.draw-bar') || {}).getBoundingClientRect ? document.querySelector('.draw-bar').getBoundingClientRect().bottom : 0;
                            window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - header - 10, behavior: 'smooth' });
                        }
                    }
                });
            }

            // Logo Manager Window binding
            const openLogoManagerBtn = document.getElementById('open-logo-manager-btn');
            if (openLogoManagerBtn) {
                openLogoManagerBtn.addEventListener('click', () => {
                    if (window.electronAPI && window.electronAPI.openManageLogosWindow) {
                        window.electronAPI.openManageLogosWindow();
                    } else {
                        window.open('manage_logos.html', 'manage_logos', 'width=900,height=750,menubar=no,toolbar=no,location=no');
                    }
                });
            }

            // Tournament bindings
            const autofillBtn = document.getElementById('tour-autofill-btn');
            if (autofillBtn) {
                autofillBtn.addEventListener('click', () => {
                    const masterNames = (StateManager.loadText('wheel1Names') || '').split('\n').filter(Boolean);
                    const history = StateManager.load('wheelHistory') || [];
                    const pairedResults = new Map(history.map(item => [item.val1.trim().toLowerCase(), item.val2]));
                    
                    const lines = [];
                    masterNames.forEach(name1 => {
                        const paired = pairedResults.get(name1.trim().toLowerCase()) || '-';
                        lines.push(`${name1}\t${paired}`);
                    });
                    
                    const inputEl = document.getElementById('tour-teams-input');
                    if (inputEl) {
                        inputEl.value = lines.join('\n');
                        inputEl.dispatchEvent(new Event('input'));
                        this.saveTournamentInputSettings();
                    }
                });
            }

            const splitModeSelect = document.getElementById('tour-split-mode');
            if (splitModeSelect) {
                splitModeSelect.addEventListener('change', (e) => {
                    const container = document.getElementById('tour-custom-morning-container');
                    if (container) {
                        container.style.display = e.target.value === 'custom' ? '' : 'none';
                    }
                    this.saveTournamentInputSettings();
                });
            }

            const useTimeCheck = document.getElementById('tour-use-time');
            if (useTimeCheck) {
                useTimeCheck.addEventListener('change', (e) => {
                    const container = document.getElementById('tour-time-settings-container');
                    if (container) {
                        container.style.display = e.target.checked ? '' : 'none';
                    }
                    this.saveTournamentInputSettings();
                });
            }

            const tourInputs = ['tour-name', 'tour-desc', 'tour-teams-input', 'tour-3team-format', 'tour-custom-morning', 'tour-start-time', 'tour-match-mins'];
            tourInputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const saveChange = () => this.saveTournamentInputSettings();
                    el.addEventListener('input', saveChange);
                    el.addEventListener('change', saveChange);
                }
            });

            const generateBtn = document.getElementById('tour-generate-btn');
            if (generateBtn) {
                generateBtn.addEventListener('click', () => {
                    this.buildTournamentSchedule();
                });
            }

            const clearTourBtn = document.getElementById('tour-clear-btn');
            if (clearTourBtn) {
                clearTourBtn.addEventListener('click', () => {
                    if (!confirm('เคลียร์ข้อมูลตารางการแข่งขันทั้งหมดใช่หรือไม่?\n\n(ฟอร์มกรอกข้อมูลและรายชื่อทีมจะถูกล้างด้วย)')) return;
                    // Clear localStorage
                    localStorage.removeItem('tournamentSchedule');
                    localStorage.removeItem('tournamentSettings');
                    // Clear form fields
                    ['tour-name', 'tour-desc', 'tour-teams-input'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
                    // Trigger overlay update
                    StateManager.triggerUpdate();
                    this.toast('ล้างตารางการแข่งขันแล้ว', 'ok');
                });
            }

            window.addEventListener('storage', (e) => {
                if (e.key === 'updateGraphics') {
                    this.loadDataIntoControls();
                    this.updateButtonState();
                } else if (e.key === 'siblingSettings' || e.key === 'wheelHistory' || e.key === 'pendingWinner') {
                    this.populateSiblingUI();
                    this.renderHistory();
                    this.updateButtonState();
                }
            });
        },

        saveTournamentInputSettings() {
            const getVal = (id, def) => {
                const el = document.getElementById(id);
                if (!el) return def;
                if (el.type === 'checkbox') return el.checked;
                return el.value !== undefined ? el.value : def;
            };

            const settings = {
                tourName: getVal('tour-name', ''),
                tourDesc: getVal('tour-desc', ''),
                tourTeamsInput: getVal('tour-teams-input', ''),
                tour3TeamFormat: getVal('tour-3team-format', 'loser_first'),
                tourSplitMode: getVal('tour-split-mode', 'all'),
                tourCustomMorning: parseInt(getVal('tour-custom-morning', '4'), 10) || 4,
                tourUseTime: getVal('tour-use-time', true),
                tourStartTime: getVal('tour-start-time', '08:00'),
                tourMatchMins: parseInt(getVal('tour-match-mins', '30'), 10) || 30
            };
            localStorage.setItem('tournamentSettings', JSON.stringify(settings));
        },

        buildTournamentSchedule() {
            const getVal = (id, def) => {
                const el = document.getElementById(id);
                if (!el) return def;
                if (el.type === 'checkbox') return el.checked;
                return el.value !== undefined ? el.value : def;
            };

            const name = getVal('tour-name', '');
            const desc = getVal('tour-desc', '');
            const teamsInput = getVal('tour-teams-input', '');
            const threeTeamFormat = getVal('tour-3team-format', 'loser_first');
            const splitMode = getVal('tour-split-mode', 'all');
            const customMorning = parseInt(getVal('tour-custom-morning', '4'), 10) || 4;
            const useTime = getVal('tour-use-time', true);
            const startTime = getVal('tour-start-time', '08:00');
            const matchMins = parseInt(getVal('tour-match-mins', '30'), 10) || 30;

            const parseTeamLine = (line) => {
                const raw = line.trim();
                if (!raw) return null;
                const stripped = raw.replace(/^สาย\s*/i, '').trim();
                const parts = stripped.split(/\t|\s{2,}/);
                if (parts.length >= 2) {
                    const code = parts[0].trim().toUpperCase();
                    const teamName = parts.slice(1).join(' ').trim();
                    if (/^[A-Z]\d+$/.test(code) && teamName) return { code, name: teamName };
                }
                const m = stripped.match(/^([A-Za-z]\d+)\s+(.+)$/);
                if (m) return { code: m[1].toUpperCase(), name: m[2].trim() };
                return null;
            };

            const addMinutes = (timeStr, mins) => {
                if (!timeStr) return '';
                const [h, m] = timeStr.split(':').map(Number);
                const total = h * 60 + m + mins;
                const hh = Math.floor(total / 60) % 24;
                const mm = total % 60;
                return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
            };

            const getRRPairsForRound = (n, roundIdx) => {
                if (n === 2) {
                    if (roundIdx === 0) return [[0,1]];
                }
                if (n === 3) {
                    if (roundIdx === 0) return [[0,1]];
                    if (roundIdx === 1) return [[0,2]];
                    if (roundIdx === 2) return [[1,2]];
                }
                if (n === 4) {
                    if (roundIdx === 0) return [[0,1], [2,3]];
                    if (roundIdx === 1) return [[0,2], [1,3]];
                    if (roundIdx === 2) return [[0,3], [1,2]];
                }
                return [];
            };

            const lines = teamsInput.split('\n');
            const teamMap = {};
            const groupSet = new Set();

            for (const line of lines) {
                const parsed = parseTeamLine(line);
                if (parsed) {
                    teamMap[parsed.code] = parsed.name;
                    groupSet.add(parsed.code.charAt(0));
                }
            }

            const allGroups = Array.from(groupSet).sort();
            if (allGroups.length === 0) {
                this.toast('ไม่พบรหัสสาย เช่น A1, B1 ในรายชื่อ', 'warn');
                return;
            }

            for (const g of allGroups) {
                const count = [1,2,3,4].filter(i => teamMap[g + i]).length;
                if (count < 2 || count > 4) {
                    this.toast(`สาย ${g} มี ${count} ทีม — รองรับ 2–4 ทีมต่อสาย`, 'warn');
                    return;
                }
            }

            let morningGroups = [];
            let afternoonGroups = [];

            if (splitMode === 'all') {
                morningGroups = allGroups;
            } else if (splitMode === '4_rest') {
                morningGroups = allGroups.slice(0, 4);
                afternoonGroups = allGroups.slice(4);
            } else {
                morningGroups = allGroups.slice(0, customMorning);
                afternoonGroups = allGroups.slice(customMorning);
            }

            const sessions = [];
            let matchCounter = 1;
            let currentTime = useTime ? startTime : null;
            const hasSplit = afternoonGroups.length > 0 || splitMode !== 'all';

            const buildSession = (groups, title) => {
                if (groups.length === 0) return;
                const matches = [];
                const matchNumMap = {};

                for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
                    for (const g of groups) {
                        const groupTeams = [1,2,3,4]
                            .map(i => ({ code: g + i, name: teamMap[g + i] }))
                            .filter(t => t.name);

                        const n = groupTeams.length;
                        if (n === 0) continue;

                        const isStandard3 = (n === 3 && (threeTeamFormat === 'loser_first' || threeTeamFormat === 'winner_first'));

                        if (isStandard3) {
                            if (roundIdx === 0) {
                                const c1 = g + '1', c2 = g + '2';
                                matchNumMap[g] = matchCounter;
                                matches.push({
                                    num: matchCounter, code: g, time: currentTime,
                                    team1: teamMap[c1] || '-', code1: c1,
                                    team2: teamMap[c2] || '-', code2: c2
                                });
                                matchCounter++;
                                if (currentTime) currentTime = addMinutes(currentTime, matchMins);
                            } else if (roundIdx === 1) {
                                const c3 = g + '3';
                                const opp = threeTeamFormat === 'loser_first' ? 'ทีมแพ้' : 'ทีมชนะ';
                                matches.push({
                                    num: matchCounter, code: g, time: currentTime,
                                    team1: teamMap[c3] || '-', code1: c3,
                                    team2: `${opp} คู่ที่ ${matchNumMap[g]}`, code2: '-'
                                });
                                matchCounter++;
                                if (currentTime) currentTime = addMinutes(currentTime, matchMins);
                            } else if (roundIdx === 2) {
                                const c3 = g + '3';
                                const opp = threeTeamFormat === 'loser_first' ? 'ทีมชนะ' : 'ทีมแพ้';
                                matches.push({
                                    num: matchCounter, code: g, time: currentTime,
                                    team1: teamMap[c3] || '-', code1: c3,
                                    team2: `${opp} คู่ที่ ${matchNumMap[g]}`, code2: '-'
                                });
                                matchCounter++;
                                if (currentTime) currentTime = addMinutes(currentTime, matchMins);
                            }
                        } else {
                            const pairs = getRRPairsForRound(n, roundIdx);
                            for (const [i, j] of pairs) {
                                const t1 = groupTeams[i];
                                const t2 = groupTeams[j];
                                matches.push({
                                    num: matchCounter, code: g, time: currentTime,
                                    team1: t1.name, code1: t1.code,
                                    team2: t2.name, code2: t2.code
                                });
                                matchCounter++;
                                if (currentTime) currentTime = addMinutes(currentTime, matchMins);
                            }
                        }
                    }
                }
                sessions.push({ title, matches, hasSplit });
            };

            if (afternoonGroups.length > 0) {
                buildSession(morningGroups, '☀️ รอบเช้า (สาย ' + morningGroups.join(', ') + ')');
                buildSession(afternoonGroups, '⛅ รอบบ่าย (สาย ' + afternoonGroups.join(', ') + ')');
            } else {
                buildSession(morningGroups, '📅 ตารางการแข่งขันทั้งหมด');
            }

            const scheduleData = {
                name: name,
                desc: desc,
                sessions: sessions,
                useTime: useTime
            };

            localStorage.setItem('tournamentSchedule', JSON.stringify(scheduleData));
            this.saveTournamentInputSettings();
            this.toast('สร้างตารางการแข่งขันแล้ว', 'ok');
            StateManager.triggerUpdate();
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
                tourColumns: getNumValue('tour-column-count', 3),
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

                // Display themes ('classic' = original look)
                // On-screen size (percent), applied by the overlay pages themselves
                wheelScale: getNumValue('scale-wheel', 100),
                winnerScale: getNumValue('scale-winner', 100),
                groupsScale: getNumValue('scale-groups', 100),
                groupsWidth: getNumValue('scale-groupsw', 100),
                groupsAlign: (document.querySelector('input[name="groups-align"]:checked') || {}).value || 'center',
                tourScale: getNumValue('scale-tour', 100),

                wheelTheme: getValue('wheel-theme', 'classic'),
                winnerTheme: getValue('winner-theme', 'classic'),
                tableTheme: getValue('table-theme', 'classic'),
            };
            // Merge so state that is not a form field (e.g. wheelsHidden) is not wiped
            const previous = StateManager.load('wheelSettings') || {};
            StateManager.save('wheelSettings', Object.assign({}, previous, settings));
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
            this.dirty[wheelNum] = false;

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
            this.populateConstraintsUI();
            this.populateLogosUI();
            this.populateSiblingUI();
            this.updateDirtyBadges();
            this.updateButtonState();
            StateManager.triggerUpdate();
        },

        updateDirtyBadges() {
            [1, 2].forEach(n => {
                const badge = document.getElementById('dirty-badge-' + n);
                const btn = this.inputs['update-button-' + n];
                if (badge) badge.hidden = !this.dirty[n];
                if (btn) btn.classList.toggle('needs-save', !!this.dirty[n]);
            });
        },

        // Short message that does not block the page (alert() freezes OBS docks)
        toast(message, type = 'info') {
            let host = document.getElementById('toast-host');
            if (!host) {
                host = document.createElement('div');
                host.id = 'toast-host';
                host.setAttribute('role', 'status');
                host.setAttribute('aria-live', 'polite');
                document.body.appendChild(host);
            }
            const el = document.createElement('div');
            el.className = 'toast ' + type;
            el.textContent = message;
            host.appendChild(el);
            setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
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

            if (historyItems.length === 0) { this.toast('ยังไม่มีประวัติให้คัดลอก', 'warn'); return; }

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
                this.toast('คัดลอกไม่สำเร็จ', 'error');
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
                this.toast('มีผลรอยืนยันอยู่ กด "ยืนยันคู่นี้" หรือ "สุ่มใหม่" ก่อน', 'warn');
                return;
            }

            const wheel1List = StateManager.loadText('wheel1Names') || '';
            const wheel2List = StateManager.loadText('wheel2Names') || '';
            if (wheel1List.trim().split('\n').filter(Boolean).length > 0 && wheel2List.trim().split('\n').filter(Boolean).length > 0) {
                // Get spin duration from settings
                const settings = StateManager.load('wheelSettings') || {};
                const duration = parseInt(settings.spinDuration) || 6;

                const names1 = wheel1List.trim().split('\n').filter(Boolean);
                const names2 = wheel2List.trim().split('\n').filter(Boolean);
                const winners = this.calculateWinner(names1, names2);
                StateManager.save('pendingWinner', winners);
                localStorage.setItem('isSpinning', 'true');

                localStorage.setItem('spinCommand', Date.now());
                this.startSpinCountdown(duration);
                this.updateButtonState();
            } else {
                this.toast('กรุณาใส่รายชื่อให้ครบทั้ง 2 วงล้อ แล้วกด "บันทึก" ในแท็บรายชื่อ', 'warn');
            }
        },

        // Shows the countdown and, if no wheel page is open, ends the spin so the result still appears
        startSpinCountdown(duration) {
            this.spinTimers.forEach(t => clearInterval(t));
            this.spinTimers = [];
            const status = document.getElementById('spin-progress');
            let left = duration;
            this.isSpinningLocal = true;
            const render = () => { if (status) { status.hidden = false; status.textContent = `กำลังหมุน... ${left} วินาที`; } };
            render();
            this.updateButtonState();
            const t = setInterval(() => {
                left--;
                if (left > 0) { render(); return; }
                clearInterval(t);
                this.isSpinningLocal = false;
                if (status) status.hidden = true;
                if (localStorage.getItem('isSpinning') === 'true') {
                    localStorage.setItem('isSpinning', 'false');
                    StateManager.triggerUpdate();
                }
                this.updateButtonState();
            }, 1000);
            this.spinTimers.push(t);
        },

        confirmWinner() {
            const pendingWinner = StateManager.load('pendingWinner') || {};
            if (!pendingWinner.val1) return;
            if (this.isSpinningLocal) { this.toast('รอให้วงล้อหยุดก่อน', 'warn'); return; }

            const history = StateManager.load('wheelHistory') || [];
            history.push(pendingWinner);
            StateManager.save('wheelHistory', history);

            const names1 = (StateManager.loadText('wheel1Names') || '').split('\n').filter(Boolean);
            const names2 = (StateManager.loadText('wheel2Names') || '').split('\n').filter(Boolean);
            StateManager.saveText('wheel1Names', names1.filter(n => n.trim() !== pendingWinner.val1.trim()).join('\n'));
            StateManager.saveText('wheel2Names', names2.filter(n => n.trim() !== pendingWinner.val2.trim()).join('\n'));
            StateManager.remove('pendingWinner');

            localStorage.setItem('confirmWinnerCommand', Date.now()); // overlays hide the result
            this.renderHistory();
            this.updateButtonState();
            StateManager.triggerUpdate();
        },

        // Put the last confirmed pair back into both wheels
        undoLastPair() {
            const history = StateManager.load('wheelHistory') || [];
            if (history.length === 0) { this.toast('ยังไม่มีคู่ให้ย้อน', 'warn'); return; }
            if ((StateManager.load('pendingWinner') || {}).val1) { this.toast('มีผลรอยืนยันอยู่ กด "ยืนยัน" หรือ "สุ่มใหม่" ก่อน', 'warn'); return; }
            const lastIdx = history.reduce((best, item, i) => (item.timestamp >= history[best].timestamp ? i : best), 0);
            const last = history[lastIdx];
            if (!confirm(`ย้อนคู่ล่าสุด "${last.val1} - ${last.val2}" ?\n\nทั้งสองชื่อจะกลับเข้าวงล้อ`)) return;
            history.splice(lastIdx, 1);
            StateManager.save('wheelHistory', history);

            const restore = (key, masterKey, value) => {
                const current = (StateManager.loadText(key) || '').split('\n').filter(Boolean);
                if (current.includes(value)) return;
                const master = (StateManager.loadText(masterKey) || '').split('\n').filter(Boolean);
                current.push(value);
                current.sort((a, b) => {
                    const ia = master.indexOf(a), ib = master.indexOf(b);
                    return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
                });
                StateManager.saveText(key, current.join('\n'));
            };
            restore('wheel1Names', 'wheel1MasterNames', last.val1);
            restore('wheel2Names', 'wheel2MasterNames', last.val2);

            this.renderHistory();
            this.updateButtonState();
            StateManager.triggerUpdate();
            this.toast(`ย้อนแล้ว: ${last.val1} - ${last.val2}`, 'ok');
        },

        handleRespinClick() {
            if (!confirm('ยืนยันที่จะสุ่มใหม่หรือไม่?\n\nผลลัพธ์ปัจจุบันจะถูกยกเลิก')) {
                return;
            }
            StateManager.remove('pendingWinner');
            
            const wheel1List = StateManager.loadText('wheel1Names') || '';
            const wheel2List = StateManager.loadText('wheel2Names') || '';
            const names1 = wheel1List.trim().split('\n').filter(Boolean);
            const names2 = wheel2List.trim().split('\n').filter(Boolean);
            
            if (names1.length === 0 || names2.length === 0) { this.updateButtonState(); return; }

            const winners = this.calculateWinner(names1, names2);
            StateManager.save('pendingWinner', winners);
            localStorage.setItem('isSpinning', 'true');

            localStorage.setItem('respinCommand', Date.now());
            const settings = StateManager.load('wheelSettings') || {};
            this.startSpinCountdown(parseInt(settings.spinDuration) || 6);
            this.updateButtonState();
        },

        calculateWinner(names1, names2) {
            const getSecureRandom = () => {
                if (window.crypto && window.crypto.getRandomValues) {
                    const array = new Uint32Array(1);
                    window.crypto.getRandomValues(array);
                    return array[0] / (0xffffffff + 1);
                }
                return Math.random();
            };
            const shuffle = (arr) => {
                const a = arr.slice();
                for (let i = a.length - 1; i > 0; i--) {
                    const j = Math.floor(getSecureRandom() * (i + 1));
                    [a[i], a[j]] = [a[j], a[i]];
                }
                return a;
            };

            const history = StateManager.load('wheelHistory') || [];
            const constraints = StateManager.load('teamConstraints') || [];
            const masterTeams = (StateManager.loadText('wheel2MasterNames') || '').split('\n').map(t => t.trim()).filter(Boolean);
            const siblingMap = DrawRules.buildSiblingMap(masterTeams.length ? masterTeams : names2);
            const placed = DrawRules.placedByGroup(history);

            // Soft rule: warn when a very similar name (1-2 letters different) is already in the group
            const checkSimilarity = (val1, val2) => {
                const teamsInSameGroup = placed[Config.groupPrefix(val1)] || [];
                for (const existingTeam of teamsInSameGroup) {
                    if (Config.areSimilarTeams(existingTeam, val2) || existingTeam.trim().toLowerCase() === val2.trim().toLowerCase()) {
                        return existingTeam;
                    }
                }
                return null;
            };

            // Team order: random. In "first" mode the same-club teams come out first.
            const mode = DrawRules.loadSettings().mode;
            let teamOrder = shuffle(names2.map((_, i) => i));
            if (mode === 'first') {
                const isSib = (i) => siblingMap.has(DrawRules.norm(names2[i]));
                teamOrder = teamOrder.filter(isSib).concat(teamOrder.filter(i => !isSib(i)));
            }

            const result = (ti, gi, ruleWarning) => ({
                val1: names1[gi],
                val2: names2[ti],
                similarWarning: checkSimilarity(names1[gi], names2[ti]),
                ruleWarning: ruleWarning || null,
                timestamp: Date.now()
            });

            // Pass 1: hard rules OK, no similar-name warning, and the rest can still be completed
            // Pass 2: hard rules OK and completable (similar-name warning allowed)
            let firstHardOk = null;
            let unknownOk = null;
            for (const pass of [1, 2]) {
                let checks = 0;
                for (const ti of teamOrder) {
                    const team = names2[ti];
                    for (const gi of shuffle(names1.map((_, i) => i))) {
                        const slot = names1[gi];
                        if (!DrawRules.canPlace(team, slot, placed, siblingMap)) continue;
                        if (!firstHardOk) firstHardOk = [ti, gi];
                        if (pass === 1 && checkSimilarity(slot, team)) continue;
                        if (checks++ > 400) break;
                        const restSlots = names1.filter((_, i) => i !== gi);
                        const restTeams = names2.filter((_, i) => i !== ti);
                        const nextPlaced = Object.assign({}, placed);
                        const p = Config.groupPrefix(slot);
                        nextPlaced[p] = (placed[p] || []).concat([team]);
                        const ok = DrawRules.isCompletable(restSlots, restTeams, nextPlaced, siblingMap, 20000);
                        if (ok === true) return result(ti, gi);
                        if (ok === null && !unknownOk) unknownOk = [ti, gi];
                    }
                }
            }
            if (unknownOk) return result(unknownOk[0], unknownOk[1]);
            if (firstHardOk) {
                return result(firstHardOk[0], firstHardOk[1], 'ทีมที่เหลือจะลงสายไม่ครบตามเงื่อนไข ตรวจสอบเงื่อนไขในแท็บ "ทีมเดียวกัน"');
            }

            // No pair satisfies the rules: draw at random and tell the operator why
            const ti = Math.floor(getSecureRandom() * names2.length);
            const gi = Math.floor(getSecureRandom() * names1.length);
            const clash = DrawRules.sameClubIn(names2[ti], names1[gi], placed, siblingMap);
            const why = clash
                ? `ไม่มีสายว่างให้ทีมนี้ (ทีมเดียวกัน "${clash}" อยู่สาย ${Config.groupPrefix(names1[gi])} แล้ว)`
                : 'ไม่มีสายที่ตรงเงื่อนไขเหลืออยู่';
            return result(ti, gi, why);
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

            this.toast('รีเซ็ตแล้ว พร้อมเริ่มสุ่มใหม่', 'ok');
        },

        openSettingsModal() {
            this.switchTab('settings');
        },

        closeSettingsModal() {
            this.switchTab('draw');
        },

        switchTab(name) {
            const tabs = Array.from(document.querySelectorAll('.nav-tab[data-tab]'));
            if (!tabs.some(t => t.dataset.tab === name)) name = 'draw';
            tabs.forEach(t => {
                const on = t.dataset.tab === name;
                t.classList.toggle('active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
            });
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.hidden = panel.id !== 'tab-' + name;
            });
            try { localStorage.setItem('controlsActiveTab', name); } catch (e) {}
        },

        bindLayout() {
            const tabs = Array.from(document.querySelectorAll('.nav-tab[data-tab]'));
            tabs.forEach((tab, i) => {
                tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
                tab.addEventListener('keydown', (e) => {
                    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                    e.preventDefault();
                    const next = tabs[(i + (e.key === 'ArrowDown' ? 1 : tabs.length - 1)) % tabs.length];
                    this.switchTab(next.dataset.tab);
                    next.focus();
                });
            });
            let saved = 'draw';
            try { saved = localStorage.getItem('controlsActiveTab') || 'draw'; } catch (e) {}
            this.switchTab(saved);

            document.querySelectorAll('[data-goto-tab]').forEach(el => {
                el.addEventListener('click', () => this.switchTab(el.dataset.gotoTab));
            });

            const undoBtn = document.getElementById('undo-last-btn');
            if (undoBtn) undoBtn.addEventListener('click', () => this.undoLastPair());

            // Shortcuts: Ctrl+Enter = spin / confirm, Alt+1..5 = tabs
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    const pending = (StateManager.load('pendingWinner') || {}).val1;
                    if (pending) this.confirmWinner(); else this.handleSpinClick();
                    return;
                }
                if (e.altKey && /^[1-5]$/.test(e.key)) {
                    const tab = tabs[parseInt(e.key, 10) - 1];
                    if (tab) { e.preventDefault(); this.switchTab(tab.dataset.tab); tab.focus(); }
                }
            });
        },

        updateButtonState() {
            const pendingWinner = StateManager.load('pendingWinner') || {};
            const spinBtn = this.inputs['spin-button'];
            const confirmBtn = this.inputs['confirm-winner-btn'];
            const respinBtn = this.inputs['respin-btn'];
            const hideWheelsBtn = this.inputs['hide-wheels-btn'];
            const warningEl = document.getElementById('similar-warning');
            const pendingBox = document.getElementById('pending-box');
            const statusEl = document.getElementById('draw-status');

            const left1 = (StateManager.loadText('wheel1Names') || '').split('\n').filter(Boolean).length;
            const left2 = (StateManager.loadText('wheel2Names') || '').split('\n').filter(Boolean).length;
            const total1 = (StateManager.loadText('wheel1MasterNames') || '').split('\n').filter(Boolean).length;
            const total2 = (StateManager.loadText('wheel2MasterNames') || '').split('\n').filter(Boolean).length;
            const cannotSpin = left1 === 0 || left2 === 0;
            const hasPending = !!(pendingWinner && pendingWinner.val1);
            const spinning = !!this.isSpinningLocal;

            const settings = StateManager.load('wheelSettings') || {};
            const isHidden = settings.wheelsHidden || false;

            if (statusEl) {
                const parts = [`สายเหลือ ${left1}/${total1}`, `ทีมเหลือ ${left2}/${total2}`];
                if (cannotSpin && !hasPending) parts.push(total1 + total2 > 0 ? 'สุ่มครบแล้ว' : 'ยังไม่มีรายชื่อ');
                statusEl.textContent = parts.join('  ·  ');
            }

            if (hasPending) {
                spinBtn.hidden = true;
                confirmBtn.hidden = false;
                respinBtn.hidden = false;
                confirmBtn.disabled = spinning;
                respinBtn.disabled = spinning;
                if (pendingBox) {
                    pendingBox.hidden = false;
                    pendingBox.querySelector('.pending-label').textContent = spinning ? 'กำลังหมุน' : 'รอยืนยัน';
                    pendingBox.querySelector('.pending-pair').textContent = spinning ? '...' : `${pendingWinner.val1}  —  ${pendingWinner.val2}`;
                }
                if (warningEl) {
                    const msgs = [];
                    if (pendingWinner.ruleWarning) msgs.push(pendingWinner.ruleWarning);
                    if (pendingWinner.similarWarning && !pendingWinner.ruleWarning) msgs.push(`ทีม "${pendingWinner.val2}" ชื่อคล้าย "${pendingWinner.similarWarning}" ที่อยู่สายเดียวกัน`);
                    warningEl.hidden = spinning || msgs.length === 0;
                    warningEl.querySelector('.warn-text').textContent = msgs.join(' · ') + (msgs.length ? ' — กดสุ่มใหม่ได้' : '');
                }
            } else {
                spinBtn.hidden = false;
                spinBtn.disabled = cannotSpin || spinning;
                spinBtn.querySelector('.btn-label').textContent = cannotSpin ? (total1 + total2 > 0 ? 'สุ่มครบแล้ว' : 'ใส่รายชื่อก่อน') : 'สุ่มจับคู่';
                confirmBtn.hidden = true;
                respinBtn.hidden = true;
                if (pendingBox) pendingBox.hidden = true;
                if (warningEl) warningEl.hidden = true;
            }

            if (hideWheelsBtn) {
                hideWheelsBtn.hidden = hasPending;
                hideWheelsBtn.querySelector('.btn-label').textContent = isHidden ? 'โชว์วงล้อ' : 'ซ่อนวงล้อ';
                hideWheelsBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
                hideWheelsBtn.classList.toggle('show-wheels', isHidden);
            }
            const undoBtn = document.getElementById('undo-last-btn');
            if (undoBtn) undoBtn.disabled = hasPending || (StateManager.load('wheelHistory') || []).length === 0;
        },

        // --- "ทีมเดียวกัน" tab: step 1 method, step 2 same-club teams, step 3 group locks ---
        rulesData() {
            const teams = (StateManager.loadText('wheel2MasterNames') || '').split('\n').map(t => t.trim()).filter(Boolean);
            const slots = (StateManager.loadText('wheel1MasterNames') || '').split('\n').map(t => t.trim()).filter(Boolean);
            const groups = {};
            slots.forEach(sl => { const p = Config.groupPrefix(sl); groups[p] = (groups[p] || 0) + 1; });
            return { teams, slots, groups };
        },

        populateSiblingUI() {
            const modeGrid = document.getElementById('draw-mode-grid');
            if (!modeGrid) return;
            const settings = DrawRules.loadSettings();
            const { teams, groups } = this.rulesData();
            const mode = settings.mode;

            // Step 1: method cards
            modeGrid.querySelectorAll('.mode-card').forEach(card => {
                const on = card.dataset.mode === mode;
                card.classList.toggle('selected', on);
                card.setAttribute('aria-checked', on ? 'true' : 'false');
                card.tabIndex = on ? 0 : -1;
            });
            const stepSame = document.getElementById('step-same');
            const stepLock = document.getElementById('step-lock');
            if (stepSame) stepSame.hidden = mode === 'off';
            if (stepLock) stepLock.hidden = mode !== 'lock';
            const lockNo = document.getElementById('step-lock-no');
            if (lockNo) lockNo.textContent = mode === 'lock' ? '3' : '';

            // Step 2: same-club groups (auto + manual, shown together)
            const sibMap = DrawRules.buildSiblingMap(teams, Object.assign({}, settings, { mode: 'auto', enabled: true }));
            const chips = (list) => list.map(t => `<span class="team-chip">${Config.esc(t)}</span>`).join('');
            const autoGroups = DrawRules.autoGroups(teams);
            const rows = [];
            autoGroups.forEach(g => {
                const off = settings.ignored.includes(g.key);
                rows.push(`<div class="club-box ${off ? 'is-off' : ''}">
                    <div class="club-teams">${chips(g.teams)}</div>
                    <div class="club-meta">
                        <span class="club-tag">${off ? 'ไม่นับเป็นทีมเดียวกัน' : 'ระบบเจอเองจากชื่อ'}</span>
                        <button type="button" class="btn btn-sm ${off ? 'btn-ghost' : 'btn-danger-ghost'}" data-sib-toggle="${Config.esc(g.key)}">${off ? 'นับเป็นทีมเดียวกัน' : 'ไม่ใช่ทีมเดียวกัน'}</button>
                    </div>
                </div>`);
            });
            settings.links.forEach((l, i) => {
                const missing = l.filter(t => !teams.some(x => DrawRules.norm(x) === DrawRules.norm(t)));
                rows.push(`<div class="club-box">
                    <div class="club-teams">${chips(l)}</div>
                    <div class="club-meta">
                        <span class="club-tag">${missing.length ? 'ไม่พบบางชื่อในรายชื่อตอนนี้' : 'จับคู่เอง'}</span>
                        <button type="button" class="btn btn-sm btn-danger-ghost" data-link-remove="${i}" aria-label="ลบ ${Config.esc(l.join(' กับ '))}">ลบ</button>
                    </div>
                </div>`);
            });
            const list = document.getElementById('club-list');
            if (list) list.innerHTML = rows.length ? rows.join('') :
                '<p class="empty-note">ยังไม่มีทีมเดียวกัน ถ้าชื่อลงท้ายด้วย A/B หรือ 1/2 ระบบจะเจอเอง หรือจับคู่เองด้านล่าง</p>';
            const count = document.getElementById('club-count');
            if (count) count.textContent = sibMap.size ? `${sibMap.size} ทีม` : '';

            ['link-team-a', 'link-team-b'].forEach(id => {
                const sel = document.getElementById(id);
                if (!sel) return;
                const keep = sel.value;
                sel.innerHTML = '<option value="">-- เลือกทีม --</option>' + teams.map(t => `<option value="${Config.esc(t)}">${Config.esc(t)}</option>`).join('');
                if (teams.includes(keep)) sel.value = keep;
            });

            // Step 3: lock team -> group
            this.renderLockTable(teams, groups, sibMap);

            // One-line summary, also shown in the draw bar
            const summary = document.getElementById('rules-summary');
            const text = this.rulesSummaryText();
            if (summary) summary.textContent = text;
            const badge = document.getElementById('rules-badge');
            if (badge) badge.textContent = text;
        },

        rulesSummaryText() {
            const settings = DrawRules.loadSettings();
            const { teams } = this.rulesData();
            const sib = DrawRules.buildSiblingMap(teams, settings).size;
            const locks = DrawRules.loadConstraints().length;
            if (settings.mode === 'off') return 'วิธีสุ่ม: สุ่มอิสระ (ไม่กันทีมเดียวกัน)';
            const sibText = sib ? `กันทีมเดียวกัน ${sib} ทีม` : 'ยังไม่มีทีมเดียวกัน';
            if (settings.mode === 'first') return `วิธีสุ่ม: จับทีมเดียวกันก่อน · ${sibText}`;
            if (settings.mode === 'lock') return `วิธีสุ่ม: วางสายเอง · ล็อกไว้ ${locks} ทีม · ${sibText}`;
            return `วิธีสุ่ม: สุ่มปกติ · ${sibText}`;
        },

        renderLockTable(teams, groups, sibMap) {
            const tbody = document.getElementById('lock-table-body');
            const check = document.getElementById('lock-check');
            if (!tbody) return;
            const groupKeys = Object.keys(groups).sort();
            const constraints = DrawRules.loadConstraints();
            const lockOf = (team) => constraints.find(c => c.team.trim().toLowerCase() === team.trim().toLowerCase());

            if (teams.length === 0 || groupKeys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="cell-empty">ใส่รายชื่อสายและทีมในแท็บรายชื่อก่อน</td></tr>';
                if (check) check.innerHTML = '';
                return;
            }

            tbody.innerHTML = teams.map((team, i) => {
                const c = lockOf(team);
                const value = !c ? '' : (c.groups.length === 1 ? c.groups[0].trim().toUpperCase() : 'multi');
                const opts = ['<option value="">สุ่มได้ทุกสาย</option>']
                    .concat(groupKeys.map(g => `<option value="${Config.esc(g)}" ${value === g ? 'selected' : ''}>ล็อกสาย ${Config.esc(g)}</option>`));
                if (value === 'multi') opts.push(`<option value="multi" selected>สาย ${Config.esc(c.groups.join(', '))} (ตั้งไว้เดิม)</option>`);
                if (value && value !== 'multi' && !groupKeys.includes(value)) opts.push(`<option value="${Config.esc(value)}" selected>สาย ${Config.esc(value)} (ไม่มีในรายชื่อ)</option>`);
                const sib = sibMap.has(DrawRules.norm(team)) ? '<span class="mini-tag">มีทีมเดียวกัน</span>' : '';
                return `<tr class="${value ? 'is-locked' : ''}">
                    <td class="cell-strong">${Config.esc(team)} ${sib}</td>
                    <td><label class="sr-only" for="lock-sel-${i}">สายของ ${Config.esc(team)}</label>
                        <select id="lock-sel-${i}" class="lock-select" data-lock-team="${i}">${opts.join('')}</select></td>
                    <td class="cell-action">${value ? `<svg class="icon lock-icon" aria-label="ล็อกแล้ว"><use href="#i-lock"/></svg>` : ''}</td>
                </tr>`;
            }).join('');

            // Check the locks: too many teams in a group, or same-club teams locked together
            if (check) {
                const problems = [];
                const perGroup = {};
                constraints.forEach(c => {
                    if (c.groups.length !== 1) return;
                    const g = c.groups[0].trim().toUpperCase();
                    (perGroup[g] = perGroup[g] || []).push(c.team);
                });
                const lines = groupKeys.map(g => {
                    const n = (perGroup[g] || []).length;
                    if (n > groups[g]) problems.push(`สาย ${g} มี ${groups[g]} ช่อง แต่ล็อกไว้ ${n} ทีม`);
                    return `<span class="lock-count ${n > groups[g] ? 'bad' : ''}">สาย ${Config.esc(g)}: ล็อก ${n}/${groups[g]}</span>`;
                });
                Object.keys(perGroup).forEach(g => {
                    const list = perGroup[g];
                    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
                        const s = sibMap.get(DrawRules.norm(list[a]));
                        if (s && s.has(DrawRules.norm(list[b]))) problems.push(`"${list[a]}" กับ "${list[b]}" เป็นทีมเดียวกัน แต่ล็อกไว้สาย ${g} เหมือนกัน`);
                    }
                });
                check.innerHTML = `<div class="lock-counts">${lines.join('')}</div>` + (problems.length
                    ? `<div class="similar-warning"><svg class="icon" aria-hidden="true"><use href="#i-warn"/></svg><span class="warn-text">${problems.map(Config.esc).join('<br>')}</span></div>`
                    : '<p class="ok-note"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg> การล็อกสายใช้ได้</p>');
            }
        },

        setDrawMode(mode) {
            const s = DrawRules.loadSettings();
            s.mode = mode;
            DrawRules.saveSettings(s);
            this.populateSiblingUI();
            this.updateButtonState();
        },

        bindSiblingUI() {
            const modeGrid = document.getElementById('draw-mode-grid');
            if (modeGrid) {
                const cards = Array.from(modeGrid.querySelectorAll('.mode-card'));
                cards.forEach((card, i) => {
                    card.addEventListener('click', () => this.setDrawMode(card.dataset.mode));
                    card.addEventListener('keydown', (e) => {
                        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                        if (!step) return;
                        e.preventDefault();
                        const next = cards[(i + step + cards.length) % cards.length];
                        this.setDrawMode(next.dataset.mode); next.focus();
                    });
                });
            }

            const list = document.getElementById('club-list');
            if (list) list.addEventListener('click', (e) => {
                const t = e.target.closest('[data-sib-toggle]');
                const r = e.target.closest('[data-link-remove]');
                if (!t && !r) return;
                const s = DrawRules.loadSettings();
                if (t) {
                    const key = t.getAttribute('data-sib-toggle');
                    s.ignored = s.ignored.includes(key) ? s.ignored.filter(k => k !== key) : s.ignored.concat([key]);
                } else {
                    s.links.splice(parseInt(r.getAttribute('data-link-remove'), 10), 1);
                }
                DrawRules.saveSettings(s);
                this.populateSiblingUI();
            });

            const addBtn = document.getElementById('add-link-btn');
            if (addBtn) addBtn.addEventListener('click', () => {
                const a = document.getElementById('link-team-a').value;
                const b = document.getElementById('link-team-b').value;
                if (!a || !b) { this.toast('เลือกทีมให้ครบทั้ง 2 ช่อง', 'warn'); return; }
                if (a === b) { this.toast('เลือกคนละทีมกัน', 'warn'); return; }
                const s = DrawRules.loadSettings();
                if (s.links.some(l => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a))) { this.toast('จับคู่นี้ไว้แล้ว', 'warn'); return; }
                s.links.push([a, b]);
                DrawRules.saveSettings(s);
                document.getElementById('link-team-b').value = '';
                this.populateSiblingUI();
                this.toast(`บันทึกแล้ว: ${a} กับ ${b} เป็นทีมเดียวกัน`, 'ok');
            });

            const lockBody = document.getElementById('lock-table-body');
            if (lockBody) lockBody.addEventListener('change', (e) => {
                const sel = e.target.closest('[data-lock-team]');
                if (!sel || sel.value === 'multi') return;
                const team = this.rulesData().teams[parseInt(sel.dataset.lockTeam, 10)];
                if (!team) return;
                const list = DrawRules.loadConstraints().filter(c => c.team.trim().toLowerCase() !== team.trim().toLowerCase());
                if (sel.value) list.push({ team, groups: [sel.value] });
                StateManager.save('teamConstraints', list);
                this.populateSiblingUI();
                StateManager.triggerUpdate();
            });

            const clearLocks = document.getElementById('clear-locks-btn');
            if (clearLocks) clearLocks.addEventListener('click', () => {
                if (DrawRules.loadConstraints().length === 0) return;
                if (!confirm('ยกเลิกการล็อกสายทั้งหมด?')) return;
                StateManager.save('teamConstraints', []);
                this.populateSiblingUI();
            });
        },

        loadDataIntoControls() {
            const settings = StateManager.load('wheelSettings') || {};
            
            // Explicit mapping of settings keys to HTML input IDs
            const mapping = {
                title1: 'title-input-1',
                title2: 'title-input-2',
                palette1: 'palette-select-1',
                palette2: 'palette-select-2',
                spinDuration: 'spin-duration-slider',
                separatorOn: 'separator-toggle',
                separatorWidth: 'separator-width',
                wheelSpacing: 'wheel-spacing',
                wheelLayout: 'wheel-layout',
                transparentBg: 'transparent-bg',
                bgColor: 'bg-color-picker',

                columns: 'column-count',
                tourColumns: 'tour-column-count',
                groupPreset: 'group-preset-select',
                groupHeaderAlign: 'group-header-align',
                groupHeaderColor: 'group-header-color',
                groupPrefixColor: 'group-prefix-color',
                groupNameColor: 'group-name-color',
                cardBgColor: 'group-card-bg-color',
                headerBgColor: 'group-header-bg-color',
                prefixBgColor: 'group-prefix-bg-color',
                nameBgColor: 'group-name-bg-color',

                winnerLine1Color: 'winner-line1-color',
                winnerLine2Color: 'winner-line2-color',
                winnerBgColor: 'winner-bg-color',

                wheelTheme: 'wheel-theme',
                winnerTheme: 'winner-theme',
                wheelScale: 'scale-wheel',
                winnerScale: 'scale-winner',
                groupsScale: 'scale-groups',
                groupsWidth: 'scale-groupsw',
                tourScale: 'scale-tour',
                tableTheme: 'table-theme',
            };

            // Load regular settings
            Object.keys(mapping).forEach(key => {
                const elId = mapping[key];
                const el = this.inputs[elId];
                if (el && el === document.activeElement) return;
                if (el && settings[key] !== undefined) {
                    if (el.type === 'checkbox') {
                        el.checked = !!settings[key];
                    } else {
                        // For bgColor, if it's 'transparent', keep the picker at its current color but disable it
                        if (key === 'bgColor' && settings[key] === 'transparent') {
                            // Do not set value to 'transparent' on color picker as it will break
                        } else {
                            el.value = settings[key];
                        }
                    }
                }
            });

            // Load opacity settings (range inputs that represent percentage 0-100 stored as 0-1)
            const opacityMapping = {
                cardBgOpacity: 'group-card-bg-opacity',
                headerBgOpacity: 'group-header-bg-opacity',
                prefixBgOpacity: 'group-prefix-bg-opacity',
                nameBgOpacity: 'group-name-bg-opacity',
                winnerBgOpacity: 'winner-bg-opacity'
            };

            Object.keys(opacityMapping).forEach(key => {
                const elId = opacityMapping[key];
                const el = this.inputs[elId];
                if (el && settings[key] !== undefined) {
                    const v = Number(settings[key]);
                    el.value = Math.round((isNaN(v) ? 1 : v) * 100);
                }
            });

            // Adjust disabled state of bg color picker
            const transparentBgEl = this.inputs['transparent-bg'];
            const bgColorPickerEl = this.inputs['bg-color-picker'];
            if (transparentBgEl && bgColorPickerEl) {
                bgColorPickerEl.disabled = transparentBgEl.checked;
            }

            // Keep unsaved edits in the name boxes when another page triggers a refresh
            if (!this.dirty[1]) this.inputs['name-list-1'].value = StateManager.loadText('wheel1MasterNames') || '';
            if (!this.dirty[2]) this.inputs['name-list-2'].value = StateManager.loadText('wheel2MasterNames') || '';
            this.updateDirtyBadges();

            if (this.inputs['spin-duration-slider']) {
                document.getElementById('duration-value').textContent = this.inputs['spin-duration-slider'].value;
            }
            if (this.inputs['wheel-spacing']) {
                document.getElementById('spacing-value').textContent = this.inputs['wheel-spacing'].value;
            }

            this.renderHistory();
            this.updateNameCounts();
            this.populateConstraintsUI();
            this.populateLogosUI();
            this.populateSiblingUI();
            if (this.syncThemeGrids) { this.syncThemeGrids(); this.drawWheelPreviews(); }
            if (this.syncScaleNumbers) this.syncScaleNumbers();

            // Load Tournament settings
            const tourSettings = JSON.parse(localStorage.getItem('tournamentSettings')) || {};
            const setTourVal = (id, key, def) => {
                const el = document.getElementById(id);
                if (!el || el === document.activeElement) return;
                if (el.type === 'checkbox') el.checked = tourSettings[key] !== undefined ? tourSettings[key] : def;
                else el.value = tourSettings[key] !== undefined ? tourSettings[key] : def;
            };

            setTourVal('tour-name', 'tourName', '');
            setTourVal('tour-desc', 'tourDesc', '');
            setTourVal('tour-teams-input', 'tourTeamsInput', '');
            setTourVal('tour-3team-format', 'tour3TeamFormat', 'loser_first');
            setTourVal('tour-split-mode', 'tourSplitMode', 'all');
            setTourVal('tour-custom-morning', 'tourCustomMorning', 4);
            setTourVal('tour-use-time', 'tourUseTime', true);
            setTourVal('tour-start-time', 'tourStartTime', '08:00');
            setTourVal('tour-match-mins', 'tourMatchMins', 30);

            // Trigger element displays
            const customMorningContainer = document.getElementById('tour-custom-morning-container');
            if (customMorningContainer) {
                customMorningContainer.style.display = tourSettings.tourSplitMode === 'custom' ? '' : 'none';
            }
            const timeSettingsContainer = document.getElementById('tour-time-settings-container');
            if (timeSettingsContainer) {
                timeSettingsContainer.style.display = (tourSettings.tourUseTime !== false) ? '' : 'none';
            }
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
                    { name: 'RandomWheel - Tournament', file: 'groups.html?view=tournament' },
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

        populateConstraintsUI() {
            const teamSelect = document.getElementById('constraint-team-select');
            const checkboxesContainer = document.getElementById('constraint-groups-checkboxes');
            const tbody = document.getElementById('constraints-list-body');
            
            if (!teamSelect || !checkboxesContainer || !tbody) return;

            // 1. Populate team select dropdown
            const wheel2Text = StateManager.loadText('wheel2MasterNames') || '';
            const teams = wheel2Text.split('\n').map(t => t.trim()).filter(Boolean);
            
            // Keep what the user already picked when the lists refresh
            const keepTeam = teamSelect.value;
            const keepChecked = Array.from(document.querySelectorAll('.group-checkbox:checked')).map(cb => cb.value);
            teamSelect.innerHTML = '<option value="">-- เลือกทีม --</option>';
            teams.forEach(team => {
                const opt = document.createElement('option');
                opt.value = team;
                opt.textContent = team;
                teamSelect.appendChild(opt);
            });

            if (teams.includes(keepTeam)) teamSelect.value = keepTeam;

            // 2. Populate group checkboxes
            const wheel1Text = StateManager.loadText('wheel1MasterNames') || '';
            const groupsList = wheel1Text.split('\n').map(g => g.trim()).filter(Boolean);
            const prefixes = new Set();
            groupsList.forEach(name => {
                const match = name.match(/^[a-zA-Z]+/);
                const prefix = match ? match[0].toUpperCase() : 'Misc';
                prefixes.add(prefix);
            });

            checkboxesContainer.innerHTML = '';
            Array.from(prefixes).sort().forEach(prefix => {
                const label = document.createElement('label');
                label.className = 'chip-check';
                label.innerHTML = `<input type="checkbox" class="group-checkbox" value="${Config.esc(prefix)}"${keepChecked.includes(prefix) ? ' checked' : ''}> <span>สาย ${Config.esc(prefix)}</span>`;
                checkboxesContainer.appendChild(label);
            });

            // 3. Populate constraints list table
            const constraints = StateManager.load('teamConstraints') || [];
            tbody.innerHTML = '';
            
            if (constraints.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="cell-empty">ยังไม่มีการกำหนดเงื่อนไข</td></tr>`;
                return;
            }

            constraints.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="cell-strong">${Config.esc(item.team)}</td>
                    <td>${Config.esc(item.groups.join(', '))}</td>
                    <td class="cell-action">
                        <button type="button" class="btn btn-sm btn-danger-ghost remove" data-index="${index}" aria-label="ลบเงื่อนไขของ ${Config.esc(item.team)}">ลบ</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        },

        populateLogosUI() {
            const tbody = document.getElementById('logo-list-body');
            if (!tbody) return;

            const teams = (StateManager.loadText('wheel2MasterNames') || '').split('\n').map(t => t.trim()).filter(Boolean);
            const logos = StateManager.load('teamLogos') || {};
            tbody.innerHTML = '';

            if (teams.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="cell-empty">ยังไม่มีรายชื่อทีมในวงล้อ 2</td></tr>`;
                return;
            }

            teams.forEach((team, i) => {
                const tr = document.createElement('tr');
                const src = logos[team];
                const name = Config.esc(team);
                tr.innerHTML = `
                    <td class="cell-logo">
                        <button type="button" class="logo-slot" data-logo-upload="${i}" title="${src ? 'เปลี่ยนรูป' : 'อัปโหลดโลโก้'}" aria-label="${src ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'} ${name}">
                            ${src ? `<img src="${Config.esc(src)}" alt="">` : '<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>'}
                        </button>
                    </td>
                    <td class="cell-strong">${name}</td>
                    <td class="cell-action">
                        <button type="button" class="btn btn-sm btn-danger-ghost" data-logo-remove="${i}" ${src ? '' : 'disabled'} aria-label="ลบโลโก้ ${name}">ลบ</button>
                    </td>`;
                tbody.appendChild(tr);
            });
        },

        bindLogoManager() {
            const tbody = document.getElementById('logo-list-body');
            const fileInput = document.getElementById('logo-file-input');
            if (!tbody || !fileInput) return;
            const teamAt = (i) => (StateManager.loadText('wheel2MasterNames') || '').split('\n').map(t => t.trim()).filter(Boolean)[i];
            let activeTeam = null;

            tbody.addEventListener('click', (e) => {
                const up = e.target.closest('[data-logo-upload]');
                if (up) { activeTeam = teamAt(parseInt(up.dataset.logoUpload, 10)); if (activeTeam) fileInput.click(); return; }
                const rm = e.target.closest('[data-logo-remove]');
                if (rm) {
                    const team = teamAt(parseInt(rm.dataset.logoRemove, 10));
                    if (!team || !confirm(`ลบโลโก้ของทีม "${team}" ?`)) return;
                    const logos = StateManager.load('teamLogos') || {};
                    delete logos[team];
                    StateManager.save('teamLogos', logos);
                    this.populateLogosUI();
                    StateManager.triggerUpdate();
                }
            });

            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                const team = activeTeam;
                fileInput.value = '';
                activeTeam = null;
                if (!file || !team) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        // Same as the desktop logo manager: 128x128 PNG on white
                        const canvas = document.createElement('canvas');
                        canvas.width = 128; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 128, 128);
                        const ratio = Math.min(128 / img.width, 128 / img.height);
                        const w = img.width * ratio, h = img.height * ratio;
                        ctx.drawImage(img, (128 - w) / 2, (128 - h) / 2, w, h);
                        const logos = StateManager.load('teamLogos') || {};
                        logos[team] = canvas.toDataURL('image/png');
                        try {
                            StateManager.save('teamLogos', logos);
                        } catch (err) {
                            this.toast('พื้นที่เก็บข้อมูลเต็ม ลบโลโก้บางทีมก่อน', 'error');
                            return;
                        }
                        this.populateLogosUI();
                        StateManager.triggerUpdate();
                        this.toast(`บันทึกโลโก้ ${team} แล้ว`, 'ok');
                    };
                    img.onerror = () => this.toast('เปิดไฟล์รูปนี้ไม่ได้', 'error');
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            });
        },

        // Size sliders: range + number box + reset, kept in step
        bindScaleControls() {
            ['wheel', 'winner', 'groups', 'groupsw', 'tour'].forEach(key => {
                const range = document.getElementById('scale-' + key);
                const num = document.getElementById('scale-' + key + '-num');
                if (!range || !num) return;
                const lo = Number(range.min), hi = Number(range.max);
                const clamp = (v) => Math.min(hi, Math.max(lo, Math.round((Number(v) || 100) / 5) * 5));
                range.addEventListener('input', () => { num.value = range.value; });
                const fromNum = () => {
                    if (num.value === '') return;
                    range.value = clamp(num.value);
                    this.saveAllSettings();
                };
                num.addEventListener('change', () => { num.value = clamp(num.value); fromNum(); });
                num.addEventListener('keydown', (e) => { if (e.key === 'Enter') { num.value = clamp(num.value); fromNum(); } });
            });
            document.querySelectorAll('[data-scale-reset]').forEach(btn => btn.addEventListener('click', () => {
                const key = btn.dataset.scaleReset;
                document.getElementById('scale-' + key).value = 100;
                document.getElementById('scale-' + key + '-num').value = 100;
                this.saveAllSettings();
            }));
            document.querySelectorAll('input[name="groups-align"]').forEach(r => r.addEventListener('change', () => this.saveAllSettings()));
            this.syncScaleNumbers();
        },

        syncScaleNumbers() {
            ['wheel', 'winner', 'groups', 'groupsw', 'tour'].forEach(key => {
                const range = document.getElementById('scale-' + key);
                const num = document.getElementById('scale-' + key + '-num');
                if (range && num && num !== document.activeElement) num.value = range.value;
            });
            const align = (StateManager.load('wheelSettings') || {}).groupsAlign || 'center';
            document.querySelectorAll('input[name="groups-align"]').forEach(r => { r.checked = r.value === align; });
        },

        // Online copy on GitHub Pages (repo JamornzMedia/obs-dock-ui, folder random_wheel_obs)
        onlineBase: 'https://jamornzmedia.github.io/obs-dock-ui/random_wheel_obs',

        // Links to paste into OBS. They are built from the address this page was opened from,
        // because the Dock and every Browser Source must use the same address to share data.
        renderObsLinks() {
            const list = document.getElementById('obs-links-list');
            const note = document.getElementById('obs-links-note');
            if (!list) return;
            const here = window.location.href.split('?')[0].split('#')[0].replace(/\/[^/]*$/, '');
            const isOnline = /^https:\/\//i.test(here) && !/\/\/(localhost|127\.0\.0\.1)/i.test(here);
            const pages = [
                { label: 'หน้าควบคุม (Custom Browser Dock)', file: 'controls.html' },
                { label: 'วงล้อ', file: 'wheels.html' },
                { label: 'ป้ายประกาศผล', file: 'winner.html' },
                { label: 'ตารางสาย', file: 'groups.html' },
                { label: 'ตารางแข่ง', file: 'groups.html?view=tournament' },
            ];
            const sets = [{ title: isOnline ? 'ลิงก์ออนไลน์ (ที่เปิดอยู่ตอนนี้)' : 'ลิงก์ในเครื่องนี้ (ที่เปิดอยู่ตอนนี้)', base: here }];
            if (!isOnline) sets.push({ title: 'ลิงก์ออนไลน์ (GitHub Pages)', base: this.onlineBase });
            const items = [];
            list.innerHTML = sets.map(set => `
                <h3 class="obs-links-title">${Config.esc(set.title)}</h3>
                ${pages.map(pg => {
                    const i = items.push(`${set.base}/${pg.file}`) - 1;
                    return `<div class="obs-link-row">
                        <div class="obs-link-text">
                            <span class="obs-link-label">${Config.esc(pg.label)}</span>
                            <code>${Config.esc(items[i])}</code>
                        </div>
                        <button type="button" class="btn btn-sm btn-ghost" data-copy-link="${i}" aria-label="คัดลอกลิงก์ ${Config.esc(pg.label)}">
                            <svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg><span>คัดลอก</span>
                        </button>
                    </div>`;
                }).join('')}`).join('');
            if (note) {
                note.textContent = isOnline
                    ? 'เปิดจากเว็บอยู่ ไม่ต้องลงโปรแกรมหรือเปิดเซิร์ฟเวอร์ อัปไฟล์ใหม่ขึ้น GitHub เมื่อไร ทุกคนได้เวอร์ชันใหม่เอง'
                    : 'ตอนนี้เปิดจากไฟล์ในเครื่อง ถ้าใช้ลิงก์ออนไลน์ ต้องใช้ลิงก์ออนไลน์ทั้งชุด (Dock และ Source ทุกอัน) ห้ามปนกับลิงก์ในเครื่อง เพราะข้อมูลจะไม่ถึงกัน';
            }
            list.onclick = (e) => {
                const btn = e.target.closest('[data-copy-link]');
                if (!btn) return;
                const url = items[parseInt(btn.dataset.copyLink, 10)];
                const done = () => this.toast('คัดลอกลิงก์แล้ว', 'ok');
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(url).then(done).catch(() => this.copyFallback(url, done));
                } else {
                    this.copyFallback(url, done);
                }
            };
        },

        copyFallback(text, done) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { this.toast('คัดลอกไม่ได้ ให้ลากเลือกข้อความแทน', 'warn'); }
            ta.remove();
        },

        // --- Theme picker grid ---
        themePreviewHtml(kind, key) {
            if (kind === 'wheel') {
                const t = Config.wheelThemes[key];
                return `<div class="tp-wheel"><span class="tp-pointer" style="border-top-color:${t.pointer}"></span><canvas width="500" height="500" data-wheel-preview="${key}"></canvas></div>`;
            }
            if (kind === 'winner') {
                return `<div class="tp-stage"><div class="tp-winner tp-${key}"><span class="tp-w-label">ผลการจับคู่คือ</span><span class="tp-w-l1">A2</span><span class="tp-w-l2">YAI FC</span></div></div>`;
            }
            return `<div class="tp-stage"><div class="tp-table tp-${key}"><div class="tp-t-head">กลุ่ม A</div>
                <div class="tp-t-row"><span>A1</span><span>YAI FC</span></div>
                <div class="tp-t-row"><span>A2</span><span>Lion</span></div>
                <div class="tp-t-row"><span>A3</span><span class="tp-ph">...</span></div></div></div>`;
        },

        buildThemeGrids() {
            const kinds = [
                { kind: 'wheel', select: 'wheel-theme', grid: 'wheel-theme-grid', themes: Config.wheelThemes },
                { kind: 'winner', select: 'winner-theme', grid: 'winner-theme-grid', themes: Config.winnerThemes },
                { kind: 'table', select: 'table-theme', grid: 'table-theme-grid', themes: Config.tableThemes },
            ];
            kinds.forEach(({ kind, select, grid, themes }) => {
                const gridEl = document.getElementById(grid);
                const sel = this.inputs[select];
                if (!gridEl || !sel) return;
                gridEl.innerHTML = Object.keys(themes).map(key => `
                    <button type="button" class="theme-card" role="radio" aria-checked="false" data-theme-value="${key}">
                        ${this.themePreviewHtml(kind, key)}
                        <span class="theme-name">${Config.esc(themes[key].name)}</span>
                        <span class="theme-check" aria-hidden="true"><svg class="icon"><use href="#i-check"/></svg></span>
                    </button>`).join('');
                const cards = Array.from(gridEl.querySelectorAll('.theme-card'));
                const choose = (card) => {
                    sel.value = card.dataset.themeValue;
                    sel.dispatchEvent(new Event('change'));
                    this.syncThemeGrids();
                };
                cards.forEach((card, i) => {
                    card.addEventListener('click', () => choose(card));
                    card.addEventListener('keydown', (e) => {
                        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                        if (!step) return;
                        e.preventDefault();
                        const next = cards[(i + step + cards.length) % cards.length];
                        choose(next); next.focus();
                    });
                });
            });
            this.drawWheelPreviews();
            this.syncThemeGrids();
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.drawWheelPreviews());
        },

        drawWheelPreviews() {
            const sample = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2'];
            const settings = StateManager.load('wheelSettings') || {};
            document.querySelectorAll('canvas[data-wheel-preview]').forEach(cv => {
                GraphicsManager.drawWheel(cv.getContext('2d'), cv, sample, {}, {
                    wheelTheme: cv.dataset.wheelPreview,
                    palette1: settings.palette1 || 'classic',
                    separatorOn: true,
                    separatorWidth: 3
                });
            });
        },

        syncThemeGrids() {
            [['wheel-theme', 'wheel-theme-grid'], ['winner-theme', 'winner-theme-grid'], ['table-theme', 'table-theme-grid']].forEach(([selId, gridId]) => {
                const sel = this.inputs[selId];
                const grid = document.getElementById(gridId);
                if (!sel || !grid) return;
                const value = sel.value || 'classic';
                grid.querySelectorAll('.theme-card').forEach(card => {
                    const on = card.dataset.themeValue === value;
                    card.setAttribute('aria-checked', on ? 'true' : 'false');
                    card.tabIndex = on ? 0 : -1;
                    card.classList.toggle('selected', on);
                });
            });
            [1, 2].forEach(n => {
                const sel = this.inputs['palette-select-' + n];
                const sw = document.getElementById('palette-swatch-' + n);
                if (!sel || !sw) return;
                const p = Config.palettes[sel.value] || Config.palettes.classic;
                sw.innerHTML = p.colors.map(c => `<span style="background:${c}"></span>`).join('');
            });
        },

        initialSetup(forceReset = false) {
            this.populateSelect(this.inputs['palette-select-1'], Config.palettes);
            this.populateSelect(this.inputs['palette-select-2'], Config.palettes);
            this.populateSelect(this.inputs['group-preset-select'], Config.groupPresets);
            this.populateSelect(this.inputs['wheel-theme'], Config.wheelThemes);
            this.populateSelect(this.inputs['winner-theme'], Config.winnerThemes);
            this.populateSelect(this.inputs['table-theme'], Config.tableThemes);

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
        logoCache: {},

        preloadLogos() {
            const logos = StateManager.load('teamLogos') || {};
            Object.keys(logos).forEach(team => {
                if (!this.logoCache[team] || this.logoCache[team].src !== logos[team]) {
                    const img = new Image();
                    img.src = logos[team];
                    img.onload = () => {
                        if (page === 'Wheels Display') {
                            this.updateAndDrawWheels();
                        }
                    };
                    this.logoCache[team] = img;
                }
            });
            Object.keys(this.logoCache).forEach(team => {
                if (!logos[team]) {
                    delete this.logoCache[team];
                }
            });
        },

        init() {
            this.preloadLogos();
            this.syncState();
            window.addEventListener('storage', this.syncState.bind(this));
            if (document.fonts && document.fonts.ready && page === 'Wheels Display') {
                document.fonts.ready.then(() => this.updateAndDrawWheels());
            }
        },

        syncState(e = null) {
            this.preloadLogos();
            this.applySettings();
            if (page === 'Wheels Display') this.updateAndDrawWheels();
            if (page === 'Grouping Display') this.renderGroups();
            if (page === 'Winner Display') this.showWinner();
            if (page === 'Tournament Display') this.renderTournament();

            if (e) {
                switch (e.key) {
                    case 'spinCommand': if (page === 'Wheels Display') this.spinWheels(); break;
                    case 'respinCommand': if (page === 'Wheels Display' || page === 'Winner Display') this.handleRespin(); break;
                    // The control panel saves the result; overlays only hide the announcement
                    case 'confirmWinnerCommand': {
                        const ov = document.getElementById('winner-overlay');
                        if (ov) ov.classList.remove('show');
                        break;
                    }
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
            // Themes: missing value = 'classic' (the original look), so existing OBS sources look the same
            document.body.dataset.wheelTheme = Config.wheelThemes[settings.wheelTheme] ? settings.wheelTheme : 'classic';
            document.body.dataset.winnerTheme = Config.winnerThemes[settings.winnerTheme] ? settings.winnerTheme : 'classic';
            document.body.dataset.tableTheme = Config.tableThemes[settings.tableTheme] ? settings.tableTheme : 'classic';
            root.style.setProperty('--wheel-spacing', (settings.wheelSpacing || 30) + 'px');
            document.body.style.backgroundColor = settings.bgColor || 'transparent';

            // Apply Wheel Layout
            // On-screen size set from the control panel (100% = original)
            const pct = (v) => { const n = Number(v); return (isFinite(n) && n >= 30 && n <= 250) ? n / 100 : 1; };
            const scaleKey = { 'Wheels Display': 'wheelScale', 'Winner Display': 'winnerScale', 'Grouping Display': 'groupsScale', 'Tournament Display': 'tourScale' }[page];
            if (scaleKey) {
                const z = pct(settings[scaleKey]);
                const target = page === 'Wheels Display' ? document.querySelector('.wheels-area')
                    : page === 'Winner Display' ? document.querySelector('.winner-box')
                    : document.getElementById('groups-container');
                if (target) target.style.zoom = z === 1 ? '' : String(z);
            }
            if (page === 'Grouping Display') {
                const box = document.getElementById('groups-container');
                const w = Number(settings.groupsWidth);
                if (box) {
                    if (isFinite(w) && w >= 20 && w < 100) {
                        box.style.boxSizing = 'border-box';
                        box.style.maxWidth = w + '%';
                        const a = settings.groupsAlign;
                        box.style.marginLeft = a === 'left' ? '0' : 'auto';
                        box.style.marginRight = a === 'right' ? '0' : 'auto';
                    } else {
                        box.style.maxWidth = ''; box.style.marginLeft = ''; box.style.marginRight = ''; box.style.boxSizing = '';
                    }
                }
            }

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
                    wheelsArea.style.pointerEvents = 'none';
                } else {
                    if (wheelsArea.style.opacity === '0') {
                        wheelsArea.style.transition = 'opacity 0.5s ease-in';
                        wheelsArea.style.opacity = '1';
                        wheelsArea.style.pointerEvents = 'auto';
                    } else {
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

            if (page === 'Tournament Display') {
                root.style.setProperty('--num-columns', settings.tourColumns || 3);
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

        // Colours for the slices on screen now: each name keeps its palette colour from the
        // master list, but two neighbouring slices (including last/first) never share a colour.
        sliceColors(names, masterNames, paletteKey) {
            const paletteData = Config.palettes[paletteKey] || Config.palettes['classic'];
            const colors = paletteData.colors || paletteData;
            const k = colors.length;
            const base = names.map((name, i) => {
                const mi = masterNames.indexOf(name);
                return colors[(mi === -1 ? i : mi) % k];
            });
            const out = base.slice();
            const n = out.length;
            for (let i = 1; i < n; i++) {
                const prev = out[i - 1];
                const next = (i === n - 1) ? out[0] : base[i + 1];
                if (out[i] === prev || (i === n - 1 && out[i] === out[0])) {
                    const start = colors.indexOf(out[i]);
                    for (let step = 1; step < k; step++) {
                        const c = colors[(start + step) % k];
                        if (c !== prev && c !== next) { out[i] = c; break; }
                    }
                }
            }
            return out;
        },

        drawWheelFrame(ctx, centerX, centerY, radius, theme) {
            if (theme.ringWidth > 0) {
                ctx.save();
                if (theme.glow) { ctx.shadowColor = theme.glow; ctx.shadowBlur = 18; }
                let stroke = theme.ring;
                if (theme.ringGradient) {
                    const g = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
                    theme.ringGradient.forEach((c, i) => g.addColorStop(i / (theme.ringGradient.length - 1), c));
                    stroke = g;
                }
                ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = stroke; ctx.lineWidth = theme.ringWidth; ctx.stroke();
                ctx.restore();
                if (theme.innerRing) {
                    ctx.beginPath(); ctx.arc(centerX, centerY, radius - theme.ringWidth / 2 - 2, 0, 2 * Math.PI);
                    ctx.strokeStyle = theme.innerRing; ctx.lineWidth = 3; ctx.stroke();
                }
            }
            if (theme.bulbs) {
                const count = 24;
                for (let i = 0; i < count; i++) {
                    const a = (i / count) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(centerX + Math.cos(a) * radius, centerY + Math.sin(a) * radius, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = i % 2 ? '#fff8dc' : '#ffffff';
                    ctx.shadowColor = '#ffe9a8'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
                }
            }
            if (theme.ticks) {
                const count = 48;
                ctx.save(); ctx.strokeStyle = theme.ticks; ctx.lineWidth = 2;
                for (let i = 0; i < count; i++) {
                    const a = (i / count) * Math.PI * 2;
                    const r1 = radius - theme.ringWidth / 2 + 2, r2 = r1 + (i % 4 === 0 ? 8 : 4);
                    ctx.beginPath();
                    ctx.moveTo(centerX + Math.cos(a) * r1, centerY + Math.sin(a) * r1);
                    ctx.lineTo(centerX + Math.cos(a) * r2, centerY + Math.sin(a) * r2);
                    ctx.stroke();
                }
                ctx.restore();
            }
            if (theme.hub) {
                ctx.save();
                ctx.beginPath(); ctx.arc(centerX, centerY, theme.hubSize, 0, Math.PI * 2);
                if (theme.glow) { ctx.shadowColor = theme.glow; ctx.shadowBlur = 14; }
                ctx.fillStyle = theme.hub; ctx.fill();
                ctx.shadowBlur = 0;
                if (theme.hubBorder) { ctx.lineWidth = 4; ctx.strokeStyle = theme.hubBorder; ctx.stroke(); }
                ctx.restore();
            }
        },

        drawWheel(ctx, canvas, names, colorMap, settings) {
            const theme = Config.wheelThemes[settings.wheelTheme] || Config.wheelThemes.classic;
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
            const radius = centerX - theme.margin;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!names || names.length === 0 || !colorMap) {
                ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.fillStyle = theme.empty; ctx.fill();
                this.drawWheelFrame(ctx, centerX, centerY, radius, theme);
                return;
            }
            const segmentAngle = (2 * Math.PI) / names.length;
            const isWheel2 = canvas.id === 'wheel-canvas-2';
            const masterNames = (StateManager.loadText(isWheel2 ? 'wheel2MasterNames' : 'wheel1MasterNames') || '').split('\n').filter(Boolean);
            const fills = this.sliceColors(names, masterNames, isWheel2 ? settings.palette2 : settings.palette1);
            names.forEach((name, i) => {
                const startAngle = i * segmentAngle - (Math.PI / 2);
                const endAngle = (i + 1) * segmentAngle - (Math.PI / 2);
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.closePath();
                const fill = fills[i] || colorMap[name] || '#cccccc';
                ctx.fillStyle = fill;
                ctx.fill();
                if (settings.separatorOn) {
                    ctx.strokeStyle = theme.separator; ctx.lineWidth = parseInt(settings.separatorWidth, 10) || 1; ctx.stroke();
                }
                ctx.save(); ctx.translate(centerX, centerY); ctx.rotate((startAngle + endAngle) / 2);
                // Dark text on light slices (pastel / ice / monochrome), white text on dark ones
                const lightSlice = Config.luminance(fill) > 0.45;
                ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
                ctx.fillStyle = lightSlice ? '#1b1f24' : '#ffffff';
                ctx.shadowColor = lightSlice ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 2;
                
                // Draw logo if it is Wheel 2 and logo is available
                let textXOffset = 20;
                if (canvas.id === 'wheel-canvas-2') {
                    const logoImg = this.logoCache[name];
                    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
                        const logoSize = 30;
                        const logoX = radius - logoSize - 15;
                        const logoY = -logoSize / 2;
                        
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                        ctx.restore();
                        
                        textXOffset = logoSize + 25;
                    }
                }

                let fontSize = 20;
                const textRoom = radius - textXOffset - 10 - (theme.hub ? theme.hubSize : 0);
                ctx.font = `bold ${fontSize}px Sarabun`;
                while (ctx.measureText(name).width > textRoom && fontSize > 10) {
                    fontSize--; ctx.font = `bold ${fontSize}px Sarabun`;
                }
                ctx.fillText(name, radius - textXOffset, 0);
                ctx.restore();
            });
            this.drawWheelFrame(ctx, centerX, centerY, radius, theme);
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
            if (!canvas1 || !canvas2) return;
            const names1 = (StateManager.loadText('wheel1Names') || "").split('\n').filter(Boolean);
            const names2 = (StateManager.loadText('wheel2Names') || "").split('\n').filter(Boolean);
            if (names1.length === 0 || names2.length === 0) return;

            const settings = StateManager.load('wheelSettings') || {};
            const duration = parseFloat(settings.spinDuration) || 6;

            const getSecureRandom = () => {
                if (window.crypto && window.crypto.getRandomValues) {
                    const array = new Uint32Array(1);
                    window.crypto.getRandomValues(array);
                    return array[0] / (0xffffffff + 1);
                }
                return Math.random();
            };

            // Read the pre-calculated winner from localStorage
            const pendingWinner = StateManager.load('pendingWinner');
            if (!pendingWinner || !pendingWinner.val1 || !pendingWinner.val2) return;

            let winnerIndex1 = names1.indexOf(pendingWinner.val1);
            let winnerIndex2 = names2.indexOf(pendingWinner.val2);

            // Fallback if not found
            if (winnerIndex1 === -1) winnerIndex1 = 0;
            if (winnerIndex2 === -1) winnerIndex2 = 0;

            const minSpins = 10;
            const maxSpins = 18;

            const sliceAngle1 = 360 / names1.length;
            const randomOffsetWithinSlice1 = 0.15 + getSecureRandom() * 0.7; // Avoid exact boundaries
            const targetAngle1 = 360 - (winnerIndex1 + randomOffsetWithinSlice1) * sliceAngle1;
            const spins1 = minSpins + Math.floor(getSecureRandom() * (maxSpins - minSpins + 1));
            const finalRotation1 = this.rotation1 + (spins1 * 360) + ((targetAngle1 - (this.rotation1 % 360) + 360) % 360);

            const sliceAngle2 = 360 / names2.length;
            const randomOffsetWithinSlice2 = 0.15 + getSecureRandom() * 0.7;
            const targetAngle2 = 360 - (winnerIndex2 + randomOffsetWithinSlice2) * sliceAngle2;
            const spins2 = minSpins + Math.floor(getSecureRandom() * (maxSpins - minSpins + 1));
            const finalRotation2 = this.rotation2 + (spins2 * 360) + ((targetAngle2 - (this.rotation2 % 360) + 360) % 360);

            this.rotation1 = finalRotation1;
            this.rotation2 = finalRotation2;

            // Apply smooth animation with natural easing
            canvas1.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.25, 1)`;
            canvas2.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.25, 1)`;

            canvas1.style.transform = `rotate(${this.rotation1}deg)`;
            canvas2.style.transform = `rotate(${this.rotation2}deg)`;

            // After spin completes, update state and announce winner
            clearTimeout(this.spinTimer);
            this.spinTimer = setTimeout(() => {
                localStorage.setItem('isSpinning', 'false');
                StateManager.triggerUpdate();
            }, duration * 1000);
        },

        showWinner() {
            const overlay = document.getElementById('winner-overlay');
            if (!overlay) return;
            const winnerData = StateManager.load('pendingWinner') || {};
            const isSpinning = localStorage.getItem('isSpinning') === 'true';

            if (winnerData && winnerData.val1 && !isSpinning) {
                document.getElementById('winner-part1').textContent = winnerData.val1;
                document.getElementById('winner-part2').textContent = winnerData.val2;

                // Show logo if available
                const logoContainer = document.getElementById('winner-logo-container');
                const logoImg = document.getElementById('winner-logo-img');
                if (logoContainer && logoImg) {
                    const logos = StateManager.load('teamLogos') || {};
                    const logoSrc = logos[winnerData.val2];
                    if (logoSrc) {
                        logoImg.src = logoSrc;
                        logoContainer.style.display = 'flex';
                    } else {
                        logoContainer.style.display = 'none';
                        logoImg.src = '';
                    }
                }

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

            const logos = StateManager.load('teamLogos') || {};

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

                    let logoHtml = '';
                    if (item.pairedName !== '...') {
                        const logoSrc = logos[item.pairedName];
                        if (logoSrc) {
                            logoHtml = `<img src="${Config.esc(logoSrc)}" class="group-team-logo" style="width: 20px; height: 20px; border-radius: 50%; object-fit: contain; margin-right: 6px; vertical-align: middle; background: white; border: 1px solid #ddd;">`;
                        }
                    }

                    itemDiv.innerHTML = `<span class="group-prefix">${Config.esc(item.slotName)}</span><span class="${nameClass}">${logoHtml}${Config.esc(item.pairedName)}</span>`;
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

            const overlay = document.getElementById('winner-overlay');
            if (overlay) overlay.classList.remove('show');

            StateManager.triggerUpdate();
        },

        renderTournament() {
            const container = document.getElementById('groups-container');
            if (!container) return;
            container.innerHTML = '';

            const scheduleData = JSON.parse(localStorage.getItem('tournamentSchedule'));
            if (!scheduleData || !scheduleData.sessions || scheduleData.sessions.length === 0) {
                container.innerHTML = '<p class="no-data">ยังไม่มีข้อมูลตารางการแข่งขัน</p>';
                return;
            }

            const settings = StateManager.load('wheelSettings') || {};
            const logos = StateManager.load('teamLogos') || {};
            const useTime = scheduleData.useTime !== false;

            if (scheduleData.name || scheduleData.desc) {
                const headerDiv = document.createElement('div');
                headerDiv.className = 'tour-header';
                let html = '';
                if (scheduleData.name) {
                    html += `<h1>🏆 ${Config.esc(scheduleData.name)}</h1>`;
                }
                if (scheduleData.desc) {
                    html += `<p>${Config.esc(scheduleData.desc)}</p>`;
                }
                headerDiv.innerHTML = html;
                container.appendChild(headerDiv);
            }

            const tableContainer = document.createElement('div');
            tableContainer.className = 'tour-table-container';

            const table = document.createElement('table');
            table.className = 'tour-table';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th class="col-num">คู่ที่</th>
                    ${useTime ? '<th class="col-time">เวลา</th>' : ''}
                    <th class="col-group">สาย</th>
                    <th class="col-team1">ทีมที่ 1</th>
                    <th class="col-vs">VS</th>
                    <th class="col-team2">ทีมที่ 2</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            scheduleData.sessions.forEach(session => {
                if (session.hasSplit) {
                    const sessionRow = document.createElement('tr');
                    sessionRow.className = 'session-row';
                    sessionRow.innerHTML = `
                        <td colSpan="${useTime ? 6 : 5}" class="session-title">
                            ${Config.esc(session.title)}
                        </td>
                    `;
                    tbody.appendChild(sessionRow);
                }

                session.matches.forEach(m => {
                    const tr = document.createElement('tr');
                    tr.className = 'match-row';

                    let logo1Html = '';
                    const logo1Src = logos[m.team1];
                    if (logo1Src) {
                        logo1Html = `<img src="${Config.esc(logo1Src)}" class="table-team-logo">`;
                    }

                    let logo2Html = '';
                    const logo2Src = logos[m.team2];
                    if (logo2Src) {
                        logo2Html = `<img src="${Config.esc(logo2Src)}" class="table-team-logo">`;
                    }

                    const isPlaceholder1 = m.team1.includes('แพ้') || m.team1.includes('ชนะ');
                    const isPlaceholder2 = m.team2.includes('แพ้') || m.team2.includes('ชนะ');

                    tr.innerHTML = `
                        <td class="col-num">${m.num}</td>
                        ${useTime ? `<td class="col-time">${m.time || '—'} น.</td>` : ''}
                        <td class="col-group">${Config.esc(m.code)}</td>
                        <td class="col-team1">
                            <div class="team-container right ${isPlaceholder1 ? 'placeholder-team' : ''}">
                                <span class="team-name">${Config.esc(m.team1)}</span>
                                ${logo1Html}
                            </div>
                        </td>
                        <td class="col-vs">VS</td>
                        <td class="col-team2">
                            <div class="team-container left ${isPlaceholder2 ? 'placeholder-team' : ''}">
                                ${logo2Html}
                                <span class="team-name">${Config.esc(m.team2)}</span>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            });

            table.appendChild(tbody);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
    };

    // --- MODULE 5: LICENSING & LOGIN MANAGER ---
    const LoginManager = {
        init() {
            const loginOverlay = document.getElementById('login-overlay');
            if (!loginOverlay) return;

            // Display overlay immediately by default if running in Electron
            if (window.electronAPI) {
                loginOverlay.style.display = 'flex';
                this.checkSession();
            } else {
                // Not in Electron (running via browser/OBS dock without preload)
                const identity = StateManager.load('userIdentity');
                if (identity) {
                    loginOverlay.style.display = 'none';
                } else {
                    loginOverlay.style.display = 'flex';
                    const statusEl = document.getElementById('login-loading-status');
                    statusEl.textContent = '⏳ กำลังตรวจสอบการเชื่อมต่อกับโปรแกรมหลัก...';
                    
                    fetch('/api/session-status')
                        .then(res => res.json())
                        .then(session => {
                            if (session.status === 'authenticated') {
                                let finalIdentity;
                                if (session.isGuest) {
                                    finalIdentity = session.guestIdentity;
                                } else {
                                    finalIdentity = {
                                        name: session.name || (session.email ? session.email.split('@')[0] : 'User'),
                                        email: session.email,
                                        isGoogleUser: true
                                    };
                                }
                                StateManager.save('userIdentity', finalIdentity);
                                statusEl.textContent = '✅ เชื่อมต่อสิทธิ์สำเร็จ! เข้าสู่หน้าควบคุม...';
                                setTimeout(() => {
                                    loginOverlay.style.display = 'none';
                                }, 600);
                            } else {
                                document.getElementById('login-state-unauthenticated').style.display = 'block';
                                document.getElementById('login-state-authenticated').style.display = 'none';
                                statusEl.textContent = '⚠️ กรุณาเข้าสู่ระบบในโปรแกรมหลัก (Desktop App) ก่อน';
                            }
                        })
                        .catch(err => {
                            console.error('Session status API failed:', err);
                            document.getElementById('login-state-unauthenticated').style.display = 'block';
                            document.getElementById('login-state-authenticated').style.display = 'none';
                            statusEl.textContent = '❌ ไม่สามารถเชื่อมต่อกับโปรแกรมหลักได้';
                        });
                }
            }

            this.bindEvents();
        },

        async checkSession() {
            const statusEl = document.getElementById('login-loading-status');
            statusEl.textContent = '⏳ กำลังตรวจสอบสิทธิ์การใช้งาน...';
            
            try {
                const session = await window.electronAPI.getSessionStatus();
                if (session.status === 'authenticated') {
                    document.getElementById('login-state-unauthenticated').style.display = 'none';
                    document.getElementById('login-state-authenticated').style.display = 'block';
                    document.getElementById('auth-email-display').textContent = session.email || 'Guest Session';
                    document.getElementById('license-label-display').textContent = session.licenseLabel || `ใช้งานแบบออฟไลน์ (เหลือเวลา ${session.daysRemaining} วัน)`;
                    statusEl.textContent = '✅ ตรวจสอบสิทธิ์สำเร็จ';
                } else {
                    document.getElementById('login-state-unauthenticated').style.display = 'block';
                    document.getElementById('login-state-authenticated').style.display = 'none';
                    statusEl.textContent = session.message || '';
                }
            } catch (e) {
                console.error('Session check failed:', e);
                statusEl.textContent = '❌ ไม่สามารถตรวจสอบเซสชันได้';
            }
        },

        bindEvents() {
            const googleLoginBtn = document.getElementById('google-login-btn');
            const guestLoginBtn = document.getElementById('guest-login-btn');
            const enterProgramBtn = document.getElementById('enter-program-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const statusEl = document.getElementById('login-loading-status');

            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', async () => {
                    statusEl.textContent = '🔑 กรุณายืนยันตัวตนในเบราว์เซอร์ที่เปิดขึ้นมา...';
                    
                    if (window.electronAPI) {
                        try {
                            const res = await window.electronAPI.loginWithGoogle();
                            if (res.success) {
                                statusEl.textContent = '✅ เข้าสู่ระบบสำเร็จ!';
                                this.checkSession();
                            } else {
                                statusEl.textContent = `❌ ล็อกอินล้มเหลว: ${res.error || 'ไม่สามารถยืนยันตัวตนได้'}`;
                            }
                        } catch (e) {
                            statusEl.textContent = `❌ เกิดข้อผิดพลาดในการล็อกอิน`;
                        }
                    } else {
                        // Non-Electron browser fallback: Prompt
                        const userEmail = prompt("กรอกอีเมล Google ของคุณเพื่อเข้าสู่ระบบ (Google Sign-In):");
                        if (userEmail && userEmail.includes('@')) {
                            const namePart = userEmail.split('@')[0];
                            const newIdentity = {
                                name: namePart,
                                province: 'Bangkok',
                                ID: Math.floor(100000 + Math.random() * 900000).toString(),
                                email: userEmail,
                                isGoogleUser: true
                            };
                            StateManager.save('userIdentity', newIdentity);
                            statusEl.textContent = '✅ เข้าสู่ระบบสำเร็จ!';
                            setTimeout(() => window.location.reload(), 1000);
                        } else if (userEmail) {
                            alert("รูปแบบอีเมลไม่ถูกต้อง");
                        }
                    }
                });
            }

            if (guestLoginBtn) {
                guestLoginBtn.addEventListener('click', () => {
                    const guestName = prompt("กรอกชื่อผู้ใช้ของคุณ (Guest Name):", "Guest_" + Math.floor(1000 + Math.random() * 9000));
                    if (!guestName) return;

                    const newIdentity = {
                        name: guestName.substring(0, 20),
                        province: 'Bangkok',
                        ID: Math.floor(100000 + Math.random() * 900000).toString(),
                        isTemporary: true
                    };
                    StateManager.save('userIdentity', newIdentity);

                    if (window.electronAPI && window.electronAPI.saveGuestIdentity) {
                        window.electronAPI.saveGuestIdentity(newIdentity);
                    }

                    this.sendAnonymousTelemetry(newIdentity);

                    statusEl.textContent = '✅ ยินดีต้อนรับเข้าใช้งาน!';
                    setTimeout(() => {
                        document.getElementById('login-overlay').style.display = 'none';
                    }, 800);
                });
            }

            if (enterProgramBtn) {
                enterProgramBtn.addEventListener('click', async () => {
                    if (window.electronAPI) {
                        statusEl.textContent = '🚀 กำลังเข้าสู่โปรแกรม...';
                        await window.electronAPI.enterProgram();
                    }
                    document.getElementById('login-overlay').style.display = 'none';
                });
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    if (window.electronAPI) {
                        statusEl.textContent = '🚪 กำลังออกจากระบบ...';
                        await window.electronAPI.logout();
                        this.checkSession();
                    } else {
                        StateManager.remove('userIdentity');
                        window.location.reload();
                    }
                });
            }
        },

        async sendAnonymousTelemetry(identity) {
            try {
                let cachedLoc = { province: 'Bangkok', gps: '' };
                try {
                    const res = await fetch('https://ipinfo.io/json');
                    const data = await res.json();
                    if (data && data.city) {
                        cachedLoc = { province: data.region || data.city, gps: data.loc || '' };
                    }
                } catch (e) {}

                const payload = {
                    is_anonymous: true,
                    device_id: `WHEEL-ANON-${identity.ID}`,
                    machine_name: identity.name,
                    product_id: 'prog-7',
                    location: cachedLoc.province,
                    gps: cachedLoc.gps,
                    usage_minutes: 1,
                    version: '2.3.0'
                };

                fetch('https://jamornz.com/api/check_auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(() => {});
            } catch (e) {}
        }
    };

    // --- MAIN ROUTER ---
    if (page === 'Control Panel') {
        ControlsManager.init();
        LoginManager.init();
    } else if (['Wheels Display', 'Grouping Display', 'Winner Display', 'Tournament Display'].includes(page)) {
        GraphicsManager.init();
    }
});