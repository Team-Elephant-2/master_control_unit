'use client';

import dynamic from 'next/dynamic';
import BuilderToolbar from '@/components/canvas/BuilderToolbar';
import BuildingOverview from '@/components/BuildingOverview';
import { useAppStore } from '@/store/useAppStore';

// Konva uses window/document — must be client-only
const CanvasStage = dynamic(() => import('@/components/canvas/CanvasStage'), {
  ssr: false,
});

export default function MainContent() {
  const viewMode = useAppStore((s) => s.viewMode);

  return (
    <main className={`fixed left-56 top-14 bottom-0 bg-white transition-all duration-300 ${viewMode === 'floor' ? 'right-64' : 'right-0'}`}>
      {viewMode === 'floor' ? (
        <div className="relative h-full w-full overflow-hidden">
          <CanvasStage />
          <BuilderToolbar />
        </div>
      ) : (
        <div className="h-full w-full overflow-hidden">
          <BuildingOverview />
        </div>
      )}
    </main>
  );
}
