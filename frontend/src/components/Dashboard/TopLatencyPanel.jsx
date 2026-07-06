import React from 'react';
import { Activity } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function TopLatencyPanel({ devices }) {
  if (!devices?.length) return null;
  const top = devices.slice(0, 8);
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-accent-cyan" /> Top Latency
      </h3>
      <div className="space-y-1.5">
        {top.map(d => (
          <div key={d.id} className="flex items-center justify-between text-sm py-1 border-b border-dark-600 last:border-0">
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-medium truncate">{d.name || d.ip_address}</span>
              <span className="text-gray-500 font-mono text-xs">{d.ip_address}</span>
              <span className="text-gray-500 text-xs truncate">{d.location_name || '—'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-accent-orange font-bold font-mono text-sm">{d.last_ping_latency}ms</span>
              <StatusBadge status={d.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
