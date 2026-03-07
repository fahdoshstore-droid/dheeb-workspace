#!/usr/bin/env python3
"""ICT Setup Detector - Enhanced with FVG, Order Blocks, RSI, and Trend Classification."""

import yfinance as yf
import pandas as pd


def get_ohlc_data(symbol="^NDX", period="3mo"):
    """Fetch OHLC data with additional indicators."""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    
    if df.empty:
        return None
    
    # Calculate SMAs
    df['SMA20'] = df['Close'].rolling(window=20).mean()
    df['SMA50'] = df['Close'].rolling(window=50).mean()
    df['SMA200'] = df['Close'].rolling(window=200).mean()
    
    # Calculate RSI (14-period)
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    return df


def detect_fvg(df, lookback=5):
    """Detect Fair Value Gaps (FVG).
    
    Bullish FVG: Previous candle's high < Current candle's low (gap up)
    Bearish FVG: Previous candle's low > Current candle's high (gap down)
    
    Returns list of FVGs with their positions and prices.
    """
    fvgs = []
    
    for i in range(lookback, len(df) - 1):
        # Bullish FVG: middle candle high < previous candle low
        prev_low = df.iloc[i-1]['Low']
        curr_high = df.iloc[i+1]['High']
        mid_high = df.iloc[i]['High']
        mid_low = df.iloc[i]['Low']
        
        # Bullish FVG: prev high < current low (gap up)
        if df.iloc[i-1]['High'] < df.iloc[i+1]['Low']:
            fvg_range = (df.iloc[i+1]['Low'], df.iloc[i-1]['High'])
            fvgs.append({
                'type': 'bullish',
                'index': i,
                'top': fvg_range[0],
                'bottom': fvg_range[1],
                'size': round(fvg_range[0] - fvg_range[1], 2),
                'date': df.index[i].date()
            })
        
        # Bearish FVG: prev low > current high (gap down)
        if df.iloc[i-1]['Low'] > df.iloc[i+1]['High']:
            fvg_range = (df.iloc[i-1]['Low'], df.iloc[i+1]['High'])
            fvgs.append({
                'type': 'bearish',
                'index': i,
                'top': fvg_range[0],
                'bottom': fvg_range[1],
                'size': round(fvg_range[0] - fvg_range[1], 2),
                'date': df.index[i].date()
            })
    
    return fvgs[-10:]  # Return last 10 FVGs


def detect_order_blocks(df, lookback=20):
    """Detect Order Blocks (recent institutional activity).
    
    Order Block: The last candle(s) before a significant directional move.
    Bullish OB: Preceding a bullish impulse
    Bearish OB: Preceding a bearish impulse
    """
    blocks = []
    
    for i in range(lookback, len(df) - 5):
        # Look for significant moves (2%+ in either direction)
        future_move = (df.iloc[i+5]['Close'] - df.iloc[i]['Close']) / df.iloc[i]['Close']
        
        # Bullish Order Block: preceding a bullish move, look for support zone
        if future_move > 0.02:
            # Find the lowest low in the 3 candles before the move
            zone_low = df.iloc[i-3:i]['Low'].min()
            zone_high = df.iloc[i-3:i]['Close'].min()  # Close as resistance
            blocks.append({
                'type': 'bullish',
                'index': i,
                'zone_low': round(zone_low, 2),
                'zone_high': round(zone_high, 2),
                'date': df.index[i].date(),
                'projected_move': round(future_move * 100, 2)
            })
        
        # Bearish Order Block: preceding a bearish move
        elif future_move < -0.02:
            zone_high = df.iloc[i-3:i]['High'].max()
            zone_low = df.iloc[i-3:i]['Close'].max()
            blocks.append({
                'type': 'bearish',
                'index': i,
                'zone_low': round(zone_low, 2),
                'zone_high': round(zone_high, 2),
                'date': df.index[i].date(),
                'projected_move': round(future_move * 100, 2)
            })
    
    return blocks[-10:]  # Return last 10 order blocks


def classify_trend(df):
    """Classify trend using multiple timeframes and price action."""
    if len(df) < 50:
        return "insufficient_data"
    
    latest = df.iloc[-1]
    price = latest['Close']
    
    sma20 = latest['SMA20']
    sma50 = latest['SMA50']
    sma200 = latest.get('SMA200')
    if pd.isna(sma200):
        sma200 = sma50  # Fallback to SMA50 if no 200 SMA
    rsi = latest['RSI']
    
    # Determine short-term trend
    if price > sma20:
        short_term = "bullish"
    elif price < sma20:
        short_term = "bearish"
    else:
        short_term = "neutral"
    
    # Determine medium-term trend
    if price > sma50:
        mid_term = "bullish"
    elif price < sma50:
        mid_term = "bearish"
    else:
        mid_term = "neutral"
    
    # Determine long-term trend
    if price > sma200:
        long_term = "bullish"
    elif price < sma200:
        long_term = "bearish"
    else:
        long_term = "neutral"
    
    # RSI momentum
    if rsi > 70:
        rsi_status = "overbought"
    elif rsi < 30:
        rsi_status = "oversold"
    elif rsi > 50:
        rsi_status = "bullish_momentum"
    else:
        rsi_status = "bearish_momentum"
    
    # Overall trend assessment
    bullish_count = sum([short_term == "bullish", mid_term == "bullish", long_term == "bullish"])
    
    if bullish_count >= 2 and mid_term == "bullish":
        overall = "UPTREND"
    elif bullish_count <= 1 and mid_term == "bearish":
        overall = "DOWNTREND"
    else:
        overall = "CONSOLIDATION"
    
    return {
        'overall': overall,
        'short_term': short_term,
        'mid_term': mid_term,
        'long_term': long_term,
        'rsi': round(rsi, 1),
        'rsi_status': rsi_status,
        'price': round(price, 2),
        'sma20': round(sma20, 2),
        'sma50': round(sma50, 2),
        'sma200': round(sma200, 2) if sma200 != sma50 else None
    }


