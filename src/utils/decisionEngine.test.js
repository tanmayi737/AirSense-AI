import { describe, it, expect } from 'vitest';
import {
  calculateCpcbAqi,
  findBestOutdoorWindow,
  generateHouseholdDecisions,
  calculateSustainableOffset
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
});

describe('Quantified Sustainable Offset Calculator', () => {
  it('accurately computes CO2 and PM2.5 saved for 15 km metro commute', () => {
    const offset = calculateSustainableOffset(15, 'metro');

    expect(Number(offset.savedCo2Kg)).toBeGreaterThan(1.0);
    expect(Number(offset.savedPm25Grams)).toBeGreaterThan(0.5);
    expect(offset.fuelCostSavedInr).toBeGreaterThan(50);
  });
});
