#!/usr/bin/env python3
"""NDX Price Fetcher - Fetch current Nasdaq 100 price and key levels."""

import yfinance as yf


def get_ndx_price(symbol="^NDX"):
    """Fetch current NDX price and key levels."""
    ticker = yf.Ticker(symbol)
    info = ticker.info
    
    # Try to get data, fallback to history if info is empty
    if not info or 'currentPrice' not in info:
        hist = ticker.history(period="5d")
        if hist.empty:
            return None
        
        latest = hist.iloc[-1]
        return {
            "symbol": symbol,
            "price": round(latest['Close'], 2),
            "open": round(latest['Open'], 2),
            "high": round(latest['High'], 2),
            "low": round(latest['Low'], 2),
            "volume": int(latest['Volume']),
        }
    
    return {
        "symbol": symbol,
        "price": info.get('currentPrice', info.get('regularMarketPrice', 'N/A')),
        "open": info.get('open', 'N/A'),
        "high": info.get('dayHigh', info.get('regularMarketDayHigh', 'N/A')),
        "low": info.get('dayLow', info.get('regularMarketDayLow', 'N/A')),
        "volume": info.get('volume', info.get('regularMarketVolume', 'N/A')),
    }


def get_nq_price():
    """Fetch current NQ (E-mini Nasdaq 100) futures price."""
    # NQ futures on CME
    return get_ndx_price("NQ=F")


def main():
    print("=== NDX (Nasdaq 100) ===")
    ndx = get_ndx_price()
    if ndx:
        print(f"Price:  {ndx['price']}")
        print(f"Open:   {ndx['open']}")
        print(f"High:   {ndx['high']}")
        print(f"Low:    {ndx['low']}")
        print(f"Volume: {ndx['volume']:,}")
    
    print("\n=== NQ (Nasdaq Futures) ===")
    nq = get_nq_price()
    if nq:
        print(f"Price:  {nq['price']}")
        print(f"Open:   {nq['open']}")
        print(f"High:   {nq['high']}")
        print(f"Low:    {nq['low']}")


if __name__ == "__main__":
    main()
