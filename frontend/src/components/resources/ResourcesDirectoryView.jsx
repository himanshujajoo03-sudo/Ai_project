import React, { useState } from 'react';
import { REGIONAL_RESOURCES } from '../../services/api';
import { ResourceTypeBadge } from '../common/Badge';
import { Building2, Search, Shield, HeartPulse, Home, MapPin, CheckCircle, Clock } from 'lucide-react';

export function ResourcesDirectoryView() {
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const resources = REGIONAL_RESOURCES;

  const filtered = resources.filter((r) => {
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    }
    return true;
  });

  const availableCount = resources.filter((r) => r.status === 'available').length;
  const dispatchedCount = resources.filter((r) => r.status === 'dispatched').length;
  const fullCount = resources.filter((r) => r.status === 'full').length;
  const totalCapacity = resources.reduce((acc, r) => acc + (r.capacity || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Emergency Resources & Facility Directory</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            12 Regional Assets
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time tracking and operational availability of rescue squads, trauma centers, and relief shelters.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">Available Units</span>
          <div className="text-2xl font-black text-emerald-600">{availableCount}</div>
          <p className="text-[11px] text-slate-500">Ready for instant dispatch</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">In-Field Deployed</span>
          <div className="text-2xl font-black text-blue-600">{dispatchedCount}</div>
          <p className="text-[11px] text-slate-500">Active on emergency scene</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">At Max Capacity</span>
          <div className="text-2xl font-black text-amber-600">{fullCount}</div>
          <p className="text-[11px] text-slate-500">Redirecting to secondary sites</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">Regional Capacity</span>
          <div className="text-2xl font-black text-slate-900">{totalCapacity}</div>
          <p className="text-[11px] text-slate-500">Total beds & personnel</p>
        </div>
      </div>

      {/* Filter and Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter unit or facility name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Type tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[
                { id: 'ALL', label: 'All Types' },
                { id: 'rescue_team', label: 'Rescue Squads' },
                { id: 'hospital', label: 'Hospitals' },
                { id: 'shelter', label: 'Shelters' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[
                { id: 'ALL', label: 'All Status' },
                { id: 'available', label: 'Available' },
                { id: 'dispatched', label: 'Dispatched' },
                { id: 'full', label: 'Full' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterStatus === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Resource / Unit</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Capacity Load</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((res) => {
                const occupancyPercent = res.capacity > 0
                  ? Math.round((res.currentOccupancy / res.capacity) * 100)
                  : 0;

                return (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{res.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {res.id}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ResourceTypeBadge type={res.type} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      {res.latitude.toFixed(4)}° N, {res.longitude.toFixed(4)}° E
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-700 font-medium">
                          {res.currentOccupancy} / {res.capacity}
                        </span>
                        <span className="text-slate-400">{occupancyPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyPercent >= 100
                              ? 'bg-red-500'
                              : occupancyPercent > 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                          res.status === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : res.status === 'dispatched'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            res.status === 'available' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        />
                        {res.status === 'available' ? 'Available' : res.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
