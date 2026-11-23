/**
 * AeroSense AI — Indian CPCB AQI Engine & Decision Matrix
 * Compliant with Central Pollution Control Board (CPCB) India Guidelines
 */

// CPCB Breakpoints for PM2.5 (µg/m³) -> AQI (0 - 500)
const CPCB_PM25_BREAKPOINTS = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50, category: 'Good', color: '#10B981' },
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84CC16' },
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200, category: 'Moderate', color: '#F59E0B' },
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300, category: 'Poor', color: '#F97316' },
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#EF4444' },
  { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500, category: 'Severe', color: '#991B1B' }
];

// CPCB Breakpoints for PM10 (µg/m³) -> AQI (0 - 500)
const CPCB_PM10_BREAKPOINTS = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50, category: 'Good', color: '#10B981' },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84CC16' },
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200, category: 'Moderate', color: '#F59E0B' },
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300, category: 'Poor', color: '#F97316' },
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#EF4444' },
  { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500, category: 'Severe', color: '#991B1B' }
];

/**
 * Linear interpolation to calculate sub-index according to CPCB formula:
 * Ip = [ (I_hi - I_lo) / (B_hi - B_lo) * (Cp - B_lo) ] + I_lo
 */
function interpolateSubIndex(concentration, breakpoints) {
  const conc = Math.max(0, Number(concentration) || 0);

  // If below minimum
  if (conc <= breakpoints[0].cLow) return breakpoints[0].iLow;

  // Find corresponding breakpoint
  for (const bp of breakpoints) {
    if (conc >= bp.cLow && conc <= bp.cHigh) {
      const subIndex =
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (conc - bp.cLow) + bp.iLow;
      return Math.round(subIndex);
    }
  }

  // If concentration exceeds highest defined bracket (Severe / Hazardous spike)
  const lastBp = breakpoints[breakpoints.length - 1];
  if (conc > lastBp.cHigh) {
    // Extrapolate safely beyond 500
    const extra = ((lastBp.iHigh - lastBp.iLow) / (lastBp.cHigh - lastBp.cLow)) * (conc - lastBp.cHigh);
    return Math.min(500, Math.round(lastBp.iHigh + extra));
  }

  return 0;
}

/**
 * Calculates official Indian CPCB AQI, sub-indices, and dominant pollutant
 * @param {number} pm25 - PM2.5 in µg/m³
 * @param {number} pm10 - PM10 in µg/m³
 * @returns {Object} { cpcbAqi, pm25SubIndex, pm10SubIndex, dominantPollutant, category, color, badgeClass }
 */
export function calculateCpcbAqi(pm25, pm10) {
  const pm25Sub = interpolateSubIndex(pm25, CPCB_PM25_BREAKPOINTS);
  const pm10Sub = interpolateSubIndex(pm10, CPCB_PM10_BREAKPOINTS);

  const cpcbAqi = Math.max(pm25Sub, pm10Sub);
  const dominantPollutant = pm25Sub >= pm10Sub ? 'PM2.5' : 'PM10';

  let category = 'Good';
  let color = '#10B981';
  let badgeClass = 'badge-good';
  let healthSummary = 'Clean air with minimal health impact.';

  if (cpcbAqi <= 50) {
    category = 'Good';
    color = '#10B981';
    badgeClass = 'badge-good';
    healthSummary = 'Minimal health impact. Satisfactory ambient air.';
  } else if (cpcbAqi <= 100) {
    category = 'Satisfactory';
    color = '#84CC16';
    badgeClass = 'badge-satisfactory';
    healthSummary = 'Minor breathing discomfort to sensitive individuals.';
  } else if (cpcbAqi <= 200) {
    category = 'Moderate';
    color = '#F59E0B';
    badgeClass = 'badge-moderate';
    healthSummary = 'Breathing discomfort to people with asthma and heart conditions.';
  } else if (cpcbAqi <= 300) {
    category = 'Poor';
    color = '#F97316';
    badgeClass = 'badge-poor';
    healthSummary = 'Breathing discomfort to most people on prolonged exposure.';
  } else if (cpcbAqi <= 400) {
    category = 'Very Poor';
    color = '#EF4444';
    badgeClass = 'badge-very-poor';
    healthSummary = 'Respiratory illness to people on prolonged exposure.';
  } else {
    category = 'Severe';
    color = '#991B1B';
    badgeClass = 'badge-severe';
    healthSummary = 'Emergency warning: Affects healthy people and seriously impacts sensitive groups.';
  }

  return {
    cpcbAqi,
    pm25SubIndex: pm25Sub,
    pm10SubIndex: pm10Sub,
    dominantPollutant,
    category,
    color,
    badgeClass,
    healthSummary
  };
}

