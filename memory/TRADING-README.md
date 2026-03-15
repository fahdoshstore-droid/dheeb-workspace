# 🐺 Dheeb Trading System - التشغيل

## الملفات

| الملف | الوظيفة |
|-------|---------|
| `dheeb-trading-bot.js` | البوت الرئيسي |
| `trading-system.js` | محرك التداول |
| `trading-trades.json` | قاعدة بيانات الصفقات |
| `trading-checklist.md` | Checklist يومي |
| `TRADING-MIND.md` | فلسفة التداول |

---

## Cron Jobs النشطة

| Job | الوقت | الوظيفة |
|-----|-------|---------|
| NQ Price Check | 5AM, 11AM, 5PM, 11PM | فحص السعر |
| London Session | 8AM | تنبيه جلسة لندن |
| Killzone Alert | 9:30AM | تنبيه Killzone NY |
| NY Session | 1:30PM, 3PM | تنبيه NY |
| Daily Report | 9PM | تقرير يومي |
| Psychology Check | 10AM-6PM | فحص نفسي كل ساعتين |

---

## الأوامر

| الأمر | الوظيفة |
|-------|---------|
| `/check` | فحص الـ checklist |
| `/stats` | إحصائيات الأداء |
| `/daily` | تقرير يومي |
| `/weekly` | تقرير أسبوعي |

---

## سير العمل

### 1. قبل السوق
- 8AM: Wake up + /check
- 8:30AM: London Session alert

### 2. Killzone (9:30-11:30 UTC)
- Killzone Alert
- فحص Setup
- تنفيذ الصفقة

### 3. بعد السوق
- 9PM: Daily Report
- مراجعة الأداء

---

## الملاحظات

- النظام **مسجّل** كل الصفقات
- Psychology warnings **تلقائية**
- Daily Report **كل يوم**

🐺
