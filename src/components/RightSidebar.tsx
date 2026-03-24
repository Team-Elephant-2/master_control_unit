'use client';

import React from 'react';
import { Info, Map as MapIcon, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function RightSidebar() {
  const selectedId = useAppStore((s) => s.selectedId);
  const rooms = useAppStore((s) => s.rooms);
  const renameRoom = useAppStore((s) => s.renameRoom);

  // Find if a room is selected
  const selectedRoom = rooms.find((r) => r.id === selectedId);

  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 flex w-64 flex-col border-l border-slate-200 bg-white">
      {/* Heading */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
        <Info className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Details
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedRoom ? (
          <div className="p-4 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <MapIcon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Room Entity</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                {selectedRoom.name}
              </h2>
            </div>

            {/* Property: Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Edit2 className="h-3 w-3" />
                Room Name
              </label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => renameRoom(selectedRoom.id, e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Enter room name..."
              />
            </div>

            {/* Geometry Info (Quick Look) */}
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Geometry</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                 <div>
                   <span className="text-slate-400 block">Vertices</span>
                   <span className="text-slate-600 font-medium">{selectedRoom.polygonPoints.length / 2} points</span>
                 </div>
                 <div>
                   <span className="text-slate-400 block">Status</span>
                   <span className="text-blue-600 font-medium italic">Synchronized</span>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Placeholder */
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Info className="h-5 w-5 text-slate-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-400">
              Select an element to view details
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Click on a sensor, pipe, or room on the canvas
            </p>
          </div>
        )}
      </div>

      {/* Footer / Meta (Optional) */}
      {selectedRoom && (
        <div className="p-4 border-t border-slate-50">
          <button 
             onClick={() => useAppStore.getState().deleteEntity(selectedRoom.id)}
             className="w-full py-2 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded transition-colors"
          >
            Delete Room
          </button>
        </div>
      )}
    </aside>
  );
}
