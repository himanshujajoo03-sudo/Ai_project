// dispatchAgent.js
// Produces an incident-specific coordinated action plan, alert message,
// and response-time estimate using Groq (primary) or context-aware deterministic fallback.
const { generateStructuredJson } = require('../llm');

const SYSTEM_PROMPT = `You are an expert incident dispatch commander.
Generate an incident-specific, operational emergency response action plan based on the incident type, severity level, detected hazards, casualties/affected count, assigned resources, and location.

Do NOT return generic placeholder responses like "Incident reported. Rescue team has been alerted."
Instead, provide concrete operational steps addressing search/rescue, medical triage, perimeter safety, resource coordination, and situational hazards.

Return ONLY a valid JSON object matching this schema:
{
  "actionPlan": [
    "<Step 1: Immediate life safety or dispatch action>",
    "<Step 2: Medical/triage or evacuation action>",
    "<Step 3: Perimeter control or hazard mitigation>",
    "<Step 4: Resource staging or hospital notification>",
    "<Step 5: Secondary hazard monitoring or progress reporting>"
  ],
  "alertMessage": "<Concise emergency broadcast message under 200 characters>",
  "estimatedResponseTime": "<e.g. 5-10 minutes, 10-15 minutes>"
}
`;

/**
 * Context-aware deterministic fallback generator when LLM is unavailable.
 * @param {object} intake
 * @param {object} severity
 * @param {object[]} resources
 * @returns {object}
 */
function buildFallbackDispatchPlan(intake, severity, resources) {
  const type = String(intake?.incidentType || '').toLowerCase();
  const loc = intake?.location || 'reported location';
  const resourceNames = (resources || []).map((r) => r.name).join(', ') || 'Emergency units';
  const sev = String(severity?.severity || 'HIGH');

  let actionPlan = [];
  let alertMessage = '';
  let estimatedResponseTime = '10-20 minutes';

  if (type.includes('structural') || type.includes('collapse')) {
    actionPlan = [
      `Immediately deploy primary rescue teams (${resourceNames}) to ${loc}.`,
      'Establish a strict 100-meter safety perimeter to protect against secondary collapse.',
      'Deploy acoustic/optical search and rescue equipment to locate trapped individuals.',
      'Notify nearby trauma hospitals to prepare for incoming blast/crush injury patients.',
      'Isolate local utilities (gas, electrical mains) to eliminate fire and explosion hazards.',
    ];
    alertMessage = `CRITICAL: Structural collapse at ${loc}. Search & rescue units deployed. Avoid area and keep access roads clear.`;
    estimatedResponseTime = '8-12 minutes';
  } else if (type.includes('flood')) {
    actionPlan = [
      `Deploy water rescue teams and transport resources (${resourceNames}) to ${loc}.`,
      'Initiate evacuation of residents from low-lying structures to designated shelters.',
      'Establish boat staging points and secure upstream flood monitoring markers.',
      'Coordinate with receiving shelters for dry supplies, food, and clean water.',
      'Monitor electrical infrastructure and de-energize submerged transformers.',
    ];
    alertMessage = `FLOOD ALERT: Evacuations underway near ${loc}. Follow emergency personnel to nearest open shelters.`;
    estimatedResponseTime = '12-18 minutes';
  } else if (type.includes('fire')) {
    actionPlan = [
      `Deploy fire suppression units (${resourceNames}) to ${loc}.`,
      'Evacuate immediately downwind structures due to smoke inhalation hazards.',
      'Establish primary water supply lines and continuous fire containment perimeter.',
      'Triage potential smoke inhalation victims and dispatch ambulances as needed.',
      'Conduct secondary sweeps of affected buildings once thermal hotspots are cooled.',
    ];
    alertMessage = `FIRE ALERT: Emergency crews battling fire at ${loc}. Stay indoors and seal windows if in downwind smoke path.`;
    estimatedResponseTime = '6-10 minutes';
  } else if (type.includes('accident') || type.includes('minor') || sev === 'LOW') {
    actionPlan = [
      `Dispatch nearest patrol/response unit to ${loc} for scene assessment.`,
      'Clear debris or disabled vehicles to restore normal traffic flow.',
      'Verify whether any parties require medical evaluation or transport.',
      'File incident report and conclude response once area is secure.',
    ];
    alertMessage = `TRAFFIC NOTICE: Minor incident reported near ${loc}. Expect minor delays while crews clear scene.`;
    estimatedResponseTime = '15-25 minutes';
  } else {
    actionPlan = [
      `Dispatch nearest assigned emergency resources (${resourceNames}) to ${loc}.`,
      'Assess on-scene severity and establish direct communication with command dispatch.',
      'Provide immediate on-site aid to any affected individuals.',
      'Coordinate secondary transport or shelter assistance as conditions warrant.',
    ];
    alertMessage = `INCIDENT ALERT: Emergency response teams responding to incident at ${loc}. Proceed with caution.`;
    estimatedResponseTime = '10-15 minutes';
  }

  return {
    actionPlan,
    alertMessage: alertMessage.slice(0, 200),
    estimatedResponseTime,
    llmStatus: { provider: 'fallback', available: false },
  };
}

/**
 * Build a dispatch plan from the combined intake, severity, and resource data.
 *
 * @param {object} intake - Structured incident from intakeAgent.
 * @param {object} severity - Severity assessment from severityAgent.
 * @param {object[]} resources - Ranked resources from resourceAgent.
 * @returns {Promise<object>} Dispatch result:
 *   { actionPlan, alertMessage, estimatedResponseTime, llmStatus }
 */
async function dispatchResources(intake, severity, resources) {
  const userPayload = JSON.stringify({
    incidentType: intake?.incidentType,
    location: intake?.location,
    peopleAffectedEstimate: intake?.peopleAffectedEstimate,
    reportedHazards: intake?.reportedHazards,
    keyDetails: intake?.keyDetails,
    severity: severity?.severity,
    severityScore: severity?.severityScore,
    urgencyCategory: severity?.urgencyCategory,
    signals: severity?.signals,
    selectedResources: (resources || []).map((r) => ({
      name: r.name,
      type: r.type,
      distanceKm: r.distanceKm,
    })),
  });

  try {
    const parsed = await generateStructuredJson(SYSTEM_PROMPT, userPayload, {
      agent: 'Dispatch',
    });

    const fallbackPlan = buildFallbackDispatchPlan(intake, severity, resources);

    const actionPlan = Array.isArray(parsed.actionPlan) && parsed.actionPlan.length >= 3
      ? parsed.actionPlan
      : fallbackPlan.actionPlan;

    const alertMessage = typeof parsed.alertMessage === 'string' && parsed.alertMessage.trim().length > 0
      ? parsed.alertMessage.trim().slice(0, 200)
      : fallbackPlan.alertMessage;

    const estimatedResponseTime = typeof parsed.estimatedResponseTime === 'string' && parsed.estimatedResponseTime.trim().length > 0
      ? parsed.estimatedResponseTime.trim()
      : fallbackPlan.estimatedResponseTime;

    return {
      actionPlan,
      alertMessage,
      estimatedResponseTime,
      llmStatus: { provider: 'groq', available: true },
    };
  } catch (err) {
    console.error(`[dispatchAgent] LLM failed (${err.status || err.message}). Using context-aware fallback.`);
    return buildFallbackDispatchPlan(intake, severity, resources);
  }
}

module.exports = {
  dispatchResources,
  buildFallbackDispatchPlan,
};