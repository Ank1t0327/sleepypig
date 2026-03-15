import express from 'express';
import { Poll } from '../models/Poll.js';
import { Score } from '../models/Score.js';

export const pollsRouter = express.Router();

const MAX_QUESTIONS_PER_DAY = 5;

function toDateOnly(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function normaliseBool(value) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (!v) return null;
  if (['yes', 'y', 'true', 't', '1'].includes(v)) return 'yes';
  if (['no', 'n', 'false', 'f', '0'].includes(v)) return 'no';
  return v;
}

function pollPoints({ prediction, answer }) {
  if (prediction == null || answer == null) return 0;
  return prediction === answer ? 1.5 : -0.5;
}

// POST /poll
// Create a new poll question for Boolean Pig mode.
pollsRouter.post('/poll', async (req, res) => {
  const { question, askedBy, date } = req.body ?? {};
  if (!question || !askedBy || !date) {
    return res
      .status(400)
      .json({ error: '`question`, `askedBy`, and `date` are required' });
  }

  const day = toDateOnly(date);
  if (!day) return res.status(400).json({ error: '`date` must be a valid date' });

  const todayCount = await Poll.countDocuments({ askedBy, date: day });
  if (todayCount >= MAX_QUESTIONS_PER_DAY) {
    return res.status(429).json({ error: 'Daily question limit reached' });
  }

  const poll = await Poll.create({
    question: String(question).trim(),
    askedBy: String(askedBy).trim(),
    date: day,
  });

  return res.status(201).json(poll);
});

// POST /poll/predict
// Opponent records their yes/no prediction on an approved poll.
pollsRouter.post('/poll/predict', async (req, res) => {
  const { id, predictedBy, prediction } = req.body ?? {};
  if (!id || !predictedBy || prediction == null) {
    return res
      .status(400)
      .json({ error: '`id`, `predictedBy`, and `prediction` are required' });
  }

  const norm = normaliseBool(prediction);
  if (!norm) return res.status(400).json({ error: '`prediction` is invalid' });

  const poll = await Poll.findById(id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  if (!poll.approved || poll.rejected) {
    return res.status(400).json({ error: 'Poll must be approved before predicting' });
  }

  poll.predictedBy = String(predictedBy).trim();
  poll.prediction = norm;
  await poll.save();

  return res.json(poll);
});

// POST /poll/approve
pollsRouter.post('/poll/approve', async (req, res) => {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ error: '`id` is required' });

  const poll = await Poll.findByIdAndUpdate(
    id,
    { $set: { approved: true, rejected: false } },
    { new: true },
  );
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  return res.json(poll);
});

// POST /poll/reject
pollsRouter.post('/poll/reject', async (req, res) => {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ error: '`id` is required' });

  const poll = await Poll.findByIdAndUpdate(
    id,
    { $set: { rejected: true, approved: false } },
    { new: true },
  );
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  return res.json(poll);
});

// POST /poll/answer
// Record the actual answer and update scores.
pollsRouter.post('/poll/answer', async (req, res) => {
  const { id, answer } = req.body ?? {};
  if (!id || answer == null) {
    return res.status(400).json({ error: '`id` and `answer` are required' });
  }

  const poll = await Poll.findById(id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  const normAnswer = normaliseBool(answer);
  if (!normAnswer) return res.status(400).json({ error: '`answer` is invalid' });

  // If already scored, just update stored answer and return.
  if (poll.scored) {
    poll.answer = normAnswer;
    await poll.save();
    return res.json({ poll, scoreUpdated: false });
  }

  poll.answer = normAnswer;

  let delta = 0;
  if (poll.predictedBy && poll.prediction) {
    delta = pollPoints({
      prediction: poll.prediction,
      answer: poll.answer,
    });
    if (delta !== 0) {
      await Score.updateOne(
        { player: poll.predictedBy },
        { $inc: { points: delta } },
        { upsert: true },
      );
    }
  }

  poll.scored = true;
  await poll.save();

  const scores = await Score.find().sort({ points: -1, player: 1 }).lean();
  return res.json({ poll, scoreUpdated: true, delta, scores });
});

// GET /polls
pollsRouter.get('/polls', async (_req, res) => {
  const polls = await Poll.find().sort({ date: -1, createdAt: -1 }).lean();
  return res.json(polls);
});

