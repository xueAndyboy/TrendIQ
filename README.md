# 📊 TrendIQ - AI-Powered Stock Market Predictor

TrendIQ is a modern web application that uses LSTM (Long Short-Term Memory) neural networks to predict stock market prices. Built with Flask and TensorFlow, it provides accurate next-day price predictions based on historical market data.

## ✨ Features

- 🎯 **AI-Powered Predictions** - Uses LSTM neural networks for accurate forecasting
- ⚡ **Real-Time Analysis** - Get predictions in seconds
- 📊 **Live Market Data** - Real-time stock ticker with price updates
- 🔄 **Multi-Stock Comparison** - Compare up to 3 stocks side-by-side
- 📜 **Prediction History** - Track your past predictions with local storage
- 🎨 **Confidence Score** - AI-calculated confidence based on volatility
- 🎨 **Modern Neon UI** - Professional cyberpunk-inspired design
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🔒 **Secure** - All data processing happens locally
- 🚀 **Quick Access** - Popular stock chips for one-click predictions
- 🔗 **Share Predictions** - Share your predictions easily

## 🛠️ Tech Stack

- **Backend**: Flask, TensorFlow/Keras, NumPy, Pandas
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **ML Model**: LSTM Neural Network
- **Data Source**: Yahoo Finance (yfinance)

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## 🚀 Installation

1. **Clone or download the repository**

2. **Install required packages**:
```bash
pip install flask tensorflow numpy pandas scikit-learn yfinance joblib
```

## 📖 Usage Guide

### Quick Start (Recommended)

**Train all popular stocks at once:**
```bash
python quick_train.py
```
This trains models for AAPL, GOOGL, MSFT, TSLA, and AMZN (takes ~10-15 minutes).

**Then run the app:**
```bash
python app.py
```
Open your browser and navigate to `http://127.0.0.1:5000`

---

### Advanced Training Options

#### Option 1: Batch Training Multiple Stocks
```bash
python train_multiple.py
```
Interactive menu to train:
- Popular stocks (10+ pre-selected stocks)
- Custom list of stocks
- Single stock

#### Option 2: Check Model Status
```bash
python check_models.py
```
View which models are trained and ready to use.

#### Option 3: Manual Training (Single Stock)

**Step 1: Collect Stock Data**
```bash
python backend/data_collector.py
```
Enter the stock ticker symbol (e.g., AAPL).

**Step 2: Preprocess Data**
```bash
python backend/preprocess.py
```
Enter the same ticker symbol.

**Step 3: Train the Model**
```bash
python backend/model.py
```
Enter the ticker symbol again (takes a few minutes).

## 🎮 How to Use the Web Interface

1. **Enter a Stock Symbol**: Type any valid stock ticker (e.g., AAPL, GOOGL, TSLA)
2. **Click Predict**: Or use the popular stock chips for quick access
3. **View Results**: See the predicted next-day closing price
4. **Try Another**: Press ESC to clear and start over

## 📁 Project Structure

```
TrendIQ/
├── app.py                      # Flask web application
├── quick_train.py              # Quick training for popular stocks
├── train_multiple.py           # Batch training script
├── check_models.py             # Check trained models status
├── requirements.txt            # Python dependencies
├── backend/
│   ├── data_collector.py      # Downloads stock data
│   ├── preprocess.py          # Data preprocessing
│   ├── model.py               # LSTM model training
│   └── predict.py             # Standalone prediction script
├── frontend/
│   ├── index.html             # Main HTML page
│   ├── style.css              # Styling and animations
│   └── script.js              # Frontend logic
├── data/                       # Generated data and models
│   ├── {TICKER}.csv           # Raw stock data
│   ├── {TICKER}_scaled.npy    # Preprocessed data
│   ├── {TICKER}_scaler.joblib # Data scaler
│   └── {TICKER}_lstm.h5       # Trained model
└── README.md                   # This file
```

## 🎯 Supported Stocks

Any stock available on Yahoo Finance can be used. Popular examples:
- **AAPL** - Apple Inc.
- **GOOGL** - Alphabet Inc.
- **MSFT** - Microsoft Corporation
- **TSLA** - Tesla Inc.
- **AMZN** - Amazon.com Inc.

## ⚙️ Model Details

- **Architecture**: LSTM Neural Network
- **Input**: 60 days of historical closing prices
- **Output**: Next-day closing price prediction
- **Training**: 10 epochs with batch size of 32
- **Normalization**: MinMax scaling (0-1 range)

## 🔧 Troubleshooting

### "Model data not found" Error
- Make sure you've run all three steps (collect, preprocess, train) for that stock

### "Insufficient data" Error
- The stock needs at least 60 days of historical data

### CSS/JS Not Loading
- Clear browser cache (Ctrl+Shift+R)
- Check that Flask is running without errors

## 🌟 Features Breakdown

### Frontend Enhancements
- ✅ Glassmorphism design with backdrop blur
- ✅ Animated background with floating circles
- ✅ Loading animations and state management
- ✅ Popular stock quick-access chips
- ✅ Auto-uppercase ticker input
- ✅ Keyboard shortcuts (ESC to clear)
- ✅ Responsive mobile design

### Backend Improvements
- ✅ Better error handling and messages
- ✅ Input validation
- ✅ Detailed error descriptions with solutions
- ✅ Silent model prediction (verbose=0)
- ✅ Proper file existence checks

## 📝 Notes

- Predictions are based on historical patterns and should not be used as sole investment advice
- Stock market predictions are inherently uncertain
- Always do your own research before making investment decisions
- This is an educational project demonstrating ML capabilities

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Yahoo Finance for providing historical stock data
- TensorFlow/Keras for the deep learning framework
- Flask for the web framework

---

**Made with ❤️ using AI and Machine Learning**
