const assert = require('assert');

async function runVerificationTests() {
  console.log('====================================================');
  console.log('STARTING HUMAN VERIFICATION & EVIDENCE TESTS');
  console.log('====================================================\n');

  let allPassed = true;

  // SCENARIO 1: Building collapse + image showing structural damage
  console.log('--- SCENARIO 1: Collapse Report + Structural Damage Image ---');
  try {
    const res1 = await fetch('http://localhost:3000/api/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Building collapsed near MG Road after heavy rain, at least 6 people trapped, one visibly injured',
        latitude: 21.1458,
        longitude: 79.0882,
        evidenceImage: {
          name: 'building_collapse.jpg',
          size: '2.4 MB',
          type: 'image/jpeg',
          dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        },
      }),
    });

    const data1 = await res1.json();
    console.log('Incident ID:', data1.id);
    console.log('Severity:', data1.severity?.severity);
    console.log('Consistency:', data1.evidence?.analysis?.consistency);
    console.log('Verification Status:', data1.evidence?.verification?.status);
    console.log('Observations:', data1.evidence?.analysis?.observations?.length);

    assert.strictEqual(data1.evidence?.analysis?.consistency, 'SUPPORTS', 'Should detect SUPPORTS consistency');
    assert.strictEqual(data1.evidence?.verification?.status, 'pending', 'Should start in pending state');
    assert.strictEqual(data1.severity?.severity, 'CRITICAL', 'Severity should remain CRITICAL');

    // Test operator approval
    const verifyRes = await fetch(`http://localhost:3000/api/incident/${data1.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationStatus: 'approved',
        operatorDecision: 'supports_report',
        operatorNotes: 'Structural collapse confirmed on scene.',
      }),
    });

    const verifyData = await verifyRes.json();
    console.log('After Operator Approval Status:', verifyData.evidence?.verification?.status);
    console.log('Audit Trail Events Count:', verifyData.evidence?.auditTrail?.length);
    assert.strictEqual(verifyData.evidence?.verification?.status, 'approved', 'Should be updated to approved');
    assert(verifyData.evidence?.auditTrail?.length >= 4, 'Audit trail should have appended events');

    console.log('>>> SCENARIO 1: PASS\n');
  } catch (err) {
    console.error('Scenario 1 FAILED:', err);
    allPassed = false;
  }

  // SCENARIO 2: Flood report + unrelated image (Conflict Detection)
  console.log('--- SCENARIO 2: Flood Report + Unrelated Image (Conflict Detection) ---');
  try {
    const res2 = await fetch('http://localhost:3000/api/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Heavy flooding has affected several houses and families need evacuation.',
        latitude: 21.135,
        longitude: 79.075,
        evidenceImage: {
          name: 'normal_clear_road.jpg',
          size: '1.4 MB',
          type: 'image/jpeg',
          dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        },
      }),
    });

    const data2 = await res2.json();
    console.log('Incident ID:', data2.id);
    console.log('Severity:', data2.severity?.severity);
    console.log('Consistency:', data2.evidence?.analysis?.consistency);
    console.log('High Risk Required:', data2.evidence?.highRiskFlag?.required);
    console.log('High Risk Reason:', data2.evidence?.highRiskFlag?.reason);

    assert.strictEqual(data2.evidence?.analysis?.consistency, 'CONFLICT', 'Should detect CONFLICT consistency');
    assert.strictEqual(data2.evidence?.highRiskFlag?.required, true, 'High-risk verification must be required on conflict');
    assert(data2.severity?.severityScore >= 4, 'Severity should NOT be changed automatically by the image');

    console.log('>>> SCENARIO 2: PASS\n');
  } catch (err) {
    console.error('Scenario 2 FAILED:', err);
    allPassed = false;
  }

  // SCENARIO 3: Incident without image
  console.log('--- SCENARIO 3: Incident Without Image ---');
  try {
    const res3 = await fetch('http://localhost:3000/api/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Minor road accident, no injuries reported.',
        latitude: 21.12,
        longitude: 79.06,
        evidenceImage: null,
      }),
    });

    const data3 = await res3.json();
    console.log('Incident ID:', data3.id);
    console.log('Evidence:', data3.evidence);
    console.log('Severity:', data3.severity?.severity);
    console.log('Dispatch Plan Steps:', data3.dispatch?.actionPlan?.length);

    assert.strictEqual(data3.evidence, null, 'Evidence should be null when not provided');
    assert(data3.dispatch?.actionPlan?.length >= 3, 'Dispatch action plan should generate normally');
    assert(data3.resources?.length >= 1, 'Resources should be assigned normally');

    console.log('>>> SCENARIO 3: PASS\n');
  } catch (err) {
    console.error('Scenario 3 FAILED:', err);
    allPassed = false;
  }

  // SCENARIO 4: Critical incident + image (Image Advisory Only)
  console.log('--- SCENARIO 4: Critical Incident + Image Advisory Only ---');
  try {
    const res4 = await fetch('http://localhost:3000/api/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Massive fire in commercial warehouse with multiple explosions, structural damage likely',
        latitude: 21.155,
        longitude: 79.095,
        evidenceImage: {
          name: 'warehouse_fire.jpg',
          size: '1.9 MB',
          type: 'image/jpeg',
          dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        },
      }),
    });

    const data4 = await res4.json();
    console.log('Incident ID:', data4.id);
    console.log('Severity Level:', data4.severity?.severity);
    console.log('Evidence Type:', data4.evidence?.analysis?.evidenceType);
    console.log('Disclaimer:', data4.evidence?.analysis?.disclaimer);

    assert.strictEqual(data4.evidence?.analysis?.evidenceType, 'Advisory', 'Evidence must be labeled Advisory');
    assert(data4.evidence?.highRiskFlag?.required === true, 'Critical incidents must flag high-risk verification');
    assert(data4.dispatch?.actionPlan?.length >= 3, 'Dispatch plan must remain intact');

    console.log('>>> SCENARIO 4: PASS\n');
  } catch (err) {
    console.error('Scenario 4 FAILED:', err);
    allPassed = false;
  }

  console.log('====================================================');
  console.log(`ALL VERIFICATION TESTS RESULT: ${allPassed ? 'ALL PASSED' : 'FAILURES OCCURRED'}`);
  console.log('====================================================');

  if (!allPassed) process.exit(1);
}

runVerificationTests();
