import React from 'react';
import { ShieldAlert, Activity, Cpu, Plus, Menu } from 'lucide-react';

export function Header({
  systemStatus,
  activeCount = 0,
  onOpenReport,
  onToggleMobileMenu,
}) {
  const isGroqConfigured = systemStatus?.groqConfigured;
  const activeProvider = systemStatus?.llmProvider || 'groq';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Brand & System Badges */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 text-white shadow-sm">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  Disaster Response Coordinator
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                  Control Room
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500">
                AI-assisted emergency intelligence and response coordination
              </p>
            </div>
          </div>

          {/* Operational Status Indicators */}
          <div className="hidden xl:flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>
                AI Engine: <strong className="font-semibold capitalize">{activeProvider}</strong>
              </span>
              <span className="text-[10px] px-1 py-0.2 bg-blue-100 rounded text-blue-700 font-mono">
                {isGroqConfigured ? 'Live' : 'Fallback Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Counters */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500 border-r border-slate-200 pr-4">
            <div className="text-right">
              <span className="block text-slate-900 font-bold text-sm leading-tight">
                {activeCount} Active
              </span>
              <span className="text-[11px] text-slate-500">Incidents</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-900 font-bold text-sm leading-tight">
                Nagpur Ops
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Live Telemetry</span>
            </div>
          </div>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-red-400" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>
    </header>
  );
}
