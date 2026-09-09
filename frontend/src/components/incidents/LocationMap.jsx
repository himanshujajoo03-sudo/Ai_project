import React from 'react';
import { MapPin, Navigation, Building2, Shield, HeartPulse } from 'lucide-react';

export function LocationMap({ lat = 21.1458, long = 79.0882, location = 'MG Road, Nagpur', resources = [] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-50 text-blue-600">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight">
              Operational Geospatial Grid
            </h4>
            <p className="text-[11px] text-slate-500">
              Target coordinate and proximity radius
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {typeof lat === 'number' && typeof long === 'number' && !Number.isNaN(lat) && !Number.isNaN(long)
            ? `${lat.toFixed(4)}° N, ${long.toFixed(4)}° E`
            : 'Unspecified GPS · Address Only'}
        </div>
      </div>

      {/* Geospatial Radar / Tactical Map Visualizer */}
      <div className="relative w-full h-48 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Concentric Range Rings */}
        <div className="absolute w-36 h-36 rounded-full border border-slate-700/60 flex items-center justify-center">
          <span className="absolute -top-3 text-[9px] font-mono text-slate-500">1.0 km</span>
        </div>
        <div className="absolute w-24 h-24 rounded-full border border-slate-700/80 flex items-center justify-center">
          <span className="absolute -top-3 text-[9px] font-mono text-slate-500">0.5 km</span>
        </div>
        <div className="absolute w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 animate-ping"></div>

        {/* Center Target Marker (Incident) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-white text-[10px] font-bold border border-red-500/40 tracking-wider">
            {location}
          </span>
        </div>

        {/* Simulated Relative Vector Positions for Resources */}
        {resources.map((res, i) => {
          // Compute pseudo offset based on index and distance
          const angle = (i * 90 + 35) * (Math.PI / 180);
          const distRadius = Math.min(Math.max((res.distanceKm || 1) * 25, 30), 80);
          const x = Math.cos(angle) * distRadius;
          const y = Math.sin(angle) * distRadius;

          const isRescue = res.type === 'rescue_team';
          const isHospital = res.type === 'hospital';

          return (
            <div
              key={res.id || i}
              className="absolute z-10 flex flex-col items-center group cursor-pointer"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <div
                className={`w-4 h-4 rounded-full border border-white flex items-center justify-center text-white text-[9px] shadow-sm ${
                  isRescue
                    ? 'bg-blue-600'
                    : isHospital
                    ? 'bg-rose-600'
                    : 'bg-emerald-600'
                }`}
              >
                {isRescue ? 'R' : isHospital ? 'H' : 'S'}
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition px-1 py-0.2 bg-slate-900 text-white text-[9px] rounded font-mono whitespace-nowrap mt-0.5">
                {res.name} {res.distanceKm != null ? `(${res.distanceKm}km)` : '(Regional)'}
              </span>
            </div>
          );
        })}

        {/* Map Legend overlay */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] text-slate-300 font-mono border border-slate-800">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Incident
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Rescue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Medical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Shelter
          </span>
        </div>
      </div>
    </div>
  );
}
