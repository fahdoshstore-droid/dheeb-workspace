#!/usr/bin/env python3
"""
Dheeb MVP - Heartbeat with Real ICT Detection
FVG, Order Blocks, Trend, RSI
"""

import yfinance as yf
import pandas as pd
import json
import requests
from datetime import datetime
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def get_ohlc_data(symbol="^NDX", period="3mo"):
    """Fetch OHLC data with indicators."""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    
    if df.empty:
        return None
    
    # Calculate SMAs
    df['SMA20'] = df['Close'].rolling(window=20).mean()
    df['SMA50'] = df['Close'].rolling(window=50).mean()
    
    # Calculate RSI
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    return df

def detect_fvg(df, lookback=10):
    """Detect Fair Value Gaps."""
    fvgs = []
    
    for i in range(lookback, len(df) - 1):
        # Bullish FVG: prev high < current low
        if df.iloc[i-1]['High'] < df.iloc[i+1]['Low']:
            fvgs.append({
                'type': 'bullish',
                'top': df.iloc[i+1]['Low'],
                'bottom': df.iloc[i-1]['High'],
                'size': round(df.iloc[i+1]['Low'] - df.iloc[i-1]['High'], 2)
            })
        
        # Bearish FVG: prev low > current high
        if df.iloc[i-1]['Low'] > df.iloc[i+1]['High']:
            fvgs.append({
                'type': 'bearish',
                'top': df.iloc[i-1]['Low'],
                'bottom': df.iloc[i+1]['High'],
                'size': round(df.iloc[i-1]['Low'] - df.iloc[i+1]['High'], 2)
            })
    
    return fvgs[-5:] if fvgs else []

def detect_order_blocks(df, lookback=20):
    """Detect Order Blocks."""
    blocks = []
    
    for i in range(lookback, len(df) - 5):
        future_move = (df.iloc[i+5]['Close'] - df.iloc[i]['Close']) / df.iloc[i]['Close']
        
        # Bullish OB: before bullish move
        if future_move > 0.02:
            zone_low = df.iloc[i-3:i]['Low'].min()
            blocks.append({
                'type': 'bullish',
                'zone_low': round(zone_low, 2),
                'date': str(df.index[i].date())
            })
        
        # Bearish OB: before bearish move
        elif future_move < -0.02:
            zone_high = df.iloc[i-3:i]['High'].max()
            blocks.append({
                'type': 'bearish',
                'zone_high': round(zone_high, 2),
                'date': str(df.index[i].date())
            })
    
    return blocks[-5:] if blocks else []

def get_multi_timeframe_analysis(symbol="^NDX"):
    """Analyze multiple timeframes for better confidence."""
    timeframes = {
        '1H': '1h',
        '4H': '4h', 
        '1D': '1d'
    }
    
    results = {}
    confirmations = 0
    
    for name, tf in timeframes.items():
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period="3mo", interval=tf)
            
            if df.empty or len(df) < 20:
                results[name] = {'status': 'no_data'}
                continue
            
            # Get latest data
            latest = df.iloc[-1]
            price = latest['Close']
            
            # Calculate indicators
            sma20 = df['Close'].rolling(20).mean().iloc[-1]
            sma50 = df['Close'].rolling(50).mean().iloc[-1] if len(df) > 50 else sma20
            
            # RSI
            delta = df['Close'].diff()
            gain = delta.where(delta > 0, 0).rolling(14).mean().iloc[-1]
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean().iloc[-1]
            rs = gain / loss if loss != 0 else 50
            rsi = 100 - (100 / (1 + rs))
            
            # Trend direction
            if price > sma20 > sma50:
                trend = 'BULLISH'
                confirmations += 1
            elif price < sma20 < sma50:
                trend = 'BEARISH'
                confirmations += 1
            else:
                trend = 'NEUTRAL'
            
            results[name] = {
                'price': round(price, 2),
                'trend': trend,
                'rsi': round(rsi, 1),
                'sma20': round(sma20, 2)
            }
        except Exception as e:
            results[name] = {'error': str(e)}
    
    # Calculate confidence based on confirmations
    base_confidence = 0.5
    confirmation_bonus = (confirmations / 3) * 0.35  # Max +35%
    
    # Check RSI conditions
    latest_rsi = results.get('1H', {}).get('rsi', 50)
    if 35 < latest_rsi < 65:
        rsi_bonus = 0.15  # Sweet spot
    else:
        rsi_bonus = 0
    
    final_confidence = min(base_confidence + confirmation_bonus + rsi_bonus, 0.95)
    
    return {
        'timeframes': results,
        'confirmations': confirmations,
        'confidence': round(final_confidence, 2)
    }

