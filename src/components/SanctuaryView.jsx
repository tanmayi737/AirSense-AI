import React, { useState } from 'react';
import {
  Home,
  CheckSquare,
  Square,
  Leaf,
  Train,
  Car,
  Bus,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import { calculateSustainableOffset } from '../utils/decisionEngine';

export default function SanctuaryView({ aqiData, cleanWindow }) {
  // Indoor checklist state
  const [checklist, setChecklist] = useState({
    sealWindows: true,
    wetMop: true,
    kitchenExhaust: true,
    hepaZone: true
  });

  // Sustainable mobility state
  const [commuteDistance, setCommuteDistance] = useState(15);
  const [transitMode, setTransitMode] = useState('metro');

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const aqi = aqiData?.cpcbAqi || 100;
  const isSevere = aqi > 200;
  const isModerate = aqi > 100;

  const offset = calculateSustainableOffset(commuteDistance, transitMode);

  return (
    <div className="tab-view-container sanctuary-view-layout">
      {/* LEFT PANEL (50%): Smart Ventilation Protocol & Indoor Checklist */}
      <div className="sanctuary-panel-col">
        <div className="tactile-card sanctuary-card">
          <div className="sanctuary-header-row">
            <div>
              <span className="subcard-kicker">Home Microclimate Defense</span>
              <h3 className="panel-title">Smart Window Ventilation</h3>
            </div>
            <div
              className="ventilation-verdict-pill"
              style={{
                color: isSevere ? 'var(--color-terracotta)' : isModerate ? '#B45309' : 'var(--color-moss)',
                backgroundColor: isSevere ? 'rgba(200, 75, 49, 0.12)' : isModerate ? 'rgba(217, 119, 6, 0.1)' : 'rgba(45, 90, 39, 0.1)',
                borderColor: isSevere ? 'rgba(200, 75, 49, 0.3)' : isModerate ? 'rgba(217, 119, 6, 0.25)' : 'rgba(45, 90, 39, 0.25)'
              }}
            >
              {isSevere ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
              <span>{isSevere ? 'Keep Windows Sealed' : isModerate ? 'Selective Midday Opening' : 'Safe to Cross-Ventilate'}</span>
            </div>
          </div>

          {/* Diurnal Ventilation Window Guide */}
          <div className="diurnal-guide-strip">
            <div className={`diurnal-phase ${isSevere ? 'phase-lock' : 'phase-caution'}`}>
              <span className="phase-time">07:00 – 10:30 AM</span>
              <span className="phase-title">Morning Inversion Peak</span>
              <p className="phase-desc">Cold nocturnal air traps exhaust. Keep doors and balcony glass tightly shut.</p>
            </div>

            <div className={`diurnal-phase ${isSevere ? 'phase-lock' : 'phase-open'}`}>
              <span className="phase-time">{cleanWindow?.displayWindow || '11:00 AM – 02:00 PM'}</span>
              <span className="phase-title">Solar Convection Window</span>
              <p className="phase-desc">
                {isSevere
                  ? 'Smog remains critical. Keep sealed and run indoor air purifiers.'
                  : 'Atmospheric boundary layer expands. Brief 20-min cross-ventilation flushes CO₂.'}
              </p>
            </div>

            <div className={`diurnal-phase ${isSevere ? 'phase-lock' : 'phase-caution'}`}>
              <span className="phase-time">06:00 – 10:00 PM</span>
              <span className="phase-title">Evening Traffic Trapping</span>
              <p className="phase-desc">Post-sunset thermal cooling locks vehicular NO₂ near ground level. Reseal windows.</p>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="indoor-checklist-subcard">
            <span className="subcard-kicker">Interactive Household Mitigation Protocol</span>
            <h4 className="checklist-heading">Particulate Barrier Checklist</h4>

            <div className="checklist-stack">
              <div
                className={`tactile-check-row ${checklist.sealWindows ? 'checked' : ''}`}
                onClick={() => toggleChecklist('sealWindows')}
                role="checkbox"
                aria-checked={checklist.sealWindows}
                tabIndex={0}
              >
                <div className="tactile-checkbox-icon">
                  {checklist.sealWindows ? (
                    <CheckSquare size={16} style={{ color: 'var(--color-moss)' }} />
                  ) : (
                    <Square size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="check-text-content">
                  <strong>Weatherstrip External Door Gaps & Windows</strong>
                  <p>Eliminates microscopic drafts where outdoor fine PM2.5 infiltrates interior living spaces.</p>
                </div>
              </div>

              <div
                className={`tactile-check-row ${checklist.wetMop ? 'checked' : ''}`}
                onClick={() => toggleChecklist('wetMop')}
                role="checkbox"
                aria-checked={checklist.wetMop}
                tabIndex={0}
              >
                <div className="tactile-checkbox-icon">
                  {checklist.wetMop ? (
                    <CheckSquare size={16} style={{ color: 'var(--color-moss)' }} />
                  ) : (
                    <Square size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="check-text-content">
                  <strong>Microfiber Damp Mopping (Zero Dry Sweeping)</strong>
                  <p>Dry brooming resuspends settling toxic PM10 into breathing height. Damp mopping binds particles permanently.</p>
                </div>
              </div>

              <div
                className={`tactile-check-row ${checklist.kitchenExhaust ? 'checked' : ''}`}
                onClick={() => toggleChecklist('kitchenExhaust')}
                role="checkbox"
                aria-checked={checklist.kitchenExhaust}
                tabIndex={0}
              >
                <div className="tactile-checkbox-icon">
                  {checklist.kitchenExhaust ? (
                    <CheckSquare size={16} style={{ color: 'var(--color-moss)' }} />
                  ) : (
                    <Square size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="check-text-content">
                  <strong>High Chimney Extraction During Cooking</strong>
                  <p>Spices, mustard oil tempering, and frying cause internal PM2.5 spikes &gt; 350 µg/m³. Close interior kitchen doors.</p>
                </div>
              </div>

              <div
                className={`tactile-check-row ${checklist.hepaZone ? 'checked' : ''}`}
                onClick={() => toggleChecklist('hepaZone')}
                role="checkbox"
                aria-checked={checklist.hepaZone}
                tabIndex={0}
              >
                <div className="tactile-checkbox-icon">
                  {checklist.hepaZone ? (
                    <CheckSquare size={16} style={{ color: 'var(--color-moss)' }} />
                  ) : (
                    <Square size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="check-text-content">
                  <strong>Establish Primary Bedroom as HEPA Clean Zone</strong>
                  <p>Keep bedroom door shut with True-HEPA filter operating on medium overnight to enable lung alveolar recovery.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (50%): Quantified Sustainable Transit Offsets */}
      <div className="sanctuary-panel-col">
        <div className="tactile-card swaps-card">
          <div className="sanctuary-header-row">
            <div>
              <span className="subcard-kicker">Collective Urban Impact</span>
              <h3 className="panel-title">Quantified Sustainable Swaps</h3>
            </div>
            <div className="eco-leaf-badge">
              <Leaf size={14} style={{ color: 'var(--color-moss)' }} />
              <span>Net Emission Reductions</span>
            </div>
          </div>

          <p className="swaps-intro-text">
            Compare the quantified particulate & carbon pollution avoided by opting for low-emission transit modes against single-occupant petrol driving.
          </p>

          {/* Distance Buttons */}
          <div className="swap-selector-unit">
            <span className="selector-title">One-Way Commute Distance:</span>
            <div className="segmented-selector-row">
              {[5, 15, 30, 50].map((km) => (
                <button
                  key={km}
                  type="button"
                  className={`segment-btn ${commuteDistance === km ? 'active' : ''}`}
                  onClick={() => setCommuteDistance(km)}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Mode Buttons */}
          <div className="swap-selector-unit">
            <span className="selector-title">Low-Emission Transit Mode:</span>
            <div className="mode-selector-grid">
              <button
                type="button"
                className={`mode-card-btn ${transitMode === 'metro' ? 'active' : ''}`}
                onClick={() => setTransitMode('metro')}
              >
                <Train size={16} />
                <span>Metro Rail</span>
              </button>
              <button
                type="button"
                className={`mode-card-btn ${transitMode === 'carpool' ? 'active' : ''}`}
                onClick={() => setTransitMode('carpool')}
              >
                <Car size={16} />
                <span>Carpool (3x)</span>
              </button>
              <button
                type="button"
                className={`mode-card-btn ${transitMode === 'electric_bus' ? 'active' : ''}`}
                onClick={() => setTransitMode('electric_bus')}
              >
                <Bus size={16} />
                <span>Electric Bus</span>
              </button>
            </div>
          </div>

          {/* Quantified Metrics Display Grid */}
          <div className="quantified-results-grid">
            <div className="metric-tactile-cell">
              <span className="metric-large-num tabular-nums">{offset.savedCo2Kg}</span>
              <span className="metric-unit-lbl">kg CO₂ Avoided</span>
              <span className="metric-sub-detail">Greenhouse emission reduction</span>
            </div>

            <div className="metric-tactile-cell highlight-cell">
              <span className="metric-large-num tabular-nums" style={{ color: 'var(--color-moss)' }}>
                {offset.savedPm25Grams}
              </span>
              <span className="metric-unit-lbl">grams PM2.5 Prevented</span>
              <span className="metric-sub-detail">Exhaust soot & brake dust eliminated</span>
            </div>

            <div className="metric-tactile-cell">
              <span className="metric-large-num tabular-nums">{offset.treesEquivalent}</span>
              <span className="metric-unit-lbl">Trees Daily Equivalent</span>
              <span className="metric-sub-detail">Biological carbon absorption factor</span>
            </div>

            <div className="metric-tactile-cell">
              <span className="metric-large-num tabular-nums" style={{ color: '#B45309' }}>
                ₹{offset.fuelCostSavedInr}
              </span>
              <span className="metric-unit-lbl">Direct Fuel Saved</span>
              <span className="metric-sub-detail">Household economic conservation</span>
            </div>
          </div>

          <div className="swaps-footer-note">
            <Info size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span>
              Calculated using standard urban transit emission factors from India Ministry of Road Transport & CPCB fleet baselines.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
