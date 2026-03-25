'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Circle, Group, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useAppStore, type Sensor, type SensorType } from '@/store/useAppStore';
import RoomShape from './RoomShape';
import PipeShape from './PipeShape';
import DrawingPipe from './DrawingPipe';
import SensorShape from './SensorShape';

// Phase 10 Custom Hook/Component to load base64 Data URLs into Konva Image nodes
function BlueprintImage({ url }: { url: string }) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  React.useEffect(() => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);

  if (!image) return null;
  return <KonvaImage image={image} x={0} y={0} opacity={0.5} listening={false} />;
}

import type { KonvaEventObject } from 'konva/lib/Node';
import { getClosestPointOnPipes, findRoomForPoint } from '@/utils/geometry';
import { Cpu, Maximize, Activity, Thermometer, Droplets, Zap, DoorClosed, Upload } from 'lucide-react';

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
  const stageRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Tooltip state
  const [hoveredSensor, setHoveredSensor] = useState<{ sensor: Sensor; x: number; y: number } | null>(null);

  // Store selectors
  const canvasMode = useAppStore((s) => s.canvasMode);
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const rooms = useAppStore((s) => s.rooms);
  const pipes = useAppStore((s) => s.pipes);
  const sensors = useAppStore((s) => s.sensors);
  const drawingPipePoints = useAppStore((s) => s.drawingPipePoints);
  const selectedId = useAppStore((s) => s.selectedId);
  const focusedRoomId = useAppStore((s) => s.focusedRoomId);

  const addRoom = useAppStore((s) => s.addRoom);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const addPipe = useAppStore((s) => s.addPipe);
  const setDrawingPipePoints = useAppStore((s) => s.setDrawingPipePoints);
  const deleteEntity = useAppStore((s) => s.deleteEntity);
  const setFocusedRoomId = useAppStore((s) => s.setFocusedRoomId);

  // Filter entities for active floor
  const floors = useAppStore((s) => s.floors);
  const activeFloor = floors.find((f) => f.id === activeFloorId);
  
  const floorRooms = rooms.filter((r) => r.floorId === activeFloorId);
  const floorPipes = pipes.filter((p) => p.floorId === activeFloorId);
  const floorSensors = sensors.filter((s) => s.floorId === activeFloorId);

  // Phase 9: Flow State logic
  const isFlowing = React.useMemo(() => {
    const hasPump = floorSensors.some(s => s.type === 'pump');
    const pumpIsOn = hasPump 
      ? floorSensors.some(s => s.type === 'pump' && s.isOn)
      : true; // Default flow is true if no pump is configured

    const allValvesOpen = floorSensors.filter(s => s.type === 'valve').every(s => s.isOpen);
    const hasLeak = floorSensors.some(s => (s.type === 'water_drop' || s.type === 'humidity') && s.isWet);

    return pumpIsOn && allValvesOpen && !hasLeak;
  }, [floorSensors]);

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
            type: selectedType as SensorType,
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
            
            // If we click background, reset focus if nothing is selected
            if (focusedRoomId) {
              handleResetView();
            }
          }
          break;
      }
    },
    [canvasMode, activeFloorId, drawingPipePoints, floorPipes, floorRooms, addRoom, setDrawingPipePoints, setSelectedId, focusedRoomId],
  );

  // ── Animated Room Focus ─────────────────────────────────────────

  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    if (!focusedRoomId) {
      // Animate back to default
      new Konva.Tween({
        node: stage,
        duration: 0.4,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        easing: Konva.Easings.EaseInOut,
      }).play();
      return;
    }

    const room = floorRooms.find(r => r.id === focusedRoomId);
    if (!room) return;

    // Calculate bounding box of the room
    const pts = room.polygonPoints;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      minX = Math.min(minX, pts[i]);
      maxX = Math.max(maxX, pts[i]);
      minY = Math.min(minY, pts[i+1]);
      maxY = Math.max(maxY, pts[i+1]);
    }

    const roomW = maxX - minX;
    const roomH = maxY - minY;
    
    // Target scale (padding 100px)
    const padding = 150;
    const scale = Math.min(
      dimensions.width / (roomW + padding),
      dimensions.height / (roomH + padding)
    );
    // Limit max zoom
    const finalScale = Math.min(scale, 2.5);

    const centerX = minX + roomW / 2;
    const centerY = minY + roomH / 2;

    const targetX = dimensions.width / 2 - centerX * finalScale;
    const targetY = dimensions.height / 2 - centerY * finalScale;

    new Konva.Tween({
      node: stage,
      duration: 0.5,
      scaleX: finalScale,
      scaleY: finalScale,
      x: targetX,
      y: targetY,
      easing: Konva.Easings.EaseInOut,
    }).play();

  }, [focusedRoomId, dimensions, floorRooms]);

  const handleResetView = () => {
    setSelectedId(null);
    setFocusedRoomId(null);
  };

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

  const getLiveHoverReading = (sensor: Sensor) => {
    switch(sensor.type) {
      case 'master_flow': return `Flow: ${sensor.value || 0} L/m`;
      case 'humidity': return `Humidity: ${sensor.value || 42}%`;
      case 'water_drop': return `Status: ${sensor.isWet ? 'LEAK DETECTED' : 'DRY'}`;
      case 'pump': return `Pump: ${sensor.isOn ? 'ON' : 'OFF'}`;
      case 'valve': return `Gate: ${sensor.isOpen ? 'OPEN' : 'BLOCKED'}`;
      default: return 'Online';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden bg-slate-50 ${cursorClass}`}
    >
      {/* Phase 10 Upload Blueprint empty floor state */}
      {floorRooms.length === 0 && floorPipes.length === 0 && floorSensors.length === 0 && activeFloor && !activeFloor.blueprintUrl && (
         <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <label className="pointer-events-auto cursor-pointer flex items-center gap-3 bg-white px-8 py-5 rounded-2xl shadow-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
               <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && activeFloorId) {
                     const reader = new FileReader();
                     reader.onload = (ev) => {
                        const baseUrl = ev.target?.result as string;
                        useAppStore.getState().setFloorBlueprint(activeFloorId, baseUrl);
                     };
                     reader.readAsDataURL(file);
                  }
               }} />
               <Upload size={24} className="text-blue-500" />
               <span className="font-semibold text-lg">Upload Floor Plan</span>
            </label>
         </div>
      )}

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        onTap={handleStageClick as any}
        onDblClick={handleStageDblClick}
        onDblTap={handleStageDblClick as any}
      >
        {/* Phase 10 Blueprint Background Layer */}
        <Layer>
          {activeFloor && activeFloor.blueprintUrl && (
            <BlueprintImage url={activeFloor.blueprintUrl} />
          )}
        </Layer>

        {/* Grid layer (non-interactive) */}
        <Layer listening={false}>
          {/* Dim grid slightly in cinema mode */}
          <Group opacity={focusedRoomId ? 0.5 : 1}>
            <GridDots width={dimensions.width} height={dimensions.height} />
          </Group>
        </Layer>

        {/* Content layer */}
        <Layer>
          {/* Rooms (Bottom layer) */}
          {floorRooms.map((room) => (
            <RoomShape 
               key={room.id} 
               room={room} 
               opacity={focusedRoomId ? (focusedRoomId === room.id ? 1 : 0.1) : 1} 
            />
          ))}

          {/* Rendered pipes (Middle layer) */}
          {floorPipes.map((pipe) => (
            <PipeShape key={pipe.id} pipe={pipe} isFlowing={isFlowing} />
          ))}

          {/* In-progress drawing pipe (Top layer) */}
          {drawingPipePoints.length > 0 && (
            <DrawingPipe points={drawingPipePoints} />
          )}

          {/* Sensors (Highest layer) */}
          {floorSensors.map((sensor) => (
            <SensorShape 
               key={sensor.id} 
               sensor={sensor} 
               opacity={focusedRoomId ? (focusedRoomId === sensor.roomId ? 1 : 0.2) : 1}
               onHoverIn={(x: number, y: number) => setHoveredSensor({ sensor, x, y })}
               onHoverOut={() => setHoveredSensor(null)}
            />
          ))}
        </Layer>
      </Stage>

      {/* HTML Overlays */}
      {/* 1. Reset View Button (Cinema Mode Active) */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-300 ${focusedRoomId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button
          onClick={handleResetView}
          className="flex items-center gap-2 rounded-full bg-slate-900/90 px-5 py-2.5 text-sm font-semibold text-white shadow-xl backdrop-blur-sm hover:bg-slate-800 transition-all border border-slate-700/50"
        >
          <Maximize className="h-4 w-4" />
          Reset Zoom & Focus
        </button>
      </div>

      {/* 2. Sensor Hover Tooltip */}
      {hoveredSensor && (
        <div 
          className="pointer-events-none absolute z-50 flex flex-col gap-1 rounded-lg bg-slate-900/95 px-3 py-2.5 text-white shadow-xl backdrop-blur-sm border border-slate-700"
          style={{
            left: hoveredSensor.x,
            top: hoveredSensor.y,
            transform: 'translate(-50%, -120%)' // Center above cursor
          }}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-0.5">
             <Cpu className="h-3.5 w-3.5 text-indigo-400" /> Node {hoveredSensor.sensor.hardwareId}
          </div>
          <div className="text-sm font-bold tracking-wide">
             {getLiveHoverReading(hoveredSensor.sensor)}
          </div>
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-700 bg-slate-900/95" />
        </div>
      )}
    </div>
  );
}