def find_ict_setup(df, mtf_data):
    """Find valid ICT setups with MTF confirmation."""
    # Use MTF data for trend
    trend = mtf_data['timeframes'].get('1H', {})
    trend_direction = trend.get('trend', 'NEUTRAL')
    rsi = trend.get('rsi', 50)
    
    # Fallback to df analysis if no mtf
    if trend_direction == 'NEUTRAL':
        latest = df.iloc[-1]
        price = latest['Close']
        sma20 = latest['SMA20']
        sma50 = latest['SMA50']
        if price > sma20 > sma50:
            trend_direction = 'BULLISH'
        elif price < sma20 < sma50:
            trend_direction = 'BEARISH'
        rsi = latest['RSI']
    
    fvgs = detect_fvg(df)
    obs = detect_order_blocks(df)
    
    latest = df.iloc[-1]
    price = latest['Close']
    setups = []
    
    # Bullish setups in bullish trend
    if trend_direction == 'BULLISH':
        for fvg in reversed(fvgs):
            if fvg['type'] == 'bullish' and fvg['top'] < price:
                if (price - fvg['top']) / price < 0.02:
                    setups.append({
                        'name': 'Bullish FVG',
                        'type': 'bullish',
                        'zone': f"{fvg['top']:.0f}-{fvg['bottom']:.0f}",
                        'action': 'LONG'
                    })
                    break
        
        for ob in reversed(obs):
            if ob['type'] == 'bullish':
                if abs(price - ob['zone_low']) / price < 0.015:
                    setups.append({
                        'name': 'Bullish OB',
                        'type': 'bullish',
                        'zone': f"{ob['zone_low']:.0f}",
                        'action': 'LONG'
                    })
                    break
    
    # Bearish setups in bearish trend
    if trend_direction == 'BEARISH':
        for fvg in reversed(fvgs):
            if fvg['type'] == 'bearish' and fvg['bottom'] > price:
                if (fvg['bottom'] - price) / price < 0.02:
                    setups.append({
                        'name': 'Bearish FVG',
                        'type': 'bearish',
                        'zone': f"{fvg['bottom']:.0f}-{fvg['top']:.0f}",
                        'action': 'SHORT'
                    })
                    break
        
        for ob in reversed(obs):
            if ob['type'] == 'bearish':
                if abs(price - ob['zone_high']) / price < 0.015:
                    setups.append({
                        'name': 'Bearish OB',
                        'type': 'bearish',
                        'zone': f"{ob['zone_high']:.0f}",
                        'action': 'SHORT'
                    })
                    break
    
    return {
        'trend': trend_direction,
        'rsi': rsi,
        'setups': setups,
        'fvg_count': len(fvgs),
        'ob_count': len(obs),
        'confidence': mtf_data.get('confidence', 0.5)
    }

def is_in_killzone():
    """Check if in kill zone."""
    now = datetime.utcnow()
    hour = now.hour
    
    # London: 8-11 UTC
    # NY: 14-21 UTC
    in_london = 8 <= hour < 11
    in_ny = 14 <= hour < 21
    
    return in_london or in_ny

def send_to_decision_engine(signal):
    """Send to decision engine."""
    config = load_config()
    url = config['decision_engine']['url']
    
    try:
        resp = requests.post(url, json=signal, timeout=5)
        return resp.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print(f"[{datetime.now().isoformat()}] 🔍 ICT Multi-Timeframe Analysis...")
    
    df = get_ohlc_data()
    if df is None:
        print("❌ Failed to get data")
        return
    
    # Get multi-timeframe analysis
    mtf_data = get_multi_timeframe_analysis()
    print(f"   MTF Confirmations: {mtf_data['confirmations']}/3 | Conf: {mtf_data['confidence']}")
    
    result = find_ict_setup(df, mtf_data)
    trend = {'trend': result['trend'], 'rsi': result['rsi']}
    
    print(f"   Price: {df.iloc[-1]['Close']:.0f} | Trend: {result['trend']}")
    print(f"   RSI: {result['rsi']} | FVG: {result['fvg_count']} | OB: {result['ob_count']}")
    
    in_killzone = is_in_killzone()
    print(f"   Kill Zone: {'✅ YES' if in_killzone else '❌ NO'}")
    
    if result['setups']:
        for s in result['setups']:
            print(f"   🎯 {s['name']}: {s['action']} @ {s['zone']}")
    else:
        print("   ⏭️ No clear setup")
    
    # Build signal with MTF confidence
    signal = {
        'timestamp': datetime.now().isoformat(),
        'symbol': 'NDX',
        'price': round(df.iloc[-1]['Close'], 2),
        'trend': result['trend'],
        'rsi': result['rsi'],
        'mtf_confirmations': mtf_data['confirmations'],
        'killzone': in_killzone,
        'setups': result['setups'],
        'fvg_count': result['fvg_count'],
        'ob_count': result['ob_count']
    }
    
    # Add setup info if exists
    if result['setups']:
        primary = result['setups'][0]
        signal['direction'] = primary['action']
        signal['setup_name'] = primary['name']
        
        # Use MTF confidence + setup bonus
        setup_bonus = 0.1 if len(result['setups']) >= 2 else 0
        signal['confidence'] = min(mtf_data['confidence'] + setup_bonus, 0.95)
        signal['rr'] = 2.5
        
        # Calculate SL based on setup
        if primary['action'] == 'SHORT':
            zone_val = float(primary['zone'].split('-')[0]) if '-' in primary['zone'] else float(primary['zone'])
            signal['sl'] = zone_val * 1.01
        else:
            zone_val = float(primary['zone'].split('-')[0]) if '-' in primary['zone'] else float(primary['zone'])
            signal['sl'] = zone_val * 0.99
    else:
        signal['direction'] = 'NONE'
        signal['setup_name'] = 'NONE'
        signal['confidence'] = mtf_data['confidence']
        signal['rr'] = 0
        signal['sl'] = df.iloc[-1]['Close'] * 0.99
    
    # Send to decision engine
    decision = send_to_decision_engine(signal)
    if decision:
        print(f"   📡 Decision: {decision.get('decision', 'UNKNOWN')}")
    else:
        print(f"   ⚠️ Decision engine unavailable")

if __name__ == "__main__":
    main()
