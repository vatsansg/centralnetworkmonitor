import React from 'react';
import { Globe, Wifi, WifiOff } from 'lucide-react';

export default function InternetStatusPanel({ internet }) {
  if (!internet) return null;
  const isUp = internet.status === 'up';
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${
      isUp ? 'bg-accent-green/10 border-accent-green/30' : 'bg-accent-red/10 border-accent-red/30'
    }`}>
      <div className={`p-3 rounded-full ${isUp ? 'bg-accent-green/20' : 'bg-accent-red/20'}`}>
        {isUp ? <Wifi className="w-6 h-6 text-accent-green" /> : <WifiOff className="w-6 h-6 text-accent-red" />}
      </div>
      <div>
        <p className={`text-lg font-bold ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
          {isUp ? 'ONLINE' : 'OFFLINE'}
        </p>
        {!isUp && internet.down_since && (
          <p className="text-sm text-gray-400">Down since: {new Date(internet.down_since).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
