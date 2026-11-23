import React from 'react';
import { Wind, RefreshCw, Flame, Activity } from 'lucide-react';
import CitySearch from './CitySearch';

export default function Header({
  currentCity,
  onSelectCity,
  isSimulation,
  onToggleSimulation,
  onRefresh,
  isLoading
}) {
  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand */}
        <div className="brand-wrap">
          <div className="brand-logo-icon" aria-hidden="true">
            <Wind size={22} />
          </div>
          <div>
            <h1 className="brand-title">
              AeroSense <span className="ai-badge">AI</span>
            </h1>
            <p className="brand-subtitle">Urban Air Quality Decision Assistant</p>
          </div>
        </div>

        {/* Search City */}
        <CitySearch onSelectCity={onSelectCity} currentCity={currentCity} />

        {/* Action Controls */}
        <div className="header-actions">
          {/* Simulation Toggle Button */}
          <button
            type="button"
            className={`btn-sim-toggle ${isSimulation ? 'active' : ''}`}
            onClick={onToggleSimulation}
            title={
              isSimulation
                ? 'Exit Simulation Mode and return to Live Open-Meteo Telemetry'
                : 'Simulate severe winter smog conditions (AQI 360, PM2.5 210)'
            }
            aria-pressed={isSimulation}
          >
            <Flame size={14} />
            <span>{isSimulation ? 'Exit Smog Sim' : 'Simulate Winter Smog (AQI 360)'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            className="btn-refresh"
            onClick={onRefresh}
            disabled={isLoading || isSimulation}
            title={isSimulation ? 'Simulation Active (Refresh disabled)' : 'Refresh Live Telemetry'}
            aria-label="Refresh live data"
          >
            <RefreshCw size={16} className={isLoading ? 'spin-animate' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
}
