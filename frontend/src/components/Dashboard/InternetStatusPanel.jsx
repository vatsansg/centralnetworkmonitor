import React, { useState, useEffect } from 'react';
import { Globe, Wifi, WifiOff, Download, Upload, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function SpeedTestRow({ speedTest }) {
  const [relTime, setRelTime] = useState('');

  useEffect(() => {
    function update() {
      if (!speedTest?.tested_at) return;
      const d = new Date(speedTest.tested_at);
      const offset = -d.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const mm = String(Math.abs(offset) % 60).padStart(2, '0');
      const localTime = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
      const abs = `${localTime} GMT${sign}${hh}:${mm}`;
      setRelTime(`${formatDistanceToNow(d, { addSuffix: true })} (${abs})`);
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [speedTest?.tested_at]);

  if (!speedTest) return null;

  const failed = speedTest.status === 'failed';

  return (
    <div className="mt-3 pt-3 border-t border-dark-500">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Connectivity Test</p>
      {failed ? (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Last test failed</span>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5">
            <Download className="w-4 h-4 text-accent-blue" />
            <span className="text-white font-semibold text-sm">
              {speedTest.download_mbps != null ? `${speedTest.download_mbps.toFixed(1)} Mbps` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-accent-green" />
            <span className="text-white font-semibold text-sm">
              {speedTest.upload_mbps != null ? `${speedTest.upload_mbps.toFixed(1)} Mbps` : '—'}
            </span>
          </div>
        </div>
      )}
      {speedTest.tested_at && (
        <p className="text-xs text-gray-500 mt-1">Last tested: {relTime}</p>
      )}
    </div>
  );
}

export default function InternetStatusPanel({ internet }) {
  if (!internet) return null;
  const isUp = internet.status === 'up';
  const hasSpeedTest = internet.speed_test != null;

  return (
    <div className={`rounded-xl border p-4 ${
      isUp ? 'bg-accent-green/10 border-accent-green/30' : 'bg-accent-red/10 border-accent-red/30'
    }`}>
      <div className="flex items-center gap-4">
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
      {hasSpeedTest && <SpeedTestRow speedTest={internet.speed_test} />}
    </div>
  );
}
