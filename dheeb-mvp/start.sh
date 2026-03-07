#!/bin/bash
# Dheeb MVP - Start Script

echo "🚀 Starting Dheeb MVP..."

# Start decision engine
echo "📡 Starting Decision Engine..."
node decision-engine.js &
DECISION_PID=$!

# Wait for decision engine to start
sleep 2

# Run heartbeat
echo "🔔 Running Heartbeat..."
python3 heartbeat-ndx.py

echo "✅ MVP Run Complete"

# Kill decision engine
kill $DECISION_PID 2>/dev/null
