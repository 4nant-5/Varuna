import yfinance as yf
import pandas as pd

tickers = ['BDRY', 'CL=F', 'HRC=F', 'MTF=F', 'TIO=F']
print("Fetching data...")
try:
    data = yf.download(tickers, period="3y")
    print(data['Close'].head())
    print("Null values:")
    print(data['Close'].isnull().sum())
except Exception as e:
    print(f"Error: {e}")
