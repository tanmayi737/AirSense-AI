import { describe, it, expect } from 'vitest';
import {
  calculateCpcbAqi,
  findBestOutdoorWindow,
  generateHouseholdDecisions,
  calculateSustainableOffset,
  calculateExposureBudget,
  getFamilyBriefing,
  COMMUTE_MULTIPLIERS,
  getCommuteMultiplier
} from './decisionEngine.js';

describe('Indian CPCB AQI Engine (Sub-indices & Breakpoints)', () => {
  it('calculates Good AQI for clean air (~30 µg/m³ PM2.5)', () => {
    // PM2.5 = 25 (0-30 -> 0-50 Good), PM10 = 35 (0-50 -> 0-50 Good)
    const result = calculateCpcbAqi(25, 35);
    expect(result.cpcbAqi).toBeLessThanOrEqual(50);
    expect(result.category).toBe('Good');
    expect(result.badgeClass).toBe('badge-good');
  });

  it('calculates Moderate AQI across ~80 µg/m³ PM2.5 breakpoint', () => {
    // PM2.5 = 80 (61-90 -> 101-200 Moderate)
    const result = calculateCpcbAqi(80, 120);
    expect(result.cpcbAqi).toBeGreaterThanOrEqual(101);
    expect(result.cpcbAqi).toBeLessThanOrEqual(200);
    expect(result.category).toBe('Moderate');
    expect(result.badgeClass).toBe('badge-moderate');
  });

  it('calculates Very Poor AQI across ~130 µg/m³ PM2.5 breakpoint', () => {
    // PM2.5 = 130 (121-250 -> 301-400 Very Poor)
    const result = calculateCpcbAqi(130, 200);
    expect(result.cpcbAqi).toBeGreaterThanOrEqual(301);
    expect(result.cpcbAqi).toBeLessThanOrEqual(400);
    expect(result.category).toBe('Very Poor');
    expect(result.badgeClass).toBe('badge-very-poor');
  });

  it('calculates Very Poor high-range AQI across ~220 µg/m³ PM2.5 breakpoint', () => {
    // PM2.5 = 220 (121-250 -> 301-400 Very Poor)
    const result = calculateCpcbAqi(220, 310);
    expect(result.cpcbAqi).toBeGreaterThanOrEqual(350);
    expect(result.cpcbAqi).toBeLessThanOrEqual(400);
    expect(result.category).toBe('Very Poor');
  });

  it('calculates Severe AQI across ~350 µg/m³ PM2.5 breakpoint', () => {
    // PM2.5 = 350 (251+ -> 401-500 Severe)
    const result = calculateCpcbAqi(350, 450);
    expect(result.cpcbAqi).toBeGreaterThanOrEqual(401);
    expect(result.cpcbAqi).toBeLessThanOrEqual(500);
    expect(result.category).toBe('Severe');
    expect(result.badgeClass).toBe('badge-severe');
  });

  it('correctly identifies dominant pollutant based on maximum sub-index', () => {
    // Case 1: PM2.5 sub-index is higher
    const pm25Dom = calculateCpcbAqi(85, 40);
    expect(pm25Dom.dominantPollutant).toBe('PM2.5');

    // Case 2: PM10 sub-index is higher
    // PM2.5 = 15 (sub = 25), PM10 = 240 (101-250 -> 101-200, sub ~193)
    const pm10Dom = calculateCpcbAqi(15, 240);
    expect(pm10Dom.dominantPollutant).toBe('PM10');
  });
});

describe('24h Clean-Window Finder (findBestOutdoorWindow)', () => {
  it('identifies the cleanest 2-hour window in hourly PM2.5 forecast', () => {
    const mockHourly = {
      time: Array.from({ length: 24 }, (_, i) => `2026-11-23T${String(i).padStart(2, '0')}:00`),
      // Hourly PM2.5 levels with a clear dip at hours 12 and 13 (values 14 and 16)
      pm2_5: [
        80, 85, 90, 95, 100, 90, 75, 60, 45, 30, 22, 20,
        14, 16, 25, 35, 55, 75, 95, 110, 115, 105, 95, 85
      ]
    };

    const currentPm25 = 90;
    const result = findBestOutdoorWindow(mockHourly, currentPm25);

    expect(result.hasData).toBe(true);
    expect(result.bestStartIndex).toBe(12);
    // Average of 14 and 16 is 15.0
    expect(result.avgPm25).toBe(15.0);
    // Cleaner percentage: ((90 - 15) / 90) * 100 = 83%
    expect(result.cleanerPercent).toBe(83);
    expect(result.hourlyPoints.length).toBe(24);
    expect(result.hourlyPoints[12].isBestWindow).toBe(true);
    expect(result.hourlyPoints[13].isBestWindow).toBe(true);
  });

  it('handles empty or malformed hourly data gracefully', () => {
    const emptyResult = findBestOutdoorWindow(null);
    expect(emptyResult.hasData).toBe(false);
    expect(emptyResult.hourlyPoints).toEqual([]);
  });
});

