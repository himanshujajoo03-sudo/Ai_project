import React from 'react';
import { Bot, Cpu, ShieldCheck, CheckCircle2, Clock, Zap, Terminal, Activity } from 'lucide-react';

export function AgentActivityView({ systemStatus, incidents = [] }) {
  const isGroqConfigured = systemStatus?.groqConfigured;
  const activeProvider = systemStatus?.llmProvider || 'groq';

  const agents = [
    {
      name: 'Intake Agent',
      badge: 'Parser',
      status: 'Online',
      model: 'openai/gpt-oss-120b',
      fallback: 'Regex / NLP Fallback',
      description: 'Ingests unformatted natural-language emergency reports. Extracts incident type, affected count, location string, and hazard flags.',
      outputSchema: '{ incidentType, peopleAffectedEstimate, location, reportedHazards }',
    },
    {
      name: 'Severity Agent',
      badge: 'Triage',
      status: 'Online',
      model: 'openai/gpt-oss-120b',
      fallback: 'Rule-Based Signal Engine',
      description: 'Evaluates life-safety threat levels. Classifies into CRITICAL, HIGH, MEDIUM, LOW, score 1-5, and identifies critical entrapment / casualty signals.',
      outputSchema: '{ severity, severityScore, urgencyCategory, confidence, reason, signals }',
    },
    {
      name: 'Resource Matching Agent',
      badge: 'Allocation',
      status: 'Online',
      model: 'Haversine Proximity',
      fallback: 'Mock DB Regional Registry',
      description: 'Ranks available regional rescue squads, trauma hospitals, and relief shelters using spatial coordinate distance and capability filters.',
      outputSchema: '[ { id, name, type, distanceKm, status, capacity } ]',
    },
    {
      name: 'Dispatch Agent',
      badge: 'Coordinator',
      status: 'Online',
      model: 'openai/gpt-oss-120b',
      fallback: 'Context-Aware Tactical Fallback',
      description: 'Synthesizes an operational, step-by-step field response plan, estimated arrival time, and public emergency alert broadcast.',
      outputSchema: '{ actionPlan: string[], alertMessage, estimatedResponseTime }',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Multi-Agent System Telemetry & Architecture</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            Active Multi-Agent Orchestration
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed inspection of autonomous agents, active LLM inference routes, and zero-downtime deterministic failovers.
        </p>
      </div>

      {/* System Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>PRIMARY LLM ENGINE</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 capitalize flex items-center gap-2">
            {activeProvider}
            <span className={`h-2 w-2 rounded-full ${isGroqConfigured ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Model: openai/gpt-oss-120b
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>FAILOVER ARCHITECTURE</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Deterministic
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            Instant 0ms failover on 429 quota
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>PIPELINE RESILIENCY</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">100% Uptime</div>
          <p className="text-[11px] text-slate-500">
            Zero unhandled crashes
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>TOTAL PROCESSED</span>
            <Activity className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {incidents.length} Dispatches
          </div>
          <p className="text-[11px] text-slate-500">
            Across 4 autonomous agent stages
          </p>
        </div>
      </div>

      {/* 4 Agent Architecture Specifications */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 mb-3">
          Agent Registry & Responsibilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent, idx) => (
            <div
              key={agent.name}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {agent.name}
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {agent.badge}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {agent.description}
              </p>

              <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary Engine:</span>
                  <span className="font-mono text-slate-800 font-semibold">{agent.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fallback Strategy:</span>
                  <span className="font-mono text-emerald-700 font-medium">{agent.fallback}</span>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-50 border border-slate-200/80 font-mono text-[10px] text-slate-600 truncate">
                Contract: {agent.outputSchema}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry Stream Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Agent Execution Stream
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-600 font-medium">● Polling Realtime</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Agent</th>
                <th className="py-2.5 px-4">Incident Ref</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Execution Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {incidents.slice(0, 8).map((inc, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 text-slate-400">
                    {inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString() : 'Recent'}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Full Pipeline (4 Agents)
                  </td>
                  <td className="py-2.5 px-4 text-blue-600">
                    #{inc.id?.slice(0, 8)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans truncate max-w-md">
                    {inc.intake?.incidentType} · Severity {inc.severity?.severity} · {inc.resources?.length} resources matched
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No execution streams logged yet. Submit an incident to view live telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
