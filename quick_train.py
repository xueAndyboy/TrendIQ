"""
Quick Training Script - Trains the 5 popular stocks shown in the UI
Run this to quickly set up models for AAPL, GOOGL, MSFT, TSLA, AMZN
"""

from train_multiple import train_multiple_stocks

# The 5 stocks shown as chips in the UI
QUICK_STOCKS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]

if __name__ == "__main__":
    print("\n🚀 Quick Training - Popular Stocks")
    print("Training models for: AAPL, GOOGL, MSFT, TSLA, AMZN\n")
    
    confirm = input("This will take approximately 10-15 minutes. Continue? (y/n): ").strip().lower()
    
    if confirm == 'y':
        train_multiple_stocks(QUICK_STOCKS)
        print("\n✨ All popular stocks are now ready to use in the web app!")
    else:
        print("❌ Training cancelled.")
