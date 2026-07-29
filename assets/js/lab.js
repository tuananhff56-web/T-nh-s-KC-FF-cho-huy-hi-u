
const BATCH_COST_FIRST = 89;
const BATCH_COST_SUBSEQUENT = 179;
const SINGLE_COST_FIRST = 9;
const SINGLE_COST_SUBSEQUENT = 19;
// SINGLE_THRESHOLD removed, now dynamic

const VAR_VALUES = [1, 2, 3, 5, 10];

const runBtn = document.getElementById('runBtn');
if (runBtn) {
    runBtn.addEventListener('click', runSimulation);
}

function runSimulation() {
    const targetBadges = parseInt(document.getElementById('targetBadges').value);
    let singleSpinThreshold = parseInt(document.getElementById('singleSpinThreshold').value) || 0;
    if (singleSpinThreshold < 0) {
        singleSpinThreshold = 0;
        document.getElementById('singleSpinThreshold').value = 0;
    }
    const simCount = parseInt(document.getElementById('simCount').value) || 10000;
    const p1 = parseFloat(document.getElementById('prob1').value);
    const p2 = parseFloat(document.getElementById('prob2').value);
    const p3 = parseFloat(document.getElementById('prob3').value);
    const p5 = parseFloat(document.getElementById('prob5').value);
    const p10 = parseFloat(document.getElementById('prob10').value);

    // Validate Percentages
    const totalProb = p1 + p2 + p3 + p5 + p10;
    const errorEl = document.getElementById('prob-error');

    if (Math.abs(totalProb - 100) > 0.1) {
        errorEl.textContent = `Tổng tỷ lệ hiện tại là ${totalProb.toFixed(1)}%. Vui lòng điều chỉnh về 100%.`;
        return;
    } else if (singleSpinThreshold > targetBadges) {
        errorEl.textContent = `Ngưỡng quay lẻ phải nhỏ hơn hoặc bằng mục tiêu (${targetBadges}).`;
        return;
    } else {
        errorEl.textContent = '';
    }

    const weights = [p1, p2, p3, p5, p10];

    // UI Feedback
    const btn = document.getElementById('runBtn');
    const originalText = btn.textContent;
    btn.textContent = "Đang chạy...";
    btn.disabled = true;

    // Run async to not freeze UI
    const progressContainer = document.getElementById('simpleProgressContainer');
    const progressBar = document.getElementById('simpleProgressBar');
    const progressText = document.getElementById('simpleProgressText');
    const progressStatus = document.getElementById('simpleProgressStatus');

    if (progressContainer && progressBar) {
        progressContainer.classList.remove('hidden');
        if (progressText) progressText.textContent = '0%';
        if (progressStatus) progressStatus.textContent = "Đang chạy...";
        progressBar.style.width = '0%';

        let width = 0;
        const interval = setInterval(() => {
            width += 5;
            if (width > 100) width = 100;
            progressBar.style.width = width + '%';
            if (progressText) progressText.textContent = width + '%';

            if (width >= 100) {
                clearInterval(interval);
                setTimeout(runMonteCarloSimulation, 100);
            }
        }, 20);
    } else {
        // Fallback if elements invalid
        setTimeout(runMonteCarloSimulation, 50);
    }

    function runMonteCarloSimulation() {
        try {
            const results = monteCarlo(targetBadges, weights, simCount, singleSpinThreshold);
            displayResults(results, simCount);

            if (progressStatus) progressStatus.textContent = `Đã chạy thử ${simCount.toLocaleString()} lần!`;

            document.getElementById('resultsPanel').classList.remove('hidden');
            document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            console.error("Simulation error:", e);
            alert("Đã có lỗi xảy ra khi chạy mô phỏng. Vui lòng kiểm tra console.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

function monteCarlo(target, weights, N, threshold) {
    // N is passed from runSimulation
    const costs = [];

    for (let i = 0; i < N; i++) {
        costs.push(simulateOneRun(target, weights, threshold));
    }

    return calculateStats(costs);
}

function simulateOneRun(target, weights, threshold) {
    let currentBadges = 0;
    let batchPulls = 0;
    let singlePulls = 0;
    let singleCycleIndex = 0; // Cycle counter for single pulls

    // Batch Phase
    while (currentBadges < target) {
        let remaining = target - currentBadges;
        if (remaining <= threshold) break;

        currentBadges += simulateBatch(weights);
        batchPulls++;
    }

    // Single Phase (cycle-based: same distribution as batch)
    while (currentBadges < target) {
        currentBadges += simulateSingleCycle(weights, singleCycleIndex);
        singleCycleIndex = (singleCycleIndex + 1) % 10;
        singlePulls++;
    }

    // Calculate Cost
    let totalCost = 0;
    if (batchPulls > 0) {
        totalCost += BATCH_COST_FIRST + (batchPulls - 1) * BATCH_COST_SUBSEQUENT;
    }
    if (singlePulls > 0) {
        totalCost += SINGLE_COST_FIRST + (singlePulls - 1) * SINGLE_COST_SUBSEQUENT;
    }
    return totalCost;
}

function simulateBatch(weights) {
    // Guaranteed Batch Logic: 5x "1 Badge" + 1x Special + 4x Random
    let badges = 5;

    // Special Slot Logic (6th Item)
    // weights[0] is p1 (probability of 1 Badge)
    const p1 = weights[0];
    let specialProb1 = 85; // Default if p1 < 85

    if (p1 >= 85) {
        specialProb1 = p1;
    }

    const rand = Math.random() * 100;
    if (rand < specialProb1) {
        badges += 1;
    } else {
        badges += 2; // The remaining % is for 2 Badges
    }

    // 4 Random Spins using full probability table
    for (let i = 0; i < 4; i++) {
        badges += simulateSingle(weights);
    }
    return badges;
}

function isValidBatch(items) {
    const count10 = items.filter(x => x === 10).length;
    const count5 = items.filter(x => x === 5).length;

    if (count10 > 2) return false;
    if (count5 > 2) return false;
    if (count10 === 2 && count5 > 1) return false;

    // Check [3, 3, 3, 3]
    const count3 = items.filter(x => x === 3).length;
    if (count3 === 4) return false;

    return true;
}

// --- Fantasy Background Particles ---
function initParticles() {
    const container = document.getElementById('particles-container');
    const particleCount = 50; // Slightly increased for density with low opacity

    // Clear existing
    container.innerHTML = '';

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const p = document.createElement('div');
    p.classList.add('particle');

    // Random properties
    const size = Math.random() * 5 + 3; // 3px to 8px (Larger)
    const posX = Math.random() * 100; // 0% to 100%
    const delay = Math.random() * -40; // Spread out start times
    const duration = Math.random() * 20 + 20; // 20s to 40s (Very Slow)
    const driftX = (Math.random() - 0.5) * 150 + 'px'; // -75px to 75px sway
    const maxOpacity = Math.random() * 0.5 + 0.3; // 0.3 to 0.8 opacity (More visible)

    // Color Palette: Gold (#ffd700), Soft Purple (#c084fc), White (#ffffff)
    const colors = ['#ffd700', '#c084fc', '#ffffff', '#fbbf24'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Apply styles
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${posX}%`;
    p.style.backgroundColor = color;
    p.style.color = color; // For box-shadow currentColor
    p.style.animationDelay = `${delay}s`;
    p.style.animationDuration = `${duration}s`;
    p.style.setProperty('--drift-x', driftX);
    p.style.setProperty('--max-opacity', maxOpacity);

    container.appendChild(p);
}

// Cycle-based single spin for simulation (matches batch distribution)
function simulateSingleCycle(weights, cycleIndex) {
    if (cycleIndex < 5) {
        // Fixed slot: always 1 badge
        return 1;
    } else if (cycleIndex === 5) {
        // Special slot: 85% -> 1, 15% -> 2
        const p1 = weights[0];
        let specialProb1 = 85;
        if (p1 >= 85) specialProb1 = p1;
        const rand = Math.random() * 100;
        return rand < specialProb1 ? 1 : 2;
    } else {
        // Random slot (6-9): full probability table
        return weightedRandom(VAR_VALUES, weights);
    }
}

function simulateSingle(weights) {
    // Legacy: pure random single (used by simulateBatch for 4 random slots)
    return weightedRandom(VAR_VALUES, weights);
}

function weightedRandom(values, weights) {
    let sum = 0;
    const r = Math.random() * 100;
    for (let i = 0; i < values.length; i++) {
        sum += weights[i];
        if (r < sum) return values[i];
    }
    return values[values.length - 1];
}

function calculateStats(costs) {
    costs.sort((a, b) => a - b);
    const sum = costs.reduce((a, b) => a + b, 0);

    return {
        min: costs[0],
        max: costs[costs.length - 1],
        mean: sum / costs.length,
        median: costs[Math.floor(costs.length / 2)],
        p99: costs[Math.floor(costs.length * 0.99)],
        percentiles: {
            10: costs[Math.floor(costs.length * 0.10)],
            25: costs[Math.floor(costs.length * 0.25)],
            50: costs[Math.floor(costs.length * 0.50)],
            75: costs[Math.floor(costs.length * 0.75)],
            90: costs[Math.floor(costs.length * 0.90)]
        }
    };
}

function displayResults(stats, simCount) {
    document.getElementById('meanCost').textContent = Math.round(stats.mean);
    document.getElementById('p99Cost').textContent = stats.p99;
    document.getElementById('minCost').textContent = stats.min;
    document.getElementById('maxCost').textContent = stats.max;

    const pList = document.getElementById('percentilesList');
    pList.innerHTML = '';

    const pKeys = [10, 25, 50, 75, 90];
    const labels = {
        10: "Hên (10%)",
        25: "Hơi hên (25%)",
        50: "Trung bình (50%)",
        75: "Hơi xui (75%)",
        90: "Chắc chắn (90%)"
    };

    pKeys.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${labels[p]}</span> <span>${stats.percentiles[p]} 💎</span>`;
        pList.appendChild(li);
    });

    // Dynamic Insight Message
    const targetBadges = document.getElementById('targetBadges').value;
    const medianCost = stats.median;
    const insightMsg = `Bảng này cho biết thường cần khoảng bao nhiêu KC để đủ ${targetBadges} huy hiệu. <br>
    Ví dụ: khoảng 50% người chơi sẽ cần tầm <strong>${medianCost} 💎</strong> hoặc ít hơn.`;


    document.getElementById('insight-message').innerHTML = insightMsg;

    // Get current probabilities
    const probs = {
        1: document.getElementById('prob1').value,
        2: document.getElementById('prob2').value,
        3: document.getElementById('prob3').value,
        5: document.getElementById('prob5').value,
        10: document.getElementById('prob10').value
    };

    // Save to history
    const historyItem = {
        timestamp: new Date().toISOString(),
        targetBadges: targetBadges,
        medianCost: stats.median,
        p99Cost: stats.p99,
        simCount: simCount,
        probs: probs
    };
    saveHistory(historyItem);
}

// --- History System ---
const HISTORY_KEY = 'gacha_simulation_history_v2'; // Changed key to reset history structure

function loadHistory() {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
}

function saveHistory(result) {
    const history = loadHistory();
    // Add new result to the beginning
    history.unshift(result);
    // Keep only last 50 entries
    if (history.length > 50) history.pop();

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = loadHistory();
    const listEl = document.getElementById('historyList');
    const panelEl = document.getElementById('historyPanel');

    // Only show panel if history exists
    if (history.length > 0) {
        panelEl.classList.remove('hidden');
    } else {
        listEl.innerHTML = '<div class="empty-message">Chưa có dữ liệu lịch sử.</div>';
        return;
    }

    listEl.innerHTML = '';

    history.forEach(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

        const card = document.createElement('div');
        card.className = 'history-card average';

        // Format probabilities if they exist
        let probString = '';
        if (item.probs) {
            probString = `
            <div style="font-size: 0.8rem; color: #aaa; margin-top: 5px; font-style: italic;">
                Tỷ lệ: 1(${item.probs[1]}%) - 2(${item.probs[2]}%) - 3(${item.probs[3]}%) - 5(${item.probs[5]}%) - 10(${item.probs[10]}%)
            </div>`;
        }

        card.innerHTML = `
            <div class="history-info">
                <span class="history-time">${timeStr}</span>
                <span class="history-badge-target">Mục tiêu: ${item.targetBadges} Huy hiệu</span>
                ${probString}
            </div>
            <div class="history-stats">
                <div class="stat-row">
                    <span class="history-label">Trung bình (50%):</span>
                    <span class="history-cost">${item.medianCost.toLocaleString()} 💎</span>
                </div>
                 <div class="stat-row" style="margin-top:2px">
                    
                </div>
            </div>
            
        `;
        listEl.appendChild(card);
    });
}


// --- Modal Logic ---
function showClearModal() {
    document.getElementById('confirmationModal').classList.remove('hidden');
}

function hideClearModal() {
    document.getElementById('confirmationModal').classList.add('hidden');
}

function confirmClearHistory() {
    localStorage.removeItem(HISTORY_KEY);

    // Update UI
    renderHistory();
    document.getElementById('historyPanel').classList.add('hidden');

    hideClearModal();

    // Optional: Toast notification instead of alert
    // For now, let's just show the modal closed. 
    // Or we can simple use existing alert
    // alert("Đã xóa lịch sử thành công!"); 
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    try {
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', showClearModal);
        } else {
            console.error("Clear History button not found!");
        }

        // Modal Event Listeners
        const cancelBtn = document.getElementById('cancelDeleteBtn');
        const confirmBtn = document.getElementById('confirmDeleteBtn');

        if (cancelBtn) cancelBtn.addEventListener('click', hideClearModal);
        if (confirmBtn) confirmBtn.addEventListener('click', confirmClearHistory);

        // Close modal on click outside
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideClearModal();
            });
        }

        initParticles();
        // initSpin(); // Removed undefined call
        renderHistory();
    } catch (e) {
        console.error("Initialization error:", e);
    }
});

