import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, dbQuery, getDBMode } from './config/db.js';
import { initializeModel, analyzeTextToxicity } from './services/toxicityService.js';
import { detectLanguage } from './services/languageService.js';
import { analyzeSentiment } from './services/sentimentService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Start-up tasks
const startServer = async () => {
  // Connect to DB (will gracefully fall back to JSON DB if Mongo fails)
  await connectDB();

  // Initialize HF Model in background (non-blocking)
  initializeModel().catch((err) => {
    console.error('Error background-initializing toxic-bert model:', err);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Database mode: ${getDBMode()}`);
  });
};

// --- ROUTES ---

// 1. Analyze text & save comment
app.post('/api/comments/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, error: 'Text content is required' });
    }

    // A. Detect Language
    const language = detectLanguage(text);

    // B. Analyze Toxicity
    const toxicityResult = await analyzeTextToxicity(text, language.code);

    // C. Analyze Sentiment
    const sentimentResult = analyzeSentiment(text, language.code, toxicityResult.toxicityScore);

    // D. Save Comment
    const commentData = {
      text: text.trim(),
      languageCode: language.code,
      languageName: language.name,
      isToxic: toxicityResult.isToxic,
      toxicityScore: toxicityResult.toxicityScore,
      categories: toxicityResult.categories,
      sentimentScore: sentimentResult.score,
      sentimentLabel: sentimentResult.label,
      status: toxicityResult.isToxic ? 'flagged' : 'pending',
      createdAt: new Date(),
    };

    const newComment = await dbQuery.Comment.create(commentData);

    return res.status(201).json({
      success: true,
      comment: newComment,
      analysis: {
        language,
        toxicity: toxicityResult,
        sentiment: sentimentResult,
      }
    });
  } catch (error) {
    console.error('Error analyzing comment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Fetch comments (with filtering)
app.get('/api/comments', async (req, res) => {
  try {
    const { search, languageCode, isToxic, status, sentimentLabel } = req.query;
    const filter = {};
    if (search) filter.search = search;
    if (languageCode) filter.languageCode = languageCode;
    if (isToxic !== undefined) filter.isToxic = isToxic;
    if (status) filter.status = status;
    if (sentimentLabel) filter.sentimentLabel = sentimentLabel;

    const comments = await dbQuery.Comment.find(filter);
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Update comment status (moderate)
app.put('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'flagged'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid moderation status' });
    }

    const updatedComment = await dbQuery.Comment.findByIdAndUpdate(id, { status });
    if (!updatedComment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    return res.status(200).json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Delete comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbQuery.Comment.deleteOne(id);
    
    if (result && result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get Metrics & Analytics dashboard data
app.get('/api/comments/metrics', async (req, res) => {
  try {
    const metrics = await dbQuery.Comment.getMetrics();
    return res.status(200).json({ success: true, metrics, dbMode: getDBMode() });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend static assets from ../frontend/dist
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
app.use(express.static(FRONTEND_DIST));

// Handle React Router SPA fallback (should be registered AFTER the API routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

// Start Server
startServer();
