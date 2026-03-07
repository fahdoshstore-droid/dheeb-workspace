#!/usr/bin/env python3
"""
Dheeb MVP - Heartbeat NDX
Price checker + simple setup detection
"""

import yfinance as yf
import json
import requests
from datetime import datetime
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def get_ndx_price():
    """Get current NDX price and levels."""
    ticker = yf.Ticker('^NDX')
    hist = ticker.history(period="5d")
    
    if hist.empty:
        return None
    
    latest = hist.iloc[-1]
    high_5d = hist['High'].max()
    low_5d = hist['Low'].min()
    
    return {
        'price': round(latest['Close'], 2),
        'high': round(latest['High'], 2),
        'low': round(latest['Low'], 2),
        'high_5d': round(high_5d, 2),
        'low_5d': round(low_5d, 2),
        'volume': int(latest['Volume']),
        'timestamp': datetime.utcnow().isoformat()
    }

def is_in_killzone():
    """Check if current time is in Kill Zone."""
    config = load_config()
    now = datetime.utcnow()
    current_hour = now.hour
    
    zones = config['kill_zones']
    
    # Parse hours
    london_start = int(zones['london']['start'].split(':')[0])
    london_end = int(zones['london']['end'].split(':')[0])
    ny_start = int(zones['ny']['start'].split(':')[0])
    ny_end = int(zones['ny']['end'].split(':')[0])
    
    in_london = london_start <= current_hour < london_end
    in_ny = ny_start <= current_hour < ny_end
    
    return in_london or in_ny

def detect_setup(data):
    """Simple setup detection - price near high/low."""
    config = load_config()
    threshold = config['detection']['near_high_low_threshold']
    
    price = data['price']
    high = data['high_5d']
    low = data['low_5d']
    range_size = high - low
    
    # Near 5-day high
    if (high - price) / range_size < threshold:
        return 'NEAR_HIGH'
    
    # Near 5-day low
    if (price - low) / range_size < threshold:
        return 'NEAR_LOW'
    
    return 'NONE'

def send_to_decision_engine(signal):
    """Send signal to decision engine."""
    config = load_config()
    url = config['decision_engine']['url']
    
    try:
        resp = requests.post(url, json=signal, timeout=5)
        return resp.json()
    except Exception as e:
        print(f"Error sending to decision engine: {e}")
        return None

def main():
    print(f"[{datetime.utcnow().isoformat()}] 🔍 Checking NDX...")
    
    data = get_ndx_price()
    if not data:
        print("❌ Failed to get price")
        return
    
    print(f"   Price: {data['price']} | High: {data['high_5d']} | Low: {data['low_5d']}")
    
    # Check kill zone
    in_killzone = is_in_killzone()
    print(f"   Kill Zone: {'✅ YES' if in_killzone else '❌ NO'}")
    
    # Detect setup
    setup = detect_setup(data)
    print(f"   Setup: {setup}")
    
    if not in_killzone:
        print("   ⏭️ Skipping - not in kill zone")
        # Still send signal with killzone=False for monitoring
        signal = {
            'timestamp': data['timestamp'],
            'symbol': 'NDX',
            'price': data['price'],
            'setup': setup,
            'killzone': False,
            'direction': 'NONE',
            'high_5d': data['high_5d'],
            'low_5d': data['low_5d']
        }
        result = send_to_decision_engine(signal)
        if result:
            print(f"   📡 Decision: {result.get('decision', 'UNKNOWN')}")
        return
    
    if setup == 'NONE':
        print("   ⏭️ Skipping - no setup detected")
        return
    
    # Determine direction based on setup
    direction = 'NONE'
    if setup == 'NEAR_HIGH':
        direction = 'SHORT'
    elif setup == 'NEAR_LOW':
        direction = 'LONG'
    
    # Build signal
    signal = {
        'timestamp': data['timestamp'],
        'symbol': 'NDX',
        'price': data['price'],
        'setup': setup,
        'direction': direction,
        'killzone': in_killzone,
        'high_5d': data['high_5d'],
        'low_5d': data['low_5d'],
        'rr': 2.0,  # Default
        'confidence': 0.75  # Default
    }
    
    # Send to decision engine
    result = send_to_decision_engine(signal)
    if result:
        print(f"   📡 Decision: {result.get('decision', 'UNKNOWN')}")
    else:
        print("   ⚠️ Decision engine unavailable")

if __name__ == "__main__":
    main()
