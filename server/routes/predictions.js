import express from 'express';
import { Prediction } from '../models/Prediction.js';
import { Score } from '../models/Score.js';

export const predictionsRouter = express.Router();

const PLAYERS = ['Ankit', 'Vasu'];
const RESULT_VALUES = ['present', 'absent'];

function toDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Normalize to date-only so className+date lookups match reliably
  // across inputs like "2026-03-10" vs new Date() with time.
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function normResult(value) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (!v) return null;
  return v;
}

function pointsFor({ actualResult, prediction }) {
  if (prediction == null) return 0;
  return prediction === actualResult ? 1 : -0.25;
}

// POST /prediction
// Save prediction for a class (+date). Upserts Ankit/Vasu predictions.
predictionsRouter.post('/prediction', async (req, res) => {
  const { className, date, ankitPrediction, vasuPrediction, woke } = req.body ?? {};

  if (!className || !date) {
    return res.status(400).json({ error: '`className` and `date` are required' });
  }

  const d = toDate(date);
  if (!d) return res.status(400).json({ error: '`date` must be a valid date' });

  const update = {};
  if (ankitPrediction !== undefined) update.ankitPrediction = normResult(ankitPrediction);
  if (vasuPrediction !== undefined) update.vasuPrediction = normResult(vasuPrediction);
  if (woke !== undefined) update.woke = Boolean(woke);

  const doc = await Prediction.findOneAndUpdate(
    { className: String(className).trim(), date: d },
    { $set: update, $setOnInsert: { className: String(className).trim(), date: d } },
    { upsert: true, new: true },
  );

  return res.json(doc);
});

// POST /predictions
// Save a single player's prediction (deployed frontend shape).
predictionsRouter.post('/predictions', async (req, res) => {
  const { player, className, prediction, date } = req.body ?? {};
  if (!player || !className || prediction == null) {
    return res.status(400).json({ error: '`player`, `className`, and `prediction` are required' });
  }

  const playerNorm = String(player).trim().toLowerCase();
  const playerName =
    playerNorm === 'ankit' ? 'Ankit' : playerNorm === 'vasu' ? 'Vasu' : null;
  if (!playerName) {
    return res.status(400).json({ error: '`player` must be "Ankit" or "Vasu"' });
  }

  const predNorm = normResult(prediction);
  if (!predNorm || !RESULT_VALUES.includes(predNorm)) {
    return res.status(400).json({ error: '`prediction` must be "present" or "absent"' });
  }

  const d = toDate(date ?? new Date());
  if (!d) return res.status(400).json({ error: '`date` must be a valid date' });

  const update = playerName === 'Ankit' ? { ankitPrediction: predNorm } : { vasuPrediction: predNorm };

  const doc = await Prediction.findOneAndUpdate(
    { className: String(className).trim(), date: d },
    { $set: update, $setOnInsert: { className: String(className).trim(), date: d } },
    { upsert: true, new: true },
  );

  return res.json(doc);
});

// POST /result
// Save actual result and update scores.
predictionsRouter.post('/result', async (req, res) => {
  const { className, date, actual, actualResult } = req.body ?? {};
  const actualIncoming = actual ?? actualResult; // accept either for backwards compatibility
  if (!className || !date || actualIncoming == null) {
    return res.status(400).json({ error: '`className`, `date`, and `actual` are required' });
  }

  const d = toDate(date);
  if (!d) return res.status(400).json({ error: '`date` must be a valid date' });

  const resultNorm = normResult(actualIncoming);
  if (!resultNorm) return res.status(400).json({ error: '`actual` cannot be empty' });
  if (resultNorm !== 'present' && resultNorm !== 'absent') {
    return res.status(400).json({ error: '`actual` must be "present" or "absent"' });
  }

  const filter = { className: String(className).trim(), date: d };

  const existing = await Prediction.findOne(filter);
  if (!existing) {
    return res.status(404).json({ error: 'Prediction not found for className+date' });
  }

  // If already scored, only allow updating the stored result without changing totals.
  if (existing.scored) {
    existing.actualResult = resultNorm;
    await existing.save();
    const scores = await Score.find({ player: { $in: PLAYERS } })
      .sort({ player: 1 })
      .lean();
    return res.json({ prediction: existing, scoreUpdated: false, scores });
  }

  existing.actualResult = resultNorm;

  const ankitPred = normResult(existing.ankitPrediction);
  const vasuPred = normResult(existing.vasuPrediction);

  const deltas = {
    Ankit: pointsFor({ actualResult: resultNorm, prediction: ankitPred }),
    Vasu: pointsFor({ actualResult: resultNorm, prediction: vasuPred }),
  };

  await Promise.all(
    PLAYERS.map((player) =>
      Score.updateOne({ player }, { $inc: { points: deltas[player] } }, { upsert: true }),
    ),
  );

  existing.scored = true;
  await existing.save();

  const scores = await Score.find({ player: { $in: PLAYERS } })
    .sort({ points: -1, player: 1 })
    .lean();

  return res.json({ prediction: existing, scoreUpdated: true, deltas, scores });
});

// GET /predictions
predictionsRouter.get('/predictions', async (_req, res) => {
  const docs = await Prediction.find().sort({ date: -1, createdAt: -1 }).lean();
  return res.json(docs);
});

// POST /reset
// Hard reset: clears all predictions and scores.
predictionsRouter.post('/reset', async (_req, res) => {
  await Promise.all([Prediction.deleteMany({}), Score.deleteMany({})]);
  return res.json({ ok: true });
});

