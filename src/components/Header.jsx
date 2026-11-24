import React from 'react';
import { Wind, RefreshCw, Flame, Eye, Activity, Users, Home, Bot } from 'lucide-react';
import CitySearch from './CitySearch';
import { CITY_PRESETS } from '../services/airQualityService';

export default function Header({
  currentCity,
  onSelectCity,
  isSimulation,
  onToggleSimulation,
  onRefresh,
  isLoading,
  isSeniorVision,
  onToggleSeniorVision,
  activeTab,
  onSelectTab
}) {
  const tabs = [
    { id: 'pulse', label: 'Pulse', icon: <Activity size={14} /> },
    { id: 'household', label: 'Household', icon: <Users size={14} /> },
    { id: 'sanctuary', label: 'Sanctuary', icon: <Home size={14} /> },
    { id: 'advisor', label: 'Advisor', icon: <Bot size={14} /> }
  ];

  return (
    <header className="app-command-navbar" role="banner">
      <div className="navbar-container">
        {/* LEFT: Brand Mark + Compact Inline City Search + 1-Click Preset Pills */}
        <div className="navbar-left-cluster">
          <div className="brand-instrument-mark" aria-label="AirSense AI Brand Mark">
            <div className="brand-dot-beacon" />
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
                    title={`Switch telemetry to ${preset.name}`}
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
        <nav className="navbar-center-tabs" role="tablist" aria-label="Primary Instrument Navigation">
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
                <span className="tab-pill-icon">{tab.icon}</span>
                <span className="tab-pill-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT: Tactile Toggles & Manual Refresh */}
        <div className="navbar-right-cluster">
          {/* Simulate Winter Smog (360) Pill */}
          <button
            type="button"
            className={`pill-toggle-btn smog-toggle-btn ${isSimulation ? 'active' : ''}`}
            onClick={onToggleSimulation}
            title={
              isSimulation
                ? 'Exit Simulation Mode and return to Live Open-Meteo Telemetry'
                : 'Simulate severe winter smog conditions (AQI 360, PM2.5 210)'
            }
            aria-pressed={isSimulation}
            aria-label="Simulate Winter Smog AQI 360"
          >
            <Flame size={13} />
            <span>{isSimulation ? 'Smog: 360' : 'Simulate Smog'}</span>
          </button>

          {/* High Contrast / Senior Vision Mode Pill */}
          <button
            type="button"
            className={`pill-toggle-btn vision-toggle-btn ${isSeniorVision ? 'active' : ''}`}
            onClick={onToggleSeniorVision}
            title={
              isSeniorVision
                ? 'Disable High-Contrast Senior Vision Mode'
                : 'Enable High-Contrast Senior Vision Mode'
            }
            aria-pressed={isSeniorVision}
            aria-label="High-Contrast Mode"
          >
            <Eye size={13} />
            <span>{isSeniorVision ? 'Contrast: On' : 'Contrast'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            className="navbar-refresh-icon-btn"
            onClick={onRefresh}
            disabled={isLoading || isSimulation}
            title={isSimulation ? 'Simulation Active (Refresh disabled)' : 'Refresh Live Telemetry'}
            aria-label="Refresh live data"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-animate' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
}
