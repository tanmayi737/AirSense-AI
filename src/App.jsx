import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import SimulationBanner from './components/SimulationBanner';
import ErrorBanner from './components/ErrorBanner';
import LiveTelemetryHero from './components/LiveTelemetryHero';
import CleanWindowCard from './components/CleanWindowCard';
import AeroAssistantChat from './components/AeroAssistantChat';
import HouseholdMatrix from './components/HouseholdMatrix';
import {
  DEFAULT_CITY,
  WINTER_SMOG_SIMULATION,
  fetchLiveAirQuality
} from './services/airQualityService';
import {
  calculateCpcbAqi,
  findBestOutdoorWindow
} from './utils/decisionEngine';

export default function App() {
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);
  const [telemetry, setTelemetry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSimulation, setIsSimulation] = useState(false);

  // Load live air quality data
  const loadAirQuality = useCallback(async (city) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLiveAirQuality(city.latitude, city.longitude);
      setTelemetry(data);
    } catch (err) {
      console.error('Air Quality API fetch error:', err);
      setError(err.message || 'Unable to retrieve live Open-Meteo air quality data.');
      setTelemetry(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: Default to Hyderabad, India
  useEffect(() => {
    loadAirQuality(DEFAULT_CITY);
  }, [loadAirQuality]);

  // Handle City Selection
  const handleSelectCity = (city) => {
    setCurrentCity(city);
    setIsSimulation(false); // Reset simulation mode on new city search
    loadAirQuality(city);
  };

  // Toggle Winter Smog Simulation
  const handleToggleSimulation = () => {
    if (!isSimulation) {
      setIsSimulation(true);
      setError(null);
      setTelemetry(WINTER_SMOG_SIMULATION);
    } else {
      setIsSimulation(false);
      loadAirQuality(currentCity);
    }
  };

  // Exit Simulation
  const handleExitSimulation = () => {
    setIsSimulation(false);
    loadAirQuality(currentCity);
  };

  // Manual Refresh
  const handleRefresh = () => {
    if (isSimulation) return;
    loadAirQuality(currentCity);
  };

  // Calculate Indian CPCB AQI data
  const cpcbData = useMemo(() => {
    if (!telemetry || !telemetry.current) return null;
    return calculateCpcbAqi(telemetry.current.pm2_5, telemetry.current.pm10);
  }, [telemetry]);

  // Calculate 24-hour best outdoor window
  const cleanWindowData = useMemo(() => {
    if (!telemetry) return null;
    return findBestOutdoorWindow(telemetry.hourly, telemetry.current?.pm2_5);
  }, [telemetry]);

  return (
    <div className="bg-canvas">
      {/* Active Winter Smog Simulation Notification Banner */}
      {isSimulation && <SimulationBanner onExitSimulation={handleExitSimulation} />}

      {/* App Header with Brand, City Search, Simulation Toggle & Refresh */}
      <Header
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        isSimulation={isSimulation}
        onToggleSimulation={handleToggleSimulation}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Main Body */}
      <main className="main-content">
        <div className="container">
          {/* Live Error Banner if API Call Fails */}
          {error && <ErrorBanner message={error} onRetry={() => loadAirQuality(currentCity)} />}

          {/* Primary Telemetry Dashboard: Indian CPCB + US AQI Dual Readout */}
          <LiveTelemetryHero
            telemetry={telemetry}
            currentCity={currentCity}
            isLoading={isLoading}
            isSimulation={isSimulation}
          />

          {/* Clean 2-Hour Window Finder & 24h Hourly Forecast Trend */}
          {telemetry && (
            <CleanWindowCard
              cleanWindowData={cleanWindowData}
              currentPm25={telemetry.current?.pm2_5}
            />
          )}

          {/* Context-Aware AI Chat Assistant (Gemini 2.5 Flash Proxy) */}
          {telemetry && (
            <AeroAssistantChat
              currentCity={currentCity}
              telemetry={telemetry}
              cpcbData={cpcbData}
              cleanWindow={cleanWindowData}
              isSimulation={isSimulation}
            />
          )}

          {/* Household Decision Matrix + Indoor Air Care Checklist + Sustainable Swaps */}
          {telemetry && (
            <HouseholdMatrix
              aqiData={{
                cpcbAqi: cpcbData?.cpcbAqi ?? 100,
                usAqi: telemetry.current?.us_aqi ?? 100,
                pm2_5: telemetry.current?.pm2_5 ?? 35,
                pm10: telemetry.current?.pm10 ?? 45,
                dominantPollutant: cpcbData?.dominantPollutant ?? 'PM2.5'
              }}
              cleanWindow={cleanWindowData}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>
            <strong>AeroSense AI</strong> — Urban Air Quality Decision Assistant • Built for Hack2Skill Virtual Prompt Wars (Challenge 6)
          </p>
          <p style={{ marginTop: '0.25rem', opacity: 0.75 }}>
            AI Engine: Google Gemini 2.5 Flash • CPCB India Formulations & WHO Guidelines • Real-time Telemetry: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
