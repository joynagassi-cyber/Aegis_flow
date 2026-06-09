import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const dir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
    try {
      await pool.query(sql);
      console.log(`Migration ${file} OK`);
    } catch (err: any) {
      console.error(`Migration ${file} failed:`, err.message);
    }
  }
}
