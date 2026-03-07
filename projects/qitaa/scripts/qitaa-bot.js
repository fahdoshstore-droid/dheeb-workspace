#!/usr/bin/env node

/**
 * QITAA MVP - Simple Car Parts Bot
 * Version: 1.0
 * Status: Ready to test
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Configuration
const CONFIG = {
  // Add your credentials here
  whatsapp: {
    puppeteer: {
      headless: true,
      args: ['--no-sandbox']
    }
  },
  sheets: {
    // Service account credentials
    credentials: {},
    spreadsheetId: 'YOUR_SHEET_ID'
  }
};

// Simple state machine
const STATES = {
  START: 'start',
  CAR_MODEL: 'car_model',
  PART_NEEDED: 'part_needed',
  QUOTE: 'quote',
  CONFIRM: 'confirm',
  DONE: 'done'
};

// User sessions
const sessions = new Map();

// Quick replies database
const QUICK_REPLIES = {
  en: {
    greeting: "Hello! 👋\nWelcome to QITAA Car Parts.\n\nPlease tell me:\n1. Car Model (e.g., Lexus ES 300)\n2. Part needed",
    carModel: "Got it! What specific part do you need?\n(e.g., Alternator, Headlight, Bumper)",
    quote: "Thank you! One moment please...\nI'll check the price and get back to you.",
    confirm: "Perfect! Here's your quote:\n\nPart: {part}\nPrice: {price} SAR\nDelivery: {days} days\n\nReply YES to confirm or NO to cancel.",
    thanks: "Thank you for choosing QITAA! 🎉\n\nWe'll send you the payment details shortly.",
    notFound: "Sorry, I didn't understand. Please try again or call us directly.",
    working: "We're working on it! ✅"
  },
  ar: {
    greeting: "مرحباً! 👋\nأهلاً بك في قطع غيار قيطاء.\n\nأخبرني:\n1. موديل السيارة\n2. القطعة المطلوبة",
    carModel: "تم! أي قطعة تحتاج؟\n(مثال: دينامو، نور، صدام)",
    quote: "شكراً! لحظة واحدة...\nجاري проверка السعر",
    confirm: "ممتاز! هذالسعر:\n\nالقطعة: {part}\nالسعر: {price} ريال\nالتوصيل: {days} أيام\n\nأرسل نعم للتأكيد أو لا للإلغاء",
    thanks: "شكراً لاختيارك قيطاء! 🎉\n\nسنرسل لك بيانات الدفع قريباً",
    notFound: "مع الأسف لم أفهم. حاول مرة أخرى",
    working: "نحن نعمل على ذلك! ✅"
  }
};

// Initialize WhatsApp client
let client;

async function initWhatsApp() {
  console.log('🤖 QITAA Bot Starting...');
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth'
    }),
    puppeteer: CONFIG.whatsapp.puppeteer
  });

  client.on('ready', () => {
    console.log('✅ QITAA Bot is ready!');
  });

  client.on('message', async (message) => {
    await handleMessage(message);
  });

  client.on('disconnected', () => {
    console.log('⚠️ Bot disconnected. Reconnecting...');
    initWhatsApp();
  });

  await client.initialize();
}

async function handleMessage(message) {
  const from = message.from;
  const body = message.body.toLowerCase().trim();
  
  console.log(`📩 Message from ${from}: ${body}`);

  // Get or create session
  if (!sessions.has(from)) {
    sessions.set(from, { state: STATES.START, data: {} });
  }
  
  const session = sessions.get(from);

  // Handle commands
  if (body === '/start' || body === 'hi' || body === 'مرحبا' || body === 'hello') {
    await message.reply(QUICK_REPLIES.ar.greeting);
    session.state = STATES.CAR_MODEL;
    return;
  }

  // State machine
  switch (session.state) {
    case STATES.CAR_MODEL:
      session.data.carModel = message.body;
      session.state = STATES.PART_NEEDED;
      await message.reply(QUICK_REPLIES.ar.carModel);
      break;

    case STATES.PART_NEEDED:
      session.data.part = message.body;
      session.state = STATES.QUOTE;
      await message.reply(QUICK_REPLIES.ar.quote);
      // Simulate price check
      setTimeout(async () => {
        const price = Math.floor(Math.random() * 500) + 100;
        session.data.price = price;
        session.data.days = Math.floor(Math.random() * 7) + 3;
        session.state = STATES.CONFIRM;
        await message.reply(
          QUICK_REPLIES.ar.confirm
            .replace('{part}', session.data.part)
            .replace('{price}', price)
            .replace('{days}', session.data.days)
        );
      }, 2000);
      break;

    case STATES.CONFIRM:
      if (body === 'نعم' || body === 'yes' || body === 'y') {
        await message.reply(QUICK_REPLIES.ar.thanks);
        await logToSheet(session.data);
        session.state = STATES.DONE;
      } else if (body === 'لا' || body === 'no' || body === 'n') {
        await message.reply("تم الإلغاء.有任何需要再次联系我们!");
        session.state = STATES.START;
      } else {
        await message.reply(QUICK_REPLIES.ar.notFound);
      }
      break;

    default:
      await message.reply(QUICK_REPLIES.ar.greeting);
      session.state = STATES.CAR_MODEL;
  }
}

async function logToSheet(data) {
  // Placeholder for Google Sheets integration
  console.log('📊 Lead logged:', data);
  // TODO: Implement Google Sheets API
}

// Start bot
if (require.main === module) {
  initWhatsApp().catch(console.error);
}

module.exports = { initWhatsApp, handleMessage };
