import { Router } from 'express';

const router = Router();

router.post('/generate', async (req, res) => {
  const { currentDay, currentSaaSPhase, mrr, payingCustomers, booksFinished, activeTasks, disciplineTrend, disciplineAvg } = req.body;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
    return;
  }

  const systemPrompt = `Tu es le commandant IA d'Aegis Flow. Génère un briefing quotidien en français, format JSON strict:
{
  "summary": "1 phrase sur la journée",
  "trend": "1 phrase sur la tendance discipline 7j (${disciplineTrend || 'stable'}, moyenne ${disciplineAvg || 0})",
  "urgentTasks": "1 phrase rappel des tâches prioritaires si applicable",
  "dailyGoal": "1 objectif SMART pour aujourd'hui",
  "quote": "1 citation inspirante courte avec auteur"
}
Réponds UNIQUEMENT avec le JSON, sans backticks ni markdown.`;

  const userPrompt = `Jour J${currentDay || 1}, Phase ${currentSaaSPhase || 'MVP'}.
MRR: ${mrr || 0}€, Clients: ${payingCustomers || 0}, Livres terminés: ${booksFinished || 0}.
Tâches actives: ${activeTasks || 0}.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aegis-flow.insforge.site',
        'X-Title': 'Aegis Flow Briefing',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      res.status(response.status).json({ error: `OpenRouter ${response.status}: ${err}` });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    res.json({ ...parsed, day: currentDay, date: new Date().toISOString(), generatedAt: Date.now() });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
