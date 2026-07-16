// ═══════════════════════════════════════════════════════════════════════
//  display_table_module.js  —  Excel/GSheet Display Table OBS Overlay Controller
// ═══════════════════════════════════════════════════════════════════════

const DT_TAB_ID = 'settingsTabDisplayTable';
const DT_BROADCAST_KEY = 'dt_broadcast_data';
const DT_SETTINGS_KEY = 'dt_settings';
const DT_CHANNEL_NAME = 'dt_score_channel';

let dtChannel = null;
try { dtChannel = new BroadcastChannel(DT_CHANNEL_NAME); } catch (_) {}

// Default settings
let dtSettings = {
  columns: {}, // column_name: true/false
  order: 'label1,label2,TeamA,LogoA,Score,LogoB,TeamB',
  bg_color: '#0f172a',
  text_color: '#f8fafc',
  alt_bg_color: '#1e293b',
  border_color: '#334155',
  font_size: '16',
  row_range: '1-10',
  table_title: 'ผลคะแนน',
  show_header: true,
  score_bg_color: '#f59e0b',
  score_text_color: '#000000',
  show_control_panel: false,
  sheet_tab_index: 1
};

// Load settings
function loadSettings() {
  try {
    const saved = localStorage.getItem(DT_SETTINGS_KEY);
    if (saved) dtSettings = { ...dtSettings, ...JSON.parse(saved) };
  } catch (_) {}
}

function getDisplayTableSheetData() {
  if (window.currentWorkbook) {
    const workbook = window.currentWorkbook;
    const tabIndex = parseInt(dtSettings.sheet_tab_index || 1);
    const sheetIndex = Math.max(0, Math.min(tabIndex - 1, workbook.SheetNames.length - 1));
    const sheetName = workbook.SheetNames[sheetIndex];
    if (sheetName) {
      return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    }
  }
  return window.getSheetData ? window.getSheetData() : [];
}

function saveSettings() {
  localStorage.setItem(DT_SETTINGS_KEY, JSON.stringify(dtSettings));
  updateMainControlPanelVisibility();
}

function getVbState(k, def) {
  return localStorage.getItem(k) || def;
}

