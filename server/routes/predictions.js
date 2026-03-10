import express from 'express';
import { Prediction } from '../models/Prediction.js';
import { Score } from '../models/Score.js';

export const predictionsRouter = express.Router();

const PLAYERS = ['Ankit', 'Vasu'];

function toDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normResult(value) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (!v) return null;
  return v;
}

function pointsFor({ woke, actualResult, prediction }) {
  if (prediction == null) return 0;
  if (woke === true && actualResult === 'present') return 0;
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

// POST /result
// Save actual result and update scores.
predictionsRouter.post('/result', async (req, res) => {
  const { className, date, actualResult, woke } = req.body ?? {};
  if (!className || !date || actualResult == null) {
    return res
      .status(400)
      .json({ error: '`className`, `date`, and `actualResult` are required' });
  }

  const d = toDate(date);
  if (!d) return res.status(400).json({ error: '`date` must be a valid date' });

  const resultNorm = normResult(actualResult);
  if (!resultNorm) return res.status(400).json({ error: '`actualResult` cannot be empty' });

  const filter = { className: String(className).trim(), date: d };

  const existing = await Prediction.findOne(filter);
  if (!existing) {
    return res.status(404).json({ error: 'Prediction not found for className+date' });
  }

  // If already scored, only allow updating the stored result without changing totals.
  if (existing.scored) {
    existing.actualResult = resultNorm;
    if (woke !== undefined) existing.woke = Boolean(woke);
    await existing.save();
    return res.json({ prediction: existing, scoreUpdated: false });
  }

  existing.actualResult = resultNorm;
  if (woke !== undefined) existing.woke = Boolean(woke);

  const wokeFlag = existing.woke === true;
  const ankitPred = normResult(existing.ankitPrediction);
  const vasuPred = normResult(existing.vasuPrediction);

  const deltas = {
    Ankit: pointsFor({ woke: wokeFlag, actualResult: resultNorm, prediction: ankitPred }),
    Vasu: pointsFor({ woke: wokeFlag, actualResult: resultNorm, prediction: vasuPred }),
  };

  await Promise.all(
    PLAYERS.map((player) =>
      Score.updateOne({ player }, { $inc: { points: deltas[player] } }, { upsert: true }),
    ),
  );

  existing.scored = true;
  await existing.save();

  return res.json({ prediction: existing, scoreUpdated: true, deltas });
});

// GET /predictions
predictionsRouter.get('/predictions', async (_req, res) => {
  const docs = await Prediction.find().sort({ date: -1, createdAt: -1 }).lean();
  return res.json(docs);
});

