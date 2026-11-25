import React from 'react';
import { RefreshCw, Flame } from 'lucide-react';
import CitySearch from './CitySearch';
import { CITY_PRESETS } from '../services/airQualityService';

export default function Header({
  currentCity,
  onSelectCity,
  isSimulation,
  onToggleSimulation,
  onRefresh,
  isLoading,
  activeTab,
  onSelectTab
}) {
  const tabs = [
    { id: 'pulse', label: 'Pulse' },
    { id: 'household', label: 'Household' },
    { id: 'sanctuary', label: 'Sanctuary' },
    { id: 'advisor', label: 'Advisor' }
  ];

  return (
    <header className="app-command-navbar" role="banner">
      <div className="navbar-container">
        {/* LEFT: Brand Mark + Compact Inline City Search + 1-Click Preset Pills */}
        <div className="navbar-left-cluster">
          <div className="brand-instrument-mark" aria-label="AirSense AI Brand Mark">
            <span className="brand-name-text">AirSense</span>
            <span className="brand-suffix-pill">AI</span>
          </div>

          <div className="navbar-city-search-cluster">
            <div className="navbar-city-search-wrap">
              <CitySearch onSelectCity={onSelectCity} currentCity={currentCity} />
            </div>

            {/* 1-Click City Preset Pills */}
            <div className="navbar-city-presets" role="group" aria-label="Quick-switch city presets">
              {CITY_PRESETS.map((preset) => {
                const isSelected = currentCity?.name?.toLowerCase() === preset.name.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    className={`city-preset-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => onSelectCity(preset)}
                    title={`Switch air quality view to ${preset.name}`}
                    aria-pressed={isSelected}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER: Segmented Pill Tab Bar */}
        <nav className="navbar-center-tabs" role="tablist" aria-label="Primary Navigation">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                className={`segmented-pill-tab ${isActive ? 'active' : ''}`}
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
              >
                <span className="tab-pill-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT: DEMO Label + Simulate Smog Button + Subtle Refresh */}
        <div className="navbar-right-cluster">
          <span className="navbar-demo-label">DEMO</span>

          <button
            type="button"
            className={`pill-toggle-btn smog-toggle-btn ${isSimulation ? 'active' : ''}`}
            onClick={onToggleSimulation}
            title={
              isSimulation
                ? 'Exit Simulation Mode and return to Live Open-Meteo data'
                : 'Simulate severe winter smog conditions (AQI 360, PM2.5 210)'
            }
            aria-pressed={isSimulation}
            aria-label="Simulate Winter Smog AQI 360"
          >
            {isSimulation && <Flame size={13} />}
            <span>{isSimulation ? 'Smog: 360 (Exit)' : 'Simulate Smog'}</span>
          </button>

          <button
            type="button"
            className="navbar-refresh-icon-btn"
            onClick={onRefresh}
            disabled={isLoading || isSimulation}
            title={isSimulation ? 'Simulation Active (Refresh disabled)' : 'Refresh Live Data'}
            aria-label="Refresh live data"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-animate' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
}
