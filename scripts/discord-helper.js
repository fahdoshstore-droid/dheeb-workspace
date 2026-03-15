/**
 * Discord Helper - Send messages to Discord
 * Usage: node discord-helper.js "Your message"
 *        node discord-helper.js "message" channelId
 */

const axios = require('axios');

// Config - Can be overridden via args
const CONFIG = {
  botToken: process.env.DISCORD_BOT_TOKEN || 'MTQ3OTU5ODI5MjIwNjc0NzgzOQ.GMHVhg.-bgMhUMBWYspsQbqcB-k2Nuntaq6NunqonTgA0',
  defaultChannel: process.env.DISCORD_CHANNEL_ID || '1479637780500840701'
};

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node discord-helper.js "Your message"');
  console.log('  node discord-helper.js "Your message" channelId');
  console.log('  node discord-helper.js --test');
  process.exit(0);
}

if (args[0] === '--test') {
  testConnection();
  process.exit(0);
}

const message = args[0];
const channelId = args[1] || CONFIG.defaultChannel;

sendMessage(message, channelId)
  .then(result => {
    console.log('✅ Message sent:', result.id);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  });

async function sendMessage(content, channelId) {
  const response = await axios.post(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    { content },
    {
      headers: {
        'Authorization': `Bot ${CONFIG.botToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

async function testConnection() {
  try {
    // Test bot
    const botInfo = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { 'Authorization': `Bot ${CONFIG.botToken}` }
    });
    console.log('✅ Bot:', botInfo.data.username + '#' + botInfo.data.discriminator);

    // Test channel
    const channelInfo = await axios.get(
      `https://discord.com/api/v10/channels/${CONFIG.defaultChannel}`,
      { headers: { 'Authorization': `Bot ${CONFIG.botToken}` } }
    );
    console.log('✅ Channel:', channelInfo.data.name);

    // Send test message
    await sendMessage('🧪 DHEEB Helper Test - OK', CONFIG.defaultChannel);
    console.log('✅ Test message sent');

  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}
