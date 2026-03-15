#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  🐺 DHEEB TRADING MIND — CLI Interface
 *  واجهة سطر الأوامر التفاعلية
 * ═══════════════════════════════════════════════════════════════
 */

const readline = require("readline");
const DheebCore = require("./core/dheeb-core");

const core = new DheebCore();

const COMMANDS = {
  // ═══ Session Management ═══
  "start": () => {
    const result = core.startSession();
    printSection("بدء الجلسة", result);
  },

  "checklist": () => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("\n📋 قائمة فحص ما قبل الجلسة:\n");

    const questions = [
      { key: "prevDayHighLow", q: "هل حددت High/Low أمس؟ (y/n): " },
      { key: "vwapLevel", q: "هل حددت VWAP؟ (y/n): " },
      { key: "overnightRange", q: "النطاق الليلي بالنقاط: ", type: "number" },
      { key: "keyLevels", q: "هل حددت S/R؟ (y/n): " },
      { key: "newsCheck", q: "هل فحصت الأخبار (Red)؟ (y/n): " },
      { key: "maxLossDefined", q: "هل كتبت أقصى خسارة على ورقة؟ (y/n): " },
    ];

    const answers = {};
    let i = 0;

    function askNext() {
      if (i >= questions.length) {
        rl.close();
        const result = core.completeChecklist(answers);
        printSection("نتيجة Checklist", result);
        return;
      }
      const q = questions[i];
      rl.question(`  ${q.q}`, (answer) => {
        if (q.type === "number") answers[q.key] = parseInt(answer) || 50;
        else answers[q.key] = answer.toLowerCase().startsWith("y");
        i++;
        askNext();
      });
    }
    askNext();
  },

  "psych": (args) => {
    const mood = args[0] || "calm";
    const result = core.psychCheck(mood);
    printSection("فحص نفسي", result);
  },

  "evaluate": (args) => {
    // evaluate NQ LONG 21500 21480 21540 1
    if (args.length < 6) {
      console.log("  Usage: evaluate <symbol> <direction> <entry> <stop> <target> <contracts>");
      console.log("  Example: evaluate NQ LONG 21500 21480 21540 1");
      return;
    }
    const setup = {
      symbol: args[0].toUpperCase(),
      direction: args[1].toUpperCase(),
      entryPrice: parseFloat(args[2]),
      stopPrice: parseFloat(args[3]),
      targetPrice: parseFloat(args[4]),
      contracts: parseInt(args[5]) || 1,
      reason: args.slice(6).join(" ") || "CLI evaluation",
    };
    const result = core.evaluateTrade(setup);
    printSection("تقييم الصفقة", result);
  },

  "record": (args) => {
    // record NQ LONG 21500 21530 1 750
    if (args.length < 6) {
      console.log("  Usage: record <symbol> <direction> <entry> <exit> <contracts> <pnl>");
      return;
    }
    const trade = {
      symbol: args[0].toUpperCase(),
      direction: args[1].toUpperCase(),
      entryPrice: parseFloat(args[2]),
      exitPrice: parseFloat(args[3]),
      contracts: parseInt(args[4]) || 1,
      pnl: parseFloat(args[5]),
      rMultiple: parseFloat(args[5]) / (core.state.getStatus().maxRisk || 500),
      entryReason: "CLI record",
      exitReason: "CLI record",
      emotionalState: "N/A",
      timestamp: new Date().toISOString(),
    };
    const result = core.recordTrade(trade);
    printSection("تسجيل الصفقة", result);
  },

  "size": (args) => {
    const symbol = (args[0] || "NQ").toUpperCase();
    const stop = parseInt(args[1]) || 15;
    const result = core.risk.quickSizeRecommendation(symbol, stop);
    console.log("\n" + result.summary_ar.join("\n") + "\n");
  },

  "story": () => {
    const result = core.trading.storyChangedCheck({
      symbol: "NQ", direction: "LONG", entryPrice: 0,
    });
    printSection("هل تغيرت القصة؟", result);
  },

  "status": () => {
    const s = core.dashboard();
    const pnl = s.todayPnL >= 0 ? `🟢 +$${s.todayPnL}` : `🔴 -$${Math.abs(s.todayPnL)}`;
    const canTrade = s.canTrade.allowed ? "✅ نعم" : `🛑 لا (${s.canTrade.reasons.join(", ")})`;
    console.log(`
═══════════════════════════════════════
  🐺 DHEEB TRADING MIND — Dashboard
═══════════════════════════════════════
  💰 الرصيد:    $${s.balance.toFixed(0)}
  ${pnl} اليوم
  📊 الأسبوع:   $${s.weekPnL.toFixed(0)}
  📉 السحب:     ${s.drawdownPercent}% ${s.drawdownLevel ? `(${s.drawdownLevel})` : ""}
  ─────────────────────────────────────
  📈 صفقات:     ${s.todayTrades}/4
  💵 متبقي:     $${s.remainingDailyRisk} يومي | $${s.remainingWeeklyRisk} أسبوعي
  📋 Checklist:  ${s.checklistDone ? "✅" : "❌"}
  🧠 نفسي:      ${s.psychCleared ? "✅" : "❌"}
  ${canTrade} يمكن التداول
═══════════════════════════════════════
`);
  },

  "review": () => {
    const result = core.endOfDay();
    printSection("مراجعة نهاية اليوم", result);
  },

  "weekly": () => {
    const result = core.weeklyReview();
    printSection("مراجعة أسبوعية", result);
  },

  "advice": (args) => {
    const scenario = args[0] || "noSetup";
    const result = core.getAdvice(scenario);
    printSection("نصيحة", result);
  },

  "reset": () => {
    const result = core.reset();
    console.log(`\n  🔄 ${result.message_ar}\n`);
  },

  "help": () => {
    console.log(`
═══════════════════════════════════════
  🐺 DHEEB TRADING MIND — Commands
═══════════════════════════════════════
  start                          بدء الجلسة
  checklist                      قائمة الفحص (تفاعلي)
  psych <mood>                   فحص نفسي
    moods: calm, focused, anxious, revenge, fomo,
           euphoria, anger, fatigue, sleep_deprived,
           overconfident, bored, distracted
  evaluate <sym> <dir> <entry> <stop> <target> <qty>
                                 تقييم صفقة
  record <sym> <dir> <entry> <exit> <qty> <pnl>
                                 تسجيل صفقة
  size [symbol] [stop_points]    حساب الحجم
  story                          هل تغيرت القصة؟
  status                         لوحة التحكم
  review                         مراجعة نهاية اليوم
  weekly                         مراجعة أسبوعية
  advice <scenario>              نصيحة
    scenarios: winningStreak, losingStreak, revenge,
               overtrading, newsDay, fridayAfternoon,
               drawdownRecovery, noSetup
  reset                          إعادة تعيين
  help                           المساعدة
  exit                           خروج
═══════════════════════════════════════
`);
  },
};

