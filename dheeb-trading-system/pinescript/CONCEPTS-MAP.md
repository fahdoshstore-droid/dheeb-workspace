# 🐺 DHEEB ICT MASTER v3 — خريطة المفاهيم والربط

## كيف تم الدمج

```
┌─────────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│   Mxwll Suite           │     │  ICT Killzones [TFO]     │     │  ICT Rebalance [LuxAlgo] │
│                         │     │                          │     │                          │
│  • BoS / CHoCH          │     │  • Killzone Boxes        │     │  • Immediate Rebalance   │
│  • FVG Detection        │     │  • Session Pivots H/L    │     │  • BSL/SSL Liquidity     │
│  • Swing Order Blocks   │     │  • DWM Open/H/L          │     │  • Order Blocks + BB     │
│  • Auto Fibonacci       │     │  • Session Timer Table    │     │  • Liquidity Voids       │
│  • Area of Interest     │     │  • Day of Week Labels     │     │  • Macros Timing         │
│  • Internal Structure   │     │  • Timestamp Lines        │     │                          │
└────────────┬────────────┘     └────────────┬─────────────┘     └────────────┬─────────────┘
             │                               │                                │
             └───────────────┬───────────────┴────────────────────────────────┘
                             ▼
              ┌──────────────────────────────────┐
              │  🐺 DHEEB ICT MASTER v3 (Pine)   │
              │  سكربت واحد موحد 643 سطر          │
              │                                   │
              │  Confluence Scoring System:        │
              │  Max Score = 7 per side            │
              │  1. Market Structure bias    (+1)  │
              │  2. FVG proximity           (+1)  │
              │  3. Order Block proximity   (+1)  │
              │  4. Liquidity Sweep         (+2)  │
              │  5. Immediate Rebalance     (+1)  │
              │  6. Active Killzone         (+1)  │
              └──────────────┬────────────────────┘
                             │ webhook JSON
                             ▼
              ┌──────────────────────────────────┐
              │  🌐 Webhook Server (Node.js)      │
              │  POST /webhook                    │
              │  Validates secret + parses signal  │
              └──────────────┬────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │  🧠 Execution Engine              │
              │  Pipeline:                        │
              │  1. Session/Time check            │
              │  2. Psychology gate (Hougaard)    │
              │  3. Risk validation (Raschke)     │
              │  4. Drawdown check (Carter)       │
              │  5. Size adjustment (Wieland)     │
              │  6. ICT re-validation (optional)  │
              └──────────────┬────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │  📊 Tradovate API                 │
              │  Bracket Order (Entry+TP+SL)      │
              │  isAutomated: true (CME)          │
              └──────────────┬────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │  📱 Notifications                 │
              │  Telegram + Console + Journal     │
              └──────────────────────────────────┘
```

---

## تفصيل كل مفهوم ICT

### 1. Market Structure (BoS / CHoCH)
| العنصر | المصدر الأصلي | السطر في v3 | الشرح |
|--------|---------------|-------------|-------|
| External BoS | Mxwll `drawStructureExt()` | L125-140 | كسر هيكلي في اتجاه الترند |
| External CHoCH | Mxwll `drawStructureExt()` | L125-140 | تحول هيكلي عكس الترند |
| Internal BoS | Mxwll `drawStructureInternals()` | L143-160 | كسر هيكلي داخلي أصغر |
| Swing Detection | Mxwll `calculatePivots()` | L108-122 | حساب القمم والقيعان بحساسية قابلة للتعديل |

**كيف يُستخدم في القرار:**
- CHoCH = تغيير الـ bias (+1 لصالح الاتجاه الجديد)
- BoS = تأكيد الاتجاه (يحافظ على الـ bias)

### 2. Fair Value Gaps (FVG)
| العنصر | المصدر الأصلي | السطر في v3 | الشرح |
|--------|---------------|-------------|-------|
| Bullish FVG | Mxwll `fvg(3)` | L170-175 | فجوة صعودية: low الحالية > high قبل شمعتين |
| Bearish FVG | Mxwll `fvg(-3)` | L170-175 | فجوة هبوطية: high الحالية < low قبل شمعتين |
| FVG Mitigation | Mxwll | L180-200 | حذف FVG عند الملء الكامل |
| FVG Contraction | Mxwll | L190-195 | تقليص FVG عند الملء الجزئي |

**كيف يُستخدم في القرار:**
- FVG قريب من السعر الحالي = +1 confluence
- FVG + OB في نفس المنطقة = إشارة A+

### 3. Order Blocks (OB)
| العنصر | المصدر الأصلي | السطر في v3 | الشرح |
|--------|---------------|-------------|-------|
| Bullish OB | LuxAlgo `obbSwings()` + Mxwll | L210-230 | آخر شمعة هابطة قبل الصعود |
| Bearish OB | LuxAlgo `obbSwings()` + Mxwll | L210-230 | آخر شمعة صاعدة قبل الهبوط |
| OB Mitigation | LuxAlgo method | L240-260 | حذف OB عند كسره |
| Breaker Blocks | LuxAlgo BB | — | OB مكسور يتحول لدعم/مقاومة (في النسخة الأصلية) |

**كيف يُستخدم في القرار:**
- السعر داخل OB أو قريب منه = +1 confluence
- OB + FVG معاً = confluence مضاعف

### 4. Liquidity (BSL/SSL)
| العنصر | المصدر الأصلي | السطر في v3 | الشرح |
|--------|---------------|-------------|-------|
| BSL Detection | LuxAlgo ZZ pivots | L270-290 | Equal highs = تجمع ستوبات فوق |
| SSL Detection | LuxAlgo ZZ pivots | L270-290 | Equal lows = تجمع ستوبات تحت |
| BSL Sweep | LuxAlgo | L295-296 | السعر يخترق BSL ثم يرجع = SHORT signal |
| SSL Sweep | LuxAlgo | L295-296 | السعر يخترق SSL ثم يرجع = LONG signal |

