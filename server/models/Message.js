import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    context: { type: String, default: null, trim: true }, // e.g. 'poll', 'dare', 'general'
    relatedId: { type: String, default: null, trim: true },
    timestamp: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

export const Message =
  mongoose.models.Message ?? mongoose.model('Message', MessageSchema);

