import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  languageCode: {
    type: String,
    required: true,
    default: 'eng',
  },
  languageName: {
    type: String,
    required: true,
    default: 'English',
  },
  isToxic: {
    type: Boolean,
    required: true,
    default: false,
  },
  toxicityScore: {
    type: Number,
    required: true,
    default: 0.0,
  },
  categories: {
    toxic: { type: Number, default: 0.0 },
    severe_toxic: { type: Number, default: 0.0 },
    obscene: { type: Number, default: 0.0 },
    threat: { type: Number, default: 0.0 },
    insult: { type: Number, default: 0.0 },
    identity_hate: { type: Number, default: 0.0 },
  },
  sentimentScore: {
    type: Number,
    required: true,
    default: 0.0,
  },
  sentimentLabel: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    required: true,
    default: 'neutral',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoid OverwriteModelError if models are hot-reloaded
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
