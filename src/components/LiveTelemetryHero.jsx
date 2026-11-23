import React from 'react';
import {
  MapPin,
  Clock,
  Activity,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { getAqiSeverity, formatObservationTime } from '../services/airQualityService';
import { calculateCpcbAqi } from '../utils/decisionEngine';

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
        <div className="skeleton" style={{ height: '140px', width: '100%', marginBottom: '1rem' }} />
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

  const { current, current_units } = telemetry;
  const usAqiValue = Math.round(current.us_aqi ?? 0);
  const usSeverity = getAqiSeverity(usAqiValue);

  // Indian CPCB AQI Calculation
  const cpcbResult = calculateCpcbAqi(current.pm2_5, current.pm10);
  const observationTime = formatObservationTime(current.time);

  // Pollutant evaluation status
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
      case 'Satisfactory':
        return <ShieldCheck size={15} />;
      case 'Moderate':
        return <Info size={15} />;
      case 'Poor':
      case 'Very Poor':
        return <AlertTriangle size={15} />;
      case 'Severe':
      default:
        return <AlertOctagon size={15} />;
    }
  };

  return (
    <section
      className="hero-card"
      style={{
        '--hero-accent': cpcbResult.color,
        '--sev-color': cpcbResult.color,
        '--sev-bg': `${cpcbResult.color}1F`,
        '--sev-glow': cpcbResult.color
      }}
    >
      {/* Top Location & Timestamp Bar */}
      <div className="hero-meta-bar">
        <div>
          <h2 className="hero-city-title">
            <MapPin size={22} style={{ color: cpcbResult.color }} />
            <span>{isSimulation ? 'Hyderabad (Simulation Target)' : currentCity.name}</span>
          </h2>
          <div className="hero-city-sub">
            <span>{[currentCity.admin1, currentCity.country].filter(Boolean).join(', ')}</span>
            {isSimulation ? (
              <span style={{ color: '#F87171', fontWeight: 700, marginLeft: '0.4rem' }}>
                • Synthetic Smog Chamber Active
              </span>
            ) : (
              <span style={{ color: 'var(--color-teal-light)', fontWeight: 600, marginLeft: '0.4rem' }}>
                • Live Open-Meteo Sensor Telemetry
              </span>
            )}
          </div>
        </div>

        <div className="hero-timestamp" title="Observation capture time">
          <Clock size={13} />
          <span>Observed: {observationTime}</span>
        </div>
      </div>

      {/* Primary Telemetry Grid: Side-by-Side Dual AQI Indices + Health Advisory */}
      <div className="telemetry-primary-grid">
        {/* Dual AQI Display Box: Indian CPCB AQI + US AQI */}
        <div className="dual-aqi-wrapper">
          {/* Primary: Indian CPCB AQI */}
          <div className="aqi-card-primary cpcb-card">
            <div className="aqi-card-top-label">
              <span className="aqi-system-title">Indian CPCB AQI</span>
              <span className="dominant-pollutant-pill" title="Dominant criteria pollutant driving the CPCB AQI">
                <Layers size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                Dominant: {cpcbResult.dominantPollutant}
              </span>
            </div>

            <div className="aqi-card-body">
              <div
                className="aqi-gauge-circle main-gauge"
                style={{
                  borderColor: cpcbResult.color,
                  boxShadow: `0 0 20px ${cpcbResult.color}40`,
                  background: `${cpcbResult.color}15`
                }}
              >
                <span className="aqi-number">{cpcbResult.cpcbAqi}</span>
                <span className="aqi-label">CPCB AQI</span>
              </div>

              <div className="aqi-details-box">
                <div
                  className="severity-badge"
                  style={{
                    backgroundColor: `${cpcbResult.color}20`,
                    borderColor: `${cpcbResult.color}60`,
                    color: cpcbResult.color
                  }}
                >
                  {getSeverityIcon(cpcbResult.category)}
                  <span>{cpcbResult.category}</span>
                </div>
                <p className="aqi-health-desc">{cpcbResult.healthSummary}</p>
                <div className="subindices-readout">
                  <span>Sub-Index PM2.5: <strong>{cpcbResult.pm25SubIndex}</strong></span>
                  <span> • </span>
                  <span>PM10: <strong>{cpcbResult.pm10SubIndex}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary: US AQI */}
          <div className="aqi-card-secondary us-card">
            <div className="aqi-card-top-label">
              <span className="aqi-system-title">US EPA AQI</span>
              <span className="secondary-scale-tag">Global Benchmark</span>
            </div>

            <div className="us-aqi-mini-row">
              <div
                className="us-aqi-pill-box"
                style={{
                  borderColor: usSeverity.color,
                  backgroundColor: usSeverity.bgColor,
                  color: usSeverity.color
                }}
              >
                <span className="us-aqi-val">{usAqiValue}</span>
                <span className="us-aqi-lbl">US AQI</span>
              </div>

              <div className="us-aqi-meta">
                <span className="us-cat-badge" style={{ color: usSeverity.color }}>
                  {usSeverity.level}
                </span>
                <span className="us-cat-sub">{usSeverity.description}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Health & Activity Advisory Card */}
        <div className="hero-health-box">
          <div className="health-box-title">
            <Activity size={14} style={{ color: cpcbResult.color }} />
            <span>Health & Activity Advisory</span>
          </div>
          <ul className="health-guidance-list">
            <li className="health-guidance-item">
              <span className="guidance-dot" style={{ background: cpcbResult.color }} />
              <span>
                <strong>Outdoor Sports / Exercise: </strong>
                {cpcbResult.cpcbAqi > 200
                  ? 'Avoid completely. Microvascular irritation occurs under heavy lung ventilation.'
                  : cpcbResult.cpcbAqi > 100
                  ? 'Limit intense outdoor training; shift high-cardio sessions indoors.'
                  : 'Favorable conditions for outdoor running, cycling, and park walks.'}
              </span>
            </li>
            <li className="health-guidance-item">
              <span className="guidance-dot" style={{ background: cpcbResult.color }} />
              <span>
                <strong>Home Air Sealing: </strong>
                {cpcbResult.cpcbAqi > 200
                  ? 'Keep windows tightly sealed against infiltration. Run HEPA air purification.'
                  : cpcbResult.cpcbAqi > 100
                  ? 'Keep closed during rush hours (8-11 AM & 6-9 PM) when thermal inversion peaks.'
                  : 'Open windows for fresh cross-ventilation during afternoon hours.'}
              </span>
            </li>
            <li className="health-guidance-item">
              <span className="guidance-dot" style={{ background: cpcbResult.color }} />
              <span>
                <strong>Respiratory Protection: </strong>
                {cpcbResult.cpcbAqi > 200
                  ? 'Mandatory fit-tested N95 / N99 mask for essential outdoor transit.'
                  : cpcbResult.cpcbAqi > 100
                  ? 'Recommended for children, elderly, and those with asthmatic history.'
                  : 'No mask required for general healthy population.'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4-Pollutant Breakdown Cards */}
      <div style={{ marginTop: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.65rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>
            Criteria Pollutant Telemetry
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
            WHO Global Air Quality Standards (24h Mean)
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
