#!/usr/bin/env python3
"""NDX Price Alert - Fetches NDX price and sends to Telegram."""

import yfinance as yf
import os
import json

def get_ndx_price():
    """Fetch current NDX/NQ price."""
    ndx = yf.Ticker("^NDX")
    nq = yf.Ticker("NQ=F")
    
    ndx_hist = ndx.history(period="1d")
    nq_hist = nq.history(period="1d")
    
    if ndx_hist.empty or nq_hist.empty:
        return None
    
    ndx_latest = ndx_hist.iloc[-1]
    nq_latest = nq_hist.iloc[-1]
    
    return {
        "ndx": {
            "price": round(ndx_latest['Close'], 2),
            "open": round(ndx_latest['Open'], 2),
            "high": round(ndx_latest['High'], 2),
            "low": round(ndx_latest['Low'], 2),
        },
        "nq": {
            "price": round(nq_latest['Close'], 2),
            "open": round(nq_latest['Open'], 2),
            "high": round(nq_latest['High'], 2),
            "low": round(nq_latest['Low'], 2),
        }
    }

def format_message(data):
    """Format price data as Telegram message."""
    ndx = data['ndx']
    nq = data['nq']
    
    change_ndx = ndx['price'] - ndx['open']
    change_nq = nq['price'] - nq['open']
    
    emoji_ndx = "🟢" if change_ndx > 0 else "🔴"
    emoji_nq = "🟢" if change_nq > 0 else "🔴"
    
    return f"""📊 NDX Price Update

{emoji_ndx} NDX: {ndx['price']:,}
   O: {ndx['open']:,} | H: {ndx['high']:,} | L: {ndx['low']:,}

{emoji_nq} NQ (Futures): {nq['price']:,}
   O: {nq['open']:,} | H: {nq['high']:,} | L: {nq['low']:,}

Change: {change_ndx:+.2f} ({change_ndx/ndx['open']*100:+.2f}%)"""

if __name__ == "__main__":
    data = get_ndx_price()
    if data:
        print(format_message(data))
        # Save for cron to read
        with open('/tmp/ndx_price.json', 'w') as f:
            json.dump(data, f)
    else:
        print("Failed to fetch NDX price")