// Inject Settings Tab
function injectDisplayTableTab() {
  if (document.getElementById(DT_TAB_ID)) return;
  // Sortable Styles Injection
  if (!document.getElementById('dt-sortable-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'dt-sortable-styles';
    styleEl.textContent = `
      .dt-sortable-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #cbd5e1;
        background: rgba(255,255,255,0.04);
        padding: 8px 12px;
        border-radius: 6px;
        cursor: grab;
        border: 1px solid rgba(255,255,255,0.06);
        user-select: none;
        transition: background 0.2s, border 0.2s;
        margin-bottom: 4px;
      }
      .dt-sortable-item:active {
        cursor: grabbing;
      }
      .dt-sortable-item.over {
        border: 1px dashed #22c55e;
        background: rgba(34,197,94,0.1);
      }
    `;
    document.head.appendChild(styleEl);
  }


  const tabsContainer = document.getElementById('settingsTabs');
  if (!tabsContainer) {
    setTimeout(injectDisplayTableTab, 1000);
    return;
  }

  // Create Tab Button
  const tabBtn = document.createElement('button');
  tabBtn.className = 'settings-tab-btn';
  tabBtn.setAttribute('data-tab', DT_TAB_ID);
  tabBtn.innerHTML = '📊 Table';
  tabBtn.style.color = '#22c55e';
  tabsContainer.appendChild(tabBtn);

  tabBtn.addEventListener('click', () => {
    if (window.switchSettingsTab) window.switchSettingsTab(DT_TAB_ID);
    renderDynamicColumns();
  });

  // Load configuration
  loadSettings();

  // Create Content Panel
  const panel = document.createElement('div');
  panel.className = 'settings-tab-content';
  panel.id = DT_TAB_ID;
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <h4 style="margin:0;font-size:1rem;display:flex;align-items:center;gap:8px;">
        <span>📊</span> Display Table Settings
      </h4>
    </div>

    <!-- Info Notice -->
    <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);color:#4ade80;border-radius:8px;padding:10px;font-size:0.8rem;margin-bottom:14px;line-height:1.4;">
      ดึงข้อมูลตารางคะแนนจาก Excel หรือ Google Sheets ที่โหลดไว้แล้ว และส่งออกไปยังหน้าจอโอเวอร์เลย์ OBS ที่ออกแบบมาอย่างสวยงาม
    </div>

    <!-- Show Control Panel toggle -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;margin-bottom:14px;border:1px solid rgba(255,255,255,0.06);">
      <div>
        <div style="font-size:.9rem;font-weight:600;color:#e2e8f0;">แสดงแผงควบคุมบนหน้าหลัก / Show Control Panel</div>
        <div style="font-size:.75rem;color:#64748b;margin-top:2px;">แสดงป้ายควบคุมเฉพาะตัวกรองแถว (MatchID) ไว้ที่หน้าหลักใต้กลุ่มเวลา</div>
      </div>
      <label class="container-toggle" style="display:flex;align-items:center;cursor:pointer;margin:0;">
        <div class="toggle-switch">
          <input type="checkbox" id="dt-show-control-panel" ${dtSettings.show_control_panel ? 'checked' : ''}>
          <span class="slider"></span>
        </div>
      </label>
    </div>

    <!-- Row Filters -->
    <div style="margin-bottom:14px;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:.85rem;font-weight:600;color:#cbd5e1;margin-bottom:8px;">🔍 Row Filters / กรองแถว (MatchID)</div>
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
        <span style="font-size:12px;color:#94a3b8;">MatchID Range:</span>
        <input type="text" id="dt-row-range" value="${dtSettings.row_range}" placeholder="e.g. 1-10" style="flex:1;padding:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:12px;">
      </div>
      <button id="dt-confirm-btn"
        style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;border:none;border-radius:8px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px rgba(34,197,94,0.3);">
        🚀 Confirm & Broadcast Table
      </button>
    </div>

    <!-- Sheet Tab Index Selection -->
    <div style="margin-bottom:14px;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:.85rem;font-weight:600;color:#cbd5e1;margin-bottom:8px;">📄 Select Sheet Tab / เลือกชีทข้อมูล</div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span style="font-size:12px;color:#94a3b8;">Sheet Tab Index (ลำดับชีท):</span>
        <input type="number" id="dt-sheet-tab-index" value="${dtSettings.sheet_tab_index || 1}" min="1" style="width:70px;padding:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:12px;text-align:center;">
        <span style="font-size:11px;color:#64748b;">(เช่น 1 คือชีทแรก, 2 คือชีทสอง)</span>
      </div>
    </div>

    <!-- Columns Config -->
    <div style="margin-bottom:14px;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:.85rem;font-weight:600;color:#cbd5e1;margin-bottom:6px;">📋 Columns Selection / เลือกคอลัมน์</div>
      <div id="dt-columns-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;max-height:120px;overflow-y:auto;padding:4px;background:rgba(0,0,0,0.15);border-radius:6px;">
        <span style="font-size:11px;color:#64748b;">(ยังไม่ได้โหลดข้อมูลจากสเปรดชีต)</span>
      </div>


    </div>

    <!-- Table Colors & Header styling -->
    <div style="margin-bottom: 14px; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
      <div style="font-size: .85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 8px;">🎨 Custom Table & Header / ตารางและหัวข้อ</div>
      
      <!-- Header Settings -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; font-size: 12px; color: #cbd5e1; margin-bottom: 10px; align-items: flex-end;">
        <div>
          <span style="display:block;margin-bottom:2px;">Table Title / ชื่อหัวตาราง</span>
          <input type="text" id="dt-table-title" value="${dtSettings.table_title || 'ผลคะแนน'}" style="width:100%;padding:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:12px;">
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:4px;">
          <span style="display:block;margin-bottom:6px;font-size:11px;">Show Header</span>
          <label class="container-toggle" style="display:flex;align-items:center;cursor:pointer;margin:0;">
            <div class="toggle-switch">
              <input type="checkbox" id="dt-show-header" ${dtSettings.show_header !== false ? 'checked' : ''}>
              <span class="slider"></span>
            </div>
          </label>
        </div>
      </div>

      <!-- Colors Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #cbd5e1;">
        <div>
          <span style="display:block;margin-bottom:2px;">Background BG</span>
          <input type="color" id="dt-color-bg" value="${dtSettings.bg_color}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Text Color</span>
          <input type="color" id="dt-color-text" value="${dtSettings.text_color}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Alternating Row BG</span>
          <input type="color" id="dt-color-alt-bg" value="${dtSettings.alt_bg_color}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Border Color</span>
          <input type="color" id="dt-color-border" value="${dtSettings.border_color}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Score Badge BG</span>
          <input type="color" id="dt-color-score-bg" value="${dtSettings.score_bg_color || '#f59e0b'}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;">Score Badge Text</span>
          <input type="color" id="dt-color-score-text" value="${dtSettings.score_text_color || '#000000'}" style="width:100%;height:30px;border:none;border-radius:4px;cursor:pointer;">
        </div>
      </div>
    </div>

    <!-- Fonts Config -->
    <div style="margin-bottom:14px;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:.85rem;font-weight:600;color:#cbd5e1;margin-bottom:8px;">✍️ Typography Settings / แบบอักษร</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <span style="display:block;margin-bottom:2px;font-size:12px;">Font Size (px)</span>
          <input type="number" id="dt-font-size" value="${dtSettings.font_size}" style="width:100%;padding:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:12px;">
        </div>
        <div>
          <span style="display:block;margin-bottom:2px;font-size:12px;">Active Font Family</span>
          <div style="font-size:11px;color:#22c55e;padding:6px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid rgba(255,255,255,0.1);">
            ใช้ตามฟอนต์ที่อัปโหลดไว้
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:12px;">
      <button id="dt-create-obs-btn"
        style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px solid rgba(34,197,94,0.3);border-radius:8px;background:rgba(34,197,94,0.1);color:#4ade80;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s;">
        🎬 Create OBS Browser Source
      </button>
    </div>
  `;

  // Append panel to popup
  const detailsPopup = document.getElementById('detailsPopup');
  if (detailsPopup) {
    const lastTab = [...detailsPopup.querySelectorAll('.settings-tab-content')].pop();
    if (lastTab) lastTab.insertAdjacentElement('afterend', panel);
    else detailsPopup.appendChild(panel);
  }

  // Wire events
  document.getElementById('dt-confirm-btn').addEventListener('click', broadcastTableData);
  document.getElementById('dt-create-obs-btn').addEventListener('click', function() { createTableSource(this); });

  // Input changes
  document.getElementById('dt-row-range').addEventListener('change', e => { dtSettings.row_range = e.target.value; saveSettings(); });

  document.getElementById('dt-sheet-tab-index').addEventListener('change', e => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    dtSettings.sheet_tab_index = val;
    saveSettings();
    renderDynamicColumns();
  });

  document.getElementById('dt-font-size').addEventListener('change', e => { dtSettings.font_size = e.target.value; saveSettings(); });

  document.getElementById('dt-table-title').addEventListener('change', e => { dtSettings.table_title = e.target.value; saveSettings(); });

  document.getElementById('dt-show-header').addEventListener('change', e => { dtSettings.show_header = e.target.checked; saveSettings(); });

  const controlPanelToggle = document.getElementById('dt-show-control-panel');
  if (controlPanelToggle) {
    controlPanelToggle.addEventListener('change', e => {
      dtSettings.show_control_panel = e.target.checked;
      saveSettings();
    });
  }

  const colorPickers = ['dt-color-bg', 'dt-color-text', 'dt-color-alt-bg', 'dt-color-border', 'dt-color-score-bg', 'dt-color-score-text'];
  colorPickers.forEach(id => {
    document.getElementById(id).addEventListener('change', e => {
      const key = id.replace('dt-color-', '').replace('-', '_') + '_color';
      dtSettings[key] = e.target.value;
      saveSettings();
    });
  });

  renderDynamicColumns();
}

// Drag & Drop Handlers
let dragSrcEl = null;

function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.getAttribute('data-col'));
  this.style.opacity = '0.4';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  this.classList.add('over');
}

function handleDragLeave(e) {
  this.classList.remove('over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (dragSrcEl !== this) {
    const draggedCol = e.dataTransfer.getData('text/plain');
    const targetCol = this.getAttribute('data-col');
    
    let orderArray = dtSettings.order.split(',').map(s => s.trim()).filter(Boolean);
    const sheetData = window.getSheetData ? window.getSheetData() : [];
    const header = sheetData[0] || [];
    header.forEach(h => {
      if (!orderArray.includes(h)) orderArray.push(h);
    });
    
    const draggedIdx = orderArray.indexOf(draggedCol);
    const targetIdx = orderArray.indexOf(targetCol);
    
    if (draggedIdx >= 0 && targetIdx >= 0) {
      orderArray.splice(draggedIdx, 1);
      orderArray.splice(targetIdx, 0, draggedCol);
      dtSettings.order = orderArray.join(',');
      saveSettings();
      renderDynamicColumns();
    }
  }
  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1.0';
  const items = document.querySelectorAll('.dt-sortable-item');
  items.forEach(item => {
    item.classList.remove('over');
  });
}

// Generate dynamic sortable checkboxes for columns
function renderDynamicColumns() {
  const container = document.getElementById('dt-columns-list');
  if (!container) return;

  const sheetData = getDisplayTableSheetData();
  if (!sheetData || !sheetData.length) {
    container.innerHTML = '<span style="font-size:11px;color:#64748b;padding:5px;">No sheet data loaded. Please fetch GS or load Excel first.</span>';
    return;
  }

  const header = sheetData[0] || [];
  
  // Parse order
  let orderArray = dtSettings.order.split(',').map(s => s.trim()).filter(Boolean);
  
  // Filter order to only keep columns that exist in the sheet header
  let sortedHeader = orderArray.filter(col => header.includes(col));
  // Append any header columns that are missing from orderArray
  header.forEach(col => {
    if (!sortedHeader.includes(col)) {
      sortedHeader.push(col);
    }
  });

  // Keep setting synchronized
  dtSettings.order = sortedHeader.join(',');
  saveSettings();

  container.innerHTML = '';
  // Force vertical list structure
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '4px';
  container.style.flexWrap = 'nowrap';
  container.style.maxHeight = '240px';
  container.style.overflowY = 'auto';

  sortedHeader.forEach((col, index) => {
    const item = document.createElement('div');
    item.className = 'dt-sortable-item';
    item.setAttribute('draggable', 'true');
    item.setAttribute('data-col', col);

    const isChecked = dtSettings.columns[col] !== false;

    item.innerHTML = `
      <i class="fas fa-bars" style="color: #64748b; cursor: grab; font-size: 11px;"></i>
      <input type="checkbox" data-col="${col}" ${isChecked ? 'checked' : ''} style="cursor:pointer; margin: 0;">
      <span style="flex:1;">${col}</span>
    `;

    // Bind Drag events
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);

    // Bind Checkbox event
    item.querySelector('input').addEventListener('change', e => {
      dtSettings.columns[col] = e.target.checked;
      saveSettings();
    });

    container.appendChild(item);
  });
}

// Process sheetData and broadcast
async function broadcastTableData() {
  // Update file from source if using Google Sheets
  if (localStorage.getItem('dataSourceMode') === 'gsheet' && window.fetchGoogleSheet) {
    try {
      await window.fetchGoogleSheet();
    } catch (e) {
      console.error("Auto-fetch error during broadcast:", e);
    }
  }

  const sheetData = getDisplayTableSheetData();
  if (!sheetData || !sheetData.length) {
    alert('No sheet data loaded to broadcast.');
    return;
  }

  const header = sheetData[0];
  const rows = sheetData.slice(1);

  // Apply row filter (MatchID range)
  let filteredRows = rows;
  const rangeInput = dtSettings.row_range.trim();
  if (rangeInput) {
    const match = rangeInput.match(/^(\d+)-(\d+)$/);
    if (match) {
      const minId = parseInt(match[1]);
      const maxId = parseInt(match[2]);
      // MatchID is usually the first column (index 0)
      filteredRows = rows.filter(r => {
        const idVal = parseInt(r[0]);
        return !isNaN(idVal) && idVal >= minId && idVal <= maxId;
      });
    }
  }

  // Column order mapping
  const orderArray = dtSettings.order.split(',').map(s => s.trim()).filter(Boolean);

  // Build the payload
  const tableData = filteredRows.map(row => {
    const item = {};
    orderArray.forEach(colName => {
      // Check if column is enabled
      if (dtSettings.columns[colName] === false) {
        return; // Skip disabled columns
      }
      const colIdx = header.indexOf(colName);
      if (colIdx >= 0) {
        item[colName] = row[colIdx];
      } else {
        item[colName] = ''; // Empty column if not found
      }
    });
    return item;
  });

  const broadcastPayload = {
    settings: {
      bgColor: dtSettings.bg_color,
      textColor: dtSettings.text_color,
      altBgColor: dtSettings.alt_bg_color,
      borderColor: dtSettings.border_color,
      fontSize: dtSettings.font_size + 'px',
      columnsOrder: orderArray.filter(col => dtSettings.columns[col] !== false),
      fontFamily: localStorage.getItem('vb_custom_font_family') || 'Prompt, sans-serif',
      customFontData: localStorage.getItem('vb_custom_font_data') || '',
      logoCache: JSON.parse(localStorage.getItem('logoDataCache') || '{}'),
      tableTitle: dtSettings.table_title || 'ผลคะแนน',
      showHeader: dtSettings.show_header !== false,
      scoreBgColor: dtSettings.score_bg_color || '#f59e0b',
      scoreTextColor: dtSettings.score_text_color || '#000000'
    },
    data: tableData
  };

  // Save to localStorage
  localStorage.setItem(DT_BROADCAST_KEY, JSON.stringify(broadcastPayload));

  // Send broadcast
  if (dtChannel) {
    dtChannel.postMessage({ type: 'dt_update', payload: broadcastPayload });
  }

  alert(`🚀 Table Broadcasted successfully! (${tableData.length} rows)`);
}

// Create OBS Source for display table
async function createTableSource(btn) {
  const obs = window.fcpOBS;
  if (!obs) {
    alert('❌ OBS not connected — start OBS WebSocket first.');
    return;
  }
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'; }

    const scene = await obs.call('GetCurrentProgramScene');
    const sceneName = scene.currentProgramSceneName;
    const absPath = window.location.href.replace(/\/[^/]*$/, '') + '/display_table.html';

    await obs.call('CreateInput', {
      sceneName,
      inputName: 'Display_Table_Overlay',
      inputKind: 'browser_source',
      inputSettings: {
        url: absPath,
        width: 1920,
        height: 1080,
        css: 'body { background: transparent !important; }',
        shutdown: false,
        reroute_audio: false,
      },
      sceneItemEnabled: true,
    });

    alert('✅ Display_Table_Overlay source created in OBS!');
    if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Created!'; }
  } catch (err) {
    const msg = err?.message || err?.error || String(err);
    if (msg.includes('already exists') || err?.code === 601) {
      alert('⚠️ Display_Table_Overlay already exists.');
      if (btn) btn.innerHTML = '<i class="fas fa-check"></i> Already exists';
    } else {
      alert('❌ OBS Error: ' + msg);
      if (btn) { btn.disabled = false; btn.innerHTML = '🎬 Create OBS Source'; }
    }
  }
}

function updateMainControlPanelVisibility() {
  const card = document.getElementById('dt-main-control-card');
  if (card) {
    card.style.display = dtSettings.show_control_panel ? 'block' : 'none';
  }
  // Sync values
  const mainRangeInput = document.getElementById('dt-main-row-range');
  if (mainRangeInput) {
    mainRangeInput.value = dtSettings.row_range || '1-10';
  }
  const settingsRangeInput = document.getElementById('dt-row-range');
  if (settingsRangeInput) {
    settingsRangeInput.value = dtSettings.row_range || '1-10';
  }
}

// Boot
function dtBoot() {
  injectDisplayTableTab();

  // Wire up main control card elements
  const mainRangeInput = document.getElementById('dt-main-row-range');
  if (mainRangeInput) {
    const handler = e => {
      dtSettings.row_range = e.target.value;
      saveSettings();
    };
    mainRangeInput.addEventListener('change', handler);
    mainRangeInput.addEventListener('input', handler);
  }

  const mainConfirmBtn = document.getElementById('dt-main-confirm-btn');
  if (mainConfirmBtn) {
    mainConfirmBtn.addEventListener('click', broadcastTableData);
  }

  updateMainControlPanelVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', dtBoot);
} else {
  setTimeout(dtBoot, 100);
}
