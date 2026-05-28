# AI Interview Guardian 🛡️🎙️

An advanced, futuristic (Jarvis-style) cybersecurity-themed live webcam confidence and attentiveness analyzer. It utilizes real-time client-side face tracking inside the browser and runs a periodic 3-second frame capture pipeline feeding into **Google Gemini 2.5 Flash** via a Node.js + Express backend. 

It generates holographic-style behavioral telemetry dials, focus progress meters, chronological telemetry logs, dynamic SVG graphs, and a comprehensive compiled "Guardian Verdict" final report.

---

## 🚀 Key Features

1. **Cyberpunk HUD Targeting Tracker**: Overlay brackets on the canvas that latch onto the candidate's face in real-time.
2. **Visual Scan Overlay**: A pulsating laser scanning bar overlaying the webcam stream.
3. **Double-Layered Alert System**: Blinking warning indicators and synthesized cyber-audio alerts (using HTML5 Web Audio API, so no external assets are required) that trigger if a candidate leaves the frame or multiple faces appear.
4. **Structured Gemini Composure Spectrum**: Analyzes base64 webcam frames every 3 seconds for Confidence, Focus Level, Eye Gaze Alignment, Dominant Emotion, and logs concise AI Strategic Feedback.
5. **Real-time Trend Charting**: A custom, glowing SVG line graph mapping historic metrics as the interview progresses.
6. **Polished Summary Audit Modal**: Compile an interactive, military-style validation record that displays aggregated averages and strategic growth recommendations.
7. **Smart Fallback Simulator**: Pro-hackathon feature that falls back to rich simulated telemetry logs and fluctuation matrices if the Gemini API key is not yet configured, preventing backend crashes!

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React + Vite + TailwindCSS v4 + Lucide Icons + `react-webcam` + `@vladmandic/face-api` (via CDN)
- **Backend**: Node.js + Express + `@google/genai` (Official SDK) + `dotenv` + `cors`
- **Model**: `gemini-2.5-flash`

---

## 📦 Rapid Setup & Execution

### 1. Configure Environmental Keys
Open the `.env` file at the root of the workspace:
```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
PORT=5000
```
*(If the key is left empty or as the placeholder, the system will run in **Simulator Sandbox Mode** so the UI remains fully functional and testable!)*

---

### 2. Boot the Express Backend
Open a terminal in the `backend/` directory:
```bash
cd backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000` with active `--watch` hot-reloading.

---

### 3. Launch the Vite Frontend
Open another terminal in the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
The client dashboard will launch at `http://localhost:5173`. Open this URL in your browser to experience the live telemetry HUD!

---

## 📂 Project Organization

```
geminiHackday/
├── backend/
│   ├── package.json
│   ├── server.js        # Express, Gemini JSON Schemas, Simulator Mode
│   └── .env
├── frontend/
│   ├── index.html       # Loads futuristic fonts & face-api.js CDN
│   ├── vite.config.js   # Custom TailwindCSS v4 bundler config
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── index.css    # Core cyber styles: scanlines, custom glows, grids
│       ├── utils/
│       │   └── audio.js  # Web Audio API synthesizers (Lock beeps / Warnings)
│       └── components/
│           ├── Dashboard.jsx        # Main command telemetry center
│           ├── WebcamAnalyzer.jsx    # Webcam streams & face brackets overlays
│           ├── AnalyticsChart.jsx    # Custom glowing SVG trend graphs
│           └── FinalReportModal.jsx  # Candidate assessment summaries
└── README.md
```
