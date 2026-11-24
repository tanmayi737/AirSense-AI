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
  Wind,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { getFamilyBriefing } from '../utils/decisionEngine';

export default function PulseView({
  telemetry,
  currentCity,
  cpcbData,
  cleanWindow,
  isSimulation
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [copied, setCopied] = useState(false);

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

  // 10-Second Family Briefing Sentence with Secondary Gas Spike Awareness
  const familyBriefing = getFamilyBriefing({
    cpcbAqi,
    cityName: currentCity.name,
    dominantPollutant,
    isSimulation,
    o3: current.ozone,
    no2: current.nitrogen_dioxide,
    pm25: current.pm2_5,
    pm10: current.pm10
  });

  const handleCopyBriefing = async () => {
    const cleanest = cleanWindow?.displayWindow || '11:00 AM – 1:00 PM';
    const summaryText = [
      `🌿 AirSense AI — Daily Air Briefing for ${currentCity.name}`,
      `• CPCB AQI: ${cpcbAqi} (${category}) | Dominant: ${dominantPollutant}`,
      `• Cleanest Outdoor Window: ${cleanest}`,
      `• Family Verdict: ${familyBriefing}`
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summaryText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy briefing:', err);
    }
  };

  // Scrubbable Ribbon & Time-Travel Data
  const hourlyPoints = cleanWindow?.hourlyPoints || [];
  const maxPm = Math.max(...hourlyPoints.map((p) => p.pm2_5), 45);
  const currentHourIndex = new Date().getHours();
  const currentHourPoint = hourlyPoints[currentHourIndex] || hourlyPoints[0];
  const activePoint = hoveredPoint || selectedPoint || currentHourPoint;
  const isTimeTraveling = Boolean(
    (selectedPoint && selectedPoint.index !== currentHourPoint?.index) ||
    (hoveredPoint && hoveredPoint.index !== currentHourPoint?.index)
  );

  const getPointCategory = (pm) => {
    if (pm <= 30) return { label: 'Good', color: '#10B981' };
    if (pm <= 60) return { label: 'Satisfactory', color: '#84CC16' };
    if (pm <= 90) return { label: 'Moderate', color: '#F59E0B' };
    if (pm <= 120) return { label: 'Poor', color: '#F97316' };
    if (pm <= 250) return { label: 'Very Poor', color: '#EF4444' };
    return { label: 'Severe', color: '#991B1B' };
  };

  const activeCategory = activePoint ? getPointCategory(activePoint.pm2_5) : null;

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
            {isTimeTraveling && (
              <div className="time-travel-dial-pill" role="status">
                <Clock size={11} />
                <span>Previewing {activePoint.hourLabel} • {activePoint.pm2_5} µg/m³ ({activeCategory?.label})</span>
              </div>
            )}
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

            {/* 24h PM2.5 Cigarette Equivalent Pill below the AQI Dial */}
            {current.pm2_5 != null && (
              <div
                className="dial-cigarette-pill"
                title={`≈ ${(current.pm2_5 / 22).toFixed(1)} cigarettes/day based on WHO 24h PM2.5 exposure equivalence (22 µg/m³ ≈ 1 cigarette/day)`}
              >
                <span aria-hidden="true">🚬</span>
                <span className="tabular-nums">{(current.pm2_5 / 22).toFixed(1)}</span>
                <span className="cig-label">cigarettes/day equiv.</span>
              </div>
            )}
          </div>

          {/* 10-Second Family Briefing Banner */}
          <div className="family-briefing-callout">
            <div className="briefing-header-row">
              <span className="briefing-tag">10-Second Family Verdict</span>
              <button
                type="button"
                className={`copy-briefing-btn ${copied ? 'is-copied' : ''}`}
                onClick={handleCopyBriefing}
                title="Copy shareable daily family air briefing to clipboard"
                aria-label="Copy Daily Family Briefing"
              >
                {copied ? (
                  <>
                    <Check size={12} />
                    <span>Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Briefing</span>
                  </>
                )}
              </button>
            </div>
            <p className="briefing-sentence">{familyBriefing}</p>
          </div>

          {/* 4-Criteria Pollutant Hardware Strip */}
          <div className="criteria-pollutants-strip">
            {/* PM2.5 */}
            <div className="criteria-item">
              <div className="crit-item-top">
                <span className="crit-label">PM2.5</span>
                <span className="crit-who">WHO ≤ 15</span>
              </div>
              <div className="crit-val-row">
                <span className="crit-val tabular-nums">{pm25}</span>
                <span className="crit-unit">µg/m³</span>
              </div>
              <div className="crit-progress-track" title={`${pm25} / 15 µg/m³ WHO limit`}>
                <div
                  className="crit-progress-bar"
                  style={{
                    width: `${Math.min(100, Math.max(4, ((Number(current.pm2_5) || 0) / 15) * 100))}%`,
                    backgroundColor: (Number(current.pm2_5) || 0) <= 15 ? 'var(--color-moss)' : 'var(--color-terracotta)'
                  }}
                />
              </div>
              <p className="crit-explainer">
                Invisible smoke & exhaust dust (30× thinner than a hair) — WHO 24h safe limit is 15 µg/m³.
              </p>
            </div>

            {/* PM10 */}
            <div className="criteria-item">
              <div className="crit-item-top">
                <span className="crit-label">PM10</span>
                <span className="crit-who">WHO ≤ 45</span>
              </div>
              <div className="crit-val-row">
                <span className="crit-val tabular-nums">{pm10}</span>
                <span className="crit-unit">µg/m³</span>
              </div>
              <div className="crit-progress-track" title={`${pm10} / 45 µg/m³ WHO limit`}>
                <div
                  className="crit-progress-bar"
                  style={{
                    width: `${Math.min(100, Math.max(4, ((Number(current.pm10) || 0) / 45) * 100))}%`,
                    backgroundColor: (Number(current.pm10) || 0) <= 45 ? 'var(--color-moss)' : 'var(--color-terracotta)'
                  }}
                />
              </div>
              <p className="crit-explainer">
                Coarse road & construction dust (irritates eyes & throat) — WHO 24h safe limit is 45 µg/m³.
              </p>
            </div>

            {/* NO2 */}
            <div className="criteria-item">
              <div className="crit-item-top">
                <span className="crit-label">NO₂</span>
                <span className="crit-who">WHO ≤ 25</span>
              </div>
              <div className="crit-val-row">
                <span className="crit-val tabular-nums">{no2}</span>
                <span className="crit-unit">µg/m³</span>
              </div>
              <div className="crit-progress-track" title={`${no2} / 25 µg/m³ WHO limit`}>
                <div
                  className="crit-progress-bar"
                  style={{
                    width: `${Math.min(100, Math.max(4, ((Number(current.nitrogen_dioxide) || 0) / 25) * 100))}%`,
                    backgroundColor: (Number(current.nitrogen_dioxide) || 0) <= 25 ? 'var(--color-moss)' : 'var(--color-terracotta)'
                  }}
                />
              </div>
              <p className="crit-explainer">
                Pungent vehicle exhaust gas — WHO 24h safe limit is 25 µg/m³.
              </p>
            </div>

            {/* O3 */}
            <div className="criteria-item">
              <div className="crit-item-top">
                <span className="crit-label">O₃</span>
                <span className="crit-who">WHO ≤ 100</span>
              </div>
              <div className="crit-val-row">
                <span className="crit-val tabular-nums">{o3}</span>
                <span className="crit-unit">µg/m³</span>
              </div>
              <div className="crit-progress-track" title={`${o3} / 100 µg/m³ WHO limit`}>
                <div
                  className="crit-progress-bar"
                  style={{
                    width: `${Math.min(100, Math.max(4, ((Number(current.ozone) || 0) / 100) * 100))}%`,
                    backgroundColor: (Number(current.ozone) || 0) <= 100 ? 'var(--color-moss)' : 'var(--color-terracotta)'
                  }}
                />
              </div>
              <p className="crit-explainer">
                Ground-level smog formed when sunlight hits fumes — WHO safe limit is 100 µg/m³.
              </p>
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

            <div className="ribbon-header-actions">
              {/* Quick Reset to Current Hour Button */}
              {isTimeTraveling && (
                <button
                  type="button"
                  className="reset-hour-btn"
                  onClick={() => {
                    setSelectedPoint(null);
                    setHoveredPoint(null);
                  }}
                  title="Reset preview back to current hour"
                  aria-label="Reset to Current Hour"
                >
                  <RotateCcw size={11} />
                  <span>Reset to Current</span>
                </button>
              )}

              {/* Best Window Pill */}
              {cleanWindow?.hasData && (
                <div className="ribbon-best-window-pill">
                  <Sparkles size={13} style={{ color: 'var(--color-moss)' }} />
                  <span>Cleanest: {cleanWindow.displayWindow}</span>
                </div>
              )}

              {/* WHO Target Legend Badge */}
              <div className="ribbon-who-legend-badge" title="WHO 24h PM2.5 Guideline: 15 µg/m³">
                <span className="who-legend-dash" aria-hidden="true" />
                <span>WHO Target 15 µg/m³</span>
              </div>
            </div>
          </div>

          {/* Scrubbing Micro-Readout */}
          <div className={`scrub-micro-readout ${isTimeTraveling ? 'is-scrubbed-active' : ''}`}>
            {activePoint ? (
              <div className="micro-readout-content">
                <div className="micro-time-group">
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                  <span className="micro-time-val">{activePoint.hourLabel}</span>
                  {activePoint.index === currentHourPoint?.index ? (
                    <span className="micro-curr-tag">Current Hour</span>
                  ) : (
                    <span className="micro-preview-tag">Time-Travel Preview</span>
                  )}
                  {activeCategory && (
                    <span
                      className="micro-category-pill"
                      style={{
                        color: activeCategory.color,
                        borderColor: `${activeCategory.color}50`,
                        backgroundColor: `${activeCategory.color}15`
                      }}
                    >
                      {activeCategory.label}
                    </span>
                  )}
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
              <span className="micro-placeholder">Hover or tap across the ribbon to scrub hourly levels</span>
            )}
          </div>

          {/* Scrubbable Waveform Bars */}
          <div className="scrubbable-waveform-track">
            {/* Subtle dashed horizontal WHO reference baseline (label moved to top-right legend badge to prevent bar overlap) */}
            <div
              className="waveform-who-baseline"
              style={{ bottom: `${Math.min(90, (15 / maxPm) * 100)}%` }}
              aria-hidden="true"
            />

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
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setSelectedPoint(pt)}
                    onTouchStart={() => setSelectedPoint(pt)}
                    title={`${pt.hourLabel}: ${pt.pm2_5} µg/m³`}
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
