#!/bin/bash

# Dheeb Trading System CLI

case "$1" in
  start)
    pm2 start ecosystem.config.js
    ;;
  stop)
    pm2 stop dheeb-trading
    ;;
  restart)
    pm2 restart dheeb-trading
    ;;
  logs)
    pm2 logs dheeb-trading
    ;;
  status)
    pm2 status dheeb-trading
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|status}"
    ;;
esac
