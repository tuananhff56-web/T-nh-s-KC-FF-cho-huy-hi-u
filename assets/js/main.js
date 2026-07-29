// TABS LOGIC
    function openTab(tabId, btn) {
      document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
      });
      document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active');
      });

      document.getElementById(tabId).classList.add('active');
      btn.classList.add('active');
    }

    // Custom Alert Logic
    function showCustomAlert(msg) {
      document.getElementById('customAlertMsg').innerText = msg;
      document.getElementById('customAlertOverlay').classList.add('show');
    }
    function closeCustomAlert() {
      document.getElementById('customAlertOverlay').classList.remove('show');
    }

    // TAB 1 (CALC) LOGIC
    const chartCanvas = document.getElementById("kcChart");
    const ctx = chartCanvas.getContext("2d");

    function createGradient() {
      const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height);
      gradient.addColorStop(0, "rgba(0,255,229,0.35)");
      gradient.addColorStop(0.5, "rgba(0,191,255,0.15)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      return gradient;
    }
    function createFillGradient() {
      const g = ctx.createLinearGradient(0, 0, 0, chartCanvas.height);
      g.addColorStop(0, "rgba(0,255,229,0.25)");
      g.addColorStop(0.6, "rgba(0,191,255,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      return g;
    }

    let kcChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          data: [],
          borderColor: createGradient(),
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          backgroundColor: createFillGradient(),
          pointRadius: 5,
          pointHoverRadius: 9,
          pointBackgroundColor: "#00ffe5",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          segment: {
            borderColor: () => "#00ffe5"
          }
        }]
      },
      options: {
        responsive: true,
        interaction: { mode: "nearest", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.85)",
            borderColor: "#00ffe5",
            borderWidth: 1,
            titleColor: "#00ffe5",
            bodyColor: "#ffffff",
            padding: 10,
            displayColors: false,
            animation: false,
            delay: 0,
            callbacks: {
              title: ctx => "Sự kiện " + (ctx[0].dataIndex + 1),
              label: function(ctx) {
                const kc = ctx.raw;
                const selects = document.querySelectorAll('#months select');
                const discount = Math.round(Number(selects[ctx.dataIndex].value) * 100);
                return [
                  "KC bỏ ra: " + kc,
                  "Giảm giá: " + discount + "%"
                ];
              }
            }
          }
        }
      }
    });

    Chart.defaults.elements.line.borderJoinStyle = "round";
    const originalDraw = Chart.controllers.line.prototype.draw;
    Chart.controllers.line.prototype.draw = function () {
      const ctx = this.chart.ctx;
      ctx.save();
      ctx.shadowColor = "#00ffe5";
      ctx.shadowBlur = 12;
      originalDraw.apply(this, arguments);
      ctx.restore();
    };

    let daTinhSuKien = false;

    function createDiamonds() {
      const container = document.getElementById("diamondContainer");
      for (let i = 0; i < 25; i++) {
        const d = document.createElement("div");
        d.className = "falling-diamond"; // renamed to avoid conflict with tab1 diamond
        d.style.left = Math.random() * 100 + "vw";
        d.style.animationDuration = 1 + Math.random() * 1 + "s";
        container.appendChild(d);
        setTimeout(() => d.remove(), 2000);
      }
    }

    function isPositiveNumber(value) { return Number(value) > 0; }

    function validateInputs() {
      const basePriceInput = document.getElementById('basePrice');
      const badgesInput = document.getElementById('badges');
      const perMonthInput = document.getElementById('perMonth');
      const errorMsg = document.getElementById('errorMsg');

      let basePrice = Number(basePriceInput.value);
      let badges = Number(badgesInput.value);
      let perMonth = Number(perMonthInput.value);

      errorMsg.innerText = "";
      
      if (!isPositiveNumber(basePrice) || !isPositiveNumber(badges) || !isPositiveNumber(perMonth)) {
        errorMsg.innerText = "Giá trị phải lớn hơn 0.";
        return false;
      }
      if (basePrice > 999) { basePrice = 999; basePriceInput.value = 999; }
      if (badges > 9999) { badges = 9999; badgesInput.value = 9999; }
      if (perMonth > 9999) { perMonth = 9999; perMonthInput.value = 9999; }
      if (perMonth > badges) {
        errorMsg.innerText = "Số huy hiệu có thể mua tối đa mỗi sự kiện phải ≤ số huy hiệu cần.";
        return false;
      }
      return true;
    }

    function generateEvents() {
      if (!validateInputs()) return;
      const badges = Number(document.getElementById('badges').value);
      const perMonth = Number(document.getElementById('perMonth').value);
      const events = Math.ceil(badges / perMonth);
      document.getElementById('eventNumber').innerText = events;
      const container = document.getElementById('months');
      container.innerHTML = '';
      for (let i = 0; i < events; i++) {
        const select = document.createElement('select');
        select.innerHTML = `
          <option value="0">${i+1}. 0%</option>
          <option value="0.5" selected>${i+1}. 50%</option>
          <option value="0.55">${i+1}. 55%</option>
          <option value="0.6">${i+1}. 60%</option>
          <option value="0.65">${i+1}. 65%</option>
          <option value="0.7">${i+1}. 70%</option>
          <option value="0.75">${i+1}. 75%</option>
          <option value="0.8">${i+1}. 80%</option>
          <option value="0.85">${i+1}. 85%</option>
        `;
        container.appendChild(select);
      }
      daTinhSuKien = true;
      updateMinMax();
    }

    function randomize() {
      const selects = document.querySelectorAll('#months select');
      const options = [0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85];
      selects.forEach(s => {
        let r;
        if (Math.random() < 0.05) r = 0.5;
        else r = options[Math.floor(Math.random() * options.length)];
        s.value = r;
      });
      highlightBest();
      calculate();
    }

    function highlightBest() {
      const selects = document.querySelectorAll('#months select');
      selects.forEach(s => s.classList.remove('best'));
      selects.forEach(s => {
        if (Number(s.value) === 0.85) s.classList.add('best');
      });
    }

    function updateMinMax() {
      const perMonth = Number(document.getElementById('perMonth').value);
      const basePrice = Number(document.getElementById('basePrice').value);
      const events = Number(document.getElementById('eventNumber').innerText);
      const min = events * perMonth * basePrice * 0.15;
      const max = events * perMonth * basePrice * 1.0;
      document.getElementById('minKC').innerText = 'Min: ' + Math.round(min);
      document.getElementById('maxKC').innerText = 'Max: ' + Math.round(max);
    }

    function calculate() {
      if (!daTinhSuKien) { showCustomAlert("Bạn phải bấm 'Tính số sự kiện cần tham gia' trước!"); return; }
      if (!validateInputs()) return;
      const perMonth = Number(document.getElementById('perMonth').value);
      const basePrice = Number(document.getElementById('basePrice').value);
      const selects = document.querySelectorAll('#months select');
      let total = 0;
      const labels = [];
      const data = [];
      selects.forEach((s, i) => {
        const discount = Number(s.value);
        const kc = basePrice * (1 - discount) * perMonth;
        total += kc;
        labels.push("Sự kiện " + (i + 1));
        data.push(Math.round(kc));
      });
      kcChart.data.labels = labels;
      kcChart.data.datasets[0].data = data;
      kcChart.update();
      document.getElementById('totalKC').innerText = Math.round(total);
      const max = selects.length * perMonth * basePrice * 1.0;
      const percent = Math.min(100, (total / max) * 100);
      document.getElementById('barFill').style.width = percent + '%';
      highlightBest();
      updateMinMax();
      createDiamonds();
      updateVndConverter(Math.round(total));
    }

    ['basePrice', 'badges', 'perMonth'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        daTinhSuKien = false;
        document.getElementById('eventNumber').innerText = "";
        document.getElementById('months').innerHTML = "";
      });
    });

    const canvas = document.getElementById("diamondCanvas");
    const ctx2 = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const diamonds = [];
    for (let i = 0; i < 40; i++) {
      diamonds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 0.5 + 0.2,
        alpha: Math.random()
      });
    }
    function drawDiamond(d) {
      ctx2.save();
      ctx2.globalAlpha = d.alpha;
      ctx2.translate(d.x, d.y);
      ctx2.beginPath();
      ctx2.moveTo(0, -d.size);
      ctx2.lineTo(d.size, 0);
      ctx2.lineTo(0, d.size);
      ctx2.lineTo(-d.size, 0);
      ctx2.closePath();
      ctx2.fillStyle = "#00ffe5";
      ctx2.shadowColor = "#00ffe5";
      ctx2.shadowBlur = 10;
      ctx2.fill();
      ctx2.restore();
    }
    function animateDiamonds() {
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      diamonds.forEach(d => {
        d.y -= d.speed;
        d.alpha += (Math.random() - 0.5) * 0.02;
        if (d.y < -10) {
          d.y = canvas.height + 10;
          d.x = Math.random() * canvas.width;
        }
        drawDiamond(d);
      });
      requestAnimationFrame(animateDiamonds);
    }
    animateDiamonds();
    function animateGradient() {
      if (!kcChart) return;
      kcChart.data.datasets[0].borderColor = createGradient();
      kcChart.update("none");
      requestAnimationFrame(animateGradient);
    }
    animateGradient();

    // LOGIC TÍNH VNĐ
    function getBestCost(targetKC, mode) {
      if (targetKC <= 0) return { cost: 0, totalKC: 0, breakdown: {} };
      
      const regularPacks = [
        {name: 'Gói 10k', kc: 45, price: 10000}, {name: 'Gói 20k', kc: 113, price: 20000}, {name: 'Gói 50k', kc: 283, price: 50000},
        {name: 'Gói 100k', kc: 583, price: 100000}, {name: 'Gói 200k', kc: 1198, price: 200000}, {name: 'Gói 500k', kc: 3050, price: 500000}
      ];
      const weekly = {name: 'Thẻ Tuần', kc: 450, price: 50000};
      const monthly = {name: 'Thẻ Tháng', kc: 2600, price: 220000};

      function calcDP(target, packs) {
        if (target <= 0) return { cost: 0, totalKC: 0, breakdown: {} };
        let cost = 0;
        let remaining = target;
        let breakdown = {};
        
        let bestPack = packs.reduce((prev, curr) => (curr.kc / curr.price > prev.kc / prev.price) ? curr : prev);
        
        let bulkKC = 0;
        if (remaining > 10000) {
          let bulk = Math.floor((remaining - 10000) / bestPack.kc);
          cost += bulk * bestPack.price;
          remaining -= bulk * bestPack.kc;
          bulkKC = bulk * bestPack.kc;
          breakdown[bestPack.name] = bulk;
        }

        const MAX_ADD = Math.max(...packs.map(p => p.kc));
        let dp = new Array(remaining + MAX_ADD + 1).fill(Infinity);
        let choice = new Array(dp.length).fill(null);
        dp[0] = 0;
        
        for (let i = 0; i <= remaining; i++) {
          if (dp[i] !== Infinity) {
            for (let p of packs) {
              if (i + p.kc < dp.length) {
                if (dp[i] + p.price < dp[i + p.kc]) {
                  dp[i + p.kc] = dp[i] + p.price;
                  choice[i + p.kc] = { p: p, prev: i };
                }
              }
            }
          }
        }
        
        let minCost = Infinity;
        let bestTarget = remaining;
        for (let i = remaining; i < dp.length; i++) {
          if (dp[i] < minCost) {
            minCost = dp[i];
            bestTarget = i;
          }
        }
        
        let curr = bestTarget;
        while (curr > 0 && choice[curr]) {
          let p = choice[curr].p;
          breakdown[p.name] = (breakdown[p.name] || 0) + 1;
          curr = choice[curr].prev;
        }

        return { cost: cost + minCost, totalKC: bulkKC + bestTarget, breakdown };
      }

      if (mode === 'regular') return calcDP(targetKC, regularPacks);
      if (mode === 'weekly') {
        let count = Math.ceil(targetKC / weekly.kc);
        return { cost: count * weekly.price, totalKC: count * weekly.kc, breakdown: {'Thẻ Tuần': count} };
      }
      if (mode === 'monthly') {
        let count = Math.ceil(targetKC / monthly.kc);
        return { cost: count * monthly.price, totalKC: count * monthly.kc, breakdown: {'Thẻ Tháng': count} };
      }
      if (mode === 'long') return calcDP(targetKC, [...regularPacks, weekly, monthly]);
      
      if (mode === 'hot') {
        let combos = [ { m: 0, w: 0 }, { m: 1, w: 0 }, { m: 0, w: 1 }, { m: 1, w: 1 } ];
        let bestCombo = null;
        for (let c of combos) {
          let kcFromSub = c.m * monthly.kc + c.w * weekly.kc;
          let priceFromSub = c.m * monthly.price + c.w * weekly.price;
          let remainder = Math.max(0, targetKC - kcFromSub);
          let resRem = calcDP(remainder, regularPacks);
          
          let totalCost = priceFromSub + resRem.cost;
          let totalKC = kcFromSub + resRem.totalKC;
          
          if (!bestCombo || totalCost < bestCombo.cost || (totalCost === bestCombo.cost && totalKC > bestCombo.totalKC)) {
            let bd = { ...resRem.breakdown };
            if (c.m > 0) bd['Thẻ Tháng'] = c.m;
            if (c.w > 0) bd['Thẻ Tuần'] = c.w;
            bestCombo = { cost: totalCost, totalKC: totalKC, breakdown: bd };
          }
        }
        return bestCombo;
      }
      return { cost: 0, totalKC: 0, breakdown: {} };
    }

    function formatVND(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
    }
    
    function createRowHTML(title, subtitle, className, res, targetKC) {
      let breakdownStr = Object.keys(res.breakdown).map(k => `${res.breakdown[k]} x ${k}`).join(', ');
      if (!breakdownStr) breakdownStr = "Không cần nạp";
      let leftover = res.totalKC - targetKC;
      let leftOverHtml = leftover > 0 ? `<div class="row-leftover">+${leftover} 💎</div>` : '';
      let titleAttr = leftover > 0 ? `Nhận tổng cộng ${res.totalKC} 💎 (Dư ${leftover} KC)` : `Nhận đủ ${res.totalKC} 💎`;
      
      return `
        <div class="conv-row ${className}">
          <div class="row-left">
            <span class="row-title">${title}</span>
            ${subtitle ? `<span class="row-subtitle">${subtitle}</span>` : ''}
            <div class="row-details">${breakdownStr}</div>
          </div>
          <div class="row-right">
            <div class="tooltip-wrap" data-tooltip="${titleAttr}">
              <strong class="row-price">${formatVND(res.cost)}</strong>
              ${leftOverHtml}
            </div>
          </div>
        </div>
      `;
    }

    function updateVndConverter(totalKC) {
      const basicKC = totalKC;
      const lv4KC = totalKC + 1300;

      document.getElementById("vndConverter").style.display = "block";
      document.getElementById("convBasicKC").innerText = basicKC;
      document.getElementById("convLv4KC").innerText = lv4KC;

      function fillRows(containerId, target) {
        let html = '';
        html += createRowHTML('Chỉ Nạp Thường', '', '', getBestCost(target, 'regular'), target);
        html += createRowHTML('Tối ưu Ngay', 'Mua tối đa 1 Tháng + 1 Tuần', 'highlight', getBestCost(target, 'hot'), target);
        html += createRowHTML('Tối ưu Lâu Dài', 'Mua không giới hạn Thẻ Tháng + Tuần', 'highlight-best', getBestCost(target, 'long'), target);
        html += createRowHTML('Chỉ Nạp Thẻ Tuần', '', '', getBestCost(target, 'weekly'), target);
        html += createRowHTML('Chỉ Nạp Thẻ Tháng', '', '', getBestCost(target, 'monthly'), target);
        document.getElementById(containerId).innerHTML = html;
      }

      fillRows("convBasicRows", basicKC);
      fillRows("convLv4Rows", lv4KC);
    }


    // TAB 2 (PREMIUM) LOGIC
    document.addEventListener("DOMContentLoaded", function () {
      const rows = Array.from(document.querySelectorAll(".prem-card tbody tr"));
      const selectionText = document.getElementById("selection-text");
      const selectionTip = document.getElementById("selection-tip");

      function formatVND(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
      }

      function selectRow(row) {
        rows.forEach(r => r.classList.remove("selected"));
        row.classList.add("selected");

        const name = row.dataset.name;
        const price = parseInt(row.dataset.price, 10);
        const kc = row.dataset.kc;
        const profit = row.dataset.profit;
        const profitKc = row.dataset.profitkc;
        const note = row.dataset.note || "";

        selectionText.innerHTML =
          `Bạn chọn <strong>${name}</strong> — nạp <strong>${formatVND(price)}</strong> ` +
          `nhận <strong>${kc} KC</strong>, lời <strong>+${profitKc} KC</strong> (${profit}) so với nạp thường.`;
        selectionTip.textContent = note;
      }

      rows.forEach(row => {
        row.addEventListener("click", () => selectRow(row));
      });

      if (rows[0]) selectRow(rows[0]);
    });