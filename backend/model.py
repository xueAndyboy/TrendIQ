import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import os

def train_model(ticker):
    data = np.load(f"data/{ticker}_scaled.npy")
    x, y = [], []
    for i in range(60, len(data)):
        x.append(data[i-60:i])
        y.append(data[i])
    x, y = np.array(x), np.array(y)

    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(x.shape[1], 1)),
        LSTM(50),
        Dense(1)
    ])

    model.compile(optimizer='adam', loss='mean_squared_error')
    model.fit(x, y, epochs=10, batch_size=32)

    model.save(f"data/{ticker}_lstm.h5")
    print(f"✅ Model saved to data/{ticker}_lstm.h5")

if __name__ == "__main__":
    ticker = input("Enter ticker symbol: ")
    train_model(ticker)
