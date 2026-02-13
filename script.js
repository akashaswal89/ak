let currentNumber = 0;
let allData = [];
let rangeData = []; // Range data store karne ke liye
let currentPage = 1;
const rowsPerPage = 10;

// 🔥 NEW FETCH: Browser Memory (LocalStorage) se data lena
async function fetchWithNoCache(type) {
    let key = type.includes('hack1') ? 'data1' : 'data2';
    let data = localStorage.getItem(key);
    
    if (data) {
        return JSON.parse(data);
    } else {
        try {
            const res = await fetch(`../../${key}.json?t=${Date.now()}`);
            const jsonData = await res.json();
            localStorage.setItem(key, JSON.stringify(jsonData));
            return jsonData;
        } catch (e) {
            console.error("JSON file load nahi ho saki");
            return [];
        }
    }
}

// 🔥 Pattern with Percentage Calculation
function getPatternWithPercentage(targetNumber, data) {
    const unitDigit = targetNumber % 10;
    let totalCount = 0, bigCount = 0, smallCount = 0, patternNumbers = [];

    // Pattern logic: Har 10 number piche check karta hai (e.g. 551 -> 541, 531...)
    for (let i = unitDigit; i < targetNumber; i += 10) {
        const entry = data.find(e => e.number === i);
        if (entry) {
            patternNumbers.push(entry.number);
            totalCount++;
            if (entry.result === "BIG") bigCount++;
            if (entry.result === "SMALL") smallCount++;
        }
    }

    let suggestion = "UNKNOWN";
    let percentage = 0;
    if (totalCount > 0) {
        if (bigCount > smallCount) {
            suggestion = "BIG";
            percentage = Math.round((bigCount / totalCount) * 100);
        } else if (smallCount > bigCount) {
            suggestion = "SMALL";
            percentage = Math.round((smallCount / totalCount) * 100);
        } else {
            suggestion = "NEUTRAL";
            percentage = 50;
        }
    }

    return { suggestion, percentage, totalCount, bigCount, smallCount };
}

