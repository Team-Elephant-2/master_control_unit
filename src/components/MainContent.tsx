'use client';

import { Grid3x3 } from 'lucide-react';

export default function MainContent() {
  return (
    <main className="ml-56 mr-64 mt-14 flex flex-1 items-center justify-center bg-slate-50 dotted-grid">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
          <Grid3x3 className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">Canvas Area</p>
        <p className="text-xs text-slate-300">
          The interactive floor plan will render here
        </p>
      </div>
    </main>
  );
}
