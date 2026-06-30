import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, ChevronLeft, ChevronRight, Star, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function isStale(generatedAt) {
  if (!generatedAt) return false;
  return (Date.now() - new Date(generatedAt).getTime()) > 30 * 60 * 1000;
}

export default function Sidebar() {
  const { venues, activeVenueId, setActiveVenue, favourite, setFavourite } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const sorted = favourite
    ? [venues.find(v => v.venue_id === favourite), ...venues.filter(v => v.venue_id !== favourite)].filter(Boolean)
    : venues;

  return (
    <aside className={`flex flex-col bg-dark-800 border-r border-dark-600 transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'} shrink-0`}>
      <div className="flex items-center justify-between p-3 border-b border-dark-600">
        {!collapsed && <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</span>}
        <button onClick={() => setCollapsed(c => !c)} className="ml-auto text-gray-400 hover:text-white p-1">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="p-2 space-y-1 border-b border-dark-600">
        {[
          { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/settings', icon: Settings, label: 'Settings' },
        ].map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
              location.pathname === to
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-gray-400 hover:text-white hover:bg-dark-600'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {!collapsed && venues.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Venues</p>
          {sorted.map(v => (
            <button
              key={v.venue_id}
              onClick={() => setActiveVenue(v.venue_id)}
              className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors mb-0.5 ${
                activeVenueId === v.venue_id
                  ? 'bg-accent-blue/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                {isStale(v.generated_at) && <AlertTriangle className="w-3 h-3 text-accent-yellow shrink-0" />}
                <span className="truncate font-mono text-xs">{v.venue_id}</span>
              </span>
              <button
                onClick={e => { e.stopPropagation(); setFavourite(favourite === v.venue_id ? null : v.venue_id); }}
                className={`shrink-0 ${favourite === v.venue_id ? 'text-accent-yellow' : 'text-gray-600 hover:text-accent-yellow'}`}
              >
                <Star className="w-3.5 h-3.5" fill={favourite === v.venue_id ? 'currentColor' : 'none'} />
              </button>
            </button>
          ))}
        </div>
      )}

      {!collapsed && venues.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-gray-600 text-center">No active venues</p>
        </div>
      )}
    </aside>
  );
}
