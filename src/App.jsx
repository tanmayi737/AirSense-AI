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
  const [isSeniorVision, setIsSeniorVision] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Helper for screen reader announcements
  const announce = useCallback((message) => {
    setAnnouncement(message);
    const timer = setTimeout(() => setAnnouncement(''), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Load live air quality data
  const loadAirQuality = useCallback(
    async (city, bypassCache = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchLiveAirQuality(city.latitude, city.longitude, bypassCache);
        setTelemetry(data);
        announce(`Air quality updated for ${city.name}. US AQI is ${Math.round(data.current?.us_aqi || 0)}.`);
      } catch (err) {
        console.error('Air Quality API fetch error:', err);
        setError(err.message || 'Unable to retrieve live Open-Meteo air quality data.');
        setTelemetry(null);
        announce(`Failed to fetch air quality data for ${city.name}.`);
      } finally {
        setIsLoading(false);
      }
    },
    [announce]
  );

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
      announce('Winter Smog Simulation Mode is now active. Simulating severe winter smog at AQI 360.');
    } else {
      setIsSimulation(false);
      loadAirQuality(currentCity);
      announce('Exited simulation mode. Returned to live Open-Meteo telemetry.');
    }
  };

  // Exit Simulation
  const handleExitSimulation = () => {
    setIsSimulation(false);
    loadAirQuality(currentCity);
    announce('Exited simulation mode. Returned to live Open-Meteo telemetry.');
  };

  // Manual Refresh (bypasses in-memory cache)
  const handleRefresh = () => {
    if (isSimulation) return;
    loadAirQuality(currentCity, true);
    announce(`Refreshing live telemetry for ${currentCity.name}.`);
  };

  // Toggle High-Contrast / Senior Vision Mode
  const handleToggleSeniorVision = () => {
    setIsSeniorVision((prev) => {
      const next = !prev;
      announce(next ? 'Senior Vision and High Contrast mode enabled.' : 'Senior Vision mode disabled.');
      return next;
    });
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
    <div className={`bg-canvas ${isSeniorVision ? 'senior-vision-mode' : ''}`}>
      {/* Screen Reader Live Announcement Region */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {/* Active Winter Smog Simulation Notification Banner */}
      {isSimulation && <SimulationBanner onExitSimulation={handleExitSimulation} />}

      {/* App Header with Brand, City Search, Senior Vision Toggle, Simulation Toggle & Refresh */}
      <Header
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        isSimulation={isSimulation}
        onToggleSimulation={handleToggleSimulation}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isSeniorVision={isSeniorVision}
        onToggleSeniorVision={handleToggleSeniorVision}
      />

      {/* Main Body */}
      <main className="main-content" id="main-content">
        <div className="container">
          {/* Live Error Banner if API Call Fails */}
          {error && <ErrorBanner message={error} onRetry={() => loadAirQuality(currentCity, true)} />}

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
      <footer className="app-footer" role="contentinfo">
        <div className="container">
          <p>
            <strong>AeroSense AI</strong> — Urban Air Quality Decision Assistant • Built for Hack2Skill Virtual Prompt Wars (Challenge 6)
          </p>
          <p style={{ marginTop: '0.25rem', opacity: 0.75 }}>
            Formulations: Central Pollution Control Board (CPCB India) & WHO Guidelines • Real-time Telemetry: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a> • Accessible & Senior Vision Ready
          </p>
        </div>
      </footer>
    </div>
  );
}
