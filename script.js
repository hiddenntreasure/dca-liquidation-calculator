document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tradeForm");
  const dcaModeRadios = document.querySelectorAll('input[name="dcaMode"]');
  const autoDCAOptions = document.getElementById("autoDCAOptions");
  const manualDCAOptions = document.getElementById("manualDCAOptions");

  dcaModeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "auto") {
        autoDCAOptions.style.display = "block";
        manualDCAOptions.style.display = "none";
      } else {
        autoDCAOptions.style.display = "none";
        manualDCAOptions.style.display = "block";
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const tradeType = document.getElementById("tradeType").value;
    const entryPrice = parseFloat(document.getElementById("entryPrice").value);
    const margin = parseFloat(document.getElementById("margin").value);
    const leverage = parseFloat(document.getElementById("leverage").value);
    const stopLoss = parseFloat(document.getElementById("stopLoss").value);
    const dcaMode = document.querySelector('input[name="dcaMode"]:checked').value;

    let totalMargin = margin;
    let weightedPrice = entryPrice * margin;
    let positionSize = entryPrice * margin * leverage;

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
        positionSize += dcaPrice * dcaMargin * leverage;
      }
    } else {
      const manualInput = document.getElementById("manualDCAInput").value;
      const pairs = manualInput.split(",");

      pairs.forEach((pair) => {
        const [priceStr, marginStr] = pair.split(":");
        const dcaPrice = parseFloat(priceStr.trim());
        const dcaMargin = parseFloat(marginStr.trim());
        weightedPrice += dcaPrice * dcaMargin;
        totalMargin += dcaMargin;
        positionSize += dcaPrice * dcaMargin * leverage;
      });
    }

    const averageEntry = weightedPrice / totalMargin;

    let liquidationPrice;
    if (tradeType === "long") {
      liquidationPrice = averageEntry - (averageEntry / leverage);
    } else {
      liquidationPrice = averageEntry + (averageEntry / leverage);
    }

    const priceDiff = tradeType === "long"
      ? averageEntry - stopLoss
      : stopLoss - averageEntry;
    const riskAmount = (priceDiff / averageEntry) * leverage * totalMargin;

    document.getElementById("averageEntry").textContent = `Average Entry Price: $${averageEntry.toFixed(4)}`;
    document.getElementById("liquidationPrice").textContent = `Estimated Liquidation Price: $${liquidationPrice.toFixed(4)}`;
    document.getElementById("positionSize").textContent = `Total Position Size: $${positionSize.toFixed(2)}`;
    document.getElementById("marginUsed").textContent = `Total Margin Used: $${totalMargin.toFixed(2)}`;
    document.getElementById("profitLoss").textContent = `Potential Loss at Stop Loss: -$${riskAmount.toFixed(2)}`;
  });
});
