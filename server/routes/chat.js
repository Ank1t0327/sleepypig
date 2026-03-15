import express from 'express';
import { Message } from '../models/Message.js';

export const chatRouter = express.Router();

// POST /chat
// Create a new chat message (general or attached to a poll/dare/etc).
chatRouter.post('/chat', async (req, res) => {
  const { sender, text, context, relatedId, timestamp } = req.body ?? {};
  if (!sender || !text) {
    return res.status(400).json({ error: '`sender` and `text` are required' });
  }

  const ts =
    timestamp != null
      ? new Date(timestamp)
      : new Date();
  if (Number.isNaN(ts.getTime())) {
    return res.status(400).json({ error: '`timestamp` is invalid' });
  }

  const msg = await Message.create({
    sender: String(sender).trim(),
    text: String(text).trim(),
    context: context ? String(context).trim() : null,
    relatedId: relatedId ? String(relatedId).trim() : null,
    timestamp: ts,
  });

  return res.status(201).json(msg);
});

// GET /chat
// Returns recent chat messages. Optional query params:
// - context (e.g. 'poll' or 'dare')
// - relatedId (to scope messages to a specific poll/dare)
// - limit (number of messages, default 50, max 200)
chatRouter.get('/chat', async (req, res) => {
  const { context, relatedId } = req.query ?? {};
  let limit = 50;
  if (typeof req.query?.limit === 'string') {
    const n = Number(req.query.limit);
    if (Number.isFinite(n) && n > 0 && n <= 200) limit = n;
  }

  const filter = {};
  if (context) filter.context = String(context);
  if (relatedId) filter.relatedId = String(relatedId);

  const messages = await Message.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return res.json(messages);
});

