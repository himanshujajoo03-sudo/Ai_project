import React from 'react';
import { AlertCircle, Flame, Building2, Truck } from 'lucide-react';

export function KpiBar({ incidents = [], resources = [] }) {
  const activeIncidents = incidents.length;
  const criticalIncidents = incidents.filter(
    (i) => String(i.severity?.severity || '').toUpperCase() === 'CRITICAL'
  ).length;

  const totalResources = resources.length || 12;
  const availableResources = resources.filter((r) => r.status === 'available').length || 9;
  const dispatchedResources = resources.filter((r) => r.status === 'dispatched').length || 1;

  const kpis = [
    {
      id: 'active',
      title: 'Active Incidents',
      value: activeIncidents,
      sublabel: 'Under active response',
      icon: AlertCircle,
      accent: 'text-slate-900',
      bg: 'bg-white',
      border: 'border-slate-200',
    },
    {
      id: 'critical',
      title: 'Critical Incidents',
      value: criticalIncidents,
      sublabel: 'Immediate life-safety priority',
      icon: Flame,
      accent: 'text-red-600',
      bg: 'bg-red-50/40',
      border: 'border-red-200',
    },
    {
      id: 'available',
      title: 'Available Resources',
      value: `${availableResources} / ${totalResources}`,
      sublabel: 'Hospitals, squads & shelters',
      icon: Building2,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-200',
    },
    {
      id: 'dispatched',
      title: 'Dispatched Units',
      value: dispatchedResources,
      sublabel: 'En route / deployed on scene',
      icon: Truck,
      accent: 'text-blue-600',
      bg: 'bg-blue-50/40',
      border: 'border-blue-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`p-4 rounded-xl border ${kpi.bg} ${kpi.border} shadow-sm transition hover:shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`p-1.5 rounded-md ${kpi.accent} bg-white shadow-xs border border-slate-100`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl lg:text-3xl font-black tracking-tight ${kpi.accent}`}>
                {kpi.value}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 truncate">{kpi.sublabel}</p>
          </div>
        );
      })}
    </div>
  );
}
