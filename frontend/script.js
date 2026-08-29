// Form submission handler
document.getElementById("predictForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const ticker = document.getElementById("ticker").value.trim().toUpperCase();
  await predictStock(ticker);
});

// Popular stock chips handler
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", async () => {
    const ticker = chip.getAttribute("data-ticker");
    document.getElementById("ticker").value = ticker;
    await predictStock(ticker);
  });
});

// Auto-uppercase ticker input
document.getElementById("ticker").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
});

// Global state
let currentPredictionData = null;
let currentHorizon = "1d";
let priceChart = null;

// Main prediction function
async function predictStock(ticker) {
  const resultContainer = document.getElementById("result");
  const predictBtn = document.getElementById("predictBtn");

  // Show loading state
  predictBtn.classList.add("loading");
  predictBtn.disabled = true;
  
  showResult("loading", "Ingesting Market Data & Computing Forecast...", "Fetching historical time series from Yahoo Finance and executing autoregressive inference.");

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ticker }),
    });

    const data = await response.json();

    if (data.error) {
      showResult("error", "Forecasting Error", data.error);
    } else {
      currentPredictionData = data;
      currentHorizon = "1d";
      showResult("success", data.ticker, null, data);
    }
  } catch (error) {
    showResult("error", "Network / API Error", "Unable to connect to market service. Please verify your connection.");
  } finally {
    predictBtn.classList.remove("loading");
    predictBtn.disabled = false;
  }
}

