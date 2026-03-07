/**
 * Queue Manager - Priority Trading Messages
 */

class QueueManager {
  constructor() {
    this.queue = [];
    this.priority = {
      CRITICAL: 1,   // Entry/Exit alerts
      HIGH: 2,       // Kill Zone alerts
      MEDIUM: 3,     // Analysis requests
      LOW: 4         // General messages
    };
  }

  add(message, priority = 'MEDIUM') {
    this.queue.push({
      message,
      priority: this.priority[priority],
      timestamp: Date.now()
    });
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  process() {
    return this.queue.shift();
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

module.exports = new QueueManager();
