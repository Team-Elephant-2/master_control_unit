'use client';

import { Layers, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function LeftSidebar() {
  const floors = useAppStore((s) => s.floors);
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const setActiveFloor = useAppStore((s) => s.setActiveFloor);
  const addFloor = useAppStore((s) => s.addFloor);

  const handleAddFloor = () => {
    const nextNum = floors.length + 1;
    addFloor(`Floor ${nextNum}`);
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 flex w-56 flex-col border-r border-slate-200 bg-white">
      {/* Heading */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
        <Layers className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Floors
        </span>
      </div>

      {/* Floor List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {floors.map((floor) => {
            const isActive = floor.id === activeFloorId;
            return (
              <li key={floor.id}>
                <button
                  onClick={() => setActiveFloor(floor.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isActive ? 'bg-sky-500' : 'bg-slate-300'
                    }`}
                  />
                  {floor.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Add Floor Button */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={handleAddFloor}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
        >
          <Plus className="h-4 w-4" />
          Add Floor
        </button>
      </div>
    </aside>
  );
}