describe('Household Decision Engine (generateHouseholdDecisions)', () => {
  it('returns strict AVOID verdicts for vulnerable profiles under severe smog', () => {
    const severeAqiData = {
      cpcbAqi: 369,
      usAqi: 360,
      pm2_5: 210,
      pm10: 340,
      dominantPollutant: 'PM2.5'
    };

    const profiles = ['School Child', 'Elderly / Asthma', 'Outdoor Runner'];
    const decisions = generateHouseholdDecisions(
      severeAqiData,
      profiles,
      'Morning School Run',
      { displayWindow: '12:00 PM – 2:00 PM', cleanerPercent: 70 }
    );

    expect(decisions.length).toBe(3);

    const childDecision = decisions.find((d) => d.profile === 'School Child');
    const elderlyDecision = decisions.find((d) => d.profile === 'Elderly / Asthma');
    const runnerDecision = decisions.find((d) => d.profile === 'Outdoor Runner');

    expect(childDecision.status).toBe('AVOID');
    expect(elderlyDecision.status).toBe('AVOID');
    expect(runnerDecision.status).toBe('AVOID');

    // Explanations should cite active PM2.5 readings
    expect(childDecision.why).toContain('210');
    expect(elderlyDecision.why).toContain('210');
  });

  it('returns safe GO verdicts for profiles under good air quality', () => {
    const cleanAqiData = {
      cpcbAqi: 35,
      usAqi: 30,
      pm2_5: 14,
      pm10: 25,
      dominantPollutant: 'PM2.5'
    };

    const profiles = ['School Child', 'Elderly / Asthma', 'Outdoor Runner'];
    const decisions = generateHouseholdDecisions(
      cleanAqiData,
      profiles,
      'Morning School Run',
      { displayWindow: '1:00 PM – 3:00 PM', cleanerPercent: 0 }
    );

    const childDecision = decisions.find((d) => d.profile === 'School Child');
    const elderlyDecision = decisions.find((d) => d.profile === 'Elderly / Asthma');

    expect(childDecision.status).toBe('GO');
    expect(elderlyDecision.status).toBe('GO');
  });

  it('returns MODIFY verdicts for sensitive groups under moderate/poor air', () => {
    const moderateAqiData = {
      cpcbAqi: 155,
      usAqi: 150,
      pm2_5: 65,
      pm10: 95,
      dominantPollutant: 'PM2.5'
    };

    const decisions = generateHouseholdDecisions(
      moderateAqiData,
      ['School Child', 'Elderly / Asthma'],
      'Morning School Run',
      { displayWindow: '1:00 PM – 3:00 PM', cleanerPercent: 40 }
    );

    const childDecision = decisions.find((d) => d.profile === 'School Child');
    const elderlyDecision = decisions.find((d) => d.profile === 'Elderly / Asthma');

    expect(childDecision.status).toBe('MODIFY');
    expect(elderlyDecision.status).toBe('MODIFY');
  });

  it('dynamically flips verdict from AVOID to MODIFY when shortening outing duration', () => {
    const severeAqiData = {
      cpcbAqi: 369,
      usAqi: 360,
      pm2_5: 210,
      pm10: 340,
      dominantPollutant: 'PM2.5'
    };

    // 60-minute trip -> Exceeds budget (AVOID)
    const longDecisions = generateHouseholdDecisions(
      severeAqiData,
      ['School Child'],
      'Morning School Run',
      { displayWindow: '12:00 PM – 2:00 PM', cleanerPercent: 70 },
      60,
      'Bengaluru'
    );
    expect(longDecisions[0].status).toBe('AVOID');
    expect(longDecisions[0].why).toContain('Bengaluru');

    // Shortened 20-minute trip -> Exposure drops under 80% allowance (Flips to MODIFY)
    const shortDecisions = generateHouseholdDecisions(
      severeAqiData,
      ['School Child'],
      'Morning School Run',
      { displayWindow: '12:00 PM – 2:00 PM', cleanerPercent: 70 },
      20,
      'Bengaluru'
    );
    expect(shortDecisions[0].status).toBe('MODIFY');
    expect(shortDecisions[0].action).toContain('20-minute');
  });

  it('dynamically includes city name, current hour, dominant pollutant, and cleanest window hours', () => {
    const pm10DomData = {
      cpcbAqi: 280,
      usAqi: 260,
      pm2_5: 35,
      pm10: 290,
      dominantPollutant: 'PM10'
    };

    const decisions = generateHouseholdDecisions(
      pm10DomData,
      ['School Child', 'Daily Commuter'],
      'School Run',
      { displayWindow: '1:00 PM – 3:00 PM', cleanerPercent: 45 },
      30,
      'Delhi',
      '8:00 AM'
    );

    expect(decisions.length).toBe(2);

    for (const d of decisions) {
      // 1. City name included
      expect(d.cityName).toBe('Delhi');
      expect(d.action + ' ' + d.why).toContain('Delhi');

      // 2. Current hour included
      expect(d.currentHour).toBe('8:00 AM');
      expect(d.action + ' ' + d.why).toContain('8:00 AM');

      // 3. Dominant pollutant (PM10) included
      expect(d.dominantPollutant).toBe('PM10');
      expect(d.why).toContain('PM10');

      // 4. Exact cleanest window hours included
      expect(d.cleanWindowHours).toBe('1:00 PM – 3:00 PM');
      expect(d.saferSwap).toContain('1:00 PM – 3:00 PM');

      // 5. 1-line everyday helper text included
      expect(d.helperText).toBeTruthy();
      expect(d.helperText.length).toBeGreaterThan(10);
    }
  });

  it('verifies complete absence of clinical jargon across decision cards', () => {
    const testAqiData = {
      cpcbAqi: 350,
      usAqi: 340,
      pm2_5: 220,
      pm10: 310,
      dominantPollutant: 'PM2.5'
    };

    const allProfiles = ['School Child', 'Elderly / Asthma', 'Outdoor Runner', 'Daily Commuter'];
    const decisions = generateHouseholdDecisions(
      testAqiData,
      allProfiles,
      'Outdoor Exercise',
      { displayWindow: '11:00 AM – 1:00 PM', cleanerPercent: 50 },
      60,
      'Hyderabad',
      '7:00 AM'
    );

    const forbiddenJargon = [
      'bronchospasm',
      'vascular inflammation',
      'minute ventilation',
      'particle deposition'
    ];

    for (const d of decisions) {
      const fullCardText = `${d.action} ${d.why} ${d.saferSwap} ${d.indoorHack} ${d.helperText}`.toLowerCase();
      for (const jargon of forbiddenJargon) {
        expect(fullCardText).not.toContain(jargon);
      }
    }
  });
});

