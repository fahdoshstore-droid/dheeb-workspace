#!/usr/bin/env node
/**
 * 🐺 CONSENSUS ENGINE
 * Primary + Shadow A/B + Consensus
 */

const axios = require('axios');

const MODELS = {
  primary: { endpoint: 'http://localhost:8080', name: 'Primary' },
  shadowA: { endpoint: 'http://localhost:8081', name: 'Shadow A' },
  shadowB: { endpoint: 'http://localhost:8082', name: 'Shadow B' }
};

async function queryAgent(agent, prompt) {
  try {
    // Simulated - replace with real API calls
    return {
      agent: agent.name,
      response: `Analysis from ${agent.name}`,
      confidence: Math.random() * 0.3 + 0.7 // 70-100%
    };
  } catch (e) {
    return { agent: agent.name, error: e.message };
  }
}

async function consensus(prompt) {
  console.log('🗳️ Running consensus...');
  
  const results = await Promise.all([
    queryAgent(MODELS.primary, prompt),
    queryAgent(MODELS.shadowA, prompt),
    queryAgent(MODELS.shadowB, prompt)
  ]);
  
  // Calculate consensus
  const agreeCount = results.filter(r => !r.error).length;
  const confidence = agreeCount / 3;
  
  return {
    results,
    consensus: agreeCount >= 2,
    confidence,
    final: agreeCount >= 2 ? 'PROCEED' : 'REVIEW'
  };
}

// CLI
const args = process.argv.slice(2);
if (args.length > 0) {
  consensus(args.join(' ')).then(r => console.log(JSON.stringify(r, null, 2)));
} else {
  console.log('Usage: node consensus-agent.js "<prompt>"');
}
