import mongoose from 'mongoose';

const PollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    askedBy: { type: String, required: true, trim: true },
    approved: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
    answer: { type: String, default: null, trim: true }, // e.g. "yes" / "no" / "true" / "false"
    prediction: { type: String, default: null, trim: true }, // same value space as answer
    predictedBy: { type: String, default: null, trim: true },
    date: { type: Date, required: true },
    scored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PollSchema.index({ askedBy: 1, date: 1, createdAt: 1 });

export const Poll = mongoose.models.Poll ?? mongoose.model('Poll', PollSchema);

