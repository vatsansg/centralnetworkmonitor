import React from 'react';
import { Network } from 'lucide-react';

export default function VlanPanel({ vlans }) {
  if (!vlans?.length) return null;
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Network className="w-4 h-4 text-accent-cyan" /> VLANs
      </h3>
      <div className="space-y-1.5">
        {vlans.map(v => (
          <div key={v.id} className="flex items-center justify-between text-sm">
            <span className="text-white font-medium">{v.name}</span>
            <span className="text-gray-400 font-mono text-xs">{v.subnet}</span>
            <span className="text-gray-500 font-mono text-xs">GW: {v.gateway}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
