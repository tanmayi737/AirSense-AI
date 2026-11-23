import { GoogleGenAI, Type } from '@google/genai';

/**
 * AeroSense AI — Vercel Serverless Function Proxy for Gemini API
 * Securely communicates with Gemini 2.5 Flash without exposing keys to frontend.
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed. Only POST requests are supported.'
    });
  }

  const {
    question,
    city = 'Hyderabad',
    cpcbAqi = 100,
    usAqi = 100,
    category = 'Moderate',
    dominantPollutant = 'PM2.5',
    pm25 = 35,
    pm10 = 50,
    bestWindow = '11:00 AM – 1:00 PM',
    selectedProfiles = ['School Child', 'Elderly / Asthma'],
    selectedActivity = 'Morning School Run',
    isSimulated = false
  } = req.body || {};

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'A user question string is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({
      fallback: true,
      error: 'GEMINI_API_KEY is not configured on server. Falling back to local deterministic rule engine.'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are AeroSense AI, an authoritative Urban Air Quality Decision Assistant for Indian cities.
You synthesize live sensor telemetry, Central Pollution Control Board (CPCB) standards, and WHO health guidelines into actionable household decisions.

Strict Operational Guidelines:
1. Grounding: Never fabricate, alter, or hallucinate the telemetry. Use the exact values provided (City: ${city}, Indian CPCB AQI: ${cpcbAqi}, US AQI: ${usAqi}, Category: ${category}, Dominant Pollutant: ${dominantPollutant}, PM2.5: ${pm25} µg/m³, PM10: ${pm10} µg/m³, Cleanest Window: ${bestWindow}).
2. Simulation Mode: ${isSimulated ? 'NOTE: The user is evaluating an active SIMULATED WINTER SMOG event (Severe temperature inversion). Explicitly mention this synthetic test condition in your response.' : 'This is live real-time ambient telemetry.'}
3. Medical Ethics: Do NOT provide formal medical diagnoses or prescriptions. Provide preventive environmental health guidance.
4. Indian Urban Context: Provide practical advice for Indian urban households (e.g. wet mopping vs dry brooming, kitchen exhaust during tadka/frying, sealing doors during morning thermal inversion 8-11 AM, N95 masks, metro/carpool shifts).
5. Output: Return structured JSON matching the provided schema.`;

    const userPrompt = `Household Context:
- Target City: ${city}
- Active Profiles: ${Array.isArray(selectedProfiles) ? selectedProfiles.join(', ') : selectedProfiles}
- Planned Activity: ${selectedActivity}
- Telemetry: Indian CPCB AQI ${cpcbAqi} (${category}), Dominant: ${dominantPollutant}, PM2.5: ${pm25} µg/m³, PM10: ${pm10} µg/m³
- Cleanest 2-Hour Outdoor Window Today: ${bestWindow}
${isSimulated ? '- Simulation Flag: ACTIVE WINTER SMOG SIMULATION' : ''}

User's Question:
"${question}"

Provide a structured, authoritative decision card.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            verdictBadge: {
              type: Type.STRING,
              description: 'MUST be exactly one of: "SAFE TO PROCEED", "PROCEED WITH CAUTION", or "AVOID / INDOORS ONLY"'
            },
            directAnswer: {
              type: Type.STRING,
              description: 'Concise 2-sentence answer directly resolving the user question for their household.'
            },
            whyItMatters: {
              type: Type.STRING,
              description: '1 to 2 sentences linking the recommendation directly to active PM2.5/PM10 and dominant pollutant concentrations.'
            },
            saferAlternative: {
              type: Type.STRING,
              description: 'Concrete safer time window (referencing the cleanest window) or low-emission swap.'
            },
            indoorAction: {
              type: Type.STRING,
              description: 'Specific practical home air-protection step (e.g. wet mopping, kitchen chimney, HEPA room).'
            }
          },
          required: [
            'verdictBadge',
            'directAnswer',
            'whyItMatters',
            'saferAlternative',
            'indoorAction'
          ],
          propertyOrdering: [
            'verdictBadge',
            'directAnswer',
            'whyItMatters',
            'saferAlternative',
            'indoorAction'
          ]
        }
      }
    });

    const text = response.text;
    const parsed = JSON.parse(text);

    return res.status(200).json({
      fallback: false,
      data: parsed
    });
  } catch (err) {
    console.error('Gemini API Error in Serverless Function:', err);
    return res.status(503).json({
      fallback: true,
      error: err.message || 'Gemini API call failed or quota reached. Triggering local engine fallback.'
    });
  }
}
