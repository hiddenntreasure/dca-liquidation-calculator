document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tradeForm");
  const autoDCAOptions = document.getElementById("autoDCAOptions");
  const manualDCAOptions = document.getElementById("manualDCAOptions");
  const manualDCAContainer = document.getElementById("manualDCAContainer");
  const addManualDCA = document.getElementById("addManualDCA");

  document.querySelectorAll('input[name="dcaMode"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      autoDCAOptions.style.display = this.value === "auto" ? "block" : "none";
      manualDCAOptions.style.display = this.value === "manual" ? "block" : "none";
    });
  });

  addManualDCA.addEventListener("click", () => {
    const div = document.createElement("div");
    div.innerHTML = `
      Price: <input type="number" step="any" class="manualPrice">
      Margin: <input type="number" step="any" class="manualMargin">
      <button type="button" class="remove-btn">❌</button>`;
    manualDCAContainer.appendChild(div);
    div.querySelector(".remove-btn").addEventListener("click", () => div.remove());
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const tradeType = document.getElementById("tradeType").value;
    const entryPrice = parseFloat(document.getElementById("entryPrice").value);
    const margin = parseFloat(document.getElementById("margin").value);
    const leverage = parseFloat(document.getElementById("leverage").value);
    const stopLoss = parseFloat(document.getElementById("stopLoss").value);
    const targetPrice = parseFloat(document.getElementById("targetPrice").value);
    const dcaMode = document.querySelector('input[name="dcaMode"]:checked').value;

    let totalMargin = margin;
    let weightedPrice = entryPrice * margin;

    const breakdownTable = document.getElementById("dcaBreakdownTable");
    breakdownTable.innerHTML = "";
    let level = 1;

    function appendBreakdown(price, margin) {
      const avgEntry = weightedPrice / totalMargin;
      const liqPrice = tradeType === "long" ? avgEntry - avgEntry / leverage : avgEntry + avgEntry / leverage;
      const posSize = totalMargin * leverage;
      const row = document.createElement("div");
      row.className = "breakdown-row";
      row.innerHTML = `<strong>Level ${level++}</strong>: Buy Price: $${price.toFixed(4)} → Avg Entry: $${avgEntry.toFixed(4)}, Liq: $${liqPrice.toFixed(4)}, Margin: $${totalMargin.toFixed(2)}, Position: $${posSize.toFixed(2)}`;
      breakdownTable.appendChild(row);
    }

    appendBreakdown(entryPrice, margin);

    if (dcaMode === "auto") {
      const dcaPercentage = parseFloat(document.getElementById("dcaPercentage").value);
      const dcaLevels = parseInt(document.getElementById("dcaLevels").value);

      for (let i = 1; i <= dcaLevels; i++) {
        const dcaPrice = tradeType === "long"
          ? entryPrice * (1 - (dcaPercentage / 100) * i)
          : entryPrice * (1 + (dcaPercentage / 100) * i);
        const dcaMargin = margin;
        weightedPrice += dcaPrice * dcaMargin;
        totalMargin += dcaMargin;
        appendBreakdown(dcaPrice, dcaMargin);
      }
    } else {
      const prices = document.querySelectorAll(".manualPrice");
      const margins = document.querySelectorAll(".manualMargin");

      prices.forEach((input, index) => {
        const dcaPrice = parseFloat(input.value);
        const dcaMargin = parseFloat(margins[index].value);
        weightedPrice += dcaPrice * dcaMargin;
        totalMargin += dcaMargin;
        appendBreakdown(dcaPrice, dcaMargin);
      });
    }

    const averageEntry = weightedPrice / totalMargin;
    const totalPosition = totalMargin * leverage;

    // Stop loss risk
    const riskAmount = (Math.abs(averageEntry - stopLoss) / averageEntry) * leverage * totalMargin;
    document.getElementById("profitLoss").textContent = `Potential Loss at Stop Loss: -$${riskAmount.toFixed(2)}`;

    // Target profit
    if (targetPrice && !isNaN(targetPrice)) {
      const gain = tradeType === "long"
        ? ((targetPrice - averageEntry) / averageEntry) * leverage * totalMargin
        : ((averageEntry - targetPrice) / averageEntry) * leverage * totalMargin;
      document.getElementById("targetProfit").textContent = `Potential Profit at Target: +$${gain.toFixed(2)}`;
    } else {
      document.getElementById("targetProfit").textContent = `Potential Profit at Target: -`;
    }
  });
});
