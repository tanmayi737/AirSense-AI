import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Home,
  Sparkles,
  Loader2,
  X,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  generateHouseholdDecisions,
  calculateExposureBudget,
  COMMUTE_MULTIPLIERS
} from '../utils/decisionEngine';

const FAMILY_PERSONAS = [
  { id: 'School Child', label: 'School Child', icon: '🎒', desc: 'Young lungs still growing' },
  { id: 'Elderly / Asthma', label: 'Elderly / Asthma', icon: '🫁', desc: 'Sensitive lungs, breathlessness risk' },
  { id: 'Outdoor Runner', label: 'Outdoor Runner', icon: '🏃', desc: 'Breathes 3× deeper during workouts' },
  { id: 'Daily Commuter', label: 'Daily Commuter', icon: '🚗', desc: 'Heavy traffic exhaust on roads' }
];

const ACTIVITIES = [
  { id: 'School Run', label: 'School Run' },
  { id: 'Exercise', label: 'Outdoor Workout' },
  { id: 'Commute', label: 'Corridor Commute' },
  { id: 'Ventilation', label: 'Home Ventilation' }
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

const COMMUTE_MODES = [
  { id: 'Walking', label: 'Walking', icon: '🚶', multiplier: '1.0×' },
  { id: 'Open Auto / Bike', label: 'Open Auto / Bike', icon: '🛺', multiplier: '1.35×' },
  { id: 'Metro / AC Car', label: 'Metro / AC Car', icon: '🚇', multiplier: '0.45×' },
  { id: 'N95 Masked', label: 'N95 Masked', icon: '😷', multiplier: '0.25×' }
];

export default function HouseholdView({
  aqiData,
  cleanWindow,
  currentCity,
  isSimulation,
  selectedPersonas: propSelectedPersonas,
  onTogglePersona
}) {
  const [localPersonas, setLocalPersonas] = useState(['School Child', 'Elderly / Asthma']);
  const selectedPersonas = propSelectedPersonas || localPersonas;
  const [selectedActivity, setSelectedActivity] = useState('School Run');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [commuteMode, setCommuteMode] = useState('Walking');
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const cityName = currentCity?.name || 'Hyderabad';
  const pm25 = aqiData?.pm2_5 != null ? aqiData.pm2_5 : 35;

  // Toggle Persona
  const handleTogglePersona = (id) => {
    if (onTogglePersona) {
      onTogglePersona(id);
    } else {
      if (selectedPersonas.includes(id)) {
        if (selectedPersonas.length > 1) {
          setLocalPersonas(selectedPersonas.filter((p) => p !== id));
        }
      } else {
        setLocalPersonas([...selectedPersonas, id]);
      }
    }
  };

  // Activity mapping for decision generator
  const activityMap = {
    'School Run': 'Morning School Run',
    'Exercise': 'Outdoor Exercise',
    'Commute': 'Daily Commute',
    'Ventilation': 'Home Ventilation'
  };

  const activeActivityName = activityMap[selectedActivity] || 'Morning School Run';

  const currentHour = cleanWindow?.hourlyPoints?.[new Date().getHours()]?.hourLabel
    || new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: true }).format(new Date());

  const decisionCards = generateHouseholdDecisions(
    aqiData,
    selectedPersonas,
    activeActivityName,
    cleanWindow,
    durationMinutes,
    cityName,
    currentHour,
    commuteMode
  );

  // Daily Safe Breathing Allowance
  const budget = calculateExposureBudget(pm25, selectedActivity, durationMinutes, commuteMode);

  // SVG Gauge calculations (180-degree semicircular arc)
  const radius = 64;
  const arcLength = Math.PI * radius;
  const clampedPct = Math.min(100, budget.percent);
  const strokeDashoffset = arcLength - (clampedPct / 100) * arcLength;

  // Personalize with Gemini AI handler
  const handlePersonalizeAi = async () => {
    setIsAiLoading(true);
    const prompt = `Given active PM2.5 of ${Number(pm25).toFixed(1)} µg/m³ and Indian CPCB AQI of ${aqiData?.cpcbAqi || 100} in ${cityName}, what is the personalized recommendation for a ${durationMinutes}-minute ${activeActivityName} (${commuteMode}) for ${selectedPersonas.join(' and ')}?`;

    try {
      const response = await fetch('/api/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          city: cityName,
          cpcbAqi: aqiData?.cpcbAqi || 100,
          usAqi: aqiData?.usAqi || 100,
          category: aqiData?.category || 'Moderate',
          dominantPollutant: aqiData?.dominantPollutant || 'PM2.5',
          pm25: Number(pm25),
          pm10: Number(aqiData?.pm10 || 45),
          bestWindow: cleanWindow?.displayWindow || '11:00 AM – 1:00 PM',
          selectedProfiles: selectedPersonas,
          selectedActivity: activeActivityName,
          durationMinutes,
          commuteMode,
          isSimulated: Boolean(isSimulation)
        })
      });

      const result = await response.json();

      if (response.ok && result.data && !result.fallback) {
        setAiAdvice({
          ...result.data,
          isFallback: false
        });
      } else {
        const primaryCard = decisionCards[0];
        setAiAdvice({
          verdictBadge: primaryCard.status === 'GO' ? 'SAFE TO PROCEED' : primaryCard.status === 'MODIFY' ? 'PROCEED WITH CAUTION' : 'AVOID / INDOORS ONLY',
          directAnswer: primaryCard.action,
          whyItMatters: primaryCard.why,
          saferAlternative: primaryCard.saferSwap,
          indoorAction: primaryCard.indoorHack,
          isFallback: true
        });
      }
    } catch {
      const primaryCard = decisionCards[0];
      setAiAdvice({
        verdictBadge: primaryCard.status === 'GO' ? 'SAFE TO PROCEED' : primaryCard.status === 'MODIFY' ? 'PROCEED WITH CAUTION' : 'AVOID / INDOORS ONLY',
        directAnswer: primaryCard.action,
        whyItMatters: primaryCard.why,
        saferAlternative: primaryCard.saferSwap,
        indoorAction: primaryCard.indoorHack,
        isFallback: true
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="tab-view-container household-view-layout">
      {/* LEFT PANEL: Personas, Activity & Duration Slider */}
      <div className="household-left-panel">
        <div className="tactile-card personas-card">
          <span className="subcard-kicker">1. Family Profiles</span>
          <h3 className="panel-title">Who is in your household?</h3>
          <p className="panel-sub">Select family members to tailor daily air quality advice</p>

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

          {/* Activity Selector */}
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

          {/* Trip Controls: Duration Slider & Transport / Mask Selector */}
          <div className="trip-controls-group">
            {/* Interactive Outdoor Duration Slider (15m to 120m) */}
            <div className="duration-slider-section">
              <div className="duration-slider-header">
                <div>
                  <span className="subcard-kicker">3. Planned Trip Duration</span>
                  <span className="duration-title-label">Outdoor Outing Time</span>
                </div>
                <span className="duration-readout-pill tabular-nums">
                  <Clock size={12} />
                  <strong>{durationMinutes} min</strong>
                </span>
              </div>

              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="duration-range-slider"
                aria-label="Planned Outdoor Trip Duration in Minutes"
              />

              <div className="duration-presets-row">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`duration-preset-chip ${durationMinutes === mins ? 'active' : ''}`}
                    onClick={() => setDurationMinutes(mins)}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Transport & Mask Selector (Walking: 1.0x, Open Auto / Bike: 1.35x, Metro / AC Car: 0.45x, N95 Masked: 0.25x) */}
            <div className="transport-mode-section">
              <div className="transport-mode-header">
                <div>
                  <span className="subcard-kicker">4. Transport & Masking</span>
                  <span className="duration-title-label">Exposure Mode</span>
                </div>
                <span className="commute-multiplier-pill tabular-nums" title="Active particulate exposure multiplier">
                  <strong>{COMMUTE_MODES.find((m) => m.id === commuteMode)?.multiplier || '1.0×'} dose</strong>
                </span>
              </div>

              <div className="commute-pills-row" role="group" aria-label="Transport and Mask Mode">
                {COMMUTE_MODES.map((mode) => {
                  const isActive = commuteMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      className={`commute-mode-pill ${isActive ? 'active' : ''}`}
                      onClick={() => setCommuteMode(mode.id)}
                      aria-pressed={isActive}
                      title={`${mode.label}: ${mode.multiplier} exposure multiplier`}
                    >
                      <span className="commute-icon" aria-hidden="true">{mode.icon}</span>
                      <span className="commute-label-text">{mode.label}</span>
                      <span className="commute-mult-badge tabular-nums">{mode.multiplier}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Personalize with Gemini AI Button */}
          <div className="ai-synthesis-trigger-wrap">
            <button
              type="button"
              className="gemini-personalize-btn"
              onClick={handlePersonalizeAi}
              disabled={isAiLoading}
              aria-label="Synthesize personalized advice using Gemini AI"
            >
              {isAiLoading ? (
                <>
                  <Loader2 size={14} className="spin-animate" />
                  <span>Synthesizing Family Plan with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Personalize Family Plan with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Exposure Gauge, AI Card & Verdict Cards */}
      <div className="household-right-panel">
        {/* Signature Visual: Daily Safe Breathing Allowance */}
        <div className="tactile-card budget-arc-card">
          <div className="budget-card-header">
            <div>
              <span className="subcard-kicker">Daily Safe Breathing Allowance</span>
              <h3 className="budget-title">Daily Safe Breathing Allowance</h3>
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
                <span className="budget-percent-sub">Daily Allowance</span>
              </div>
            </div>

            <div className="budget-meta-readout">
              <p className="budget-helper-callout">
                {budget.helperLine}
              </p>
              <p className="budget-desc-text">
                <strong>{selectedActivity} ({durationMinutes} min): </strong>
                {budget.descriptor}. Estimated inhaled dust of{' '}
                <strong className="tabular-nums">{budget.activityDose} µg</strong> against the WHO safe 24-hour breathing allowance of{' '}
                <strong className="tabular-nums">180 µg</strong>.
              </p>
              <span className="budget-source-tag">
                Calculation based on physical activity breathing rates and outdoor dust levels in {cityName}.
              </span>
            </div>
          </div>
        </div>

        {/* Gemini AI Personalized Synthesis Banner (if active) */}
        {aiAdvice && (
          <div className="tactile-card ai-synthesis-featured-card">
            <div className="ai-featured-header">
              <div className="ai-featured-title-wrap">
                <Sparkles size={14} style={{ color: 'var(--color-moss)' }} />
                <strong>Gemini AI Personalized Synthesis for {cityName}</strong>
              </div>
              <button
                type="button"
                className="ai-dismiss-btn"
                onClick={() => setAiAdvice(null)}
                aria-label="Dismiss AI Advice"
              >
                <X size={14} />
              </button>
            </div>

            <div className="ai-featured-body">
              <div
                className="ai-verdict-pill"
                style={{
                  color: aiAdvice.verdictBadge === 'SAFE TO PROCEED' ? 'var(--color-moss)' : aiAdvice.verdictBadge === 'PROCEED WITH CAUTION' ? '#B45309' : 'var(--color-terracotta)',
                  backgroundColor: aiAdvice.verdictBadge === 'SAFE TO PROCEED' ? 'rgba(45, 90, 39, 0.1)' : aiAdvice.verdictBadge === 'PROCEED WITH CAUTION' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(200, 75, 49, 0.12)',
                  borderColor: aiAdvice.verdictBadge === 'SAFE TO PROCEED' ? 'rgba(45, 90, 39, 0.3)' : aiAdvice.verdictBadge === 'PROCEED WITH CAUTION' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(200, 75, 49, 0.35)'
                }}
              >
                {aiAdvice.verdictBadge === 'SAFE TO PROCEED' ? <CheckCircle2 size={13} /> : aiAdvice.verdictBadge === 'PROCEED WITH CAUTION' ? <AlertTriangle size={13} /> : <XCircle size={13} />}
                <span>{aiAdvice.verdictBadge}</span>
              </div>

              <p className="ai-direct-answer">{aiAdvice.directAnswer}</p>

              <div className="ai-why-row">
                <strong>Why: </strong>
                <span>{aiAdvice.whyItMatters}</span>
              </div>

              <div className="ai-actions-grid">
                <div className="ai-action-item">
                  <span className="ai-item-lbl">
                    <Clock size={11} style={{ color: 'var(--color-moss)' }} /> Recommended Window
                  </span>
                  <p>{aiAdvice.saferAlternative}</p>
                </div>
                <div className="ai-action-item">
                  <span className="ai-item-lbl">
                    <Home size={11} style={{ color: '#B45309' }} /> Home Protection
                  </span>
                  <p>{aiAdvice.indoorAction}</p>
                </div>
              </div>

              <div className="ai-featured-footer">
                <span className="ai-attribution-tag">
                  {aiAdvice.isFallback ? 'Deterministic Rule Engine Fallback' : 'Synthesized live by Gemini 2.5 Flash'}
                </span>
              </div>
            </div>
          </div>
        )}

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

                {/* 1-Line Everyday Helper Text */}
                {card.helperText && (
                  <div className="decision-helper-line">
                    <Info size={12} className="decision-helper-icon" />
                    <span>{card.helperText}</span>
                  </div>
                )}

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