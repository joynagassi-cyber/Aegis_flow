import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimit } from './middleware/rateLimit.js';
import booksRouter from './routes/books.js';
import dailyRouter from './routes/daily.js';
import geoRouter from './routes/geo.js';
import aiRouter from './routes/ai.js';
import agentRouter from './routes/agent.js';
import artifactsRouter from './routes/artifacts.js';
import chatRouter from './routes/chat.js';
import chatUnifiedRouter from './routes/chat-unified.js';
import briefingRouter from './routes/briefing.js';
import insightRouter from './routes/insight.js';
import checklistsRouter from './routes/checklists.js';
import techwatchRouter from './routes/techwatch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/books', booksRouter);
app.use('/api/daily', dailyRouter);
app.use('/api/geo', geoRouter);
app.use('/api/ai', aiRouter);
app.use('/api/agent', agentRouter);
app.use('/api/artifacts', artifactsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/unified', rateLimit(30, 60_000), chatUnifiedRouter);
app.use('/api/briefing', briefingRouter);
app.use('/api/insight', insightRouter);
app.use('/api/checklists', checklistsRouter);
app.use('/api/techwatch', techwatchRouter);

export default app;
