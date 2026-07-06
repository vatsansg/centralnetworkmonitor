import React from 'react';
import { Cpu } from 'lucide-react';

function cpuColour(v) {
  if (v >= 90) return 'bg-accent-red';
  if (v >= 70) return 'bg-accent-orange';
  if (v >= 50) return 'bg-accent-yellow';
  return 'bg-accent-green';
}

export default function TopCPUPanel({ devices }) {
  if (!devices?.length) return null;
  const filtered = devices.filter(d => d.cpu_usage != null).slice(0, 6);
  if (!filtered.length) return null;
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-accent-orange" /> Top CPU
      </h3>
      <div className="space-y-2.5">
        {filtered.map(d => (
          <div key={d.id}>
            <div className="flex justify-between text-xs mb-1">
              <div className="flex flex-col min-w-0">
                <span className="text-white truncate">{d.name || d.ip_address}</span>
                {d.location_name && <span className="text-gray-500 truncate">{d.location_name}</span>}
              </div>
              <span className={`font-bold font-mono ${d.cpu_usage >= 90 ? 'text-accent-red' : d.cpu_usage >= 70 ? 'text-accent-orange' : 'text-accent-yellow'}`}>
                {d.cpu_usage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${cpuColour(d.cpu_usage)}`} style={{ width: `${Math.min(d.cpu_usage, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
