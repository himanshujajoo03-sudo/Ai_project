import React from 'react';

export function SeverityBadge({ severity, size = 'md' }) {
  const norm = String(severity || '').toUpperCase();

  const config = {
    CRITICAL: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    HIGH: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
    },
    MEDIUM: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    LOW: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
  };

  const style = config[norm] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-sm px-3 py-1 font-bold' 
    : 'text-xs px-2.5 py-1 font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border ${style.bg} ${style.text} ${style.border} ${sizeClasses} tracking-wider uppercase font-medium`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`}></span>
      {norm || 'UNKNOWN'}
    </span>
  );
}

export function TypeBadge({ type }) {
  const norm = String(type || '').toLowerCase();
  
  let label = type;
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm.includes('structural') || norm.includes('collapse')) {
    label = 'Structural Collapse';
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm.includes('flood')) {
    label = 'Flood';
    color = 'bg-cyan-50 text-cyan-700 border-cyan-200';
  } else if (norm.includes('fire')) {
    label = 'Fire';
    color = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (norm.includes('accident')) {
    label = 'Traffic Incident';
    color = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (norm.includes('medical')) {
    label = 'Medical';
    color = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}

export function ResourceTypeBadge({ type }) {
  const norm = String(type || '').toLowerCase();
  let label = type;
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'rescue_team') {
    label = 'Rescue Squad';
    color = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (norm === 'hospital') {
    label = 'Trauma / Hospital';
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm === 'shelter') {
    label = 'Relief Shelter';
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}
