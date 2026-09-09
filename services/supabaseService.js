// services/supabaseService.js
// Centralized Supabase database and storage service for the Disaster Response Coordinator

const { createClient } = require('@supabase/supabase-js');
const shelters = require('../data/shelters.json');

const supabaseUrl = process.env.SUPABASE_URL || 'https://cigdtwvepcmjiujmiwon.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZ2R0d3ZlcGNtaml1am1pd29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTI0NDgsImV4cCI6MjEwNDQ4ODQ0OH0.v23NkQfdejcXyvZ7rqlY0pDT78gi9LDutxKlDXQR1x8';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Verifies Supabase connectivity and seeds emergency resources if table is empty.
 */
async function initSupabase() {
  try {
    const { count, error } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('[Supabase] Healthcheck query warning:', error.message);
      return false;
    }

    console.log(`[Supabase] Connected to Ai_Miniproject. Resources count: ${count ?? 0}`);

    if (!count || count === 0) {
      await seedResourcesIfEmpty();
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Initialization error:', err.message);
    return false;
  }
}

/**
 * Seeds resources table from shelters.json if empty.
 */
async function seedResourcesIfEmpty() {
  try {
    const { count } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) return;

    console.log('[Supabase] Seeding emergency resources table...');
    const rows = shelters.map((s, idx) => ({
      name: s.name,
      type: s.type,
      latitude: s.latitude,
      longitude: s.longitude,
      capacity: s.capacity || 10,
      current_occupancy: s.currentOccupancy || 0,
      status: s.status || 'available',
      contact_information: `Zone Emergency Contact - Unit ${idx + 1}`,
    }));

    const { error } = await supabase.from('resources').insert(rows);
    if (error) {
      console.warn('[Supabase] Resource seed error:', error.message);
    } else {
      console.log(`[Supabase] Seeded ${rows.length} regional emergency resources.`);
    }
  } catch (err) {
    console.warn('[Supabase] seedResourcesIfEmpty failed:', err.message);
  }
}

/**
 * Creates an incident record in Supabase.
 */
