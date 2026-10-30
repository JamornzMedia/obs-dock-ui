# 🏐 Volleyball Module — Integration Guide

## Files Created

| File | Location | Purpose |
|------|----------|---------|
| `volleyball_score.html` | `/v2.9.5.2/` | OBS Browser Source overlay |
| `volleyball_module.js` | `/v2.9.5.2/fcp_v2_assets/` | Auto-injects Manager card into FCP |

---

## Step 1: Inject the Module Script

Open `Football-Control-Panel-V.2.html` and add this **one line** just before `</body>`:

```html
<!-- ══ Volleyball Module Add-on ══ -->
<script src="fcp_v2_assets/volleyball_module.js"></script>
```

> ⚠️ Do NOT add `type="module"`. The module uses an IIFE and must load after `main.js`.

---

## Step 2: OBS Browser Source Setup

1. **Add Source → Browser Source**
2. Check ✅ **Local file** → Browse to `volleyball_score.html`
3. **Width**: `560` · **Height**: `180`
4. Place it at the **bottom-center** of your scene

---

## Step 3: Card Controls

| Button/Input | Action |
|---|---|
| 🏁 **Finish Set** | Saves [scoreA, scoreB] to history → awards set to winner (score2+1) → resets score to 0 |
| 🔄 **Reset All Sets** | Clears history + match score (score2) + current score |
| 🎯 **Set Point Limit** | Changes overlay PT badge (default 25, use 15 for tie-break) |

---

## Data Mapping

```
masterTeamA.score   ──► Current Set Pts A   (displayed large in overlay)
masterTeamB.score   ──► Current Set Pts B
masterTeamA.score2  ──► Sets Won A           (shown as gold dots)
masterTeamB.score2  ──► Sets Won B
setHistory          ──► History table rows   (archived per set)
```

## localStorage Keys (new, no conflicts)

| Key | Content |
|-----|---------|
| `vb_state` | Full state JSON (overlay fallback on reload) |
| `vb_set_history` | `[[25,22],[18,25],...]` |
| `vb_set_limit` | `"25"` |

---

## Debugging (browser console in FCP)

```js
window.vbModule.getState()    // current broadcast state
window.vbModule.getHistory()  // set history array
window.vbModule.finishSet()   // trigger finish set manually
```
