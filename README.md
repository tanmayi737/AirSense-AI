# AeroSense AI — Urban Air Quality Decision Assistant

Built for **Hack2Skill Virtual Prompt Wars** (Challenge 6: Urban Air Quality Assistant).

AeroSense AI delivers hyper-local air quality intelligence, official Central Pollution Control Board (CPCB) analytics, context-aware Gemini AI health advisories, and evaluator-ready winter smog simulations.

---

## 🚀 Key Features

### 1. Live Telemetry & Dual AQI Engine
- **Live Open-Meteo Integration**: Real-time atmospheric criteria pollutants (`PM2.5`, `PM10`, `NO₂`, `O₃`) and hourly forecast vectors.
- **Indian CPCB AQI Engine**: Strict linear interpolation over official Indian breakpoints:
  - PM2.5: 0-30 (Good), 31-60 (Satisfactory), 61-90 (Moderate), 91-120 (Poor), 121-250 (Very Poor), 251+ (Severe).
  - PM10: 0-50 (Good), 51-100 (Satisfactory), 101-250 (Moderate), 251-350 (Poor), 351-430 (Very Poor), 431+ (Severe).
- **Dominant Pollutant Detection**: Dynamically identifies whether fine PM2.5 or coarse PM10 is driving the primary sub-index.
- **Side-by-Side Dual Readout**: Displays Indian CPCB AQI alongside US EPA AQI for global and local benchmarking.

### 2. 24-Hour Clean-Window Finder (`CleanWindowCard.jsx`)
- Computes the sliding 2-hour minimum particulate window across today's hourly forecast.
- Highlights the cleanest outdoor time slot with percentage reduction in particulate exposure vs. current air.
- 24-hour visual bar chart with WHO daily target baseline ($15\ \mu\text{g/m}^3$).

### 3. Context-Aware AI Advisor (`AeroAssistantChat.jsx` & `api/advise.js`)
- **Backend Proxy**: Vercel Serverless Function (`api/advise.js`) powered by `@google/genai` (`GoogleGenAI`) and model `gemini-2.5-flash`.
- **Zero API Key Exposure**: Secrets stay strictly on the backend.
- **Structured Outputs**: Returns JSON containing:
  - `verdictBadge`: `SAFE TO PROCEED` | `PROCEED WITH CAUTION` | `AVOID / INDOORS ONLY`
  - `directAnswer`: 2-sentence direct answer tailored to the question.
  - `whyItMatters`: Explanation linked directly to active PM2.5/PM10 levels.
  - `saferAlternative`: Cleaner time window or route swap.
  - `indoorAction`: Actionable indoor air protection step.
- **Resilient Fallback**: If `GEMINI_API_KEY` is not yet configured, seamlessly switches to a local deterministic decision engine without disrupting the UI.
- **One-Tap Scenario Chips**: Quick family questions for school runs, home ventilation, outdoor jogs, and indoor night-time care.

### 4. Household Decision Matrix & Quantified Sustainability Swaps
- **Family Vulnerability Profiles**: *School Child* 🎒, *Elderly / Asthma* 🫁, *Outdoor Runner* 🏃, *Daily Commuter* 🚗.
- **Activity Scenarios**: *Morning School Run*, *Outdoor Exercise*, *Home Ventilation*, *Daily Commute*.
- **Interactive Indoor Air Care Checklist**: Window sealing vs cross-ventilation rules, damp microfiber mopping, active kitchen exhaust, and dedicated HEPA room.
- **Quantified Mobility Offsets**: Calculates avoided CO₂ (kg), prevented particulate emissions (g), and tree-equivalent absorption.

### 5. Evaluator Simulation Mode
- Prominent toggle button: **"Simulate Winter Smog (AQI 360)"**.
- Injects realistic winter inversion spikes (`pm2_5: 210 μg/m³`, `pm10: 340 μg/m³`, `us_aqi: 360`) with an active `SIMULATION MODE ACTIVE` banner.

---

## 🛠️ Quick Start & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set your Gemini API Key in .env.local
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 3. Start local development server
npm run dev

# 4. Build production bundle
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
