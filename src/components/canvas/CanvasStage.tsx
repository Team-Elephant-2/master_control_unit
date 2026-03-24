import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Circle } from 'react-konva';
import { useAppStore } from '@/store/useAppStore';
import RoomShape from './RoomShape';
import PipeShape from './PipeShape';
import DrawingPipe from './DrawingPipe';
import SensorShape from './SensorShape';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getClosestPointOnPipes, findRoomForPoint } from '@/utils/geometry';

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
  const sensors = useAppStore((s) => s.sensors);
  const drawingPipePoints = useAppStore((s) => s.drawingPipePoints);
  const selectedId = useAppStore((s) => s.selectedId);

  const addRoom = useAppStore((s) => s.addRoom);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const addPipe = useAppStore((s) => s.addPipe);
  const setDrawingPipePoints = useAppStore((s) => s.setDrawingPipePoints);
  const deleteEntity = useAppStore((s) => s.deleteEntity);

  // Filter entities for active floor
  const floorRooms = rooms.filter((r) => r.floorId === activeFloorId);
  const floorPipes = pipes.filter((p) => p.floorId === activeFloorId);
  const floorSensors = sensors.filter((s) => s.floorId === activeFloorId);

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

  // ── Keyboard Deletion ───────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        canvasMode === 'select' &&
        selectedId
      ) {
        deleteEntity(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasMode, selectedId, deleteEntity]);

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
          
        case 'add_sensor': {
          const selectedType = useAppStore.getState().selectedSensorType;
          const closest = getClosestPointOnPipes(pos.x, pos.y, floorPipes);
          
          if (!closest || closest.dist > 30) {
            console.warn('Place sensor on a pipe.');
            return;
          }
          
          // Use a default hardware ID since window.prompt is blocked in some environments (like VSCode webviews)
          // The user can edit this in the RightSidebar.
          const defaultHardwareId = Math.floor(Math.random() * 1000) + 1;
          const roomId = findRoomForPoint(closest.x, closest.y, floorRooms);

          useAppStore.getState().addSensor({
            hardwareId: defaultHardwareId,
            type: selectedType,
            floorId: activeFloorId,
            roomId,
            x: closest.x,
            y: closest.y
          });
          break;
        }

        case 'select':
          // Only deselect if clicking on the stage background (not a shape)
          if (e.target === stage) {
            setSelectedId(null);
          }
          break;
      }
    },
    [canvasMode, activeFloorId, drawingPipePoints, floorPipes, floorRooms, addRoom, setDrawingPipePoints, setSelectedId],
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
    canvasMode === 'add_room' || canvasMode === 'draw_pipe' || canvasMode === 'add_sensor'
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
        onTap={handleStageClick as any}
        onDblClick={handleStageDblClick}
        onDblTap={handleStageDblClick as any}
      >
        {/* Grid layer (non-interactive) */}
        <Layer listening={false}>
          <GridDots width={dimensions.width} height={dimensions.height} />
        </Layer>

        {/* Content layer */}
        <Layer>
          {/* Rooms (Bottom layer) */}
          {floorRooms.map((room) => (
            <RoomShape key={room.id} room={room} />
          ))}

          {/* Rendered pipes (Middle layer) */}
          {floorPipes.map((pipe) => (
            <PipeShape key={pipe.id} pipe={pipe} />
          ))}

          {/* In-progress drawing pipe (Top layer) */}
          {drawingPipePoints.length > 0 && (
            <DrawingPipe points={drawingPipePoints} />
          )}

          {/* Sensors (Highest layer) */}
          {floorSensors.map((sensor) => (
            <SensorShape key={sensor.id} sensor={sensor} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
