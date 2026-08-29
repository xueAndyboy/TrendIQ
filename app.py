from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import pandas as pd
import yfinance as yf
import os
from datetime import datetime, timedelta

# Conditionally import TensorFlow (to allow deployment on Vercel where TF is omitted)
try:
    from tensorflow.keras.models import load_model
    HAS_TENSORFLOW = True
except ImportError:
    HAS_TENSORFLOW = False

app = Flask(__name__, template_folder="frontend", static_folder="frontend")

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/predict-page")
def predict_page():
    return render_template("predict.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/live-ticker", methods=["GET"])
def live_ticker():
    """Get live stock data for ticker widget"""
    tickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
    ticker_data = []
    
    try:
        # Download historical data for the last 5 days to get clean prices in bulk
        df = yf.download(tickers, period='5d')
        if 'Close' in df:
            close = df['Close'].dropna(how='all')
            for ticker_symbol in tickers:
                if ticker_symbol in close.columns:
                    ticker_close = close[ticker_symbol].dropna()
                    if not ticker_close.empty:
                        current_price = float(ticker_close.iloc[-1])
                        previous_close = float(ticker_close.iloc[-2]) if len(ticker_close) > 1 else current_price
                        
                        change = current_price - previous_close
                        change_percent = (change / previous_close) * 100 if previous_close else 0
                        
                        ticker_data.append({
                            'symbol': ticker_symbol,
                            'price': round(current_price, 2),
                            'change': round(change, 2),
                            'changePercent': round(change_percent, 2)
                        })
                        continue
                
                # Fallback if ticker data is missing
                ticker_data.append({
                    'symbol': ticker_symbol,
                    'price': None,
                    'change': None,
                    'changePercent': None
                })
        else:
            raise ValueError("Close column missing in downloaded data")
    except Exception as e:
        print(f"Error fetching live tickers: {e}")
        # Fallback to empty/None data
        for ticker_symbol in tickers:
            ticker_data.append({
                'symbol': ticker_symbol,
                'price': None,
                'change': None,
                'changePercent': None
            })
            
    return jsonify(ticker_data)

def predict_lightweight(ticker):
    """
    Predict next price for any stock on-the-fly using Ridge Regression on historical data.
    Does not require pre-trained models or TensorFlow.
    """
    from sklearn.linear_model import Ridge
    
    # 1. Fetch historical data (1 year to ensure robust training)
    stock = yf.Ticker(ticker)
    hist_data = stock.history(period="1y")
    
    if hist_data.empty or len(hist_data) < 30:
        hist_data = stock.history(period="2y")
        if hist_data.empty or len(hist_data) < 30:
            raise ValueError(f"Insufficient historical data for {ticker}. Need at least 30 days of data.")
            
    # Clean data
    hist_data = hist_data.dropna(subset=['Close'])
    if len(hist_data) < 30:
        raise ValueError(f"Insufficient clean historical data for {ticker}.")
        
    prices = hist_data['Close'].values
    dates = hist_data.index.strftime('%Y-%m-%d').tolist()
    
    current_price = float(prices[-1])
    
    # 2. Build training dataset using sliding window
    window_size = 20
    if len(prices) <= window_size:
        window_size = len(prices) // 2
        
    X, y = [], []
    for i in range(window_size, len(prices)):
        X.append(prices[i-window_size:i])
        y.append(prices[i])
        
    X = np.array(X)
    y = np.array(y)
    
    # 3. Train a Ridge Regression model
    model = Ridge(alpha=1.0)
    model.fit(X, y)
    
    # 4. Predict the next day's price
    last_window = prices[-window_size:]
    predicted_price = float(model.predict(np.expand_dims(last_window, axis=0))[0])
    
    # Calculate price change metrics
    price_change = predicted_price - current_price
    price_change_pct = (price_change / current_price) * 100
    trend = "up" if price_change > 0.05 else "down" if price_change < -0.05 else "neutral"
    
    # 5. Calculate confidence score based on recent volatility (last 30 days)
    recent_prices = prices[-30:] if len(prices) >= 30 else prices
    volatility = float(np.std(recent_prices))
    avg_price = float(np.mean(recent_prices))
    volatility_ratio = (volatility / avg_price) * 100 if avg_price else 0
    
    if volatility_ratio < 2:
        confidence = 92
    elif volatility_ratio < 5:
        confidence = 82
    elif volatility_ratio < 10:
        confidence = 68
    else:
        confidence = 52
        
    # Get historical data for chart (last 30 days)
    chart_len = min(30, len(prices))
    chart_data = {
        "dates": dates[-chart_len:],
        "prices": [float(p) for p in prices[-chart_len:]]
    }
    
    return {
        "ticker": ticker,
        "predicted_price": round(predicted_price, 2),
        "current_price": round(current_price, 2),
        "price_change": round(price_change, 2),
        "price_change_pct": round(price_change_pct, 2),
        "trend": trend,
        "chart_data": chart_data,
        "confidence": int(confidence),
        "volatility": round(volatility_ratio, 2),
        "model_type": "regression"
    }

