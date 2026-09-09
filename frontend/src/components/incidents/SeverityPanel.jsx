import React from 'react';
import { SeverityBadge } from '../common/Badge';
import { ShieldAlert, Activity, CheckCircle2, Tag, Info } from 'lucide-react';

export function SeverityPanel({ severity }) {
  if (!severity) return null;

  const score = severity.severityScore || 3;
  const confidence = Math.round((severity.confidence || 0.85) * 100);
  const signals = Array.isArray(severity.signals) ? severity.signals : [];
  const reason = severity.reason || severity.reasoning || 'Evaluated based on hazard patterns and affected volume.';

  const isCritical = String(severity.severity || '').toUpperCase() === 'CRITICAL';
  const isHigh = String(severity.severity || '').toUpperCase() === 'HIGH';

  return (
    <div className={`p-5 rounded-xl border bg-white shadow-sm space-y-4 ${
      isCritical ? 'border-red-200' : isHigh ? 'border-orange-200' : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isCritical ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Severity & Life Safety Assessment
            </h3>
            <span className="text-[11px] text-slate-500">
              Assessed via {severity.source === 'groq' ? 'Groq Reasoning Engine' : 'Deterministic Triage Fallback'}
            </span>
          </div>
        </div>

        <SeverityBadge severity={severity.severity} size="lg" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Severity Score */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
            Severity Score
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{score}</span>
            <span className="text-xs text-slate-500">/ 5</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                score >= 5
                  ? 'bg-red-600'
                  : score === 4
                  ? 'bg-orange-500'
                  : score === 3
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${(score / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Urgency Category */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
            Urgency Level
          </span>
          <span className="text-lg font-bold text-slate-900 capitalize block">
            {severity.urgencyCategory || 'Standard'}
          </span>
          <span className="text-[10px] text-slate-500">Immediate mobilization</span>
        </div>

        {/* Confidence */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
            Model Confidence
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{confidence}%</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Validated
          </span>
        </div>
      </div>

      {/* Reasoning Statement */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Triage Assessment Rationale</span>
        </div>
        <p className="text-slate-600 leading-relaxed font-sans">
          "{reason}"
        </p>
      </div>

      {/* Detected Signals */}
      {signals.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-slate-700 block mb-2">
            Identified Risk Signals ({signals.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {signals.map((sig, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                {sig.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
