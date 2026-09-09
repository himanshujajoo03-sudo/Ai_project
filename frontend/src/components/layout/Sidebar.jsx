import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Building2,
  FileCheck2,
  Bot,
  X,
  Server,
  Zap
} from 'lucide-react';

export function Sidebar({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  incidentCount = 0,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertTriangle,
      badge: incidentCount > 0 ? incidentCount : null,
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: Building2,
      badge: '12',
    },
    {
      id: 'plans',
      label: 'Response Plans',
      icon: FileCheck2,
      badge: null,
    },
    {
      id: 'activity',
      label: 'Agent Activity',
      icon: Bot,
      badge: 'Live',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-500 hover:text-slate-900 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectView(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                          isActive
                            ? 'bg-slate-800 text-slate-200'
                            : item.badge === 'Live'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Architecture Summary Box */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Multi-Agent Engine</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              4 specialized agents process reports autonomously: Intake → Severity → Resource → Dispatch.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-600 font-mono">
              <span>Failover:</span>
              <span className="text-emerald-700 font-semibold">0ms Fallback</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Backend API</span>
            </div>
            <span className="text-emerald-600 font-medium">Connected</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Emergency Port: 3000
          </p>
        </div>
      </aside>
    </>
  );
}
