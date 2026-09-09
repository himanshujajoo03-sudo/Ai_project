// severityAgent.js
// Assesses incident severity. Primary path: Groq (semantic analysis).
// Fallback path: deterministic, rule-based severity engine working from
// keyword/signal extraction — ensuring the pipeline always returns a valid
// severity result even when LLMs are down, rate-limited, or timing out.
const { generateStructuredJson } = require('../llm');
const { isRateLimitError } = require('../llm/groqProvider');

const SYSTEM_PROMPT =
  'You are an expert emergency triage severity agent. Return ONLY a valid JSON object matching this schema: ' +
  '{"severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "severityScore": 1-5, ' +
  '"urgencyCategory": "critical"|"high"|"moderate"|"low", "confidence": 0-1, "reason": "string", ' +
  '"signals": ["string"]}. ' +
  'Assess severity rigorously by evaluating people affected, hazard type, entrapment, casualties/injuries, and imminent life-threatening danger.';

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const SCORE_BY_SEVERITY = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2 };
const URGENCY_BY_SEVERITY = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'moderate', LOW: 'low' };

/**
 * Signal patterns: [key, positiveRegex, negationRegex|null].
 * A signal counts as present only if the positive pattern matches AND the
 * negation pattern does NOT.
 *
 * @type {Array<[string, RegExp, RegExp|null]>}
 */
const SIGNAL_PATTERNS = [
  ['people_trapped',
    /\b(trapped|stranded|stuck|buried|pinned|under the rubble|unable to (?:escape|exit))\b/i,
    /\b(no\s+(?:one|people|persons|residents|victims)\s+(?:is|are|was|were|has\s+been|have\s+been)?\s*(?:currently\s+)?(?:trapped|stranded|stuck|buried)|nobody\s+(?:is|was|has\s+been)\s+(?:trapped|stranded|stuck|buried)|not\s+trapped|without\s+(?:anyone\s+)?(?:being\s+)?trapped|no\s+(?:trapped|stranded|stuck|buried))\b/i],
  ['injury_reported',
    /\b(injur\w*|wound\w*|bleeding|fracture\w*|broken\s+(?:bone|limb|arm|leg)|hurt|concussion)\b/i,
    /\b(no\s+(?:visibl\w*\s+|serious\s+|major\s+|obvious\s+|apparent\s+|reported\s+)?(?:injur\w*|wound\w*|casualt\w*)|no\s+one\s+(?:is|was|has\s+been)?\s*(?:hurt|injur\w*)|nobody\s+(?:is|was|has\s+been)?\s*(?:hurt|injur\w*)|without\s+(?:any\s+)?(?:injur\w*|hurt)|not\s+(?:hurt|injur\w*))\b/i],
  ['casualties_or_deaths',
    /\b(casualt\w*|fatalit\w*|deaths?|deceased|killed|body\s+recovered|loss\s+of\s+life)\b/i,
    /\b(no\s+(?:casualt\w*|fatalit\w*|deaths|loss\s+of\s+life)|nobody\s+(?:died|was\s+killed|has\s+died)|no\s+one\s+(?:died|was\s+killed|lost))\b/i],
  ['people_affected',
    /\b((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|dozens|hundreds|scores|several|many|multiple)\s+(?:of\s+)?(?:people|persons|victims|residents|families|individuals|houses|homes|buildings|apartments|shops|vehicles))\b/i,
    null],
  ['fire',
    /\b(fire|blaze|burning|smoke|flames)\b/i,
    /\b(fire\s+drill|fire\s+safety\s+(?:session|training|talk)|no\s+fire)\b/i],
  ['flood',
    /\b(flooded|flooding|floods|flood\s+water|flash\s+floods?|inundat\w+|waterlogg\w*|water\s+logg\w*|water\s+(?:is\s+|was\s+)?rising|water\s+entered|deluge|overflowing|heavy\s+rain(?:fall)?)\b/i,
    null],
  ['building_collapse',
    /\b(collapse[ds]?|building\s+fell|structural\s+failure|under\s+the\s+rubble|rubble)\b/i,
    /\b(no\s+collapse|nearly\s+collapsed\s+but|avoided\s+collapse)\b/i],
  ['evacuation',
    /\b(evacuat\w*|displaced|shelter\s+(?:in\s+place|needed)|rescu\w+)\b/i,
    null],
  ['blocked_roads',
    /\b(road(?:way|s)?\s+(?:is|are|was|were)?\s*(?:blocked|closed)|roadblock|debris\s+(?:on|blocking)\s+(?:the\s+)?road|traffic\s+(?:blocked|halted|stopped)|impassable|road\s+blocked)\b/i,
    /\b(no\s+blocked\s+road|not\s+blocked|roads?\s+(?:are|is|were|was)?\s*not\s+(?:blocked|closed)|nothing\s+(?:is\s+)?blocked|no\s+(?:roads?|roadway)\s+(?:blocked|closed))\b/i],
  ['dangerous_conditions',
    /\b(gas\s+leak\w*|live\s+wire\w*|electrocution|hazardous|toxic|chemical\s+spill|contaminat\w*|explosion|landslide|sinkhole|unstable\s+(?:structure|building)|aftershock\w*)\b/i,
    null],
  ['minor_damage_only',
    /\b(minor\s+damage|superficial|cosmetic\s+damage|small\s+branch|tree\s+branch|single\s+window|slight(?:ly)?\s+dama\w*|minor\s+(?:incident|issue|road\s+accident))\b/i,
    null],
];

