# ملخص: Shubham Saboo - Autonomous AI Agent Team

## المصدر
https://www.theunwindai.com/p/how-i-built-an-autonomous-ai-agent-team-that-runs-24-7

---

## الفكرة

6 AI Agents يشغلون حياته وهو نايم:
- Not a demo
- Not a weekend project
- Real 24/7 operation

---

## الـ Agents

| الاسم | الدور | الشخصية |
|-------|------|---------|
| Monica | Chief of Staff | Monica Geller - المنسق الرئيسي |
| Dwight | Research | Dwight Schrute - البحث |
| Kelly | X/Twitter | Kelly Kapoor - التغريد |
| Rachel | LinkedIn | Rachel Green - لينكدن |
| Ross | Engineering | Ross Geller - البرمجة |
| Pam | Newsletter | Pam Beesly - النشرة |

---

## الهيكل (Workspace)

```
workspace/
├── SOUL.md        ← هوية Agent الرئيسي
├── AGENTS.md      ← قواعد السلوك
├── MEMORY.md      ← الذاكرة طويلة المدى
├── HEARTBEAT.md   ← المراقبة التلقائية
└── agents/
    └── [sub-agents]
```

---

## اللي عندنا (DHEEB)

| عند Shubham | عندنا |
|-------------|-------|
| Monica | DHEEB (رئيسي) |
| SOUL.md | SOUL.md |
| AGENTS.md | AGENTS.md |
| MEMORY.md | MEMORY.md |
| HEARTBEAT.md | HEARTBEAT.md |
| Telegram | Telegram |
| Mac Mini | AWS Server |

---

## الفرق

- هو: 6 agents (كامل فريق)
- نحن: 1 agent (DHEEB) - عليه كل شي

**ممكن نطور ونضيف agents إذا حبين.**

---

## الـ Setup

```bash
# 1. Install
curl -fsSL https://openclaw.ai/install.sh | bash

# 2. Onboard
openclaw onboard
```

---

## الخلاصة

**احنا نسوي نفس الشي!**

- OpenClaw ✅
- Telegram ✅
- SOUL.md ✅
- AGENTS.md ✅
- MEMORY.md ✅
- HEARTBEAT.md ✅
- Mission Control ✅

**الفرق:** هو عنده فريق كامل، عندنا agent واحد (DHEEB) 🐺
