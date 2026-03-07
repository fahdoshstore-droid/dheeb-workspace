"""
ICT Strategy Backtest - NDX
Entry: Price > SMA20 + RSI < 70 + Bullish FVG nearby
Exit: TP = 2R or SL = 1R
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configuration
SYMBOL = "GC=F"  # Gold
PERIOD = "1y"
RISK_PER_TRADE = 0.02  # 2% risk per trade
R_MULTIPLIER = 2  # TP at 2R

def calculate_sma(series, period):
    return series.rolling(window=period).mean()

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def find_fvgs(df):
    """Find Fair Value Gaps (bullish and bearish)"""
    fvgs = []
    for i in range(2, len(df)):
        # Bullish FVG: candle i-2 low > candle i-1 high (gap up)
        # Or: candle i-2 candle body top < candle i-1 candle body bottom with gap
        prev_low = df['Low'].iloc[i-2]
        prev_high = df['High'].iloc[i-2]
        curr_low = df['Low'].iloc[i-1]
        curr_high = df['High'].iloc[i-1]
        
        # Check for bullish FVG (gap between candles)
        if prev_low > curr_high:  # Gap up
            fvgs.append({
                'index': i-2,
                'type': 'bullish',
                'top': prev_low,
                'bottom': curr_high
            })
        elif prev_high < curr_low:  # Gap down
            fvgs.append({
                'index': i-2,
                'type': 'bearish',
                'top': curr_low,
                'bottom': prev_high
            })
    return fvgs

def find_bullish_fvg_nearby(df, current_idx, lookback=5):
    """Find bullish FVG within lookback candles before current candle"""
    for i in range(max(0, current_idx - lookback), current_idx):
        if i + 2 < len(df):
            # Bullish FVG: gap between candle i+2 low and candle i+1 high
            if df['Low'].iloc[i+2] > df['High'].iloc[i+1]:
                return True
    return False

def run_backtest():
    print(f"Fetching {SYMBOL} data for {PERIOD}...")
    
    # Download data
    data = yf.download(SYMBOL, period=PERIOD, progress=False)
    
    if data.empty:
        print("No data downloaded!")
        return
    
    # Flatten column index if MultiIndex
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)
    
    print(f"Downloaded {len(data)} candles")
    
    # Calculate indicators
    data['SMA20'] = calculate_sma(data['Close'], 20)
    data['RSI'] = calculate_rsi(data['Close'], 14)
    
    # Find FVGs
    data['Bullish_FVG'] = data.index.to_series().apply(
        lambda x: find_bullish_fvg_nearby(data, x.name if hasattr(x, 'name') else data.index.get_loc(x), lookback=5)
    )
    
    # Backtest simulation
    trades = []
    position = None
    
    for i in range(30, len(data) - 1):  # Start after SMA stabilizes
        row = data.iloc[i]
        next_row = data.iloc[i + 1]
        
        # Skip if any indicator is NaN
        if pd.isna(row['SMA20']) or pd.isna(row['RSI']):
            continue
        
        # Entry conditions
        entry_conditions = (
            row['Close'] > row['SMA20'] and  # Price above SMA20
            row['RSI'] < 70 and               # RSI not overbought
            row['Bullish_FVG']                # Bullish FVG nearby
        )
        
        # Entry signal - enter on next candle open
        if entry_conditions and position is None:
            entry_price = next_row['Open']
            
            # Calculate stop loss (1R = 2% below entry by default)
            sl = entry_price * (1 - RISK_PER_TRADE)
            tp = entry_price * (1 + RISK_PER_TRADE * R_MULTIPLIER)
            
            position = {
                'entry_date': data.index[i + 1],
                'entry_price': entry_price,
                'sl': sl,
                'tp': tp,
                'risk': entry_price - sl
            }
        
        # Check exit conditions
        if position is not None:
            # Check SL hit
            if next_row['Low'] <= position['sl']:
                exit_price = position['sl']
                pnl = -(position['entry_price'] - position['sl'])
                trades.append({
                    'entry_date': position['entry_date'],
                    'entry_price': position['entry_price'],
                    'exit_date': data.index[i + 1],
                    'exit_price': exit_price,
                    'pnl': pnl,
                    'pnl_r': -1,
                    'result': 'SL'
                })
                position = None
            
            # Check TP hit
            elif next_row['High'] >= position['tp']:
                exit_price = position['tp']
                pnl = exit_price - position['entry_price']
                trades.append({
                    'entry_date': position['entry_date'],
                    'entry_price': position['entry_price'],
                    'exit_date': data.index[i + 1],
                    'exit_price': exit_price,
                    'pnl': pnl,
                    'pnl_r': R_MULTIPLIER,
                    'result': 'TP'
                })
                position = None
    
    # Calculate statistics
    if not trades:
        print("\nNo trades generated!")
        return
    
    trades_df = pd.DataFrame(trades)
    
    total_trades = len(trades_df)
    winning_trades = len(trades_df[trades_df['pnl'] > 0])
    losing_trades = len(trades_df[trades_df['pnl'] <= 0])
    
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    # Total return (sum of R)
    total_return_r = trades_df['pnl_r'].sum()
    
    # Max drawdown
    cumulative = trades_df['pnl_r'].cumsum()
    running_max = cumulative.cummax()
    drawdown = running_max - cumulative
    max_drawdown_r = drawdown.max()
    
    # Results
    print("\n" + "="*50)
    print("ICT STRATEGY BACKTEST RESULTS")
    print("="*50)
    print(f"Symbol: {SYMBOL}")
    print(f"Period: {PERIOD}")
    print(f"Total Trades: {total_trades}")
    print(f"Winning Trades: {winning_trades}")
    print(f"Losing Trades: {losing_trades}")
    print(f"Win Rate: {win_rate:.2f}%")
    print(f"Total Return: {total_return_r:.2f}R")
    print(f"Max Drawdown: {max_drawdown_r:.2f}R")
    print("="*50)
    
    # Save trades to CSV
    trades_df.to_csv('ict_trades.csv', index=False)
    print(f"\nTrades saved to ict_trades.csv")
    
    return trades_df

if __name__ == "__main__":
    run_backtest()