/**
 * Normalize severity string.
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeSeverity(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (['critical', 'extreme', 'catastrophic', 'severe'].includes(v)) return 'CRITICAL';
  if (['high', 'serious', 'major', 'elevated'].includes(v)) return 'HIGH';
  if (['medium', 'moderate', 'middle'].includes(v)) return 'MEDIUM';
  if (['low', 'minor', 'minimal', 'information', 'info'].includes(v)) return 'LOW';
  return null;
}

/**
 * Extract structured signals from raw report text.
 * @param {string} text
 * @returns {string[]} Signal keys found in the text.
 */
function extractSignals(text) {
  const haystack = String(text ?? '');
  return SIGNAL_PATTERNS
    .filter(([, positive, negation]) =>
      positive.test(haystack) && !(negation && negation.test(haystack)))
    .map(([key]) => key);
}

/**
 * Best-effort count of people/households affected.
 * @param {string} text
 * @returns {number}
 */
function extractPeopleAffected(text) {
  const t = String(text ?? '');
  const subjects = '(?:people|persons|victims|residents|families|individuals|houses|homes|buildings|apartments|shops|vehicles)';
  const digit = t.match(new RegExp(`(\\d+)\\s*${subjects}`, 'i'));
  if (digit) return parseInt(digit[1], 10);
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const word = t.match(new RegExp(`\\b(one|two|three|four|five|six|seven|eight|nine|ten)\\s+${subjects}`, 'i'));
  if (word) return words[word[1].toLowerCase()];
  if (/\b(hundreds|dozens|scores|multiple|many|several)\b/i.test(t)) return 10;
  return 0;
}

/**
 * Deterministic severity rules.
 *
 * CRITICAL: people trapped, casualties/deaths, structural collapse, fire/flood with trapped people.
 * HIGH:     injury without entrapment, flood affecting multiple households, evacuation/rescue activity.
 * MEDIUM:   property damage, localized flooding, fire without casualties/entrapment.
 * LOW:      minor accident, information-only reports, minor damage, no immediate danger.
 *
 * @param {string} text
 * @param {string[]} signals
 * @returns {{ severity: string, reason: string }}
 */
function ruleBasedSeverity(text, signals) {
  const has = (s) => signals.includes(s);
  const peopleAffected = extractPeopleAffected(text);

  // CRITICAL — imminent life-threatening situations
  if (has('people_trapped') || has('casualties_or_deaths') || has('building_collapse')) {
    return {
      severity: 'CRITICAL',
      reason:
        'Rule-based assessment: imminent life-threatening emergency' +
        (has('people_trapped') ? ' (people trapped)' : '') +
        (has('casualties_or_deaths') ? ' (casualties reported)' : '') +
        (has('building_collapse') ? ' (structural collapse)' : '') +
        '. Immediate priority response required.',
    };
  }

  // HIGH — serious but not immediately life-threatening
  if (
    has('injury_reported') ||
    (has('flood') && has('people_affected')) ||
    has('evacuation') ||
    has('dangerous_conditions') ||
    has('blocked_roads')
  ) {
    return {
      severity: 'HIGH',
      reason:
        'Rule-based assessment: serious emergency situation' +
        (has('injury_reported') ? ' (injury reported)' : '') +
        (has('flood') && (has('people_affected') || has('evacuation')) ? ` (flood affecting ~${peopleAffected || 'multiple'} people/households)` : '') +
        (has('evacuation') ? ' (evacuation needed)' : '') +
        (has('dangerous_conditions') ? ' (hazardous conditions present)' : '') +
        (has('blocked_roads') ? ' (road blockage with safety risk)' : '') +
        '. Priority dispatch needed.',
    };
  }

  // MEDIUM — property damage / localized flooding / minor incidents
  if (has('flood') || has('fire') || has('people_affected')) {
    return {
      severity: 'MEDIUM',
      reason:
        'Rule-based assessment: localized emergency with contained impact' +
        (has('flood') ? ' (localized flooding)' : '') +
        (has('fire') ? ' (fire reported without confirmed casualties)' : '') +
        (has('people_affected') ? ` (~${peopleAffected} people affected)` : '') +
        '. Standard response allocated.',
    };
  }

  // LOW — information-only / minor damage / no immediate danger
  return {
    severity: 'LOW',
    reason: 'Rule-based assessment: minor incident or low-impact event. No immediate danger or injuries detected.',
  };
}

