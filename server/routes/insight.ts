import { Router } from 'express';

const router = Router();

router.post('/generate', async (req, res) => {
  const { currentDay, disciplineTrend, correlation, mrr, payingCustomers, englishStreak, sportStreak, prayerHours, bibleChapters, englishMinutes, pushups } = req.body;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
    return;
  }

  const systemPrompt = `Tu es le coach IA d'Aegis Flow. Analyse ces données et génère 1 insight corrélationnel en français, format JSON strict:
{
  "insight": "1 phrase clé reliant discipline et performance",
  "suggestion": "1 action concrète recommandée",
  "severity": "positive|warning|critical"
}
Corrélation calculée: ${(correlation || 0).toFixed(2)} (0=nulle, 1=parfaite).
Réponds UNIQUEMENT JSON, sans backticks.`;

  const userPrompt = `Jour J${currentDay || 1}. Tendance: ${disciplineTrend || 'stable'}.
MRR: ${mrr || 0}€. Streak anglais: ${englishStreak || 0}. Streak sport: ${sportStreak || 0}.
Discipline actuelle: ${prayerHours || 0}h prière, ${bibleChapters || 0} chap bible, ${englishMinutes || 0}min anglais, ${pushups || 0} pushups.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aegis-flow.insforge.site',
        'X-Title': 'Aegis Flow Insight',
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
    res.json({ ...parsed, correlation: correlation || 0 });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
