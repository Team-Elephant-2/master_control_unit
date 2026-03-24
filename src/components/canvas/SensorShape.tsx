import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import { useAppStore, type Sensor, type SensorType } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getClosestPointOnPipes, findRoomForPoint } from '@/utils/geometry';

interface SensorShapeProps {
  sensor: Sensor;
}

const TYPE_CONFIG: Map<SensorType, { color: string; letter: string }> = new Map([
  ['master_flow', { color: '#0ea5e9', letter: 'W' }],
  ['humidity', { color: '#8b5cf6', letter: 'H' }],
  ['water_drop', { color: '#ef4444', letter: 'D' }],
  ['pump', { color: '#f59e0b', letter: 'P' }],
  ['valve', { color: '#10b981', letter: 'V' }],
]);

export default function SensorShape({ sensor }: SensorShapeProps) {
  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedId = useAppStore((s) => s.selectedId);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const updateSensorPosition = useAppStore((s) => s.updateSensorPosition);
  
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const pipes = useAppStore((s) => s.pipes);
  const rooms = useAppStore((s) => s.rooms);

  const isSelected = selectedId === sensor.id;
  const config = TYPE_CONFIG.get(sensor.type) || { color: '#94a3b8', letter: '?' };

  // ── Handlers ──────────────────────────────────────────────────────

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;
    setSelectedId(sensor.id);
  };

  const dragBoundFunc = (pos: { x: number; y: number }) => {
    // Only constrain to pipes on the active floor
    const floorPipes = pipes.filter((p) => p.floorId === activeFloorId);
    
    // Find closest point on pipes
    const closest = getClosestPointOnPipes(pos.x, pos.y, floorPipes);
    if (closest) {
      return { x: closest.x, y: closest.y };
    }
    // Fallback if no pipes
    return pos;
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    
    // Coordinates are absolute relative to stage inside Group due to x/y
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
      <Circle
        radius={14}
        fill={config.color}
        stroke={isSelected ? '#1e293b' : '#ffffff'}
        strokeWidth={isSelected ? 2 : 1.5}
        shadowColor="rgba(0,0,0,0.1)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.5}
      />
      <Text
        text={config.letter}
        x={-7}
        y={-6}
        fontSize={14}
        fontStyle="bold"
        fontFamily="sans-serif"
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
        width={14}
        height={14}
      />
      
      {/* Label for ID */}
      <Text
        text={`ID: ${sensor.hardwareId}`}
        x={-20}
        y={18}
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fill="#475569"
        align="center"
        width={40}
      />
    </Group>
  );
}
