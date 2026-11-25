import React, { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { getFamilyBriefing } from '../utils/decisionEngine';

const CPCB_BENCHMARK_BANDS = [
  {
    id: 'good',
    range: '0–50',
    min: 0,
    max: 50,
    label: 'Good',
    statusWord: 'NORMAL',
    desc: 'Normal · Clean air',
    bg: '#EAF4EE',
    border: '#1F5132',
    pillBg: '#D4EAE0',
    pillText: '#1F5132'
  },
  {
    id: 'satisfactory',
    range: '51–100',
    min: 51,
    max: 100,
    label: 'Satisfactory',
    statusWord: 'NORMAL',
    desc: 'Normal · Minor sensitivity',
    bg: '#F4F7E8',
    border: '#4D7C0F',
    pillBg: '#E6EECC',
    pillText: '#3F6212'
  },
  {
    id: 'moderate',
    range: '101–200',
    min: 101,
    max: 200,
    label: 'Moderate',
    statusWord: 'ELEVATED',
    desc: 'Elevated · Caution for kids/asthma',
    bg: '#FAF4E4',
    border: '#B45309',
    pillBg: '#FDE68A',
    pillText: '#92400E'
  },
  {
    id: 'poor',
    range: '201–300',
    min: 201,
    max: 300,
    label: 'Poor',
    statusWord: 'ABNORMAL',
    desc: 'Abnormal · Limit outdoor exertion',
    bg: '#FAF0E6',
    border: '#C2410C',
    pillBg: '#FED7AA',
    pillText: '#9A3412'
  },
  {
    id: 'very-poor',
    range: '301–400',
    min: 301,
    max: 400,
    label: 'Very Poor',
    statusWord: 'ABNORMAL',
    desc: 'Abnormal · Avoid outdoors',
    bg: '#F9ECEC',
    border: '#DC2626',
    pillBg: '#FECACA',
    pillText: '#991B1B'
  },
  {
    id: 'severe',
    range: '401–500',
    min: 401,
    max: 500,
    label: 'Severe',
    statusWord: 'HAZARDOUS',
    desc: 'Hazardous · Stay indoors, N95',
    bg: '#F5ECF2',
    border: '#991B1B',
    pillBg: '#F5D0FE',
    pillText: '#701A75'
  }
];

function getHeroNarrative(cpcbAqi) {
  if (cpcbAqi <= 50) {
    return {
      headline: 'Good air, good to go.',
      note: 'A comfortable day for your city. Keep an eye on sensitive family members.'
    };
  }
  if (cpcbAqi <= 100) {
    return {
      headline: 'Fair air, mostly fine.',
      note: 'Acceptable air for most plans. Sensitive elders or kids should pace long outings.'
    };
  }
  if (cpcbAqi <= 200) {
    return {
      headline: 'Moderate air, pace yourself.',
      note: 'Pollution is noticeable today. Shift longer outdoor play to the cleanest window.'
    };
  }
  if (cpcbAqi <= 300) {
    return {
      headline: 'Poor air, limit time out.',
      note: 'Unhealthy air outside. Keep windows closed and wear an N95 mask for travel.'
    };
  }
  return {
    headline: 'Heavy smog, stay indoors.',
    note: 'Hazardous air levels. Avoid outdoor exercise and run indoor air purifiers.'
  };
}

function getTierColors(cpcbAqi) {
  if (cpcbAqi <= 50) {
    return {
      ring: '#1F5132',
      track: '#E7F2EB',
      badgeBg: '#1F5132',
      badgeText: '#FFFFFF'
    };
  }
  if (cpcbAqi <= 100) {
    return {
      ring: '#4D7C0F',
      track: '#ECFCCB',
      badgeBg: '#4D7C0F',
      badgeText: '#FFFFFF'
    };
  }
  if (cpcbAqi <= 200) {
    return {
      ring: '#B45309',
      track: '#FEF3C7',
      badgeBg: '#B45309',
      badgeText: '#FFFFFF'
    };
  }
  return {
    ring: '#DC2626',
    track: '#FEE2E2',
    badgeBg: '#DC2626',
    badgeText: '#FFFFFF'
  };
}

function formatUpdatedTime(isoTime) {
  const d = isoTime ? new Date(isoTime) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
    .format(validDate)
    .toLowerCase();
}

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
          <p style={{ color: 'var(--text-muted)' }}>Loading live air quality readings...</p>
        </div>
      </div>
    );
  }

  const { current } = telemetry;
  const cpcbAqi = cpcbData?.cpcbAqi ?? Math.round(current.us_aqi || 0);
  const usAqi = Math.round(current.us_aqi || 0);
  const category = cpcbData?.category || 'Good';
  const dominantPollutant = cpcbData?.dominantPollutant || 'PM2.5';

  const pm25Num = current.pm2_5 != null ? Number(current.pm2_5) : null;
  const pm10Num = current.pm10 != null ? Number(current.pm10) : null;
  const no2Num = current.nitrogen_dioxide != null ? Number(current.nitrogen_dioxide) : null;
  const o3Num = current.ozone != null ? Number(current.ozone) : null;

  const pm25 = pm25Num != null ? pm25Num.toFixed(1) : '--';
  const pm10 = pm10Num != null ? pm10Num.toFixed(1) : '--';
  const no2 = no2Num != null ? no2Num.toFixed(1) : '--';
  const o3 = o3Num != null ? o3Num.toFixed(1) : '--';

  const cigEquiv = pm25Num != null ? (pm25Num / 22).toFixed(1) : '0.0';
  const heroNarrative = getHeroNarrative(cpcbAqi);
  const tierColors = getTierColors(cpcbAqi);

  // Active benchmark band
  const activeBand =
    CPCB_BENCHMARK_BANDS.find((b) => cpcbAqi >= b.min && cpcbAqi <= b.max) ||
    CPCB_BENCHMARK_BANDS[CPCB_BENCHMARK_BANDS.length - 1];

  // SVG Ring Gauge math (164x164 viewBox, r=70)
  const ringRadius = 70;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringFillRatio = Math.min(1, Math.max(0.18, cpcbAqi / 300));
  const ringDashOffset = ringCircumference * (1 - ringFillRatio);

  // 10-Second Family Verdict
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
    const cleanest = cleanWindow?.displayWindow || '10 pm – 11 pm';
    const summaryText = [
      `AirSense AI — Daily Air Briefing for ${currentCity.name}`,
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

  // Pollutants strip data
  const pollutants = [
    { key: 'PM2.5', val: pm25, num: pm25Num || 0, limit: 15 },
    { key: 'PM10', val: pm10, num: pm10Num || 0, limit: 45 },
    { key: 'NO2', val: no2, num: no2Num || 0, limit: 25 },
    { key: 'O3', val: o3, num: o3Num || 0, limit: 100 }
  ];

  // Clean-Window Ribbon data
  const hourlyPoints = cleanWindow?.hourlyPoints || [];
  const maxPm = Math.max(...hourlyPoints.map((p) => p.pm2_5), 45);
  const yTicks = [Math.round(maxPm), Math.round((maxPm * 2) / 3), Math.round(maxPm / 3), 0];
  const currentHourIndex = new Date().getHours();
  const currentHourPoint = hourlyPoints[currentHourIndex] || hourlyPoints[0];
  const activePoint = hoveredPoint || selectedPoint || currentHourPoint;
  const isTimeTraveling = Boolean(
    (selectedPoint && selectedPoint.index !== currentHourPoint?.index) ||
      (hoveredPoint && hoveredPoint.index !== currentHourPoint?.index)
  );

  const getPointCategory = (pm) => {
    if (pm <= 30) return { label: 'GOOD', bg: '#E7F2EB', color: '#1F5132' };
    if (pm <= 60) return { label: 'SATISFACTORY', bg: '#ECFCCB', color: '#3F6212' };
    if (pm <= 90) return { label: 'MODERATE', bg: '#FEF3C7', color: '#92400E' };
    if (pm <= 120) return { label: 'POOR', bg: '#FED7AA', color: '#9A3412' };
    return { label: 'SEVERE', bg: '#FEE2E2', color: '#991B1B' };
  };

  const activeCategory = activePoint ? getPointCategory(activePoint.pm2_5) : null;
  const updatedTimeStr = formatUpdatedTime(current.time);
  const fullLocation = [currentCity.name, currentCity.admin1, currentCity.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="pulse-page-wrapper">
      {/* Page Title Row */}
      <div className="pulse-title-row">
        <div>
          <h1 className="pulse-page-h1">Your city. Your next breath.</h1>
          <p className="pulse-page-subtitle">A clear picture of the air around your family.</p>
        </div>
        <div className="pulse-title-meta">
          <span className="pulse-eyebrow-city tabular-nums">
            PULSE / {currentCity.name.toUpperCase()}
          </span>
          <span className="pulse-updated-time tabular-nums">
            Updated {updatedTimeStr} · IST
          </span>
        </div>
      </div>

      {/* 3-Column Bento Grid (~42% / 25% / 33%) */}
      <div className="pulse-bento-grid">
        {/* COLUMN 1 (~42%): Hero AQI Card + 10-Second Family Verdict + 4 Pollutant Mini-Cards */}
        <div className="pulse-col-1">
          {/* Hero Card */}
          <div className="tactile-card pulse-hero-card">
            <div className="pulse-hero-top">
              <div>
                <h2 className="pulse-hero-city">{fullLocation}</h2>
                <span className="pulse-hero-kicker">CITY AIR QUALITY</span>
              </div>
              <span className="pulse-dominant-pill">
                DOMINANT: {dominantPollutant}
              </span>
            </div>

            <div className="pulse-hero-body">
              {/* Circular Ring Gauge */}
              <div className="pulse-ring-wrap">
                <svg viewBox="0 0 164 164" className="pulse-ring-svg" aria-hidden="true">
                  <circle
                    cx="82"
                    cy="82"
                    r={ringRadius}
                    fill="none"
                    stroke={tierColors.track}
                    strokeWidth="12"
                  />
                  <circle
                    cx="82"
                    cy="82"
                    r={ringRadius}
                    fill="none"
                    stroke={tierColors.ring}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringDashOffset}
                    transform="rotate(-90 82 82)"
                  />
                </svg>
                <div className="pulse-ring-center">
                  <span className="pulse-ring-score tabular-nums">{cpcbAqi}</span>
                  <span className="pulse-ring-label">CPCB AQI</span>
                  <span
                    className="pulse-ring-badge"
                    style={{
                      backgroundColor: tierColors.badgeBg,
                      color: tierColors.badgeText
                    }}
                  >
                    {category.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Hero Right Narrative */}
              <div className="pulse-hero-narrative">
                <h3 className="pulse-hero-headline">{heroNarrative.headline}</h3>
                <p className="pulse-hero-note">{heroNarrative.note}</p>
                <div className="pulse-hero-epa tabular-nums">
                  US EPA: <strong>{usAqi}</strong>
                </div>
                <div className="pulse-cig-pill tabular-nums">
                  {cigEquiv} cigarettes/day equiv.
                </div>
              </div>
            </div>
          </div>

          {/* Middle Card: 10-Second Family Verdict */}
          <div className="pulse-verdict-card">
            <div className="pulse-verdict-header">
              <span className="pulse-verdict-kicker">10-SECOND FAMILY VERDICT</span>
              <button
                type="button"
                className={`pulse-copy-btn ${copied ? 'is-copied' : ''}`}
                onClick={handleCopyBriefing}
                title="Copy daily family air briefing"
              >
                {copied ? (
                  <>
                    <Check size={12} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Briefing</span>
                  </>
                )}
              </button>
            </div>
            <p className="pulse-verdict-text">{familyBriefing}</p>
          </div>

          {/* Bottom 4 Pollutant Mini-Cards */}
          <div className="pulse-pollutants-grid">
            {pollutants.map((item) => {
              const isOver = item.num > item.limit;
              const pct = Math.min(100, Math.max(6, (item.num / item.limit) * 100));
              return (
                <div key={item.key} className="tactile-card pulse-mini-card">
                  <span className="mini-card-name">{item.key}</span>
                  <span className="mini-card-val tabular-nums">{item.val}</span>
                  <span className="mini-card-unit">µg/m³</span>
                  <div className="mini-card-track" title={`${item.val} / ${item.limit} µg/m³ WHO limit`}>
                    <div
                      className="mini-card-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isOver ? '#DC2626' : '#1F5132'
                      }}
                    />
                  </div>
                  <span className="mini-card-who tabular-nums">WHO ≤ {item.limit}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2 (~25%): AQI Benchmark Scale */}
        <div className="pulse-col-2">
          <div className="tactile-card pulse-benchmark-card">
            <div className="benchmark-header">
              <span className="benchmark-eyebrow">AQI BENCHMARK SCALE</span>
              <h3 className="benchmark-title">Normal vs. Abnormal</h3>
              <div className="benchmark-subrow">
                <span
                  className="benchmark-live-pill tabular-nums"
                  style={{
                    backgroundColor: activeBand.pillBg,
                    color: activeBand.pillText
                  }}
                >
                  {cpcbAqi} = {activeBand.statusWord}
                </span>
                <span className="benchmark-index-lbl">CPCB INDEX</span>
              </div>
            </div>

            <div className="benchmark-rows-list">
              {CPCB_BENCHMARK_BANDS.map((band) => {
                const isActive = band.id === activeBand.id;
                return (
                  <div
                    key={band.id}
                    className={`benchmark-row ${isActive ? 'is-active' : ''}`}
                    style={{
                      backgroundColor: band.bg,
                      borderColor: isActive ? band.border : 'transparent'
                    }}
                  >
                    <div className="benchmark-row-top">
                      <div className="benchmark-row-left">
                        <span className="benchmark-range tabular-nums">{band.range}</span>
                        <span className="benchmark-name">{band.label}</span>
                      </div>
                      {isActive && (
                        <span
                          className="benchmark-you-pill tabular-nums"
                          style={{
                            backgroundColor: band.pillBg,
                            color: band.pillText
                          }}
                        >
                          ← YOU ({cpcbAqi})
                        </span>
                      )}
                    </div>
                    <span className="benchmark-desc">{band.desc}</span>
                  </div>
                );
              })}
            </div>

            <div className="benchmark-footer">
              ≤ 100 is Normal; &gt; 100 is Abnormal.
            </div>
          </div>
        </div>

        {/* COLUMN 3 (~33%): Clean-Window Ribbon */}
        <div className="pulse-col-3">
          <div className="tactile-card pulse-ribbon-card">
            <div className="ribbon-top-block">
              <div className="ribbon-title-line">
                <h3 className="ribbon-card-title">Clean-Window Ribbon</h3>
                {isTimeTraveling && (
                  <button
                    type="button"
                    className="ribbon-reset-btn"
                    onClick={() => {
                      setSelectedPoint(null);
                      setHoveredPoint(null);
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              {cleanWindow?.hasData && (
                <span className="ribbon-cleanest-pill tabular-nums">
                  Cleanest: {cleanWindow.displayWindow}
                </span>
              )}
            </div>

            <div className="ribbon-scale-meta">
              <span>PM2.5 / NEXT 24 HOURS</span>
              <span className="tabular-nums">WHO Target 15 µg/m³</span>
            </div>

            {/* Highlighted Current / Scrubbed Hour Box */}
            {activePoint && (
              <div className="ribbon-hour-highlight">
                <div className="ribbon-hour-left">
                  <div className="ribbon-hour-top">
                    <span className="ribbon-hour-time tabular-nums">
                      {activePoint.hourLabel.toLowerCase()}
                    </span>
                    {activeCategory && (
                      <span
                        className="ribbon-hour-badge"
                        style={{
                          backgroundColor: activeCategory.bg,
                          color: activeCategory.color
                        }}
                      >
                        {activeCategory.label}
                      </span>
                    )}
                  </div>
                  <span className="ribbon-hour-sub">
                    {activePoint.index === currentHourPoint?.index
                      ? 'CURRENT HOUR'
                      : 'SELECTED HOUR'}
                  </span>
                </div>
                <div className="ribbon-hour-right">
                  <span className="ribbon-hour-val tabular-nums">{activePoint.pm2_5}</span>
                  <span className="ribbon-hour-unit">µg/m³</span>
                </div>
              </div>
            )}

            {/* 24-Hour Vertical Bar Chart */}
            <div className="ribbon-chart-area">
              <div className="ribbon-bars-stage">
                {/* WHO Target 15 µg/m³ dashed line */}
                <div
                  className="ribbon-who-line"
                  style={{ bottom: `${Math.min(92, (15 / maxPm) * 100)}%` }}
                  aria-hidden="true"
                />

                <div className="ribbon-bars-row">
                  {hourlyPoints.map((pt) => {
                    const heightPct = Math.min(100, Math.max(8, (pt.pm2_5 / maxPm) * 100));
                    const isCurrent = pt.index === currentHourPoint?.index;
                    const isSelected = activePoint?.index === pt.index;

                    return (
                      <div
                        key={pt.index}
                        className={`ribbon-bar-slot ${pt.isBestWindow ? 'is-cleanest' : ''} ${
                          isSelected ? 'is-selected' : ''
                        }`}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => setSelectedPoint(pt)}
                        onTouchStart={() => setSelectedPoint(pt)}
                        title={`${pt.hourLabel}: ${pt.pm2_5} µg/m³`}
                      >
                        <div className="ribbon-bar-pillar">
                          <div
                            className="ribbon-bar-fill"
                            style={{
                              height: `${heightPct}%`,
                              backgroundColor: pt.isBestWindow
                                ? '#1F5132'
                                : isSelected || isCurrent
                                ? '#5C6B61'
                                : '#C3CCC6'
                            }}
                          />
                        </div>
                        {isCurrent && <span className="ribbon-current-dot" aria-hidden="true" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Y-Axis Ticks */}
              <div className="ribbon-y-axis tabular-nums" aria-hidden="true">
                {yTicks.map((t, idx) => (
                  <span key={idx}>{t}</span>
                ))}
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="ribbon-x-axis tabular-nums">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>

            {/* Chart Legend */}
            <div className="ribbon-legend-row">
              <span className="ribbon-legend-item">
                <span className="legend-dot-grey" />
                <span>Hourly PM2.5</span>
              </span>
              <span className="ribbon-legend-item">
                <span className="legend-sq-green" />
                <span>Cleanest window</span>
              </span>
            </div>

            {/* Bottom Tip Box */}
            <div className="ribbon-tip-box">
              <span className="ribbon-tip-kicker">A LITTLE LATER, A LITTLE CLEANER</span>
              <p className="ribbon-tip-text">
                Plan a gentle walk or air out your home at{' '}
                <strong className="tabular-nums">
                  {cleanWindow?.displayWindow || '10–11 pm'}
                </strong>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <footer className="pulse-bottom-footer">
        <span>SOURCE: CPCB / Hourly estimates · All pollutant values in µg/m³</span>
        <span>Air awareness, not medical advice. · AirSense AI</span>
      </footer>
    </div>
  );
}
