import React from 'react';
import { XCircle } from 'lucide-react';

export default function DownDevicesPanel({ devices }) {
  if (!devices?.length) return null;
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <XCircle className="w-4 h-4 text-accent-red" /> Down Devices ({devices.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-dark-500">
              <th className="text-left pb-2 pr-4">Name</th>
              <th className="text-left pb-2 pr-4">IP</th>
              <th className="text-left pb-2 pr-4">Type</th>
              <th className="text-left pb-2 pr-4">Location</th>
              <th className="text-left pb-2">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-500">
            {devices.map(d => (
              <tr key={d.id} className="text-gray-300">
                <td className="py-2 pr-4 font-medium text-accent-red">{d.name}</td>
                <td className="py-2 pr-4 font-mono text-xs">{d.ip_address}</td>
                <td className="py-2 pr-4 text-xs">{d.device_type_name}</td>
                <td className="py-2 pr-4 text-xs">{d.location_name}</td>
                <td className="py-2 text-xs text-gray-500">
                  {d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
