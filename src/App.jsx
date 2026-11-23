import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SimulationBanner from './components/SimulationBanner';
import ErrorBanner from './components/ErrorBanner';
import LiveTelemetryHero from './components/LiveTelemetryHero';
import {
  DEFAULT_CITY,
  WINTER_SMOG_SIMULATION,
  fetchLiveAirQuality
} from './services/airQualityService';

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

          {/* Primary Telemetry Dashboard */}
          <LiveTelemetryHero
            telemetry={telemetry}
            currentCity={currentCity}
            isLoading={isLoading}
            isSimulation={isSimulation}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>
            <strong>AeroSense AI</strong> — Urban Air Quality Decision Assistant • Built for Hack2Skill Virtual Prompt Wars (Challenge 6)
          </p>
          <p style={{ marginTop: '0.25rem', opacity: 0.75 }}>
            Real-time Telemetry: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo High-Resolution Air Quality API</a> • Evaluator Simulation Ready
          </p>
        </div>
      </footer>
    </div>
  );
}
