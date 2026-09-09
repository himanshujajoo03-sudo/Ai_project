const express = require('express');
const crypto = require('crypto');

const { processIncident } = require('../agents/intakeAgent');
const { assessSeverity } = require('../agents/severityAgent');
const { findResources } = require('../agents/resourceAgent');
const { dispatchResources } = require('../agents/dispatchAgent');
const { analyzeVisualEvidence } = require('../agents/visualEvidenceAgent');
const { geocodeAddress } = require('../utils/geocoding');
const {
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
} = require('../services/supabaseService');

/**
 * Routes for incident submission, lookup, and human verification with Supabase persistence.
 *
 * @param {Array} processedIncidents - Shared in-memory fallback cache from server.js.
 * @returns {import('express').Router}
 */
function createIncidentRouter(processedIncidents = []) {
  const router = express.Router();

  // POST /api/incident — submit an incident report and run the full pipeline:
  // intake -> severity -> resource -> dispatch (+ optional visual evidence analysis)
  // and persist every stage to Supabase PostgreSQL.
  router.post('/incident', async (req, res) => {
    const { reportText, address, latitude, longitude, evidenceImage } = req.body || {};

    if (typeof reportText !== 'string' || reportText.trim() === '') {
      return res.status(400).json({ error: 'reportText (string) is required' });
    }

    const hasExplicitCoords =
      typeof latitude === 'number' &&
      !Number.isNaN(latitude) &&
      typeof longitude === 'number' &&
      !Number.isNaN(longitude);

    const hasAddress = typeof address === 'string' && address.trim() !== '';

    if (!hasExplicitCoords && !hasAddress) {
      return res.status(400).json({
        error: 'Either address (string) or latitude and longitude (numbers) are required',
      });
    }

    // Determine internal coordinates
    let resolvedLat = hasExplicitCoords ? latitude : null;
    let resolvedLong = hasExplicitCoords ? longitude : null;
    let geocodedArea = null;

    if (!hasExplicitCoords && hasAddress) {
      const geoResult = geocodeAddress(address);
      if (geoResult.resolved) {
        resolvedLat = geoResult.latitude;
        resolvedLong = geoResult.longitude;
        geocodedArea = geoResult.areaName;
      }
    }

    try {
      const startTime = new Date().toISOString();

      // 1. Intake Agent
      const intakeStart = new Date().toISOString();
      const intake = await processIncident(reportText, resolvedLat, resolvedLong);
      if (hasAddress) {
        intake.location = address.trim();
      }

      // Persist to Supabase: Incidents table
      const createdRow = await createIncident({
        reportText: reportText.trim(),
        address: hasAddress ? address.trim() : (intake.location || 'Reported Location'),
        latitude: resolvedLat,
        longitude: resolvedLong,
        intake,
        severity: null,
      });
      const incidentId = createdRow.id;

      // Persist hazards
      await createHazards(incidentId, intake.reportedHazards);

      // Record Intake Agent Run & Audit Logs
      await recordAgentRun(incidentId, {
        agentName: 'intake',
        status: intake.llmStatus?.fallbackUsed ? 'fallback' : 'completed',
        provider: intake.llmStatus?.provider || 'groq',
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        inputSummary: reportText.slice(0, 120),
        outputData: intake,
        startedAt: intakeStart,
        completedAt: new Date().toISOString(),
      });

      await recordAuditLog(incidentId, {
        action: 'incident_created',
        actor_type: 'system',
        details: {
          location: intake.location,
          incidentType: intake.incidentType,
          peopleAffectedEstimate: intake.peopleAffectedEstimate,
        },
      });

      await recordAuditLog(incidentId, {
        action: 'intake_completed',
        actor_type: 'ai_agent',
        details: { hazards: intake.reportedHazards },
      });

      // 2. Severity Agent
      const severityStart = new Date().toISOString();
      const severity = await assessSeverity({ ...intake, reportText });

      // Update incident severity in Supabase
      await updateIncidentSeverity(incidentId, severity);

      await recordAgentRun(incidentId, {
        agentName: 'severity',
        status: severity.llmStatus?.fallbackUsed ? 'fallback' : 'completed',
        provider: severity.llmStatus?.provider || 'groq',
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        inputSummary: `${intake.incidentType} with ${intake.reportedHazards?.length || 0} hazards`,
        outputData: severity,
        startedAt: severityStart,
        completedAt: new Date().toISOString(),
      });

      await recordAuditLog(incidentId, {
        action: 'severity_assigned',
        actor_type: 'ai_agent',
        details: {
          severity: severity.severity,
          score: severity.severityScore,
          urgency: severity.urgency,
        },
      });

      // 3. Resource Matching Agent
      const resourceStart = new Date().toISOString();
      const resources = await findResources(
        { lat: intake.lat, long: intake.long },
        intake.incidentType,
        severity.severityScore,
        intake
      );

      // Persist assigned resources to Supabase
      await assignResources(incidentId, resources);

      await recordAgentRun(incidentId, {
        agentName: 'resource_matching',
        status: 'completed',
        provider: 'deterministic_proximity',
        model: 'haversine_ranker',
        inputSummary: `${intake.incidentType} @ (${intake.lat}, ${intake.long})`,
        outputData: resources,
        startedAt: resourceStart,
        completedAt: new Date().toISOString(),
      });

      await recordAuditLog(incidentId, {
        action: 'resources_matched',
        actor_type: 'ai_agent',
        details: {
          matchedCount: resources.length,
          resourceNames: resources.map((r) => r.name),
        },
      });

      // 4. Dispatch Agent
      const dispatchStart = new Date().toISOString();
      const dispatch = await dispatchResources(intake, severity, resources);

      // Persist response plan to Supabase
      await createResponsePlan(incidentId, dispatch);

      await recordAgentRun(incidentId, {
        agentName: 'dispatch',
        status: dispatch.llmStatus?.fallbackUsed ? 'fallback' : 'completed',
        provider: dispatch.llmStatus?.provider || 'groq',
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        inputSummary: `Plan synthesis for ${severity.severity} ${intake.incidentType}`,
        outputData: dispatch,
        startedAt: dispatchStart,
        completedAt: new Date().toISOString(),
      });

      await recordAuditLog(incidentId, {
        action: 'dispatch_generated',
        actor_type: 'ai_agent',
        details: {
          priority: dispatch.priority,
          eta: dispatch.estimatedResponseTime,
        },
      });

      // 5. Visual Evidence & Human Verification Layer (if image provided)
      if (evidenceImage) {
        const visualEvidence = analyzeVisualEvidence(evidenceImage, intake, reportText, severity);
        await uploadAndCreateEvidence(incidentId, evidenceImage, visualEvidence);

        await recordAuditLog(incidentId, {
          action: 'evidence_uploaded',
          actor_type: 'operator',
          details: {
            fileName: evidenceImage.name,
            fileSize: evidenceImage.size,
          },
        });

        await recordAuditLog(incidentId, {
          action: 'evidence_analyzed',
          actor_type: 'ai_agent',
          details: {
            consistency: visualEvidence.analysis?.consistency,
            confidence: visualEvidence.analysis?.confidence,
            observationsCount: visualEvidence.analysis?.observations?.length || 0,
          },
        });
      }

      // Fetch the unified hydrated incident record from Supabase
      const fullIncident = await getIncidentById(incidentId);

      // Update in-memory store for fallback/sync
      if (fullIncident) {
        processedIncidents.unshift(fullIncident);
        return res.status(201).json(fullIncident);
      }

      // Graceful fallback if retrieval failed
      const fallbackRecord = {
        id: incidentId,
        timestamp: startTime,
        reportText,
        address: hasAddress ? address.trim() : (intake.location || 'Reported Location'),
        latitude: resolvedLat,
        longitude: resolvedLong,
        geocodedArea,
        intake,
        severity,
        resources,
        dispatch,
        evidence: evidenceImage ? analyzeVisualEvidence(evidenceImage, intake, reportText, severity) : null,
      };
      processedIncidents.unshift(fallbackRecord);
      res.status(201).json(fallbackRecord);
    } catch (err) {
      console.error('[incident route] pipeline failed:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // POST /api/incident/:id/verify — human operator submits visual evidence verification
  router.post('/incident/:id/verify', async (req, res) => {
    const { id } = req.params;
    const { verificationStatus, operatorDecision, operatorNotes } = req.body || {};

    try {
      // Update in Supabase
      await updateVerification(id, {
        verificationStatus,
        operatorDecision,
        operatorNotes,
      });

      // Fetch the updated hydrated incident from Supabase
      const updated = await getIncidentById(id);
      if (!updated) {
        return res.status(404).json({ error: `Incident with ID ${id} not found` });
      }

      // Update in-memory store cache
      const cacheIdx = processedIncidents.findIndex((inc) => inc.id === id);
      if (cacheIdx !== -1) {
        processedIncidents[cacheIdx] = updated;
      } else {
        processedIncidents.unshift(updated);
      }

      res.json(updated);
    } catch (err) {
      console.error('[incident route] verify failed:', err);

      // Check in-memory fallback
      const inMem = processedIncidents.find((inc) => inc.id === id);
      if (inMem && inMem.evidence) {
        const now = new Date().toISOString();
        inMem.evidence.verification = {
          status: verificationStatus || 'approved',
          operatorDecision: operatorDecision || 'supports_report',
          operatorNotes: String(operatorNotes || '').trim(),
          verifiedAt: now,
          verifiedBy: 'Duty Operations Commander',
        };
        return res.json(inMem);
      }

      res.status(500).json({ error: err.message || 'Verification update failed' });
    }
  });

  // GET /api/incidents — fetch all incidents directly from Supabase
  router.get('/incidents', async (req, res) => {
    try {
      const liveIncidents = await listAllIncidents();
      if (Array.isArray(liveIncidents) && liveIncidents.length > 0) {
        return res.json(liveIncidents);
      }

      // If Supabase table is empty or error, return in-memory cache sorted
      const sorted = [...processedIncidents].sort((a, b) => {
        const scoreA = a.severity?.severityScore ?? 0;
        const scoreB = b.severity?.severityScore ?? 0;
        return scoreB - scoreA;
      });
      res.json(sorted);
    } catch (err) {
      console.error('[incident route] fetch incidents failed:', err);
      res.json(processedIncidents);
    }
  });

  // GET /api/resources — fetch available emergency resources from Supabase
  router.get('/resources', async (req, res) => {
    try {
      const resourcesList = await listResources();
      res.json(resourcesList);
    } catch (err) {
      console.error('[incident route] fetch resources failed:', err);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });

  return router;
}

module.exports = createIncidentRouter;