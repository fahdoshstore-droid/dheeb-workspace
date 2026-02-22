/**
 * WhatsApp Notifier
 * Sends notifications via OpenClaw
 */

class WhatsAppNotifier {
  constructor(target) {
    this.target = target;
    this.exec = require('child_process').exec;
  }
  
  async send(analysis) {
    const message = this.formatMessage(analysis);
    
    return new Promise((resolve, reject) => {
      const cmd = `openclaw message send --channel whatsapp --target ${this.target} --message "${message.replace(/"/g, '\\"')}"`;
      
      this.exec(cmd, (err, stdout, stderr) => {
        if (err) {
          console.log('WhatsApp error:', err.message);
          resolve(false);
        } else {
          console.log('WhatsApp sent');
          resolve(true);
        }
      });
    });
  }
  
  formatMessage(analysis) {
    let msg = '📊 *Dheeb Alert*\n\n';
    msg += `Signal: ${analysis.raw}\n`;
    msg += `Price: ${analysis.parsed.price}\n`;
    msg += `Zone: ${analysis.recommendation.zone}\n`;
    msg += `\n${analysis.recommendation.message}`;
    
    return msg;
  }
}

module.exports = WhatsAppNotifier;
