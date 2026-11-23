import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Home,
  Sparkles,
  Gauge
} from 'lucide-react';
import {
  generateHouseholdDecisions,
  calculateExposureBudget
} from '../utils/decisionEngine';

const FAMILY_PERSONAS = [
  { id: 'School Child', label: 'School Child', icon: '🎒', desc: 'Developing pulmonary tissue' },
  { id: 'Elderly / Asthma', label: 'Elderly / Asthma', icon: '🫁', desc: 'Elevated airway hyperreactivity' },
  { id: 'Outdoor Runner', label: 'Outdoor Runner', icon: '🏃', desc: 'High aerobic minute ventilation' },
  { id: 'Daily Commuter', label: 'Daily Commuter', icon: '🚗', desc: 'Arterial transit corridor exposure' }
];

const ACTIVITIES = [
  { id: 'School Run', label: 'School Run' },
  { id: 'Exercise', label: 'Outdoor Workout' },
  { id: 'Commute', label: 'Corridor Commute' },
  { id: 'Ventilation', label: 'Home Ventilation' }
];

export default function HouseholdView({ aqiData, cleanWindow }) {
  const [selectedPersonas, setSelectedPersonas] = useState(['School Child', 'Elderly / Asthma']);
  const [selectedActivity, setSelectedActivity] = useState('School Run');

  const pm25 = aqiData?.pm2_5 || 35;

  // Toggle Persona
  const handleTogglePersona = (id) => {
    if (selectedPersonas.includes(id)) {
      if (selectedPersonas.length > 1) {
        setSelectedPersonas(selectedPersonas.filter((p) => p !== id));
      }
    } else {
      setSelectedPersonas([...selectedPersonas, id]);
    }
  };

  // Activity mapping for decision generator
  const activityMap = {
    'School Run': 'Morning School Run',
    'Exercise': 'Outdoor Exercise',
    'Commute': 'Daily Commute',
    'Ventilation': 'Home Ventilation'
  };

  const decisionCards = generateHouseholdDecisions(
    aqiData,
    selectedPersonas,
    activityMap[selectedActivity] || 'Morning School Run',
    cleanWindow
  );

  // Daily PM2.5 Exposure Budget Arc
  const budget = calculateExposureBudget(pm25, selectedActivity);

  // SVG Gauge calculations (180-degree semicircular arc)
  // Radius = 60, circumference of semicircle = PI * R = ~188.5
  const radius = 64;
  const arcLength = Math.PI * radius;
  const clampedPct = Math.min(100, budget.percent);
  const strokeDashoffset = arcLength - (clampedPct / 100) * arcLength;

  return (
    <div className="tab-view-container household-view-layout">
      {/* LEFT PANEL: Personas & Activity Controls */}
      <div className="household-left-panel">
        <div className="tactile-card personas-card">
          <span className="subcard-kicker">1. Family Vulnerability Profiles</span>
          <h3 className="panel-title">Active Household Personas</h3>
          <p className="panel-sub">Select members to tailor real-time physiological risk thresholds</p>

          <div className="persona-pills-stack">
            {FAMILY_PERSONAS.map((p) => {
              const isSelected = selectedPersonas.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`persona-card-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleTogglePersona(p.id)}
                  aria-pressed={isSelected}
                >
                  <span className="persona-emoji">{p.icon}</span>
                  <div className="persona-text-wrap">
                    <span className="persona-label">{p.label}</span>
                    <span className="persona-desc">{p.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="activity-selector-section">
            <span className="subcard-kicker">2. Scheduled Daily Activity</span>
            <div className="activity-pill-row">
              {ACTIVITIES.map((act) => {
                const isActive = selectedActivity === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    className={`activity-button ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedActivity(act.id)}
                    aria-pressed={isActive}
                  >
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Exposure Budget Arc & Verdict Cards */}
      <div className="household-right-panel">
        {/* Signature Visual: Daily PM2.5 Exposure Budget Arc */}
        <div className="tactile-card budget-arc-card">
          <div className="budget-card-header">
            <div>
              <span className="subcard-kicker">Physiological Lung Exposure Index</span>
              <h3 className="budget-title">Daily PM2.5 Budget Arc</h3>
            </div>
            <div
              className="budget-status-pill"
              style={{
                color: budget.color,
                backgroundColor: `${budget.color}18`,
                borderColor: `${budget.color}40`
              }}
            >
              <span>{budget.status}: {budget.percent}% of safe daily cap</span>
            </div>
          </div>

          <div className="budget-visual-wrap">
            <div className="budget-svg-box">
              <svg viewBox="0 0 160 95" className="budget-semicircle-svg" aria-hidden="true">
                {/* Background track */}
                <path
                  d="M 16 85 A 64 64 0 0 1 144 85"
                  fill="none"
                  stroke="#E7E5E4"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Active progress arc */}
                <path
                  d="M 16 85 A 64 64 0 0 1 144 85"
                  fill="none"
                  stroke={budget.color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={strokeDashoffset}
                  className="budget-arc-fill"
                />
              </svg>
              <div className="budget-center-label">
                <span className="budget-percent-val tabular-nums" style={{ color: budget.color }}>
                  {budget.percent}%
                </span>
                <span className="budget-percent-sub">Daily Cap</span>
              </div>
            </div>

            <div className="budget-meta-readout">
              <p className="budget-desc-text">
                <strong>{selectedActivity}: </strong>
                {budget.descriptor}. Estimated inhaled fine particulate dose of{' '}
                <strong className="tabular-nums">{budget.activityDose} µg</strong> against the WHO safe 24-hour baseline limit of{' '}
                <strong className="tabular-nums">180 µg</strong>.
              </p>
              <span className="budget-source-tag">
                Calculation based on average human minute ventilation and ambient PM2.5 concentration.
              </span>
            </div>
          </div>
        </div>

        {/* Verdict Cards Stack */}
        <div className="verdict-cards-stream">
          {decisionCards.map((card) => {
            const isGo = card.status === 'GO';
            const isModify = card.status === 'MODIFY';
            const statusColor = isGo ? 'var(--color-moss)' : isModify ? '#D97706' : 'var(--color-terracotta)';

            return (
              <div key={card.profile} className="tactile-card verdict-card">
                <div className="verdict-top-bar">
                  <span className="verdict-persona-tag">{card.profile}</span>
                  <div
                    className="verdict-badge"
                    style={{
                      color: statusColor,
                      backgroundColor: `${statusColor}18`,
                      borderColor: `${statusColor}40`
                    }}
                  >
                    {isGo && <CheckCircle2 size={13} />}
                    {isModify && <AlertTriangle size={13} />}
                    {!isGo && !isModify && <XCircle size={13} />}
                    <span>{card.status}</span>
                  </div>
                </div>

                <p className="verdict-action-directive">{card.action}</p>

                <div className="verdict-why-box">
                  <strong>Why: </strong>
                  <span>{card.why}</span>
                </div>

                <div className="verdict-twin-actions">
                  <div className="twin-action-cell">
                    <span className="twin-label">
                      <Clock size={11} style={{ color: 'var(--color-moss)' }} /> Safer Window
                    </span>
                    <p>{card.saferSwap}</p>
                  </div>
                  <div className="twin-action-cell">
                    <span className="twin-label">
                      <Home size={11} style={{ color: '#D97706' }} /> Indoor Defense
                    </span>
                    <p>{card.indoorHack}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
