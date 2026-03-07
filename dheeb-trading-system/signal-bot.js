/**
 * Signal Alert Bot - Discord Notifications
 * Connects DHEEB Trading System to Discord
 * Sells: Trade signals, alerts, status updates
 */

const axios = require('axios');
const fs = require('fs');

// Config
const CONFIG = {
  botToken: process.env.DISCORD_BOT_TOKEN || 'MTQ3OTU5ODI5MjIwNjc0NzgzOQ.GMHVhg.-bgMhUMBWYspsQbqcB-k2Nuntaq6NunqonTgA0',
  channelId: process.env.DISCORD_CHANNEL_ID || '1479637780500840701',
  tradingChannelId: '1479637780500840701' // #trading
};

// Embed colors
const COLORS = {
  GREEN: 0x00e676,
  RED: 0xff5252,
  YELLOW: 0xff9800,
  BLUE: 0x42a5f5,
  PURPLE: 0x9c27b0
};

// ============================================
// SIGNAL TYPES
// ============================================

/**
 * Send trade signal
 */
async function sendSignal(signal) {
  const embed = {
    embeds: [{
      title: `📊 ${signal.direction} ${signal.instrument}`,
      description: signal.setup || 'A+++ Setup',
      color: signal.direction === 'BUY' ? COLORS.GREEN : COLORS.RED,
      fields: [
        { name: 'Entry', value: signal.entry, inline: true },
        { name: 'SL', value: signal.sl, inline: true },
        { name: 'TP', value: signal.tp, inline: true },
        { name: 'RRR', value: signal.rrr, inline: true },
        { name: 'Risk', value: `$${signal.risk}`, inline: true },
        { name: 'Size', value: `${signal.contracts} contracts`, inline: true }
      ],
      footer: { text: 'DHEEB Trading System' },
      timestamp: new Date().toISOString()
    }]
  };

  return sendMessage(embed, CONFIG.tradingChannelId);
}

/**
 * Send alert
 */
async function sendAlert(type, message) {
  const colors = {
    WARNING: COLORS.YELLOW,
    ERROR: COLORS.RED,
    INFO: COLORS.BLUE,
    SUCCESS: COLORS.GREEN
  };

  const embed = {
    embeds: [{
      title: `⚠️ ${type}`,
      description: message,
      color: colors[type] || COLORS.BLUE,
      footer: { text: 'DHEEB Alert' },
      timestamp: new Date().toISOString()
    }]
  };

  return sendMessage(embed, CONFIG.tradingChannelId);
}

/**
 * Send daily status
 */
async function sendDailyStatus(status) {
  const embed = {
    embeds: [{
      title: '📈 DHEEB Daily Status',
      color: COLORS.BLUE,
      fields: [
        { name: 'Date', value: status.date, inline: true },
        { name: 'Trades', value: `${status.trades}/2`, inline: true },
        { name: 'P/L', value: `$${status.pnl}`, inline: true },
        { name: 'Win Rate', value: `${status.winRate}%`, inline: true },
        { name: 'Open Positions', value: status.openPositions, inline: true },
        { name: 'Buffer', value: status.buffer, inline: true }
      ],
      footer: { text: 'DHEEB Trading System' },
      timestamp: new Date().toISOString()
    }]
  };

  return sendMessage(embed, CONFIG.tradingChannelId);
}

/**
 * Send kill zone alert
 */
async function sendKillZoneAlert(zone) {
  const embed = {
    embeds: [{
      title: '🎯 Kill Zone Active',
      description: `${zone.name} session is now active!`,
      color: COLORS.PURPLE,
      fields: [
        { name: 'Zone', value: zone.name, inline: true },
        { name: 'Start', value: zone.start, inline: true },
        { name: 'End', value: zone.end, inline: true }
      ],
      footer: { text: 'DHEEB - Time to Trade' },
      timestamp: new Date().toISOString()
    }]
  };

  return sendMessage(embed, CONFIG.tradingChannelId);
}

/**
 * Send setup detected
 */
async function sendSetupDetected(setup) {
  const embed = {
    embeds: [{
      title: '🔍 Setup Detected',
      description: `A+++ Setup: ${setup.type}`,
      color: COLORS.GREEN,
      fields: [
        { name: 'Trend', value: setup.trend, inline: true },
        { name: 'Raid', value: setup.raid, inline: true },
        { name: 'Imbalance', value: setup.imbalance, inline: true },
        { name: 'Location', value: setup.location, inline: true }
      ],
      footer: { text: 'DHEEB Trading System' },
      timestamp: new Date().toISOString()
    }]
  };

  return sendMessage(embed, CONFIG.tradingChannelId);
}

// ============================================
// CORE FUNCTIONS
// ============================================

async function sendMessage(content, channelId = CONFIG.channelId) {
  try {
    const response = await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      content,
      {
        headers: {
          'Authorization': `Bot ${CONFIG.botToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, id: response.data.id };
  } catch (error) {
    console.error('Discord Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// CLI
// ============================================

const args = process.argv.slice(2);
const command = args[0];

if (command === 'signal') {
  sendSignal({
    direction: 'BUY',
    instrument: 'MNQ',
    entry: '17500',
    sl: '17450',
    tp: '17600',
    rrr: '2.5',
    risk: '100',
    contracts: 2,
    setup: 'A+++ Bullish'
  }).then(r => console.log(r.success ? '✅ Signal sent' : '❌ Failed'));
}
else if (command === 'alert') {
  sendAlert('INFO', 'Testing alert system').then(r => console.log(r.success ? '✅ Alert sent' : '❌ Failed'));
}
else if (command === 'status') {
  sendDailyStatus({
    date: new Date().toISOString().split('T')[0],
    trades: 1,
    pnl: 150,
    winRate: 100,
    openPositions: 0,
    buffer: 'SAFE'
  }).then(r => console.log(r.success ? '✅ Status sent' : '❌ Failed'));
}
else if (command === 'killzone') {
  sendKillZoneAlert({ name: 'NY AM', start: '09:50', end: '10:10' })
    .then(r => console.log(r.success ? '✅ Kill Zone sent' : '❌ Failed'));
}
else if (command === 'test') {
  sendMessage({ content: '🐺 DHEEB Signal Bot - TEST OK!' })
    .then(r => console.log(r.success ? '✅ Test passed' : '❌ Failed'));
}
else {
  console.log('DHEEB Signal Alert Bot');
  console.log('=======================');
  console.log('Usage:');
  console.log('  node signal-bot.js signal  - Send trade signal');
  console.log('  node signal-bot.js alert   - Send alert');
  console.log('  node signal-bot.js status  - Send daily status');
  console.log('  node signal-bot.js killzone - Send kill zone alert');
  console.log('  node signal-bot.js test    - Test connection');
}

module.exports = {
  sendSignal,
  sendAlert,
  sendDailyStatus,
  sendKillZoneAlert,
  sendSetupDetected,
  sendMessage
};
