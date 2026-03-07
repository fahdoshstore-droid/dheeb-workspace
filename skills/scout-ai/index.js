/**
 * SCOUT AI Skill for OpenClaw
 * 
 * Usage:
 * clow skill add scout-ai
 * clow scout analyze --image player.jpg --name "محمد" --age 17
 */

module.exports = {
  name: 'scout-ai',
  version: '1.0.0',
  description: 'AI-powered football talent scouting',
  
  commands: {
    analyze: {
      description: 'Analyze player image with Kimi Vision',
      args: [
        { name: 'image', type: 'string', required: true, description: 'Path to player image' },
        { name: 'name', type: 'string', required: true, description: 'Player name' },
        { name: 'age', type: 'number', required: true, description: 'Player age' },
        { name: 'position', type: 'string', default: 'مهاجم', description: 'Player position' }
      ],
      async execute({ image, name, age, position }, { api, config }) {
        const fs = require('fs');
        const path = require('path');
        
        // Read and encode image
        const imageBuffer = fs.readFileSync(path.resolve(image));
        const base64Image = imageBuffer.toString('base64');
        
        // Call Kimi API
        const response = await api.call('kimi', {
          model: 'moonshot-v1-8k-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `Analyze this football player: ${name}, ${age} years old, position: ${position}. Rate skills 0-100: speed, passing, shooting, dribbling, positioning, stamina, vision, defending. Return JSON.` },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }]
        });
        
        // Parse result
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const result = JSON.parse(jsonMatch[0]);
        
        // Store in database
        await api.db.insert('scouts', {
          player_name: name,
          age,
          position,
          analysis: result,
          created_at: new Date().toISOString()
        });
        
        // Send notification
        await api.notify(`Analysis complete for ${name}: ${result.overall}/100`);
        
        return {
          success: true,
          player: name,
          score: result.overall,
          skills: result.skills,
          recommendation: result.recommendation
        };
      }
    },
    
    list: {
      description: 'List all scouted players',
      async execute(_, { api }) {
        const players = await api.db.query('SELECT * FROM scouts ORDER BY created_at DESC');
        return {
          count: players.length,
          players: players.map(p => ({
            name: p.player_name,
            score: p.analysis?.overall || 'N/A',
            date: p.created_at
          }))
        };
      }
    },
    
    report: {
      description: 'Generate WhatsApp report',
      args: [
        { name: 'id', type: 'number', required: true, description: 'Player ID' },
        { name: 'phone', type: 'string', required: true, description: 'Parent phone number' }
      ],
      async execute({ id, phone }, { api }) {
        const player = await api.db.queryOne('SELECT * FROM scouts WHERE id = ?', [id]);
        if (!player) throw new Error('Player not found');
        
        const msg = `السلام عليكم،

تقرير ${player.player_name}:
التقييم: ${player.analysis.overall}/100
المركز الأنسب: ${player.analysis.bestPosition || player.position}

للتفاصيل: https://scout-ai.dheeb.com/player/${id}`;
        
        await api.whatsapp.send(phone, msg);
        
        return { sent: true, to: phone };
      }
    }
  },
  
  hooks: {
    onInstall: async ({ api }) => {
      // Create table
      await api.db.exec(`
        CREATE TABLE IF NOT EXISTS scouts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_name TEXT NOT NULL,
          age INTEGER,
          position TEXT,
          analysis JSON,
          image_path TEXT,
          parent_phone TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('SCOUT AI: Database ready');
    },
    
    onWebhook: async (payload, { api }) => {
      // Handle webhooks from frontend
      if (payload.event === 'analysis_started') {
        console.log('Analysis started:', payload.player);
      }
      if (payload.event === 'analysis_completed') {
        await api.notify(`New analysis: ${payload.player.name} - ${payload.data.finalScore}/100`);
      }
    }
  }
};
