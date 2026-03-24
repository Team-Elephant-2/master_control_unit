'use client';

import { MousePointer2, Square, PenTool } from 'lucide-react';
import { useAppStore, type CanvasMode } from '@/store/useAppStore';

const MODES: { mode: CanvasMode; label: string; Icon: typeof MousePointer2 }[] = [
  { mode: 'select', label: 'Select', Icon: MousePointer2 },
  { mode: 'add_room', label: 'Add Room', Icon: Square },
  { mode: 'draw_pipe', label: 'Draw Pipe', Icon: PenTool },
];

export default function BuilderToolbar() {
  const canvasMode = useAppStore((s) => s.canvasMode);
  const setCanvasMode = useAppStore((s) => s.setCanvasMode);

  return (
    <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm">
      {MODES.map(({ mode, label, Icon }) => {
        const isActive = canvasMode === mode;
        return (
          <button
            key={mode}
            onClick={() => setCanvasMode(mode)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-sky-50 text-sky-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
