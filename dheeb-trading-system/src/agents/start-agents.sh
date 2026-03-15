#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  🚀 DHEEB MULTI-AGENT SYSTEM
#  Start/Stop/Restart all agents
# ═══════════════════════════════════════════════════════════════════════

cd /home/ubuntu/.openclaw/workspace/dheeb-trading-system/src/agents

case "$1" in
  start)
    echo "🚀 Starting Dheeb Agents..."
    
    # Kill existing
    pkill -f "trading-agent" 2>/dev/null
    pkill -f "risk-agent" 2>/dev/null
    pkill -f "news-agent" 2>/dev/null
    pkill -f "system-agent" 2>/dev/null
    pkill -f "notifier-agent" 2>/dev/null
    
    sleep 1
    
    # Start agents
    echo "🤖 Starting Trading Agent..."
    PORT=8080 node trading-agent.js > /tmp/trading-agent.log 2>&1 &
    
    echo "💼 Starting Risk Agent..."
    PORT=8081 node risk-agent.js > /tmp/risk-agent.log 2>&1 &
    
    echo "📰 Starting News Agent..."
    PORT=8082 node news-agent.js > /tmp/news-agent.log 2>&1 &
    
    echo "⚙️ Starting System Agent..."
    PORT=8083 node system-agent.js > /tmp/system-agent.log 2>&1 &
    
    echo "📱 Starting Notifier Agent..."
    PORT=8084 node notifier-agent.js > /tmp/notifier-agent.log 2>&1 &
    
    sleep 2
    
    echo ""
    echo "✅ Dheeb Multi-Agent System Started!"
    echo ""
    echo "Ports:"
    echo "  🤖 Trading:  8080"
    echo "  💼 Risk:     8081"
    echo "  📰 News:     8082"
    echo "  ⚙️ System:   8083"
    echo "  📱 Notifier: 8084"
    echo ""
    ;;
    
  stop)
    echo "🛑 Stopping Dheeb Agents..."
    pkill -f "trading-agent" 2>/dev/null
    pkill -f "risk-agent" 2>/dev/null
    pkill -f "news-agent" 2>/dev/null
    pkill -f "system-agent" 2>/dev/null
    pkill -f "notifier-agent" 2>/dev/null
    echo "✅ Stopped"
    ;;
    
  status)
    echo "📊 Agent Status:"
    echo ""
    
    for port in 8080 8081 8082 8083 8084; do
      status=$(curl -s http://localhost:$port/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
      if [ "$status" = "ok" ]; then
        echo "  ✅ Port $port: OK"
      else
        echo "  ❌ Port $port: DOWN"
      fi
    done
    ;;
    
  logs)
    echo "📝 Agent Logs:"
    echo ""
    for agent in trading risk news system notifier; do
      echo "=== $agent-agent ==="
      tail -3 /tmp/$agent-agent.log 2>/dev/null
      echo ""
    done
    ;;
    
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status|logs|restart}"
    ;;
esac