async function createIncident({
  id,
  reportText,
  address,
  latitude,
  longitude,
  intake,
  severity,
}) {
  const payload = {
    report_text: reportText,
    incident_type: intake?.incidentType || 'UNKNOWN',
    status: 'new',
    latitude: latitude ?? intake?.lat ?? null,
    longitude: longitude ?? intake?.long ?? null,
    location_text: address || intake?.location || 'Reported Location',
    people_affected_estimate: intake?.peopleAffectedEstimate ?? 0,
    key_details: intake?.keyDetails || '',
    severity: severity?.severity || 'LOW',
    severity_score: severity?.severityScore ?? 1,
    severity_confidence: severity?.confidence ?? 0.8,
    severity_reason: severity?.reasoning || '',
    urgency_category: severity?.urgency || 'MONITOR',
  };

  if (id) {
    payload.id = id;
  }

  const { data, error } = await supabase
    .from('incidents')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create incident in Supabase: ${error.message}`);
  }
  return data;
}

/**
 * Creates hazard entries for an incident.
 */
async function createHazards(incidentId, hazards = []) {
  if (!Array.isArray(hazards) || hazards.length === 0) return [];

  const rows = hazards.map((h) => ({
    incident_id: incidentId,
    hazard: String(h),
  }));

  const { data, error } = await supabase
    .from('incident_hazards')
    .insert(rows)
    .select();

  if (error) {
    console.warn('[Supabase] Failed to insert hazards:', error.message);
    return [];
  }
  return data;
}

/**
 * Updates severity fields on an incident.
 */
async function updateIncidentSeverity(incidentId, severity) {
  const { data, error } = await supabase
    .from('incidents')
    .update({
      severity: severity.severity,
      severity_score: severity.severityScore,
      severity_confidence: severity.confidence,
      severity_reason: severity.reasoning,
      urgency_category: severity.urgency,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] Failed to update severity:', error.message);
  }
  return data;
}

/**
 * Assigns matched resources to an incident.
 */
async function assignResources(incidentId, matchedResources = []) {
  if (!Array.isArray(matchedResources) || matchedResources.length === 0) return [];

  // Lookup existing resources in DB by name/type to link foreign keys
  const { data: dbResources } = await supabase.from('resources').select('id, name');
  const nameToId = new Map((dbResources || []).map((r) => [r.name.toLowerCase(), r.id]));

  const rows = [];
  for (const r of matchedResources) {
    let resId = nameToId.get(r.name.toLowerCase());
    // If not found in DB, link to first or create
    if (!resId && dbResources && dbResources.length > 0) {
      resId = dbResources[0].id;
    }
    if (resId) {
      rows.push({
        incident_id: incidentId,
        resource_id: resId,
        assignment_status: 'dispatched',
        distance_km: r.distanceKm ?? null,
      });
    }
  }

  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('incident_resources')
    .insert(rows)
    .select();

  if (error) {
    console.warn('[Supabase] Failed to assign resources:', error.message);
    return [];
  }
  return data;
}

/**
 * Creates response plan record.
 */
async function createResponsePlan(incidentId, dispatch = {}) {
  const payload = {
    incident_id: incidentId,
    action_plan: Array.isArray(dispatch.actionPlan) ? dispatch.actionPlan : [],
    alert_message: dispatch.alertMessage || '',
    estimated_response_time: dispatch.estimatedResponseTime || '10-15 mins',
    priority: dispatch.priority || 'STANDARD',
  };

  const { data, error } = await supabase
    .from('response_plans')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] Failed to create response plan:', error.message);
    return null;
  }
  return data;
}

/**
 * Uploads evidence photo to Supabase Storage and records metadata in `evidence` and `verification`.
 */
async function uploadAndCreateEvidence(incidentId, evidenceImage, visualAnalysis = {}) {
  if (!evidenceImage) return null;

  let fileUrl = evidenceImage.dataUrl || null;

  // Attempt upload to Supabase Storage bucket 'incident-evidence'
  try {
    if (evidenceImage.dataUrl && evidenceImage.dataUrl.startsWith('data:')) {
      const matches = evidenceImage.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const filePath = `${incidentId}/${Date.now()}_${evidenceImage.name || 'evidence'}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('incident-evidence')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('incident-evidence')
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            fileUrl = publicUrlData.publicUrl;
          }
        }
      }
    }
  } catch (storageErr) {
    console.warn('[Supabase] Storage upload warning (fallback to direct dataUrl):', storageErr.message);
  }

  // Insert evidence row
  const evidencePayload = {
    incident_id: incidentId,
    file_url: fileUrl,
    file_name: evidenceImage.name || 'incident_evidence.jpg',
    file_type: evidenceImage.type || 'image/jpeg',
    file_size: evidenceImage.size || '1.8 MB',
    analysis_status: 'completed',
    visual_observations: visualAnalysis?.analysis?.observations || [],
    visual_confidence: visualAnalysis?.analysis?.confidence ?? 0.85,
    evidence_consistency: visualAnalysis?.analysis?.consistency || 'SUPPORTS',
  };

  const { data: evidenceRow, error: evError } = await supabase
    .from('evidence')
    .insert(evidencePayload)
    .select()
    .single();

  if (evError) {
    console.warn('[Supabase] Failed to insert evidence:', evError.message);
    return null;
  }

  // Create initial pending verification row
  const { data: verificationRow, error: verError } = await supabase
    .from('verification')
    .insert({
      incident_id: incidentId,
      evidence_id: evidenceRow.id,
      verification_status: 'pending',
      operator_decision: null,
      operator_notes: '',
    })
    .select()
    .single();

  if (verError) {
    console.warn('[Supabase] Failed to create verification row:', verError.message);
  }

  return { evidenceRow, verificationRow };
}

/**
 * Updates human operator verification decision.
 */
async function updateVerification(incidentId, { verificationStatus, operatorDecision, operatorNotes }) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('verification')
    .update({
      verification_status: verificationStatus || 'approved',
      operator_decision: operatorDecision || 'supports_report',
      operator_notes: String(operatorNotes || '').trim(),
      verified_at: now,
    })
    .eq('incident_id', incidentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update verification in Supabase: ${error.message}`);
  }

  // Also log audit entry
  await recordAuditLog(incidentId, {
    action: `verification_${verificationStatus || 'approved'}`,
    actor_type: 'operator',
    details: {
      decision: operatorDecision,
      notes: operatorNotes,
      timestamp: now,
    },
  });

  return data;
}

/**
 * Records an AI agent execution in `agent_runs`.
 */
async function recordAgentRun(incidentId, {
  agentName,
  status = 'completed',
  provider = 'groq',
  model = 'openai/gpt-oss-120b',
  inputSummary = '',
  outputData = null,
  errorMessage = null,
  startedAt = null,
  completedAt = null,
}) {
  try {
    await supabase.from('agent_runs').insert({
      incident_id: incidentId,
      agent_name: agentName,
      status,
      provider,
      model,
      input_summary: inputSummary,
      output_data: outputData,
      error_message: errorMessage,
      started_at: startedAt || new Date().toISOString(),
      completed_at: completedAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[Supabase] Failed to log agent run for ${agentName}:`, err.message);
  }
}

