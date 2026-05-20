import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Languages, 
  BarChart3, 
  ArrowRight, 
  RefreshCw, 
  Flame,
  UserCheck,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  Gauge,
  Clock,
  Zap,
  Laptop,
  Sun,
  Moon
} from 'lucide-react';

const PRESETS = [
  { text: "This is a wonderful contribution to the project, thank you!", lang: "English", type: "Positive & Safe", emoji: "🇺🇸", sentiment: "positive" },
  { text: "Shut up, you are completely stupid and useless! Go kill yourself!", lang: "English", type: "Toxic & Hostile", emoji: "🇺🇸", sentiment: "negative" },
  { text: "Eres un idiota inservible, vete a la mierda hijo de puta!", lang: "Spanish", type: "Toxic & Hostile", emoji: "🇪🇸", sentiment: "negative" },
  { text: "Merci beaucoup pour votre aide précieuse, c'est vraiment fantastique!", lang: "French", type: "Positive & Safe", emoji: "🇫🇷", sentiment: "positive" },
  { text: "Du bist so dumm und hässlich, verpiss dich du Hurensohn!", lang: "German", type: "Toxic & Hostile", emoji: "🇩🇪", sentiment: "negative" },
  { text: "यह बहुत ही सुंदर और उपयोगी पोस्ट है, आपका बहुत धन्यवाद!", lang: "Hindi", type: "Positive & Safe", emoji: "🇮🇳", sentiment: "positive" },
  { text: "أنت غبي جداً وحقير، ابن الكلب انتحر!", lang: "Arabic", type: "Toxic & Hostile", emoji: "🇸🇦", sentiment: "negative" },
  { text: "Это интересная тема для подробного обсуждения.", lang: "Russian", type: "Neutral", emoji: "🇷🇺", sentiment: "neutral" }
];

