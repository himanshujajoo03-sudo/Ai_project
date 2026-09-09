import React, { useState } from 'react';
import { SeverityBadge, TypeBadge } from '../common/Badge';
import {
  Search,
  ChevronRight,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export function IncidentTable({
  incidents = [],
  onSelectIncident,
  onOpenReport,
  onOpenVerification,
  isLoading = false,
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filterTabs = [
    { id: 'ALL', label: 'All Incidents' },
    { id: 'CRITICAL', label: 'Critical' },
    { id: 'HIGH', label: 'High' },
    { id: 'MEDIUM', label: 'Moderate' },
    { id: 'LOW', label: 'Low' },
  ];

  const filteredIncidents = incidents.filter((incident) => {
    const sev = String(incident.severity?.severity || '').toUpperCase();
    if (filterSeverity !== 'ALL' && sev !== filterSeverity) {
      return false;
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const text = String(incident.reportText || '').toLowerCase();
      const loc = String(incident.intake?.location || '').toLowerCase();
      const type = String(incident.intake?.incidentType || '').toLowerCase();
      return text.includes(q) || loc.includes(q) || type.includes(q);
    }
    return true;
  });

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins === 1) return '1 min ago';
      if (mins < 60) return `${mins} mins ago`;
      const hours = Math.floor(mins / 60);
      return `${hours}h ago`;
    } catch {
      return 'Recent';
    }
  };

  const renderEvidenceCell = (incident) => {
    if (!incident.evidence) {
      return (
        <span className="text-[11px] text-slate-400 font-medium">
          No Evidence
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Camera className="w-3 h-3 text-blue-600" />
        <span>📷 Evidence</span>
      </span>
    );
  };

  const renderActionArea = (incident) => {
    // If no uploaded image, do NOT show a verification button.
    if (!incident.evidence) {
      return (
        <div className="flex items-center justify-end gap-2">
          <span className="text-[11px] text-slate-400 font-medium sm:hidden">No Evidence</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectIncident(incident);
            }}
            className="inline-flex items-center gap-1 font-semibold text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    const verification = incident.evidence.verification || {};
    const status = verification.status || 'pending';
    const analysis = incident.evidence.analysis || {};
    const severity = incident.severity?.severity || '';
    const isCritical = String(severity).toUpperCase() === 'CRITICAL';
    const isConflict = analysis.consistency === 'CONFLICT';
    const isLowConfidence = (analysis.confidence || 1) < 0.75;
    const isHighRisk = isCritical || isConflict || isLowConfidence || incident.evidence.highRiskFlag?.required;

    const handleVerifyClick = (e) => {
      e.stopPropagation();
      if (onOpenVerification) {
        onOpenVerification(incident);
      }
    };

    // Approved status
    if (status === 'approved') {
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleVerifyClick}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
            title="Evidence verified. Click to inspect or re-verify."
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>✓ Verified</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectIncident(incident);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="View Triage Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Rejected status
    if (status === 'rejected') {
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleVerifyClick}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
            title="Evidence rejected. Click to review."
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>✕ Rejected</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectIncident(incident);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="View Triage Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Modified status
    if (status === 'modified') {
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleVerifyClick}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
            title="Evidence modified. Click to review."
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>⚠ Modified</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectIncident(incident);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="View Triage Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Inconclusive status
    if (status === 'inconclusive') {
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleVerifyClick}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="Unable to verify. Click to re-open."
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>? Inconclusive</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectIncident(incident);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="View Triage Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Pending: High Risk
    if (isHighRisk) {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Review Required</span>
          </span>
          <button
            type="button"
            onClick={handleVerifyClick}
            className="inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Verify</span>
          </button>
        </div>
      );
    }

    // Pending: Normal
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleVerifyClick}
          className="inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>Verify</span>
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Incident Operations Queue</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredIncidents.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time emergency triage with human evidence verification status
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search location, hazards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Severity Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 overflow-x-auto text-xs">
            {filterTabs.map((tab) => {
              const isActive = filterSeverity === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterSeverity(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table / List Content */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Synchronizing incident logs...</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="py-16 px-4 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Incidents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'No active emergencies match the given search criteria.'
              : 'There are currently no recorded incidents in the queue. You can submit a distress report to trigger the multi-agent response.'}
          </p>
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Report First Incident
          </button>
        </div>
      ) : (
        <>
          {/* Responsive Mobile Card View (visible on < md screens) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredIncidents.map((incident) => {
              const report = incident.reportText || 'Incident reported';
              const intake = incident.intake || {};
              const severity = incident.severity || {};
              const location = intake.location || 'Unknown Area';
              const peopleCount = intake.peopleAffectedEstimate ?? 0;
              const timeAgo = formatTimeAgo(incident.timestamp);

              return (
                <div
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  className="p-4 hover:bg-slate-50/80 transition cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <TypeBadge type={intake.incidentType} />
                        <SeverityBadge severity={severity.severity} size="sm" />
                      </div>
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                        {report}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{location}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{peopleCount} affected</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div>
                      {renderEvidenceCell(incident)}
                    </div>
                    <div>
                      {renderActionArea(incident)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (visible on >= md screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Incident / Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Evidence</th>
                  <th className="py-3 px-4">People</th>
                  <th className="py-3 px-4">Logged</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredIncidents.map((incident) => {
                  const report = incident.reportText || 'Incident reported';
                  const intake = incident.intake || {};
                  const severity = incident.severity || {};
                  const location = intake.location || 'Unknown Area';
                  const peopleCount = intake.peopleAffectedEstimate ?? 0;
                  const timeAgo = formatTimeAgo(incident.timestamp);

                  return (
                    <tr
                      key={incident.id}
                      onClick={() => onSelectIncident(incident)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {report}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          ID: #{incident.id?.slice(0, 8)}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TypeBadge type={intake.incidentType} />
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SeverityBadge severity={severity.severity} />
                      </td>

                      {/* Evidence Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderEvidenceCell(incident)}
                      </td>

                      {/* People Affected */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{peopleCount}</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{timeAgo}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {renderActionArea(incident)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
