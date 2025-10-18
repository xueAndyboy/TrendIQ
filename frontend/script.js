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

// Main prediction function
async function predictStock(ticker) {
  const resultContainer = document.getElementById("result");
  const predictBtn = document.getElementById("predictBtn");

  // Show loading state
  predictBtn.classList.add("loading");
  predictBtn.disabled = true;
  
  showResult("loading", "Analyzing Market Data...", "Our AI is processing historical data and generating predictions.");

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ticker }),
    });

    const data = await response.json();

    if (data.error) {
      showResult("error", "Prediction Failed", data.error);
    } else {
      showResult("success", data.ticker, null, data);
    }
  } catch (error) {
    showResult("error", "Connection Error", "Unable to connect to the server. Please try again.");
  } finally {
    predictBtn.classList.remove("loading");
    predictBtn.disabled = false;
  }
}

// Global chart variable
let priceChart = null;

// Display result with different states
function showResult(type, title, message, data = null) {
  const resultContainer = document.getElementById("result");
  
  let icon = "";
  let className = "";
  let content = "";

  switch (type) {
    case "success":
      icon = "✅";
      className = "result-success";
      
      const trendIcon = data.trend === "up" ? "📈" : data.trend === "down" ? "📉" : "➡️";
      const trendColor = data.trend === "up" ? "#10b981" : data.trend === "down" ? "#ef4444" : "#6b7280";
      const changeSign = data.price_change > 0 ? "+" : "";
      
      content = `
        <div class="result-header">
          <div class="result-ticker">${title}</div>
          ${data.current_price ? `<div class="current-price">Current: $${data.current_price}</div>` : ''}
        </div>
        
        <div class="prediction-box">
          <div class="prediction-label">AI Predicted Price</div>
          <div class="result-price">$${data.predicted_price}</div>
          ${data.price_change !== null ? `
            <div class="price-change" style="color: ${trendColor}">
              ${trendIcon} ${changeSign}$${data.price_change} (${changeSign}${data.price_change_pct}%)
            </div>
          ` : ''}
        </div>
        
        ${data.confidence ? `
          <div class="confidence-section">
            <div class="confidence-label">Prediction Confidence</div>
            <div class="confidence-meter">
              <div class="confidence-bar-bg">
                <div class="confidence-bar-fill" style="width: ${data.confidence}%"></div>
              </div>
              <span class="confidence-value">${data.confidence}%</span>
            </div>
            <div class="volatility-info">Volatility: ${data.volatility}%</div>
          </div>
        ` : ''}
        
        ${data.chart_data ? `
          <div class="chart-container">
            <canvas id="priceChart"></canvas>
          </div>
        ` : ''}
        
        <div class="result-footer">
          <button onclick="downloadPrediction('${title}', ${data.predicted_price})" class="download-btn">
            📥 Download
          </button>
          <button onclick="sharePrediction('${title}', ${data.predicted_price})" class="download-btn">
            🔗 Share
          </button>
        </div>
      `;
      
      // Save to history
      if (data.confidence) {
        savePrediction(title, data.predicted_price, data.confidence);
      }
      
      resultContainer.innerHTML = `<div class="result-card ${className}">${content}</div>`;
      
      // Render chart if data available
      if (data.chart_data) {
        setTimeout(() => renderChart(data.chart_data, data.predicted_price), 100);
      }
      break;
    
    case "error":
      icon = "❌";
      className = "result-error";
      content = `
        <div class="result-title">${icon} ${title}</div>
        <div class="result-message">${message}</div>
      `;
      resultContainer.innerHTML = `<div class="result-card ${className}">${content}</div>`;
      break;
    
    case "loading":
      icon = "⏳";
      className = "result-loading";
      content = `
        <div class="result-title">${icon} ${title}</div>
        <div class="result-message">${message}</div>
      `;
      resultContainer.innerHTML = `<div class="result-card ${className}">${content}</div>`;
      break;
  }
}

