require('dotenv').config();
const { processIncident } = require('./agents/intakeAgent');
const { assessSeverity } = require('./agents/severityAgent');
const { findResources } = require('./agents/resourceAgent');
const { dispatchResources } = require('./agents/dispatchAgent');
const { getActiveProvider } = require('./llm');

async function runTestCase(name, reportText, lat, long) {
  console.log(`\n======================================================`);
  console.log(`RUNNING TEST: ${name}`);
  console.log(`Report: "${reportText}"`);
  console.log(`Location: (${lat}, ${long})`);
  console.log(`======================================================`);

  // Step 1: Intake Agent
  console.log(`\n--- [1] Intake Agent ---`);
  const intake = await processIncident(reportText, lat, long);
  console.log(`Incident Type: ${intake.incidentType}`);
  console.log(`People Affected Estimate: ${intake.peopleAffectedEstimate}`);
  console.log(`Location: ${intake.location}`);
  console.log(`Reported Hazards: ${JSON.stringify(intake.reportedHazards)}`);
  console.log(`LLM Status: ${JSON.stringify(intake.llmStatus)}`);

  // Step 2: Severity Agent
  console.log(`\n--- [2] Severity Agent ---`);
  const severity = await assessSeverity({ ...intake, reportText });
  console.log(`Severity: ${severity.severity} (Score: ${severity.severityScore})`);
  console.log(`Urgency: ${severity.urgencyCategory}, Confidence: ${severity.confidence}`);
  console.log(`Signals Detected: ${JSON.stringify(severity.signals)}`);
  console.log(`Reason: ${severity.reason}`);
  console.log(`Source: ${severity.source}`);

  // Step 3: Resource Matching Agent
  console.log(`\n--- [3] Resource Matching Agent ---`);
  const resources = await findResources(
    { lat: intake.lat, long: intake.long },
    intake.incidentType,
    severity.severityScore,
    intake
  );
  console.log(`Allocated Resources (${resources.length}):`);
  resources.forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.type}] ${r.name} (${r.distanceKm} km) - Status: ${r.status}`);
  });

  // Step 4: Dispatch Agent
  console.log(`\n--- [4] Dispatch Agent ---`);
  const dispatch = await dispatchResources(intake, severity, resources);
  console.log(`Estimated Response Time: ${dispatch.estimatedResponseTime}`);
  console.log(`Alert Message: "${dispatch.alertMessage}"`);
  console.log(`Action Plan (${dispatch.actionPlan.length} steps):`);
  dispatch.actionPlan.forEach((step, idx) => {
    console.log(`  ${idx + 1}. ${step}`);
  });

  return { intake, severity, resources, dispatch };
}

async function runAllTests() {
  console.log(`Starting Disaster Response Pipeline Verification...`);
  console.log(`Active Provider: ${getActiveProvider()}`);
  console.log(`GROQ_MODEL: ${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'}`);
  console.log(`GROQ_API_KEY Configured: ${Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key')}`);

  let allPassed = true;

  // TEST 1: Structural Collapse
  try {
    const t1 = await runTestCase(
      'Test 1 — Structural Collapse',
      'Building collapsed near MG Road after heavy rain, at least 6 people trapped, one visibly injured',
      21.1458,
      79.0882
    );

    const hasCollapse = /structural|collapse/i.test(t1.intake.incidentType) || t1.intake.reportedHazards.includes('structural_collapse');
    const hasTrapped = t1.severity.signals.includes('people_trapped') || t1.intake.reportedHazards.includes('trapped_people');
    const hasInjury = t1.severity.signals.includes('injury_reported') || t1.intake.reportedHazards.includes('injury');
    const isCritical = t1.severity.severity === 'CRITICAL';
    const hasRescueResource = t1.resources.some((r) => r.type === 'rescue_team');
    const hasMedicalResource = t1.resources.some((r) => r.type === 'hospital');

    console.log(`\n--- Test 1 Assertions ---`);
    console.log(`- Structural collapse detected: ${hasCollapse ? 'PASS' : 'FAIL'}`);
    console.log(`- People affected estimate (~6): ${t1.intake.peopleAffectedEstimate === 6 ? 'PASS' : 'NOTE: Got ' + t1.intake.peopleAffectedEstimate}`);
    console.log(`- Trapped people detected: ${hasTrapped ? 'PASS' : 'FAIL'}`);
    console.log(`- Injury detected: ${hasInjury ? 'PASS' : 'FAIL'}`);
    console.log(`- Severity is CRITICAL: ${isCritical ? 'PASS' : 'FAIL'}`);
    console.log(`- Rescue team prioritized: ${hasRescueResource ? 'PASS' : 'FAIL'}`);
    console.log(`- Medical response prioritized: ${hasMedicalResource ? 'PASS' : 'FAIL'}`);

    if (!hasCollapse || !isCritical || !hasRescueResource) allPassed = false;
  } catch (err) {
    console.error('Test 1 failed with unexpected error:', err);
    allPassed = false;
  }

  // TEST 2: Flood
  try {
    const t2 = await runTestCase(
      'Test 2 — Flood',
      'Heavy flooding has affected several houses and families need evacuation.',
      21.135,
      79.075
    );

    const isFlood = /flood/i.test(t2.intake.incidentType) || t2.severity.signals.includes('flood');
    const hasEvacuation = t2.severity.signals.includes('evacuation') || /evacuat/i.test(t2.intake.keyDetails);
    const isHighOrCritical = ['HIGH', 'CRITICAL'].includes(t2.severity.severity);
    const hasShelterOrRescue = t2.resources.some((r) => r.type === 'shelter' || r.type === 'rescue_team');

    console.log(`\n--- Test 2 Assertions ---`);
    console.log(`- Flood detected: ${isFlood ? 'PASS' : 'FAIL'}`);
    console.log(`- Evacuation signal detected: ${hasEvacuation ? 'PASS' : 'FAIL'}`);
    console.log(`- High or Critical severity: ${isHighOrCritical ? 'PASS (' + t2.severity.severity + ')' : 'FAIL'}`);
    console.log(`- Evacuation / Shelter resources allocated: ${hasShelterOrRescue ? 'PASS' : 'FAIL'}`);

    if (!isFlood || !isHighOrCritical || !hasShelterOrRescue) allPassed = false;
  } catch (err) {
    console.error('Test 2 failed with unexpected error:', err);
    allPassed = false;
  }

  // TEST 3: Fire
  try {
    const t3 = await runTestCase(
      'Test 3 — Fire',
      'Warehouse fire reported with thick smoke, no injuries confirmed.',
      21.155,
      79.095
    );

    const isFire = /fire/i.test(t3.intake.incidentType) || t3.severity.signals.includes('fire');
    const noFalseInjuries = !t3.severity.signals.includes('injury_reported');
    const hasFireRescue = t3.resources.some((r) => /fire/i.test(r.name) || r.type === 'rescue_team');

    console.log(`\n--- Test 3 Assertions ---`);
    console.log(`- Fire detected: ${isFire ? 'PASS' : 'FAIL'}`);
    console.log(`- Negation honored (no false injuries): ${noFalseInjuries ? 'PASS' : 'FAIL'}`);
    console.log(`- Fire / Rescue resources prioritized: ${hasFireRescue ? 'PASS' : 'FAIL'}`);
    console.log(`- Severity assessed: ${t3.severity.severity}`);

    if (!isFire || !hasFireRescue) allPassed = false;
  } catch (err) {
    console.error('Test 3 failed with unexpected error:', err);
    allPassed = false;
  }

  // TEST 4: Minor Incident
  try {
    const t4 = await runTestCase(
      'Test 4 — Minor Incident',
      'Minor road accident, no injuries reported.',
      21.12,
      79.06
    );

    const isMinorSeverity = ['LOW', 'MEDIUM'].includes(t4.severity.severity);
    const noFalseEntrapment = !t4.severity.signals.includes('people_trapped');
    const noFalseInjuries = !t4.severity.signals.includes('injury_reported');

    console.log(`\n--- Test 4 Assertions ---`);
    console.log(`- Low/Medium severity (no unnecessary escalation): ${isMinorSeverity ? 'PASS (' + t4.severity.severity + ')' : 'FAIL'}`);
    console.log(`- Negation honored (no false entrapment): ${noFalseEntrapment ? 'PASS' : 'FAIL'}`);
    console.log(`- Negation honored (no false injuries): ${noFalseInjuries ? 'PASS' : 'FAIL'}`);

    if (!isMinorSeverity) allPassed = false;
  } catch (err) {
    console.error('Test 4 failed with unexpected error:', err);
    allPassed = false;
  }

  console.log(`\n======================================================`);
  console.log(`ALL TESTS RESULT: ${allPassed ? 'ALL PASSED SUCCESSFULLY' : 'SOME TESTS FAILED'}`);
  console.log(`======================================================`);
}

runAllTests().catch(console.error);
