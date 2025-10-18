import numpy as np
import joblib
from tensorflow.keras.models import load_model

def predict_next(ticker):
    model = load_model(f"data/{ticker}_lstm.h5")
    scaler = joblib.load(f"data/{ticker}_scaler.joblib")
    data = np.load(f"data/{ticker}_scaled.npy")

    last_60 = data[-60:]
    prediction = model.predict(np.expand_dims(last_60, axis=0))
    predicted_price = scaler.inverse_transform(prediction)
    print(f"📈 Next predicted price for {ticker}: {predicted_price[0][0]:.2f}")

if __name__ == "__main__":
    ticker = input("Enter ticker symbol: ")
    predict_next(ticker)