// 🔍 MAIN RANGE ANALYSIS FUNCTION
async function generateRangeSuggestions() {
    const start = parseInt(document.getElementById('startRange').value);
    const end = parseInt(document.getElementById('endRange').value);

    if (isNaN(start) || isNaN(end)) {
        alert("Please enter valid range numbers");
        return;
    }

    const tbody = document.getElementById('rangeSuggestionTableBody');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Analyzing Databases...</td></tr>`;

    // Dono databases load karein
    const data1 = await fetchWithNoCache('hack1');
    const data2 = await fetchWithNoCache('hack2');

    rangeData = [];
    for (let num = start; num <= end; num++) {
        const res1 = getPatternWithPercentage(num, data1);
        const res2 = getPatternWithPercentage(num, data2);

        // Match Confidence Calculation
        let matchConf = 0;
        if (res1.suggestion === res2.suggestion && res1.suggestion !== "UNKNOWN") {
            matchConf = Math.round((res1.percentage + res2.percentage) / 2);
        } else {
            matchConf = Math.min(res1.percentage, res2.percentage);
        }

        rangeData.push({
            number: num,
            h1: res1.suggestion,
            h1P: res1.percentage,
            h2: res2.suggestion,
            h2P: res2.percentage,
            conf: matchConf
        });
    }

    displayRangeTable();
    updateSummary();
}

// 📊 RANGE TABLE DISPLAY
function displayRangeTable() {
    const tbody = document.getElementById('rangeSuggestionTableBody');
    tbody.innerHTML = "";

    rangeData.forEach(item => {
        const row = tbody.insertRow();
        
        // Match Confidence Color Class
        let confClass = 'confidence-very-low';
        if (item.conf >= 70) confClass = 'confidence-high';
        else if (item.conf >= 60) confClass = 'confidence-medium';
        else if (item.conf >= 50) confClass = 'confidence-low';

        row.innerHTML = `
            <td>${item.number}</td>
            <td>${item.h1} <span class="percentage-badge ${getPercentageBadgeColor(item.h1P)}">${item.h1P}%</span></td>
            <td>${item.h2} <span class="percentage-badge ${getPercentageBadgeColor(item.h2P)}">${item.h2P}%</span></td>
            <td class="${confClass}">${item.conf}%</td>
        `;
    });
}

function updateSummary() {
    const summary = document.getElementById('rangeSummary');
    const content = document.getElementById('summaryContent');
    if(summary && rangeData.length > 0) {
        summary.style.display = 'block';
        const highMatch = rangeData.filter(d => d.conf >= 70).length;
        content.innerHTML = `Analysed ${rangeData.length} numbers. Found <b>${highMatch}</b> high confidence signals.`;
    }
}

// ✅ WINDOW LOAD
window.onload = async () => {
    const data = await fetchWithNoCache('hack1');
    allData = [...data].reverse();
    currentNumber = data.length > 0 ? data[data.length - 1].number + 1 : 1;
    
    const input = document.getElementById('numberInput');
    if(input) input.value = currentNumber;

    renderPage(currentPage);
};

// ✅ SUBMIT RESULT
function submitResult(result) {
    const numToSave = parseInt(document.getElementById('numberInput').value) || currentNumber;
    let data = JSON.parse(localStorage.getItem('data1')) || [];
    data.push({ number: numToSave, result: result });
    localStorage.setItem('data1', JSON.stringify(data));

    allData = [ {number: numToSave, result: result}, ...allData];
    currentNumber = numToSave + 1;
    document.getElementById('numberInput').value = currentNumber;
    renderPage(1);
    generateRangeSuggestions(); // Update range immediately
}

// ✅ MAIN TABLE RENDER
function renderPage(page) {
    const tbody = document.getElementById('tableBody');
    if(!tbody) return;
    tbody.innerHTML = "";
    const start = (page - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, allData.length);
    for (let i = start; i < end; i++) {
        const e = allData[i];
        const row = tbody.insertRow();
        row.innerHTML = `<td>${e.number}</td><td class="${e.result.toLowerCase()}">${e.result}</td>`;
    }
}

// Pagination placeholder
function nextPage() { currentPage++; renderPage(currentPage); }
function prevPage() { if(currentPage > 1) currentPage--; renderPage(currentPage); }
















function displayRangeTable() {
    const tbody = document.getElementById('rangeSuggestionTableBody');
    tbody.innerHTML = "";

    rangeData.forEach(item => {
        const row = tbody.insertRow();
        
        // --- IMPROVED MATCH LOGIC ---
        // 1. Dono same hone chahiye
        // 2. Result "BIG" ya "SMALL" hi hona chahiye (NEUTRAL ya UNKNOWN par highlight nahi hoga)
        const isStrongMatch = (item.h1 === item.h2) && (item.h1 === "BIG" || item.h1 === "SMALL");

        if (isStrongMatch) {
            row.style.backgroundColor = "#32cd32"; // Dark Green background
            // row.style.color = "#ffffff";           // White text
            row.style.fontWeight = "bold";
        } else {
            // Reset style for non-matching rows
            row.style.backgroundColor = "";
            row.style.color = "";
        }

        // Confidence Classes for the last column
        let confClass = 'confidence-very-low';
        if (item.conf >= 70) confClass = 'confidence-high';
        else if (item.conf >= 60) confClass = 'confidence-medium';
        else if (item.conf >= 50) confClass = 'confidence-low';

        row.innerHTML = `
            <td>${item.number}</td>
            <td>${item.h1} <span class="percentage-badge ${getPercentageBadgeColor(item.h1P)}">${item.h1P}%</span></td>
            <td>${item.h2} <span class="percentage-badge ${getPercentageBadgeColor(item.h2P)}">${item.h2P}%</span></td>
            <td class="${confClass}">${item.conf}%</td>
        `;

        // Optional: Match hone par badge ka appearance clean rakhne ke liye
        if (isStrongMatch) {
            const badges = row.querySelectorAll('.percentage-badge');
            badges.forEach(b => {
                // b.style.border = "1px solid rgba(255,255,255,0.5)";
                b.style.color = "white";
                b.style.textShadow = "none";
            });
        }
    });
}