def detect_ict_setup(df):
    """Detect ICT setups based on confluence of indicators."""
    trend = classify_trend(df)
    fvgs = detect_fvg(df)
    obs = detect_order_blocks(df)
    
    latest = df.iloc[-1]
    price = latest['Close']
    rsi = latest['RSI']
    
    setups = []
    
    # Bullish setups
    if trend['overall'] == "UPTREND" or trend['mid_term'] == "bullish":
        # Check for bullish FVG near current price
        for fvg in reversed(fvgs):
            if fvg['type'] == 'bullish':
                # FVG below price (untested) - buy at discount
                if fvg['top'] < price and (price - fvg['top']) / price < 0.02:
                    setups.append({
                        'name': 'Bullish FVG',
                        'type': 'bullish',
                        'zone': f"Low: {fvg['top']:.2f}, High: {fvg['bottom']:.2f}",
                        'strength': 'high' if rsi < 40 else 'medium'
                    })
                    break
        
        # Check for bullish order block near price
        for ob in reversed(obs):
            if ob['type'] == 'bullish':
                if abs(price - ob['zone_low']) / price < 0.015:
                    setups.append({
                        'name': 'Bullish Order Block',
                        'type': 'bullish',
                        'zone': f"Low: {ob['zone_low']:.2f}",
                        'strength': 'high' if rsi < 35 else 'medium'
                    })
                    break
    
    # Bearish setups
    if trend['overall'] == "DOWNTREND" or trend['mid_term'] == "bearish":
        for fvg in reversed(fvgs):
            if fvg['type'] == 'bearish':
                if fvg['bottom'] > price and (fvg['bottom'] - price) / price < 0.02:
                    setups.append({
                        'name': 'Bearish FVG',
                        'type': 'bearish',
                        'zone': f"Low: {fvg['bottom']:.2f}, High: {fvg['top']:.2f}",
                        'strength': 'high' if rsi > 60 else 'medium'
                    })
                    break
        
        for ob in reversed(obs):
            if ob['type'] == 'bearish':
                if abs(price - ob['zone_high']) / price < 0.015:
                    setups.append({
                        'name': 'Bearish Order Block',
                        'type': 'bearish',
                        'zone': f"High: {ob['zone_high']:.2f}",
                        'strength': 'high' if rsi > 65 else 'medium'
                    })
                    break
    
    return {
        'trend': trend,
        'active_setups': setups,
        'recent_fvgs': fvgs[-3:],
        'recent_obs': obs[-3:]
    }


def main(symbol="^NDX"):
    """Main function to display ICT setup analysis."""
    print(f"Fetching {symbol} data...")
    df = get_ohlc_data(symbol)
    
    if df is None or df.empty:
        print("Failed to fetch data")
        return
    
    result = detect_ict_setup(df)
    trend = result['trend']
    
    print(f"\n{'='*50}")
    print(f"ICT SETUP DETECTOR - {symbol}")
    print(f"{'='*50}")
    
    # Trend Summary
    print(f"\n📊 TREND: {trend['overall']}")
    print(f"   Short: {trend['short_term'].upper()} | Mid: {trend['mid_term'].upper()} | Long: {trend['long_term'].upper()}")
    print(f"   Price: {trend['price']:,.2f}")
    print(f"   SMA20: {trend['sma20']:,.2f} | SMA50: {trend['sma50']:,.2f}" + 
          (f" | SMA200: {trend['sma200']:,.2f}" if trend['sma200'] else ""))
    
    # RSI
    print(f"\n📈 RSI(14): {trend['rsi']} - {trend['rsi_status'].replace('_', ' ').upper()}")
    
    # Active Setups
    print(f"\n🎯 ACTIVE SETUPS:")
    if result['active_setups']:
        for s in result['active_setups']:
            emoji = "🟢" if s['type'] == 'bullish' else "🔴"
            print(f"   {emoji} {s['name']} | Zone: {s['zone']} | Strength: {s['strength'].upper()}")
    else:
        print("   ⚪ No clear ICT setups - WAIT")
    
    # Recent FVGs
    print(f"\n📌 RECENT FVGs:")
    for fvg in result['recent_fvgs'][-3:]:
        emoji = "🟢" if fvg['type'] == 'bullish' else "🔴"
        print(f"   {emoji} {fvg['type'].upper()} | {fvg['date']} | Size: {fvg['size']:.2f}")
    
    # Recent Order Blocks
    print(f"\n📦 RECENT ORDER BLOCKS:")
    for ob in result['recent_obs'][-3:]:
        emoji = "🟢" if ob['type'] == 'bullish' else "🔴"
        print(f"   {emoji} {ob['type'].upper()} OB | {ob['date']} | Zone: {ob['zone_low']}-{ob['zone_high']:.2f}")
    
    print(f"\n{'='*50}")


if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else "^NDX"
    main(symbol)
