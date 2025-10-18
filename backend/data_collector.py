import yfinance as yf
import pandas as pd
import sys, os

def collect_data(ticker, start, end):
    data = yf.download(ticker, start=start, end=end)
    os.makedirs("data", exist_ok=True)
    # Reset index to make Date a column and save without multi-level headers
    data = data.reset_index()
    data.to_csv(f"data/{ticker}.csv", index=False)
    print(f"✅ Data saved to data/{ticker}.csv")

if __name__ == "__main__":
    ticker = input("Enter ticker symbol (e.g. AAPL): ")
    collect_data(ticker, "2020-01-01", "2025-01-01")
