#!/usr/bin/env node

/**
 * DHEEB Real-Time Coaching System
 * تشغيل النظام الكامل:
 * - Telegram Bot (Real-time alerts)
 * - Notion Integration (Data storage)
 * - Psychological Analyzer (Live personality detection)
 * - Master Coach (Analysis + Planning)
 * 
 * استخدام:
 * node run-coach.js
 * 
 * أو مع pm2:
 * pm2 start run-coach.js --name "dheeb-coach"
 * pm2 logs dheeb-coach
 */

require('dotenv').config();

const TelegramCoach = require('./telegram-coach');
const NotionIntegration = require('./notion-integration');
const MasterCoach = require('./master-coach');

// التحقق من المتطلبات
function validateEnvironment() {
  const required = ['TELEGRAM_BOT_TOKEN', 'NOTION_API_KEY', 'TELEGRAM_CHAT_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ متطلبات ناقصة:');
    missing.forEach(key => {
      console.error(`  - ${key}`);
    });
    console.error('\n📝 أضف هذه المتغيرات في .env file:');
    console.error(`TELEGRAM_BOT_TOKEN=your_token_here`);
    console.error(`NOTION_API_KEY=your_key_here`);
    console.error(`TELEGRAM_CHAT_ID=your_chat_id_here`);
    process.exit(1);
  }

  return true;
}

// بدء النظام
async function startCoachingSystem() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         🐺 DHEEB COACHING SYSTEM - نظام التدريب المباشر    ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    // التحقق من البيئة
    validateEnvironment();

    // 1. إنشاء مثيل TelegramCoach
    console.log('📱 جاري تهيئة Telegram Bot...');
    const coach = new TelegramCoach(process.env.TELEGRAM_BOT_TOKEN);
    
    // 2. اختبار الاتصال بـ Notion
    console.log('📋 جاري اختبار الاتصال بـ Notion...');
    const notion = new NotionIntegration(process.env.NOTION_API_KEY);
    const notionTest = await notion.testConnection();
    
    if (!notionTest.success) {
      console.error('❌ فشل الاتصال بـ Notion');
      console.error('تأكد من:');
      console.error('  1. مفتاح API صحيح');
      console.error('  2. استقبلت invitation من Notion');
      console.error('  3. قبلت الـ invitation');
      process.exit(1);
    }
    
    console.log('✅ Notion متصل');

    // 3. بدء الـ Bot
    console.log('🤖 جاري بدء Telegram Bot...');
    await coach.start();
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              ✅ النظام جاهز للعمل                          ║
╚════════════════════════════════════════════════════════════╝

🔗 رابط Telegram Bot: @DiscoFahad_bot
📊 Notion Dashboard: متصل ✅
🧠 Psychological Analyzer: نشط ✅

⏰ الأوامر المتاحة:
  /start          - ابدأ جلسة جديدة
  /check          - Pre-Trade Checklist
  /analyze        - تحليل الصفقة
  /personality    - من حاضر الآن؟
  /plan           - خطتك اليومية
  /stats          - إحصائياتك

⚠️ أهم القواعس:
  • Max 2 صفقات يومياً
  • RRR = 1:2 دقيق
  • Daily Loss < $600
  • بلا انتقام. بلا FOMO.

📱 أرسل رسالة في Telegram الآن لبدء الجلسة...
    `);

    // 4. معالج الخروج النظيف
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 إيقاف النظام...');
      await coach.stop();
      console.log('✅ تم الإيقاف');
      process.exit(0);
    });

    // 5. مراقبة الأخطاء
    process.on('unhandledRejection', (error) => {
      console.error('❌ خطأ غير معالج:', error);
    });

  } catch (error) {
    console.error('❌ فشل بدء النظام:', error.message);
    process.exit(1);
  }
}

// تشغيل النظام
startCoachingSystem();
