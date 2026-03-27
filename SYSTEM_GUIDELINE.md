# 📖 OBSScore Control Panel — System Guideline V2.9.2

> เอกสารสำหรับนักพัฒนา อธิบายโครงสร้างระบบ, Data Flow, และการทำงานของทุกส่วน  
> อัพเดทล่าสุด: 16 ก.พ. 2026

---

## 📂 ไฟล์ในโปรเจค

| ไฟล์ | หน้าที่ |
|------|---------|
| `Football-Control-Panel-V.2.html` | หน้าหลัก PC Control Panel (เปิดใน OBS Dock หรือ Browser) |
| `OBSScorePhone.html` | หน้ามือถือ Remote Control (standalone, ไม่ใช้ module) |
| `fcp_v2_assets/main.js` | Logic ทั้งหมดของ PC (ES Module) |
| `fcp_v2_assets/remote.js` | Firebase Init + Online Presence System |
| `fcp_v2_assets/languages.js` | ข้อมูลภาษา (th/en) |
| `fcp_v2_assets/announcement.txt` | ข้อความประกาศ (ดึงทุก 1 ชม.) |
| `fcp_v2_assets/FIREBASE_GUIDELINE.md` | เอกสาร Firebase Data Structure |
| `fcp_v2_assets/SYSTEM_GUIDELINE.md` | **เอกสารนี้** |

---

## 🏗️ สถาปัตยกรรมระบบ (Architecture Overview)

```
┌──────────────────────────────────────────────────────────────┐
│                    PC (OBS Dock / Browser)                    │
│  Football-Control-Panel-V.2.html                             │
│  ├── main.js (ES Module)                                     │
│  │   ├── OBS WebSocket (obs-websocket-js)                    │
│  │   ├── Scoreboard Logic (score, timer, teams, etc.)        │
│  │   ├── Mobile Host (PeerJS)                                │
│  │   └── UI (settings, popups, keybinds, etc.)               │
│  └── remote.js                                               │
│      ├── Firebase Init                                       │
│      └── Online Presence System                              │
└───────────────┬─────────────────────┬────────────────────────┘
                │ Firebase RTDB       │ PeerJS (WebRTC)
                │ (Presence/Discovery)│ (Commands/State)
                ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                 Mobile (OBSScorePhone.html)                   │
│  ├── Firebase Client (ค้นหาห้องจาก roomID)                    │
│  ├── PeerJS Client (เชื่อมต่อกับ Host)                        │
│  └── Remote UI (score, timer, OBS control, actions)          │
└──────────────────────────────────────────────────────────────┘
```

### การสื่อสาร 2 ช่องทาง

| ช่องทาง | ใช้ทำอะไร | ทิศทาง |
|---------|-----------|--------|
| **Firebase Realtime Database** | ค้นหาห้อง (Room Discovery) + แสดง Online Users | PC → Firebase ← Mobile |
| **PeerJS (WebRTC)** | ส่งคำสั่ง + รับ State Update | Mobile ↔ PC (P2P โดยตรง) |

---

## 🔌 OBS WebSocket Connection

### การเชื่อมต่อ
- **ไฟล์**: `main.js` บรรทัด 125
- **ตัวแปร**: `const obs = new OBSWebSocket()`
- **URL**: `ws://localhost:4455`
- **Timeout**: 2 วินาที (ถ้าไม่ได้จะ continue offline)

### ⚠️ จุดสำคัญ: `obs` vs `window.obs`
- `obs` ประกาศเป็น **module-level constant** (`const obs = new OBSWebSocket()`)
- **ห้ามใช้** `window.obs` — ไม่มีอยู่จริงใน module scope
- ทุกฟังก์ชันที่ต้องใช้ OBS ต้องอ้าง `obs` โดยตรง

### ฟังก์ชัน OBS หลัก

| ฟังก์ชัน | หน้าที่ | OBS Call |
|----------|---------|----------|
| `setText(source, text)` | อัปเดตข้อความ OBS Source | `SetInputSettings` |
| `setImage(sourceName, filename)` | อัปเดตรูป OBS Source | `SetInputSettings` |
| `setSourceColor(sourceName, hexColor)` | เปลี่ยนสี OBS Source | `SetInputSettings` |
| `setSourceVisibility(sourceName, visible)` | ซ่อน/แสดง Source | `SetSceneItemEnabled` |
| `createObsSource(name, type, btn)` | สร้าง Source ใหม่ | `CreateInput` |

