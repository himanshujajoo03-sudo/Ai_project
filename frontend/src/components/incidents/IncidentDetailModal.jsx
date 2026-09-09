import React, { useState, useEffect } from 'react';
import { SeverityBadge, TypeBadge } from '../common/Badge';
import { AgentPipeline } from './AgentPipeline';
import { SeverityPanel } from './SeverityPanel';
import { ResponsePlanCard } from '../response/ResponsePlanCard';
import { ResourceList } from '../resources/ResourceList';
import { LocationMap } from './LocationMap';
import { VisualEvidenceCard } from '../evidence/VisualEvidenceCard';
import { VerificationAuditTrail } from '../evidence/VerificationAuditTrail';
import { X, Clock, MapPin, Users, Tag, AlertTriangle, Camera } from 'lucide-react';

export function IncidentDetailModal({
  incident,
  onClose,
  onIncidentUpdated,
  onOpenVerification,
}) {
  if (!incident) return null;

  const [activeIncident, setActiveIncident] = useState(incident);

  useEffect(() => {
    if (incident) {
      setActiveIncident(incident);
    }
  }, [incident]);

  const intake = activeIncident.intake || {};
  const severity = activeIncident.severity || {};
  const resources = activeIncident.resources || [];
  const dispatch = activeIncident.dispatch || {};
  const evidence = activeIncident.evidence || null;
  const hazards = Array.isArray(intake.reportedHazards) ? intake.reportedHazards : [];

  const renderVerificationBadge = (status = 'pending') => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            ✕ Rejected
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            ⚠ Modified
          </span>
        );
      case 'inconclusive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            ? Inconclusive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
            ● Pending Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-900">
                  Incident Triage & Response
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  ID: #{activeIncident.id?.slice(0, 8)}
                </span>
                <SeverityBadge severity={severity.severity} />

                {evidence && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    <Camera className="w-3 h-3 text-blue-600" />
                    <span>Visual Evidence Attached</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activeIncident.timestamp ? new Date(activeIncident.timestamp).toLocaleString() : 'Just now'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {intake.location || 'Reported Scene'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Raw Incident Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Incoming Distress Dispatch Call
              </span>
              <TypeBadge type={intake.incidentType} />
            </div>

            <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-200/80 font-sans">
              "{activeIncident.reportText}"
            </p>

            {/* Quick stats tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Estimated Affected: <strong className="font-bold text-slate-900">{intake.peopleAffectedEstimate ?? 0} individuals</strong></span>
              </div>

              {hazards.length > 0 && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hazards:</span>
                  <div className="flex flex-wrap gap-1">
                    {hazards.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Visual Multi-Agent Pipeline */}
          <AgentPipeline incident={activeIncident} />

          {/* Section 3: Evidence & Human Verification Layer */}
          {evidence ? (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Evidence & Human Verification Layer</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI visual analysis is advisory. Operational decisions require human confirmation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenVerification) {
                        onOpenVerification(activeIncident);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {evidence.verification?.status && evidence.verification.status !== 'pending'
                        ? 'Review Verification'
                        : 'Verify Evidence'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Side-by-side: Visual Analysis & Operator Status Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <VisualEvidenceCard evidence={evidence} />

                {/* Verification Status & Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Verification Status
                      </span>
                      {renderVerificationBadge(evidence.verification?.status)}
                    </div>

                    {/* Image Preview Thumbnail */}
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                        {evidence.image?.dataUrl ? (
                          <img
                            src={evidence.image.dataUrl}
                            alt="Evidence"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-slate-800 truncate">
                          {evidence.image?.name || 'evidence.jpg'}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {evidence.image?.size || 'Attached'} · {evidence.image?.type || 'image/jpeg'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Assessment: <strong>{evidence.analysis?.consistency || 'SUPPORTS'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Operator Decision & Notes */}
                    {evidence.verification?.verifiedAt ? (
                      <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            Decision: <strong className="text-slate-800 font-semibold">{evidence.verification.operatorDecision?.replace(/_/g, ' ') || 'Confirmed'}</strong>
                          </span>
                          <span>{new Date(evidence.verification.verifiedAt).toLocaleTimeString()}</span>
                        </div>
                        {evidence.verification.operatorNotes && (
                          <p className="text-slate-700 italic">
                            "{evidence.verification.operatorNotes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-lg">
                        Photographic evidence has been analyzed by the vision layer and is awaiting human commander verification.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenVerification) {
                        onOpenVerification(activeIncident);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {evidence.verification?.status && evidence.verification.status !== 'pending'
                        ? 'Update / Review Verification'
                        : 'Verify Evidence'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Audit Trail */}
              <VerificationAuditTrail auditTrail={evidence.auditTrail} />
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>No Visual Evidence Submitted:</strong> Response plan and resource allocations proceed based on 4-agent natural-language triage.
              </span>
            </div>
          )}

          {/* Section 4: Severity Assessment & Geospatial Grid Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SeverityPanel severity={severity} />
            <LocationMap
              lat={intake.lat ?? 21.1458}
              long={intake.long ?? 79.0882}
              location={intake.location || 'Target Site'}
              resources={resources}
            />
          </div>

          {/* Section 5: Matched Emergency Resources */}
          <ResourceList
            resources={resources}
            title="Matched Emergency Resources for Site"
            subtitle={`Allocated strictly from regional database to address ${intake.incidentType?.replace(/_/g, ' ') || 'incident'}`}
          />

          {/* Section 6: Coordinated Response Plan */}
          <ResponsePlanCard dispatch={dispatch} severity={severity} />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500">
            Disaster Response Coordinator · Human-in-the-Loop Operational Verification
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition cursor-pointer"
          >
            Close Triage Details
          </button>
        </div>
      </div>
    </div>
  );
}
