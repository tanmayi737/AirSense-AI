# AirSense AI

**Live Demo:** [https://airsense-ai-delta.vercel.app](https://airsense-ai-delta.vercel.app)

AirSense AI is an urban air quality decision assistant built for Indian households. Instead of showing raw pollutant numbers alone, it translates live air quality readings into clear, everyday guidance for school runs, outdoor exercise, home ventilation, and commuting.

---

## 1. Chosen Vertical

**Challenge 6 — Urban Air Quality Decision Assistant**

Most air quality apps stop at reporting an AQI number. AirSense AI bridges the gap between raw pollutant concentrations and practical household decisions across Indian cities (such as Hyderabad, Delhi, Mumbai, and Bengaluru), tailored to specific family members including school children, elderly or asthmatic adults, outdoor runners, and daily commuters.

---

## 2. Approach and Logic

- **Official Indian CPCB NAQI Calculation**: `src/utils/decisionEngine.js` computes sub-indices for `PM2.5` and `PM10` using linear interpolation across Central Pollution Control Board (CPCB) breakpoints (`0–500`), taking the higher sub-index as the overall CPCB AQI and identifying the dominant pollutant.
- **Normal vs. Abnormal Benchmark**: CPCB AQI values are mapped to six bands (`Good` 0–50, `Satisfactory` 51–100, `Moderate` 101–200, `Poor` 201–300, `Very Poor` 301–400, `Severe` 401–500), where `<= 100` is Normal and `> 100` is Abnormal.
- **WHO Safe Target Ratios**: Individual pollutant cards compare live `PM2.5` (WHO `<= 15 µg/m³`), `PM10` (`<= 45 µg/m³`), `NO2` (`<= 25 µg/m³`), and `O3` (`<= 100 µg/m³`) against 24-hour WHO guidelines.
- **Cigarette-Equivalent Exposure**: Daily `PM2.5` exposure is expressed as `PM2.5 / 22` cigarettes/day equivalent for quick intuitive understanding.
- **Daily Safe Breathing Allowance**: Calculates the percentage of a `180 µg` WHO 24-hour dust allowance consumed by an outing based on activity breathing intensity and transport/mask multipliers (`Walking: 1.0x`, `Open Auto / Bike: 1.35x`, `Metro / AC Car: 0.45x`, `N95 Masked: 0.25x`).
- **24-Hour Cleanest-Window Finder**: Scans the next 24 hours of hourly `PM2.5` forecasts using a sliding 2-hour window to highlight the cleanest period of the day for outdoor walks or home ventilation.

---

## 3. How the Solution Works

- **Frontend (React + Vite)**: Fetches live hourly air quality and geocoding data from Open-Meteo (`src/services/airQualityService.js`) with a 5-minute in-memory session cache and renders four views:
  - **Pulse**: City AQI ring gauge, 10-second family verdict with one-click copy, pollutant bars, CPCB Normal vs. Abnormal benchmark scale, and an interactive 24-hour Clean-Window Ribbon.
  - **Household**: Family profile selector, activity and duration controls, transport/mask exposure selector, Daily Safe Breathing Allowance gauge, and per-profile `GO` / `MODIFY` / `AVOID` decision cards.
  - **Sanctuary**: Smart window ventilation schedule, indoor clean-air checklist, and a sustainable commute offset calculator (CO2, PM2.5, trees equivalent, and fuel savings).
  - **Advisor**: Natural-language Q&A grounded in the active city's live readings.
- **Serverless AI Proxy (`/api/advise.js`)**: A Vercel serverless function using `@google/genai` (`gemini-3.5-flash-lite` on `v1beta` with `thinkingLevel: 'LOW'` and automatic fallback to `gemini-3.6-flash` / `gemini-3.8-flash` on `503`/`404` errors) returning structured JSON output (`responseSchema`). `GEMINI_API_KEY` stays strictly on the server.
- **Automatic Local Fallback**: If `GEMINI_API_KEY` is unconfigured or the network is unavailable, the app automatically falls back to the deterministic local rule engine in `src/utils/decisionEngine.js` so guidance remains available.

---

## 4. Assumptions Made

- **Inhalation Baselines**: The `180 µg` daily safe breathing allowance assumes standard adult and school-child breathing rates scaled by activity exertion multipliers (`0.6x` resting to `2.2x` running).
- **Transport & Mask Attenuation**: Exposure multipliers (`1.35x` for open two-wheelers/autos, `0.45x` for sealed AC cars/Metro, `0.25x` for fitted N95 masks) represent average urban filtration and enclosure effects.
- **Ventilation Timing**: Natural window-opening recommendations rely on hourly outdoor `PM2.5` dispersion trends to avoid morning and evening traffic trapping.
- **Smog Simulation Mode**: The `Simulate Smog` toggle injects synthetic winter inversion readings (`360` US AQI, `210 µg/m³ PM2.5`, `340 µg/m³ PM10`) so evaluators can stress-test high-alert UI states and indoor containment advice on demand.
- **Preventive Scope**: All recommendations are environmental air-awareness guidance and not medical advice.

---

## Local Setup & Testing

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional for live Gemini Advisor)
# Create .env.local and add:
# GEMINI_API_KEY=your_gemini_api_key_here

# 3. Start local development server
npm run dev

# 4. Run unit tests (25 tests)
npm test

# 5. Build for production
npm run build
```

---

## License

MIT License
