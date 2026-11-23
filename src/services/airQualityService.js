/**
 * AeroSense AI — Air Quality & Geocoding Service
 * Powered by Open-Meteo APIs (Free, high-resolution global air quality data)
 * Includes in-memory session caching (5-minute TTL) for network efficiency
 */

export const DEFAULT_CITY = {
  id: 1269843,
  name: 'Hyderabad',
  country: 'India',
  admin1: 'Telangana',
  latitude: 17.38405,
  longitude: 78.45636,
  timezone: 'Asia/Kolkata'
};

export const WINTER_SMOG_SIMULATION = {
  isSimulation: true,
  current: {
    time: new Date().toISOString(),
    us_aqi: 360,
    pm2_5: 210.0,
    pm10: 340.0,
    nitrogen_dioxide: 84.5,
    ozone: 41.2
  },
  current_units: {
    time: 'iso8601',
    us_aqi: 'USAQI',
    pm2_5: 'μg/m³',
    pm10: 'μg/m³',
    nitrogen_dioxide: 'μg/m³',
    ozone: 'μg/m³'
  },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => {
      const d = new Date();
      d.setHours(i, 0, 0, 0);
      return d.toISOString();
    }),
    us_aqi: [
      310, 325, 340, 360, 375, 385, 390, 380, 350, 320, 290, 270,
      260, 255, 270, 295, 330, 360, 380, 395, 410, 390, 360, 335
    ],
    pm2_5: [
      180, 190, 200, 210, 225, 230, 235, 220, 205, 185, 160, 150,
      145, 140, 155, 170, 195, 210, 225, 240, 250, 235, 210, 195
    ]
  },
  cityName: 'Hyderabad (Winter Smog Simulation)',
  simulationNote: 'Active high-inversion winter smog event with critical PM2.5 and PM10 accumulation.'
};

// ============================================================
// In-Memory Session Caching (5-Minute TTL)
// Avoids redundant Open-Meteo network roundtrips for repeated searches
// ============================================================
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const geocodingCache = new Map();
const airQualityCache = new Map();

/**
 * Searches cities using Open-Meteo Geocoding API with 5-minute memory caching
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];

  const normalizedKey = query.trim().toLowerCase();

  // Check in-memory cache
  const cached = geocodingCache.get(normalizedKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=8&language=en&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding service error (${response.status}): Unable to search location`);
  }

  const data = await response.json();
  const results = (data.results || []).map((loc) => ({
    id: loc.id,
    name: loc.name,
    country: loc.country || '',
    admin1: loc.admin1 || '',
    latitude: loc.latitude,
    longitude: loc.longitude,
    timezone: loc.timezone || 'auto'
  }));

  // Store in cache
  geocodingCache.set(normalizedKey, {
    data: results,
    timestamp: Date.now()
  });

  return results;
}

/**
 * Fetches Live Air Quality from Open-Meteo Air Quality API with 5-minute memory caching
 * @param {number} latitude
 * @param {number} longitude
 * @param {boolean} bypassCache - force fresh network fetch
 * @returns {Promise<Object>}
 */
export async function fetchLiveAirQuality(latitude, longitude, bypassCache = false) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Valid geographical coordinates (latitude and longitude) are required.');
  }

  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  // Check in-memory cache unless bypass requested (e.g. manual refresh)
  if (!bypassCache) {
    const cached = airQualityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&hourly=us_aqi,pm2_5&forecast_days=1&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Open-Meteo Air Quality API failed with status ${response.status}. Please check your connection or retry.`
    );
  }

  const data = await response.json();

  if (!data.current) {
    throw new Error('Incomplete data received from Open-Meteo Air Quality API.');
  }

  const result = {
    isSimulation: false,
    current: data.current,
    current_units: data.current_units || {
      us_aqi: 'USAQI',
      pm2_5: 'μg/m³',
      pm10: 'μg/m³',
      nitrogen_dioxide: 'μg/m³',
      ozone: 'μg/m³'
    },
    hourly: data.hourly || { time: [], us_aqi: [], pm2_5: [] },
    timezone: data.timezone || 'auto',
    timezone_abbreviation: data.timezone_abbreviation || ''
  };

  // Cache fresh result
  airQualityCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * Clears the in-memory telemetry and search caches
 */
export function clearAirQualityCache() {
  geocodingCache.clear();
  airQualityCache.clear();
}

/**
 * Categorizes US AQI into accessible severity status
 * Categories: Good (0-50), Moderate (51-100), Poor (101-200), Very Poor (201-300), Severe (301+)
 * @param {number} aqi
 */
export function getAqiSeverity(aqi) {
  const value = Math.round(Number(aqi) || 0);

  if (value <= 50) {
    return {
      level: 'Good',
      color: '#10B981', // Emerald green
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      badgeClass: 'badge-good',
      description: 'Air quality is satisfactory with little or no air pollution risk.',
      healthAction: 'Ideal for all outdoor activities and natural ventilation.'
    };
  }

  if (value <= 100) {
    return {
      level: 'Moderate',
      color: '#F59E0B', // Amber
      bgColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      badgeClass: 'badge-moderate',
      description: 'Acceptable quality; sensitive individuals may experience mild irritation.',
      healthAction: 'Unusually sensitive people should consider reducing prolonged heavy exertion.'
    };
  }

  if (value <= 200) {
    return {
      level: 'Poor',
      color: '#F97316', // Orange
      bgColor: 'rgba(249, 115, 22, 0.12)',
      borderColor: 'rgba(249, 115, 22, 0.4)',
      badgeClass: 'badge-poor',
      description: 'Members of sensitive groups may experience health effects; general public may feel discomfort.',
      healthAction: 'Sensitive groups should avoid outdoor exertion; wear N95 if commuting.'
    };
  }

  if (value <= 300) {
    return {
      level: 'Very Poor',
      color: '#EF4444', // Red
      bgColor: 'rgba(239, 68, 68, 0.14)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      badgeClass: 'badge-very-poor',
      description: 'Health alert: The risk of health effects is significantly increased for everyone.',
      healthAction: 'Avoid strenuous outdoor activities; keep windows closed; run HEPA air filtration.'
    };
  }

  return {
    level: 'Severe',
    color: '#991B1B', // Deep crimson / Maroon
    bgColor: 'rgba(153, 27, 27, 0.22)',
    borderColor: 'rgba(239, 68, 68, 0.65)',
    badgeClass: 'badge-severe',
    description: 'Health warning of emergency conditions: The entire urban population is likely to be affected.',
    healthAction: 'Mandatory indoor isolation; run air purifiers on maximum; wear fit-tested N95/N99 outdoors.'
  };
}

/**
 * Formats ISO timestamp to human-friendly local time
 * @param {string} isoString
 */
export function formatObservationTime(isoString) {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return isoString;
  }
}
