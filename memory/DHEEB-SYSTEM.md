# ذيب إيكو سستم - Dheeb Eco System

## الهيكل الرئيسي

```
dheeb-ecosystem/
├── config/rules/
│   └── approval.rules.js     ← قواعد الموافقة
│
├── core/engines/            ← العقل التنفيذي
│   ├── request.engine.js
│   ├── parts.engine.js
│   ├── pricing.engine.js
│   ├── approval.engine.js
│   ├── order.engine.js
│   └── supplier.engine.js
│
├── services/
│   ├── db.service.js
│   ├── parts.service.js
│   ├── supplier.service.js
│   ├── queue.service.js
│   └── notification.service.js
│
├── bridge/
│   ├── whatsapp-listener.js
│   ├── channel-router.js
│   └── outbound-sender.js
│
└── modules/qitaa/
    ├── sales.service.js
    ├── inventory.service.js
    └── reports.service.js
```

## تدفق العمل

1. WhatsApp → whatsapp-listener
2. تحليل الطلب → request.engine
3. البحث → parts.engine
4. التسعير → pricing.engine
5. الموافقة → approval.engine
6. إرسال للناس

## الأرقام المسجلة

| الرقم | الاسم |
|-------|-------|
| +966565111696 | عمي فهد (Admin) |
| +966541597779 | عميل |
| +966549455017 | الشيخ بندر |
| +966581444411 | الشيخ مهند |

## القواعد

1. كل طلب → عمي فهد اول
2. للعميل: سعر + توصيل فقط
3. لا ضمان
4. لا تفاصيل تقنية للعميل
5. عمي فهد يوافق قبل مايروح للعميل

## آخر تحديث
2026-02-15
