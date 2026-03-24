'use client';

import dynamic from 'next/dynamic';
import BuilderToolbar from '@/components/canvas/BuilderToolbar';

// Konva uses window/document — must be client-only
const CanvasStage = dynamic(() => import('@/components/canvas/CanvasStage'), {
  ssr: false,
});

export default function MainContent() {
  return (
    <main className="fixed left-56 right-64 top-14 bottom-0">
      <div className="relative h-full w-full">
        <CanvasStage />
        <BuilderToolbar />
      </div>
    </main>
  );
}
