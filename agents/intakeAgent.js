// intakeAgent.js
// Parses a raw incident report into structured data using Groq (primary) or deterministic fallback.
const { generateStructuredJson } = require('../llm');

const SYSTEM_PROMPT = `You are an expert emergency dispatch intake agent.
Your task is to analyze disaster reports and extract structured emergency incident data.

Return ONLY a valid JSON object matching this exact schema:
{
  "incidentType": "structural_collapse" | "flood" | "fire" | "medical" | "road_accident" | "other",
  "peopleAffectedEstimate": <number>,
  "location": "<extracted location or street/area name, or 'Unknown'>",
  "keyDetails": "<concise summary of critical facts>",
  "reportedHazards": ["<array of specific hazards detected, e.g. structural_collapse, heavy_rain, trapped_people, injury, toxic_smoke>"]
}
`;

const FALLBACK_DEFAULT = {
  incidentType: 'other',
  peopleAffectedEstimate: 0,
  location: 'Unknown',
  keyDetails: '',
  reportedHazards: [],
};

/**
 * Deterministic fallback extractor using regex patterns if the LLM is unavailable.
 * @param {string} text
 * @returns {object}
 */
function deterministicIntakeFallback(text) {
  const t = String(text || '').trim();
  const lower = t.toLowerCase();

  // 1. Detect incident type
  let incidentType = 'other';
  if (/collaps|building\s+fell|rubble|structural\s+failure/i.test(t)) {
    incidentType = 'structural_collapse';
  } else if (/flood|flooding|waterlogg|water\s+rising|inundat|heavy\s+rain/i.test(t)) {
    incidentType = 'flood';
  } else if (/fire|blaze|flames|burning|smoke/i.test(t)) {
    incidentType = 'fire';
  } else if (/accident|collision|crash|vehicle/i.test(t)) {
    incidentType = 'road_accident';
  } else if (/cardiac|stroke|seizure|medical\s+emergency|unconscious/i.test(t)) {
    incidentType = 'medical';
  }

  // 2. Detect people affected estimate
  let peopleAffectedEstimate = 0;
  const numMatch = t.match(/(\d+)\s+(?:people|persons|victims|residents|families|individuals|trapped|injured|houses|homes)/i);
  if (numMatch) {
    peopleAffectedEstimate = parseInt(numMatch[1], 10);
  } else {
    const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const wordMatch = t.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:people|persons|victims|residents|families|individuals|trapped|injured)/i);
    if (wordMatch) {
      peopleAffectedEstimate = words[wordMatch[1].toLowerCase()] || 0;
    } else if (/\b(several|multiple|dozens|scores)\b/i.test(t)) {
      peopleAffectedEstimate = 5;
    }
  }

  // 3. Detect location (e.g. "near MG Road", "at Central Market", "on Highway 7")
  let location = 'Unknown';
  const locMatch = t.match(/\b(?:near|at|on|in|around)\s+([A-Z0-9][a-zA-Z0-9\s]{2,25}?)(?:,|\.|\s+after|\s+with|\s+and|\s+where|$)/);
  if (locMatch) {
    location = locMatch[1].trim();
  }

  // 4. Detect reported hazards
  const reportedHazards = [];
  if (/collaps|rubble/i.test(t)) reportedHazards.push('structural_collapse');
  if (/heavy\s+rain|downpour|storm/i.test(t)) reportedHazards.push('heavy_rain');
  if (/\b(trapped|stranded|buried|stuck)\b/i.test(t) && !/\b(no\s+one\s+trapped|nobody\s+trapped|not\s+trapped)\b/i.test(t)) {
    reportedHazards.push('trapped_people');
  }
  if (/\b(injur\w*|wound\w*|hurt|bleeding)\b/i.test(t) && !/\b(no\s+injur\w*|nobody\s+hurt|no\s+casualties)\b/i.test(t)) {
    reportedHazards.push('injury');
  }
  if (/flood|waterlogg|overflow/i.test(t)) reportedHazards.push('flooding');
  if (/fire|blaze|flames/i.test(t)) reportedHazards.push('fire');
  if (/smoke/i.test(t)) reportedHazards.push('smoke');
  if (/gas\s+leak|chemical/i.test(t)) reportedHazards.push('toxic_leak');

  return {
    incidentType,
    peopleAffectedEstimate,
    location,
    keyDetails: t,
    reportedHazards,
  };
}

/**
 * Parse a raw incident report into a structured incident object.
 *
 * @param {string} reportText - Raw incident report text.
 * @param {number} [lat] - Report latitude.
 * @param {number} [long] - Report longitude.
 * @returns {Promise<object>} Structured incident:
 *   { incidentType, peopleAffectedEstimate, location, keyDetails, reportedHazards, lat, long, llmStatus }
 */
async function processIncident(reportText, lat, long) {
  const inputPayload = JSON.stringify({
    reportText,
    latitude: lat ?? null,
    longitude: long ?? null,
  });

  try {
    const parsed = await generateStructuredJson(SYSTEM_PROMPT, inputPayload, {
      agent: 'Intake',
    });

    const incidentType = String(parsed.incidentType || 'other').toLowerCase();
    const peopleAffectedEstimate =
      typeof parsed.peopleAffectedEstimate === 'number'
        ? parsed.peopleAffectedEstimate
        : parseInt(parsed.peopleAffectedEstimate, 10) || 0;

    const reportedHazards = Array.isArray(parsed.reportedHazards)
      ? parsed.reportedHazards.map((h) => String(h).trim().toLowerCase())
      : [];

    return {
      incidentType,
      peopleAffectedEstimate,
      location: parsed.location || 'Unknown',
      keyDetails: parsed.keyDetails || String(reportText ?? ''),
      reportedHazards,
      lat: lat ?? null,
      long: long ?? null,
      llmStatus: { provider: 'groq', available: true },
    };
  } catch (err) {
    console.error(`[intakeAgent] LLM failed, using deterministic fallback: ${err.message}`);
    const fallback = deterministicIntakeFallback(reportText);
    return {
      ...FALLBACK_DEFAULT,
      ...fallback,
      lat: lat ?? null,
      long: long ?? null,
      llmStatus: {
        provider: 'fallback',
        available: false,
        reason: err.isRateLimit ? 'rate_limit' : (err.status === 401 ? 'unconfigured' : 'llm_error'),
      },
    };
  }
}

module.exports = {
  processIncident,
  deterministicIntakeFallback,
};