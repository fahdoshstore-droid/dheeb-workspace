# Auto-Trader: Research Agent for Trading

## الفكرة

Agent يتعلم من الصفقات بشكل تلقائي:
1. يجرب strategy جديدة
2. يختبر على بيانات تاريخية
3. يحتفظ بالأفضل
4. يكرر

---

## الملفات

```
auto-research/
├── program.md        # تعليمات الـ Agent
├── backtest.py       # اختبار على بيانات قديمة
├── strategies/       # الاستراتيجيات
├── results/         # نتائج التجارب
└── agent.sh         # تشغيل الـ Agent
```

---

## الـ Strategy Template

```python
# strategy.py - مثال
class Strategy:
    name = "ICT-OB-Sweep"
    
    def on_tick(self, tick):
        # شروط الدخول
        if self.detect_order_block():
            return "BUY"
        return "HOLD"
    
    def on_bar(self, bar):
        # شروط الخروج
        if self.hit_tp():
            return "CLOSE"
        return "HOLD"
```

---

## Metric للتقييم

| المقياس | الوصف |
|---------|-------|
| **Win Rate** | نسبة الصفقات الرابحة |
| **Profit Factor** | الربح / الخسارة |
| **Max Drawdown** | أكبر انخفاض |
| **RRR** | نسبة المخاطرة |

---

## تشغيل

```bash
./agent.sh
```

---

## Result

```
Experiment #1: ICT-OB-Sweep
- Win Rate: 65%
- Profit Factor: 2.1
- Max Drawdown: 8%
✅ KEPT

Experiment #2: FVG-Momentum
- Win Rate: 58%
- Profit Factor: 1.8
- Max Drawdown: 12%
❌ DISCARDED
```

---

*نشوف النتيجة الصبح!* 🌙
