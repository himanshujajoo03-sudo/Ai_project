import React, { useState, useEffect } from 'react';
import { SeverityBadge, TypeBadge } from '../common/Badge';
import { VerificationAuditTrail } from './VerificationAuditTrail';
import { submitVerificationDecision } from '../../services/api';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Edit3,
  Users,
  MapPin,
  ShieldAlert,
  Loader2,
  FileCheck,
} from 'lucide-react';

export function EvidenceVerificationPanel({
  incident,
  onClose,
  onIncidentUpdated,
}) {
  if (!incident || !incident.evidence) return null;

  const intake = incident.intake || {};
  const severity = incident.severity || {};
  const evidence = incident.evidence || {};
  const image = evidence.image || {};
  const analysis = evidence.analysis || {};
  const verification = evidence.verification || {};
  const highRisk = evidence.highRiskFlag || {};
  const observations = Array.isArray(analysis.observations) ? analysis.observations : [];
  const confidence = Math.round((analysis.confidence || 0.85) * 100);

  const isCritical = String(severity.severity || '').toUpperCase() === 'CRITICAL';
  const isConflict = analysis.consistency === 'CONFLICT';
  const isLowConfidence = (analysis.confidence || 1) < 0.75;
  const isHighRisk = isCritical || isConflict || isLowConfidence || highRisk.required;

  // Initialize decision & notes
  const [decision, setDecision] = useState(
    verification.operatorDecision ||
      (isConflict ? 'conflicts_with_report' : 'supports_report')
  );
  const [notes, setNotes] = useState(verification.operatorNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleAction = async (status) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const updated = await submitVerificationDecision(incident.id, {
        verificationStatus: status,
        operatorDecision: decision,
        operatorNotes: notes,
      });

      if (onIncidentUpdated) {
        onIncidentUpdated(updated);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record verification decision.');
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    pending: {
      label: 'Pending Verification',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
    },
    approved: {
      label: 'Verified (Approved)',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    modified: {
      label: 'Modified',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },
    inconclusive: {
      label: 'Inconclusive',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
  }[verification.status || 'pending'] || {
    label: verification.status || 'Pending',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const assessmentOptions = [
    {
      id: 'supports_report',
      label: 'Supports Report',
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      id: 'partially_supports',
      label: 'Partially Supports',
      icon: AlertTriangle,
      color: 'text-amber-600',
    },
    {
      id: 'conflicts_with_report',
      label: 'Conflicts With Report',
      icon: AlertCircle,
      color: 'text-rose-600',
    },
    {
      id: 'unable_to_verify',
      label: 'Unable to Verify',
      icon: HelpCircle,
      color: 'text-slate-500',
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={isSubmitting ? undefined : onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer Container: Slide-over right on desktop, full-screen on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <Camera className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="drawer-title"
                  className="text-base font-bold text-slate-900 tracking-tight"
                >
                  Evidence Verification
                </h2>
                <span className="font-mono text-xs text-slate-400">
                  #{incident.id?.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Human-in-the-loop operational review of photographic evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Current Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
              <span>{statusConfig.label}</span>
            </span>

            {/* Close Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Subtle Advisory Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Advisory Notice:</strong> AI visual analysis is advisory. Final verification is performed by the operator. Operational actions and dispatch remain intact.
            </p>
          </div>

          {/* High-Risk Banner if Critical / Conflict */}
          {isHighRisk && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block uppercase tracking-wide text-amber-800">
                  ⚠ High-Risk Incident Review Required
                </strong>
                <p className="mt-0.5 font-medium">
                  {highRisk.reason ||
                    'High severity or potential evidence divergence detected. Please verify carefully.'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* 1. Incident Overview */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Incident Summary
              </span>
              <div className="flex items-center gap-1.5">
                <TypeBadge type={intake.incidentType} />
                <SeverityBadge severity={severity.severity} />
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed font-sans">
                "{incident.reportText}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{intake.location || 'Reported Scene'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  <strong>{intake.peopleAffectedEstimate ?? 0}</strong> people affected
                </span>
              </div>
            </div>
          </div>

          {/* 2. Uploaded Evidence Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Uploaded Evidence
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {image.name || 'evidence.jpg'} ({image.size || 'Attached'})
              </span>
            </div>

            <div className="w-full rounded-xl border border-slate-200 bg-slate-900/5 overflow-hidden flex items-center justify-center relative max-h-64 sm:max-h-72">
              {image.dataUrl ? (
                <img
                  src={image.dataUrl}
                  alt={image.name || 'Evidence preview'}
                  className="w-full h-full max-h-64 sm:max-h-72 object-contain bg-slate-950/5"
                />
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <FileCheck className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No preview available</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. AI Visual Observations */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                AI Visual Observations
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                Confidence: {confidence}%
              </span>
            </div>

            {observations.length > 0 ? (
              <div className="space-y-1.5">
                {observations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{obs}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No distinct observations recorded.
              </p>
            )}

            {analysis.consistencyDetail && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                AI Consistency Note: {analysis.consistencyDetail}
              </p>
            )}
          </div>

          {/* 4. Evidence Assessment */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Evidence Assessment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {assessmentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = decision === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="evidenceAssessment"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setDecision(opt.id)}
                      className="hidden"
                    />
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-blue-400' : opt.color
                      }`}
                    />
                    <span className="font-semibold">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 5. Operator Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Operator Notes
            </label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter operator observations, confirmation details, or instructions..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 font-sans leading-relaxed transition"
            />
          </div>

          {/* Audit Trail (if present) */}
          {evidence.auditTrail && evidence.auditTrail.length > 0 && (
            <VerificationAuditTrail auditTrail={evidence.auditTrail} />
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Inconclusive / Unable to verify */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('inconclusive')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer text-center"
          >
            Unable to Verify
          </button>

          <div className="flex items-center gap-2">
            {/* Reject */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('rejected')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            {/* Modify */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('modified')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modify</span>
            </button>

            {/* Approve Evidence */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('approved')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Approve Evidence</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
