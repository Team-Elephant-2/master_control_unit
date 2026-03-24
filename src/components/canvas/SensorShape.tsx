import React from 'react';
import { Group, Circle, Text, Path } from 'react-konva';
import { useAppStore, type Sensor, type SensorType } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getClosestPointOnPipes, findRoomForPoint } from '@/utils/geometry';

interface SensorShapeProps {
  sensor: Sensor;
}

const TYPE_CONFIG: Record<SensorType, { 
  color: string; 
  label: string; 
  path: string;
  scale: number;
  offset: { x: number; y: number };
}> = {
  master_flow: { 
    color: '#0ea5e9', 
    label: 'WATERFLOW', 
    path: 'M2 6c.6.5 1.2 1 2.5 1s2.5-1 2.5-1 .5-1 2.5-1 2.5 1 2.5 1 .5 1 2.5 1 2.5-1 2.5-1 M2 12c.6.5 1.2 1 2.5 1s2.5-1 2.5-1 .5-1 2.5-1 2.5 1 2.5 1 .5 1 2.5 1 2.5-1 2.5-1 M2 18c.6.5 1.2 1 2.5 1s2.5-1 2.5-1 .5-1 2.5-1 2.5 1 2.5 1 .5 1 2.5 1 2.5-1 2.5-1',
    scale: 0.9,
    offset: { x: 12, y: 12 }
  },
  humidity: { 
    color: '#8b5cf6', 
    label: 'HUMIDITY', 
    path: 'M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9 M16 14v4 M12 14v4 M8 14v4',
    scale: 0.8,
    offset: { x: 12, y: 12 }
  },
  water_drop: { 
    color: '#ef4444', 
    label: 'WATER DROP', 
    path: 'M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4-6-4-6s-4 2.7-4 6c0 2.2 1.8 4 4 4z M17 15.8c1.9 0 3.5-1.5 3.5-3.5 0-2.8-3.5-5.2-3.5-5.2s-3.5 2.4-3.5 5.2c0 2 1.6 3.5 3.5 3.5z',
    scale: 1.0,
    offset: { x: 12, y: 12 }
  },
  pump: { 
    color: '#f59e0b', 
    label: 'PUMP', 
    path: 'M13 2 L3 14 h9 l-1 8 10-12 h-9 l1-8z',
    scale: 1.1,
    offset: { x: 12, y: 12 }
  },
  valve: { 
    color: '#10b981', 
    label: 'VALVE', 
    path: 'M18 20V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16 M6 20h12 M9 10h.01',
    scale: 1.1,
    offset: { x: 12, y: 12 }
  },
};

export default function SensorShape({ sensor }: SensorShapeProps) {
  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedId = useAppStore((s) => s.selectedId);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const updateSensorPosition = useAppStore((s) => s.updateSensorPosition);
  
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const pipes = useAppStore((s) => s.pipes);
  const rooms = useAppStore((s) => s.rooms);

  const isSelected = selectedId === sensor.id;
  const config = TYPE_CONFIG[sensor.type] || TYPE_CONFIG.master_flow;

  // ── Handlers ──────────────────────────────────────────────────────

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;
    setSelectedId(sensor.id);
  };

  const dragBoundFunc = (pos: { x: number; y: number }) => {
    const floorPipes = pipes.filter((p) => p.floorId === activeFloorId);
    const closest = getClosestPointOnPipes(pos.x, pos.y, floorPipes);
    if (closest) return { x: closest.x, y: closest.y };
    return pos;
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    const floorRooms = rooms.filter((r) => r.floorId === activeFloorId);
    const newRoomId = findRoomForPoint(newX, newY, floorRooms);
    updateSensorPosition(sensor.id, newX, newY, newRoomId);
  };

  return (
    <Group
      x={sensor.x}
      y={sensor.y}
      draggable={canvasMode === 'select'}
      dragBoundFunc={dragBoundFunc}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick as any}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container && canvasMode === 'select') {
          container.style.cursor = isSelected ? 'move' : 'pointer';
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'default';
      }}
    >
      {/* Top Label (Type) */}
      <Text
        text={config.label}
        x={-50}
        y={-42}
        fontSize={10}
        fontStyle="bold"
        fontFamily="Inter, sans-serif"
        fill="#64748b"
        align="center"
        width={100}
        letterSpacing={0.5}
      />

      <Circle
        radius={22}
        fill={config.color}
        stroke={isSelected ? '#1e293b' : '#ffffff'}
        strokeWidth={isSelected ? 3 : 2}
        shadowColor="rgba(0,0,0,0.1)"
        shadowBlur={6}
        shadowOffset={{ x: 0, y: 3 }}
        shadowOpacity={0.6}
      />

      {/* Icon Path (Line Art to match Lucide) */}
      <Path
        data={config.path}
        stroke="#ffffff"
        strokeWidth={1.5}
        lineCap="round"
        lineJoin="round"
        scaleX={config.scale}
        scaleY={config.scale}
        offsetX={config.offset.x}
        offsetY={config.offset.y}
        listening={false}
      />
      
      {/* Bottom Label (ID) */}
      <Text
        text={`ID: ${sensor.hardwareId}`}
        x={-40}
        y={28}
        fontSize={11}
        fontFamily="monospace"
        fill="#94a3b8"
        align="center"
        width={80}
      />
    </Group>
  );
}


