import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { KpiBar } from './components/dashboard/KpiBar';
import { IncidentTable } from './components/dashboard/IncidentTable';
import { IncidentDetailModal } from './components/incidents/IncidentDetailModal';
import { EvidenceVerificationPanel } from './components/evidence/EvidenceVerificationPanel';
import { ReportIncidentModal } from './components/forms/ReportIncidentModal';
import { ResourcesDirectoryView } from './components/resources/ResourcesDirectoryView';
import { ResponsePlansView } from './components/response/ResponsePlansView';
import { AgentActivityView } from './components/activity/AgentActivityView';
import { fetchSystemStatus, fetchIncidents, submitIncidentReport, REGIONAL_RESOURCES } from './services/api';
import { Plus, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentForVerification, setIncidentForVerification] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data and poll periodically
  const loadData = async () => {
    try {
      const [status, incidentList] = await Promise.all([
        fetchSystemStatus(),
        fetchIncidents(),
      ]);
      setSystemStatus(status);
      setIncidents(incidentList);
    } catch (err) {
      console.error('[App] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s live sync
    return () => clearInterval(interval);
  }, []);

  const handleReportSubmit = async (reportText, addressOrLat, evidenceOrLong = null, maybeEvidence = null) => {
    const newIncident = await submitIncidentReport(reportText, addressOrLat, evidenceOrLong, maybeEvidence);
    // Prepend new incident to the operations queue
    setIncidents((prev) => [newIncident, ...prev.filter((i) => i.id !== newIncident.id)]);
    // Return user to normal command center view without automatic redirect to verification page
    return newIncident;
  };

  const handleIncidentUpdated = (updatedIncident) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === updatedIncident.id ? updatedIncident : inc))
    );
    if (selectedIncident?.id === updatedIncident.id) {
      setSelectedIncident(updatedIncident);
    }
    if (incidentForVerification?.id === updatedIncident.id) {
      setIncidentForVerification(updatedIncident);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Application Shell Header */}
      <Header
        systemStatus={systemStatus}
        activeCount={incidents.length}
        onOpenReport={() => setIsReportModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      <div className="flex-1 flex">
        {/* Responsive Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          incidentCount={incidents.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Emergency Command Center</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Operational
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live multi-agent situational awareness, triage queues, and visual evidence verification
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={loadData}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Refresh data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sync Live</span>
                  </button>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-red-400" />
                    <span>Report Emergency</span>
                  </button>
                </div>
              </div>

              {/* KPI Bar */}
              <KpiBar incidents={incidents} resources={REGIONAL_RESOURCES} />

              {/* Incidents Table */}
              <IncidentTable
                incidents={incidents}
                onSelectIncident={setSelectedIncident}
                onOpenReport={() => setIsReportModalOpen(true)}
                onOpenVerification={setIncidentForVerification}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* VIEW: INCIDENTS */}
          {currentView === 'incidents' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  All Active & Resolved Incidents
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete register of emergency distress reports and operator verification records
                </p>
              </div>

              <IncidentTable
                incidents={incidents}
                onSelectIncident={setSelectedIncident}
                onOpenReport={() => setIsReportModalOpen(true)}
                onOpenVerification={setIncidentForVerification}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* VIEW: RESOURCES */}
          {currentView === 'resources' && <ResourcesDirectoryView />}

          {/* VIEW: PLANS */}
          {currentView === 'plans' && (
            <ResponsePlansView
              incidents={incidents}
              onSelectIncident={setSelectedIncident}
            />
          )}

          {/* VIEW: AGENT ACTIVITY */}
          {currentView === 'activity' && (
            <AgentActivityView
              systemStatus={systemStatus}
              incidents={incidents}
            />
          )}
        </main>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={handleIncidentUpdated}
          onOpenVerification={setIncidentForVerification}
        />
      )}

      {/* Evidence Verification Drawer / Modal */}
      {incidentForVerification && (
        <EvidenceVerificationPanel
          incident={incidentForVerification}
          onClose={() => setIncidentForVerification(null)}
          onIncidentUpdated={handleIncidentUpdated}
        />
      )}

      {/* Report Emergency Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitSuccess={handleReportSubmit}
      />
    </div>
  );
}