---

## ⚽ Scoreboard Logic

### State Variables (module-level)

| ตัวแปร | Type | คำอธิบาย |
|--------|------|----------|
| `masterTeamA` / `masterTeamB` | Object | `{ name, logoFile, score, score2, color1, color2 }` |
| `timer` | int | เวลาปัจจุบัน (วินาที) |
| `interval` | int/null | Timer interval ID (`null` = หยุดอยู่) |
| `half` | string | `"1st"`, `"2nd"`, ... |
| `injuryTime` | int | เวลาทดเจ็บ (นาที) |
| `isCountdown` | bool | นับถอยหลังหรือไม่ |
| `countdownStartTime` | int | เวลาเริ่มนับถอยหลัง (วินาที, default 2700 = 45:00) |
| `maxHalves` | int | จำนวนครึ่งสูงสุด (default 2) |
| `sheetData` | array | ข้อมูลจาก Excel/Google Sheet |
| `userIdentity` | Object/null | `{ name, province, ID }` |

### ฟังก์ชันหลัก

| ฟังก์ชัน | Input | Output | คำอธิบาย |
|----------|-------|--------|----------|
| `updateTeamUI(team, name, logo, color1, color2)` | team='A'/'B', ข้อมูลทีม | อัปเดต UI + OBS Sources | ฟังก์ชันหลักในการอัปเดตทีม |
| `applyMatch()` | อ่านจาก `elements.matchID.value` | โหลดข้อมูลแมตช์จาก `sheetData[]` | ดึง row จาก Excel แล้วเรียก `updateTeamUI` |
| `changeScore(team, delta)` | team='A'/'B', delta=+1/-1 | อัปเดต score + OBS | เปลี่ยนคะแนน |
| `changeScore2(team, delta)` | team='A'/'B', delta=+1/-1 | อัปเดต score2 + OBS | เปลี่ยนคะแนนรอง (fouls/sub) |
| `startTimer()` | - | เริ่ม interval | ใช้ `setInterval` 1 วินาที |
| `stopTimer()` | - | หยุด interval | `clearInterval(interval)` |
| `toggleHalf()` | - | สลับครึ่ง | `1st` → `2nd` → ... (ตาม maxHalves) |
| `swapTeams()` | - | สลับทีม A ↔ B | สลับชื่อ, โลโก้, สี |
| `fullReset()` | - | รีเซ็ททุกอย่าง | คะแนน, เวลา, ครึ่ง, ทีม |

### OBS Source Naming Convention

| Source Name | Type | ข้อมูล |
|-------------|------|--------|
| `score_team_a` | Text | คะแนนทีม A |
| `score_team_b` | Text | คะแนนทีม B |
| `score2_team_a` | Text | คะแนนรอง A |
| `score2_team_b` | Text | คะแนนรอง B |
| `name_team_a` | Text | ชื่อทีม A |
| `name_team_b` | Text | ชื่อทีม B |
| `logo_team_a` | Image | โลโก้ทีม A |
| `logo_team_b` | Image | โลโก้ทีม B |
| `color_team_a` | Color | สีทีม A (สีหลัก) |
| `color_team_b` | Color | สีทีม B (สีหลัก) |
| `color2_team_a` | Color | สีทีม A (สีรอง) |
| `color2_team_b` | Color | สีทีม B (สีรอง) |
| `time_counter` | Text | เวลา (MM:SS) |
| `half_text` | Text | ครึ่ง (1st, 2nd, ...) |
| `injury_time` | Text | เวลาทดเจ็บ |
| `label1` - `label5` | Text | ป้ายข้อความ (จาก Excel) |

---

## 📱 Mobile Remote Control System

### 🔑 ระบบ Identity

```
userIdentity = {
    name: "JamornzMedia",     // ชื่อผู้ใช้
    province: "กรุงเทพมหานคร", // จังหวัด
    ID: "87654321"             // 8-digit random (สุ่มเมื่อกด Start)
}
```

**⚠️ จุดสำคัญ**: `userIdentity` มี 2 ตัวแปร:
1. **Module-level**: `let userIdentity = ...` (line 65) — ใช้ใน functions ภายใน main.js
2. **Window-level**: `window.userIdentity` (line 66) — ใช้ใน remote.js และข้าม module

