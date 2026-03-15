import express from 'express';
import { Dare } from '../models/Dare.js';
import { Score } from '../models/Score.js';

export const daresRouter = express.Router();

// POST /dare
daresRouter.post('/dare', async (req, res) => {
  const { text, createdBy } = req.body ?? {};
  if (!text || !createdBy) {
    return res.status(400).json({ error: '`text` and `createdBy` are required' });
  }

  const dare = await Dare.create({
    text: String(text).trim(),
    createdBy: String(createdBy).trim(),
  });

  return res.status(201).json(dare);
});

// POST /dare/approve
daresRouter.post('/dare/approve', async (req, res) => {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ error: '`id` is required' });

  const now = new Date();
  const deadline = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from approval

  const dare = await Dare.findByIdAndUpdate(
    id,
    { $set: { approved: true, rejected: false, deadline } },
    { new: true },
  );

  if (!dare) return res.status(404).json({ error: 'Dare not found' });
  return res.json(dare);
});

// POST /dare/reject
daresRouter.post('/dare/reject', async (req, res) => {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ error: '`id` is required' });

  const dare = await Dare.findByIdAndUpdate(
    id,
    { $set: { rejected: true, approved: false, deadline: null } },
    { new: true },
  );

  if (!dare) return res.status(404).json({ error: 'Dare not found' });
  return res.json(dare);
});

// POST /dare/complete
// Marks dare as completed/failed and updates scores.
daresRouter.post('/dare/complete', async (req, res) => {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ error: '`id` is required' });

  const dare = await Dare.findById(id);
  if (!dare) return res.status(404).json({ error: 'Dare not found' });

  if (!dare.approved || !dare.deadline) {
    return res.status(400).json({ error: 'Dare has not been approved yet' });
  }

  const now = new Date();
  const succeeded = now <= dare.deadline;

  // If already scored, just update completed flag and return.
  if (dare.scored) {
    dare.completed = succeeded;
    await dare.save();
    return res.json({ dare, scoreUpdated: false });
  }

  const delta = succeeded ? 3 : -1.5;

  await Score.updateOne(
    { player: dare.createdBy },
    { $inc: { points: delta } },
    { upsert: true },
  );

  dare.completed = succeeded;
  dare.scored = true;
  await dare.save();

  const scores = await Score.find().sort({ points: -1, player: 1 }).lean();
  return res.json({ dare, succeeded, delta, scores, scoreUpdated: true });
});

// GET /dares
daresRouter.get('/dares', async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  await Dare.deleteMany({ createdAt: { $lt: startOfToday } });

  const dares = await Dare.find().sort({ createdAt: -1 }).lean();
  return res.json(dares);
});

