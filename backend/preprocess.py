import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

def preprocess_data(ticker):
    df = pd.read_csv(f"data/{ticker}.csv")
    df = df[['Close']]  # only closing prices
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df)
    np.save(f"data/{ticker}_scaled.npy", scaled_data)
    joblib.dump(scaler, f"data/{ticker}_scaler.joblib")
    print(f"✅ Preprocessing complete for {ticker}")

if __name__ == "__main__":
    ticker = input("Enter ticker symbol: ")
    preprocess_data(ticker)