**ทั้ง 2 ตัวต้อง sync กัน** — ทุกจุดที่เซ็ต userIdentity ต้องเซ็ตทั้ง 2 ตัว

### 📲 Flow: สร้างห้อง Mobile Control

```
กด Mobile Control Button
    │
    ▼
openMobileControlPopup()          ← แสดง Popup, pre-fill ชื่อจาก userIdentity
    │
    ▼
กรอกชื่อห้อง + กด Create Room
    │
    ├─ Save OBS Scene Names       ← เก็บลง localStorage
    ├─ Switch UI (Create → QR)    ← ซ่อน Create UI, แสดง Connection UI
    │
    ▼
window.setupMobileRoomLogic()     ← (line 2302)
    │
    ├─ Sync userIdentity          ← ดึงจาก window.userIdentity ถ้า module-level เป็น null
    ├─ Fallback: ใช้ Room Name    ← ถ้าไม่มี identity, สร้างจากชื่อในช่อง input
    │
    ▼
สุ่ม roomID 6 หลัก
    │
    ▼
window.initMobileHost(roomId)     ← (line 2326)
    │
    ├─ แสดง Room ID ใน UI
    ├─ สร้าง QR Code (window.QRCode หรือ API fallback)
    ├─ สร้าง Link: {baseUrl}/OBSScorePhone.html?room={roomId}
    ├─ เขียน Firebase: mobile_{sanitizedName}
    │   └─ { nameMobile, platform:"Mobile", ID, roomID, Mobile:"off" }
    ├─ สร้าง PeerJS Host: peerId = "fcp-v2-host-{roomId}"
    └─ รอ Mobile เชื่อมต่อ
```

### 📲 Flow: มือถือเชื่อมต่อ (OBSScorePhone.html)

```
เปิด OBSScorePhone.html (จาก QR/Link หรือกรอก ID)
    │
    ▼
กรอก Room ID 6 หลัก → กด Connect
    │
    ▼
connectToRoom()
    │
    ├─ ค้นหาใน Firebase: obs_rooms_score/mobile_* ที่มี roomID ตรงกัน
    ├─ ถ้าเจอ:
    │   ├─ แสดง nameMobile
    │   ├─ สร้าง PeerJS ID: "fcp-v2-host-{roomId}"
    │   └─ เชื่อมต่อ PeerJS → Host
    │
    ▼
startPeerConnection(rid, hostPeerId)
    │
    ├─ สร้าง Peer client (random ID)
    ├─ conn = peer.connect(hostPeerId)
    │
    ▼
conn.on('open')
    │
    ├─ ซ่อน Login Screen, แสดง Main UI
    ├─ ส่ง { type: 'requestState' } ไป Host
    │
    ▼
setupPresence(rid, roomKey)
    │
    └─ อัปเดต Firebase: mobile_.../Mobile = "on"
       └─ onDisconnect → "off"
```

---

## 📡 PeerJS Command Protocol

### Mobile → PC (Commands)

ทุก command ส่งเป็น JSON object ผ่าน `conn.send(data)`:

| type | fields | คำอธิบาย | handler ใน PC |
|------|--------|----------|---------------|
| `score` | `{ team, delta, isSub }` | เปลี่ยนคะแนน | `changeScore()` / `changeScore2()` |
| `timer` | `{ action: 'playpause'/'reset'/'half' }` | ควบคุมเวลา | `startTimer()`/`stopTimer()`/`resetToZero()`/`toggleHalf()` |
| `obs` | `{ action: 'saveReplay' }` | บันทึก Replay | `obs.call('SaveReplayBuffer')` |
| `obs` | `{ action: 'scene', name: 'MainScene'/'SceneReplay' }` | เปลี่ยนฉาก | `obs.call('SetCurrentProgramScene')` |
| `updateTeam` | `{ team, name, color1, color2 }` | อัปเดตทีม | `updateTeamUI()` |
| `actionBtn` | `{ index }` | กดปุ่ม Action (1-based) | `triggerAction(index)` |
| `loadMatch` | `{ val }` | โหลดแมตช์ | `applyMatch()` |
| `requestState` | (ไม่มี field เพิ่ม) | ขอ state ปัจจุบัน | `broadcastToMobile()` |

### PC → Mobile (State Update)

ส่งหลังทุก command (delay 200ms) + เมื่อ mobile เชื่อมต่อ (delay 500ms):

