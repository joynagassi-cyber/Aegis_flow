import { pool } from '../db.js';

export async function buildProactiveContext(): Promise<string> {
  const parts: string[] = [];

  try {
    const { rows: pendingChecklists } = await pool.query(
      `SELECT cp.objective_type, cp.section_id, cp.item_id, cp.done
       FROM checklist_progress cp
       WHERE NOT cp.done
       ORDER BY cp.updated_at DESC
       LIMIT 10`
    );

    if (pendingChecklists.length > 0) {
      const byType: Record<string, string[]> = {};
      for (const row of pendingChecklists) {
        const key = row.objective_type === 'saas' ? 'SaaS' : 'GeoAI';
        if (!byType[key]) byType[key] = [];
        byType[key].push(`${row.section_id}/${row.item_id}`);
      }
      const summary = Object.entries(byType)
        .map(([type, items]) => `${type}: ${items.length} items en attente (${items.slice(0, 5).join(', ')})`)
        .join(' | ');
      parts.push(`CHECKLISTS EN RETARD : ${summary}`);
    } else {
      parts.push(`CHECKLISTS : Aucun item en attente. Tout est à jour.`);
    }
  } catch {
    parts.push('CHECKLISTS : Indisponibles');
  }

  try {
    const { rows: recentMessages } = await pool.query(
      `SELECT role, LEFT(content, 200) as content, created_at
       FROM chat_messages
       WHERE created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 5`
    );

    if (recentMessages.length > 0) {
      const topics = recentMessages
        .filter(r => r.role === 'user')
        .map(r => r.content?.slice(0, 100))
        .filter(Boolean);
      if (topics.length > 0) {
        parts.push(`SUJETS RÉCENTS (24h) : "${topics.join('" | "')}"`);
      }
    }
  } catch {}

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  let moment = 'journée';
  if (hour < 5) moment = 'nuit';
  else if (hour < 10) moment = 'matin';
  else if (hour < 13) moment = 'milieu de journée';
  else if (hour < 17) moment = 'après-midi';
  else moment = 'soirée';

  parts.unshift(`CONTEXTE TEMPOREL : ${dayOfWeek} ${dateStr} — ${moment} (heure: ${hour}h)`);

  return parts.join('\n');
}