/**
 * Build the public severity schema from the rule engine.
 * @param {string} text
 * @returns {object}
 */
function buildFallbackResult(text) {
  const signals = extractSignals(text);
  const { severity, reason } = ruleBasedSeverity(text, signals);
  console.log('[severityAgent] Using deterministic fallback');
  console.log(`[severityAgent] Final severity: ${severity}`);
  return {
    severity,
    severityScore: SCORE_BY_SEVERITY[severity] || 3,
    urgencyCategory: URGENCY_BY_SEVERITY[severity] || 'moderate',
    confidence: 0.65,
    source: 'rule_based_fallback',
    reason,
    reasoning: reason,
    signals,
    llmStatus: { provider: 'fallback', available: false },
  };
}

/**
 * Validate + sanitize an LLM response into the public severity schema.
 * @param {unknown} parsed
 * @returns {object|null}
 */
function sanitizeSeverityResult(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const severity =
    normalizeSeverity(parsed.severity) ||
    normalizeSeverity(parsed.severityLevel) ||
    normalizeSeverity(parsed.urgencyCategory);
  if (!severity) return null;

  let score = Number(parsed.severityScore);
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    score = SCORE_BY_SEVERITY[severity];
  }
  score = Math.round(score);

  let confidence = Number(parsed.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    confidence = 0.88;
  }

  const reason = typeof parsed.reason === 'string'
    ? parsed.reason
    : (typeof parsed.reasoning === 'string' ? parsed.reasoning : `Assessed severity as ${severity}.`);

  const signals = Array.isArray(parsed.signals)
    ? parsed.signals.filter((s) => typeof s === 'string' && s.length > 0)
    : [];

  return {
    severity,
    severityScore: score,
    urgencyCategory: URGENCY_BY_SEVERITY[severity] || 'moderate',
    confidence: Math.round(confidence * 100) / 100,
    source: 'groq',
    reason,
    reasoning: reason,
    signals,
    llmStatus: { provider: 'groq', available: true },
  };
}

/**
 * Assess the severity of an incident.
 *
 * Primary: Groq semantic reasoning.
 * On 429, 503, timeout, network error, or invalid response:
 * DO NOT repeatedly retry -> immediately switch to the deterministic rule-based fallback.
 *
 * @param {object} input - Intake object with reportText.
 * @returns {Promise<object>} Severity assessment object.
 */
async function assessSeverity(input) {
  const reportText = typeof input?.reportText === 'string' ? input.reportText : '';

  try {
    const parsed = await generateStructuredJson(SYSTEM_PROMPT, JSON.stringify(input), {
      agent: 'Severity',
    });
    const sanitized = sanitizeSeverityResult(parsed);
    if (!sanitized) {
      throw new Error('LLM response missing valid severity fields');
    }
    // Also merge any critical regex signals to ensure high recall
    const textSignals = extractSignals(reportText);
    const mergedSignals = Array.from(new Set([...(sanitized.signals || []), ...textSignals]));
    sanitized.signals = mergedSignals;

    console.log(`[severityAgent] Final severity: ${sanitized.severity}`);
    return sanitized;
  } catch (err) {
    console.error(`[severityAgent] LLM failed (${err.status || err.message}). Switching immediately to deterministic fallback.`);
    return buildFallbackResult(reportText);
  }
}

module.exports = {
  assessSeverity,
  extractSignals,
  ruleBasedSeverity,
  buildFallbackResult,
  sanitizeSeverityResult,
};