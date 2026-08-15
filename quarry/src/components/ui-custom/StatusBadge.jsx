import React from 'react';
import { cn } from '@/lib/utils';

const severityConfig = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500'
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    dot: 'bg-orange-500'
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  informational: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-500'
  }
};

const statusConfig = {
  // Device statuses
  online: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  offline: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400'
  },
  isolated: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-500'
  },
  compromised: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500'
  },
  
  // Alert statuses
  new: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  in_progress: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  resolved: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  false_positive: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400'
  },
  suppressed: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-500',
    dot: 'bg-slate-400'
  },
  
  // Incident statuses
  open: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500'
  },
  investigating: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  contained: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  remediated: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    dot: 'bg-teal-500'
  },
  closed: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  }
};

const priorityConfig = {
  p1: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'P1 - Critical'
  },
  p2: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    label: 'P2 - High'
  },
  p3: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'P3 - Medium'
  },
  p4: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    label: 'P4 - Low'
  }
};

export const SeverityBadge = ({ severity, showDot = true, className }) => {
  const config = severityConfig[severity] || severityConfig.informational;
  const label = severity?.charAt(0).toUpperCase() + severity?.slice(1) || 'Unknown';
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
      config.bg, config.border, config.text,
      className
    )}>
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />}
      {label}
    </span>
  );
};

export const StatusBadge = ({ status, showDot = true, className }) => {
  const config = statusConfig[status] || statusConfig.offline;
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
      config.bg, config.border, config.text,
      className
    )}>
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />}
      {label}
    </span>
  );
};

export const PriorityBadge = ({ priority, showLabel = false, className }) => {
  const config = priorityConfig[priority] || priorityConfig.p4;
  const label = showLabel ? config.label : priority?.toUpperCase();
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
      config.bg, config.border, config.text,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {label}
    </span>
  );
};

export const RiskScoreBadge = ({ score, className }) => {
  let config;
  let label;
  
  if (score >= 80) {
    config = severityConfig.critical;
    label = 'Critical';
  } else if (score >= 60) {
    config = severityConfig.high;
    label = 'High';
  } else if (score >= 40) {
    config = severityConfig.medium;
    label = 'Medium';
  } else if (score >= 20) {
    config = severityConfig.low;
    label = 'Low';
  } else {
    config = severityConfig.informational;
    label = 'Minimal';
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        <span className={cn(
          'inline-flex items-center justify-center w-10 h-6 text-xs font-bold rounded',
          config.bg, config.border, config.text, 'border'
        )}>
          {score}
        </span>
        <span className={cn('text-xs font-medium', config.text)}>{label}</span>
      </div>
    </div>
  );
};

export const OsBadge = ({ os, className }) => {
  const osConfig = {
    windows: { icon: '🪟', label: 'Windows', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    macos: { icon: '🍎', label: 'macOS', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    linux: { icon: '🐧', label: 'Linux', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
  };
  
  const config = osConfig[os] || { icon: '💻', label: os, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border',
      config.bg, config.text, config.border,
      className
    )}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;