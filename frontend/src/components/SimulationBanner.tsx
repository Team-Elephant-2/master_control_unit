'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AlertOctagon } from 'lucide-react';

export default function SimulationBanner() {
  const sensors = useAppStore((s) => s.sensors);
  const rooms = useAppStore((s) => s.rooms);

  // Find any active leak
  const leakingSensor = sensors.find(s => s.type === 'water_drop' && s.isWet);

  if (!leakingSensor) return null;

  const roomName = leakingSensor.roomId 
    ? rooms.find(r => r.id === leakingSensor.roomId)?.name || 'Unknown Room'
    : 'Open Area';

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-600 text-white shadow-xl flex items-center justify-center p-3 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 font-semibold tracking-wide">
        <AlertOctagon className="h-6 w-6 animate-pulse" />
        <span className="uppercase">Emergency: Water Leak Detected</span>
        <span className="opacity-80 mx-2">|</span>
        <span className="bg-red-800/50 px-3 py-1 rounded-md border border-red-500/30">
          Location: {roomName} — Node {leakingSensor.hardwareId}
        </span>
      </div>
    </div>
  );
}