@app.route("/predict", methods=["POST"])
def predict():
    ticker = request.form.get("ticker", "").upper().strip()
    
    if not ticker:
        return jsonify({"error": "Please enter a stock ticker symbol."})
    
    try:
        model_path = f"data/{ticker}_lstm.h5"
        scaler_path = f"data/{ticker}_scaler.joblib"
        data_path = f"data/{ticker}_scaled.npy"

        # Determine if we can use the pre-trained LSTM model
        use_lstm = False
        if HAS_TENSORFLOW and os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(data_path):
            use_lstm = True

        if use_lstm:
            try:
                # Load model and make prediction
                model = load_model(model_path, compile=False)
                scaler = joblib.load(scaler_path)
                data = np.load(data_path)

                if len(data) < 60:
                    # Fallback to lightweight if insufficient data
                    prediction_result = predict_lightweight(ticker)
                    return jsonify(prediction_result)

                last_60 = data[-60:]
                prediction = model.predict(np.expand_dims(last_60, axis=0), verbose=0)
                predicted_price = scaler.inverse_transform(prediction)[0][0]
                
                # Calculate confidence score based on recent volatility
                recent_prices = scaler.inverse_transform(data[-30:])
                volatility = np.std(recent_prices)
                avg_price = np.mean(recent_prices)
                volatility_ratio = (volatility / avg_price) * 100
                
                # Confidence: higher volatility = lower confidence
                if volatility_ratio < 2:
                    confidence = 95
                elif volatility_ratio < 5:
                    confidence = 85
                elif volatility_ratio < 10:
                    confidence = 70
                else:
                    confidence = 55

                # Get current stock data for comparison
                try:
                    stock = yf.Ticker(ticker)
                    current_data = stock.history(period="5d")
                    
                    if not current_data.empty:
                        current_data = current_data.dropna(subset=['Close'])
                        current_price = float(current_data['Close'].iloc[-1])
                        price_change = predicted_price - current_price
                        price_change_pct = (price_change / current_price) * 100
                        trend = "up" if price_change > 0.05 else "down" if price_change < -0.05 else "neutral"
                        
                        # Get historical data for chart (last 30 days)
                        hist_data = stock.history(period="1mo")
                        hist_data = hist_data.dropna(subset=['Close'])
                        chart_data = {
                            "dates": hist_data.index.strftime('%Y-%m-%d').tolist()[-30:],
                            "prices": [float(p) for p in hist_data['Close'].tolist()[-30:]]
                        }
                    else:
                        current_price = None
                        price_change = None
                        price_change_pct = None
                        trend = "unknown"
                        chart_data = None
                except Exception as e:
                    print(f"Error fetching current details for {ticker}: {e}")
                    current_price = None
                    price_change = None
                    price_change_pct = None
                    trend = "unknown"
                    chart_data = None

                return jsonify({
                    "ticker": ticker,
                    "predicted_price": round(float(predicted_price), 2),
                    "current_price": round(float(current_price), 2) if current_price else None,
                    "price_change": round(float(price_change), 2) if price_change else None,
                    "price_change_pct": round(float(price_change_pct), 2) if price_change_pct else None,
                    "trend": trend,
                    "chart_data": chart_data,
                    "confidence": int(confidence),
                    "volatility": round(float(volatility_ratio), 2),
                    "model_type": "lstm"
                })
            except Exception as e:
                print(f"LSTM model load/prediction failed for {ticker}, falling back to Ridge ML: {e}")
                prediction_result = predict_lightweight(ticker)
                return jsonify(prediction_result)
        else:
            # Fallback to lightweight model
            prediction_result = predict_lightweight(ticker)
            return jsonify(prediction_result)

    except KeyError:
        return jsonify({"error": "Invalid request. Please provide a ticker symbol."})
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"})

if __name__ == "__main__":
    app.run(debug=True)
