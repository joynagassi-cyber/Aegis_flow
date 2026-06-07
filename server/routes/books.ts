import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM books ORDER BY id');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { id, title, author, domain, status, date_end, rating, summary, key_points } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO books (id, title, author, domain, status, date_end, rating, summary, key_points)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id, title, author, domain, status, date_end, rating, summary, key_points]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, domain, status, date_end, rating, summary, key_points } = req.body;
  const { rows } = await pool.query(
    `UPDATE books SET title=$1, author=$2, domain=$3, status=$4, date_end=$5, rating=$6, summary=$7, key_points=$8, updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [title, author, domain, status, date_end, rating, summary, key_points, id]
  );
  res.json(rows[0]);
});

export default router;
