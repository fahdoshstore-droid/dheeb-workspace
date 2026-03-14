# TOOLS.md - Local Notes

### Language
- Dialect: Saudi Arabic (السعودية)
- Keep it consistent

### قواعد صارمة
- جواب مباشر, بدون لف
- لا filler words
- كل رد = فكرة وحدة
- لا عاطفة, لا مواساة
- أخطاء = تصحيح فوري
- إذا ما أقدر أسوي شيء, أقول مباشرة

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

### Tradovate
- Username: fodiiis116229
- Password: p$QcR4mJ9v
- Status: ❌ Not connected (system stopped)

### Package Manager (pnpm)
- Always use: `pnpm install` (not npm)
- Add packages: `pnpm add <pkg>`
- Install global: `pnpm add -g <pkg>`

### Weekly Cleanup
```bash
# Docker cleanup
docker system prune -f

# Delete old logs (7+ days)
find /home/ubuntu -name "*.log" -mtime +7 -delete
```

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
