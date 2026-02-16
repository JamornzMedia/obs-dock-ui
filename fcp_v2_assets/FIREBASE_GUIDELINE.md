# Firebase Data Structure Guideline

> 📋 เอกสารแนวทางการจัดเก็บข้อมูลใน Firebase สำหรับระบบ OBSScore Control Panel  
> เพื่อใช้อ้างอิงในการพัฒนาและแก้ไขในอนาคต

---

## โครงสร้างข้อมูลหลัก (Firebase Realtime Database)

```
obs_rooms_score/
├── com_{nameID}/          # PC User Presence
│   ├── name: string       # ชื่อผู้ใช้
│   ├── platform: "PC"     # แพลตฟอร์ม
│   ├── province: string   # จังหวัด
│   └── ID: string         # 8-digit unique ID
│
└── mobile_{nameID}/       # Mobile Control Room
    ├── nameMobile: string # ชื่อห้อง
    ├── platform: "Mobile" # แพลตฟอร์ม
    ├── ID: string         # 8-digit ID (same as com_)
    ├── roomID: string     # 6-digit connection ID
    └── Mobile: "off"|"on" # สถานะการเชื่อมต่อ
```

---

## 1. PC User Presence (`com_{nameID}`)

### จุดประสงค์
- แสดงผู้ใช้ที่กำลังเปิดโปรแกรมอยู่ (PC)
- ใช้สำหรับแสดงใน Online Users list

### การสร้าง
**เมื่อ**: กดปุ่ม "Start" ในหน้า Welcome Screen  
**ไฟล์**: `main.js` → Welcome Start button → `window.initOnlinePresenceSystem()`  
**ซอร์ส**: `remote.js` → `initOnlinePresenceSystem()` (line 37)

### ข้อมูลที่เก็บ
| Field | Type | ค่า | คำอธิบาย |
|-------|------|-----|----------|
| `name` | string | ชื่อที่กรอกในหน้า Welcome | สูงสุด 30 ตัวอักษร |
| `platform` | string | `"PC"` | ระบุว่าเป็น PC |
| `province` | string | จังหวัดที่เลือก | จาก dropdown หรือ custom |
| `ID` | string | 8-digit random | สุ่มเมื่อกด Start |

### Key Naming
```javascript
const sanitizedName = sanitizeKey(identity.name); // เอาตัวอักษรพิเศษออก
const roomKey = `com_${sanitizedName}`;
// ตัวอย่าง: "com_JamornzMedia"
```

### Lifecycle
- **Create**: เมื่อกด Start button → `initOnlinePresenceSystem()`
- **Delete**: อัตโนมัติเมื่อปิด browser (Firebase `onDisconnect().remove()`)

---

## 2. Mobile Control Room (`mobile_{nameID}`)

### จุดประสงค์
- เก็บข้อมูลห้องสำหรับควบคุมผ่านมือถือ
- ใช้ `ID` เดียวกับ `com_` เพื่อเชื่อมโยงว่าเป็นคนเดียวกัน
- เก็บ `roomID` 6 หลัก สำหรับมือถือเชื่อมต่อ

### การสร้าง
**เมื่อ**: กดปุ่ม "Create Room" ใน Mobile Control popup  
**ไฟล์**: `main.js` → `createRoomBtn` handler → `setupMobileRoomLogic()` → `initMobileHost()`  
**ตำแหน่ง**: `main.js` line ~2326 (`initMobileHost`)

### ⚠️ roomID สุ่มใหม่ทุกครั้ง
```javascript
// setupMobileRoomLogic() — line 2302
const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
// ★ ไม่ cache ใน localStorage — สุ่มใหม่ทุกครั้งเพื่อป้องกัน ID collision
```

### ข้อมูลที่เก็บ
| Field | Type | ค่า | คำอธิบาย |
|-------|------|-----|----------|
| `nameMobile` | string | `userIdentity.name` | ชื่อเจ้าของห้อง |
| `platform` | string | `"Mobile"` | ระบุว่าเป็น Mobile room |
| `ID` | string | 8-digit (same as com_) | **ใช้ ID เดียวกับ com_ เพื่อจับคู่** |
| `roomID` | string | 6-digit random | ID สำหรับมือถือพิมพ์เชื่อมต่อ |
| `Mobile` | string | `"off"` → `"on"` | สถานะการเชื่อมต่อ |

