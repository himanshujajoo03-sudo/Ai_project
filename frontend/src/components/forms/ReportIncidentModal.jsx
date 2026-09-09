import React, { useState, useMemo } from 'react';
import { DEMO_PRESETS } from '../../services/api';
import { resolveAddressLocation } from '../../services/geocoding';
import { EvidenceUpload } from './EvidenceUpload';
import {
  X,
  Send,
  Sparkles,
  MapPin,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export function ReportIncidentModal({ isOpen, onClose, onSubmitSuccess }) {
  const [reportText, setReportText] = useState('');
  const [address, setAddress] = useState('');
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Real-time local geocoding status
  const geoStatus = useMemo(() => {
    if (!address.trim()) return null;
    return resolveAddressLocation(address);
  }, [address]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setReportText(preset.reportText || '');
    setAddress(preset.address || '');
    setEvidenceImage(preset.evidenceImage || null);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reportText.trim()) {
      setErrorMessage('Please describe what happened in the incident description field.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter an address or nearby landmark for the incident.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // Dynamic processing steps animation to show multi-agent pipeline during execution
    setProcessingStage('Receiving Distress Report...');
    const step1 = setTimeout(() => setProcessingStage('Intake Agent: Extracting structured hazards & location...'), 350);
    const step2 = setTimeout(() => setProcessingStage('Severity Agent: Assessing life-safety triage score...'), 750);
    const step3 = setTimeout(() => setProcessingStage('Resource Agent: Matching proximity emergency assets...'), 1150);
    const step4 = setTimeout(() => setProcessingStage('Dispatch Agent: Synthesizing operational response plan...'), 1550);
    const step5 = evidenceImage
      ? setTimeout(() => setProcessingStage('Visual Evidence Layer: Synthesizing advisory observations...'), 1950)
      : null;

    try {
      const derivedCoords = geoStatus?.resolved
        ? { latitude: geoStatus.latitude, longitude: geoStatus.longitude }
        : null;

      await onSubmitSuccess(reportText.trim(), address.trim(), evidenceImage, derivedCoords);

      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);
      if (step5) clearTimeout(step5);

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);
      if (step5) clearTimeout(step5);

      setIsSubmitting(false);
      setProcessingStage('');
      setErrorMessage(err.message || 'Failed to submit incident report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Report an Incident
              </h3>
              <p className="text-xs text-slate-500">
                Disaster intake and multi-agent emergency dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Demo Scenarios:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleApplyPreset(preset)}
                className="text-left p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition text-xs group cursor-pointer"
              >
                <span className="font-semibold text-slate-800 block truncate group-hover:text-blue-600 text-[11px]">
                  {preset.label}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {preset.address || preset.sublabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body - Clean single-column layout */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* 1. Incident Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              What happened? <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Describe the incident, what you observed, and people affected..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 font-sans leading-relaxed transition"
            />
          </div>

          {/* 2. Address / Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Address or Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                disabled={isSubmitting}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter the incident address or nearby landmark"
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition"
              />
            </div>

            {/* Location UX: Feedback & Help */}
            {geoStatus?.resolved ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg font-medium animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Location identified: <strong>{geoStatus.areaName}</strong></span>
              </div>
            ) : address.trim().length > 1 ? (
              <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-lg animate-in fade-in">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Could not automatically identify this location. The address will still be used as the incident location.</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 pl-1">
                Examples: "MG Road, Nagpur", "Near Central Mall, Wardha Road"
              </div>
            )}
          </div>

          {/* 3. Supporting Evidence (Image Upload) */}
          <div className="pt-2 border-t border-slate-100">
            <EvidenceUpload
              evidenceImage={evidenceImage}
              onChange={setEvidenceImage}
            />
          </div>

          {/* Processing Status Indicator when Submitting */}
          {isSubmitting && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Multi-Agent Autonomous Pipeline in Progress...</span>
              </div>
              <p className="text-xs text-slate-300 font-mono pl-6">
                {processingStage}
              </p>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Analyzing Incident...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Analyze Incident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
