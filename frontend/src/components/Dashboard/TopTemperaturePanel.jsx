import React from 'react';
import { Thermometer } from 'lucide-react';

function tempColour(v) {
  if (v >= 80) return 'text-accent-red';
  if (v >= 65) return 'text-accent-orange';
  if (v >= 50) return 'text-accent-yellow';
  return 'text-accent-green';
}

export default function TopTemperaturePanel({ devices }) {
  if (!devices?.length) return null;
  const filtered = devices.filter(d => d.last_temperature != null).slice(0, 6);
  if (!filtered.length) return null;
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Thermometer className="w-4 h-4 text-accent-red" /> Top Temperature
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 uppercase border-b border-dark-500">
              <th className="text-left pb-2 pr-3">Name</th>
              <th className="text-right pb-2 pr-3">Temp</th>
              <th className="text-right pb-2 pr-3">CPU%</th>
              <th className="text-right pb-2">Mem%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {filtered.map(d => (
              <tr key={d.id}>
                <td className="py-1.5 pr-3 text-white">{d.name}</td>
                <td className={`py-1.5 pr-3 text-right font-bold font-mono ${tempColour(d.last_temperature)}`}>
                  {d.last_temperature?.toFixed(1)}°C
                </td>
                <td className="py-1.5 pr-3 text-right text-gray-400 font-mono">{d.last_cpu?.toFixed(1) ?? '—'}%</td>
                <td className="py-1.5 text-right text-gray-400 font-mono">{d.last_memory?.toFixed(1) ?? '—'}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