// --- FF Gacha Simulation ---
class SpinGame {
    constructor() {
        this.totalSpent = 0;
        this.currentBadges = 0;
        this.targetBadges = 50;
        this.isSpinning = false;
        this.inventory = { 1: 0, 2: 0, 3: 0, 5: 0, 10: 0 }; // Inventory tracking
        this.probs = { 1: 65, 2: 15, 3: 12, 5: 5, 10: 3 };
        this.firstTime = { one: true, ten: true };
        this.singleSpinCycleIndex = 0; // Cycle counter for single spin (0-9)
        setTimeout(() => this.init(), 100);
    }

    init() {
        this.updateTarget();
        this.updateProb();
        this.updateUI();
    }

    updateTarget() {
        if (this.goalLocked) return;
        const input = document.getElementById('targetBadgeInput');
        if (input) {
            let val = parseInt(input.value);
            if (val > 0) this.targetBadges = val;
            this.updateUI();
        }
    }

    lockTarget() {
        const input = document.getElementById('targetBadgeInput');
        const btn = document.getElementById('lockTargetBtn');

        if (input && input.value > 0) {
            this.goalLocked = true;
            this.targetBadges = parseInt(input.value);
            input.disabled = true;
            if (btn) {
                btn.disabled = true;
                btn.classList.add('locked');
            }
            this.updateUI();
        }
    }

