'use client';

import { Activity } from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/store/useAppStore';
import SimulationBanner from './SimulationBanner';

export default function TopBar() {
  const sensors = useAppStore((s) => s.sensors);

  const activeFloorId = useAppStore((s) => s.activeFloorId);

  // Find the master flow sensor for the active floor
  const masterSensor = sensors.find(
    (s) => s.type === 'master_flow' && s.floorId === activeFloorId && s.isMaster
  );
  const totalFlowDisplay = masterSensor ? '15.2' : '--';

  // Determine system status
  const hasLeak = sensors.some((s) => s.type === 'water_drop' && s.isWet);
  const systemStatus = hasLeak ? 'ALERT' : 'OK';
  const statusColor = hasLeak
    ? 'text-red-700 bg-red-50 border-red-300 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <Image
              src="/herosense-logo.png"
              alt="herosense"
              width={105}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            aqualarm
          </span>
        </div>

        {/* Global Floor Stats */}
        <div className="flex items-center gap-6">
          {/* Total Flow */}
          <div className="flex items-center gap-2 text-base text-slate-600">
            <Activity className="h-5 w-5 text-slate-400" />
            <span className="font-medium text-slate-500">Floor Total Flow</span>
            <span className="font-semibold tabular-nums text-slate-900">
              {totalFlowDisplay} L/m
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200" />

          {/* System Status */}
          <div className="flex items-center gap-2 text-base">
            <span className="font-medium text-slate-500">System Status</span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-semibold ${statusColor}`}
            >
              {systemStatus}
            </span>
          </div>
        </div>
      </header>
      <SimulationBanner />
    </>
  );
}
