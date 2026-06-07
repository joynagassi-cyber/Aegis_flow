import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM daily_data ORDER BY day_number');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const {
    day_number, prayer_hours, bible_chapters, fasting_observed, english_minutes,
    english_level, saas_features_delivered, saas_paid_customers,
    pitch_count, pitch_confidence, pitch_notes,
    marketing_courses, marketing_actions,
    sports_pushups, sports_abs, sports_squats, sports_plank,
    sports_jumping_jacks, sports_stretching, sports_cardio_minutes,
    daily_housework, weekly_housework, monthly_housework, notes, validated
  } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO daily_data (
      day_number, prayer_hours, bible_chapters, fasting_observed, english_minutes,
      english_level, saas_features_delivered, saas_paid_customers,
      pitch_count, pitch_confidence, pitch_notes,
      marketing_courses, marketing_actions,
      sports_pushups, sports_abs, sports_squats, sports_plank,
      sports_jumping_jacks, sports_stretching, sports_cardio_minutes,
      daily_housework, weekly_housework, monthly_housework, notes, validated
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
    ) RETURNING *`,
    [
      day_number, prayer_hours, bible_chapters, fasting_observed, english_minutes,
      english_level, saas_features_delivered, saas_paid_customers,
      pitch_count, pitch_confidence, pitch_notes,
      marketing_courses, marketing_actions,
      sports_pushups, sports_abs, sports_squats, sports_plank,
      sports_jumping_jacks, sports_stretching, sports_cardio_minutes,
      daily_housework, weekly_housework, monthly_housework, notes, validated
    ]
  );
  res.status(201).json(rows[0]);
});

export default router;