/**
 * Scans today's hourly PM2.5 forecast and identifies the cleanest 2-hour window
 * @param {Object} hourlyData - { time: string[], pm2_5: number[], us_aqi?: number[] }
 * @param {number} currentPm25 - Active PM2.5 reading
 * @returns {Object} Clean window analysis + 24h formatted points for charting
 */
export function findBestOutdoorWindow(hourlyData, currentPm25 = 35) {
  if (!hourlyData || !Array.isArray(hourlyData.time) || hourlyData.time.length === 0) {
    return {
      hasData: false,
      bestWindow: null,
      hourlyPoints: []
    };
  }

  const times = hourlyData.time;
  const pm25Values = hourlyData.pm2_5 || [];
  const count = Math.min(times.length, pm25Values.length, 24);

  let minWindowAvg = Infinity;
  let bestStartIndex = 0;

  // Format hourly points for bar chart
  const hourlyPoints = [];

  for (let i = 0; i < count; i++) {
    const rawTime = times[i];
    const pmVal = pm25Values[i] != null ? Number(pm25Values[i]) : 0;
    const dateObj = new Date(rawTime);
    const hour = isNaN(dateObj.getTime()) ? i : dateObj.getHours();
    const hourLabel = isNaN(dateObj.getTime())
      ? `${i}:00`
      : new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: true }).format(dateObj);

    hourlyPoints.push({
      index: i,
      time: rawTime,
      hour,
      hourLabel,
      pm2_5: Math.round(pmVal * 10) / 10,
      isBestWindow: false
    });
  }

  // Scan sliding 2-hour window (i and i+1)
  for (let i = 0; i < count - 1; i++) {
    const avg = (hourlyPoints[i].pm2_5 + hourlyPoints[i + 1].pm2_5) / 2;
    if (avg < minWindowAvg) {
      minWindowAvg = avg;
      bestStartIndex = i;
    }
  }

  // Mark the best 2-hour window
  if (hourlyPoints[bestStartIndex]) hourlyPoints[bestStartIndex].isBestWindow = true;
  if (hourlyPoints[bestStartIndex + 1]) hourlyPoints[bestStartIndex + 1].isBestWindow = true;

  const startPt = hourlyPoints[bestStartIndex] || hourlyPoints[0];
  const endPt = hourlyPoints[bestStartIndex + 1] || startPt;

  // Calculate percentage cleaner than current air
  const cur = Number(currentPm25) || 35;
  let cleanerPercent = 0;
  if (cur > minWindowAvg) {
    cleanerPercent = Math.round(((cur - minWindowAvg) / cur) * 100);
  }

  return {
    hasData: true,
    bestStartIndex,
    startTime: startPt.time,
    endTime: endPt.time,
    displayWindow: `${startPt.hourLabel} – ${endPt.hourLabel}`,
    avgPm25: Math.round(minWindowAvg * 10) / 10,
    currentPm25: cur,
    cleanerPercent,
    hourlyPoints
  };
}

/**
 * Generates Structured Household Decisions based on active AQI, family profiles, and activity
 * @param {Object} aqiData - { cpcbAqi, usAqi, pm2_5, pm10 }
 * @param {Array<string>} selectedProfiles - e.g. ["School Child", "Elderly / Asthma"]
 * @param {string} selectedActivity - e.g. "Morning School Run"
 * @param {Object} cleanWindow - Output of findBestOutdoorWindow
 * @returns {Array<Object>} Structured decision cards
 */
