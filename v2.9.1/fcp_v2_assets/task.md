# Task: Firebase & UI Improvements

## Firebase Changes
- [x] Remove `last_seen` from `com_` presence data
- [x] Remove `created` and `hostPeerId` from `mobile_` room data
- [x] Stop auto-creating Firebase data on page load — only create on Start press
- [x] On refresh: cleanup stale `com_` and `mobile_` entries
- [x] Update `OBSScorePhone.html` to connect using `roomID` directly
- [x] Update FIREBASE_GUIDELINE.md

## QR Code Fix
- [x] Fix QR code to use QRCode library with API fallback

## UI: Mobile Control Popup (PC side)
- [x] Room Name: remove copy button, plain input only
- [x] QR Code page: add Room Name display
- [x] Fix duplicate close buttons — removed broken circular one

## Mobile Client (OBSScorePhone.html)
- [x] Fix OBS Control buttons (Save Replay, Scene Replay, Main Scene) — all kept and functional
- [x] Fix `triggerAction` case-insensitive comparison
- [x] Fix `loadmatch` command handler name

## Consolidation
- [x] Room ID container and Close Room button shown properly on room creation
