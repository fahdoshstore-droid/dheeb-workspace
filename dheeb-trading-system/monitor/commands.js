/**
 * 🐺 MONITOR COMMANDS
 * WhatsApp/CLI commands for active monitor
 */

const Monitor = require('./monitor');

const commands = {
  
  // Start monitor
  '/start-monitor': () => {
    Monitor.run();
    return {
      message: '🐺 Monitor Started!\n\nFeatures:\n• Killzone alerts\n• Psychology checks\n• News warnings\n• COT reminders',
      success: true
    };
  },
  
  // Status
  '/monitor-status': () => {
    const kz = Monitor.checkKillzone();
    const psych = Monitor.checkPsychology();
    
    return {
      message: `🐺 MONITOR STATUS

Killzone: ${kz ? 'ACTIVE' : 'WAITING'}
Psych: ${psych ? '⚠️ ' + psych.type : '✅ OK'}
Time: ${new Date().toUTCString()}`,
      success: true
    };
  },
  
  // Force psychology check
  '/psych-check': () => {
    const result = Monitor.checkPsychology();
    
    if (result) {
      return {
        message: result.message,
        success: false
      };
    }
    
    return {
      message: '✅ Psychology: OK\n\nKeep focused. Wait for setup.',
      success: true
    };
  },
  
  // Killzone status
  '/killzone': () => {
    const kz = Monitor.checkKillzone();
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    
    return {
      message: `🐺 KILLZONE

Current: ${hours}:${mins}
Status: ${kz ? '✅ ACTIVE' : '❌ WAITING'}
Hours: 9:30-11:30 UTC (5:30-7:30 PM Riyadh)`,
      success: true
    };
  },
  
  // Next news
  '/news': () => {
    return {
      message: `📰 NEWS CALENDAR

High Impact:
• FOMC (varies)
• CPI (monthly)
• NFP (first Fri)
• GDP (quarterly)

Reduce size 30 min before.`,
      success: true
    };
  },
  
  // COT info
  '/cot': () => {
    return {
      message: `📊 COT REPORT

Released: Friday 1:30 PM EST
(8:30 PM Riyadh)

Check:
• Commercial hedgers
• Large speculators
• Net positioning changes`,
      success: true
    };
  },
  
  // ICT setups info
  '/ict': () => {
    return {
      message: `🐺 ICT SETUPS

Wait for:
• Killzone (9:30-11:30)
• Liquidity sweep
• SD2 level
• FVG confirmation
• SMT divergence

R:R ≥ 2.5 minimum`,
      success: true
    };
  },
  
  // Full system check
  '/system': () => {
    const kz = Monitor.checkKillzone();
    const psych = Monitor.checkPsychology();
    
    return {
      message: `🐺 DHEEB SYSTEM

━━━━━━━━━━━━━━━━
📅 Killzone: ${kz ? '✅ ACTIVE' : '❌ WAIT'}
🧠 Psychology: ${psych ? '⚠️ ' + psych.type : '✅ OK'}
📰 News: Check calendar
📊 COT: Friday 8:30 PM
━━━━━━━━━━━━━━━━

Rules:
• Risk: 2%
• Daily Loss: $1,100
• R:R: 2.5+`,
      success: true
    };
  }
};

module.exports = commands;
