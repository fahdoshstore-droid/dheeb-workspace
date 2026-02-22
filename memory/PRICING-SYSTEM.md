# 2026-02-15 - نظام الأسعار الحقيقية

## ✅ الآلية المعتمدة

### الأسعار من المواقع الحقيقية

| المصدر | الدولة | ملاحظة |
|-------|-------|---------|
| eBay US | أمريكا | جديد + مستعمل |
| RockAuto | أمريكا | قطع OEM |
| Amazon | أمريكا | Prime متاح |
| German Auto | أوروبا | OEM أصلي |
| Alibaba | الصين | رخيص |

---

### طريقة الحساب

```
السعر = (سعر القطعة + الشحن + الجمارك + VAT + الهامش) × سعر الصرف
```

---

### الـ API

```
GET /api/price/sources           ← كل المصادر
GET /api/price/search/:brand/:part?model=  ← بحث شامل
GET /api/price/region/:region/:brand/:part ← بحث حسب المنطقة
```

---

### الملفات

```
core/
├── event-bus.js
├── logger.js
├── base-agent.js
└── real-price-search.js    ← الأسعار الحقيقية

api/
├── agents.js
└── prices.js              ← Endpoints
```

---

## 📋 القادم

- خدمة العملاء (CRM Agent)
- تتبع الشحن
- ShopAndShip
