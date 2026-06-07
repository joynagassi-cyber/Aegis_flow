import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.post('/requests', async (req, res) => {
  const { client_id, provider, prompt, response, model_used, duration_ms, tokens_used, cost_usd } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO ai_requests (client_id, provider, prompt, response, model_used, duration_ms, tokens_used, cost_usd)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [client_id, provider, prompt, response, model_used, duration_ms, tokens_used, cost_usd]
  );
  res.status(201).json(rows[0]);
});

router.get('/requests/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const { rows } = await pool.query(
    `SELECT * FROM ai_requests WHERE client_id=$1 ORDER BY request_at DESC`,
    [clientId]
  );
  res.json(rows);
});

export default router;
