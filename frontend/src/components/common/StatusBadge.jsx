import React from 'react';

const COLOURS = {
  up:      'bg-accent-green/20 text-accent-green border-accent-green/30',
  down:    'bg-accent-red/20 text-accent-red border-accent-red/30',
  warning: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30',
  unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  critical:'bg-accent-red/20 text-accent-red border-accent-red/30',
  info:    'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
  online:  'bg-accent-green/20 text-accent-green border-accent-green/30',
  offline: 'bg-accent-red/20 text-accent-red border-accent-red/30',
};

export default function StatusBadge({ status, className = '' }) {
  const s = (status || 'unknown').toLowerCase();
  const colour = COLOURS[s] || COLOURS.unknown;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colour} ${className}`}>
      {s.toUpperCase()}
    </span>
  );
}
