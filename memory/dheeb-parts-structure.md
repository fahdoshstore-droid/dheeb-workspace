# Dheeb Parts System - الهيكل الكامل

## المسار
```
dheeb-parts/
```

## الملفات الرئيسية

| الملف | الوظيفة |
|-------|---------|
| `app.js` | نقطة الدخول |
| `package.json` | Dependencies |
| `.env` | إعدادات |
| `setup-dheeb.sh` | سكربت التثبيت |

---

## الـ Core

| الملف | الوظيفة |
|-------|---------|
| `order.state.js` | State Machine للطلبات |
| `order.service.js` | منطق الطلب + الصور + التفاوض |

---

## Modules

### landrover/
- `part.questioner.js` — أسئلة ذكية للقطع

---

## Bridge

- `whatsapp.webhook.js` — معالجة WhatsApp + الأوامر

---

## Services

| الخدمة | الوظيفة |
|--------|---------|
| `customer.service.js` | رسائل احترافية |
| `notification.service.js` | إرسال الصور والرسائل |
| `db.service.js` | قاعدة البيانات |

---

## آخر تحديث
17 Feb 2026
