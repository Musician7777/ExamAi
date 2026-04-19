import mongoose from 'mongoose';

const sharedPresetSchema = new mongoose.Schema(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    creatorId: { type: String, required: true },
    presetType: {
      type: String,
      enum: ['exam', 'interview', 'coding'],
      required: true,
    },
    config: { type: mongoose.Schema.Types.Mixed, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '📄' },
    useCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const SharedPreset = mongoose.models.SharedPreset || mongoose.model('SharedPreset', sharedPresetSchema);
export default SharedPreset;
