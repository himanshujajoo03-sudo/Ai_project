import React from 'react';
import { ResourceTypeBadge } from '../common/Badge';
import { ShieldCheck, MapPin, CheckCircle, Clock } from 'lucide-react';

export function ResourceList({ resources = [], title = 'Matched Emergency Resources', subtitle = 'Ranked proximity allocation from regional registry' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {resources.length} Allocated
        </span>
      </div>

      {/* Table */}
      {resources.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No resources currently allocated.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-2.5 px-4">Resource Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Proximity</th>
                <th className="py-2.5 px-4">Capacity / Load</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.map((res) => {
                const occupancyPercent = res.capacity > 0
                  ? Math.round((res.currentOccupancy / res.capacity) * 100)
                  : 0;
                const isAvailable = res.status === 'available';

                return (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{res.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {res.id}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <ResourceTypeBadge type={res.type} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{res.distanceKm !== undefined ? `${res.distanceKm} km` : 'Regional'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-600 font-medium">
                          {res.currentOccupancy} / {res.capacity}
                        </span>
                        <span className="text-slate-400">{occupancyPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyPercent > 85
                              ? 'bg-red-500'
                              : occupancyPercent > 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : res.status === 'dispatched'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isAvailable ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        />
                        {isAvailable ? 'Available' : res.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
