import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Info,
  Layers,
  Wind
} from 'lucide-react';

export default function PulseView({
  telemetry,
  currentCity,
  cpcbData,
  cleanWindow,
  isSimulation
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!telemetry || !telemetry.current) {
    return (
      <div className="view-loading-panel">
        <div className="tactile-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Calibrating atmospheric sensors...</p>
        </div>
      </div>
    );
  }

  const { current, current_units } = telemetry;
  const cpcbAqi = cpcbData?.cpcbAqi || Math.round(current.us_aqi || 0);
  const usAqi = Math.round(current.us_aqi || 0);
  const category = cpcbData?.category || 'Moderate';
  const dominantPollutant = cpcbData?.dominantPollutant || 'PM2.5';
  const pm25 = current.pm2_5 != null ? current.pm2_5.toFixed(1) : '--';
  const pm10 = current.pm10 != null ? current.pm10.toFixed(1) : '--';
  const no2 = current.nitrogen_dioxide != null ? current.nitrogen_dioxide.toFixed(1) : '--';
  const o3 = current.ozone != null ? current.ozone.toFixed(1) : '--';

  // Dynamic Atmospheric Tint Color
  // Good/Satisfactory: Soft Botanical Sage Mist
  // Moderate: Warm Parchment Ochre
  // Poor/Very Poor/Severe: Fired Terracotta Clay Mist
  let tintStyle = {
    radial: 'radial-gradient(circle at center, rgba(45, 90, 39, 0.08) 0%, rgba(240, 238, 233, 0) 70%)',
    badgeColor: 'var(--color-moss)',
    badgeBg: 'rgba(45, 90, 39, 0.1)',
    badgeBorder: 'rgba(45, 90, 39, 0.25)'
  };

  if (cpcbAqi > 250) {
    tintStyle = {
      radial: 'radial-gradient(circle at center, rgba(200, 75, 49, 0.14) 0%, rgba(240, 238, 233, 0) 70%)',
      badgeColor: 'var(--color-terracotta)',
      badgeBg: 'rgba(200, 75, 49, 0.12)',
      badgeBorder: 'rgba(200, 75, 49, 0.3)'
    };
  } else if (cpcbAqi > 100) {
    tintStyle = {
      radial: 'radial-gradient(circle at center, rgba(217, 119, 6, 0.1) 0%, rgba(240, 238, 233, 0) 70%)',
      badgeColor: '#B45309',
      badgeBg: 'rgba(217, 119, 6, 0.1)',
      badgeBorder: 'rgba(217, 119, 6, 0.25)'
    };
  }

  // 10-Second Family Briefing Sentence
  let familyBriefing = '';
  if (isSimulation) {
    familyBriefing = `Simulating severe winter inversion smog in ${currentCity.name} (AQI 360). Mandatory indoor isolation for school children and seniors; run HEPA air cleaners continuously.`;
  } else if (cpcbAqi > 250) {
    familyBriefing = `Critical smog alert in ${currentCity.name}. Infiltration of fine ${dominantPollutant} is severe—cancel outdoor workouts, keep all windows sealed, and wear N95 masks for essential travel.`;
  } else if (cpcbAqi > 100) {
    familyBriefing = `Air quality in ${currentCity.name} is moderately polluted (${dominantPollutant} dominant). Safe for healthy commutes, but asthmatic seniors and children should shift outdoor activity to the midday sun window.`;
  } else {
    familyBriefing = `Air quality in ${currentCity.name} is clean and well-dispersed today. Safe for all outdoor school runs, marathon training, and active natural window ventilation.`;
  }

  // Scrubbable Ribbon Data
  const hourlyPoints = cleanWindow?.hourlyPoints || [];
  const maxPm = Math.max(...hourlyPoints.map((p) => p.pm2_5), 45);
  const activePoint = hoveredPoint || (hourlyPoints.find((p) => p.isBestWindow) || hourlyPoints[12] || hourlyPoints[0]);

  return (
    <div className="tab-view-container pulse-view-layout">
      {/* LEFT PANEL (60%): Concentric Dial & Criteria Pollutants */}
      <div className="pulse-left-panel">
        <div className="tactile-card dial-hero-card" style={{ background: tintStyle.radial, backgroundColor: 'var(--surface-card)' }}>
          {/* Top City & State Meta Bar */}
          <div className="dial-header-meta">
            <div className="city-label-group">
              <span className="location-pin-icon" aria-hidden="true">
                <MapPin size={16} />
              </span>
              <h2 className="current-city-heading">
                {currentCity.name}
                <span className="city-admin-sub">
                  {[currentCity.admin1, currentCity.country].filter(Boolean).join(', ')}
                </span>
              </h2>
            </div>

            <div className="dominant-pill-badge" title="Criteria pollutant driving the CPCB AQI">
              <Layers size={12} />
              <span>Dominant: {dominantPollutant}</span>
            </div>
          </div>

          {/* Concentric Dual-AQI Dial */}
          <div className="concentric-dial-stage">
            <div className="concentric-dial-outer" style={{ borderColor: tintStyle.badgeBorder }}>
              <div className="concentric-dial-inner">
                {/* Primary Indian CPCB AQI */}
                <div className="dial-primary-readout">
                  <span className="dial-number tabular-nums" style={{ color: tintStyle.badgeColor }}>
                    {cpcbAqi}
                  </span>
                  <span className="dial-metric-label">CPCB AQI</span>
                </div>

                {/* Status Badge */}
                <div
                  className="dial-category-badge"
                  style={{
                    color: tintStyle.badgeColor,
                    backgroundColor: tintStyle.badgeBg,
                    borderColor: tintStyle.badgeBorder
                  }}
                >
                  {cpcbAqi > 250 ? (
                    <AlertOctagon size={13} />
                  ) : cpcbAqi > 100 ? (
                    <AlertTriangle size={13} />
                  ) : (
                    <ShieldCheck size={13} />
                  )}
                  <span>{category}</span>
                </div>

                {/* Secondary US AQI Comparison Pill */}
                <div className="dial-secondary-pill">
                  <span className="sec-us-label">US EPA:</span>
                  <strong className="tabular-nums">{usAqi}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 10-Second Family Briefing Banner */}
          <div className="family-briefing-callout">
            <span className="briefing-tag">10-Second Family Verdict</span>
            <p className="briefing-sentence">{familyBriefing}</p>
          </div>

          {/* 4-Criteria Pollutant Hardware Strip */}
          <div className="criteria-pollutants-strip">
            <div className="criteria-item">
              <span className="crit-label">PM2.5</span>
              <span className="crit-val tabular-nums">{pm25}</span>
              <span className="crit-unit">µg/m³</span>
              <span className="crit-who">WHO ≤ 15</span>
            </div>
            <div className="criteria-item">
              <span className="crit-label">PM10</span>
              <span className="crit-val tabular-nums">{pm10}</span>
              <span className="crit-unit">µg/m³</span>
              <span className="crit-who">WHO ≤ 45</span>
            </div>
            <div className="criteria-item">
              <span className="crit-label">NO₂</span>
              <span className="crit-val tabular-nums">{no2}</span>
              <span className="crit-unit">µg/m³</span>
              <span className="crit-who">WHO ≤ 25</span>
            </div>
            <div className="criteria-item">
              <span className="crit-label">O₃</span>
              <span className="crit-val tabular-nums">{o3}</span>
              <span className="crit-unit">µg/m³</span>
              <span className="crit-who">WHO ≤ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (40%): 24-Hour Clean-Window Scrubbable Ribbon */}
      <div className="pulse-right-panel">
        <div className="tactile-card ribbon-card">
          <div className="ribbon-card-header">
            <div>
              <span className="subcard-kicker">24-Hour Atmospheric Trajectory</span>
              <h3 className="ribbon-title">Clean-Window Ribbon</h3>
            </div>

            {/* Best Window Pill */}
            {cleanWindow?.hasData && (
              <div className="ribbon-best-window-pill">
                <Sparkles size={13} style={{ color: 'var(--color-moss)' }} />
                <span>Cleanest: {cleanWindow.displayWindow}</span>
              </div>
            )}
          </div>

          {/* Scrubbing Micro-Readout */}
          <div className="scrub-micro-readout">
            {activePoint ? (
              <div className="micro-readout-content">
                <div className="micro-time-group">
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                  <span className="micro-time-val">{activePoint.hourLabel}</span>
                </div>
                <div className="micro-stat-group">
                  <span className="micro-pm-val tabular-nums">
                    {activePoint.pm2_5} <small>µg/m³</small>
                  </span>
                  {activePoint.isBestWindow && (
                    <span className="micro-best-tag">Optimal Window ({cleanWindow?.cleanerPercent}% cleaner)</span>
                  )}
                </div>
              </div>
            ) : (
              <span className="micro-placeholder">Hover across the ribbon to scrub hourly levels</span>
            )}
          </div>

          {/* Scrubbable Waveform Bars */}
          <div className="scrubbable-waveform-track">
            {/* WHO 15 ug line */}
            <div
              className="waveform-who-baseline"
              style={{ bottom: `${Math.min(90, (15 / maxPm) * 100)}%` }}
            >
              <span>WHO Target 15 µg/m³</span>
            </div>

            <div className="waveform-bars-wrap">
              {hourlyPoints.map((pt) => {
                const heightPct = Math.min(100, Math.max(10, (pt.pm2_5 / maxPm) * 100));
                const isSelected = activePoint?.index === pt.index;

                return (
                  <div
                    key={pt.index}
                    className={`waveform-bar-col ${pt.isBestWindow ? 'is-moss-window' : ''} ${
                      isSelected ? 'is-active-scrub' : ''
                    }`}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => setHoveredPoint(pt)}
                    onTouchStart={() => setHoveredPoint(pt)}
                  >
                    <div className="waveform-bar-pillar">
                      <div
                        className="waveform-bar-fill"
                        style={{
                          height: `${heightPct}%`,
                          background: pt.isBestWindow
                            ? 'var(--color-moss)'
                            : pt.pm2_5 > 120
                            ? 'var(--color-terracotta)'
                            : pt.pm2_5 > 60
                            ? '#D97706'
                            : '#78716C'
                        }}
                      />
                    </div>
                    <span className="waveform-hour-tick">
                      {pt.index % 4 === 0 ? pt.hourLabel.replace(':00', '').replace(' ', '') : '•'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practical Planning Note */}
          <div className="ribbon-footer-summary">
            <Info size={14} style={{ color: 'var(--color-moss)', flexShrink: 0 }} />
            <p>
              Scrub across the 24-hour timeline to target outdoor errands during{' '}
              <strong style={{ color: 'var(--color-moss)' }}>{cleanWindow?.displayWindow || '11:00 AM – 1:00 PM'}</strong>.
              Avoid early morning inversion peaks (7–10 AM) when particulates remain trapped near street level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
