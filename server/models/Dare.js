import mongoose from 'mongoose';

const DareSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true, trim: true },
    approved: { type: Boolean, default: false },
    deadline: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    scored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Dare = mongoose.models.Dare ?? mongoose.model('Dare', DareSchema);

