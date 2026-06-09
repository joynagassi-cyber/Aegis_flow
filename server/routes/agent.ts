import { Router } from 'express';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, stepCountIs } from 'ai';
import { createAgentTools, createLocalSandbox } from 'bashkit';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';

const router = Router();

const sandboxes = new Map<string, ReturnType<typeof createLocalSandbox>>();

const isVercel = !!process.env.VERCEL;
const WORKSPACE_ROOT = isVercel ? '/tmp/workspace' : path.join(process.cwd(), 'workspace');

function getSandbox(sessionId: string) {
  if (sandboxes.has(sessionId)) return sandboxes.get(sessionId)!;
  const dir = path.join(WORKSPACE_ROOT, sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const sandbox = createLocalSandbox({ cwd: dir });
  sandboxes.set(sessionId, sandbox);
  return sandbox;
}

async function createTools(sandbox: ReturnType<typeof createLocalSandbox>) {
  return createAgentTools(sandbox, {
    tools: {
      Bash: { timeout: 60000, maxOutputLength: 100000 },
      Write: { maxFileSize: 5_000_000 },
    },
  });
}

router.post('/chat', async (req, res) => {
  const { messages, model: modelName, sessionId } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const sandbox = getSandbox(sessionId || 'default');

    const { tools } = await createTools(sandbox);

    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      headers: {
        'HTTP-Referer': 'https://aegis-flow.insforge.site',
        'X-Title': 'Aegis Flow Dashboard',
      },
    });

    const model = openrouter.chat(modelName || 'openai/gpt-4o');

    const result = streamText({
      model,
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant agentique intégré au dashboard Aegis Flow.

Tu disposes d'OUTILS puissants pour aider l'utilisateur :
1. **Bash** — Exécuter des commandes shell (terminal)
2. **Read** — Lire des fichiers ou lister des dossiers
3. **Write** — Créer/écrire des fichiers
4. **Edit** — Modifier des fichiers (remplacement de chaîne)
5. **Glob** — Chercher des fichiers par pattern
6. **Grep** — Chercher dans le contenu des fichiers

RÈGLES :
- Tu travailles dans un espace de travail ISOLÉ (sandbox). Tu peux tout y faire.
- Explique toujours ce que tu vas faire avant d'utiliser un outil.
- Réponds en markdown.
- Sois concis et proactif. Propose des solutions, ne te contente pas de répondre.
- Tu peux exécuter plusieurs outils à la suite pour accomplir une tâche complexe.
- Pour le terminal : exécute des commandes bash. Tu peux installer des packages, lancer des scripts, etc.`,
        },
        ...messages,
      ],
      tools,
      stopWhen: stepCountIs(25),
      maxRetries: 0,
    });

    let fullContent = '';

    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case 'text-delta':
          fullContent += chunk.text || '';
          res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
          break;
        case 'tool-call':
          res.write(`data: ${JSON.stringify({ type: 'tool-start', toolName: chunk.toolName, args: chunk.input, id: chunk.toolCallId })}\n\n`);
          break;
        case 'tool-result':
          res.write(`data: ${JSON.stringify({ type: 'tool-result', id: chunk.toolCallId, result: chunk.output })}\n\n`);
          break;
        case 'error':
          res.write(`data: ${JSON.stringify({ type: 'error', error: typeof chunk.error === 'string' ? chunk.error : String(chunk.error) })}\n\n`);
          break;
        case 'finish':
          res.write(`data: ${JSON.stringify({ type: 'done', finishReason: chunk.finishReason, usage: chunk.totalUsage })}\n\n`);
          break;
      }
    }

    if (sessionId && fullContent) {
      try {
        const userMsg = messages[messages.length - 1]?.content || '';
        await pool.query(
          `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
          [sessionId, userMsg, fullContent]
        );
      } catch (e) {
        console.error('Failed to persist agent chat:', e);
      }
    }
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

router.get('/workspace/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const targetDir = sessionId.startsWith('dir:')
    ? sessionId.slice(4)
    : path.join(WORKSPACE_ROOT, sessionId);
  try {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const tree = entries
      .filter(e => !e.name.startsWith('.'))
      .map(e => {
        const fullPath = path.join(targetDir, e.name);
        const relPath = path.relative(WORKSPACE_ROOT, fullPath);
        if (e.isDirectory()) {
          const children = fs.readdirSync(fullPath, { withFileTypes: true })
            .filter(c => !c.name.startsWith('.'))
            .map(c => ({
              name: c.name,
              path: path.join(relPath, c.name),
              type: c.isDirectory() ? 'dir' : 'file' as const,
            }));
          return { name: e.name, path: relPath, type: 'dir' as const, children };
        }
        return { name: e.name, path: relPath, type: 'file' as const };
      });
    res.json(tree);
  } catch {
    res.json([]);
  }
});

router.delete('/sandbox/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const sandbox = sandboxes.get(sessionId);
  if (sandbox) {
    try { await sandbox.destroy(); } catch {}
    sandboxes.delete(sessionId);
  }
  res.json({ ok: true });
});

export default router;
