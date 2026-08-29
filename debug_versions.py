import tensorflow as tf
import keras
import os
import sys

print(f"Python: {sys.version}")
print(f"TensorFlow: {tf.__version__}")
try:
    print(f"Keras: {keras.__version__}")
except:
    print("Keras version not found in keras.__version__")

try:
    from tensorflow.keras.models import load_model
    ticker = "AAPL"
    model_path = f"data/{ticker}_lstm.h5"
    if os.path.exists(model_path):
        print(f"Attempting to load model from {model_path}...")
        model = load_model(model_path, compile=False)
        print("Model loaded successfully!")
    else:
        print(f"Model file {model_path} not found.")
except Exception as e:
    print(f"Error loading model: {e}")