// Render price chart
function renderChart(chartData, predictedPrice) {
  const ctx = document.getElementById('priceChart');
  if (!ctx) return;
  
  // Destroy existing chart
  if (priceChart) {
    priceChart.destroy();
  }
  
  // Add predicted price as next point
  const dates = [...chartData.dates, 'Predicted'];
  const prices = [...chartData.prices, predictedPrice];
  
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Stock Price',
        data: prices,
        borderColor: '#00c6ff',
        backgroundColor: 'rgba(0, 198, 255, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#00c6ff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        segment: {
          borderDash: ctx => {
            // Dashed line for prediction
            return ctx.p1DataIndex === prices.length - 1 ? [5, 5] : [];
          }
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#00c6ff',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return '$' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Download prediction report
function downloadPrediction(ticker, price) {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  
  const report = `
TrendIQ - Stock Price Prediction Report
========================================

Stock Symbol: ${ticker}
Predicted Price: $${price}
Prediction Date: ${date}
Prediction Time: ${time}

Generated by TrendIQ AI Market Predictor
Powered by LSTM Neural Networks

Disclaimer: This prediction is for informational purposes only.
Always do your own research before making investment decisions.
`;
  
  const blob = new Blob([report], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TrendIQ_${ticker}_${date.replace(/\//g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Add enter key support for chips
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("ticker").value = "";
    document.getElementById("result").innerHTML = "";
  }
});

// ===== NEW FEATURES =====

// 1. Live Stock Ticker
async function updateLiveTicker() {
  const tickerEl = document.getElementById('liveTicker');
  if (!tickerEl) return;
  
  // Show loading state
  tickerEl.innerHTML = '<span class="ticker-loading">Loading market data...</span>';
  
  try {
    const response = await fetch('/live-ticker');
    const data = await response.json();
    
    if (data && data.length > 0) {
      const tickerHTML = data.map(stock => {
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
      
      tickerEl.innerHTML = tickerHTML;
    } else {
      tickerEl.innerHTML = '<span class="ticker-item">No data available</span>';
    }
  } catch (error) {
    tickerEl.innerHTML = '<span class="ticker-item" style="color: #ff006e;">Market data unavailable</span>';
    console.error('Ticker error:', error);
  }
}

// Initialize live ticker on page load
if (document.getElementById('liveTicker')) {
  updateLiveTicker();
  setInterval(updateLiveTicker, 60000); // Update every minute
}

// Update total predictions counter
function updatePredictionsCounter() {
  const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
  const counterEl = document.getElementById('totalPredictions');
  if (counterEl) {
    counterEl.textContent = history.length;
  }
}

// Initialize counter on page load
if (document.getElementById('totalPredictions')) {
  updatePredictionsCounter();
}

// 2. Toggle Features
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

// 3. Prediction History (Local Storage)
function savePrediction(ticker, price, confidence) {
  let history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
  history.unshift({
    ticker,
    price,
    confidence,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString()
  });
  // Keep only last 20 predictions
  history = history.slice(0, 20);
  localStorage.setItem('predictionHistory', JSON.stringify(history));
  
  // Update counter
  updatePredictionsCounter();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
  const historyList = document.getElementById('historyList');
  
  if (history.length === 0) {
    historyList.innerHTML = '<p class="no-history">No predictions yet. Start predicting to build your history!</p>';
    return;
  }
  
  historyList.innerHTML = history.map((item, index) => `
    <div class="history-item">
      <div class="history-main">
        <span class="history-ticker">${item.ticker}</span>
        <span class="history-price">$${item.price}</span>
        <span class="history-confidence">${item.confidence}% confidence</span>
      </div>
      <div class="history-date">${item.date}</div>
    </div>
  `).join('');
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all prediction history?')) {
    localStorage.removeItem('predictionHistory');
    loadHistory();
  }
}

// 4. Stock Comparison
async function compareStocks() {
  const stock1 = document.getElementById('compareStock1').value.trim().toUpperCase();
  const stock2 = document.getElementById('compareStock2').value.trim().toUpperCase();
  const stock3 = document.getElementById('compareStock3').value.trim().toUpperCase();
  
  const stocks = [stock1, stock2, stock3].filter(s => s);
  
  if (stocks.length < 2) {
    alert('Please enter at least 2 stocks to compare');
    return;
  }
  
  const resultsDiv = document.getElementById('comparisonResults');
  resultsDiv.innerHTML = '<div class="comparison-loading">Comparing stocks...</div>';
  
  const predictions = [];
  for (const ticker of stocks) {
    try {
      const response = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ticker }),
      });
      const data = await response.json();
      if (!data.error) {
        predictions.push(data);
      }
    } catch (error) {
      console.error(`Error predicting ${ticker}:`, error);
    }
  }
  
  if (predictions.length === 0) {
    resultsDiv.innerHTML = '<p class="comparison-error">Unable to compare stocks. Please check ticker symbols.</p>';
    return;
  }
  
  resultsDiv.innerHTML = `
    <div class="comparison-grid">
      ${predictions.map(pred => `
        <div class="comparison-card">
          <h4>${pred.ticker}</h4>
          <div class="comp-price">$${pred.predicted_price}</div>
          <div class="comp-change ${pred.trend}">
            ${pred.trend === 'up' ? '📈' : pred.trend === 'down' ? '📉' : '➡️'}
            ${pred.price_change_pct ? pred.price_change_pct + '%' : 'N/A'}
          </div>
          <div class="comp-confidence">
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${pred.confidence}%"></div>
            </div>
            <span>${pred.confidence}% confidence</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 5. Share Prediction
function sharePrediction(ticker, price) {
  const shareText = `TrendIQ AI predicts ${ticker} at $${price}`;
  const shareUrl = `${window.location.origin}/predict-page?ticker=${ticker}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'TrendIQ Prediction',
      text: shareText,
      url: shareUrl
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert('Prediction link copied to clipboard!');
  }
}
