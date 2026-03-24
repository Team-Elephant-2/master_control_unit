'use client';

import { Droplets, Activity } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function TopBar() {
  const sensors = useAppStore((s) => s.sensors);

  const activeFloorId = useAppStore((s) => s.activeFloorId);

  // Find the master flow sensor for the active floor
  const masterSensor = sensors.find(
    (s) => s.type === 'master_flow' && s.floorId === activeFloorId && s.isMaster
  );
  const totalFlowDisplay = masterSensor ? '15.2' : '--';

  // Determine system status — green if no water_drop sensors are wet
  const hasLeak = sensors.some(
    (s) => s.type === 'water_drop' && false, // TODO: Add physical readings to store later
  );
  const systemStatus = hasLeak ? 'ALERT' : 'OK';
  const statusColor = hasLeak ? 'text-red-600 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
          <Droplets className="h-4.5 w-4.5 text-sky-600" />
        </div>
        <span className="text-base font-semibold tracking-tight text-slate-900">
          Aqua Monitor
        </span>
      </div>

      {/* Global Floor Stats */}
      <div className="flex items-center gap-5">
        {/* Total Flow */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Activity className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-500">Floor Total Flow</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {totalFlowDisplay} L/m
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* System Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-500">System Status</span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
          >
            {systemStatus}
          </span>
        </div>
      </div>
    </header>
  );
}
