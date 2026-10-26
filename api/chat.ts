import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI API key not configured on server' });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres un asistente virtual amable y breve para una fintech en español.' },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.2
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('OpenAI error', r.status, text);
      return res.status(502).json({ error: 'AI provider error', details: text });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('chat proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
