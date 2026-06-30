import React, { useState, useEffect } from 'react';
import { Network, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ThemeToggle from '../common/ThemeToggle';

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-sm text-gray-400 font-mono">{now.toLocaleTimeString()}</span>;
}

export default function Header() {
  const { user, logout, lastRefreshed } = useApp();
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-dark-800 border-b border-dark-600 shrink-0">
      <div className="flex items-center gap-3">
        <Network className="w-6 h-6 text-accent-blue" />
        <span className="font-bold text-white text-lg">Central Network Monitor</span>
        {lastRefreshed && (
          <span className="text-xs text-gray-500 ml-2">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Clock />
        <ThemeToggle />
        <Link to="/settings" className="p-2 rounded-lg bg-dark-600 hover:bg-dark-500 text-gray-300 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-600 rounded-lg">
          <span className="text-sm text-white font-medium">{user?.username}</span>
          <span className="text-xs text-accent-blue capitalize">{user?.role}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-600 hover:bg-accent-red/20 text-gray-300 hover:text-accent-red text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </header>
  );
}
