import { Router } from 'express';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, stepCountIs, jsonSchema } from 'ai';
import { createAgentTools, createLocalSandbox } from 'bashkit';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';
import { buildProactiveContext } from '../services/proactivity.js';

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
    tools: { Bash: { timeout: 60000, maxOutputLength: 100000 }, Write: { maxFileSize: 5_000_000 } },
  });
}

async function webSearch(query: string): Promise<string> {
  try {
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    const abstract = data.AbstractText || '';
    const results = (data.RelatedTopics || []).slice(0, 5).map((t: any) => t.Text || t.Result || '').filter(Boolean);
    return [abstract, ...results].filter(Boolean).join('\n').slice(0, 5000);
  } catch {
    return `Recherche web pour: ${query}`;
  }
}

function buildSystemPrompt(userContext?: string, reasoning?: string, toolsEnabled?: boolean): string {
  let prompt = '';

  if (userContext) {
    prompt += `${userContext}\n\n---\n\n`;
  }

  prompt += `Tu es AEGIS, l'IA personnelle de Joy.

# RÔLE
- Assistant exécutif, stratège SaaS, coach GeoAI, chef de projet
- Tu aides Joy à accomplir sa mission 210 jours : SaaS 100K clients + maîtrise GeoAI

# CAPABILITÉS
- Tu connais en temps réel les KPI, checklists, discipline et progression
- Tu donnes des conseils entrepreneuriaux concrets, pas génériques
- Tu détectes les tendances et signales quand Joy dévie de ses objectifs
- Tu adaptes ton ton selon le contexte (briefing matin = motivant, soir = réflexif)

# STYLE
- Direct, motivateur, militaire-bienveillant
- Tu parles français
- Tu félicites les victoires et tu recadres les faiblesses sans complaisance
- Tu utilises des métaphores de combat, sport, guerre
- Concis mais complet — une idée principale + une action concrète par message
- Pas d'émojis abusifs

# FORMAT DE RÉPONSE
- Pour les conseils : 1 idée forte + 1 action immédiate
- Pour les résumés : bullet points
- Pour le coaching : challenger puis soutenir
- Tu peux générer du code, HTML, JSON, CSV dans des blocs \`\`\`lang

# EXEMPLES
User: "C'est quoi ma priorité aujourd'hui ?"
Assistant: "Jour 42. Priorité #1 : finaliser le tunnel Stripe (phase MVP). Ta checklist montre 5/8 items. Les 3 restants : webhook, page confirmation, test E2E. Attaque le webhook ce matin — c'est le bloquant."

User: "Je me suis relâché hier"
Assistant: "Une journée off ne définit pas ta mission. Aujourd'hui = réengagement. 1 seule chose : ton rituel de 10 min. Ensuite l'élan revient. La clé c'est la régularité, pas la perfection."`;

  if (reasoning && reasoning !== 'off') {
    const labels: Record<string, string> = { low: 'légère', medium: 'modérée', high: 'profonde', max: 'maximale' };
    prompt += `\n\n# RÉFLEXION\nMode raisonnement ${labels[reasoning] || reasoning}. Structure ta pensée, explore les alternatives, justifie tes conclusions.`;
  }

  if (toolsEnabled) {
    prompt += `\n\n# OUTILS DISPONIBLES
Tu disposes d'outils pour interagir avec le système de Joy :
1. **Bash** — Exécuter des commandes shell
2. **Read** — Lire des fichiers
3. **Write** — Créer/écrire des fichiers
4. **Edit** — Modifier des fichiers
5. **Glob** — Chercher des fichiers
6. **Grep** — Chercher dans le contenu
7. **web_search** — Rechercher sur le web
8. **get_checklists** — Lire les checklists SaaS ou GeoAI (utilise: "saas" ou "geoai" + sectionId)
9. **toggle_checklist** — Cocher/décocher un item de checklist
10. **get_kpis** — Consulter les KPI actuels (MRR, clients, streaks)

QUAND UTILISER LES OUTILS :
- web_search : pour toute question d'actualité, technique récente
- get_checklists : avant de suggérer des actions, vérifie la progression
- toggle_checklist : quand Joy te demande de cocher un item
- get_kpis : pour contextualiser les conseils avec les chiffres réels

RÈGLES OUTILS :
- Explique avant d'utiliser un outil
- Pour toggle_checklist, demande confirmation avant d'écrire
- Le sandbox bash est isolé du projet réel`;
  }

  return prompt;
}