```javascript
{
    type: 'stateUpdate',
    matchId: "1",
    teamA: { name, score, score2, color, color2 },
    teamB: { name, score, score2, color, color2 },
    timer: "00:00",
    half: "1st",
    injury: "+0",
    isPaused: true/false,
    actions: [{ name: "Action 1", index: 1 }, ...]
}
```

**⚠️ จุดสำคัญ**: 
- Mobile ใช้ `color` (ไม่ใช่ `color1`) → PC ต้องส่ง `color: masterTeamA.color1`
- `broadcastToMobile()` จะส่งไปทุก connection ที่เปิดอยู่

### handleMobileCommand Flow (PC Side)

```
ได้รับ data จาก Mobile
    │
    ▼
handleMobileCommand(data)          ← (line 2486)
    │
    ├─ type='score' → changeScore() / changeScore2()
    ├─ type='timer' → startTimer/stopTimer/resetToZero/toggleHalf
    ├─ type='obs'   → obs.call(...) ← ใช้ `obs` ตรงๆ ไม่ใช่ window.obs
    │   ├─ 'saveReplay' → SaveReplayBuffer
    │   └─ 'scene' → SetCurrentProgramScene (map ชื่อจาก localStorage)
    ├─ type='updateteam' → updateTeamUI()
    ├─ type='actionbtn'  → triggerAction(index)
    ├─ type='loadmatch'  → set matchID.value + applyMatch()
    └─ type='requeststate' → broadcastToMobile() + return early
    │
    ▼
setTimeout(broadcastToMobile, 200)  ← ส่ง state กลับทุก command (ยกเว้น requeststate)
```

---

## 🔥 Firebase Data Structure

ดูรายละเอียดเพิ่มเติมใน [`FIREBASE_GUIDELINE.md`](./FIREBASE_GUIDELINE.md)

### สรุปย่อ

```
obs_rooms_score/
├── com_{nameID}/          # PC User Presence
│   ├── name, platform:"PC", province, ID (8-digit)
│
└── mobile_{nameID}/       # Mobile Control Room
    ├── nameMobile, platform:"Mobile", ID (8-digit same as com_)
    ├── roomID (6-digit), Mobile: "off"/"on"
```

### จุดที่เขียน Firebase

| จุด | ไฟล์ | เมื่อไหร่ |
|-----|------|-----------|
| `com_{name}` สร้าง | `remote.js` → `initOnlinePresenceSystem()` | กด Start ใน Welcome Screen |
| `mobile_{name}` สร้าง | `main.js` → `initMobileHost()` | กด Create Room |
| `mobile_{name}` ลบ | `main.js` → closeRoomBtn handler | กด Close Room |
| `Mobile: "on"` | `OBSScorePhone.html` → `setupPresence()` | มือถือเชื่อมต่อสำเร็จ |
| `Mobile: "off"` | `OBSScorePhone.html` → onDisconnect | มือถือ disconnect |

---

## 💾 localStorage Keys

| Key | Type | คำอธิบาย |
|-----|------|----------|
| `userIdentity` | JSON | `{ name, province, ID }` |
| `scoreboardLang` | string | `"th"` / `"en"` |
| `countdownStartTime` | int | เวลาเริ่มนับถอยหลัก (วินาที) |
| `logoFolderPath` | string | path โฟลเดอร์โลโก้ |
| `dataSourceMode` | string | `"excel"` / `"gsheet"` |
| `googleSheetUrl` | string | URL Google Sheet |
| `teamColorMemory` | JSON | สีทีมที่จำไว้ |
| `cardVisibility` | JSON | การมองเห็นของ cards |
| `customKeybinds` | JSON | Keybinds ที่กำหนดเอง |
| `actionButtonSettings` | JSON | ตั้งค่าปุ่ม Action (6 ปุ่ม) |
| `logoDataCache` | JSON | cache โลโก้เป็น base64 |
| `detailsText` | string | template ข้อความ copy |
| `maxHalves` | int | จำนวนครึ่งสูงสุด |
| `colorCount` | int | จำนวนสีที่แสดง |
| `obsMainSceneName` | string | ชื่อ OBS Main Scene |
| `obsReplaySceneName` | string | ชื่อ OBS Replay Scene |

---

## ⌨️ Keybinds System

