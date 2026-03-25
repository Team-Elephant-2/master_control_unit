'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  TrendingUp, 
  ShieldCheck, 
  Euro, 
  AlertTriangle, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Mock data for the line chart (24 hours water usage)
const MOCK_USAGE_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  usage: 10 + Math.random() * 20 + (i > 8 && i < 18 ? Math.random() * 15 : 0),
}));

export default function BuildingOverview() {
  const floors = useAppStore((s) => s.floors);
  const sensors = useAppStore((s) => s.sensors);
  const setActiveFloor = useAppStore((s) => s.setActiveFloor);

  // 1. Estimated Setup Cost: (Sum of all sensors * €150) + €500
  const setupCost = (sensors.length * 150) + 500;

  // 2. Projected Annual Savings: €2,400 Saved / Year (mock)
  const annualSavings = 2400;

  // 3. System Health: % of sensors online (mocked at 98%)
  const systemHealth = sensors.length > 0 ? 98 : 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 p-8">
      {/* --- Metric Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Metric 1: Setup Cost */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Euro className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Setup Investment</p>
            <h3 className="text-2xl font-black text-slate-800">€{setupCost.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Infrastructure overhead included</p>
          </div>
        </div>

        {/* Metric 2: Savings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Projected Savings</p>
            <h3 className="text-2xl font-black text-emerald-600">€{annualSavings.toLocaleString()} <span className="text-sm font-bold text-slate-400">/ Year</span></h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Based on 3 prevented incidents</p>
          </div>
        </div>

        {/* Metric 3: System Health */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
           <div className="relative h-16 w-16">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 stroke-current"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500 stroke-current"
                  strokeWidth="3"
                  strokeDasharray={`${systemHealth}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.5" className="text-[7px] font-black" textAnchor="middle" fill="#1e293b">{systemHealth}%</text>
              </svg>
           </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">System Health</p>
            <h3 className="text-2xl font-black text-slate-800">Online</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">98% Node Reliability</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* --- Isometric 3D Stack (Centerpiece) --- */}
        <div className="relative min-h-[600px] flex items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
          <div className="absolute top-6 left-8">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">Building Structure (3D)</h2>
            <p className="text-sm text-slate-400 font-bold">Real-time status per floor</p>
          </div>

          <div 
            className="relative transform-gpu flex flex-col-reverse items-center"
            style={{ 
              perspective: '1200px',
              paddingTop: '100px'
            }}
          >
            {floors.map((floor, index) => {
              const floorSensors = sensors.filter(s => s.floorId === floor.id);
              const hasLeak = floorSensors.some(s => s.isWet);
              
              return (
                <div 
                  key={floor.id}
                  onClick={() => setActiveFloor(floor.id)}
                  className={`
                    absolute w-72 h-44 rounded-2xl transition-all duration-500 cursor-pointer border-2
                    flex flex-col items-center justify-center
                    ${hasLeak 
                      ? 'bg-red-50/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse' 
                      : 'bg-white/80 border-slate-200 shadow-2xl hover:bg-white hover:border-blue-400 hover:scale-105'}
                  `}
                  style={{ 
                    transform: `rotateX(55deg) rotateZ(-35deg) translateY(calc(${index} * -100px))`,
                    zIndex: index
                  }}
                >
                  {hasLeak && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white p-1 rounded-full animate-bounce shadow-lg ring-4 ring-red-200">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  )}
                  
                  <div className="text-center p-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Level {index + 1}</span>
                    <h4 className={`text-xl font-black ${hasLeak ? 'text-red-700' : 'text-slate-800'}`}>{floor.name}</h4>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase">
                      <Activity className="h-3 w-3" />
                      {floorSensors.length} Nodes Online
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls Hint */}
          <div className="absolute bottom-6 right-8 text-right opacity-40">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perspective Shift Enabled</p>
             <p className="text-[9px] text-slate-300">Click a level to inspect 2D plan</p>
          </div>
        </div>

        {/* --- Global Water Usage Chart --- */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">Total Building Flow</h2>
              <p className="text-sm text-slate-400 font-bold">Measured in L/m over last 24h</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xs">
              <ArrowUpRight className="h-4 w-4" />
              +4.2% Peak
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_USAGE_DATA}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  interval={3}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                    fontSize: '12px',
                    fontWeight: 800
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorUsage)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[9px]">Peak Usage</p>
                <p className="text-lg font-black text-slate-800">42.8 L/m</p>
             </div>
             <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[9px]">Average Daily</p>
                <p className="text-lg font-black text-slate-800">18.5 L/m</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
