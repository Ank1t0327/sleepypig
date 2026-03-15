import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { predictionsRouter } from './routes/predictions.js';
import { scoresRouter } from './routes/scores.js';
import { pollsRouter } from './routes/polls.js';
import { daresRouter } from './routes/dares.js';
import { chatRouter } from './routes/chat.js';

const PORT = Number(process.env.PORT) || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Missing env var: MONGO_URI');
}

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Reset-Key"],
  })
);

// Express 5 (path-to-regexp v6) doesn't accept "*" or "/*" strings here.
// Use a RegExp catch-all for OPTIONS preflight.
app.options(/.*/, cors());

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(predictionsRouter);
app.use(scoresRouter);
app.use(pollsRouter);
app.use(daresRouter);
app.use(chatRouter);

await mongoose.connect(MONGO_URI);

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});