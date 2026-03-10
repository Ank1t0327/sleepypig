import mongoose from 'mongoose';

const PredictionSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    ankitPrediction: { type: String, default: null, trim: true },
    vasuPrediction: { type: String, default: null, trim: true },
    actualResult: { type: String, default: null, trim: true },
    woke: { type: Boolean, default: false },
    scored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PredictionSchema.index({ className: 1, date: 1 }, { unique: true });

export const Prediction =
  mongoose.models.Prediction ?? mongoose.model('Prediction', PredictionSchema);

