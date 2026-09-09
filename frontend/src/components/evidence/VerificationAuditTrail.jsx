import React from 'react';
import { History, Clock, CheckCircle2, User, FileText, AlertCircle } from 'lucide-react';

export function VerificationAuditTrail({ auditTrail = [] }) {
  if (!auditTrail || auditTrail.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-100 text-slate-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight">
              Verification Audit Trail & History
            </h4>
            <p className="text-[11px] text-slate-500">
              Immutable chronological decision log for emergency accountability
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          {auditTrail.length} Events
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {auditTrail.map((event, idx) => {
          const isOperatorAction = event.action?.toLowerCase().includes('operator');
          const isAnalysis = event.action?.toLowerCase().includes('analysis');

          return (
            <div key={idx} className="relative group text-xs">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                  isOperatorAction
                    ? 'bg-emerald-600'
                    : isAnalysis
                    ? 'bg-blue-600'
                    : 'bg-slate-400'
                }`}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-bold text-slate-900">
                  {event.action}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Recent'}
                </span>
              </div>

              {event.details && (
                <p className="mt-0.5 text-slate-600 font-sans text-[11px] leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                  {event.details}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
