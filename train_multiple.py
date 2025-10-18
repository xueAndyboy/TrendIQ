"""
Batch Training Script for Multiple Stocks
Trains models for multiple stock tickers automatically
"""

import os
import sys
from backend.data_collector import collect_data
from backend.preprocess import preprocess_data
from backend.model import train_model

# Popular stocks to train
POPULAR_STOCKS = [
    "AAPL",   # Apple
    "GOOGL",  # Google
    "MSFT",   # Microsoft
    "TSLA",   # Tesla
    "AMZN",   # Amazon
    "META",   # Meta (Facebook)
    "NVDA",   # NVIDIA
    "NFLX",   # Netflix
    "AMD",    # AMD
    "INTC",   # Intel
]

def train_stock(ticker, start_date="2020-01-01", end_date="2025-01-01"):
    """Train a single stock model"""
    print(f"\n{'='*60}")
    print(f"🎯 Training model for {ticker}")
    print(f"{'='*60}")
    
    try:
        # Step 1: Collect data
        print(f"\n📥 Step 1/3: Collecting data for {ticker}...")
        collect_data(ticker, start_date, end_date)
        
        # Step 2: Preprocess data
        print(f"\n⚙️  Step 2/3: Preprocessing data for {ticker}...")
        preprocess_data(ticker)
        
        # Step 3: Train model
        print(f"\n🤖 Step 3/3: Training LSTM model for {ticker}...")
        train_model(ticker)
        
        print(f"\n✅ Successfully trained model for {ticker}!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error training {ticker}: {str(e)}")
        return False

def train_multiple_stocks(tickers, start_date="2020-01-01", end_date="2025-01-01"):
    """Train models for multiple stocks"""
    print("\n" + "="*60)
    print("🚀 TrendIQ - Batch Model Training")
    print("="*60)
    print(f"\nTraining {len(tickers)} stock models...")
    print(f"Tickers: {', '.join(tickers)}")
    print(f"Date Range: {start_date} to {end_date}")
    
    successful = []
    failed = []
    
    for i, ticker in enumerate(tickers, 1):
        print(f"\n\n📊 Progress: {i}/{len(tickers)}")
        
        if train_stock(ticker, start_date, end_date):
            successful.append(ticker)
        else:
            failed.append(ticker)
    
    # Summary
    print("\n\n" + "="*60)
    print("📈 TRAINING SUMMARY")
    print("="*60)
    print(f"\n✅ Successfully trained: {len(successful)}/{len(tickers)}")
    if successful:
        print(f"   {', '.join(successful)}")
    
    if failed:
        print(f"\n❌ Failed: {len(failed)}/{len(tickers)}")
        print(f"   {', '.join(failed)}")
    
    print("\n" + "="*60)
    print("🎉 Batch training complete!")
    print("="*60)

def main():
    print("\n🤖 TrendIQ - Model Training Assistant\n")
    print("Choose an option:")
    print("1. Train popular stocks (AAPL, GOOGL, MSFT, TSLA, AMZN, etc.)")
    print("2. Train custom list of stocks")
    print("3. Train a single stock")
    
    choice = input("\nEnter your choice (1/2/3): ").strip()
    
    if choice == "1":
        print(f"\n📋 Training {len(POPULAR_STOCKS)} popular stocks...")
        train_multiple_stocks(POPULAR_STOCKS)
    
    elif choice == "2":
        tickers_input = input("\nEnter stock tickers separated by commas (e.g., AAPL,GOOGL,MSFT): ").strip()
        tickers = [t.strip().upper() for t in tickers_input.split(",") if t.strip()]
        
        if not tickers:
            print("❌ No valid tickers provided!")
            return
        
        # Optional: Custom date range
        use_custom_dates = input("\nUse custom date range? (y/n, default: n): ").strip().lower()
        
        if use_custom_dates == 'y':
            start_date = input("Enter start date (YYYY-MM-DD, default: 2020-01-01): ").strip() or "2020-01-01"
            end_date = input("Enter end date (YYYY-MM-DD, default: 2025-01-01): ").strip() or "2025-01-01"
            train_multiple_stocks(tickers, start_date, end_date)
        else:
            train_multiple_stocks(tickers)
    
    elif choice == "3":
        ticker = input("\nEnter stock ticker: ").strip().upper()
        if ticker:
            train_stock(ticker)
        else:
            print("❌ No ticker provided!")
    
    else:
        print("❌ Invalid choice!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Training interrupted by user!")
        sys.exit(0)