// Switch forecasting horizon
function setHorizon(horizon) {
  if (!currentPredictionData || !currentPredictionData.horizons) return;
  currentHorizon = horizon;
  
  // Update horizon tab buttons
  document.querySelectorAll(".horizon-tab").forEach(tab => {
    if (tab.getAttribute("data-horizon") === horizon) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  const hData = currentPredictionData.horizons[horizon];
  const trendColor = hData.change >= 0 ? "#06ffa5" : "#ff006e";
  const trendIcon = hData.change >= 0 ? "📈" : "📉";
  const changeSign = hData.change > 0 ? "+" : "";

  // Update target price display
  const priceEl = document.getElementById("horizonPrice");
  const changeEl = document.getElementById("horizonChange");
  const ciEl = document.getElementById("horizonCI");

  if (priceEl) priceEl.textContent = `$${hData.price}`;
  if (changeEl) {
    changeEl.style.color = trendColor;
    changeEl.innerHTML = `${trendIcon} ${changeSign}$${hData.change} (${changeSign}${hData.change_pct}%)`;
  }
  if (ciEl) {
    ciEl.innerHTML = `
      <div class="ci-badge">80% CI: <strong>$${hData.lower_80}</strong> – <strong>$${hData.upper_80}</strong></div>
      <div class="ci-badge-sub">95% CI: $${hData.lower_95} – $${hData.upper_95}</div>
    `;
  }

  // Re-render chart for selected horizon
  if (currentPredictionData.chart_data) {
    renderChart(currentPredictionData.chart_data, horizon);
  }
}

// Display result with different states
function showResult(type, title, message, data = null) {
  const resultContainer = document.getElementById("result");
  
  if (type === "loading") {
    resultContainer.innerHTML = `
      <div class="result-card result-loading">
        <div class="result-title">⏳ ${title}</div>
        <div class="result-message">${message}</div>
      </div>`;
    return;
  }

  if (type === "error") {
    resultContainer.innerHTML = `
      <div class="result-card result-error">
        <div class="result-title">❌ ${title}</div>
        <div class="result-message">${message}</div>
      </div>`;
    return;
  }

  if (type === "success" && data) {
    const h1 = data.horizons ? data.horizons["1d"] : { price: data.predicted_price, change: data.price_change, change_pct: data.price_change_pct, lower_80: "N/A", upper_80: "N/A", lower_95: "N/A", upper_95: "N/A" };
    const trendColor = h1.change >= 0 ? "#06ffa5" : "#ff006e";
    const trendIcon = h1.change >= 0 ? "📈" : "📉";
    const changeSign = h1.change > 0 ? "+" : "";

    const sentiment = data.sentiment || { label: "Neutral", score: 0.0, color: "#ffbe0b", articles: [] };
    const bench = data.benchmark;

    const content = `
      <div class="result-header">
        <div>
          <div class="result-ticker">${title}</div>
          <div class="model-badge">⚡ Ridge Autoregressive ML (Lags 1-5 + SMA)</div>
        </div>
        ${data.current_price ? `<div class="current-price">Current Price: $${data.current_price}</div>` : ''}
      </div>
      
      <!-- Multi-Horizon Tabs -->
      <div class="horizon-selector">
        <button class="horizon-tab active" data-horizon="1d" onclick="setHorizon('1d')">1-Day Forecast</button>
        <button class="horizon-tab" data-horizon="7d" onclick="setHorizon('7d')">7-Day Horizon</button>
        <button class="horizon-tab" data-horizon="30d" onclick="setHorizon('30d')">30-Day Horizon</button>
      </div>

      <!-- Active Prediction Box -->
      <div class="prediction-box">
        <div class="prediction-label">Target Trajectory Projection</div>
        <div class="result-price" id="horizonPrice">$${h1.price}</div>
        <div class="price-change" id="horizonChange" style="color: ${trendColor}">
          ${trendIcon} ${changeSign}$${h1.change} (${changeSign}${h1.change_pct}%)
        </div>
        
        <!-- Uncertainty Bands Range -->
        <div class="uncertainty-container" id="horizonCI">
          <div class="ci-badge">80% CI: <strong>$${h1.lower_80}</strong> – <strong>$${h1.upper_80}</strong></div>
          <div class="ci-badge-sub">95% CI: $${h1.lower_95} – $${h1.upper_95}</div>
        </div>
      </div>
      
      <!-- Metrics Overview -->
      <div class="metrics-row">
        <div class="metric-chip">
          <span class="m-label">Historical Volatility</span>
          <span class="m-value">${data.volatility}%</span>
        </div>
        <div class="metric-chip">
          <span class="m-label">Residual Standard Error</span>
          <span class="m-value">±$${data.sigma_res || '0.00'}</span>
        </div>
        <div class="metric-chip">
          <span class="m-label">Model Confidence</span>
          <span class="m-value">${data.confidence}%</span>
        </div>
      </div>

      <!-- Chart Container -->
      <div class="chart-container">
        <canvas id="priceChart"></canvas>
      </div>

      <!-- Live News Sentiment Card -->
      <div class="sentiment-card">
        <div class="sentiment-header">
          <div class="s-title">
            <span class="s-icon">📰</span>
            <span>Live Financial News Sentiment (Yahoo Finance)</span>
          </div>
          <div class="sentiment-pill" style="background: ${sentiment.color}22; color: ${sentiment.color}; border: 1px solid ${sentiment.color}">
            ${sentiment.label} (Score: ${sentiment.score > 0 ? '+' : ''}${sentiment.score})
          </div>
        </div>
        ${sentiment.articles && sentiment.articles.length > 0 ? `
          <div class="news-list">
            ${sentiment.articles.map(art => `
              <a href="${art.link}" target="_blank" rel="noopener" class="news-item">
                <span class="news-source">${art.publisher} (${art.date})</span>
                <span class="news-headline">${art.title}</span>
              </a>
            `).join('')}
          </div>
        ` : `<p class="no-news">No recent breaking news headlines available for ${title}.</p>`}
      </div>

      <!-- Backtesting & Model Performance Card -->
      ${bench ? `
        <div class="benchmark-card">
          <div class="b-header">
            <span>🎯 Model Performance vs Naive Baseline (Out-of-Sample Test Window)</span>
            <a href="/about" class="b-link">Methodology &rarr;</a>
          </div>
          <div class="b-grid">
            <div class="b-box">
              <span class="b-label">Test Period</span>
              <span class="b-val">${bench.test_period || 'Last 90 Days'}</span>
            </div>
            <div class="b-box">
              <span class="b-label">Model RMSE vs Baseline</span>
              <span class="b-val">$${bench.model_rmse} <small style="color: #94a3b8;">(Naive: $${bench.naive_rmse})</small></span>
            </div>
            <div class="b-box">
              <span class="b-label">Model MAPE</span>
              <span class="b-val">${bench.model_mape}%</span>
            </div>
            <div class="b-box">
              <span class="b-label">Directional Accuracy</span>
              <span class="b-val" style="color: #06ffa5">${bench.directional_accuracy}%</span>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Footer Actions -->
      <div class="result-footer">
        <button onclick="downloadPrediction('${title}')" class="download-btn">
          📥 Download Quantitative Report
        </button>
        <button onclick="sharePrediction('${title}')" class="download-btn">
          🔗 Share Forecast Link
        </button>
      </div>
    `;
    
    // Save to history
    savePrediction(title, h1.price, data.confidence);
    
    resultContainer.innerHTML = `<div class="result-card result-success">${content}</div>`;
    
    // Render chart
    if (data.chart_data) {
      setTimeout(() => renderChart(data.chart_data, "1d"), 100);
    }
  }
}

// Render multi-horizon chart with confidence bands
function renderChart(chartData, horizon = "1d") {
  const ctx = document.getElementById('priceChart');
  if (!ctx) return;
  
  if (priceChart) {
    priceChart.destroy();
  }

  // Slices based on horizon
  let forecastSteps = horizon === "1d" ? 1 : horizon === "7d" ? 7 : 30;
  
  const histDates = chartData.dates;
  const histPrices = chartData.prices;
  const lastHistPrice = histPrices[histPrices.length - 1];

  const fDates = chartData.forecast_dates.slice(0, forecastSteps);
  const fPrices = chartData.forecast_30d.slice(0, forecastSteps);
  const upper95 = chartData.upper_95.slice(0, forecastSteps);
  const lower95 = chartData.lower_95.slice(0, forecastSteps);

  // Labels: historical dates + forecast dates
  const allLabels = [...histDates, ...fDates];

  // Dataset 1: Historical series
  const histSeries = [...histPrices, ...Array(forecastSteps).fill(null)];

  // Dataset 2: Forecast line (connecting from last historical price)
  const forecastSeries = Array(histDates.length - 1).fill(null);
  forecastSeries.push(lastHistPrice);
  forecastSeries.push(...fPrices);

  // Dataset 3 & 4: Upper and Lower 95% Confidence Band
  const upperSeries = Array(histDates.length - 1).fill(null);
  upperSeries.push(lastHistPrice);
  upperSeries.push(...upper95);

  const lowerSeries = Array(histDates.length - 1).fill(null);
  lowerSeries.push(lastHistPrice);
  lowerSeries.push(...lower95);

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Upper 95% Confidence Band',
          data: upperSeries,
          borderColor: 'transparent',
          backgroundColor: 'rgba(0, 212, 255, 0.08)',
          fill: '+1',
          pointRadius: 0
        },
        {
          label: 'Lower 95% Confidence Band',
          data: lowerSeries,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Historical Close',
          data: histSeries,
          borderColor: '#00c6ff',
          backgroundColor: 'rgba(0, 198, 255, 0.1)',
          borderWidth: 2,
          tension: 0.2,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: '#00c6ff'
        },
        {
          label: 'Forecast Trajectory',
          data: forecastSeries,
          borderColor: '#06ffa5',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.2,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: '#06ffa5'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: 'rgba(255, 255, 255, 0.7)',
            boxWidth: 12,
            filter: item => item.text !== 'Lower 95% Confidence Band'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 14, 39, 0.95)',
          borderColor: 'rgba(0, 212, 255, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: context => {
              if (context.parsed.y !== null && context.dataset.label) {
                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
              }
              return null;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12
          }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            callback: value => '$' + value.toFixed(2)
          }
        }
      }
    }
  });
}

// Download quantitative forecast report
function downloadPrediction(ticker) {
  if (!currentPredictionData) return;
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  const d = currentPredictionData;
  const h1 = d.horizons['1d'];
  const h7 = d.horizons['7d'];
  const h30 = d.horizons['30d'];

  const report = `
TrendIQ - Quantitative Time-Series Forecast Report
===================================================
Target Asset: ${ticker}
Date of Analysis: ${date} at ${time}
Current Closing Price: $${d.current_price}

MULTI-HORIZON PROJECTIONS & UNCERTAINTY BANDS
----------------------------------------------
1-Day Horizon (Next Close):
  Target: $${h1.price} (${h1.change > 0 ? '+' : ''}$${h1.change}, ${h1.change_pct}%)
  80% Confidence Band: $${h1.lower_80} to $${h1.upper_80}
  95% Confidence Band: $${h1.lower_95} to $${h1.upper_95}

7-Day Horizon:
  Target: $${h7.price} (${h7.change > 0 ? '+' : ''}$${h7.change}, ${h7.change_pct}%)
  80% Confidence Band: $${h7.lower_80} to $${h7.upper_80}
  95% Confidence Band: $${h7.lower_95} to $${h7.upper_95}

30-Day Horizon:
  Target: $${h30.price} (${h30.change > 0 ? '+' : ''}$${h30.change}, ${h30.change_pct}%)
  80% Confidence Band: $${h30.lower_80} to $${h30.upper_80}
  95% Confidence Band: $${h30.lower_95} to $${h30.upper_95}

MODEL EVALUATION & BENCHMARKS
------------------------------
Architecture: Ridge Autoregressive ML (Lags 1-5 + SMA proxies)
Residual Standard Error (Sigma): ±$${d.sigma_res}
Model Confidence Index: ${d.confidence}%
News Sentiment Signal: ${d.sentiment ? d.sentiment.label + ' (Score: ' + d.sentiment.score + ')' : 'N/A'}

DISCLAIMER
----------
This quantitative report is generated strictly for academic and educational evaluation.
Stock forecasting involves substantial market risk. Past performance does not guarantee future results.
`;
  
  const blob = new Blob([report], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TrendIQ_${ticker}_Forecast_${date.replace(/\//g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Share prediction link
function sharePrediction(ticker) {
  const shareText = `TrendIQ Quantitative Forecast for ${ticker}`;
  const shareUrl = `${window.location.origin}/predict-page?ticker=${ticker}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'TrendIQ Stock Forecast',
      text: shareText,
      url: shareUrl
    });
  } else {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert('Forecast link copied to clipboard!');
  }
}

