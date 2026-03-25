'use client';

import { Layers, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function LeftSidebar() {
  const floors = useAppStore((s) => s.floors);
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const setActiveFloor = useAppStore((s) => s.setActiveFloor);
  const addFloor = useAppStore((s) => s.addFloor);
  const clearFloor = useAppStore((s) => s.clearFloor);

  const handleAddFloor = () => {
    const nextNum = floors.length + 1;
    addFloor(`Floor ${nextNum}`);
  };

  const handleClearFloor = () => {
    if (!activeFloorId) return;
    if (window.confirm("Are you sure you want to permanently reset this entire floor layout? This cannot be undone.")) {
      clearFloor(activeFloorId);
    }
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 flex w-56 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Heading */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <Layers className="h-5 w-5 text-slate-400" />
        <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Floors
        </span>
      </div>

      {/* Floor List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {floors.map((floor) => {
            const isActive = floor.id === activeFloorId;
            return (
              <li key={floor.id}>
                <button
                  onClick={() => setActiveFloor(floor.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100'
                      : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? 'bg-sky-500 shadow-sm shadow-sky-200' : 'bg-slate-300'
                    }`}
                  />
                  {floor.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Actions */}
      <div className="border-t border-slate-100 p-3 space-y-2">
        <button
          onClick={handleAddFloor}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          <Plus className="h-4 w-4" />
          Add Floor
        </button>

        {/* Clear Floor Button */}
        <button
          onClick={handleClearFloor}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:border-red-300"
        >
          <Trash2 className="h-4 w-4" />
          Reset Layout
        </button>
      </div>
    </aside>
  );
}
