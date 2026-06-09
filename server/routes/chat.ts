import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { messages, model, sessionId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages requis' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY non configurée' });
    return;
  }

  const selectedModel = model || 'openai/gpt-4o';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aegis-flow.insforge.site',
        'X-Title': 'Aegis Flow',
      },
      body: JSON.stringify({ model: selectedModel, messages, stream: true, max_tokens: 4096 }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      res.status(response.status).json({ error: `OpenRouter ${response.status}: ${err}` });
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') && !response.body) {
      const text = await response.text();
      res.json({ content: text });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = response.body?.getReader();
    if (!reader) {
      res.status(502).json({ error: 'Stream non disponible' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            res.write(`data: ${JSON.stringify({ type: 'text', content })}\n\n`);
          }
        } catch { /* skip malformed lines */ }
      }
    }

    if (sessionId) {
      try {
        const userMsg = messages[messages.length - 1]?.content || '';
        const assistantMsg = fullContent;
        await pool.query(
          `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
          [sessionId, userMsg, assistantMsg]
        );
      } catch (e) {
        console.error('Failed to persist chat:', e);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done', usage: { totalTokens: 0 } })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: err.message || 'Erreur proxy chat' });
      return;
    }
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

router.get('/sessions', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT session_id,
              COUNT(*)::int AS message_count,
              MIN(created_at) AS first_message,
              MAX(created_at) AS last_message,
              MAX(CASE WHEN role = 'user' THEN content END) AS last_user_message
       FROM chat_messages
       GROUP BY session_id
       ORDER BY last_message DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, session_id, role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    await pool.query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
