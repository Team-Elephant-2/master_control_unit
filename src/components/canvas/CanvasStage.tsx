'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Circle } from 'react-konva';
import { useAppStore } from '@/store/useAppStore';
import RoomShape from './RoomShape';
import PipeShape from './PipeShape';
import DrawingPipe from './DrawingPipe';
import type { KonvaEventObject } from 'konva/lib/Node';

// ── Grid dot rendering ──────────────────────────────────────────────

const GRID_SPACING = 20;
const DOT_RADIUS = 0.8;
const DOT_FILL = '#cbd5e1';

function GridDots({ width, height }: { width: number; height: number }) {
  const dots: React.ReactElement[] = [];
  const cols = Math.ceil(width / GRID_SPACING);
  const rows = Math.ceil(height / GRID_SPACING);

  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      dots.push(
        <Circle
          key={`${r}-${c}`}
          x={c * GRID_SPACING}
          y={r * GRID_SPACING}
          radius={DOT_RADIUS}
          fill={DOT_FILL}
          listening={false}
        />,
      );
    }
  }

  return <>{dots}</>;
}

// ── Canvas Stage ────────────────────────────────────────────────────

export default function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Store selectors
  const canvasMode = useAppStore((s) => s.canvasMode);
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const rooms = useAppStore((s) => s.rooms);
  const pipes = useAppStore((s) => s.pipes);
  const drawingPipePoints = useAppStore((s) => s.drawingPipePoints);

  const addRoom = useAppStore((s) => s.addRoom);
  const setSelectedRoom = useAppStore((s) => s.setSelectedRoom);
  const addPipe = useAppStore((s) => s.addPipe);
  const setDrawingPipePoints = useAppStore((s) => s.setDrawingPipePoints);

  // Filter entities for active floor
  const floorRooms = rooms.filter((r) => r.floorId === activeFloorId);
  const floorPipes = pipes.filter((p) => p.floorId === activeFloorId);

  // ── Resize observer ─────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    // Set initial size
    setDimensions({ width: el.offsetWidth, height: el.offsetHeight });

    return () => observer.disconnect();
  }, []);

  // ── Click handler ───────────────────────────────────────────────

  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!activeFloorId) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      switch (canvasMode) {
        case 'add_room':
          addRoom(activeFloorId, pos.x - 60, pos.y - 40);
          break;

        case 'draw_pipe':
          setDrawingPipePoints([...drawingPipePoints, pos.x, pos.y]);
          break;

        case 'select':
          // Only deselect if clicking on the stage background (not a shape)
          if (e.target === stage) {
            setSelectedRoom(null);
          }
          break;
      }
    },
    [canvasMode, activeFloorId, drawingPipePoints, addRoom, setDrawingPipePoints, setSelectedRoom],
  );

  // ── Double-click to finalize pipe ───────────────────────────────

  const handleStageDblClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (canvasMode !== 'draw_pipe' || !activeFloorId) return;

      // Need at least 2 points (4 numbers) to make a pipe
      if (drawingPipePoints.length >= 4) {
        addPipe(activeFloorId, drawingPipePoints);
      } else {
        // Not enough points, just clear
        setDrawingPipePoints([]);
      }

      e.cancelBubble = true;
    },
    [canvasMode, activeFloorId, drawingPipePoints, addPipe, setDrawingPipePoints],
  );

  // ── Cursor style ────────────────────────────────────────────────

  const cursorClass =
    canvasMode === 'add_room'
      ? 'cursor-crosshair'
      : canvasMode === 'draw_pipe'
        ? 'cursor-crosshair'
        : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden bg-slate-50 ${cursorClass}`}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDblClick={handleStageDblClick}
        onDblTap={handleStageDblClick}
      >
        {/* Grid layer (non-interactive) */}
        <Layer listening={false}>
          <GridDots width={dimensions.width} height={dimensions.height} />
        </Layer>

        {/* Content layer */}
        <Layer>
          {/* Rendered pipes */}
          {floorPipes.map((pipe) => (
            <PipeShape key={pipe.id} pipe={pipe} />
          ))}

          {/* In-progress drawing pipe */}
          {drawingPipePoints.length > 0 && (
            <DrawingPipe points={drawingPipePoints} />
          )}

          {/* Rooms */}
          {floorRooms.map((room) => (
            <RoomShape key={room.id} room={room} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
