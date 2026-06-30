import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { usePolling } from '../../hooks/usePolling';
import DeviceSummary from './DeviceSummary';
import InternetStatusPanel from './InternetStatusPanel';
import VlanPanel from './VlanPanel';
import DownDevicesPanel from './DownDevicesPanel';
import TopLatencyPanel from './TopLatencyPanel';
import TopCPUPanel from './TopCPUPanel';
import TopTemperaturePanel from './TopTemperaturePanel';
import RecentEventsPanel from './RecentEventsPanel';
import SnapshotButton from './SnapshotButton';

function formatGeneratedAt(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const tzAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(d).find(p => p.type === 'timeZoneName')?.value || '';
  return `${d.toLocaleTimeString()} ${tzAbbr} (UTC ${d.toISOString().slice(11,19)})`;
}

export default function VenueDashboard({ venueId }) {
  const { venueData, refreshActiveVenue } = useApp();
  const data = venueData[venueId];

  usePolling(() => refreshActiveVenue(venueId), 60000, !!venueId);

  useEffect(() => {
    if (!data) refreshActiveVenue(venueId);
  }, [venueId]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading venue data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Meta bar */}
      <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">Event: </span>
            <span className="text-white font-semibold">{data.event_name}</span>
          </div>
          <div>
            <span className="text-gray-400">Venue: </span>
            <span className="text-accent-blue font-mono font-semibold">{data.venue_id}</span>
          </div>
          <div>
            <span className="text-gray-400">Version: </span>
            <span className="text-gray-300">{data.app_version}</span>
          </div>
          <div>
            <span className="text-gray-400">Generated: </span>
            <span className="text-gray-300">{formatGeneratedAt(data.generated_at)}</span>
          </div>
          <div className={`px-2 py-0.5 rounded text-xs font-bold border ${
            data.internet?.status === 'up'
              ? 'text-accent-green border-accent-green/30 bg-accent-green/10'
              : 'text-accent-red border-accent-red/30 bg-accent-red/10'
          }`}>
            {data.internet?.status === 'up' ? 'INTERNET UP' : 'INTERNET DOWN'}
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <DeviceSummary summary={data.summary} />

      {/* 2-col panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InternetStatusPanel internet={data.internet} />
        <VlanPanel vlans={data.vlans} />
      </div>

      {/* Down devices — full width */}
      <DownDevicesPanel devices={data.down_devices} />

      {/* 3-col panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopLatencyPanel devices={data.top_latency} />
        <TopCPUPanel devices={data.top_cpu} />
        <TopTemperaturePanel devices={data.top_temperature} />
      </div>

      {/* Recent events */}
      <RecentEventsPanel events={data.recent_events} />

      <SnapshotButton venueData={data} />
    </div>
  );
}
