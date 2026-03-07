#!/usr/bin/env node
/**
 * 🧠 DHEEB MEMORY SYSTEM
 * PostgreSQL + pgvector based
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'dheeb',
  user: 'postgres',
  password: 'password'
});

// Simple embedding function (placeholder - use real embedding API)
function createEmbedding(text) {
  // Create a simple hash-based vector for now
  const hash = simpleHash(text);
  const vector = new Array(1536).fill(0).map((_, i) => Math.sin(hash * (i + 1)) * Math.cos(hash * (i + 1)));
  return vector;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function saveMemory(label, content) {
  try {
    await client.connect();
    const embedding = createEmbedding(content);
    
    const result = await client.query(
      'INSERT INTO memories (label, content, embedding) VALUES ($1, $2, $3) RETURNING id',
      [label, content, JSON.stringify(embedding)]
    );
    
    console.log(`✅ Memory saved: ${label} (ID: ${result.rows[0].id})`);
    return { success: true, id: result.rows[0].id };
  } catch (e) {
    console.log('❌ Error:', e.message);
    return { success: false, error: e.message };
  } finally {
    await client.end();
  }
}

async function searchMemory(query, limit = 5) {
  try {
    await client.connect();
    const embedding = createEmbedding(query);
    
    // Simple similarity search (not using vector similarity yet)
    const result = await client.query(
      `SELECT id, label, content, created_at 
       FROM memories 
       WHERE label ILIKE $1 OR content ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    
    console.log(`🔍 Found ${result.rows.length} memories`);
    return result.rows;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return [];
  } finally {
    await client.end();
  }
}

async function getAllMemories(limit = 20) {
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, label, content, created_at FROM memories ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return [];
  } finally {
    await client.end();
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'save') {
  const label = args[1];
  const content = args.slice(2).join(' ');
  saveMemory(label, content);
} else if (command === 'search') {
  const query = args.slice(1).join(' ');
  searchMemory(query).then(results => {
    console.log(JSON.stringify(results, null, 2));
  });
} else if (command === 'list') {
  getAllMemories().then(results => {
    console.log(JSON.stringify(results, null, 2));
  });
} else {
  console.log('Usage:');
  console.log('  node memory.js save <label> <content>');
  console.log('  node memory.js search <query>');
  console.log('  node memory.js list');
}