export function generateHouseholdDecisions(aqiData, selectedProfiles, selectedActivity, cleanWindow) {
  const pm25 = aqiData.pm2_5 || 35;
  const pm10 = aqiData.pm10 || 45;
  const aqi = aqiData.cpcbAqi || aqiData.usAqi || 100;

  const profiles = selectedProfiles && selectedProfiles.length > 0
    ? selectedProfiles
    : ['School Child', 'Elderly / Asthma', 'Outdoor Runner', 'Daily Commuter'];

  const activity = selectedActivity || 'Morning School Run';
  const cleanTime = cleanWindow?.displayWindow || '1:00 PM – 3:00 PM';
  const cleanPct = cleanWindow?.cleanerPercent || 0;

  return profiles.map((profile) => {
    let status = 'GO';
    let action = '';
    let why = '';
    let saferSwap = '';
    let indoorHack = '';

    // Logic by Profile & AQI level
    if (profile === 'School Child') {
      if (activity === 'Morning School Run') {
        if (aqi > 250 || pm25 > 120) {
          status = 'AVOID';
          action = 'Advise indoor morning assembly and request bus windows stay sealed. Child must wear child-sized N95/KF94 mask.';
          why = `Extreme particulate spike (PM2.5: ${pm25} µg/m³). Developing lungs experience 2.5x greater particle deposition per kg body weight.`;
          saferSwap = 'Coordinate with school for indoor physical education; switch from open auto-rickshaw to closed carpool or school bus with AC recirculation.';
          indoorHack = 'Purge classroom or bedroom with HEPA air purifier 30 mins before sleep; keep room door closed.';
        } else if (aqi > 100 || pm25 > 50) {
          status = 'MODIFY';
          action = 'Ensure child commutes with snug cloth/surgical mask or KF94; skip intense outdoor sprint activities.';
          why = `Elevated PM2.5 (${pm25} µg/m³) exceeds WHO 24-hr guideline of 15 µg/m³ and irritates pediatric upper airways.`;
          saferSwap = `Reschedule outdoor play to the cleaner daytime window (${cleanTime}, ${cleanPct}% cleaner).`;
          indoorHack = 'Run damp micro-fiber mop in study room before homework to trap settling dust particles.';
        } else {
          status = 'GO';
          action = 'Standard outdoor school run permitted without restrictions. Normal playground activities encouraged.';
          why = `Ambient PM2.5 (${pm25} µg/m³) is within safe limits for pediatric outdoor exertion.`;
          saferSwap = 'Natural ventilation and outdoor walking routes are safe.';
          indoorHack = 'Keep natural cross-ventilation open for fresh oxygen circulation.';
        }
      } else if (activity === 'Outdoor Exercise') {
        if (aqi > 150) {
          status = 'AVOID';
          action = 'Cancel outdoor sports, football, or running drills. Move to indoor gymnasium with closed doors.';
          why = `Vigorous aerobic play increases inhalation volume 4-fold, driving fine PM2.5 deep into alveolar tissue.`;
          saferSwap = `Shift physical training to midday (${cleanTime}) or indoor home stretching.`;
          indoorHack = 'Place potted Areca Palm or Snake Plant in living area; maintain indoor humidity 40-50%.';
        } else {
          status = 'GO';
          action = 'Outdoor playtime is safe. Hydrate well during play.';
          why = `Particulate levels (${pm25} µg/m³) are well tolerated by active children.`;
          saferSwap = 'Parks away from arterial highways are ideal.';
          indoorHack = 'Regular natural ventilation during daytime.';
        }
      } else {
        // General profile advice
        status = aqi > 200 ? 'AVOID' : aqi > 100 ? 'MODIFY' : 'GO';
        action = aqi > 200 ? 'Restrict all non-essential exposure; mask up.' : 'Exercise caution during peak traffic hours.';
        why = `Current Indian CPCB AQI is ${aqi} with dominant pollutant ${aqiData.dominantPollutant || 'PM2.5'}.`;
        saferSwap = `Target outdoor movement during ${cleanTime}.`;
        indoorHack = 'Run kitchen chimney during frying; seal exterior doors.';
      }
    } else if (profile === 'Elderly / Asthma') {
      if (aqi > 200 || pm25 > 90) {
        status = 'AVOID';
        action = 'Strict stay-at-home advisory. Keep rescue inhaler at hand and run HEPA air filtration continuously.';
        why = `High PM2.5 (${pm25} µg/m³) and PM10 (${pm10} µg/m³) trigger immediate bronchospasm and vascular inflammation.`;
        saferSwap = `Postpone morning balcony walk to ${cleanTime} or perform gentle indoor walking inside corridor.`;
        indoorHack = 'Maintain sealed bedroom as "Clean Air Zone"; run HEPA air purifier on medium-high speed.';
      } else if (aqi > 100 || pm25 > 45) {
        status = 'MODIFY';
        action = 'Avoid early morning walk before 8:30 AM when thermal inversion traps cold polluted air near ground.';
        why = `Moderate air quality (AQI ${aqi}) can exacerbate chronic COPD, wheezing, and allergic rhinitis.`;
        saferSwap = `Take light walk during cleanest afternoon window (${cleanTime}) when solar radiation disperses smog.`;
        indoorHack = 'Avoid burning incense (agarbatti) or mosquito coils which generate internal PM2.5 exceeding 200 µg/m³.';
      } else {
        status = 'GO';
        action = 'Morning and evening outdoor walks permitted. Enjoy natural green spaces.';
        why = `Air quality is benign (PM2.5: ${pm25} µg/m³), posing minimal risk to pulmonary systems.`;
        saferSwap = 'Walking in urban parks with dense tree canopies provides best microclimate.';
        indoorHack = 'Air out house between 11 AM and 3 PM.';
      }
    } else if (profile === 'Outdoor Runner') {
      if (aqi > 200 || pm25 > 100) {
        status = 'AVOID';
        action = 'Cancel outdoor running / HIIT cardio. High cardiac load in smog causes microvascular constriction.';
        why = `At a running minute ventilation of 60-80 L/min, you inhale over 1.2 mg of toxic PM2.5 in a 45-min run.`;
        saferSwap = `Replace road run with indoor treadmill workout or postpone to ${cleanTime} (${cleanPct}% cleaner air).`;
        indoorHack = 'Run air purifier in workout room for 20 mins prior to indoor cardio training.';
      } else if (aqi > 100 || pm25 > 50) {
        status = 'MODIFY';
        action = 'Drop intensity from tempo/interval to easy zone 2 aerobic jog; avoid roadside routes.';
        why = `Moderate particulate levels (${pm25} µg/m³) increase oxidative stress and airway hyper-responsiveness.`;
        saferSwap = `Shift running route to forest reserves/university campuses during ${cleanTime}.`;
        indoorHack = 'Hydrate with antioxidant-rich fluids (green tea, turmeric water) post-workout.';
      } else {
        status = 'GO';
        action = 'Ideal conditions for outdoor marathon training, trail running, and endurance workouts.';
        why = `Low particulate concentrations (PM2.5: ${pm25} µg/m³) ensure peak oxygen delivery without inflammation.`;
        saferSwap = 'All outdoor routes safe and optimal.';
        indoorHack = 'Open windows for cross-flow cooling.';
      }
    } else {
      // Daily Commuter
      if (aqi > 200 || pm25 > 120) {
        status = 'AVOID';
        action = 'Avoid 2-wheeler/auto commutes if possible. Wear certified N95 mask; seal car cabin in AC recirculation mode.';
        why = `Direct tailpipe exposure on traffic corridors spikes PM2.5 beyond 280 µg/m³ with heavy toxic black carbon and NO₂.`;
        saferSwap = 'Switch from open bike/scooter to Metro rail or AC carpool. Avoid arterial gridlocks during 8-10 AM.';
        indoorHack = 'Inspect vehicle cabin air filter (replace with activated carbon HEPA filter every 10,000 km).';
      } else if (aqi > 100 || pm25 > 50) {
        status = 'MODIFY';
        action = 'Keep car windows closed with AC on recirculation. Motorcyclists should wear dust/anti-pollution masks.';
        why = `Commuting along heavy vehicle corridors exposes commuters to 2-3x background ambient PM10 (${pm10} µg/m³).`;
        saferSwap = 'Choose ring roads or metro transit over congested bottleneck intersections.';
        indoorHack = 'Wipe car dashboard and upholstery with damp cloth to remove tracked-in road dust.';
      } else {
        status = 'GO';
        action = 'Standard commute conditions. Biking, walking, and public transit are safe and eco-friendly.';
        why = `Ambient pollutant levels are well dispersed across city corridors.`;
        saferSwap = 'Cycle or walk for short trips to reduce urban vehicle emissions.';
        indoorHack = 'Standard cabin ventilation is fine.';
      }
    }

    return {
      profile,
      activity,
      status,
      badgeColor: status === 'GO' ? '#10B981' : status === 'MODIFY' ? '#F59E0B' : '#EF4444',
      badgeBg: status === 'GO' ? 'rgba(16, 185, 129, 0.15)' : status === 'MODIFY' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.18)',
      action,
      why,
      saferSwap,
      indoorHack
    };
  });
}

