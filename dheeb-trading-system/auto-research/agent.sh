#!/bin/bash
# Auto-Trader Research Agent
# يشغل تجارب على الاستراتيجيات

echo "🤖 Auto-Trader Research Agent"
echo "=============================="
echo ""

STRATEGY_DIR="strategies"
RESULTS_DIR="results"
PROGRAM_FILE="program.md"

# Create directories
mkdir -p $STRATEGY_DIR $RESULTS_DIR

# Load current strategy
echo "📖 Reading program.md..."
cat $PROGRAM_FILE

echo ""
echo "🔬 Starting experiment..."

# Get current best result
BEST_FILE=$(ls -t $RESULTS_DIR/*.json 2>/dev/null | head -1)
if [ -n "$BEST_FILE" ]; then
    echo "📊 Previous best:"
    cat $BEST_FILE
    echo ""
fi

# Run backtest
echo "🧪 Running backtest..."
python3 backtest.py

# Check result
RESULT_FILE=$(ls -t $RESULTS_DIR/*.json 2>/dev/null | head -1)
if [ -n "$RESULT_FILE" ]; then
    WIN_RATE=$(grep -o '"win_rate": [0-9.]*' $RESULT_FILE | grep -o '[0-9.]*')
    PF=$(grep -o '"profit_factor": [0-9.]*' $RESULT_FILE | grep -o '[0-9.]*')
    DD=$(grep -o '"max_drawdown": [0-9.]*' $RESULT_FILE | grep -o '[0-9.]*')
    
    echo ""
    echo "📈 Results:"
    echo "- Win Rate: ${WIN_RATE}%"
    echo "- Profit Factor: ${PF}"
    echo "- Max Drawdown: ${DD}%"
    
    # Decision
    if (( $(echo "$WIN_RATE > 55" | bc -l) )) && \
       (( $(echo "$PF > 1.5" | bc -l) )) && \
       (( $(echo "$DD < 15" | bc -l) )); then
        echo ""
        echo "✅ RESULT: KEPT - Strategy improved!"
    else
        echo ""
        echo "❌ RESULT: DISCARDED - Doesn't meet criteria"
    fi
fi

echo ""
echo "🌙 Done for tonight!"
echo "Run again tomorrow to continue research."