/**
 * Records an entry in `audit_logs`.
 */
async function recordAuditLog(incidentId, { action, actor_type = 'system', details = {} }) {
  try {
    await supabase.from('audit_logs').insert({
      incident_id: incidentId,
      action,
      actor_type,
      details,
    });
  } catch (err) {
    console.warn(`[Supabase] Failed to record audit log for ${action}:`, err.message);
  }
}

/**
 * Hydrates a complete incident object matching frontend expectations.
 */
function hydrateIncident(inc, hazards = [], assignedResources = [], responsePlan = null, evidenceRow = null, verificationRow = null, auditLogs = []) {
  const evidence = evidenceRow
    ? {
        id: evidenceRow.id,
        image: {
          name: evidenceRow.file_name,
          size: evidenceRow.file_size,
          type: evidenceRow.file_type,
          dataUrl: evidenceRow.file_url,
        },
        analysis: {
          observations: Array.isArray(evidenceRow.visual_observations)
            ? evidenceRow.visual_observations
            : [],
          confidence: evidenceRow.visual_confidence ?? 0.85,
          consistency: evidenceRow.evidence_consistency || 'SUPPORTS',
          consistencyDetail: `Visual evidence analyzed: ${evidenceRow.evidence_consistency || 'SUPPORTS'}`,
          evidenceType: 'RGB Still Image',
        },
        highRiskFlag: {
          required:
            String(inc.severity).toUpperCase() === 'CRITICAL' ||
            evidenceRow.evidence_consistency === 'CONFLICT',
          reason:
            evidenceRow.evidence_consistency === 'CONFLICT'
              ? 'Evidence conflict detected.'
              : String(inc.severity).toUpperCase() === 'CRITICAL'
              ? 'Critical severity requires verification.'
              : null,
        },
        verification: verificationRow
          ? {
              status: verificationRow.verification_status,
              operatorDecision: verificationRow.operator_decision,
              operatorNotes: verificationRow.operator_notes,
              verifiedAt: verificationRow.verified_at,
              verifiedBy: 'Duty Operations Commander',
            }
          : { status: 'pending' },
        auditTrail: auditLogs.map((l) => ({
          timestamp: l.created_at,
          action: l.action,
          details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
        })),
      }
    : null;

  return {
    id: inc.id,
    timestamp: inc.created_at,
    reportText: inc.report_text,
    address: inc.location_text,
    latitude: inc.latitude,
    longitude: inc.longitude,
    status: inc.status,
    intake: {
      incidentType: inc.incident_type,
      location: inc.location_text,
      lat: inc.latitude,
      long: inc.longitude,
      peopleAffectedEstimate: inc.people_affected_estimate,
      reportedHazards: hazards.map((h) => h.hazard),
      keyDetails: inc.key_details,
    },
    severity: {
      severity: inc.severity,
      severityScore: inc.severity_score,
      confidence: inc.severity_confidence,
      reasoning: inc.severity_reason,
      urgency: inc.urgency_category,
    },
    resources: assignedResources.map((ar) => ({
      id: ar.resources?.id || ar.resource_id,
      name: ar.resources?.name || 'Emergency Unit',
      type: ar.resources?.type || 'rescue_team',
      latitude: ar.resources?.latitude,
      longitude: ar.resources?.longitude,
      capacity: ar.resources?.capacity,
      currentOccupancy: ar.resources?.current_occupancy,
      status: ar.resources?.status || 'dispatched',
      distanceKm: ar.distance_km,
    })),
    dispatch: responsePlan
      ? {
          priority: responsePlan.priority,
          actionPlan: responsePlan.action_plan || [],
          alertMessage: responsePlan.alert_message || '',
          estimatedResponseTime: responsePlan.estimated_response_time || '10-15 mins',
        }
      : {},
    evidence,
    llmStatus: {
      provider: process.env.LLM_PROVIDER || 'groq',
      available: true,
    },
  };
}

