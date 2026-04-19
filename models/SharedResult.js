import mongoose from 'mongoose';

const sharedResultSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    creatorId: {
      type: String,
      required: true,
    },
    resultType: {
      type: String,
      enum: ['exam', 'coding', 'interview'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SharedResult = mongoose.models.SharedResult || mongoose.model('SharedResult', sharedResultSchema);
export default SharedResult;
