import React, { useState } from 'react';
import { Sun, Sparkles, TrendingDown, Clock, Info } from 'lucide-react';

export default function CleanWindowCard({ cleanWindowData, currentPm25 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!cleanWindowData || !cleanWindowData.hasData || cleanWindowData.hourlyPoints.length === 0) {
    return null;
  }

  const { displayWindow, avgPm25, cleanerPercent, hourlyPoints } = cleanWindowData;

  // Max value for bar scaling (with minimum headroom of 50)
  const maxPm = Math.max(...hourlyPoints.map((p) => p.pm2_5), 50);

  return (
    <section className="clean-window-card" aria-labelledby="clean-window-title">
      {/* Top Banner */}
      <div className="clean-window-header">
        <div className="clean-window-title-wrap">
          <div className="clean-window-icon-badge">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 id="clean-window-title" className="clean-window-title">
              Best 2-Hour Outdoor Window Today
            </h3>
            <p className="clean-window-sub">
              Calculated from 24h hourly forecast telemetry • Ideal for outdoor errands, school run & exercise
            </p>
          </div>
        </div>

        {/* Highlight Stats Pill */}
        <div className="clean-window-stats-badge">
          <div className="stats-badge-window">
            <Clock size={14} style={{ color: 'var(--color-teal-light)' }} />
            <span>{displayWindow}</span>
          </div>
          <div className="stats-badge-sub">
            Avg PM2.5: <strong>{avgPm25} μg/m³</strong>
            {cleanerPercent > 0 && (
              <span className="stats-clean-pct">
                <TrendingDown size={12} style={{ display: 'inline', verticalAlign: '-1px' }} />
                {cleanerPercent}% cleaner than now
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hourly Bar Chart Visualizer */}
      <div className="hourly-chart-container">
        <div className="hourly-chart-legend">
          <span className="legend-label">24-Hour PM2.5 Trend (μg/m³)</span>
          <div className="legend-items">
            <span className="legend-item">
              <span className="legend-dot best-window-dot" />
              Cleanest 2-Hour Window
            </span>
            <span className="legend-item">
              <span className="legend-dot normal-dot" />
              Hourly Levels
            </span>
            <span className="legend-item">
              <span className="legend-line who-line" />
              WHO Safe Target (15 μg/m³)
            </span>
          </div>
        </div>

        {/* Hover Readout Tooltip */}
        <div className="hourly-readout">
          {hoveredPoint ? (
            <span>
              <strong>{hoveredPoint.hourLabel}</strong>: PM2.5 at{' '}
              <strong style={{ color: hoveredPoint.isBestWindow ? 'var(--color-teal-light)' : '#FFFFFF' }}>
                {hoveredPoint.pm2_5} μg/m³
              </strong>
              {hoveredPoint.isBestWindow && ' (Inside Cleanest Window)'}
            </span>
          ) : (
            <span>Hover or tap any bar to inspect hourly particulate concentration</span>
          )}
        </div>

        {/* Bars Container */}
        <div className="hourly-bars-track">
          {/* WHO 15 ug/m3 target guideline line */}
          <div
            className="who-guideline-indicator"
            style={{ bottom: `${Math.min(95, (15 / maxPm) * 100)}%` }}
            title="WHO 24-hr guideline target: 15 μg/m³"
          >
            <span>WHO 15 μg/m³</span>
          </div>

          {hourlyPoints.map((point) => {
            const heightPercent = Math.min(100, Math.max(8, (point.pm2_5 / maxPm) * 100));
            const isHovered = hoveredPoint?.index === point.index;

            return (
              <div
                key={point.index}
                className={`hourly-bar-col ${point.isBestWindow ? 'is-best' : ''} ${isHovered ? 'is-hovered' : ''}`}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onTouchStart={() => setHoveredPoint(point)}
              >
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${heightPercent}%`,
                      background: point.isBestWindow
                        ? 'linear-gradient(180deg, #14B8A6 0%, #0D9488 100%)'
                        : point.pm2_5 > 120
                        ? '#EF4444'
                        : point.pm2_5 > 60
                        ? '#F59E0B'
                        : 'rgba(255, 255, 255, 0.25)'
                    }}
                  />
                </div>
                {/* Hour label below bar (shown every 3-4 hours on mobile, all on hover) */}
                <span className={`bar-hour-label ${point.index % 3 === 0 || point.isBestWindow ? 'show' : ''}`}>
                  {point.hourLabel.replace(' ', '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable summary footer */}
      <div className="clean-window-footer">
        <Info size={14} style={{ color: 'var(--color-teal-light)', flexShrink: 0 }} />
        <span>
          <strong>Schedule Planner: </strong>
          Schedule high-ventilation chores, running, or outdoor playtime between{' '}
          <strong style={{ color: 'var(--color-teal-light)' }}>{displayWindow}</strong> to reduce respiratory particulate inhalation by up to{' '}
          <strong>{cleanerPercent}%</strong>.
        </span>
      </div>
    </section>
  );
}
