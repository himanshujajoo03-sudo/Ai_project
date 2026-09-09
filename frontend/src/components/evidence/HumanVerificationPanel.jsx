import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit3,
  FileCheck,
  UserCheck,
  Clock,
  Send,
  Loader2
} from 'lucide-react';

export function HumanVerificationPanel({
  incidentId,
  evidence,
  onVerifySubmit,
  isCritical = false,
}) {
  if (!evidence) return null;

  const verification = evidence.verification || {};
  const image = evidence.image || {};
  const highRisk = evidence.highRiskFlag || {};
  const currentStatus = verification.status || 'pending';

  const [decision, setDecision] = useState(
    verification.operatorDecision || (evidence.analysis?.consistency === 'CONFLICT' ? 'conflicts_with_report' : 'supports_report')
  );
  const [notes, setNotes] = useState(verification.operatorNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleAction = async (status) => {
    setIsSubmitting(true);
    setFeedbackMessage('');
    try {
      await onVerifySubmit(incidentId, {
        verificationStatus: status,
        operatorDecision: decision,
        operatorNotes: notes,
      });
      setFeedbackMessage(`Verification recorded: ${status.toUpperCase()}`);
    } catch (err) {
      setFeedbackMessage(`Error: ${err.message || 'Failed to update verification'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadgeConfig = {
    pending: {
      label: '● Awaiting Human Verification',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
    },
    approved: {
      label: '✓ Evidence Verified (Operator Approved)',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    modified: {
      label: '⚠ Evidence Modified (Clarification Added)',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    rejected: {
      label: '✕ Evidence Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    inconclusive: {
      label: '? Unable to Verify',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
  }[currentStatus] || {
    label: currentStatus,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const isConflict = evidence.analysis?.consistency === 'CONFLICT';
  const showHighRiskAlert = isCritical || isConflict || highRisk.required;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 text-white">
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Human Operator Verification Panel
            </h3>
            <p className="text-xs text-slate-500">
              AI recommends. Human verifies visual evidence before final operational response.
            </p>
          </div>
        </div>

        {/* Verification Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeConfig.bg}`}>
          <span className={`h-2 w-2 rounded-full ${statusBadgeConfig.dot}`}></span>
          <span>{statusBadgeConfig.label}</span>
        </div>
      </div>

      {/* High-Risk Banner when CRITICAL or Conflict detected */}
      {showHighRiskAlert && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block uppercase tracking-wide text-red-800">
              High-Risk Human Verification Required
            </strong>
            <p className="mt-0.5 font-medium">
              {highRisk.reason || 'Critical incident response requires human command review.'}
            </p>
          </div>
        </div>
      )}

      {/* Evidence Preview & Photo Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
        {/* Photo Thumbnail */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Submitted Photo Evidence
          </span>
          <div className="w-full h-36 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center relative group">
            {image.dataUrl ? (
              <img
                src={image.dataUrl}
                alt={image.name || 'Incident Evidence'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-3 text-slate-400">
                <FileCheck className="w-8 h-8 mx-auto mb-1 text-slate-400" />
                <span className="text-[11px] block font-mono">No Image Preview</span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 p-1.5 text-[10px] text-slate-300 truncate font-mono">
              {image.name || 'evidence.jpg'} ({image.size || '1.8 MB'})
            </div>
          </div>
        </div>

        {/* Advisory Observations Snapshot */}
        <div className="md:col-span-2 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            AI Visual Observations (Advisory)
          </span>
          <div className="space-y-1">
            {(evidence.analysis?.observations || []).slice(0, 3).map((obs, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{obs}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] flex items-center gap-2">
            <span className="text-slate-500">Evidence Assessment:</span>
            <span className="font-bold text-slate-800 font-mono">
              {evidence.analysis?.consistency || 'SUPPORTS'}
            </span>
            <span className="text-slate-400">({Math.round((evidence.analysis?.confidence || 0.85) * 100)}% confidence)</span>
          </div>
        </div>
      </div>

      {/* Verification Decision Radios */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          Operator Verification Decision:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { id: 'supports_report', label: 'Evidence supports report' },
            { id: 'partially_supports', label: 'Evidence partially supports report' },
            { id: 'conflicts_with_report', label: 'Evidence conflicts with report' },
            { id: 'unable_to_verify', label: 'Unable to verify from image' },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                decision === opt.id
                  ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-semibold shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="operatorDecision"
                value={opt.id}
                checked={decision === opt.id}
                onChange={() => setDecision(opt.id)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Operator Notes Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          Operator Verification Notes:
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g. Structural damage and heavy rubble visually confirmed on-site by command staff..."
          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-900 leading-relaxed font-sans"
        />
      </div>

      {feedbackMessage && (
        <div className="p-2 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          {feedbackMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleAction('inconclusive')}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
        >
          Mark Inconclusive
        </button>

        <div className="flex items-center gap-2">
          {/* Reject */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('rejected')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Evidence</span>
          </button>

          {/* Modify */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('modified')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modify with Clarification</span>
          </button>

          {/* Approve */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('approved')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
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
  );
}
