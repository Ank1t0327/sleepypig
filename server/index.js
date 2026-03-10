import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { predictionsRouter } from './routes/predictions.js';
import { scoresRouter } from './routes/scores.js';

const PORT = Number(process.env.PORT) || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Missing env var: MONGO_URI');
}

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : '*',
    credentials: false,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(predictionsRouter);
app.use(scoresRouter);

await mongoose.connect(MONGO_URI);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${PORT}`);
});