/**
 * Calculates quantified sustainable mobility emission savings
 * @param {number} commuteDistanceKm - One way or roundtrip distance (km)
 * @param {string} mode - "metro", "carpool", or "electric_bus"
 */
export function calculateSustainableOffset(commuteDistanceKm = 15, mode = 'metro') {
  const km = Math.max(1, Number(commuteDistanceKm) || 15);

  // Benchmarks per passenger-km (urban India average):
  // Solo Petrol Car: ~140g CO2/km, ~0.08g direct PM2.5/km (exhaust + brake/tire dust)
  // Metro Rail: ~22g CO2/km, ~0.005g PM2.5/km (grid emissions allocated)
  // Carpool (3 riders): ~47g CO2/km, ~0.027g PM2.5/km
  // Electric Bus: ~35g CO2/km, ~0.012g PM2.5/km

  const soloCarCo2 = km * 142; // grams
  const soloCarPm25 = km * 0.085; // grams

  let altCo2 = km * 22;
  let altPm25 = km * 0.005;
  let modeName = 'Delhi/Hyd Metro Rail';

  if (mode === 'carpool') {
    altCo2 = km * 47;
    altPm25 = km * 0.028;
    modeName = 'Carpool (3 passengers)';
  } else if (mode === 'electric_bus') {
    altCo2 = km * 36;
    altPm25 = km * 0.014;
    modeName = 'Electric City Bus';
  }

  const savedCo2Grams = Math.max(0, soloCarCo2 - altCo2);
  const savedPm25Grams = Math.max(0, soloCarPm25 - altPm25);

  return {
    km,
    modeName,
    savedCo2Kg: (savedCo2Grams / 1000).toFixed(2),
    savedPm25Grams: savedPm25Grams.toFixed(2),
    treesEquivalent: (savedCo2Grams / 60).toFixed(1), // daily absorption factor
    fuelCostSavedInr: Math.round(km * 7.5) // Approximate INR savings vs solo petrol car
  };
}

