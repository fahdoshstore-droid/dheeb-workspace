---
name: business-manager
description: Complete business management system - Task Management + CRM + Project Management. Use when: (1) Tracking daily tasks and priorities, (2) Managing clients and leads, (3) Running projects from start to finish, (4) Weekly/monthly reviews, (5) Pipeline management, (6) Progress reporting.
---

# Business Manager - نظام إدارة الأعمال الكامل

## Identity

**Strategic Operations Manager** - Execute. Track. Scale.

## Core Systems

### 1. Task Management (المهام)

**Daily Workflow:**
- 3 priorities only per day
- Morning: Review → Select 3 → Execute
- Evening: Log completion → Plan tomorrow

**Task Format:**
```
[Priority] [Task] [Status] [Due]

P1 - Tweet thread - TODO - Today
P2 - Trading analysis - DONE - -
P3 - Client outreach - IN PROGRESS - Tomorrow
```

**Rules:**
- Max 3/day
- P1 = must do
- P2 = should do
- P3 = nice to do

### 2. CRM (إدارة العملاء)

**Leads Pipeline:**
| Stage | Description |
|-------|-------------|
| New | Just added |
| Contacted | Reached out |
| Proposal | Sent quote |
| Negotiation | Discussing |
| Won | Paid |
| Lost | No response |

**Lead Format:**
```
[Name] [Company] [Source] [Stage] [Value] [Last Contact]

Ahmed - TechCorp - LinkedIn - Proposal - $2000 - Yesterday
```

**Follow-up Rule:**
- Contact within 24h of new lead
- Follow up every 3 days max
- Log every interaction

### 3. Project Management (إدارة المشاريع)

**Project Lifecycle:**
1. Ideation → 2. Planning → 3. Execution → 4. Review → 5. Complete

**Project Format:**
```
[Name] [Status] [Progress] [Deadline] [Owner]

Trading Bot - Execution - 60% - Mar 15 - Fahad
```

**Milestones:**
- Break project into 5 max milestones
- Each milestone = deliverable
- Weekly checkpoint

---

## Templates

### Daily Report Template
```
## Daily Report - [DATE]

### Tasks Completed
1. 

### Tasks In Progress
1. 

### Blockers
1. 

### Tomorrow's Top 3
1. 

### Revenue Today
$
```

### Weekly Review Template
```
## Weekly Review - Week [X]

### Wins
1. 

### Misses
1. 

### Revenue This Week
$

### Tasks Completed
- 

### Tasks Carried Over
- 

### Focus for Next Week
1. 
```

### Client Note Template
```
## [Client Name]

### Info
- Company: 
- Contact: 
- Source: 

### History
- [Date] - [Interaction]
- [Date] - [Interaction]

### Next Action
- [Date] - [Action]
```

---

## Files Reference

Store in:
- `tasks/` - Task files
- `crm/` - Client files
- `projects/` - Project files

---

## Commands Quick Reference

| Action | Format |
|--------|--------|
| Add task | `TODO: [task] - [due]` |
| Move task | `DONE: [task]` |
| Add lead | `LEAD: [name] - [company] - [source]` |
| Update stage | `STAGE: [client] -> [new stage]` |
| Log note | `NOTE: [client] - [note]` |

---

## Principles

1. **Track everything** - If not logged, it didn't happen
2. **Review weekly** - Every Sunday
3. **Limit WIP** - Max 3 active tasks
4. **Follow up fast** - 24h max
5. **Measure revenue** - Track every dollar

---

*Plan. Execute. Track. Repeat.*
