import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { session_id, title, type, content, language, source_message_id } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO artifacts (session_id, title, type, content, language, source_message_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [session_id || '', title, type, content, language || null, source_message_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch', async (req, res) => {
  const { artifacts } = req.body;
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    res.status(400).json({ error: 'artifacts array required' });
    return;
  }
  try {
    const saved = [];
    for (const a of artifacts) {
      const { rows } = await pool.query(
        `INSERT INTO artifacts (session_id, title, type, content, language, source_message_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [a.session_id || '', a.title, a.type, a.content, a.language || null, a.source_message_id || null]
      );
      saved.push(rows[0]);
    }
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { type, session_id, limit, offset } = req.query;
  try {
    let sql = 'SELECT * FROM artifacts WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (type) { sql += ` AND type=$${idx++}`; params.push(type); }
    if (session_id) { sql += ` AND session_id=$${idx++}`; params.push(session_id); }
    sql += ' ORDER BY created_at DESC';
    if (limit) { sql += ` LIMIT $${idx++}`; params.push(parseInt(limit as string)); }
    if (offset) { sql += ` OFFSET $${idx++}`; params.push(parseInt(offset as string)); }
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/types', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT type, COUNT(*)::int as count FROM artifacts GROUP BY type ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT session_id, COUNT(*)::int as count, MAX(created_at) as last_artifact
       FROM artifacts GROUP BY session_id ORDER BY last_artifact DESC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM artifacts WHERE id=$1', [req.params.id]);
    if (rows.length === 0) { res.status(404).json({ error: 'not found' }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM artifacts WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
