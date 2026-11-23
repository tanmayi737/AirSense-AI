import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Home,
  CheckCircle2,
  Info,
  Loader2,
  HelpCircle,
  KeyRound,
  Shield,
  Layers,
  MapPin,
  Cpu
} from 'lucide-react';

export default function AdvisorView({
  currentCity,
  telemetry,
  cpcbData,
  cleanWindow,
  isSimulation
}) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAdvice, setActiveAdvice] = useState(null);

  const city = currentCity?.name || 'Hyderabad';
  const cpcbAqi = cpcbData?.cpcbAqi || 100;
  const usAqi = telemetry?.current?.us_aqi || 100;
  const category = cpcbData?.category || 'Moderate';
  const dominantPollutant = cpcbData?.dominantPollutant || 'PM2.5';
  const pm25 = telemetry?.current?.pm2_5 != null ? telemetry.current.pm2_5.toFixed(1) : '35.0';
  const pm10 = telemetry?.current?.pm10 != null ? telemetry.current.pm10.toFixed(1) : '45.0';
  const bestWindow = cleanWindow?.displayWindow || '11:00 AM – 1:00 PM';

  // 4 Curated Family Scenarios
  const scenarioChips = [
    {
      id: 'school',
      icon: '🎒',
      label: `Is it safe for kids to walk to school at 8 AM in ${city}?`,
      prompt: `Is it safe for my school child to walk to school at 8:00 AM in ${city} right now?`
    },
    {
      id: 'windows',
      icon: '🪟',
      label: `Should I open our home windows right now?`,
      prompt: `Should I open our home windows for natural ventilation right now in ${city}?`
    },
    {
      id: 'jog',
      icon: '🏃',
      label: `Best time for an outdoor jog today?`,
      prompt: `What is the safest time window for an outdoor run or workout today in ${city}?`
    },
    {
      id: 'indoor',
      icon: '🏠',
      label: `How can we reduce indoor PM2.5 tonight?`,
      prompt: `What practical indoor air protection steps should our family take tonight to lower PM2.5?`
    }
  ];

  // Local Rule Engine Fallback (guarantees zero downtime)
  const generateLocalFallback = (query) => {
    let verdictBadge = 'SAFE TO PROCEED';
    if (cpcbAqi > 200 || Number(pm25) > 90) {
      verdictBadge = 'AVOID / INDOORS ONLY';
    } else if (cpcbAqi > 100 || Number(pm25) > 45) {
      verdictBadge = 'PROCEED WITH CAUTION';
    }

    const qLower = query.toLowerCase();
    let directAnswer = '';
    const whyItMatters = `Active ambient telemetry in ${city} records Indian CPCB AQI at ${cpcbAqi} (${category}, Dominant: ${dominantPollutant}) with PM2.5 at ${pm25} µg/m³.`;
    const saferAlternative = `Shift outdoor movement to today's cleanest 2-hour window (${bestWindow}), when convective solar warming disperses trapped surface particulates.`;
    const indoorAction =
      'Keep exterior windows sealed, execute damp microfiber mopping, and run HEPA air cleaners in primary bedrooms.';

    if (qLower.includes('school') || qLower.includes('kid') || qLower.includes('child')) {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Keep school children indoors for morning hours. With severe particulate pollution in ${city}, open walking routes and outdoor playground drills should be canceled.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Children may attend school, but outdoor sports drills should be curtailed. Ensure they travel in closed vehicles with N95 or KF94 masks.`;
      } else {
        directAnswer = `It is completely safe for children to walk to school and participate in standard outdoor playground games in ${city}.`;
      }
    } else if (qLower.includes('window') || qLower.includes('ventilat')) {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Keep all home windows tightly sealed right now. Infiltration of external combustion soot will immediately spike indoor particulate levels.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Avoid natural ventilation during morning and evening rush hours. A brief cross-ventilation flush is only advisable around midday.`;
      } else {
        directAnswer = `Yes, opening windows right now is safe and recommended. Fresh cross-ventilation will clear indoor carbon dioxide safely.`;
      }
    } else if (qLower.includes('jog') || qLower.includes('run') || qLower.includes('exercise')) {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Cancel outdoor running or cardio workouts immediately. Heavy aerobic minute ventilation during smog draws fine soot deep into alveolar pulmonary tissue.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Postpone outdoor runs to midday or shift to an indoor treadmill session. If running outside, keep intensity strictly low aerobic.`;
      } else {
        directAnswer = `Outdoor running conditions are safe and favorable in ${city}. Particulate matter is well within healthy exercise limits.`;
      }
    } else {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Maintain active indoor containment protocols in ${city}. High external particulate loads require continuous True-HEPA purification.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Exercise caution across household activities. Run the kitchen chimney during frying and avoid burning candles or coils indoors.`;
      } else {
        directAnswer = `Current urban air quality in ${city} is satisfactory. Standard household routines can proceed without restrictions.`;
      }
    }

    if (isSimulation) {
      directAnswer = `[Winter Smog Simulation] ` + directAnswer;
    }

    return {
      verdictBadge,
      directAnswer,
      whyItMatters,
      saferAlternative,
      indoorAction,
      isLocalFallback: true
    };
  };

  // Submit query
  const handleAsk = async (queryToSubmit) => {
    const q = (queryToSubmit || question).trim();
    if (!q) return;

    setIsLoading(true);

    const payload = {
      question: q,
      city,
      cpcbAqi,
      usAqi,
      category,
      dominantPollutant,
      pm25: Number(pm25),
      pm10: Number(pm10),
      bestWindow,
      selectedProfiles: ['School Child', 'Elderly / Asthma', 'Outdoor Runner'],
      selectedActivity: 'Daily Routine',
      isSimulated: Boolean(isSimulation)
    };

    try {
      const response = await fetch('/api/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.data && !result.fallback) {
        setActiveAdvice({
          ...result.data,
          question: q,
          isLocalFallback: false
        });
      } else {
        const fallbackData = generateLocalFallback(q);
        setActiveAdvice({
          ...fallbackData,
          question: q
        });
      }
    } catch {
      const fallbackData = generateLocalFallback(q);
      setActiveAdvice({
        ...fallbackData,
        question: q
      });
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };

  const getVerdictStyle = (badge) => {
    switch (badge) {
      case 'SAFE TO PROCEED':
        return {
          color: 'var(--color-moss)',
          bg: 'rgba(45, 90, 39, 0.1)',
          border: 'rgba(45, 90, 39, 0.3)',
          icon: <ShieldCheck size={16} />
        };
      case 'PROCEED WITH CAUTION':
        return {
          color: '#B45309',
          bg: 'rgba(217, 119, 6, 0.1)',
          border: 'rgba(217, 119, 6, 0.3)',
          icon: <AlertTriangle size={16} />
        };
      case 'AVOID / INDOORS ONLY':
      default:
        return {
          color: 'var(--color-terracotta)',
          bg: 'rgba(200, 75, 49, 0.12)',
          border: 'rgba(200, 75, 49, 0.35)',
          icon: <XCircle size={16} />
        };
    }
  };

  return (
    <div className="tab-view-container advisor-view-layout">
      {/* LEFT RAIL (35%): Live Context Snapshot */}
      <div className="advisor-left-rail">
        <div className="tactile-card context-rail-card">
          <span className="subcard-kicker">GenAI Injected Context</span>
          <h3 className="panel-title">Telemetry Snapshot</h3>
          <p className="panel-sub">Exact physical parameters piped to Gemini 2.5 Flash</p>

          <div className="snapshot-data-table">
            <div className="snapshot-row">
              <span className="snap-lbl">Target City</span>
              <strong className="snap-val">{city}</strong>
            </div>
            <div className="snapshot-row">
              <span className="snap-lbl">Indian CPCB AQI</span>
              <strong className="snap-val tabular-nums">{cpcbAqi} ({category})</strong>
            </div>
            <div className="snapshot-row">
              <span className="snap-lbl">Dominant Pollutant</span>
              <strong className="snap-val">{dominantPollutant}</strong>
            </div>
            <div className="snapshot-row">
              <span className="snap-lbl">PM2.5 / PM10</span>
              <strong className="snap-val tabular-nums">{pm25} / {pm10} µg/m³</strong>
            </div>
            <div className="snapshot-row">
              <span className="snap-lbl">Cleanest Window</span>
              <strong className="snap-val">{bestWindow}</strong>
            </div>
            <div className="snapshot-row">
              <span className="snap-lbl">Sensor Feed</span>
              <strong className="snap-val" style={{ color: isSimulation ? 'var(--color-terracotta)' : 'var(--color-moss)' }}>
                {isSimulation ? 'Synthetic Smog Chamber' : 'Live Open-Meteo API'}
              </strong>
            </div>
          </div>

          <div className="proxy-architecture-box">
            <span className="proxy-arch-title">
              <Shield size={12} style={{ color: 'var(--color-moss)' }} /> Zero-Key Security Architecture
            </span>
            <p className="proxy-arch-desc">
              Browser communicates strictly through the serverless endpoint <code>/api/advise</code>. Your <code>GEMINI_API_KEY</code> is never leaked in client bundle assets.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (65%): Gemini Chat & Structured Cards */}
      <div className="advisor-right-panel">
        <div className="tactile-card advisor-chat-card">
          <div className="advisor-header-row">
            <div>
              <span className="subcard-kicker">Natural Language Health Decisions</span>
              <h3 className="panel-title">AeroSense AI Decision Companion</h3>
            </div>
            <div className="ai-engine-tag">
              <Sparkles size={13} style={{ color: 'var(--color-moss)' }} />
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>

          {/* 4 One-Tap Chips */}
          <div className="scenario-chips-row">
            {scenarioChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="scenario-chip-tactile"
                onClick={() => handleAsk(chip.prompt)}
                disabled={isLoading}
              >
                <span className="chip-ico">{chip.icon}</span>
                <span className="chip-txt">{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Free Text Input */}
          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
          >
            <div className="chat-input-group">
              <input
                type="text"
                className="chat-text-input"
                placeholder={`Ask any specific question about air quality in ${city} for your family...`}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isLoading}
                aria-label="Ask AI Assistant about air quality"
              />
              <button
                type="submit"
                className="chat-submit-btn"
                disabled={isLoading || !question.trim()}
                aria-label="Submit query to Gemini AI"
              >
                {isLoading ? <Loader2 size={15} className="spin-animate" /> : <Send size={15} />}
              </button>
            </div>
          </form>

          {/* Structured Action Card Response */}
          {activeAdvice ? (
            <div className="structured-action-card-display">
              <div className="action-query-recap">
                <HelpCircle size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>"{activeAdvice.question}"</span>
              </div>

              {/* Verdict Banner */}
              {(() => {
                const vStyle = getVerdictStyle(activeAdvice.verdictBadge);
                return (
                  <div
                    className="action-verdict-banner"
                    style={{
                      color: vStyle.color,
                      backgroundColor: vStyle.bg,
                      borderColor: vStyle.border
                    }}
                  >
                    {vStyle.icon}
                    <span>{activeAdvice.verdictBadge}</span>
                  </div>
                );
              })()}

              {/* Direct Answer */}
              <div className="action-content-unit">
                <span className="unit-label">Direct Directive</span>
                <p className="unit-text">{activeAdvice.directAnswer}</p>
              </div>

              {/* Why It Matters */}
              <div className="action-content-unit">
                <span className="unit-label">Telemetry Grounding</span>
                <p className="unit-text muted-text">{activeAdvice.whyItMatters}</p>
              </div>

              {/* Twin Action Cells */}
              <div className="action-twin-cells">
                <div className="twin-cell">
                  <span className="twin-cell-label">
                    <Clock size={12} style={{ color: 'var(--color-moss)' }} /> Safer Window / Swap
                  </span>
                  <p>{activeAdvice.saferAlternative}</p>
                </div>
                <div className="twin-cell">
                  <span className="twin-cell-label">
                    <Home size={12} style={{ color: '#B45309' }} /> Immediate Home Action
                  </span>
                  <p>{activeAdvice.indoorAction}</p>
                </div>
              </div>

              {/* Footnote Attribution */}
              <div className="attribution-footer">
                {activeAdvice.isLocalFallback ? (
                  <span className="fallback-note">
                    <KeyRound size={11} style={{ display: 'inline', marginRight: '4px' }} />
                    Deterministic Rule Engine Fallback • Configure <code>GEMINI_API_KEY</code> on server for live GenAI
                  </span>
                ) : (
                  <span className="genai-note">
                    <Sparkles size={11} style={{ display: 'inline', marginRight: '4px' }} />
                    Synthesized live by <strong>Gemini 2.5 Flash</strong> via structured JSON schema
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-chat-callout">
              <p>Select a family scenario above or type a custom question to generate a structured decision card.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
