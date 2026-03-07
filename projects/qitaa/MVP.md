# QITAA MVP - Simple Car Parts Bot

## Version: 1.0 (MVP)

## Stack
- WhatsApp Business API
- Google Sheets (for tracking)
- Simple Node.js server

## Quick Flow

```
Customer → WhatsApp → Auto Reply → Ask for Car/Part → Quote → Deal
```

## Files

### scripts/qitaa-bot.js
Simple WhatsApp bot handler

### scripts/qitaa-sheet.js
Google Sheets integration

---

## Setup (30 min)

1. **WhatsApp Business**
   - Create account
   - Get API credentials

2. **Google Sheets**
   - Create "QITAA Leads" sheet
   - Columns: Date, Name, Car, Part, Status, Price

3. **Run**
   - `node qitaa-bot.js`

---

## Auto-Reply Messages

| Trigger | Response |
|---------|----------|
| Hi / Hello | "مرحباً! Tell us: Car model + Part needed" |
| Parts | "What part do you need?" |
| Quote | "One moment, checking price..." |

---

## Status: ✅ BUILT - READY TO RUN

---

## How to Run

```bash
cd projects/qitaa/scripts
npm install whatsapp-web.js google-spreadsheet google-auth-library
node qitaa-bot.js
```

## What's Included

- ✅ WhatsApp bot handler (`qitaa-bot.js`)
- ✅ Arabic/English responses
- ✅ State machine (Car → Part → Quote → Confirm)
- ✅ Placeholder for Google Sheets

## What You Need to Add

1. WhatsApp Business API credentials (in `.env`)
2. Google Sheet ID
3. Run on VPS or local machine with screen

---

## Flow

```
Customer: مرحبا
Bot: مرحباً! أخبرني: موديل السيارة + القطعة

Customer: Toyota Camry
Bot: تم! أي قطعة تحتاج؟

Customer: نور أمامي
Bot: لحظة واحدة...
Bot: السعر: 350 ريال - أرسل نعم للتأكيد
```
