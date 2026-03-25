'use client';

import React from 'react';
import { Info, Map as MapIcon, Edit2, Droplet, Droplets, CloudRain, Zap, Waves, DoorClosed, Cpu, CheckCircle } from 'lucide-react';
import { useAppStore, type Sensor, type SensorType } from '@/store/useAppStore';

const SENSOR_TYPES: { type: SensorType; label: string; Icon: React.ElementType }[] = [
  { type: 'master_flow', label: 'Waterflow', Icon: Waves },
  { type: 'humidity', label: 'Humidity', Icon: CloudRain },
  { type: 'water_drop', label: 'Water Drop', Icon: Droplets },
  { type: 'pump', label: 'Pump', Icon: Zap },
  { type: 'valve', label: 'Valve', Icon: DoorClosed },
];

function getLiveReading(sensor: Sensor): string {
  switch(sensor.type) {
    case 'master_flow': return `Flow: ${sensor.value || 0} L/m`;
    case 'humidity': return `Hum: ${sensor.value || 42}%`;
    case 'water_drop': return `Status: ${sensor.isWet ? 'LEAK DETECTED' : 'DRY'}`;
    case 'pump': return `Status: ${sensor.isOn ? 'ON' : 'OFF'}`;
    case 'valve': return `Gate: ${sensor.isOpen ? 'OPEN' : 'BLOCKED'}`;
  }
}

export default function RightSidebar() {
  const selectedId = useAppStore((s) => s.selectedId);
  const rooms = useAppStore((s) => s.rooms);
  const sensors = useAppStore((s) => s.sensors);
  const renameRoom = useAppStore((s) => s.renameRoom);
  const updateSensorHardwareId = useAppStore((s) => s.updateSensorHardwareId);
  const setMasterSensor = useAppStore((s) => s.setMasterSensor);
  
  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedSensorType = useAppStore((s) => s.selectedSensorType);
  const setSelectedSensorType = useAppStore((s) => s.setSelectedSensorType);
  const focusedRoomId = useAppStore((s) => s.focusedRoomId);
  const activeFloorId = useAppStore((s) => s.activeFloorId);

  // Find if a room or sensor is selected
  const selectedRoom = rooms.find((r) => r.id === selectedId);
  const selectedSensor = sensors.find((s) => s.id === selectedId);

  // Zone Metrics
  const focusedRoom = focusedRoomId ? rooms.find(r => r.id === focusedRoomId) : null;
  const zoneSensors = focusedRoomId ? sensors.filter(s => s.roomId === focusedRoomId) : [];

  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 flex w-[320px] flex-col border-l border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      {/* Heading */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <Info className="h-5 w-5 text-slate-400" />
        <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
          {focusedRoomId ? 'Zone Metrics' : canvasMode === 'add_sensor' ? 'Hardware Palette' : 'Details'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {focusedRoomId && focusedRoom ? (
           <div className="p-5 space-y-6">
             {/* Editable Room Title Header */}
             <div>
               <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                 <Edit2 className="h-3.5 w-3.5" />
                 Room Name
               </label>
               <input
                 type="text"
                 value={focusedRoom.name}
                 onChange={(e) => renameRoom(focusedRoom.id, e.target.value)}
                 className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-lg font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                 placeholder="Enter room name..."
               />
               <p className="text-sm text-slate-500 mt-3 font-medium">Live Sensor Telemetry</p>
             </div>
             
             {zoneSensors.length === 0 ? (
               <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-400 bg-slate-50/50">
                 No hardware mapped to this zone.
               </div>
             ) : (
               <div className="space-y-3">
                 {zoneSensors.map(s => {
                   const conf = SENSOR_TYPES.find(t => t.type === s.type);
                   const Icon = conf?.Icon || Cpu;
                   return (
                     <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-4">
                         <div className="p-2.5 rounded-lg bg-indigo-50 shadow-sm border border-indigo-100 text-indigo-600">
                           <Icon className="h-5 w-5" />
                         </div>
                         <div className="space-y-0.5">
                           <div className="text-sm font-bold text-slate-800">{conf?.label} ({s.hardwareId})</div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{getLiveReading(s)}</div>
                         </div>
                       </div>
                       {s.type === 'water_drop' && <CheckCircle className="h-5 w-5 text-emerald-500 drop-shadow-sm" />}
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
        ) : canvasMode === 'add_sensor' ? (
          <div className="p-5 space-y-5">
             <h2 className="text-base font-bold text-slate-800 tracking-tight">Select Hardware</h2>
             <div className="flex flex-col gap-2.5">
               {SENSOR_TYPES.map(({ type, label, Icon }) => (
                 <button
                   key={type}
                   onClick={() => setSelectedSensorType(type)}
                   className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border text-left transition-colors font-medium shadow-sm ${
                     selectedSensorType === type 
                       ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500/50' 
                       : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                   }`}
                 >
                   <Icon className="h-5 w-5" />
                   <span className="text-sm">{label}</span>
                 </button>
               ))}
             </div>
          </div>
        ) : selectedRoom ? (
          <div className="p-5 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-1.5">
                <MapIcon className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Room Entity</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {selectedRoom.name}
              </h2>
            </div>

            {/* Geometry Info */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Geometry</span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                 <div>
                   <span className="text-slate-400 block font-medium text-xs uppercase mb-0.5">Vertices</span>
                   <span className="text-slate-700 font-bold">{selectedRoom.polygonPoints.length / 2} points</span>
                 </div>
                 <div>
                   <span className="text-slate-400 block font-medium text-xs uppercase mb-0.5">Status</span>
                   <span className="text-blue-600 font-bold italic">Synchronized</span>
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
            
            {/* Master Assignment Toggle */}
            {selectedSensor.type === 'master_flow' && (
               <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-bold text-orange-800">Master Flow Sensor</span>
                   <button 
                     onClick={() => {
                        if (activeFloorId) {
                           // If already master, clicking does nothing or disables? Prompt says "When toggled ON... map through others...". Let's make it toggleable.
                           // Actually the store lets us just set it. 
                           // If it's already master, and we want to untoggle it? 
                           useAppStore.getState().setMasterSensor(
                             selectedSensor.isMaster ? '' : selectedSensor.id, 
                             activeFloorId
                           );
                        }
                     }}
                     className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${selectedSensor.isMaster ? 'bg-orange-500' : 'bg-slate-300'}`}
                   >
                     <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedSensor.isMaster ? 'translate-x-4' : 'translate-x-0'}`} />
                   </button>
                 </div>
                 <p className="text-[10px] text-orange-600 leading-tight">
                   Enable this to aggregate all floor telemetry to this core hardware node. Only one master allowed per floor.
                 </p>
               </div>
            )}

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
      {(selectedRoom || selectedSensor) && canvasMode !== 'add_sensor' && !focusedRoomId && (
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
