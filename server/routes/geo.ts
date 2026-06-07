import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/roadmaps', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM geo_roadmaps ORDER BY id DESC');
  res.json(rows);
});

router.get('/months/:roadmapId', async (req, res) => {
  const { roadmapId } = req.params;
  const { rows } = await pool.query('SELECT * FROM geo_mois WHERE roadmap_id=$1 ORDER BY id', [roadmapId]);
  res.json(rows);
});

router.get('/weeks/:monthId', async (req, res) => {
  const { monthId } = req.params;
  const { rows } = await pool.query('SELECT * FROM geo_semaines WHERE mois_id=$1 ORDER BY id', [monthId]);
  res.json(rows);
});

router.get('/exercises/:weekId', async (req, res) => {
  const { weekId } = req.params;
  const { rows } = await pool.query('SELECT * FROM geo_exercices WHERE semaine_id=$1 ORDER BY id', [weekId]);
  res.json(rows);
});

router.put('/exercises/:id', async (req, res) => {
  const { id } = req.params;
  const { texte, done, statut } = req.body;
  const { rows } = await pool.query(
    `UPDATE geo_exercices SET texte=$1, done=$2, statut=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
    [texte, done, statut, id]
  );
  res.json(rows[0]);
});

export default router;