// Live stock ticker update
async function updateLiveTicker() {
  const tickerEl = document.getElementById('liveTicker');
  if (!tickerEl) return;
  
  if (!tickerEl.querySelector('.ticker-track')) {
    tickerEl.innerHTML = '<span class="ticker-loading">Ingesting real-time market data...</span>';
  }
  
  try {
    const response = await fetch('/live-ticker');
    const data = await response.json();
    
    if (data && data.length > 0) {
      const doubledData = [...data, ...data];
      const tickerHTML = doubledData.map(stock => {
        if (stock.price === null) {
          return `<span class="ticker-item">${stock.symbol}: N/A</span>`;
        }
        
        const color = stock.change >= 0 ? '#06ffa5' : '#ff006e';
        const arrow = stock.change >= 0 ? '▲' : '▼';
        
        return `
          <span class="ticker-item">
            <strong>${stock.symbol}</strong>: $${stock.price.toFixed(2)} 
            <span style="color: ${color}">
              ${arrow} ${Math.abs(stock.changePercent).toFixed(2)}%
            </span>
          </span>
        `;
      }).join('');
      
      tickerEl.innerHTML = `<div class="ticker-track">${tickerHTML}</div>`;
    }
  } catch (error) {
    tickerEl.innerHTML = '<span class="ticker-item" style="color: #ff006e;">Market data feed offline</span>';
  }
}

