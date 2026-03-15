# Dheeb Trading v4 - Webhook Configuration

## Webhook URL
```
https://unnotational-gus-unsenescent.ngrok-free.dev/webhook/ict
```

## Status
- ✅ Active
- ✅ Pointing to Dheeb v4 (Port 3002)
- ✅ Connected to Telegram alerts

## How to Use

### TradingView Alert Setup:
1. Create new alert in TradingView
2. Set condition (price touches level, etc.)
3. In "Notifications" tab, select **Webhook URL**
4. Paste the URL above

### JSON Payload (Optional):
```json
{
  "symbol": "NQ",
  "price": {{close}},
  "signal": "long",
  "bias": "bullish",
  "confluences": ["Liquidity Sweep", "FVG", "Order Block", "MSS"],
  "timestamp": "{{time}}"
}
```

## Kill Zone Rules (v4)
- **NY Session Only:** 9:30 - 11:30 AM NYC (14:30 - 16:30 UTC)
- **Min Probability:** 70%
- **Min Confluences:** 3
- **Min R:R:** 2.5

## Response
- **APPROVED:** Green light for trade
- **REJECTED:** Check reason (usually wrong kill zone or low probability)

---

*Updated: 2026-02-20*
