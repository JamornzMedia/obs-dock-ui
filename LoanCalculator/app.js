/**
 * Daily Loan & Interest Calculator App Logic
 * Default Interest Rate: 9% per year
 * Light Mode Theme Only
 * Mode 1: Enter Desired Net Cash -> Calculate Required Loan Principal
 * Mode 2: Enter Principal -> Calculate Net Cash Received (Auto Due Date: March 31 Next Year)
 * Toggle: Deduct Interest Upfront vs Deferred Interest Payment at Due Date
 * Features: Color Coded Input Groups, Enlarged Net Total (64px), Scroll To Top Button
 */

(function () {
    // --- State Variables ---
    let currentMode = 'mode_calc_principal'; // 'mode_calc_principal' or 'mode_calc_netcash'
    let selectedRate = 9; // percentage per year (default 9%)
    let isShareDeducted = true; // 3% share deduction toggle
    let isInterestDeductedUpfront = true; // Interest deduction upfront toggle
    
    // --- DOM Elements ---
    let modeTabs, amountInput, amountInputLabel, presetBtns, rateBtns, customRateInput;
    let startDateInput, endDateInput, autoDateBadge, shareToggle, interestDeductToggle, interestToggleDesc;
    let heroBadgeText, heroMainAmount, heroSubtext;
    let displaySelectedRate, displayTotalDays, displayDateRange, displayTotalInterest, displayDailyInterest, displayShareAmount, displayShareStatus, displayShareRateText;
    let statSecondaryTitle, displaySecondaryAmount, displayDeductStatus, displayDueDate, displayDaysRem;
    let inputDaysBadge, inputDateRangeText;
    let bannerText, tableRowNetCashInput, tableReqNetCash, tablePrincipal, tableRate, tableRateSub, tableStartDate, tableEndDate, tablePeriod;
    let tableDailyInterest, tableDaysSub, tableTotalInterest, tableInterestDeductRow, tableInterestDeductStatus, tableShareRow, tableShareAmount, gtTitle, gtSub, gtAmount, tableDueAmount;
    let formulaRateText, formulaMainText, formulaDaysText, copySummaryBtn, printBtn, toast, toastMsg, scrollToTopBtn;

    function initElements() {
        modeTabs = document.querySelectorAll('.mode-tab');
        amountInput = document.getElementById('amountInput');
        amountInputLabel = document.getElementById('amountInputLabel');
        presetBtns = document.querySelectorAll('.btn-preset');
        rateBtns = document.querySelectorAll('.btn-rate');
        customRateInput = document.getElementById('customRateInput');
        startDateInput = document.getElementById('startDateInput');
        endDateInput = document.getElementById('endDateInput');
        autoDateBadge = document.getElementById('autoDateBadge');
        shareToggle = document.getElementById('shareToggle');
        interestDeductToggle = document.getElementById('interestDeductToggle');
        interestToggleDesc = document.getElementById('interestToggleDesc');
        
        heroBadgeText = document.getElementById('heroBadgeText');
        heroMainAmount = document.getElementById('heroMainAmount');
        heroSubtext = document.getElementById('heroSubtext');
        
        displaySelectedRate = document.getElementById('displaySelectedRate');
        displayTotalDays = document.getElementById('displayTotalDays');
        displayDateRange = document.getElementById('displayDateRange');
        displayTotalInterest = document.getElementById('displayTotalInterest');
        displayDailyInterest = document.getElementById('displayDailyInterest');
        displayShareAmount = document.getElementById('displayShareAmount');
        displayShareStatus = document.getElementById('displayShareStatus');
        displayShareRateText = document.getElementById('displayShareRateText');
        
        statSecondaryTitle = document.getElementById('statSecondaryTitle');
        displaySecondaryAmount = document.getElementById('displaySecondaryAmount');
        displayDeductStatus = document.getElementById('displayDeductStatus');
        displayDueDate = document.getElementById('displayDueDate');
        displayDaysRem = document.getElementById('displayDaysRem');
        
        inputDaysBadge = document.getElementById('inputDaysBadge');
        inputDateRangeText = document.getElementById('inputDateRangeText');
        
        bannerText = document.getElementById('bannerText');
        tableRowNetCashInput = document.getElementById('tableRowNetCashInput');
        tableReqNetCash = document.getElementById('tableReqNetCash');
        tablePrincipal = document.getElementById('tablePrincipal');
        tableRate = document.getElementById('tableRate');
        tableRateSub = document.getElementById('tableRateSub');
        tableStartDate = document.getElementById('tableStartDate');
        tableEndDate = document.getElementById('tableEndDate');
        tablePeriod = document.getElementById('tablePeriod');
        tableDailyInterest = document.getElementById('tableDailyInterest');
        tableDaysSub = document.getElementById('tableDaysSub');
        tableTotalInterest = document.getElementById('tableTotalInterest');
        tableInterestDeductRow = document.getElementById('tableInterestDeductRow');
        tableInterestDeductStatus = document.getElementById('tableInterestDeductStatus');
        tableShareRow = document.getElementById('tableShareRow');
        tableShareAmount = document.getElementById('tableShareAmount');
        gtTitle = document.getElementById('gtTitle');
        gtSub = document.getElementById('gtSub');
        gtAmount = document.getElementById('gtAmount');
        tableDueAmount = document.getElementById('tableDueAmount');
        
        formulaRateText = document.getElementById('formulaRateText');
        formulaMainText = document.getElementById('formulaMainText');
        formulaDaysText = document.getElementById('formulaDaysText');
        
        copySummaryBtn = document.getElementById('copySummaryBtn');
        printBtn = document.getElementById('printBtn');
        toast = document.getElementById('toast');
        toastMsg = document.getElementById('toastMsg');
        scrollToTopBtn = document.getElementById('scrollToTopBtn');
    }

    function initApp() {
        initElements();
        initDates();
        attachEventListeners();
        calculateAndRender();
    }

    function initDates() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = `${yyyy}-${mm}-${dd}`;
        }
        
        updateEndDateForMode();
    }

    function parseLocalDate(dateStr) {
        if (!dateStr) return new Date();
        const parts = dateStr.split('-');
        if (parts.length !== 3) return new Date();
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
        return new Date(y, m, d);
    }

    function updateEndDateForMode() {
        if (!startDateInput) return;
        const startVal = startDateInput.value;
        if (!startVal) return;

        const startDate = parseLocalDate(startVal);
        const startYear = startDate.getFullYear();

        if (currentMode === 'mode_calc_netcash') {
            // Mode 2: Auto-set to March 31 of NEXT year
            const nextYear = startYear + 1;
            endDateInput.value = `${nextYear}-03-31`;
            endDateInput.disabled = true;
            if (autoDateBadge) autoDateBadge.style.display = 'inline-block';
        } else {
            // Mode 1: Default to March 31 of next year if empty or previously disabled
            if (endDateInput.disabled || !endDateInput.value) {
                const nextYear = startYear + 1;
                endDateInput.value = `${nextYear}-03-31`;
            }
            endDateInput.disabled = false;
            if (autoDateBadge) autoDateBadge.style.display = 'none';
        }
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    function parseFormattedNumber(str) {
        if (!str) return 0;
        const cleanStr = str.toString().replace(/,/g, '');
        const val = parseFloat(cleanStr);
        return isNaN(val) ? 0 : val;
    }

    function formatThaiDate(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return '-';
        const monthsTH = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const day = dateObj.getDate();
        const month = monthsTH[dateObj.getMonth()];
        const yearBE = dateObj.getFullYear() + 543;
        return `${day} ${month} ${yearBE}`;
    }

    function calculateAndRender() {
        if (!amountInput || !startDateInput || !endDateInput) return;

        // 1. Input Amount
        const inputAmount = parseFormattedNumber(amountInput.value);

        // 2. Dates & Days
        const startDate = parseLocalDate(startDateInput.value);
        const endDate = parseLocalDate(endDateInput.value);
        
        let days = 0;
        if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const diffTime = endDate.getTime() - startDate.getTime();
            days = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
        }

        // 3. Calculation Factors
        const annualRateDecimal = selectedRate / 100;
        const periodInterestRate = (annualRateDecimal * days) / 365;
        const shareRate = isShareDeducted ? 0.03 : 0;
        const appliedInterestRateFactor = isInterestDeductedUpfront ? periodInterestRate : 0;

        let principal = 0;
        let netCash = 0;
        let shareAmount = 0;
        let dailyInterest = 0;
        let totalInterest = 0;

        if (currentMode === 'mode_calc_principal') {
            // MODE 1: Input is Desired Net Cash -> Calculate Required Loan Principal
            netCash = inputAmount;
            
            const deductionFactor = 1 - shareRate - appliedInterestRateFactor;
            if (deductionFactor > 0) {
                principal = netCash / deductionFactor;
            } else {
                principal = 0;
            }

            shareAmount = isShareDeducted ? (principal * 0.03) : 0;
            dailyInterest = (principal * annualRateDecimal) / 365;
            totalInterest = dailyInterest * days;

            // Update UI Labels & Top Hero Card for Mode 1
            if (amountInputLabel) amountInputLabel.textContent = 'จำนวนเงินสดคงเหลือที่ต้องการได้รับ (บาท)';
            if (heroBadgeText) heroBadgeText.textContent = 'ยอดเงินต้นที่ต้องทำสัญญา (ยอดกู้)';
            if (heroMainAmount) heroMainAmount.textContent = formatNumber(principal);
            
            let heroDesc = `คำนวณจาก อัตราดอกเบี้ย <strong>${selectedRate.toFixed(2)}% ต่อปี</strong>`;
            if (isShareDeducted) heroDesc += ` + ค่าหุ้น (3%) ฿${formatNumber(shareAmount)}`;
            if (isInterestDeductedUpfront) heroDesc += ` + หักดอกเบี้ยล่วงหน้า ฿${formatNumber(totalInterest)}`;
            else heroDesc += ` (ไม่หักดอกเบี้ยล่วงหน้า)`;
            if (heroSubtext) heroSubtext.innerHTML = heroDesc;

            if (statSecondaryTitle) statSecondaryTitle.textContent = 'เงินสดสุทธิที่ต้องการ';
            if (displaySecondaryAmount) displaySecondaryAmount.textContent = `฿${formatNumber(netCash)}`;
            if (displayDeductStatus) displayDeductStatus.textContent = isInterestDeductedUpfront ? 'หักดอกเบี้ยล่วงหน้า' : 'ไม่หักดอกเบี้ยล่วงหน้า';

            if (bannerText) bannerText.innerHTML = `<strong>แบบที่ 1:</strong> กำหนดเงินสดที่ต้องการรับ ➔ คำนวณหายอดสัญญากู้ | อัตราดอกเบี้ย <strong>${selectedRate.toFixed(2)}% ต่อปี</strong> (${isInterestDeductedUpfront ? 'หักดอกเบี้ยล่วงหน้า' : 'ไม่หักดอกเบี้ยล่วงหน้า'})`;
            
            if (tableRowNetCashInput) tableRowNetCashInput.style.display = 'table-row';
            if (tableReqNetCash) tableReqNetCash.textContent = `฿${formatNumber(netCash)}`;
            
            if (gtTitle) gtTitle.textContent = 'ยอดเงินต้นที่ต้องทำสัญญา (Principal)';
            if (gtSub) gtSub.textContent = `ยอดสัญญาคำนวณจากดอกเบี้ย ${selectedRate.toFixed(2)}% + ค่าหุ้น ${isShareDeducted ? '3%' : '0%'}`;
            if (gtAmount) gtAmount.textContent = `฿${formatNumber(principal)}`;

            if (formulaMainText) formulaMainText.innerHTML = `<strong>สูตรยอดเงินกู้สัญญา:</strong> เงินสดต้องการ ÷ (1 - %ค่าหุ้น - %ดอกเบี้ยล่วงหน้า)`;

        } else {
            // MODE 2: Input is Principal -> Calculate Net Cash Received
            principal = inputAmount;
            
            shareAmount = isShareDeducted ? (principal * 0.03) : 0;
            dailyInterest = (principal * annualRateDecimal) / 365;
            totalInterest = dailyInterest * days;
            
            const deductedInterestInMode2 = isInterestDeductedUpfront ? totalInterest : 0;
            netCash = principal - shareAmount - deductedInterestInMode2;

            // Update UI Labels & Top Hero Card for Mode 2
            if (amountInputLabel) amountInputLabel.textContent = 'จำนวนเงินต้นตามสัญญา (บาท)';
            if (heroBadgeText) heroBadgeText.textContent = 'จำนวนเงินสดคงเหลือที่จะได้รับ';
            if (heroMainAmount) heroMainAmount.textContent = formatNumber(netCash);
            
            let heroDesc = `คำนวณจาก เงินต้น ฿${formatNumber(principal)} - อัตราดอกเบี้ย <strong>${selectedRate.toFixed(2)}% ต่อปี</strong>`;
            if (isShareDeducted) heroDesc += ` - หักค่าหุ้น (3%) ฿${formatNumber(shareAmount)}`;
            if (isInterestDeductedUpfront) heroDesc += ` - หักดอกเบี้ยล่วงหน้า ฿${formatNumber(totalInterest)}`;
            else heroDesc += ` (ไม่หักดอกเบี้ยล่วงหน้า)`;
            if (heroSubtext) heroSubtext.innerHTML = heroDesc;

            if (statSecondaryTitle) statSecondaryTitle.textContent = 'เงินต้นตามสัญญา';
            if (displaySecondaryAmount) displaySecondaryAmount.textContent = `฿${formatNumber(principal)}`;
            if (displayDeductStatus) displayDeductStatus.textContent = isInterestDeductedUpfront ? 'หักดอกเบี้ยล่วงหน้า' : 'ไม่หักดอกเบี้ยล่วงหน้า';

            if (bannerText) bannerText.innerHTML = `<strong>แบบที่ 2:</strong> กำหนดเงินต้นสัญญา ➔ สรุปคงเหลือเงินสด | อัตราดอกเบี้ย <strong>${selectedRate.toFixed(2)}% ต่อปี</strong> (${isInterestDeductedUpfront ? 'หักดอกเบี้ยล่วงหน้า' : 'ไม่หักดอกเบี้ยล่วงหน้า'})`;
            
            if (tableRowNetCashInput) tableRowNetCashInput.style.display = 'none';
            
            if (gtTitle) gtTitle.textContent = 'จำนวนเงินสดคงเหลือที่จะได้รับ';
            if (gtSub) gtSub.textContent = `เงินสดรับสุทธิโอนเข้าบัญชีหลังคำนวณดอกเบี้ย ${selectedRate.toFixed(2)}%`;
            if (gtAmount) gtAmount.textContent = `฿${formatNumber(netCash)}`;

            if (formulaMainText) formulaMainText.innerHTML = `<strong>สูตรเงินสดสุทธิ:</strong> เงินต้น - ค่าหุ้น (3%) ${isInterestDeductedUpfront ? '- ดอกเบี้ยล่วงหน้า' : '(ไม่หักดอกเบี้ยล่วงหน้า)'}`;
        }

        const startThai = formatThaiDate(startDate);
        const endThai = formatThaiDate(endDate);
        const dateRangeStr = `${startThai} - ${endThai}`;

        // 4. Update Shared Stat Cards
        if (displaySelectedRate) displaySelectedRate.textContent = `${selectedRate.toFixed(2)}%`;
        if (displayTotalDays) displayTotalDays.textContent = `${days} วัน`;
        if (displayDateRange) displayDateRange.textContent = dateRangeStr;
        if (inputDaysBadge) inputDaysBadge.textContent = `${days} วัน`;
        if (inputDateRangeText) inputDateRangeText.textContent = dateRangeStr;

        if (displayTotalInterest) displayTotalInterest.textContent = `฿${formatNumber(totalInterest)}`;
        if (displayDailyInterest) displayDailyInterest.textContent = `เฉลี่ยวันละ ฿${formatNumber(dailyInterest)}`;
        
        if (displayShareAmount) displayShareAmount.textContent = isShareDeducted ? `฿${formatNumber(shareAmount)}` : '฿0.00';
        if (displayShareStatus) displayShareStatus.textContent = isShareDeducted ? '3% ของเงินต้นสัญญา' : 'ไม่หักค่าหุ้น';
        if (displayShareRateText) displayShareRateText.textContent = isShareDeducted ? '3%' : '0%';

        if (displayDueDate) displayDueDate.textContent = endThai;
        if (displayDaysRem) displayDaysRem.textContent = `เริ่มคิดวันที่ ${startThai}`;

        // 5. Update Table Summary
        if (tablePrincipal) tablePrincipal.textContent = `฿${formatNumber(principal)}`;
        if (tableRate) tableRate.textContent = `${selectedRate.toFixed(2)}% ต่อปี`;
        if (tableRateSub) tableRateSub.textContent = `${selectedRate.toFixed(2)}%`;
        if (tableStartDate) tableStartDate.textContent = startThai;
        if (tableEndDate) tableEndDate.textContent = endThai;
        if (tablePeriod) tablePeriod.textContent = `${days} วัน`;
        if (tableDaysSub) tableDaysSub.textContent = `${days} วัน`;
        if (tableDailyInterest) tableDailyInterest.textContent = `฿${formatNumber(dailyInterest)} / วัน`;
        if (tableTotalInterest) tableTotalInterest.textContent = `฿${formatNumber(totalInterest)}`;
        
        // Table Interest Deduction Status Row
        if (tableInterestDeductRow && tableInterestDeductStatus) {
            if (isInterestDeductedUpfront) {
                tableInterestDeductStatus.textContent = `หักล่วงหน้า -฿${formatNumber(totalInterest)}`;
                tableInterestDeductStatus.className = 'text-right font-mono text-danger';
            } else {
                tableInterestDeductStatus.textContent = `ไม่หักล่วงหน้า (ชำระ ณ วันครบกำหนด)`;
                tableInterestDeductStatus.className = 'text-right font-mono text-cyan';
            }
        }

        if (tableShareRow) {
            if (isShareDeducted) {
                tableShareRow.style.display = 'table-row';
                if (tableShareAmount) tableShareAmount.textContent = `-฿${formatNumber(shareAmount)}`;
            } else {
                tableShareRow.style.display = 'none';
            }
        }

        if (tableDueAmount) {
            if (isInterestDeductedUpfront) {
                tableDueAmount.textContent = `฿${formatNumber(principal)} (ชำระคืนเฉพาะเงินต้น)`;
            } else {
                const totalDueAtEnd = principal + totalInterest;
                tableDueAmount.textContent = `฿${formatNumber(totalDueAtEnd)} (เงินต้น ฿${formatNumber(principal)} + ดอกเบี้ย ฿${formatNumber(totalInterest)})`;
            }
        }

        if (formulaRateText) formulaRateText.innerHTML = `<strong>อัตราดอกเบี้ย:</strong> <span class="text-gold text-bold">${selectedRate.toFixed(2)}% ต่อปี</span> (ดอกเบี้ยวันละ ฿${formatNumber(dailyInterest)})`;
        if (formulaDaysText) formulaDaysText.innerHTML = `<strong>ระยะเวลาคิดดอกเบี้ย:</strong> ${startThai} ถึง ${endThai} (รวม ${days} วัน)`;
    }

    function attachEventListeners() {
        // Mode Selector Tabs
        modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                modeTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMode = tab.dataset.mode;
                updateEndDateForMode();
                calculateAndRender();
            });
        });

        // Amount Input Auto Format
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                let rawValue = e.target.value.replace(/,/g, '');
                
                if (!isNaN(rawValue) && rawValue !== '') {
                    const formatted = new Intl.NumberFormat('th-TH').format(parseFloat(rawValue));
                    e.target.value = formatted;
                } else if (rawValue === '') {
                    e.target.value = '';
                }
                
                presetBtns.forEach(btn => btn.classList.remove('active'));
                calculateAndRender();
            });
        }

        // Preset Buttons
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const amt = parseFloat(btn.dataset.amount);
                amountInput.value = formatNumber(amt).replace('.00', '');
                calculateAndRender();
            });
        });

        // Interest Rate Buttons (5%, 7%, 8%, 9%)
        rateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                rateBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (customRateInput) customRateInput.value = '';
                selectedRate = parseFloat(btn.dataset.rate);
                calculateAndRender();
            });
        });

        // Custom Interest Rate Input
        if (customRateInput) {
            customRateInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) {
                    rateBtns.forEach(b => b.classList.remove('active'));
                    selectedRate = val;
                    calculateAndRender();
                }
            });
        }

        // Dates Input Change
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                updateEndDateForMode();
                calculateAndRender();
            });
        }

        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                calculateAndRender();
            });
        }

        // Interest Deduct Upfront Toggle Switch
        if (interestDeductToggle) {
            interestDeductToggle.addEventListener('change', (e) => {
                isInterestDeductedUpfront = e.target.checked;
                if (interestToggleDesc) {
                    interestToggleDesc.textContent = isInterestDeductedUpfront 
                        ? 'หักดอกเบี้ยออกจากเงินสดรับสุทธิทันที' 
                        : 'ชำระดอกเบี้ยเมื่อครบกำหนด (ไม่หักล่วงหน้า)';
                }
                calculateAndRender();
            });
        }

        // Share Toggle Switch
        if (shareToggle) {
            shareToggle.addEventListener('change', (e) => {
                isShareDeducted = e.target.checked;
                calculateAndRender();
            });
        }

        // Copy Summary Button
        if (copySummaryBtn) {
            copySummaryBtn.addEventListener('click', () => {
                const modeName = currentMode === 'mode_calc_principal' 
                    ? 'แบบที่ 1: กำหนดเงินสดที่ต้องการรับ ➔ คำนวณหายอดกู้' 
                    : 'แบบที่ 2: กำหนดเงินต้นสัญญา ➔ สรุปคงเหลือเป็นเงินสด';
                
                const summaryText = `📋 **สรุปรายงานการคำนวณดอกเบี้ยรายวัน**
เงื่อนไข: ${modeName}
----------------------------------
${currentMode === 'mode_calc_principal' ? '💵 เงินสดสุทธิที่ต้องการรับ: ฿' + (tableReqNetCash ? tableReqNetCash.textContent : '0.00') + '\n' : ''}💰 ยอดเงินต้นทำสัญญา: ฿${tablePrincipal ? tablePrincipal.textContent : '0.00'}
📈 อัตราดอกเบี้ย: ${selectedRate.toFixed(2)}% ต่อปี
📅 วันที่เริ่มคิดดอกเบี้ย: ${tableStartDate ? tableStartDate.textContent : '-'}
🏁 กำหนดวันที่ชำระ: ${tableEndDate ? tableEndDate.textContent : '-'}
⏱️ ระยะเวลาคิดดอกเบี้ย: ${tablePeriod ? tablePeriod.textContent : '0 วัน'}
💵 ดอกเบี้ยต่อวัน: ${tableDailyInterest ? tableDailyInterest.textContent : '0.00'}
🔥 รวมดอกเบี้ยทั้งหมด: ฿${tableTotalInterest ? tableTotalInterest.textContent : '0.00'}
💸 การหักดอกเบี้ย: ${isInterestDeductedUpfront ? 'หักล่วงหน้า ณ วันกู้' : 'ไม่หักล่วงหน้า (ชำระ ณ วันครบกำหนด)'}
🛡️ หักค่าหุ้น 3%: ${isShareDeducted ? (tableShareAmount ? tableShareAmount.textContent : '0.00') : 'ไม่หัก'}
----------------------------------
✨ **${currentMode === 'mode_calc_principal' ? 'ยอดเงินต้นสัญญาที่ต้องทำกู้: ฿' + (heroMainAmount ? heroMainAmount.textContent : '0.00') : 'จำนวนเงินสดสุทธิที่จะได้รับ: ฿' + (heroMainAmount ? heroMainAmount.textContent : '0.00')}**
📌 ยอดชำระคืน ณ วันครบกำหนด: ${tableDueAmount ? tableDueAmount.textContent : '0.00'}`;

                navigator.clipboard.writeText(summaryText).then(() => {
                    showToast('คัดลอกสรุปข้อมูลลงคลิปบอร์ดแล้ว!');
                }).catch(err => {
                    showToast('ไม่สามารถคัดลอกได้');
                });
            });
        }

        // Print Button
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                const printNotice = document.getElementById('printDateNotice');
                if (printNotice) {
                    const today = new Date();
                    printNotice.textContent = `วันที่พิมพ์เอกสาร: ${formatThaiDate(today)}`;
                }
                window.print();
            });
        }

        // Scroll To Top Floating Button Listener
        window.addEventListener('scroll', () => {
            if (!scrollToTopBtn) return;
            if (window.scrollY > 220) {
                scrollToTopBtn.classList.remove('hidden');
            } else {
                scrollToTopBtn.classList.add('hidden');
            }
        });

        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    function showToast(msg) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // GUARANTEED INITIALIZATION
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