if (document.getElementById('liveTicker')) {
  updateLiveTicker();
  setInterval(updateLiveTicker, 60000);
}

// Feature Toggles (Comparison & History)
const comparisonToggle = document.getElementById('comparisonToggle');
const historyToggle = document.getElementById('historyToggle');
const comparisonSection = document.getElementById('comparisonSection');
const historySection = document.getElementById('historySection');

if (comparisonToggle) {
  comparisonToggle.addEventListener('click', () => {
    comparisonSection.classList.toggle('hidden');
    historySection.classList.add('hidden');
    comparisonToggle.classList.toggle('active');
    historyToggle.classList.remove('active');
  });
}

if (historyToggle) {
  historyToggle.addEventListener('click', () => {
    historySection.classList.toggle('hidden');
    comparisonSection.classList.add('hidden');
    historyToggle.classList.toggle('active');
    comparisonToggle.classList.remove('active');
    loadHistory();
  });
}

// Prediction History
function savePrediction(ticker, price, confidence) {
  let history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
  history.unshift({
    ticker,
    price,
    confidence,
    date: new Date().toLocaleString()
  });
  history = history.slice(0, 15);
  localStorage.setItem('predictionHistory', JSON.stringify(history));
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  
  if (history.length === 0) {
    historyList.innerHTML = '<p class="no-history">No forecasts recorded yet. Generate a prediction above!</p>';
    return;
  }
  
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-main">
        <span class="history-ticker">${item.ticker}</span>
        <span class="history-price">Target: $${item.price}</span>
        <span class="history-confidence">${item.confidence}% confidence</span>
      </div>
      <div class="history-date">${item.date}</div>
    </div>
  `).join('');
}

function clearHistory() {
  if (confirm('Clear all saved forecast history?')) {
    localStorage.removeItem('predictionHistory');
    loadHistory();
  }
}

// Compare multiple stocks
async function compareStocks() {
  const s1 = document.getElementById('compareStock1').value.trim().toUpperCase();
  const s2 = document.getElementById('compareStock2').value.trim().toUpperCase();
  const s3 = document.getElementById('compareStock3').value.trim().toUpperCase();
  
  const stocks = [s1, s2, s3].filter(Boolean);
  if (stocks.length < 2) {
    alert('Please enter at least 2 stock symbols to compare.');
    return;
  }
  
  const resultsDiv = document.getElementById('comparisonResults');
  resultsDiv.innerHTML = '<div class="comparison-loading">Running comparative time-series forecasting...</div>';
  
  const predictions = [];
  for (const ticker of stocks) {
    try {
      const response = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ticker }),
      });
      const data = await response.json();
      if (!data.error) predictions.push(data);
    } catch (e) {
      console.error(e);
    }
  }
  
  if (predictions.length === 0) {
    resultsDiv.innerHTML = '<p class="comparison-error">Failed to retrieve comparison data. Check ticker symbols.</p>';
    return;
  }
  
  resultsDiv.innerHTML = `
    <div class="comparison-grid">
      ${predictions.map(p => `
        <div class="comparison-card">
          <h4>${p.ticker}</h4>
          <div class="comp-price">Target (1D): $${p.predicted_price}</div>
          <div class="comp-change ${p.trend}">
            ${p.price_change >= 0 ? '📈 +' : '📉 '}$${p.price_change} (${p.price_change_pct}%)
          </div>
          <div class="comp-ci">
            80% CI: $${p.horizons['1d'].lower_80} – $${p.horizons['1d'].upper_80}
          </div>
          <div class="comp-sentiment" style="color: ${p.sentiment.color}">
            Sentiment: ${p.sentiment.label} (${p.sentiment.score > 0 ? '+' : ''}${p.sentiment.score})
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
