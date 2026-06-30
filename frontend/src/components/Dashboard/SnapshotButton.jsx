import React from 'react';
import { Printer } from 'lucide-react';
import { openSnapshot } from '../../services/snapshotService';

export default function SnapshotButton({ venueData }) {
  return (
    <button
      onClick={() => openSnapshot(venueData)}
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-accent-blue hover:bg-blue-600 text-white rounded-xl shadow-lg font-medium text-sm transition-colors z-40"
    >
      <Printer className="w-4 h-4" /> Dashboard Snapshot
    </button>
  );
}
