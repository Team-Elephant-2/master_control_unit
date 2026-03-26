import React, { useRef, useEffect } from 'react';
import { Group, Circle, Text, Path } from 'react-konva';
import Konva from 'konva';
import { useAppStore, type Sensor, type SensorType } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getClosestPointOnPipes, findRoomForPoint } from '@/utils/geometry';

interface SensorShapeProps {
  sensor: Sensor;
  opacity?: number;
  onHoverIn?: (x: number, y: number) => void;
  onHoverOut?: () => void;
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

export default function SensorShape({ sensor, opacity = 1, onHoverIn, onHoverOut }: SensorShapeProps) {
  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedId = useAppStore((s) => s.selectedId);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const updateSensorPosition = useAppStore((s) => s.updateSensorPosition);
  
  const activeFloorId = useAppStore((s) => s.activeFloorId);
  const pipes = useAppStore((s) => s.pipes);
  const rooms = useAppStore((s) => s.rooms);

  const isSelected = selectedId === sensor.id;
  const config = TYPE_CONFIG[sensor.type] || TYPE_CONFIG.master_flow;

  // ── Phase 7 Reactions ─────────────────────────────────────────────
  const isLeaking = sensor.type === 'water_drop' && sensor.isWet;
  const isOff = sensor.type === 'pump' && sensor.isOn === false;
  const isBlocked = sensor.type === 'valve' && sensor.isOpen === false;

  let displayColor = config.color;
  if (isOff) displayColor = '#94a3b8'; // Slate 400
  if (isBlocked || isLeaking) displayColor = '#ef4444'; // Red 500

  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!circleRef.current) return;
    
    if (!isLeaking) {
      circleRef.current.scale({ x: 1, y: 1 });
      circleRef.current.getLayer()?.batchDraw();
      return;
    }

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const scale = 1 + Math.abs(Math.sin(frame.time * 0.005)) * 0.15;
      circleRef.current.scale({ x: scale, y: scale });
    }, circleRef.current.getLayer());

    anim.start();
    return () => {
      anim.stop();
      if (circleRef.current) {
         circleRef.current.scale({ x: 1, y: 1 });
         circleRef.current.getLayer()?.batchDraw();
      }
    };
  }, [isLeaking]);

  const isShutoff = (sensor.type === 'pump' && !sensor.isOn) || (sensor.type === 'valve' && !sensor.isOpen);

  const shutoffBadgeRef = useRef<any>(null);

  useEffect(() => {
    let anim: Konva.Animation;
    if (isShutoff && shutoffBadgeRef.current) {
      anim = new Konva.Animation((frame) => {
        if (!frame) return;
        const period = 800;
        const scale = 1 + Math.abs(Math.sin((frame.time * 2 * Math.PI) / period)) * 0.15;
        shutoffBadgeRef.current.radius(6 * scale);
      }, shutoffBadgeRef.current.getLayer());
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [isShutoff]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;
    setSelectedId(sensor.id);
  };

  const dragBoundFunc = (pos: { x: number; y: number }) => {
    const stage = circleRef.current?.getStage();
    if (!stage) return pos;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePos = transform.point(pos);

    const floorPipes = pipes.filter((p) => p.floorId === activeFloorId);
    const closest = getClosestPointOnPipes(stagePos.x, stagePos.y, floorPipes);
    
    if (closest) {
      return stage.getAbsoluteTransform().point({ x: closest.x, y: closest.y });
    }
    return pos;
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    // node.x/y are already in local stage coordinates
    const newX = node.x();
    const newY = node.y();
    
    const floorPipes = pipes.filter((p) => p.floorId === activeFloorId);
    const closest = getClosestPointOnPipes(newX, newY, floorPipes);
    const pipeId = closest ? closest.pipeId : null;

    const floorRooms = rooms.filter((r) => r.floorId === activeFloorId);
    const newRoomId = findRoomForPoint(newX, newY, floorRooms);
    updateSensorPosition(sensor.id, newX, newY, newRoomId, pipeId);
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
      opacity={opacity}
      onMouseEnter={(e) => {
        if (canvasMode === 'select') {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = isSelected ? 'move' : 'pointer';
        }
        
        if (onHoverIn) {
           const stage = e.target.getStage();
           const pos = stage?.getPointerPosition();
           if (pos) {
              onHoverIn(pos.x, pos.y - 10);
           }
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'default';
        if (onHoverOut) onHoverOut();
      }}
      onMouseMove={(e) => {
         if (onHoverIn) {
            const stage = e.target.getStage();
            const pos = stage?.getPointerPosition();
            if (pos) {
               onHoverIn(pos.x, pos.y - 10);
            }
         }
      }}
    >
      {/* Selection / Master Glow Background */}
      {(isSelected || sensor.isMaster) && (
        <Circle
          radius={26}
          fill="transparent"
          stroke={sensor.isMaster ? '#f59e0b' : (isLeaking ? '#ef4444' : '#38bdf8')}
          strokeWidth={sensor.isMaster ? 4 : (isLeaking ? 5 : 3)}
          opacity={sensor.isMaster ? 0.8 : (isLeaking ? 1 : 0.6)}
          shadowColor={sensor.isMaster ? '#f59e0b' : (isLeaking ? '#ef4444' : undefined)}
          shadowBlur={sensor.isMaster || isLeaking ? 15 : 0}
          shadowOpacity={sensor.isMaster || isLeaking ? 0.6 : 0}
        />
      )}
      {/* Top Label (Type) */}
      <Text
        text={config.label}
        x={-50}
        y={-42}
        fontSize={10}
        fontStyle="bold"
        fontFamily="Inter, sans-serif"
        fill={isLeaking || isBlocked ? '#ef4444' : (isOff ? '#94a3b8' : '#64748b')}
        align="center"
        width={100}
        letterSpacing={0.5}
      />

      <Circle
        ref={circleRef}
        radius={22}
        fill={displayColor}
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
      
      {/* Shutoff Warning Badge overlaid on top right of the sensor node */}
      {isShutoff && (
        <Group x={16} y={-16}>
          <Circle
            ref={shutoffBadgeRef}
            radius={6}
            fill="#ef4444"
            shadowColor="#ef4444"
            shadowBlur={4}
            shadowOpacity={0.8}
          />
          <Text
            text="!"
            fill="#ffffff"
            fontSize={10}
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            offsetX={3}
            offsetY={5}
          />
        </Group>
      )}
      
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

      {/* Warning Text for Shutoff */}
      {isShutoff && (
        <Text
          text="SHUTOFF ACTIVE"
          x={-40}
          y={42}
          fontSize={9}
          fontStyle="bold"
          fontFamily="Inter, sans-serif"
          fill="#ef4444"
          align="center"
          width={80}
          letterSpacing={0.5}
        />
      )}
    </Group>
  );
}


