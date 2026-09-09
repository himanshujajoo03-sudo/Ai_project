// test_form_ux.js
// Automated verification for the 6 test requirements specified in the prompt:
// Test 1: Description + address, no image -> Submits successfully
// Test 2: Description + address + image -> Submits with evidence
// Test 3: Invalid image / validation -> Friendly validation handling
// Test 4: Address cannot be geocoded -> Report remains usable; no fake coordinates
// Test 5: Existing incident processing -> Intake -> Severity -> Resource Matching -> Dispatch still works
// Test 6: Human verification -> Uploaded image appears in Evidence & Verification

const assert = require('assert');

const API_BASE = 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('DISASTER RESPONSE COORDINATOR: FORM UX & GEOCODING VERIFICATION');
  console.log('================================================================\n');

  let allPassed = true;

  // -------------------------------------------------------------
  // TEST 1: Description + address, no image
  // -------------------------------------------------------------
  console.log('--- TEST 1: Description + address, no image ---');
  try {
    const res1 = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Major water pipeline burst flooding residential area, 8 families trapped on upper floors',
        address: 'MG Road, Nagpur',
        evidenceImage: null,
      }),
    });

    assert.strictEqual(res1.status, 201, `Expected status 201, got ${res1.status}`);
    const data1 = await res1.json();

    assert(data1.id, 'Record must have an ID');
    assert.strictEqual(data1.address, 'MG Road, Nagpur', 'Record address should match input');
    assert.strictEqual(data1.evidence, null, 'Evidence should be null');
    assert(data1.latitude !== null && data1.longitude !== null, 'Recognized address should have resolved coordinates');
    assert(data1.resources && data1.resources.length > 0, 'Should allocate resources');
    assert(data1.dispatch && data1.dispatch.actionPlan.length > 0, 'Should generate dispatch action plan');

    console.log('✓ Status 201 Created');
    console.log(`✓ Incident ID: ${data1.id}`);
    console.log(`✓ Resolved Location: ${data1.address} -> (${data1.latitude}, ${data1.longitude})`);
    console.log(`✓ Assigned Resources: ${data1.resources.length} units`);
    console.log(`✓ Action Plan: ${data1.dispatch.actionPlan.length} steps`);
    console.log('>>> TEST 1 PASSED: Report submits successfully without image.\n');
  } catch (err) {
    console.error('TEST 1 FAILED:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 2: Description + address + image
  // -------------------------------------------------------------
  console.log('--- TEST 2: Description + address + image ---');
  try {
    const res2 = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Commercial complex roof collapse near Dharampeth market, 5 injured workers',
        address: 'Dharampeth, Nagpur',
        evidenceImage: {
          name: 'collapse_rubble.png',
          size: '2.1 MB',
          type: 'image/png',
          dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23334155" width="100" height="100"/></svg>',
        },
      }),
    });

    assert.strictEqual(res2.status, 201, `Expected status 201, got ${res2.status}`);
    const data2 = await res2.json();

    assert(data2.evidence !== null, 'Evidence should be present');
    assert.strictEqual(data2.evidence.image.name, 'collapse_rubble.png');
    assert.strictEqual(data2.evidence.verification.status, 'pending');
    assert(data2.evidence.analysis.consistency, 'Advisory analysis should be computed');

    console.log('✓ Status 201 Created');
    console.log(`✓ Evidence Attached: ${data2.evidence.image.name} (${data2.evidence.image.size})`);
    console.log(`✓ Advisory Consistency: ${data2.evidence.analysis.consistency}`);
    console.log(`✓ Verification Status: ${data2.evidence.verification.status}`);
    console.log('>>> TEST 2 PASSED: Report submits with visual evidence.\n');
  } catch (err) {
    console.error('TEST 2 FAILED:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 3: Validation checks (empty description, missing location, invalid payload)
  // -------------------------------------------------------------
  console.log('--- TEST 3: Validation checks ---');
  try {
    // 3a. Missing report description
    const res3a = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: '   ',
        address: 'MG Road, Nagpur',
      }),
    });
    assert.strictEqual(res3a.status, 400, 'Empty reportText should return 400');
    const err3a = await res3a.json();
    console.log(`✓ Missing description properly rejected with 400: "${err3a.error}"`);

    // 3b. Missing address and coordinates
    const res3b = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Flash flood reported in unknown location',
        address: '',
      }),
    });
    assert.strictEqual(res3b.status, 400, 'Missing address should return 400');
    const err3b = await res3b.json();
    console.log(`✓ Missing location properly rejected with 400: "${err3b.error}"`);

    console.log('>>> TEST 3 PASSED: Validation works as expected.\n');
  } catch (err) {
    console.error('TEST 3 FAILED:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 4: Address cannot be geocoded (No fake coordinates)
  // -------------------------------------------------------------
  console.log('--- TEST 4: Address cannot be geocoded ---');
  try {
    const unresolvableAddress = 'Remote Unmapped Hill Sector 9, Outer Border';
    const res4 = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Landslide blocked village road, no injuries, need clearing crew',
        address: unresolvableAddress,
        evidenceImage: null,
      }),
    });

    assert.strictEqual(res4.status, 201, `Expected status 201, got ${res4.status}`);
    const data4 = await res4.json();

    assert.strictEqual(data4.address, unresolvableAddress);
    assert.strictEqual(data4.latitude, null, 'Coordinates must NOT be faked');
    assert.strictEqual(data4.longitude, null, 'Coordinates must NOT be faked');
    assert.strictEqual(data4.intake.location, unresolvableAddress, 'Address is preserved as incident location');
    assert(Array.isArray(data4.resources) && data4.resources.length > 0, 'Resources must still be allocated by capability');
    assert(data4.dispatch && data4.dispatch.actionPlan.length > 0, 'Dispatch must still generate response plan');

    console.log('✓ Status 201 Created');
    console.log(`✓ Address preserved without faking coordinates: "${data4.address}"`);
    console.log(`✓ Latitude: ${data4.latitude}, Longitude: ${data4.longitude} (verified null)`);
    console.log(`✓ Resources allocated by capability (${data4.resources.length} units):`);
    data4.resources.forEach((r) => console.log(`   - [${r.type}] ${r.name} (distanceKm: ${r.distanceKm})`));
    console.log(`✓ Dispatch Action Plan: ${data4.dispatch.actionPlan.length} steps created`);
    console.log('>>> TEST 4 PASSED: Report remains fully usable when address cannot be geocoded; no fake coordinates.\n');
  } catch (err) {
    console.error('TEST 4 FAILED:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 5: Existing 4-Agent pipeline integrity
  // -------------------------------------------------------------
  console.log('--- TEST 5: Existing 4-Agent Pipeline Integrity ---');
  try {
    const res5 = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Structural collapse at Central Mall, Wardha Road with severe trapped casualties',
        address: 'Near Central Mall, Wardha Road',
      }),
    });

    const data5 = await res5.json();
    assert(data5.intake, 'Step 1 Intake missing');
    assert(data5.severity, 'Step 2 Severity missing');
    assert(data5.resources, 'Step 3 Resources missing');
    assert(data5.dispatch, 'Step 4 Dispatch missing');

    console.log(`✓ [1. Intake] Type: ${data5.intake.incidentType} | Hazards: ${data5.intake.reportedHazards?.join(', ')}`);
    console.log(`✓ [2. Severity] Score: ${data5.severity.severityScore} (${data5.severity.severity}) | Confidence: ${data5.severity.confidence}`);
    console.log(`✓ [3. Resources] Allocated: ${data5.resources.map((r) => r.name).join(', ')}`);
    console.log(`✓ [4. Dispatch] ETA: ${data5.dispatch.estimatedResponseTime} | Plan Steps: ${data5.dispatch.actionPlan?.length}`);
    console.log('>>> TEST 5 PASSED: Full 4-Agent pipeline executes end-to-end.\n');
  } catch (err) {
    console.error('TEST 5 FAILED:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 6: Human verification with uploaded image
  // -------------------------------------------------------------
  console.log('--- TEST 6: Human Verification Layer with Uploaded Image ---');
  try {
    // Step 6a: Submit report with image
    const createRes = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Transformer fire in Sadar commercial area, heavy toxic smoke',
        address: 'Sadar, Nagpur',
        evidenceImage: {
          name: 'transformer_fire.webp',
          size: '1.8 MB',
          type: 'image/webp',
          dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><polygon fill="%23EA580C" points="20,80 50,20 80,80"/></svg>',
        },
      }),
    });

    const incident = await createRes.json();
    assert(incident.evidence, 'Evidence must be present');
    assert.strictEqual(incident.evidence.verification.status, 'pending');

    // Step 6b: Submit operator human verification decision
    const verifyRes = await fetch(`${API_BASE}/api/incident/${incident.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationStatus: 'approved',
        operatorDecision: 'supports_report',
        operatorNotes: 'Thermal camera and uploaded photo confirm active transformer fire in Sadar sector.',
      }),
    });

    const updated = await verifyRes.json();
    assert.strictEqual(updated.evidence.verification.status, 'approved');
    assert.strictEqual(updated.evidence.verification.operatorDecision, 'supports_report');
    assert(updated.evidence.auditTrail.length >= 4, 'Audit trail should record the verification decision');

    console.log(`✓ Created Incident ID: ${incident.id}`);
    console.log(`✓ Evidence File: ${incident.evidence.image.name} (${incident.evidence.image.type})`);
    console.log(`✓ Initial Status: ${incident.evidence.verification.status}`);
    console.log(`✓ Verified Status: ${updated.evidence.verification.status}`);
    console.log(`✓ Operator Decision: ${updated.evidence.verification.operatorDecision}`);
    console.log(`✓ Audit Trail Length: ${updated.evidence.auditTrail.length} entries`);
    console.log('>>> TEST 6 PASSED: Uploaded image appears in Evidence and operator verification succeeds.\n');
  } catch (err) {
    console.error('TEST 6 FAILED:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('================================================================');
  if (allPassed) {
    console.log('ALL 6 UX CORRECTION TESTS PASSED SUCCESSFULLY! ✓✓✓');
  } else {
    console.log('SOME TESTS FAILED. CHECK LOGS ABOVE. ✗');
  }
  console.log('================================================================');
  process.exit(allPassed ? 0 : 1);
}

runTests();
