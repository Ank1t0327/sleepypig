import express from 'express';
import { Score } from '../models/Score.js';

export const scoresRouter = express.Router();

// GET /scores
scoresRouter.get('/scores', async (_req, res) => {
  const docs = await Score.find().sort({ points: -1, player: 1 }).lean();
  return res.json(docs);
});