    updateProb() {
        const p1 = parseInt(document.getElementById('prob1').value) || 0;
        const p2 = parseInt(document.getElementById('prob2').value) || 0;
        const p3 = parseInt(document.getElementById('prob3').value) || 0;
        const p5 = parseInt(document.getElementById('prob5').value) || 0;
        const p10 = parseInt(document.getElementById('prob10').value) || 0;

        const sum = p1 + p2 + p3 + p5 + p10;
        const warning = document.getElementById('probWarning');

        if (sum !== 100) {
            if (warning) warning.classList.remove('hidden');
        } else {
            if (warning) warning.classList.add('hidden');
            this.probs = { 1: p1, 2: p2, 3: p3, 5: p5, 10: p10 };
        }
    }

    spin(times) {
        if (this.isSpinning) return;

        // Calculate cost based on first-time status
        let cost;
        if (times === 1) {
            cost = this.firstTime.one ? 9 : 19;
            if (this.firstTime.one) {
                this.firstTime.one = false;
                this.updateButtonAfterFirstSpin('spinOneBtn');
            }
        } else {
            cost = this.firstTime.ten ? 89 : 179;
            if (this.firstTime.ten) {
                this.firstTime.ten = false;
                this.updateButtonAfterFirstSpin('spinTenBtn');
            }
        }

        this.totalSpent += cost;
        this.updateUI();
        this.isSpinning = true;
        this.animateSpin(times);
    }

