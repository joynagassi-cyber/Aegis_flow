import app from './app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3001;

runMigrations().then(() => {
  app.listen(PORT, () => console.log(`🚀 API Aegis Flow listening on ${PORT}`));
}).catch(err => {
  console.error('Migration error:', err);
  app.listen(PORT, () => console.log(`🚀 API Aegis Flow listening on ${PORT} (migrations failed)`));
});
