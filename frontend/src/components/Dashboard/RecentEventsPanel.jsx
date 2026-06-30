import React from 'react';
import { Bell } from 'lucide-react';

const SEVERITY_COLOURS = {
  critical: 'text-accent-red bg-accent-red/10 border-accent-red/30',
  warning:  'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/30',
  info:     'text-accent-blue bg-accent-blue/10 border-accent-blue/30',
};

export default function RecentEventsPanel({ events }) {
  if (!events?.length) return null;
  const recent = events.slice(0, 20);
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Bell className="w-4 h-4 text-accent-yellow" /> Recent Events
      </h3>
      <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
        {recent.map(ev => {
          const colour = SEVERITY_COLOURS[ev.severity] || SEVERITY_COLOURS.info;
          return (
            <div key={ev.id} className={`flex items-start gap-2 text-xs p-2 rounded border ${colour}`}>
              <span className="shrink-0 text-gray-500 font-mono">
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
              <span className="font-medium shrink-0">{ev.device_name}</span>
              <span className="text-gray-300 truncate">{ev.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