    getRewardValue() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (let k of [10, 5, 3, 2, 1]) {
            cumulative += this.probs[k];
            if (rand < cumulative) return k;
        }
        return 1;
    }

    // Single spin uses same distribution as batch: 5 fixed + 1 special + 4 random per 10-spin cycle
    // Order is shuffled each cycle for a natural gacha feel
    getSingleRewardValue() {
        if (!this._cycleRewards || this._cycleRewards.length === 0) {
            // Generate new cycle: 5x1 + 1xSpecial + 4xRandom, then shuffle
            const cycle = [1, 1, 1, 1, 1];

            // Special slot
            const p1 = this.probs[1];
            const specialProb1 = p1 >= 85 ? p1 : 85;
            cycle.push(Math.random() * 100 < specialProb1 ? 1 : 2);

            // 4 Random slots
            for (let i = 0; i < 4; i++) cycle.push(this.getRewardValue());

            // Fisher-Yates shuffle
            for (let i = cycle.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cycle[i], cycle[j]] = [cycle[j], cycle[i]];
            }
            this._cycleRewards = cycle;
        }
        return this._cycleRewards.shift();
    }

    animateSpin(times) {
        const cells = document.querySelectorAll('.honeycomb-diamond .hex-cell.normal');
        const centerPrize = document.querySelector('.center-prize');

        if (!cells.length) return;

        let activeIndex = 0;
        const interval = setInterval(() => {
            cells.forEach(c => c.classList.remove('active'));
            cells[activeIndex].classList.add('active');
            activeIndex = (activeIndex + 1) % cells.length;
        }, 80);

        let totalBadges = 0, maxVal = 0;
        const rewards = []; // Track individual rewards

        if (times === 10) {
            // Guaranteed Batch Logic: 5x "1 Badge" + 1x Special + 4x Random
            for (let i = 0; i < 5; i++) rewards.push(1);

            // Special Slot (6th)
            const p1 = this.probs[1];
            let specialProb1 = 85;
            if (p1 >= 85) specialProb1 = p1;

            const rand = Math.random() * 100;
            if (rand < specialProb1) rewards.push(1);
            else rewards.push(2);

            // 4 Random
            for (let i = 0; i < 4; i++) rewards.push(this.getRewardValue());

            // Shuffle rewards for visual randomness
            for (let i = rewards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
            }
        } else {
            // Single Spin Logic: Cycle-based (same distribution as batch)
            for (let i = 0; i < times; i++) {
                rewards.push(this.getSingleRewardValue());
            }
        }

        rewards.forEach(val => {
            totalBadges += val;
            if (val > maxVal) maxVal = val;
        });

        setTimeout(() => {
            clearInterval(interval);
            cells.forEach(c => c.classList.remove('active'));

            const targetCells = Array.from(cells).filter(c => parseInt(c.getAttribute('data-val')) === maxVal);
            const landingCell = targetCells.length > 0 ? targetCells[Math.floor(Math.random() * targetCells.length)] : cells[0];

            landingCell.classList.add('active');

            if (maxVal >= 10 && centerPrize) {
                centerPrize.style.transform = "scale(1.2)";
                setTimeout(() => centerPrize.style.transform = "", 400);
            }

            // Update Inventory Logic
            rewards.forEach(val => {
                if (this.inventory[val] !== undefined) {
                    this.inventory[val]++;
                }
            });

            this.currentBadges += totalBadges;
            this.updateUI();
            this.showResult(totalBadges, rewards, times);
            this.isSpinning = false;

            setTimeout(() => landingCell.classList.remove('active'), 2500);
        }, 2000);
    }




    showResult(totalBadges, rewards, spinType = 10) {
        // Updated for Modal Display
        const modal = document.getElementById('resultModal');
        const grid = document.getElementById('resultGrid');

        if (!modal || !grid) {
            console.error("Result modal elements not found!");
            return;
        }

        // 1. Show Modal
        modal.classList.remove('hidden');
        // Small delay to allow display:flex to apply before adding active class for transition
        setTimeout(() => modal.classList.add('active'), 10);

        // Update Modal Spin Button (Dynamic)
        const modalActionBtn = document.getElementById('modalSpinActionBtn');
        const modalPriceEl = document.getElementById('modalSpinPrice');

        if (modalActionBtn && modalPriceEl) {
            let nextPrice = 0;
            let btnText = "";

            if (spinType === 1) {
                btnText = "QUAY 1 LẦN";
                nextPrice = this.firstTime.one ? 9 : 19;
                modalActionBtn.onclick = () => this.spinFromModal(1);
            } else {
                btnText = "QUAY 10 LẦN";
                nextPrice = this.firstTime.ten ? 89 : 179;
                modalActionBtn.onclick = () => this.spinFromModal(10);
            }

            modalActionBtn.textContent = btnText;
            modalPriceEl.textContent = nextPrice;
        }

        // 2. Clear previous
        grid.innerHTML = '';

        // Handle Single Item Centering
        if (rewards.length === 1) {
            grid.classList.add('single-item');
        } else {
            grid.classList.remove('single-item');
        }

        // 3. Generate Items
        rewards.forEach((val, index) => {
            const item = document.createElement('div');
            // For single item, we don't need stagger delay, or maybe just immediate
            const delayClass = rewards.length === 1 ? 'stagger-delay-0' : `stagger-delay-${index}`;
            item.className = `result-item ${delayClass}`;

            // Icon based on value
            let icon = '🏅';
            if (val >= 10) icon = '👑';
            else if (val >= 5) icon = '🥇';
            else if (val >= 3) icon = '🥈';
            else if (val >= 2) icon = '🥉';

            item.innerHTML = `
                <div class="item-icon">${icon}</div>
                <div class="item-value">x${val}</div>
                <div class="item-unit">HH</div>
            `;

            grid.appendChild(item);

            // Trigger animation frame
            requestAnimationFrame(() => {
                item.classList.add('revealed');
            });
        });

        // 4. Global Counter Update (Notification Bar)
        this.showGlobalCounterUpdate(totalBadges);
    }

    showGlobalCounterUpdate(amount) {
        // NEW: Bottom-Right Notification Bar Logic
        const notifBar = document.getElementById('badgeNotification');
        const totalEl = document.getElementById('notifTotal');
        const addedEl = document.getElementById('notifAdded');

        if (!notifBar || !totalEl || !addedEl) return;

        // Populate values
        totalEl.textContent = this.currentBadges; // Total currently owned
        addedEl.textContent = `(+${amount})`; // Amount just added

        // Show notification
        notifBar.classList.remove('hidden');
        // Trigger reflow
        void notifBar.offsetWidth;
        notifBar.classList.add('active');

        // PERSISTENT: Do not auto-hide here. It will hide when modal closes.
        if (this.notifTimeout) clearTimeout(this.notifTimeout);
    }

    closeResultModal() {
        const modal = document.getElementById('resultModal');
        const notifBar = document.getElementById('badgeNotification');

        // Hide notification bar when closing modal
        if (notifBar) {
            notifBar.classList.remove('active');
            setTimeout(() => notifBar.classList.add('hidden'), 400);
        }

        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                document.getElementById('resultGrid').innerHTML = '';
            }, 300); // Wait for transition
        }
    }

    spinFromModal(times) {
        this.closeResultModal();
        // Slight delay to allow modal to close before spinning
        setTimeout(() => {
            this.spin(times);
        }, 300);
    }

    updateUI() {
        const spentEl = document.getElementById('totalSpent');
        if (spentEl) spentEl.textContent = this.totalSpent.toLocaleString();

        // 1. Update Progress (Vertical)
        const progressFill = document.getElementById('badgeProgressBar');

        // Sidebar Counters
        const currentValEl = document.querySelector('.status-counters .current-val');
        const targetValEl = document.querySelector('.status-counters .target-val');

        if (currentValEl) currentValEl.textContent = this.currentBadges;
        if (targetValEl) targetValEl.textContent = this.targetBadges;

        if (progressFill) {
            const pct = Math.min(100, (this.currentBadges / this.targetBadges) * 100);
            const isMobile = window.innerWidth <= 1024;
            if (isMobile) {
                progressFill.style.width = `${pct}%`;
                progressFill.style.height = '100%';
            } else {
                progressFill.style.height = `${pct}%`;
                progressFill.style.width = '100%';
            }

            // Completion Effect
            if (this.currentBadges >= this.targetBadges) {
                progressFill.style.boxShadow = "0 0 20px #ffd700";
            } else {
                progressFill.style.boxShadow = "";
            }
        }

        // 2. Update Inventory List
        const invList = document.getElementById('inventoryList');
        if (invList) {
            invList.innerHTML = '';
            // Sort keys 10 -> 1 for better visibility of high value items
            [10, 5, 3, 2, 1].forEach(key => {
                const count = this.inventory[key];
                if (count > 0) {
                    const item = document.createElement('div');
                    item.className = 'inv-item';

                    let badgeIcon = '🏅';
                    if (key >= 10) badgeIcon = '👑';
                    else if (key >= 5) badgeIcon = '🥇';
                    else if (key >= 3) badgeIcon = '🥈';
                    else if (key >= 2) badgeIcon = '🥉';

                    item.innerHTML = `
                        <span class="inv-badge">${badgeIcon}</span>
                        <span class="inv-name">x${key} <span class="badge-unit">HH</span></span>
                        <span class="inv-count">x${count}</span>
                    `;
                    invList.appendChild(item);
                }
            });

            // Empty state
            if (Object.values(this.inventory).every(x => x === 0)) {
                invList.innerHTML = '<div style="text-align:center; color:#888; padding:10px; font-style:italic;">Chưa có vật phẩm</div>';
            }
        }
    }

    updateButtonAfterFirstSpin(btnId) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        const wrapper = btn.closest('.btn-wrapper');
        if (wrapper) {
            wrapper.classList.remove('first-time');
        }

        const oldPrice = btn.querySelector('.old-price');
        const newPrice = btn.querySelector('.new-price');

        if (oldPrice && newPrice) {
            const price = btnId === 'spinOneBtn' ? '19' : '179';
            oldPrice.style.display = 'none';
            newPrice.textContent = `${price}`;
        }
    }

    lockProb() {
        if (this.probLocked) return; // Already locked, do nothing (unlock handled by separate button)

        // Validation before locking
        const p1 = parseInt(document.getElementById('prob1').value) || 0;
        const p2 = parseInt(document.getElementById('prob2').value) || 0;
        const p3 = parseInt(document.getElementById('prob3').value) || 0;
        const p5 = parseInt(document.getElementById('prob5').value) || 0;
        const p10 = parseInt(document.getElementById('prob10').value) || 0;
        const sum = p1 + p2 + p3 + p5 + p10;

        if (sum !== 100) {
            this.showToast(`Tổng tỷ lệ hiện tại là ${sum}%. Vui lòng điều chỉnh lại.`, 'error');
            return;
        }

        // LOCK ACTION
        this.probLocked = true;

        // 1. Disable Inputs
        [1, 2, 3, 5, 10].forEach(k => {
            const el = document.getElementById(`prob${k}`);
            if (el) el.disabled = true;
        });

        // 2. Update Lock Button UI
        const btn = document.getElementById('lockProbBtn');
        if (btn) {
            btn.classList.add('locked');
            btn.classList.add('snap-effect'); // Trigger animation

            // Wait for animation, then remove class
            setTimeout(() => btn.classList.remove('snap-effect'), 200);

            // Change Text & Icon
            const textSpan = btn.querySelector('.btn-text');
            const iconSpan = btn.querySelector('.btn-icon');
            if (textSpan) textSpan.textContent = "ĐÃ KHÓA";
            if (iconSpan) iconSpan.textContent = "🔒";
        }

        // 3. Update Indicator
        const ind = document.getElementById('lockStatusInd');
        if (ind) ind.classList.add('active');

        // 4. Show Unlock Button
        const unlockBtn = document.getElementById('unlockProbBtn');
        if (unlockBtn) unlockBtn.classList.remove('hidden');

        this.showToast("Đã chốt tỷ lệ thành công!");
    }

    unlockProb() {
        if (!this.probLocked) return;

        // UNLOCK ACTION
        this.probLocked = false;

        // 1. Enable Inputs
        [1, 2, 3, 5, 10].forEach(k => {
            const el = document.getElementById(`prob${k}`);
            if (el) el.disabled = false;
        });

        // 2. Update Lock Button UI
        const btn = document.getElementById('lockProbBtn');
        if (btn) {
            btn.classList.remove('locked');

            const textSpan = btn.querySelector('.btn-text');
            const iconSpan = btn.querySelector('.btn-icon');
            if (textSpan) textSpan.textContent = "XÁC NHẬN & KHÓA";
            if (iconSpan) iconSpan.textContent = "🔓";
        }

        // 3. Update Indicator
        const ind = document.getElementById('lockStatusInd');
        if (ind) ind.classList.remove('active');

        // 4. Hide Unlock Button
        const unlockBtn = document.getElementById('unlockProbBtn');
        if (unlockBtn) unlockBtn.classList.add('hidden');
    }

    toggleSidebar(force = false) {
        const sidebar = document.getElementById('configSidebar');
        if (sidebar) {
            // Check if closing
            if (!sidebar.classList.contains('collapsed')) {
                // If force is false, check for unsaved changes
                if (!force && this.hasUnsavedChanges()) {
                    this.showUnsavedChangesModal();
                    return;
                }

                const p1 = parseInt(document.getElementById('prob1').value) || 0;
                const p2 = parseInt(document.getElementById('prob2').value) || 0;
                const p3 = parseInt(document.getElementById('prob3').value) || 0;
                const p5 = parseInt(document.getElementById('prob5').value) || 0;
                const p10 = parseInt(document.getElementById('prob10').value) || 0;
                const sum = p1 + p2 + p3 + p5 + p10;

                if (sum !== 100) {
                    // Reset to defaults
                    document.getElementById('prob1').value = 65;
                    document.getElementById('prob2').value = 15;
                    document.getElementById('prob3').value = 12;
                    document.getElementById('prob5').value = 5;
                    document.getElementById('prob10').value = 3;

                    this.updateProb(); // Update warning and internal state
                    this.updateProb(); // Update warning and internal state
                    this.showToast("Tổng tỷ lệ không bằng 100%. Đã đặt lại về mặc định.");
                }
            }
            sidebar.classList.toggle('collapsed');

            // Toggle Overlay
            const overlay = document.getElementById('sidebarOverlay');
            if (overlay) {
                overlay.classList.toggle('hidden');
            }
        }
    }

    hasUnsavedChanges() {
        if (this.probLocked) return false; // Already locked/saved

        const p1 = parseInt(document.getElementById('prob1').value) || 0;
        const p2 = parseInt(document.getElementById('prob2').value) || 0;
        const p3 = parseInt(document.getElementById('prob3').value) || 0;
        const p5 = parseInt(document.getElementById('prob5').value) || 0;
        const p10 = parseInt(document.getElementById('prob10').value) || 0;

        const sum = p1 + p2 + p3 + p5 + p10;
        if (sum !== 100) return false; // If sum is not 100, let existing logic handle it (reset to default)

        // Check if different from default
        if (p1 !== 65 || p2 !== 15 || p3 !== 12 || p5 !== 5 || p10 !== 3) {
            return true;
        }
        return false;
    }

    showUnsavedChangesModal() {
        const modal = document.getElementById('unsavedChangesModal');
        if (modal) modal.classList.remove('hidden');
    }

    hideUnsavedChangesModal() {
        const modal = document.getElementById('unsavedChangesModal');
        if (modal) modal.classList.add('hidden');
    }

    confirmLockAndClose() {
        this.lockProb();
        this.hideUnsavedChangesModal();
        setTimeout(() => {
            this.toggleSidebar(true); // Force close
        }, 100);
    }

    validateProbInput(input) {
        if (input.value < 0) input.value = 0;
        if (input.value > 100) input.value = 100;
    }

    handleInput(input) {
        // Enforce max 999
        if (input.value > 999) input.value = 999;
        if (input.value < 0) input.value = 0;

        // Auto width
        const val = input.value.toString();
        input.style.width = Math.max(1, val.length) + 'ch';
    }

    resetProbs() {
        // Always unlock if currently locked
        if (this.probLocked) {
            this.unlockProb();
        }

        document.getElementById('prob1').value = 65;
        document.getElementById('prob2').value = 15;
        document.getElementById('prob3').value = 12;
        document.getElementById('prob5').value = 5;
        document.getElementById('prob10').value = 3;
        this.updateProb();
        this.showToast("Đã đặt lại tỷ lệ về mặc định.", "success");
    }

    changeProb(id, amount) {
        if (this.probLocked) {
            this.showToast("Vui lòng mở khóa để điều chỉnh.", "error");
            return;
        }
        const input = document.getElementById(id);
        if (input) {
            let val = parseInt(input.value) || 0;
            val = Math.max(0, Math.min(100, val + amount));
            input.value = val;
            this.validateProbInput(input);
            this.updateProb();
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('customToast');
        const msgEl = document.getElementById('toastMessage');

        if (toast && msgEl) {
            msgEl.textContent = message;

            // Remove previous type classes
            toast.classList.remove('success', 'error');
            toast.classList.add(type);

            toast.classList.remove('hidden');

            // Clear existing timeout if any
            if (this.toastTimeout) clearTimeout(this.toastTimeout);

            this.toastTimeout = setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }

    resetProgress() {
        // Reset diamonds and badges only, keep probabilities
        this.totalSpent = 0;
        this.currentBadges = 0;
        this.firstTime = { one: true, ten: true };
        this.inventory = { 1: 0, 2: 0, 3: 0, 5: 0, 10: 0 };

        // Reset Target Lock (allow editing target again)
        this.goalLocked = false;
        const input = document.getElementById('targetBadgeInput');
        const lockBtn = document.getElementById('lockTargetBtn');

        if (input) input.disabled = false;
        if (lockBtn) {
            lockBtn.disabled = false;
            lockBtn.classList.remove('locked');
        }

        // Reset button prices to first-time state
        ['spinOneBtn', 'spinTenBtn'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                const wrapper = btn.closest('.btn-wrapper');
                if (wrapper) wrapper.classList.add('first-time');

                const oldPrice = btn.querySelector('.old-price');
                const newPrice = btn.querySelector('.new-price');
                if (oldPrice && newPrice) {
                    oldPrice.style.display = 'inline';
                    const price = btnId === 'spinOneBtn' ? '9' : '89';
                    newPrice.textContent = `${price}`;
                }
            }
        });

        this.updateUI();
        this.showToast("Đã đặt lại tiến trình. Tỷ lệ vẫn được giữ nguyên.");
    }

    reset() {
        this.totalSpent = 0;
        this.currentBadges = 0;
        this.firstTime = { one: true, ten: true };
        this.inventory = { 1: 0, 2: 0, 3: 0, 5: 0, 10: 0 }; // Reset Inventory
        this.singleSpinCycleIndex = 0; // Reset single spin cycle

        // Reset Target Lock
        this.goalLocked = false;
        const input = document.getElementById('targetBadgeInput');
        const lockBtn = document.getElementById('lockTargetBtn');

        if (input) {
            input.disabled = false;
        }
        if (lockBtn) {
            lockBtn.disabled = false;
            lockBtn.classList.remove('locked');
        }

        // Reset Probability Lock
        this.probLocked = false;
        const probLockBtn = document.getElementById('lockProbBtn');
        const probInputs = [1, 2, 3, 5, 10].map(k => document.getElementById(`prob${k}`));

        if (probLockBtn) {
            probLockBtn.textContent = '🔓';
            probLockBtn.classList.remove('locked');
        }
        probInputs.forEach(inp => {
            if (inp) inp.disabled = false;
        });


        // Reset UI for first time
        ['spinOneBtn', 'spinTenBtn'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                const wrapper = btn.closest('.btn-wrapper');
                if (wrapper) wrapper.classList.add('first-time');

                const oldPrice = btn.querySelector('.old-price');
                const newPrice = btn.querySelector('.new-price');
                if (oldPrice && newPrice) {
                    oldPrice.style.display = 'inline';
                    const price = btnId === 'spinOneBtn' ? '9' : '89';
                    newPrice.textContent = `${price}`;
                }
            }
        });

        this.updateUI();
    }
}

const game = new SpinGame();
window.game = game;

