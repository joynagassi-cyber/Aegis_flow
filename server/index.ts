import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import booksRouter from './routes/books.js';
import dailyRouter from './routes/daily.js';
import geoRouter from './routes/geo.js';
import aiRouter from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/books', booksRouter);
app.use('/api/daily', dailyRouter);
app.use('/api/geo', geoRouter);
app.use('/api/ai', aiRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 API Insforge listening on ${PORT}`));
