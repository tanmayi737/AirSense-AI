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
  XCircle,
  Info,
  Sparkles,
  Loader2,
  X,
  Clock
} from 'lucide-react';
import { calculateSustainableOffset } from '../utils/decisionEngine';

export default function SanctuaryView({
  aqiData,
  cleanWindow,
  currentCity,
  isSimulation,
  selectedPersonas = ['School Child', 'Elderly / Asthma']
}) {
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

  // Gemini AI Home Defense Synthesis State
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const cityName = currentCity?.name || 'Hyderabad';
  const aqi = aqiData?.cpcbAqi || 100;
  const isSevere = aqi > 200;
  const isModerate = aqi > 100;

  // Derive dynamic day/night window label from cleanWindow start hour
  const getWindowLabel = () => {
    if (!cleanWindow?.displayWindow) return { label: 'Solar Convection Window', isNight: false };
    // Parse the start hour from displayWindow (e.g. "11:00 AM – 1:00 PM" or "9:00 PM – 11:00 PM")
    const timeStr = cleanWindow.displayWindow.split('–')[0].trim();
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { label: 'Solar Convection Window', isNight: false };
    let hour = parseInt(match[1], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    // Late-Night: 6 PM (18) to 5 AM (5); Solar: 10 AM (10) to 4 PM (16)
    const isNight = hour >= 18 || hour < 5;
    const isSolar = hour >= 10 && hour < 16;
    if (isNight) return { label: 'Late-Night Dispersion Window', isNight: true };
    if (isSolar) return { label: 'Solar Convection Window', isNight: false };
    return { label: 'Morning Flush Window', isNight: false };
  };
  const windowMeta = getWindowLabel();

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const offset = calculateSustainableOffset(commuteDistance, transitMode);

  // Synthesize indoor microclimate guidance via Gemini AI
  const handlePersonalizeSanctuaryAi = async () => {
    setIsAiLoading(true);
    const profiles = selectedPersonas && selectedPersonas.length > 0 ? selectedPersonas : ['School Child', 'Elderly / Asthma'];
    const prompt = `How should a household with ${profiles.join(' and ')} in ${cityName} with Indian CPCB AQI of ${aqi} protect indoor air quality, schedule window ventilation, and minimize smoke exposure today?`;

    try {
      const response = await fetch('/api/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          city: cityName,
          cpcbAqi: aqi,
          usAqi: aqi,
          category: isSevere ? 'Poor / Severe' : isModerate ? 'Moderate' : 'Good / Satisfactory',
          dominantPollutant: aqiData?.dominantPollutant || 'PM2.5',
          pm25: Number(aqiData?.subIndices?.pm2_5 || aqiData?.pm2_5 || 45),
          pm10: Number(aqiData?.subIndices?.pm10 || aqiData?.pm10 || 65),
          bestWindow: cleanWindow?.displayWindow || '11:00 AM – 1:00 PM',
          selectedProfiles: profiles,
          selectedActivity: 'Home Ventilation',
          durationMinutes: 45,
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
        setAiAdvice({
          verdictBadge: isSevere ? 'AVOID / INDOORS ONLY' : isModerate ? 'PROCEED WITH CAUTION' : 'SAFE TO PROCEED',
          directAnswer: isSevere
            ? `Keep all external windows sealed in ${cityName}. Run indoor True-HEPA purifiers on medium-high continuously.`
            : windowMeta?.isNight
              ? `Open cross-facing windows briefly (15 min) during the ${windowMeta.label} (${cleanWindow?.displayWindow || '10:00 PM – 12:00 AM'}) when late-night traffic drops and surface dust settles.`
              : `Open windows only during the midday sun window (${cleanWindow?.displayWindow || '11:00 AM – 1:00 PM'}) for 20 minutes to flush stale CO₂.`,
          whyItMatters: `Indian CPCB AQI in ${cityName} is ${aqi}. Infiltration of outdoor fine dust elevates indoor particulate levels rapidly.`,
          saferAlternative: `Ventilate during ${cleanWindow?.displayWindow || '11:00 AM – 1:00 PM'}, when ${windowMeta?.isNight ? 'lighter late-night traffic allows brief safe cross-ventilation' : 'warm midday sun helps lift surface smog'}.`,
          indoorAction: `Wipe floors with a damp microfiber mop daily and run the kitchen exhaust on high while cooking.`,
          isFallback: true
        });
      }
    } catch {
      setAiAdvice({
        verdictBadge: isSevere ? 'AVOID / INDOORS ONLY' : isModerate ? 'PROCEED WITH CAUTION' : 'SAFE TO PROCEED',
        directAnswer: isSevere
          ? `Keep all external windows sealed in ${cityName}. Run indoor True-HEPA purifiers on medium-high continuously.`
          : windowMeta?.isNight
            ? `Open cross-facing windows briefly (15 min) during the ${windowMeta.label} (${cleanWindow?.displayWindow || '10:00 PM – 12:00 AM'}) when late-night traffic drops and surface dust settles.`
            : `Open windows only during the midday sun window (${cleanWindow?.displayWindow || '11:00 AM – 1:00 PM'}) for 20 minutes to flush stale indoor air.`,
        whyItMatters: `Indian CPCB AQI in ${cityName} is ${aqi}. Outdoor fine dust can quickly build up indoors if windows stay open.`,
        saferAlternative: `Ventilate during ${cleanWindow?.displayWindow || '11:00 AM – 1:00 PM'}, when ${windowMeta?.isNight ? 'lighter late-night traffic allows brief safe cross-ventilation' : 'warm midday sun helps lift surface smog'}.`,
        indoorAction: `Wipe floors with a damp microfiber mop daily and run the kitchen exhaust on high while cooking.`,
        isFallback: true
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="tab-view-container sanctuary-view-layout">
      {/* LEFT PANEL (50%): Smart Ventilation Protocol & Indoor Checklist */}
      <div className="sanctuary-panel-col">
        <div className="tactile-card sanctuary-card">
          <div className="sanctuary-header-row">
            <div>
              <span className="subcard-kicker">Home Air Protection</span>
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

          {/* Diurnal Ventilation Window Guide with Zero Jargon */}
          <div className="diurnal-guide-strip">
            <div className={`diurnal-phase ${isSevere ? 'phase-lock' : 'phase-caution'}`}>
              <span className="phase-time">07:00 – 10:30 AM</span>
              <span className="phase-title">Morning Inversion Peak</span>
              <p className="phase-desc">Cold ground air traps vehicle exhaust smoke low—keep doors and balcony glass tightly shut from 7 to 10:30 AM.</p>
            </div>

            <div className={`diurnal-phase ${isSevere ? 'phase-lock' : 'phase-open'}`}>
              <span className="phase-time">{cleanWindow?.displayWindow || '11:00 AM – 02:00 PM'}</span>
              <span className="phase-title">{windowMeta.label}</span>
              <p className="phase-desc">
                {isSevere
                  ? `Smog in ${cityName} remains severe. Keep windows sealed and operate indoor air purifiers.`
                  : windowMeta.isNight
                    ? `Late-evening traffic drops significantly after 10 PM — briefly open cross-facing windows for 15 minutes to exchange stale indoor air before sealing again for the night.`
                    : 'Warm midday sun lifts and scatters smoke—brief 20-min window opening flushes indoor CO₂ safely.'}
              </p>
            </div>

            <div className={`diurnal-phase ${isSevere ? 'phase-lock' : 'phase-caution'}`}>
              <span className="phase-time">06:00 – 10:00 PM</span>
              <span className="phase-title">Evening Traffic Trapping</span>
              <p className="phase-desc">Post-sunset cooling traps vehicle exhaust near street level—reseal all doors and windows.</p>
            </div>
          </div>

          {/* AI Home Defense Button */}
          <div className="sanctuary-ai-btn-row">
            <button
              type="button"
              className="gemini-personalize-btn"
              onClick={handlePersonalizeSanctuaryAi}
              disabled={isAiLoading}
              aria-label="Synthesize home defense advice with Gemini AI"
            >
              {isAiLoading ? (
                <>
                  <Loader2 size={14} className="spin-animate" />
                  <span>Synthesizing Home Protocol...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Personalize Home Protocol with Gemini AI</span>
                </>
              )}
            </button>
          </div>

          {/* AI Advice Callout (if active) */}
          {aiAdvice && (
            <div className="tactile-card ai-synthesis-featured-card" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="ai-featured-header">
                <div className="ai-featured-title-wrap">
                  <Sparkles size={14} style={{ color: 'var(--color-moss)' }} />
                  <strong>Gemini AI Home Protocol for {cityName}</strong>
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
                <p className="ai-direct-answer">{aiAdvice.directAnswer}</p>
                <div className="ai-why-row">
                  <strong>Why: </strong>
                  <span>{aiAdvice.whyItMatters}</span>
                </div>
                <div className="ai-actions-grid">
                  <div className="ai-action-item">
                    <span className="ai-item-lbl">
                      <Clock size={11} style={{ color: 'var(--color-moss)' }} /> Ventilation Swap
                    </span>
                    <p>{aiAdvice.saferAlternative}</p>
                  </div>
                  <div className="ai-action-item">
                    <span className="ai-item-lbl">
                      <Home size={11} style={{ color: '#B45309' }} /> Filter / Mop Step
                    </span>
                    <p>{aiAdvice.indoorAction}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Checklist */}
          <div className="indoor-checklist-subcard">
            <span className="subcard-kicker">Daily Home Habits</span>
            <h4 className="checklist-heading">Clean-Air Home Checklist</h4>

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
                  <p>Blocks tiny gaps where fine outdoor dust sneaks into living spaces.</p>
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
                  <p>Dry brooms toss settled toxic dust back into the air at breathing height. Damp microfiber cloths lock dust down permanently.</p>
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
                  <p>Indian cooking (tadka, frying, roasting spices) creates extreme indoor smoke (&gt;300 µg/m³)—run high exhaust and keep interior kitchen doors shut.</p>
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
                  <p>Keep bedroom door shut with True-HEPA purifier running on medium overnight to allow tired lungs to rest and recover.</p>
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
            Compare the quantified particulate & carbon pollution avoided by opting for low-emission transit modes against single-occupant petrol driving in {cityName}.
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