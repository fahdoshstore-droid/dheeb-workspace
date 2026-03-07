#!/usr/bin/env node
/**
 * 🐺 DHEEB LIVE MONITOR
 * Real-time market monitoring and alerts
 */

const KILL_ZONES = {
  london: { start: 8, end: 11, name: 'London' },
  ny: { start: 13.5, end: 16, name: 'NY' }
};

function getTimeInfo() {
  const now = new Date();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  
  const london = utcHour >= KILL_ZONES.london.start && utcHour < KILL_ZONES.london.end;
  const ny = utcHour >= KILL_ZONES.ny.start && utcHour < KILL_ZONES.ny.end;
  
  return {
    utc: now.toISOString().split('T')[1].split('.')[0],
    london: london ? '✅ OPEN' : '❌ CLOSED',
    ny: ny ? '✅ OPEN' : '❌ CLOSED',
    active: london || ny
  };
}

function generateStatus() {
  const time = getTimeInfo();
  
  const status = `
🐺 DHEEB LIVE MONITOR
=====================
UTC: ${time.utc}

📊 KILL ZONES:
  London: ${time.london}
  NY: ${time.ny}

📈 STATUS: ${time.active ? '✅ ACTIVE' : '❌ WAITING'}
`;
  
  return status;
}

// Auto-check every minute
setInterval(() => {
  const time = getTimeInfo();
  
  // Alert when Kill Zone opens
  if (time.active && !global.lastAlert) {
    console.log('🚨 KILL ZONE OPENED!');
    global.lastAlert = true;
  } else if (!time.active) {
    global.lastAlert = false;
  }
}, 60000);

// Initial status
console.log(generateStatus());
