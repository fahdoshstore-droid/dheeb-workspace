#!/usr/bin/env python3
"""NDX Setup Detector - Trend detection with basic setup classification."""

import yfinance as yf

def get_ndx_data():
    """Fetch NDX price and moving averages."""
    ndx = yf.Ticker("^NDX")
    hist = ndx.history(period="3mo")  # Need 3mo for 50 SMA
    
    if hist.empty:
        return None
    
    latest = hist.iloc[-1]
    
    # Calculate SMAs
    hist['SMA20'] = hist['Close'].rolling(window=20).mean()
    hist['SMA50'] = hist['Close'].rolling(window=50).mean()
    
    # Get latest values
    price = latest['Close']
    sma20 = hist['SMA20'].iloc[-1]
    sma50 = hist['SMA50'].iloc[-1]
    
    # Get recent low (last 5 days) for support
    recent_low = hist['Low'].tail(5).min()
    
    return {
        "price": round(price, 2),
        "sma20": round(sma20, 2),
        "sma50": round(sma50, 2),
        "recent_low": round(recent_low, 2),
        "sma20_dist": round((price - sma20) / sma20 * 100, 2),
        "sma50_dist": round((price - sma50) / sma50 * 100, 2),
    }

def detect_setup(data):
    """Detect trend and setup."""
    price = data['price']
    sma20 = data['sma20']
    sma50 = data['sma50']
    recent_low = data['recent_low']
    
    # Trend: bullish if price above both SMAs
    bullish = price > sma20 and price > sma50
    
    # Support: near support if within 2% of recent low
    near_support = (price - recent_low) / recent_low < 0.02
    
    # Strong bullish: price above both MAs and near support
    if bullish and near_support:
        return "A+ Setup"
    elif bullish:
        return "Bullish"
    elif price > sma50:
        return "Neutral"
    else:
        return "Bearish"

def main():
    data = get_ndx_data()
    if not data:
        print("Failed to fetch NDX data")
        return
    
    setup = detect_setup(data)
    
    print(f"NDX: {data['price']:,}")
    print(f"SMA20: {data['sma20']:,} ({data['sma20_dist']:+.1f}%)")
    print(f"SMA50: {data['sma50']:,} ({data['sma50_dist']:+.1f}%)")
    print(f"Recent Low: {data['recent_low']:,}")
    print(f"---")
    print(f"Setup: {setup}")

if __name__ == "__main__":
    main()
