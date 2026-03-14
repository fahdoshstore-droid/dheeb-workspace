#!/usr/bin/env python3
"""
Auto-Trader Backtest Engine
اختبار الاستراتيجيات على بيانات تاريخية
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class Trade:
    def __init__(self, entry, exit, pnl, rrr, direction):
        self.entry = entry
        self.exit = exit
        self.pnl = pnl
        self.rrr = rrr
        self.direction = direction
        self.timestamp = datetime.now()

class BacktestResult:
    def __init__(self, strategy_name: str, trades: List[Trade]):
        self.strategy_name = strategy_name
        self.trades = trades
        
    @property
    def win_rate(self) -> float:
        if not self.trades:
            return 0
        wins = sum(1 for t in self.trades if t.pnl > 0)
        return (wins / len(self.trades)) * 100
    
    @property
    def profit_factor(self) -> float:
        gross_profit = sum(t.pnl for t in self.trades if t.pnl > 0)
        gross_loss = abs(sum(t.pnl for t in self.trades if t.pnl < 0))
        if gross_loss == 0:
            return float('inf') if gross_profit > 0 else 0
        return gross_profit / gross_loss
    
    @property
    def max_drawdown(self) -> float:
        equity = 10000
        peak = equity
        max_dd = 0
        for trade in self.trades:
            equity += trade.pnl
            if equity > peak:
                peak = equity
            dd = (peak - equity) / peak * 100
            if dd > max_dd:
                max_dd = dd
        return max_dd
    
    @property
    def avg_rrr(self) -> float:
        rrrs = [t.rrr for t in self.trades if t.rrr > 0]
        return sum(rrrs) / len(rrrs) if rrrs else 0
    
    def to_dict(self) -> dict:
        return {
            "strategy": self.strategy_name,
            "total_trades": len(self.trades),
            "win_rate": round(self.win_rate, 1),
            "profit_factor": round(self.profit_factor, 2),
            "max_drawdown": round(self.max_drawdown, 1),
            "avg_rrr": round(self.avg_rrr, 2)
        }

class Strategy:
    """Base Strategy - يورث ويعدل"""
    
    name = "Base-ICT"
    
    def __init__(self):
        self.position = None
        self.entry_price = 0
        self.stop_loss = 0
        self.take_profit = 0
    
    def on_bar(self, bar) -> Optional[str]:
        """Return: BUY, SELL, CLOSE, HOLD"""
        return "HOLD"
    
    def should_entry(self, bar) -> bool:
        """شروط الدخول - ي Overriden من Strategy الجديد"""
        return False
    
    def should_exit(self, bar) -> bool:
        """شروط الخروج - ي Overriden من Strategy الجديد"""
        return False
    
    def calculate_risk(self, entry, sl):
        """حساب المخاطرة"""
        return abs(entry - sl)

class ICTStrategy(Strategy):
    """ICT Strategy - مثال"""
    
    name = "ICT-OB-FVG"
    risk_per_trade = 0.01  # 1%
    
    def __init__(self):
        super().__init__()
        self.order_blocks = []
        self.fvgs = []
    
    def should_entry(self, bar) -> bool:
        # مثال: دخول عند OB + FVG
        has_ob = self.detect_order_block(bar)
        has_fvg = self.detect_fvg(bar)
        in_kill_zone = self.in_kill_zone(bar)
        return has_ob and has_fvg and in_kill_zone
    
    def should_exit(self, bar) -> bool:
        if not self.position:
            return False
        # Exit at 2R or SL
        pnl_pct = (bar.close - self.entry_price) / self.entry_price * 100
        return pnl_pct >= 2 * self.risk or pnl_pct <= -self.risk
    
    def detect_order_block(self, bar) -> bool:
        # منطق detection الـ Order Block
        return False  # يطور من قبل الـ Agent
    
    def detect_fvg(self, bar) -> bool:
        # منطق detection الـ FVG
        return False
    
    def in_kill_zone(self, bar) -> bool:
        hour = bar.datetime.hour
        # London: 7-10 UTC, NY: 13-16 UTC
        return (7 <= hour < 10) or (13 <= hour < 16)

def run_backtest(strategy: Strategy, data: List[dict]) -> BacktestResult:
    """تشغيل backtest على بيانات"""
    
    trades = []
    position = None
    
    for bar in data:
        # Check exit
        if position and strategy.should_exit(bar):
            pnl = (bar.close - position.entry) * position.size
            rrr = abs(pnl / position.risk) if position.risk else 0
            trades.append(Trade(position.entry, bar.close, pnl, rrr, position.direction))
            position = None
        
        # Check entry
        if not position and strategy.should_entry(bar):
            entry = bar.close
            sl = entry * 0.01  # 1% SL
            risk = abs(entry - sl)
            position = type('Position', (), {
                'entry': entry,
                'stop_loss': sl,
                'size': strategy.risk_per_trade * 10000 / risk,
                'risk': risk,
                'direction': 'LONG'
            })()
    
    return BacktestResult(strategy.name, trades)

def save_result(result: BacktestResult):
    """حفظ النتيجة"""
    os.makedirs("results", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"results/{result.strategy_name}_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump(result.to_dict(), f, indent=2)
    
    return filename

# Test
if __name__ == "__main__":
    print("🧪 Auto-Trader Backtest Engine")
    print("=" * 40)
    
    # Dummy data test
    strategy = ICTStrategy()
    print(f"Strategy: {strategy.name}")
    print(f"Risk: {strategy.risk_per_trade * 100}%")
    print("✅ Ready for research!")
