import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import PulseView from './components/PulseView';
import HouseholdView from './components/HouseholdView';
import SanctuaryView from './components/SanctuaryView';
import AdvisorView from './components/AdvisorView';
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
  const [activeTab, setActiveTab] = useState('pulse');
  const [announcement, setAnnouncement] = useState('');

  // Helper for screen reader announcements
  const announce = useCallback((message) => {
    setAnnouncement(message);
    const timer = setTimeout(() => setAnnouncement(''), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Load air quality data
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
    setIsSimulation(false);
    loadAirQuality(city);
  };

  // Toggle Winter Smog Simulation
  const handleToggleSimulation = () => {
    if (!isSimulation) {
      setIsSimulation(true);
      setError(null);
      setTelemetry(WINTER_SMOG_SIMULATION);
      announce('Winter Smog Simulation Mode active (AQI 360).');
    } else {
      setIsSimulation(false);
      loadAirQuality(currentCity);
      announce('Exited simulation mode. Returned to live Open-Meteo telemetry.');
    }
  };

  // Manual Refresh
  const handleRefresh = () => {
    if (isSimulation) return;
    loadAirQuality(currentCity, true);
    announce(`Refreshing live telemetry for ${currentCity.name}.`);
  };

  // Toggle High Contrast / Senior Vision Mode
  const handleToggleSeniorVision = () => {
    setIsSeniorVision((prev) => {
      const next = !prev;
      announce(next ? 'High Contrast mode enabled.' : 'High Contrast mode disabled.');
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
    <div className={`app-viewport-root ${isSeniorVision ? 'senior-vision-mode' : ''}`}>
      {/* Screen Reader Live Announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {/* Sticky 64px Command Navbar */}
      <Header
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        isSimulation={isSimulation}
        onToggleSimulation={handleToggleSimulation}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isSeniorVision={isSeniorVision}
        onToggleSeniorVision={handleToggleSeniorVision}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Single-Viewport Main Stage */}
      <main className="app-single-viewport-body" id="main-content" role="main">
        {error ? (
          <div className="tactile-card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--color-terracotta)' }}>
            <h3 style={{ color: 'var(--color-terracotta)', marginBottom: '0.5rem' }}>Telemetry Feed Disconnected</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error}</p>
            <button
              onClick={() => loadAirQuality(currentCity, true)}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-moss)',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Retry Live Telemetry
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'pulse' && (
              <PulseView
                telemetry={telemetry}
                currentCity={currentCity}
                cpcbData={cpcbData}
                cleanWindow={cleanWindowData}
                isSimulation={isSimulation}
              />
            )}

            {activeTab === 'household' && (
              <HouseholdView
                aqiData={{
                  cpcbAqi: cpcbData?.cpcbAqi ?? 100,
                  usAqi: telemetry?.current?.us_aqi ?? 100,
                  pm2_5: telemetry?.current?.pm2_5 ?? 35,
                  pm10: telemetry?.current?.pm10 ?? 45,
                  dominantPollutant: cpcbData?.dominantPollutant ?? 'PM2.5'
                }}
                cleanWindow={cleanWindowData}
              />
            )}

            {activeTab === 'sanctuary' && (
              <SanctuaryView
                aqiData={cpcbData}
                cleanWindow={cleanWindowData}
              />
            )}

            {activeTab === 'advisor' && (
              <AdvisorView
                currentCity={currentCity}
                telemetry={telemetry}
                cpcbData={cpcbData}
                cleanWindow={cleanWindowData}
                isSimulation={isSimulation}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
