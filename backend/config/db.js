import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure JSON db file exists
if (!fs.existsSync(JSON_DB_PATH)) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify({ comments: [] }, null, 2));
}

let isUsingMongoDB = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️  No MONGODB_URI found in environment. Switching to local JSON Database.');
    isUsingMongoDB = false;
    return false;
  }

  try {
    // Set connection timeout to 3 seconds for quick fallback
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('🚀 MongoDB Connected Successfully!');
    isUsingMongoDB = true;
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.log('⚠️  Switching to local JSON Database fallback. All features remain fully functional!');
    isUsingMongoDB = false;
    return false;
  }
};

// Custom JSON Database Engine that mimics MongoDB query syntax for our needs
const readJSON = () => {
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { comments: [] };
  }
};

const writeJSON = (data) => {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
};

export const getDBMode = () => (isUsingMongoDB ? 'MongoDB' : 'Local JSON DB');

// Unified DB helper to transparently route queries to MongoDB or JSON Database
export const dbQuery = {
  Comment: {
    find: async (filter = {}) => {
      if (isUsingMongoDB) {
        // Build Mongoose query
        let query = mongoose.model('Comment').find({});
        
        if (filter.search) {
          query = query.where('text').regex(new RegExp(filter.search, 'i'));
        }
        if (filter.languageCode) {
          query = query.where('languageCode').equals(filter.languageCode);
        }
        if (filter.isToxic !== undefined) {
          query = query.where('isToxic').equals(filter.isToxic === 'true');
        }
        if (filter.status) {
          query = query.where('status').equals(filter.status);
        }
        if (filter.sentimentLabel) {
          query = query.where('sentimentLabel').equals(filter.sentimentLabel);
        }
        
        return await query.sort({ createdAt: -1 }).exec();
      } else {
        // Handle in JSON
        const db = readJSON();
        let list = [...db.comments];

        if (filter.search) {
          const regex = new RegExp(filter.search, 'i');
          list = list.filter((c) => regex.test(c.text));
        }
        if (filter.languageCode) {
          list = list.filter((c) => c.languageCode === filter.languageCode);
        }
        if (filter.isToxic !== undefined) {
          const isToxicBool = filter.isToxic === 'true';
          list = list.filter((c) => c.isToxic === isToxicBool);
        }
        if (filter.status) {
          list = list.filter((c) => c.status === filter.status);
        }
        if (filter.sentimentLabel) {
          list = list.filter((c) => c.sentimentLabel === filter.sentimentLabel);
        }

        // Sort descending by createdAt
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },

    create: async (data) => {
      if (isUsingMongoDB) {
        return await mongoose.model('Comment').create(data);
      } else {
        const db = readJSON();
        const newDoc = {
          _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          ...data,
          createdAt: data.createdAt || new Date(),
        };
        db.comments.push(newDoc);
        writeJSON(db);
        return newDoc;
      }
    },

    findByIdAndUpdate: async (id, update) => {
      if (isUsingMongoDB) {
        return await mongoose.model('Comment').findByIdAndUpdate(id, update, { new: true });
      } else {
        const db = readJSON();
        const idx = db.comments.findIndex((c) => c._id === id);
        if (idx !== -1) {
          // Flat update
          db.comments[idx] = { ...db.comments[idx], ...update };
          writeJSON(db);
          return db.comments[idx];
        }
        return null;
      }
    },

    deleteOne: async (id) => {
      if (isUsingMongoDB) {
        return await mongoose.model('Comment').deleteOne({ _id: id });
      } else {
        const db = readJSON();
        const initialLen = db.comments.length;
        db.comments = db.comments.filter((c) => c._id !== id);
        writeJSON(db);
        return { deletedCount: initialLen - db.comments.length };
      }
    },

    getMetrics: async () => {
      if (isUsingMongoDB) {
        const Comment = mongoose.model('Comment');
        const totalComments = await Comment.countDocuments();
        const toxicComments = await Comment.countDocuments({ isToxic: true });
        const safeComments = await Comment.countDocuments({ isToxic: false });

        // Aggregate comments by language
        const languageAggregation = await Comment.aggregate([
          { $group: { _id: '$languageName', count: { $sum: 1 }, toxicCount: { $sum: { $cond: ['$isToxic', 1, 0] } } } },
          { $project: { language: '$_id', count: 1, toxicCount: 1, _id: 0 } },
          { $sort: { count: -1 } }
        ]);

        // Aggregate toxicity levels
        const categoryAggregation = await Comment.aggregate([
          {
            $group: {
              _id: null,
              toxic: { $avg: '$categories.toxic' },
              severe_toxic: { $avg: '$categories.severe_toxic' },
              obscene: { $avg: '$categories.obscene' },
              threat: { $avg: '$categories.threat' },
              insult: { $avg: '$categories.insult' },
              identity_hate: { $avg: '$categories.identity_hate' },
              sentiment: { $avg: '$sentimentScore' }
            }
          }
        ]);

        const avgCategories = categoryAggregation[0] || {
          toxic: 0, severe_toxic: 0, obscene: 0, threat: 0, insult: 0, identity_hate: 0, sentiment: 0
        };

        const avgSentiment = avgCategories.sentiment || 0.0;
        delete avgCategories.sentiment;

        // Sentiment Distribution Counts
        const posCount = await Comment.countDocuments({ sentimentLabel: 'positive' });
        const neuCount = await Comment.countDocuments({ sentimentLabel: 'neutral' });
        const negCount = await Comment.countDocuments({ sentimentLabel: 'negative' });

        // Daily trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const trendAggregation = await Comment.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              total: { $sum: 1 },
              toxic: { $sum: { $cond: ['$isToxic', 1, 0] } },
              avgSentiment: { $avg: '$sentimentScore' }
            }
          },
          { $project: { date: '$_id', total: 1, toxic: 1, avgSentiment: 1, _id: 0 } },
          { $sort: { date: 1 } }
        ]);

        return {
          totalComments,
          toxicComments,
          safeComments,
          languages: languageAggregation,
          averages: avgCategories,
          avgSentiment,
          sentimentDistribution: {
            positive: posCount,
            neutral: neuCount,
            negative: negCount
          },
          trend: trendAggregation,
        };
      } else {
        const db = readJSON();
        const comments = db.comments;
        const totalComments = comments.length;
        const toxicComments = comments.filter((c) => c.isToxic).length;
        const safeComments = totalComments - toxicComments;

        // Languages
        const langMap = {};
        comments.forEach((c) => {
          if (!langMap[c.languageName]) {
            langMap[c.languageName] = { language: c.languageName, count: 0, toxicCount: 0 };
          }
          langMap[c.languageName].count++;
          if (c.isToxic) langMap[c.languageName].toxicCount++;
        });
        const languages = Object.values(langMap).sort((a, b) => b.count - a.count);

        // Averages & Sentiment
        const sum = { toxic: 0, severe_toxic: 0, obscene: 0, threat: 0, insult: 0, identity_hate: 0, sentiment: 0 };
        const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };

        comments.forEach((c) => {
          const cats = c.categories || {};
          sum.toxic += cats.toxic || 0;
          sum.severe_toxic += cats.severe_toxic || 0;
          sum.obscene += cats.obscene || 0;
          sum.threat += cats.threat || 0;
          sum.insult += cats.insult || 0;
          sum.identity_hate += cats.identity_hate || 0;
          sum.sentiment += c.sentimentScore || 0;

          const label = c.sentimentLabel || 'neutral';
          if (sentimentDistribution[label] !== undefined) {
            sentimentDistribution[label]++;
          }
        });

        const averages = {
          toxic: totalComments ? sum.toxic / totalComments : 0,
          severe_toxic: totalComments ? sum.severe_toxic / totalComments : 0,
          obscene: totalComments ? sum.obscene / totalComments : 0,
          threat: totalComments ? sum.threat / totalComments : 0,
          insult: totalComments ? sum.insult / totalComments : 0,
          identity_hate: totalComments ? sum.identity_hate / totalComments : 0,
        };

        const avgSentiment = totalComments ? sum.sentiment / totalComments : 0.0;

        // Trend (last 7 days)
        const trendMap = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          trendMap[dateStr] = { date: dateStr, total: 0, toxic: 0, sentimentSum: 0 };
        }

        comments.forEach((c) => {
          const dateStr = new Date(c.createdAt).toISOString().split('T')[0];
          if (trendMap[dateStr]) {
            trendMap[dateStr].total++;
            if (c.isToxic) trendMap[dateStr].toxic++;
            trendMap[dateStr].sentimentSum += c.sentimentScore || 0;
          }
        });

        const trend = Object.values(trendMap).map(t => {
          const avgSent = t.total ? t.sentimentSum / t.total : 0.0;
          return {
            date: t.date,
            total: t.total,
            toxic: t.toxic,
            avgSentiment: parseFloat(avgSent.toFixed(4))
          };
        }).sort((a, b) => a.date.localeCompare(b.date));

        return {
          totalComments,
          toxicComments,
          safeComments,
          languages,
          averages,
          avgSentiment: parseFloat(avgSentiment.toFixed(4)),
          sentimentDistribution,
          trend,
        };
      }
    }
  }
};
