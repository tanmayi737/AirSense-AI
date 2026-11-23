# AeroSense AI — Urban Air Quality Decision Assistant

Built for **Hack2Skill Virtual Prompt Wars** (Challenge 6: Urban Air Quality Assistant).

AeroSense AI delivers hyper-local air quality intelligence, health advisories, and evaluator-ready smog simulation modes for urban environments.

---

## 🚀 Batch 1 Implemented Features

1. **Git & Repository Safety**:
   - Single branch (`main`) structure.
   - Strict `.gitignore` excluding `node_modules/`, `dist/`, `.env*`, and cache files keeping the repository ultra-lightweight (~100 KB total source code, far below the 10 MB limit).

2. **Modern Mobile-First Architecture**:
   - React + Vite JavaScript scaffold.
   - Environmental color palette:
     - Deep Slate Navy: `#0B132B`
     - Forest Teal: `#0D9488`
     - Clean Off-White: `#F8FAFC`
     - High-contrast accessible severity indicators (Good, Moderate, Poor, Very Poor, Severe).

3. **Live Open-Meteo Telemetry Service (`src/services/airQualityService.js`)**:
   - **Geocoding API**: Search Indian & global cities with debouncing (`https://geocoding-api.open-meteo.com/v1/search`).
   - **Air Quality API**: Real-time telemetry (`https://air-quality-api.open-meteo.com/v1/air-quality`) retrieving:
     - `us_aqi` (US Air Quality Index)
     - `pm2_5` (Fine Particulate Matter in μg/m³)
     - `pm10` (Coarse Particulate Matter in μg/m³)
     - `nitrogen_dioxide` (NO₂ in μg/m³)
     - `ozone` (O₃ in μg/m³)
     - Hourly forecast telemetry
   - **Initial Default**: Hyderabad, Telangana, India.
   - **Strict Data Integrity**: Never fakes live data. Clean loading skeleton, manual refresh, and error banner with retry mechanism.

4. **Header & Live Telemetry Hero Dashboard**:
   - Selected city name, state, country, and formatted observation timestamp.
   - Primary circular AQI gauge with accessible color-coded severity badge (Good: 0-50, Moderate: 51-100, Poor: 101-200, Very Poor: 201-300, Severe: 301+).
   - 4-card criteria pollutant breakdown (PM2.5, PM10, NO₂, O₃) with WHO health threshold references.
   - Contextual health advisory recommendations for outdoor exercise, indoor ventilation, and respiratory protection.
   - **Evaluator Toggle: "Simulate Winter Smog (AQI 360)"**:
     - Instant switch into clearly badged `SIMULATION MODE ACTIVE`.
     - Injects realistic winter inversion smog spikes: `us_aqi: 360`, `pm2_5: 210 μg/m³`, `pm10: 340 μg/m³`.
     - Quick "Return to Live" one-click restoration.

---

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build production bundle
npm run build
```
