#!/usr/bin/env node
/**
 * 🧠 SECOND BRAIN - Auto-Monitoring System
 * يشغل وي monitor النظام تلقائياً
 */

const CONFIG = {
  checkIntervalMs: 60000, // كل دقيقة
  alertThreshold: 3, // 3 أخطاء متتالية = تنبيه
  agents: [8080, 8081, 8082, 8083, 8084, 8085],
  criticalServices: ['gateway', 'trading-system']
};

let errorCount = 0;
let lastStatus = 'OK';

function log(msg) {
  console.log(`[${new Date().toISOString()}] 🧠 ${msg}`);
}

async function checkAgents() {
  const fs = require('fs');
  try {
    const output = require('child_process').execSync('lsof -i -P | grep -E "8080|8081|8082|8083|8084|8085" | wc -l').toString().trim();
    const count = parseInt(output);
    return count === 6;
  } catch (e) {
    return false;
  }
}

async function checkGateway() {
  try {
    const output = require('child_process').execSync('pgrep -f "openclaw" | wc -l').toString().trim();
    return parseInt(output) > 0;
  } catch (e) {
    return false;
  }
}

async function restartService(service) {
  log(`🔄 Restarting ${service}...`);
  try {
    require('child_process').execSync(`systemctl --user restart ${service}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    log(`❌ Failed to restart ${service}`);
    return false;
  }
}

async function sendAlert(message) {
  const TelegramBot = require('node-telegram-bot-api');
  const token = '8307993465:AAHAH8rU4mZf9cJXoHSdgY2IIUXnmwF3oQ8';
  const chatId = '688493754';
  
  try {
    const bot = new TelegramBot(token, { polling: false });
    await bot.sendMessage(chatId, message);
    log('✅ Alert sent to Telegram');
  } catch (e) {
    log('❌ Telegram alert failed');
  }
}

async function main() {
  log('🧠 Second Brain Started');
  await sendAlert('🧠 Second Brain Started - Monitoring Active');
  
  setInterval(async () => {
    const agentsOk = await checkAgents();
    const gatewayOk = await checkGateway();
    
    const status = agentsOk && gatewayOk ? 'OK' : 'FAIL';
    
    if (status === 'FAIL') {
      errorCount++;
      log(`⚠️ System Issue! (${errorCount})`);
      
      if (errorCount >= CONFIG.alertThreshold) {
        log('🚨 ESCALATION: Alerting فهد');
        await sendAlert('🚨 System Alert: Multiple failures detected');
      }
    } else {
      if (errorCount > 0) {
        log('✅ System Recovered');
        await sendAlert('✅ System Recovered - All services OK');
      }
      errorCount = 0;
    }
    
    lastStatus = status;
    
  }, CONFIG.checkIntervalMs);
}

main();
