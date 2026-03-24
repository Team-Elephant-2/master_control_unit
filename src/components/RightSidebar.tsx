'use client';

import React from 'react';
import { Info, Map as MapIcon, Edit2, Droplet, Droplets, Thermometer, Power, Activity, Cpu } from 'lucide-react';
import { useAppStore, type SensorType } from '@/store/useAppStore';

const SENSOR_TYPES: { type: SensorType; label: string; Icon: React.ElementType }[] = [
  { type: 'master_flow', label: 'Waterflow', Icon: Activity },
  { type: 'humidity', label: 'Humidity', Icon: Thermometer },
  { type: 'water_drop', label: 'Water Drop', Icon: Droplets },
  { type: 'pump', label: 'Pump', Icon: Power },
  { type: 'valve', label: 'Valve', Icon: Droplet },
];

export default function RightSidebar() {
  const selectedId = useAppStore((s) => s.selectedId);
  const rooms = useAppStore((s) => s.rooms);
  const sensors = useAppStore((s) => s.sensors);
  const renameRoom = useAppStore((s) => s.renameRoom);
  const updateSensorHardwareId = useAppStore((s) => s.updateSensorHardwareId);
  
  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedSensorType = useAppStore((s) => s.selectedSensorType);
  const setSelectedSensorType = useAppStore((s) => s.setSelectedSensorType);

  // Find if a room or sensor is selected
  const selectedRoom = rooms.find((r) => r.id === selectedId);
  const selectedSensor = sensors.find((s) => s.id === selectedId);

  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 flex w-64 flex-col border-l border-slate-200 bg-white">
      {/* Heading */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
        <Info className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {canvasMode === 'add_sensor' ? 'Hardware Palette' : 'Details'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {canvasMode === 'add_sensor' ? (
          <div className="p-4 space-y-4">
             <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Select Hardware</h2>
             <div className="flex flex-col gap-2">
               {SENSOR_TYPES.map(({ type, label, Icon }) => (
                 <button
                   key={type}
                   onClick={() => setSelectedSensorType(type)}
                   className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                     selectedSensorType === type 
                       ? 'bg-blue-50 border-blue-200 text-blue-700' 
                       : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                   }`}
                 >
                   <Icon className="h-4 w-4" />
                   <span className="text-sm font-medium">{label}</span>
                 </button>
               ))}
             </div>
          </div>
        ) : selectedRoom ? (
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
        ) : selectedSensor ? (
          <div className="p-4 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Cpu className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Sensor Node</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                {SENSOR_TYPES.find(t => t.type === selectedSensor.type)?.label || 'Sensor'}
              </h2>
            </div>

            {/* Property: Hardware ID */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Edit2 className="h-3 w-3" />
                Hardware Node ID
              </label>
              <input
                type="number"
                value={selectedSensor.hardwareId || ''}
                onChange={(e) => updateSensorHardwareId(selectedSensor.id, parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                placeholder="Enter integer ID..."
              />
            </div>

            {/* Location Info */}
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Location</span>
              <div className="text-sm font-medium text-slate-700">
                 {selectedSensor.roomId ? rooms.find(r => r.id === selectedSensor.roomId)?.name || 'Unknown Room' : 'Hallway / Pipe Segment'}
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
      {(selectedRoom || selectedSensor) && canvasMode !== 'add_sensor' && (
        <div className="p-4 border-t border-slate-50">
          <button 
             onClick={() => useAppStore.getState().deleteEntity(selectedId!)}
             className="w-full py-2 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded transition-colors"
          >
            Delete {selectedRoom ? 'Room' : 'Sensor'}
          </button>
        </div>
      )}
    </aside>
  );
}
