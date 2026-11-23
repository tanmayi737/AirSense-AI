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
  KeyRound
} from 'lucide-react';

export default function AeroAssistantChat({
  currentCity,
  telemetry,
  cpcbData,
  cleanWindow,
  isSimulation
}) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAdvice, setActiveAdvice] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const city = currentCity?.name || 'Hyderabad';
  const cpcbAqi = cpcbData?.cpcbAqi || 100;
  const usAqi = telemetry?.current?.us_aqi || 100;
  const category = cpcbData?.category || 'Moderate';
  const dominantPollutant = cpcbData?.dominantPollutant || 'PM2.5';
  const pm25 = telemetry?.current?.pm2_5 || 35;
  const pm10 = telemetry?.current?.pm10 || 45;
  const bestWindow = cleanWindow?.displayWindow || '11:00 AM – 1:00 PM';

  // 4 Curated Scenario Chips
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
      label: `Should I open home windows right now?`,
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

  // Local Rule Engine Fallback (Guarantees zero downtime even before GEMINI_API_KEY is configured)
  const generateLocalFallback = (query) => {
    let verdictBadge = 'SAFE TO PROCEED';
    if (cpcbAqi > 200 || pm25 > 90) {
      verdictBadge = 'AVOID / INDOORS ONLY';
    } else if (cpcbAqi > 100 || pm25 > 45) {
      verdictBadge = 'PROCEED WITH CAUTION';
    }

    const qLower = query.toLowerCase();
    let directAnswer = '';
    const whyItMatters = `Active ambient telemetry in ${city} shows Indian CPCB AQI at ${cpcbAqi} (${category}, Dominant: ${dominantPollutant}) with PM2.5 at ${pm25} µg/m³.`;
    const saferAlternative = `Target outdoor movement during today's cleanest 2-hour window (${bestWindow}), when solar dispersion reduces particulate concentrations.`;
    const indoorAction =
      'Keep exterior windows sealed, use microfiber damp mopping (avoid dry brooming), and maintain active HEPA filtration in bedrooms.';

    if (qLower.includes('school') || qLower.includes('kid') || qLower.includes('child')) {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Keep school children strictly indoors during morning hours. With severe particulate pollution in ${city}, open walking routes and morning assemblies should be canceled.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Children may attend school, but outdoor sports drills should be curtailed. Ensure they travel in closed vehicles wearing snug N95 or KF94 masks.`;
      } else {
        directAnswer = `It is completely safe for children to walk to school and participate in standard outdoor playground games in ${city}.`;
      }
    } else if (qLower.includes('window') || qLower.includes('ventilat')) {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Keep all windows tightly sealed right now. Opening windows will flood indoor living spaces with fine microscopic combustion soot.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Avoid natural ventilation during morning and evening rush hours. Brief cross-ventilation is only advisable during midday hours if indoor CO₂ rises.`;
      } else {
        directAnswer = `Yes, opening windows right now is safe and recommended. Fresh cross-ventilation will clear stale air without introducing harmful particulate spikes.`;
      }
    } else if (qLower.includes('jog') || qLower.includes('run') || qLower.includes('exercise')) {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Cancel outdoor running or high-intensity cardio immediately. Heavy aerobic breathing during severe smog drives dangerous PM2.5 deep into alveolar tissue.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Postpone outdoor runs to midday or shift to an indoor treadmill session. If running outside, keep intensity light (Zone 1/2).`;
      } else {
        directAnswer = `Outdoor running conditions are safe and favorable in ${city}. Particulate matter is well within healthy exercise limits.`;
      }
    } else {
      if (verdictBadge === 'AVOID / INDOORS ONLY') {
        directAnswer = `Enforce strict indoor air isolation protocols in ${city}. Run continuous HEPA purifiers and seal external door gaps with weather-stripping.`;
      } else if (verdictBadge === 'PROCEED WITH CAUTION') {
        directAnswer = `Exercise caution across household activities. Run the kitchen chimney during cooking and avoid burning candles, incense, or coils indoors.`;
      } else {
        directAnswer = `Current urban air quality in ${city} is satisfactory. Standard household and outdoor routines can proceed without intervention.`;
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

  // Submit Query to /api/advise or Local Fallback
  const handleAsk = async (queryToSubmit) => {
    const q = (queryToSubmit || question).trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      question: q,
      city,
      cpcbAqi,
      usAqi,
      category,
      dominantPollutant,
      pm25,
      pm10,
      bestWindow,
      selectedProfiles: ['School Child', 'Elderly / Asthma'],
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
        // Fallback triggered gracefully
        console.warn('Backend returned fallback mode:', result.error);
        const fallbackData = generateLocalFallback(q);
        setActiveAdvice({
          ...fallbackData,
          question: q,
          backendNote: result.error
        });
      }
    } catch (err) {
      console.warn('Network error reaching /api/advise, using local engine:', err);
      const fallbackData = generateLocalFallback(q);
      setActiveAdvice({
        ...fallbackData,
        question: q,
        backendNote: 'API Proxy unreachable. Deterministic rule engine active.'
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
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '#10B981',
          icon: <ShieldCheck size={16} />
        };
      case 'PROCEED WITH CAUTION':
        return {
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: '#F59E0B',
          icon: <AlertTriangle size={16} />
        };
      case 'AVOID / INDOORS ONLY':
      default:
        return {
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.18)',
          border: '#EF4444',
          icon: <XCircle size={16} />
        };
    }
  };

  return (
    <section className="assistant-section" aria-labelledby="assistant-title">
      {/* Title Header */}
      <div className="assistant-header-row">
        <div className="assistant-title-wrap">
          <div className="assistant-avatar">
            <Bot size={20} />
          </div>
          <div>
            <h3 id="assistant-title" className="assistant-title">
              AeroSense Context-Aware AI Advisor
            </h3>
            <p className="assistant-sub">
              Powered by <strong>Gemini 2.5 Flash</strong> • Injected with live {city} telemetry (CPCB AQI {cpcbAqi})
            </p>
          </div>
        </div>

        {/* Live Context Indicator Pill */}
        <div className="context-telemetry-badge">
          <span className="live-dot" />
          <span>
            {city} AQI: <strong>{cpcbAqi}</strong> ({dominantPollutant})
          </span>
        </div>
      </div>

      {/* 4 One-Tap Scenario Chips */}
      <div className="scenario-chips-wrapper">
        <span className="chips-label">Quick Family Scenarios:</span>
        <div className="scenario-chips-grid">
          {scenarioChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="scenario-chip-btn"
              onClick={() => handleAsk(chip.prompt)}
              disabled={isLoading}
            >
              <span className="chip-icon">{chip.icon}</span>
              <span className="chip-text">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Form */}
      <form
        className="assistant-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
      >
        <div className="input-group">
          <input
            type="text"
            className="assistant-input-box"
            placeholder={`Ask any specific question about air quality in ${city} for your family...`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            aria-label="Ask AI Assistant about air quality"
          />
          <button
            type="submit"
            className="btn-assistant-send"
            disabled={isLoading || !question.trim()}
            aria-label="Send query to Gemini AI"
          >
            {isLoading ? (
              <Loader2 size={16} className="spin-animate" />
            ) : (
              <>
                <span>Ask AI</span>
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Structured Action Card Response */}
      {activeAdvice && (
        <div className="action-card-response" role="region" aria-live="polite">
          {/* Query Question Ref */}
          <div className="response-question-ref">
            <HelpCircle size={14} style={{ color: 'var(--color-teal-light)', flexShrink: 0 }} />
            <span>
              Query: <strong>"{activeAdvice.question}"</strong>
            </span>
          </div>

          {/* Verdict Banner */}
          {(() => {
            const vStyle = getVerdictStyle(activeAdvice.verdictBadge);
            return (
              <div
                className="verdict-banner"
                style={{
                  backgroundColor: vStyle.bg,
                  borderColor: vStyle.border,
                  color: vStyle.color
                }}
              >
                {vStyle.icon}
                <span className="verdict-text">{activeAdvice.verdictBadge}</span>
              </div>
            );
          })()}

          {/* Direct Answer */}
          <div className="advice-block direct-answer-block">
            <span className="advice-block-label">Direct Directive</span>
            <p className="advice-block-text">{activeAdvice.directAnswer}</p>
          </div>

          {/* Why It Matters */}
          <div className="advice-block why-matters-block">
            <span className="advice-block-label">Telemetry Grounding</span>
            <p className="advice-block-text">{activeAdvice.whyItMatters}</p>
          </div>

          {/* Dual Action Grid: Safer Alternative + Indoor Action */}
          <div className="advice-dual-grid">
            {/* Safer Alternative */}
            <div className="advice-sub-card">
              <div className="sub-card-title">
                <Clock size={14} style={{ color: 'var(--color-teal-light)' }} />
                <span>Safer Alternative / Window</span>
              </div>
              <p>{activeAdvice.saferAlternative}</p>
            </div>

            {/* Indoor Action */}
            <div className="advice-sub-card">
              <div className="sub-card-title">
                <Home size={14} style={{ color: '#FBBF24' }} />
                <span>Immediate Indoor Protection</span>
              </div>
              <p>{activeAdvice.indoorAction}</p>
            </div>
          </div>

          {/* Engine Attributions Footnote */}
          <div className="engine-attribution-footnote">
            {activeAdvice.isLocalFallback ? (
              <span className="fallback-tag">
                <KeyRound size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Local Deterministic Engine Fallback • Add <code>GEMINI_API_KEY</code> in environment for live GenAI
              </span>
            ) : (
              <span className="genai-tag">
                <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Synthesized live by <strong>Gemini 2.5 Flash</strong> Structured Outputs
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