router.post('/chat', async (req, res) => {
  const { messages, model: modelName, sessionId, reasoning, webSearchEnabled, context: userContext, tools: toolsEnabled } = req.body;
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
    const agentTools = await createTools(sandbox);

    const tools: Record<string, any> = {};

    if (toolsEnabled) {
      tools.web_search = {
        description: 'Recherche web pour obtenir des informations récentes',
        inputSchema: jsonSchema({
          type: 'object', properties: { query: { type: 'string', description: 'Requête précise' } },
          required: ['query'], additionalProperties: false,
        }),
        execute: async ({ query }: { query: string }) => webSearch(query),
      };

      tools.get_checklists = {
        description: 'Récupère la progression des checklists SaaS ou GeoAI. Objectif type: "saas" ou "geoai". SectionId: "mvp", "developpement", "1", "2", etc.',
        inputSchema: jsonSchema({
          type: 'object', properties: {
            objectiveType: { type: 'string', enum: ['saas', 'geoai'] },
            sectionId: { type: 'string' },
          },
          required: ['objectiveType', 'sectionId'], additionalProperties: false,
        }),
        execute: async ({ objectiveType, sectionId }: { objectiveType: string; sectionId: string }) => {
          try {
            const { rows } = await pool.query(
              `SELECT item_id, done FROM checklist_progress WHERE objective_type = $1 AND section_id = $2`,
              [objectiveType, sectionId]
            );
            return JSON.stringify(rows);
          } catch { return '[]'; }
        },
      };

      tools.toggle_checklist = {
        description: 'Coche ou décoche un item de checklist. Demande toujours confirmation avant.',
        inputSchema: jsonSchema({
          type: 'object', properties: {
            objectiveType: { type: 'string', enum: ['saas', 'geoai'] },
            sectionId: { type: 'string' },
            itemId: { type: 'string' },
            done: { type: 'boolean' },
          },
          required: ['objectiveType', 'sectionId', 'itemId', 'done'], additionalProperties: false,
        }),
        execute: async ({ objectiveType, sectionId, itemId, done }: { objectiveType: string; sectionId: string; itemId: string; done: boolean }) => {
          try {
            await pool.query(
              `INSERT INTO checklist_progress (objective_type, section_id, item_id, done, done_at, updated_at)
               VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN NOW() ELSE NULL END, NOW())
               ON CONFLICT (objective_type, section_id, item_id)
               DO UPDATE SET done = $4, done_at = CASE WHEN $4 THEN NOW() ELSE NULL END, updated_at = NOW()`,
              [objectiveType, sectionId, itemId, done]
            );
            return JSON.stringify({ ok: true });
          } catch (e: any) { return JSON.stringify({ error: e.message }); }
        },
      };

      tools.get_kpis = {
        description: 'Consulte les KPI actuels de Joy (MRR, clients, streaks, jour)',
        inputSchema: jsonSchema({
          type: 'object', properties: {}, additionalProperties: false,
        }),
        execute: async () => {
          return `KPI actuels de Joy (extraits du contexte utilisateur) : MRR, clients payants, features livrées, streaks anglais/sport, livres terminés, jour actuel.`;
        },
      };

      const bashTool = agentTools.tools;
      if (bashTool) {
        for (const [key, val] of Object.entries(bashTool)) {
          tools[key] = val;
        }
      }
    }

    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      headers: { 'HTTP-Referer': 'https://aegis-flow.insforge.site', 'X-Title': 'Aegis Flow' },
    });

    const model = openrouter.chat(modelName || 'openai/gpt-4o');
    const maxTokens = !reasoning || reasoning === 'off' ? 2048
      : reasoning === 'low' ? 4096 : reasoning === 'medium' ? 8192
      : reasoning === 'high' ? 16384 : 32000;

    let systemContent = buildSystemPrompt(userContext, reasoning, toolsEnabled);

    try {
      const proactive = await buildProactiveContext();
      systemContent += `\n\n---\n${proactive}`;
    } catch {}

    if (webSearchEnabled && !toolsEnabled) {
      try {
        const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
        if (lastUserMsg?.content) {
          const ctx = await webSearch(typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '');
          systemContent += `\n\nCONTEXTE WEB :\n${ctx}`;
        }
      } catch {}
    }

    const reasoningEffort = reasoning && reasoning !== 'off'
      ? ({ low: 'low', medium: 'medium', high: 'high', max: 'xhigh' } as Record<string, string>)[reasoning]
      : undefined;

    const result = streamText({
      model,
      maxOutputTokens: maxTokens,
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(25),
      maxRetries: 0,
      ...(reasoningEffort ? {
        providerOptions: {
          openai: {
            reasoning: { effort: reasoningEffort },
          },
        },
      } : {}),
    });

    let fullContent = '';
    let fullReasoning = '';

    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case 'text-delta':
          fullContent += chunk.text || '';
          res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
          break;
        case 'reasoning':
          fullReasoning += chunk.textDelta || '';
          res.write(`data: ${JSON.stringify({ type: 'reasoning', content: chunk.textDelta })}\n\n`);
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
          res.write(`data: ${JSON.stringify({ type: 'done', finishReason: chunk.finishReason, usage: chunk.totalUsage, reasoning: fullReasoning })}\n\n`);
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
        console.error('Failed to persist unified chat:', e);
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
  const targetDir = sessionId.startsWith('dir:') ? sessionId.slice(4) : path.join(WORKSPACE_ROOT, sessionId);
  try {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const tree = entries.filter(e => !e.name.startsWith('.')).map(e => {
      const fullPath = path.join(targetDir, e.name);
      const relPath = path.relative(WORKSPACE_ROOT, fullPath);
      if (e.isDirectory()) {
        const children = fs.readdirSync(fullPath, { withFileTypes: true })
          .filter(c => !c.name.startsWith('.'))
          .map(c => ({ name: c.name, path: path.join(relPath, c.name), type: c.isDirectory() ? 'dir' : 'file' as const }));
        return { name: e.name, path: relPath, type: 'dir' as const, children };
      }
      return { name: e.name, path: relPath, type: 'file' as const };
    });
    res.json(tree);
  } catch { res.json([]); }
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
