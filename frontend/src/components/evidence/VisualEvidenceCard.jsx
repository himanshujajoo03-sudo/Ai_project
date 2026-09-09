import React from 'react';
import { Eye, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export function VisualEvidenceCard({ evidence }) {
  if (!evidence) return null;

  const analysis = evidence.analysis || {};
  const observations = Array.isArray(analysis.observations) ? analysis.observations : [];
  const confidence = Math.round((analysis.confidence || 0.85) * 100);
  const consistency = analysis.consistency || 'SUPPORTS';
  const consistencyDetail = analysis.consistencyDetail || 'Evidence evaluated against incident report.';

  const consistencyBadge = {
    SUPPORTS: {
      label: '✓ Evidence Supports Report',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    PARTIAL: {
      label: '⚠ Evidence Partially Supports Report',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
    },
    CONFLICT: {
      label: '⚠ Evidence Conflict Detected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertCircle,
    },
    INCONCLUSIVE: {
      label: '? Evidence is Inconclusive',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: HelpCircle,
    },
  }[consistency] || {
    label: consistency,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Eye,
  };

  const ConsistencyIcon = consistencyBadge.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Visual Evidence AI Observations
            </h3>
            <span className="text-[11px] text-slate-500">
              Advisory visual analysis · Model Confidence: {confidence}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
            {analysis.evidenceType || 'Advisory'}
          </span>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Analysis Completed
          </span>
        </div>
      </div>

      {/* Consistency Evaluation Tag */}
      <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${consistencyBadge.bg}`}>
        <ConsistencyIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold block">{consistencyBadge.label}</span>
          <p className="font-normal opacity-90 mt-0.5">{consistencyDetail}</p>
        </div>
      </div>

      {/* Observed Visual Observations */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Physical On-Scene Observations ({observations.length}):
        </span>
        <div className="space-y-1.5">
          {observations.map((obs, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs p-2 rounded-md bg-slate-50 border border-slate-200/70 text-slate-800"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{obs}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Advisory Disclaimer */}
      <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          <strong>Advisory Notice:</strong> Visual analysis does not determine final severity, resource matching, or dispatch decisions. Human operator verification is required.
        </p>
      </div>
    </div>
  );
}
