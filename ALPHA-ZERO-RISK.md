# Alpha Zero Risk Management

## Account Info

| | |
|---|---|
| Account | 50K Evaluation |
| Capital | $50,000 |
| Max Daily Loss | $1,000 (2%) |
| Max Risk/Trade | $300 (0.6%) |
| Instrument | MNQ |
| Price/Point | $0.50 |

---

## Position Sizing (MNQ)

| SL (pts) | Risk $ | Max Contracts |
|----------|--------|---------------|
| 20 pts | $10 | 1 |
| 40 pts | $20 | 1 |
| 60 pts | $30 | 1 |
| 100 pts | $50 | 3 |
| 200 pts | $100 | 3 |
| 300 pts | $150 | 5 |
| 400 pts | $200 | 4 |
| 600 pts | $300 | 6 contracts MAX |

---

## Risk Rules

| Rule | Value |
|------|-------|
| Max Trades/Day | 2 |
| Max Risk/Trade | $300 |
| Min RRR | 2.0 |
| Max Daily Loss | $1,000 |
| Kill Zones | London/NY |

---

## Trade Setup Format

| | |
|---|---|
| Entry | XXXX |
| SL | XXXX |
| TP | XXXX |
| RRR | ≥ 2.0 |
| Risk | ≤ $300 |
| Contracts | X |

---

## Decision

- RRR ≥ 2.0 + Kill Zone = **ALLOWED**
- RRR < 2.0 = **NOT ALLOWED**

---

*Execute with precision or stand down.*