- เก็บใน localStorage key `customKeybinds`
- Format: `{ "scoreA_plus": "Ctrl+ArrowUp", ... }`
- รองรับ: `Ctrl`, `Alt`, `Shift` + key ใดก็ได้
- Actions ที่รองรับ: `scoreA_plus/minus`, `scoreB_plus/minus`, `score2A_plus/minus`, `score2B_plus/minus`, `timer_playpause`, `timer_resetstart`, `timer_togglehalf`, `full_reset`

---

## 🎬 Action Buttons System

- 6 ปุ่ม (configurable)
- เก็บใน localStorage key `actionButtonSettings`
- ทุกปุ่มมี: `name`, `backgroundColor`, `height`, `targetSource`, `actionType`
- **Action Types**: `Toggle`, `Show`, `Hide`, `Scene`
  - `Toggle/Show/Hide` → เปลี่ยน visibility ของ OBS Source ใน current scene
  - `Scene` → เปลี่ยน OBS Scene ทั้งหมด
- ฟังก์ชัน: `triggerAction(index)` (line 2585) — index เป็น 1-based

---

## 📊 Data Source System (Excel / Google Sheet)

### Excel Mode
- ผู้ใช้โหลดไฟล์ `.xlsx` / `.csv`
- Parse ด้วย `handleExcel()` → เก็บใน `sheetData[]`
- Column order: `MatchID, LogoA, TeamA, LogoB, TeamB, label1-5`

### Google Sheet Mode
- ผู้ใช้วาง URL → ดึงข้อมูลผ่าน CORS proxy
- Parse ด้วย `fetchGoogleSheet()` → เก็บใน `sheetData[]`

### applyMatch()
- อ่าน `matchID` จาก input
- ดึง row จาก `sheetData[matchID - 1]`
- เรียก `updateTeamUI()` สำหรับทั้ง 2 ทีม

---

## 🌐 Online Users System

- **ไฟล์**: `remote.js`
- **Firebase Path**: `obs_rooms_score/`
- **การนับ**:
  - PC users: นับ key ที่ขึ้นต้นด้วย `com_`
  - Phone users: นับ key `mobile_` ที่ `Mobile === "on"`
- **การแสดง**: Popup table จับคู่ `com_` กับ `mobile_` ด้วย `ID` field

---

## ⚠️ จุดที่ต้องระวังในการพัฒนา

### 1. Module Scope vs Window Scope
- `main.js` ถูกโหลดเป็น ES Module (`type="module"`)
- ตัวแปรใน module ไม่ assign ไปที่ `window` อัตโนมัติ
- ต้อง `window.xxx = xxx` เพื่อให้เข้าถึงจากภายนอก
- **ตัวอย่าง**: `obs` อยู่ใน module scope → ใช้ `obs` ตรงๆ, ไม่ใช่ `window.obs`

### 2. userIdentity ต้อง Sync
- ทุกจุดที่เซ็ต `userIdentity` ต้องเซ็ตทั้ง module-level และ `window.userIdentity`
- จุดที่เซ็ต: Welcome Screen Start button, `saveAndEnterApp()`, `setupMobileRoomLogic()` (fallback)

### 3. PeerJS ID Convention
- Host (PC): `fcp-v2-host-{6-digit-roomId}`
- Client (Mobile): random (PeerJS auto-generate)
- **roomId ต้องสุ่มใหม่ทุกครั้ง** ที่กด Create Room (ไม่ cache)

### 4. Firebase Key Sanitization
```javascript
sanitizeKey(name) → name.trim().replace(/[.#$\[\]\/]/g, '').replace(/\s+/g, '_').substring(0, 30)
```
- ห้ามมีตัวอักษร: `. # $ [ ] /`
- แทนที่ช่องว่างด้วย `_`
- จำกัด 30 ตัวอักษร

### 5. OBS Scene Name Mapping
- มือถือส่ง generic name: `"MainScene"` / `"SceneReplay"`
- PC map ไปชื่อจริงจาก localStorage: `obsMainSceneName` / `obsReplaySceneName`
- Default: `"MainScene"` / `"SceneReplay"`

### 6. broadcastToMobile Timing
- เรียกหลังทุก command: `setTimeout(broadcastToMobile, 200)`
- เรียกเมื่อ mobile เชื่อมต่อใหม่: `setTimeout(broadcastToMobile, 500)`
- `requeststate` return early (ไม่ซ้ำซ้อน)

---

**เวอร์ชัน**: 2.9.2  
**ผู้พัฒนา**: JamornzMedia
