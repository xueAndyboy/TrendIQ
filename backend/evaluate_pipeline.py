"""
TrendIQ Empirical Evaluation & Benchmarking Pipeline
====================================================
Performs rigorous out-of-sample time-series evaluation on real market data.

Methodological Principles:
1. Time-based sequential split (80% Train, 20% Test) — NO random shuffling
   to strictly prevent lookahead bias / data leakage.
2. Naive Persistence Benchmark (Random Walk Hypothesis: y_hat_t = y_{t-1}).
3. Metrics: RMSE, MAE, MAPE (%), and Directional Accuracy (%).
4. Standardized outputs exported to data/benchmark_results.json.
"""

import os
import json
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error

TICKERS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"]

def compute_metrics(y_true, y_pred, y_prev):
    """
    Compute standard quantitative metrics on test series.
    
    Parameters:
        y_true: Ground truth actual prices
        y_pred: Model predicted prices
        y_prev: Previous day's price (for directional accuracy calculation)
    """
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    mape = float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0)
    
    # Directional Accuracy: Did the model predict the correct sign of change?
    true_dir = np.sign(y_true - y_prev)
    pred_dir = np.sign(y_pred - y_prev)
    directional_accuracy = float(np.mean(true_dir == pred_dir) * 100.0)
    
    return {
        "rmse": round(rmse, 2),
        "mae": round(mae, 2),
        "mape": round(mape, 2),
        "directional_accuracy": round(directional_accuracy, 1)
    }

def extract_features(df):
    """
    Construct causal time-series features using only past information (lags, momentum, volatility).
    """
    df = df.copy()
    close = df['Close']
    
    # Lag features
    for lag in range(1, 6):
        df[f'lag_{lag}'] = close.shift(lag)
        
    # Rolling moving averages
    df['sma_5'] = close.shift(1).rolling(window=5).mean()
    df['sma_20'] = close.shift(1).rolling(window=20).mean()
    
    # Momentum and return proxies
    df['ret_1d'] = (close.shift(1) - close.shift(2)) / close.shift(2)
    df['ret_5d'] = (close.shift(1) - close.shift(6)) / close.shift(6)
    
    # Volatility proxy (rolling 10-day std)
    df['vol_10d'] = close.shift(1).rolling(window=10).std()
    
    # Target: next day close
    df['target'] = close
    
    # Drop rows with NaNs caused by lagging/rolling
    df_clean = df.dropna().copy()
    
    feature_cols = [c for c in df_clean.columns if c not in ['Open', 'High', 'Low', 'Close', 'Volume', 'target', 'Dividends', 'Stock Splits']]
    return df_clean, feature_cols

def evaluate_ticker(ticker):
    print(f"--> Fetching and evaluating {ticker}...")
    stock = yf.Ticker(ticker)
    df = stock.history(period="2y")
    
    if df.empty or len(df) < 100:
        raise ValueError(f"Insufficient historical data for {ticker}")
        
    df_clean, feature_cols = extract_features(df)
    
    # 80/20 Time-Series Sequential Split (NO SHUFFLE)
    n_samples = len(df_clean)
    train_size = int(n_samples * 0.8)
    
    train_df = df_clean.iloc[:train_size]
    test_df = df_clean.iloc[train_size:]
    
    X_train = train_df[feature_cols].values
    y_train = train_df['target'].values
    
    X_test = test_df[feature_cols].values
    y_test = test_df['target'].values
    y_prev_test = test_df['lag_1'].values
    
    # 1. Baseline: Naive Persistence (Tomorrow = Today)
    y_pred_naive = y_prev_test
    naive_metrics = compute_metrics(y_test, y_pred_naive, y_prev_test)
    
    # 2. Baseline: 20-day SMA
    y_pred_sma20 = test_df['sma_20'].values
    sma_metrics = compute_metrics(y_test, y_pred_sma20, y_prev_test)
    
    # 3. Model: Ridge Autoregressive ML
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train, y_train)
    y_pred_ridge = ridge.predict(X_test)
    ridge_metrics = compute_metrics(y_test, y_pred_ridge, y_prev_test)
    
    # Test date range
    test_start = test_df.index[0].strftime('%Y-%m-%d')
    test_end = test_df.index[-1].strftime('%Y-%m-%d')
    
    return {
        "ticker": ticker,
        "sample_size": n_samples,
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "test_period": f"{test_start} to {test_end}",
        "latest_price": round(float(y_test[-1]), 2),
        "ridge_model": ridge_metrics,
        "naive_baseline": naive_metrics,
        "sma20_baseline": sma_metrics,
        "improvement_over_naive_rmse_pct": round(
            ((naive_metrics['rmse'] - ridge_metrics['rmse']) / naive_metrics['rmse']) * 100.0, 2
        )
    }

def run_all_evaluations():
    print("=" * 80)
    print("TrendIQ Quantitative Evaluation Engine")
    print("=" * 80)
    
    results = {}
    for ticker in TICKERS:
        try:
            results[ticker] = evaluate_ticker(ticker)
        except Exception as e:
            print(f"Error evaluating {ticker}: {e}")
            
    os.makedirs("data", exist_ok=True)
    out_path = "data/benchmark_results.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"\n[OK] Benchmark results saved to {out_path}\n")
    
    # Display Markdown Table
    print("| Ticker | Test Period | Ridge RMSE | Naive RMSE | Ridge MAPE | Directional Acc | RMSE Gain vs Baseline |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for ticker, res in results.items():
        rm = res["ridge_model"]
        nb = res["naive_baseline"]
        gain = res["improvement_over_naive_rmse_pct"]
        gain_str = f"+{gain}%" if gain > 0 else f"{gain}%"
        print(f"| **{ticker}** | {res['test_period']} | ${rm['rmse']} | ${nb['rmse']} | {rm['mape']}% | **{rm['directional_accuracy']}%** | {gain_str} |")
        
    return results

if __name__ == "__main__":
    run_all_evaluations()
