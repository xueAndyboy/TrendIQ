"""
Model Status Checker
Check which stock models are trained and ready to use
"""

import os
from datetime import datetime

def check_model_status(ticker):
    """Check if all required files exist for a ticker"""
    model_path = f"data/{ticker}_lstm.h5"
    scaler_path = f"data/{ticker}_scaler.joblib"
    data_path = f"data/{ticker}_scaled.npy"
    csv_path = f"data/{ticker}.csv"
    
    status = {
        "csv": os.path.exists(csv_path),
        "scaled": os.path.exists(data_path),
        "scaler": os.path.exists(scaler_path),
        "model": os.path.exists(model_path)
    }
    
    # Get file sizes if they exist
    sizes = {}
    if status["model"] and os.path.exists(model_path):
        sizes["model"] = os.path.getsize(model_path) / 1024  # KB
    
    return status, sizes

def get_all_trained_models():
    """Get list of all trained models"""
    if not os.path.exists("data"):
        return []
    
    models = []
    for file in os.listdir("data"):
        if file.endswith("_lstm.h5"):
            ticker = file.replace("_lstm.h5", "")
            models.append(ticker)
    
    return sorted(models)

def display_status():
    """Display status of all models"""
    print("\n" + "="*70)
    print("📊 TrendIQ - Model Status Dashboard")
    print("="*70)
    
    # Check popular stocks
    popular_stocks = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
    
    print("\n🌟 Popular Stocks (shown in UI):")
    print("-" * 70)
    print(f"{'Ticker':<10} {'CSV':<8} {'Scaled':<10} {'Scaler':<10} {'Model':<10} {'Size':<10}")
    print("-" * 70)
    
    for ticker in popular_stocks:
        status, sizes = check_model_status(ticker)
        csv_status = "✅" if status["csv"] else "❌"
        scaled_status = "✅" if status["scaled"] else "❌"
        scaler_status = "✅" if status["scaler"] else "❌"
        model_status = "✅" if status["model"] else "❌"
        model_size = f"{sizes.get('model', 0):.1f} KB" if status["model"] else "-"
        
        print(f"{ticker:<10} {csv_status:<8} {scaled_status:<10} {scaler_status:<10} {model_status:<10} {model_size:<10}")
    
    # Check all trained models
    all_models = get_all_trained_models()
    other_models = [m for m in all_models if m not in popular_stocks]
    
    if other_models:
        print("\n📈 Other Trained Models:")
        print("-" * 70)
        print(f"{'Ticker':<10} {'CSV':<8} {'Scaled':<10} {'Scaler':<10} {'Model':<10} {'Size':<10}")
        print("-" * 70)
        
        for ticker in other_models:
            status, sizes = check_model_status(ticker)
            csv_status = "✅" if status["csv"] else "❌"
            scaled_status = "✅" if status["scaled"] else "❌"
            scaler_status = "✅" if status["scaler"] else "❌"
            model_status = "✅" if status["model"] else "❌"
            model_size = f"{sizes.get('model', 0):.1f} KB" if status["model"] else "-"
            
            print(f"{ticker:<10} {csv_status:<8} {scaled_status:<10} {scaler_status:<10} {model_status:<10} {model_size:<10}")
    
    # Summary
    print("\n" + "="*70)
    print(f"📊 Summary:")
    print(f"   Total trained models: {len(all_models)}")
    print(f"   Popular stocks ready: {sum(1 for t in popular_stocks if check_model_status(t)[0]['model'])}/5")
    
    # Recommendations
    missing_popular = [t for t in popular_stocks if not check_model_status(t)[0]["model"]]
    if missing_popular:
        print(f"\n💡 Recommendation:")
        print(f"   Train missing popular stocks: {', '.join(missing_popular)}")
        print(f"   Run: python quick_train.py")
    else:
        print(f"\n✅ All popular stocks are trained and ready!")
    
    print("="*70 + "\n")

if __name__ == "__main__":
    display_status()
