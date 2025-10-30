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
        swap: "Swap Teams",
        reset: "Reset",
        fullReset: "Full Reset",
        score2Label: "Fouls/Counts",
        hide: "Hide",
        show: "Show",
        score2VisibilityGroup: "Score 2 Visibility Control",
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
        detailsTitle: "Announcement Text Settings",
        detailsDesc: "Create message using the tags below to pull data automatically.",
        tagsTitle: "Available Tags",
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: '- Team A Name' },
            { code: '&lt;TeamB&gt;', desc: '- Team B Name' },
            { code: '&lt;score_team_a&gt;', desc: '- Team A Score' },
            { code: '&lt;score_team_b&gt;', desc: '- Team B Score' },
            { code: '&lt;score2_team_a&gt;', desc: '- Team A Score 2 (Fouls/Counts)' },
            { code: '&lt;score2_team_b&gt;', desc: '- Team B Score 2 (Fouls/Counts)' },
            { code: '&lt;time_counter&gt;', desc: '- Current Time (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: '- Half (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: '- Label 1 Text' },
            { code: '&lt;label2&gt;', desc: '- Label 2 Text' },
            { code: '&lt;label3&gt;', desc: '- Label 3 Text' },
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
            { code: 'half_text', type: 'Text (GDI+)', desc: 'Half (1st/2nd)' },
            { code: 'time_counter', type: 'Text (GDI+)', desc: 'Timer' },
            { code: 'injury_time_text', type: 'Text (GDI+)', desc: 'Added Time (+1)' },
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
                    <h5>Version 2.6 (Latest)</h5>
                    <ul>
                        <li>**Moved Score 2 Visibility Control** to the Announcement Text Settings popup to prevent unexpected hiding/showing bugs.</li>
                        <li>**Announcement Text** now loads from a local file at <code>fcp_v2_assets/announcement.txt</code>.</li>
                        <li>Added **Score 2** control section (e.g., for Fouls/Counts in Futsal).</li>
                        <li>Implemented **Team Color Memory**: The system now remembers the last set colors for a team name.</li>
                        <li>Added a **Global Keyboard Listener** to allow control shortcuts via the Dock UI, even when the UI is focused.</li>
                        <li>Added a **Full Reset** button to reset both scores, timer (to 00:00), and half (to 1st) in one click.</li>
                        <li>Improved the **Help/Sources** section into an easy-to-read table.</li>
                        <li>Clicking a Source Name in the Help table now **copies the name** to the clipboard.</li>
                    </ul>
                </li>
                <li>
                    <h5>Version 2.5</h5>
                    <ul>
                        <li>Moved the logo folder path setting into a dedicated popup.</li>
                        <li>Added a secondary color option for each team.</li>
                    </ul>
                </li>
                <li>
                    <h5>Version 2.4</h5>
                    <ul>
                        <li>Major UI overhaul for timer controls based on feedback.</li>
                        <li>Added a "Save & Update" button to apply time changes to the live timer immediately.</li>
                        <li>Improved the "Reset to Start Time" button's reliability.</li>
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
        swap: "สลับฝั่ง",
        reset: "รีเซ็ต",
        fullReset: "รีเซ็ตทั้งหมด",
        score2Label: "ฟาวล์/แต้ม 2",
        hide: "ซ่อน",
        show: "แสดง",
        score2VisibilityGroup: "ควบคุมการแสดงผลคะแนน 2",
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
        detailsTitle: "ตั้งค่าข้อความประกาศ",
        detailsDesc: "สร้างข้อความโดยใช้ Tags ด้านล่างเพื่อดึงข้อมูลอัตโนมัติ",
        tagsTitle: "Tags ที่ใช้งานได้",
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: '- ชื่อทีม A' },
            { code: '&lt;TeamB&gt;', desc: '- ชื่อทีม B' },
            { code: '&lt;score_team_a&gt;', desc: '- คะแนนทีม A' },
            { code: '&lt;score_team_b&gt;', desc: '- คะแนนทีม B' },
            { code: '&lt;score2_team_a&gt;', desc: '- คะแนน 2 ทีม A (ฟาวล์/แต้ม)' },
            { code: '&lt;score2_team_b&gt;', desc: '- คะแนน 2 ทีม B (ฟาวล์/แต้ม)' },
            { code: '&lt;time_counter&gt;', desc: '- เวลาปัจจุบัน (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: '- ครึ่งเวลา (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: '- ข้อความ Label 1' },
            { code: '&lt;label2&gt;', desc: '- ข้อความ Label 2' },
            { code: '&lt;label3&gt;', desc: '- ข้อความ Label 3' },
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
            { code: 'half_text', type: 'Text (GDI+)', desc: 'ครึ่งเวลา' },
            { code: 'time_counter', type: 'Text (GDI+)', desc: 'ตัวนับเวลา' },
            { code: 'injury_time_text', type: 'Text (GDI+)', desc: 'ทดเวลาบาดเจ็บ (+1)' },
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
                    <h5>เวอร์ชัน 2.6 (ล่าสุด)</h5>
                    <ul>
                        <li>**ย้ายการควบคุมการแสดงผลคะแนน 2** ไปที่ Popup ตั้งค่าข้อความประกาศ เพื่อป้องกันปัญหาการซ่อน/แสดงที่ไม่ได้ตั้งใจ.</li>
                        <li>**ข้อความประกาศ** ถูกเปลี่ยนให้โหลดจากไฟล์ภายใน <code>fcp_v2_assets/announcement.txt</code>.</li>
                        <li>เพิ่มส่วนควบคุม **คะแนน 2** (เช่น สำหรับฟาวล์/แต้มในฟุตซอล).</li>
                        <li>เพิ่มระบบ **จดจำสีทีม**: ระบบจะจำค่าสีล่าสุดของชื่อทีมที่ใช้.</li>
                        <li>เพิ่ม **Global Keyboard Listener** เพื่อให้สามารถควบคุมปุ่มลัดผ่าน Dock UI ได้ แม้จะกด Dock UI ค้างไว้.</li>
                        <li>เพิ่มปุ่ม **รีเซ็ตทั้งหมด** เพื่อรีเซ็ตคะแนน, เวลา (เป็น 00:00), และครึ่งเวลา (เป็น 1st) ในคลิกเดียว.</li>
                        <li>ปรับปรุงส่วน **วิธีใช้/Sources** ให้เป็นรูปแบบตารางที่อ่านง่าย.</li>
                        <li>เมื่อคลิกที่ชื่อ Source ในตารางวิธีใช้ จะทำการ **คัดลอกชื่อ** ไปยังคลิปบอร์ด.</li>
                    </ul>
                </li>
                <li>
                    <h5>เวอร์ชัน 2.5</h5>
                    <ul>
                        <li>ย้ายการตั้งค่าที่อยู่โฟลเดอร์โลโก้ไปไว้ใน Popup.</li>
                        <li>เพิ่มความสามารถในการกำหนดสีที่สองสำหรับแต่ละทีม.</li>
                    </ul>
                </li>
                <li>
                    <h5>เวอร์ชัน 2.4</h5>
                    <ul>
                        <li>ปรับปรุง UI ส่วนควบคุมเวลาครั้งใหญ่ตามที่ผู้ใช้แนะนำ.</li>
                        <li>เพิ่มปุ่ม "บันทึกและอัปเดต" เพื่อให้แก้ไขและแสดงผลเวลาใหม่ทันที.</li>
                        <li>ปรับปรุงการทำงานของปุ่ม "คืนค่าเวลา" ให้เสถียรขึ้น.</li>
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
        toastObsError: "เชื่อมต่อ OBS ไม่สำเร็จ",
        toastInvalidTime: "รูปแบบเวลาไม่ถูกต้อง กรุณาตรวจสอบนาทีและวินาที (0-59)",
        toastTimeSet: "ตั้งค่าและอัปเดตเวลาเริ่มต้นแล้ว",
    },
    // Lao
    lo: {
        appTitle: "ໂຕຄວບຄຸມກະດານຄະແນນບານເຕະ - V2.6",
        excel: "Excel",
        matchId: "ID:",
        load: "ໂຫຼດ",
        teamA: "ທີມ A",
        teamB: "ທີມ B",
        edit: "ແກ້ໄຂ",
        editHint: "ແກ້ໄຂຊື່ ຫຼື ເພີ່ມແຖວໃໝ່ດ້ວຍ /",
        ok: "ຕົກລົງ",
        label1: "ປ້າຍ 1",
        label2: "ປ້າຍ 2",
        label3: "ປ້າຍ 3",
        swap: "ສลับຝັ່ງ",
        reset: "ຣີເຊັດ",
        fullReset: "ຣີເຊັດທັງໝົດ",
        score2Label: "ຟາວ/ຄະແນນ 2",
        hide: "ເຊື່ອງ",
        show: "ສະແດງ",
        score2VisibilityGroup: "ຄວບຄຸມການສະແດງຄະແນນ 2",
        half: "ເຄິ່ງ",
        injuryTime: "ທົດເວລາ",
        countdown: "ນັບຖອຍຫຼັງ",
        countdownHint: "ໂຕນັບເວລາຖອຍຫຼັງ",
        resetToZeroHint: "ຣີເຊັດເວລາເປັນ 00:00",
        resetToStartHint: "ຣີເຊັດເປັນເວລາເລີ່ມຕົ້ນທີ່ຕັ້ງໄວ້",
        settings: "ຕັ້ງຄ່າ",
        copy: "ສຳເນົາ",
        help: "ວິທີໃຊ້",
        donate: "ສະໜັບສະໜູນ",
        footerAppName: "OBS Dock UI Scoreboard",
        changelog: "ອັບເດດເວີຊັ່ນ 2.6",
        detailsTitle: "ຕັ້ງຄ່າຂໍ້ຄວາມປະກາດ",
        detailsDesc: "ສ້າງຂໍ້ຄວາມໂດຍໃຊ້ແທັກຂ້າງລຸ່ມເພື່ອດຶງຂໍ້ມູນອັດຕະໂນມັດ.",
        tagsTitle: "ແທັກທີ່ໃຊ້ໄດ້",
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: '- ຊື່ທີມ A' },
            { code: '&lt;TeamB&gt;', desc: '- ຊື່ທີມ B' },
            { code: '&lt;score_team_a&gt;', desc: '- ຄະແນນທີມ A' },
            { code: '&lt;score_team_b&gt;', desc: '- ຄະແນນທີມ B' },
            { code: '&lt;score2_team_a&gt;', desc: '- ຄະແນນ 2 ທີມ A (ຟາວ/ແຕ້ມ)' },
            { code: '&lt;score2_team_b&gt;', desc: '- ຄະແນນ 2 ທີມ B (ຟາວ/ແຕ້ມ)' },
            { code: '&lt;time_counter&gt;', desc: '- ເວລາປັດຈຸບັນ (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: '- ເຄິ່ງເວລາ (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: '- ຂໍ້ຄວາມປ້າຍ 1' },
            { code: '&lt;label2&gt;', desc: '- ຂໍ້ຄວາມປ້າຍ 2' },
            { code: '&lt;label3&gt;', desc: '- ຂໍ້ຄວາມປ້າຍ 3' },
        ],
        save: "ບັນທຶກ",
        close: "ປິດ",
        saveAndUpdate: "ບັນທຶກ ແລະ ອັບເດດ",
        helpTitle: "ວິທີການໃຊ້ງານ",
        helpStep1: "1. ກົດໄອຄອນ <i class='fas fa-folder-open'></i> ເພື່ອຕັ້ງຄ່າທີ່ຢູ່ໂຟນເດີໂລໂກ້ (ຄ່າເລີ່ມຕົ້ນແມ່ນ <code>C:/OBSAssets/logos</code>). **ທ່ານຕ້ອງກົດປຸ່ມ ແກ້ໄຂ ພາຍໃນ Popup ເພື່ອປ່ຽນ ແລະ ບັນທຶກທີ່ຢູ່.**",
        helpStep2: "2. ກົດປຸ່ມ <i class='fas fa-file-excel'></i> Excel ເພື່ອເລືອກໄຟລ໌ຂໍ້ມູນ.",
        helpStep3: "3. ເລືອກ Match ID ທີ່ຕ້ອງການ ແລ້ວກົດ <i class='fas fa-check'></i> ໂຫຼດ.",
        sourcesTitle: "OBS Sources ທີ່ຕ້ອງມີ",
        sourcesTableHeaders: ["ຊື່ Source", "ປະເພດ Source", "ລາຍລະອຽດ"],
        sourcesList: [
            { code: 'Color_Team_A', type: 'Color Source', desc: 'ສີທີມ A (ສີຫຼັກ)' },
            { code: 'Color_Team_B', type: 'Color Source', desc: 'ສີທີມ B (ສີຫຼັກ)' },
            { code: 'Color_Team_A_2', type: 'Color Source', desc: 'ສີທີມ A (ສີຮອງ)' },
            { code: 'Color_Team_B_2', type: 'Color Source', desc: 'ສີທີມ B (ສີຮອງ)' },
            { code: 'logo_team_a', type: 'Image Source', desc: 'ໂລໂກ້ທີມ A' },
            { code: 'logo_team_b', type: 'Image Source', desc: 'ໂລໂກ້ທີມ B' },
            { code: 'name_team_a', type: 'Text (GDI+)', desc: 'ຊື່ທີມ A' },
            { code: 'name_team_b', type: 'Text (GDI+)', desc: 'ຊື່ທີມ B' },
            { code: 'score_team_a', type: 'Text (GDI+)', desc: 'ຄະແນນທີມ A (ຫຼັກ)' },
            { code: 'score_team_b', type: 'Text (GDI+)', desc: 'ຄະແນນທີມ B (ຫຼັກ)' },
            { code: 'score2_team_a', type: 'Text (GDI+)', desc: 'ຄະແນນ 2 ທີມ A (ຟາວ/ແຕ້ມ)' },
            { code: 'score2_team_b', type: 'Text (GDI+)', desc: 'ຄະແນນ 2 ທີມ B (ຟາວ/ແຕ້ມ)' },
            { code: 'label_1', type: 'Text (GDI+)', desc: 'ຂໍ້ຄວາມປ້າຍ 1' },
            { code: 'label_2', type: 'Text (GDI+)', desc: 'ຂໍ້ຄວາມປ້າຍ 2' },
            { code: 'label_3', type: 'Text (GDI+)', desc: 'ຂໍ້ຄວາມປ້າຍ 3' },
            { code: 'half_text', type: 'Text (GDI+)', desc: 'ເຄິ່ງເວລາ' },
            { code: 'time_counter', type: 'Text (GDI+)', desc: 'ໂຕນັບເວລາ' },
            { code: 'injury_time_text', type: 'Text (GDI+)', desc: 'ທົດເວລາບາດເຈັບ (+1)' },
        ],
        understand: "ເຂົ້າໃຈແລ້ວ",
        donateTitle: "ຮ່ວມສະໜັບສະໜູນ",
        donateThai: "ສຳລັບຄົນໄທ (ຂຶ້ນ Scoreboard)",
        donateForeign: "ສຳລັບຕ່າງປະເທດ",
        timeSettingsTitle: "ຕັ້ງເວລາເລີ່ມຕົ້ນ",
        timeSettingsMinutes: "ນາທີ",
        timeSettingsSeconds: "ວິນາທີ",
        logoPathTitle: "ທີ່ຢູ່ໂຟນເດີໂລໂກ້",
        logoPathDesc: "ທີ່ຢູ່ໂຟນເດີໂລໂກ້ປັດຈຸບັນແມ່ນ:",
        logoPathHint: "ຕັ້ງຄ່າທີ່ຢູ່ໂຟນເດີໂລໂກ້",
        changelogTitle: "ປະຫວັດການອັບເດດ",
        changelogContent: `
            <ul class="changelog-list">
                <li><h5>ເວີຊັ່ນ 2.6 (ລ່າສຸດ)</h5>
                    <ul>
                        <li>**ຍ້າຍການຄວບຄຸມການສະແດງຜົນຄະແນນ 2** ໄປທີ່ Popup ຕັ້ງຄ່າຂໍ້ຄວາມປະກາດ ເພື່ອປ້ອງກັນບັນຫາການເຊື່ອງ/ສະແດງທີ່ບໍ່ໄດ້ຕັ້ງໃຈ.</li>
                        <li>**ຂໍ້ຄວາມປະກາດ** ຖືກປ່ຽນໃຫ້ໂຫຼດຈາກໄຟລ໌ພາຍໃນ <code>fcp_v2_assets/announcement.txt</code>.</li>
                        <li>ເພີ່ມສ່ວນຄວບຄຸມ **ຄະແນນ 2** (ຕົວຢ່າງ: ສຳລັບຟາວ/ນັບໃນຟຸດຊໍ).</li>
                        <li>ເພີ່ມລະບົບ **ຈື່ຈຳສີທີມ**: ລະບົບຈະຈື່ຄ່າສີຫຼ້າສຸດທີ່ຕັ້ງໄວ້ສຳລັບຊື່ທີມ.</li>
                        <li>ເພີ່ມ **Global Keyboard Listener** ເພື່ອໃຫ້ສາມາດຄວບຄຸມປຸ່ມລັດຜ່ານ Dock UI ໄດ້ ເຖິງແມ່ນວ່າ Dock UI ຈະມີ Focus.</li>
                        <li>ເພີ່ມປຸ່ມ **ຣີເຊັດທັງໝົດ** ເພື່ອຣີເຊັດຄະແນນ, ເວລາ (ເປັນ 00:00), ແລະ ເຄິ່ງເວລາ (ເປັນ 1st) ໃນຄລິກດຽວ.</li>
                        <li>ປັບປຸງສ່ວນ **ວິທີໃຊ້/Sources** ໃຫ້ເປັນຮູບແບບຕາຕະລາງທີ່ອ່ານງ່າຍ.</li>
                        <li>ເມື່ອກົດທີ່ຊື່ Source ໃນຕາຕະລາງວິທີໃຊ້ ຈະເຮັດການ **ສຳເນົາຊື່** ໄປຍັງ Clipboard.</li>
                    </ul>
                </li>
                <li><h5>ເວີຊັ່ນ 2.5</h5>
                    <ul>
                        <li>ຍ້າຍການຕັ້ງຄ່າທີ່ຢູ່ໂຟນເດີໂລໂກ້ໄປໄວ້ໃນ Popup.</li>
                        <li>ເພີ່ມຕົວເລືອກສີທີສອງສຳລັບແຕ່ລະທີມ.</li>
                    </ul>
                </li>
                <li><h5>ເວີຊັ່ນ 2.4</h5>
                    <ul>
                        <li>ປັບປຸງ UI ຄວບຄຸມເວລາຕາມຄຳແນະນຳ.</li>
                        <li>ເພີ່ມປຸ່ມ "ບັນທຶກ ແລະ ອັບເດດ" ເພື່ອໃຊ້ການປ່ຽນແປງເວລາທັນທີ.</li>
                        <li>ປັບປຸງຄວາມໜ້າເຊື່ອຖືຂອງປຸ່ມ 'ຣີເຊັດເປັນເວລາເລີ່ມຕົ້ນ'.</li>
                    </ul>
                </li>
            </ul>`,
        toastLoadFileFirst: "ກະລຸນາອັບໂຫຼດໄຟລ໌ກ່ອນ",
        toastMatchNotFound: "ບໍ່ພົບ Match ID:",
        toastLoaded: "ໂຫຼດ ID ສຳເລັດ:",
        toastSuccess: "ສຳເລັດ",
        toastSwapped: "ສลับຝັ່ງທີມແລ້ວ",
        toastNoTextToCopy: "ບໍ່ມີຂໍ້ຄວາມໃຫ້ສຳເນົາ",
        toastCopied: "ສຳເນົາແລ້ວ",
        toastCopyFailed: "ສຳເນົາລົ້ມເຫຼວ",
        toastScoreReset: "ຣີເຊັດຄະແນນແລ້ວ",
        toastScore2Reset: "ຣີເຊັດຄະແນນ 2 ແລ້ວ",
        toastFullReset: "ຣີເຊັດກະດານຄະແນນທັງໝົດແລ້ວ",
        toastCopiedSourceName: "ສຳເນົາຊື່ Source ແລ້ວ:",
        toastSaved: "ບັນທຶກແລ້ວ",
        toastObsError: "ເຊື່ອມຕໍ່ OBS ບໍ່ສຳເລັດ",
        toastInvalidTime: "ຮູບແບບເວລາບໍ່ຖືກຕ້ອງ. ກະລຸນາກວດສອບນາທີ ແລະ ວິນາທີ (0-59).",
        toastTimeSet: "ໄດ້ຕັ້ງ ແລະ ອັບເດດເວລາເລີ່ມຕົ້ນແລ້ວ.",
    },
    // Korean
    ko: {
        appTitle: "축구 스코어보드 컨트롤러 - V2.6",
        excel: "엑셀",
        matchId: "ID:",
        load: "로드",
        teamA: "팀 A",
        teamB: "팀 B",
        edit: "수정",
        editHint: "이름을 수정하거나 /로 새 줄을 추가하세요",
        ok: "확인",
        label1: "레이블 1",
        label2: "레이블 2",
        label3: "레이블 3",
        swap: "팀 교체",
        reset: "재설정",
        fullReset: "전체 재설정",
        score2Label: "파울/점수 2",
        hide: "숨기기",
        show: "표시",
        score2VisibilityGroup: "점수 2 표시 제어",
        half: "전/후반",
        injuryTime: "추가 시간",
        countdown: "카운트다운",
        countdownHint: "카운트다운 타이머",
        resetToZeroHint: "타이머를 00:00으로 재설정",
        resetToStartHint: "구성된 시작 시간으로 타이머 재설정",
        settings: "설정",
        copy: "복사",
        help: "도움말",
        donate: "후원",
        footerAppName: "OBS Dock UI 스코어보드",
        changelog: "업데이트 버전 2.6",
        detailsTitle: "공지 텍스트 설정",
        detailsDesc: "아래 태그를 사용하여 데이터를 자동으로 가져오는 메시지를 만드세요.",
        tagsTitle: "사용 가능한 태그",
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: '- 팀 A 이름' },
            { code: '&lt;TeamB&gt;', desc: '- 팀 B 이름' },
            { code: '&lt;score_team_a&gt;', desc: '- 팀 A 점수' },
            { code: '&lt;score_team_b&gt;', desc: '- 팀 B 점수' },
            { code: '&lt;score2_team_a&gt;', desc: '- 팀 A 점수 2 (파울/횟수)' },
            { code: '&lt;score2_team_b&gt;', desc: '- 팀 B 점수 2 (파울/횟수)' },
            { code: '&lt;time_counter&gt;', desc: '- 현재 시간 (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: '- 전/후반 (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: '- 레이블 1 텍스트' },
            { code: '&lt;label2&gt;', desc: '- 레이블 2 텍스트' },
            { code: '&lt;label3&gt;', desc: '- 레이블 3 텍스트' },
        ],
        save: "저장",
        close: "닫기",
        saveAndUpdate: "저장 및 업데이트",
        helpTitle: "사용 방법",
        helpStep1: "1. <i class='fas fa-folder-open'></i> 아이콘을 클릭하여 로고 폴더 경로를 설정하세요. 기본값은 <code>C:/OBSAssets/logos</code>입니다. **경로를 변경하고 저장하려면 팝업 내에서 수정 버튼을 클릭해야 합니다.**",
        helpStep2: "2. <i class='fas fa-file-excel'></i> 엑셀 버튼을 클릭하여 데이터 파일을 선택하세요。",
        helpStep3: "3. 원하는 경기 ID를 선택하고 <i class='fas fa-check'></i> 로드를 클릭하세요。",
        sourcesTitle: "필요한 OBS 소스",
        sourcesTableHeaders: ["소스 이름", "소스 유형", "세부 정보"],
        sourcesList: [
            { code: 'Color_Team_A', type: 'Color Source', desc: '팀 A (기본 색상)' },
            { code: 'Color_Team_B', type: 'Color Source', desc: '팀 B (기본 색상)' },
            { code: 'Color_Team_A_2', type: 'Color Source', desc: '팀 A (보조 색상)' },
            { code: 'Color_Team_B_2', type: 'Color Source', desc: '팀 B (보조 색상)' },
            { code: 'logo_team_a', type: 'Image Source', desc: '팀 A 로고' },
            { code: 'logo_team_b', type: 'Image Source', desc: '팀 B 로고' },
            { code: 'name_team_a', type: 'Text (GDI+)', desc: '팀 A 이름' },
            { code: 'name_team_b', type: 'Text (GDI+)', desc: '팀 B 이름' },
            { code: 'score_team_a', type: 'Text (GDI+)', desc: '팀 A 점수 (메인)' },
            { code: 'score_team_b', type: 'Text (GDI+)', desc: '팀 B 점수 (메인)' },
            { code: 'score2_team_a', type: 'Text (GDI+)', desc: '팀 A 점수 2 (파울/횟수)' },
            { code: 'score2_team_b', type: 'Text (GDI+)', desc: '팀 B 점수 2 (파울/횟수)' },
            { code: 'label_1', type: 'Text (GDI+)', desc: '레이블 1 텍스트' },
            { code: 'label_2', type: 'Text (GDI+)', desc: '레이블 2 텍스트' },
            { code: 'label_3', type: 'Text (GDI+)', desc: '레이블 3 텍스트' },
            { code: 'half_text', type: 'Text (GDI+)', desc: '전/후반' },
            { code: 'time_counter', type: 'Text (GDI+)', desc: '타이머' },
            { code: 'injury_time_text', type: 'Text (GDI+)', desc: '추가 시간 (+1)' },
        ],
        understand: "이해했습니다",
        donateTitle: "후원하기",
        donateThai: "태국인을 위해 (스코어보드용)",
        donateForeign: "외국인용 (태국 외)",
        timeSettingsTitle: "시작 시간 설정",
        timeSettingsMinutes: "분",
        timeSettingsSeconds: "초",
        logoPathTitle: "로고 폴더 경로",
        logoPathDesc: "현재 로고 폴더 경로는 다음과 같습니다:",
        logoPathHint: "로고 폴더 경로 설정",
        changelogTitle: "업데이트 내역",
        changelogContent: `
            <ul class="changelog-list">
                <li><h5>버전 2.6 (최신)</h5>
                    <ul>
                        <li>점수 2 제어 섹션의 **표시 제어**를 아나운스 텍스트 설정 팝업으로 이동하여 의도하지 않은 숨김/표시 버그를 방지했습니다.</li>
                        <li>**공지 텍스트**가 이제 로컬 파일 <code>fcp_v2_assets/announcement.txt</code> 에서 로드됩니다.</li>
                        <li>**점수 2** 제어 섹션(예: 풋살의 파울/횟수)을 추가했습니다.</li>
                        <li>**팀 색상 메모리** 구현: 시스템이 팀 이름에 대해 마지막으로 설정된 색상을 기억합니다.</li>
                        <li>Dock UI에 초점이 맞춰져 있을 때 Dock UI를 통해 단축키 제어를 허용하는 **전역 키보드 리스너**를 추가했습니다.</li>
                        <li>두 점수, 타이머(00:00으로), 전/후반(1st로)을 한 번의 클릭으로 재설정하는 **전체 재설정** 버튼을 추가했습니다.</li>
                        <li>**도움말/소스** 섹션을 읽기 쉬운 표로 개선했습니다.</li>
                        <li>도움말 표에서 소스 이름을 클릭하면 클립보드에 **이름이 복사**됩니다.</li>
                    </ul>
                </li>
                <li><h5>버전 2.5</h5>
                    <ul>
                        <li>로고 폴더 경로 설정을 전용 팝업으로 이동했습니다.</li>
                        <li>각 팀에 대한 보조 색상 옵션을 추가했습니다。</li>
                    </ul>
                </li>
                 <li><h5>버전 2.4</h5>
                    <ul>
                        <li>피드백에 따라 타이머 제어 UI가 크게 개편되었습니다.</li>
                        <li>시간 변경 사항을 즉시 적용하기 위해 "저장 및 업데이트" 버튼이 추가되었습니다.</li>
                        <li>"시작 시간으로 재설정" 버튼의 안정성이 향상되었습니다.</li>
                    </ul>
                </li>
            </ul>`,
        toastLoadFileFirst: "먼저 파일을 업로드하세요",
        toastMatchNotFound: "경기 ID를 찾을 수 없습니다:",
        toastLoaded: "ID 로드 성공:",
        toastSuccess: "성공",
        toastSwapped: "팀이 교체되었습니다",
        toastNoTextToCopy: "복사할 텍스트가 없습니다",
        toastCopied: "클립보드에 복사됨",
        toastCopyFailed: "복사 실패",
        toastScoreReset: "점수 재설정됨",
        toastScore2Reset: "점수 2 재설정됨",
        toastFullReset: "스코어보드 전체 재설정됨",
        toastCopiedSourceName: "소스 이름 복사됨:",
        toastSaved: "저장됨",
        toastObsError: "OBS 연결 실패",
        toastInvalidTime: "잘못된 시간 형식입니다. 분과 초(0-59)를 확인하세요。",
        toastTimeSet: "시작 시간이 설정 및 업데이트되었습니다。",
    },
    // Khmer (Cambodian)
    km: {
        appTitle: "កម្មវិធីបញ្ជាតារាងពិន្ទុបាល់ទាត់ - V2.6",
        excel: "Excel",
        matchId: "ID:",
        load: "ផ្ទុក",
        teamA: "ក្រុម A",
        teamB: "ក្រុម B",
        edit: "កែសម្រួល",
        editHint: "កែឈ្មោះ ឬបន្ថែមបន្ទាត់ថ្មីជាមួយ /",
        ok: "យល់ព្រម",
        label1: "ស្លាក ១",
        label2: "ស្លាក ២",
        label3: "ស្លាក ៣",
        swap: "ប្តូរក្រុម",
        reset: "កំណត់ឡើងវិញ",
        fullReset: "កំណត់ឡើងវិញទាំងអស់",
        score2Label: "ហ្វូល/ពិន្ទុ ២",
        hide: "លាក់",
        show: "បង្ហាញ",
        score2VisibilityGroup: "គ្រប់គ្រងការបង្ហាញពិន្ទុ 2",
        half: "តង់",
        injuryTime: "ម៉ោងបន្ថែម",
        countdown: "រាប់ថយក្រោយ",
        countdownHint: "កម្មវិធីកំណត់เวลារាប់ថយក្រោយ",
        resetToZeroHint: "កំណត់ពេលវេលាឡើងវិញទៅ 00:00",
        resetToStartHint: "កំណត់ពេលវេលាឡើងវិញទៅពេលចាប់ផ្តើមដែលបានកំណត់",
        settings: "ការកំណត់",
        copy: "ចម្លង",
        help: "ជំនួយ",
        donate: "គាំទ្រ",
        footerAppName: "OBS Dock UI Scoreboard",
        changelog: "អัปដេតកំណែ 2.6",
        detailsTitle: "ការកំណត់អត្ថបទប្រកាស",
        detailsDesc: "បង្កើតសារដោយប្រើស្លាកខាងក្រោមដើម្បីទាញទិន្នន័យដោយស្វ័យប្រវត្តិ។",
        tagsTitle: "ស្លាកដែលមាន",
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: '- ឈ្មោះក្រុម A' },
            { code: '&lt;TeamB&gt;', desc: '- ឈ្មោះក្រុម B' },
            { code: '&lt;score_team_a&gt;', desc: '- ពិន្ទុក្រុម A' },
            { code: '&lt;score_team_b&gt;', desc: '- ពិន្ទុក្រុម B' },
            { code: '&lt;score2_team_a&gt;', desc: '- ពិន្ទុ 2 ក្រុម A (ហ្វូល/រាប់)' },
            { code: '&lt;score2_team_b&gt;', desc: '- ពិន្ទុ 2 ក្រុម B (ហ្វូល/រាប់)' },
            { code: '&lt;time_counter&gt;', desc: '- ពេលវេលាបច្ចុប្បន្ន (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: '- តង់ (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: '- អត្ថបទស្លាក ១' },
            { code: '&lt;label2&gt;', desc: '- អត្ថបទស្លាក ២' },
            { code: '&lt;label3&gt;', desc: '- អត្ថបទស្លាក ៣' },
        ],
        save: "រក្សាទុក",
        close: "បិទ",
        saveAndUpdate: "រក្សាទុក & ធ្វើបច្ចុប្បន្នភាព",
        helpTitle: "របៀបប្រើ",
        helpStep1: "1. ចុចរូបតំណាង <i class='fas fa-folder-open'></i> ដើម្បីកំណត់ផ្លូវថតនិមិត្តសញ្ញារបស់អ្នក។ តាមលំនាំដើមវាគឺ <code>C:/OBSAssets/logos</code>។ **អ្នកត្រូវចុចប៊ូតុង កែសម្រួល ក្នុង Popup ដើម្បីផ្លាស់ប្តូរ និងរក្សាទុកផ្លូវ។**",
        helpStep2: "2. ចុចប៊ូតុង <i class='fas fa-file-excel'></i> Excel ដើម្បីជ្រើសរើសឯកសារទិន្នន័យ។",
        helpStep3: "3. ជ្រើសរើស Match ID ដែលចង់បាន ហើយចុច <i class='fas fa-check'></i> ផ្ទុក។",
        sourcesTitle: "OBS Sources ដែលត្រូវការ",
        sourcesTableHeaders: ["ឈ្មោះ Source", "ប្រភេទ Source", "លម្អិត"],
        sourcesList: [
            { code: 'Color_Team_A', type: 'Color Source', desc: 'ក្រុម A (ពណ៌ចម្បង)' },
            { code: 'Color_Team_B', type: 'Color Source', desc: 'ក្រុម B (ពណ៌ចម្បង)' },
            { code: 'Color_Team_A_2', type: 'Color Source', desc: 'ក្រុម A (ពណ៌បន្ទាប់បន្សំ)' },
            { code: 'Color_Team_B_2', type: 'Color Source', desc: 'ក្រុម B (ពណ៌បន្ទាប់បន្សំ)' },
            { code: 'logo_team_a', type: 'Image Source', desc: 'និមិត្តសញ្ញាក្រុម A' },
            { code: 'logo_team_b', type: 'Image Source', desc: 'និមិត្តសញ្ញាក្រុម B' },
            { code: 'name_team_a', type: 'Text (GDI+)', desc: 'ឈ្មោះក្រុម A' },
            { code: 'name_team_b', type: 'Text (GDI+)', desc: 'ឈ្មោះក្រុម B' },
            { code: 'score_team_a', type: 'Text (GDI+)', desc: 'ពិន្ទុក្រុម A (ចម្បង)' },
            { code: 'score_team_b', type: 'Text (GDI+)', desc: 'ពិន្ទុក្រុម B (ចម្បង)' },
            { code: 'score2_team_a', type: 'Text (GDI+)', desc: 'ពិន្ទុ 2 ក្រុម A (ហ្វូល/រាប់)' },
            { code: 'score2_team_b', type: 'Text (GDI+)', desc: 'ពិន្ទុ 2 ក្រុម B (ហ្វូល/រាប់)' },
            { code: 'label_1', type: 'Text (GDI+)', desc: 'ស្លាក ១' },
            { code: 'label_2', type: 'Text (GDI+)', desc: 'ស្លាក ២' },
            { code: 'label_3', type: 'Text (GDI+)', desc: 'ស្លាក ៣' },
            { code: 'half_text', type: 'Text (GDI+)', desc: 'តង់' },
            { code: 'time_counter', type: 'Text (GDI+)', desc: 'កម្មវិធីកំណត់ពេល' },
            { code: 'injury_time_text', type: 'Text (GDI+)', desc: 'ម៉ោងបន្ថែម (+1)' },
        ],
        understand: "យល់ហើយ",
        donateTitle: "គាំទ្រពួកយើង",
        donateThai: "សម្រាប់ជនជាតិថៃ (សម្រាប់តារាងពិន្ទុ)",
        donateForeign: "សម្រាប់ជនបរទេស (ក្រៅប្រទេសថៃ)",
        timeSettingsTitle: "កំណត់ម៉ោងចាប់ផ្តើម",
        timeSettingsMinutes: "នាទី",
        timeSettingsSeconds: "វិនាទី",
        logoPathTitle: "ផ្លូវថតនិមិត្តសញ្ញា",
        logoPathDesc: "ផ្លូវថតនិមិត្តសញ្ញាបច្ចុប្បន្នគឺ៖",
        logoPathHint: "កំណត់ផ្លូវថតនិមិត្តសញ្ញា",
        changelogTitle: "ប្រវត្តិធ្វើបច្ចុប្បន្នភាព",
        changelogContent: `
            <ul class="changelog-list">
                <li><h5>ជំនាន់ 2.6 (ថ្មីបំផុត)</h5>
                    <ul>
                        <li>បាន**ផ្លាស់ទីការគ្រប់គ្រងការបង្ហាញពិន្ទុ 2** ទៅកាន់ Popup ការកំណត់អត្ថបទប្រកាស ដើម្បីទប់ស្កាត់ Bug ការលាក់/បង្ហាញដែលមិនបានរំពឹងទុក.</li>
                        <li>**អត្ថបទប្រកាស** ត្រូវបានផ្លាស់ប្តូរទៅជាការផ្ទុកពីឯកសារក្នុងស្រុកនៅ <code>fcp_v2_assets/announcement.txt</code>.</li>
                        <li>បានបន្ថែមផ្នែកគ្រប់គ្រង **ពិន្ទុ 2** (ឧទាហរណ៍ សម្រាប់ហ្វូល/រាប់នៅក្នុងហ្វូតសាល)។</li>
                        <li>បានអនុវត្ត **Team Color Memory**: ប្រព័ន្ធឥឡូវនេះចងចាំពណ៌ចុងក្រោយដែលបានកំណត់សម្រាប់ឈ្មោះក្រុម។</li>
                        <li>បានបន្ថែម **Global Keyboard Listener** ដើម្បីអនុញ្ញាតឱ្យមានការควบคุมផ្លូវកាត់តាមរយៈ Dock UI បាន ទោះបីជា Dock UI មាន Focus ក៏ដោយ។</li>
                        <li>បានបន្ថែមប៊ូតុង **កំណត់ឡើងវិញទាំងអស់** ដើម្បីកំណត់ពិន្ទុទាំងពីរ, កម្មវិធីកំណត់ពេល (ទៅ 00:00), និងតង់ (ទៅ 1st) ក្នុងការចុចតែម្តង។</li>
                        <li>បានកែលម្អផ្នែក **ជំនួយ/Sources** ទៅជាតារាងដែលងាយស្រួលអាន.</li>
                        <li>ការចុចឈ្មោះ Source នៅក្នុងតារាងជំនួយឥឡូវនេះ **ចម្លងឈ្មោះ** ទៅកាន់ក្តារតម្បៀតខ្ទាស់.</li>
                    </ul>
                </li>
                <li><h5>ជំនាន់ 2.5</h5>
                    <ul>
                        <li>បានផ្លាស់ទីការកំណត់ផ្លូវថតនិមិត្តសញ្ញាទៅក្នុង Popup មួយ។</li>
                        <li>បានបន្ថែមជម្រើសពណ៌ទីពីរសម្រាប់ក្រុមនីមួយៗ។</li>
                    </ul>
                </li>
                <li><h5>ជំនាន់ 2.4</h5>
                    <ul>
                        <li>ការកែប្រែ UI ដ៏ធំសម្រាប់ការควบคุมកម្មវិធីកំណត់ម៉ោងដោយផ្អែកលើមតិកែលម្អ។</li>
                        <li>បានបន្ថែមប៊ូតុង "រក្សាទុក & ធ្វើបច្ចុប្បន្នភាព" ដើម្បីអនុវត្តការផ្លាស់ប្តូរពេលវេលាភ្លាមៗ។</li>
                        <li>បានធ្វើឱ្យប្រសើរឡើងនូវភាពជឿជាក់នៃប៊ូតុង 'កំណត់ឡើងវិញទៅម៉ោងចាប់ផ្តើម' ។</li>
                    </ul>
                </li>
            </ul>`,
        toastLoadFileFirst: "សូមអាប់ឡូតឯកសារជាមុនសិន",
        toastMatchNotFound: "រកមិនឃើញ Match ID:",
        toastLoaded: "បានផ្ទុក ID:",
        toastSuccess: "ជោគជ័យ",
        toastSwapped: "បានប្តូរក្រុម",
        toastNoTextToCopy: "គ្មានអត្ថបទសម្រាប់ចម្លង",
        toastCopied: "បានចម្លងទៅក្ដារតម្បៀតខ្ទាស់",
        toastCopyFailed: "ការចម្លងបានបរាជ័យ",
        toastScoreReset: "បានកំណត់ពិន្ទុឡើងវិញ",
        toastScore2Reset: "បានកំណត់ពិន្ទុ 2 ឡើងវិញ",
        toastFullReset: "បានកំណត់តារាងពិន្ទុឡើងវិញទាំងអស់",
        toastCopiedSourceName: "បានចម្លងឈ្មោះ Source:",
        toastSaved: "បានរក្សាទុក",
        toastObsError: "ការភ្ជាប់ទៅ OBS បានបរាជ័យ",
        toastInvalidTime: "ទម្រង់ម៉ោងមិនត្រឹមត្រូវ។ សូមពិនិត្យមើលនាទី និងវិនាទី (0-59)។",
        toastTimeSet: "បានកំណត់ម៉ោងចាប់ផ្តើម និងធ្វើបច្ចុប្បន្នភាពហើយ។",
    },
    // Japanese
    jp: {
        appTitle: "サッカー スコアボード コントローラー - V2.6",
        excel: "エクセル",
        matchId: "ID:",
        load: "ロード",
        teamA: "チーム A",
        teamB: "チーム B",
        edit: "編集",
        editHint: "名前を編集するか、/で改行を追加",
        ok: "OK",
        label1: "ラベル 1",
        label2: "ラベル 2",
        label3: "ラベル 3",
        swap: "チーム入替",
        reset: "リセット",
        fullReset: "全リセット",
        score2Label: "ファウル/カウント 2",
        hide: "非表示",
        show: "表示",
        score2VisibilityGroup: "スコア 2 表示制御",
        half: "ハーフ",
        injuryTime: "追加時間",
        countdown: "カウントダウン",
        countdownHint: "カウントダウン タイマー",
        resetToZeroHint: "タイマーを 00:00 にリセット",
        resetToStartHint: "設定された開始時間にタイマーをリセット",
        settings: "設定",
        copy: "コピー",
        help: "ヘルプ",
        donate: "寄付",
        footerAppName: "OBS Dock UI スコアボード",
        changelog: "更新バージョン 2.6",
        detailsTitle: "アナウンス テキスト設定",
        detailsDesc: "以下のタグを使用して、データを自動的に取得するメッセージを作成します。",
        tagsTitle: "利用可能なタグ",
        tagsList: [
            { code: '&lt;TeamA&gt;', desc: '- チーム A 名' },
            { code: '&lt;TeamB&gt;', desc: '- チーム B 名' },
            { code: '&lt;score_team_a&gt;', desc: '- チーム A スコア' },
            { code: '&lt;score_team_b&gt;', desc: '- チーム B スコア' },
            { code: '&lt;score2_team_a&gt;', desc: '- チーム A スコア 2 (ファウル/カウント)' },
            { code: '&lt;score2_team_b&gt;', desc: '- チーム B スコア 2 (ファウル/カウント)' },
            { code: '&lt;time_counter&gt;', desc: '- 現在時刻 (MM:SS)' },
            { code: '&lt;half_text&gt;', desc: '- ハーフ (1st/2nd)' },
            { code: '&lt;label1&gt;', desc: '- ラベル 1 テキスト' },
            { code: '&lt;label2&gt;', desc: '- ラベル 2 テキスト' },
            { code: '&lt;label3&gt;', desc: '- ラベル 3 テキスト' },
        ],
        save: "保存",
        close: "閉じる",
        saveAndUpdate: "保存して更新",
        helpTitle: "使用方法",
        helpStep1: "1. <i class='fas fa-folder-open'></i> アイコンをクリックしてロゴフォルダのパスを設定します。デフォルトは <code>C:/OBSAssets/logos</code> です。**ポップアップ内の編集ボタンをクリックしてパスを変更し、保存する必要があります。**",
        helpStep2: "2. <i class='fas fa-file-excel'></i> Excel ボタンをクリックしてデータファイルを選択します。",
        helpStep3: "3. 目的の試合 ID を選択し、<i class='fas fa-check'></i> ロードをクリックします。",
        sourcesTitle: "必要な OBS ソース",
        sourcesTableHeaders: ["ソース名", "ソースタイプ", "詳細"],
        sourcesList: [
            { code: 'Color_Team_A', type: 'カラーソース', desc: 'チーム A (メインカラー)' },
            { code: 'Color_Team_B', type: 'カラーソース', desc: 'チーム B (メインカラー)' },
            { code: 'Color_Team_A_2', type: 'カラーソース', desc: 'チーム A (サブカラー)' },
            { code: 'Color_Team_B_2', type: 'カラーソース', desc: 'チーム B (サブカラー)' },
            { code: 'logo_team_a', type: '画像ソース', desc: 'チーム A ロゴ' },
            { code: 'logo_team_b', type: '画像ソース', desc: 'チーム B ロゴ' },
            { code: 'name_team_a', type: 'テキスト (GDI+)', desc: 'チーム A 名' },
            { code: 'name_team_b', type: 'テキスト (GDI+)', desc: 'チーム B 名' },
            { code: 'score_team_a', type: 'テキスト (GDI+)', desc: 'チーム A スコア (メイン)' },
            { code: 'score_team_b', type: 'テキスト (GDI+)', desc: 'チーム B スコア (メイン)' },
            { code: 'score2_team_a', type: 'テキスト (GDI+)', desc: 'チーム A スコア 2 (ファウル/カウント)' },
            { code: 'score2_team_b', type: 'テキスト (GDI+)', desc: 'チーム B スコア 2 (ファウル/カウント)' },
            { code: 'label_1', type: 'テキスト (GDI+)', desc: 'ラベル 1 テキスト' },
            { code: 'label_2', type: 'テキスト (GDI+)', desc: 'ラベル 2 テキスト' },
            { code: 'label_3', type: 'テキスト (GDI+)', desc: 'ラベル 3 テキスト' },
            { code: 'half_text', type: 'テキスト (GDI+)', desc: 'ハーフ' },
            { code: 'time_counter', type: 'テキスト (GDI+)', desc: 'タイマー' },
            { code: 'injury_time_text', type: 'テキスト (GDI+)', desc: '追加時間 (+1)' },
        ],
        understand: "了解",
        donateTitle: "サポート",
        donateThai: "タイ在住者向け (スコアボード用)",
        donateForeign: "海外在住者向け",
        timeSettingsTitle: "開始時間設定",
        timeSettingsMinutes: "分",
        timeSettingsSeconds: "秒",
        logoPathTitle: "ロゴフォルダ パス",
        logoPathDesc: "現在のロゴフォルダ パス:",
        logoPathHint: "ロゴフォルダ パスを設定",
        changelogTitle: "更新履歴",
        changelogContent: `
            <ul class="changelog-list">
                <li><h5>バージョン 2.6 (最新)</h5>
                    <ul>
                        <li>スコア 2 制御セクションの**表示制御**をアナウンス テキスト設定ポップアップに移動し、意図しない非表示/表示バグを防ぎました。</li>
                        <li>**アナウンス テキスト**がローカルファイル <code>fcp_v2_assets/announcement.txt</code> からロードされるようになりました。</li>
                        <li>**スコア 2** 制御セクション (例: フットサルのファウル/カウント) を追加しました。</li>
                        <li>**チームカラー記憶**を実装: 最後に設定された色をチーム名ごとに記憶します。</li>
                        <li>Dock UI にフォーカスがある状態でも、Dock UI 経由でショートカット制御を許可する **グローバル キーボード リスナー** を追加しました。</li>
                        <li>両スコア、タイマー (00:00 に)、ハーフ (1st に) をワンクリックでリセットする **全リセット** ボタンを追加しました。</li>
                        <li>**ヘルプ/ソース** セクションを読みやすいテーブル形式に改善しました。</li>
                        <li>ヘルプテーブルのソース名をクリックすると、クリップボードに**名前がコピー**されます。</li>
                    </ul>
                </li>
                <li><h5>バージョン 2.5</h5>
                    <ul>
                        <li>ロゴフォルダのパス設定を専用のポップアップに移動しました。</li>
                        <li>各チームにサブカラーオプションを追加しました。</li>
                    </ul>
                </li>
                <li><h5>バージョン 2.4</h5>
                    <ul>
                        <li>フィードバックに基づいてタイマー制御の UI を大幅に刷新しました。</li>
                        <li>ライブタイマーにすぐに時間の変更を適用するための「保存して更新」ボタンを追加しました。</li>
                        <li>「開始時間に戻す」ボタンの信頼性を向上させました。</li>
                    </ul>
                </li>
            </ul>`,
        toastLoadFileFirst: "まずファイルをアップロードしてください",
        toastMatchNotFound: "試合 ID が見つかりません:",
        toastLoaded: "ID ロード完了:",
        toastSuccess: "成功",
        toastSwapped: "チームが入れ替わりました",
        toastNoTextToCopy: "コピーするテキストがありません",
        toastCopied: "クリップボードにコピーされました",
        toastCopyFailed: "コピーに失敗しました",
        toastScoreReset: "スコアがリセットされました",
        toastScore2Reset: "スコア 2 がリセットされました",
        toastFullReset: "スコアボードが完全にリセットされました",
        toastCopiedSourceName: "ソース名をコピーしました:",
        toastSaved: "保存されました",
        toastObsError: "OBS への接続に失敗しました",
        toastInvalidTime: "無効な時刻形式です。分と秒 (0-59) を確認してください。",
        toastTimeSet: "開始時間が設定され、更新されました。",
    },
};