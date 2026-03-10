import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema(
  {
    player: { type: String, required: true, trim: true, unique: true },
    points: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const Score = mongoose.models.Score ?? mongoose.model('Score', ScoreSchema);