### Key Naming
```javascript
const sanitizedName = sanitizeKey(userIdentity.name);
const roomKey = `mobile_${sanitizedName}`;
// ตัวอย่าง: "mobile_JamornzMedia"
```

### Lifecycle
- **Create**: กด Create Room → `initMobileHost()` → `firebase.set(roomData)`
- **Update Mobile field**: 
  - `"off"` → `"on"` เมื่อมือถือเชื่อมต่อ (`OBSScorePhone.html` → `setupPresence()`)
  - `"on"` → `"off"` เมื่อมือถือ disconnect (`onDisconnect().set('off')`)
- **Delete**: กด Close Room → `firebase.remove()` หรือ ปิดโปรแกรม → `onDisconnect().remove()`

---

## 3. ความสัมพันธ์ระหว่าง com_ และ mobile_

### การจับคู่ (Matching Logic)

```
com_JamornzMedia          mobile_JamornzMedia
├── ID: "12345678"   ←──┐  ├── ID: "12345678"
├── name: "Jamornz"     └──┼── nameMobile: "Jamornz"
└── platform: "PC"         ├── roomID: "654321"
                           └── Mobile: "on"
```

**กฎการจับคู่**:
1. เปรียบเทียบ `ID` field (8-digit)
2. ถ้า `com_.ID === mobile_.ID` → เป็นคนเดียวกัน
3. แสดงใน Online Users:
   - ถ้า `Mobile === "off"` → แสดงแค่ PC icon
   - ถ้า `Mobile === "on"` → แสดง PC icon + Phone icon

---

## 4. Flow การทำงาน

### 4.1 PC User เข้าระบบ

```
เปิดโปรแกรม → Welcome Screen → กรอกชื่อ + จังหวัด → กด Start
    │
    ├─ สุ่ม ID 8 หลัก
    ├─ เก็บ identity ใน localStorage + window.userIdentity + module-level userIdentity
    └─ เรียก initOnlinePresenceSystem()
       └─ สร้าง com_{nameID} ใน Firebase
          └─ onDisconnect().remove()
```

**Code**: `main.js` line ~1896 (Start button) → `remote.js` line 37 (`initOnlinePresenceSystem`)

### 4.2 สร้างห้อง Mobile Control

```
กด Mobile Control → Popup → กด Create Room
    │
    ├─ Save OBS Scene Names → localStorage
    ├─ Switch UI: Create → Connection
    │
    ▼
setupMobileRoomLogic()              ← line 2302
    ├─ Sync userIdentity (module ↔ window)
    ├─ Fallback: ใช้ Room Name input
    └─ สุ่ม roomID 6 หลัก → initMobileHost()
        │
        ├─ อัปเดต UI (Room ID, QR, Link)
        ├─ Firebase: set mobile_{name} → { nameMobile, platform, ID, roomID, Mobile:"off" }
        ├─ Firebase: onDisconnect().remove()
        └─ PeerJS: new Peer("fcp-v2-host-{roomId}")
```

### 4.3 มือถือเชื่อมต่อ

```
เปิด OBSScorePhone.html → กรอก Room ID 6 หลัก → กด Connect
    │
    ▼
connectToRoom()                     ← OBSScorePhone.html line 313
    ├─ Firebase: ค้นหา mobile_* ที่มี roomID ตรงกัน
    ├─ แสดง nameMobile
    ├─ สร้าง PeerJS ID: "fcp-v2-host-{roomId}"
    └─ startPeerConnection()
       ├─ peer = new Peer(config)
       ├─ conn = peer.connect(hostPeerId)
       ├─ conn.on('open') → ซ่อน login, แสดง main UI
       ├─ conn.send({ type: 'requestState' })
       └─ setupPresence() → Mobile: "off" → "on"
           └─ onDisconnect → "off"
```

### 4.4 ปิดห้อง

