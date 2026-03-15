#!/usr/bin/env python3
"""
ICT + A-PLUS SETUP Backtest
Combines ICT concepts with A-PLUS scoring system
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configuration
SYMBOL = "^NDX"
PERIOD = "1y"
RISK_PER_TRADE = 0.02
R_MULTIPLIER = 2
POSITION_SIZE = 1  # 1R risk

def get_data():
    """Fetch OHLC data"""
    ticker = yf.Ticker(SYMBOL)
    df = ticker.history(period=PERIOD)
    return df

def calculate_indicators(df):
    """Calculate all indicators"""
    # SMAs
    df['SMA20'] = df['Close'].rolling(20).mean()
    df['SMA50'] = df['Close'].rolling(50).mean()
    df['SMA200'] = df['Close'].rolling(200).mean()
    
    # RSI
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    return df

def detect_fvg(df, i):
    """Detect FVG"""
    if i < 2:
        return None
    
    current = df.iloc[i]
    prev1 = df.iloc[i-1]
    prev2 = df.iloc[i-2]
    
    # Bullish FVG: prev1 low > current high
    if prev1['Low'] > current['High']:
        return 'bullish'
    # Bearish FVG: prev1 high < current low
    elif prev1['High'] < current['Low']:
        return 'bearish'
    
    return None

def detect_order_block(df, i):
    """Detect recent order block"""
    if i < 5:
        return None
    
    # Look for green candle followed by 2+ red candles
    if df.iloc[i]['Close'] > df.iloc[i]['Open']:  # Green
        # Check next 2 candles are red
        if i+2 < len(df):
            if df.iloc[i+1]['Close'] < df.iloc[i+1]['Open']:
                return 'bullish'
    
    return None

def calculate_score(df, i):
    """Calculate A-PLUS score (0-10)"""
    score = 0
    current = df.iloc[i]
    
    # 1. Kill Zone (simplified - use trading hours)
    hour = current.name.hour if hasattr(current.name, 'hour') else 12
    if 13 <= hour <= 16:  # NY session
        score += 1
    
    # 2. Macro Time (simplified)
    minute = current.name.minute if hasattr(current.name, 'minute') else 30
    if 50 <= minute or minute <= 10:
        score += 1
    
    # 3. HTF Trend
    if current['Close'] > current['SMA20']:
        score += 1
    
    # 4. Liquidity Sweep (simplified - price near high)
    if current['Close'] > current['SMA50']:
        score += 1
    
    # 5. FVG
    fvg = detect_fvg(df, i)
    if fvg == 'bullish':
        score += 1
    
    # 6. Order Block
    ob = detect_order_block(df, i)
    if ob == 'bullish':
        score += 1
    
    # 7. MSS (Momentum Shift) - price above SMA20 + RSI rising
    if current['Close'] > current['SMA20'] and current['RSI'] > 40:
        score += 1
    
    # 8. OTE (simplified - in retracement zone)
    high = df.iloc[max(0,i-20):i]['High'].max()
    low = df.iloc[max(0,i-20):i]['Low'].min()
    range_size = high - low
    distance_from_low = current['Close'] - low
    if 0.3 < distance_from_low / range_size < 0.7:
        score += 1
    
    # 9. RRR (always 2R in this backtest)
    score += 1
    
    # 10. Psychology (simplified - no consecutive losses)
    score += 1
    
    return score

def run_backtest():
    print(f"Fetching {SYMBOL} data for {PERIOD}...")
    df = get_data()
    
    if df.empty:
        print("No data downloaded!")
        return
    
    print(f"Downloaded {len(df)} candles")
    
    df = calculate_indicators(df)
    
    trades = []
    position = None
    consecutive_losses = 0
    
    for i in range(50, len(df) - 5):
        score = calculate_score(df, i)
        
        # Entry signal: A+ setup (score >= 7)
        if score >= 8 and position is None:
            entry_price = df.iloc[i]['Close']
            # Stop loss at 1R
            sl = entry_price * 0.98
            # Take profit at 2R
            tp = entry_price * 1.04
            
            position = {
                'entry': entry_price,
                'sl': sl,
                'tp': tp,
                'date': df.index[i],
                'score': score
            }
        
        # Exit signal
        elif position is not None:
            current_price = df.iloc[i]['Close']
            current_low = df.iloc[i]['Low']
            
            # Hit TP
            if current_price >= position['tp']:
                trades.append({
                    'date': position['date'],
                    'exit_date': df.index[i],
                    'entry': position['entry'],
                    'exit': current_price,
                    'result': 'WIN',
                    'score': position['score']
                })
                position = None
                consecutive_losses = 0
            
            # Hit SL
            elif current_low <= position['sl']:
                trades.append({
                    'date': position['date'],
                    'exit_date': df.index[i],
                    'entry': position['entry'],
                    'exit': position['sl'],
                    'result': 'LOSS',
                    'score': position['score']
                })
                position = None
                consecutive_losses += 1
    
    # Results
    print("\n" + "="*50)
    print("ICT + A-PLUS BACKTEST RESULTS")
    print("="*50)
    print(f"Symbol: {SYMBOL}")
    print(f"Period: {PERIOD}")
    print(f"Total Trades: {len(trades)}")
    
    if trades:
        wins = sum(1 for t in trades if t['result'] == 'WIN')
        losses = len(trades) - wins
        win_rate = (wins / len(trades)) * 100
        
        total_r = sum(2 if t['result'] == 'WIN' else -1 for t in trades)
        
        print(f"Winning Trades: {wins}")
        print(f"Losing Trades: {losses}")
        print(f"Win Rate: {win_rate:.2f}%")
        print(f"Total Return: {total_r:.2f}R")
        
        # Score distribution
        scores = [t['score'] for t in trades]
        print(f"\nScore Distribution:")
        print(f"  Avg Score: {np.mean(scores):.1f}")
        print(f"  Max Score: {max(scores)}")
        print(f"  Min Score: {min(scores)}")
        
        # A+ trades (score 10)
        a_plus = sum(1 for t in trades if t['score'] >= 10)
        print(f"\nA+ Setups (10/10): {a_plus}")
        
    print("="*50)

if __name__ == "__main__":
    run_backtest()
