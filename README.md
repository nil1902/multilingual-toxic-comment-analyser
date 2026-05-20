# Kavach AI (कवच AI) • Multilingual Safety Guard & Sentiment Engine

**Kavach AI** (derived from the Sanskrit word *Kavach*, meaning "Armor" or "Shield") is a premium, state-of-the-art **Multilingual Content Toxicity Guard & Real-Time Sentiment Analysis** dashboard. It acts as a protective shield for online platforms, forums, and chat streams by dynamically auditing incoming content, classifying toxicity across multiple dimensions, and evaluating user sentiments in real-time.

---

## 🛠️ Complete Tech Stack

### 1. Front-End Core
- **React (v18) + Vite**: Ultra-fast hot module reloading (HMR) and lightweight asset compilation.
- **Modern Styling (Vanilla CSS)**: Hand-crafted HSL-tailored Dark/Light theme toggle, smooth transitions, glassmorphism panel overlays (`backdrop-filter`), and animated floating glow blur highlights. **Zero external CSS dependencies.**
- **Zero-Latency SVG Engines**: Custom inline SVGs paint circular progress gauges and multi-line timeline trend graphs, eliminating bulky external chart libraries.

### 2. Back-End Core
- **Express.js Server**: Serves lightweight REST APIs.
- **Dual-Database Resiliency (MongoDB & Local JSON DB Fallback)**:
  - If a MongoDB instance is present, it connects seamlessly using **Mongoose**.
  - If MongoDB is offline, it automatically falls back to a **Local JSON Database (`backend/data/db.json`)** that mimics standard database queries.

---

## 🧠 Under-the-Hood NLP & Machine Learning

1. **Automatic Language Profiler (`franc-min`)**: Detects **8 primary global languages** (*English, Spanish, French, German, Hindi, Arabic, Russian, Portuguese*) and translates script indicators in ~1ms.
2. **Toxicity ML Engine (Local ONNX HuggingFace Model)**:
   - Leverages **HuggingFace ONNX Web Runtime** (`@xenova/transformers`) to run the **`Xenova/toxic-bert`** sequence classification model directly on the local Node.js process CPU!
   - **No paid external APIs or Python runtimes are required.**
   - Classifies text in **~50ms** across **6 categories**: *toxic, severe_toxic, obscene, threat, insult, and identity_hate*.
3. **Sentiment Analysis Engine (Dictionary Lexicons + Toxicity Correction Penalty)**:
   - Computes continuous sentiment valence ranging from **`-1.0` (Highly Negative)** to **`+1.0` (Highly Positive)** using an 8-language word-level sentiment lexicon.
   - **Cross-Toxicity Semantic Correction**: If a comment's toxicity score exceeds `0.45`, it applies a mathematical penalty:
     $$\text{Valence} = \max(-1.0, \text{Raw Valence} - (\text{Toxicity} \times 0.8))$$
     This prevents toxic insults from returning a deceptively positive score.

---

## 🚀 Netlify & Render "Same Link" Hosting Sync

The codebase contains a built-in monorepo build sync script that lets you deploy the static React frontend on Netlify and the backend on Render under the **exact same domain link**, completely avoiding CORS blockages:

- **[`netlify.toml`](./netlify.toml)**: Tells Netlify how to compile the React client.
- **[`frontend/setup-netlify.js`](./frontend/setup-netlify.js)**: Runs during the build phase to read the `BACKEND_URL` environment variable and dynamically construct a `_redirects` file in the build output (`dist`) folder. Netlify then proxies all `/api/*` traffic transparently to your backend!

---

## 💻 Quick Start & Installation

### Local Development
1. **Clone the repository:**
   ```bash
   git clone https://github.com/nil1902/multilingual-toxic-comment-analyser.git
   cd multilingual-toxic-comment-analyser
   ```

2. **Start the Express backend:**
   ```bash
   cd backend
   npm install
   npm run dev   # Runs on http://localhost:5000
   ```

3. **Start the React frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev   # Runs on http://localhost:3000
   ```

---

## 🎨 Rebranding & UI Showcases
- **Kavach AI Shield branding** with Sanskrit-inspired typography and live node speed telemetry.
- **Premium Light/Dark Mode toggle** with harmonious HSL state variables.
- **Dual Gauge Visualizer** showing dynamic bidirectional circular indicators for both Toxicity and Sentiment Valence.
- **Multi-column Premium Footer** containing live classifier health signals.