```
กด Close Room
    │
    ├─ hostPeer.destroy()
    ├─ Firebase: mobile_{name}.remove()
    ├─ Reset UI: Connection → Create
    └─ showToast("Room Closed")
```

**Code**: `main.js` line ~2062 (closeRoomBtn handler)

---

## 5. Online Users Display Logic

```javascript
// remote.js → allRoomsRef.on('value')
for each key in obs_rooms_score:
    if key.startsWith('com_'):
        pcCount++
    if key.startsWith('mobile_') && room.Mobile === 'on':
        phoneCount++

// renderOnlineUsersList()
for each com_ room:
    find mobile_ room where mobile_.ID === com_.ID
    show PC icon
    if matched mobile_.Mobile === 'on':
        show Phone icon too
```

| Condition | PC Icon | Phone Icon |
|-----------|---------|------------|
| มี com_ อย่างเดียว | ✅ | ❌ |
| มี com_ + mobile_ (Mobile: "off") | ✅ | ❌ |
| มี com_ + mobile_ (Mobile: "on") | ✅ | ✅ |

**Code**: `remote.js` → `renderOnlineUsersList()` (line 149)

---

## 6. Stale Entry Cleanup

เมื่อรีเฟรชหน้า, ระบบจะลบ entry เก่าก่อน:

```javascript
// remote.js → cleanupStaleEntries()
// ลบ com_{name} และ mobile_{name} เก่าที่ค้างอยู่
firebase.database().ref(`obs_rooms_score/com_{name}`).remove();
firebase.database().ref(`obs_rooms_score/mobile_{name}`).remove();
```

เรียกอัตโนมัติเมื่อ `window.load` (delay 500ms)

---

## 7. ตัวอย่างข้อมูลจริงใน Firebase

```json
{
  "obs_rooms_score": {
    "com_JamornzMedia": {
      "name": "JamornzMedia",
      "platform": "PC",
      "province": "กรุงเทพมหานคร",
      "ID": "87654321"
    },
    "mobile_JamornzMedia": {
      "nameMobile": "JamornzMedia",
      "platform": "Mobile",
      "ID": "87654321",
      "roomID": "123456",
      "Mobile": "on"
    }
  }
}
```

- ✅ `com_` และ `mobile_` มี ID เดียวกัน (`87654321`)
- ✅ Online Users จะแสดง **PC icon + Phone icon**
- ✅ มือถือเชื่อมต่อด้วย roomID `123456`
- ✅ PeerJS ID สร้างจาก roomID: `fcp-v2-host-123456`

---

## 8. จุดสำคัญที่ต้องระวัง

### ⚠️ ID ต้องตรงกัน
- `com_.ID` และ `mobile_.ID` **ต้องเป็นค่าเดียวกัน**
- สร้างเมื่อกด Start (8-digit random)
- เก็บใน `window.myUserID` เพื่อใช้ตอนสร้าง mobile room

### ⚠️ Key Naming
- ใช้ `sanitizeKey()` เพื่อลบตัวอักษรพิเศษ
- ห้ามใช้: `.`, `#`, `$`, `[`, `]`, `/`
- `com_` และ `mobile_` ใช้ name เดียวกัน

### ⚠️ Mobile Status
- เริ่มต้น: `"off"` (PC สร้าง)
- เชื่อมต่อ: `"on"` (Mobile set)
- ตัดการเชื่อมต่อ: `"off"` (Firebase onDisconnect)

### ⚠️ roomID ต้องสุ่มใหม่ทุกครั้ง
- **ห้าม cache** roomID ใน localStorage
- สุ่มใหม่ทุกครั้งที่กด Create Room
- เพื่อป้องกัน ID collision ระหว่างผู้ใช้

### ⚠️ userIdentity Sync
- `userIdentity` มี 2 copies: module-level + `window.userIdentity`
- `setupMobileRoomLogic()` จะ sync ทั้ง 2 ก่อนใช้
- Fallback: ถ้าไม่มี identity จะใช้ชื่อจาก Room Name input

---

**อัพเดทล่าสุด**: 16 ก.พ. 2026  
**เวอร์ชัน**: 2.9.1
