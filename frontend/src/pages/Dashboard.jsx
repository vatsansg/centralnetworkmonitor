import React, { useEffect } from 'react';
import { Server, RefreshCw, Star, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePolling } from '../hooks/usePolling';
import VenueDashboard from '../components/Dashboard/VenueDashboard';

function isStale(generatedAt) {
  if (!generatedAt) return false;
  return (Date.now() - new Date(generatedAt).getTime()) > 30 * 60 * 1000;
}

export default function Dashboard() {
  const { venues, activeVenueId, setActiveVenue, favourite, setFavourite, loadVenues, isLoading } = useApp();

  useEffect(() => { loadVenues(); }, []);
  usePolling(() => loadVenues(), 60000);

  const sorted = favourite && venues.find(v => v.venue_id === favourite)
    ? [venues.find(v => v.venue_id === favourite), ...venues.filter(v => v.venue_id !== favourite)]
    : venues;

  if (!isLoading && venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="p-6 rounded-full bg-dark-700 border border-dark-500">
          <Server className="w-16 h-16 text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Active Events</h2>
        <p className="text-gray-400 max-w-sm">No venue monitoring data is currently available.</p>
        <button
          onClick={() => loadVenues({ bust: true })}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar — sticky, offset to cancel parent padding so background covers full width */}
      {venues.length > 0 && (
        <div className="sticky top-0 z-10 bg-dark-900 -mx-8 px-8 pt-2 pb-3 mb-5 border-b border-dark-600 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          {sorted.map(v => (
            <button
              key={v.venue_id}
              onClick={() => setActiveVenue(v.venue_id)}
              title={`Last updated: ${v.age_minutes} min ago`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeVenueId === v.venue_id
                  ? 'bg-accent-blue text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
              }`}
            >
              {isStale(v.generated_at) && <AlertTriangle className="w-3 h-3 text-accent-yellow" />}
              <span className="font-mono">{v.venue_id}</span>
              <button
                onClick={e => { e.stopPropagation(); setFavourite(favourite === v.venue_id ? null : v.venue_id); }}
                className={`ml-1 ${favourite === v.venue_id ? 'text-accent-yellow' : 'text-gray-600 hover:text-accent-yellow'}`}
              >
                <Star className="w-3.5 h-3.5" fill={favourite === v.venue_id ? 'currentColor' : 'none'} />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Active venue */}
      {activeVenueId && <VenueDashboard venueId={activeVenueId} />}
    </div>
  );
}
