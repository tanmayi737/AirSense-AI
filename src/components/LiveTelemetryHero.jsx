import React from 'react';
import {
  MapPin,
  Clock,
  Activity,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Info
} from 'lucide-react';
import { getAqiSeverity, formatObservationTime } from '../services/airQualityService';

export default function LiveTelemetryHero({
  telemetry,
  currentCity,
  isLoading,
  isSimulation
}) {
  if (isLoading && !telemetry) {
    return (
      <section className="hero-card">
        <div className="skeleton" style={{ height: '32px', width: '240px', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '120px', width: '100%', marginBottom: '1rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
          <div className="skeleton" style={{ height: '80px' }} />
          <div className="skeleton" style={{ height: '80px' }} />
          <div className="skeleton" style={{ height: '80px' }} />
          <div className="skeleton" style={{ height: '80px' }} />
        </div>
      </section>
    );
  }

  if (!telemetry || !telemetry.current) {
    return null;
  }

  const { current, current_units, hourly } = telemetry;
  const aqiValue = Math.round(current.us_aqi ?? 0);
  const severity = getAqiSeverity(aqiValue);
  const observationTime = formatObservationTime(current.time);

  // Pollutant helper to evaluate status vs safe guideline
  const getPollutantStatus = (val, thresholds) => {
    if (val <= thresholds.good) return { label: 'Normal', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (val <= thresholds.moderate) return { label: 'Elevated', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    return { label: 'High', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' };
  };

  const pm25Status = getPollutantStatus(current.pm2_5, { good: 15, moderate: 35 });
  const pm10Status = getPollutantStatus(current.pm10, { good: 45, moderate: 100 });
  const no2Status = getPollutantStatus(current.nitrogen_dioxide, { good: 25, moderate: 50 });
  const o3Status = getPollutantStatus(current.ozone, { good: 100, moderate: 160 });

  const getSeverityIcon = (level) => {
    switch (level) {
      case 'Good':
        return <ShieldCheck size={16} />;
      case 'Moderate':
        return <Info size={16} />;
      case 'Poor':
      case 'Very Poor':
        return <AlertTriangle size={16} />;
      case 'Severe':
      default:
        return <AlertOctagon size={16} />;
    }
  };

  return (
    <section
      className="hero-card"
      style={{
        '--hero-accent': severity.color,
        '--sev-color': severity.color,
        '--sev-bg': severity.bgColor,
        '--sev-glow': severity.borderColor
      }}
    >
      {/* Top Location & Timestamp Bar */}
      <div className="hero-meta-bar">
        <div>
          <h2 className="hero-city-title">
            <MapPin size={22} style={{ color: severity.color }} />
            <span>{isSimulation ? 'Hyderabad (Simulation Target)' : currentCity.name}</span>
          </h2>
          <div className="hero-city-sub">
            <span>{[currentCity.admin1, currentCity.country].filter(Boolean).join(', ')}</span>
            {isSimulation ? (
              <span style={{ color: '#F87171', fontWeight: 700, marginLeft: '0.4rem' }}>
                • Synthetic Smog Chamber
              </span>
            ) : (
              <span style={{ color: 'var(--color-teal-light)', fontWeight: 600, marginLeft: '0.4rem' }}>
                • Live Open-Meteo Sensor Feed
              </span>
            )}
          </div>
        </div>

        <div className="hero-timestamp" title="Observation capture time">
          <Clock size={13} />
          <span>Observed: {observationTime}</span>
        </div>
      </div>

      {/* Main AQI & Health Telemetry Grid */}
      <div className="telemetry-primary-grid">
        {/* Large AQI Gauge & Severity Category */}
        <div className="aqi-main-box">
          <div className="aqi-gauge-circle" aria-label={`Current US AQI is ${aqiValue}`}>
            <span className="aqi-number">{aqiValue}</span>
            <span className="aqi-label">US AQI</span>
          </div>

          <div className="aqi-details-box">
            <div className={`severity-badge ${severity.badgeClass}`}>
              {getSeverityIcon(severity.level)}
              <span>{severity.level}</span>
            </div>
            <p className="aqi-health-desc">{severity.description}</p>
            <div className="aqi-action-advice">
              <Activity size={13} />
              <span>{severity.healthAction}</span>
            </div>
          </div>
        </div>

        {/* Actionable Health Guidance Box */}
        <div className="hero-health-box">
          <div className="health-box-title">
            <Activity size={14} style={{ color: severity.color }} />
            <span>Health & Activity Advisory</span>
          </div>
          <ul className="health-guidance-list">
            <li className="health-guidance-item">
              <span className="guidance-dot" />
              <span>
                <strong>Outdoor Sports / Jogging: </strong>
                {aqiValue > 150
                  ? 'Avoid completely. Switch to indoor aerobic exercises with filtered air.'
                  : aqiValue > 100
                  ? 'Limit strenuous outdoor workouts; sensitive groups should stay indoors.'
                  : 'Favorable conditions for running, cycling, and park walks.'}
              </span>
            </li>
            <li className="health-guidance-item">
              <span className="guidance-dot" />
              <span>
                <strong>Home Ventilation: </strong>
                {aqiValue > 150
                  ? 'Keep windows tightly sealed. Run HEPA air purifiers on continuous mode.'
                  : aqiValue > 100
                  ? 'Close windows during rush hours (8-11 AM & 6-9 PM).'
                  : 'Open windows for fresh air circulation during midday.'}
              </span>
            </li>
            <li className="health-guidance-item">
              <span className="guidance-dot" />
              <span>
                <strong>Respiratory Protection: </strong>
                {aqiValue > 200
                  ? 'Mandatory fit-tested N95 / N99 mask for essential outdoor transit.'
                  : aqiValue > 100
                  ? 'Recommended for children, elderly, and asthmatic individuals.'
                  : 'No mask required for general healthy population.'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4-Pollutant Breakdown Cards */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.65rem'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>
            Criteria Air Pollutant Telemetry
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
            WHO Global Air Quality Guidelines
          </span>
        </div>

        <div className="pollutants-grid">
          {/* PM2.5 */}
          <div className="pollutant-card">
            <div className="pollutant-header">
              <span className="pollutant-name">PM2.5</span>
              <span
                className="pollutant-status-pill"
                style={{ color: pm25Status.color, background: pm25Status.bg }}
              >
                {pm25Status.label}
              </span>
            </div>
            <div className="pollutant-value-wrap">
              <span className="pollutant-val">{current.pm2_5?.toFixed(1) ?? '--'}</span>
              <span className="pollutant-unit">{current_units?.pm2_5 || 'μg/m³'}</span>
            </div>
            <p className="pollutant-baseline">Fine particulate matter • WHO target ≤ 15 μg/m³</p>
          </div>

          {/* PM10 */}
          <div className="pollutant-card">
            <div className="pollutant-header">
              <span className="pollutant-name">PM10</span>
              <span
                className="pollutant-status-pill"
                style={{ color: pm10Status.color, background: pm10Status.bg }}
              >
                {pm10Status.label}
              </span>
            </div>
            <div className="pollutant-value-wrap">
              <span className="pollutant-val">{current.pm10?.toFixed(1) ?? '--'}</span>
              <span className="pollutant-unit">{current_units?.pm10 || 'μg/m³'}</span>
            </div>
            <p className="pollutant-baseline">Coarse dust & smoke • WHO target ≤ 45 μg/m³</p>
          </div>

          {/* NO2 */}
          <div className="pollutant-card">
            <div className="pollutant-header">
              <span className="pollutant-name">NO₂</span>
              <span
                className="pollutant-status-pill"
                style={{ color: no2Status.color, background: no2Status.bg }}
              >
                {no2Status.label}
              </span>
            </div>
            <div className="pollutant-value-wrap">
              <span className="pollutant-val">{current.nitrogen_dioxide?.toFixed(1) ?? '--'}</span>
              <span className="pollutant-unit">{current_units?.nitrogen_dioxide || 'μg/m³'}</span>
            </div>
            <p className="pollutant-baseline">Vehicular exhaust • WHO target ≤ 25 μg/m³</p>
          </div>

          {/* O3 */}
          <div className="pollutant-card">
            <div className="pollutant-header">
              <span className="pollutant-name">O₃ (Ozone)</span>
              <span
                className="pollutant-status-pill"
                style={{ color: o3Status.color, background: o3Status.bg }}
              >
                {o3Status.label}
              </span>
            </div>
            <div className="pollutant-value-wrap">
              <span className="pollutant-val">{current.ozone?.toFixed(1) ?? '--'}</span>
              <span className="pollutant-unit">{current_units?.ozone || 'μg/m³'}</span>
            </div>
            <p className="pollutant-baseline">Ground-level smog • WHO target ≤ 100 μg/m³</p>
          </div>
        </div>
      </div>
    </section>
  );
}
