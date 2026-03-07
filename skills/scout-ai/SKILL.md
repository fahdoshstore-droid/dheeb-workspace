# SCOUT AI Skill

AI-powered football talent scouting skill for OpenClaw.

## Installation

```bash
clow skill add scout-ai
```

## Commands

### Analyze Player

Analyze a player image with Kimi Vision API:

```bash
clow scout analyze --image player.jpg --name "محمد" --age 17 --position "مهاجم"
```

### List Players

List all scouted players:

```bash
clow scout list
```

### Generate Report

Send WhatsApp report to parent:

```bash
clow scout report --id 1 --phone 0555555555
```

## Environment Variables

- `KIMI_API_KEY` - Kimi Vision API key

## Database

Automatically creates `scouts` table on installation.
