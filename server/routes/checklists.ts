import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

async function ensureChecklistTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS checklist_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      objective_type TEXT NOT NULL CHECK (objective_type IN ('saas', 'geoai')),
      section_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      done_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(objective_type, section_id, item_id)
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_checklist_section ON checklist_progress(objective_type, section_id)
  `);
}

router.get('/:type/:sectionId', async (req, res) => {
  const { type, sectionId } = req.params;
  if (!['saas', 'geoai'].includes(type)) {
    res.status(400).json({ error: 'type must be saas or geoai' });
    return;
  }
  try {
    await ensureChecklistTable();
    const { rows } = await pool.query(
      `SELECT item_id, done FROM checklist_progress WHERE objective_type = $1 AND section_id = $2`,
      [type, sectionId]
    );
    const map: Record<string, boolean> = {};
    for (const r of rows) map[r.item_id] = r.done;
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/toggle', async (req, res) => {
  const { objectiveType, sectionId, itemId, done } = req.body;
  if (!objectiveType || !sectionId || !itemId) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }
  try {
    await ensureChecklistTable();
    await pool.query(
      `INSERT INTO checklist_progress (objective_type, section_id, item_id, done, done_at, updated_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN NOW() ELSE NULL END, NOW())
       ON CONFLICT (objective_type, section_id, item_id)
       DO UPDATE SET done = $4, done_at = CASE WHEN $4 THEN NOW() ELSE NULL END, updated_at = NOW()`,
      [objectiveType, sectionId, itemId, done]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/toggle-batch', async (req, res) => {
  const { objectiveType, sectionId, items } = req.body;
  if (!objectiveType || !sectionId || !items) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }
  try {
    await ensureChecklistTable();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          `INSERT INTO checklist_progress (objective_type, section_id, item_id, done, done_at, updated_at)
           VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN NOW() ELSE NULL END, NOW())
           ON CONFLICT (objective_type, section_id, item_id)
           DO UPDATE SET done = $4, done_at = CASE WHEN $4 THEN NOW() ELSE NULL END, updated_at = NOW()`,
          [objectiveType, sectionId, item.id, !!item.done]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
