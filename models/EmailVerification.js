import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['registration', 'email_change'],
      default: 'email_change',
    },
    currentEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    newEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 3600000), // 1 hour
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-remove expired tokens
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerification =
  mongoose.models.EmailVerification || mongoose.model('EmailVerification', emailVerificationSchema);
export default EmailVerification;
