import app from './app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 API Aegis Flow listening on ${PORT}`));
