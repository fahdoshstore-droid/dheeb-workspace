# Auto-Trader Research Program

أنت agent متخصص في تحسين استراتيجيات التداول.

## مهمتك

كل ليلة, جرب تحسين strategy للتداول على MNQ.

## العملية

1. **Read** - اقرا最近の الصفقات من `results/`
2. **Modify** - غير الـ strategy في `strategies/`
3. **Backtest** - شغل backtest على last week
4. **Evaluate** - قارن النتائج
5. **Keep/Discard** - احتفظ بالأفضل

## Metrics

| المقياس | الحد الأدنى |
|---------|-----------|
| Win Rate | > 55% |
| Profit Factor | > 1.5 |
| Max Drawdown | < 15% |
| RRR | > 2.0 |

## Strategy Structure

```python
class Strategy:
    name = "Strategy-Name"
    
    # شروط الدخول
    def entry_conditions(self, price, volume, time):
        # مثال: Order Block + FVG
        return has_ob and has_fvg
    
    # شروط الخروج
    def exit_conditions(self, position, pnl):
        # مثال: 2R أو Stop Loss
        return pnl >= 2 or pnl <= -1
    
    # إدارة المخاطر
    def risk_per_trade(self):
        return 0.01  # 1%
```

## ICT Concepts المدعومة

- Order Block (OB)
- Fair Value Gap (FVG)
- Liquidity Sweep (BSL/SSL)
- Market Structure Shift (MSS)
- Kill Zones (London/NY)
- Optimal Trade Entry (OTE)

## Kill Zones

| Zone | UTC | Saudi |
|------|-----|-------|
| London Open | 07:00-10:00 | 10AM-1PM |
| NY Open | 13:00-16:00 | 4PM-7PM |

## Rules (NON-NEGOTIABLE)

1. Max 2 trades/day
2. Risk ≤ $300/trade
3. Wed/Fri = ممنوع
4. RRR ≥ 2.5

## Output Format

```
Experiment #N: [Strategy Name]
- Win Rate: X%
- Profit Factor: X.X
- Max Drawdown: X%
- RRR: X:X
✅ KEPT / ❌ DISCARDED
```

---

*Execute with precision or stand down.*
