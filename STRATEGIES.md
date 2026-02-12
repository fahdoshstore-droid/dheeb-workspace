# STRATEGIES.md - استراتيجياتك

## 📋 الاستراتيجيات المعرّفة

### 1. SMC Scalping (النازداك - Futures)
**المؤشرات:**
- Timeframe: 1M, 5M
- Order Blocks (آخر 2-3 فقط)
- Fair Value Gaps
- Break of Structure
- POC Level

**شروط الدخول:**
- تقاطع EMA 9 مع EMA 21
- RSI بين 30-70
- Delta موجب > 5%
- OB تم اختراقه للتو

**الخروج:**
- Take Profit: 5-10 نقاط
- Stop Loss: 3 نقاط
- Time Exit: 5 دقائق ماكس

**المخاطرة:** 1% من الرصيد
**Target Win Rate:** 60%+

---

### 2. Day Trading - SMC + Technical
**المؤشرات:**
- Timeframe: 15M, 1H
- Order Blocks (Daily/4H)
- FVG
- MACD
- Volume Profile

**شروط الدخول:**
- Bounce من Support
- Kill Zone (4:00-5:00 AM EST)
- RSI >= 55 (للشراء)
- Volume > Average

**الخروج:**
- Take Profit: 20-50 نقطة
- Stop Loss: 10 نقاط
- Time Exit: نهاية الجلسة الأمريكية

**المخاطرة:** 2% من الرصيد
**Target Win Rate:** 55%+

---

### 3. Swing Trading - Trend Following
**المؤشرات:**
- Timeframe: 4H, 1D
- EMA 50 و 200
- Order Blocks الكبيرة
- MACD (Daily)
- ATR

**شروط الدخول:**
- اتجاه صاعد واضح
- EMA 9 > EMA 21 > EMA 50
- الإغلاق فوق Support
- Volume صعود

**الخروج:**
- Take Profit: 100-200 نقطة
- Stop Loss: 30 نقطة
- BoS (Break of Structure) = توقف فوري

**المخاطرة:** 2% من الرصيد
**Target Win Rate:** 50%+

---

### 4. Rejection Strategy (المستويات الرئيسية)
**المؤشرات:**
- Timeframe: 1H, 4H
- Resistance/Support الرئيسية
- Wicks (الفتائل)
- Volume Spike

**شروط الدخول:**
- ارتطام بـ Resistance
- Wick يخترق ثم يرجع
- Close فوق Support
- RSI < 70

**الخروج:**
- Take Profit: 20-50 نقطة
- Stop Loss: تحت الـ Wick
- Time Exit: 2-4 ساعات

**المخاطرة:** 1.5% من الرصيد
**Target Win Rate:** 58%+

---

### 5. FVG Recovery (Fair Value Gap Filling)
**المؤشرات:**
- Timeframe: 1H, 4H
- FVG الحديثة
- Nearest Support
- POC

**شروط الدخول:**
- FVG واضح (فجوة >20 نقطة)
- الثمن بعيد عن FVG
- Pullback يقترب من FVG
- Volume يقل

**الخروج:**
- Take Profit: في منتصف FVG
- Stop Loss: فوق الـ Gap
- Time Exit: لو ما بعدش في FVG بـ 4 ساعات

**المخاطرة:** 1% من الرصيد
**Target Win Rate:** 62%+

---

## 📊 نموذج الصفقة

```json
{
  "id": "trade_20260212_001",
  "strategy": "SMC Scalping",
  "symbol": "NQ",
  "type": "BUY",
  "entryPrice": 21450,
  "entryTime": "2026-02-12 21:45:00",
  "quantity": 1,
  "stopLoss": 21420,
  "takeProfit": 21480,
  "riskAmount": 30,
  "riskPercent": 1,
  "status": "open",
  "result": null
}
```

---

## 🎯 نظام التقييم

### معايير الإشارة الجيدة:
- ✅ 3+ مؤشرات متفقة
- ✅ Risk/Reward >= 1:2
- ✅ Delta موجب أو Volume مرتفع
- ✅ ليس بعد أخبار مهمة
- ✅ التوقيت حسب استراتيجية

### معايير الدخول السيء:
- ❌ مؤشر واحد فقط
- ❌ Risk/Reward < 1:1
- ❌ Volume منخفض
- ❌ في منتصف أخبار
- ❌ عاطفة (FOMO/Fear)

---

## 📈 تحديثات الأداء

آخر تحديث: 2026-02-12
ستتم إضافة الصفقات تلقائياً.

| الاستراتيجية | الصفقات | الفوز | Win Rate | آخر أداء |
|---|---|---|---|---|
| SMC Scalping | 0 | 0 | - | جديدة |
| Day Trading | 0 | 0 | - | جديدة |
| Swing Trading | 0 | 0 | - | جديدة |
| Rejection | 0 | 0 | - | جديدة |
| FVG Recovery | 0 | 0 | - | جديدة |
