# Multi-Model Configuration

## Current Setup
- Main: MiniMax-M2.5 (trading, analysis)

## Available Models
| Model | Use Case | Speed |
|-------|----------|-------|
| M2.5 | Trading, Analysis, Complex | Standard |
| Haiku | Quick tasks, Simple | Fast |
| free | Experiments | Fast |
| M2-her | Roleplay, Stories | Standard |

## Creative Models
| Model | Use |
|-------|-----|
| M2-her | Storytelling, Roleplay |
| Haiku | Creative, Fast |
| Sonnet | Balanced, Writing |
| flash | Quick responses | Fastest |

## Usage
- Trading: M2.5 (default)
- Quick check: Haiku or free
- Experiments: free

## Command Examples
```
# Use specific model
openclaw agent --model haiku --message "quick question"

# In code
model: "haiku" for sessions_spawn
```