describe('Quantified Sustainable Offset Calculator', () => {
  it('accurately computes CO2 and PM2.5 saved for 15 km metro commute', () => {
    const offset = calculateSustainableOffset(15, 'metro');

    expect(Number(offset.savedCo2Kg)).toBeGreaterThan(1.0);
    expect(Number(offset.savedPm25Grams)).toBeGreaterThan(0.5);
    expect(offset.fuelCostSavedInr).toBeGreaterThan(50);
  });
});

describe('Daily Safe Breathing Allowance Calculator (calculateExposureBudget)', () => {
  it('computes safe budget consumption under clean air', () => {
    const budget = calculateExposureBudget(15, 'Exercise', 30);
    expect(budget.status).toBe('SAFE');
    expect(budget.percent).toBeLessThanOrEqual(50);
    expect(budget.helperLine).toContain('30-min outdoor trip right now uses');
    expect(budget.helperLine).toContain('safe daily dust allowance');
  });

  it('detects budget overflow under winter smog conditions', () => {
    const budget = calculateExposureBudget(210, 'Exercise', 45);
    expect(budget.status).toBe('EXCEEDED');
    expect(budget.percent).toBeGreaterThan(100);
    expect(budget.helperLine).toBe(`A 45-min outdoor trip right now uses ${budget.percent}% of your safe daily dust allowance.`);
  });
});

