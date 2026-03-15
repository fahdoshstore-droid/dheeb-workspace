---
name: discord-adapter
description: Send messages to Discord via bot. Use when: (1) User wants to send to Discord channel, (2) Automated trading notifications, (3) Status updates to Discord. Requires: Bot Token and Channel ID configured in .env or provided in message.
---

# Discord Adapter

## Setup

### Environment Variables
Add to `.env`:
```
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
```

### Or Provide in Message
```
discord:CHANNEL_ID:Your message here
```

---

## How It Works

### Option 1: Default Channel
If `DISCORD_CHANNEL_ID` is set in `.env`:
```
!discord Your message
```

### Option 2: Specific Channel
```
discord:1479637780500840701:Your message here
```

### Option 3: Commands (via Bot)
In Discord, use:
- `!status` - Daily trading status
- `!rules` - Trading rules
- `!help` - All commands

---

## Features

| Feature | Description |
|---------|-------------|
| Send Messages | Text to Discord |
| Embeds | Rich formatted messages |
| Commands | !status, !rules, !pnl, !killzone |
| Auto-Notifications | Trading signals, alerts |

---

## Current Config

| Setting | Value |
|---------|-------|
| Bot Token | MTQ3OTU5ODI5MjIwNjc0NzgzOQ... |
| Channel ID | 1479637780500840701 |
| Bot Name | TheebMind#5792 |
| Server | 2when's server |

---

## Usage Examples

### Send to Default Channel
```javascript
// In OpenClaw
!discord Trading signal: BUY MNQ @ 17500
```

### Send to Specific Channel
```javascript
// Channel ID inline
discord:1479637780500840701:New setup detected!
```

### Embed Format
```javascript
{
  "title": "📊 Trade Signal",
  "description": "BUY MNQ",
  "fields": [
    {"name": "Entry", "value": "17500"},
    {"name": "SL", "value": "17450"},
    {"name": "TP", "value": "17600"}
  ]
}
```

---

## Error Handling

| Error | Solution |
|-------|----------|
| Unknown Channel | Check Channel ID |
| Missing Permissions | Bot needs Send Messages permission |
| Token Invalid | Regenerate Bot Token |

---

*Last Updated: March 7, 2026*
