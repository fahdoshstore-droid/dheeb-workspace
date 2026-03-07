/**
 * Event Bus - Internal messaging for Multi-Agent System
 * Pub/Sub pattern for agent communication
 */

const EventEmitter = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.subscribers = new Map();
        this.messageLog = [];
        this.maxLog = 100;
    }

    // Subscribe agent to events
    subscribe(agentId, events) {
        if (!this.subscribers.has(agentId)) {
            this.subscribers.set(agentId, []);
        }
        
        events.forEach(event => {
            this.on(event, (data) => {
                this.log(agentId, event, data);
            });
            this.subscribers.get(agentId).push(event);
        });
        
        console.log(`📬 ${agentId} subscribed to: ${events.join(', ')}`);
    }

    // Publish event
    publish(event, data) {
        this.log('SYSTEM', event, data);
        this.emit(event, data);
    }

    // Log messages
    log(source, event, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            source,
            event,
            data
        };
        this.messageLog.push(entry);
        
        if (this.messageLog.length > this.maxLog) {
            this.messageLog.shift();
        }
    }

    // Get recent logs
    getLogs(agentId = null, limit = 20) {
        if (agentId) {
            return this.messageLog
                .filter(l => l.source === agentId)
                .slice(-limit);
        }
        return this.messageLog.slice(-limit);
    }

    // Get subscribers
    getSubscribers() {
        return Array.from(this.subscribers.keys());
    }
}

module.exports = new EventBus();