/**
 * Calculates percentage of WHO safe daily PM2.5 budget consumed by a specific activity
 * @param {number} pm25 - Active PM2.5 in µg/m³
 * @param {string} activity - Planned activity name
 * @returns {Object} { percent, activityDose, safeDailyBudget, status, color, descriptor }
 */
export function calculateExposureBudget(pm25 = 35, activity = 'Exercise') {
  const conc = Math.max(5, Number(pm25) || 35);

  let durationHours = 1.0;
  let ventilationRate = 1.0;

  const actLower = (activity || '').toLowerCase();
  if (actLower.includes('exercise') || actLower.includes('jog') || actLower.includes('run')) {
    durationHours = 0.75;
    ventilationRate = 2.2;
  } else if (actLower.includes('school')) {
    durationHours = 0.5;
    ventilationRate = 1.2;
  } else if (actLower.includes('commute')) {
    durationHours = 1.0;
    ventilationRate = 1.0;
  } else {
    durationHours = 2.0;
    ventilationRate = 0.6;
  }

  // WHO safe daily exposure baseline: 15 µg/m³ * 12 m³ air = 180 µg
  const safeDailyBudget = 180;
  const activityDose = Math.round(conc * durationHours * ventilationRate);
  const percent = Math.min(250, Math.round((activityDose / safeDailyBudget) * 100));

  let status = 'SAFE';
  let color = '#2D5A27'; // Botanical Moss
  let descriptor = 'Within safe daily threshold';

  if (percent > 100) {
    status = 'EXCEEDED';
    color = '#C84B31'; // Fired Terracotta Clay
    descriptor = 'Exceeds recommended safe daily inhalation allowance';
  } else if (percent > 50) {
    status = 'ELEVATED';
    color = '#D97706'; // Warm Ochre
    descriptor = 'Consumes majority of daily allowance';
  }

  return {
    percent,
    activityDose,
    safeDailyBudget,
    status,
    color,
    descriptor
  };
}
