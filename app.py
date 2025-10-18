from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
import joblib
import numpy as np
import pandas as pd
import yfinance as yf
import os
from datetime import datetime, timedelta

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
    
    for ticker_symbol in tickers:
        try:
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.info
            
            current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
            previous_close = info.get('previousClose', 0)
            
            if current_price and previous_close:
                change = current_price - previous_close
                change_percent = (change / previous_close) * 100
                
                ticker_data.append({
                    'symbol': ticker_symbol,
                    'price': round(current_price, 2),
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2)
                })
            else:
                ticker_data.append({
                    'symbol': ticker_symbol,
                    'price': None,
                    'change': None,
                    'changePercent': None
                })
        except Exception as e:
            print(f"Error fetching {ticker_symbol}: {e}")
            ticker_data.append({
                'symbol': ticker_symbol,
                'price': None,
                'change': None,
                'changePercent': None
            })
    
    return jsonify(ticker_data)

@app.route("/predict", methods=["POST"])
def predict():
    ticker = request.form.get("ticker", "").upper().strip()
    
    if not ticker:
        return jsonify({"error": "Please enter a stock ticker symbol."})
    
    try:
        model_path = f"data/{ticker}_lstm.h5"
        scaler_path = f"data/{ticker}_scaler.joblib"
        data_path = f"data/{ticker}_scaled.npy"

        # Check if model exists
        if not os.path.exists(model_path):
            return jsonify({
                "error": f"No trained model found for {ticker}. Please train the model first using:\n1. python backend/data_collector.py\n2. python backend/preprocess.py\n3. python backend/model.py"
            })
        
        if not os.path.exists(scaler_path) or not os.path.exists(data_path):
            return jsonify({
                "error": f"Missing data files for {ticker}. Please run preprocessing and training steps."
            })

        # Load model and make prediction
        model = load_model(model_path, compile=False)
        scaler = joblib.load(scaler_path)
        data = np.load(data_path)

        if len(data) < 60:
            return jsonify({
                "error": f"Insufficient data for {ticker}. Need at least 60 days of historical data."
            })

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
                current_price = float(current_data['Close'].iloc[-1])
                previous_price = float(current_data['Close'].iloc[-2]) if len(current_data) > 1 else current_price
                
                # Calculate metrics
                price_change = predicted_price - current_price
                price_change_pct = (price_change / current_price) * 100
                trend = "up" if price_change > 0 else "down" if price_change < 0 else "neutral"
                
                # Get historical data for chart (last 30 days)
                hist_data = stock.history(period="1mo")
                chart_data = {
                    "dates": hist_data.index.strftime('%Y-%m-%d').tolist()[-30:],
                    "prices": hist_data['Close'].tolist()[-30:]
                }
            else:
                current_price = None
                price_change = None
                price_change_pct = None
                trend = "unknown"
                chart_data = None
        except Exception as e:
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
            "volatility": round(float(volatility_ratio), 2)
        })

    except KeyError:
        return jsonify({"error": "Invalid request. Please provide a ticker symbol."})
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"})

if __name__ == "__main__":
    app.run(debug=True)
