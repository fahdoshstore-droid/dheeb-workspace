// Vercel Serverless Function for Kimi Vision API
// Path: /api/analyze.js

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, player, apiKey } = req.body;

  if (!image || !player) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const KIMI_API_KEY = apiKey || process.env.KIMI_API_KEY;

  if (!KIMI_API_KEY) {
    return res.status(401).json({ error: 'Kimi API key not configured' });
  }

  const prompt = `أنت محلل رياضي متخصص في كرة القدم. حلل هذه الصورة للاعب ${player.name} (عمر ${player.age}، مركز ${player.position}). أعطني تقييماً تفصيلياً للمهارات التالية بدرجات من 0-100:
- السرعة (speed)
- التمرير (passing)
- التسديد (shooting)
- المراوغة (dribbling)
- التمركز (positioning)
- اللياقة (stamina)
- الرؤية (vision)
- الدفاع (defending)

ثم أعطني:
1. درجة عامة (0-100)
2. ملاحظات فنية (3 نقاط)
3. نقاط القوة (3)
4. نقاط الضعف (3)
5. توصية تدريبية
6. لاعب مشهور يشبه أسلوبه

أرجع النتيجة كـ JSON فقط بدون أي نص إضافي:
{
  "skills": {"speed":85, "passing":78, "shooting":82, "dribbling":79, "positioning":76, "stamina":88, "vision":74, "defending":45},
  "overall": 78,
  "observations": ["...", "...", "..."],
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "recommendation": "...",
  "similarPlayer": "..."
}`;

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Send to OpenClaw webhook if configured
    if (process.env.OPENCLAW_WEBHOOK) {
      fetch(process.env.OPENCLAW_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'kimi_analysis_complete',
          timestamp: new Date().toISOString(),
          player,
          result
        })
      }).catch(() => {});
    }

    return res.status(200).json({ success: true, data: result, raw: content });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
}
