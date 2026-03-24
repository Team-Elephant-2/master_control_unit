'use client';

import { Info } from 'lucide-react';

export default function RightSidebar() {
  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 flex w-64 flex-col border-l border-slate-200 bg-white">
      {/* Heading */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
        <Info className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Details
        </span>
      </div>

      {/* Empty Placeholder */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Info className="h-5 w-5 text-slate-300" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-400">
          Select an element to view details
        </p>
        <p className="mt-1 text-xs text-slate-300">
          Click on a sensor, pipe, or room on the canvas
        </p>
      </div>
    </aside>
  );
}