/**
 * Gets a single incident by ID fully hydrated from Supabase.
 */
async function getIncidentById(incidentId) {
  const { data: inc, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  if (error || !inc) return null;

  const [
    { data: hazards },
    { data: incidentResources },
    { data: responsePlan },
    { data: evidenceRow },
    { data: verificationRow },
    { data: auditLogs },
  ] = await Promise.all([
    supabase.from('incident_hazards').select('*').eq('incident_id', incidentId),
    supabase.from('incident_resources').select('*, resources(*)').eq('incident_id', incidentId),
    supabase.from('response_plans').select('*').eq('incident_id', incidentId).maybeSingle(),
    supabase.from('evidence').select('*').eq('incident_id', incidentId).maybeSingle(),
    supabase.from('verification').select('*').eq('incident_id', incidentId).maybeSingle(),
    supabase.from('audit_logs').select('*').eq('incident_id', incidentId).order('created_at', { ascending: true }),
  ]);

  return hydrateIncident(
    inc,
    hazards || [],
    incidentResources || [],
    responsePlan || null,
    evidenceRow || null,
    verificationRow || null,
    auditLogs || []
  );
}

/**
 * Lists all incidents from Supabase, sorted by created_at DESC.
 */
async function listAllIncidents() {
  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !Array.isArray(incidents)) {
    console.error('[Supabase] Failed to list incidents:', error?.message);
    return [];
  }

  // Fetch related tables in parallel batches
  const incidentIds = incidents.map((i) => i.id);
  if (incidentIds.length === 0) return [];

  const [
    { data: allHazards },
    { data: allIncidentResources },
    { data: allResponsePlans },
    { data: allEvidence },
    { data: allVerifications },
    { data: allAuditLogs },
  ] = await Promise.all([
    supabase.from('incident_hazards').select('*').in('incident_id', incidentIds),
    supabase.from('incident_resources').select('*, resources(*)').in('incident_id', incidentIds),
    supabase.from('response_plans').select('*').in('incident_id', incidentIds),
    supabase.from('evidence').select('*').in('incident_id', incidentIds),
    supabase.from('verification').select('*').in('incident_id', incidentIds),
    supabase.from('audit_logs').select('*').in('incident_id', incidentIds).order('created_at', { ascending: true }),
  ]);

  // Group by incident_id
  const hazardsMap = new Map();
  for (const h of allHazards || []) {
    if (!hazardsMap.has(h.incident_id)) hazardsMap.set(h.incident_id, []);
    hazardsMap.get(h.incident_id).push(h);
  }

  const resMap = new Map();
  for (const r of allIncidentResources || []) {
    if (!resMap.has(r.incident_id)) resMap.set(r.incident_id, []);
    resMap.get(r.incident_id).push(r);
  }

  const planMap = new Map((allResponsePlans || []).map((p) => [p.incident_id, p]));
  const evidenceMap = new Map((allEvidence || []).map((e) => [e.incident_id, e]));
  const verMap = new Map((allVerifications || []).map((v) => [v.incident_id, v]));

  const auditMap = new Map();
  for (const a of allAuditLogs || []) {
    if (!auditMap.has(a.incident_id)) auditMap.set(a.incident_id, []);
    auditMap.get(a.incident_id).push(a);
  }

  return incidents.map((inc) =>
    hydrateIncident(
      inc,
      hazardsMap.get(inc.id) || [],
      resMap.get(inc.id) || [],
      planMap.get(inc.id) || null,
      evidenceMap.get(inc.id) || null,
      verMap.get(inc.id) || null,
      auditMap.get(inc.id) || []
    )
  );
}

/**
 * Lists all available emergency resources from Supabase.
 */
async function listResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.warn('[Supabase] Failed to list resources from DB, falling back to local shelters:', error.message);
    return shelters;
  }
  return data;
}

module.exports = {
  supabase,
  initSupabase,
  seedResourcesIfEmpty,
  createIncident,
  createHazards,
  updateIncidentSeverity,
  assignResources,
  createResponsePlan,
  uploadAndCreateEvidence,
  updateVerification,
  recordAgentRun,
  recordAuditLog,
  getIncidentById,
  listAllIncidents,
  listResources,
};
