'use client';

import { Layers, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function LeftSidebar() {
  const floors = useAppStore((s) => s.floors);
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const viewMode = useAppStore((s) => s.viewMode);
  const setActiveFloor = useAppStore((s) => s.setActiveFloor);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const addFloor = useAppStore((s) => s.addFloor);
  const removeFloor = useAppStore((s) => s.removeFloor);

  const handleAddFloor = () => {
    const nextNum = floors.length + 1;
    addFloor(`Floor ${nextNum}`);
  };

  const handleDeleteFloor = () => {
    if (!activeFloorId) return;
    if (floors.length <= 1) {
      alert("Cannot delete the only remaining floor. Add another floor first.");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this floor and all its contents? This cannot be undone.")) {
      removeFloor(activeFloorId);
    }
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 flex w-56 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Building Summary Button */}
      <div className="p-3 border-b border-slate-100">
        <button
          onClick={() => setViewMode('building_overview')}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
            viewMode === 'building_overview'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-500 ring-offset-2'
              : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          Building Summary
        </button>
      </div>

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

        {/* Delete Floor Button */}
        <button
          onClick={handleDeleteFloor}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:border-red-300"
        >
          <Trash2 className="h-4 w-4" />
          Delete Floor
        </button>
      </div>
    </aside>
  );
}
