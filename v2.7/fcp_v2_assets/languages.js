// fcp_v2_assets/languages.js
// ไฟล์สำหรับเก็บคำแปลทั้งหมด

export const translations = {
    // English
    en: {
        appTitle: "Football Scoreboard Controller - V2.6",
        excel: "Excel",
        matchId: "ID:",
        load: "Load",
        teamA: "Team A",
        teamB: "Team B",
        edit: "Edit",
        editHint: "Edit name or add new line with /",
        ok: "OK",
        label1: "Label 1",
        label2: "Label 2",
        label3: "Label 3",
        // NEW Labels
        label4: "Label 4",
        label5: "Label 5",
        swap: "Swap Teams",
        reset: "Reset",
        fullReset: "Full Reset",
        score2Label: "Fouls/Counts",
        hide: "Hide",
        // NEW Visibility Groups
        show: "Show",
        score2VisibilityGroup: "Score 2 Visibility Control",
        swapVisibilityGroup: "Swap Button Visibility Control",
        actionGroupVisibility: "Action Buttons Group Visibility",
        resetKeybinds: "Reset Keybinds",
        resetColors: "Clear Team Color Memory",
        // NEW Action Buttons
        actionButtonsTitle: "Action Buttons Config (5 Buttons)",
        actionName: "Label",
        actionColor: "Color",
        actionMode: "Mode",
        actionTextMode: "Text",
        actionToggleMode: "Toggle",
        actionTargetSource: "Target Source ID (Text GDI+)",
        actionValue1: "Value 1 (On)",
        actionValue2: "Value 2 (Off)",

        half: "Half",
        injuryTime: "Added Time",
        countdown: "Down",
        countdownHint: "Countdown Timer",
        resetToZeroHint: "Reset timer to 00:00",
        resetToStartHint: "Reset timer to configured start time",
        settings: "Settings",
        copy: "Copy",
        help: "Help",
        donate: "Donate",
        footerAppName: "OBS Dock UI Scoreboard",
        changelog: "Update Version 2.6",
        detailsTitle: "Settings & Announcement",
        detailsDesc: "Customize general settings and announcement text below.",
        tagsTitle: "Available Tags for Announcement",
        keybindsTitle: "Custom Keyboard Shortcuts",
        keybindsList: [
            { id: "scoreA_plus", label: "+ Score A (Main)", default: "1" },
            { id: "scoreA_minus", label: "- Score A (Main)", default: "2" },
            { id: "scoreB_plus", label: "+ Score B (Main)", default: "4" },
            { id: "scoreB_minus", label: "- Score B (Main)", default: "5" },
            { id: "score2A_plus", label: "+ Score A (Sub)", default: "7" },
            { id: "score2A_minus", label: "- Score A (Sub)", default: "8" },
            { id: "score2B_plus", label: "+ Score B (Sub)", default: "9" },
            { id: "score2B_minus", label: "- Score B (Sub)", default: "0" },
            { id: "timer_playpause", label: "Play/Pause Timer", default: "SPACE" },
            { id: "timer_resetstart", label: "Reset to Start Time", default: "F10" },
            { id: "timer_togglehalf", label: "Toggle Half", default: "F11" },
            { id: "full_reset", label: "Full Reset (All)", default: "F12" },
        ],
        // NEW Action Keybinds (Default Text/Color will be handled in JS, only keybinds listed here)
        actionKeybindsList: [
            { id: "action_btn_1", label: "Action Button 1", default: "CONTROL+1" },
            { id: "action_btn_2", label: "Action Button 2", default: "CONTROL+2" },
            { id: "action_btn_3", label: "Action Button 3", default: "CONTROL+3" },
            { id: "action_btn_4", label: "Action Button 4", default: "CONTROL+4" },
            { id: "action_btn_5", label: "Action Button 5", default: "CONTROL+5" },
        ],
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: 'Team A Name' },
            { code: '&lt;TeamB&gt;', desc: 'Team B Name' },
            { code: '&lt;score_team_a&gt;', desc: 'Team A Score' },
            { code: '&lt;score_team_b&gt;', desc: 'Team B Score' },
            { code: '&lt;score2_team_a&gt;', desc: 'Team A Score 2 (Fouls/Counts)' },
            { code: '&lt;score2_team_b&gt;', desc: 'Team B Score 2 (Fouls/Counts)' },
            { code: '&lt;time_counter&gt;', desc: 'Current Time (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: 'Half (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: 'Label 1 Text' },
            { code: '&lt;label2&gt;', desc: 'Label 2 Text' },
            { code: '&lt;label3&gt;', desc: 'Label 3 Text' },
            // NEW Tags
            { code: '&lt;label4&gt;', desc: 'Label 4 Text' },
            { code: '&lt;label5&gt;', desc: 'Label 5 Text' },
        ],
        save: "Save",
        close: "Close",
        saveAndUpdate: "Save & Update",
        helpTitle: "How to Use",
        helpStep1: "1. Click the <i class='fas fa-folder-open'></i> icon to set your logo folder path. The default is <code>C:/OBSAssets/logos</code>. **You need to click the Edit button inside the popup to change and save the path.**",
        helpStep2: "2. Click <i class='fas fa-file-excel'></i> Excel button to select your data file.",
        helpStep3: "3. Select the desired Match ID and click <i class='fas fa-check'></i> Load.",
        sourcesTitle: "Required OBS Sources",
        sourcesTableHeaders: ["Source Name", "Source Type", "Details"],
        sourcesList: [
            { code: 'Color_Team_A', type: 'Color Source', desc: 'Team A (Primary Color)' },
            { code: 'Color_Team_B', type: 'Color Source', desc: 'Team B (Primary Color)' },
            { code: 'Color_Team_A_2', type: 'Color Source', desc: 'Team A (Secondary Color)' },
            { code: 'Color_Team_B_2', type: 'Color Source', desc: 'Team B (Secondary Color)' },
            { code: 'logo_team_a', type: 'Image Source', desc: 'Team A Logo' },
            { code: 'logo_team_b', type: 'Image Source', desc: 'Team B Logo' },
            { code: 'name_team_a', type: 'Text (GDI+)', desc: 'Team A Name' },
            { code: 'name_team_b', type: 'Text (GDI+)', desc: 'Team B Name' },
            { code: 'score_team_a', type: 'Text (GDI+)', desc: 'Team A Score (Main)' },
            { code: 'score_team_b', type: 'Text (GDI+)', desc: 'Team B Score (Main)' },
            { code: 'score2_team_a', type: 'Text (GDI+)', desc: 'Team A Score 2 (Fouls/Counts)' },
            { code: 'score2_team_b', type: 'Text (GDI+)', desc: 'Team B Score 2 (Fouls/Counts)' },
            { code: 'label_1', type: 'Text (GDI+)', desc: 'Label 1 Text' },
            { code: 'label_2', type: 'Text (GDI+)', desc: 'Label 2 Text' },
            { code: 'label_3', type: 'Text (GDI+)', desc: 'Label 3 Text' },
            // NEW Sources
            { code: 'label_4', type: 'Text (GDI+)', desc: 'Label 4 Text' },
            { code: 'label_5', type: 'Text (GDI+)', desc: 'Label 5 Text' },
            { code: 'half_text', type: 'Text (GDI+)', desc: 'Half (1st/2nd)' },
            { code: 'time_counter', type: 'Text (GDI+)', desc: 'Timer' },
            { code: 'injury_time_text', type: 'Text (GDI+)', desc: 'Added Time (+1)' },
            // NOTE: Add Action Button Target Sources here if you want to include them in the help guide.
            { code: 'action_output_1', type: 'Text (GDI+)', desc: 'Action Button 1 Output (Example Target)' },
            { code: 'action_output_5', type: 'Text (GDI+)', desc: 'Action Button 5 Output (Example Target)' },
        ],
        understand: "Got it",
        donateTitle: "Support Us",
        donateThai: "For Thais (for Scoreboard)",
        donateForeign: "For Foreigners (Outside Thailand)",
        timeSettingsTitle: "Set Start Time",
        timeSettingsMinutes: "Minutes",
        timeSettingsSeconds: "Seconds",
        logoPathTitle: "Logo Folder Path",
        logoPathDesc: "The current logo folder path is:",
        logoPathHint: "Set logo folder path",
        changelogTitle: "Update History",
        changelogContent: `
            <ul class="changelog-list">
                <li>
                    <h5>Version 2.7 (Proposed)</h5>
                    <ul>
                        <li>**Action Buttons:** Added a configurable group of 5 action buttons with custom labels, colors, keybinds, and OBS Target Source IDs.</li>
                        <li>**Toggle/Swap Mode:** Action buttons can operate in Text Mode (send fixed text) or Toggle Mode (swap between two defined values).</li>
                        <li>**Label Expansion:** Increased number of custom labels from 3 to 5 (Label 1-5).</li>
                        <li>**Visibility Controls:** Added controls to show/hide the Swap Teams button and the new Action Buttons group.</li>
                    </ul>
                </li>
                <li>
                    <h5>Version 2.6 (Latest)</h5>
                    <ul>
                        <li>**Full Reset Button:** Added button to reset time, half, and scores (main/sub).</li>
                        <li>**Team Color Memory:** Implemented system to remember team colors based on team name.</li>
                        <li>**Score 2 Controls:** Added dedicated buttons for the secondary score (foul/count), with options to hide/show.</li>
                        <li>**Custom Key Bindings:** Added customizable keyboard shortcuts panel supporting modifier keys (Ctrl/Alt/Shift).</li>
                        <li>**OBS Integration:** Improved key binding to pass through the Dock UI to OBS for instant control.</li>
                        <li>**Setup:** Updated OBS Source list and streamlined announcement loading from local TXT file.</li>
                    </ul>
                </li>
            </ul>`,
        toastLoadFileFirst: "Please upload a file first",
        toastMatchNotFound: "Match ID not found:",
        toastLoaded: "Loaded ID:",
        toastSuccess: "Success",
        toastSwapped: "Teams swapped",
        toastNoTextToCopy: "No text to copy",
        toastCopied: "Copied to clipboard",
        toastCopyFailed: "Copy failed",
        toastScoreReset: "Score reset",
        toastScore2Reset: "Score 2 reset",
        toastFullReset: "Scoreboard fully reset",
        toastCopiedSourceName: "Copied source name:",
        toastSaved: "Saved",
        toastKeybindsSaved: "Keybind saved!",
        toastColorsCleared: "Team color memory cleared!",
        toastObsError: "Failed to connect to OBS",
        toastInvalidTime: "Invalid time format. Please check minutes and seconds (0-59).",
        toastTimeSet: "Start time has been set and updated.",
    },
    // ภาษาไทย
    th: {
        appTitle: "โปรแกรมควบคุมสกอร์บอร์ดฟุตบอล - V2.6",
        excel: "Excel",
        matchId: "ID:",
        load: "โหลด",
        teamA: "ทีม A",
        teamB: "ทีม B",
        edit: "แก้ไข",
        editHint: "แก้ไขชื่อ หรือขึ้นบรรทัดใหม่ด้วยการใส่ /",
        ok: "ตกลง",
        label1: "ป้าย 1",
        label2: "ป้าย 2",
        label3: "ป้าย 3",
        // NEW Labels
        label4: "ป้าย 4",
        label5: "ป้าย 5",
        swap: "สลับฝั่ง",
        reset: "รีเซ็ต",
        fullReset: "รีเซ็ตทั้งหมด",
        score2Label: "ฟาวล์/แต้ม 2",
        hide: "ซ่อน",
        // NEW Visibility Groups
        show: "แสดง",
        score2VisibilityGroup: "ควบคุมการแสดงผลคะแนน 2",
        swapVisibilityGroup: "ควบคุมการแสดงผลปุ่มสลับฝั่ง",
        actionGroupVisibility: "ควบคุมการแสดงผลกลุ่มปุ่มแอคชัน",
        resetKeybinds: "รีเซ็ตคีย์ลัด",
        resetColors: "ล้างหน่วยความจำสีทีม",
        // NEW Action Buttons
        actionButtonsTitle: "ตั้งค่าปุ่มแอคชัน (5 ปุ่ม)",
        actionName: "ชื่อปุ่ม",
        actionColor: "สี",
        actionMode: "โหมด",
        actionTextMode: "ข้อความ",
        actionToggleMode: "สลับค่า",
        actionTargetSource: "Target Source ID (Text GDI+)",
        actionValue1: "ค่าที่ 1 (เปิด)",
        actionValue2: "ค่าที่ 2 (ปิด)",

        half: "ครึ่ง",
        injuryTime: "ทดเวลา",
        countdown: "นับถอยหลัง",
        countdownHint: "ตัวนับเวลาถอยหลัง",
        resetToZeroHint: "รีเซ็ตเวลาเป็น 00:00",
        resetToStartHint: "รีเซ็ตตามเวลาที่ตั้งค่า",
        settings: "ตั้งค่า",
        copy: "คัดลอก",
        help: "วิธีใช้",
        donate: "สนับสนุน",
        footerAppName: "OBS Dock UI Scoreboard",
        changelog: "อัปเดตเวอร์ชัน 2.6",
        detailsTitle: "ตั้งค่า & ข้อความประกาศ",
        detailsDesc: "ตั้งค่าทั่วไปและข้อความประกาศด้านล่าง",
        tagsTitle: "Tags ที่ใช้งานได้สำหรับข้อความประกาศ",
        keybindsTitle: "ตั้งค่าคีย์ลัด (Keyboard Shortcuts)",
        keybindsList: [
            { id: "scoreA_plus", label: "+ คะแนน A (หลัก)", default: "1" },
            { id: "scoreA_minus", label: "- คะแนน A (หลัก)", default: "2" },
            { id: "scoreB_plus", label: "+ คะแนน B (หลัก)", default: "4" },
            { id: "scoreB_minus", label: "- คะแนน B (หลัก)", default: "5" },
            { id: "score2A_plus", label: "+ คะแนน A (รอง)", default: "7" },
            { id: "score2A_minus", label: "- คะแนน A (รอง)", default: "8" },
            { id: "score2B_plus", label: "+ คะแนน B (รอง)", default: "9" },
            { id: "score2B_minus", label: "- คะแนน B (รอง)", default: "0" },
            { id: "timer_playpause", label: "เริ่ม/หยุด เวลา", default: "SPACE" },
            { id: "timer_resetstart", label: "รีเซ็ตไปเวลาเริ่มต้น", default: "F10" },
            { id: "timer_togglehalf", label: "สลับครึ่งเวลา", default: "F11" },
            { id: "full_reset", label: "รีเซ็ตทั้งหมด", default: "F12" },
        ],
        // NEW Action Keybinds (Default Text/Color will be handled in JS, only keybinds listed here)
        actionKeybindsList: [
            { id: "action_btn_1", label: "ปุ่มแอคชัน 1", default: "CONTROL+1" },
            { id: "action_btn_2", label: "ปุ่มแอคชัน 2", default: "CONTROL+2" },
            { id: "action_btn_3", label: "ปุ่มแอคชัน 3", default: "CONTROL+3" },
            { id: "action_btn_4", label: "ปุ่มแอคชัน 4", default: "CONTROL+4" },
            { id: "action_btn_5", label: "ปุ่มแอคชัน 5", default: "CONTROL+5" },
        ],
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: 'ชื่อทีม A' },
            { code: '&lt;TeamB&gt;', desc: 'ชื่อทีม B' },
            { code: '&lt;score_team_a&gt;', desc: 'คะแนนทีม A' },
            { code: '&lt;score_team_b&gt;', desc: 'คะแนนทีม B' },
            { code: '&lt;score2_team_a&gt;', desc: 'คะแนน 2 ทีม A (ฟาวล์/แต้ม)' },
            { code: '&lt;score2_team_b&gt;', desc: 'คะแนน 2 ทีม B (ฟาวล์/แต้ม)' },
            { code: '&lt;time_counter&gt;', desc: 'เวลาปัจจุบัน (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: 'ครึ่งเวลา (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: 'ข้อความ Label 1' },
            { code: '&lt;label2&gt;', desc: 'ข้อความ Label 2' },
            { code: '&lt;label3&gt;', desc: 'ข้อความ Label 3' },
            // NEW Tags
            { code: '&lt;label4&gt;', desc: 'ข้อความ Label 4' },
            { code: '&lt;label5&gt;', desc: 'ข้อความ Label 5' },
        ],
        save: "บันทึก",
        close: "ปิด",
        saveAndUpdate: "บันทึกและอัปเดต",
        helpTitle: "วิธีการใช้งาน",
        helpStep1: "1. กดปุ่ม <i class='fas fa-folder-open'></i> เพื่อตั้งค่าที่อยู่โฟลเดอร์โลโก้ (ค่าเริ่มต้นคือ <code>C:/OBSAssets/logos</code>) **คุณต้องกดปุ่ม แก้ไข ใน Popup เพื่อเปลี่ยนและบันทึกที่อยู่**",
        helpStep2: "2. กดปุ่ม <i class='fas fa-file-excel'></i> Excel เพื่อเลือกไฟล์ข้อมูล",
        helpStep3: "3. เลือก Match ID ที่ต้องการ แล้วกด <i class='fas fa-check'></i> Load",
        sourcesTitle: "OBS Sources ที่ต้องมี",
        sourcesTableHeaders: ["ชื่อ Source", "ประเภท Source", "รายละเอียด"],
        sourcesList: [
            { code: 'Color_Team_A', type: 'Color Source', desc: 'สีทีม A (สีหลัก)' },
            { code: 'Color_Team_B', type: 'Color Source', desc: 'สีทีม B (สีหลัก)' },
            { code: 'Color_Team_A_2', type: 'Color Source', desc: 'สีทีม A (สีรอง)' },
            { code: 'Color_Team_B_2', type: 'Color Source', desc: 'สีทีม B (สีรอง)' },
            { code: 'logo_team_a', type: 'Image Source', desc: 'โลโก้ทีม A' },
            { code: 'logo_team_b', type: 'Image Source', desc: 'โลโก้ทีม B' },
            { code: 'name_team_a', type: 'Text (GDI+)', desc: 'ชื่อทีม A' },
            { code: 'name_team_b', type: 'Text (GDI+)', desc: 'ชื่อทีม B' },
            { code: 'score_team_a', type: 'Text (GDI+)', desc: 'คะแนนทีม A (หลัก)' },
            { code: 'score_team_b', type: 'Text (GDI+)', desc: 'คะแนนทีม B (หลัก)' },
            { code: 'score2_team_a', type: 'Text (GDI+)', desc: 'คะแนน 2 ทีม A (ฟาวล์/แต้ม)' },
            { code: 'score2_team_b', type: 'Text (GDI+)', desc: 'คะแนน 2 ทีม B (ฟาวล์/แต้ม)' },
            { code: 'label_1', type: 'Text (GDI+)', desc: 'ข้อความ Label 1' },
            { code: 'label_2', type: 'Text (GDI+)', desc: 'ข้อความ Label 2' },
            { code: 'label_3', type: 'Text (GDI+)', desc: 'ข้อความ Label 3' },
            // NEW Sources
            { code: 'label_4', type: 'Text (GDI+)', desc: 'ข้อความ Label 4' },
            { code: 'label_5', type: 'Text (GDI+)', desc: 'ข้อความ Label 5' },
            { code: 'half_text', type: 'Text (GDI+)', desc: 'ครึ่งเวลา' },
            { code: 'time_counter', type: 'Text (GDI+)', desc: 'ตัวนับเวลา' },
            { code: 'injury_time_text', type: 'Text (GDI+)', desc: 'ทดเวลาบาดเจ็บ (+1)' },
            // NOTE: Add Action Button Target Sources here if you want to include them in the help guide.
            { code: 'action_output_1', type: 'Text (GDI+)', desc: 'ผลลัพธ์ปุ่มแอคชัน 1 (ตัวอย่าง Target)' },
            { code: 'action_output_5', type: 'Text (GDI+)', desc: 'ผลลัพธ์ปุ่มแอคชัน 5 (ตัวอย่าง Target)' },
        ],
        understand: "เข้าใจแล้ว",
        donateTitle: "ร่วมสนับสนุน",
        donateThai: "สำหรับคนไทย (ขึ้น Scoreboard)",
        donateForeign: "สำหรับนอกประเทศไทย",
        timeSettingsTitle: "ตั้งเวลาเริ่มต้น",
        timeSettingsMinutes: "นาที",
        timeSettingsSeconds: "วินาที",
        logoPathTitle: "ที่อยู่โฟลเดอร์โลโก้",
        logoPathDesc: "ที่อยู่โฟลเดอร์โลโก้ปัจจุบันคือ:",
        logoPathHint: "ตั้งค่าที่อยู่โฟลเดอร์โลโก้",
        changelogTitle: "ประวัติการอัปเดต",
        changelogContent: `
            <ul class="changelog-list">
                 <li>
                    <h5>เวอร์ชัน 2.7 (ที่เสนอ)</h5>
                    <ul>
                        <li>**ปุ่มแอคชัน:** เพิ่มกลุ่มปุ่มแอคชัน 5 ปุ่มที่ตั้งค่าได้ พร้อมชื่อ, สี, คีย์ลัด, และ Target OBS Source ID.</li>
                        <li>**โหมดสลับค่า:** ปุ่มแอคชันสามารถทำงานในโหมดข้อความ (ส่งข้อความตายตัว) หรือ โหมดสลับค่า (สลับระหว่างสองค่าที่กำหนด) ได้.</li>
                        <li>**เพิ่มป้ายข้อความ:** เพิ่มจำนวนป้ายข้อความ (Label) จาก 3 เป็น 5 (Label 1-5).</li>
                        <li>**ควบคุมการแสดงผล:** เพิ่มการควบคุมการซ่อน/แสดงปุ่มสลับฝั่งและกลุ่มปุ่มแอคชันใหม่.</li>
                    </ul>
                </li>
                <li>
                    <h5>เวอร์ชัน 2.6 (ล่าสุด)</h5>
                    <ul>
                        <li>**ปุ่มรีเซ็ตทั้งหมด:** เพิ่มปุ่มสำหรับรีเซ็ตเวลา, ครึ่งเวลา, และคะแนน (หลัก/รอง).</li>
                        <li>**การจดจำสีทีม:** นำระบบบันทึกค่าสีของแต่ละทีมตามชื่อมาใช้.</li>
                        <li>**ควบคุมคะแนนรอง:** เพิ่มปุ่มควบคุมเฉพาะสำหรับคะแนนรอง (ฟาวล์/แต้ม) และสามารถซ่อน/แสดงได้.</li>
                        <li>**คีย์ลัดกำหนดเอง:** เพิ่มแผงตั้งค่าคีย์ลัดที่ผู้ใช้ปรับเปลี่ยนได้ รองรับปุ่ม Modifier Keys (Ctrl/Alt/Shift).</li>
                        <li>**การเชื่อมต่อ OBS:** ปรับปรุงการทำงานของคีย์ลัดเพื่อให้ส่งคำสั่งผ่าน Dock UI ไปยัง OBS ได้โดยตรง.</li>
                        <li>**การตั้งค่า:** ปรับปรุงรายการ OBS Source ที่ต้องมีและย้ายการโหลดข้อความประกาศไปใช้ไฟล์ TXT ภายใน.</li>
                    </ul>
                </li>
            </ul>`,
        toastLoadFileFirst: "โปรด Upload ไฟล์ก่อน",
        toastMatchNotFound: "ไม่พบ Match ID:",
        toastLoaded: "โหลด ID สำเร็จ:",
        toastSuccess: "สำเร็จ",
        toastSwapped: "สลับฝั่งทีมแล้ว",
        toastNoTextToCopy: "ไม่มีข้อความให้คัดลอก",
        toastCopied: "คัดลอกแล้ว",
        toastCopyFailed: "คัดลอกล้มเหลว",
        toastScoreReset: "รีเซ็ตคะแนนแล้ว",
        toastScore2Reset: "รีเซ็ตคะแนน 2 แล้ว",
        toastFullReset: "รีเซ็ตสกอร์บอร์ดทั้งหมดแล้ว",
        toastCopiedSourceName: "คัดลอกชื่อ Source แล้ว:",
        toastSaved: "บันทึกแล้ว",
        toastKeybindsSaved: "บันทึกคีย์ลัดแล้ว!",
        toastColorsCleared: "ล้างหน่วยความจำสีทีมแล้ว!",
        toastObsError: "เชื่อมต่อ OBS ไม่สำเร็จ",
        toastInvalidTime: "รูปแบบเวลาไม่ถูกต้อง กรุณาตรวจสอบนาทีและวินาที (0-59)",
        toastTimeSet: "ตั้งค่าและอัปเดตเวลาเริ่มต้นแล้ว",
    },
};