describe('10-Second Family Briefing — Secondary Gas Spike Awareness (getFamilyBriefing)', () => {
  it('flags elevated ozone even when CPCB AQI is Good/Satisfactory (PM2.5 is low)', () => {
    // AQI <= 100 (clean dust), but O3 = 145 µg/m³ — well above WHO 100 µg/m³ limit
    const briefing = getFamilyBriefing({
      cpcbAqi: 42,
      cityName: 'Bengaluru',
      dominantPollutant: 'PM2.5',
      isSimulation: false,
      o3: 145,
      no2: 18,
      pm25: 12,
      pm10: 28
    });

    // Must mention ozone / ground-level ozone
    expect(briefing.toLowerCase()).toMatch(/ozone/);

    // Must NOT claim air is completely ideal for marathon training
    expect(briefing.toLowerCase()).not.toContain('marathon training');
    expect(briefing.toLowerCase()).not.toContain('all outdoor school runs');

    // Must mention the threshold crossing in a human-readable way
    expect(briefing).toContain('145');
  });

  it('flags elevated NO2 even when CPCB AQI is Good/Satisfactory (PM2.5 is low)', () => {
    // AQI <= 100 (clean dust), but NO2 = 55 µg/m³ — above WHO 25 µg/m³ limit
    const briefing = getFamilyBriefing({
      cpcbAqi: 38,
      cityName: 'Delhi',
      dominantPollutant: 'PM2.5',
      isSimulation: false,
      o3: 65,
      no2: 55,
      pm25: 10,
      pm10: 22
    });

    // Must mention NO2 / vehicle exhaust
    expect(briefing.toLowerCase()).toMatch(/no₂|no2|nitrogen|exhaust/);

    // Must NOT claim air is completely ideal
    expect(briefing.toLowerCase()).not.toContain('marathon training');
  });

  it('returns clean air verdict when both PM and secondary gases are within WHO limits', () => {
    const briefing = getFamilyBriefing({
      cpcbAqi: 35,
      cityName: 'Hyderabad',
      dominantPollutant: 'PM2.5',
      isSimulation: false,
      o3: 55,
      no2: 18,
      pm25: 11,
      pm10: 25
    });

    // Clean air — should be positive
    expect(briefing.toLowerCase()).toMatch(/clean|safe|well-dispersed/);
  });

  it('returns severe smog verdict in simulation mode regardless of gas values', () => {
    const briefing = getFamilyBriefing({
      cpcbAqi: 42,
      cityName: 'Mumbai',
      dominantPollutant: 'PM2.5',
      isSimulation: true,
      o3: 40,
      no2: 20,
      pm25: 12,
      pm10: 25
    });

    expect(briefing.toLowerCase()).toContain('simulating');
  });
});

