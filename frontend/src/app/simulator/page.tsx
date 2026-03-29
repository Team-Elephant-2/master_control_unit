'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Play, AlertOctagon, RotateCcw, Droplets, Zap, Activity, DoorClosed } from 'lucide-react';

export default function SimulatorPage() {
  const sensors = useAppStore((s) => s.sensors);
  
  const simulateLeak = useAppStore((s) => s.simulateLeak);
  const simulateFlow = useAppStore((s) => s.simulateFlow);
  const togglePump = useAppStore((s) => s.togglePump);
  const toggleValve = useAppStore((s) => s.toggleValve);
  const resetSimulation = useAppStore((s) => s.resetSimulation);

  const waterDrops = sensors.filter(s => s.type === 'water_drop');
  const waterFlows = sensors.filter(s => s.type === 'master_flow');
  const pumps = sensors.filter(s => s.type === 'pump');
  const valves = sensors.filter(s => s.type === 'valve');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Play className="h-5 w-5 text-indigo-500" /> System Simulator
              </h1>
              <p className="text-sm text-slate-500">Trigger simulated events to test dashboard reactions and automated shutoff logic.</p>
            </div>
          </div>
          
          <button 
             onClick={resetSimulation}
             className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-sm transition-all"
          >
            <RotateCcw className="h-4 w-4" /> RESET SYSTEM
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Water Drops */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Droplets className="h-5 w-5 text-red-500" /> Water Drop Sensors
            </h2>
            <div className="space-y-3">
              {waterDrops.length === 0 && <p className="text-sm text-slate-500">No sensors placed.</p>}
              {waterDrops.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">Node {s.hardwareId}</span>
                    <span className={`text-xs font-bold ${s.isWet ? 'text-red-500' : 'text-slate-400'}`}>
                      STATUS: {s.isWet ? 'LEAK DETECTED' : 'DRY'}
                    </span>
                  </div>
                  <button 
                    onClick={() => simulateLeak(s.id)}
                    disabled={s.isWet}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-semibold transition-colors border border-red-200"
                  >
                    <AlertOctagon className="h-4 w-4" /> Trigger Leak
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Waterflows */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-blue-500" /> Waterflow Sensors
            </h2>
            <div className="space-y-3">
              {waterFlows.length === 0 && <p className="text-sm text-slate-500">No sensors placed.</p>}
              {waterFlows.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">Node {s.hardwareId} {s.isMaster && '(Master)'}</span>
                    <span className={`text-xs font-bold text-blue-500`}>
                      FLOW: {s.value || 0} L/m
                    </span>
                  </div>
                  <button 
                    onClick={() => simulateFlow(s.id, 50)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-semibold transition-colors border border-blue-200"
                  >
                    Spike Flow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pumps */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-500" /> Pump Relays
            </h2>
            <div className="space-y-3">
              {pumps.length === 0 && <p className="text-sm text-slate-500">No sensors placed.</p>}
              {pumps.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">Node {s.hardwareId}</span>
                    <span className={`text-xs font-bold ${s.isOn ? 'text-amber-500' : 'text-slate-400'}`}>
                      POWER: {s.isOn ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <button 
                    onClick={() => togglePump(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-md text-sm font-semibold transition-colors border border-amber-200"
                  >
                    Toggle Power
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Valves */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <DoorClosed className="h-5 w-5 text-emerald-500" /> Valve Actuators
            </h2>
            <div className="space-y-3">
              {valves.length === 0 && <p className="text-sm text-slate-500">No sensors placed.</p>}
              {valves.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">Node {s.hardwareId}</span>
                    <span className={`text-xs font-bold ${s.isOpen ? 'text-emerald-500' : 'text-red-500'}`}>
                      VALVE: {s.isOpen ? 'OPEN' : 'BLOCKED'}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleValve(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md text-sm font-semibold transition-colors border border-emerald-200"
                  >
                    Toggle State
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