**كيف يُستخدم في القرار:**
- Liquidity Sweep = +2 confluence (أقوى إشارة)
- Sweep + CHoCH = إشارة مثالية

### 5. Immediate Rebalance (IR)
| العنصر | المصدر الأصلي | السطر في v3 | الشرح |
|--------|---------------|-------------|-------|
| Bullish IR | LuxAlgo IR detection | L305-308 | الشمعة تنزل تحت high السابقة ثم تغلق فوقها |
| Bearish IR | LuxAlgo IR detection | L305-308 | الشمعة تصعد فوق low السابقة ثم تغلق تحتها |
| IR Confirmation | LuxAlgo irCFR | Input | عدد الشموع المطلوبة للتأكيد |

### 6. Killzones
| العنصر | المصدر الأصلي | السطر في v3 | التوقيت (EST) |
|--------|---------------|-------------|---------------|
| Asia | TFO asia session | L85-95 | 20:00 - 00:00 |
| London | TFO london session | L85-95 | 02:00 - 05:00 |
| NY AM | TFO nyam session | L85-95 | 09:30 - 11:00 |
| NY Lunch | TFO nylu session | L85-95 | 12:00 - 13:30 |
| NY PM | TFO nypm session | L85-95 | 13:30 - 16:00 |

**كيف يُستخدم في القرار:**
- NY AM أو London = +1 confluence + مسموح التداول
- Lunch = ⚠️ تجنب (Wieland rule)
- خارج الكيلزون = لا تداول (إذا useKZfilter = true)

### 7. Fibonacci (OTE Zone)
| العنصر | المصدر الأصلي | السطر في v3 | الشرح |
|--------|---------------|-------------|-------|
| Auto Fib | Mxwll `drawFibs()` | L320-340 | فيبوناتشي تلقائي بين آخر swing H و L |
| OTE Zone | ICT concept | L345-350 | 0.618 - 0.786 = Optimal Trade Entry |

---

## نظام التقييم (Confluence Scoring)

```
الحد الأقصى لكل اتجاه: 7 نقاط

┌──────────────────────────┬────────┬─────────────────────────────┐
│ العامل                   │ النقاط │ الشرح                       │
├──────────────────────────┼────────┼─────────────────────────────┤
│ Market Structure bias    │  +1    │ BoS/CHoCH يؤكد الاتجاه       │
│ FVG قريب                 │  +1    │ السعر عند/قرب فجوة سعرية     │
│ Order Block قريب         │  +1    │ السعر عند/قرب OB نشط         │
│ Liquidity Sweep          │  +2    │ BSL/SSL sweep (أقوى إشارة)   │
│ Immediate Rebalance      │  +1    │ IR مؤكد                      │
│ Killzone نشط             │  +1    │ NY AM أو London              │
├──────────────────────────┼────────┼─────────────────────────────┤
│ الحد الأدنى للدخول        │   2    │ قابل للتعديل (minConfl)     │
└──────────────────────────┴────────┴─────────────────────────────┘

مثال إشارة A+:
  SSL Sweep (+2) + CHoCH (+1) + FVG (+1) + OB (+1) + NY AM (+1) = 6/7
```

---

## إعداد الربط

### الخطوة 1: Pine Script → TradingView
1. انسخ محتوى `pinescript/dheeb-ict-master-v3.pine`
2. الصقه في TradingView > Pine Editor > Add to Chart
3. عدّل الإعدادات: Secret, Symbol, Quantity

### الخطوة 2: TradingView Alert
1. أنشئ Alert على الاستراتيجية
2. Condition: "🐺 Dheeb ICT Master v3"
3. Webhook URL: `http://YOUR_SERVER:3000/webhook`
4. Message: `{{strategy.order.alert_message}}`

### الخطوة 3: Dheeb Bot
```bash
# 1. عبّئ .env
cp .env.example .env
nano .env

# 2. شغّل بوضع تجريبي أولاً
node bot.js --webhook-only

# 3. أرسل إشارة تجريبية
node bot.js --test-signal

# 4. شغّل كامل مع Tradovate Demo
TRADOVATE_DEMO=true node bot.js
```

---

## مقارنة مع السكربتات الأصلية

| الميزة | Mxwll | TFO | LuxAlgo | Dheeb v3 |
|--------|-------|-----|---------|----------|
| BoS/CHoCH | ✅ | — | — | ✅ |
| FVG | ✅ | — | — | ✅ |
| Swing OB | ✅ | — | ✅ | ✅ |
| Breaker Blocks | — | — | ✅ | 🔜 |
| BSL/SSL | — | — | ✅ | ✅ |
| Liquidity Sweep | — | — | ✅ | ✅ |
| Immediate Rebalance | — | — | ✅ | ✅ |
| Killzones | ✅ (bgcolor) | ✅ (boxes) | ✅ (macros) | ✅ |
| Session Pivots | — | ✅ | — | ✅ (PDH/PDL) |
| DWM Levels | — | ✅ | — | ✅ |
| Auto Fibonacci | ✅ | — | — | ✅ |
| Liquidity Voids | — | — | ✅ | 🔜 |
| Macros Timing | — | — | ✅ | 🔜 |
| **Confluence Score** | — | — | — | ✅ |
| **Webhook Signals** | — | — | — | ✅ |
| **Auto Execution** | — | — | — | ✅ |
| **Risk Management** | — | — | — | ✅ |
| **Psychology Gate** | — | — | — | ✅ |
