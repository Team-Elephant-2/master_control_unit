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
  Info 
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
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
  const [isHoveringBuilding, setIsHoveringBuilding] = useState(false);

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

  // 1. Stable Building Configuration
  const stackSpacing = isHoveringBuilding ? 120 : 70;
  const buildingHeight = (floors.length - 1) * stackSpacing;

  return (
    <div className="h-full w-full bg-[#f8fafc] p-8 overflow-y-auto overflow-x-hidden relative">
      {/* 1. High-Contrast ROI Metric Grid (Strictly 2D) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-50">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-bold">Total Hardware Deployment</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 tracking-tighter italic">€{investment.toLocaleString()}</span>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <Info className="h-3.5 w-3.5" />
            Infrastructure coverage active
          </p>
        </div>

        <div className={`rounded-2xl p-6 border shadow-sm transition-all duration-500 ${hasGlobalLeak ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 font-bold ${hasGlobalLeak ? 'text-orange-600' : 'text-slate-400'}`}>Potential Loss Avoided</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tighter italic ${hasGlobalLeak ? 'text-orange-600 animate-pulse' : 'text-slate-800'}`}>
              {hasGlobalLeak ? `€${lossAvoided.toFixed(2)}` : '€0.00'}
            </span>
          </div>
          <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold ${hasGlobalLeak ? 'text-orange-600' : 'text-slate-400'}`}>
             <TrendingDown className="h-4 w-4" />
             {hasGlobalLeak ? 'Automated Shutoff Active' : 'Real-time mitigation sensor'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-bold">Annual Projected ROI</p>
           <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 tracking-tighter italic">145%</span>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600">
             <ShieldCheck className="h-3.5 w-3.5" />
             8-month payback period
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start h-[700px]">
        {/* 2. Prism Container: 3D Isometric Building Model */}
        <div 
          className="relative h-full flex items-center justify-center p-20"
          style={{ perspective: '1200px', overflow: 'visible' }}
          onMouseEnter={() => setIsHoveringBuilding(true)}
          onMouseLeave={() => setIsHoveringBuilding(false)}
        >
          {/* Header */}
          <div className="absolute top-0 left-0">
             <div className="flex items-center gap-2 mb-1.5 opacity-50">
                <div className={`h-2 w-2 rounded-full ${hasGlobalLeak ? 'bg-red-500 animate-ping' : 'bg-blue-600'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Architectural Simulation</span>
             </div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">Building Structure</h2>
          </div>

          {/* Stable 3D Stack Container (The Prism Foundation) */}
          <div 
            className="relative transition-all duration-1000 ease-in-out"
            style={{ 
              transformStyle: 'preserve-3d', 
              transform: 'rotateX(60deg) rotateZ(-30deg)',
              width: 320,
              height: 200
            }}
          >
            {/* 3. The Stable Building Envelope: Prism Shell */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ transformStyle: 'preserve-3d' }}
            >
               {/* 4. Glass Faces (Full Prism: 4 Walls) */}
               {/* Wall 1: Front-Right Facade (Along Y=200) */}
               <div 
                className="absolute transition-all duration-1000"
                style={{
                  width: 320,
                  height: buildingHeight,
                  top: 200,
                  left: 0,
                  transform: 'rotateX(90deg)',
                  transformOrigin: 'top',
                  background: 'linear-gradient(to bottom, rgba(226, 232, 240, 0.35), rgba(59, 130, 246, 0.5))',
                  borderLeft: '2px solid rgba(96, 165, 250, 0.8)',
                  borderRight: '2px solid rgba(96, 165, 250, 0.8)',
                  backdropFilter: 'blur(3px)'
                }}
               />
               
               {/* Wall 2: Front-Left Facade (Along X=320) */}
               <div 
                className="absolute transition-all duration-1000"
                style={{
                  width: buildingHeight,
                  height: 200,
                  top: 0,
                  left: 320,
                  transform: 'rotateY(-90deg)',
                  transformOrigin: 'left',
                  background: 'linear-gradient(to bottom, rgba(226, 232, 240, 0.35), rgba(59, 130, 246, 0.5))',
                  borderLeft: '2px solid rgba(96, 165, 250, 0.8)',
                  borderBottom: '2px solid rgba(96, 165, 250, 0.8)',
                  backdropFilter: 'blur(3px)'
                }}
               />

               {/* Wall 3: Back-Left Facade (Along Y=0) */}
               <div 
                className="absolute transition-all duration-1000"
                style={{
                  width: 320,
                  height: buildingHeight,
                  top: 0,
                  left: 0,
                  transform: 'rotateX(90deg)',
                  transformOrigin: 'top',
                  background: 'linear-gradient(to bottom, rgba(226, 232, 240, 0.2), rgba(59, 130, 246, 0.25))',
                  borderLeft: '1.5px solid rgba(96, 165, 250, 0.6)',
                  borderRight: '1.5px solid rgba(96, 165, 250, 0.6)'
                }}
               />

               {/* Wall 4: Back-Right Facade (Along X=0) */}
               <div 
                className="absolute transition-all duration-1000"
                style={{
                  width: buildingHeight,
                  height: 200,
                  top: 0,
                  left: 0,
                  transform: 'rotateY(-90deg)',
                  transformOrigin: 'left',
                  background: 'linear-gradient(to bottom, rgba(226, 232, 240, 0.2), rgba(59, 130, 246, 0.25))',
                  borderLeft: '1.5px solid rgba(96, 165, 250, 0.6)',
                  borderBottom: '1.5px solid rgba(96, 165, 250, 0.6)'
                }}
               />

               {/* 5. The Corner "Pillar" (Crucial Structural Anchor) */}
               <div 
                className="absolute transition-all duration-1000 bg-blue-500/80 w-[3px]"
                style={{
                   height: buildingHeight,
                   left: 320,
                   top: 200,
                   transform: 'rotateX(90deg)',
                   transformOrigin: 'top'
                }}
               />

               {/* 6. Glass Top Cap (Prism Roof) */}
               <div 
                className="absolute inset-0 transition-all duration-1000"
                style={{
                   transform: `translateZ(${buildingHeight}px)`,
                   border: '2px solid rgba(96, 165, 250, 0.8)',
                   background: 'rgba(255, 255, 255, 0.3)',
                   backdropFilter: 'blur(3px)'
                }}
               />
            </div>

            {/* Stable Floor Plates (Internal Data) */}
            {floors.map((floor, index) => {
              const floorSensors = sensors.filter(s => s.floorId === floor.id);
              const hasLeak = floorSensors.some(s => s.isWet);
              const isHovered = hoveredFloorId === floor.id;
              const zOffset = index * stackSpacing;

              return (
                <div 
                  key={floor.id}
                  onMouseEnter={() => setHoveredFloorId(floor.id)}
                  onMouseLeave={() => setHoveredFloorId(null)}
                  onClick={() => setActiveFloor(floor.id)}
                  className={`
                    absolute inset-0 transition-all duration-1000 cursor-pointer border
                    flex flex-col items-center justify-center
                    ${hasLeak 
                      ? 'bg-red-300/80 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)] !opacity-100' 
                      : 'bg-white/95 border-slate-200 shadow-xl backdrop-blur-sm'}
                    ${isHoveringBuilding && !isHovered && !hasLeak ? 'opacity-30 grayscale scale-95' : 'opacity-100'}
                  `}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${zOffset}px)`,
                  }}
                >
                  <div className="p-4 text-center pointer-events-none">
                    <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase tracking-[0.2em]">Floor {index+1}</span>
                    <h4 className={`text-xl font-black tracking-tighter uppercase ${hasLeak ? 'text-red-700' : 'text-slate-800'}`}>
                      {floor.name}
                    </h4>
                  </div>

                  {/* Leader Labels (outside) */}
                  <div 
                    className={`absolute left-full top-1/2 w-[200px] h-px bg-slate-200 transition-all duration-500 origin-left ${isHoveringBuilding ? 'opacity-100 translate-x-4' : 'opacity-0'}`}
                    style={{ transform: 'rotate(-20deg) rotateX(-60deg) rotateY(30deg)' }}
                  >
                     <div className="absolute right-0 top-0 -translate-y-1/2 flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${hasLeak ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-black text-slate-500 whitespace-nowrap uppercase tracking-widest italic">
                           {floor.name}: {hasLeak ? 'FAIL' : 'OK'}
                        </span>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Telemetry Chart */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden">
          <div className="flex justify-between items-start mb-10 relative z-10">
             <div>
                <div className="flex items-center gap-2 text-indigo-500 mb-1.5">
                  <Activity className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telemetry Feed</span>
                </div>
                <h2 className="text-xl font-black tracking-tighter italic uppercase text-slate-800">Consumption Matrix</h2>
             </div>
             <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Building Integrity</p>
                <p className={`text-sm font-black italic ${hasGlobalLeak ? 'text-red-600 animate-pulse' : 'text-emerald-500'}`}>
                   {hasGlobalLeak ? 'ALERT' : 'OPTIMIZED'}
                </p>
             </div>
          </div>

          <div className="flex-1 min-h-0 relative z-10">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_USAGE_DATA}>
                  <defs>
                    <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={hasGlobalLeak ? '#ef4444' : '#6366f1'} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={hasGlobalLeak ? '#ef4444' : '#6366f1'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Area 
                    type="monotone" 
                    dataKey="usage" 
                    stroke={hasGlobalLeak ? '#ef4444' : '#6366f1'} 
                    strokeWidth={4} 
                    fill="url(#usageGrad)"
                    animationDuration={1500}
                  />
                </AreaChart>
             </ResponsiveContainer>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-bold">Health Status</p>
                <p className="text-sm font-black text-slate-700 italic uppercase">Operational</p>
             </div>
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-center">
                <ShieldCheck className={`h-8 w-8 ${hasGlobalLeak ? 'text-red-400' : 'text-emerald-500 opacity-30'}`} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