// ─── Printer ───
function printSection(title, data) {
  console.log(`\n  ═══ ${title} ═══`);
  if (typeof data === "string") {
    console.log(`  ${data}`);
  } else if (data.sections) {
    for (const s of data.sections) {
      console.log(`\n  ${s.title_ar || s.title_en || ""}`);
      for (const line of s.content_ar || s.content_en || []) {
        console.log(`    ${line}`);
      }
    }
  } else if (data.message_ar) {
    console.log(`  ${data.message_ar}`);
  } else if (data.messages) {
    for (const m of data.messages) {
      console.log(`  ${m.ar || JSON.stringify(m)}`);
    }
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log();
}

// ─── Interactive Mode ───
function startInteractive() {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🐺 DHEEB TRADING MIND v1.0         ║
║   Trading Psychology & Risk System    ║
║                                       ║
║   Based on: Raschke · Carter          ║
║             Hougaard · Wieland        ║
║                                       ║
╚═══════════════════════════════════════╝
  Type 'help' for commands | 'exit' to quit
`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "🐺 dheeb> ",
  });

  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }
    if (input === "exit" || input === "quit" || input === "خروج") {
      console.log("\n  🐺 Trading Mind: السوق مفتوح غداً. استرح.\n");
      rl.close();
      process.exit(0);
    }

    const [cmd, ...args] = input.split(/\s+/);
    const handler = COMMANDS[cmd.toLowerCase()];

    if (handler) {
      handler(args);
    } else {
      console.log(`  ❓ أمر غير معروف: ${cmd}. جرب 'help'`);
    }

    // Re-prompt after async commands
    setTimeout(() => rl.prompt(), 100);
  });
}

// ─── One-shot or Interactive ───
const args = process.argv.slice(2);
if (args.length > 0) {
  const [cmd, ...rest] = args;
  const handler = COMMANDS[cmd.toLowerCase()];
  if (handler) handler(rest);
  else console.log(`Unknown command: ${cmd}`);
} else {
  startInteractive();
}
