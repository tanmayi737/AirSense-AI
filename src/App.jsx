import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Users, Sparkles, Layers, Flame } from 'lucide-react';
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
  const [selectedPersonas, setSelectedPersonas] = useState(['School Child', 'Elderly / Asthma']);

  // Handle Persona Selection for the household
  const handleTogglePersona = (id) => {
    setSelectedPersonas((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((p) => p !== id) : prev;
      }
      return [...prev, id];
    });
  };

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
    <div
      className={`app-viewport-root ${isSeniorVision ? 'senior-vision-mode' : ''}`}
      data-aqi-tier={
        isSeniorVision
          ? undefined
          : !cpcbData
          ? 'good'
          : cpcbData.cpcbAqi <= 50
          ? 'good'
          : cpcbData.cpcbAqi <= 100
          ? 'moderate'
          : 'poor'
      }
    >
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

      {/* Sleek Live Context Pill Bar */}
      <section className="live-context-bar" aria-label="Active Air Quality Context">
        <div className="live-context-container">
          <div className="live-context-pills-left">
            {/* Active City Pill */}
            <div className="context-pill context-city-pill" title="Selected location">
              <strong className="context-main-text">
                {currentCity.name}{currentCity.admin1 ? `, ${currentCity.admin1}` : ''}
              </strong>
            </div>

            {/* CPCB AQI Status Badge */}
            <div
              className="context-pill context-aqi-pill"
              style={{
                backgroundColor:
                  !cpcbData || cpcbData.cpcbAqi <= 100
                    ? '#E7F2EB'
                    : cpcbData.cpcbAqi <= 200
                    ? '#FEF3C7'
                    : '#FEE2E2',
                borderColor:
                  !cpcbData || cpcbData.cpcbAqi <= 100
                    ? '#C8DFD0'
                    : cpcbData.cpcbAqi <= 200
                    ? '#FCD34D'
                    : '#FCA5A5'
              }}
              title="Official Indian CPCB Air Quality Index"
            >
              <span
                className="context-aqi-dot"
                style={{
                  backgroundColor:
                    !cpcbData || cpcbData.cpcbAqi <= 100
                      ? '#1F5132'
                      : cpcbData.cpcbAqi <= 200
                      ? '#B45309'
                      : '#DC2626'
                }}
              />
              <span
                className="context-main-text tabular-nums"
                style={{
                  color:
                    !cpcbData || cpcbData.cpcbAqi <= 100
                      ? '#1F5132'
                      : cpcbData.cpcbAqi <= 200
                      ? '#92400E'
                      : '#B91C1C'
                }}
              >
                CPCB AQI {cpcbData?.cpcbAqi ?? '--'}
              </span>
              <span
                className="context-category-tag"
                style={{
                  color:
                    !cpcbData || cpcbData.cpcbAqi <= 100
                      ? '#1F5132'
                      : cpcbData.cpcbAqi <= 200
                      ? '#92400E'
                      : '#B91C1C'
                }}
              >
                {cpcbData?.category || 'Good'}
              </span>
              {isSimulation && <span className="context-sim-tag"><Flame size={10} /> Smog 360</span>}
            </div>

            {/* Dominant Pollutant */}
            <div className="context-pill context-dominant-pill" title="Main pollutant affecting the air today">
              <span className="context-sub-text">Dominant:</span>
              <strong className="context-main-text">{cpcbData?.dominantPollutant || 'PM2.5'}</strong>
            </div>

            {/* Selected Family Profiles */}
            <div className="context-pill context-profiles-pill" title="Active family profiles">
              <span className="context-sub-text">Profiles:</span>
              <span className="context-main-text">{selectedPersonas.join(' + ')}</span>
            </div>

            {/* Cleanest Window */}
            {cleanWindowData?.hasData && (
              <div className="context-pill context-window-pill" title="Cleanest 2-hour outdoor window today">
                <span className="context-sub-text">Cleanest:</span>
                <span className="context-main-text tabular-nums">{cleanWindowData.displayWindow}</span>
              </div>
            )}
          </div>

          {/* LIVE / SIMULATED Indicator */}
          <div className={`context-live-indicator ${isSimulation ? 'is-sim' : ''}`}>
            <span className="live-dot" />
            <span>{isSimulation ? 'SIMULATED' : 'LIVE'}</span>
          </div>
        </div>
      </section>

      {/* Main Stage */}
      <main className="app-single-viewport-body" id="main-content" role="main">
        {error ? (
          <div className="tactile-card" style={{ padding: '2rem', textAlign: 'center', borderColor: '#DC2626' }}>
            <h3 style={{ color: '#DC2626', marginBottom: '0.5rem' }}>Air Quality Feed Disconnected</h3>
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
              Retry Live Data
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
                  dominantPollutant: cpcbData?.dominantPollutant ?? 'PM2.5',
                  category: cpcbData?.category ?? 'Moderate',
                  time: telemetry?.current?.time
                }}
                cleanWindow={cleanWindowData}
                currentCity={currentCity}
                isSimulation={isSimulation}
                selectedPersonas={selectedPersonas}
                onTogglePersona={handleTogglePersona}
              />
            )}

            {activeTab === 'sanctuary' && (
              <SanctuaryView
                aqiData={cpcbData}
                cleanWindow={cleanWindowData}
                currentCity={currentCity}
                isSimulation={isSimulation}
                selectedPersonas={selectedPersonas}
              />
            )}

            {activeTab === 'advisor' && (
              <AdvisorView
                currentCity={currentCity}
                telemetry={telemetry}
                cpcbData={cpcbData}
                cleanWindow={cleanWindowData}
                isSimulation={isSimulation}
                selectedPersonas={selectedPersonas}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
