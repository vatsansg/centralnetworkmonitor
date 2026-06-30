import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, Activity } from 'lucide-react';

const TILES = [
  { key: 'up',      label: 'Up',      icon: CheckCircle,    colour: 'text-accent-green border-accent-green/30 bg-accent-green/10' },
  { key: 'down',    label: 'Down',    icon: XCircle,        colour: 'text-accent-red border-accent-red/30 bg-accent-red/10' },
  { key: 'warning', label: 'Warning', icon: AlertTriangle,  colour: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10' },
  { key: 'unknown', label: 'Unknown', icon: HelpCircle,     colour: 'text-gray-400 border-gray-600/30 bg-gray-700/20' },
  { key: 'total',   label: 'Total',   icon: Activity,       colour: 'text-accent-blue border-accent-blue/30 bg-accent-blue/10' },
];

export default function DeviceSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-5 gap-3">
      {TILES.map(({ key, label, icon: Icon, colour }) => (
        <div key={key} className={`rounded-xl border p-4 flex flex-col items-center gap-1 ${colour}`}>
          <Icon className="w-6 h-6 mb-1" />
          <span className="text-2xl font-bold">{summary[key] ?? 0}</span>
          <span className="text-xs font-medium opacity-80">{label}</span>
        </div>
      ))}
    </div>
  );
}
