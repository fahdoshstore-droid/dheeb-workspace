#!/usr/bin/env node
/**
 * 🎯 AUTO MARKET MONITOR
 * Sends analysis automatically - no manual needed
 */

const TelegramBot = require('node-telegram-bot-api');
const token = '8307993465:AAHAH8rU4mZf9cJXoHSdgY2IIUXnmwF3oQ8';
const chatId = '688493754';

const KILL_ZONES = {
  london: { start: 8, end: 11, name: 'London' },
  ny: { start: 13.5, end: 16, name: 'NY' }
};

let lastKillZoneAlert = null;
let lastHourlyAlert = null;

async function sendMessage(text) {
  try {
    const bot = new TelegramBot(token, { polling: false });
    await bot.sendMessage(chatId, text);
    console.log('✅ Alert sent');
    return true;
  } catch (e) {
    console.log('❌ Failed:', e.message);
    return false;
  }
}

function getKillZoneStatus() {
  const now = new Date();
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  
  const status = {
    london: hour >= KILL_ZONES.london.start && hour < KILL_ZONES.london.end,
    ny: hour >= KILL_ZONES.ny.start && hour < KILL_ZONES.ny.end,
    hour: hour.toFixed(2)
  };
  status.active = status.london || status.ny;
  return status;
}

async function checkKillZones() {
  const status = getKillZoneStatus();
  const now = new Date();
  const hourKey = now.getUTCHours();
  
  // Kill zone opened alert
  if (status.active && lastKillZoneAlert !== hourKey) {
    lastKillZoneAlert = hourKey;
    
    const zone = status.london ? 'London' : 'NY';
    await sendMessage(`🎯 KILL ZONE OPENED: ${zone}!
    
Rules:
- Max 2 trades
- 1% risk ($500)
- RRR ≥ 2.5
- SL non-negotiable

Check chart and wait for setup.`);
  }
  
  // Hourly reminder
  if (now.getUTCMinutes() === 0 && lastHourlyAlert !== hourKey) {
    lastHourlyAlert = hourKey;
    
    await sendMessage(`📊 ${hourKey}:00 UTC - Market Check

Kill Zones:
- London: ${status.london ? '✅' : '❌'}
- NY: ${status.ny ? '✅' : '❌'}

${status.active ? '🎯 KILL ZONE ACTIVE - Wait for setup' : 'No active kill zone'}

Rules:
✅ Max 2 trades
✅ 1% risk
✅ RRR ≥ 2.5`);
  }
}

async function main() {
  console.log('🎯 Auto Market Monitor Started');
  
  // Run every minute
  setInterval(checkKillZones, 60000);
  
  // Initial check
  await checkKillZones();
}

main().catch(console.error);
