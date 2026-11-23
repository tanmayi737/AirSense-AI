import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Home,
  Wind,
  CheckSquare,
  Square,
  Leaf,
  Train,
  Car,
  Bus,
  Sparkles,
  Info
} from 'lucide-react';
import {
  generateHouseholdDecisions,
  calculateSustainableOffset
} from '../utils/decisionEngine';

const AVAILABLE_PROFILES = [
  { id: 'School Child', label: 'School Child', icon: '🎒', desc: 'Pediatric respiratory focus' },
  { id: 'Elderly / Asthma', label: 'Elderly / Asthma', icon: '🫁', desc: 'High pulmonary sensitivity' },
  { id: 'Outdoor Runner', label: 'Outdoor Runner', icon: '🏃', desc: 'Aerobic minute ventilation' },
  { id: 'Daily Commuter', label: 'Daily Commuter', icon: '🚗', desc: 'Urban corridor exposure' }
];

const AVAILABLE_ACTIVITIES = [
  'Morning School Run',
  'Outdoor Exercise',
  'Home Ventilation',
  'Daily Commute'
];

export default function HouseholdMatrix({ aqiData, cleanWindow }) {
  // Profile Selection (multi-select)
  const [selectedProfiles, setSelectedProfiles] = useState([
    'School Child',
    'Elderly / Asthma'
  ]);

  // Activity Selection
  const [selectedActivity, setSelectedActivity] = useState('Morning School Run');

  // Indoor Checklist State
  const [checklist, setChecklist] = useState({
    sealWindows: true,
    wetMop: true,
    kitchenExhaust: false,
    hepaZone: true
  });

  // Sustainable Swaps State
  const [commuteDistance, setCommuteDistance] = useState(15);
  const [transitMode, setTransitMode] = useState('metro');

  // Toggle profile selection
  const handleToggleProfile = (profileId) => {
    if (selectedProfiles.includes(profileId)) {
      if (selectedProfiles.length > 1) {
        setSelectedProfiles(selectedProfiles.filter((p) => p !== profileId));
      }
    } else {
      setSelectedProfiles([...selectedProfiles, profileId]);
    }
  };

  // Toggle checklist
  const handleToggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate structured decisions
  const decisionCards = generateHouseholdDecisions(
    aqiData,
    selectedProfiles,
    selectedActivity,
    cleanWindow
  );

  // Calculate sustainable offset
  const offset = calculateSustainableOffset(commuteDistance, transitMode);

  return (
    <div className="household-matrix-wrapper">
      {/* Section Header */}
      <div className="section-heading-wrap">
        <div>
          <h3 className="section-main-title">
            <Users size={20} style={{ color: 'var(--color-teal-light)' }} />
            <span>Household Decision Matrix</span>
          </h3>
          <p className="section-main-sub">
            Tailored actionable guidance across family vulnerability profiles & planned activities
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar: Profiles + Activity Selector */}
      <div className="matrix-controls-card">
        {/* Family Profiles Multi-Select Pills */}
        <div className="controls-group">
          <label className="controls-label">
            1. Select Family Profiles (Multi-Select):
          </label>
          <div className="profiles-pills-row">
            {AVAILABLE_PROFILES.map((prof) => {
              const isSelected = selectedProfiles.includes(prof.id);
              return (
                <button
                  key={prof.id}
                  type="button"
                  className={`profile-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleProfile(prof.id)}
                  aria-pressed={isSelected}
                >
                  <span className="profile-pill-icon">{prof.icon}</span>
                  <span className="profile-pill-text">{prof.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Selector Tabs */}
        <div className="controls-group">
          <label className="controls-label">
            2. Choose Planned Daily Activity:
          </label>
          <div className="activities-row">
            {AVAILABLE_ACTIVITIES.map((act) => {
              const isActive = selectedActivity === act;
              return (
                <button
                  key={act}
                  type="button"
                  className={`activity-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedActivity(act)}
                  aria-pressed={isActive}
                >
                  {act}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decision Cards Grid */}
      <div className="decision-cards-grid">
        {decisionCards.map((card) => {
          const isGo = card.status === 'GO';
          const isModify = card.status === 'MODIFY';
          const isAvoid = card.status === 'AVOID';

          return (
            <div
              key={`${card.profile}-${card.activity}`}
              className={`decision-card status-${card.status.toLowerCase()}`}
            >
              {/* Header */}
              <div className="decision-card-header">
                <div>
                  <span className="decision-profile-tag">{card.profile}</span>
                  <div className="decision-activity-name">{card.activity}</div>
                </div>

                <div
                  className="decision-status-badge"
                  style={{ color: card.badgeColor, background: card.badgeBg }}
                >
                  {isGo && <CheckCircle2 size={15} />}
                  {isModify && <AlertTriangle size={15} />}
                  {isAvoid && <XCircle size={15} />}
                  <span>{card.status}</span>
                </div>
              </div>

              {/* Action Instruction */}
              <div className="decision-action-box">
                <span className="decision-action-label">Directive</span>
                <p className="decision-action-text">{card.action}</p>
              </div>

              {/* Scientific Rationale ("Why") */}
              <div className="decision-why-box">
                <strong>Why: </strong>
                <span>{card.why}</span>
              </div>

              {/* Safer Swap & Indoor Hack */}
              <div className="decision-details-grid">
                <div className="detail-item swap-item">
                  <div className="detail-item-header">
                    <Sparkles size={13} style={{ color: 'var(--color-teal-light)' }} />
                    <span>Safer Swap</span>
                  </div>
                  <p>{card.saferSwap}</p>
                </div>

                <div className="detail-item hack-item">
                  <div className="detail-item-header">
                    <Home size={13} style={{ color: '#FBBF24' }} />
                    <span>Indoor Protection Hack</span>
                  </div>
                  <p>{card.indoorHack}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Row: Indoor Air Care Checklist + Quantified Sustainable Swaps */}
      <div className="household-matrix-bottom-row">
        {/* Interactive Indoor Air Care Checklist */}
        <div className="indoor-checklist-card">
          <div className="subcard-header">
            <Home size={18} style={{ color: 'var(--color-teal-light)' }} />
            <div>
              <h4 className="subcard-title">Indoor Air Care Checklist</h4>
              <p className="subcard-sub">Immediate household particulate mitigation protocol</p>
            </div>
          </div>

          <div className="checklist-items-wrap">
            {/* Checklist Item 1 */}
            <div
              className={`checklist-item ${checklist.sealWindows ? 'checked' : ''}`}
              onClick={() => handleToggleChecklist('sealWindows')}
              role="checkbox"
              aria-checked={checklist.sealWindows}
              tabIndex={0}
            >
              <div className="check-icon">
                {checklist.sealWindows ? (
                  <CheckSquare size={17} style={{ color: 'var(--color-teal)' }} />
                ) : (
                  <Square size={17} style={{ color: 'var(--color-muted)' }} />
                )}
              </div>
              <div className="check-text">
                <strong>Smart Window Sealing vs. Ventilation</strong>
                <p>
                  Seal windows during thermal inversion peaks (8–11 AM & 6–9 PM). Air out home only during the cleanest afternoon window if AQI &lt; 100.
                </p>
              </div>
            </div>

            {/* Checklist Item 2 */}
            <div
              className={`checklist-item ${checklist.wetMop ? 'checked' : ''}`}
              onClick={() => handleToggleChecklist('wetMop')}
              role="checkbox"
              aria-checked={checklist.wetMop}
              tabIndex={0}
            >
              <div className="check-icon">
                {checklist.wetMop ? (
                  <CheckSquare size={17} style={{ color: 'var(--color-teal)' }} />
                ) : (
                  <Square size={17} style={{ color: 'var(--color-muted)' }} />
                )}
              </div>
              <div className="check-text">
                <strong>Microfiber Damp Mopping (No Dry Brooming)</strong>
                <p>
                  Dry brooms resuspend settle coarse PM10 particles into breathing zones. Damp microfiber mopping traps particulates permanently.
                </p>
              </div>
            </div>

            {/* Checklist Item 3 */}
            <div
              className={`checklist-item ${checklist.kitchenExhaust ? 'checked' : ''}`}
              onClick={() => handleToggleChecklist('kitchenExhaust')}
              role="checkbox"
              aria-checked={checklist.kitchenExhaust}
              tabIndex={0}
            >
              <div className="check-icon">
                {checklist.kitchenExhaust ? (
                  <CheckSquare size={17} style={{ color: 'var(--color-teal)' }} />
                ) : (
                  <Square size={17} style={{ color: 'var(--color-muted)' }} />
                )}
              </div>
              <div className="check-text">
                <strong>Active Kitchen Exhaust During Cooking</strong>
                <p>
                  Oil frying and spices generate ultrafine PM2.5 spikes &gt; 300 μg/m³. Run chimney/exhaust on high and close kitchen interior door.
                </p>
              </div>
            </div>

            {/* Checklist Item 4 */}
            <div
              className={`checklist-item ${checklist.hepaZone ? 'checked' : ''}`}
              onClick={() => handleToggleChecklist('hepaZone')}
              role="checkbox"
              aria-checked={checklist.hepaZone}
              tabIndex={0}
            >
              <div className="check-icon">
                {checklist.hepaZone ? (
                  <CheckSquare size={17} style={{ color: 'var(--color-teal)' }} />
                ) : (
                  <Square size={17} style={{ color: 'var(--color-muted)' }} />
                )}
              </div>
              <div className="check-text">
                <strong>Dedicated "Clean Air Room" (HEPA Zone)</strong>
                <p>
                  Keep main bedroom door shut with an active True-HEPA purifier running on medium to create an overnight lung-recovery zone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quantified Sustainable Swaps */}
        <div className="sustainable-swaps-card">
          <div className="subcard-header">
            <Leaf size={18} style={{ color: '#10B981' }} />
            <div>
              <h4 className="subcard-title">Quantified Sustainable Swaps</h4>
              <p className="subcard-sub">Urban mobility impact vs. solo petrol drive</p>
            </div>
          </div>

          {/* Commute Distance Selector */}
          <div className="swap-selector-block">
            <div className="swap-label-row">
              <span>Commute Distance:</span>
              <strong style={{ color: 'var(--color-teal-light)' }}>{commuteDistance} km (One-way)</strong>
            </div>
            <div className="distance-buttons-row">
              {[5, 15, 30, 50].map((km) => (
                <button
                  key={km}
                  type="button"
                  className={`dist-btn ${commuteDistance === km ? 'active' : ''}`}
                  onClick={() => setCommuteDistance(km)}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Transit Mode Selector */}
          <div className="swap-selector-block">
            <div className="swap-label-row">
              <span>Choose Low-Emission Transit Alternative:</span>
            </div>
            <div className="mode-buttons-row">
              <button
                type="button"
                className={`mode-btn ${transitMode === 'metro' ? 'active' : ''}`}
                onClick={() => setTransitMode('metro')}
              >
                <Train size={14} />
                <span>Metro Rail</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${transitMode === 'carpool' ? 'active' : ''}`}
                onClick={() => setTransitMode('carpool')}
              >
                <Car size={14} />
                <span>Carpool (3x)</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${transitMode === 'electric_bus' ? 'active' : ''}`}
                onClick={() => setTransitMode('electric_bus')}
              >
                <Bus size={14} />
                <span>Electric Bus</span>
              </button>
            </div>
          </div>

          {/* Quantified Impact Metrics Grid */}
          <div className="offset-metrics-grid">
            <div className="offset-metric-box">
              <span className="offset-metric-val">{offset.savedCo2Kg} kg</span>
              <span className="offset-metric-lbl">CO₂ Emissions Avoided</span>
            </div>
            <div className="offset-metric-box">
              <span className="offset-metric-val" style={{ color: '#34D399' }}>
                {offset.savedPm25Grams} g
              </span>
              <span className="offset-metric-lbl">Tailpipe & Brake PM2.5 Prevented</span>
            </div>
            <div className="offset-metric-box">
              <span className="offset-metric-val">{offset.treesEquivalent}</span>
              <span className="offset-metric-lbl">Daily Tree-Equivalent Oxygen</span>
            </div>
            <div className="offset-metric-box">
              <span className="offset-metric-val" style={{ color: '#FBBF24' }}>
                ₹{offset.fuelCostSavedInr}
              </span>
              <span className="offset-metric-lbl">Estimated Petrol Cost Saved</span>
            </div>
          </div>

          <p className="swap-note">
            <Info size={13} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
            Calculated against single-occupant petrol vehicle baseline using India Urban Transport emission factors.
          </p>
        </div>
      </div>
    </div>
  );
}
