# 🎓 TrendIQ Training Guide

Complete guide for training stock prediction models.

## 🚀 Quick Start (Easiest Method)

### Train Popular Stocks in One Command

```bash
python quick_train.py
```

**What it does:**
- Trains models for: AAPL, GOOGL, MSFT, TSLA, AMZN
- Takes approximately 10-15 minutes
- Fully automated - no input required after confirmation
- Perfect for getting started quickly

**Output:**
```
✅ Successfully trained model for AAPL!
✅ Successfully trained model for GOOGL!
✅ Successfully trained model for MSFT!
✅ Successfully trained model for TSLA!
✅ Successfully trained model for AMZN!
```

---

## 📊 Check What's Already Trained

```bash
python check_models.py
```

**Example Output:**
```
📊 TrendIQ - Model Status Dashboard
======================================================================

🌟 Popular Stocks (shown in UI):
----------------------------------------------------------------------
Ticker     CSV      Scaled     Scaler     Model      Size      
----------------------------------------------------------------------
AAPL       ✅       ✅         ✅         ✅         245.3 KB  
GOOGL      ✅       ✅         ✅         ✅         245.1 KB  
MSFT       ❌       ❌         ❌         ❌         -         
TSLA       ✅       ✅         ✅         ✅         245.2 KB  
AMZN       ❌       ❌         ❌         ❌         -         

📊 Summary:
   Total trained models: 3
   Popular stocks ready: 3/5

💡 Recommendation:
   Train missing popular stocks: MSFT, AMZN
   Run: python quick_train.py
```

---

## 🎯 Batch Training (Advanced)

### Interactive Training Menu

```bash
python train_multiple.py
```

**Menu Options:**

#### Option 1: Train Popular Stocks
Trains 10 pre-selected popular stocks:
- AAPL, GOOGL, MSFT, TSLA, AMZN
- META, NVDA, NFLX, AMD, INTC

#### Option 2: Train Custom List
Enter your own list of stocks:
```
Enter stock tickers separated by commas: AAPL,GOOGL,MSFT
```

With optional custom date range:
```
Use custom date range? (y/n): y
Enter start date (YYYY-MM-DD): 2020-01-01
Enter end date (YYYY-MM-DD): 2024-12-31
```

#### Option 3: Train Single Stock
Train just one stock at a time.

---

## 🔧 Manual Training (Step-by-Step)

For complete control over each step:

### Step 1: Collect Data
```bash
python backend/data_collector.py
```
- Downloads historical stock data from Yahoo Finance
- Creates `data/{TICKER}.csv`
- Date range: 2020-01-01 to 2025-01-01 (default)

### Step 2: Preprocess Data
```bash
python backend/preprocess.py
```
- Normalizes data using MinMax scaling
- Creates `data/{TICKER}_scaled.npy`
- Creates `data/{TICKER}_scaler.joblib`

### Step 3: Train Model
```bash
python backend/model.py
```
- Trains LSTM neural network
- Creates `data/{TICKER}_lstm.h5`
- Takes 2-5 minutes per stock

---

## 📈 Training Examples

### Example 1: Quick Setup for Demo
```bash
# Train the 5 stocks shown in the UI
python quick_train.py

# Check status
python check_models.py

# Run the app
python app.py
```

### Example 2: Train Tech Giants
```bash
python train_multiple.py
# Choose option 2
# Enter: AAPL,GOOGL,MSFT,AMZN,META,NVDA
```

### Example 3: Train Specific Stock with Custom Dates
```bash
python backend/data_collector.py
# Enter: TSLA

python backend/preprocess.py
# Enter: TSLA

python backend/model.py
# Enter: TSLA
```

---

## ⏱️ Training Time Estimates

| Number of Stocks | Estimated Time |
|-----------------|----------------|
| 1 stock         | 2-3 minutes    |
| 5 stocks        | 10-15 minutes  |
| 10 stocks       | 20-30 minutes  |
| 20 stocks       | 40-60 minutes  |

*Times vary based on your CPU/GPU and internet speed*

---

## 🎯 Recommended Training Strategy

### For Beginners
1. Run `python quick_train.py`
2. Wait for completion
3. Run `python app.py`
4. Test with the 5 popular stocks

### For Production Use
1. Run `python train_multiple.py`
2. Choose option 1 (Popular stocks)
3. Train all 10 popular stocks
4. Run `python check_models.py` to verify
5. Deploy the app

### For Custom Stocks
1. Create a list of stocks you want
2. Run `python train_multiple.py`
3. Choose option 2
4. Enter your custom list
5. Verify with `python check_models.py`

---

## ❓ Troubleshooting

### "No module named 'backend'"
**Solution:** Make sure you're in the TrendIQ directory
```bash
cd C:\Users\hp\OneDrive\Documents\Zoom\TrendIQ
```

### "Data download failed"
**Solution:** Check your internet connection and verify the ticker symbol is valid

### "Insufficient data"
**Solution:** The stock needs at least 60 days of trading history. Try a different date range or stock.

### Training is slow
**Solution:** 
- Close other applications
- Train fewer stocks at once
- Consider using a GPU for faster training

### Model already exists
**Solution:** The script will overwrite existing models. Delete old models first if needed:
```bash
# Windows
del data\AAPL_lstm.h5

# Or delete all models
del data\*_lstm.h5
```

---

## 💡 Pro Tips

1. **Train overnight**: For many stocks, run batch training before bed
2. **Check first**: Always run `check_models.py` before training to avoid duplicates
3. **Start small**: Test with 1-2 stocks before training many
4. **Update regularly**: Retrain models monthly with new data for best accuracy
5. **Backup models**: Save your trained models - they take time to create!

---

## 🎉 Next Steps

After training:
1. ✅ Run `python check_models.py` to verify
2. ✅ Start the web app with `python app.py`
3. ✅ Open http://127.0.0.1:5000 in your browser
4. ✅ Test predictions with trained stocks
5. ✅ Share with friends!

---

**Happy Training! 🚀**
