# Prepzo Frontend — React 19 + Tailwind CSS Client

The client application for **Prepzo (AI-Powered Communication & Interview Coach)**, built using **React 19**, **Vite**, **Tailwind CSS**, and **Lucide React**.

---

## 🌟 Key Modules & Views

### 1. `TopBar.jsx` — AI Connection HUD & Diagnostics
- **Real-Time AI Status Badge**: Displays `🟢 AI Live (gpt-4o-mini)` when external LLMs are active and `🟡 Heuristic Mode (Fallback)` when the API key is offline or rate-limited.
- **Diagnostics Popover**: Shows provider, model, circuit breaker status (`Engaged` vs `Normal`), and handled fallbacks count.
- **"Test AI Connection" Trigger**: Actively probes backend connectivity via `POST /api/llm/verify` with zero page reload.

### 2. `PracticeScreen.jsx` — Audio & Text Interview Lab
- Real-time speech recording via MediaRecorder API.
- Live waveform vocal HUD and cadence tracker.
- Crisp 1-to-2 line question rendering with competency and difficulty tags.

### 3. `ResultsScreen.jsx` — Multi-Agent Evaluation Dashboard
- **5-Axis SVG Competency Radar**: Polar coordinate visualizer for Technical Depth, Communication, STAR Structure, Vocal Delivery, and Relevance.
- **Interactive Circular SVG Gauges**: Real-time calculated stroke offsets for Overall, Communication, Content, and STAR scores.
- **Round-Aware Score Gauges**: In HR mode, re-orders gauges so Communication and STAR & Leadership appear first.
- **Tab 3 ("How to Improve & Drills")**: Actionable advice drills, candidate quote diagnostic cards, and rewritten exemplar responses.
- **PDF Export**: Generates evaluation reports or prints directly from the browser.

### 4. `PlansScreen.jsx` — 7-Day Personalized Improvement Plan
- Displays day-by-day practice curriculum dynamically generated from candidate's recurring weaknesses.
- "Regenerate Plan" trigger connects directly to `POST /api/candidates/{id}/regenerate-plan`.

### 5. `ResumeAnalysisView.jsx` — PDF Resume & JD Gap Center
- Direct PDF upload or text paste.
- Visual breakdown of matched vs missing skills, work experience analysis, detected projects with measurable impact metrics, and a 3-phase strategic roadmap.

---

## 🚀 Running Locally

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on port 5173)
npm run dev

# Build for production
npm run build
```

---

## 🛠️ Tech Stack
- **Framework**: React 19.2 + Vite 8.3
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **Charts & Graphs**: Recharts + Pure SVG Polar Geometry