describe('Transport & Mask Exposure Multipliers', () => {
  it('exports exact exposure multipliers for all 4 commute modes', () => {
    expect(COMMUTE_MULTIPLIERS['Walking']).toBe(1.0);
    expect(COMMUTE_MULTIPLIERS['Open Auto / Bike']).toBe(1.35);
    expect(COMMUTE_MULTIPLIERS['Metro / AC Car']).toBe(0.45);
    expect(COMMUTE_MULTIPLIERS['N95 Masked']).toBe(0.25);

    expect(getCommuteMultiplier('Walking')).toBe(1.0);
    expect(getCommuteMultiplier('Open Auto / Bike')).toBe(1.35);
    expect(getCommuteMultiplier('Metro / AC Car')).toBe(0.45);
    expect(getCommuteMultiplier('N95 Masked')).toBe(0.25);
  });

  it('accurately scales exposure budget dose and percentage across commute modes', () => {
    const pm25 = 100;
    const duration = 60;
    const activity = 'Commute';

    const walkingBudget = calculateExposureBudget(pm25, activity, duration, 'Walking');
    const autoBudget = calculateExposureBudget(pm25, activity, duration, 'Open Auto / Bike');
    const metroBudget = calculateExposureBudget(pm25, activity, duration, 'Metro / AC Car');
    const maskBudget = calculateExposureBudget(pm25, activity, duration, 'N95 Masked');

    // Walking dose = 100 * 1.0 * 1.0 * 1.0 = 100
    expect(walkingBudget.activityDose).toBe(100);
    expect(walkingBudget.commuteMultiplier).toBe(1.0);

    // Open Auto / Bike dose = 100 * 1.35 = 135
    expect(autoBudget.activityDose).toBe(135);
    expect(autoBudget.commuteMultiplier).toBe(1.35);
    expect(autoBudget.percent).toBeGreaterThan(walkingBudget.percent);

    // Metro / AC Car dose = 100 * 0.45 = 45
    expect(metroBudget.activityDose).toBe(45);
    expect(metroBudget.commuteMultiplier).toBe(0.45);
    expect(metroBudget.percent).toBeLessThan(walkingBudget.percent);

    // N95 Masked dose = 100 * 0.25 = 25
    expect(maskBudget.activityDose).toBe(25);
    expect(maskBudget.commuteMultiplier).toBe(0.25);
    expect(maskBudget.percent).toBeLessThan(metroBudget.percent);
  });

  it('dynamically flips verdict from AVOID to MODIFY when switching to N95 Masked or Metro under severe air', () => {
    const severeAqiData = {
      cpcbAqi: 360,
      usAqi: 350,
      pm2_5: 200,
      pm10: 320,
      dominantPollutant: 'PM2.5'
    };

    // 45-min School Run with Walking: Exceeds 80% (AVOID)
    const walkingDecisions = generateHouseholdDecisions(
      severeAqiData,
      ['School Child'],
      'Morning School Run',
      { displayWindow: '12:00 PM – 2:00 PM', cleanerPercent: 65 },
      45,
      'Delhi',
      '8:00 AM',
      'Walking'
    );
    expect(walkingDecisions[0].status).toBe('AVOID');

    // 45-min School Run with Open Auto / Bike: Even higher exposure (AVOID)
    const autoDecisions = generateHouseholdDecisions(
      severeAqiData,
      ['School Child'],
      'Morning School Run',
      { displayWindow: '12:00 PM – 2:00 PM', cleanerPercent: 65 },
      45,
      'Delhi',
      '8:00 AM',
      'Open Auto / Bike'
    );
    expect(autoDecisions[0].status).toBe('AVOID');

    // 45-min School Run with N95 Masked: Multiplier 0.25x drops exposure below 80% (flips to MODIFY)
    const maskedDecisions = generateHouseholdDecisions(
      severeAqiData,
      ['School Child'],
      'Morning School Run',
      { displayWindow: '12:00 PM – 2:00 PM', cleanerPercent: 65 },
      45,
      'Delhi',
      '8:00 AM',
      'N95 Masked'
    );
    expect(maskedDecisions[0].status).toBe('MODIFY');
    expect(maskedDecisions[0].commuteMode).toBe('N95 Masked');
    expect(maskedDecisions[0].commuteMultiplier).toBe(0.25);

    // 45-min School Run with Metro / AC Car: Multiplier 0.45x drops exposure below 80% (flips to MODIFY)
    const metroDecisions = generateHouseholdDecisions(
      severeAqiData,
      ['School Child'],
      'Morning School Run',
      { displayWindow: '12:00 PM – 2:00 PM', cleanerPercent: 65 },
      45,
      'Delhi',
      '8:00 AM',
      'Metro / AC Car'
    );
    expect(metroDecisions[0].status).toBe('MODIFY');
    expect(metroDecisions[0].commuteMode).toBe('Metro / AC Car');
    expect(metroDecisions[0].commuteMultiplier).toBe(0.45);
  });
});

describe('Ozone & Secondary Gas Spike Awareness in Household Decisions', () => {
  it('flags ozone caution in household decision cards when O3 > 100 µg/m³ even with low PM2.5', () => {
    const cleanDustHighOzone = {
      cpcbAqi: 45,
      usAqi: 40,
      pm2_5: 12,
      pm10: 25,
      dominantPollutant: 'PM2.5',
      ozone: 135,
      nitrogen_dioxide: 18
    };

    const decisions = generateHouseholdDecisions(
      cleanDustHighOzone,
      ['Outdoor Runner', 'Elderly / Asthma', 'School Child'],
      'Outdoor Exercise',
      { displayWindow: '11:00 AM – 1:00 PM', cleanerPercent: 40 },
      45,
      'Hyderabad',
      '2:00 PM'
    );

    const runner = decisions.find(d => d.profile === 'Outdoor Runner');
    const elderly = decisions.find(d => d.profile === 'Elderly / Asthma');
    const child = decisions.find(d => d.profile === 'School Child');

    expect(runner.status).toBe('MODIFY');
    expect(runner.action.toLowerCase()).toContain('ozone');
    expect(runner.why.toLowerCase()).toContain('ozone');

    expect(elderly.status).toBe('MODIFY');
    expect(elderly.action.toLowerCase()).toContain('ozone');

    expect(child.status).toBe('MODIFY');
    expect(child.action.toLowerCase()).toContain('ozone');
  });
});
