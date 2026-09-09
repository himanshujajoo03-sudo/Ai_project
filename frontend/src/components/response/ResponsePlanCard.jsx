import React from 'react';
import { FileCheck2, Clock, Radio, CheckCircle, ShieldCheck } from 'lucide-react';

export function ResponsePlanCard({ dispatch, severity }) {
  if (!dispatch) return null;

  const actionPlan = Array.isArray(dispatch.actionPlan) ? dispatch.actionPlan : [];
  const alertMessage = dispatch.alertMessage || 'Incident dispatched. Emergency teams deployed to site.';
  const responseTime = dispatch.estimatedResponseTime || '10-15 minutes';
  const priority = severity?.severity || 'HIGH';

  return (
    <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Coordinated Tactical Dispatch Plan
            </h3>
            <p className="text-xs text-slate-500">
              Synthesized by Dispatch Agent for on-scene field commanders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>ETA: {responseTime}</span>
          </div>
        </div>
      </div>

      {/* Broadcast Alert Box */}
      <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200/80 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
          <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Emergency Broadcast Alert Message</span>
        </div>
        <p className="text-blue-950 font-medium leading-relaxed bg-white/70 p-2 rounded border border-blue-200/40">
          "{alertMessage}"
        </p>
      </div>

      {/* Numbered Operational Action Steps */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Tactical Execution Sequence ({actionPlan.length} Steps)
        </h4>

        <div className="space-y-2">
          {actionPlan.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
