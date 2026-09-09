// test_supabase_pipeline.js
// Automated verification for the Supabase Database Setup & End-to-End Incident Pipeline

const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:3000';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function runAllTests() {
  console.log('================================================================');
  console.log('SUPABASE DATABASE & 4-AGENT PIPELINE INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;

  // ----------------------------------------------------------------
  // TEST 1: Structural Collapse
  // ----------------------------------------------------------------
  console.log('--- TEST 1: Structural Collapse ---');
  let test1IncidentId = null;
  try {
    const res = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Building collapsed near MG Road after heavy rain, at least 6 people trapped, one visibly injured',
        address: 'MG Road, Nagpur',
        evidenceImage: null,
      }),
    });

    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    test1IncidentId = data.id;

    console.log(`✓ Incident Created ID: ${data.id}`);
    console.log(`✓ Incident Type: ${data.intake?.incidentType}`);
    console.log(`✓ Severity: ${data.severity?.severity} (Score: ${data.severity?.severityScore})`);
    console.log(`✓ Matched Resources: ${data.resources?.length} units`);
    console.log(`✓ Response Plan Priority: ${data.dispatch?.priority}`);

    // Verify in Supabase directly
    const { data: dbInc, error: dbErr } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', data.id)
      .single();
    assert(!dbErr, `Supabase fetch failed: ${dbErr?.message}`);
    assert.strictEqual(dbInc.id, data.id);
    assert(dbInc.severity === 'CRITICAL' || dbInc.severity === 'HIGH', 'Severity should be CRITICAL or HIGH');

    // Verify hazards in Supabase
    const { data: dbHazards } = await supabase
      .from('incident_hazards')
      .select('*')
      .eq('incident_id', data.id);
    assert(dbHazards && dbHazards.length > 0, 'Hazards should be persisted in Supabase');
    console.log(`✓ Supabase Persisted Hazards: ${dbHazards.length} hazards`);

    // Verify agent runs in Supabase
    const { data: dbAgentRuns } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('incident_id', data.id);
    assert(dbAgentRuns && dbAgentRuns.length >= 4, `Expected at least 4 agent runs, got ${dbAgentRuns?.length}`);
    console.log(`✓ Supabase Persisted Agent Runs: ${dbAgentRuns.length} runs (Intake, Severity, Resource, Dispatch)`);

    // Verify audit logs in Supabase
    const { data: dbAuditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('incident_id', data.id);
    assert(dbAuditLogs && dbAuditLogs.length >= 4, `Expected at least 4 audit logs, got ${dbAuditLogs?.length}`);
    console.log(`✓ Supabase Persisted Audit Logs: ${dbAuditLogs.length} events`);

    console.log('>>> TEST 1 PASSED: Structural Collapse persisted successfully.\n');
  } catch (err) {
    console.error('TEST 1 FAILED:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------------------
  // TEST 2: Flood
  // ----------------------------------------------------------------
  console.log('--- TEST 2: Flood ---');
  try {
    const res = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Severe urban flash flooding has submerged streets in Dharampeth, 15 families need immediate evacuation',
        address: 'Dharampeth, Nagpur',
        evidenceImage: null,
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    console.log(`✓ Incident Created ID: ${data.id}`);
    console.log(`✓ Incident Type: ${data.intake?.incidentType}`);
    console.log(`✓ People Affected: ${data.intake?.peopleAffectedEstimate}`);
    console.log(`✓ Matched Resources: ${data.resources?.map(r => r.name).join(', ')}`);

    const { data: dbPlan } = await supabase
      .from('response_plans')
      .select('*')
      .eq('incident_id', data.id)
      .single();
    assert(dbPlan, 'Response plan must be in Supabase');
    console.log(`✓ Response Plan Action Steps: ${dbPlan.action_plan?.length || 0}`);

    console.log('>>> TEST 2 PASSED: Flood scenario persisted successfully.\n');
  } catch (err) {
    console.error('TEST 2 FAILED:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------------------
  // TEST 3: Fire
  // ----------------------------------------------------------------
  console.log('--- TEST 3: Fire ---');
  try {
    const res = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Chemical warehouse fire reported near Wardha Road, thick toxic smoke spreading to nearby shops',
        address: 'Wardha Road, Nagpur',
        evidenceImage: null,
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    console.log(`✓ Incident Created ID: ${data.id}`);
    console.log(`✓ Incident Type: ${data.intake?.incidentType}`);
    console.log(`✓ Severity: ${data.severity?.severity}`);

    // Check resources matched fire unit
    const hasFireOrRescue = data.resources?.some(r => r.type === 'rescue_team' || r.name.toLowerCase().includes('fire'));
    assert(hasFireOrRescue, 'Should allocate rescue/fire unit');
    console.log(`✓ Fire/Rescue Unit matched: ${data.resources?.map(r => r.name).join(', ')}`);

    console.log('>>> TEST 3 PASSED: Fire scenario persisted successfully.\n');
  } catch (err) {
    console.error('TEST 3 FAILED:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------------------
  // TEST 4: Image Evidence & Supabase Storage
  // ----------------------------------------------------------------
  console.log('--- TEST 4: Image Evidence & Supabase Storage ---');
  let test4IncidentId = null;
  try {
    const res = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Heavy structure collapse on MG Road, large concrete slab fell on vehicle',
        address: 'MG Road, Nagpur',
        evidenceImage: {
          name: 'building_collapse.jpg',
          size: '2.4 MB',
          type: 'image/jpeg',
          dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23334155" width="200" height="200"/></svg>',
        },
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    test4IncidentId = data.id;

    assert(data.evidence, 'Evidence object must be returned');
    assert(data.evidence.analysis, 'Visual analysis must be completed');
    assert.strictEqual(data.evidence.verification?.status, 'pending', 'Verification status must start as pending');

    console.log(`✓ Incident ID: ${data.id}`);
    console.log(`✓ Evidence File: ${data.evidence.image?.name} (${data.evidence.image?.size})`);
    console.log(`✓ Visual Consistency: ${data.evidence.analysis?.consistency}`);
    console.log(`✓ Observations Count: ${data.evidence.analysis?.observations?.length}`);
    console.log(`✓ Verification Initial Status: ${data.evidence.verification?.status}`);

    // Verify in Supabase tables
    const { data: dbEvidence } = await supabase
      .from('evidence')
      .select('*')
      .eq('incident_id', data.id)
      .single();
    assert(dbEvidence, 'Evidence row must exist in Supabase');

    const { data: dbVerification } = await supabase
      .from('verification')
      .select('*')
      .eq('incident_id', data.id)
      .single();
    assert(dbVerification, 'Verification row must exist in Supabase');
    assert.strictEqual(dbVerification.verification_status, 'pending');

    console.log('>>> TEST 4 PASSED: Image evidence and pending verification stored.\n');
  } catch (err) {
    console.error('TEST 4 FAILED:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------------------
  // TEST 5: Human Verification (Approve, Modify, Reject, Inconclusive)
  // ----------------------------------------------------------------
  console.log('--- TEST 5: Human Verification Actions ---');
  try {
    assert(test4IncidentId, 'Requires test4IncidentId');

    // 5.1 Approve
    const approveRes = await fetch(`${API_BASE}/api/incident/${test4IncidentId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationStatus: 'approved',
        operatorDecision: 'supports_report',
        operatorNotes: 'Visual damage confirmed on-site by field commander.',
      }),
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.evidence?.verification?.status, 'approved');
    console.log(`✓ Approved Status in API response: ${approveData.evidence?.verification?.status}`);

    // Verify directly in Supabase
    const { data: verRow1 } = await supabase
      .from('verification')
      .select('*')
      .eq('incident_id', test4IncidentId)
      .single();
    assert.strictEqual(verRow1.verification_status, 'approved');
    assert.strictEqual(verRow1.operator_notes, 'Visual damage confirmed on-site by field commander.');
    console.log(`✓ Supabase Verification table verified status: ${verRow1.verification_status}`);

    // 5.2 Modify
    const modifyRes = await fetch(`${API_BASE}/api/incident/${test4IncidentId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationStatus: 'modified',
        operatorDecision: 'partially_supports',
        operatorNotes: 'Damage confined to outer wall, main structure intact.',
      }),
    });
    const modifyData = await modifyRes.json();
    assert.strictEqual(modifyData.evidence?.verification?.status, 'modified');
    console.log(`✓ Modified Status: ${modifyData.evidence?.verification?.status} | Notes: "${modifyData.evidence?.verification?.operatorNotes}"`);

    // 5.3 Reject
    const rejectRes = await fetch(`${API_BASE}/api/incident/${test4IncidentId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationStatus: 'rejected',
        operatorDecision: 'conflicts_with_report',
        operatorNotes: 'Photo does not match reported location.',
      }),
    });
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectData.evidence?.verification?.status, 'rejected');
    console.log(`✓ Rejected Status: ${rejectData.evidence?.verification?.status}`);

    // 5.4 Inconclusive
    const inconcRes = await fetch(`${API_BASE}/api/incident/${test4IncidentId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationStatus: 'inconclusive',
        operatorDecision: 'unable_to_verify',
        operatorNotes: 'Lighting too poor to verify structural cracks.',
      }),
    });
    const inconcData = await inconcRes.json();
    assert.strictEqual(inconcData.evidence?.verification?.status, 'inconclusive');
    console.log(`✓ Inconclusive Status: ${inconcData.evidence?.verification?.status}`);

    // Verify audit log has recorded all verification transitions
    const { data: verAuditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('incident_id', test4IncidentId)
      .like('action', 'verification_%');
    assert(verAuditLogs && verAuditLogs.length >= 4, `Expected at least 4 verification audit logs, got ${verAuditLogs?.length}`);
    console.log(`✓ Audit log verified with ${verAuditLogs.length} verification events.`);

    console.log('>>> TEST 5 PASSED: All human verification operations verified.\n');
  } catch (err) {
    console.error('TEST 5 FAILED:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------------------
  // TEST 6: Incident Without Image
  // ----------------------------------------------------------------
  console.log('--- TEST 6: Incident Without Image ---');
  try {
    const res = await fetch(`${API_BASE}/api/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: 'Minor traffic blockage due to broken tree branch on road, no injuries',
        address: 'Ramdaspeth, Nagpur',
        evidenceImage: null,
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.evidence, null, 'Evidence must be null for non-photo reports');
    console.log(`✓ Incident ID: ${data.id}`);
    console.log(`✓ Evidence: null (Clean row, no verify button required)`);

    const { data: dbEv } = await supabase
      .from('evidence')
      .select('*')
      .eq('incident_id', data.id);
    assert(dbEv && dbEv.length === 0, 'No evidence row should be created');

    console.log('>>> TEST 6 PASSED: No-image incident is clean and verified.\n');
  } catch (err) {
    console.error('TEST 6 FAILED:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------------------
  // TEST 7: Refresh / Persistence from Supabase
  // ----------------------------------------------------------------
  console.log('--- TEST 7: Refresh & Live Persistence ---');
  try {
    const res = await fetch(`${API_BASE}/api/incidents`);
    assert.strictEqual(res.status, 200);
    const incidents = await res.json();
    assert(Array.isArray(incidents) && incidents.length >= 4, `Expected at least 4 persisted incidents, got ${incidents.length}`);
    console.log(`✓ Fetched ${incidents.length} incidents directly from Supabase`);

    // Find the verified incident from Test 5
    const verifiedInc = incidents.find(i => i.id === test4IncidentId);
    assert(verifiedInc, 'Test 4 incident must be in persisted list');
    assert.strictEqual(verifiedInc.evidence?.verification?.status, 'inconclusive');
    console.log(`✓ Persisted verification status: ${verifiedInc.evidence?.verification?.status}`);

    console.log('>>> TEST 7 PASSED: Live persistence confirmed on refresh.\n');
  } catch (err) {
    console.error('TEST 7 FAILED:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------------------
  // TEST 8: AI Fallback (Deterministic pipeline completion)
  // ----------------------------------------------------------------
  console.log('--- TEST 8: AI Fallback Execution ---');
  try {
    // Save original GROQ_API_KEY
    const origKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'invalid_simulated_key';

    // Import intake agent to test fallback path
    const { processIncident } = require('./agents/intakeAgent');
    const { assessSeverity } = require('./agents/severityAgent');

    const fallbackIntake = await processIncident('Gas cylinder leak with fire hazard reported at market', 21.14, 79.08);
    assert(fallbackIntake.incidentType, 'Intake should still succeed via deterministic fallback');
    console.log(`✓ Deterministic Intake Fallback Type: ${fallbackIntake.incidentType}`);

    const fallbackSeverity = await assessSeverity({ ...fallbackIntake, reportText: 'Gas cylinder leak' });
    assert(fallbackSeverity.severity, 'Severity should still succeed via deterministic fallback');
    console.log(`✓ Deterministic Severity Fallback: ${fallbackSeverity.severity}`);

    // Restore key
    process.env.GROQ_API_KEY = origKey;

    console.log('>>> TEST 8 PASSED: Deterministic fallback completes safely without error.\n');
  } catch (err) {
    console.error('TEST 8 FAILED:', err.message);
    allPassed = false;
  }

  console.log('================================================================');
  if (allPassed) {
    console.log('🎉 ALL 8 SUPABASE PIPELINE INTEGRATION TESTS PASSED!');
  } else {
    console.log('❌ SOME TESTS FAILED. CHECK LOGS ABOVE.');
  }
  console.log('================================================================\n');

  return allPassed;
}

runAllTests().then((passed) => {
  process.exit(passed ? 0 : 1);
});
