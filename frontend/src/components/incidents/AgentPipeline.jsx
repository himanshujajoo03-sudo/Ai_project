import React from 'react';
import { CheckCircle2, FileText, Activity, ShieldCheck, Truck, ChevronRight, ArrowDown } from 'lucide-react';

export function AgentPipeline({ incident }) {
  if (!incident) return null;

  const intake = incident.intake || {};
  const severity = incident.severity || {};
  const resources = incident.resources || [];
  const dispatch = incident.dispatch || {};
  const llmStatus = incident.llmStatus || {};

  const stages = [
    {
      id: 'intake',
      step: '01',
      name: 'Intake Agent',
      icon: FileText,
      status: 'Completed',
      headline: intake.incidentType ? `${intake.incidentType.replace('_', ' ').toUpperCase()}` : 'Structured Extracted',
      detail: `${intake.peopleAffectedEstimate ?? 0} affected · ${(intake.reportedHazards || []).length} hazards`,
      tag: 'LLM Parser',
      provider: intake.llmStatus?.provider || llmStatus.provider || 'groq',
    },
    {
      id: 'severity',
      step: '02',
      name: 'Severity Agent',
      icon: Activity,
      status: 'Completed',
      headline: `${severity.severity || 'UNKNOWN'} · Score ${severity.severityScore || 3}/5`,
      detail: `${Math.round((severity.confidence || 0.85) * 100)}% confidence · ${(severity.signals || []).length} signals`,
      tag: 'Risk Reasoning',
      provider: severity.source || severity.llmStatus?.provider || 'groq',
    },
    {
      id: 'resource',
      step: '03',
      name: 'Resource Matching',
      icon: ShieldCheck,
      status: 'Completed',
      headline: `${resources.length} Assets Assigned`,
      detail: resources.length > 0 ? `${resources[0].name.slice(0, 18)}...` : 'Nearest available units',
      tag: 'Proximity Engine',
      provider: 'Deterministic DB',
    },
    {
      id: 'dispatch',
      step: '04',
      name: 'Dispatch Agent',
      icon: Truck,
      status: 'Completed',
      headline: dispatch.estimatedResponseTime || 'Response Ready',
      detail: `${(dispatch.actionPlan || []).length} Tactical steps synthesized`,
      tag: 'Tactical Coordinator',
      provider: dispatch.llmStatus?.provider || llmStatus.provider || 'groq',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Multi-Agent Autonomous Processing Pipeline</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              4/4 Complete
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            End-to-end incident ingestion, hazard triage, resource allocation, and dispatch synthesis
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="text-[11px]">Primary Model:</span>
          <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            openai/gpt-oss-120b
          </span>
        </div>
      </div>

      {/* Desktop Horizontal / Mobile Vertical Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="relative flex flex-col">
              <div className="flex-1 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {stage.step}
                    </span>
                    <span className="font-bold text-xs text-slate-800">
                      {stage.name}
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>

                {/* Body Content */}
                <div className="pt-1">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {stage.headline}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {stage.detail}
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                  <span className="font-medium text-slate-400 uppercase tracking-wider">
                    {stage.tag}
                  </span>
                  <span className="text-slate-600 font-mono">
                    {stage.provider}
                  </span>
                </div>
              </div>

              {/* Connector Arrows (Desktop: Right arrow, Mobile: Down arrow) */}
              {idx < stages.length - 1 && (
                <>
                  <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white border border-slate-300 items-center justify-center text-slate-400 shadow-xs">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <div className="flex md:hidden justify-center my-1 text-slate-300">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
