'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  ShieldCheck, 
  Euro, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  TrendingDown,
  Info,
  Clock
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const MOCK_USAGE_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  usage: 10 + Math.random() * 20 + (i > 8 && i < 18 ? Math.random() * 15 : 0),
}));

export default function BuildingOverview() {
  const floors = useAppStore((s) => s.floors);
  const sensors = useAppStore((s) => s.sensors);
  const setActiveFloor = useAppStore((s) => s.setActiveFloor);

  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [lossAvoided, setLossAvoided] = useState(0);
  const [isHoveringStack, setIsHoveringStack] = useState(false);

  const hasGlobalLeak = sensors.some((s) => s.type === 'water_drop' && s.isWet);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (hasGlobalLeak) {
      if (lossAvoided === 0) setLossAvoided(50);
      interval = setInterval(() => setLossAvoided((p) => p + 2), 5000);
    } else {
      if (lossAvoided !== 0) setLossAvoided(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [hasGlobalLeak, lossAvoided === 0]);

  const investment = (sensors.length * 150) + 500;

  return (
    <div className="h-full w-full bg-[#f8fafc] p-8 overflow-y-auto overflow-x-hidden">
      {/* 1. ROI Cards Cleanup: Clean horizontal row at the very top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Investment */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Hardware Deployment</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">€{investment.toLocaleString()}</h3>
          </div>
          <p className="text-[11px] font-bold text-slate-500 mt-4 flex items-center gap-1.5 opacity-60">
            <Info className="h-3 w-3" />
            Infrastructure overhead included
          </p>
        </div>

        {/* Card 2: Loss Avoided */}
        <div className={`rounded-xl p-6 border transition-all duration-500 shadow-sm flex flex-col justify-between ${hasGlobalLeak ? 'bg-orange-100 border-orange-300 ring-4 ring-orange-100/50' : 'bg-red-50/40 border-slate-100'}`}>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Potential Loss Avoided</p>
            <h3 className={`text-3xl font-black tracking-tighter italic ${hasGlobalLeak ? 'text-orange-700' : 'text-slate-300 uppercase'}`}>
              {hasGlobalLeak ? `€${lossAvoided.toFixed(2)}` : 'ACTIVE PROTECTION'}
            </h3>
          </div>
          <p className={`text-[11px] font-bold mt-4 flex items-center gap-1.5 ${hasGlobalLeak ? 'text-orange-800 font-black' : 'text-slate-400'}`}>
            <TrendingDown className="h-3 w-3" />
            {hasGlobalLeak ? 'Increasing by €2 every 5s' : 'Instant mitigation sensor active'}
          </p>
        </div>

        {/* Card 3: ROI Efficiency */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Annual Projected ROI</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic text-emerald-600">145%</h3>
          </div>
          <p className="text-[11px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            8-month payback period
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 2. Building Blueprint (Architectural Model) */}
        <div 
          className="relative h-[700px] bg-white rounded-2xl border border-slate-200 shadow-sm p-10 overflow-visible flex items-center justify-center group"
          onMouseEnter={() => setIsHoveringStack(true)}
          onMouseLeave={() => {
            setIsHoveringStack(false);
            setHoveredFloorId(null);
          }}
        >
          {/* Section Heading */}
          <div className="absolute top-10 left-10">
             <div className="flex items-center gap-2 mb-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Architectural Visualization</span>
             </div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">Building Blueprint</h2>
          </div>

            {/* Isometric Perspective Stack */}
            <div 
              className="relative transition-transform duration-700 flex flex-col items-center justify-center"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: 'rotateX(55deg) rotateZ(-45deg)',
              }}
            >
              
              {/* The "Skeleton" outer shell lines - connecting the corners of all floors */}
              <div className="absolute inset-0 z-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                 {/* 4 Corner vertical lines */}
                 {[
                   { left: '0px', top: '0px' },
                   { left: '288px', top: '0px' },
                   { left: '0px', top: '176px' },
                   { left: '288px', top: '176px' }
                 ].map((pos, i) => {
                   const totalHeight = (floors.length - 1) * (isHoveringStack ? 100 : 60);
                   return (
                     <div 
                      key={i}
                      className="absolute bg-slate-200/60 w-[1px] transition-all duration-700" 
                      style={{ 
                        left: pos.left, 
                        top: pos.top, 
                        height: `${totalHeight}px`,
                        transform: `translateZ(0px) rotateX(-90deg)`,
                        transformOrigin: 'bottom'
                      }} 
                     />
                   );
                 })}
              </div>

              {floors.map((floor, index) => {
                const floorSensors = sensors.filter(s => s.floorId === floor.id);
                const hasLeak = floorSensors.some(s => s.isWet);
                const isHovered = hoveredFloorId === floor.id;
                
                const zOffset = index * (isHoveringStack ? 100 : 60);

                return (
                  <div 
                    key={floor.id}
                    onMouseEnter={() => setHoveredFloorId(floor.id)}
                    onClick={() => setActiveFloor(floor.id)}
                    className={`
                      absolute w-72 h-44 rounded transition-all duration-700 cursor-pointer border
                      flex flex-col items-center justify-center
                      ${hasLeak 
                        ? 'bg-red-50/95 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.25)] animate-pulse' 
                        : 'bg-white/95 border-slate-200 shadow-xl'}
                      ${hoveredFloorId && !isHovered ? 'opacity-40 grayscale-[0.2]' : 'opacity-100'}
                    `}
                    style={{ 
                      // 1. Stable Vertical Stack using translateZ
                      transform: `translateZ(${zOffset}px)`,
                      zIndex: index,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                  {/* 3. Architectural HUD: External Leader Lines */}
                  {/* Diagonal line coming off the side */}
                  <div 
                    className={`absolute left-full top-1/2 w-16 h-px bg-slate-300 transition-opacity duration-300 ${isHoveringStack ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transform: 'rotate(-25deg)', transformOrigin: 'left' }}
                  />
                  {/* External HUD Label */}
                  <div 
                    className={`absolute left-[calc(100%+60px)] top-[calc(50%-15px)] transition-all duration-300 whitespace-nowrap ${isHoveringStack ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400">L-{String(index+1).padStart(2, '0')}:</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${hasLeak ? 'text-red-500' : 'text-emerald-500'}`}>
                        {hasLeak ? 'LEAK DETECTED' : 'OK'}
                      </span>
                    </div>
                    {isHovered && (
                      <div className="flex items-center gap-3 mt-1.5 border-t border-slate-100 pt-1.5 animate-in fade-in slide-in-from-left-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{floorSensors.length} NODES</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">PLAN INSPECT</span>
                      </div>
                    )}
                  </div>

                  {/* Internal Card content */}
                  <div className="text-center p-4">
                    <h4 className={`text-xl font-black tracking-tighter uppercase ${hasLeak ? 'text-red-700' : 'text-slate-800'}`}>
                      {floor.name}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Stats Chart */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm h-[700px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-indigo-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">History Buffer</span>
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Consumption Matrix</h2>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-black ring-1 ${hasGlobalLeak ? 'bg-red-50 text-red-600 ring-red-200 animate-pulse' : 'bg-slate-50 text-slate-500 ring-slate-100'}`}>
               SYSTEM: {hasGlobalLeak ? 'EMERGENCY SHUTOFF' : 'OPTIMIZED'}
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_USAGE_DATA}>
                <defs>
                   <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={hasGlobalLeak ? '#ef4444' : '#6366f1'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={hasGlobalLeak ? '#ef4444' : '#6366f1'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="usage" 
                  stroke={hasGlobalLeak ? '#ef4444' : '#6366f1'} 
                  strokeWidth={4} 
                  fill="url(#colorUsage)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
             <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                   <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Pulse</p>
                  <p className="text-sm font-black text-slate-800">18.2 L/m</p>
                </div>
             </div>
             <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                   <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Growth</p>
                  <p className="text-sm font-black text-slate-800">+2.4% MoM</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