export default function App() {
  // Persistent Theme State (Light / Dark Mode Toggle)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Input & analysis state
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  // Tab State for Mobile Responsiveness (Compact Design)
  const [activeTab, setActiveTab] = useState('playground'); // playground | moderation | analytics

  // Comments feed state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');

  // Analytics state
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // System status
  const [dbMode, setDbMode] = useState('Local JSON DB');
  const [modelStatus, setModelStatus] = useState({ loaded: true, loading: false, method: 'HuggingFace ONNX / Lexical Hybrid' });
  const [avgLatency, setAvgLatency] = useState(50); // Default placeholder

  // Initial load & updates
  useEffect(() => {
    fetchComments();
    fetchMetrics();
  }, [searchQuery, filterLanguage, filterStatus, filterSentiment]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterLanguage) params.append('languageCode', filterLanguage);
      if (filterStatus) params.append('status', filterStatus);
      if (filterSentiment) params.append('sentimentLabel', filterSentiment);

      const res = await fetch(`/api/comments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch('/api/comments/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setDbMode(data.dbMode);
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleAnalyze = async (textToAnalyze) => {
    const text = textToAnalyze || inputText;
    if (!text || text.trim() === '') return;

    setAnalyzing(true);
    const startTime = Date.now();
    try {
      const res = await fetch('/api/comments/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentAnalysis(data.comment);
        setInputText(''); // Reset textarea if custom typed
        
        // Update latency metrics
        const endLatency = Date.now() - startTime;
        setAvgLatency(endLatency);

        // Update system model loading states
        const meta = data.comment.metadata || data.analysis?.toxicity?.metadata || {};
        if (meta.method) {
          setModelStatus(prev => ({ ...prev, method: meta.method }));
        }

        // Trigger updates across feeds & charts
        fetchComments();
        fetchMetrics();
        
        // Switch to playground tab on mobile so they see the result immediately
        setActiveTab('playground');
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleModerate = async (id, status) => {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.map(c => c._id === id ? { ...c, status } : c));
        fetchMetrics();
      }
    } catch (err) {
      console.error("Moderation error:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.filter(c => c._id !== id));
        fetchMetrics();
      }
    } catch (err) {
      console.error("Deletion error:", err);
    }
  };

  const handlePresetClick = (preset) => {
    setInputText(preset.text);
    handleAnalyze(preset.text);
  };

  const getScoreColor = (score) => {
    if (score < 0.3) return '#10b981'; // Emerald
    if (score < 0.6) return '#f59e0b'; // Amber
    return '#ef4444'; // Rose/Red
  };

  // Render Sentiment indicators
  const getSentimentDetails = (score, label) => {
    const isDark = theme === 'dark';
    switch (label) {
      case 'positive':
        return {
          emoji: '😊',
          text: 'Positive Sentiment',
          subtext: 'Praiseful or encouraging content.',
          color: '#10b981',
          class: 'success',
          gradient: isDark 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
          border: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.22)',
          badgeColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'
        };
      case 'negative':
        return {
          emoji: '😠',
          text: 'Negative Sentiment',
          subtext: 'Hostile, frustrated, or aggressive language.',
          color: '#ef4444',
          class: 'danger',
          gradient: isDark 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(225, 29, 72, 0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.03) 100%)',
          border: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.22)',
          badgeColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
        };
      default:
        return {
          emoji: '😐',
          text: 'Neutral Mood',
          subtext: 'Informational or balanced content.',
          color: isDark ? '#9ca3af' : '#475569',
          class: 'warning',
          gradient: isDark 
            ? 'linear-gradient(135deg, rgba(156, 163, 175, 0.15) 0%, rgba(107, 114, 128, 0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(71, 85, 105, 0.1) 0%, rgba(71, 85, 105, 0.03) 100%)',
          border: isDark ? 'rgba(156, 163, 175, 0.3)' : 'rgba(71, 85, 105, 0.2)',
          badgeColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(71, 85, 105, 0.08)'
        };
    }
  };

  const getStatusBadge = (status) => {
    const isDark = theme === 'dark';
    switch (status) {
      case 'approved':
        return (
          <span className="pulse-badge" style={{ 
            background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)', 
            color: isDark ? '#a7f3d0' : 'var(--accent-success)', 
            borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.18)' 
          }}>
            <span className="pulse-dot success" /> Approved
          </span>
        );
      case 'flagged':
        return (
          <span className="pulse-badge" style={{ 
            background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', 
            color: isDark ? '#fecaca' : 'var(--accent-danger)', 
            borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.18)' 
          }}>
            <span className="pulse-dot danger" /> Flagged
          </span>
        );
      default:
        return (
          <span className="pulse-badge" style={{ 
            background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)', 
            color: isDark ? '#fef3c7' : 'var(--accent-warning)', 
            borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.18)' 
          }}>
            <span className="pulse-dot warning" /> Pending
          </span>
        );
    }
  };


  return (
    <div className="app-container">
      {/* Background glow effects for premium dark-mode aura */}
      <div className="glow-blur" />
      <div className="glow-blur-alt" />

      {/* HEADER BAR */}
      <header className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', padding: '1.25rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--gradient-brand)', padding: '0.6rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', lineHeight: '1.2', fontWeight: '800' }}>
              KAVACH <span className="gradient-text">AI</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>कवच AI • Multilingual Toxicity Guard & Sentiment Engine</p>
          </div>
        </div>

        {/* System Health Indicators & Theme Toggle */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="pulse-badge" style={{ background: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)', color: theme === 'dark' ? '#c7d2fe' : 'var(--accent-primary)', fontSize: '0.75rem', borderColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)' }}>
            <Sparkles size={12} style={{ marginRight: '0.1rem' }} /> {modelStatus.method}
          </span>
          <span className="pulse-badge" style={{ background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)', color: theme === 'dark' ? '#a7f3d0' : 'var(--accent-success)', fontSize: '0.75rem', borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)' }}>
            <Laptop size={12} style={{ marginRight: '0.1rem' }} /> {dbMode}
          </span>
          
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Theme Toggle"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="rotate-icon" color="#f59e0b" fill="#f59e0b" />
            ) : (
              <Moon size={16} className="rotate-icon" color="#6366f1" fill="#6366f1" />
            )}
          </button>
        </div>
      </header>

      {/* METRICS COUNTER BAR */}
      <section className="dashboard-grid" style={{ gap: '1rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.25rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
            <Activity size={14} /> Total Audited
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.2rem 0' }}>
            {loadingMetrics ? '—' : metrics?.totalComments || 0}
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Text streams processed</span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.25rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
            <Flame size={14} style={{ color: 'var(--accent-danger)' }} /> Toxicity Ratio
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-danger)', margin: '0.2rem 0' }}>
            {loadingMetrics ? '—' : `${metrics?.totalComments ? Math.round((metrics.toxicComments / metrics.totalComments) * 100) : 0}%`}
          </h2>
          <div className="progress-bar-container" style={{ height: '4px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${metrics?.totalComments ? (metrics.toxicComments / metrics.totalComments) * 100 : 0}%`,
                background: 'var(--gradient-toxic)' 
              }} 
            />
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.25rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
            <TrendingUp size={14} style={{ color: 'var(--accent-success)' }} /> Sentiment Index
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: loadingMetrics ? 'var(--text-primary)' : (metrics?.avgSentiment > 0.15 ? 'var(--accent-success)' : metrics?.avgSentiment < -0.15 ? 'var(--accent-danger)' : 'var(--text-primary)'), margin: '0.2rem 0' }}>
            {loadingMetrics ? '—' : `${metrics.avgSentiment > 0 ? '+' : ''}${parseFloat(metrics.avgSentiment.toFixed(2))}`}
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'capitalize' }}>
            Mood: {loadingMetrics ? '—' : metrics.avgSentiment > 0.15 ? 'Optimistic 😊' : metrics.avgSentiment < -0.15 ? 'Hostile 😠' : 'Balanced 😐'}
          </span>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.25rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
            <Zap size={14} style={{ color: 'var(--accent-primary)' }} /> Classification Speed
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-primary)', margin: '0.2rem 0' }}>
            {avgLatency}ms
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Avg CPU local execution</span>
        </div>
      </section>

      {/* MOBILE COMPACT TABS NAV */}
      <div className="mobile-tabs-nav" style={{ display: 'none', background: theme === 'dark' ? 'rgba(18, 22, 32, 0.8)' : 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '0.35rem' }}>
        <button 
          onClick={() => setActiveTab('playground')}
          className={`tab-btn ${activeTab === 'playground' ? 'active' : ''}`}
          style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-family-title)', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
        >
          <Sparkles size={14} /> Playground
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
          style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-family-title)', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
        >
          <Shield size={14} /> Logs Stream
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-family-title)', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
        >
          <BarChart3 size={14} /> Analytics
        </button>
      </div>

      {/* Styles for compact mobile tabs (embedded cleanly) */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-tabs-nav {
            display: flex !important;
          }
          .main-content-layout {
            grid-template-columns: 1fr !important;
          }
          .desktop-only-pane {
            display: none !important;
          }
          .mobile-active-pane {
            display: flex !important;
          }
        }
        .tab-btn {
          background: transparent;
          color: var(--text-secondary);
        }
        .tab-btn.active {
          background: var(--gradient-brand) !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }
      `}</style>

      {/* CORE WORKSPACE */}
      <main className="main-content-layout">
        
        {/* LEFT COLUMN: INTERACTIVE PLAYGROUND & TOXICITY VISUALIZER */}
        <div 
          className={activeTab === 'playground' ? 'mobile-active-pane' : 'desktop-only-pane'} 
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <Sparkles size={18} className="gradient-text" /> Real-time Dual Classifier
              </h3>
              <span className="pulse-badge" style={{ fontSize: '0.7rem' }}>
                {inputText.length} chars
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or click an example below to analyze Toxicity + Sentiment instantly..."
                style={{ width: '100%', minHeight: '90px', padding: '0.65rem 0.85rem', fontSize: '0.9rem', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Presets grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Click an Example:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto', padding: '0.2rem 0' }}>
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetClick(p)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '8px' }}
                    >
                      <span>{p.emoji}</span>
                      <span style={{ color: p.sentiment === 'positive' ? 'var(--accent-success)' : p.sentiment === 'negative' ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                        {p.lang} ({p.sentiment})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button 
                  onClick={() => setInputText('')} 
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Clear
                </button>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={analyzing || !inputText.trim()}
                  className="btn btn-primary"
                  style={{ opacity: !inputText.trim() ? 0.6 : 1, padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Calculating...
                    </>
                  ) : (
                    <>
                      Verify Mood <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* DUAL RESULTS PANEL */}
          {currentAnalysis && (() => {
            const mood = getSentimentDetails(currentAnalysis.sentimentScore, currentAnalysis.sentimentLabel);
            return (
              <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                {/* Header details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.65rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Comprehensive Analysis Profile</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                      Input: <em style={{ color: theme === 'dark' ? '#ffffff' : 'var(--text-heading)' }}>"{currentAnalysis.text}"</em>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="pulse-badge" style={{ fontSize: '0.7rem', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.04)', color: 'var(--text-secondary)', borderColor: 'var(--glass-border)' }}>
                      Language: {currentAnalysis.languageName}
                    </span>
                    {getStatusBadge(currentAnalysis.status)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
                  
                  {/* Left Column: Toxicity SVG Ring Gauge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(15, 23, 42, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Toxicity Index</span>
                    
                    <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)'} strokeWidth="8" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="none" 
                          stroke={currentAnalysis.isToxic ? 'url(#toxGradApp)' : 'url(#safeGradApp)'} 
                          strokeWidth="8" 
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * currentAnalysis.toxicityScore)}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="safeGradApp" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="toxGradApp" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#e11d48" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800', color: getScoreColor(currentAnalysis.toxicityScore) }}>
                          {Math.round(currentAnalysis.toxicityScore * 100)}%
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: currentAnalysis.isToxic ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                      {currentAnalysis.isToxic ? 'Toxicity Detected' : 'Audited: Clear'}
                    </span>
                  </div>

                  {/* Right Column: Sentiment SVG Slider Gauge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(15, 23, 42, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Sentiment Balance</span>
                    
                    <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)'} strokeWidth="8" />
                        {/* Gauge that works bi-directionally (-1.0 to 1.0) */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="none" 
                          stroke={currentAnalysis.sentimentScore >= 0 ? '#10b981' : '#ef4444'} 
                          strokeWidth="8" 
                          strokeDasharray={251.2}
                          // Offset starts at center (50% = 125.6 offset) and swings left or right
                          strokeDashoffset={125.6 - (125.6 * currentAnalysis.sentimentScore)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800', color: mood.color }}>
                          {currentAnalysis.sentimentScore > 0 ? '+' : ''}{Math.round(currentAnalysis.sentimentScore * 100)}%
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: mood.color }}>
                      {mood.text}
                    </span>
                  </div>
                </div>

                {/* Animated Glassmorphic Sentiment mood face card */}
                <div 
                  className="float-mood"
                  style={{ 
                    background: mood.gradient, 
                    border: `2px solid ${mood.border}`,
                    borderRadius: 'var(--radius-lg)', 
                    padding: '1.15rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(99,102,241,0.05)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Subtle background blur circle */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: mood.color,
                    opacity: 0.1,
                    filter: 'blur(20px)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ 
                    fontSize: '3rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    filter: `drop-shadow(0 4px 12px ${mood.border})`,
                  }}>
                    {mood.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="pulse-badge" style={{ fontSize: '0.65rem', background: mood.badgeColor, color: mood.color, borderColor: mood.border, padding: '0.15rem 0.5rem', marginBottom: '0.35rem' }}>
                      Mood Classification
                    </span>
                    <h5 style={{ fontSize: '1rem', fontWeight: '800', color: theme === 'dark' ? '#ffffff' : 'var(--text-heading)', margin: '0.15rem 0' }}>
                      {mood.text}
                    </h5>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500', margin: 0 }}>
                      {mood.subtext}
                    </p>
                  </div>
                </div>

                {/* Toxicity breakdowns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.85rem' }}>
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Toxicity Breakdown across Dimensions:</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {Object.entries(currentAnalysis.categories || {}).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                          <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                          <span style={{ color: getScoreColor(value) }}>{Math.round(value * 100)}%</span>
                        </div>
                        <div className="progress-bar-container" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${value * 100}%`,
                              background: value > 0.5 ? 'var(--gradient-toxic)' : value > 0.25 ? 'var(--gradient-warning)' : 'var(--gradient-safe)'
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}
        </div>

        {/* LOGS STREAM PANELS */}
        <div 
          className={activeTab === 'moderation' ? 'mobile-active-pane' : 'desktop-only-pane'} 
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} /> System Audit Logs
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Content moderation streams & sentiment data</p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', width: '100%' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: '130px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                    style={{ paddingLeft: '28px', fontSize: '0.75rem', height: '34px', width: '100%' }}
                  />
                </div>

                {/* Language Filter */}
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px', padding: '0.2rem 0.5rem' }}
                >
                  <option value="">All Langs</option>
                  <option value="eng">English</option>
                  <option value="spa">Spanish</option>
                  <option value="fra">French</option>
                  <option value="deu">German</option>
                  <option value="rus">Russian</option>
                  <option value="hin">Hindi</option>
                  <option value="ara">Arabic</option>
                  <option value="por">Portuguese</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px', padding: '0.2rem 0.5rem' }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>

                {/* Sentiment Filter */}
                <select
                  value={filterSentiment}
                  onChange={(e) => setFilterSentiment(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px', padding: '0.2rem 0.5rem' }}
                >
                  <option value="">All Moods</option>
                  <option value="positive">Positive 😊</option>
                  <option value="neutral">Neutral 😐</option>
                  <option value="negative">Negative 😠</option>
                </select>
              </div>
            </div>

            {/* Comment List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '480px', overflowY: 'auto', paddingRight: '0.1rem' }}>
              {loadingComments ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                </div>
              ) : comments.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Shield size={32} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.8rem' }}>No audits log match your query constraints.</span>
                </div>
              ) : (
                comments.map((comment) => {
                  const mood = getSentimentDetails(comment.sentimentScore, comment.sentimentLabel);
                  return (
                    <div 
                      key={comment._id} 
                      className="glass-card" 
                      style={{ 
                        padding: '1rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.65rem',
                        borderLeft: comment.status === 'approved' 
                          ? '3px solid var(--accent-success)' 
                          : comment.status === 'flagged' 
                            ? '3px solid var(--accent-danger)' 
                            : '3px solid var(--accent-warning)',
                        background: theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(15, 23, 42, 0.02)',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '500', maxWidth: '80%', wordBreak: 'break-word', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          "{comment.text}"
                        </p>
                        
                        {/* Right details score badges */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {/* Toxicity Score */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: getScoreColor(comment.toxicityScore) }}>
                              {Math.round(comment.toxicityScore * 100)}%
                            </span>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tox</span>
                          </div>
                          
                          {/* Sentiment Score */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: mood.color }}>
                              {comment.sentimentScore > 0 ? '+' : ''}{Math.round(comment.sentimentScore * 100)}%
                            </span>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valence</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span className="pulse-badge" style={{ fontSize: '0.65rem', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.04)', color: 'var(--text-secondary)', padding: '0.1rem 0.4rem' }}>
                            {comment.languageName}
                          </span>
                          
                          {/* Sentiment Badge */}
                          <span className="pulse-badge" style={{ fontSize: '0.65rem', background: mood.badgeColor, color: mood.color, borderColor: mood.border, padding: '0.1rem 0.4rem' }}>
                            {mood.emoji} {mood.text.split(' ')[0]}
                          </span>
                          
                          {getStatusBadge(comment.status)}
                        </div>

                        {/* Moderation actions */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {comment.status !== 'approved' && (
                            <button
                              onClick={() => handleModerate(comment._id, 'approved')}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                            >
                              <UserCheck size={12} /> Approve
                            </button>
                          )}
                          {comment.status !== 'flagged' && (
                            <button
                              onClick={() => handleModerate(comment._id, 'flagged')}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                            >
                              <AlertTriangle size={12} /> Flag
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(comment._id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px', color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: ANALYTICAL SIDEBAR (TAB 3 ON MOBILE) */}
        <div 
          className={activeTab === 'analytics' ? 'mobile-active-pane' : 'desktop-only-pane'} 
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          
          {/* STATS BREAKDOWN CARD: LANGUAGES */}
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Languages size={16} style={{ color: 'var(--accent-secondary)' }} /> Languages Profile
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {loadingMetrics ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--accent-secondary)' }} />
                </div>
              ) : !metrics?.languages || metrics.languages.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No language distribution data.</span>
              ) : (
                metrics.languages.slice(0, 5).map((l, idx) => {
                  const percentage = metrics.totalComments ? Math.round((l.count / metrics.totalComments) * 100) : 0;
                  const toxicityPercentage = l.count ? Math.round((l.toxicCount / l.count) * 100) : 0;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: '600' }}>{l.language}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{l.count} logs ({percentage}%)</span>
                      </div>
                      
                      <div className="progress-bar-container" style={{ height: '4px' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            background: 'var(--gradient-brand)' 
                          }} 
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.65rem', color: toxicityPercentage > 45 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                        Toxicity Rate: {toxicityPercentage}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* DYNAMIC LINE CHART (7-DAY TREND) USING HIGH-PERFORMANCE SVG */}
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} /> 7-Day Toxicity & Mood Trend
            </h3>

            {loadingMetrics ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
                <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
              </div>
            ) : !metrics?.trend || metrics.trend.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Timeline database empty.</span>
            ) : (() => {
              // Custom SVG generator for dual timeline trends
              const width = 300;
              const height = 120;
              const padding = 15;
              const maxVal = Math.max(...metrics.trend.map(t => t.total), 5); // Avoid division by zero, scale to 5 min
              
              const points = metrics.trend.map((t, idx) => {
                const x = padding + (idx * (width - padding * 2) / (metrics.trend.length - 1));
                const y = height - padding - (t.total * (height - padding * 2) / maxVal);
                return { x, y, ...t };
              });

              const toxicPoints = metrics.trend.map((t, idx) => {
                const x = padding + (idx * (width - padding * 2) / (metrics.trend.length - 1));
                const y = height - padding - (t.toxic * (height - padding * 2) / maxVal);
                return { x, y, ...t };
              });

              // Sentiment swings from -1.0 to +1.0. We map y-axis from center (neutral = 0)
              const sentimentPoints = metrics.trend.map((t, idx) => {
                const x = padding + (idx * (width - padding * 2) / (metrics.trend.length - 1));
                // 0.0 is center (height / 2). +1.0 is top (padding). -1.0 is bottom (height - padding).
                const range = (height - padding * 2) / 2;
                const center = height / 2;
                const y = center - (t.avgSentiment * range);
                return { x, y, ...t };
              });

              const totalPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const toxicPath = toxicPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const sentimentPath = sentimentPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                    {/* Gridlines */}
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke={theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.05)'} />
                    <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15, 23, 42, 0.08)'} />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.15)'} />

                    {/* Total Audits Path */}
                    <path d={totalPath} fill="none" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.25)'} strokeWidth="1.5" strokeDasharray="3,3" />

                    {/* Toxicity Hits Path */}
                    <path d={toxicPath} fill="none" stroke="rgba(239, 68, 68, 0.7)" strokeWidth="2.5" strokeLinecap="round" />
                    {toxicPoints.map((p, idx) => (
                      <circle key={`tox-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#ef4444" />
                    ))}

                    {/* Sentiment Mood Path */}
                    <path d={sentimentPath} fill="none" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="2.5" strokeLinecap="round" />
                    {sentimentPoints.map((p, idx) => (
                      <circle key={`sent-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#10b981" />
                    ))}
                  </svg>
                  
                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(15, 23, 42, 0.3)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Audited</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Toxicity</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Mood Index</span>
                    </div>
                  </div>

                  {/* Dates label */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>{metrics.trend[0]?.date ? new Date(metrics.trend[0].date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</span>
                    <span>{metrics.trend[metrics.trend.length - 1]?.date ? new Date(metrics.trend[metrics.trend.length - 1].date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</span>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* SENTIMENT DISTRIBUTION DONUT CHART PIXEL-ART (CSS GRID & BARS) */}
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Gauge size={16} style={{ color: 'var(--accent-success)' }} /> Sentiment Mood Spread
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {loadingMetrics ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--accent-success)' }} />
                </div>
              ) : (() => {
                const pos = metrics?.sentimentDistribution?.positive || 0;
                const neu = metrics?.sentimentDistribution?.neutral || 0;
                const neg = metrics?.sentimentDistribution?.negative || 0;
                const total = pos + neu + neg || 1;

                const posPct = Math.round((pos / total) * 100);
                const neuPct = Math.round((neu / total) * 100);
                const negPct = Math.round((neg / total) * 100);

                return (
                  <>
                    {/* Compound distribution bar */}
                    <div style={{ display: 'flex', width: '100%', height: '14px', borderRadius: '999px', overflow: 'hidden', margin: '0.2rem 0' }}>
                      <div style={{ width: `${posPct}%`, background: 'var(--accent-success)', transition: 'width 0.5s' }} title={`Positive: ${posPct}%`} />
                      <div style={{ width: `${neuPct}%`, background: '#9ca3af', transition: 'width 0.5s' }} title={`Neutral: ${neuPct}%`} />
                      <div style={{ width: `${negPct}%`, background: 'var(--accent-danger)', transition: 'width 0.5s' }} title={`Negative: ${negPct}%`} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span style={{ color: 'var(--accent-success)', fontWeight: '700' }}>{posPct}% Positive</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{pos} comments</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', alignItems: 'center' }}>
                        <span style={{ color: '#9ca3af', fontWeight: '700' }}>{neuPct}% Neutral</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{neu} comments</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', alignItems: 'flex-end' }}>
                        <span style={{ color: 'var(--accent-danger)', fontWeight: '700' }}>{negPct}% Negative</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{neg} comments</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

        </div>
      </main>

      {/* PREMIUM MULTI-COLUMN FOOTER */}
      <footer className="footer-container" style={{ marginTop: '3rem' }}>
        <div className="footer-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ background: 'var(--gradient-brand)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={12} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-family-title)', fontWeight: '800', color: 'var(--text-heading)', fontSize: '1rem' }}>
              KAVACH <span className="gradient-text">AI</span>
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '300px' }}>
            Armor-plating online platforms with advanced AI content moderation, real-time safety auditing, and multilingual sentiment understanding.
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            © {new Date().getFullYear()} Kavach AI. All Rights Reserved.
          </span>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Dashboard Navigation</h4>
          <ul className="footer-links">
            <li><a href="#playground" onClick={(e) => { e.preventDefault(); setActiveTab('playground'); }} className="footer-link">Classifier Playground</a></li>
            <li><a href="#moderation" onClick={(e) => { e.preventDefault(); setActiveTab('moderation'); }} className="footer-link">System Audit Logs</a></li>
            <li><a href="#analytics" onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }} className="footer-link">Analytics Overview</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Node & Engine Status</h4>
          <ul className="footer-links" style={{ color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="pulse-dot success" style={{ width: '5px', height: '5px' }} /> Classifier Node: <strong style={{ color: 'var(--text-secondary)' }}>Online</strong>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="pulse-dot success" style={{ width: '5px', height: '5px' }} /> Sentiment Service: <strong style={{ color: 'var(--text-secondary)' }}>Active</strong>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="pulse-dot success" style={{ width: '5px', height: '5px' }} /> Database Mode: <strong style={{ color: 'var(--text-secondary)' }}>{dbMode}</strong>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="pulse-dot success" style={{ width: '5px', height: '5px' }} /> System Latency: <strong style={{ color: 'var(--text-secondary)' }}>{avgLatency}ms</strong>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
